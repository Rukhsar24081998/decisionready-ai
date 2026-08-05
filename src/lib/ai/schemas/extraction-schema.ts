/**
 * Document Understanding — extraction output contracts + Zod.
 * Qualitative facts only. No scores, confidence, or hire/reject signals.
 *
 * Resume schema is intentionally resilient: missing sections become empty
 * defaults. Nulls and common LLM shape mistakes are coerced — never treated
 * as "resume incomplete" failures.
 */

import { z } from "zod";

export interface ResumeWorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  duration: string;
  /** Years in this role — may be refined deterministically in post-process. */
  years: number;
  responsibilities: string[];
  measurableImpact: string[];
}

export interface ResumeProjectEvidence {
  name: string;
  description: string;
  technologies: string[];
  measurableOutcomes: string[];
  competenciesDemonstrated: string[];
  evidenceQuote: string;
  pageNumber?: number | null;
}

export interface ResumeCompetencyEvidence {
  quote: string;
  pageNumber?: number | null;
}

export interface ResumeCompetency {
  name: string;
  reason: string;
  evidence: ResumeCompetencyEvidence[];
}

export interface ResumeAchievement {
  title: string;
  evidenceQuote: string;
  /** Quantified metric label when present (e.g. "conversion rate", "revenue"). */
  metric: string;
  /** Numeric value or percentage string as written (e.g. 40, "40%", "2x"). */
  value: string;
  /** Impact category such as Growth, Efficiency, Quality, Revenue, Engagement. */
  impactCategory: string;
}

export interface ResumeExtraction {
  candidate: {
    name: string;
    title: string;
    /** Always computed deterministically from workExperience in post-process. */
    experienceYears: number;
    location?: string;
    education: string[];
  };
  workExperience: ResumeWorkExperience[];
  skills: string[];
  projects: ResumeProjectEvidence[];
  competencies: ResumeCompetency[];
  achievements: ResumeAchievement[];
}

/** Coerce null/undefined → default string. Never fail on missing values. */
const resilientString = z.preprocess((value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "string") return value;
  return "";
}, z.string().default(""));

/** Coerce messy year values ("2 years", null, "") → finite number. */
const resilientNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (!match) return 0;
    const n = Number(match[0]);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}, z.number().default(0));

/** pageNumber: number | null | omit — strings coerced when numeric. */
const resilientPageNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}, z.number().nullable().optional());

function itemToString(item: unknown): string {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    const parts = [
      record.degree,
      record.school,
      record.institution,
      record.university,
      record.name,
      record.title,
      record.skill,
      record.label,
      record.value,
    ]
      .filter((part) => typeof part === "string" && part.trim())
      .map((part) => String(part).trim());
    if (parts.length > 0) return parts.join(", ");
  }
  return "";
}

/** Arrays of strings — accepts null, objects-in-array, scalar → []. */
const resilientStringArray = z.preprocess((value) => {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    return value
      .split(/[,;\n|/]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value.map(itemToString).filter((s) => s.trim().length > 0);
}, z.array(z.string()).default([]));

const resumeWorkExperienceSchema = z.object({
  company: resilientString,
  title: resilientString,
  startDate: resilientString,
  endDate: resilientString,
  duration: resilientString,
  years: resilientNumber,
  responsibilities: resilientStringArray,
  measurableImpact: resilientStringArray,
});

const resumeProjectSchema = z.object({
  name: resilientString,
  description: resilientString,
  technologies: resilientStringArray,
  measurableOutcomes: resilientStringArray,
  competenciesDemonstrated: resilientStringArray,
  evidenceQuote: resilientString,
  pageNumber: resilientPageNumber,
});

const resumeAchievementSchema = z.object({
  title: resilientString,
  evidenceQuote: resilientString,
  metric: resilientString,
  value: z.preprocess((value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  }, z.string().default("")),
  impactCategory: resilientString,
});

const resumeCompetencyEvidenceSchema = z.object({
  quote: resilientString,
  pageNumber: resilientPageNumber,
});

const resumeCompetencySchema = z.object({
  name: resilientString,
  reason: resilientString,
  evidence: z.preprocess((value) => {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) return [];
    return value;
  }, z.array(resumeCompetencyEvidenceSchema).default([])),
});

const emptyCandidate = {
  name: "",
  title: "",
  experienceYears: 0,
  education: [] as string[],
};

const resumeCandidateSchema = z.object({
  name: resilientString,
  title: resilientString,
  experienceYears: resilientNumber,
  location: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    if (typeof value === "string") return value;
    return undefined;
  }, z.string().optional()),
  education: resilientStringArray,
});

/**
 * Pre-normalize alternate key names models sometimes emit
 * (experience vs workExperience, etc.) before field validation.
 */
function normalizeResumeShape(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      candidate: emptyCandidate,
      workExperience: [],
      skills: [],
      projects: [],
      competencies: [],
      achievements: [],
    };
  }

  const record = { ...(input as Record<string, unknown>) };

  if (!record.workExperience && Array.isArray(record.experience)) {
    record.workExperience = record.experience;
  }
  if (!record.workExperience && Array.isArray(record.work_experience)) {
    record.workExperience = record.work_experience;
  }
  if (!record.skills && Array.isArray(record.skillList)) {
    record.skills = record.skillList;
  }
  if (!record.achievements && Array.isArray(record.accomplishments)) {
    record.achievements = record.accomplishments;
  }
  if (!record.candidate || typeof record.candidate !== "object") {
    record.candidate = {
      name: typeof record.name === "string" ? record.name : "",
      title:
        typeof record.title === "string"
          ? record.title
          : typeof record.role === "string"
            ? record.role
            : "",
      experienceYears: 0,
      education: Array.isArray(record.education) ? record.education : [],
      ...(typeof record.location === "string"
        ? { location: record.location }
        : {}),
    };
  }

  // Null top-level arrays → missing (defaults apply)
  for (const key of [
    "workExperience",
    "skills",
    "projects",
    "competencies",
    "achievements",
  ] as const) {
    if (record[key] === null) delete record[key];
  }

  return record;
}

export const resumeExtractionSchema = z.preprocess(
  normalizeResumeShape,
  z.object({
    candidate: resumeCandidateSchema.default(emptyCandidate),
    workExperience: z
      .preprocess((value) => {
        if (value === null || value === undefined) return [];
        if (!Array.isArray(value)) return [];
        return value.filter(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        );
      }, z.array(resumeWorkExperienceSchema).default([])),
    skills: resilientStringArray,
    projects: z
      .preprocess((value) => {
        if (value === null || value === undefined) return [];
        if (!Array.isArray(value)) return [];
        return value.filter(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        );
      }, z.array(resumeProjectSchema).default([])),
    competencies: z
      .preprocess((value) => {
        if (value === null || value === undefined) return [];
        if (!Array.isArray(value)) return [];
        return value.filter(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        );
      }, z.array(resumeCompetencySchema).default([])),
    achievements: z
      .preprocess((value) => {
        if (value === null || value === undefined) return [];
        if (!Array.isArray(value)) return [];
        return value.filter(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        );
      }, z.array(resumeAchievementSchema).default([])),
  })
);

export interface JobDescriptionExtraction {
  role: string;
  department: string;
  requiredCompetencies: string[];
  preferredCompetencies: string[];
  requiredSkills: string[];
  responsibilities: string[];
  niceToHave: string[];
}

export const jobDescriptionExtractionSchema = z.object({
  role: z.string(),
  department: z.string(),
  requiredCompetencies: z.array(z.string()),
  preferredCompetencies: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  niceToHave: z.array(z.string()),
});

export interface InterviewSignal {
  topic: string;
  quote: string;
}

export interface InterviewBehaviorExample {
  competency: string;
  example: string;
}

export interface InterviewExtraction {
  positiveSignals: InterviewSignal[];
  negativeSignals: InterviewSignal[];
  behaviorExamples: InterviewBehaviorExample[];
  quotes: string[];
  competenciesObserved: string[];
}

export const interviewExtractionSchema = z.object({
  positiveSignals: z.array(
    z.object({
      topic: z.string(),
      quote: z.string(),
    })
  ),
  negativeSignals: z.array(
    z.object({
      topic: z.string(),
      quote: z.string(),
    })
  ),
  behaviorExamples: z.array(
    z.object({
      competency: z.string(),
      example: z.string(),
    })
  ),
  quotes: z.array(z.string()),
  competenciesObserved: z.array(z.string()),
});

export interface ScorecardRating {
  competency: string;
  rating: number;
  comments: string;
}

export interface ScorecardExtraction {
  ratings: ScorecardRating[];
  strengths: string[];
  concerns: string[];
}

export const scorecardExtractionSchema = z.object({
  ratings: z.array(
    z.object({
      competency: z.string(),
      rating: z.number(),
      comments: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
});

export interface HiringManagerExtraction {
  decisionFactors: string[];
  risks: string[];
  missingEvidence: string[];
  discussionPoints: string[];
}

export const hiringManagerExtractionSchema = z.object({
  decisionFactors: z.array(z.string()),
  risks: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  discussionPoints: z.array(z.string()),
});

/** Union of all document extraction payloads. */
export type DocumentExtraction =
  | ResumeExtraction
  | JobDescriptionExtraction
  | InterviewExtraction
  | ScorecardExtraction
  | HiringManagerExtraction;

export type ExtractionDocumentType =
  | "Resume"
  | "Job Description"
  | "Interview Notes"
  | "Scorecards"
  | "Hiring Manager Notes";
