import Link from "next/link";
import type { Metadata } from "next";
import { DecisionBriefReport } from "@/components/brief/decision-brief-report";
import { getDecisionBriefData } from "@/components/brief/brief-data";
import { IntelligenceRestoreBridge } from "@/components/intelligence/intelligence-restore-bridge";
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
  console.info("[brief/page] stage=load", { analysisId });
  const data = await getDecisionBriefData(analysisId);
  console.info("[brief/page] stage=loaded", {
    analysisId,
    hasData: Boolean(data),
  });

  if (!data) {
    return (
      <main className="relative overflow-hidden">
        <DotGrid className="opacity-25" />
        <div className={cn(landingContainer, "relative py-16")}>
          <IntelligenceRestoreBridge analysisId={analysisId} />
          <p className="mt-4 max-w-xl text-[13px] text-[#64748B]">
            After restore completes, open the Decision Brief again from the
            dashboard.
          </p>
          <Link
            href={`/analyses/${analysisId}/intelligence`}
            className={cn(landingBtnPrimary, "mt-4 inline-flex")}
          >
            Open Decision Intelligence
          </Link>
        </div>
      </main>
    );
  }

  return <DecisionBriefReport data={data} />;
}
