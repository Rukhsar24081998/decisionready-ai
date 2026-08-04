import "server-only";

import { get, put } from "@vercel/blob";
import type { DecisionAnalysis } from "@/lib/types";
import {
  BLOB_INDEX_PATH,
  type AnalysisStoreBackend,
  logStore,
} from "@/lib/mock/store-shared";

const PRIVATE_ACCESS = "private" as const;

/**
 * Vercel Blob backend for production persistence across serverless instances.
 * Store is PRIVATE — all reads use get() with access: "private"; never public URLs.
 * Must never be imported from client components.
 */
export const blobAnalysisStore: AnalysisStoreBackend = {
  async readAll(): Promise<DecisionAnalysis[] | null> {
    try {
      const result = await get(BLOB_INDEX_PATH, {
        access: PRIVATE_ACCESS,
        useCache: false,
      });

      if (!result) {
        logStore("blob_index_missing", { path: BLOB_INDEX_PATH });
        return null;
      }

      if (result.statusCode !== 200 || !result.stream) {
        logStore("blob_index_not_ready", {
          path: BLOB_INDEX_PATH,
          statusCode: result.statusCode,
        });
        return null;
      }

      const text = await new Response(result.stream).text();
      const parsed = JSON.parse(text) as DecisionAnalysis[];
      logStore("blob_read_ok", { count: parsed.length, path: BLOB_INDEX_PATH });
      return parsed;
    } catch (error) {
      console.error("[store] stage=blob_read_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  async writeAll(next: DecisionAnalysis[]): Promise<void> {
    try {
      await put(BLOB_INDEX_PATH, JSON.stringify(next), {
        access: PRIVATE_ACCESS,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      logStore("blob_write_ok", {
        count: next.length,
        path: BLOB_INDEX_PATH,
        access: PRIVATE_ACCESS,
      });
    } catch (error) {
      console.error("[store] stage=blob_write_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
