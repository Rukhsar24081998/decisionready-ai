import type { DecisionAnalysis, DecisionIntelligence } from "@/lib/types";

/**
 * Deterministic mock analyzer for MVP demos.
 * Returns a minimal Not Ready result unless the analysis already has intelligence.
 * Full rule-based coverage will be implemented in the analysis engine phase.
 */
export async function mockAnalyzeDecisionAnalysis(
  analysis: DecisionAnalysis
): Promise<DecisionIntelligence> {
  if (analysis.intelligence) {
    return {
      ...analysis.intelligence,
      generatedAt: new Date().toISOString(),
    };
  }

  const feedbackCount = analysis.evidence.interviewFeedback.length;
  const hasJd = analysis.evidence.jobDescription.trim().length > 0;

  return {
    readinessLabel: "not_ready",
    readinessScore: hasJd && feedbackCount > 0 ? 35 : 10,
    verdict:
      "Insufficient evidence to make a fair and confident hiring decision.",
    confidenceNote:
      "Readiness confidence reflects evidence coverage quality, not hire recommendation.",
    nextBestAction: {
      type: "add_evidence",
      title: "Add interview evidence for required competencies",
      reasons: [
        "One or more required competencies lack sufficient interview evidence.",
        "Additional scorecards or notes are needed before debrief.",
      ],
      riskIfIgnored:
        "Proceeding now increases the risk of deciding from incomplete evidence.",
    },
    evidenceHealth: {
      competenciesRequired: 0,
      competenciesCovered: 0,
      competenciesWithGaps: 0,
      conflictsDetected: 0,
      interviewersRepresented: feedbackCount,
      evidenceItemsAnalyzed: feedbackCount,
    },
    evidenceGaps: [],
    conflicts: [],
    competencies: [],
    interviewerContributions: analysis.evidence.interviewFeedback.map(
      (item) => ({
        interviewerName: item.interviewerName,
        round: item.round,
        focus: item.focus,
        competenciesTouched: [],
        feedbackDepth: "low" as const,
        conflictsInvolved: 0,
      })
    ),
    decisionBrief: {
      readinessRestatement:
        "This Decision Analysis is not ready for hiring debrief.",
      strengthsWithEvidence: [],
      risksAndOpenQuestions: [
        "Evidence package is incomplete for a readiness assessment.",
      ],
      debriefAgenda: [
        "Identify missing interview evidence before scheduling debrief.",
      ],
      disclaimer:
        "This brief does not recommend hire or reject. It assesses evidence readiness only.",
    },
    analysisTransparency: {
      evidenceSourcesUsed: [
        hasJd ? "Job description" : "Job description (missing)",
        analysis.evidence.resume.trim() ? "Resume" : "Resume (missing)",
        `${feedbackCount} interview feedback entries`,
      ],
      whatSystemDid: [
        "Inspected provided evidence package",
        "Returned a placeholder readiness assessment",
      ],
      whatSystemDidNotDo: [
        "Did not recommend hire or reject",
        "Did not run full competency extraction (pending analysis engine)",
      ],
      limitations: [
        "Mock analyzer placeholder — replace with full rule/AI pipeline",
        "Based only on provided text evidence",
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}
