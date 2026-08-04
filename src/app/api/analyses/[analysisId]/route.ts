import { NextResponse } from "next/server";
import {
  getDecisionAnalysis,
  updateDecisionAnalysis,
} from "@/lib/mock/store";
import type { UpdateDecisionAnalysisInput } from "@/lib/types";

interface RouteContext {
  params: Promise<{ analysisId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { analysisId } = await context.params;
  const analysis = getDecisionAnalysis(analysisId);

  if (!analysis) {
    return NextResponse.json(
      { error: "Decision Analysis not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: analysis });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { analysisId } = await context.params;

  try {
    const body = (await request.json()) as UpdateDecisionAnalysisInput;
    const updated = updateDecisionAnalysis(analysisId, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Decision Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update Decision Analysis" },
      { status: 500 }
    );
  }
}
