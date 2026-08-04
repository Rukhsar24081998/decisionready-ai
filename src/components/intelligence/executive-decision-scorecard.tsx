"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Target,
} from "lucide-react";
import type {
  EvidenceGapRow,
  ReadinessWeights,
} from "@/components/intelligence/dashboard-data";
import { ReadinessRadial } from "@/components/intelligence/readiness-radial";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

type OverallStatus = "Ready" | "Needs More Evidence" | "Not Ready";

interface ExecutiveDecisionScorecardProps {
  analysisId: string;
  readinessScore: number;
  readinessLabel: string;
  readinessSubtitle: string;
  readinessExplanation: string;
  readinessBreakdown: {
    competencyCoverage: number;
    evidenceQuality: number;
    interviewerAlignment: number;
    evidenceCompleteness: number;
    topStrength: string;
    topRisk: string;
  };
  readinessWeights: ReadinessWeights;
  evidenceGaps: EvidenceGapRow[];
  evidenceSourcesCount: number;
  supportingQuotesCount: number;
  competenciesCovered: number;
  competenciesTotal: number;
  evidenceConfidence: number;
  className?: string;
}

function deriveOverallStatus(score: number, label: string): OverallStatus {
  const lower = label.toLowerCase();
  if (
    lower.includes("not ready") ||
    lower.includes("insufficient") ||
    score < 55
  ) {
    return "Not Ready";
  }
  if (
    lower.includes("partial") ||
    lower.includes("more evidence") ||
    lower.includes("needs") ||
    score < 80
  ) {
    return "Needs More Evidence";
  }
  return "Ready";
}

function statusTone(status: OverallStatus) {
  if (status === "Ready") return "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]";
  if (status === "Needs More Evidence")
    return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
  return "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]";
}

function severityTone(severity: string) {
  if (severity === "High") return "bg-[#FEE2E2] text-[#991B1B]";
  if (severity === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function pillarExplanation(label: string, score: number): string {
  if (score >= 80) {
    if (label.includes("Competency")) return "Strong coverage across required competencies.";
    if (label.includes("Quality")) return "Quotes and sources are consistent and usable.";
    if (label.includes("Completeness")) return "Document set covers the hiring package.";
    return "Interviewers show high agreement on signals.";
  }
  if (score >= 55) {
    if (label.includes("Competency")) return "Partial coverage — some competencies need more evidence.";
    if (label.includes("Quality")) return "Evidence exists but depth or consistency varies.";
    if (label.includes("Completeness")) return "Some document types are thin or missing.";
    return "Interviewer signals are mixed or incomplete.";
  }
  if (label.includes("Competency")) return "Coverage gaps limit debrief readiness.";
  if (label.includes("Quality")) return "Evidence quality is too thin for confident discussion.";
  if (label.includes("Completeness")) return "Package is incomplete relative to required sources.";
  return "Low alignment across interviewer evidence.";
}

function buildWhyPoints(breakdown: ExecutiveDecisionScorecardProps["readinessBreakdown"]) {
  const checks: string[] = [];
  if (breakdown.competencyCoverage >= 70)
    checks.push("Strong competency coverage");
  if (breakdown.interviewerAlignment >= 70)
    checks.push("High interviewer agreement");
  if (breakdown.evidenceQuality >= 70)
    checks.push("Multiple evidence sources with usable quality");
  if (breakdown.evidenceCompleteness >= 70)
    checks.push("Low ambiguity across the hiring package");

  if (checks.length === 0) {
    if (breakdown.competencyCoverage >= 50)
      checks.push("Partial competency coverage is available");
    if (breakdown.evidenceQuality >= 50)
      checks.push("Some supporting evidence exists");
    if (checks.length === 0)
      checks.push("Baseline evidence was processed for review");
  }

  return checks;
}

function nextActionForStatus(status: OverallStatus, topRisk: string) {
  if (status === "Ready") {
    return {
      step: "Proceed to Hiring Debrief",
      time: "20 minutes",
      priority: "High" as const,
      detail:
        "Evidence package is sufficient for a structured debrief. Never a hire/reject recommendation.",
    };
  }
  if (status === "Needs More Evidence") {
    return {
      step: "Close priority evidence gaps before debrief",
      time: "30 minutes",
      priority: "High" as const,
      detail:
        topRisk && topRisk !== "—"
          ? `Focus validation on: ${topRisk}`
          : "Gather missing quotes or interviewer signals, then reopen readiness.",
    };
  }
  return {
    step: "Collect critical evidence before scheduling debrief",
    time: "45 minutes",
    priority: "High" as const,
    detail:
      topRisk && topRisk !== "—"
        ? `Blocking risk: ${topRisk}`
        : "Readiness is too low for a productive hiring debrief.",
  };
}

function estimateTimeFromGaps(gaps: EvidenceGapRow[], fallback: string): string {
  const times = gaps
    .map((g) => g.estimatedDiscussionTime?.trim())
    .filter(Boolean);
  if (times.length === 0) return fallback;
  // Prefer first high-severity estimate; otherwise first available
  const high = gaps.find(
    (g) => g.severity === "High" && g.estimatedDiscussionTime?.trim()
  );
  return high?.estimatedDiscussionTime?.trim() || times[0]!;
}

/**
 * Executive Decision Scorecard — presentation-only readiness summary.
 */
export function ExecutiveDecisionScorecard({
  analysisId,
  readinessScore,
  readinessLabel,
  readinessSubtitle,
  readinessExplanation,
  readinessBreakdown,
  readinessWeights,
  evidenceGaps,
  evidenceSourcesCount,
  supportingQuotesCount,
  competenciesCovered,
  competenciesTotal,
  evidenceConfidence,
  className,
}: ExecutiveDecisionScorecardProps) {
  const baseId = useId();
  const [whyOpen, setWhyOpen] = useState(true);
  const [risksOpen, setRisksOpen] = useState(true);

  const status = deriveOverallStatus(readinessScore, readinessLabel);
  const whyPoints = buildWhyPoints(readinessBreakdown);
  const action = nextActionForStatus(status, readinessBreakdown.topRisk);
  const estimatedTime = estimateTimeFromGaps(evidenceGaps, action.time);

  const pillars = [
    {
      label: "Competency Coverage",
      value: readinessBreakdown.competencyCoverage,
      weight: readinessWeights.competencyCoverage,
    },
    {
      label: "Evidence Quality",
      value: readinessBreakdown.evidenceQuality,
      weight: readinessWeights.evidenceQuality,
    },
    {
      label: "Evidence Completeness",
      value: readinessBreakdown.evidenceCompleteness,
      weight: readinessWeights.evidenceCompleteness,
    },
    {
      label: "Interviewer Alignment",
      value: readinessBreakdown.interviewerAlignment,
      weight: readinessWeights.interviewerAlignment,
    },
  ];

  const risksBySeverity = {
    High: evidenceGaps.filter((g) => g.severity === "High"),
    Medium: evidenceGaps.filter((g) => g.severity === "Medium"),
    Low: evidenceGaps.filter((g) => g.severity === "Low"),
  } as const;

  const remainingConcern =
    readinessBreakdown.topRisk && readinessBreakdown.topRisk !== "—"
      ? readinessBreakdown.topRisk
      : evidenceGaps[0]?.title ||
        evidenceGaps[0]?.text ||
        "No critical remaining concerns identified.";

  return (
    <section
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-white transition-colors duration-150",
        className
      )}
      aria-labelledby={`${baseId}-title`}
    >
      {/* Top — score */}
      <div className="border-b border-[#E5E7EB] px-3.5 py-3.5 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id={`${baseId}-title`}
              className="text-[13px] font-semibold tracking-tight text-[#0F172A]"
            >
              Executive Decision Scorecard
            </h2>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              Decision readiness for hiring debrief — never Hire or Reject
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Overall status">
            {(
              [
                "Ready",
                "Needs More Evidence",
                "Not Ready",
              ] as OverallStatus[]
            ).map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150",
                  s === status
                    ? statusTone(s)
                    : "border-[#E5E7EB] bg-[#F9FAFB] text-[#CBD5E1]"
                )}
                aria-current={s === status ? "true" : undefined}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <ReadinessRadial
            score={readinessScore}
            label={readinessLabel}
            subtitle={readinessSubtitle || "Ready for Hiring Debrief"}
            animationMs={500}
            compact
          />
        </div>
      </div>

      {/* Decision breakdown */}
      <div className="border-b border-[#E5E7EB] px-3.5 py-3 sm:px-4">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Decision Breakdown
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.label}
              className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#0F172A]">
                  {pillar.label}
                </p>
                <span className="text-[12px] font-semibold tabular-nums text-[#0F172A]">
                  {formatPercentage(pillar.value)}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-[#64748B]">
                {pillarExplanation(pillar.label, pillar.value)}
                <span className="text-[#94A3B8]">
                  {" "}
                  · Weight {Math.round(pillar.weight * 100)}%
                </span>
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#064E3B] transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, pillar.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why this score */}
      <div className="border-b border-[#E5E7EB]">
        <button
          type="button"
          aria-expanded={whyOpen}
          aria-controls={`${baseId}-why`}
          onClick={() => setWhyOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#064E3B] sm:px-4"
        >
          <span className="text-[12px] font-semibold text-[#0F172A]">
            Why This Score?
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-[#64748B] transition-transform duration-200",
              whyOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
        <div
          id={`${baseId}-why`}
          role="region"
          aria-hidden={!whyOpen}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            whyOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div
            className={cn(
              "overflow-hidden",
              !whyOpen && "pointer-events-none"
            )}
          >
            <div className="space-y-2 px-3.5 pb-3 sm:px-4">
              <p className="text-[12px] leading-relaxed text-[#475569]">
                {readinessExplanation ||
                  `Decision Readiness is ${status === "Ready" ? "high" : status === "Needs More Evidence" ? "moderate" : "low"} based on coverage, quality, completeness, and alignment.`}
              </p>
              <ul className="list-none space-y-1 p-0">
                {whyPoints.map((point, pointIdx) => (
                  <li
                    key={`why-${pointIdx}`}
                    className="flex items-start gap-1.5 text-[12px] text-[#334155]"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-[#166534]"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              {readinessBreakdown.topStrength &&
              readinessBreakdown.topStrength !== "—" ? (
                <p className="text-[11px] text-[#64748B]">
                  Top strength:{" "}
                  <span className="font-medium text-[#0F172A]">
                    {readinessBreakdown.topStrength}
                  </span>
                </p>
              ) : null}
              <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-2">
                <p className="text-[10px] font-semibold tracking-[0.04em] text-[#92400E] uppercase">
                  Remaining Concern
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#78350F]">
                  {remainingConcern}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next best action */}
      <div className="border-b border-[#E5E7EB] px-3.5 py-3 sm:px-4">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Next Best Action
        </p>
        <div className="mt-2 rounded-lg border border-[#064E3B]/20 bg-[#E8F5EF]/50 px-3 py-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#064E3B]/35">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase">
                Recommended Next Step
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#0F172A]">
                {action.step}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#475569]">
                {action.detail}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <div className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5">
                <p className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                  <Clock3 className="size-3" aria-hidden="true" />
                  Estimated Time
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#0F172A]">
                  {estimatedTime}
                </p>
              </div>
              <div className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5">
                <p className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                  Priority
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#991B1B]">
                  {action.priority}
                </p>
              </div>
            </div>
          </div>
          <Link
            href={`/analyses/${analysisId}/brief`}
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-[#053F30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B]"
          >
            <Target className="size-3.5" aria-hidden="true" />
            Open Decision Brief
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Decision risks */}
      <div className="border-b border-[#E5E7EB]">
        <button
          type="button"
          aria-expanded={risksOpen}
          aria-controls={`${baseId}-risks`}
          onClick={() => setRisksOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#064E3B] sm:px-4"
        >
          <span className="text-[12px] font-semibold text-[#0F172A]">
            Decision Risks
            <span className="ml-1.5 text-[10px] font-medium text-[#94A3B8]">
              {evidenceGaps.length}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-[#64748B] transition-transform duration-200",
              risksOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
        <div
          id={`${baseId}-risks`}
          role="region"
          aria-hidden={!risksOpen}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            risksOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div
            className={cn(
              "overflow-hidden",
              !risksOpen && "pointer-events-none"
            )}
          >
            <div className="space-y-2.5 px-3.5 pb-3 sm:px-4">
              {evidenceGaps.length === 0 ? (
                <p className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#64748B]">
                  No decision risks flagged for this package.
                </p>
              ) : (
                (["High", "Medium", "Low"] as const).map((severity) => {
                  const items = risksBySeverity[severity];
                  if (items.length === 0) return null;
                  return (
                    <div key={severity}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            severityTone(severity)
                          )}
                        >
                          {severity}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {items.length} risk{items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <ul className="list-none space-y-1.5 p-0">
                        {items.map((gap, gapIdx) => (
                          <li
                            key={`${severity}-gap-${gapIdx}-${gap.title}`}
                            className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
                          >
                            <p className="text-[12px] font-semibold text-[#0F172A]">
                              {gap.title || gap.text}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-[#475569]">
                              {gap.whyItMatters || gap.text}
                            </p>
                            <dl className="mt-1.5 grid gap-1 sm:grid-cols-2">
                              <div>
                                <dt className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                                  Evidence Source
                                </dt>
                                <dd className="text-[11px] font-medium text-[#0F172A]">
                                  {gap.relatedCompetency?.trim() ||
                                    "Package-wide gap"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                                  Suggested Validation
                                </dt>
                                <dd className="text-[11px] font-medium text-[#0F172A]">
                                  {gap.recommendedQuestion?.trim() ||
                                    "Ask candidate for a concrete example."}
                                </dd>
                              </div>
                            </dl>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence summary */}
      <div className="px-3.5 py-3 sm:px-4">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Evidence Summary
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {[
            {
              label: "Supporting Documents",
              value: String(evidenceSourcesCount),
            },
            {
              label: "Supporting Quotes",
              value: String(supportingQuotesCount),
            },
            {
              label: "Mapped Competencies",
              value: `${competenciesCovered}/${competenciesTotal}`,
            },
            {
              label: "Evidence Confidence",
              value: formatPercentage(evidenceConfidence),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
            >
              <dt className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#0F172A]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
