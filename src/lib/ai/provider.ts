import OpenAI from "openai";
import {
  type AiIntelligenceLlmPayload,
  type AiIntelligenceResult,
} from "@/ai/output-schema";
import {
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  type AnalysisContextInput,
} from "@/ai/prompts";
import { mergeEvidence } from "@/lib/ai/evidence/merge-evidence";
import type { CandidateEvidenceGraph } from "@/lib/ai/evidence/evidence-graph";
import { extractHiringManagerNotes } from "@/lib/ai/extractors/manager-notes-extractor";
import { extractInterview } from "@/lib/ai/extractors/interview-extractor";
import { extractJobDescription } from "@/lib/ai/extractors/jd-extractor";
import { extractResume } from "@/lib/ai/extractors/resume-extractor";
import { extractScorecard } from "@/lib/ai/extractors/scorecard-extractor";
import { buildLeanPayloadFromEvidenceGraph } from "@/lib/ai/graph-to-intelligence";
import { buildAiIntelligenceResult } from "@/lib/ai/hydrate-ai-result";
import {
  llmNarrativeSummarySchema,
  type LlmNarrativeSummary,
} from "@/lib/ai/llm-summary-schema";
import { normalizeExtractionJsonRoot } from "@/lib/ai/extractors/base-extractor";
import { PROMPT_VERSION } from "@/lib/ai/decision-engine";
import type { IngestedDocument } from "@/lib/ingestion/types";
import type {
  HiringManagerExtraction,
  InterviewExtraction,
  JobDescriptionExtraction,
  ResumeExtraction,
  ScorecardExtraction,
} from "@/lib/ai/schemas/extraction-schema";
import {
  PIPELINE_PROGRESS_LABELS,
  PipelineTimer,
  type PipelineProgressEvent,
  type PipelineProgressStage,
} from "@/lib/ai/pipeline-timing";
import {
  GroqCallError,
  retryGroqCall,
} from "@/lib/ai/groq-reliability";

export interface AnalyzeHiringEvidenceInput {
  context: AnalysisContextInput;
  documents: IngestedDocument[];
  /** Optional request-scoped timer (shared with /api/analyze ingest). */
  timer?: PipelineTimer;
  /** Optional progress callback for streaming UI (NDJSON). */
  onProgress?: (event: Extract<PipelineProgressEvent, { type: "stage" }>) => void;
}

function emitStage(
  input: AnalyzeHiringEvidenceInput,
  id: PipelineProgressStage,
  status: "start" | "done",
  ms?: number
): void {
  input.onProgress?.({
    type: "stage",
    id,
    label: PIPELINE_PROGRESS_LABELS[id],
    status,
    ms,
  });
}

export class AiProviderError extends Error {
  readonly code:
    | "MISSING_API_KEY"
    | "EMPTY_RESPONSE"
    | "INVALID_JSON"
    | "VALIDATION"
    | "RATE_LIMIT"
    | "TIMEOUT"
    | "PROVIDER";

  constructor(
    code: AiProviderError["code"],
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "AiProviderError";
    this.code = code;
  }
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const DEFAULT_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "qwen/qwen3.6-27b",
  "llama-3.1-8b-instant",
] as const;

function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new AiProviderError(
      "MISSING_API_KEY",
      "GROQ_API_KEY is not configured. Add it to .env.local and restart the server to generate Decision Intelligence."
    );
  }
  return apiKey;
}

function getGroqClient(): OpenAI {
  console.info("[ai/provider] stage=ai_client_init", {
    baseURL: GROQ_BASE_URL,
    timeoutMs: 120_000,
    keyConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
  });
  return new OpenAI({
    apiKey: getGroqApiKey(),
    baseURL: GROQ_BASE_URL,
    timeout: 120_000,
  });
}

/** Preferred model first, then ordered fallbacks. */
function getModelCandidates(): string[] {
  const preferred = process.env.GROQ_MODEL?.trim();
  const ordered: string[] = [];

  if (preferred) ordered.push(preferred);
  for (const model of DEFAULT_MODEL_FALLBACKS) {
    if (!ordered.includes(model)) ordered.push(model);
  }

  return ordered;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  if (
    "statusCode" in error &&
    typeof (error as { statusCode?: number }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isModelUnavailableError(error: unknown): boolean {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();

  if (status === 404) return true;

  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("model_not_found") ||
    message.includes("unavailable") ||
    message.includes("deprecated") ||
    message.includes("no longer supported") ||
    message.includes("decommissioned")
  );
}

function mapProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  if (error instanceof GroqCallError) {
    return new AiProviderError(error.code, error.message, { cause: error.cause });
  }

  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (status === 429 || lower.includes("rate limit")) {
    return new AiProviderError(
      "RATE_LIMIT",
      "Groq rate limit reached. Please wait a moment and try generating Decision Intelligence again.",
      { cause: error }
    );
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    status === 408
  ) {
    return new AiProviderError(
      "TIMEOUT",
      "Groq timed out while generating Decision Intelligence. Please try again.",
      { cause: error }
    );
  }

  return new AiProviderError(
    "PROVIDER",
    `Groq failed to generate Decision Intelligence: ${message}`,
    { cause: error }
  );
}

function findDocument(
  documents: IngestedDocument[],
  documentType: IngestedDocument["documentType"]
): IngestedDocument | undefined {
  return documents.find((doc) => doc.documentType === documentType);
}

/**
 * Schema A (from Evidence Graph + narrative) → decision engine → Schema B (UI).
 */
function finalizeResult(
  lean: AiIntelligenceLlmPayload,
  documents: IngestedDocument[],
  elapsedMs: number,
  modelName: string
): AiIntelligenceResult {
  const result = buildAiIntelligenceResult(lean, documents, {
    modelName,
    elapsedMs,
  });

  console.log("Decision Engine complete", {
    readiness: result.decisionReadiness?.label,
    score: result.decisionReadiness?.score,
    confidence: result.confidence,
    evidenceQuality: result.evidenceQuality,
    model: result.metadata?.modelName,
    elapsedMs,
  });

  return result;
}

async function runDocumentExtractors(
  documents: IngestedDocument[],
  input: AnalyzeHiringEvidenceInput
): Promise<{
  resume?: ResumeExtraction;
  jobDescription?: JobDescriptionExtraction;
  interview?: InterviewExtraction;
  scorecard?: ScorecardExtraction;
  hiringManagerNotes?: HiringManagerExtraction;
  documentNames: {
    resume?: string;
    jobDescription?: string;
    interview?: string;
    scorecard?: string;
    hiringManagerNotes?: string;
  };
  experience: string;
}> {
  const resumeDoc = findDocument(documents, "Resume");
  const jdDoc = findDocument(documents, "Job Description");
  const interviewDoc = findDocument(documents, "Interview Notes");
  const scorecardDoc = findDocument(documents, "Scorecards");
  const hmDoc = findDocument(documents, "Hiring Manager Notes");
  const timer = input.timer;

  const timedExtract = async <T>(
    stage: PipelineProgressStage,
    timingLabel: string,
    run: () => Promise<T | undefined>
  ): Promise<T | undefined> => {
    emitStage(input, stage, "start");
    const began = performance.now();
    try {
      if (timer) {
        return await timer.measure(timingLabel, run);
      }
      return await run();
    } finally {
      emitStage(
        input,
        stage,
        "done",
        Math.max(0, Math.round(performance.now() - began))
      );
    }
  };

  // Independent document extractors run concurrently (wall time ≈ slowest).
  emitStage(input, "extract", "start");
  const extractStarted = performance.now();

  const [
    resume,
    jobDescription,
    interview,
    scorecard,
    hiringManagerNotes,
  ] = await Promise.all([
    resumeDoc
      ? timedExtract("extract_resume", "Extract Resume", () =>
          (console.info("[ai/provider] Resume extraction started"),
          extractResume({
            filename: resumeDoc.filename,
            extractedText: resumeDoc.extractedText,
          }))
        )
      : Promise.resolve(undefined),
    jdDoc
      ? timedExtract("extract_jd", "Extract JD", () =>
          (console.info("[ai/provider] JD extraction started"),
          extractJobDescription({
            filename: jdDoc.filename,
            extractedText: jdDoc.extractedText,
          }))
        )
      : Promise.resolve(undefined),
    interviewDoc
      ? timedExtract("extract_interview", "Extract Interview Notes", () =>
          (console.info("[ai/provider] Interview notes extraction started"),
          extractInterview({
            filename: interviewDoc.filename,
            extractedText: interviewDoc.extractedText,
          }))
        )
      : Promise.resolve(undefined),
    scorecardDoc
      ? timedExtract("extract_scorecard", "Extract Scorecard", () =>
          (console.info("[ai/provider] Scorecards extraction started"),
          extractScorecard({
            filename: scorecardDoc.filename,
            extractedText: scorecardDoc.extractedText,
          }))
        )
      : Promise.resolve(undefined),
    hmDoc
      ? timedExtract("extract_hm", "Extract Hiring Manager Notes", () =>
          (console.info("[ai/provider] Hiring Manager Notes extraction started"),
          extractHiringManagerNotes({
            filename: hmDoc.filename,
            extractedText: hmDoc.extractedText,
          }))
        )
      : Promise.resolve(undefined),
  ]);

  emitStage(
    input,
    "extract",
    "done",
    Math.max(0, Math.round(performance.now() - extractStarted))
  );

  if (resume) console.info("[ai/provider] Resume extraction complete");
  if (jobDescription) console.info("[ai/provider] JD extraction complete");
  if (interview) console.info("[ai/provider] Interview notes complete");
  if (scorecard) console.info("[ai/provider] Scorecards complete");
  if (hiringManagerNotes) {
    console.info("[ai/provider] Hiring Manager Notes complete");
  }

  const experience =
    resume && Number.isFinite(resume.candidate.experienceYears)
      ? `${resume.candidate.experienceYears} years`
      : "";

  return {
    resume,
    jobDescription,
    interview,
    scorecard,
    hiringManagerNotes,
    documentNames: {
      resume: resumeDoc?.filename,
      jobDescription: jdDoc?.filename,
      interview: interviewDoc?.filename,
      scorecard: scorecardDoc?.filename,
      hiringManagerNotes: hmDoc?.filename,
    },
    experience,
  };
}

function parseNarrativeSummary(rawText: string): LlmNarrativeSummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new AiProviderError(
      "INVALID_JSON",
      "Groq narrative response was not valid JSON. Please try again.",
      { cause: error }
    );
  }

  const normalized = normalizeExtractionJsonRoot(parsed);
  const validated = llmNarrativeSummarySchema.safeParse(normalized);
  if (!validated.success) {
    throw new AiProviderError(
      "VALIDATION",
      `Narrative summary validation failed: ${validated.error.message}`
    );
  }

  return validated.data;
}

async function generateNarrativeSummary(
  client: OpenAI,
  model: string,
  context: AnalysisContextInput,
  graph: CandidateEvidenceGraph,
  options?: { stricter?: boolean }
): Promise<string> {
  console.log(`Using Groq model: ${model}`);
  console.log("Using JSON object mode (narrative summary).");
  console.log(`Prompt version: ${PROMPT_VERSION}`);

  const reminder = options?.stricter
    ? `
CRITICAL:
- Return ONE JSON object.
- Keys ONLY: executiveSummary, discussionTopics, decisionBrief.
- decisionBrief must contain strengths[].
- Do not invent evidence outside the CandidateEvidenceGraph.
`.trim()
    : "Return a single JSON object with keys: executiveSummary, discussionTopics, decisionBrief.";

  const systemPrompt = `${buildSummarySystemPrompt()}\n\n${reminder}`;
  const userPrompt = buildSummaryUserPrompt(context, graph);

  console.log("Prompt length:");
  console.log(systemPrompt.length + userPrompt.length);

  try {
    console.info("[ai/provider] stage=model_invocation_start", {
      model,
      promptChars: systemPrompt.length + userPrompt.length,
    });
    const completion = await retryGroqCall(
      `narrative:${model}`,
      async () =>
        client.chat.completions.create({
          model,
          temperature: 0.1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_object",
          },
        })
    );

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new AiProviderError(
        "EMPTY_RESPONSE",
        "Groq returned an empty narrative summary. Please try again."
      );
    }

    console.info("[ai/provider] stage=model_invocation_ok", {
      model,
      responseChars: content.length,
    });
    return content;
  } catch (error: unknown) {
    console.error("[ai/provider] stage=model_invocation_failed", {
      model,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error("========== GROQ NARRATIVE ERROR ==========");
    console.error(error);
    throw mapProviderError(error);
  }
}

/**
 * Provider entry point for Decision Intelligence.
 *
 * Pipeline:
 * Documents → Extractors → CandidateEvidenceGraph → Small LLM Summary
 * → Decision Engine → Schema B (Dashboard contract)
 */
export async function analyzeHiringEvidence(
  input: AnalyzeHiringEvidenceInput
): Promise<AiIntelligenceResult> {
  if (input.documents.length === 0) {
    throw new AiProviderError(
      "VALIDATION",
      "At least one ingested hiring evidence document is required."
    );
  }

  const started = Date.now();
  const timer = input.timer ?? new PipelineTimer();
  console.info("[ai/provider] stage=analyze_start", {
    documentCount: input.documents.length,
    models: getModelCandidates(),
  });
  const client = getGroqClient();
  const models = getModelCandidates();

  // Step 1 — extractors (parallel)
  console.info("[ai/provider] stage=extractors_start");
  let extractions;
  try {
    extractions = await runDocumentExtractors(input.documents, {
      ...input,
      timer,
    });
  } catch (error) {
    throw mapProviderError(error);
  }
  console.info("[ai/provider] stage=extractors_ok");

  // Step 2 — evidence graph + competency map (sync, CPU-only)
  console.info("[ai/provider] stage=evidence_graph_start");
  emitStage(input, "evidence_graph", "start");
  const graph = timer.measureSync("Evidence Graph", () =>
    mergeEvidence({
      resume: extractions.resume,
      jobDescription: extractions.jobDescription,
      interview: extractions.interview,
      scorecard: extractions.scorecard,
      hiringManagerNotes: extractions.hiringManagerNotes,
      documentNames: extractions.documentNames,
    })
  );
  emitStage(
    input,
    "evidence_graph",
    "done",
    timer.snapshot().find((e) => e.label === "Evidence Graph")?.ms
  );
  console.info("[ai/provider] stage=evidence_graph_ok", {
    competencies: graph.competencies.length,
    missing: graph.missingCompetencies.length,
  });

  // Prefer recruiter-provided context when graph fields are empty
  if (!graph.candidate.name.trim() && input.context.candidateName.trim()) {
    graph.candidate.name = input.context.candidateName.trim();
  }
  if (!graph.candidate.role.trim() && input.context.roleTitle.trim()) {
    graph.candidate.role = input.context.roleTitle.trim();
  }

  console.log("Evidence Graph built");
  console.log(`Merged competencies: ${graph.competencies.length}`);
  console.log(`Missing competencies: ${graph.missingCompetencies.length}`);

  // Step 3 — small LLM narrative from graph only
  // (Executive summary + brief strengths share one grounded call — required for identical outputs.)
  let responseText: string | undefined;
  let selectedModel: string | undefined;

  emitStage(input, "narrative", "start");
  emitStage(input, "brief", "start");
  timer.start("Decision Brief / Narrative");

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      responseText = await generateNarrativeSummary(
        client,
        model,
        input.context,
        graph
      );
      selectedModel = model;
      break;
    } catch (error) {
      if (isModelUnavailableError(error) && index < models.length - 1) {
        const next = models[index + 1];
        console.warn(
          `[groq] Model "${model}" unavailable. Retrying with "${next}".`
        );
        continue;
      }

      throw mapProviderError(error);
    }
  }

  let summary: LlmNarrativeSummary;

  if (responseText && selectedModel) {
    try {
      console.info("[ai/provider] stage=response_parsing_start", {
        model: selectedModel,
        chars: responseText.length,
      });
      summary = parseNarrativeSummary(responseText);
      console.info("[ai/provider] stage=response_parsing_ok");
    } catch {
      console.warn(
        "[groq] Malformed narrative. Retrying once with a stricter prompt."
      );
      try {
        const retryText = await generateNarrativeSummary(
          client,
          selectedModel,
          input.context,
          graph,
          { stricter: true }
        );
        summary = parseNarrativeSummary(retryText);
      } catch (retryError) {
        throw mapProviderError(retryError);
      }
    }
  } else {
    throw new AiProviderError(
      "PROVIDER",
      "Decision Intelligence could not be generated because the narrative stage returned no response."
    );
  }

  const narrativeMs = timer.end("Decision Brief / Narrative");
  emitStage(input, "narrative", "done", narrativeMs);
  emitStage(input, "brief", "done", narrativeMs);

  console.info("[ai/provider] Decision Intelligence generated");
  console.info("[ai/provider] Decision Brief generated", {
    strengths: summary.decisionBrief.strengths.length,
    discussionTopics: summary.discussionTopics.length,
  });

  // Step 4 — Decision Engine (graph + narrative → Schema B)
  emitStage(input, "decision_engine", "start");
  emitStage(input, "dashboard", "start");
  const lean = timer.measureSync("Decision Engine", () =>
    buildLeanPayloadFromEvidenceGraph({
      graph,
      summary,
      context: input.context,
      documents: input.documents,
      experience: extractions.experience,
    })
  );
  const engineMs =
    timer.snapshot().find((e) => e.label === "Decision Engine")?.ms ?? 0;
  emitStage(input, "decision_engine", "done", engineMs);

  const result = finalizeResult(
    lean,
    input.documents,
    Date.now() - started,
    selectedModel ?? models[0] ?? "unknown"
  );
  emitStage(input, "dashboard", "done", engineMs);

  if (!input.timer) {
    timer.report("analyzeHiringEvidence");
  }

  return result;
}
