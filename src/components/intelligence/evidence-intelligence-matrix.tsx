"use client";

import { memo, useId, useMemo, useState } from "react";
import { ChevronDown, MessageSquareQuote } from "lucide-react";
import type {
  CompetencyBar,
  EvidenceMappingRow,
} from "@/components/intelligence/dashboard-data";
import {
  EvidenceStrengthStars,
  MatrixStatusIcon,
  PresenceMark,
} from "@/components/intelligence/evidence-icons";
import {
  EVIDENCE_DOC_COLUMNS,
  competencySupportStatus,
  coverageWhyExplanation,
  evidenceStrengthFromScore,
  matchDocumentColumn,
  matrixCellMark,
  type DocumentPresenceKey,
  type MatrixCellMark,
} from "@/components/intelligence/presentation-utils";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

interface EvidenceIntelligenceMatrixProps {
  competencies: CompetencyBar[];
  evidenceMapping: EvidenceMappingRow[];
  competenciesCovered: number;
  supportingQuotesCount: number;
  evidenceSourcesCount: number;
  className?: string;
}

interface QuoteByDoc {
  label: string;
  key: DocumentPresenceKey | "Other";
  quotes: Array<{
    text: string;
    confidence: "High" | "Medium" | "Low";
    pageNumber: number | null;
    section: string | null;
  }>;
}

interface MatrixRow {
  competency: string;
  cells: Record<
    DocumentPresenceKey,
    { mark: MatrixCellMark; quoteCount: number; preview: string }
  >;
}

const TIMELINE_STEPS: DocumentPresenceKey[] = [
  "Resume",
  "Interview",
  "Scorecard",
  "HM",
];

function confidenceTone(confidence: string) {
  if (confidence === "High") return "bg-[#DCFCE7] text-[#166534]";
  if (confidence === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function statusTone(status: string) {
  if (status === "Fully Supported") return "bg-[#DCFCE7] text-[#166534]";
  if (status === "Partially Supported") return "bg-[#FEF3C7] text-[#92400E]";
  if (status === "No Evidence") return "bg-[#FEE2E2] text-[#991B1B]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function groupQuotesForCompetency(
  competencyName: string,
  mapping: EvidenceMappingRow[],
  fallbackQuotes: string[]
): QuoteByDoc[] {
  const rows = mapping.filter((row) => row.competency === competencyName);
  const buckets = new Map<string, QuoteByDoc>();

  for (const row of rows) {
    const key = matchDocumentColumn(row.sourceLabel) ?? "Other";
    const label =
      EVIDENCE_DOC_COLUMNS.find((c) => c.key === key)?.full ??
      (row.sourceLabel || "Document");
    const bucketKey = `${key}:${label}`;
    const existing = buckets.get(bucketKey);
    const text = row.evidence?.trim() ?? "";
    if (!existing) {
      buckets.set(bucketKey, {
        label,
        key,
        quotes: text
          ? [
              {
                text,
                confidence: row.confidence,
                pageNumber: row.pageNumber,
                section: row.section,
              },
            ]
          : [],
      });
    } else if (text) {
      existing.quotes.push({
        text,
        confidence: row.confidence,
        pageNumber: row.pageNumber,
        section: row.section,
      });
    }
  }

  if (buckets.size === 0 && fallbackQuotes.length > 0) {
    return [
      {
        label: "Supporting Evidence",
        key: "Other",
        quotes: fallbackQuotes
          .map((q) => q.trim())
          .filter(Boolean)
          .map((text) => ({
            text,
            confidence: "Medium" as const,
            pageNumber: null,
            section: null,
          })),
      },
    ];
  }

  const order = EVIDENCE_DOC_COLUMNS.map((c) => c.key);
  return [...buckets.values()].sort((a, b) => {
    const ai = a.key === "Other" ? 99 : order.indexOf(a.key);
    const bi = b.key === "Other" ? 99 : order.indexOf(b.key);
    return ai - bi;
  });
}

function buildMatrixRows(
  competencies: CompetencyBar[],
  mapping: EvidenceMappingRow[]
): MatrixRow[] {
  return competencies.map((comp) => {
    const cells = {} as MatrixRow["cells"];
    for (const col of EVIDENCE_DOC_COLUMNS) {
      const matching = mapping.filter((row) => {
        if (row.competency !== comp.name) return false;
        return matchDocumentColumn(row.sourceLabel) === col.key;
      });
      const quoteCount = matching.filter((r) => r.evidence?.trim()).length;
      let best: "High" | "Medium" | "Low" | undefined;
      for (const row of matching) {
        if (row.confidence === "High") best = "High";
        else if (row.confidence === "Medium" && best !== "High")
          best = "Medium";
        else if (!best) best = row.confidence;
      }
      const preview =
        matching.find((r) => r.evidence?.trim())?.evidence?.trim() ?? "";
      cells[col.key] = {
        mark: matrixCellMark(quoteCount || matching.length, best),
        quoteCount: quoteCount || matching.length,
        preview,
      };
    }
    return { competency: comp.name, cells };
  });
}

/**
 * Evidence Intelligence Matrix — expandable competency evidence cards.
 * Presentation only; uses existing dashboard competency + mapping data.
 */
export const EvidenceIntelligenceMatrix = memo(function EvidenceIntelligenceMatrix({
  competencies,
  evidenceMapping,
  competenciesCovered,
  supportingQuotesCount,
  evidenceSourcesCount,
  className,
}: EvidenceIntelligenceMatrixProps) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [matrixTip, setMatrixTip] = useState<string | null>(null);

  const averageCoverage = useMemo(() => {
    if (competencies.length === 0) return 0;
    const sum = competencies.reduce((acc, c) => acc + c.score, 0);
    return Math.round(sum / competencies.length);
  }, [competencies]);

  const matrixRows = useMemo(
    () => buildMatrixRows(competencies, evidenceMapping),
    [competencies, evidenceMapping]
  );

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-white transition-colors duration-150",
        className
      )}
      aria-labelledby={`${baseId}-title`}
    >
      {/* Header + KPIs */}
      <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-3.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4">
        <div className="min-w-0">
          <h2
            id={`${baseId}-title`}
            className="text-[13px] font-semibold tracking-tight text-[#0F172A]"
          >
            Evidence Intelligence Matrix
          </h2>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Competency coverage, evidence strength, and document support
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {[
            {
              label: "Competencies Covered",
              value: `${competenciesCovered}/${competencies.length}`,
            },
            {
              label: "Evidence Quotes",
              value: String(supportingQuotesCount),
            },
            {
              label: "Evidence Sources",
              value: String(evidenceSourcesCount),
            },
            {
              label: "Average Coverage",
              value: formatPercentage(averageCoverage),
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
            >
              <dt className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                {kpi.label}
              </dt>
              <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#0F172A]">
                {kpi.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Coverage matrix */}
      <div className="overflow-x-auto border-b border-[#E5E7EB] px-3.5 py-3 sm:px-4">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Coverage Matrix
        </p>
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">
            Competency evidence presence by document type. Checkmark means
            strong support, tilde means partial, dash means none.
          </caption>
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th
                scope="col"
                className="py-1.5 pr-2 text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase"
              >
                Competency
              </th>
              {EVIDENCE_DOC_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-1 py-1.5 text-center text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase"
                >
                  {col.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row, rowIdx) => (
              <tr
                key={`matrix-row-${rowIdx}-${row.competency}`}
                className="border-b border-[#F1F5F9] last:border-0"
              >
                <th
                  scope="row"
                  className="max-w-[160px] truncate py-1.5 pr-2 text-[11px] font-medium text-[#0F172A]"
                >
                  {row.competency}
                </th>
                {EVIDENCE_DOC_COLUMNS.map((col) => {
                  const cell = row.cells[col.key];
                  const tipId = `${baseId}-tip-${row.competency}-${col.key}`;
                  const showTip = matrixTip === tipId && cell.preview;
                  return (
                    <td key={col.key} className="relative px-1 py-1.5 text-center">
                      <button
                        type="button"
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded transition-colors duration-100",
                          cell.mark !== "none" &&
                            "hover:bg-[#E8F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#064E3B]"
                        )}
                        aria-label={`${row.competency}, ${col.full}: ${
                          cell.mark === "supported"
                            ? "supported"
                            : cell.mark === "partial"
                              ? "partial"
                              : "no evidence"
                        }${cell.quoteCount ? `, ${cell.quoteCount} quotes` : ""}`}
                        onMouseEnter={() =>
                          cell.preview && setMatrixTip(tipId)
                        }
                        onMouseLeave={() => setMatrixTip(null)}
                        onFocus={() => cell.preview && setMatrixTip(tipId)}
                        onBlur={() => setMatrixTip(null)}
                      >
                        <MatrixStatusIcon mark={cell.mark} />
                      </button>
                      {showTip ? (
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-48 -translate-x-1/2 rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5 text-left text-[10px] leading-snug text-[#334155] shadow-sm transition-opacity duration-100"
                        >
                          {cell.preview.length > 120
                            ? `${cell.preview.slice(0, 117)}…`
                            : cell.preview}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-[#94A3B8]">
          <span className="inline-flex items-center gap-1">
            <MatrixStatusIcon mark="supported" /> supported
          </span>
          <span className="inline-flex items-center gap-1">
            <MatrixStatusIcon mark="partial" /> partial
          </span>
          <span className="inline-flex items-center gap-1">
            <MatrixStatusIcon mark="none" /> none
          </span>
        </p>
      </div>

      {/* Expandable competency cards */}
      <ul className="list-none space-y-2 p-3.5 sm:p-4" role="list">
        {competencies.map((item) => {
          const isOpen = expanded.has(item.name);
          const panelId = `${baseId}-panel-${item.name.replace(/\s+/g, "-")}`;
          const buttonId = `${baseId}-btn-${item.name.replace(/\s+/g, "-")}`;
          const strength = evidenceStrengthFromScore(item.score);
          const status = competencySupportStatus(
            item.score,
            item.documentTypes.length,
            item.evidenceCount || item.supportingQuotes.length
          );
          const quoteGroups = groupQuotesForCompetency(
            item.name,
            evidenceMapping,
            item.supportingQuotes
          );
          const totalQuotes =
            quoteGroups.reduce((n, g) => n + g.quotes.length, 0) ||
            item.evidenceCount ||
            item.supportingQuotes.length;
          const why = coverageWhyExplanation({
            score: item.score,
            confidenceLevel: item.confidenceLevel,
            documentTypes: item.documentTypes,
            confidenceReason: item.confidenceReason,
          });
          const presentKeys = new Set(
            item.documentTypes
              .map((d) => matchDocumentColumn(d))
              .filter((k): k is DocumentPresenceKey => Boolean(k))
          );
          for (const g of quoteGroups) {
            if (g.key !== "Other") presentKeys.add(g.key);
          }

          return (
            <li
              key={`competency-${item.name}-${item.score}`}
              className="overflow-hidden rounded-lg border border-[#E5E7EB] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB]"
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.name)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#064E3B]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-[#0F172A]">
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        statusTone(status)
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#64748B]">
                    <span className="font-semibold tabular-nums text-[#0F172A]">
                      {formatPercentage(item.score)}
                      <span className="ml-0.5 font-normal text-[#94A3B8]">
                        coverage
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-semibold",
                        confidenceTone(item.confidenceLevel)
                      )}
                    >
                      {item.confidenceLevel} Confidence
                    </span>
                    <EvidenceStrengthStars
                      filled={strength.filled}
                      label={strength.label}
                    />
                    <span>
                      {totalQuotes} Quote{totalQuotes === 1 ? "" : "s"}
                    </span>
                    <span>
                      {item.documentTypes.length} Document
                      {item.documentTypes.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full bg-[#064E3B] transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.min(100, item.score)}%` }}
                    />
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-[#64748B] transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden",
                    !isOpen && "pointer-events-none"
                  )}
                >
                  <div className="space-y-3 border-t border-[#E5E7EB] bg-[#FAFAFA] px-3 py-3">
                    {/* Overview */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                        Overview
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#334155]">
                        {item.missingEvidence.length > 0 && totalQuotes === 0
                          ? `Gap focus: ${item.missingEvidence.slice(0, 2).join("; ")}`
                          : why}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2">
                        <p className="text-[10px] font-semibold text-[#94A3B8] uppercase">
                          Coverage
                        </p>
                        <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#0F172A]">
                          {formatPercentage(item.score)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2">
                        <p className="text-[10px] font-semibold text-[#94A3B8] uppercase">
                          Evidence Confidence
                        </p>
                        <p className="mt-0.5 text-[14px] font-semibold text-[#0F172A]">
                          {item.confidenceLevel}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2">
                        <p className="text-[10px] font-semibold text-[#94A3B8] uppercase">
                          Strength
                        </p>
                        <div className="mt-0.5">
                          <EvidenceStrengthStars
                            filled={strength.filled}
                            label={strength.label}
                            size="md"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Why */}
                    <div className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2">
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                        Why?
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#475569]">
                        {why}
                      </p>
                    </div>

                    {/* Supporting documents */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                        Supporting Documents
                      </p>
                      <ul className="mt-1.5 list-none space-y-1.5 p-0">
                        {EVIDENCE_DOC_COLUMNS.filter((c) => c.key !== "JD").map(
                          (col) => {
                            const group = quoteGroups.find(
                              (g) => g.key === col.key
                            );
                            const count = group?.quotes.length ?? 0;
                            const present = presentKeys.has(col.key);
                            return (
                              <li
                                key={col.key}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <PresenceMark present={present} />
                                  <span className="text-[12px] font-medium text-[#0F172A]">
                                    {col.full}
                                  </span>
                                  <span className="text-[10px] text-[#94A3B8]">
                                    {count} quote{count === 1 ? "" : "s"}
                                  </span>
                                </div>
                                {present ? (
                                  <a
                                    href={`#${panelId}-quotes`}
                                    className="text-[10px] font-semibold text-[#064E3B] hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (!isOpen) toggle(item.name);
                                      requestAnimationFrame(() => {
                                        document
                                          .getElementById(`${panelId}-quotes`)
                                          ?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "nearest",
                                          });
                                      });
                                    }}
                                  >
                                    Open Evidence
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-[#94A3B8]">
                                    Not Available
                                  </span>
                                )}
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </div>

                    {/* Evidence timeline */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                        Evidence Timeline
                      </p>
                      <ol className="mt-2 flex list-none flex-wrap items-center gap-1 p-0">
                        {TIMELINE_STEPS.map((key, idx) => {
                          const col = EVIDENCE_DOC_COLUMNS.find(
                            (c) => c.key === key
                          )!;
                          const active = presentKeys.has(key);
                          return (
                            <li
                              key={key}
                              className="flex items-center gap-1"
                            >
                              <span
                                className={cn(
                                  "rounded-md border px-2 py-1 text-[10px] font-semibold",
                                  active
                                    ? "border-[#064E3B]/30 bg-[#E8F5EF] text-[#064E3B]"
                                    : "border-[#E5E7EB] bg-white text-[#CBD5E1]"
                                )}
                              >
                                {col.short}
                              </span>
                              {idx < TIMELINE_STEPS.length - 1 ? (
                                <span
                                  className="text-[10px] text-[#CBD5E1]"
                                  aria-hidden="true"
                                >
                                  ↓
                                </span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ol>
                    </div>

                    {/* Supporting quotes */}
                    <div id={`${panelId}-quotes`}>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                        Supporting Quotes
                      </p>
                      {totalQuotes === 0 ? (
                        <div className="mt-1.5 rounded-lg border border-dashed border-[#E5E7EB] bg-white px-3 py-3">
                          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748B]">
                            <MessageSquareQuote
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            No supporting evidence detected.
                          </p>
                          <p className="mt-1 text-[11px] text-[#94A3B8]">
                            Suggested recruiter action: Ask candidate for an
                            example.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1.5 space-y-2.5">
                          {quoteGroups.map((group, gi) => (
                            <div key={`${item.name}-${group.key}-${group.label}-${gi}`}>
                              <p className="text-[11px] font-semibold text-[#0F172A]">
                                {group.label}
                              </p>
                              {group.quotes.length === 0 ? (
                                <p className="mt-1 text-[11px] text-[#94A3B8]">
                                  Not Available
                                </p>
                              ) : (
                                <ul className="mt-1 list-none space-y-1.5 p-0">
                                  {group.quotes.map((q, qi) => (
                                    <li
                                      key={`${group.label}-${qi}`}
                                      className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-2"
                                    >
                                      <p className="text-[11px] leading-relaxed text-[#334155]">
                                        &ldquo;{q.text}&rdquo;
                                      </p>
                                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#94A3B8]">
                                        <span
                                          className={cn(
                                            "rounded px-1 py-0.5 font-semibold",
                                            confidenceTone(q.confidence)
                                          )}
                                        >
                                          {q.confidence}
                                        </span>
                                        {q.section ? (
                                          <span>{q.section}</span>
                                        ) : null}
                                        {q.pageNumber !== null ? (
                                          <span>p.{q.pageNumber}</span>
                                        ) : null}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
