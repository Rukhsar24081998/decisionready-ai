"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const COMING_SOON = "Coming in the next release";

interface ComingSoonButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "onClick"> {
  children: ReactNode;
  /** Visible action name for screen readers, e.g. "Share Report". */
  accessibleName?: string;
  /** Visual style — matches common report action buttons. */
  variant?: "outline" | "ghost";
}

/**
 * Non-functional control shown as disabled with an explanatory tooltip.
 * Never looks like an active clickable button.
 * Wrapper span ensures the tooltip appears even when the button is disabled.
 */
export function ComingSoonButton({
  children,
  className,
  variant = "outline",
  title = COMING_SOON,
  accessibleName,
  ...rest
}: ComingSoonButtonProps) {
  const ariaLabel =
    typeof rest["aria-label"] === "string"
      ? rest["aria-label"]
      : accessibleName
        ? `${accessibleName}. ${title}`
        : typeof children === "string"
          ? `${children}. ${title}`
          : title;

  return (
    <span className="inline-flex" title={title}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        {...rest}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex cursor-not-allowed items-center justify-center gap-1.5 opacity-45 transition-opacity duration-150",
          variant === "outline" &&
            "rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-medium text-[#0F172A]",
          variant === "ghost" &&
            "rounded-lg px-4 text-[13px] font-medium text-[#64748B]",
          className
        )}
      >
        {children}
      </button>
    </span>
  );
}

export { COMING_SOON };
