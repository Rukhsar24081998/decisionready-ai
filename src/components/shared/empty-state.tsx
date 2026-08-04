"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

function EmptyStateIllustration() {
  return (
    <div
      className="relative flex size-16 items-center justify-center"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-2xl border border-border bg-background shadow-sm" />
      <div className="absolute inset-1 rounded-[0.875rem] bg-gradient-to-br from-muted/80 to-background" />
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="relative size-8 text-muted-foreground"
      >
        <rect
          x="10"
          y="12"
          width="28"
          height="24"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-70"
        />
        <path
          d="M16 20h16M16 25h12M16 30h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-50"
        />
        <circle
          cx="34"
          cy="34"
          r="7"
          fill="var(--background)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M34 31v3.5l2 1.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-border bg-muted/15 px-6 py-16 text-center sm:px-10",
        className
      )}
      role="status"
    >
      <EmptyStateIllustration />

      <div className="space-y-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className={buttonVariants({ size: "lg" })}
          aria-label={actionLabel}
        >
          {actionLabel}
        </Link>
      ) : null}

      {actionLabel && onAction && !actionHref ? (
        <Button type="button" size="lg" onClick={onAction} aria-label={actionLabel}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
