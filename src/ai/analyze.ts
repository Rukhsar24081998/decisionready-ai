import type { DecisionAnalysis, DecisionIntelligence } from "@/lib/types";
import { analyzeHiringEvidence } from "@/lib/ai/provider";
import { mockAnalyzeDecisionAnalysis } from "@/ai/mock";

/**
 * Primary analysis entry point.
 * Uses Groq Structured Outputs when ingested documents are present.
 * Falls back to mock only for legacy analyses without uploaded documents.
 */
export async function analyzeCase(
  analysis: DecisionAnalysis
): Promise<DecisionIntelligence> {
  if (analysis.ingestedDocuments.length > 0) {
    const aiResult = await analyzeHiringEvidence({
      context: {
        candidateName: analysis.candidateName,
        roleTitle: analysis.roleTitle,
        department: "",
        hiringManager: "",
        hiringStage: "",
      },
      documents: analysis.ingestedDocuments,
    });

    return {
      readinessLabel:
        aiResult.decisionReadiness.label === "Ready"
          ? "ready"
          : aiResult.decisionReadiness.label === "Partially Ready"
            ? "partially_ready"
            : "not_ready",
      readinessScore: aiResult.decisionReadiness.score,
      verdict: aiResult.executiveSummary,
      confidenceNote: aiResult.decisionBrief.disclaimer,
      nextBestAction: {
        type:
          aiResult.decisionReadiness.label === "Ready"
            ? "proceed_to_debrief"
            : "add_evidence",
        title:
          aiResult.decisionReadiness.label === "Ready"
            ? "Proceed to hiring debrief"
            : "Add evidence for remaining gaps",
        reasons: aiResult.evidenceGaps
          .slice(0, 3)
          .map((g) => g.title || g.text),
        riskIfIgnored:
          "Proceeding without sufficient evidence increases unfair decision risk.",
      },
      evidenceHealth: {
        competenciesRequired: aiResult.competencyCoverage.total,
        competenciesCovered: aiResult.competencyCoverage.covered,
        competenciesWithGaps: aiResult.evidenceGaps.length,
        conflictsDetected: 0,
        interviewersRepresented:
          aiResult.interviewerAlignment.interviewers.length,
        evidenceItemsAnalyzed: aiResult.evidenceQuality.sourcesAnalyzed,
      },
      evidenceGaps: aiResult.evidenceGaps.map((gap, index) => ({
        competencyId: `gap_${index}`,
        competencyName: (gap.relatedCompetency || gap.title || gap.text).slice(
          0,
          48
        ),
        criticality:
          gap.severity === "High"
            ? "required"
            : gap.severity === "Medium"
              ? "important"
              : "nice_to_have",
        evidenceFound: "",
        whatsMissing: gap.whyItMatters || gap.text,
        suggestedNextStep:
          gap.recommendedQuestion ||
          "Collect additional hiring evidence before debrief.",
      })),
      conflicts: [],
      competencies: aiResult.competencyCoverage.competencies.map((c, index) => ({
        id: `comp_${index}`,
        name: c.name,
        criticality: "required" as const,
        coverageStatus: "sufficient" as const,
        evidenceStrength:
          c.score >= 80 ? "strong" : c.score >= 60 ? "moderate" : "weak",
        interviewers: [],
        notesSummary: "",
        blockerFlag: "none" as const,
        jdExpectation: "",
        evidenceByInterviewer: [],
        systemReading: "",
      })),
      interviewerContributions: aiResult.decisionBrief.interviewers.map((i) => ({
        interviewerName: i.name,
        round: i.round,
        competenciesTouched: [],
        feedbackDepth:
          i.confidence >= 85 ? "high" : i.confidence >= 70 ? "medium" : "low",
        conflictsInvolved: 0,
      })),
      decisionBrief: {
        readinessRestatement: aiResult.executiveSummary,
        strengthsWithEvidence: aiResult.decisionBrief.strengths.map(
          (s) => `${s.competency} — ${s.quote}`
        ),
        risksAndOpenQuestions: aiResult.evidenceGaps.map(
          (g) => g.title || g.text
        ),
        debriefAgenda: aiResult.discussionTopics,
        disclaimer: aiResult.decisionBrief.disclaimer,
      },
      analysisTransparency: {
        evidenceSourcesUsed: aiResult.decisionBrief.documentsAnalyzed,
        whatSystemDid: [
          "Extracted competencies from hiring evidence",
          "Mapped evidence with source citations",
          "Calculated Decision Readiness",
        ],
        whatSystemDidNotDo: [
          "Did not recommend hire or reject",
          "Did not rank candidates",
        ],
        limitations: [
          "Based only on provided text evidence",
          "Does not replace recruiter judgment",
        ],
      },
      generatedAt: aiResult.generatedAt,
    };
  }

  return mockAnalyzeDecisionAnalysis(analysis);
}
