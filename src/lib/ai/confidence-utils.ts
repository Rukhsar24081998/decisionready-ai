/**
 * Confidence explainability helpers.
 */

import {
  normalizeConfidence,
  scoreToConfidenceLabel,
} from "@/lib/ai/score-utils";

export {
  normalizeConfidence,
  formatPercentage,
  clampPercentage,
  safeRound,
  scoreToConfidenceLabel,
  confidenceLabelToScore,
} from "@/lib/ai/score-utils";

export interface ScoreExplanation {
  score: number;
  label: string;
  summary: string;
  increasedBy: string[];
  reducedBy: string[];
}

export function buildConfidenceExplanation(input: {
  score: number;
  evidenceQuoteCount: number;
  highSeverityGaps: number;
  sourcesAnalyzed: number;
  coverageRatio: number;
}): ScoreExplanation {
  const score = normalizeConfidence(input.score);
  const increasedBy: string[] = [];
  const reducedBy: string[] = [];

  if (input.evidenceQuoteCount >= 3) {
    increasedBy.push(
      `${input.evidenceQuoteCount} supporting evidence quotes were mapped to competencies.`
    );
  }
  if (input.sourcesAnalyzed >= 4) {
    increasedBy.push(
      `${input.sourcesAnalyzed} evidence sources were available for cross-checking.`
    );
  }
  if (input.coverageRatio >= 0.7) {
    increasedBy.push("Most required competencies have mapped evidence.");
  }

  if (input.highSeverityGaps > 0) {
    reducedBy.push(
      `${input.highSeverityGaps} high-severity evidence gap${input.highSeverityGaps === 1 ? "" : "s"} remain unresolved.`
    );
  }
  if (input.coverageRatio < 0.5) {
    reducedBy.push("Fewer than half of competencies have strong coverage.");
  }
  if (input.evidenceQuoteCount < 2) {
    reducedBy.push("Limited verbatim evidence quotes were available.");
  }

  if (increasedBy.length === 0) {
    increasedBy.push("Baseline evidence package was processed successfully.");
  }
  if (reducedBy.length === 0) {
    reducedBy.push("No major evidence quality risks were detected.");
  }

  return {
    score,
    label: scoreToConfidenceLabel(score),
    summary:
      "AI confidence reflects evidence coverage quality for debrief—not hire confidence.",
    increasedBy,
    reducedBy,
  };
}

export function buildCoverageExplanation(input: {
  covered: number;
  total: number;
  partiallyCovered: number;
  missing: number;
}): ScoreExplanation {
  const total = Math.max(0, input.total);
  const covered = Math.max(0, input.covered);
  const score =
    total === 0 ? 0 : normalizeConfidence((covered / total) * 100);

  const increasedBy: string[] = [];
  const reducedBy: string[] = [];

  if (covered > 0) {
    increasedBy.push(`${covered} of ${total} competencies have supporting evidence.`);
  }
  if (input.partiallyCovered > 0) {
    reducedBy.push(
      `${input.partiallyCovered} competencies are only partially covered.`
    );
  }
  if (input.missing > 0) {
    reducedBy.push(`${input.missing} competencies are missing evidence.`);
  }
  if (increasedBy.length === 0) {
    increasedBy.push("Competency framework was established from the job description.");
  }
  if (reducedBy.length === 0) {
    reducedBy.push("No uncovered competencies remain.");
  }

  return {
    score,
    label: scoreToConfidenceLabel(score),
    summary: `Coverage is ${covered}/${total} competencies with mapped evidence.`,
    increasedBy,
    reducedBy,
  };
}

export function buildAlignmentExplanation(input: {
  percent: number;
  interviewerCount: number;
  concernCount: number;
}): ScoreExplanation {
  const score = normalizeConfidence(input.percent);
  const increasedBy: string[] = [];
  const reducedBy: string[] = [];

  if (input.interviewerCount >= 2) {
    increasedBy.push(
      `Feedback from ${input.interviewerCount} interviewers was compared.`
    );
  }
  if (score >= 70) {
    increasedBy.push("Panel signals largely agree on evidence strength.");
  }
  if (input.concernCount > 0) {
    reducedBy.push(
      `${input.concernCount} interviewer concern${input.concernCount === 1 ? "" : "s"} may need debrief clarification.`
    );
  }
  if (score < 60) {
    reducedBy.push("Interviewer confidence signals diverge materially.");
  }
  if (increasedBy.length === 0) {
    increasedBy.push("Interviewer notes were included in the evidence package.");
  }
  if (reducedBy.length === 0) {
    reducedBy.push("No material interviewer disagreements were detected.");
  }

  return {
    score,
    label: scoreToConfidenceLabel(score),
    summary: "Alignment measures agreement across interview rounds—not hire recommendation.",
    increasedBy,
    reducedBy,
  };
}
