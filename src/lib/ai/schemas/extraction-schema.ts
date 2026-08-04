/**
 * Document Understanding — extraction output contracts + Zod.
 * Qualitative facts only. No scores, confidence, or hire/reject signals.
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
  pageNumber?: number;
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

const resumeWorkExperienceSchema = z.object({
  company: z.string().default(""),
  title: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  duration: z.string().default(""),
  years: z.coerce.number().default(0),
  responsibilities: z.array(z.string()).default([]),
  measurableImpact: z.array(z.string()).default([]),
});

const resumeProjectSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  measurableOutcomes: z.array(z.string()).default([]),
  competenciesDemonstrated: z.array(z.string()).default([]),
  evidenceQuote: z.string().default(""),
  pageNumber: z.number().optional(),
});

const resumeAchievementSchema = z.object({
  title: z.string().default(""),
  evidenceQuote: z.string().default(""),
  metric: z.string().default(""),
  value: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .default(""),
  impactCategory: z.string().default(""),
});

export const resumeExtractionSchema = z.object({
  candidate: z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    experienceYears: z.coerce.number().default(0),
    location: z.string().optional(),
    education: z.array(z.string()).default([]),
  }),
  workExperience: z.array(resumeWorkExperienceSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(resumeProjectSchema).default([]),
  competencies: z.array(
    z.object({
      name: z.string().default(""),
      reason: z.string().default(""),
      evidence: z
        .array(
          z.object({
            quote: z.string().default(""),
            pageNumber: z.number().nullable().optional(),
          })
        )
        .default([]),
    })
  ).default([]),
  achievements: z.array(resumeAchievementSchema).default([]),
});

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
