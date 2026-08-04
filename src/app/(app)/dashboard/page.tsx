import Link from "next/link";
import { Plus } from "lucide-react";
import { DecisionAnalysisList } from "@/components/dashboard/decision-analysis-list";
import {
  PageContainer,
  PageHeader,
} from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { listDecisionAnalyses } from "@/lib/mock/store";

/**
 * Screen 1 — Decision Dashboard
 * Product entry point for listing and opening Decision Analyses.
 *
 * force-dynamic: must not prerender against Blob/FS at build time.
 */
export const dynamic = "force-dynamic";

export default async function DecisionDashboardPage() {
  const analyses = await listDecisionAnalyses();
  const hasAnalyses = analyses.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Decision Dashboard"
        description="Review existing Decision Analyses or create a new one."
        actions={
          <Link
            href="/analyses/new"
            className={buttonVariants({ size: "lg" })}
            aria-label="Create new Decision Analysis"
          >
            <Plus data-icon="inline-start" className="size-4" aria-hidden="true" />
            New Decision Analysis
          </Link>
        }
      />

      {hasAnalyses ? (
        <DecisionAnalysisList analyses={analyses} />
      ) : (
        <EmptyState
          title="No Decision Analyses yet"
          description="Create your first Decision Analysis to begin evaluating interview evidence."
          actionLabel="Create First Decision Analysis"
          actionHref="/analyses/new"
        />
      )}
    </PageContainer>
  );
}
