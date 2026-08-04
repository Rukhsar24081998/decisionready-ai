import { formatPercentage, normalizeConfidence } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

interface EvidenceCompletenessProps {
  provided: number;
  total: number;
  requiredReady: boolean;
}

export function EvidenceCompleteness({
  provided,
  total,
  requiredReady,
}: EvidenceCompletenessProps) {
  const percent =
    total === 0
      ? 0
      : normalizeConfidence((provided / total) * 100);

  const tone =
    percent >= 100
      ? {
          bar: "bg-[#064E3B]",
          badge: "bg-[#DCFCE7] text-[#166534]",
          label: "Evidence package complete",
        }
      : requiredReady
        ? {
            bar: "bg-[#0B6E4F]",
            badge: "bg-[#E8F5EF] text-[#064E3B]",
            label: "Required evidence ready",
          }
        : percent >= 40
          ? {
              bar: "bg-[#D97706]",
              badge: "bg-[#FEF3C7] text-[#92400E]",
              label: "Evidence still incomplete",
            }
          : {
              bar: "bg-[#94A3B8]",
              badge: "bg-[#F1F5F9] text-[#475569]",
              label: "Needs more hiring evidence",
            };

  return (
    <section className="rounded-[20px] border border-[#E7ECEF] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0F172A]">
            Evidence Completeness
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#475569]">
            Decision readiness starts with a complete evidence package—before
            analysis runs.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[12px] font-semibold",
            tone.badge
          )}
        >
          {tone.label}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-[36px] font-bold leading-none tracking-tight text-[#0F172A] tabular-nums">
          {formatPercentage(percent)}
        </p>
        <p className="pb-1 text-right text-[14px] font-medium text-[#475569]">
          {provided} of {total} evidence sources provided
        </p>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E7ECEF]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Evidence completeness"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            tone.bar
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}
