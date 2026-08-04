import {
  normalizeCompetencyList,
  normalizeStringList,
  canonicalCompetencyPromptList,
} from "@/lib/ai/extractors/competency-normalize";
import { extractWithAI } from "@/lib/ai/extractors/base-extractor";
import {
  jobDescriptionExtractionSchema,
  type JobDescriptionExtraction,
} from "@/lib/ai/schemas/extraction-schema";

export interface ExtractJobDescriptionInput {
  filename?: string;
  extractedText: string;
  /** @deprecated Prefer extractedText */
  text?: string;
}

/** Empty JobDescriptionExtraction fallback — never crash the pipeline. */
export function createEmptyJobDescriptionExtraction(): JobDescriptionExtraction {
  return {
    role: "",
    department: "",
    requiredCompetencies: [],
    preferredCompetencies: [],
    requiredSkills: [],
    responsibilities: [],
    niceToHave: [],
  };
}

function buildJdSystemPrompt(): string {
  return `
You are an expert technical recruiter.

Your job is to extract structured information from a Job Description.

Rules:
- Extract facts only.
- Do not evaluate candidates.
- Do not compare resumes.
- Do not infer missing information.
- Do not calculate scores.
- Do not recommend hiring.
- Return valid JSON only (a single object). No markdown.

JSON shape:
{
  "role": string,
  "department": string,
  "requiredCompetencies": string[],
  "preferredCompetencies": string[],
  "requiredSkills": string[],
  "responsibilities": string[],
  "niceToHave": string[]
}

When naming competencies, prefer these canonical labels when applicable:
${canonicalCompetencyPromptList()}

Example: use "Stakeholder Management" NOT "Managing Stakeholders".

If a field is not present in the JD, use empty string or [].
`.trim();
}

function buildJdUserPrompt(input: {
  filename: string;
  extractedText: string;
}): string {
  return `
Extract structured information from this Job Description. Return JSON only.

filename: ${input.filename}

jobDescriptionText:
"""
${input.extractedText.slice(0, 28000)}
"""
`.trim();
}

/** Domain cleanup after Zod — normalize competencies, dedupe, sort. */
function postProcessJobDescriptionExtraction(
  data: JobDescriptionExtraction
): JobDescriptionExtraction {
  return {
    role: data.role.trim().replace(/\s+/g, " "),
    department: data.department.trim().replace(/\s+/g, " "),
    requiredCompetencies: normalizeCompetencyList(data.requiredCompetencies),
    preferredCompetencies: normalizeCompetencyList(data.preferredCompetencies),
    requiredSkills: normalizeStringList(data.requiredSkills),
    responsibilities: normalizeStringList(data.responsibilities),
    niceToHave: normalizeStringList(data.niceToHave),
  };
}

/**
 * Extract structured facts from a Job Description via the shared Base AI Extractor.
 * Not wired into /api/analyze yet. Never throws — returns empty on failure.
 */
export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<JobDescriptionExtraction> {
  const extractedText = (input.extractedText || input.text || "").trim();
  const filename = input.filename?.trim() || "job-description";

  const result = await extractWithAI({
    documentText: extractedText,
    filename,
    systemPrompt: buildJdSystemPrompt(),
    userPrompt: buildJdUserPrompt({ filename, extractedText }),
    zodSchema: jobDescriptionExtractionSchema,
    emptyResultFactory: createEmptyJobDescriptionExtraction,
    extractorName: "jd-extractor",
    postProcess: postProcessJobDescriptionExtraction,
  });

  console.log("Job Description extraction completed");
  console.log(`Required competencies: ${result.requiredCompetencies.length}`);
  console.log(`Preferred competencies: ${result.preferredCompetencies.length}`);
  console.log(`Responsibilities: ${result.responsibilities.length}`);

  return result;
}
