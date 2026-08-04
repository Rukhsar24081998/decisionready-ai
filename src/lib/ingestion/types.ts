export type DocumentType =
  | "Job Description"
  | "Resume"
  | "Interview Notes"
  | "Scorecards"
  | "Hiring Manager Notes";

export interface IngestedDocument {
  id: string;
  filename: string;
  documentType: DocumentType;
  extractedText: string;
}

export const DOCUMENT_TYPE_BY_FIELD = {
  jobDescription: "Job Description",
  resume: "Resume",
  interviewNotes: "Interview Notes",
  scorecards: "Scorecards",
  hiringManagerNotes: "Hiring Manager Notes",
} as const satisfies Record<string, DocumentType>;
