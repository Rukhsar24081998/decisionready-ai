export class GroqCallError extends Error {
  readonly code:
    | "MISSING_API_KEY"
    | "EMPTY_RESPONSE"
    | "INVALID_JSON"
    | "VALIDATION"
    | "RATE_LIMIT"
    | "TIMEOUT"
    | "PROVIDER";

  constructor(
    code: GroqCallError["code"],
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "GroqCallError";
    this.code = code;
  }
}

export function getGroqErrorStatus(error: unknown): number | undefined {
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

export function getGroqErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isRetriableGroqError(error: unknown): boolean {
  const status = getGroqErrorStatus(error);
  const message = getGroqErrorMessage(error).toLowerCase();
  return (
    status === 429 ||
    status === 408 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("rate limit") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("etimedout") ||
    message.includes("econnreset") ||
    message.includes("socket hang up")
  );
}

export function mapGroqError(error: unknown): GroqCallError {
  if (error instanceof GroqCallError) return error;

  const status = getGroqErrorStatus(error);
  const message = getGroqErrorMessage(error);
  const lower = message.toLowerCase();

  if (status === 429 || lower.includes("rate limit")) {
    return new GroqCallError(
      "RATE_LIMIT",
      "Groq rate limit reached after retries. Please try again in a moment.",
      { cause: error }
    );
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    status === 408 ||
    status === 504
  ) {
    return new GroqCallError(
      "TIMEOUT",
      "Groq timed out after retries while generating Decision Intelligence.",
      { cause: error }
    );
  }

  return new GroqCallError(
    "PROVIDER",
    `Groq failed after retries: ${message}`,
    { cause: error }
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryGroqCall<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: { maxRetries?: number; backoffMs?: number[] }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const backoffMs = options?.backoffMs ?? [2000, 4000, 8000];

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !isRetriableGroqError(error)) {
        throw mapGroqError(error);
      }
      const waitMs = backoffMs[Math.min(attempt, backoffMs.length - 1)] ?? 8000;
      console.warn(`[groq/retry] ${operation} failed on attempt ${attempt + 1}; retrying in ${waitMs}ms`, {
        error: getGroqErrorMessage(error),
        status: getGroqErrorStatus(error),
      });
      await sleep(waitMs);
    }
  }

  throw mapGroqError(lastError);
}
