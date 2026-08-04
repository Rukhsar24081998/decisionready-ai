import { NextResponse } from "next/server";
import { analyzeHiringEvidence, AiProviderError } from "@/lib/ai/provider";
import { ingestUploadedFile } from "@/lib/ingestion/ingest-file";
import {
  DOCUMENT_TYPE_BY_FIELD,
  type DocumentType,
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

function serializeError(error: unknown): Record<string, unknown> {
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

/**
 * POST /api/analyze
 * Multipart form: hiring evidence files + candidate context.
 * Pipeline: ingest → extractors → Evidence Graph → narrative LLM → Decision Engine.
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    logStage("request_received", {
      requestId,
      contentType: request.headers.get("content-type"),
      contentLength: request.headers.get("content-length"),
      groqKeyConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
      groqModel: process.env.GROQ_MODEL?.trim() || "(default fallbacks)",
    });

    logStage("formdata_parse_start", { requestId });
    const form = await request.formData();
    logStage("formdata_parse_ok", { requestId });

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

    const documents = [];

    for (const { field, required } of FILE_FIELDS) {
      const value = form.get(field);
      if (!(value instanceof File) || value.size === 0) {
        if (required) {
          logStage("validation_failed_missing_document", {
            requestId,
            field,
          });
          return NextResponse.json(
            {
              error: `Missing required document: ${field}`,
              code: "VALIDATION",
              stage: "request_validation",
              requestId,
            },
            { status: 400 }
          );
        }
        continue;
      }

      const documentType = DOCUMENT_TYPE_BY_FIELD[
        field as keyof typeof DOCUMENT_TYPE_BY_FIELD
      ] as DocumentType;

      logStage("document_parsing_start", {
        requestId,
        field,
        documentType,
        filename: value.name,
        size: value.size,
        mimeType: value.type,
      });

      const ingested = await ingestUploadedFile(value, documentType);
      documents.push(ingested);

      logStage("document_parsing_ok", {
        requestId,
        field,
        documentType,
        filename: ingested.filename,
        extractedTextLength: ingested.extractedText.length,
      });
    }

    if (documents.length < 4) {
      logStage("validation_failed_min_documents", {
        requestId,
        count: documents.length,
      });
      return NextResponse.json(
        {
          error:
            "Minimum required evidence: Job Description, Resume, Interview Notes, and Scorecards.",
          code: "VALIDATION",
          stage: "request_validation",
          requestId,
        },
        { status: 400 }
      );
    }

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
    });

    logStage("model_invocation_ok", {
      requestId,
      readinessScore: aiResult.decisionReadiness?.score,
      readinessLabel: aiResult.decisionReadiness?.label,
      competencyCount: aiResult.competencyCoverage?.competencies?.length,
    });

    logStage("persist_start", { requestId });
    const analysis = saveAiDecisionIntelligence({
      candidateName: aiResult.candidate.name || candidateName || "Candidate",
      roleTitle: aiResult.candidate.role || roleTitle || "Open Role",
      documents,
      aiResult,
    });
    logStage("persist_ok", { requestId, analysisId: analysis.id });

    return NextResponse.json({
      data: {
        analysisId: analysis.id,
        intelligence: analysis.aiResult,
        documents: documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          documentType: doc.documentType,
          extractedTextLength: doc.extractedText.length,
        })),
      },
      requestId,
    });
  } catch (error) {
    const serialized = serializeError(error);
    console.error("[api/analyze] stage=unhandled_error", {
      requestId,
      ...serialized,
    });

    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate Decision Intelligence";

    const status =
      error instanceof AiProviderError && error.code === "MISSING_API_KEY"
        ? 503
        : error instanceof AiProviderError && error.code === "RATE_LIMIT"
          ? 429
          : error instanceof AiProviderError && error.code === "TIMEOUT"
            ? 504
            : 500;

    return NextResponse.json(
      {
        error: message,
        code: error instanceof AiProviderError ? error.code : "UNKNOWN",
        stage: "unhandled_error",
        requestId,
        details: serialized,
      },
      { status }
    );
  }
}
