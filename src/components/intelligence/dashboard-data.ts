import type { AiIntelligenceResult } from "@/ai/output-schema";
import { hydrateAiResult } from "@/lib/ai/hydrate-ai-result";
import { formatPercentage, normalizeConfidence } from "@/lib/ai/score-utils";
import { getDecisionAnalysis } from "@/lib/mock/store";
import type { DecisionAnalysis } from "@/lib/types";
import {
  buildCandidatePresentationProfile,
  getResumeTextFromAnalysis,
} from "@/components/intelligence/candidate-profile";
import {
  confidenceLevelFromScore,
  humanDocumentLabel,
  matchDocumentColumn,
  mergeStrengthsByCompetency,
  type DocumentPresenceKey,
  type MergedStrength,
} from "@/components/intelligence/presentation-utils";

export interface CompetencyBar {
  name: string;
  score: number;
  evidenceCount: number;
  supportingQuotes: string[];
  missingEvidence: string[];
  confidenceReason: string;
  documentTypes: string[];
  confidenceLevel: "High" | "Medium" | "Low";
}

export interface EvidenceMappingRow {
  id: string;
  documentId: string;
  sourceType: DocumentPresenceKey | "Other";
  documentName: string;
  citation: string;
  competency: string;
  source: string;
  sourceLabel: string;
  confidence: "High" | "Medium" | "Low";
  confidencePercent: number;
  evidence?: string;
  pageNumber: number | null;
  section: string | null;
}

export interface InterviewerAlignmentRow {
  name: string;
  role: string;
  percent: number;
  strengths: string[];
  concerns: string[];
  consensus: string;
  supportingEvidence: string[];
}

export interface TimelineStep {
  label: string;
  timestamp?: string;
  status?: "completed" | "in_progress" | "pending";
  duration?: string;
}

export interface EvidenceGapRow {
  title: string;
  text: string;
  severity: "High" | "Medium" | "Low";
  whyItMatters: string;
  recommendedQuestion: string;
  estimatedDiscussionTime: string;
  relatedCompetency: string;
}

export interface ProcessingSummary {
  resumeCompetencies: number;
  skillsCount: number;
  achievementsApprox: number;
  interviewObservations: number;
  scorecardRatings: number;
  evidenceNodes: number;
  hiringManagerSignals: number;
  projectsCount: number;
}

export interface ReadinessWeights {
  competencyCoverage: number;
  evidenceQuality: number;
  interviewerAlignment: number;
  evidenceCompleteness: number;
}

export interface IntelligenceDashboardData {
  analysisId: string;
  candidateName: string;
  roleTitle: string;
  analyzedAt: string;
  department: string;
  experience: string;
  experienceYears: number | null;
  location: string;
  education: string;
  hiringStage: string;
  hiringManager: string;
  recruiter: string;
  skills: string[];
  currentCompany: string;
  currentTitle: string;
  noticePeriod: string;
  expectedSalary: string;
  currentSalary: string;
  applicationDate: string;
  keyStrengths: MergedStrength[];
  processingSummary: ProcessingSummary;
  readinessScore: number;
  readinessLabel: string;
  readinessSubtitle: string;
  readinessExplanation: string;
  readinessBreakdown: {
    competencyCoverage: number;
    evidenceQuality: number;
    interviewerAlignment: number;
    evidenceCompleteness: number;
    topStrength: string;
    topRisk: string;
  };
  readinessWeights: ReadinessWeights;
  competenciesCovered: number;
  competenciesTotal: number;
  competenciesPartial: number;
  competenciesMissing: number;
  coverageExplanation: string;
  interviewerAlignmentPercent: number;
  interviewerAlignmentLabel: string;
  alignmentExplanation: string;
  evidenceQualityLabel: string;
  evidenceQualityScore: number;
  evidenceSourcesCount: number;
  supportingQuotesCount: number;
  missingEvidenceCount: number;
  competencies: CompetencyBar[];
  evidenceMapping: EvidenceMappingRow[];
  evidenceGaps: string[];
  evidenceGapDetails: EvidenceGapRow[];
  interviewerAlignment: InterviewerAlignmentRow[];
  overallAgreement: number;
  timeline: TimelineStep[];
  discussionTopics: string[];
  aiConfidence: number;
  confidenceExplanation: string;
  evidenceSources: string[];
  analysisTime: string;
  version: string;
  reportStatus: string;
  executiveSummary: string;
  disclaimer: string;
  emptyStates: string[];
  metadata: {
    aiProvider: string;
    modelName: string;
    documentsProcessed: number;
    totalWords: number;
    evidenceCount: number;
    schemaVersion: string;
    promptVersion: string;
  };
}

function displayOrDash(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function countEvidenceByDocumentType(
  mapping: Array<{ source: string; sourceDocument?: string }>,
  pattern: RegExp
): number {
  return mapping.filter((row) => {
    const source = `${row.sourceDocument ?? ""} ${row.source}`;
    return pattern.test(source);
  }).length;
}

function documentTypesForCompetency(
  competencyName: string,
  mapping: Array<{ competency: string; source: string; sourceDocument?: string }>
): string[] {
  const labels = new Set<string>();
  for (const row of mapping) {
    if (row.competency !== competencyName) continue;
    labels.add(humanDocumentLabel(row.sourceDocument || row.source));
  }
  return [...labels];
}

function mapFromAiResult(
  analysisId: string,
  ai: AiIntelligenceResult,
  analysis?: DecisionAnalysis
): IntelligenceDashboardData {
  const competencies =
    ai.normalizedCompetencies?.length > 0
      ? ai.normalizedCompetencies
      : ai.competencyCoverage.competencies.map((c) => ({
          name: c.name,
          score: normalizeConfidence(c.score),
          confidence: normalizeConfidence(c.score),
          evidenceCount: c.evidenceCount ?? 0,
          supportingQuotes: c.supportingQuotes ?? [],
          missingEvidence: c.missingEvidence ?? [],
          confidenceReason: c.confidenceReason ?? "",
        }));

  const gaps =
    ai.normalizedEvidenceGaps?.length > 0
      ? ai.normalizedEvidenceGaps
      : ai.evidenceGaps.map((g) => ({
          title: g.title || g.text,
          text: g.text,
          severity: g.severity,
          whyItMatters: g.whyItMatters || g.text,
          recommendedQuestion: g.recommendedQuestion || "",
          estimatedDiscussionTime: g.estimatedDiscussionTime || "3 minutes",
          relatedCompetency: g.relatedCompetency || g.title || "",
        }));

  const interviewers =
    ai.normalizedInterviewers?.length > 0
      ? ai.normalizedInterviewers
      : ai.interviewerAlignment.interviewers.map((i) => ({
          name: i.name,
          role: i.role || "Interviewer",
          percent: normalizeConfidence(i.percent),
          confidence: normalizeConfidence(i.percent),
          strengths: i.strengths ?? [],
          concerns: i.concerns ?? [],
          consensus: i.consensus ?? ai.interviewerAlignment.label,
          supportingEvidence: i.supportingEvidence ?? [],
        }));

  const mapping =
    ai.normalizedEvidenceMapping?.length > 0
      ? ai.normalizedEvidenceMapping
      : ai.evidenceMapping.map((row) => ({
          competency: row.competency,
          source: row.source,
          sourceDocument: row.sourceDocument || row.source,
          pageNumber: row.pageNumber ?? null,
          section: row.section || null,
          confidence: row.confidence,
          confidencePercent:
            row.confidence === "High" ? 90 : row.confidence === "Medium" ? 70 : 45,
          evidence: row.evidence,
          quote: row.evidence,
        }));

  const timeline =
    ai.normalizedTimeline?.length > 0
      ? ai.normalizedTimeline
      : ai.timeline.map((t) => ({ label: t.label }));

  const breakdown = ai.decisionReadinessBreakdown ?? {
    competencyCoverage: 0,
    evidenceQuality: 0,
    interviewerAlignment: 0,
    evidenceCompleteness: 0,
    weights: {
      competencyCoverage: 0.4,
      evidenceQuality: 0.25,
      interviewerAlignment: 0.2,
      evidenceCompleteness: 0.15,
    },
    topStrength: "—",
    topRisk: "—",
  };

  const skills = ai.decisionBrief.skills ?? [];
  const strengths = ai.decisionBrief.strengths ?? [];

  const interviewObservations =
    interviewers.reduce(
      (sum, interviewer) => sum + (interviewer.supportingEvidence?.length ?? 0),
      0
    ) || ai.discussionTopics.length;

  const scorecardRatings =
    countEvidenceByDocumentType(mapping, /\bscorecard\b|\bscore.?card\b/i) ||
    ai.decisionBrief.interviewers.length;

  const hiringManagerSignals = countEvidenceByDocumentType(
    mapping,
    /\bhiring.?manager\b|\bmanager.?notes\b/i
  );

  const keyStrengths = mergeStrengthsByCompetency(
    strengths.map((s) => ({
      competency: s.competency,
      source: s.source,
      confidence: s.confidence,
      quote: s.quote,
      pageNumber: s.pageNumber ?? null,
    }))
  );

  const analysisRecord = analysis as
    | (DecisionAnalysis & {
        department?: string;
        hiringManager?: string;
        recruiter?: string;
        hiringStage?: string;
        location?: string;
        education?: string | string[];
        noticePeriod?: string;
        expectedSalary?: string;
        currentSalary?: string;
      })
    | undefined;

  const candidateProfile = buildCandidatePresentationProfile({
    name: ai.candidate.name,
    roleApplied: ai.candidate.role,
    experienceRaw: ai.candidate.experience,
    location: analysisRecord?.location,
    education: analysisRecord?.education,
    recruiter: analysisRecord?.recruiter,
    hiringManager: analysisRecord?.hiringManager,
    hiringStage: analysisRecord?.hiringStage,
    noticePeriod: analysisRecord?.noticePeriod,
    expectedSalary: analysisRecord?.expectedSalary,
    currentSalary: analysisRecord?.currentSalary,
    skills,
    resumeText: getResumeTextFromAnalysis(analysis ?? {}),
  });

  return {
    analysisId,
    candidateName: candidateProfile.name,
    roleTitle: ai.candidate.role,
    analyzedAt: ai.generatedAt || ai.metadata?.generatedAt || new Date().toISOString(),
    department: displayOrDash(ai.candidate.department || analysisRecord?.department),
    experience: candidateProfile.experienceLabel ?? "—",
    experienceYears: candidateProfile.experienceYears,
    location: candidateProfile.location ?? "—",
    education: candidateProfile.education ?? "—",
    hiringStage: candidateProfile.hiringStage ?? "—",
    hiringManager: candidateProfile.hiringManager ?? "—",
    recruiter: candidateProfile.recruiter ?? "—",
    skills: candidateProfile.skills.length > 0 ? candidateProfile.skills : skills,
    currentCompany: candidateProfile.currentRole.company ?? "—",
    currentTitle: candidateProfile.currentRole.title ?? "—",
    noticePeriod: candidateProfile.noticePeriod ?? "—",
    expectedSalary: candidateProfile.expectedSalary ?? "—",
    currentSalary: candidateProfile.currentSalary ?? "—",
    applicationDate: analysis?.createdAt ?? analysis?.analyzedAt ?? new Date().toISOString(),
    keyStrengths,
    processingSummary: {
      resumeCompetencies: competencies.length,
      skillsCount: (candidateProfile.skills.length > 0 ? candidateProfile.skills : skills).length,
      achievementsApprox: strengths.length,
      interviewObservations,
      scorecardRatings,
      evidenceNodes: mapping.length,
      hiringManagerSignals,
      projectsCount: candidateProfile.projectsCount,
    },
    readinessScore: normalizeConfidence(ai.decisionReadiness.score),
    readinessLabel: ai.decisionReadiness.label,
    readinessSubtitle: ai.decisionReadiness.subtitle,
    readinessExplanation:
      ai.overallExplanation ||
      ai.explanationsDetail?.decisionReadiness.summary ||
      ai.explanations?.decisionReadiness ||
      ai.decisionReadiness.subtitle,
    readinessBreakdown: {
      competencyCoverage: normalizeConfidence(breakdown.competencyCoverage),
      evidenceQuality: normalizeConfidence(breakdown.evidenceQuality),
      interviewerAlignment: normalizeConfidence(breakdown.interviewerAlignment),
      evidenceCompleteness: normalizeConfidence(breakdown.evidenceCompleteness),
      topStrength: breakdown.topStrength,
      topRisk: breakdown.topRisk,
    },
    readinessWeights: {
      competencyCoverage: breakdown.weights?.competencyCoverage ?? 0.4,
      evidenceQuality: breakdown.weights?.evidenceQuality ?? 0.25,
      interviewerAlignment: breakdown.weights?.interviewerAlignment ?? 0.2,
      evidenceCompleteness: breakdown.weights?.evidenceCompleteness ?? 0.15,
    },
    competenciesCovered:
      ai.coverageBreakdown?.covered ?? ai.competencyCoverage.covered,
    competenciesTotal:
      ai.coverageBreakdown?.total ?? ai.competencyCoverage.total,
    competenciesPartial: ai.coverageBreakdown?.partiallyCovered ?? 0,
    competenciesMissing: ai.coverageBreakdown?.missing ?? 0,
    coverageExplanation:
      ai.explanationsDetail?.coverage.summary ||
      ai.explanations?.coverage ||
      `${ai.competencyCoverage.covered} / ${ai.competencyCoverage.total} competencies covered`,
    interviewerAlignmentPercent: normalizeConfidence(
      ai.interviewerAlignment.percent
    ),
    interviewerAlignmentLabel: ai.interviewerAlignment.label,
    alignmentExplanation:
      ai.explanationsDetail?.alignment.summary ||
      ai.explanations?.alignment ||
      ai.interviewerAlignment.label,
    evidenceQualityLabel: ai.evidenceQuality.label,
    evidenceQualityScore: normalizeConfidence(
      ai.evidenceQuality.overallScore ?? 0
    ),
    evidenceSourcesCount: ai.evidenceQuality.sourcesAnalyzed,
    supportingQuotesCount:
      ai.evidenceQuality.supportingQuotesCount ??
      ai.metadata?.evidenceCount ??
      0,
    missingEvidenceCount: ai.evidenceQuality.missingEvidenceCount ?? 0,
    competencies: competencies.map((c) => {
      const score = normalizeConfidence(c.score);
      return {
        name: c.name,
        score,
        evidenceCount: c.evidenceCount,
        supportingQuotes: c.supportingQuotes,
        missingEvidence: c.missingEvidence,
        confidenceReason: c.confidenceReason,
        documentTypes: documentTypesForCompetency(c.name, mapping),
        confidenceLevel: confidenceLevelFromScore(score),
      };
    }),
    evidenceMapping: mapping.map((row, index) => {
      const source = (row.sourceDocument || row.source || "").trim() || "Document";
      const sourceLabel = humanDocumentLabel(source);
      const citation = (row.evidence || row.quote || "").trim();
      return {
        id: `evidence-${index}-${row.competency}-${source}`,
        documentId: source,
        sourceType: matchDocumentColumn(sourceLabel) ?? "Other",
        documentName: sourceLabel,
        citation,
        competency: row.competency,
        source,
        sourceLabel,
        confidence: row.confidence,
        confidencePercent: normalizeConfidence(row.confidencePercent),
        evidence: citation || undefined,
        pageNumber: row.pageNumber,
        section: row.section,
      };
    }),
    evidenceGaps: gaps.map((g) => {
      const ask = g.recommendedQuestion
        ? ` Ask: ${g.recommendedQuestion}`
        : "";
      const time = g.estimatedDiscussionTime
        ? ` (${g.estimatedDiscussionTime})`
        : "";
      return `${g.title} [${g.severity}] — ${g.whyItMatters}.${ask}${time}`;
    }),
    evidenceGapDetails: gaps,
    interviewerAlignment: interviewers.map((i) => ({
      name: i.name,
      role: i.role,
      percent: normalizeConfidence(i.percent),
      strengths: i.strengths,
      concerns: i.concerns,
      consensus: i.consensus,
      supportingEvidence: i.supportingEvidence,
    })),
    overallAgreement: normalizeConfidence(ai.interviewerAlignment.percent),
    timeline,
    discussionTopics: ai.discussionTopics,
    aiConfidence: normalizeConfidence(ai.confidence),
    confidenceExplanation:
      ai.explanationsDetail?.confidence.summary ||
      ai.explanations?.confidence ||
      "Confidence in evidence coverage quality—not hire confidence.",
    evidenceSources: [
      ...new Set(
        (ai.decisionBrief.documentsAnalyzed ?? [])
          .map((doc) => doc.trim())
          .filter(Boolean)
      ),
    ],
    analysisTime:
      ai.metadata?.processingTime || ai.decisionBrief.processingTime,
    version: ai.decisionBrief.version || ai.metadata?.schemaVersion || "v2.0",
    reportStatus: "Final",
    executiveSummary: ai.executiveSummary,
    disclaimer: ai.decisionBrief.disclaimer,
    emptyStates: ai.emptyStates ?? [],
    metadata: {
      aiProvider: ai.metadata?.aiProvider ?? "Groq",
      modelName: ai.metadata?.modelName ?? "—",
      documentsProcessed:
        ai.metadata?.documentsProcessed ??
        ai.decisionBrief.documentsAnalyzed.length,
      totalWords: ai.metadata?.totalWords ?? 0,
      evidenceCount: ai.metadata?.evidenceCount ?? 0,
      schemaVersion: ai.metadata?.schemaVersion ?? "2.0.0",
      promptVersion: ai.metadata?.promptVersion ?? "2.0.0",
    },
  };
}

/**
 * Load Dashboard data from AI-generated Decision Intelligence only.
 * Returns null when no AI result exists for the analysis.
 */
export function getIntelligenceDashboardData(
  analysisId: string
): IntelligenceDashboardData | null {
  const analysis = getDecisionAnalysis(analysisId);
  if (!analysis?.aiResult) return null;
  const ai = hydrateAiResult(
    analysis.aiResult,
    analysis.ingestedDocuments ?? []
  );
  return mapFromAiResult(analysis.id, ai, analysis);
}

/** Re-export for UI percentage formatting. */
export { formatPercentage, normalizeConfidence };
