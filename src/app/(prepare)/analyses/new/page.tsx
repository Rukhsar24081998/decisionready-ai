import type { Metadata } from "next";
import { StartAnalysisPage } from "@/components/prepare/start-analysis-page";

export const metadata: Metadata = {
  title: "Create Decision Analysis",
  description:
    "Assemble hiring evidence to generate structured Decision Intelligence and assess decision readiness.",
};

/**
 * Prepare Decision Analysis — Evidence Workspace.
 */
export default function NewDecisionAnalysisPage() {
  return <StartAnalysisPage />;
}
