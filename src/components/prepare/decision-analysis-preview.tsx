"use client";

import {
  FileSearch,
  FileText,
  Gauge,
  GitCompareArrows,
  ListChecks,
  NotebookPen,
  Scale,
  SearchX,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE = [
  { label: "Parse Resume", icon: FileSearch },
  { label: "Extract Competencies", icon: ListChecks },
  { label: "Compare Against Job Description", icon: GitCompareArrows },
  { label: "Evaluate Interview Evidence", icon: NotebookPen },
  { label: "Detect Evidence Gaps", icon: SearchX },
  { label: "Detect Interviewer Conflicts", icon: Users },
  { label: "Calculate Decision Readiness", icon: Gauge },
  { label: "Generate Decision Brief", icon: FileText },
] as const;

interface DecisionAnalysisPreviewProps {
  /** 0–1 progress used to highlight the active pipeline stage */
  progress?: number;
  /** Render without outer card chrome (for unified Decision Workspace panel) */
  embedded?: boolean;
}

export function DecisionAnalysisPreview({
  progress = 0,
  embedded = false,
}: DecisionAnalysisPreviewProps) {
  const activeIndex = Math.min(
    PIPELINE.length - 1,
    Math.floor(progress * PIPELINE.length)
  );

  return (
    <section
      className={cn(
        !embedded &&
          "rounded-2xl border border-[#E7ECEF] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF]">
          <Scale
            className="size-4 text-[#064E3B]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
            Decision Analysis Preview
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
            How Decision Intelligence is generated from hiring evidence.
          </p>
        </div>
      </div>

      <ol className="mt-3 list-none space-y-0 p-0">
        {PIPELINE.map((stage, index) => {
          const Icon = stage.icon;
          const complete = progress > 0 && index < activeIndex;
          const active = progress === 0 ? index === 0 : index === activeIndex;
          const upcoming = !complete && !active;
          const isLast = index === PIPELINE.length - 1;

          return (
            <li key={stage.label} className="relative flex gap-3">
              <div className="flex w-7 shrink-0 flex-col items-center">
                <span
                  className={cn(
                    "relative z-[1] flex size-7 items-center justify-center rounded-full transition-all duration-300",
                    complete && "bg-[#DCFCE7] text-[#166534]",
                    active &&
                      "bg-[#064E3B] text-white shadow-[0_0_0_3px_rgba(6,78,59,0.12)]",
                    upcoming && "bg-[#F1F5F9] text-[#94A3B8]",
                    active && "animate-[pulse_2.4s_ease-in-out_infinite]"
                  )}
                >
                  <Icon
                    className="size-3.5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                {!isLast ? (
                  <span
                    className={cn(
                      "mt-1 min-h-[10px] w-px flex-1 transition-colors duration-300",
                      complete ? "bg-[#86EFAC]" : "bg-[#E7ECEF]"
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </div>

              <div className={cn("min-w-0 pb-2", isLast && "pb-0")}>
                <p
                  className={cn(
                    "pt-1 text-[12px] font-medium leading-snug transition-colors duration-200",
                    complete && "text-[#166534]",
                    active && "text-[#0F172A]",
                    upcoming && "text-[#94A3B8]"
                  )}
                >
                  {stage.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
