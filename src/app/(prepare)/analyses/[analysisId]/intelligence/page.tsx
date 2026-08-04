import Link from "next/link";
import type { Metadata } from "next";
import { DecisionIntelligenceDashboard } from "@/components/intelligence/decision-intelligence-dashboard";
import { getIntelligenceDashboardData } from "@/components/intelligence/dashboard-data";
import { DotGrid } from "@/components/landing/dot-grid";
import {
  landingBtnPrimary,
  landingContainer,
} from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ analysisId: string }>;
}

export const metadata: Metadata = {
  title: "Decision Intelligence",
  description:
    "Review Decision Readiness, Competency Coverage, Evidence Explorer, and interviewer alignment.",
};

/**
 * Decision Intelligence Dashboard — structured executive report (not a chat UI).
 */
export default async function DecisionIntelligencePage({ params }: PageProps) {
  const { analysisId } = await params;
  const data = getIntelligenceDashboardData(analysisId);

  if (!data) {
    return (
      <main className="relative overflow-hidden">
        <DotGrid className="opacity-25" />
        <div className={cn(landingContainer, "relative py-16")}>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0F172A]">
            Decision Intelligence unavailable
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#64748B]">
            No AI-generated Decision Intelligence was found for this analysis.
            Upload hiring evidence and generate Decision Intelligence to
            continue.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/analyses/new`}
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
        </div>
      </main>
    );
  }

  return <DecisionIntelligenceDashboard data={data} />;
}
