import type { DecisionAnalysis } from "@/lib/types";

export const BLOB_PREFIX = "decisionready/analyses/";
export const BLOB_INDEX_PATH = `${BLOB_PREFIX}index.json`;

export type AnalysisStoreBackend = {
  readAll: () => Promise<DecisionAnalysis[] | null>;
  writeAll: (next: DecisionAnalysis[]) => Promise<void>;
};

export function logStore(
  stage: string,
  details?: Record<string, unknown>
): void {
  console.info("[store]", { stage, ...details });
}

export function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

/** True during `next build` static generation / collect phase. */
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  );
}

export function cloneAnalyses(list: DecisionAnalysis[]): DecisionAnalysis[] {
  return structuredClone(list);
}
