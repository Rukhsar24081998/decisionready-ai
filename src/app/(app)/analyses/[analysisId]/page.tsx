import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ analysisId: string }>;
}

/**
 * Legacy evidence-edit route — send recruiters to Decision Intelligence
 * (or the unavailable state with prepare guidance).
 */
export default async function DecisionAnalysisEvidencePage({
  params,
}: PageProps) {
  const { analysisId } = await params;
  redirect(`/analyses/${analysisId}/intelligence`);
}
