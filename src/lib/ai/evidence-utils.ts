/**
 * Evidence quality and citation helpers.
 */

import type { IngestedDocument } from "@/lib/ingestion/types";
import {
  confidenceLabelToScore,
  normalizeConfidence,
  scoreToConfidenceLabel,
} from "@/lib/ai/score-utils";

export interface EvidenceCitation {
  sourceDocument: string;
  pageNumber: number | null;
  section: string | null;
  quote: string;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
}

export interface EvidenceQualityMetrics {
  overallScore: number;
  label: "High" | "Medium" | "Low";
  sourcesAnalyzed: number;
  supportingQuotes: number;
  missingEvidence: number;
}

const EXPECTED_DOC_TYPES = [
  "Job Description",
  "Resume",
  "Interview Notes",
  "Scorecards",
] as const;

/** Count words across ingested documents. */
export function countTotalWords(documents: IngestedDocument[]): number {
  return documents.reduce((sum, doc) => {
    const words = doc.extractedText.trim().split(/\s+/).filter(Boolean);
    return sum + words.length;
  }, 0);
}

/** Detect which expected document types are missing. */
export function detectMissingDocumentTypes(
  documents: IngestedDocument[]
): string[] {
  const present = new Set(documents.map((d) => d.documentType));
  return EXPECTED_DOC_TYPES.filter((type) => !present.has(type));
}

/** Evidence completeness 0–100 from document presence + gap pressure. */
export function computeEvidenceCompleteness(input: {
  documents: IngestedDocument[];
  highSeverityGaps: number;
  mediumSeverityGaps: number;
}): number {
  const presentTypes = new Set(input.documents.map((d) => d.documentType));
  const requiredHit = EXPECTED_DOC_TYPES.filter((t) =>
    presentTypes.has(t)
  ).length;
  const base = (requiredHit / EXPECTED_DOC_TYPES.length) * 100;

  const penalty =
    input.highSeverityGaps * 8 + input.mediumSeverityGaps * 4;
  return normalizeConfidence(base - penalty);
}

export function buildEvidenceQualityMetrics(input: {
  sourcesAnalyzed: number;
  supportingQuotes: number;
  missingEvidence: number;
  label?: "High" | "Medium" | "Low";
  overallScore?: number;
}): EvidenceQualityMetrics {
  const fromLabel = input.label
    ? confidenceLabelToScore(input.label)
    : undefined;

  let overallScore: number;
  if (typeof input.overallScore === "number") {
    overallScore = normalizeConfidence(input.overallScore);
  } else if (fromLabel !== undefined) {
    // Adjust label midpoint using quote / gap pressure.
    const boost = Math.min(10, input.supportingQuotes * 2);
    const drag = Math.min(20, input.missingEvidence * 4);
    overallScore = normalizeConfidence(fromLabel + boost - drag);
  } else {
    const quoteScore = Math.min(100, input.supportingQuotes * 12);
    const sourceScore = Math.min(100, input.sourcesAnalyzed * 20);
    overallScore = normalizeConfidence(
      quoteScore * 0.55 + sourceScore * 0.45 - input.missingEvidence * 5
    );
  }

  return {
    overallScore,
    label: scoreToConfidenceLabel(overallScore),
    sourcesAnalyzed: Math.max(0, input.sourcesAnalyzed),
    supportingQuotes: Math.max(0, input.supportingQuotes),
    missingEvidence: Math.max(0, input.missingEvidence),
  };
}

/**
 * Page numbers are only available when extractors provide them.
 * Current ingestion returns plain text — always null unless LLM cites a page
 * that can be verified as a positive integer.
 */
export function normalizePageNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 1) return null;
  return Math.floor(value);
}

export function formatEvidenceCitation(citation: EvidenceCitation): string {
  const page =
    citation.pageNumber !== null ? `Page ${citation.pageNumber}` : "Page n/a";
  const section = citation.section ? ` · ${citation.section}` : "";
  return `${citation.sourceDocument} · ${page}${section} · Confidence ${normalizeConfidence(citation.confidence)}%`;
}

/** Recruiter-facing empty-state messages for missing evidence types. */
export function emptyStateForMissingDocs(missing: string[]): string[] {
  return missing.map((doc) => {
    switch (doc) {
      case "Resume":
        return "Missing Resume — competency evidence from prior experience cannot be verified.";
      case "Interview Notes":
        return "Missing Interview Notes — behavioral evidence and quotes are unavailable.";
      case "Scorecards":
        return "Missing Scorecards — structured interviewer ratings cannot be compared.";
      case "Job Description":
        return "Missing Job Description — required competencies cannot be anchored to the role.";
      default:
        return `Missing ${doc} — related evidence signals were skipped.`;
    }
  });
}
