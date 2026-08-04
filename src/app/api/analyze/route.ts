import { NextResponse } from "next/server";
import { analyzeHiringEvidence, AiProviderError } from "@/lib/ai/provider";
import { ingestUploadedFile } from "@/lib/ingestion/ingest-file";
import {
  DOCUMENT_TYPE_BY_FIELD,
  type DocumentType,
} from "@/lib/ingestion/types";
import { saveAiDecisionIntelligence } from "@/lib/mock/store";

export const runtime = "nodejs";
export const maxDuration = 120;

const FILE_FIELDS = [
  { field: "jobDescription", required: true },
  { field: "resume", required: true },
  { field: "interviewNotes", required: true },
  { field: "scorecards", required: true },
  { field: "hiringManagerNotes", required: false },
] as const;

/**
 * POST /api/analyze
 * Multipart form: hiring evidence files + candidate context.
 * Pipeline: ingest → extractors → Evidence Graph → narrative LLM → Decision Engine.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const candidateName = String(form.get("candidateName") ?? "").trim();
    const roleTitle = String(form.get("roleTitle") ?? "").trim();
    const department = String(form.get("department") ?? "").trim();
    const hiringManager = String(form.get("hiringManager") ?? "").trim();
    const hiringStage = String(form.get("hiringStage") ?? "").trim();

    const documents = [];

    for (const { field, required } of FILE_FIELDS) {
      const value = form.get(field);
      if (!(value instanceof File) || value.size === 0) {
        if (required) {
          return NextResponse.json(
            { error: `Missing required document: ${field}` },
            { status: 400 }
          );
        }
        continue;
      }

      const documentType = DOCUMENT_TYPE_BY_FIELD[
        field as keyof typeof DOCUMENT_TYPE_BY_FIELD
      ] as DocumentType;

      const ingested = await ingestUploadedFile(value, documentType);
      documents.push(ingested);
    }

    if (documents.length < 4) {
      return NextResponse.json(
        {
          error:
            "Minimum required evidence: Job Description, Resume, Interview Notes, and Scorecards.",
        },
        { status: 400 }
      );
    }

    const aiResult = await analyzeHiringEvidence({
      context: {
        candidateName,
        roleTitle,
        department,
        hiringManager,
        hiringStage,
      },
      documents,
    });

    const analysis = saveAiDecisionIntelligence({
      candidateName: aiResult.candidate.name || candidateName || "Candidate",
      roleTitle: aiResult.candidate.role || roleTitle || "Open Role",
      documents,
      aiResult,
    });

    return NextResponse.json({
      data: {
        analysisId: analysis.id,
        intelligence: analysis.aiResult,
        documents: documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          documentType: doc.documentType,
          extractedTextLength: doc.extractedText.length,
        })),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate Decision Intelligence";

    console.error("[api/analyze]", error);

    const status =
      error instanceof AiProviderError && error.code === "MISSING_API_KEY"
        ? 503
        : error instanceof AiProviderError && error.code === "RATE_LIMIT"
          ? 429
          : error instanceof AiProviderError && error.code === "TIMEOUT"
            ? 504
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
