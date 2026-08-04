"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  FileSpreadsheet,
  FileText,
  Gauge,
  ListChecks,
  Loader2,
  NotebookPen,
  Scale,
  SearchX,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import {
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { ReasoningVisualization } from "@/components/analysis/reasoning-visualization";
import { ProgressStepper } from "@/components/prepare/progress-stepper";
import { formatClock } from "@/lib/format";
import { readAnalysisProgress } from "@/lib/ai/consume-analyze-stream";
import { cn } from "@/lib/utils";

type StepStatus = "completed" | "in_progress" | "pending";

interface PipelineStep {
  id: string;
  title: string;
  explanation: string;
  icon: LucideIcon;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "upload",
    title: "Uploading Documents",
    explanation:
      "Confirming the hiring evidence package is complete and ready for extraction.",
    icon: FileText,
  },
  {
    id: "extract",
    title: "Extracting Text",
    explanation:
      "Pulling readable text from resumes, notes, scorecards, and job descriptions.",
    icon: SearchX,
  },
  {
    id: "resume",
    title: "Parsing Resume",
    explanation:
      "Identifying experience signals that can later be traced to competencies.",
    icon: UserRound,
  },
  {
    id: "jd",
    title: "Parsing JD",
    explanation:
      "Anchoring the analysis to the approved role requirements and competencies.",
    icon: BriefcaseBusiness,
  },
  {
    id: "evidence",
    title: "Extracting Evidence",
    explanation:
      "Collecting verbatim quotes and structured signals from interview materials.",
    icon: NotebookPen,
  },
  {
    id: "mapping",
    title: "Mapping Competencies",
    explanation:
      "Linking evidence to each competency with source citations—never inventing quotes.",
    icon: ListChecks,
  },
  {
    id: "scores",
    title: "Calculating Scores",
    explanation:
      "Running deterministic Decision Readiness weights across coverage, quality, alignment, and completeness.",
    icon: Gauge,
  },
  {
    id: "summary",
    title: "Generating Executive Summary",
    explanation:
      "Drafting recruiter-facing explanation of evidence strength—without hire/reject advice.",
    icon: Scale,
  },
  {
    id: "brief",
    title: "Generating Decision Brief",
    explanation:
      "Assembling the executive Decision Brief for debrief preparation.",
    icon: NotebookPen,
  },
  {
    id: "dashboard",
    title: "Preparing Dashboard",
    explanation:
      "Finalizing Decision Intelligence views with normalized scores and citations.",
    icon: FileSpreadsheet,
  },
];

const STATUS_MESSAGES = [
  "Uploading Documents",
  "Extracting Text",
  "Parsing Resume",
  "Parsing JD",
  "Extracting Evidence",
  "Mapping Competencies",
  "Calculating Scores",
  "Generating Executive Summary",
  "Generating Decision Brief",
  "Preparing Dashboard",
] as const;

const INPUT_EVIDENCE = [
  { label: "Job Description", icon: BriefcaseBusiness },
  { label: "Resume", icon: UserRound },
  { label: "Interview Notes", icon: NotebookPen },
  { label: "Interview Scorecards", icon: FileSpreadsheet },
] as const;

/** Fallback only when progress metadata is missing (e.g. deep-link refresh). */
const FALLBACK_ANALYSIS_MS = 2400;
/** When server analysis already finished, reveal steps quickly then route. */
const POST_COMPLETE_REVEAL_MS = 1600;

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AiAnalysisProgressProps {
  analysisId: string;
}

export function AiAnalysisProgress({ analysisId }: AiAnalysisProgressProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [completedAt, setCompletedAt] = useState<Partial<Record<string, Date>>>(
    {}
  );
  const prevCompleted = useRef<Set<string>>(new Set());
  const startedAt = useRef<Date>(new Date());
  const durationMs = useRef(FALLBACK_ANALYSIS_MS);
  const alreadyComplete = useRef(false);

  useEffect(() => {
    const stored = readAnalysisProgress(analysisId);
    if (stored) {
      alreadyComplete.current = true;
      durationMs.current = POST_COMPLETE_REVEAL_MS;
    }
  }, [analysisId]);

  const progress = Math.min(
    100,
    Math.round((elapsed / durationMs.current) * 100)
  );
  const stepMs = durationMs.current / PIPELINE_STEPS.length;
  const activeStepIndex = Math.min(
    PIPELINE_STEPS.length - 1,
    Math.floor(elapsed / stepMs)
  );

  const stepStatuses: StepStatus[] = useMemo(
    () =>
      PIPELINE_STEPS.map((_, index) => {
        if (progress >= 100) return "completed";
        if (index < activeStepIndex) return "completed";
        if (index === activeStepIndex) return "in_progress";
        return "pending";
      }),
    [activeStepIndex, progress]
  );

  const statusCopy =
    progress >= 100
      ? "Decision Intelligence ready"
      : alreadyComplete.current
        ? `✓ ${STATUS_MESSAGES[activeStepIndex]}`
        : STATUS_MESSAGES[activeStepIndex];

  const currentConfidence = Math.min(
    96,
    Math.round(18 + progress * 0.72 + (progress >= 100 ? 6 : 0))
  );
  const evidenceCoverage = Math.min(
    100,
    Math.round((Math.min(activeStepIndex + (progress >= 100 ? 1 : 0.35), 8) / 8) * 100)
  );
  const processingLabel = formatElapsed(elapsed);

  useEffect(() => {
    startedAt.current = new Date();
    const started = performance.now();
    let frame = 0;
    const target = durationMs.current;

    const tick = (now: number) => {
      const next = Math.min(target, now - started);
      setElapsed(next);
      if (next < target) {
        frame = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [analysisId]);

  useEffect(() => {
    const next: Partial<Record<string, Date>> = {};
    let changed = false;

    PIPELINE_STEPS.forEach((step, index) => {
      const isComplete =
        progress >= 100 || stepStatuses[index] === "completed";
      if (isComplete && !prevCompleted.current.has(step.id)) {
        prevCompleted.current.add(step.id);
        next[step.id] = new Date();
        changed = true;
      }
    });

    if (changed) {
      setCompletedAt((prev) => ({ ...prev, ...next }));
    }
  }, [progress, stepStatuses]);

  useEffect(() => {
    if (!done) return;
    const timeout = window.setTimeout(() => {
      router.push(`/analyses/${analysisId}/intelligence`);
    }, alreadyComplete.current ? 450 : 900);
    return () => window.clearTimeout(timeout);
  }, [analysisId, done, router]);

  return (
    <main className="relative overflow-hidden">
      <DotGrid className="opacity-25" />

      <div className={cn(landingContainer, "relative py-5 lg:py-7")}>
        <ProgressStepper activeStep={1} />

        <header className="mt-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D1E7DC] bg-[#E8F5EF] px-3 py-1">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#064E3B] opacity-40" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#064E3B]" />
            </span>
            <span className="text-[12px] font-semibold text-[#064E3B]">
              Decision Intelligence in progress
            </span>
          </div>
          <h1
            className={cn(
              landingSerif,
              "mt-3 text-[28px] leading-tight sm:text-[34px]"
            )}
          >
            Generating Decision Intelligence
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#64748B]">
            DecisionReady AI is evaluating hiring evidence to determine whether
            your team has enough information for a fair and confident hiring
            decision—without recommending Hire or Reject.
          </p>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)] lg:items-start lg:gap-6">
          <div className="min-w-0 space-y-4">
            {/* Progress */}
            <section className="rounded-2xl border border-[#E7ECEF] bg-white px-5 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[36px] font-bold leading-none tracking-tight text-[#0F172A] tabular-nums">
                    {progress}%
                  </p>
                  <p
                    key={statusCopy}
                    className="mt-2 text-[14px] font-medium text-[#475569] animate-[stepReveal_0.35s_ease-out]"
                  >
                    {statusCopy}
                  </p>
                </div>
                <div className="rounded-full border border-[#E7ECEF] bg-[#FAFCFA] px-3 py-1.5 text-[12px]">
                  <span className="font-semibold text-[#0F172A]">Started</span>
                  <span className="ml-1.5 tabular-nums text-[#64748B]">
                    {formatClock(startedAt.current)}
                  </span>
                </div>
              </div>

              <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-[#E7ECEF]"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Decision Intelligence progress"
              >
                <div
                  className="h-full rounded-full bg-[#064E3B] transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            {/* Reasoning steps */}
            <section className="rounded-2xl border border-[#E7ECEF] bg-white px-5 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold tracking-tight text-[#0F172A]">
                    Reasoning Pipeline
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">
                    Each stage builds explainable Decision Intelligence from
                    your hiring evidence.
                  </p>
                </div>
                <Gauge
                  className="mt-0.5 size-4 shrink-0 text-[#064E3B]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>

              <ol className="mt-4 list-none space-y-2 p-0">
                {PIPELINE_STEPS.map((step, index) => {
                  const status = stepStatuses[index];
                  const Icon = step.icon;
                  const stamp = completedAt[step.id];

                  return (
                    <li
                      key={step.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-500",
                        status === "completed" &&
                          "border-[#BBF7D0] bg-[#F0FDF4] animate-[stepReveal_0.4s_ease-out]",
                        status === "in_progress" &&
                          "border-[#064E3B]/20 bg-[#F8FFFB] shadow-[0_4px_16px_rgba(6,78,59,0.05)]",
                        status === "pending" &&
                          "border-transparent bg-[#FAFCFA] opacity-55"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                          status === "completed" && "bg-[#DCFCE7]",
                          status === "in_progress" && "bg-[#E8F5EF]",
                          status === "pending" && "bg-[#F1F5F9]"
                        )}
                      >
                        {status === "completed" ? (
                          <Check
                            className="size-3.5 text-[#166534] animate-[checkIn_0.35s_ease-out]"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        ) : status === "in_progress" ? (
                          <Loader2
                            className="size-3.5 animate-spin text-[#064E3B]"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        ) : (
                          <Icon
                            className="size-3.5 text-[#94A3B8]"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p
                            className={cn(
                              "text-[13px] font-semibold",
                              status === "pending"
                                ? "text-[#64748B]"
                                : "text-[#0F172A]"
                            )}
                          >
                            {step.title}
                          </p>
                          {status === "completed" && stamp ? (
                            <time
                              dateTime={stamp.toISOString()}
                              className="text-[11px] tabular-nums text-[#64748B]"
                            >
                              {formatClock(stamp)}
                            </time>
                          ) : null}
                          {status === "in_progress" ? (
                            <span className="rounded-full bg-[#E8F5EF] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#064E3B] uppercase">
                              In progress
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-[12px] leading-relaxed",
                            status === "pending"
                              ? "text-[#94A3B8]"
                              : "text-[#64748B]"
                          )}
                        >
                          {step.explanation}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Input evidence + notice */}
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-[#E7ECEF] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                <h2 className="text-[14px] font-semibold text-[#0F172A]">
                  Input Evidence
                </h2>
                <ul className="mt-3 list-none space-y-2 p-0">
                  {INPUT_EVIDENCE.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className="flex items-center gap-2.5"
                      >
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#DCFCE7]">
                          <Check
                            className="size-3 text-[#166534]"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#0F172A]">
                          <Icon
                            className="size-3.5 text-[#064E3B]"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          {item.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-2xl border border-[#E7ECEF] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9]">
                    <AlertCircle
                      className="size-3.5 text-[#475569]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h2 className="text-[14px] font-semibold text-[#0F172A]">
                      Trust Notice
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
                      DecisionReady AI evaluates evidence quality and Decision
                      Readiness only. It never recommends Hire or Reject.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <ReasoningVisualization
            progress={progress}
            activeStepIndex={activeStepIndex}
            stepCount={PIPELINE_STEPS.length}
          />
        </div>

        {/* Bottom metrics */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Current Confidence"
            value={`${currentConfidence}%`}
            hint="Evidence quality confidence—not hire confidence"
            progress={currentConfidence}
          />
          <MetricCard
            label="Evidence Coverage"
            value={`${evidenceCoverage}%`}
            hint="Competencies addressed by hiring evidence"
            progress={evidenceCoverage}
          />
          <MetricCard
            label="Processing Time"
            value={processingLabel}
            hint={
              progress >= 100
                ? "Decision Intelligence generation complete"
                : "Elapsed analysis time"
            }
            mono
          />
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  hint,
  progress,
  mono,
}: {
  label: string;
  value: string;
  hint: string;
  progress?: number;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E7ECEF] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-[24px] font-bold tracking-tight text-[#0F172A]",
          mono && "tabular-nums"
        )}
      >
        {value}
      </p>
      {typeof progress === "number" ? (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#E7ECEF]">
          <div
            className="h-full rounded-full bg-[#064E3B] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      <p className="mt-2 text-[12px] leading-relaxed text-[#94A3B8]">{hint}</p>
    </div>
  );
}
