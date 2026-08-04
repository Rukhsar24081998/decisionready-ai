import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
import type {
  CreateDecisionAnalysisInput,
  DecisionAnalysis,
  DecisionIntelligence,
  UpdateDecisionAnalysisInput,
} from "@/lib/types";
import type { AiIntelligenceResult } from "@/ai/output-schema";
import type { IngestedDocument } from "@/lib/ingestion/types";
import { seedDecisionAnalyses } from "@/lib/mock/seed";

/**
 * Decision Analysis store.
 *
 * Local/dev: file-backed `.data/analyses.json` + in-memory cache.
 * Vercel/prod: Vercel Blob (requires BLOB_READ_WRITE_TOKEN) + in-memory cache.
 *
 * Serverless instances do not share memory or the local filesystem. Without Blob
 * (or another durable backend), POST /api/analyze can succeed in one instance
 * while GET /analyses/[id]/intelligence runs in another and finds nothing.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "analyses.json");
const BLOB_PREFIX = "decisionready/analyses/";
const BLOB_INDEX_PATH = `${BLOB_PREFIX}index.json`;

type GlobalStore = {
  __decisionAnalyses?: DecisionAnalysis[];
  __decisionAnalysesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

function nowIso(): string {
  return new Date().toISOString();
}

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function logStore(
  stage: string,
  details?: Record<string, unknown>
): void {
  console.info("[store]", { stage, ...details });
}

function cloneAnalyses(list: DecisionAnalysis[]): DecisionAnalysis[] {
  return structuredClone(list);
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

async function readFromFs(): Promise<DecisionAnalysis[] | null> {
  if (!existsSync(STORE_PATH)) return null;
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as DecisionAnalysis[];
    logStore("fs_read_ok", { count: parsed.length, path: STORE_PATH });
    return parsed;
  } catch (error) {
    console.error("[store] stage=fs_read_failed", error);
    return null;
  }
}

function writeToFs(next: DecisionAnalysis[]): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
    logStore("fs_write_ok", { count: next.length, path: STORE_PATH });
  } catch (error) {
    console.error("[store] stage=fs_write_failed", {
      path: STORE_PATH,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function readFromBlob(): Promise<DecisionAnalysis[] | null> {
  try {
    const listed = await list({ prefix: BLOB_PREFIX });
    const indexBlob = listed.blobs.find((blob) => blob.pathname === BLOB_INDEX_PATH);
    if (!indexBlob) {
      logStore("blob_index_missing", { prefix: BLOB_PREFIX });
      return null;
    }

    const response = await fetch(indexBlob.url, { cache: "no-store" });
    if (!response.ok) {
      console.error("[store] stage=blob_index_fetch_failed", {
        status: response.status,
      });
      return null;
    }

    const parsed = (await response.json()) as DecisionAnalysis[];
    logStore("blob_read_ok", { count: parsed.length });
    return parsed;
  } catch (error) {
    console.error("[store] stage=blob_read_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function writeToBlob(next: DecisionAnalysis[]): Promise<void> {
  try {
    await put(BLOB_INDEX_PATH, JSON.stringify(next), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    logStore("blob_write_ok", {
      count: next.length,
      path: BLOB_INDEX_PATH,
    });
  } catch (error) {
    console.error("[store] stage=blob_write_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function ensureLoaded(): Promise<DecisionAnalysis[]> {
  const cached = getMemory();
  if (cached) {
    logStore("memory_hit", { count: cached.length });
    return cached;
  }

  logStore("load_start", {
    vercel: isVercelRuntime(),
    blobConfigured: hasBlobToken(),
  });

  let loaded: DecisionAnalysis[] | null = null;

  if (hasBlobToken()) {
    loaded = await readFromBlob();
  } else {
    loaded = await readFromFs();
    if (isVercelRuntime()) {
      console.error(
        "[store] stage=vercel_without_blob_token BLOB_READ_WRITE_TOKEN is missing. " +
          "Analyses saved in one serverless instance will not be visible in another. " +
          "Add a Vercel Blob store token to persist Decision Intelligence."
      );
    }
  }

  if (!loaded) {
    loaded = cloneAnalyses(seedDecisionAnalyses);
    logStore("seed_loaded", { count: loaded.length });
    await persist(loaded);
  }

  setMemory(loaded);
  return loaded;
}

async function persist(next: DecisionAnalysis[]): Promise<void> {
  setMemory(next);
  logStore("persist_start", {
    count: next.length,
    backend: hasBlobToken() ? "blob" : "fs",
    ids: next.slice(0, 8).map((item) => item.id),
  });

  if (hasBlobToken()) {
    await writeToBlob(next);
    return;
  }

  writeToFs(next);
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

  logStore("save_ai_start", {
    analysisId: id,
    existing: existingIndex >= 0,
    hasAiResult: Boolean(input.aiResult),
    documentCount: input.documents.length,
    backend: hasBlobToken() ? "blob" : isVercelRuntime() ? "memory-only-risk" : "fs",
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
