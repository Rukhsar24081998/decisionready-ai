import Link from "next/link";
import type { Metadata } from "next";
import { DecisionBriefReport } from "@/components/brief/decision-brief-report";
import { getDecisionBriefData } from "@/components/brief/brief-data";
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
  title: "Decision Brief",
  description:
    "Executive hiring debrief report for Decision Readiness—without hire or reject recommendations.",
};

/**
 * Decision Brief — export-ready executive report for hiring debriefs.
 */
export default async function DecisionBriefPage({ params }: PageProps) {
  const { analysisId } = await params;
  const data = getDecisionBriefData(analysisId);

  if (!data) {
    return (
      <main className="relative overflow-hidden">
        <DotGrid className="opacity-25" />
        <div className={cn(landingContainer, "relative py-16")}>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0F172A]">
            Decision Brief unavailable
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#64748B]">
            No AI-generated Decision Brief was found for this analysis. Generate
            Decision Intelligence from hiring evidence first.
          </p>
          <Link
            href="/analyses/new"
            className={cn(landingBtnPrimary, "mt-6 inline-flex")}
          >
            Create Decision Analysis
          </Link>
        </div>
      </main>
    );
  }

  return <DecisionBriefReport data={data} />;
}
