import type { AiIntelligenceResult } from "@/ai/output-schema";
import { hydrateAiResult } from "@/lib/ai/hydrate-ai-result";
import { formatPercentage, normalizeConfidence } from "@/lib/ai/score-utils";
import { getDecisionAnalysis } from "@/lib/mock/store";
import type { DecisionAnalysis } from "@/lib/types";
import { buildCandidatePresentationProfile, getResumeTextFromAnalysis } from "@/components/intelligence/candidate-profile";
import {
  humanDocumentLabel,
  mergeStrengthsByCompetency,
  type MergedStrengthGroup,
} from "@/components/intelligence/presentation-utils";

export type GapSeverity = "High" | "Medium" | "Low";

export interface BriefStrength {
  competency: string;
  source: string;
  confidence: "High" | "Medium" | "Low";
  quote: string;
  pageNumber: number | null;
}

export interface BriefGap {
  text: string;
  title: string;
  severity: GapSeverity;
  whyItMatters: string;
  recommendedQuestion: string;
  estimatedDiscussionTime: string;
  relatedCompetency: string;
  coveragePercent: number | null;
  requiredByJd: boolean;
  evidenceFoundCount: number;
}

export interface InterviewerBrief {
  name: string;
  round: string;
  positives: string[];
  concerns: string[];
  confidence: number;
  consensus: string;
  supportingEvidence: string[];
}

export interface EvidenceAppendixGroup {
  category: string;
  items: string[];
  count: number;
}

export interface DecisionBriefData {
  analysisId: string;
  candidateName: string;
  roleTitle: string;
  department: string;
  experience: string;
  experienceYears: number | null;
  location: string;
  education: string;
  currentCompany: string;
  currentTitle: string;
  noticePeriod: string;
  expectedSalary: string;
  currentSalary: string;
  hiringStage: string;
  hiringManager: string;
  recruiter: string;
  applicationDate: string;
  generatedAt: string;
  readinessScore: number;
  readinessLabel: string;
  readinessExplanation: string;
  readinessBreakdown: {
    competencyCoverage: number;
    evidenceQuality: number;
    interviewerAlignment: number;
    evidenceCompleteness: number;
    topStrength: string;
    topRisk: string;
  };
  evidenceCoverage: string;
  interviewerAlignment: number;
  overallConfidence: number;
  executiveSummary: string;
  skills: string[];
  documentsAnalyzed: string[];
  projectsCount: number;
  achievementsCount: number;
  competenciesTotal: number;
  strengths: BriefStrength[];
  keyStrengths: MergedStrengthGroup[];
  evidenceGaps: BriefGap[];
  interviewers: InterviewerBrief[];
  discussionTopics: string[];
  evidenceSources: string[];
  evidenceAppendix: EvidenceAppendixGroup[];
  competencyScores: Record<string, number>;
  processingTime: string;
  version: string;
  aiConfidence: number;
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

function readOptionalString(
  source: Record<string, unknown> | undefined,
  key: string
): string {
  const value = source?.[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const joined = value.map(String).filter(Boolean).join(", ");
    if (joined) return joined;
  }
  return "";
}

function getResumeText(analysis: DecisionAnalysis): string {
  return getResumeTextFromAnalysis(analysis);
}

function countEvidenceForCompetency(
  ai: AiIntelligenceResult,
  competency: string
): number {
  if (!competency.trim()) return 0;

  const normalized = competency.trim().toLowerCase();
  const mappingCount = ai.evidenceMapping.filter(
    (row) => row.competency.trim().toLowerCase() === normalized
  ).length;

  if (mappingCount > 0) return mappingCount;

  const competencyRow = ai.competencyCoverage.competencies.find(
    (row) => row.name.trim().toLowerCase() === normalized
  );
  return competencyRow?.supportingQuotes?.length ?? 0;
}

function deriveGapCoveragePercent(
  ai: AiIntelligenceResult,
  relatedCompetency: string
): number | null {
  if (!relatedCompetency.trim()) return null;

  const normalized = relatedCompetency.trim().toLowerCase();
  const competency = ai.competencyCoverage.competencies.find(
    (row) => row.name.trim().toLowerCase() === normalized
  );
  if (!competency) return null;

  const score = normalizeConfidence(competency.score);
  return score < 70 ? score : null;
}

function isRequiredByJd(
  ai: AiIntelligenceResult,
  relatedCompetency: string
): boolean {
  if (!relatedCompetency.trim()) return false;
  const normalized = relatedCompetency.trim().toLowerCase();
  return ai.competencyCoverage.competencies.some(
    (row) => row.name.trim().toLowerCase() === normalized
  );
}

function buildEvidenceAppendix(
  ai: AiIntelligenceResult
): EvidenceAppendixGroup[] {
  const categories = [
    "Resume",
    "Interview Notes",
    "Scorecards",
    "Hiring Manager Notes",
    "Job Description",
  ] as const;

  const buckets = new Map<string, string[]>();
  for (const category of categories) {
    buckets.set(category, []);
  }

  const seen = new Set<string>();

  const register = (rawLabel: string) => {
    const original = rawLabel.trim();
    if (!original) return;
    const dedupeKey = original.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const label = humanDocumentLabel(original);
    let category: (typeof categories)[number] | null = null;
    if (/resume/i.test(label) || /resume|\bcv\b/i.test(original)) {
      category = "Resume";
    } else if (/hiring manager/i.test(label) || /hiring.?manager|hm.?notes/i.test(original)) {
      category = "Hiring Manager Notes";
    } else if (/scorecard/i.test(label) || /scorecard/i.test(original)) {
      category = "Scorecards";
    } else if (/job description/i.test(label) || /\bjd\b|job.?desc/i.test(original)) {
      category = "Job Description";
    } else if (/interview/i.test(label) || /interview|feedback/i.test(original)) {
      category = "Interview Notes";
    }

    if (!category) return;

    const items = buckets.get(category);
    if (!items) return;

    // Disambiguate when multiple originals collapse to the same human label
    const sameLabelCount = items.filter(
      (item) => humanDocumentLabel(item) === label || item.startsWith(`${label} (`)
    ).length;
    const display =
      sameLabelCount === 0
        ? label
        : original.toLowerCase() === label.toLowerCase()
          ? `${label} (${sameLabelCount + 1})`
          : original;
    items.push(display);
  };

  for (const doc of ai.decisionBrief.documentsAnalyzed) register(doc);
  for (const row of ai.evidenceMapping) {
    register(row.sourceDocument || row.source);
  }

  return categories
    .map((category) => {
      const items = [...(buckets.get(category) ?? [])];
      return {
        category,
        items,
        count: items.length,
      };
    })
    .filter((group) => group.count > 0);
}

function mapFromAiResult(
  analysis: DecisionAnalysis,
  ai: AiIntelligenceResult
): DecisionBriefData {
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
          relatedCompetency: g.relatedCompetency || "",
        }));

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

  const strengths = ai.decisionBrief.strengths.map((s) => ({
    competency: s.competency,
    source: s.source,
    confidence: s.confidence,
    quote: s.quote,
    pageNumber: s.pageNumber ?? null,
  }));

  const resumeText = getResumeText(analysis);
  const candidateExtra = ai.candidate as Record<string, unknown>;
  const metadataExtra = (ai.metadata ?? {}) as unknown as Record<string, unknown>;

  const candidateProfile = buildCandidatePresentationProfile({
    name: ai.candidate.name,
    roleApplied: ai.candidate.role,
    experienceRaw: ai.candidate.experience,
    location: readOptionalString(candidateExtra, "location"),
    education:
      readOptionalString(candidateExtra, "education") || undefined,
    recruiter:
      readOptionalString(metadataExtra, "recruiter") ||
      readOptionalString(candidateExtra, "recruiter"),
    hiringManager:
      readOptionalString(metadataExtra, "hiringManager") ||
      readOptionalString(candidateExtra, "hiringManager"),
    hiringStage:
      readOptionalString(metadataExtra, "hiringStage") ||
      readOptionalString(candidateExtra, "hiringStage"),
    noticePeriod: readOptionalString(candidateExtra, "noticePeriod"),
    expectedSalary: readOptionalString(candidateExtra, "expectedSalary"),
    currentSalary: readOptionalString(candidateExtra, "currentSalary"),
    skills: ai.decisionBrief.skills,
    resumeText,
  });

  const competencyScores = Object.fromEntries(
    ai.competencyCoverage.competencies.map((row) => [
      row.name,
      normalizeConfidence(row.score),
    ])
  );

  return {
    analysisId: analysis.id,
    candidateName: candidateProfile.name,
    roleTitle: ai.candidate.role,
    department: ai.candidate.department,
    experience: candidateProfile.experienceLabel ?? "—",
    experienceYears: candidateProfile.experienceYears,
    location: candidateProfile.location ?? "—",
    education: candidateProfile.education ?? "—",
    currentCompany: candidateProfile.currentRole.company ?? "—",
    currentTitle: candidateProfile.currentRole.title ?? "—",
    noticePeriod: candidateProfile.noticePeriod ?? "—",
    expectedSalary: candidateProfile.expectedSalary ?? "—",
    currentSalary: candidateProfile.currentSalary ?? "—",
    hiringStage: candidateProfile.hiringStage ?? "—",
    hiringManager: candidateProfile.hiringManager ?? "—",
    recruiter: candidateProfile.recruiter ?? "—",
    applicationDate: analysis.createdAt,
    generatedAt: ai.generatedAt || ai.metadata?.generatedAt || new Date().toISOString(),
    readinessScore: normalizeConfidence(ai.decisionReadiness.score),
    readinessLabel: ai.decisionReadiness.label,
    readinessExplanation:
      ai.overallExplanation ||
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
    evidenceCoverage: `${ai.coverageBreakdown?.covered ?? ai.competencyCoverage.covered} / ${ai.coverageBreakdown?.total ?? ai.competencyCoverage.total} competencies`,
    interviewerAlignment: normalizeConfidence(ai.interviewerAlignment.percent),
    overallConfidence: normalizeConfidence(ai.confidence),
    executiveSummary: ai.executiveSummary,
    skills:
      candidateProfile.skills.length > 0
        ? candidateProfile.skills
        : ai.decisionBrief.skills,
    documentsAnalyzed: [
      ...new Set(
        (ai.decisionBrief.documentsAnalyzed ?? [])
          .map((doc) => doc.trim())
          .filter(Boolean)
      ),
    ],
    projectsCount: candidateProfile.projectsCount,
    achievementsCount: strengths.length,
    competenciesTotal:
      ai.coverageBreakdown?.total ?? ai.competencyCoverage.total,
    strengths,
    keyStrengths: mergeStrengthsByCompetency(strengths),
    evidenceGaps: gaps.map((g) => ({
      text: g.text,
      title: g.title,
      severity: g.severity,
      whyItMatters: g.whyItMatters,
      recommendedQuestion: g.recommendedQuestion,
      estimatedDiscussionTime: g.estimatedDiscussionTime,
      relatedCompetency: g.relatedCompetency,
      coveragePercent: deriveGapCoveragePercent(ai, g.relatedCompetency),
      requiredByJd: isRequiredByJd(ai, g.relatedCompetency),
      evidenceFoundCount: countEvidenceForCompetency(ai, g.relatedCompetency),
    })),
    interviewers: ai.decisionBrief.interviewers.map((i) => ({
      name: i.name,
      round: i.round,
      positives: i.positives,
      concerns: i.concerns,
      confidence: normalizeConfidence(i.confidence),
      consensus: i.consensus,
      supportingEvidence: i.supportingEvidence ?? [],
    })),
    discussionTopics: ai.discussionTopics,
    evidenceSources: [
      ...new Set(
        (ai.decisionBrief.documentsAnalyzed ?? [])
          .map((doc) => doc.trim())
          .filter(Boolean)
      ),
    ],
    evidenceAppendix: buildEvidenceAppendix(ai),
    competencyScores,
    processingTime:
      ai.metadata?.processingTime || ai.decisionBrief.processingTime,
    version: ai.decisionBrief.version || ai.metadata?.schemaVersion || "v2.0",
    aiConfidence: normalizeConfidence(ai.confidence),
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
 * Load Decision Brief data from AI-generated Decision Intelligence only.
 */
export async function getDecisionBriefData(
  analysisId: string
): Promise<DecisionBriefData | null> {
  const analysis = await getDecisionAnalysis(analysisId);
  console.info("[brief-data] stage=get_brief", {
    analysisId,
    found: Boolean(analysis),
    hasAiResult: Boolean(analysis?.aiResult),
  });
  if (!analysis?.aiResult) return null;
  const ai = hydrateAiResult(
    analysis.aiResult,
    analysis.ingestedDocuments ?? []
  );
  return mapFromAiResult(analysis, ai);
}

export { formatPercentage, normalizeConfidence };
