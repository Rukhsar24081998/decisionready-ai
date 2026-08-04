import { DecisionAnalysisCard } from "@/components/dashboard/decision-analysis-card";
import type { DecisionAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DecisionAnalysisListProps {
  analyses: DecisionAnalysis[];
  className?: string;
}

export function DecisionAnalysisList({
  analyses,
  className,
}: DecisionAnalysisListProps) {
  return (
    <ul
      className={cn("flex list-none flex-col gap-3 p-0 sm:gap-3.5", className)}
      aria-label="Decision Analyses"
    >
      {analyses.map((analysis) => (
        <li key={analysis.id}>
          <DecisionAnalysisCard analysis={analysis} />
        </li>
      ))}
    </ul>
  );
}
