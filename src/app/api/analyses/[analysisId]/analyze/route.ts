import { NextResponse } from "next/server";
import { analyzeCase } from "@/ai/analyze";
import {
  getDecisionAnalysis,
  saveDecisionIntelligence,
} from "@/lib/mock/store";

interface RouteContext {
  params: Promise<{ analysisId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { analysisId } = await context.params;
  const analysis = await getDecisionAnalysis(analysisId);

  if (!analysis) {
    return NextResponse.json(
      { error: "Decision Analysis not found", analysisId },
      { status: 404 }
    );
  }

  const hasJd = analysis.evidence.jobDescription.trim().length > 0;
  const hasFeedback = analysis.evidence.interviewFeedback.length > 0;

  if (!hasJd || !hasFeedback) {
    return NextResponse.json(
      {
        error:
          "Minimum evidence required: job description and at least one interview feedback entry",
      },
      { status: 400 }
    );
  }

  try {
    const intelligence = await analyzeCase(analysis);
    const updated = await saveDecisionIntelligence(analysisId, intelligence);

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate Decision Intelligence" },
      { status: 500 }
    );
  }
}
