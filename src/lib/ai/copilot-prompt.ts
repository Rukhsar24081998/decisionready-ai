import type { AiIntelligenceResult } from "@/ai/output-schema";
import type { IngestedDocument } from "@/lib/ingestion/types";
import { INSUFFICIENT_EVIDENCE_ANSWER } from "@/lib/ai/copilot-schema";
import type { CopilotConversationTurn } from "@/lib/ai/copilot-schema";
import { formatConversationForPrompt } from "@/lib/ai/conversation-memory";

export function buildCopilotSystemPrompt(): string {
  return `
You are an AI Recruiting Copilot.

Your purpose is to assist recruiters in understanding uploaded hiring evidence.

STRICT RULES:
- Never recommend Hire.
- Never recommend Reject.
- Never rank candidates.
- Only explain evidence from the uploaded documents provided in context.
- Never use general knowledge, training knowledge, or assumptions outside the documents.
- Never invent quotes, page numbers, sections, or citations.
- Every claim must reference uploaded documents via citations with verbatim or near-verbatim quotes from the evidence text.
- If evidence does not exist to answer the question, set answer exactly to: "${INSUFFICIENT_EVIDENCE_ANSWER}"
- When interviewer opinions differ, set evidenceConflict.present to true and explain the disagreement using document-backed sides.
- If no conflict exists, set evidenceConflict.present to false and use empty strings for the other conflict fields.
- confidence must be 0–100 (never 0–1 fractions).
- pageNumber must be null unless an explicit page number appears in the source text.
- section may be "" when unknown.
- Always return followUpQuestions with exactly 3 short recruiter follow-ups grounded in the evidence.
- Return ONLY valid JSON matching the schema. Root must be a single object. No markdown. No prose outside JSON.
`.trim();
}

export function buildCopilotUserPrompt(input: {
  question: string;
  conversationHistory: CopilotConversationTurn[];
  documents: IngestedDocument[];
  intelligence: AiIntelligenceResult | null;
}): string {
  const documentBlocks = input.documents
    .map((doc, index) => {
      const text = doc.extractedText.slice(0, 18000);
      return `### Evidence Document ${index + 1}
documentType: ${doc.documentType}
filename: ${doc.filename}
extractedText:
"""
${text}
"""`;
    })
    .join("\n\n");

  const intelligenceSummary = input.intelligence
    ? `
Decision Intelligence context (already computed — use as index, still cite source documents):
- Candidate: ${input.intelligence.candidate.name} · ${input.intelligence.candidate.role}
- Decision Readiness: ${input.intelligence.decisionReadiness.score}% (${input.intelligence.decisionReadiness.label})
- Executive Summary: ${input.intelligence.executiveSummary}
- Competencies: ${input.intelligence.competencyCoverage.competencies
        .map((c) => `${c.name} (${c.score}%)`)
        .join("; ")}
- Evidence gaps: ${input.intelligence.evidenceGaps
        .map((g) => g.title || g.text)
        .join("; ")}
- Interviewer alignment: ${input.intelligence.interviewerAlignment.percent}%
`.trim()
    : "Decision Intelligence context: not available.";

  const history = formatConversationForPrompt(input.conversationHistory);

  return `
${intelligenceSummary}

Uploaded hiring evidence (ONLY allowed sources):
${documentBlocks || "No documents available."}

Conversation so far:
${history}

Current recruiter question:
"""
${input.question.trim()}
"""

Answer using ONLY the uploaded evidence above. Cite documents in citations[]. If insufficient evidence, use the exact insufficient-evidence answer string.
`.trim();
}
