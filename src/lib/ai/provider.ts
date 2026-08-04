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
  createEmptyLlmNarrativeSummary,
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

export interface AnalyzeHiringEvidenceInput {
  context: AnalysisContextInput;
  documents: IngestedDocument[];
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
  "qwen/qwen3.6-27b",
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

  console.log("Decision Engine complete");
  console.log(
    JSON.stringify(
      {
        decisionReadiness: result.decisionReadiness,
        decisionReadinessBreakdown: result.decisionReadinessBreakdown,
        confidence: result.confidence,
        evidenceQuality: result.evidenceQuality,
        coverageBreakdown: result.coverageBreakdown,
        metadata: result.metadata,
      },
      null,
      2
    )
  );

  return result;
}

async function runDocumentExtractors(documents: IngestedDocument[]): Promise<{
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

  const [
    resume,
    jobDescription,
    interview,
    scorecard,
    hiringManagerNotes,
  ] = await Promise.all([
    resumeDoc
      ? extractResume({
          filename: resumeDoc.filename,
          extractedText: resumeDoc.extractedText,
        })
      : Promise.resolve(undefined),
    jdDoc
      ? extractJobDescription({
          filename: jdDoc.filename,
          extractedText: jdDoc.extractedText,
        })
      : Promise.resolve(undefined),
    interviewDoc
      ? extractInterview({
          filename: interviewDoc.filename,
          extractedText: interviewDoc.extractedText,
        })
      : Promise.resolve(undefined),
    scorecardDoc
      ? extractScorecard({
          filename: scorecardDoc.filename,
          extractedText: scorecardDoc.extractedText,
        })
      : Promise.resolve(undefined),
    hmDoc
      ? extractHiringManagerNotes({
          filename: hmDoc.filename,
          extractedText: hmDoc.extractedText,
        })
      : Promise.resolve(undefined),
  ]);

  if (resume) console.log("Resume extracted");
  if (jobDescription) console.log("JD extracted");
  if (interview) console.log("Interview extracted");
  if (scorecard) console.log("Scorecard extracted");
  if (hiringManagerNotes) console.log("Hiring Manager extracted");

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

function fallbackNarrativeSummary(
  graph: CandidateEvidenceGraph,
  context: AnalysisContextInput
): LlmNarrativeSummary {
  const empty = createEmptyLlmNarrativeSummary();
  return {
    ...empty,
    executiveSummary: [
      `Evidence package for ${graph.candidate.name || context.candidateName || "the candidate"}`,
      `applying to ${graph.candidate.role || context.roleTitle || "the open role"}.`,
      `${graph.competencies.length} competencies mapped;`,
      `${graph.missingCompetencies.length} required competencies lack evidence.`,
      "DecisionReady AI does not recommend hire or reject.",
    ].join(" "),
    discussionTopics: graph.missingCompetencies
      .slice(0, 6)
      .map((name) => `Clarify concrete evidence for ${name} before debrief.`),
    decisionBrief: {
      strengths: graph.competencies
        .filter((c) => c.sources[0]?.quote)
        .slice(0, 5)
        .map((c) => ({
          competency: c.name,
          source: c.sources[0].documentName,
          confidence:
            c.confidence === "high"
              ? ("High" as const)
              : c.confidence === "medium"
                ? ("Medium" as const)
                : ("Low" as const),
          quote: c.sources[0].quote,
          pageNumber:
            typeof c.sources[0].pageNumber === "number"
              ? c.sources[0].pageNumber
              : null,
        })),
    },
  };
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
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new AiProviderError(
        "EMPTY_RESPONSE",
        "Groq returned an empty narrative summary. Please try again."
      );
    }

    return content;
  } catch (error: unknown) {
    console.error("========== GROQ NARRATIVE ERROR ==========");
    console.error(error);
    throw error;
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
  const client = getGroqClient();
  const models = getModelCandidates();

  // Step 1 — extractors
  const extractions = await runDocumentExtractors(input.documents);

  // Step 2 — evidence graph
  const graph = mergeEvidence({
    resume: extractions.resume,
    jobDescription: extractions.jobDescription,
    interview: extractions.interview,
    scorecard: extractions.scorecard,
    hiringManagerNotes: extractions.hiringManagerNotes,
    documentNames: extractions.documentNames,
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
  let lastError: unknown;
  let responseText: string | undefined;
  let selectedModel: string | undefined;

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
      lastError = error;

      if (isModelUnavailableError(error) && index < models.length - 1) {
        const next = models[index + 1];
        console.warn(
          `[groq] Model "${model}" unavailable. Retrying with "${next}".`
        );
        continue;
      }

      const mapped = mapProviderError(error);
      if (
        mapped.code === "RATE_LIMIT" ||
        mapped.code === "TIMEOUT" ||
        mapped.code === "MISSING_API_KEY"
      ) {
        throw mapped;
      }

      // Soft narrative failures fall back to deterministic summary.
      console.warn(
        "[groq] Narrative generation failed; using deterministic summary fallback.",
        mapped.message
      );
      break;
    }
  }

  let summary: LlmNarrativeSummary;

  if (responseText && selectedModel) {
    try {
      summary = parseNarrativeSummary(responseText);
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
        console.warn(
          "[groq] Narrative retry failed; using deterministic summary fallback.",
          retryError instanceof Error ? retryError.message : retryError
        );
        summary = fallbackNarrativeSummary(graph, input.context);
      }
    }
  } else {
    if (lastError) {
      // Missing API key / hard provider errors should still surface.
      if (
        lastError instanceof AiProviderError &&
        lastError.code === "MISSING_API_KEY"
      ) {
        throw lastError;
      }
    }
    summary = fallbackNarrativeSummary(graph, input.context);
  }

  console.log("Executive Summary generated");
  console.log(
    `Discussion Topics generated: ${summary.discussionTopics.length}`
  );
  console.log(
    `Decision Brief generated: ${summary.decisionBrief.strengths.length} strengths`
  );

  // Step 4 — Decision Engine (graph + narrative → Schema B)
  const lean = buildLeanPayloadFromEvidenceGraph({
    graph,
    summary,
    context: input.context,
    documents: input.documents,
    experience: extractions.experience,
  });

  return finalizeResult(
    lean,
    input.documents,
    Date.now() - started,
    selectedModel ?? models[0] ?? "unknown"
  );
}
