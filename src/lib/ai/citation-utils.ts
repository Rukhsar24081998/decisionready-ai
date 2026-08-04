import type {
  CopilotCitation,
  CopilotResponse,
} from "@/lib/ai/copilot-schema";
import { INSUFFICIENT_EVIDENCE_ANSWER } from "@/lib/ai/copilot-schema";
import { normalizeConfidence } from "@/lib/ai/score-utils";
import { normalizePageNumber } from "@/lib/ai/evidence-utils";

const ALLOWED_DOCUMENTS = new Set([
  "Resume",
  "Job Description",
  "Interview Notes",
  "Scorecards",
  "Hiring Manager Notes",
]);

/**
 * Normalize and sanitize citations so we never surface fabricated structure.
 */
export function normalizeCitations(
  citations: CopilotCitation[],
  allowedDocumentTypes: string[]
): CopilotCitation[] {
  const allowed = new Set(
    allowedDocumentTypes.length > 0
      ? allowedDocumentTypes
      : [...ALLOWED_DOCUMENTS]
  );

  return citations
    .map((citation) => {
      const document = String(citation.document || "").trim();
      const quote = String(citation.quote || "").trim();
      const section = String(citation.section || "").trim();

      if (!document || !quote) return null;

      // Prefer known document types; keep filename-like labels if they mention a known type.
      const matchedType = [...allowed].find(
        (type) =>
          document === type ||
          document.toLowerCase().includes(type.toLowerCase())
      );

      return {
        document: matchedType || document,
        pageNumber: normalizePageNumber(citation.pageNumber),
        section,
        quote: quote.slice(0, 500),
      } satisfies CopilotCitation;
    })
    .filter((c): c is CopilotCitation => c !== null)
    .slice(0, 8);
}

export function formatCitationLabel(citation: CopilotCitation): string {
  const page =
    citation.pageNumber !== null ? `Page ${citation.pageNumber}` : "Page n/a";
  const section = citation.section ? ` · ${citation.section}` : "";
  return `${citation.document} · ${page}${section}`;
}

/**
 * Final safety pass on the copilot response before returning to the client.
 */
export function sanitizeCopilotResponse(
  response: CopilotResponse,
  allowedDocumentTypes: string[]
): CopilotResponse {
  const confidence = normalizeConfidence(response.confidence);
  const citations = normalizeCitations(response.citations, allowedDocumentTypes);
  const answer = response.answer.trim();

  const insufficient =
    answer.length === 0 ||
    answer === INSUFFICIENT_EVIDENCE_ANSWER ||
    (citations.length === 0 && confidence < 40);

  if (insufficient && citations.length === 0) {
    return {
      answer: INSUFFICIENT_EVIDENCE_ANSWER,
      confidence: Math.min(confidence, 25),
      citations: [],
      relatedCompetencies: response.relatedCompetencies.slice(0, 6),
      limitations:
        response.limitations.trim() ||
        "Answer limited to uploaded hiring documents only.",
      followUpQuestions: padFollowUps(response.followUpQuestions),
      evidenceConflict: {
        present: false,
        title: "",
        sideA: "",
        sideB: "",
        explanation: "",
      },
    };
  }

  return {
    answer,
    confidence,
    citations,
    relatedCompetencies: response.relatedCompetencies
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 8),
    limitations:
      response.limitations.trim() ||
      "Based only on uploaded hiring documents. Does not recommend Hire or Reject.",
    followUpQuestions: padFollowUps(response.followUpQuestions),
    evidenceConflict: response.evidenceConflict?.present
      ? {
          present: true,
          title:
            response.evidenceConflict.title.trim() ||
            "Potential Evidence Conflict",
          sideA: response.evidenceConflict.sideA.trim(),
          sideB: response.evidenceConflict.sideB.trim(),
          explanation: response.evidenceConflict.explanation.trim(),
        }
      : {
          present: false,
          title: "",
          sideA: "",
          sideB: "",
          explanation: "",
        },
  };
}

function padFollowUps(questions: string[]): string[] {
  const cleaned = questions.map((q) => q.trim()).filter(Boolean).slice(0, 3);
  const defaults = [
    "Tell me more about the strongest evidence.",
    "Show conflicting evidence.",
    "What should the hiring manager validate?",
  ];
  while (cleaned.length < 3) {
    cleaned.push(defaults[cleaned.length]);
  }
  return cleaned;
}

export function scrollToEvidenceMapping(): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById("evidence-mapping");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
