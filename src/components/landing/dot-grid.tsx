import { cn } from "@/lib/utils";

interface DotGridProps {
  className?: string;
}

/** Very low-opacity dot grid for calm enterprise atmosphere. */
export function DotGrid({ className }: DotGridProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-image:radial-gradient(circle,rgba(17,17,17,0.07)_1px,transparent_1px)]",
        "[background-size:20px_20px]",
        className
      )}
    />
  );
}
