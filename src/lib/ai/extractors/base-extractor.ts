import OpenAI from "openai";
import type { z } from "zod";
import {
  GroqCallError,
  retryGroqCall,
} from "@/lib/ai/groq-reliability";
import {
  extractJsonPayload,
  parseJsonLenient,
} from "@/lib/ai/extractors/json-repair";

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
  /**
   * Lightweight salvage prompt when primary + strict retry both fail validation.
   * Should still target the same Zod schema.
   */
  fallbackSystemPrompt?: string;
  fallbackUserPrompt?: string;
  /**
   * When true (default), return emptyResultFactory() after all parse attempts
   * fail instead of throwing VALIDATION — enables graceful degradation.
   * API / empty-response failures still throw.
   */
  salvageWithEmptyOnValidationFailure?: boolean;
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

export { extractJsonPayload };

function truncateForLog(text: string, maxChars = 4000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n… [truncated ${text.length - maxChars} chars]`;
}

function summarizeMissingFields(data: unknown): string[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const missing: string[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === null || value === undefined) {
      missing.push(key);
    } else if (typeof value === "string" && value.trim() === "") {
      missing.push(key);
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(key);
    }
  }
  return missing;
}

function parseAndValidate<T>(
  rawText: string,
  zodSchema: z.ZodType<T>,
  extractorName: string
): T | null {
  console.log(
    `[${extractorName}] Raw model response (${rawText.length} chars):\n${truncateForLog(rawText)}`
  );

  const { cleaned, parsed, error } = parseJsonLenient(rawText);
  console.log(
    `[${extractorName}] Cleaned JSON (${cleaned.length} chars):\n${truncateForLog(cleaned)}`
  );

  if (parsed === null) {
    console.warn(`[${extractorName}] JSON parse failed after repair`, {
      error,
      rawPreview: truncateForLog(rawText, 800),
    });
    return null;
  }

  const normalized = normalizeExtractionJsonRoot(parsed);
  const validated = zodSchema.safeParse(normalized);

  if (!validated.success) {
    console.warn(`[${extractorName}] Validation errors`, {
      issueCount: validated.error.issues.length,
      issues: validated.error.issues,
      formatted: validated.error.format(),
      message: validated.error.message,
    });
    return null;
  }

  const missing = summarizeMissingFields(validated.data);
  if (missing.length > 0) {
    console.log(
      `[${extractorName}] Missing/empty fields (ok): ${missing.join(", ")}`
    );
  }

  console.log(
    `[${extractorName}] Final parsed object:\n${truncateForLog(
      JSON.stringify(validated.data, null, 2)
    )}`
  );

  return validated.data;
}

async function callGroqJsonObject(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  extractorName: string
): Promise<string | null> {
  console.log(`[${extractorName}] Prompt sent`, {
    model,
    systemChars: systemPrompt.length,
    userChars: userPrompt.length,
    totalChars: systemPrompt.length + userPrompt.length,
  });

  const completion = await retryGroqCall(
    `${extractorName}:${model}`,
    async () =>
      client.chat.completions.create({
        model,
        temperature: 0.1,
        // Keep under Groq free-tier TPM while reducing truncation vs default ~3072.
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      })
  );

  return completion.choices[0]?.message?.content?.trim() || null;
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
      // Propagate hard provider failures (rate limit / timeout) after retries
      if (error instanceof GroqCallError) {
        throw error;
      }
      return null;
    }
  }
  return null;
}

/**
 * Shared AI extraction lifecycle.
 * Throws on provider / empty-response failure after retries.
 * On schema mismatch after repair + optional fallback, salvages emptyResultFactory
 * when salvageWithEmptyOnValidationFailure is enabled (default true).
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
    fallbackSystemPrompt,
    fallbackUserPrompt,
    salvageWithEmptyOnValidationFailure = true,
  } = options;

  console.log(`[${extractorName}] Extraction started`);
  console.log(`[${extractorName}] filename=${filename}`);
  console.log(
    `[${extractorName}] Document received (${documentText.trim().length} chars)`
  );

  const text = documentText.trim();
  if (!text) {
    throw new GroqCallError(
      "VALIDATION",
      `${extractorName} could not run because the parsed document text was empty.`
    );
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new GroqCallError(
      "MISSING_API_KEY",
      "GROQ_API_KEY is not configured. Add it to .env.local and restart the server."
    );
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
    console.log(`[${extractorName}] Strict retry started`);
    const stricterSystem = `${systemPrompt}

CRITICAL: Return one valid JSON object only. No markdown. No prose. Match the required schema exactly.
Missing sections must be empty arrays [] or empty strings "" — never null for strings/arrays.
Never invent facts or quotes.`;

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
      console.log(`[${extractorName}] Strict retry succeeded`);
    } else {
      console.log(`[${extractorName}] Strict retry failed`);
    }
  } else if (!parsed && rawText === null) {
    throw new GroqCallError(
      "EMPTY_RESPONSE",
      `${extractorName} returned no response after retries.`
    );
  }

  if (!parsed && fallbackSystemPrompt && fallbackUserPrompt) {
    console.log(`[${extractorName}] Fallback extraction triggered`);
    const fallbackRaw = await generateRawJson(
      client,
      models,
      fallbackSystemPrompt,
      fallbackUserPrompt,
      extractorName
    );
    parsed = fallbackRaw
      ? parseAndValidate(fallbackRaw, zodSchema, extractorName)
      : null;
    if (parsed) {
      console.log(`[${extractorName}] Fallback extraction succeeded`);
    } else {
      console.log(`[${extractorName}] Fallback extraction failed`);
    }
  }

  if (!parsed) {
    if (salvageWithEmptyOnValidationFailure) {
      console.warn(
        `[${extractorName}] Salvaging empty structured result after unrecoverable validation failure`
      );
      const empty = emptyResultFactory();
      const result = postProcess ? postProcess(empty) : empty;
      console.log(`[${extractorName}] Extraction completed (empty salvage)`);
      return result;
    }

    throw new GroqCallError(
      "VALIDATION",
      `${extractorName} returned invalid structured output after retries.`
    );
  }

  const result = postProcess ? postProcess(parsed) : parsed;
  console.log(`[${extractorName}] Extraction completed`);
  return result;
}
