import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DecisionBriefReport } from "@/components/brief/decision-brief-report";
import { getDecisionBriefData } from "@/components/brief/brief-data";

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
    console.info("[brief/page] stage=missing_intelligence_redirect", {
      analysisId,
    });
    redirect(`/analyses/${analysisId}/intelligence`);
  }

  return <DecisionBriefReport data={data} />;
}
