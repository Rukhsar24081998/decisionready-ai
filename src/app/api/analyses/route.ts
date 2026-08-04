import { NextResponse } from "next/server";
import {
  createDecisionAnalysis,
  listDecisionAnalyses,
  upsertDecisionAnalysis,
} from "@/lib/mock/store";
import type { DecisionAnalysis } from "@/lib/types";

export async function GET() {
  const analyses = await listDecisionAnalyses();
  return NextResponse.json({ data: analyses });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      candidateName?: string;
      roleTitle?: string;
      /** Full analysis restore payload (post-generate durability bridge). */
      analysis?: DecisionAnalysis;
    };

    if (body.analysis?.id && body.analysis.aiResult) {
      console.info("[api/analyses] stage=restore_upsert", {
        analysisId: body.analysis.id,
        hasAiResult: true,
      });
      const saved = await upsertDecisionAnalysis(body.analysis);
      return NextResponse.json({ data: saved }, { status: 200 });
    }

    if (!body.candidateName?.trim() || !body.roleTitle?.trim()) {
      return NextResponse.json(
        { error: "candidateName and roleTitle are required" },
        { status: 400 }
      );
    }

    const analysis = await createDecisionAnalysis({
      candidateName: body.candidateName,
      roleTitle: body.roleTitle,
    });

    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch (error) {
    console.error("[api/analyses] stage=post_failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Decision Analysis",
      },
      { status: 500 }
    );
  }
}
