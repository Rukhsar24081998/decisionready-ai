import "server-only";

import type {
  CreateDecisionAnalysisInput,
  DecisionAnalysis,
  DecisionIntelligence,
  UpdateDecisionAnalysisInput,
} from "@/lib/types";
import type { AiIntelligenceResult } from "@/ai/output-schema";
import type { IngestedDocument } from "@/lib/ingestion/types";
import { seedDecisionAnalyses } from "@/lib/mock/seed";
import { blobAnalysisStore } from "@/lib/mock/store.blob";
import { localAnalysisStore } from "@/lib/mock/store.local";
import {
  cloneAnalyses,
  hasBlobToken,
  isBuildTime,
  isVercelRuntime,
  logStore,
  type AnalysisStoreBackend,
} from "@/lib/mock/store-shared";

/**
 * Server-only Decision Analysis store facade.
 *
 * - Production (BLOB_READ_WRITE_TOKEN): Vercel Blob
 * - Local/dev: Node filesystem under `.data/analyses.json`
 *
 * This module imports Node/Blob backends and must never be imported by client code.
 */

type GlobalStore = {
  __decisionAnalyses?: DecisionAnalysis[];
  __decisionAnalysesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

function nowIso(): string {
  return new Date().toISOString();
}

function getBackend(): { name: "blob" | "fs"; store: AnalysisStoreBackend } {
  if (hasBlobToken()) {
    return { name: "blob", store: blobAnalysisStore };
  }
  return { name: "fs", store: localAnalysisStore };
}

function setMemory(next: DecisionAnalysis[]): void {
  globalStore.__decisionAnalyses = next;
  globalStore.__decisionAnalysesLoaded = true;
}

function getMemory(): DecisionAnalysis[] | null {
  if (!globalStore.__decisionAnalysesLoaded || !globalStore.__decisionAnalyses) {
    return null;
  }
  return globalStore.__decisionAnalyses;
}

async function ensureLoaded(): Promise<DecisionAnalysis[]> {
  const cached = getMemory();
  if (cached) {
    logStore("memory_hit", { count: cached.length });
    return cached;
  }

  const backend = getBackend();
  logStore("load_start", {
    vercel: isVercelRuntime(),
    blobConfigured: hasBlobToken(),
    backend: backend.name,
    buildTime: isBuildTime(),
  });

  // Never touch Blob/FS during `next build` static generation.
  if (isBuildTime()) {
    const seeded = cloneAnalyses(seedDecisionAnalyses);
    logStore("seed_loaded_build_skip_io", { count: seeded.length });
    setMemory(seeded);
    return seeded;
  }

  let loaded = await backend.store.readAll();

  if (!loaded && isVercelRuntime() && !hasBlobToken()) {
    console.error(
      "[store] stage=vercel_without_blob_token BLOB_READ_WRITE_TOKEN is missing. " +
        "Analyses saved in one serverless instance will not be visible in another. " +
        "Add a Vercel Blob store token to persist Decision Intelligence."
    );
  }

  if (!loaded) {
    // In-memory seeds only — do not write seed data to Blob/FS on load.
    loaded = cloneAnalyses(seedDecisionAnalyses);
    logStore("seed_loaded_memory_only", { count: loaded.length });
    setMemory(loaded);
    return loaded;
  }

  setMemory(loaded);
  return loaded;
}

async function persist(next: DecisionAnalysis[]): Promise<void> {
  setMemory(next);

  if (isBuildTime()) {
    logStore("persist_skipped_build", {
      count: next.length,
      ids: next.slice(0, 8).map((item) => item.id),
    });
    return;
  }

  const backend = getBackend();
  logStore("persist_start", {
    count: next.length,
    backend: backend.name,
    ids: next.slice(0, 8).map((item) => item.id),
  });
  await backend.store.writeAll(next);
}

export async function listDecisionAnalyses(): Promise<DecisionAnalysis[]> {
  const analyses = await ensureLoaded();
  return [...analyses].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getDecisionAnalysis(
  id: string
): Promise<DecisionAnalysis | undefined> {
  const analyses = await ensureLoaded();
  const found = analyses.find((analysis) => analysis.id === id);
  logStore("get_analysis", {
    analysisId: id,
    found: Boolean(found),
    hasAiResult: Boolean(found?.aiResult),
    status: found?.status ?? null,
  });
  return found;
}

export async function createDecisionAnalysis(
  input: CreateDecisionAnalysisInput
): Promise<DecisionAnalysis> {
  const timestamp = nowIso();
  const analysis: DecisionAnalysis = {
    id: `da_${crypto.randomUUID().slice(0, 8)}`,
    candidateName: input.candidateName.trim(),
    roleTitle: input.roleTitle.trim(),
    status: "needs_evidence",
    evidence: {
      jobDescription: "",
      resume: "",
      interviewFeedback: [],
    },
    intelligence: null,
    aiResult: null,
    ingestedDocuments: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    evidenceUpdatedAt: timestamp,
    analyzedAt: null,
  };

  const analyses = await ensureLoaded();
  await persist([analysis, ...analyses]);
  logStore("create_analysis", { analysisId: analysis.id });
  return analysis;
}

export async function updateDecisionAnalysis(
  id: string,
  input: UpdateDecisionAnalysisInput
): Promise<DecisionAnalysis | undefined> {
  const analyses = await ensureLoaded();
  const index = analyses.findIndex((analysis) => analysis.id === id);
  if (index === -1) return undefined;

  const current = analyses[index];
  const timestamp = nowIso();
  const evidenceUpdated =
    input.evidence !== undefined
      ? {
          jobDescription:
            input.evidence.jobDescription ?? current.evidence.jobDescription,
          resume: input.evidence.resume ?? current.evidence.resume,
          interviewFeedback:
            input.evidence.interviewFeedback ??
            current.evidence.interviewFeedback,
        }
      : current.evidence;

  const updated: DecisionAnalysis = {
    ...current,
    candidateName: input.candidateName ?? current.candidateName,
    roleTitle: input.roleTitle ?? current.roleTitle,
    status: input.status ?? current.status,
    evidence: evidenceUpdated,
    updatedAt: timestamp,
    evidenceUpdatedAt:
      input.evidence !== undefined ? timestamp : current.evidenceUpdatedAt,
  };

  const next = [...analyses];
  next[index] = updated;
  await persist(next);
  logStore("update_analysis", { analysisId: id });
  return updated;
}

export async function saveDecisionIntelligence(
  id: string,
  intelligence: DecisionIntelligence
): Promise<DecisionAnalysis | undefined> {
  const analyses = await ensureLoaded();
  const index = analyses.findIndex((analysis) => analysis.id === id);
  if (index === -1) return undefined;

  const timestamp = nowIso();
  const updated: DecisionAnalysis = {
    ...analyses[index],
    intelligence,
    status: "analyzed",
    analyzedAt: timestamp,
    updatedAt: timestamp,
  };

  const next = [...analyses];
  next[index] = updated;
  await persist(next);
  logStore("save_legacy_intelligence", {
    analysisId: id,
    hasIntelligence: true,
  });
  return updated;
}

export async function saveAiDecisionIntelligence(input: {
  id?: string;
  candidateName: string;
  roleTitle: string;
  documents: IngestedDocument[];
  aiResult: AiIntelligenceResult;
}): Promise<DecisionAnalysis> {
  const analyses = await ensureLoaded();
  const timestamp = nowIso();
  const id = input.id ?? `da_${crypto.randomUUID().slice(0, 8)}`;
  const existingIndex = analyses.findIndex((analysis) => analysis.id === id);
  const backend = getBackend();

  logStore("save_ai_start", {
    analysisId: id,
    existing: existingIndex >= 0,
    hasAiResult: Boolean(input.aiResult),
    documentCount: input.documents.length,
    backend:
      backend.name === "blob"
        ? "blob"
        : isVercelRuntime()
          ? "memory-only-risk"
          : "fs",
  });

  const base: DecisionAnalysis =
    existingIndex >= 0
      ? analyses[existingIndex]
      : {
          id,
          candidateName: input.candidateName,
          roleTitle: input.roleTitle,
          status: "needs_evidence",
          evidence: {
            jobDescription: "",
            resume: "",
            interviewFeedback: [],
          },
          intelligence: null,
          aiResult: null,
          ingestedDocuments: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          evidenceUpdatedAt: timestamp,
          analyzedAt: null,
        };

  const jd =
    input.documents.find((d) => d.documentType === "Job Description")
      ?.extractedText ?? base.evidence.jobDescription;
  const resume =
    input.documents.find((d) => d.documentType === "Resume")?.extractedText ??
    base.evidence.resume;

  const updated: DecisionAnalysis = {
    ...base,
    id,
    candidateName: input.candidateName || base.candidateName,
    roleTitle: input.roleTitle || base.roleTitle,
    status: "analyzed",
    evidence: {
      ...base.evidence,
      jobDescription: jd,
      resume,
    },
    ingestedDocuments: input.documents,
    aiResult: input.aiResult,
    analyzedAt: timestamp,
    updatedAt: timestamp,
    evidenceUpdatedAt: timestamp,
  };

  if (existingIndex >= 0) {
    const next = [...analyses];
    next[existingIndex] = updated;
    await persist(next);
  } else {
    await persist([updated, ...analyses]);
  }

  const verify = (await ensureLoaded()).find((item) => item.id === id);
  logStore("save_ai_ok", {
    analysisId: id,
    verified: Boolean(verify?.aiResult),
    readiness: verify?.aiResult?.decisionReadiness?.label ?? null,
  });

  return updated;
}

/** Upsert a full analysis record (used by client restore after generate). */
export async function upsertDecisionAnalysis(
  analysis: DecisionAnalysis
): Promise<DecisionAnalysis> {
  const analyses = await ensureLoaded();
  const index = analyses.findIndex((item) => item.id === analysis.id);
  const next =
    index >= 0
      ? analyses.map((item, i) => (i === index ? analysis : item))
      : [analysis, ...analyses];
  await persist(next);
  logStore("upsert_analysis", {
    analysisId: analysis.id,
    hasAiResult: Boolean(analysis.aiResult),
  });
  return analysis;
}

export async function resetStore(): Promise<void> {
  await persist(cloneAnalyses(seedDecisionAnalyses));
}
