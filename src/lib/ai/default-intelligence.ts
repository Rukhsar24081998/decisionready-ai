import {
  DISCLAIMER,
  aiIntelligenceLlmSchema,
  type AiIntelligenceLlmPayload,
} from "@/ai/output-schema";

const TOP_LEVEL_KEYS = [
  "candidate",
  "competencyCoverage",
  "interviewerAlignment",
  "evidenceMapping",
  "evidenceGaps",
  "discussionTopics",
  "executiveSummary",
  "decisionBrief",
] as const;

export type TopLevelKey = (typeof TOP_LEVEL_KEYS)[number];
export { TOP_LEVEL_KEYS };

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Complete Schema A defaults — qualitative sections only.
 */
export function createDefaultAiIntelligencePayload(options?: {
  candidateName?: string;
  roleTitle?: string;
  department?: string;
  documentTypes?: string[];
}): AiIntelligenceLlmPayload {
  const documentsAnalyzed = options?.documentTypes ?? [];

  return {
    candidate: {
      name: options?.candidateName?.trim() || "Candidate",
      role: options?.roleTitle?.trim() || "Open Role",
      department: options?.department?.trim() || "",
      experience: "",
    },
    competencyCoverage: {
      competencies: [],
    },
    interviewerAlignment: {
      interviewers: [],
    },
    evidenceMapping: [],
    evidenceGaps: [],
    discussionTopics: [],
    executiveSummary: "",
    decisionBrief: {
      strengths: [],
      interviewers: [],
      skills: [],
      documentsAnalyzed,
    },
  };
}

function coerceString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function coerceConfidenceLabel(
  value: unknown
): "High" | "Medium" | "Low" {
  if (value === "High" || value === "Medium" || value === "Low") return value;
  return "Medium";
}

function coerceSeverity(value: unknown): "High" | "Medium" | "Low" {
  if (value === "High" || value === "Medium" || value === "Low") return value;
  return "Medium";
}

/**
 * Deep-merge LLM output onto defaults.
 */
export function deepMerge<T>(defaults: T, override: unknown): T {
  if (override === undefined || override === null) {
    return defaults;
  }

  if (Array.isArray(defaults)) {
    return (Array.isArray(override) ? override : defaults) as T;
  }

  if (isPlainObject(defaults)) {
    if (!isPlainObject(override)) {
      return defaults;
    }

    const result: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(defaults as object)) {
      const defaultValue = (defaults as Record<string, unknown>)[key];
      const overrideValue = override[key];

      if (overrideValue === undefined) continue;

      if (overrideValue === null) {
        if (
          defaultValue === null ||
          typeof defaultValue === "number" ||
          typeof defaultValue === "string"
        ) {
          result[key] = overrideValue;
        }
        continue;
      }

      result[key] = deepMerge(defaultValue, overrideValue);
    }

    for (const key of Object.keys(override)) {
      if (!(key in result)) {
        result[key] = override[key];
      }
    }

    return result as T;
  }

  if (typeof defaults === "number") {
    return (typeof override === "number" && Number.isFinite(override)
      ? override
      : defaults) as T;
  }
  if (typeof defaults === "string") {
    return (typeof override === "string" ? override : defaults) as T;
  }
  if (typeof defaults === "boolean") {
    return (typeof override === "boolean" ? override : defaults) as T;
  }

  return override as T;
}

function coercePayloadShapes(
  payload: AiIntelligenceLlmPayload
): AiIntelligenceLlmPayload {
  return {
    candidate: {
      name: coerceString(payload.candidate.name, "Candidate"),
      role: coerceString(payload.candidate.role, "Open Role"),
      department: coerceString(payload.candidate.department),
      experience: coerceString(payload.candidate.experience),
    },
    competencyCoverage: {
      competencies: (payload.competencyCoverage?.competencies ?? [])
        .filter(isPlainObject)
        .map((item) => ({
          name: coerceString(item.name, "Competency"),
          supportingQuotes: Array.isArray(item.supportingQuotes)
            ? item.supportingQuotes.map((q) => coerceString(q)).filter(Boolean)
            : [],
          missingEvidence: Array.isArray(item.missingEvidence)
            ? item.missingEvidence.map((q) => coerceString(q)).filter(Boolean)
            : [],
          confidenceReason: coerceString(item.confidenceReason),
        })),
    },
    interviewerAlignment: {
      interviewers: (payload.interviewerAlignment?.interviewers ?? [])
        .filter(isPlainObject)
        .map((item) => ({
          name: coerceString(item.name, "Interviewer"),
          role: coerceString(item.role, "Interviewer"),
          strengths: Array.isArray(item.strengths)
            ? item.strengths.map((s) => coerceString(s)).filter(Boolean)
            : [],
          concerns: Array.isArray(item.concerns)
            ? item.concerns.map((s) => coerceString(s)).filter(Boolean)
            : [],
          consensus: coerceString(item.consensus),
          supportingEvidence: Array.isArray(item.supportingEvidence)
            ? item.supportingEvidence.map((s) => coerceString(s)).filter(Boolean)
            : [],
        })),
    },
    evidenceMapping: (payload.evidenceMapping ?? [])
      .filter(isPlainObject)
      .map((item) => ({
        competency: coerceString(item.competency),
        source: coerceString(item.source || item.sourceDocument, "Unknown"),
        sourceDocument: coerceString(
          item.sourceDocument || item.source,
          "Unknown"
        ),
        pageNumber:
          typeof item.pageNumber === "number" && item.pageNumber >= 1
            ? item.pageNumber
            : null,
        section: coerceString(item.section),
        confidence: coerceConfidenceLabel(item.confidence),
        evidence: coerceString(item.evidence),
      })),
    evidenceGaps: (payload.evidenceGaps ?? [])
      .filter(isPlainObject)
      .map((item) => ({
        title: coerceString(item.title || item.text, "Evidence gap"),
        text: coerceString(item.text || item.title),
        severity: coerceSeverity(item.severity),
        whyItMatters: coerceString(item.whyItMatters || item.text),
        recommendedQuestion: coerceString(item.recommendedQuestion),
        estimatedDiscussionTime: coerceString(
          item.estimatedDiscussionTime,
          "3 minutes"
        ),
        relatedCompetency: coerceString(item.relatedCompetency || item.title),
      })),
    discussionTopics: Array.isArray(payload.discussionTopics)
      ? payload.discussionTopics.map((t) => coerceString(t)).filter(Boolean)
      : [],
    executiveSummary: coerceString(payload.executiveSummary),
    decisionBrief: {
      strengths: (payload.decisionBrief?.strengths ?? [])
        .filter(isPlainObject)
        .map((item) => ({
          competency: coerceString(item.competency),
          source: coerceString(item.source),
          confidence: coerceConfidenceLabel(item.confidence),
          quote: coerceString(item.quote),
          pageNumber:
            typeof item.pageNumber === "number" && item.pageNumber >= 1
              ? item.pageNumber
              : null,
        })),
      interviewers: (payload.decisionBrief?.interviewers ?? [])
        .filter(isPlainObject)
        .map((item) => ({
          name: coerceString(item.name, "Interviewer"),
          round: coerceString(item.round, "Round"),
          positives: Array.isArray(item.positives)
            ? item.positives.map((s) => coerceString(s)).filter(Boolean)
            : [],
          concerns: Array.isArray(item.concerns)
            ? item.concerns.map((s) => coerceString(s)).filter(Boolean)
            : [],
          consensus: coerceString(item.consensus),
          supportingEvidence: Array.isArray(item.supportingEvidence)
            ? item.supportingEvidence.map((s) => coerceString(s)).filter(Boolean)
            : [],
        })),
      skills: Array.isArray(payload.decisionBrief?.skills)
        ? payload.decisionBrief.skills.map((s) => coerceString(s)).filter(Boolean)
        : [],
      documentsAnalyzed: Array.isArray(payload.decisionBrief?.documentsAnalyzed)
        ? payload.decisionBrief.documentsAnalyzed
            .map((s) => coerceString(s))
            .filter(Boolean)
        : [],
    },
  };
}

function wasProvidedByLlm(
  llm: Record<string, unknown> | null,
  key: TopLevelKey
): boolean {
  if (!llm) return false;
  if (!(key in llm)) return false;
  const value = llm[key];
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return true;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
}

export function findMissingTopLevelKeys(llmRaw: unknown): TopLevelKey[] {
  const llm = isPlainObject(llmRaw) ? llmRaw : null;
  return TOP_LEVEL_KEYS.filter((key) => !wasProvidedByLlm(llm, key));
}

export function computeCompletenessPercent(presentCount: number): number {
  const total = TOP_LEVEL_KEYS.length as number;
  if (total === 0) return 100;
  return Math.round((Math.max(0, presentCount) / total) * 100);
}

export function mergeRepairIntoOriginal(
  original: Record<string, unknown>,
  repairRaw: unknown,
  missingKeys: TopLevelKey[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...original };
  if (!isPlainObject(repairRaw)) return merged;

  const repairRoot =
    isPlainObject(repairRaw.missingFields) &&
    Object.keys(repairRaw.missingFields).length > 0
      ? (repairRaw.missingFields as Record<string, unknown>)
      : isPlainObject(repairRaw.data)
        ? (repairRaw.data as Record<string, unknown>)
        : repairRaw;

  for (const key of missingKeys) {
    if (!(key in repairRoot)) continue;
    const value = repairRoot[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim().length === 0) continue;
    if (isPlainObject(value) && Object.keys(value).length === 0) continue;
    merged[key] = value;
  }

  return merged;
}

export function extractRepairedKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  attempted: TopLevelKey[]
): TopLevelKey[] {
  return attempted.filter(
    (key) => !wasProvidedByLlm(before, key) && wasProvidedByLlm(after, key)
  );
}

export interface MergeAiIntelligenceResult {
  payload: AiIntelligenceLlmPayload;
  fromAi: TopLevelKey[];
  fromDefaults: TopLevelKey[];
  fromAiRepair: TopLevelKey[];
  initialCompletenessPercent: number;
}

/**
 * Merge Groq Schema A JSON with defaults, then Zod-validate Schema A.
 */
export function mergeAndValidateAiIntelligence(
  llmRaw: unknown,
  options?: {
    candidateName?: string;
    roleTitle?: string;
    department?: string;
    documentTypes?: string[];
    aiRepairedKeys?: TopLevelKey[];
    initialCompletenessPercent?: number;
  }
): MergeAiIntelligenceResult {
  const defaults = createDefaultAiIntelligencePayload(options);
  const llmRecord = isPlainObject(llmRaw) ? llmRaw : null;
  const aiRepaired = new Set(options?.aiRepairedKeys ?? []);

  const presentInitially = TOP_LEVEL_KEYS.filter((key) =>
    wasProvidedByLlm(llmRecord, key)
  ).length;
  const initialCompletenessPercent =
    options?.initialCompletenessPercent ??
    computeCompletenessPercent(presentInitially);

  const merged = coercePayloadShapes(
    deepMerge(defaults, llmRecord ?? {}) as AiIntelligenceLlmPayload
  );

  // Ensure documentsAnalyzed has uploads when LLM omitted them.
  if (
    merged.decisionBrief.documentsAnalyzed.length === 0 &&
    (options?.documentTypes?.length ?? 0) > 0
  ) {
    merged.decisionBrief.documentsAnalyzed = [...(options?.documentTypes ?? [])];
  }

  const fromAi: TopLevelKey[] = [];
  const fromAiRepair: TopLevelKey[] = [];
  const fromDefaults: TopLevelKey[] = [];

  for (const key of TOP_LEVEL_KEYS) {
    if (aiRepaired.has(key) && wasProvidedByLlm(llmRecord, key)) {
      fromAiRepair.push(key);
    } else if (wasProvidedByLlm(llmRecord, key)) {
      fromAi.push(key);
    } else {
      fromDefaults.push(key);
    }
  }

  console.log(`[ai] Initial AI completeness: ${initialCompletenessPercent}%`);
  console.log(
    `[ai] Fields repaired by AI: ${fromAiRepair.join(", ") || "(none)"}`
  );
  console.log(
    `[ai] Fields repaired by defaults: ${fromDefaults.join(", ") || "(none)"}`
  );
  console.log(
    `[ai] Fields from original AI generation: ${fromAi.join(", ") || "(none)"}`
  );

  // Strip unknown/deterministic keys the model may still emit.
  const leanOnly: Record<string, unknown> = {};
  for (const key of TOP_LEVEL_KEYS) {
    leanOnly[key] = (merged as Record<string, unknown>)[key];
  }

  let validated = aiIntelligenceLlmSchema.safeParse(leanOnly);

  if (!validated.success) {
    const repaired: Record<string, unknown> = { ...leanOnly };
    const failingRoots = new Set(
      validated.error.issues
        .map((issue) => String(issue.path[0] ?? ""))
        .filter(Boolean)
    );

    for (const key of failingRoots) {
      if (key in defaults) {
        console.warn(
          `[ai] Soft-repairing invalid section "${key}" with defaults.`
        );
        repaired[key] = (defaults as Record<string, unknown>)[key];
        if (!fromDefaults.includes(key as TopLevelKey)) {
          fromDefaults.push(key as TopLevelKey);
        }
        const aiIndex = fromAi.indexOf(key as TopLevelKey);
        if (aiIndex >= 0) fromAi.splice(aiIndex, 1);
        const repairIndex = fromAiRepair.indexOf(key as TopLevelKey);
        if (repairIndex >= 0) fromAiRepair.splice(repairIndex, 1);
      }
    }

    validated = aiIntelligenceLlmSchema.safeParse(repaired);
  }

  if (!validated.success) {
    const issue = validated.error.issues[0];
    const path = issue?.path.join(".") || "root";
    const detail = issue
      ? `${path}: ${issue.message}`
      : validated.error.message;

    throw new Error(
      `Decision Intelligence LLM payload failed validation after defaults merge: ${detail}`
    );
  }

  return {
    payload: validated.data,
    fromAi,
    fromDefaults,
    fromAiRepair,
    initialCompletenessPercent,
  };
}

/** Re-export disclaimer for callers that need it when assembling Schema B. */
export { DISCLAIMER };
