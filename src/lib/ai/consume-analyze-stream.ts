import type { PipelineProgressEvent } from "@/lib/ai/pipeline-timing";

export type AnalyzeStreamHandlers = {
  onStage?: (
    event: Extract<PipelineProgressEvent, { type: "stage" }>
  ) => void;
};

export type AnalyzeStreamResult = {
  analysisId: string;
  analysis?: import("@/lib/types").DecisionAnalysis;
  timings: Array<{ label: string; ms: number }>;
  totalMs: number;
  requestId: string;
};

/**
 * Consume /api/analyze NDJSON progress stream.
 * Falls back to a single JSON body if the server returns classic JSON.
 */
export async function consumeAnalyzeStream(
  response: Response,
  handlers: AnalyzeStreamHandlers = {}
): Promise<AnalyzeStreamResult> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("ndjson") && !contentType.includes("stream")) {
    const rawBody = await response.text();
    let payload: {
      data?: {
        analysisId: string;
        analysis?: import("@/lib/types").DecisionAnalysis;
      };
      error?: string;
      code?: string;
      stage?: string;
      requestId?: string;
      timings?: Array<{ label: string; ms: number }>;
      totalMs?: number;
    } = {};

    try {
      payload = rawBody ? (JSON.parse(rawBody) as typeof payload) : {};
    } catch {
      throw new Error(
        `Server returned a non-JSON ${response.status} response while generating Decision Intelligence. ` +
          `Check Vercel Function logs for /api/analyze. ` +
          `Body preview: ${rawBody.slice(0, 180).replace(/\s+/g, " ")}`
      );
    }

    if (!response.ok || !payload.data?.analysisId) {
      throw new Error(
        payload.error ||
          `Unable to generate Decision Intelligence (${response.status}${
            payload.code ? ` · ${payload.code}` : ""
          }${payload.stage ? ` · ${payload.stage}` : ""})`
      );
    }

    return {
      analysisId: payload.data.analysisId,
      analysis: payload.data.analysis,
      timings: payload.timings ?? [],
      totalMs: payload.totalMs ?? 0,
      requestId: payload.requestId ?? "",
    };
  }

  if (!response.body) {
    throw new Error("Analyze stream returned an empty body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalyzeStreamResult | null = null;
  let streamError: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
      if (!line) continue;

      let event: PipelineProgressEvent;
      try {
        event = JSON.parse(line) as PipelineProgressEvent;
      } catch {
        continue;
      }

      if (event.type === "stage") {
        handlers.onStage?.(event);
      } else if (event.type === "error") {
        streamError =
          event.error ||
          `Unable to generate Decision Intelligence${
            event.code ? ` (${event.code})` : ""
          }`;
      } else if (event.type === "result") {
        const data = event.data as {
          analysisId?: string;
          analysis?: import("@/lib/types").DecisionAnalysis;
        };
        if (!data?.analysisId) {
          streamError = "Analyze stream completed without an analysis id.";
        } else {
          result = {
            analysisId: data.analysisId,
            analysis: data.analysis,
            timings: event.timings ?? [],
            totalMs: event.totalMs ?? 0,
            requestId: event.requestId,
          };
        }
      }
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }
  if (!result) {
    throw new Error(
      "Analyze stream ended without a result. Please try generating Decision Intelligence again."
    );
  }
  return result;
}

export const ANALYSIS_PROGRESS_STORAGE_KEY = "dr-analysis-progress";

export type StoredAnalysisProgress = {
  analysisId: string;
  completedStages: string[];
  timings: Array<{ label: string; ms: number }>;
  totalMs: number;
  completedAt: number;
};

export function storeAnalysisProgress(value: StoredAnalysisProgress): void {
  try {
    sessionStorage.setItem(ANALYSIS_PROGRESS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

export function readAnalysisProgress(
  analysisId: string
): StoredAnalysisProgress | null {
  try {
    const raw = sessionStorage.getItem(ANALYSIS_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAnalysisProgress;
    if (parsed.analysisId !== analysisId) return null;
    return parsed;
  } catch {
    return null;
  }
}
