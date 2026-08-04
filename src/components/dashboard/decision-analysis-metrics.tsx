import type { DecisionAnalysisCardMetrics } from "@/lib/decision-analysis-metrics";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

interface MetricItemProps {
  label: string;
  value: string;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs tabular-nums text-muted-foreground">
        {value}
      </dd>
    </div>
  );
}

interface DecisionAnalysisMetricsProps {
  metrics: DecisionAnalysisCardMetrics;
  className?: string;
}

export function DecisionAnalysisMetrics({
  metrics,
  className,
}: DecisionAnalysisMetricsProps) {
  const readiness =
    metrics.readinessScore === null
      ? "Not Available"
      : formatPercentage(metrics.readinessScore);

  const coverage =
    metrics.competenciesCovered === null ||
    metrics.competenciesRequired === null
      ? "Not Available"
      : `${metrics.competenciesCovered}/${metrics.competenciesRequired}`;

  const blockers =
    metrics.decisionBlockers === null
      ? "Not Available"
      : String(metrics.decisionBlockers);

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 sm:gap-x-6",
        className
      )}
    >
      <MetricItem label="Readiness" value={readiness} />
      <MetricItem label="Coverage" value={coverage} />
      <MetricItem label="Interviewers" value={String(metrics.interviewers)} />
      <MetricItem label="Blockers" value={blockers} />
    </dl>
  );
}
