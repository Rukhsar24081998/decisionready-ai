"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileSpreadsheet,
  NotebookPen,
  UserRound,
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import {
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import {
  CandidateContextForm,
  type CandidateContextValues,
} from "@/components/prepare/candidate-context-form";
import { ProgressStepper } from "@/components/prepare/progress-stepper";
import { ReadyForAnalysis } from "@/components/prepare/ready-for-analysis";
import { UploadCard } from "@/components/prepare/upload-card";
import { WorkspaceSidebar } from "@/components/prepare/workspace-sidebar";
import {
  consumeAnalyzeStream,
  storeAnalysisProgress,
} from "@/lib/ai/consume-analyze-stream";
import { cn } from "@/lib/utils";

const EVIDENCE_SLOTS = [
  {
    id: "job-description",
    title: "Job Description",
    description: "Upload the approved Job Description.",
    required: true,
    icon: BriefcaseBusiness,
    variant: "primary" as const,
  },
  {
    id: "resume",
    title: "Candidate Resume",
    description: "Upload the candidate's latest resume.",
    required: true,
    icon: UserRound,
    variant: "compact" as const,
  },
  {
    id: "interview-notes",
    title: "Interview Notes",
    description: "Structured interviewer observations and notes.",
    required: true,
    icon: NotebookPen,
    variant: "compact" as const,
  },
  {
    id: "scorecards",
    title: "Interview Scorecards",
    description: "Upload structured interview scorecards.",
    required: true,
    icon: FileSpreadsheet,
    variant: "compact" as const,
  },
  {
    id: "hiring-manager-notes",
    title: "Hiring Manager Notes",
    description: "Optional context to enrich the Decision Brief.",
    required: false,
    icon: ClipboardList,
    variant: "compact" as const,
  },
] as const;

type SlotId = (typeof EVIDENCE_SLOTS)[number]["id"];

const WIZARD_STEPS = [
  { id: "upload", label: "Upload Evidence" },
  { id: "ready", label: "Evidence Ready" },
  { id: "generate", label: "Generate" },
] as const;

/** Ordered stages shown during live /api/analyze progress. */
const LIVE_PROGRESS_ORDER = [
  { id: "parse", label: "Parsing documents" },
  { id: "extract_resume", label: "Extracting resume" },
  { id: "extract_jd", label: "Extracting job description" },
  { id: "extract_interview", label: "Extracting interview notes" },
  { id: "extract_scorecard", label: "Extracting interview scorecard" },
  { id: "evidence_graph", label: "Building evidence graph" },
  { id: "decision_engine", label: "Computing Decision Readiness" },
  { id: "narrative", label: "Preparing dashboard" },
  { id: "persist", label: "Saving analysis" },
] as const;

type LiveProgressId = (typeof LIVE_PROGRESS_ORDER)[number]["id"];

export function StartAnalysisPage() {
  const router = useRouter();
  const [context, setContext] = useState<CandidateContextValues>({
    candidateName: "",
    appliedRole: "",
    department: "",
    hiringManager: "",
    hiringStage: "",
  });
  const [files, setFiles] = useState<Partial<Record<SlotId, File>>>({});
  const [uploadedAt, setUploadedAt] = useState<
    Partial<Record<SlotId, number>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightCta, setHighlightCta] = useState(false);
  const wasReadyRef = useRef(false);
  const submittingLockRef = useRef(false);
  const [stageStatus, setStageStatus] = useState<
    Partial<Record<LiveProgressId, "pending" | "in_progress" | "completed">>
  >({});

  const requiredSlots = EVIDENCE_SLOTS.filter((s) => s.required);
  const requiredUploaded = requiredSlots.filter((slot) =>
    Boolean(files[slot.id])
  ).length;
  const requiredReady = requiredUploaded === requiredSlots.length;
  const providedCount = EVIDENCE_SLOTS.filter((slot) =>
    Boolean(files[slot.id])
  ).length;

  const wizardActiveIndex = requiredReady ? 2 : providedCount > 0 ? 1 : 0;

  const uploadedItems = useMemo(
    () =>
      EVIDENCE_SLOTS.flatMap((slot) => {
        const file = files[slot.id];
        if (!file) return [];
        return [{ slotId: slot.id, slotTitle: slot.title, file }];
      }),
    [files]
  );

  useEffect(() => {
    if (requiredReady && !wasReadyRef.current) {
      setHighlightCta(true);
      const timer = window.setTimeout(() => setHighlightCta(false), 2800);
      wasReadyRef.current = true;
      return () => window.clearTimeout(timer);
    }
    if (!requiredReady) {
      wasReadyRef.current = false;
      setHighlightCta(false);
    }
  }, [requiredReady]);

  const setSlotFile = (slotId: SlotId, file: File | null) => {
    setError(null);
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[slotId] = file;
      else delete next[slotId];
      return next;
    });
    setUploadedAt((prev) => {
      const next = { ...prev };
      if (file) next[slotId] = Date.now();
      else delete next[slotId];
      return next;
    });
  };

  const generateIntelligence = async () => {
    if (!requiredReady || submitting || submittingLockRef.current) return;

    submittingLockRef.current = true;
    setSubmitting(true);
    setError(null);
    setStageStatus(
      Object.fromEntries(
        LIVE_PROGRESS_ORDER.map((s) => [s.id, "pending" as const])
      ) as Partial<Record<LiveProgressId, "pending" | "in_progress" | "completed">>
    );

    const completedStages: string[] = [];

    try {
      const candidateName =
        context.candidateName.trim() ||
        files.resume?.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() ||
        "Candidate";
      const roleTitle =
        context.appliedRole.trim() ||
        files["job-description"]?.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim() ||
        "Open Role";

      const form = new FormData();
      form.set("candidateName", candidateName);
      form.set("roleTitle", roleTitle);
      form.set("department", context.department.trim());
      form.set("hiringManager", context.hiringManager.trim());
      form.set("hiringStage", context.hiringStage);

      const fileFields: Array<[SlotId, string]> = [
        ["job-description", "jobDescription"],
        ["resume", "resume"],
        ["interview-notes", "interviewNotes"],
        ["scorecards", "scorecards"],
        ["hiring-manager-notes", "hiringManagerNotes"],
      ];

      for (const [slotId, field] of fileFields) {
        const file = files[slotId];
        if (file) form.set(field, file);
      }

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const result = await consumeAnalyzeStream(analyzeRes, {
        onStage: (event) => {
          const id = event.id as LiveProgressId;
          if (!LIVE_PROGRESS_ORDER.some((s) => s.id === id)) {
            // Map aggregate extract → mark extract_* in progress when extract starts
            if (event.id === "extract" && event.status === "start") {
              setStageStatus((prev) => ({
                ...prev,
                extract_resume: prev.extract_resume === "completed" ? "completed" : "in_progress",
                extract_jd: prev.extract_jd === "completed" ? "completed" : "in_progress",
                extract_interview:
                  prev.extract_interview === "completed" ? "completed" : "in_progress",
                extract_scorecard:
                  prev.extract_scorecard === "completed" ? "completed" : "in_progress",
              }));
            }
            if (event.id === "dashboard" || event.id === "brief") {
              setStageStatus((prev) => ({
                ...prev,
                narrative:
                  event.status === "done"
                    ? "completed"
                    : prev.narrative === "completed"
                      ? "completed"
                      : "in_progress",
              }));
              if (event.status === "done" && !completedStages.includes("narrative")) {
                completedStages.push("narrative");
              }
            }
            return;
          }

          setStageStatus((prev) => ({
            ...prev,
            [id]:
              event.status === "done"
                ? "completed"
                : event.status === "start"
                  ? "in_progress"
                  : prev[id] ?? "pending",
          }));

          if (event.status === "done" && !completedStages.includes(id)) {
            completedStages.push(id);
          }
        },
      });

      if (result.analysis) {
        const { persistAnalysisLocally } = await import(
          "@/components/intelligence/intelligence-restore-bridge"
        );
        persistAnalysisLocally(result.analysis);
      }

      storeAnalysisProgress({
        analysisId: result.analysisId,
        completedStages,
        timings: result.timings,
        totalMs: result.totalMs,
        completedAt: Date.now(),
      });

      router.push(`/analyses/${result.analysisId}/analyzing`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate Decision Intelligence right now. Please try again."
      );
      setSubmitting(false);
      submittingLockRef.current = false;
      setStageStatus({});
    }
  };

  const progressStages = LIVE_PROGRESS_ORDER.map((stage) => ({
    id: stage.id,
    label: stage.label,
    status: stageStatus[stage.id] ?? ("pending" as const),
  }));

  const primarySlot = EVIDENCE_SLOTS[0];
  const compactSlots = EVIDENCE_SLOTS.slice(1);

  return (
    <main className="relative overflow-hidden pb-4">
      <DotGrid className="opacity-25" />

      <div className={cn(landingContainer, "relative py-3 lg:py-4")}>
        <ProgressStepper activeStep={0} />

        <header className="mt-2 max-w-3xl">
          <h1
            className={cn(
              landingSerif,
              "text-[24px] leading-tight sm:text-[28px]"
            )}
          >
            Create Decision Analysis
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-snug text-[#64748B]">
            Upload hiring evidence, confirm the package is ready, then generate
            Decision Intelligence.
          </p>

          {/* Guided wizard strip */}
          <ol className="mt-3 flex list-none flex-wrap items-center gap-1.5 p-0">
            {WIZARD_STEPS.map((step, index) => {
              const done = index < wizardActiveIndex;
              const active = index === wizardActiveIndex;
              return (
                <li key={step.id} className="flex items-center gap-1.5">
                  {index > 0 ? (
                    <span className="text-[11px] text-[#CBD5E1]" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      done && "bg-[#DCFCE7] text-[#166534]",
                      active && "bg-[#064E3B] text-white",
                      !done && !active && "bg-[#F1F5F9] text-[#94A3B8]"
                    )}
                  >
                    <span className="tabular-nums opacity-80">{index + 1}</span>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </header>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,72fr)_minmax(300px,28fr)] lg:items-start lg:gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <CandidateContextForm values={context} onChange={setContext} />

            <section className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <h2 className="text-[14px] font-semibold tracking-tight text-[#0F172A]">
                    Step 1 · Upload Evidence
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#64748B]">
                    Completed cards collapse to keep the Generate CTA in view.
                  </p>
                </div>
                <p className="shrink-0 text-[11px] font-medium tabular-nums text-[#64748B]">
                  {requiredUploaded}/{requiredSlots.length} required
                </p>
              </div>

              <div className="space-y-1.5">
                <UploadCard
                  key={primarySlot.id}
                  id={primarySlot.id}
                  title={primarySlot.title}
                  description={primarySlot.description}
                  required={primarySlot.required}
                  icon={primarySlot.icon}
                  variant="primary"
                  file={files[primarySlot.id] ?? null}
                  uploadedAt={uploadedAt[primarySlot.id] ?? null}
                  onFileChange={(file) => setSlotFile(primarySlot.id, file)}
                />

                <div className="grid gap-1.5 sm:grid-cols-2">
                  {compactSlots.map((slot) => (
                    <UploadCard
                      key={slot.id}
                      id={slot.id}
                      title={slot.title}
                      description={slot.description}
                      required={slot.required}
                      icon={slot.icon}
                      variant="compact"
                      file={files[slot.id] ?? null}
                      uploadedAt={uploadedAt[slot.id] ?? null}
                      onFileChange={(file) => setSlotFile(slot.id, file)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Sticky Generate section — stays discoverable while uploading */}
            <div
              className={cn(
                "sticky bottom-0 z-20 mt-1 border-t border-transparent pt-1",
                "bg-gradient-to-t from-[#F8FAF9] via-[#F8FAF9]/95 to-transparent pb-1"
              )}
            >
              <ReadyForAnalysis
                providedCount={providedCount}
                totalCount={EVIDENCE_SLOTS.length}
                requiredUploaded={requiredUploaded}
                requiredTotal={requiredSlots.length}
                requiredReady={requiredReady}
                submitting={submitting}
                error={error}
                onGenerate={generateIntelligence}
                highlightCta={highlightCta}
                progressStages={progressStages}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-4">
            <WorkspaceSidebar
              providedCount={providedCount}
              totalCount={EVIDENCE_SLOTS.length}
              requiredReady={requiredReady}
              requiredCount={requiredSlots.length}
              requiredUploaded={requiredUploaded}
              uploadedItems={uploadedItems}
              onRemove={(slotId) => setSlotFile(slotId as SlotId, null)}
              submitting={submitting}
              onGenerate={generateIntelligence}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
