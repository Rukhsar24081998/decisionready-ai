import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { DecisionAnalysis } from "@/lib/types";
import {
  type AnalysisStoreBackend,
  logStore,
} from "@/lib/mock/store-shared";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "analyses.json");

/**
 * Node.js filesystem backend for local development only.
 * Must never be imported from client components.
 */
export const localAnalysisStore: AnalysisStoreBackend = {
  async readAll(): Promise<DecisionAnalysis[] | null> {
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
  },

  async writeAll(next: DecisionAnalysis[]): Promise<void> {
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
  },
};
