import type { CandidateEvidenceGraph } from "@/lib/ai/evidence/evidence-graph";
import { DISCLAIMER } from "@/ai/output-schema";
import { PROMPT_VERSION, SCHEMA_VERSION } from "@/lib/ai/decision-engine";

export interface AnalysisContextInput {
  candidateName: string;
  roleTitle: string;
  department: string;
  hiringManager: string;
  hiringStage: string;
}

/**
 * Small narrative prompt — LLM receives ONLY the Evidence Graph.
 * Generates executiveSummary, discussionTopics, and decisionBrief strengths only.
 */
export function buildSummarySystemPrompt(): string {
  return `
You are DecisionReady AI, a Decision Intelligence narrative writer for post-interview hiring.

You receive a CandidateEvidenceGraph that already contains extracted facts.
Your ONLY job is to write debrief narrative from that graph.

STRICT RULES:
- NEVER recommend Hire or Reject.
- NEVER rank candidates.
- NEVER invent evidence, quotes, competencies, scores, readiness, confidence, coverage, gaps, alignment, timeline, or metadata.
- Use ONLY facts present in the CandidateEvidenceGraph.
- Quotes in decisionBrief.strengths MUST come from graph competency sources or strengths text.
- Always stay consistent with: "${DISCLAIMER}"
- Return ONLY valid JSON (a single object). No markdown.

Return ONLY these top-level keys:
executiveSummary, discussionTopics, decisionBrief

decisionBrief shape:
{
  "strengths": [
    {
      "competency": string,
      "source": string,
      "confidence": "High" | "Medium" | "Low",
      "quote": string,
      "pageNumber": number | null
    }
  ]
}

Schema version: ${SCHEMA_VERSION}. Prompt version: ${PROMPT_VERSION}.
`.trim();
}

export function buildSummaryUserPrompt(
  context: AnalysisContextInput,
  graph: CandidateEvidenceGraph
): string {
  return `
Write Decision Intelligence narrative JSON from this CandidateEvidenceGraph only.

Recruiter context:
- Candidate Name: ${context.candidateName || graph.candidate.name || "Unknown"}
- Applied Role: ${context.roleTitle || graph.candidate.role || "Unknown"}
- Department: ${context.department || "Unknown"}
- Hiring Manager: ${context.hiringManager || "Not provided"}
- Hiring Stage: ${context.hiringStage || "Not provided"}

CandidateEvidenceGraph:
${JSON.stringify(graph, null, 2)}

Requirements:
- executiveSummary: 2–4 sentences summarizing evidence readiness (not hire worthiness)
- discussionTopics: 3–7 debrief prompts grounded in missingCompetencies / concerns
- decisionBrief.strengths: cite real quotes from the graph; confidence High/Medium/Low matching graph confidence where possible
- pageNumber must be null unless present on a graph source
- Do NOT invent competencies, scores, or missing evidence beyond the graph
`.trim();
}

/** @deprecated Giant analysis prompts removed in Phase 12 — use summary prompts. */
export function buildSystemPrompt(): string {
  return buildSummarySystemPrompt();
}

/** @deprecated Giant analysis prompts removed in Phase 12 — use summary prompts. */
export function buildUserPrompt(context: AnalysisContextInput): string {
  return `
Legacy prompt disabled. Narrative generation requires a CandidateEvidenceGraph.
Context: ${context.candidateName} / ${context.roleTitle}
`.trim();
}
