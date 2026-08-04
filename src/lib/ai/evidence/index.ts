/**
 * Evidence Graph domain model — mergeEvidence populates the graph.
 * Wired into /api/analyze via the AI provider orchestration layer.
 */

export {
  createEmptyEvidenceGraph,
  type EvidenceDocumentType,
  type EvidenceConfidence,
  type EvidenceSource,
  type CompetencyEvidence,
  type InterviewerSignals,
  type CandidateEvidenceGraph,
} from "@/lib/ai/evidence/evidence-graph";

export {
  mergeEvidence,
  type MergeEvidenceInput,
  type MergeEvidenceDocumentNames,
} from "@/lib/ai/evidence/merge-evidence";
