/**
 * Document Understanding extractors — production-ready, unwired.
 * Not connected to /api/analyze yet.
 */

export { extractWithAI, type ExtractWithAIOptions } from "@/lib/ai/extractors/base-extractor";

export {
  extractResume,
  createEmptyResumeExtraction,
  type ExtractResumeInput,
} from "@/lib/ai/extractors/resume-extractor";

export {
  extractJobDescription,
  createEmptyJobDescriptionExtraction,
  type ExtractJobDescriptionInput,
} from "@/lib/ai/extractors/jd-extractor";

export {
  extractInterview,
  createEmptyInterviewExtraction,
  type ExtractInterviewInput,
} from "@/lib/ai/extractors/interview-extractor";

export {
  extractScorecard,
  createEmptyScorecardExtraction,
  type ExtractScorecardInput,
} from "@/lib/ai/extractors/scorecard-extractor";

export {
  extractHiringManagerNotes,
  createEmptyHiringManagerExtraction,
  type ExtractHiringManagerNotesInput,
} from "@/lib/ai/extractors/manager-notes-extractor";

export type {
  ResumeExtraction,
  ResumeWorkExperience,
  ResumeProjectEvidence,
  ResumeCompetency,
  ResumeCompetencyEvidence,
  ResumeAchievement,
  JobDescriptionExtraction,
  InterviewExtraction,
  InterviewSignal,
  InterviewBehaviorExample,
  ScorecardExtraction,
  ScorecardRating,
  HiringManagerExtraction,
  DocumentExtraction,
  ExtractionDocumentType,
} from "@/lib/ai/schemas/extraction-schema";

export {
  resumeExtractionSchema,
  jobDescriptionExtractionSchema,
  interviewExtractionSchema,
  scorecardExtractionSchema,
  hiringManagerExtractionSchema,
} from "@/lib/ai/schemas/extraction-schema";

export {
  CANONICAL_COMPETENCIES,
  normalizeCompetencyName,
  normalizeCompetencyList,
  normalizeStringList,
} from "@/lib/ai/extractors/competency-normalize";
