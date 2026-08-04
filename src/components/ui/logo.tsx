"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  title?: string;
}

/**
 * DecisionReady AI mark — scalable SVG matching the brand reference.
 */
export function LogoIcon({
  className,
  title = "DecisionReady AI",
}: LogoIconProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `dr-logo-grad-${uid}`;
  const clipId = `dr-logo-clip-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="4"
          y1="2"
          x2="28"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="55%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width="32" height="32" rx="9" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width="32" height="32" fill={`url(#${gradId})`} />
        <path d="M20 32H24C28.4183 32 32 28.4183 32 24V20L20 32Z" fill="#A3E635" />
        <path
          d="M20 32L32 20L28.5 28.5L20 32Z"
          fill="#15803D"
          fillOpacity="0.28"
        />
        <path
          d="M16 6.2L23.6 12.4V23.6H8.4V12.4L16 6.2Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  withWordmark?: boolean;
}

/**
 * Full DecisionReady AI logo lockup.
 * Icon ~31px · tighter 8px gap · Inter Bold · #0F172A
 */
export function Logo({
  className,
  iconClassName,
  textClassName,
  withWordmark = true,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoIcon className={cn("size-[31px]", iconClassName)} />
      {withWordmark ? (
        <span
          className={cn(
            "font-sans text-[20px] font-bold leading-none tracking-[-0.03em] text-[#0F172A]",
            textClassName
          )}
        >
          DecisionReady AI
        </span>
      ) : null}
    </span>
  );
}
