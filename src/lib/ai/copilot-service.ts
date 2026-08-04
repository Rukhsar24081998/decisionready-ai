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
  type CopilotConversationTurn,
  type CopilotResponse,
} from "@/lib/ai/copilot-schema";
import { sanitizeCopilotResponse } from "@/lib/ai/citation-utils";
import { compressConversationHistory } from "@/lib/ai/conversation-memory";
import { getDecisionAnalysis } from "@/lib/mock/store";
import { AiProviderError } from "@/lib/ai/provider";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const DEFAULT_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
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

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "recruiter_copilot_answer",
        strict: true,
        schema: {
          ...COPILOT_SCHEMA,
          type: "object",
        },
      },
    },
  });

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
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new AiProviderError(
      "INVALID_JSON",
      "The Recruiter Copilot returned invalid JSON. Please try again.",
      { cause: error }
    );
  }

  if (Array.isArray(parsed)) {
    parsed = parsed.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
  }

  const validated = copilotResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AiProviderError(
      "VALIDATION",
      `Copilot response failed validation: ${validated.error.issues[0]?.message ?? validated.error.message}`
    );
  }

  return validated.data;
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

  const analysis = getDecisionAnalysis(input.analysisId);
  if (!analysis) {
    throw new AiProviderError(
      "VALIDATION",
      "Decision Analysis not found. Open a valid report and try again."
    );
  }

  const documents = analysis.ingestedDocuments ?? [];
  if (documents.length === 0) {
    return insufficientResponse(
      "This analysis has no uploaded hiring documents for the Copilot to read."
    );
  }

  const intelligence = analysis.aiResult
    ? hydrateAiResult(analysis.aiResult, documents)
    : null;

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
      if (isModelUnavailableError(error) && index < models.length - 1) {
        console.warn(
          `[copilot] Model "${model}" unavailable. Retrying with "${models[index + 1]}".`
        );
        continue;
      }
      if (error instanceof AiProviderError) throw error;
      throw new AiProviderError(
        "PROVIDER",
        `Recruiter Copilot failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  if (!rawText) {
    throw new AiProviderError(
      "PROVIDER",
      `Recruiter Copilot failed: ${lastError instanceof Error ? lastError.message : "No model response"}`
    );
  }

  console.log("Raw Copilot response:");
  console.log(rawText);

  let validated: CopilotResponse;
  try {
    validated = parseCopilotJson(rawText);
  } catch (firstError) {
    // One stricter retry on malformed JSON / schema mismatch.
    console.warn("[copilot] Invalid response. Retrying once with stricter prompt.");
    const stricterUser = `${userPrompt}

CRITICAL: Return one JSON object only. Required keys: answer, confidence, citations, relatedCompetencies, limitations, followUpQuestions, evidenceConflict. Never invent quotes.`;
    const retryModel = models[0];
    const retryRaw = await callCopilotModel(
      client,
      retryModel,
      systemPrompt,
      stricterUser
    );
    console.log("Raw Copilot response:");
    console.log(retryRaw);
    try {
      validated = parseCopilotJson(retryRaw);
    } catch {
      throw firstError;
    }
  }

  const sanitized = sanitizeCopilotResponse(
    validated,
    documents.map((d) => d.documentType)
  );

  console.log("Validated Copilot object:");
  console.log(JSON.stringify(sanitized, null, 2));

  return sanitized;
}
