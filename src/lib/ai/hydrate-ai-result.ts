import {
  DISCLAIMER,
  type AiIntelligenceLlmPayload,
  type AiIntelligenceResult,
} from "@/ai/output-schema";
import {
  runDecisionEngine,
  SCHEMA_VERSION,
  type DecisionEngineInput,
} from "@/lib/ai/decision-engine";
import type { IngestedDocument } from "@/lib/ingestion/types";
import { isPlainObject } from "@/lib/ai/default-intelligence";
import { normalizeConfidence } from "@/lib/ai/score-utils";

/**
 * Coerce stored / partial payloads into Schema A (lean LLM shape).
 */
function toLeanPayload(
  ai: Record<string, unknown>
): AiIntelligenceLlmPayload {
  const candidate = (ai.candidate ?? {}) as Record<string, unknown>;
  const competencyCoverage = (ai.competencyCoverage ?? {}) as Record<
    string,
    unknown
  >;
  const interviewerAlignment = (ai.interviewerAlignment ?? {}) as Record<
    string,
    unknown
  >;
  const decisionBrief = (ai.decisionBrief ?? {}) as Record<string, unknown>;

  const competencies = Array.isArray(competencyCoverage.competencies)
    ? competencyCoverage.competencies.filter(isPlainObject).map((c) => ({
        name: String(c.name ?? "Competency"),
        supportingQuotes: Array.isArray(c.supportingQuotes)
          ? c.supportingQuotes.map(String)
          : [],
        missingEvidence: Array.isArray(c.missingEvidence)
          ? c.missingEvidence.map(String)
          : [],
        confidenceReason: String(c.confidenceReason ?? ""),
      }))
    : [];

  const interviewers = Array.isArray(interviewerAlignment.interviewers)
    ? interviewerAlignment.interviewers.filter(isPlainObject).map((i) => ({
        name: String(i.name ?? "Interviewer"),
        role: String(i.role ?? "Interviewer"),
        strengths: Array.isArray(i.strengths) ? i.strengths.map(String) : [],
        concerns: Array.isArray(i.concerns) ? i.concerns.map(String) : [],
        consensus: String(i.consensus ?? ""),
        supportingEvidence: Array.isArray(i.supportingEvidence)
          ? i.supportingEvidence.map(String)
          : [],
      }))
    : [];

  const evidenceMapping = Array.isArray(ai.evidenceMapping)
    ? ai.evidenceMapping.filter(isPlainObject).map((row) => {
        const confidence =
          row.confidence === "High" ||
          row.confidence === "Medium" ||
          row.confidence === "Low"
            ? (row.confidence as "High" | "Medium" | "Low")
            : ("Medium" as const);
        return {
          competency: String(row.competency ?? ""),
          source: String(row.source ?? row.sourceDocument ?? "Unknown"),
          sourceDocument: String(row.sourceDocument ?? row.source ?? "Unknown"),
          pageNumber:
            typeof row.pageNumber === "number" || row.pageNumber === null
              ? (row.pageNumber as number | null)
              : null,
          section: String(row.section ?? ""),
          confidence,
          evidence: String(row.evidence ?? row.quote ?? ""),
        };
      })
    : [];

  const evidenceGaps = Array.isArray(ai.evidenceGaps)
    ? ai.evidenceGaps.filter(isPlainObject).map((gap) => {
        const severity =
          gap.severity === "High" ||
          gap.severity === "Medium" ||
          gap.severity === "Low"
            ? (gap.severity as "High" | "Medium" | "Low")
            : ("Medium" as const);
        return {
          title: String(gap.title ?? gap.text ?? "Evidence gap"),
          text: String(gap.text ?? gap.title ?? ""),
          severity,
          whyItMatters: String(gap.whyItMatters ?? gap.text ?? ""),
          recommendedQuestion: String(gap.recommendedQuestion ?? ""),
          estimatedDiscussionTime: String(
            gap.estimatedDiscussionTime ?? "3 minutes"
          ),
          relatedCompetency: String(gap.relatedCompetency ?? gap.title ?? ""),
        };
      })
    : [];

  const briefInterviewers = Array.isArray(decisionBrief.interviewers)
    ? decisionBrief.interviewers.filter(isPlainObject).map((i) => ({
        name: String(i.name ?? "Interviewer"),
        round: String(i.round ?? "Round"),
        positives: Array.isArray(i.positives) ? i.positives.map(String) : [],
        concerns: Array.isArray(i.concerns) ? i.concerns.map(String) : [],
        consensus: String(i.consensus ?? ""),
        supportingEvidence: Array.isArray(i.supportingEvidence)
          ? i.supportingEvidence.map(String)
          : [],
      }))
    : [];

  const strengths = Array.isArray(decisionBrief.strengths)
    ? decisionBrief.strengths.filter(isPlainObject).map((s) => {
        const confidence =
          s.confidence === "High" ||
          s.confidence === "Medium" ||
          s.confidence === "Low"
            ? (s.confidence as "High" | "Medium" | "Low")
            : ("Medium" as const);
        return {
          competency: String(s.competency ?? ""),
          source: String(s.source ?? ""),
          confidence,
          quote: String(s.quote ?? ""),
          pageNumber:
            typeof s.pageNumber === "number" || s.pageNumber === null
              ? (s.pageNumber as number | null)
              : null,
        };
      })
    : [];

  return {
    candidate: {
      name: String(candidate.name ?? "Candidate"),
      role: String(candidate.role ?? "Open Role"),
      department: String(candidate.department ?? ""),
      experience: String(candidate.experience ?? ""),
    },
    competencyCoverage: { competencies },
    interviewerAlignment: { interviewers },
    evidenceMapping,
    evidenceGaps,
    discussionTopics: Array.isArray(ai.discussionTopics)
      ? ai.discussionTopics.map(String)
      : [],
    executiveSummary: String(ai.executiveSummary ?? ""),
    decisionBrief: {
      strengths,
      interviewers: briefInterviewers,
      skills: Array.isArray(decisionBrief.skills)
        ? decisionBrief.skills.map(String)
        : [],
      documentsAnalyzed: Array.isArray(decisionBrief.documentsAnalyzed)
        ? decisionBrief.documentsAnalyzed.map(String)
        : [],
    },
  };
}

function toEngineRaw(
  lean: AiIntelligenceLlmPayload
): DecisionEngineInput["raw"] {
  return {
    candidate: lean.candidate,
    competencyCoverage: lean.competencyCoverage,
    interviewerAlignment: lean.interviewerAlignment,
    evidenceMapping: lean.evidenceMapping,
    evidenceGaps: lean.evidenceGaps,
    discussionTopics: lean.discussionTopics,
    executiveSummary: lean.executiveSummary,
    decisionBrief: lean.decisionBrief,
  };
}

/**
 * Assemble Schema B (full UI result) from Schema A + decision engine.
 */
export function buildAiIntelligenceResult(
  lean: AiIntelligenceLlmPayload,
  documents: IngestedDocument[],
  options?: { modelName?: string; elapsedMs?: number; aiProvider?: string }
): AiIntelligenceResult {
  const elapsedMs = options?.elapsedMs ?? 1000;
  const modelName = options?.modelName ?? "unknown";

  const engine = runDecisionEngine({
    raw: toEngineRaw(lean),
    documents,
    elapsedMs,
    modelName,
    aiProvider: options?.aiProvider ?? "Groq",
  });

  return {
    candidate: lean.candidate,
    decisionReadiness: engine.decisionReadiness,
    confidence: engine.confidence,
    evidenceQuality: {
      label: engine.evidenceQuality.label,
      sourcesAnalyzed: engine.evidenceQuality.sourcesAnalyzed,
      overallScore: engine.evidenceQuality.overallScore,
      supportingQuotesCount: engine.evidenceQuality.supportingQuotes,
      missingEvidenceCount: engine.evidenceQuality.missingEvidence,
    },
    competencyCoverage: {
      covered: engine.competencyCoverage.covered,
      total: engine.competencyCoverage.total,
      competencies: engine.competencyCoverage.competencies.map((c) => ({
        name: c.name,
        score: c.score,
        evidenceCount: c.evidenceCount,
        supportingQuotes: c.supportingQuotes,
        missingEvidence: c.missingEvidence,
        confidenceReason: c.confidenceReason,
      })),
    },
    interviewerAlignment: {
      percent: engine.interviewerAlignment.percent,
      label: engine.interviewerAlignment.label,
      interviewers: engine.interviewerAlignment.interviewers.map((i) => ({
        name: i.name,
        percent: i.percent,
        role: i.role,
        strengths: i.strengths,
        concerns: i.concerns,
        consensus: i.consensus,
        supportingEvidence: i.supportingEvidence,
      })),
    },
    evidenceMapping: engine.evidenceMapping.map((row) => ({
      competency: row.competency,
      source: row.source,
      sourceDocument: row.sourceDocument,
      pageNumber: row.pageNumber,
      section: row.section ?? "",
      confidence: row.confidence,
      evidence: row.evidence,
    })),
    evidenceGaps: engine.evidenceGaps.map((gap) => ({
      title: gap.title,
      text: gap.text,
      severity: gap.severity,
      whyItMatters: gap.whyItMatters,
      recommendedQuestion: gap.recommendedQuestion,
      estimatedDiscussionTime: gap.estimatedDiscussionTime,
      relatedCompetency: gap.relatedCompetency,
    })),
    discussionTopics: engine.discussionTopics,
    timeline: engine.timeline.map((t) => ({ label: t.label })),
    executiveSummary: lean.executiveSummary,
    explanations: {
      decisionReadiness: engine.overallExplanation,
      confidence: engine.explanations.confidence.summary,
      coverage: engine.explanations.coverage.summary,
      alignment: engine.explanations.alignment.summary,
    },
    decisionBrief: {
      strengths: lean.decisionBrief.strengths.map((s) => ({
        ...s,
        pageNumber: s.pageNumber ?? null,
      })),
      interviewers: engine.interviewerAlignment.interviewers.map((i) => ({
        name: i.name,
        round: i.role,
        positives: i.strengths,
        concerns: i.concerns,
        confidence: i.confidence,
        consensus: i.consensus,
        supportingEvidence: i.supportingEvidence,
      })),
      skills: lean.decisionBrief.skills,
      documentsAnalyzed:
        lean.decisionBrief.documentsAnalyzed.length > 0
          ? lean.decisionBrief.documentsAnalyzed
          : documents.map((d) => d.documentType),
      processingTime: engine.metadata.processingTime,
      version: SCHEMA_VERSION,
      disclaimer: DISCLAIMER,
    },
    generatedAt: engine.metadata.generatedAt,
    analysisTimeMs: engine.metadata.processingTimeMs,
    decisionReadinessBreakdown: engine.decisionReadinessBreakdown,
    overallExplanation: engine.overallExplanation,
    coverageBreakdown: engine.coverageBreakdown,
    explanationsDetail: engine.explanations,
    emptyStates: engine.emptyStates,
    metadata: engine.metadata,
    normalizedCompetencies: engine.competencyCoverage.competencies,
    normalizedEvidenceMapping: engine.evidenceMapping,
    normalizedEvidenceGaps: engine.evidenceGaps,
    normalizedInterviewers: engine.interviewerAlignment.interviewers,
    normalizedTimeline: engine.timeline,
  };
}

/**
 * Ensure AI result has Schema B fields. Safe for lean LLM payloads and legacy stores.
 */
export function hydrateAiResult(
  ai: AiIntelligenceResult | AiIntelligenceLlmPayload | Record<string, unknown>,
  documents: IngestedDocument[] = [],
  options?: { modelName?: string; elapsedMs?: number }
): AiIntelligenceResult {
  const record = ai as Record<string, unknown>;
  const hasEngine =
    record.decisionReadinessBreakdown &&
    record.metadata &&
    record.normalizedCompetencies;

  if (hasEngine) {
    const existing = ai as AiIntelligenceResult;
    return {
      ...existing,
      confidence: normalizeConfidence(existing.confidence),
      decisionReadiness: {
        ...existing.decisionReadiness,
        score: normalizeConfidence(existing.decisionReadiness.score),
      },
      interviewerAlignment: {
        ...existing.interviewerAlignment,
        percent: normalizeConfidence(existing.interviewerAlignment.percent),
        interviewers: existing.interviewerAlignment.interviewers.map((i) => ({
          ...i,
          percent: normalizeConfidence(i.percent),
        })),
      },
      competencyCoverage: {
        ...existing.competencyCoverage,
        competencies: existing.competencyCoverage.competencies.map((c) => ({
          ...c,
          score: normalizeConfidence(c.score),
        })),
      },
      decisionBrief: {
        ...existing.decisionBrief,
        disclaimer: DISCLAIMER,
        interviewers: existing.decisionBrief.interviewers.map((i) => ({
          ...i,
          confidence: normalizeConfidence(i.confidence),
        })),
      },
    };
  }

  const lean = toLeanPayload(record);
  return buildAiIntelligenceResult(lean, documents, options);
}
