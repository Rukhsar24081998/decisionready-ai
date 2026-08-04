import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  rows?: number;
  className?: string;
  label?: string;
}

export function LoadingState({
  rows = 3,
  className,
  label = "Loading",
}: LoadingStateProps) {
  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      role="status"
      aria-label={label}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
