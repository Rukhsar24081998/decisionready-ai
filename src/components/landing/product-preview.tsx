"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Decision Intelligence Preview — compact, above-the-fold SaaS mock.
 */
export function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-[#E7ECEF] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
      role="img"
      aria-label="Decision Intelligence Preview"
    >
      {/* Browser header */}
      <div className="relative flex h-10 items-center border-b border-[#E7ECEF] bg-[#FAFAFA] px-4">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#E7ECEF]" />
          <span className="size-2 rounded-full bg-[#E7ECEF]" />
          <span className="size-2 rounded-full bg-[#E7ECEF]" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-[#64748B]">
          Decision Intelligence Preview
        </span>
        <span className="ml-auto inline-flex h-5 items-center rounded-full bg-[#064E3B] px-2 text-[9px] font-semibold tracking-wide text-white">
          Decision Ready
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 pb-6 sm:gap-5 sm:p-5 sm:pb-7">
        {/* Readiness + metrics */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[140px_1fr] sm:gap-4">
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E7ECEF] bg-[#FAFCFA] px-3 py-4">
            <div
              className="relative flex size-[100px] items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#064E3B 0% 92%, #E7ECEF 92% 100%)",
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-[24px] font-semibold leading-none tracking-tight text-[#0F172A] tabular-nums">
                  92%
                </span>
                <span className="mt-1 text-[8px] font-bold tracking-[0.12em] text-[#64748B] uppercase">
                  Ready
                </span>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] font-medium text-[#475569]">
              Decision Readiness
            </p>
          </div>

          <div className="grid grid-rows-3 gap-2.5">
            {[
              {
                label: "Evidence Coverage",
                value: "8/8",
                detail: "Competencies",
              },
              { label: "Evidence Gaps", value: "0", detail: "Missing" },
              {
                label: "Interviewer Conflicts",
                value: "0",
                detail: "Unresolved",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="flex flex-col justify-center rounded-xl border border-[#E7ECEF] px-3.5 py-2"
              >
                <p className="text-[9px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                  {m.label}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight text-[#0F172A] tabular-nums">
                  {m.value}{" "}
                  <span className="text-[11px] font-medium text-[#475569]">
                    {m.detail}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended next action */}
        <div className="rounded-xl border border-[#D1E7DC] bg-[#E8F5EF] px-4 py-3.5">
          <p className="text-[9px] font-bold tracking-[0.08em] text-[#064E3B] uppercase">
            Recommended Next Action
          </p>
          <p className="mt-1.5 text-[14px] font-semibold text-[#0F172A]">
            Proceed to hiring debrief
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#475569]">
            All required competencies are covered. No unresolved conflicts
            detected.
          </p>
        </div>

        {/* Competency coverage */}
        <div>
          <p className="mb-3 text-[9px] font-bold tracking-[0.08em] text-[#64748B] uppercase">
            Competency Coverage
          </p>
          <div className="space-y-3">
            {[
              "System Design",
              "TypeScript / Node",
              "Ownership",
              "Communication",
            ].map((name, index) => (
              <div key={name}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-[#0F172A]">{name}</p>
                  <span className="shrink-0 text-[11px] font-semibold text-[#064E3B]">
                    Sufficient
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E7ECEF]">
                  <div
                    className={cn(
                      "h-full rounded-full bg-[#064E3B] transition-[width] duration-1000 ease-out",
                      animate ? "w-full" : "w-0"
                    )}
                    style={{ transitionDelay: `${index * 120}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
