import { scoreToConfidenceLabel } from "@/lib/ai/score-utils";
import { buildCandidatePresentationProfile } from "@/components/intelligence/candidate-profile";

export interface StrengthInput {
  competency: string;
  source: string;
  confidence: "High" | "Medium" | "Low";
  quote: string;
  pageNumber: number | null;
}

export interface MergedStrength {
  competency: string;
  confidence: "High" | "Medium" | "Low";
  sources: string[];
  quotes: Array<{ quote: string; source: string; pageNumber: number | null }>;
  documentCount: number;
  quoteCount: number;
  /** Legacy shape used by Decision Brief. */
  items: StrengthInput[];
}

/** @deprecated Alias for brief consumers — same shape as MergedStrength. */
export type MergedStrengthGroup = MergedStrength;

export interface SkillGroup {
  category: string;
  skills: string[];
  /** @deprecated Prefer `category` — kept for older call sites. */
  group: string;
}

export type GroupedSkills = SkillGroup[];

function normalizeSkillList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;|]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

/** Group skills into recruiter-friendly categories via keyword heuristics. */
export function groupSkills(skills: unknown): SkillGroup[] {
  const order = [
    "AI",
    "Product",
    "Technical",
    "Research",
    "Analytics",
    "Leadership",
    "Communication",
    "Other",
  ] as const;

  const buckets: Record<string, string[]> = {
    AI: [],
    Product: [],
    Technical: [],
    Research: [],
    Analytics: [],
    Leadership: [],
    Communication: [],
    Other: [],
  };

  for (const skill of normalizeSkillList(skills)) {
    let matched = false;
    for (const { label, keywords } of SKILL_GROUPS) {
      if (keywords.test(skill)) {
        buckets[label].push(skill);
        matched = true;
        break;
      }
    }
    if (!matched) {
      buckets.Other.push(skill);
    }
  }

  const result: SkillGroup[] = [];
  for (const key of order) {
    const list = buckets[key];
    if (!Array.isArray(list) || list.length === 0) continue;
    result.push({
      category: key,
      group: key,
      skills: list,
    });
  }
  return result;
}

/** Safe skills accessor for a skill group — never throws in render. */
export function skillGroupItems(group: SkillGroup | unknown): string[] {
  if (!group || typeof group !== "object") {
    console.warn("Invalid skills group", group);
    return [];
  }
  const skills = (group as SkillGroup).skills;
  if (!Array.isArray(skills)) {
    console.warn("Invalid skills group", group);
    return [];
  }
  return skills.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}

export interface ResumePresentationFields {
  location: string;
  education: string;
  currentCompany: string;
  currentTitle: string;
  experienceLabel: string;
  projectsCount: number;
}


const CONFIDENCE_RANK: Record<"High" | "Medium" | "Low", number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const SKILL_GROUPS: Array<{ label: string; keywords: RegExp }> = [
  {
    label: "AI",
    keywords:
      /\b(ai|ml|machine learning|llm|llms|gpt|rag|deep learning|nlp|computer vision|genai|prompt|prompt engineering)\b/i,
  },
  {
    label: "Product",
    keywords:
      /\b(product|roadmap|roadmapping|prioritization|user research|ux|discovery|backlog|prd|prds)\b/i,
  },
  {
    label: "Technical",
    keywords:
      /\b(javascript|typescript|python|java|go|rust|node|react|api|api design|backend|frontend|devops|cloud|aws|gcp|azure|kubernetes|docker|sql|postgres|redis|microservices|system design|architecture|engineering)\b/i,
  },
  {
    label: "Research",
    keywords:
      /\b(research|thesis|publication|academic|phd|methodology|user interviews)\b/i,
  },
  {
    label: "Analytics",
    keywords:
      /\b(analytics|data|metrics|dashboard|experiment|a\/b|a\/b testing|statistics|bi|tableau|looker|excel)\b/i,
  },
  {
    label: "Leadership",
    keywords:
      /\b(leadership|management|mentor|coach|team lead|director|manager|people|hiring|ownership|execution|cross-functional)\b/i,
  },
  {
    label: "Communication",
    keywords:
      /\b(communication|presentation|writing|documentation|collaboration|stakeholder|stakeholder management|facilitation)\b/i,
  },
];

const DOCUMENT_LABEL_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bresume\b|\bcv\b/i, label: "Resume" },
  {
    pattern: /\bhiring.?manager\b|\bmanager.?notes\b|\bhm.?notes\b/i,
    label: "Hiring Manager Notes",
  },
  { pattern: /\bscorecard\b|\bscore.?card\b|\brating\b/i, label: "Scorecards" },
  {
    pattern: /\bjob.?desc\b|\bjd\b|\bdescription\b|\brole.?spec\b/i,
    label: "Job Description",
  },
  // Do not match bare "notes" — that collapses HM notes / misc files into Interview Notes
  { pattern: /\binterview\b|\bfeedback\b/i, label: "Interview Notes" },
];

/** Stable document list entries — unique originals, unique React keys, disambiguated labels. */
export function uniqueEvidenceDocuments(
  documents: string[]
): Array<{ id: string; display: string; original: string }> {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const doc of documents) {
    const original = String(doc ?? "").trim();
    if (!original) continue;
    const key = original.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(original);
  }

  const humanized = unique.map((original) => humanDocumentLabel(original));
  const humanCounts = new Map<string, number>();
  for (const label of humanized) {
    humanCounts.set(label, (humanCounts.get(label) ?? 0) + 1);
  }

  const usedHumanIndex = new Map<string, number>();
  return unique.map((original, index) => {
    const human = humanized[index]!;
    const count = humanCounts.get(human) ?? 1;
    let display = human;
    if (count > 1) {
      const n = (usedHumanIndex.get(human) ?? 0) + 1;
      usedHumanIndex.set(human, n);
      display =
        original.toLowerCase() === human.toLowerCase()
          ? `${human} (${n})`
          : original;
    }
    return {
      id: `doc-${index}-${original}`,
      display,
      original,
    };
  });
}

/** Convert experience values to a human-readable years/months label. */
export function formatExperienceLabel(
  experience: string | number | undefined,
  resumeText?: string
): string {
  if (resumeText?.trim()) {
    const parsed = parseResumePresentationFields(resumeText);
    if (parsed.experienceLabel !== "—") {
      return parsed.experienceLabel;
    }
  }

  if (experience === undefined || experience === null) return "—";
  const raw = String(experience).trim();
  if (!raw || raw === "—") return "—";

  let years: number;
  if (typeof experience === "number") {
    years = experience;
  } else {
    const match = raw.match(/([\d.]+)/);
    if (!match) return raw;
    years = parseFloat(match[1]);
  }

  if (!Number.isFinite(years) || years <= 0) return "—";

  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);

  const parts: string[] = [];
  if (wholeYears > 0) {
    parts.push(`${wholeYears} ${wholeYears === 1 ? "year" : "years"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }

  return parts.length > 0 ? parts.join(" ") : "—";
}

/** Presentation fallback — never leave blank UI fields. */
export function displayOrNotAvailable(
  value: string | number | undefined | null
): string {
  if (value === undefined || value === null) return "Not Available";
  const raw = String(value).trim();
  if (!raw || raw === "—" || raw.toLowerCase() === "unknown") {
    return "Not Available";
  }
  if (
    raw.toLowerCase() === "not provided" ||
    raw.toLowerCase() === "n/a" ||
    raw.toLowerCase() === "na" ||
    raw.toLowerCase() === "none" ||
    raw.toLowerCase() === "null"
  ) {
    return "Not Available";
  }
  return raw;
}

/** Merge strength rows by competency for denser dashboard cards. */
export function mergeStrengthsByCompetency(
  strengths: StrengthInput[]
): MergedStrength[] {
  const byCompetency = new Map<string, MergedStrength>();

  for (const item of strengths) {
    const key = item.competency.trim();
    if (!key) continue;

    const existing = byCompetency.get(key);
    const humanSource = humanDocumentLabel(item.source);
    const sourceDisplay =
      item.source.trim() &&
      humanSource !== item.source.trim() &&
      /\.(pdf|docx?|txt)$/i.test(item.source)
        ? item.source.trim()
        : humanSource;

    if (!existing) {
      byCompetency.set(key, {
        competency: key,
        confidence: item.confidence,
        sources: [sourceDisplay],
        quotes: [
          {
            quote: item.quote,
            source: sourceDisplay,
            pageNumber: item.pageNumber,
          },
        ],
        documentCount: 1,
        quoteCount: item.quote.trim() ? 1 : 0,
        items: [item],
      });
      continue;
    }

    existing.items.push(item);

    if (
      !existing.sources.some(
        (s) => s.toLowerCase() === sourceDisplay.toLowerCase()
      )
    ) {
      existing.sources.push(sourceDisplay);
      existing.documentCount = existing.sources.length;
    }

    if (item.quote.trim()) {
      existing.quotes.push({
        quote: item.quote,
        source: sourceDisplay,
        pageNumber: item.pageNumber,
      });
      existing.quoteCount = existing.quotes.length;
    }

    if (CONFIDENCE_RANK[item.confidence] > CONFIDENCE_RANK[existing.confidence]) {
      existing.confidence = item.confidence;
    }
  }

  return [...byCompetency.values()].sort((a, b) =>
    a.competency.localeCompare(b.competency)
  );
}

/** Map raw filenames or source strings to recruiter-friendly document labels. */
export function humanDocumentLabel(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "Document";

  for (const { pattern, label } of DOCUMENT_LABEL_RULES) {
    if (pattern.test(trimmed)) return label;
  }

  if (/\.pdf$/i.test(trimmed)) {
    return "Document";
  }

  return trimmed.length > 40 ? `${trimmed.slice(0, 37)}…` : trimmed;
}

/** Presentation-only confidence band from a 0–100 score. */
export function confidenceLevelFromScore(
  score: number
): "High" | "Medium" | "Low" {
  return scoreToConfidenceLabel(score);
}

/** Presentation-only resume parsing for snapshot fields. */
export function parseResumePresentationFields(
  resumeText: string
): ResumePresentationFields {
  const profile = buildCandidatePresentationProfile({ resumeText });
  return {
    location: profile.location ?? "—",
    education: profile.education ?? "—",
    currentCompany: profile.currentRole.company ?? "—",
    currentTitle: profile.currentRole.title ?? "—",
    experienceLabel: profile.experienceLabel ?? "—",
    projectsCount: profile.projectsCount,
  };
}

export type DocumentPresenceKey =
  | "Resume"
  | "Interview"
  | "Scorecard"
  | "HM"
  | "JD";

const PRESENCE_PATTERNS: Record<DocumentPresenceKey, RegExp> = {
  Resume: /resume|\bcv\b/i,
  Interview: /interview|feedback/i,
  Scorecard: /scorecard|score.?card|\brating/i,
  HM: /hiring\s*manager|manager.?notes|hm.?notes/i,
  JD: /job\s*description|\bjd\b|role.?spec/i,
};

/** Matrix / timeline column labels (presentation-only). */
export const EVIDENCE_DOC_COLUMNS: Array<{
  key: DocumentPresenceKey;
  short: string;
  full: string;
}> = [
  { key: "Resume", short: "Resume", full: "Resume" },
  { key: "Interview", short: "Interview", full: "Interview Notes" },
  { key: "Scorecard", short: "Scorecard", full: "Scorecards" },
  { key: "HM", short: "HM", full: "Hiring Manager Notes" },
  { key: "JD", short: "JD", full: "Job Description" },
];

/** Check whether citations include a document type (presentation-only). */
export function hasDocumentPresence(
  documents: string[],
  key: DocumentPresenceKey
): boolean {
  const pattern = PRESENCE_PATTERNS[key];
  return documents.some((doc) => pattern.test(humanDocumentLabel(doc)));
}

export function matchDocumentColumn(
  sourceLabel: string
): DocumentPresenceKey | null {
  const label = humanDocumentLabel(sourceLabel);
  // Prefer more specific labels before broader ones (HM before Interview notes).
  const ordered: DocumentPresenceKey[] = [
    "Resume",
    "HM",
    "Scorecard",
    "JD",
    "Interview",
  ];
  for (const key of ordered) {
    if (PRESENCE_PATTERNS[key].test(label)) return key;
  }
  // Fallbacks for human labels produced by humanDocumentLabel
  if (/interview\s*notes/i.test(label)) return "Interview";
  return null;
}

export interface EvidenceStrength {
  label: "Strong" | "Good" | "Moderate" | "Weak" | "Insufficient";
  filled: number;
}

/** Map coverage score → star strength (presentation-only). */
export function evidenceStrengthFromScore(score: number): EvidenceStrength {
  if (score >= 90) return { label: "Strong", filled: 5 };
  if (score >= 75) return { label: "Good", filled: 4 };
  if (score >= 55) return { label: "Moderate", filled: 3 };
  if (score >= 35) return { label: "Weak", filled: 2 };
  return { label: "Insufficient", filled: 1 };
}

export type CompetencySupportStatus =
  | "Fully Supported"
  | "Partially Supported"
  | "Insufficient Evidence"
  | "No Evidence";

export function competencySupportStatus(
  score: number,
  documentCount: number,
  quoteCount: number
): CompetencySupportStatus {
  if (quoteCount === 0 && documentCount === 0) return "No Evidence";
  if (score >= 80 && documentCount >= 2) return "Fully Supported";
  if (score >= 50 || documentCount >= 1) return "Partially Supported";
  return "Insufficient Evidence";
}

/** Synthesize a coverage "Why?" explanation from existing fields. */
export function coverageWhyExplanation(input: {
  score: number;
  confidenceLevel: "High" | "Medium" | "Low";
  documentTypes: string[];
  confidenceReason?: string;
}): string {
  const reason = input.confidenceReason?.trim();
  if (reason) return reason;

  const docs = input.documentTypes.filter(Boolean);
  if (docs.length === 0) {
    return "Coverage is Low because no supporting evidence was detected across uploaded documents.";
  }

  const level =
    input.confidenceLevel === "High"
      ? "High"
      : input.confidenceLevel === "Medium"
        ? "Moderate"
        : "Low";
  const list =
    docs.length === 1
      ? docs[0]
      : docs.length === 2
        ? `${docs[0]} and ${docs[1]}`
        : `${docs.slice(0, -1).join(", ")}, and ${docs[docs.length - 1]}`;

  return `Coverage is ${level} because evidence exists in ${list} with ${
    docs.length >= 3 ? "consistent" : "available"
  } signals.`;
}

export type MatrixCellMark = "supported" | "partial" | "none";

export function matrixCellMark(
  quoteCount: number,
  bestConfidence?: "High" | "Medium" | "Low"
): MatrixCellMark {
  if (quoteCount <= 0) return "none";
  if (bestConfidence === "High" || quoteCount >= 2) return "supported";
  return "partial";
}
