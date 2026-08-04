import {
  analyzeHiringEvidence,
  type AnalyzeHiringEvidenceInput,
} from "@/lib/ai/provider";
import type { AiIntelligenceResult } from "@/ai/output-schema";

/**
 * Compatibility wrapper — delegates to the Groq AI provider.
 * Prefer importing analyzeHiringEvidence from @/lib/ai/provider for new code.
 */
export async function generateDecisionIntelligence(
  input: AnalyzeHiringEvidenceInput
): Promise<AiIntelligenceResult> {
  return analyzeHiringEvidence(input);
}

export { analyzeHiringEvidence } from "@/lib/ai/provider";
