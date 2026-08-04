import OpenAI from "openai";
import type { z } from "zod";

/**
 * Generic document extraction lifecycle.
 * Domain-agnostic — no knowledge of Resume/JD/Interview/etc.
 *
 * Reuses the same Groq transport pattern as the project provider
 * (OpenAI-compatible client + GROQ_API_KEY + json_object mode).
 * Does not modify provider.ts.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const DEFAULT_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
] as const;

export interface ExtractWithAIOptions<T> {
  documentText: string;
  filename: string;
  systemPrompt: string;
  userPrompt: string;
  zodSchema: z.ZodType<T>;
  emptyResultFactory: () => T;
  extractorName: string;
  /** Optional transform after successful Zod parse (domain-specific cleanup). */
  postProcess?: (data: T) => T;
}

function getGroqApiKey(): string | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  return apiKey || null;
}

function getClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
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
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
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

/** Normalize root arrays and common wrappers before Zod. */
export function normalizeExtractionJsonRoot(parsed: unknown): unknown {
  if (Array.isArray(parsed)) {
    return (
      parsed.find(
        (item) =>
          item !== null && typeof item === "object" && !Array.isArray(item)
      ) ?? parsed[0]
    );
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    if (
      record.data &&
      typeof record.data === "object" &&
      !Array.isArray(record.data)
    ) {
      return record.data;
    }
    if (
      record.result &&
      typeof record.result === "object" &&
      !Array.isArray(record.result)
    ) {
      return record.result;
    }
  }

  return parsed;
}

function parseAndValidate<T>(
  rawText: string,
  zodSchema: z.ZodType<T>,
  extractorName: string
): T | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.warn(`[${extractorName}] Validation failed: invalid JSON`);
    return null;
  }

  const normalized = normalizeExtractionJsonRoot(parsed);
  const validated = zodSchema.safeParse(normalized);

  if (!validated.success) {
    console.warn(
      `[${extractorName}] Validation failed:`,
      validated.error.issues[0]?.message ?? validated.error.message
    );
    return null;
  }

  return validated.data;
}

async function callGroqJsonObject(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  extractorName: string
): Promise<string | null> {
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    if (isModelUnavailableError(error)) {
      throw error;
    }
    console.warn(
      `[${extractorName}] Groq call failed:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function generateRawJson(
  client: OpenAI,
  models: string[],
  systemPrompt: string,
  userPrompt: string,
  extractorName: string
): Promise<string | null> {
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      console.log(`[${extractorName}] Using Groq model: ${model}`);
      console.log(`[${extractorName}] Using JSON object mode.`);
      const raw = await callGroqJsonObject(
        client,
        model,
        systemPrompt,
        userPrompt,
        extractorName
      );
      if (raw) return raw;
    } catch (error) {
      if (isModelUnavailableError(error) && index < models.length - 1) {
        console.warn(
          `[${extractorName}] Model "${model}" unavailable. Trying "${models[index + 1]}".`
        );
        continue;
      }
      console.warn(
        `[${extractorName}] Model error:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  return null;
}

/**
 * Shared AI extraction lifecycle.
 * Never throws — returns emptyResultFactory() on any failure.
 */
export async function extractWithAI<T>(
  options: ExtractWithAIOptions<T>
): Promise<T> {
  const {
    documentText,
    filename,
    systemPrompt,
    userPrompt,
    zodSchema,
    emptyResultFactory,
    extractorName,
    postProcess,
  } = options;

  console.log(`[${extractorName}] Extraction started`);
  console.log(`[${extractorName}] filename=${filename}`);

  const text = documentText.trim();
  if (!text) {
    console.warn(`[${extractorName}] Empty document text`);
    console.log(`[${extractorName}] Returned empty object`);
    console.log(`[${extractorName}] Extraction completed`);
    return emptyResultFactory();
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    console.warn(`[${extractorName}] GROQ_API_KEY missing`);
    console.log(`[${extractorName}] Returned empty object`);
    console.log(`[${extractorName}] Extraction completed`);
    return emptyResultFactory();
  }

  const client = getClient(apiKey);
  const models = getModelCandidates();

  const rawText = await generateRawJson(
    client,
    models,
    systemPrompt,
    userPrompt,
    extractorName
  );

  let parsed = rawText
    ? parseAndValidate(rawText, zodSchema, extractorName)
    : null;

  if (!parsed && rawText !== null) {
    console.log(`[${extractorName}] Retry started`);
    const stricterSystem = `${systemPrompt}

CRITICAL: Return one valid JSON object only. No markdown. No prose. Match the required schema exactly. Never invent facts or quotes.`;

    const retryRaw = await generateRawJson(
      client,
      models,
      stricterSystem,
      userPrompt,
      extractorName
    );

    parsed = retryRaw
      ? parseAndValidate(retryRaw, zodSchema, extractorName)
      : null;

    if (parsed) {
      console.log(`[${extractorName}] Retry succeeded`);
    } else {
      console.log(`[${extractorName}] Retry failed`);
    }
  } else if (!parsed && rawText === null) {
    console.warn(`[${extractorName}] No model response to validate`);
  }

  if (!parsed) {
    console.log(`[${extractorName}] Returned empty object`);
    console.log(`[${extractorName}] Extraction completed`);
    return emptyResultFactory();
  }

  const result = postProcess ? postProcess(parsed) : parsed;
  console.log(`[${extractorName}] Extraction completed`);
  return result;
}
