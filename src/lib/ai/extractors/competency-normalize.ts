/**
 * Shared competency label normalization for extractors + evidence merge.
 * Deterministic — no LLM.
 */

export const CANONICAL_COMPETENCIES = [
  "Stakeholder Management",
  "Prompt Engineering",
  "AI Product Thinking",
  "Product Discovery",
  "Communication",
  "Execution",
  "Ownership",
  "Prioritization",
  "Analytics",
  "User Research",
  "Cross-functional Collaboration",
  "Technical Understanding",
] as const;

export type CanonicalCompetency = (typeof CANONICAL_COMPETENCIES)[number];

const COMPETENCY_ALIASES: Array<{
  match: RegExp;
  canonical: CanonicalCompetency;
}> = [
  { match: /stakeholder/, canonical: "Stakeholder Management" },
  { match: /prompt\s*eng/, canonical: "Prompt Engineering" },
  { match: /ai\s*product|product\s*thinking/, canonical: "AI Product Thinking" },
  { match: /product\s*discovery/, canonical: "Product Discovery" },
  { match: /communicat/, canonical: "Communication" },
  { match: /execution|deliver/, canonical: "Execution" },
  { match: /ownership|accountab/, canonical: "Ownership" },
  { match: /priorit/, canonical: "Prioritization" },
  { match: /analytic|data\s*driven|metrics/, canonical: "Analytics" },
  { match: /user\s*research|ux\s*research/, canonical: "User Research" },
  {
    match: /cross[-\s]?functional|collaboration|collaborat/,
    canonical: "Cross-functional Collaboration",
  },
  {
    match: /technical\s*understand|technical\s*depth|tech\s*literacy/,
    canonical: "Technical Understanding",
  },
];

/** Normalize a competency label to a canonical name when applicable. */
export function normalizeCompetencyName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();

  for (const { match, canonical } of COMPETENCY_ALIASES) {
    if (match.test(lower)) return canonical;
  }

  for (const canonical of CANONICAL_COMPETENCIES) {
    if (canonical.toLowerCase() === lower) return canonical;
  }

  return trimmed
    .split(" ")
    .map((word) =>
      word.length <= 2 && word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

/** Trim, normalize, dedupe, optionally sort competency names. */
export function normalizeCompetencyList(
  values: string[],
  options?: { sort?: boolean }
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeCompetencyName(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  if (options?.sort !== false) {
    result.sort((a, b) => a.localeCompare(b));
  }

  return result;
}

/** Trim, collapse whitespace, and dedupe strings (case-insensitive). */
export function normalizeStringList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

/** Prompt fragment listing canonical competency labels. */
export function canonicalCompetencyPromptList(): string {
  return CANONICAL_COMPETENCIES.map((c) => `- ${c}`).join("\n");
}
