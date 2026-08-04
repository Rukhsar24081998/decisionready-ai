"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatPercentage, normalizeConfidence } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

interface ReadinessRadialProps {
  score: number;
  label: string;
  subtitle: string;
  /** Progress animation duration in ms (presentation-only). */
  animationMs?: number;
  /** Denser executive layout. */
  compact?: boolean;
}

export function ReadinessRadial({
  score,
  label,
  subtitle,
  animationMs = 500,
  compact = false,
}: ReadinessRadialProps) {
  const normalized = normalizeConfidence(score);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = animationMs;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(normalized * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [normalized, animationMs]);

  const data = [
    { name: "score", value: display },
    { name: "rest", value: Math.max(0, 100 - display) },
  ];

  return (
    <div
      className={cn(
        "flex flex-col items-center lg:flex-row lg:items-center",
        compact ? "gap-4 lg:gap-6" : "gap-5 lg:gap-8"
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          compact
            ? "size-[160px] sm:size-[180px]"
            : "size-[200px] sm:size-[220px]"
        )}
        role="img"
        aria-label={`Decision readiness ${formatPercentage(normalized)}, ${label}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="72%"
              outerRadius="92%"
              stroke="none"
              paddingAngle={0}
              isAnimationActive
              animationDuration={animationMs}
            >
              <Cell fill="#064E3B" />
              <Cell fill="#E7ECEF" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p
            className={cn(
              "font-bold leading-none tracking-tight text-[#0F172A] tabular-nums",
              compact ? "text-[32px]" : "text-[40px]"
            )}
          >
            {formatPercentage(display)}
          </p>
          <p className="mt-1.5 text-[12px] font-semibold text-[#064E3B]">
            {label}
          </p>
        </div>
      </div>

      <div className={cn("max-w-md", compact ? "text-left" : "text-center lg:text-left")}>
        <p
          className={cn(
            "font-semibold tracking-tight text-[#0F172A]",
            compact ? "text-[16px]" : "text-[18px]"
          )}
        >
          {subtitle}
        </p>
        <p
          className={cn(
            "leading-relaxed text-[#64748B]",
            compact ? "mt-1.5 text-[12px]" : "mt-2 text-[14px]"
          )}
        >
          This score reflects whether enough high-quality hiring evidence exists
          to confidently conduct a hiring debrief.
        </p>
        <p
          className={cn(
            "inline-flex rounded-full border border-[#D1E7DC] bg-[#E8F5EF] font-semibold text-[#064E3B]",
            compact
              ? "mt-2 px-2.5 py-0.5 text-[11px]"
              : "mt-3 px-3 py-1 text-[12px]"
          )}
        >
          Never recommends Hire or Reject
        </p>
      </div>
    </div>
  );
}
