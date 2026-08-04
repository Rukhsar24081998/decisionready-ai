export {
  analyzeHiringEvidence,
  AiProviderError,
  type AnalyzeHiringEvidenceInput,
} from "@/lib/ai/provider";

export { buildLeanPayloadFromEvidenceGraph } from "@/lib/ai/graph-to-intelligence";
export {
  mergeEvidence,
  createEmptyEvidenceGraph,
  type CandidateEvidenceGraph,
  type MergeEvidenceInput,
} from "@/lib/ai/evidence";

export {
  formatPercentage,
  normalizeConfidence,
  clampPercentage,
  safeRound,
} from "@/lib/ai/score-utils";

export { runDecisionEngine, SCHEMA_VERSION, PROMPT_VERSION } from "@/lib/ai/decision-engine";
export { hydrateAiResult, buildAiIntelligenceResult } from "@/lib/ai/hydrate-ai-result";
export { askRecruiterCopilot } from "@/lib/ai/copilot-service";
export {
  createDefaultAiIntelligencePayload,
  deepMerge,
  mergeAndValidateAiIntelligence,
  findMissingTopLevelKeys,
  computeCompletenessPercent,
} from "@/lib/ai/default-intelligence";
