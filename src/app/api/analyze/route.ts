import { analyzeHiringEvidence, AiProviderError } from "@/lib/ai/provider";
import {
  PIPELINE_PROGRESS_LABELS,
  PipelineTimer,
  type PipelineProgressEvent,
} from "@/lib/ai/pipeline-timing";
import { ingestUploadedFile } from "@/lib/ingestion/ingest-file";
import { validateUploadFile } from "@/lib/ingestion/upload-constraints";
import {
  DOCUMENT_TYPE_BY_FIELD,
  type DocumentType,
  type IngestedDocument,
} from "@/lib/ingestion/types";
import { saveAiDecisionIntelligence } from "@/lib/mock/store";

export const runtime = "nodejs";
export const maxDuration = 120;

const FILE_FIELDS = [
  { field: "jobDescription", required: true },
  { field: "resume", required: true },
  { field: "interviewNotes", required: true },
  { field: "scorecards", required: true },
  { field: "hiringManagerNotes", required: false },
] as const;

function logStage(
  stage: string,
  details?: Record<string, unknown>
): void {
  console.info("[api/analyze]", { stage, ...details });
}

/** Safe client-facing error payload — never include stacks or internals. */
function publicErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof AiProviderError) {
    return { code: error.code };
  }
  if (error instanceof Error) {
    return { name: error.name };
  }
  return {};
}

function serializeErrorForLogs(error: unknown): Record<string, unknown> {
  if (error instanceof AiProviderError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause:
        error.cause instanceof Error
          ? { name: error.cause.name, message: error.cause.message }
          : error.cause,
    };
  }
  return { message: String(error) };
}

function parseLabelForFile(field: string, filename: string): string {
  const base =
    field === "jobDescription"
      ? "Parse JD"
      : field === "resume"
        ? "Parse Resume"
        : field === "interviewNotes"
          ? "Parse Interview Notes"
          : field === "scorecards"
            ? "Parse Scorecard"
            : field === "hiringManagerNotes"
              ? "Parse Hiring Manager Notes"
              : `Parse ${field}`;
  const ext = filename.split(".").pop()?.toUpperCase() ?? "FILE";
  return `${base} (${ext})`;
}

/**
 * POST /api/analyze
 * Multipart form: hiring evidence files + candidate context.
 * Pipeline: parallel ingest → extractors → Evidence Graph → narrative LLM → Decision Engine.
 *
 * Streams NDJSON progress events, then a final `result` (or `error`) line.
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PipelineProgressEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      const timer = new PipelineTimer();

      try {
        logStage("request_received", {
          requestId,
          contentType: request.headers.get("content-type"),
          contentLength: request.headers.get("content-length"),
          groqKeyConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
          groqModel: process.env.GROQ_MODEL?.trim() || "(default fallbacks)",
        });

        send({
          type: "stage",
          id: "upload",
          label: PIPELINE_PROGRESS_LABELS.upload,
          status: "start",
        });

        logStage("formdata_parse_start", { requestId });
        const form = await timer.measure("File upload / FormData", () =>
          request.formData()
        );
        logStage("formdata_parse_ok", { requestId });

        send({
          type: "stage",
          id: "upload",
          label: PIPELINE_PROGRESS_LABELS.upload,
          status: "done",
          ms: timer.snapshot().find((e) => e.label === "File upload / FormData")
            ?.ms,
        });

        const candidateName = String(form.get("candidateName") ?? "").trim();
        const roleTitle = String(form.get("roleTitle") ?? "").trim();
        const department = String(form.get("department") ?? "").trim();
        const hiringManager = String(form.get("hiringManager") ?? "").trim();
        const hiringStage = String(form.get("hiringStage") ?? "").trim();

        logStage("request_validation", {
          requestId,
          candidateName: Boolean(candidateName),
          roleTitle: Boolean(roleTitle),
          department: Boolean(department),
          hiringManager: Boolean(hiringManager),
          hiringStage: hiringStage || "(empty)",
        });

        type IngestJob = {
          field: (typeof FILE_FIELDS)[number]["field"];
          file: File;
          documentType: DocumentType;
          required: boolean;
        };

        const jobs: IngestJob[] = [];

        for (const { field, required } of FILE_FIELDS) {
          const value = form.get(field);
          if (!(value instanceof File) || value.size === 0) {
            if (required) {
              logStage("validation_failed_missing_document", {
                requestId,
                field,
              });
              send({
                type: "error",
                error: `Missing required document: ${field}`,
                code: "VALIDATION",
                stage: "request_validation",
                requestId,
              });
              controller.close();
              return;
            }
            continue;
          }

          const validation = validateUploadFile({
            filename: value.name,
            size: value.size,
          });
          if (!validation.ok) {
            logStage("validation_failed_upload_constraints", {
              requestId,
              field,
              filename: value.name,
              size: value.size,
            });
            send({
              type: "error",
              error: validation.error,
              code: "VALIDATION",
              stage: "request_validation",
              requestId,
            });
            controller.close();
            return;
          }

          const documentType = DOCUMENT_TYPE_BY_FIELD[
            field as keyof typeof DOCUMENT_TYPE_BY_FIELD
          ] as DocumentType;

          jobs.push({ field, file: value, documentType, required });
        }

        if (jobs.length < 4) {
          logStage("validation_failed_min_documents", {
            requestId,
            count: jobs.length,
          });
          send({
            type: "error",
            error:
              "Minimum required evidence: Job Description, Resume, Interview Notes, and Scorecards.",
            code: "VALIDATION",
            stage: "request_validation",
            requestId,
          });
          controller.close();
          return;
        }

        // Parallel parse — each document is independent; reuse text everywhere after.
        send({
          type: "stage",
          id: "parse",
          label: PIPELINE_PROGRESS_LABELS.parse,
          status: "start",
        });
        const parseStarted = performance.now();

        const documents: IngestedDocument[] = await Promise.all(
          jobs.map(async (job) => {
            const label = parseLabelForFile(job.field, job.file.name);
            logStage("document_parsing_start", {
              requestId,
              field: job.field,
              documentType: job.documentType,
              filename: job.file.name,
              size: job.file.size,
              mimeType: job.file.type,
            });

            const ingested = await timer.measure(label, () =>
              ingestUploadedFile(job.file, job.documentType)
            );

            logStage("document_parsing_ok", {
              requestId,
              field: job.field,
              documentType: job.documentType,
              filename: ingested.filename,
              extractedTextLength: ingested.extractedText.length,
            });

            return ingested;
          })
        );

        const parseMs = Math.max(
          0,
          Math.round(performance.now() - parseStarted)
        );
        send({
          type: "stage",
          id: "parse",
          label: PIPELINE_PROGRESS_LABELS.parse,
          status: "done",
          ms: parseMs,
        });

        logStage("ai_client_init_start", {
          requestId,
          documentCount: documents.length,
        });

        const aiResult = await analyzeHiringEvidence({
          context: {
            candidateName,
            roleTitle,
            department,
            hiringManager,
            hiringStage,
          },
          documents,
          timer,
          onProgress: (event) => send(event),
        });

        logStage("model_invocation_ok", {
          requestId,
          readinessScore: aiResult.decisionReadiness?.score,
          readinessLabel: aiResult.decisionReadiness?.label,
          competencyCount: aiResult.competencyCoverage?.competencies?.length,
        });
        console.info("[api/analyze] Decision Intelligence generated", {
          requestId,
          readinessLabel: aiResult.decisionReadiness?.label,
        });

        send({
          type: "stage",
          id: "persist",
          label: PIPELINE_PROGRESS_LABELS.persist,
          status: "start",
        });
        logStage("persist_start", { requestId });
        const analysis = await timer.measure("Persistence (Blob/local)", () =>
          saveAiDecisionIntelligence({
            candidateName:
              aiResult.candidate.name || candidateName || "Candidate",
            roleTitle: aiResult.candidate.role || roleTitle || "Open Role",
            documents,
            aiResult,
          })
        );
        const persistMs =
          timer.snapshot().find((e) => e.label === "Persistence (Blob/local)")
            ?.ms ?? 0;
        send({
          type: "stage",
          id: "persist",
          label: PIPELINE_PROGRESS_LABELS.persist,
          status: "done",
          ms: persistMs,
        });
        logStage("persist_ok", {
          requestId,
          analysisId: analysis.id,
          hasAiResult: Boolean(analysis.aiResult),
        });
        console.info("[api/analyze] Saved successfully", {
          requestId,
          analysisId: analysis.id,
        });

        timer.report(`request ${requestId}`);

        send({
          type: "result",
          requestId,
          timings: timer.snapshot(),
          totalMs: timer.totalMs(),
          data: {
            analysisId: analysis.id,
            analysis,
            intelligence: analysis.aiResult,
            documents: documents.map((doc) => ({
              id: doc.id,
              filename: doc.filename,
              documentType: doc.documentType,
              extractedTextLength: doc.extractedText.length,
            })),
          },
        });
      } catch (error) {
        const serialized = serializeErrorForLogs(error);
        console.error("[api/analyze] stage=unhandled_error", {
          requestId,
          ...serialized,
        });

        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate Decision Intelligence";

        send({
          type: "error",
          error: message,
          code: error instanceof AiProviderError ? error.code : "UNKNOWN",
          stage: "unhandled_error",
          requestId,
          details: publicErrorDetails(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
