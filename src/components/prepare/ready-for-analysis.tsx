"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { normalizeConfidence } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

interface ReadyForAnalysisProps {
  providedCount: number;
  totalCount: number;
  requiredUploaded: number;
  requiredTotal: number;
  requiredReady: boolean;
  submitting: boolean;
  error: string | null;
  onGenerate: () => void;
  /** When true, scroll into view and pulse the CTA (after final required upload). */
  highlightCta?: boolean;
  /** Live pipeline stages while /api/analyze is running. */
  progressStages?: Array<{
    id: string;
    label: string;
    status: "pending" | "in_progress" | "completed";
  }>;
}

export function ReadyForAnalysis({
  providedCount,
  totalCount,
  requiredUploaded,
  requiredTotal,
  requiredReady,
  submitting,
  error,
  onGenerate,
  highlightCta = false,
  progressStages = [],
}: ReadyForAnalysisProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const percent =
    totalCount === 0
      ? 0
      : normalizeConfidence((providedCount / totalCount) * 100);

  useEffect(() => {
    if (!highlightCta || !requiredReady) return;
    const section = sectionRef.current;
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "nearest" });
    ctaRef.current?.focus({ preventScroll: true });
  }, [highlightCta, requiredReady]);

  return (
    <section
      ref={sectionRef}
      id="generate-decision-intelligence"
      className={cn(
        "w-full rounded-xl border bg-white px-4 py-3 transition-all duration-300",
        requiredReady
          ? "border-[#064E3B]/40 shadow-[0_0_0_3px_rgba(6,78,59,0.08)]"
          : "border-[#E5E7EB]"
      )}
    >
      {/* Wizard step label */}
      <p className="text-[10px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">
        {requiredReady ? "Step 3 · Generate" : "Step 2 · Evidence status"}
      </p>

      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
            {requiredReady ? "Evidence Ready" : "Upload Evidence"}
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-[#64748B]">
            {requiredReady
              ? "Next action: Generate Decision Intelligence."
              : `Upload remaining required files (${requiredTotal - requiredUploaded} left).`}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            requiredReady
              ? "bg-[#DCFCE7] text-[#166534]"
              : "bg-[#F1F5F9] text-[#64748B]"
          )}
        >
          {requiredReady ? "Ready for Analysis" : "Waiting for required evidence"}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold tabular-nums text-[#0F172A]">
          {requiredUploaded}/{requiredTotal} required
          <span className="font-medium text-[#94A3B8]">
            {" "}
            · {providedCount}/{totalCount} total
          </span>
        </p>
        <p className="text-[11px] text-[#64748B]">
          {submitting ? "Running analysis…" : "Typically under 1 min"}
        </p>
      </div>

      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E7ECEF]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            requiredReady ? "bg-[#064E3B]" : percent > 0 ? "bg-[#D97706]" : "bg-[#CBD5E1]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {submitting && progressStages.length > 0 ? (
        <ul className="mt-2.5 list-none space-y-1 p-0" aria-live="polite">
          {progressStages.map((stage) => (
            <li
              key={stage.id}
              className="flex items-center gap-2 text-[11px] text-[#475569]"
            >
              {stage.status === "completed" ? (
                <Check
                  className="size-3 shrink-0 text-[#166534]"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              ) : stage.status === "in_progress" ? (
                <Loader2
                  className="size-3 shrink-0 animate-spin text-[#064E3B]"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="size-3 shrink-0 rounded-full border border-[#CBD5E1]"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  stage.status === "completed" && "text-[#166534]",
                  stage.status === "in_progress" && "font-semibold text-[#064E3B]",
                  stage.status === "pending" && "text-[#94A3B8]"
                )}
              >
                {stage.status === "completed" ? "✓ " : ""}
                {stage.label}
              </span>
            </li>
          ))}
        </ul>
      ) : requiredReady ? (
        <ul className="mt-2.5 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
          {[
            "Evidence Explorer",
            "Competency Coverage",
            "Decision Readiness",
            "Decision Brief",
          ].map((item) => (
            <li key={item} className="flex items-center gap-1 text-[11px] text-[#475569]">
              <Check className="size-3 text-[#064E3B]" strokeWidth={2.5} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3">
        {error ? (
          <div
            className="mb-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2"
            role="alert"
          >
            <p className="text-[12px] font-medium text-[#B91C1C]">{error}</p>
            <p className="mt-0.5 text-[11px] text-[#991B1B]/80">
              Check your connection and uploaded documents, then retry.
            </p>
            <button
              type="button"
              onClick={onGenerate}
              disabled={!requiredReady || submitting}
              className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-[#FECACA] bg-white px-3 text-[12px] font-semibold text-[#991B1B] transition-colors duration-150 hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]/30 disabled:opacity-50"
            >
              Retry generation
            </button>
          </div>
        ) : null}
        <button
          ref={ctaRef}
          type="button"
          disabled={!requiredReady || submitting}
          onClick={onGenerate}
          className={cn(
            "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] text-[15px] font-semibold text-white transition-all duration-200",
            "shadow-[0_2px_10px_rgba(6,78,59,0.22)]",
            "hover:bg-[#053528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/35 focus-visible:ring-offset-2",
            "active:scale-[0.995]",
            highlightCta &&
              requiredReady &&
              !submitting &&
              "ring-4 ring-[#064E3B]/20 animate-pulse",
            (!requiredReady || submitting) &&
              "cursor-not-allowed opacity-45 hover:bg-[#064E3B]"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Generating…
            </>
          ) : (
            <>
              Generate Decision Intelligence
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
        {!requiredReady ? (
          <p className="mt-1.5 text-center text-[11px] text-[#94A3B8]">
            Available after all required evidence is uploaded.
          </p>
        ) : (
          <p className="mt-1.5 text-center text-[11px] font-medium text-[#064E3B]">
            Next: Generate Decision Intelligence
          </p>
        )}
      </div>
    </section>
  );
}
