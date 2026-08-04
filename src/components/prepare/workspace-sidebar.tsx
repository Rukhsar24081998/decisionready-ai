"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Files,
  Loader2,
  Shield,
  X,
} from "lucide-react";
import { formatPercentage, normalizeConfidence } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";
import { DecisionAnalysisPreview } from "@/components/prepare/decision-analysis-preview";
import type { UploadedFileItem } from "@/components/prepare/uploaded-files-list";
import { landingBtnPrimary } from "@/components/landing/landing-tokens";

interface WorkspaceSidebarProps {
  providedCount: number;
  totalCount: number;
  requiredReady: boolean;
  requiredCount: number;
  requiredUploaded: number;
  uploadedItems: UploadedFileItem[];
  onRemove: (slotId: string) => void;
  submitting?: boolean;
  onGenerate?: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CircularProgress({
  percent,
  tone,
}: {
  percent: number;
  tone: string;
}) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Evidence completeness"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E7ECEF"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold tabular-nums tracking-tight text-[#0F172A]">
        {formatPercentage(percent)}
      </span>
    </div>
  );
}

export function WorkspaceSidebar({
  providedCount,
  totalCount,
  requiredReady,
  requiredCount,
  requiredUploaded,
  uploadedItems,
  onRemove,
  submitting = false,
  onGenerate,
}: WorkspaceSidebarProps) {
  const percent =
    totalCount === 0
      ? 0
      : normalizeConfidence((providedCount / totalCount) * 100);
  const progress = totalCount === 0 ? 0 : providedCount / totalCount;

  const ringTone =
    percent >= 100
      ? "#064E3B"
      : requiredReady
        ? "#0B6E4F"
        : percent > 0
          ? "#D97706"
          : "#CBD5E1";

  const badge =
    percent >= 100
      ? {
          className: "bg-[#DCFCE7] text-[#166534]",
          label: "Complete",
        }
      : requiredReady
        ? {
            className: "bg-[#E8F5EF] text-[#064E3B]",
            label: "Ready for Analysis",
          }
        : {
            className: "bg-[#F1F5F9] text-[#475569]",
            label: "Waiting",
          };

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white">
        <header className="border-b border-[#E5E7EB] px-4 py-3">
          <h2 className="text-[14px] font-semibold tracking-tight text-[#0F172A]">
            Decision Workspace
          </h2>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Evidence status and Decision Intelligence pipeline
          </p>
        </header>

        <div className="flex flex-1 flex-col divide-y divide-[#E5E7EB]">
          <div className="px-4 py-3">
            <DecisionAnalysisPreview progress={progress} embedded />
          </div>

          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[13px] font-semibold tracking-tight text-[#0F172A]">
                Evidence Completeness
              </h3>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                  badge.className
                )}
              >
                {badge.label}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <CircularProgress percent={percent} tone={ringTone} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold tabular-nums text-[#0F172A]">
                  {providedCount} / {totalCount}{" "}
                  <span className="font-medium text-[#64748B]">uploaded</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
                  {requiredReady
                    ? `Required ready (${requiredUploaded}/${requiredCount}). Decision Readiness can be calculated.`
                    : "Decision Readiness unavailable until required evidence is uploaded."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
            <h3 className="text-[13px] font-semibold tracking-tight text-[#0F172A]">
              Uploaded Files
            </h3>
            {uploadedItems.length === 0 ? (
              <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFCFA] px-3 py-3 text-center">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white ring-1 ring-[#E5E7EB]">
                  <Files
                    className="size-4 text-[#94A3B8]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <p className="mt-2 text-[11px] font-medium text-[#475569]">
                  No hiring evidence uploaded yet.
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#94A3B8]">
                  Upload Resume and Job Description in the main panel to begin.
                </p>
              </div>
            ) : (
              <ul className="mt-2 list-none space-y-1.5 p-0">
                {uploadedItems.map((item) => (
                  <li
                    key={item.slotId}
                    className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#FAFCFA] px-2 py-1.5"
                  >
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-[#166534]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-[#0F172A]">
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-[#94A3B8]">
                        {formatSize(item.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.slotId)}
                      className="inline-flex size-6 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-white hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-3">
            <div className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF]">
                <Shield
                  className="size-3 text-[#064E3B]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3 className="text-[12px] font-semibold tracking-tight text-[#0F172A]">
                  DecisionReady Trust
                </h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">
                  Never recommends Hire or Reject. Final decisions remain with
                  recruiters.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-[#E5E7EB] bg-[#E5E7EB]">
            <div className="flex items-center gap-2 bg-[#E8F5EF] px-3 py-2.5">
              <Clock3
                className="size-3 shrink-0 text-[#064E3B]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[9px] font-semibold tracking-wide text-[#064E3B] uppercase">
                  Est. Time
                </p>
                <p className="text-[11px] font-semibold text-[#0F172A]">
                  ≈ 2 min
                </p>
              </div>
            </div>
            <div className="bg-white px-3 py-2.5">
              <p className="text-[9px] font-semibold tracking-wide text-[#64748B] uppercase">
                Evidence Status
              </p>
              <p
                className={cn(
                  "text-[11px] font-semibold",
                  requiredReady ? "text-[#064E3B]" : "text-[#94A3B8]"
                )}
              >
                {requiredReady ? "Ready" : "Waiting"}
              </p>
            </div>
          </div>

          {requiredReady && onGenerate ? (
            <div className="border-t border-[#E5E7EB] px-4 py-3">
              <button
                type="button"
                disabled={submitting}
                onClick={onGenerate}
                className={cn(
                  landingBtnPrimary,
                  "h-10 w-full text-[13px]",
                  submitting && "cursor-not-allowed opacity-60"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Generating…
                  </>
                ) : (
                  <>
                    Generate Decision Intelligence
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
