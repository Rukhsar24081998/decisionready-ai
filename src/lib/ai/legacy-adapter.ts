import {
  DISCLAIMER,
  type AiIntelligenceLlmPayload,
  type AiIntelligenceResult,
} from "@/ai/output-schema";
import { buildAiIntelligenceResult } from "@/lib/ai/hydrate-ai-result";
import type { IngestedDocument } from "@/lib/ingestion/types";
import type { DecisionAnalysis } from "@/lib/types";

/**
 * Return stored ingested documents if present, or generate synthetic
 * IngestedDocuments from raw evidence fields (JD, resume, interview feedback).
 */
export function getIngestedDocumentsOrFallback(
  analysis: DecisionAnalysis
): IngestedDocument[] {
  if (analysis.ingestedDocuments && analysis.ingestedDocuments.length > 0) {
    return analysis.ingestedDocuments;
  }

  const syntheticDocs: IngestedDocument[] = [];
  const evidence = analysis.evidence;
  if (!evidence) return syntheticDocs;

  if (evidence.jobDescription && evidence.jobDescription.trim().length > 0) {
    syntheticDocs.push({
      id: `${analysis.id}_jd`,
      filename: "Job_Description.txt",
      documentType: "Job Description",
      extractedText: evidence.jobDescription.trim(),
    });
  }

  if (evidence.resume && evidence.resume.trim().length > 0) {
    syntheticDocs.push({
      id: `${analysis.id}_resume`,
      filename: "Resume.txt",
      documentType: "Resume",
      extractedText: evidence.resume.trim(),
    });
  }

  if (evidence.interviewFeedback && evidence.interviewFeedback.length > 0) {
    const notesText = evidence.interviewFeedback
      .map(
        (f) =>
          `Interviewer: ${f.interviewerName}\nRound: ${f.round} (${f.focus})\nNotes:\n${f.notes}`
      )
      .join("\n\n---\n\n");

    syntheticDocs.push({
      id: `${analysis.id}_interview_notes`,
      filename: "Interview_Notes.txt",
      documentType: "Interview Notes",
      extractedText: notesText,
    });

    const scorecardsText = evidence.interviewFeedback
      .map((f) => {
        const scores = Object.entries(f.scores || {})
          .map(([k, v]) => `• ${k}: ${v}/5`)
          .join("\n");
        return `Interviewer: ${f.interviewerName} (${f.round})\nScores:\n${scores}`;
      })
      .join("\n\n---\n\n");

    syntheticDocs.push({
      id: `${analysis.id}_scorecards`,
      filename: "Scorecards.txt",
      documentType: "Scorecards",
      extractedText: scorecardsText,
    });
  }

  return syntheticDocs;
}

/**
 * Convert legacy intelligence schema (from seed data) into the Schema B
 * AiIntelligenceResult expected by the dashboard and recruiter copilot.
 */
export function convertLegacyIntelligence(
  analysis: DecisionAnalysis
): AiIntelligenceResult {
  const intel = analysis.intelligence;
  const docs = getIngestedDocumentsOrFallback(analysis);

  const competencies = (intel?.competencies || []).map((c) => ({
    name: c.name,
    supportingQuotes: [c.notesSummary || c.jdExpectation || c.name].filter(
      Boolean
    ),
    missingEvidence:
      c.coverageStatus === "missing" ? ["Pending interview evaluation"] : [],
    confidenceReason: c.systemReading || "Documented in panel feedback",
  }));

  const interviewers = (intel?.interviewerContributions || []).map((i) => ({
    name: i.interviewerName,
    role: i.focus || "Interviewer",
    strengths: i.competenciesTouched.map((c) => `Demonstrated strength in ${c}`),
    concerns: [],
    consensus: "Aligned",
    supportingEvidence: [i.notesSummary || ""].filter(Boolean),
  }));

  const evidenceMapping = (intel?.competencies || []).flatMap((c) =>
    (c.evidenceByInterviewer || []).map((e) => ({
      competency: c.name,
      source: e.interviewerName,
      sourceDocument: `${e.round || "Interview"} Notes`,
      pageNumber: null,
      section: e.round || "Feedback",
      confidence: (e.score && e.score >= 4 ? "High" : "Medium") as
        | "High"
        | "Medium"
        | "Low",
      evidence: e.notesSummary || "",
    }))
  );

  const evidenceGaps = (intel?.evidenceGaps || []).map((g) => ({
    title: g.competencyName,
    text: g.whatsMissing,
    severity: (g.criticality === "required" ? "High" : "Medium") as
      | "High"
      | "Medium"
      | "Low",
    whyItMatters: g.whatsMissing,
    recommendedQuestion: g.suggestedNextStep || "",
    estimatedDiscussionTime: "5 mins",
    relatedCompetency: g.competencyName,
  }));

  const briefStrengths = (
    intel?.decisionBrief?.strengthsWithEvidence || []
  ).map((s) => ({
    competency: s.split("—")[0]?.trim() || "Competency",
    source: "Interview Panel",
    confidence: "High" as const,
    quote: s,
    pageNumber: null,
  }));

  const briefInterviewers = (intel?.interviewerContributions || []).map((i) => ({
    name: i.interviewerName,
    round: i.round || "Panel",
    positives: [i.focus || "Evaluation"],
    concerns: [],
    consensus: "Positive",
    confidence: 88,
    evidenceQuotes: [],
  }));

  const lean: AiIntelligenceLlmPayload = {
    candidate: {
      name: analysis.candidateName,
      role: analysis.roleTitle,
      department: (analysis as Record<string, unknown>).department
        ? String((analysis as Record<string, unknown>).department)
        : "Engineering",
      experience: "5+ years",
    },
    competencyCoverage: {
      competencies,
    },
    interviewerAlignment: {
      interviewers,
    },
    evidenceMapping,
    evidenceGaps,
    discussionTopics: [
      "Confirm alignment on core competencies vs demonstrated depth.",
      "Review interview notes and scorecard rationale for final debrief.",
    ],
    executiveSummary:
      intel?.verdict || "Decision Readiness assessment completed.",
    decisionBrief: {
      strengths: briefStrengths,
      interviewers: briefInterviewers,
      documentsAnalyzed: [
        "Job Description",
        "Resume",
        "Interview Notes",
        "Scorecards",
      ],
      processingTime: "1.1s",
      version: "2.0.0",
      disclaimer: DISCLAIMER,
    },
  };

  return buildAiIntelligenceResult(lean, docs);
}
