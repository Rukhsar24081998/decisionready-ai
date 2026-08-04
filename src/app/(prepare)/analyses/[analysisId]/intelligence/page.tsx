import { getIntelligenceDashboardData } from "@/components/intelligence/dashboard-data.server";
import { DecisionIntelligenceDashboard } from "@/components/intelligence/decision-intelligence-dashboard";
import { IntelligenceRestoreBridge } from "@/components/intelligence/intelligence-restore-bridge";
import { DotGrid } from "@/components/landing/dot-grid";
import { landingContainer } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
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
  console.info("[intelligence/page] stage=load", { analysisId });
  const data = await getIntelligenceDashboardData(analysisId);
  console.info("[intelligence/page] stage=loaded", {
    analysisId,
    hasData: Boolean(data),
  });

  if (!data) {
    return (
      <main className="relative overflow-hidden">
        <DotGrid className="opacity-25" />
        <div className={cn(landingContainer, "relative py-16")}>
          <IntelligenceRestoreBridge analysisId={analysisId} />
        </div>
      </main>
    );
  }

  return <DecisionIntelligenceDashboard data={data} />;
}
