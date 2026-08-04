import type { AiIntelligenceResult } from "@/ai/output-schema";
import type { IngestedDocument } from "@/lib/ingestion/types";

/** Lifecycle status of a Decision Analysis (list / workflow). */
export type DecisionAnalysisStatus =
  | "needs_evidence"
  | "analyzed"
  | "ready_for_debrief";

/** Primary readiness verdict on the Decision Intelligence Dashboard. */
export type ReadinessLabel = "ready" | "partially_ready" | "not_ready";

export type CompetencyCriticality = "required" | "important" | "nice_to_have";

export type CoverageStatus =
  | "sufficient"
  | "partial"
  | "missing"
  | "conflicting";

export type EvidenceStrength = "strong" | "moderate" | "weak";

export type AssessmentLean =
  | "positive"
  | "mixed"
  | "negative"
  | "unclear";

export type ConflictNature =
  | "score_vs_score"
  | "score_vs_notes"
  | "notes_vs_notes";

export type FeedbackDepth = "high" | "medium" | "low";

export type NextActionType =
  | "proceed_to_debrief"
  | "add_evidence"
  | "resolve_conflict"
  | "request_clarification";

export interface InterviewFeedback {
  id: string;
  interviewerName: string;
  round: string;
  focus?: string;
  scores?: Record<string, number>;
  notes: string;
}

export interface EvidencePackage {
  jobDescription: string;
  resume: string;
  interviewFeedback: InterviewFeedback[];
}

export interface DecisionAnalysis {
  id: string;
  candidateName: string;
  roleTitle: string;
  status: DecisionAnalysisStatus;
  evidence: EvidencePackage;
  /** Legacy structured intelligence (seed / older pipeline). */
  intelligence: DecisionIntelligence | null;
  /** AI-generated Decision Intelligence used by Dashboard + Brief. */
  aiResult: AiIntelligenceResult | null;
  ingestedDocuments: IngestedDocument[];
  createdAt: string;
  updatedAt: string;
  evidenceUpdatedAt: string;
  analyzedAt: string | null;
}

export interface InterviewerEvidenceItem {
  interviewerName: string;
  round: string;
  score?: number;
  notesSummary: string;
  assessmentLean: AssessmentLean;
}

export interface CompetencyAssessment {
  id: string;
  name: string;
  criticality: CompetencyCriticality;
  coverageStatus: CoverageStatus;
  evidenceStrength: EvidenceStrength;
  interviewers: string[];
  scoreRange?: { min: number; max: number };
  notesSummary: string;
  blockerFlag: "gap" | "conflict" | "none";
  jdExpectation: string;
  evidenceByInterviewer: InterviewerEvidenceItem[];
  systemReading: string;
}

export interface EvidenceGap {
  competencyId: string;
  competencyName: string;
  criticality: CompetencyCriticality;
  evidenceFound: string;
  whatsMissing: string;
  suggestedNextStep: string;
}

export interface InterviewerConflict {
  competencyId: string;
  competencyName: string;
  interviewersInvolved: string[];
  nature: ConflictNature;
  disagreementSummary: string;
  suggestedResolution: string;
}

export interface EvidenceHealthSummary {
  competenciesRequired: number;
  competenciesCovered: number;
  competenciesWithGaps: number;
  conflictsDetected: number;
  interviewersRepresented: number;
  evidenceItemsAnalyzed: number;
}

export interface NextBestAction {
  type: NextActionType;
  title: string;
  reasons: string[];
  riskIfIgnored: string;
}

export interface InterviewerContribution {
  interviewerName: string;
  round: string;
  focus?: string;
  competenciesTouched: string[];
  feedbackDepth: FeedbackDepth;
  conflictsInvolved: number;
}

export interface DecisionBrief {
  readinessRestatement: string;
  strengthsWithEvidence: string[];
  risksAndOpenQuestions: string[];
  debriefAgenda: string[];
  disclaimer: string;
}

export interface AnalysisTransparency {
  evidenceSourcesUsed: string[];
  whatSystemDid: string[];
  whatSystemDidNotDo: string[];
  limitations: string[];
}

export interface DecisionIntelligence {
  readinessLabel: ReadinessLabel;
  readinessScore: number;
  verdict: string;
  confidenceNote: string;
  nextBestAction: NextBestAction;
  evidenceHealth: EvidenceHealthSummary;
  evidenceGaps: EvidenceGap[];
  conflicts: InterviewerConflict[];
  competencies: CompetencyAssessment[];
  interviewerContributions: InterviewerContribution[];
  decisionBrief: DecisionBrief;
  analysisTransparency: AnalysisTransparency;
  generatedAt: string;
}

export interface CreateDecisionAnalysisInput {
  candidateName: string;
  roleTitle: string;
}

export interface UpdateDecisionAnalysisInput {
  candidateName?: string;
  roleTitle?: string;
  evidence?: Partial<EvidencePackage>;
  status?: DecisionAnalysisStatus;
}

export type { AiIntelligenceResult } from "@/ai/output-schema";
export type { IngestedDocument } from "@/lib/ingestion/types";
