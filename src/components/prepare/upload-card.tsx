"use client";

import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  type LucideIcon,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";

export interface UploadCardProps {
  id: string;
  title: string;
  description: string;
  required: boolean;
  icon: LucideIcon;
  accept?: string;
  maxSizeLabel?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  variant?: "primary" | "compact";
  /** Epoch ms when the file was attached — shown in success state. */
  uploadedAt?: number | null;
}

const DEFAULT_ACCEPT = ".pdf,.doc,.docx,.txt,.md";
const DEFAULT_MAX_SIZE = "10 MB";

function formatUploadedAt(uploadedAt?: number | null): string {
  if (!uploadedAt) return "Just now";
  const formatted = formatTime(uploadedAt);
  return formatted || "Just now";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLabel(label: string): string {
  return label.replace(/^Max\s+/i, "").trim() || DEFAULT_MAX_SIZE;
}

export function UploadCard({
  id,
  title,
  description,
  required,
  icon: Icon,
  accept = DEFAULT_ACCEPT,
  maxSizeLabel = DEFAULT_MAX_SIZE,
  file,
  onFileChange,
  variant = "primary",
  uploadedAt = null,
}: UploadCardProps) {
  const inputId = useId();
  const resolvedInputId = `upload-${id}-${inputId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const compact = variant === "compact";
  const success = Boolean(file);
  const sizeLabel = formatLabel(maxSizeLabel);

  useEffect(() => {
    if (!file) {
      setJustUploaded(false);
      return;
    }
    setJustUploaded(true);
    const timer = window.setTimeout(() => setJustUploaded(false), 220);
    return () => window.clearTimeout(timer);
  }, [file]);

  const assignFile = useCallback(
    (next: File | null) => {
      if (next) {
        setLoading(true);
        window.setTimeout(() => {
          onFileChange(next);
          setLoading(false);
        }, 200);
      } else {
        onFileChange(null);
      }
    },
    [onFileChange]
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) assignFile(dropped);
  };

  const dropHandlers = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
    },
    onDrop,
  };

  const previewFile = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const fileInput = (
    <>
      <label htmlFor={resolvedInputId} className="sr-only">
        Upload {title}
      </label>
      <input
        ref={inputRef}
        id={resolvedInputId}
        name={`upload-${id}`}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          assignFile(next);
          e.target.value = "";
        }}
      />
    </>
  );

  /* ——— After upload: compact success card (~40% shorter) ——— */
  if (success && file) {
    return (
      <article
        className={cn(
          "group w-full rounded-xl border border-[#86EFAC] bg-[#F0FDF4] transition-all duration-150 ease-out",
          "hover:border-[#4ADE80] hover:bg-[#ECFDF5]",
          justUploaded &&
            "[animation:fadeUp_200ms_ease-out_forwards]",
          compact ? "px-3 py-2" : "px-3.5 py-2.5"
        )}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534] transition-transform duration-200",
              justUploaded && "scale-110"
            )}
          >
            <CheckCircle2 className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-[13px] font-semibold text-[#0F172A]">
                {title}
              </h3>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                  required
                    ? "bg-white/90 text-[#166534] ring-1 ring-[#86EFAC]"
                    : "bg-white/80 text-[#64748B] ring-1 ring-[#E5E7EB]"
                )}
              >
                {required ? "Required" : "Optional"}
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] font-medium text-[#0F172A]">
              <FileText
                className="size-3 shrink-0 text-[#166534]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="truncate">{file.name}</span>
            </p>

            <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#475569]">
              <div className="flex gap-1">
                <dt className="text-[#94A3B8]">Uploaded</dt>
                <dd className="font-medium text-[#166534]">
                  {formatUploadedAt(uploadedAt)}
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-[#94A3B8]">Size</dt>
                <dd className="font-medium tabular-nums">{formatSize(file.size)}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-[#94A3B8]">Status</dt>
                <dd className="font-semibold text-[#166534]">
                  Uploaded Successfully
                </dd>
              </div>
            </dl>

            <div className="mt-2 flex flex-wrap gap-1">
              <span className="inline-flex items-center rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-[#64748B] ring-1 ring-[#E5E7EB]">
                Awaiting Analysis
              </span>
            </div>
          </div>
        </div>

        {fileInput}

        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-[#BBF7D0]/80 pt-2">
          <button
            type="button"
            onClick={previewFile}
            aria-label="Preview uploaded file"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#86EFAC] bg-white px-2.5 text-[11px] font-medium text-[#166534] transition-colors duration-150 hover:bg-[#ECFDF5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
          >
            <Eye className="size-3" aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            aria-label={loading ? "Replacing file" : "Replace file"}
            className="inline-flex h-7 min-w-[72px] items-center justify-center rounded-lg border border-[#86EFAC] bg-white px-2.5 text-[11px] font-medium text-[#166534] transition-all duration-150 hover:bg-[#ECFDF5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                <span className="sr-only">Replacing…</span>
              </>
            ) : (
              "Replace"
            )}
          </button>
          <button
            type="button"
            onClick={() => assignFile(null)}
            aria-label="Remove file"
            className="inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[11px] font-medium text-[#64748B] transition-colors duration-150 hover:bg-white/60 hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
          >
            Remove
          </button>
        </div>
      </article>
    );
  }

  /* ——— Before upload: enterprise pending card ——— */
  return (
    <article
      className={cn(
        "group flex h-full w-full flex-col rounded-xl border border-[#E5E7EB] bg-white transition-all duration-150 ease-out",
        "hover:-translate-y-px hover:border-[#CBD5E1] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]",
        compact ? "px-3 py-3" : "px-4 py-3.5",
        dragging && "border-[#064E3B] bg-[#F0FDF4] shadow-[0_4px_16px_rgba(6,78,59,0.1)]"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF] transition-colors duration-150 group-hover:bg-[#DCFCE7]">
          <Icon
            className="size-3.5 text-[#064E3B]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold tracking-tight text-[#0F172A]">
              {title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                required
                  ? "bg-[#E8F5EF] text-[#064E3B]"
                  : "bg-[#F1F5F9] text-[#64748B]"
              )}
            >
              {required ? "Required" : "Optional"}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-[#64748B]">
            {description}
          </p>
        </div>
      </div>

      <div
        {...dropHandlers}
        className={cn(
          "mt-3 flex w-full flex-1 flex-col justify-center rounded-lg border border-dashed px-3 transition-all duration-150",
          compact ? "min-h-[88px] py-3" : "min-h-[104px] py-3.5",
          dragging
            ? "border-[#064E3B] bg-[#ECFDF5]"
            : "border-[#D1D5DB] bg-[#FAFCFA] group-hover:border-[#94A3B8]"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Upload
            className={cn(
              "size-4 shrink-0 text-[#064E3B] transition-transform duration-150",
              dragging && "-translate-y-0.5"
            )}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[#0F172A]">
              {dragging ? "Drop file to upload" : "Drag & drop file here"}
            </p>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">
              or use the Upload button
            </p>
          </div>
          {fileInput}
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-8 min-w-[84px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#064E3B] px-3 text-[12px] font-semibold text-white transition-all duration-150 hover:bg-[#053528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#E5E7EB]/80 pt-2">
          <span className="text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
            Formats
          </span>
          <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#475569] ring-1 ring-[#E5E7EB]">
            PDF • DOCX
          </span>
          <span className="text-[10px] text-[#CBD5E1]" aria-hidden="true">
            ·
          </span>
          <span className="text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
            Max
          </span>
          <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#475569] ring-1 ring-[#E5E7EB]">
            {sizeLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
