import "server-only";

import { buildIntelligenceDashboardData } from "@/components/intelligence/dashboard-data";
import { getDecisionAnalysis } from "@/lib/mock/store";
import { convertLegacyIntelligence } from "@/lib/ai/legacy-adapter";

/**
 * Server-only loader for Decision Intelligence dashboard data.
 * Kept separate so client components can import mapping helpers without pulling in the store.
 */
export async function getIntelligenceDashboardData(
  analysisId: string
) {
  const analysis = await getDecisionAnalysis(analysisId);
  console.info("[dashboard-data] stage=get_intelligence", {
    analysisId,
    found: Boolean(analysis),
    hasAiResult: Boolean(analysis?.aiResult),
  });
  if (!analysis) return null;
  if (!analysis.aiResult && analysis.intelligence) {
    analysis.aiResult = convertLegacyIntelligence(analysis);
  }
  if (!analysis.aiResult) return null;
  return buildIntelligenceDashboardData(analysis);
}
