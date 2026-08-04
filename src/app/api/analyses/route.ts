import { NextResponse } from "next/server";
import {
  createDecisionAnalysis,
  listDecisionAnalyses,
} from "@/lib/mock/store";

export async function GET() {
  const analyses = listDecisionAnalyses();
  return NextResponse.json({ data: analyses });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      candidateName?: string;
      roleTitle?: string;
    };

    if (!body.candidateName?.trim() || !body.roleTitle?.trim()) {
      return NextResponse.json(
        { error: "candidateName and roleTitle are required" },
        { status: 400 }
      );
    }

    const analysis = createDecisionAnalysis({
      candidateName: body.candidateName,
      roleTitle: body.roleTitle,
    });

    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create Decision Analysis" },
      { status: 500 }
    );
  }
}
