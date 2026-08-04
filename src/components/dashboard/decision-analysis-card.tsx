import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DecisionAnalysisMetrics } from "@/components/dashboard/decision-analysis-metrics";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDecisionAnalysisCardMetrics } from "@/lib/decision-analysis-metrics";
import { formatUpdatedAt } from "@/lib/format";
import { getDecisionAnalysisHref } from "@/lib/navigation";
import type { DecisionAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DecisionAnalysisCardProps {
  analysis: DecisionAnalysis;
  className?: string;
}

export function DecisionAnalysisCard({
  analysis,
  className,
}: DecisionAnalysisCardProps) {
  const href = getDecisionAnalysisHref(analysis);
  const updatedLabel = formatUpdatedAt(analysis.updatedAt);
  const metrics = getDecisionAnalysisCardMetrics(analysis);
  const badgeStatus =
    analysis.intelligence?.readinessLabel ?? analysis.status;

  return (
    <Link
      href={href}
      className={cn(
        "group flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:gap-4 sm:p-5",
        "shadow-none transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out",
        "hover:-translate-y-px hover:border-foreground/20 hover:bg-card hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label={`Open Decision Analysis for ${analysis.candidateName}, ${analysis.roleTitle}`}
    >
      <div className="min-w-0 flex-1 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <h2 className="truncate text-base font-medium tracking-tight text-foreground">
              {analysis.candidateName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {analysis.roleTitle}
            </p>
          </div>
          <StatusBadge status={badgeStatus} className="shrink-0" />
        </div>

        <DecisionAnalysisMetrics metrics={metrics} />

        <p className="text-xs text-muted-foreground">
          <span className="sr-only">Last updated: </span>
          <time dateTime={analysis.updatedAt}>Updated {updatedLabel}</time>
        </p>
      </div>

      <ChevronRight
        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}
