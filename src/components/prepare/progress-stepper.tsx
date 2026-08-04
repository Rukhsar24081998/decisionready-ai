"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Create Analysis",
  "AI Analysis",
  "Decision Dashboard",
  "Decision Brief",
] as const;

interface ProgressStepperProps {
  activeStep?: number;
}

export function ProgressStepper({ activeStep = 0 }: ProgressStepperProps) {
  return (
    <nav aria-label="Decision Analysis progress" className="w-full">
      <ol className="flex list-none flex-col gap-3 p-0 sm:flex-row sm:items-center sm:gap-0">
        {STEPS.map((label, index) => {
          const active = index === activeStep;
          const complete = index < activeStep;
          const upcoming = !active && !complete;
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={label}
              className={cn(
                "group flex min-w-0 items-center gap-2.5 sm:flex-1",
                !isLast && "sm:pr-0"
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold leading-none transition-all duration-200",
                    active &&
                      "bg-[#064E3B] text-white shadow-[0_0_0_4px_rgba(6,78,59,0.12)] ring-2 ring-[#064E3B]/20",
                    complete &&
                      "bg-[#DCFCE7] text-[#166534] group-hover:bg-[#BBF7D0]",
                    upcoming &&
                      "bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#E2E8F0] group-hover:text-[#64748B]"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete ? (
                    <Check
                      className="size-3.5"
                      strokeWidth={2.75}
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="translate-y-px">{index + 1}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-[13px] font-medium transition-colors duration-200 sm:text-[14px]",
                    active && "font-semibold text-[#0F172A]",
                    complete && "text-[#166534]",
                    upcoming && "text-[#94A3B8] group-hover:text-[#64748B]"
                  )}
                >
                  {label}
                </span>
              </div>

              {!isLast ? (
                <div
                  className="mx-2 hidden h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-[#E7ECEF] sm:block"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      complete ? "w-full bg-[#064E3B]" : "w-0 bg-[#064E3B]",
                      active && "w-1/2 bg-[#064E3B]/40"
                    )}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
