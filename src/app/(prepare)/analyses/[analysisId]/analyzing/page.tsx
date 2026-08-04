import type { Metadata } from "next";
import { AiAnalysisProgress } from "@/components/analysis/ai-analysis-progress";

interface PageProps {
  params: Promise<{ analysisId: string }>;
}

export const metadata: Metadata = {
  title: "Generating Decision Intelligence",
  description:
    "DecisionReady AI is analyzing hiring evidence to assess decision readiness.",
};

/**
 * AI Analysis in Progress — explainable reasoning pipeline (not a chat UI).
 */
export default async function AnalyzingPage({ params }: PageProps) {
  const { analysisId } = await params;
  return <AiAnalysisProgress analysisId={analysisId} />;
}
