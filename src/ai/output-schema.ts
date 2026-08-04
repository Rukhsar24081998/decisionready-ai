import { z } from "zod";
import type {
  AnalysisMetadata,
  CoverageBreakdown,
  DecisionReadinessBreakdown,
  NormalizedCompetency,
  NormalizedEvidenceGap,
  NormalizedEvidenceMapping,
  NormalizedInterviewer,
  TimelineStage,
} from "@/lib/ai/decision-engine";
import type { ScoreExplanation } from "@/lib/ai/confidence-utils";

/**
 * Schema A — lean Groq Structured Output payload.
 * Qualitative evidence + reasoning only. No derived scores.
 *
 * Schema B — AiIntelligenceResult — full UI contract (computed by backend).
 */

export const DISCLAIMER =
  "DecisionReady AI does not make hiring decisions. Final decisions remain with recruiters.";

const confidenceLevelSchema = z.enum(["High", "Medium", "Low"]);
const severitySchema = z.enum(["High", "Medium", "Low"]);

type ReadinessLabel = "Ready" | "Partially Ready" | "Not Ready";
type EvidenceQualityLabel = "High" | "Medium" | "Low";

/** Schema A: what the LLM is allowed / required to generate. */
export const aiIntelligenceLlmSchema = z.object({
  candidate: z.object({
    name: z.string(),
    role: z.string(),
    department: z.string(),
    experience: z.string(),
  }),
  competencyCoverage: z.object({
    competencies: z.array(
      z.object({
        name: z.string(),
        supportingQuotes: z.array(z.string()),
        missingEvidence: z.array(z.string()),
        confidenceReason: z.string(),
      })
    ),
  }),
  interviewerAlignment: z.object({
    interviewers: z.array(
      z.object({
        name: z.string(),
        role: z.string(),
        strengths: z.array(z.string()),
        concerns: z.array(z.string()),
        consensus: z.string(),
        supportingEvidence: z.array(z.string()),
      })
    ),
  }),
  evidenceMapping: z.array(
    z.object({
      competency: z.string(),
      source: z.string(),
      sourceDocument: z.string(),
      pageNumber: z.number().nullable(),
      section: z.string(),
      confidence: confidenceLevelSchema,
      evidence: z.string(),
    })
  ),
  evidenceGaps: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
      severity: severitySchema,
      whyItMatters: z.string(),
      recommendedQuestion: z.string(),
      estimatedDiscussionTime: z.string(),
      relatedCompetency: z.string(),
    })
  ),
  discussionTopics: z.array(z.string()),
  executiveSummary: z.string(),
  decisionBrief: z.object({
    strengths: z.array(
      z.object({
        competency: z.string(),
        source: z.string(),
        confidence: confidenceLevelSchema,
        quote: z.string(),
        pageNumber: z.number().nullable(),
      })
    ),
    interviewers: z.array(
      z.object({
        name: z.string(),
        round: z.string(),
        positives: z.array(z.string()),
        concerns: z.array(z.string()),
        consensus: z.string(),
        supportingEvidence: z.array(z.string()),
      })
    ),
    skills: z.array(z.string()),
    documentsAnalyzed: z.array(z.string()),
  }),
});

export type AiIntelligenceLlmPayload = z.infer<typeof aiIntelligenceLlmSchema>;

/** @deprecated Alias — Zod schema for LLM payload (Schema A). */
export const aiIntelligenceSchema = aiIntelligenceLlmSchema;

/**
 * Schema B — full Decision Intelligence result consumed by Dashboard + Brief.
 * Derived metrics are always computed by the decision engine / hydrate layer.
 */
export type AiIntelligenceResult = {
  candidate: AiIntelligenceLlmPayload["candidate"];
  decisionReadiness: {
    score: number;
    label: ReadinessLabel;
    subtitle: string;
  };
  confidence: number;
  evidenceQuality: {
    label: EvidenceQualityLabel;
    sourcesAnalyzed: number;
    overallScore: number;
    supportingQuotesCount: number;
    missingEvidenceCount: number;
  };
  competencyCoverage: {
    covered: number;
    total: number;
    competencies: Array<{
      name: string;
      score: number;
      evidenceCount: number;
      supportingQuotes: string[];
      missingEvidence: string[];
      confidenceReason: string;
    }>;
  };
  interviewerAlignment: {
    percent: number;
    label: string;
    interviewers: Array<{
      name: string;
      percent: number;
      role: string;
      strengths: string[];
      concerns: string[];
      consensus: string;
      supportingEvidence: string[];
    }>;
  };
  evidenceMapping: Array<{
    competency: string;
    source: string;
    sourceDocument: string;
    pageNumber: number | null;
    section: string;
    confidence: "High" | "Medium" | "Low";
    evidence: string;
  }>;
  evidenceGaps: Array<{
    title: string;
    text: string;
    severity: "High" | "Medium" | "Low";
    whyItMatters: string;
    recommendedQuestion: string;
    estimatedDiscussionTime: string;
    relatedCompetency: string;
  }>;
  discussionTopics: string[];
  timeline: Array<{ label: string }>;
  executiveSummary: string;
  explanations: {
    decisionReadiness: string;
    confidence: string;
    coverage: string;
    alignment: string;
  };
  decisionBrief: {
    strengths: Array<{
      competency: string;
      source: string;
      confidence: "High" | "Medium" | "Low";
      quote: string;
      pageNumber: number | null;
    }>;
    interviewers: Array<{
      name: string;
      round: string;
      positives: string[];
      concerns: string[];
      confidence: number;
      consensus: string;
      supportingEvidence: string[];
    }>;
    skills: string[];
    documentsAnalyzed: string[];
    processingTime: string;
    version: string;
    disclaimer: string;
  };
  generatedAt: string;
  analysisTimeMs: number;
  decisionReadinessBreakdown: DecisionReadinessBreakdown;
  overallExplanation: string;
  coverageBreakdown: CoverageBreakdown;
  explanationsDetail: {
    decisionReadiness: ScoreExplanation;
    confidence: ScoreExplanation;
    coverage: ScoreExplanation;
    alignment: ScoreExplanation;
  };
  emptyStates: string[];
  metadata: AnalysisMetadata;
  normalizedCompetencies: NormalizedCompetency[];
  normalizedEvidenceMapping: NormalizedEvidenceMapping[];
  normalizedEvidenceGaps: NormalizedEvidenceGap[];
  normalizedInterviewers: NormalizedInterviewer[];
  normalizedTimeline: TimelineStage[];
};

/** Groq JSON Schema (strict) — Schema A only. */
export const aiIntelligenceLlmJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "candidate",
    "competencyCoverage",
    "interviewerAlignment",
    "evidenceMapping",
    "evidenceGaps",
    "discussionTopics",
    "executiveSummary",
    "decisionBrief",
  ],
  properties: {
    candidate: {
      type: "object",
      additionalProperties: false,
      required: ["name", "role", "department", "experience"],
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        department: { type: "string" },
        experience: { type: "string" },
      },
    },
    competencyCoverage: {
      type: "object",
      additionalProperties: false,
      required: ["competencies"],
      properties: {
        competencies: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "supportingQuotes",
              "missingEvidence",
              "confidenceReason",
            ],
            properties: {
              name: { type: "string" },
              supportingQuotes: { type: "array", items: { type: "string" } },
              missingEvidence: { type: "array", items: { type: "string" } },
              confidenceReason: { type: "string" },
            },
          },
        },
      },
    },
    interviewerAlignment: {
      type: "object",
      additionalProperties: false,
      required: ["interviewers"],
      properties: {
        interviewers: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "role",
              "strengths",
              "concerns",
              "consensus",
              "supportingEvidence",
            ],
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
              consensus: { type: "string" },
              supportingEvidence: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    evidenceMapping: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "competency",
          "source",
          "sourceDocument",
          "pageNumber",
          "section",
          "confidence",
          "evidence",
        ],
        properties: {
          competency: { type: "string" },
          source: { type: "string" },
          sourceDocument: { type: "string" },
          pageNumber: { type: ["number", "null"] },
          section: { type: "string" },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
          },
          evidence: { type: "string" },
        },
      },
    },
    evidenceGaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "text",
          "severity",
          "whyItMatters",
          "recommendedQuestion",
          "estimatedDiscussionTime",
          "relatedCompetency",
        ],
        properties: {
          title: { type: "string" },
          text: { type: "string" },
          severity: {
            type: "string",
            enum: ["High", "Medium", "Low"],
          },
          whyItMatters: { type: "string" },
          recommendedQuestion: { type: "string" },
          estimatedDiscussionTime: { type: "string" },
          relatedCompetency: { type: "string" },
        },
      },
    },
    discussionTopics: {
      type: "array",
      items: { type: "string" },
    },
    executiveSummary: { type: "string" },
    decisionBrief: {
      type: "object",
      additionalProperties: false,
      required: ["strengths", "interviewers", "skills", "documentsAnalyzed"],
      properties: {
        strengths: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "competency",
              "source",
              "confidence",
              "quote",
              "pageNumber",
            ],
            properties: {
              competency: { type: "string" },
              source: { type: "string" },
              confidence: {
                type: "string",
                enum: ["High", "Medium", "Low"],
              },
              quote: { type: "string" },
              pageNumber: { type: ["number", "null"] },
            },
          },
        },
        interviewers: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "round",
              "positives",
              "concerns",
              "consensus",
              "supportingEvidence",
            ],
            properties: {
              name: { type: "string" },
              round: { type: "string" },
              positives: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
              consensus: { type: "string" },
              supportingEvidence: { type: "array", items: { type: "string" } },
            },
          },
        },
        skills: { type: "array", items: { type: "string" } },
        documentsAnalyzed: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

/** @deprecated Use aiIntelligenceLlmJsonSchema — kept for import compatibility. */
export const aiIntelligenceJsonSchema = aiIntelligenceLlmJsonSchema;
