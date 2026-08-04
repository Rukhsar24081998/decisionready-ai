/**
 * Deterministic Decision Readiness engine.
 * The LLM supplies evidence signals; readiness is always calculated here.
 */

import type { IngestedDocument } from "@/lib/ingestion/types";
import {
  buildAlignmentExplanation,
  buildConfidenceExplanation,
  buildCoverageExplanation,
  type ScoreExplanation,
} from "@/lib/ai/confidence-utils";
import {
  buildEvidenceQualityMetrics,
  computeEvidenceCompleteness,
  countTotalWords,
  detectMissingDocumentTypes,
  emptyStateForMissingDocs,
  normalizePageNumber,
} from "@/lib/ai/evidence-utils";
import {
  clampPercentage,
  normalizeConfidence,
  safeRound,
  weightedAverage,
} from "@/lib/ai/score-utils";

export const DECISION_READINESS_WEIGHTS = {
  competencyCoverage: 0.4,
  evidenceQuality: 0.25,
  interviewerAlignment: 0.2,
  evidenceCompleteness: 0.15,
} as const;

export const SCHEMA_VERSION = "2.0.0";
export const PROMPT_VERSION = "3.0.0";

export type ReadinessLabel = "Ready" | "Partially Ready" | "Not Ready";

export interface DecisionReadinessBreakdown {
  competencyCoverage: number;
  evidenceQuality: number;
  interviewerAlignment: number;
  evidenceCompleteness: number;
  weights: typeof DECISION_READINESS_WEIGHTS;
  topStrength: string;
  topRisk: string;
}

export interface CoverageBreakdown {
  covered: number;
  partiallyCovered: number;
  missing: number;
  total: number;
}

export interface AnalysisMetadata {
  aiProvider: string;
  modelName: string;
  processingTimeMs: number;
  processingTime: string;
  documentsProcessed: number;
  totalWords: number;
  evidenceCount: number;
  generatedAt: string;
  schemaVersion: string;
  promptVersion: string;
}

export interface NormalizedCompetency {
  name: string;
  score: number;
  confidence: number;
  evidenceCount: number;
  supportingQuotes: string[];
  missingEvidence: string[];
  confidenceReason: string;
}

export interface NormalizedEvidenceMapping {
  competency: string;
  source: string;
  sourceDocument: string;
  pageNumber: number | null;
  section: string | null;
  confidence: "High" | "Medium" | "Low";
  confidencePercent: number;
  evidence: string;
  quote: string;
}

export interface NormalizedEvidenceGap {
  title: string;
  text: string;
  severity: "High" | "Medium" | "Low";
  whyItMatters: string;
  recommendedQuestion: string;
  estimatedDiscussionTime: string;
  relatedCompetency: string;
}

export interface NormalizedInterviewer {
  name: string;
  role: string;
  percent: number;
  confidence: number;
  strengths: string[];
  concerns: string[];
  consensus: string;
  supportingEvidence: string[];
}

export interface TimelineStage {
  label: string;
  timestamp: string;
  status: "completed" | "in_progress" | "pending";
  duration: string;
}

export interface DecisionEngineInput {
  /** Lean LLM payload (Schema A) — qualitative evidence only. */
  raw: {
    candidate: {
      name: string;
      role: string;
      department: string;
      experience: string;
    };
    competencyCoverage: {
      competencies: Array<{
        name: string;
        supportingQuotes?: string[];
        missingEvidence?: string[];
        confidenceReason?: string;
        /** Legacy optional — ignored when deriving scores. */
        score?: number;
        evidenceCount?: number;
      }>;
    };
    interviewerAlignment: {
      interviewers: Array<{
        name: string;
        role?: string;
        strengths?: string[];
        concerns?: string[];
        consensus?: string;
        supportingEvidence?: string[];
        /** Legacy optional — ignored when deriving alignment. */
        percent?: number;
      }>;
      label?: string;
    };
    evidenceMapping: Array<{
      competency: string;
      source: string;
      sourceDocument?: string;
      pageNumber?: number | null;
      section?: string | null;
      confidence: "High" | "Medium" | "Low";
      evidence: string;
    }>;
    evidenceGaps: Array<{
      text?: string;
      title?: string;
      severity: "High" | "Medium" | "Low";
      whyItMatters?: string;
      recommendedQuestion?: string;
      estimatedDiscussionTime?: string;
      relatedCompetency?: string;
    }>;
    discussionTopics: string[];
    executiveSummary: string;
    decisionBrief: {
      strengths: Array<{
        competency: string;
        source: string;
        confidence: "High" | "Medium" | "Low";
        quote: string;
        pageNumber?: number | null;
      }>;
      interviewers: Array<{
        name: string;
        round: string;
        positives: string[];
        concerns: string[];
        consensus: string;
        supportingEvidence?: string[];
        confidence?: number;
      }>;
      skills: string[];
      documentsAnalyzed: string[];
    };
  };
  documents: IngestedDocument[];
  elapsedMs: number;
  modelName: string;
  aiProvider?: string;
}

/** Derive a 0–100 competency score from evidence signals (never LLM-invented). */
export function deriveCompetencyScore(input: {
  supportingQuotes: string[];
  missingEvidence: string[];
  mappedQuoteCount: number;
}): number {
  const quoteCount = Math.max(
    input.supportingQuotes.length,
    input.mappedQuoteCount
  );
  const missing = input.missingEvidence.length;
  const base = Math.min(95, 35 + quoteCount * 18);
  const penalty = Math.min(40, missing * 12);
  return normalizeConfidence(base - penalty);
}

/** Derive interviewer confidence from qualitative signals. */
export function deriveInterviewerConfidence(input: {
  strengths: string[];
  concerns: string[];
  supportingEvidence: string[];
}): number {
  const strengthBoost = Math.min(40, input.strengths.length * 12);
  const evidenceBoost = Math.min(25, input.supportingEvidence.length * 10);
  const concernDrag = Math.min(35, input.concerns.length * 10);
  return normalizeConfidence(45 + strengthBoost + evidenceBoost - concernDrag);
}

export interface DecisionEngineResult {
  decisionReadiness: {
    score: number;
    label: ReadinessLabel;
    subtitle: string;
  };
  decisionReadinessBreakdown: DecisionReadinessBreakdown;
  overallExplanation: string;
  confidence: number;
  explanations: {
    decisionReadiness: ScoreExplanation;
    confidence: ScoreExplanation;
    coverage: ScoreExplanation;
    alignment: ScoreExplanation;
  };
  evidenceQuality: {
    label: "High" | "Medium" | "Low";
    sourcesAnalyzed: number;
    overallScore: number;
    supportingQuotes: number;
    missingEvidence: number;
  };
  competencyCoverage: {
    covered: number;
    total: number;
    partiallyCovered: number;
    missing: number;
    competencies: NormalizedCompetency[];
  };
  coverageBreakdown: CoverageBreakdown;
  interviewerAlignment: {
    percent: number;
    label: string;
    interviewers: NormalizedInterviewer[];
  };
  evidenceMapping: NormalizedEvidenceMapping[];
  evidenceGaps: NormalizedEvidenceGap[];
  discussionTopics: string[];
  timeline: TimelineStage[];
  emptyStates: string[];
  metadata: AnalysisMetadata;
}

function readinessLabelFromScore(score: number): ReadinessLabel {
  if (score >= 80) return "Ready";
  if (score >= 55) return "Partially Ready";
  return "Not Ready";
}

function formatDurationMs(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function classifyCompetency(score: number): "covered" | "partial" | "missing" {
  const n = normalizeConfidence(score);
  if (n >= 70) return "covered";
  if (n >= 40) return "partial";
  return "missing";
}

function buildRecruiterTimeline(
  documents: IngestedDocument[],
  generatedAt: string,
  elapsedMs: number
): TimelineStage[] {
  const start = new Date(generatedAt).getTime() - elapsedMs;
  const types = new Set(documents.map((d) => d.documentType));
  const slice = Math.max(1, Math.floor(elapsedMs / 7));

  const stages: Array<{ label: string; included: boolean }> = [
    { label: "Resume Parsed", included: types.has("Resume") },
    { label: "Job Description Parsed", included: types.has("Job Description") },
    {
      label: "Interview Notes Processed",
      included: types.has("Interview Notes"),
    },
    { label: "Evidence Extracted", included: documents.length > 0 },
    { label: "Competencies Mapped", included: true },
    { label: "Evidence Gaps Identified", included: true },
    { label: "Decision Brief Generated", included: true },
  ];

  return stages.map((stage, index) => {
    const ts = new Date(start + slice * (index + 1)).toISOString();
    return {
      label: stage.label,
      timestamp: ts,
      status: stage.included ? ("completed" as const) : ("pending" as const),
      duration: formatDurationMs(slice),
    };
  });
}

/**
 * Run the deterministic Decision Readiness + normalization pipeline.
 *
 * Phase 12: upstream orchestration builds Schema A `raw` from
 * CandidateEvidenceGraph + LLM narrative (executiveSummary / discussionTopics /
 * decisionBrief). This engine never invents evidence — it scores and normalizes.
 */
export function runDecisionEngine(
  input: DecisionEngineInput
): DecisionEngineResult {
  const { raw, documents, elapsedMs, modelName } = input;
  const generatedAt = new Date().toISOString();
  const aiProvider = input.aiProvider ?? "Groq";

  const evidenceMapping: NormalizedEvidenceMapping[] = raw.evidenceMapping.map(
    (row) => {
      const quote = (row.evidence || "").trim();
      const sourceDocument = (row.sourceDocument || row.source || "Unknown").trim();
      const confidencePercent =
        row.confidence === "High" ? 90 : row.confidence === "Medium" ? 70 : 45;
      return {
        competency: row.competency,
        source: sourceDocument,
        sourceDocument,
        pageNumber: normalizePageNumber(row.pageNumber),
        section: row.section?.trim() || null,
        confidence: row.confidence,
        confidencePercent,
        evidence: quote,
        quote,
      };
    }
  );

  const competencies: NormalizedCompetency[] =
    raw.competencyCoverage.competencies.map((c) => {
      const mappedQuotes = evidenceMapping
        .filter((e) => e.competency === c.name && e.quote)
        .map((e) => e.quote);
      const supportingQuotes =
        c.supportingQuotes && c.supportingQuotes.length > 0
          ? c.supportingQuotes.filter(Boolean)
          : mappedQuotes;
      const missingEvidence = (c.missingEvidence ?? []).filter(Boolean);
      const score = deriveCompetencyScore({
        supportingQuotes,
        missingEvidence,
        mappedQuoteCount: mappedQuotes.length,
      });
      const evidenceCount =
        typeof c.evidenceCount === "number" && c.evidenceCount >= 0
          ? c.evidenceCount
          : supportingQuotes.length;

      return {
        name: c.name,
        score,
        confidence: score,
        evidenceCount,
        supportingQuotes,
        missingEvidence,
        confidenceReason:
          c.confidenceReason?.trim() ||
          (supportingQuotes.length > 0
            ? `${supportingQuotes.length} supporting quote${supportingQuotes.length === 1 ? "" : "s"} mapped from uploaded evidence.`
            : "Limited or no supporting quotes were found for this competency."),
      };
    });

  let covered = 0;
  let partiallyCovered = 0;
  let missing = 0;
  for (const c of competencies) {
    const bucket = classifyCompetency(c.score);
    if (bucket === "covered") covered += 1;
    else if (bucket === "partial") partiallyCovered += 1;
    else missing += 1;
  }

  const total = Math.max(
    competencies.length,
    covered + partiallyCovered + missing
  );

  const competencyCoverageScore =
    competencies.length > 0
      ? normalizeConfidence(
          competencies.reduce((s, c) => s + c.score, 0) / competencies.length
        )
      : total > 0
        ? normalizeConfidence((covered / total) * 100)
        : 0;

  const supportingQuotes = Math.max(
    evidenceMapping.filter((e) => e.quote).length,
    competencies.reduce((s, c) => s + c.supportingQuotes.length, 0)
  );

  const missingEvidenceCount = Math.max(
    missing,
    competencies.reduce((s, c) => s + c.missingEvidence.length, 0)
  );

  const evidenceQuality = buildEvidenceQualityMetrics({
    sourcesAnalyzed: documents.length,
    supportingQuotes,
    missingEvidence: missingEvidenceCount,
  });

  const interviewers: NormalizedInterviewer[] =
    raw.interviewerAlignment.interviewers.map((person, index) => {
      const brief = raw.decisionBrief.interviewers[index];
      const strengths =
        person.strengths?.length ? person.strengths : brief?.positives ?? [];
      const concerns =
        person.concerns?.length ? person.concerns : brief?.concerns ?? [];
      const supportingEvidence =
        person.supportingEvidence?.length
          ? person.supportingEvidence
          : brief?.supportingEvidence ?? [];
      const confidence = deriveInterviewerConfidence({
        strengths,
        concerns,
        supportingEvidence,
      });
      return {
        name: person.name || brief?.name || `Interviewer ${index + 1}`,
        role: person.role || brief?.round || "Interviewer",
        percent: confidence,
        confidence,
        strengths,
        concerns,
        consensus:
          person.consensus ||
          brief?.consensus ||
          raw.interviewerAlignment.label ||
          "Alignment assessed from available notes.",
        supportingEvidence,
      };
    });

  // Prefer brief interviewers when alignment list is empty.
  if (interviewers.length === 0 && raw.decisionBrief.interviewers.length > 0) {
    for (const brief of raw.decisionBrief.interviewers) {
      const confidence = deriveInterviewerConfidence({
        strengths: brief.positives,
        concerns: brief.concerns,
        supportingEvidence: brief.supportingEvidence ?? [],
      });
      interviewers.push({
        name: brief.name,
        role: brief.round,
        percent: confidence,
        confidence,
        strengths: brief.positives,
        concerns: brief.concerns,
        consensus: brief.consensus,
        supportingEvidence: brief.supportingEvidence ?? [],
      });
    }
  }

  const interviewerAlignmentPercent =
    interviewers.length > 0
      ? normalizeConfidence(
          interviewers.reduce((s, i) => s + i.confidence, 0) /
            interviewers.length
        )
      : 0;

  const gaps: NormalizedEvidenceGap[] = raw.evidenceGaps.map((gap, index) => {
    const title =
      gap.title?.trim() ||
      gap.relatedCompetency?.trim() ||
      gap.text?.trim() ||
      `Evidence gap ${index + 1}`;
    const why =
      gap.whyItMatters?.trim() ||
      gap.text?.trim() ||
      "Additional evidence would improve debrief confidence.";
    const question =
      gap.recommendedQuestion?.trim() ||
      `What concrete examples clarify ${title}?`;
    return {
      title,
      text: `${title}: ${why}`,
      severity: gap.severity,
      whyItMatters: why,
      recommendedQuestion: question,
      estimatedDiscussionTime:
        gap.estimatedDiscussionTime?.trim() ||
        (gap.severity === "High" ? "5 minutes" : "3 minutes"),
      relatedCompetency: gap.relatedCompetency?.trim() || title,
    };
  });

  const highSeverityGaps = gaps.filter((g) => g.severity === "High").length;
  const mediumSeverityGaps = gaps.filter((g) => g.severity === "Medium").length;

  const evidenceCompleteness = computeEvidenceCompleteness({
    documents,
    highSeverityGaps,
    mediumSeverityGaps,
  });

  const breakdown: DecisionReadinessBreakdown = {
    competencyCoverage: competencyCoverageScore,
    evidenceQuality: evidenceQuality.overallScore,
    interviewerAlignment: interviewerAlignmentPercent,
    evidenceCompleteness,
    weights: DECISION_READINESS_WEIGHTS,
    topStrength: "",
    topRisk: "",
  };

  const score = weightedAverage([
    {
      score: breakdown.competencyCoverage,
      weight: DECISION_READINESS_WEIGHTS.competencyCoverage,
    },
    {
      score: breakdown.evidenceQuality,
      weight: DECISION_READINESS_WEIGHTS.evidenceQuality,
    },
    {
      score: breakdown.interviewerAlignment,
      weight: DECISION_READINESS_WEIGHTS.interviewerAlignment,
    },
    {
      score: breakdown.evidenceCompleteness,
      weight: DECISION_READINESS_WEIGHTS.evidenceCompleteness,
    },
  ]);

  const parts: Array<{ key: string; score: number; label: string }> = [
    {
      key: "competencyCoverage",
      score: breakdown.competencyCoverage,
      label: "Competency coverage",
    },
    {
      key: "evidenceQuality",
      score: breakdown.evidenceQuality,
      label: "Evidence quality",
    },
    {
      key: "interviewerAlignment",
      score: breakdown.interviewerAlignment,
      label: "Interviewer alignment",
    },
    {
      key: "evidenceCompleteness",
      score: breakdown.evidenceCompleteness,
      label: "Evidence completeness",
    },
  ];
  const sortedAsc = [...parts].sort((a, b) => a.score - b.score);
  const sortedDesc = [...parts].sort((a, b) => b.score - a.score);
  breakdown.topStrength = `${sortedDesc[0].label} (${sortedDesc[0].score}%)`;
  breakdown.topRisk = `${sortedAsc[0].label} (${sortedAsc[0].score}%)`;

  const label = readinessLabelFromScore(score);
  const subtitle =
    label === "Ready"
      ? "Evidence package supports a confident hiring debrief."
      : label === "Partially Ready"
        ? "Core evidence exists; clarify remaining gaps before deciding."
        : "Critical evidence gaps remain—debrief readiness is limited.";

  const coverageRatio = total > 0 ? covered / total : 0;
  const concernCount = interviewers.reduce(
    (s, i) => s + i.concerns.length,
    0
  );

  const coverageExplanation = buildCoverageExplanation({
    covered,
    total,
    partiallyCovered,
    missing,
  });
  const confidenceExplanation = buildConfidenceExplanation({
    score: evidenceQuality.overallScore,
    evidenceQuoteCount: supportingQuotes,
    highSeverityGaps,
    sourcesAnalyzed: evidenceQuality.sourcesAnalyzed,
    coverageRatio,
  });
  const alignmentExplanation = buildAlignmentExplanation({
    percent: interviewerAlignmentPercent,
    interviewerCount: interviewers.length,
    concernCount,
  });

  const readinessIncreased = parts
    .filter((p) => p.score >= 70)
    .map((p) => `${p.label} scored ${p.score}% and lifted readiness.`);
  const readinessReduced = parts
    .filter((p) => p.score < 60)
    .map((p) => `${p.label} scored ${p.score}% and reduced readiness.`);

  const readinessExplanation = {
    score,
    label,
    summary: subtitle,
    increasedBy:
      readinessIncreased.length > 0
        ? readinessIncreased
        : ["Evidence package was processed without major blockers."],
    reducedBy:
      readinessReduced.length > 0
        ? readinessReduced
        : highSeverityGaps > 0
          ? [`${highSeverityGaps} high-severity evidence gaps remain.`]
          : ["No major readiness reducers detected."],
  };

  const overallExplanation = `Decision Readiness is ${score}% (${label}). Weighted from competency coverage (${breakdown.competencyCoverage}%), evidence quality (${breakdown.evidenceQuality}%), interviewer alignment (${breakdown.interviewerAlignment}%), and evidence completeness (${breakdown.evidenceCompleteness}%). Top strength: ${breakdown.topStrength}. Top risk: ${breakdown.topRisk}.`;

  const confidence = evidenceQuality.overallScore;

  const missingDocs = detectMissingDocumentTypes(documents);
  const emptyStates = [
    ...emptyStateForMissingDocs(missingDocs),
    ...(competencies.length === 0
      ? ["No competencies could be derived from the job description."]
      : []),
    ...(evidenceMapping.length === 0
      ? ["No evidence quotes were mapped—analysis is limited to structural signals."]
      : []),
  ];

  const discussionTopics =
    raw.discussionTopics.length > 0
      ? raw.discussionTopics
      : gaps.slice(0, 5).map((g) => g.recommendedQuestion);

  return {
    decisionReadiness: {
      score: clampPercentage(safeRound(score)),
      label,
      subtitle,
    },
    decisionReadinessBreakdown: breakdown,
    overallExplanation,
    confidence,
    explanations: {
      decisionReadiness: readinessExplanation,
      confidence: {
        ...confidenceExplanation,
        summary: confidenceExplanation.summary,
      },
      coverage: {
        ...coverageExplanation,
        summary: coverageExplanation.summary,
      },
      alignment: {
        ...alignmentExplanation,
        summary: alignmentExplanation.summary,
      },
    },
    evidenceQuality: {
      label: evidenceQuality.label,
      sourcesAnalyzed: evidenceQuality.sourcesAnalyzed,
      overallScore: evidenceQuality.overallScore,
      supportingQuotes: evidenceQuality.supportingQuotes,
      missingEvidence: evidenceQuality.missingEvidence,
    },
    competencyCoverage: {
      covered,
      total: Math.max(total, competencies.length),
      partiallyCovered,
      missing,
      competencies,
    },
    coverageBreakdown: {
      covered,
      partiallyCovered,
      missing,
      total: Math.max(total, competencies.length),
    },
    interviewerAlignment: {
      percent: interviewerAlignmentPercent,
      label:
        interviewerAlignmentPercent >= 75
          ? "Strong panel alignment"
          : interviewerAlignmentPercent >= 55
            ? "Moderate panel alignment"
            : "Limited panel alignment",
      interviewers,
    },
    evidenceMapping,
    evidenceGaps: gaps,
    discussionTopics,
    timeline: buildRecruiterTimeline(documents, generatedAt, elapsedMs),
    emptyStates,
    metadata: {
      aiProvider,
      modelName,
      processingTimeMs: elapsedMs,
      processingTime: formatDurationMs(elapsedMs),
      documentsProcessed: documents.length,
      totalWords: countTotalWords(documents),
      evidenceCount: supportingQuotes,
      generatedAt,
      schemaVersion: SCHEMA_VERSION,
      promptVersion: PROMPT_VERSION,
    },
  };
}
