import type { DecisionAnalysis } from "@/lib/types";

/**
 * Navigation rules from docs/03_information_architecture.md:
 * - Needs evidence → New Decision Analysis (evidence workspace)
 * - Analyzed / Ready for debrief → Decision Intelligence Dashboard
 */
export function getDecisionAnalysisHref(analysis: DecisionAnalysis): string {
  if (analysis.status === "needs_evidence" || !analysis.intelligence) {
    return `/analyses/${analysis.id}`;
  }

  return `/analyses/${analysis.id}/intelligence`;
}
