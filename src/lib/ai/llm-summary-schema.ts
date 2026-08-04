/**
 * Schema for the small narrative LLM pass.
 * Only executiveSummary, discussionTopics, and decisionBrief strengths.
 */

import { z } from "zod";

export const llmNarrativeSummarySchema = z.object({
  executiveSummary: z.string(),
  discussionTopics: z.array(z.string()),
  decisionBrief: z.object({
    strengths: z.array(
      z.object({
        competency: z.string(),
        source: z.string(),
        confidence: z.enum(["High", "Medium", "Low"]),
        quote: z.string(),
        pageNumber: z.number().nullable(),
      })
    ),
  }),
});

export type LlmNarrativeSummary = z.infer<typeof llmNarrativeSummarySchema>;

export function createEmptyLlmNarrativeSummary(): LlmNarrativeSummary {
  return {
    executiveSummary: "",
    discussionTopics: [],
    decisionBrief: {
      strengths: [],
    },
  };
}
