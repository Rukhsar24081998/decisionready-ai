import { extractWithAI } from "@/lib/ai/extractors/base-extractor";
import {
  canonicalCompetencyPromptList,
  normalizeCompetencyList,
  normalizeCompetencyName,
  normalizeStringList,
} from "@/lib/ai/extractors/competency-normalize";
import {
  interviewExtractionSchema,
  type InterviewExtraction,
  type InterviewSignal,
} from "@/lib/ai/schemas/extraction-schema";

export interface ExtractInterviewInput {
  filename?: string;
  extractedText: string;
  /** @deprecated Prefer extractedText */
  text?: string;
}

/** Empty InterviewExtraction fallback — never crash the pipeline. */
export function createEmptyInterviewExtraction(): InterviewExtraction {
  return {
    positiveSignals: [],
    negativeSignals: [],
    behaviorExamples: [],
    quotes: [],
    competenciesObserved: [],
  };
}

function buildInterviewSystemPrompt(): string {
  return `
You are an expert interviewer.

Extract ONLY structured interview evidence.

Never score.
Never compare candidates.
Never recommend hiring.
Never infer information not supported by interview notes.
Return valid JSON only (a single object). No markdown.

JSON shape:
{
  "positiveSignals": [{ "topic": string, "quote": string }],
  "negativeSignals": [{ "topic": string, "quote": string }],
  "behaviorExamples": [{ "competency": string, "example": string }],
  "quotes": string[],
  "competenciesObserved": string[]
}

When naming competencies, prefer these canonical labels when applicable:
${canonicalCompetencyPromptList()}

Example: use "Stakeholder Management" NOT "Managing Stakeholders".

If a field is not present, use [].
`.trim();
}

function buildInterviewUserPrompt(input: {
  filename: string;
  extractedText: string;
}): string {
  return `
Extract structured interview evidence from these notes. Return JSON only.

filename: ${input.filename}

interviewNotesText:
"""
${input.extractedText.slice(0, 28000)}
"""
`.trim();
}

function normalizeSignals(signals: InterviewSignal[]): InterviewSignal[] {
  const seen = new Set<string>();
  const result: InterviewSignal[] = [];

  for (const signal of signals) {
    const topic = signal.topic.trim().replace(/\s+/g, " ");
    const quote = signal.quote.trim().replace(/\s+/g, " ");
    if (!topic && !quote) continue;
    const key = `${topic.toLowerCase()}|${quote.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ topic, quote });
  }

  return result;
}

function postProcessInterviewExtraction(
  data: InterviewExtraction
): InterviewExtraction {
  return {
    positiveSignals: normalizeSignals(data.positiveSignals),
    negativeSignals: normalizeSignals(data.negativeSignals),
    behaviorExamples: data.behaviorExamples
      .map((item) => ({
        competency: normalizeCompetencyName(item.competency),
        example: item.example.trim().replace(/\s+/g, " "),
      }))
      .filter((item) => item.competency && item.example)
      .filter((item, index, arr) => {
        const key = `${item.competency.toLowerCase()}|${item.example.toLowerCase()}`;
        return (
          arr.findIndex(
            (other) =>
              `${other.competency.toLowerCase()}|${other.example.toLowerCase()}` ===
              key
          ) === index
        );
      }),
    quotes: normalizeStringList(data.quotes),
    competenciesObserved: normalizeCompetencyList(data.competenciesObserved),
  };
}

/**
 * Extract structured interview evidence via the shared Base AI Extractor.
 * Not wired into /api/analyze yet. Never throws — returns empty on failure.
 */
export async function extractInterview(
  input: ExtractInterviewInput
): Promise<InterviewExtraction> {
  const extractedText = (input.extractedText || input.text || "").trim();
  const filename = input.filename?.trim() || "interview-notes";

  const result = await extractWithAI({
    documentText: extractedText,
    filename,
    systemPrompt: buildInterviewSystemPrompt(),
    userPrompt: buildInterviewUserPrompt({ filename, extractedText }),
    zodSchema: interviewExtractionSchema,
    emptyResultFactory: createEmptyInterviewExtraction,
    extractorName: "interview-extractor",
    postProcess: postProcessInterviewExtraction,
  });

  console.log(
    `Interview competencies extracted: ${result.competenciesObserved.length}`
  );

  return result;
}
