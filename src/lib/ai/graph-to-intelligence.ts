/**
 * Convert CandidateEvidenceGraph + LLM narrative → Schema A lean payload.
 * Deterministic dashboard fields come from the graph; narrative from the LLM.
 */

import type { AiIntelligenceLlmPayload } from "@/ai/output-schema";
import type { AnalysisContextInput } from "@/ai/prompts";
import type { CandidateEvidenceGraph } from "@/lib/ai/evidence/evidence-graph";
import type { LlmNarrativeSummary } from "@/lib/ai/llm-summary-schema";
import type { IngestedDocument } from "@/lib/ingestion/types";

function confidenceLabel(
  value: "low" | "medium" | "high"
): "High" | "Medium" | "Low" {
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  return "Low";
}

function documentTypeLabel(
  documentType: CandidateEvidenceGraph["competencies"][number]["sources"][number]["documentType"]
): string {
  switch (documentType) {
    case "resume":
      return "Resume";
    case "job_description":
      return "Job Description";
    case "interview_notes":
      return "Interview Notes";
    case "scorecard":
      return "Scorecards";
    case "hiring_manager_notes":
      return "Hiring Manager Notes";
    default:
      return "Unknown";
  }
}

function confidenceReason(
  confidence: "low" | "medium" | "high",
  sourceCount: number,
  documentCount: number
): string {
  if (confidence === "high") {
    return `High confidence — evidence appears across ${documentCount} document types (${sourceCount} sources).`;
  }
  if (confidence === "medium") {
    return `Medium confidence — evidence appears across ${documentCount} document types (${sourceCount} sources).`;
  }
  return `Low confidence — evidence appears in ${documentCount} document type (${sourceCount} source${sourceCount === 1 ? "" : "s"}).`;
}

/**
 * Build Schema A from the Evidence Graph (deterministic) + LLM narrative.
 * Consumed by the Decision Engine / hydrate layer unchanged.
 */
export function buildLeanPayloadFromEvidenceGraph(input: {
  graph: CandidateEvidenceGraph;
  summary: LlmNarrativeSummary;
  context: AnalysisContextInput;
  documents: IngestedDocument[];
  experience?: string;
}): AiIntelligenceLlmPayload {
  const { graph, summary, context, documents } = input;

  const missingSet = new Set(
    graph.missingCompetencies.map((name) => name.toLowerCase())
  );

  const competencyNames = new Set<string>();
  const competencies: AiIntelligenceLlmPayload["competencyCoverage"]["competencies"] =
    [];

  for (const competency of graph.competencies) {
    competencyNames.add(competency.name.toLowerCase());
    const documentTypes = new Set(
      competency.sources.map((source) => source.documentType)
    );
    competencies.push({
      name: competency.name,
      supportingQuotes: competency.sources
        .map((source) => source.quote)
        .filter(Boolean),
      missingEvidence: [],
      confidenceReason: confidenceReason(
        competency.confidence,
        competency.sources.length,
        documentTypes.size
      ),
    });
  }

  for (const missing of graph.missingCompetencies) {
    if (competencyNames.has(missing.toLowerCase())) continue;
    competencies.push({
      name: missing,
      supportingQuotes: [],
      missingEvidence: [
        `No supporting evidence found for required competency "${missing}".`,
      ],
      confidenceReason:
        "Required by the Job Description but not evidenced in uploaded documents.",
    });
  }

  // Include required competencies that somehow weren't in missing or observed
  for (const required of graph.requiredCompetencies) {
    if (competencyNames.has(required.toLowerCase())) continue;
    if (missingSet.has(required.toLowerCase())) continue;
    competencyNames.add(required.toLowerCase());
    competencies.push({
      name: required,
      supportingQuotes: [],
      missingEvidence: [
        `Required competency "${required}" lacks mapped evidence.`,
      ],
      confidenceReason: "Listed as required; evidence coverage is incomplete.",
    });
  }

  const evidenceMapping: AiIntelligenceLlmPayload["evidenceMapping"] = [];
  for (const competency of graph.competencies) {
    for (const source of competency.sources) {
      evidenceMapping.push({
        competency: competency.name,
        source: documentTypeLabel(source.documentType),
        sourceDocument: source.documentName || documentTypeLabel(source.documentType),
        pageNumber:
          typeof source.pageNumber === "number" ? source.pageNumber : null,
        section: "",
        confidence: confidenceLabel(competency.confidence),
        evidence: source.quote,
      });
    }
  }

  const evidenceGaps: AiIntelligenceLlmPayload["evidenceGaps"] =
    graph.missingCompetencies.map((name) => ({
      title: `Missing evidence: ${name}`,
      text: `Required competency "${name}" is not supported by uploaded evidence.`,
      severity: "High" as const,
      whyItMatters:
        "Debrief cannot fairly assess this required competency without concrete evidence.",
      recommendedQuestion: `What specific examples demonstrate ${name} for this candidate?`,
      estimatedDiscussionTime: "5 minutes",
      relatedCompetency: name,
    }));

  const positives = graph.interviewerSignals.positive;
  const negatives = graph.interviewerSignals.negative;
  const interviewers: AiIntelligenceLlmPayload["interviewerAlignment"]["interviewers"] =
    positives.length > 0 || negatives.length > 0
      ? [
          {
            name: "Interview Panel",
            role: "Interview Notes",
            strengths: positives,
            concerns: negatives,
            consensus:
              negatives.length === 0
                ? "Panel signals are predominantly constructive."
                : positives.length === 0
                  ? "Panel signals raise material concerns."
                  : "Panel signals include both constructive evidence and open concerns.",
            supportingEvidence: [...positives, ...negatives].slice(0, 12),
          },
        ]
      : [];

  const briefStrengths =
    summary.decisionBrief.strengths.length > 0
      ? summary.decisionBrief.strengths
      : graph.competencies
          .filter((c) => c.confidence !== "low" && c.sources[0]?.quote)
          .slice(0, 6)
          .map((c) => ({
            competency: c.name,
            source: documentTypeLabel(c.sources[0].documentType),
            confidence: confidenceLabel(c.confidence),
            quote: c.sources[0].quote,
            pageNumber:
              typeof c.sources[0].pageNumber === "number"
                ? c.sources[0].pageNumber
                : null,
          }));

  const discussionTopics =
    summary.discussionTopics.length > 0
      ? summary.discussionTopics
      : graph.missingCompetencies
          .slice(0, 6)
          .map(
            (name) =>
              `What concrete evidence clarifies ${name} before debrief?`
          );

  const executiveSummary =
    summary.executiveSummary.trim() ||
    [
      `Evidence package for ${graph.candidate.name || context.candidateName || "the candidate"}`,
      `applying to ${graph.candidate.role || context.roleTitle || "the open role"}.`,
      `${graph.competencies.length} competencies mapped from uploaded documents.`,
      graph.missingCompetencies.length > 0
        ? `${graph.missingCompetencies.length} required competencies still lack evidence.`
        : "Required competencies have mapped evidence.",
      "This summary does not recommend hire or reject.",
    ].join(" ");

  return {
    candidate: {
      name:
        graph.candidate.name.trim() ||
        context.candidateName.trim() ||
        "Candidate",
      role:
        graph.candidate.role.trim() ||
        context.roleTitle.trim() ||
        "Open Role",
      department: context.department.trim() || "",
      experience: input.experience?.trim() || "",
    },
    competencyCoverage: { competencies },
    interviewerAlignment: { interviewers },
    evidenceMapping,
    evidenceGaps,
    discussionTopics,
    executiveSummary,
    decisionBrief: {
      strengths: briefStrengths,
      interviewers: interviewers.map((person) => ({
        name: person.name,
        round: person.role,
        positives: person.strengths,
        concerns: person.concerns,
        consensus: person.consensus,
        supportingEvidence: person.supportingEvidence,
      })),
      skills: graph.skills,
      documentsAnalyzed:
        documents.length > 0
          ? documents.map((doc) => doc.documentType)
          : [],
    },
  };
}
