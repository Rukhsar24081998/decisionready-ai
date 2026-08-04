"use client";

import { Check, EqualApproximately, Minus, Star } from "lucide-react";
import type { MatrixCellMark } from "@/components/intelligence/presentation-utils";
import { cn } from "@/lib/utils";

/**
 * Evidence strength as Lucide stars (presentation-only).
 * Replaces unicode ★ glyphs for a11y + consistent styling.
 */
export function EvidenceStrengthStars({
  filled,
  label,
  className,
  size = "sm",
}: {
  filled: number;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "size-3.5" : "size-3";
  const count = Math.min(5, Math.max(0, Math.round(filled)));

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Evidence strength ${label}, ${count} of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            iconClass,
            index < count
              ? "fill-[#B45309] text-[#B45309]"
              : "fill-transparent text-[#CBD5E1]"
          )}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-[10px] font-medium text-[#64748B]">{label}</span>
    </span>
  );
}

/**
 * Coverage matrix cell mark as Lucide icons (presentation-only).
 */
export function MatrixStatusIcon({
  mark,
  className,
}: {
  mark: MatrixCellMark;
  className?: string;
}) {
  if (mark === "supported") {
    return (
      <Check
        className={cn("size-3.5 text-[#166534]", className)}
        strokeWidth={2.5}
        aria-hidden="true"
      />
    );
  }
  if (mark === "partial") {
    return (
      <EqualApproximately
        className={cn("size-3.5 text-[#92400E]", className)}
        strokeWidth={2}
        aria-hidden="true"
      />
    );
  }
  return (
    <Minus
      className={cn("size-3.5 text-[#CBD5E1]", className)}
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

export function PresenceMark({
  present,
  className,
}: {
  present: boolean;
  className?: string;
}) {
  if (present) {
    return (
      <Check
        className={cn("size-3.5 text-[#166534]", className)}
        strokeWidth={2.5}
        aria-hidden="true"
      />
    );
  }
  return (
    <Minus
      className={cn("size-3.5 text-[#CBD5E1]", className)}
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}
