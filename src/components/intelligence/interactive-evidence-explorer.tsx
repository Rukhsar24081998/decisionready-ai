"use client";

import { memo, useId, useMemo, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Search,
  TreePine,
} from "lucide-react";
import type { EvidenceMappingRow } from "@/components/intelligence/dashboard-data";
import {
  EVIDENCE_DOC_COLUMNS,
  evidenceStrengthFromScore,
  matchDocumentColumn,
  type DocumentPresenceKey,
} from "@/components/intelligence/presentation-utils";
import { EvidenceStrengthStars } from "@/components/intelligence/evidence-icons";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

type DocFilter = "All" | DocumentPresenceKey;
type SortMode =
  | "most-evidence"
  | "highest-confidence"
  | "lowest-confidence"
  | "alphabetical";

interface InteractiveEvidenceExplorerProps {
  evidenceMapping: EvidenceMappingRow[];
  evidenceNodesCount: number;
  className?: string;
}

interface GroupedEvidence {
  competency: string;
  rows: EvidenceMappingRow[];
  quoteCount: number;
  documentKeys: DocumentPresenceKey[];
  documentLabels: string[];
  avgConfidence: number;
  bestConfidence: "High" | "Medium" | "Low";
}

interface SourceGroup {
  key: DocumentPresenceKey | "Other";
  label: string;
  rows: EvidenceMappingRow[];
}

const FILTERS: Array<{ id: DocFilter; label: string }> = [
  { id: "All", label: "All" },
  { id: "Resume", label: "Resume" },
  { id: "Interview", label: "Interview" },
  { id: "Scorecard", label: "Scorecard" },
  { id: "HM", label: "Hiring Manager" },
  { id: "JD", label: "JD" },
];

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: "most-evidence", label: "Most Evidence" },
  { id: "highest-confidence", label: "Highest Confidence" },
  { id: "lowest-confidence", label: "Lowest Confidence" },
  { id: "alphabetical", label: "Alphabetical" },
];

function confidenceTone(confidence: string) {
  if (confidence === "High") return "bg-[#DCFCE7] text-[#166534]";
  if (confidence === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function docBadgeTone(key: DocumentPresenceKey | "Other") {
  switch (key) {
    case "Resume":
      return "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
    case "Interview":
      return "border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]";
    case "Scorecard":
      return "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]";
    case "HM":
      return "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]";
    case "JD":
      return "border-[#E5E7EB] bg-[#F9FAFB] text-[#475569]";
    default:
      return "border-[#E5E7EB] bg-[#F9FAFB] text-[#64748B]";
  }
}

function confidenceRank(c: "High" | "Medium" | "Low"): number {
  if (c === "High") return 3;
  if (c === "Medium") return 2;
  return 1;
}

function bestConfidenceLabel(
  rows: EvidenceMappingRow[]
): "High" | "Medium" | "Low" {
  let best: "High" | "Medium" | "Low" = "Low";
  for (const row of rows) {
    if (confidenceRank(row.confidence) > confidenceRank(best)) {
      best = row.confidence;
    }
  }
  return best;
}

function pageLabel(page: number | null): string {
  return page === null ? "Page Unknown" : `Page ${page}`;
}

function isScorecardish(key: DocumentPresenceKey | "Other"): boolean {
  return key === "Scorecard";
}

function isHmish(key: DocumentPresenceKey | "Other"): boolean {
  return key === "HM";
}

function groupByCompetency(mapping: EvidenceMappingRow[]): GroupedEvidence[] {
  const map = new Map<string, EvidenceMappingRow[]>();
  for (const row of mapping) {
    const key = row.competency.trim() || "Unmapped";
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }

  return [...map.entries()].map(([competency, rows]) => {
    const keys = new Set<DocumentPresenceKey>();
    const labels = new Set<string>();
    let confSum = 0;
    let quoteCount = 0;

    for (const row of rows) {
      const col = matchDocumentColumn(row.sourceLabel);
      if (col) keys.add(col);
      labels.add(row.sourceLabel);
      confSum += row.confidencePercent || 0;
      if (row.evidence?.trim()) quoteCount += 1;
    }

    return {
      competency,
      rows,
      quoteCount: quoteCount || rows.length,
      documentKeys: [...keys],
      documentLabels: [...labels],
      avgConfidence:
        rows.length > 0 ? Math.round(confSum / rows.length) : 0,
      bestConfidence: bestConfidenceLabel(rows),
    };
  });
}

function groupBySource(rows: EvidenceMappingRow[]): SourceGroup[] {
  const buckets = new Map<string, SourceGroup>();
  const order = EVIDENCE_DOC_COLUMNS.map((c) => c.key);

  for (const row of rows) {
    const key = matchDocumentColumn(row.sourceLabel) ?? "Other";
    const label =
      EVIDENCE_DOC_COLUMNS.find((c) => c.key === key)?.full ??
      (row.sourceLabel || "Document");
    const bucketKey = `${key}:${label}`;
    const existing = buckets.get(bucketKey);
    if (!existing) {
      buckets.set(bucketKey, { key, label, rows: [row] });
    } else {
      existing.rows.push(row);
    }
  }

  return [...buckets.values()].sort((a, b) => {
    const ai = a.key === "Other" ? 99 : order.indexOf(a.key);
    const bi = b.key === "Other" ? 99 : order.indexOf(b.key);
    return ai - bi;
  });
}

function rowMatchesFilter(
  row: EvidenceMappingRow,
  filter: DocFilter
): boolean {
  if (filter === "All") return true;
  return matchDocumentColumn(row.sourceLabel) === filter;
}

/**
 * Competency-centric Interactive Evidence Explorer.
 * Presentation only — client-side search / filter / sort over existing mapping.
 */
export const InteractiveEvidenceExplorer = memo(function InteractiveEvidenceExplorer({
  evidenceMapping,
  evidenceNodesCount,
  className,
}: InteractiveEvidenceExplorerProps) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<DocFilter>("All");
  const [sort, setSort] = useState<SortMode>("most-evidence");
  const [query, setQuery] = useState("");
  const [hoveredCompetency, setHoveredCompetency] = useState<string | null>(
    null
  );
  const [focusedEvidence, setFocusedEvidence] = useState<string | null>(null);

  const grouped = useMemo(
    () => groupByCompetency(evidenceMapping),
    [evidenceMapping]
  );

  const stats = useMemo(() => {
    const uniqueQuotes = new Set(
      evidenceMapping
        .map((r) => r.evidence?.trim())
        .filter((q): q is string => Boolean(q))
    );
    const docSources = new Set(
      evidenceMapping.map((r) => r.sourceLabel).filter(Boolean)
    );
    const avg =
      evidenceMapping.length === 0
        ? 0
        : Math.round(
            evidenceMapping.reduce(
              (s, r) => s + (r.confidencePercent || 0),
              0
            ) / evidenceMapping.length
          );
    return {
      nodes: evidenceNodesCount || evidenceMapping.length,
      quotes: uniqueQuotes.size || evidenceMapping.filter((r) => r.evidence?.trim()).length,
      sources: docSources.size,
      competencies: grouped.length,
      avgConfidence: avg,
      documentCoverage: docSources.size,
    };
  }, [evidenceMapping, evidenceNodesCount, grouped.length]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = grouped
      .map((g) => {
        const filteredRows = g.rows.filter((row) => {
          if (!rowMatchesFilter(row, filter)) return false;
          if (!q) return true;
          const hay = [
            g.competency,
            row.evidence ?? "",
            row.sourceLabel,
            row.source,
            row.section ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        });
        if (filteredRows.length === 0 && (filter !== "All" || q)) {
          // Keep competency if name matches search even with empty filtered rows
          if (q && g.competency.toLowerCase().includes(q) && filter === "All") {
            return { ...g, rows: g.rows };
          }
          return null;
        }
        if (filter !== "All" || q) {
          const keys = new Set<DocumentPresenceKey>();
          const labels = new Set<string>();
          let confSum = 0;
          let quoteCount = 0;
          for (const row of filteredRows) {
            const col = matchDocumentColumn(row.sourceLabel);
            if (col) keys.add(col);
            labels.add(row.sourceLabel);
            confSum += row.confidencePercent || 0;
            if (row.evidence?.trim()) quoteCount += 1;
          }
          return {
            ...g,
            rows: filteredRows,
            quoteCount: quoteCount || filteredRows.length,
            documentKeys: [...keys],
            documentLabels: [...labels],
            avgConfidence:
              filteredRows.length > 0
                ? Math.round(confSum / filteredRows.length)
                : 0,
            bestConfidence: bestConfidenceLabel(filteredRows),
          };
        }
        return g;
      })
      .filter((g): g is GroupedEvidence => g !== null);

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "highest-confidence":
          return b.avgConfidence - a.avgConfidence;
        case "lowest-confidence":
          return a.avgConfidence - b.avgConfidence;
        case "alphabetical":
          return a.competency.localeCompare(b.competency);
        case "most-evidence":
        default:
          return b.quoteCount - a.quoteCount || b.rows.length - a.rows.length;
      }
    });

    return list;
  }, [grouped, filter, query, sort]);

  const hoveredDocs = useMemo(() => {
    if (!hoveredCompetency) return new Set<string>();
    const group = grouped.find((g) => g.competency === hoveredCompetency);
    return new Set(group?.documentLabels ?? []);
  }, [hoveredCompetency, grouped]);

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
      id="evidence-mapping"
      className={cn(
        "scroll-mt-20 rounded-xl border border-[#E5E7EB] bg-white transition-colors duration-150",
        className
      )}
      aria-labelledby={`${baseId}-title`}
    >
      {/* Header + KPIs */}
      <div className="border-b border-[#E5E7EB] px-3.5 py-3 sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2
              id={`${baseId}-title`}
              className="text-[13px] font-semibold tracking-tight text-[#0F172A]"
            >
              Interactive Evidence Explorer
            </h2>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              Competency-first mapping of quotes, sources, and confidence
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Evidence Nodes", value: String(stats.nodes) },
              { label: "Supporting Quotes", value: String(stats.quotes) },
              { label: "Document Sources", value: String(stats.sources) },
              {
                label: "Mapped Competencies",
                value: String(stats.competencies),
              },
              {
                label: "Avg Confidence",
                value: formatPercentage(stats.avgConfidence),
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

        {/* Stats strip */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#F1F5F9] pt-2.5 text-[10px] text-[#64748B]">
          <span>
            Evidence Nodes{" "}
            <strong className="font-semibold text-[#0F172A]">
              {stats.nodes}
            </strong>
          </span>
          <span>
            Unique Quotes{" "}
            <strong className="font-semibold text-[#0F172A]">
              {stats.quotes}
            </strong>
          </span>
          <span>
            Document Coverage{" "}
            <strong className="font-semibold text-[#0F172A]">
              {stats.documentCoverage}
            </strong>
          </span>
          <span>
            Average Confidence{" "}
            <strong className="font-semibold text-[#0F172A]">
              {formatPercentage(stats.avgConfidence)}
            </strong>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 border-b border-[#E5E7EB] px-3.5 py-2.5 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
            <label htmlFor={`${baseId}-search`} className="sr-only">
              Search competencies, quotes, and documents
            </label>
            <input
              id={`${baseId}-search`}
              name="evidenceExplorerSearch"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search competencies, quotes, documents…"
              className="h-8 w-full rounded-lg border border-[#E5E7EB] bg-white py-1.5 pr-3 pl-8 text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] transition-colors duration-150 focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B]/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor={`${baseId}-sort`}
              className="shrink-0 text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase"
            >
              Sort
            </label>
            <select
              id={`${baseId}-sort`}
              name="evidenceExplorerSort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[12px] text-[#0F172A] focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B]/30"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter by document source"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-semibold transition-all duration-150",
                  active
                    ? "border-[#064E3B] bg-[#E8F5EF] text-[#064E3B]"
                    : "border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#D1D5DB] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Competency cards */}
      {visible.length === 0 ? (
        <div className="px-3.5 py-8 text-center sm:px-4">
          <TreePine
            className="mx-auto size-5 text-[#CBD5E1]"
            aria-hidden="true"
          />
          <p className="mt-2 text-[12px] font-medium text-[#0F172A]">
            No evidence matches the current search or filter.
          </p>
          <p className="mt-1 text-[11px] text-[#64748B]">
            Clear filters to see all mapped competencies, or try a different
            keyword.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("All");
              setQuery("");
            }}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] font-semibold text-[#064E3B] transition-colors duration-150 hover:border-[#064E3B]/30 hover:bg-[#E8F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <ul className="list-none space-y-2 p-3.5 sm:p-4" role="list">
          {visible.map((group) => {
            const isOpen = expanded.has(group.competency);
            const panelId = `${baseId}-panel-${group.competency.replace(/\s+/g, "-")}`;
            const buttonId = `${baseId}-btn-${group.competency.replace(/\s+/g, "-")}`;
            const strength = evidenceStrengthFromScore(group.avgConfidence);
            const sources = groupBySource(group.rows);
            const isHovered = hoveredCompetency === group.competency;

            return (
              <li
                key={group.competency}
                className={cn(
                  "overflow-hidden rounded-lg border transition-all duration-150",
                  isHovered
                    ? "border-[#064E3B]/40 shadow-[0_0_0_1px_rgba(6,78,59,0.12)]"
                    : "border-[#E5E7EB] hover:-translate-y-0.5 hover:border-[#D1D5DB]"
                )}
                onMouseEnter={() => setHoveredCompetency(group.competency)}
                onMouseLeave={() => setHoveredCompetency(null)}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(group.competency)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#064E3B]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-[#0F172A]">
                        {group.competency}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          confidenceTone(group.bestConfidence)
                        )}
                      >
                        {group.bestConfidence}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#64748B]">
                      <EvidenceStrengthStars
                        filled={strength.filled}
                        label={strength.label}
                      />
                      <span>
                        {group.documentLabels.length} Document
                        {group.documentLabels.length === 1 ? "" : "s"}
                      </span>
                      <span>
                        {group.quoteCount} Quote
                        {group.quoteCount === 1 ? "" : "s"}
                      </span>
                      <span className="font-semibold tabular-nums text-[#0F172A]">
                        {formatPercentage(group.avgConfidence)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {EVIDENCE_DOC_COLUMNS.filter((c) =>
                        group.documentKeys.includes(c.key)
                      ).map((col) => (
                        <span
                          key={col.key}
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase transition-all duration-[120ms]",
                            docBadgeTone(col.key),
                            isHovered && "ring-1 ring-[#064E3B]/25"
                          )}
                        >
                          {col.short === "HM" ? "Hiring Manager" : col.short}
                        </span>
                      ))}
                      {group.documentKeys.length === 0
                        ? group.documentLabels.slice(0, 4).map((label, li) => (
                            <span
                              key={`${group.competency}-label-${li}-${label}`}
                              className={cn(
                                "rounded border px-1.5 py-0.5 text-[9px] font-semibold transition-all duration-[120ms]",
                                docBadgeTone("Other"),
                                hoveredDocs.has(label) &&
                                  "ring-1 ring-[#064E3B]/25"
                              )}
                            >
                              {label}
                            </span>
                          ))
                        : null}
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
                      {/* Evidence tree */}
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                          Evidence Tree
                        </p>
                        <div
                          className="mt-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2 font-mono text-[11px] leading-relaxed text-[#334155]"
                          role="tree"
                          aria-label={`Evidence tree for ${group.competency}`}
                        >
                          <p className="font-sans text-[12px] font-semibold text-[#0F172A]">
                            {group.competency}
                          </p>
                          {sources.map((source, si) => {
                            const isLast = si === sources.length - 1;
                            const branch = isLast ? "└──" : "├──";
                            const sourceKey = `${group.competency}-${source.key}-${source.label}-${si}`;
                            return (
                              <div key={sourceKey} className="mt-1">
                                <p>
                                  <span className="text-[#94A3B8]">
                                    {branch}{" "}
                                  </span>
                                  <span
                                    className={cn(
                                      "rounded border px-1 py-0.5 font-sans text-[10px] font-semibold",
                                      docBadgeTone(source.key),
                                      (isHovered ||
                                        hoveredDocs.has(source.label)) &&
                                        "ring-1 ring-[#064E3B]/20"
                                    )}
                                  >
                                    {source.label}
                                  </span>
                                </p>
                                {source.rows.map((row, ri) => {
                                  const childLast =
                                    ri === source.rows.length - 1;
                                  const pad = isLast ? "       " : "│      ";
                                  const childBranch = childLast
                                    ? "└──"
                                    : "├──";
                                  const snippet = row.evidence?.trim()
                                    ? row.evidence.trim().length > 72
                                      ? `${row.evidence.trim().slice(0, 69)}…`
                                      : row.evidence.trim()
                                    : isScorecardish(source.key)
                                      ? `Rating · ${row.confidence}`
                                      : isHmish(source.key)
                                        ? "Observation"
                                        : "Evidence";
                                  return (
                                    <p
                                      key={`${sourceKey}-row-${ri}`}
                                      className="text-[#64748B]"
                                      role="treeitem"
                                      aria-selected={false}
                                    >
                                      <span className="text-[#CBD5E1]">
                                        {pad}
                                        {childBranch}{" "}
                                      </span>
                                      <span className="font-sans">
                                        {snippet}
                                      </span>
                                    </p>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Grouped sources */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                          Evidence by Source
                        </p>
                        {sources.map((source, si) => {
                          const sourceKey = `${group.competency}-by-source-${source.key}-${si}`;
                          return (
                          <div
                            key={sourceKey}
                            className={cn(
                              "rounded-lg border border-[#E5E7EB] bg-white transition-all duration-[120ms]",
                              (isHovered || hoveredDocs.has(source.label)) &&
                                "border-[#064E3B]/35 bg-[#F0FDF8]"
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] px-2.5 py-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                                    docBadgeTone(source.key)
                                  )}
                                >
                                  {source.label}
                                </span>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {source.rows.length} item
                                  {source.rows.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                  confidenceTone(
                                    bestConfidenceLabel(source.rows)
                                  )
                                )}
                              >
                                {bestConfidenceLabel(source.rows)} Strength
                              </span>
                            </div>

                            <ul className="list-none divide-y divide-[#F1F5F9] p-0">
                              {source.rows.map((row, idx) => {
                                const evidenceId = `${panelId}-${source.key}-${idx}`;
                                const isFocused = focusedEvidence === evidenceId;
                                return (
                                <li
                                  key={evidenceId}
                                  id={evidenceId}
                                  className={cn(
                                    "px-2.5 py-2 transition-all duration-[120ms]",
                                    isFocused &&
                                      "bg-[#E8F5EF] ring-1 ring-inset ring-[#064E3B]/30"
                                  )}
                                >
                                  {row.evidence?.trim() ? (
                                    <p className="text-[12px] leading-relaxed text-[#334155]">
                                      &ldquo;{row.evidence.trim()}&rdquo;
                                    </p>
                                  ) : (
                                    <p className="text-[12px] text-[#94A3B8]">
                                      {isScorecardish(source.key)
                                        ? `Scorecard rating signal · ${row.confidence}`
                                        : isHmish(source.key)
                                          ? "Hiring manager observation on file"
                                          : "Evidence metadata only"}
                                    </p>
                                  )}

                                  <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 lg:grid-cols-6">
                                    <Meta
                                      label="Source"
                                      value={row.sourceLabel}
                                    />
                                    <Meta
                                      label="Section"
                                      value={
                                        row.section?.trim() || "Not Available"
                                      }
                                    />
                                    <Meta
                                      label="Page"
                                      value={pageLabel(row.pageNumber)}
                                    />
                                    <Meta
                                      label="Confidence"
                                      value={`${row.confidence} · ${formatPercentage(row.confidencePercent)}`}
                                    />
                                    <Meta
                                      label="Mapped Competency"
                                      value={row.competency}
                                    />
                                    <div className="min-w-0">
                                      <dt className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                                        Open Evidence
                                      </dt>
                                      <dd className="mt-0.5">
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#064E3B] transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
                                          onClick={() => {
                                            setFocusedEvidence(evidenceId);
                                            document
                                              .getElementById(evidenceId)
                                              ?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "nearest",
                                              });
                                          }}
                                        >
                                          Open Evidence
                                          <ExternalLink
                                            className="size-2.5"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      </dd>
                                    </div>
                                  </dl>
                                </li>
                                );
                              })}
                            </ul>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
});

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[11px] font-medium text-[#0F172A]">
        {value}
      </dd>
    </div>
  );
}
