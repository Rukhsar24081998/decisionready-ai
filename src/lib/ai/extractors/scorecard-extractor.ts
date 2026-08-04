import { extractWithAI } from "@/lib/ai/extractors/base-extractor";
import {
  canonicalCompetencyPromptList,
  normalizeCompetencyName,
  normalizeStringList,
} from "@/lib/ai/extractors/competency-normalize";
import {
  scorecardExtractionSchema,
  type ScorecardExtraction,
} from "@/lib/ai/schemas/extraction-schema";

export interface ExtractScorecardInput {
  filename?: string;
  extractedText: string;
  /** @deprecated Prefer extractedText */
  text?: string;
}

/** Empty ScorecardExtraction fallback — never crash the pipeline. */
export function createEmptyScorecardExtraction(): ScorecardExtraction {
  return {
    ratings: [],
    strengths: [],
    concerns: [],
  };
}

function buildScorecardSystemPrompt(): string {
  return `
You are an expert hiring interviewer reviewing interview scorecards.

Extract ONLY structured scorecard facts.

Rules:
- Do not invent ratings.
- Only extract values explicitly present in the scorecard.
- Do not score candidates beyond what is written.
- Do not compare candidates.
- Do not recommend hiring.
- Do not infer missing information.
- Return valid JSON only (a single object). No markdown.

JSON shape:
{
  "ratings": [{ "competency": string, "rating": number, "comments": string }],
  "strengths": string[],
  "concerns": string[]
}

When naming competencies, prefer these canonical labels when applicable:
${canonicalCompetencyPromptList()}

Example: use "Stakeholder Management" NOT "Managing Stakeholders".

If a field is not present, use [].
`.trim();
}

function buildScorecardUserPrompt(input: {
  filename: string;
  extractedText: string;
}): string {
  return `
Extract structured scorecard facts. Return JSON only.

filename: ${input.filename}

scorecardText:
"""
${input.extractedText.slice(0, 28000)}
"""
`.trim();
}

function postProcessScorecardExtraction(
  data: ScorecardExtraction
): ScorecardExtraction {
  const seenRatings = new Set<string>();
  const ratings: ScorecardExtraction["ratings"] = [];

  for (const rating of data.ratings) {
    const competency = normalizeCompetencyName(rating.competency);
    if (!competency) continue;
    if (!Number.isFinite(rating.rating)) continue;

    const comments = rating.comments.trim().replace(/\s+/g, " ");
    const key = `${competency.toLowerCase()}|${rating.rating}|${comments.toLowerCase()}`;
    if (seenRatings.has(key)) continue;
    seenRatings.add(key);

    ratings.push({
      competency,
      rating: rating.rating,
      comments,
    });
  }

  return {
    ratings,
    strengths: normalizeStringList(data.strengths),
    concerns: normalizeStringList(data.concerns),
  };
}

/**
 * Extract structured scorecard facts via the shared Base AI Extractor.
 * Not wired into /api/analyze yet. Never throws — returns empty on failure.
 */
export async function extractScorecard(
  input: ExtractScorecardInput
): Promise<ScorecardExtraction> {
  const extractedText = (input.extractedText || input.text || "").trim();
  const filename = input.filename?.trim() || "scorecard";

  const result = await extractWithAI({
    documentText: extractedText,
    filename,
    systemPrompt: buildScorecardSystemPrompt(),
    userPrompt: buildScorecardUserPrompt({ filename, extractedText }),
    zodSchema: scorecardExtractionSchema,
    emptyResultFactory: createEmptyScorecardExtraction,
    extractorName: "scorecard-extractor",
    postProcess: postProcessScorecardExtraction,
  });

  console.log(`Scorecard ratings extracted: ${result.ratings.length}`);

  return result;
}
