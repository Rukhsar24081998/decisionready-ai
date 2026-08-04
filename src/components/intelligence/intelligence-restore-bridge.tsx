"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DecisionIntelligenceDashboard } from "@/components/intelligence/decision-intelligence-dashboard";
import {
  buildIntelligenceDashboardData,
  type IntelligenceDashboardData,
} from "@/components/intelligence/dashboard-data";
import { landingBtnPrimary } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";
import type { DecisionAnalysis } from "@/lib/types";

const STORAGE_PREFIX = "decisionready:analysis:";

export function analysisStorageKey(analysisId: string): string {
  return `${STORAGE_PREFIX}${analysisId}`;
}

export function persistAnalysisLocally(analysis: DecisionAnalysis): void {
  try {
    sessionStorage.setItem(
      analysisStorageKey(analysis.id),
      JSON.stringify(analysis)
    );
  } catch (error) {
    console.warn("[intelligence-restore] failed to write sessionStorage", error);
  }
}

/**
 * When the server store misses (common on Vercel without shared filesystem),
 * restore from the generate-flow cache and render the dashboard locally.
 * Also upserts into the server store so subsequent API calls can find it.
 */
export function IntelligenceRestoreBridge({
  analysisId,
}: {
  analysisId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    "loading"
  );
  const [message, setMessage] = useState(
    "Restoring Decision Intelligence for this analysis…"
  );
  const [data, setData] = useState<IntelligenceDashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const cached = sessionStorage.getItem(analysisStorageKey(analysisId));
        if (!cached) {
          if (!cancelled) {
            setStatus("missing");
            setMessage(
              "No AI-generated Decision Intelligence was found for this analysis. Upload hiring evidence and generate Decision Intelligence to continue."
            );
          }
          return;
        }

        const analysis = JSON.parse(cached) as DecisionAnalysis;
        if (!analysis?.id || analysis.id !== analysisId || !analysis.aiResult) {
          if (!cancelled) {
            setStatus("missing");
            setMessage(
              "Cached analysis is incomplete or does not match this analysis ID. Please generate Decision Intelligence again."
            );
          }
          return;
        }

        const dashboardData = buildIntelligenceDashboardData(analysis);
        if (!dashboardData) {
          if (!cancelled) {
            setStatus("missing");
            setMessage(
              "Cached analysis has no Decision Intelligence payload."
            );
          }
          return;
        }

        // Best-effort durable/server restore for copilot + later requests.
        const response = await fetch("/api/analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis }),
        });

        if (!response.ok) {
          console.warn("[intelligence-restore] server upsert failed", {
            analysisId,
            status: response.status,
          });
        } else {
          console.info("[intelligence-restore] server upsert ok", {
            analysisId,
          });
        }

        if (!cancelled) {
          setData(dashboardData);
          setStatus("ready");
          router.refresh();
        }
      } catch (error) {
        console.error("[intelligence-restore] failed", error);
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to restore Decision Intelligence."
          );
        }
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [analysisId, router]);

  if (status === "ready" && data) {
    return <DecisionIntelligenceDashboard data={data} />;
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight text-[#0F172A]">
        {status === "loading"
          ? "Loading Decision Intelligence"
          : "Decision Intelligence unavailable"}
      </h1>
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#64748B]">
        {message}
      </p>
      {status !== "loading" ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/analyses/new"
            className={cn(landingBtnPrimary, "inline-flex")}
          >
            Start new analysis
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-5 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
          >
            Back to dashboard
          </Link>
        </div>
      ) : null}
    </div>
  );
}
