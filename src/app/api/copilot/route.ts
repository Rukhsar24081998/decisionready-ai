import { NextResponse } from "next/server";
import { askRecruiterCopilot } from "@/lib/ai/copilot-service";
import { AiProviderError } from "@/lib/ai/provider";
import type { CopilotConversationTurn } from "@/lib/ai/copilot-schema";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * POST /api/copilot
 * Grounded Recruiter Copilot Q&A over an existing Decision Analysis.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      analysisId?: string;
      userQuestion?: string;
      conversationHistory?: CopilotConversationTurn[];
    };

    const analysisId = String(body.analysisId ?? "").trim();
    const userQuestion = String(body.userQuestion ?? "").trim();
    const conversationHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory.filter(
          (turn) =>
            turn &&
            (turn.role === "user" || turn.role === "assistant") &&
            typeof turn.content === "string"
        )
      : [];

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId is required.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    if (!userQuestion) {
      return NextResponse.json(
        {
          error: "Please enter a question about the uploaded hiring evidence.",
          code: "VALIDATION",
        },
        { status: 400 }
      );
    }

    const result = await askRecruiterCopilot({
      analysisId,
      userQuestion,
      conversationHistory,
    });

    return NextResponse.json({
      data: {
        answer: result.answer,
        confidence: result.confidence,
        citations: result.citations,
        relatedCompetencies: result.relatedCompetencies,
        limitations: result.limitations,
        followUpQuestions: result.followUpQuestions,
        evidenceConflict: result.evidenceConflict,
        supportingQuotes: result.citations.map((c) => c.quote),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to answer Recruiter Copilot question.";

    console.error("[api/copilot]", error);

    const status =
      error instanceof AiProviderError && error.code === "MISSING_API_KEY"
        ? 503
        : error instanceof AiProviderError && error.code === "RATE_LIMIT"
          ? 429
          : error instanceof AiProviderError && error.code === "TIMEOUT"
            ? 504
            : error instanceof AiProviderError && error.code === "VALIDATION"
              ? 400
              : 500;

    return NextResponse.json(
      {
        error: message,
        code: error instanceof AiProviderError ? error.code : "UNKNOWN",
      },
      { status }
    );
  }
}
