import { extractWithAI } from "@/lib/ai/extractors/base-extractor";
import { normalizeStringList } from "@/lib/ai/extractors/competency-normalize";
import {
  hiringManagerExtractionSchema,
  type HiringManagerExtraction,
} from "@/lib/ai/schemas/extraction-schema";

export interface ExtractHiringManagerNotesInput {
  filename?: string;
  extractedText: string;
  /** @deprecated Prefer extractedText */
  text?: string;
}

/** Empty HiringManagerExtraction fallback — never crash the pipeline. */
export function createEmptyHiringManagerExtraction(): HiringManagerExtraction {
  return {
    decisionFactors: [],
    risks: [],
    missingEvidence: [],
    discussionPoints: [],
  };
}

function buildManagerNotesSystemPrompt(): string {
  return `
You are an expert hiring manager note taker.

Extract ONLY factual hiring-manager notes.

Rules:
- Facts only.
- No summaries.
- No recommendations.
- Do not score.
- Do not compare candidates.
- Do not recommend hiring.
- Do not infer information not supported by the notes.
- Return valid JSON only (a single object). No markdown.

JSON shape:
{
  "decisionFactors": string[],
  "risks": string[],
  "missingEvidence": string[],
  "discussionPoints": string[]
}

If a field is not present, use [].
`.trim();
}

function buildManagerNotesUserPrompt(input: {
  filename: string;
  extractedText: string;
}): string {
  return `
Extract structured hiring manager notes. Return JSON only.

filename: ${input.filename}

hiringManagerNotesText:
"""
${input.extractedText.slice(0, 28000)}
"""
`.trim();
}

function postProcessHiringManagerExtraction(
  data: HiringManagerExtraction
): HiringManagerExtraction {
  return {
    decisionFactors: normalizeStringList(data.decisionFactors),
    risks: normalizeStringList(data.risks),
    missingEvidence: normalizeStringList(data.missingEvidence),
    discussionPoints: normalizeStringList(data.discussionPoints),
  };
}

/**
 * Extract structured hiring manager notes via the shared Base AI Extractor.
 * Not wired into /api/analyze yet. Never throws — returns empty on failure.
 */
export async function extractHiringManagerNotes(
  input: ExtractHiringManagerNotesInput
): Promise<HiringManagerExtraction> {
  const extractedText = (input.extractedText || input.text || "").trim();
  const filename = input.filename?.trim() || "hiring-manager-notes";

  const result = await extractWithAI({
    documentText: extractedText,
    filename,
    systemPrompt: buildManagerNotesSystemPrompt(),
    userPrompt: buildManagerNotesUserPrompt({ filename, extractedText }),
    zodSchema: hiringManagerExtractionSchema,
    emptyResultFactory: createEmptyHiringManagerExtraction,
    extractorName: "manager-notes-extractor",
    postProcess: postProcessHiringManagerExtraction,
  });

  console.log(`Hiring manager risks extracted: ${result.risks.length}`);

  return result;
}
