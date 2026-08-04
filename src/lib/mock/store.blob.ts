import "server-only";

import { list, put } from "@vercel/blob";
import type { DecisionAnalysis } from "@/lib/types";
import {
  BLOB_INDEX_PATH,
  BLOB_PREFIX,
  type AnalysisStoreBackend,
  logStore,
} from "@/lib/mock/store-shared";

/**
 * Vercel Blob backend for production persistence across serverless instances.
 * Must never be imported from client components.
 */
export const blobAnalysisStore: AnalysisStoreBackend = {
  async readAll(): Promise<DecisionAnalysis[] | null> {
    try {
      const listed = await list({ prefix: BLOB_PREFIX });
      const indexBlob = listed.blobs.find(
        (blob) => blob.pathname === BLOB_INDEX_PATH
      );
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
  },

  async writeAll(next: DecisionAnalysis[]): Promise<void> {
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
  },
};
