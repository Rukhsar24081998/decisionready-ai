import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
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
 * File-backed store for MVP Decision Analyses.
 * Survives API route → page navigation in local/dev.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "analyses.json");

type GlobalStore = {
  __decisionAnalyses?: DecisionAnalysis[];
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

function nowIso(): string {
  return new Date().toISOString();
}

function ensureLoaded(): DecisionAnalysis[] {
  if (globalStore.__decisionAnalyses) {
    return globalStore.__decisionAnalyses;
  }

  if (existsSync(STORE_PATH)) {
    try {
      const raw = readFileSync(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw) as DecisionAnalysis[];
      globalStore.__decisionAnalyses = parsed;
      return parsed;
    } catch {
      // fall through to seed
    }
  }

  const seeded = structuredClone(seedDecisionAnalyses);
  globalStore.__decisionAnalyses = seeded;
  persist(seeded);
  return seeded;
}

function persist(next: DecisionAnalysis[]) {
  globalStore.__decisionAnalyses = next;
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  } catch (error) {
    console.error("[store] failed to persist analyses", error);
  }
}

function getAnalyses(): DecisionAnalysis[] {
  return ensureLoaded();
}

function setAnalyses(next: DecisionAnalysis[]) {
  persist(next);
}

export function listDecisionAnalyses(): DecisionAnalysis[] {
  return [...getAnalyses()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getDecisionAnalysis(
  id: string
): DecisionAnalysis | undefined {
  return getAnalyses().find((analysis) => analysis.id === id);
}

export function createDecisionAnalysis(
  input: CreateDecisionAnalysisInput
): DecisionAnalysis {
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

  setAnalyses([analysis, ...getAnalyses()]);
  return analysis;
}

export function updateDecisionAnalysis(
  id: string,
  input: UpdateDecisionAnalysisInput
): DecisionAnalysis | undefined {
  const analyses = getAnalyses();
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
  setAnalyses(next);
  return updated;
}

export function saveDecisionIntelligence(
  id: string,
  intelligence: DecisionIntelligence
): DecisionAnalysis | undefined {
  const analyses = getAnalyses();
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
  setAnalyses(next);
  return updated;
}

export function saveAiDecisionIntelligence(input: {
  id?: string;
  candidateName: string;
  roleTitle: string;
  documents: IngestedDocument[];
  aiResult: AiIntelligenceResult;
}): DecisionAnalysis {
  const analyses = getAnalyses();
  const timestamp = nowIso();
  const id = input.id ?? `da_${crypto.randomUUID().slice(0, 8)}`;
  const existingIndex = analyses.findIndex((analysis) => analysis.id === id);

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
    setAnalyses(next);
  } else {
    setAnalyses([updated, ...analyses]);
  }

  return updated;
}

export function resetStore(): void {
  setAnalyses(structuredClone(seedDecisionAnalyses));
}
