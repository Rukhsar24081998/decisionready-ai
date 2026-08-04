/**
 * Candidate Evidence Graph — single source of truth for hiring evidence.
 * Populated by extractors + mergeEvidence; consumed by the analysis pipeline.
 */

export type EvidenceDocumentType =
  | "job_description"
  | "resume"
  | "interview_notes"
  | "scorecard"
  | "hiring_manager_notes";

export type EvidenceConfidence = "low" | "medium" | "high";

export interface EvidenceSource {
  documentType: EvidenceDocumentType;
  documentName: string;
  pageNumber?: number;
  quote: string;
}

export interface CompetencyEvidence {
  name: string;
  sources: EvidenceSource[];
  confidence: EvidenceConfidence;
}

export interface InterviewerSignals {
  positive: string[];
  negative: string[];
}

export interface CandidateEvidenceGraph {
  candidate: {
    name: string;
    role: string;
  };
  competencies: CompetencyEvidence[];
  skills: string[];
  projects: string[];
  strengths: string[];
  concerns: string[];
  requiredCompetencies: string[];
  missingCompetencies: string[];
  interviewerSignals: InterviewerSignals;
}

/** Fully initialized empty evidence graph. */
export function createEmptyEvidenceGraph(): CandidateEvidenceGraph {
  return {
    candidate: {
      name: "",
      role: "",
    },
    competencies: [],
    skills: [],
    projects: [],
    strengths: [],
    concerns: [],
    requiredCompetencies: [],
    missingCompetencies: [],
    interviewerSignals: {
      positive: [],
      negative: [],
    },
  };
}
