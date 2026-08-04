import { z } from "zod";

/**
 * Structured response schema for the AI Recruiting Copilot.
 * JSON only — never markdown.
 */

export const INSUFFICIENT_EVIDENCE_ANSWER =
  "There is insufficient evidence in the uploaded hiring documents to answer this question.";

export const copilotCitationSchema = z.object({
  document: z.string(),
  pageNumber: z.number().nullable(),
  section: z.string(),
  quote: z.string(),
});

export const copilotEvidenceConflictSchema = z.object({
  present: z.boolean(),
  title: z.string(),
  sideA: z.string(),
  sideB: z.string(),
  explanation: z.string(),
});

export const copilotResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number(),
  citations: z.array(copilotCitationSchema),
  relatedCompetencies: z.array(z.string()),
  limitations: z.string(),
  followUpQuestions: z.array(z.string()).min(0).max(5),
  evidenceConflict: copilotEvidenceConflictSchema,
});

export type CopilotCitation = z.infer<typeof copilotCitationSchema>;
export type CopilotEvidenceConflict = z.infer<
  typeof copilotEvidenceConflictSchema
>;
export type CopilotResponse = z.infer<typeof copilotResponseSchema>;

export interface CopilotConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotRequestBody {
  analysisId: string;
  userQuestion: string;
  conversationHistory?: CopilotConversationTurn[];
}

/** Groq / OpenAI JSON Schema (strict) for structured copilot answers. */
export const copilotJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "answer",
    "confidence",
    "citations",
    "relatedCompetencies",
    "limitations",
    "followUpQuestions",
    "evidenceConflict",
  ],
  properties: {
    answer: { type: "string" },
    confidence: { type: "number" },
    citations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["document", "pageNumber", "section", "quote"],
        properties: {
          document: { type: "string" },
          pageNumber: { type: ["number", "null"] },
          section: { type: "string" },
          quote: { type: "string" },
        },
      },
    },
    relatedCompetencies: {
      type: "array",
      items: { type: "string" },
    },
    limitations: { type: "string" },
    followUpQuestions: {
      type: "array",
      items: { type: "string" },
    },
    evidenceConflict: {
      type: "object",
      additionalProperties: false,
      required: ["present", "title", "sideA", "sideB", "explanation"],
      properties: {
        present: { type: "boolean" },
        title: { type: "string" },
        sideA: { type: "string" },
        sideB: { type: "string" },
        explanation: { type: "string" },
      },
    },
  },
} as const;

export const EXAMPLE_COPILOT_QUESTIONS = [
  "Why is leadership considered a gap?",
  "Summarize interview concerns.",
  "What evidence supports execution?",
  "Show all communication examples.",
  "Where does the candidate demonstrate product thinking?",
  "Which competencies have weak evidence?",
  "What should the hiring manager validate?",
  "Summarize interviewer disagreements.",
  "Show only Resume evidence.",
  "Show only Interview Notes evidence.",
] as const;

export const COPILOT_LOADING_STEPS = [
  "Searching Evidence",
  "Reading Resume",
  "Comparing Documents",
  "Generating Answer",
  "Finalizing Report",
] as const;
