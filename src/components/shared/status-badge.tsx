import { Badge } from "@/components/ui/badge";
import type {
  CoverageStatus,
  DecisionAnalysisStatus,
  ReadinessLabel,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusKind =
  | DecisionAnalysisStatus
  | ReadinessLabel
  | CoverageStatus;

const labels: Record<StatusKind, string> = {
  needs_evidence: "Needs Evidence",
  analyzed: "Analyzed",
  ready_for_debrief: "Ready for debrief",
  ready: "Decision Ready",
  partially_ready: "Partially Ready",
  not_ready: "Not Ready",
  sufficient: "Sufficient",
  partial: "Partial",
  missing: "Missing",
  conflicting: "Conflicting",
};

const tones: Record<StatusKind, string> = {
  needs_evidence:
    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
  analyzed: "border-transparent bg-primary text-primary-foreground",
  ready_for_debrief: "border-transparent bg-emerald-600 text-white",
  ready: "border-transparent bg-emerald-600 text-white",
  partially_ready: "border-transparent bg-amber-500 text-white",
  not_ready:
    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
  sufficient: "border-transparent bg-emerald-600 text-white",
  partial: "border-transparent bg-amber-500 text-white",
  missing:
    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
  conflicting: "border-transparent bg-destructive text-white",
};

interface StatusBadgeProps {
  status: StatusKind;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", tones[status], className)}
    >
      {labels[status]}
    </Badge>
  );
}
