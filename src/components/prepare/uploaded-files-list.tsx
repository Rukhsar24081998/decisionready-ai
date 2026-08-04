"use client";

import { CheckCircle2, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFileItem {
  slotId: string;
  slotTitle: string;
  file: File;
}

interface EvidenceSummaryProps {
  items: UploadedFileItem[];
  onRemove: (slotId: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceSummary({ items, onRemove }: EvidenceSummaryProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="rounded-[20px] border border-[#E7ECEF] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-7"
      aria-label="Evidence summary"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0F172A]">
            Evidence Summary
          </h2>
          <p className="mt-1 text-[14px] text-[#475569]">
            Sources included in this Decision Analysis.
          </p>
        </div>
        <span className="text-[13px] font-medium text-[#64748B]">
          {items.length} source{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="mt-5 list-none space-y-3 p-0">
        {items.map((item) => (
          <li
            key={item.slotId}
            className="flex items-center gap-3 rounded-2xl border border-[#E7ECEF] bg-[#FAFCFA] px-4 py-3"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF]">
              <FileText
                className="size-4 text-[#064E3B]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-[#0F172A]">
                {item.file.name}
              </p>
              <p className="mt-0.5 text-[12px] text-[#64748B]">
                {item.slotTitle} · {formatSize(item.file.size)}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]"
              )}
            >
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Ready
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.slotId)}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#64748B] transition-colors duration-200 hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2"
              aria-label={`Remove ${item.file.name}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** @deprecated Use EvidenceSummary */
export const UploadedFilesList = EvidenceSummary;
