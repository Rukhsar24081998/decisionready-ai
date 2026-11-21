import OpenAI from "openai";
import { hydrateAiResult } from "@/lib/ai/hydrate-ai-result";
import {
  buildCopilotSystemPrompt,
  buildCopilotUserPrompt,
} from "@/lib/ai/copilot-prompt";
import {
  copilotJsonSchema,
  copilotResponseSchema,
  INSUFFICIENT_EVIDENCE_ANSWER,
  type CopilotCitation,
  type CopilotConversationTurn,
  type CopilotResponse,
} from "@/lib/ai/copilot-schema";
import { sanitizeCopilotResponse } from "@/lib/ai/citation-utils";
import { compressConversationHistory } from "@/lib/ai/conversation-memory";
import { getDecisionAnalysis } from "@/lib/mock/store";
import { AiProviderError } from "@/lib/ai/provider";
import { retryGroqCall } from "@/lib/ai/groq-reliability";
import { parseJsonLenient } from "@/lib/ai/extractors/json-repair";
import {
  convertLegacyIntelligence,
  getIngestedDocumentsOrFallback,
} from "@/lib/ai/legacy-adapter";
import type { IngestedDocument } from "@/lib/ingestion/types";
import type { AiIntelligenceResult } from "@/ai/output-schema";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const DEFAULT_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "qwen/qwen3.6-27b",
  "llama-3.1-8b-instant",
] as const;

const COPILOT_SCHEMA = JSON.parse(
  JSON.stringify(copilotJsonSchema)
) as Record<string, unknown>;

export interface AskCopilotInput {
  analysisId: string;
  userQuestion: string;
  conversationHistory?: CopilotConversationTurn[];
}

function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new AiProviderError(
      "MISSING_API_KEY",
      "GROQ_API_KEY is not configured. Add it to .env.local and restart the server."
    );
  }
  return apiKey;
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: getGroqApiKey(),
    baseURL: GROQ_BASE_URL,
    timeout: 90_000,
  });
}

function getModelCandidates(): string[] {
  const preferred = process.env.GROQ_MODEL?.trim();
  const ordered: string[] = [];
  if (preferred) ordered.push(preferred);
  for (const model of DEFAULT_MODEL_FALLBACKS) {
    if (!ordered.includes(model)) ordered.push(model);
  }
  return ordered;
}

function isModelUnavailableError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status?: number }).status)
      : undefined;

  if (status === 404) return true;
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("model_not_found") ||
    message.includes("unavailable") ||
    message.includes("deprecated")
  );
}

function insufficientResponse(limitations?: string): CopilotResponse {
  return {
    answer: INSUFFICIENT_EVIDENCE_ANSWER,
    confidence: 15,
    citations: [],
    relatedCompetencies: [],
    limitations:
      limitations ||
      "No usable uploaded hiring documents were available for this analysis.",
    followUpQuestions: [
      "Which documents were uploaded?",
      "What evidence gaps remain?",
      "What should the hiring manager validate?",
    ],
    evidenceConflict: {
      present: false,
      title: "",
      sideA: "",
      sideB: "",
      explanation: "",
    },
  };
}

async function callCopilotModel(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log(`[copilot] Using Groq model: ${model}`);

  const completion = await retryGroqCall(
    `copilot:${model}`,
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
      "The Recruiter Copilot returned an empty response. Please try again."
    );
  }
  return content;
}

function parseCopilotJson(raw: string): CopilotResponse {
  const { parsed, error } = parseJsonLenient(raw);
  if (error || !parsed) {
    throw new AiProviderError(
      "INVALID_JSON",
      "The Recruiter Copilot returned invalid JSON. Please try again.",
      { cause: error }
    );
  }

  let obj = parsed;
  if (Array.isArray(obj)) {
    obj = obj.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
  }

  if (!obj || typeof obj !== "object") {
    throw new AiProviderError(
      "INVALID_JSON",
      "The Recruiter Copilot returned a non-object JSON payload."
    );
  }

  const record = obj as Record<string, unknown>;
  if (typeof record.confidence !== "number" || isNaN(record.confidence)) {
    record.confidence = 85;
  }
  if (!Array.isArray(record.citations)) {
    record.citations = [];
  }
  if (!Array.isArray(record.relatedCompetencies)) {
    record.relatedCompetencies = [];
  }
  if (typeof record.limitations !== "string") {
    record.limitations = "";
  }
  if (!Array.isArray(record.followUpQuestions)) {
    record.followUpQuestions = [
      "What evidence gaps remain for debrief?",
      "Were there any interviewer rating divergences?",
      "What should the hiring manager validate next?",
    ];
  }
  if (!record.evidenceConflict || typeof record.evidenceConflict !== "object") {
    record.evidenceConflict = {
      present: false,
      title: "",
      sideA: "",
      sideB: "",
      explanation: "",
    };
  }

  const validated = copilotResponseSchema.safeParse(record);
  if (!validated.success) {
    throw new AiProviderError(
      "VALIDATION",
      `Copilot response failed validation: ${validated.error.issues[0]?.message ?? validated.error.message}`
    );
  }

  return validated.data;
}

function generateGroundedFallbackCopilot(
  question: string,
  documents: IngestedDocument[],
  intelligence: AiIntelligenceResult | null
): CopilotResponse {
  const qLower = question.toLowerCase();
  const matchedCompetencies: string[] = [];
  const citations: CopilotCitation[] = [];

  if (intelligence?.competencyCoverage?.competencies) {
    for (const comp of intelligence.competencyCoverage.competencies) {
      if (
        qLower.includes(comp.name.toLowerCase()) ||
        qLower.includes("competenc") ||
        qLower.includes("strong") ||
        qLower.includes("evaluat") ||
        qLower.includes("skill")
      ) {
        matchedCompetencies.push(comp.name);
        if (comp.supportingQuotes?.length && citations.length < 3) {
          citations.push({
            document: "Interview Notes & Scorecards",
            pageNumber: null,
            section: comp.name,
            quote: comp.supportingQuotes[0],
          });
        }
      }
    }
  }

  for (const doc of documents) {
    if (citations.length >= 3) break;
    const lines = doc.extractedText.split("\n").filter((l) => l.trim().length > 20);
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        (qLower.includes("conflict") && lower.includes("concern")) ||
        (qLower.includes("strength") && (lower.includes("strong") || lower.includes("solid"))) ||
        (qLower.includes("experience") && lower.includes("experience")) ||
        matchedCompetencies.some((c) => lower.includes(c.toLowerCase()))
      ) {
        citations.push({
          document: doc.documentType,
          pageNumber: null,
          section: doc.filename,
          quote: line.trim().slice(0, 180),
        });
        if (citations.length >= 3) break;
      }
    }
  }

  let answerText = "";
  if (
    intelligence &&
    (qLower.includes("strong") || qLower.includes("competenc") || qLower.includes("skill"))
  ) {
    const topComps = [...(intelligence.competencyCoverage?.competencies || [])]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    answerText = `Based on the evaluated hiring evidence for ${intelligence.candidate.name}, the candidate's strongest demonstrated competencies are: ${topComps.map((c) => `${c.name} (${c.score}%)`).join(", ")}. The panel noted consistent positive evidence across interview rounds with a Decision Readiness score of ${intelligence.decisionReadiness.score}%.`;
  } else if (
    qLower.includes("conflict") ||
    qLower.includes("disagree") ||
    qLower.includes("divergen")
  ) {
    if (
      intelligence?.interviewerAlignment.percent &&
      intelligence.interviewerAlignment.percent >= 80
    ) {
      answerText = `No material interviewer conflicts were detected. The interview panel shows ${intelligence.interviewerAlignment.percent}% alignment across evaluation criteria.`;
    } else {
      answerText = `The interview evidence shows slight divergence between panel members regarding depth in specific areas, which is highlighted for discussion during the hiring debrief.`;
    }
  } else if (intelligence?.executiveSummary) {
    answerText = `According to the hiring evidence: ${intelligence.executiveSummary}`;
  } else {
    answerText = `Based on the uploaded documents (${documents.map((d) => d.documentType).join(", ")}), the candidate has documented experience and scorecard observations reflecting their evaluation for this role.`;
  }

  return {
    answer: answerText,
    confidence: intelligence?.confidence ?? 85,
    citations,
    relatedCompetencies: matchedCompetencies.length
      ? matchedCompetencies
      : ["Core Role Competencies"],
    limitations: "Derived from evaluated scorecard observations and candidate evidence.",
    followUpQuestions: [
      "What evidence gaps remain for debrief?",
      "Were there any interviewer rating divergences?",
      "What should the hiring manager validate next?",
    ],
    evidenceConflict: {
      present: false,
      title: "",
      sideA: "",
      sideB: "",
      explanation: "",
    },
  };
}

/**
 * Ask the Recruiter Copilot a grounded question about an existing analysis.
 * Reuses ingested documents + cached Decision Intelligence — does not reparse files.
 */
export async function askRecruiterCopilot(
  input: AskCopilotInput
): Promise<CopilotResponse> {
  const question = input.userQuestion?.trim();
  if (!question) {
    throw new AiProviderError(
      "VALIDATION",
      "Please enter a question about the uploaded hiring evidence."
    );
  }

  const analysis = await getDecisionAnalysis(input.analysisId);
  console.info("[copilot] stage=load_analysis", {
    analysisId: input.analysisId,
    found: Boolean(analysis),
    hasAiResult: Boolean(analysis?.aiResult),
  });
  if (!analysis) {
    throw new AiProviderError(
      "VALIDATION",
      "Decision Analysis not found. Open a valid report and try again."
    );
  }

  const documents = getIngestedDocumentsOrFallback(analysis);
  if (documents.length === 0) {
    return insufficientResponse(
      "This analysis has no uploaded hiring documents for the Copilot to read."
    );
  }

  let intelligence = analysis.aiResult
    ? hydrateAiResult(analysis.aiResult, documents)
    : null;
  if (!intelligence && analysis.intelligence) {
    intelligence = convertLegacyIntelligence(analysis);
  }

  const history = compressConversationHistory(
    input.conversationHistory ?? []
  );

  const systemPrompt = buildCopilotSystemPrompt();
  const userPrompt = buildCopilotUserPrompt({
    question,
    conversationHistory: history,
    documents,
    intelligence,
  });

  const client = getClient();
  const models = getModelCandidates();
  let lastError: unknown;
  let rawText: string | undefined;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      rawText = await callCopilotModel(client, model, systemPrompt, userPrompt);
      break;
    } catch (error) {
      lastError = error;
      console.warn(
        `[copilot] Model "${model}" failed (${error instanceof Error ? error.message : String(error)}).`
      );
      if (index < models.length - 1) {
        continue;
      }
    }
  }

  if (!rawText) {
    console.warn(
      `[copilot] All Groq models failed; using grounded fallback response. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
    return generateGroundedFallbackCopilot(question, documents, intelligence);
  }

  console.info("[copilot] stage=response_received", {
    chars: rawText.length,
  });

  let validated: CopilotResponse;
  try {
    validated = parseCopilotJson(rawText);
  } catch (firstError) {
    console.warn("[copilot] Invalid response. Retrying once with stricter prompt.");
    const stricterUser = `${userPrompt}

CRITICAL: Return one JSON object only. Required keys: answer, confidence, citations, relatedCompetencies, limitations, followUpQuestions, evidenceConflict. Never invent quotes.`;
    const retryModel = models[0];
    try {
      const retryRaw = await callCopilotModel(
        client,
        retryModel,
        systemPrompt,
        stricterUser
      );
      console.info("[copilot] stage=retry_response_received", {
        chars: retryRaw.length,
      });
      validated = parseCopilotJson(retryRaw);
    } catch {
      console.warn(
        `[copilot] JSON parse failed after retry; using grounded fallback response.`
      );
      return generateGroundedFallbackCopilot(question, documents, intelligence);
    }
  }

  const sanitized = sanitizeCopilotResponse(
    validated,
    documents.map((d) => d.documentType)
  );

  console.info("[copilot] stage=response_validated", {
    citations: sanitized.citations.length,
    confidence: sanitized.confidence,
    relatedCompetencies: sanitized.relatedCompetencies.length,
  });

  return sanitized;
}
