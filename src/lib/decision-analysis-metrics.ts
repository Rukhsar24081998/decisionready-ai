import type { DecisionAnalysis } from "@/lib/types";
import { hydrateAiResult } from "@/lib/ai/hydrate-ai-result";
import { normalizeConfidence } from "@/lib/ai/score-utils";

export interface DecisionAnalysisCardMetrics {
  readinessScore: number | null;
  competenciesCovered: number | null;
  competenciesRequired: number | null;
  interviewers: number;
  decisionBlockers: number | null;
}

/**
 * Compact card metrics derived from persisted AI / legacy intelligence,
 * with evidence-based fallbacks when analysis has not run yet.
 */
export function getDecisionAnalysisCardMetrics(
  analysis: DecisionAnalysis
): DecisionAnalysisCardMetrics {
  const interviewersFromEvidence = analysis.evidence.interviewFeedback.length;

  if (analysis.aiResult) {
    const ai = hydrateAiResult(
      analysis.aiResult,
      analysis.ingestedDocuments ?? []
    );
    return {
      readinessScore: normalizeConfidence(ai.decisionReadiness.score),
      competenciesCovered:
        ai.coverageBreakdown?.covered ?? ai.competencyCoverage.covered,
      competenciesRequired:
        ai.coverageBreakdown?.total ?? ai.competencyCoverage.total,
      interviewers: Math.max(
        ai.interviewerAlignment.interviewers.length,
        interviewersFromEvidence
      ),
      decisionBlockers: ai.evidenceGaps.length,
    };
  }

  if (!analysis.intelligence) {
    return {
      readinessScore: null,
      competenciesCovered: null,
      competenciesRequired: null,
      interviewers: interviewersFromEvidence,
      decisionBlockers: null,
    };
  }

  const { readinessScore, evidenceHealth, evidenceGaps, conflicts } =
    analysis.intelligence;

  return {
    readinessScore: normalizeConfidence(readinessScore),
    competenciesCovered: evidenceHealth.competenciesCovered,
    competenciesRequired: evidenceHealth.competenciesRequired,
    interviewers: evidenceHealth.interviewersRepresented,
    decisionBlockers: evidenceGaps.length + conflicts.length,
  };
}
