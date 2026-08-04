/**
 * Lightweight stage timer for the Decision Intelligence pipeline.
 * Server-only logging — does not affect product outputs.
 */

export type TimingEntry = {
  label: string;
  ms: number;
};

export class PipelineTimer {
  private readonly startedAt = performance.now();
  private readonly marks = new Map<string, number>();
  private readonly entries: TimingEntry[] = [];

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const began = this.marks.get(label);
    const ms =
      began === undefined
        ? 0
        : Math.max(0, Math.round(performance.now() - began));
    this.marks.delete(label);
    this.entries.push({ label, ms });
    return ms;
  }

  /** Time an async fn and record under `label` (safe under concurrency). */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const token = `${label}::${crypto.randomUUID()}`;
    this.marks.set(token, performance.now());
    try {
      return await fn();
    } finally {
      const began = this.marks.get(token);
      this.marks.delete(token);
      const ms =
        began === undefined
          ? 0
          : Math.max(0, Math.round(performance.now() - began));
      this.entries.push({ label, ms });
    }
  }

  /** Time a sync fn and record under `label`. */
  measureSync<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      return fn();
    } finally {
      this.end(label);
    }
  }

  totalMs(): number {
    return Math.max(0, Math.round(performance.now() - this.startedAt));
  }

  snapshot(): TimingEntry[] {
    return [...this.entries];
  }

  /** Pretty-print a recruiter-friendly timing report to the server console. */
  report(title = "Decision Intelligence pipeline"): void {
    const rows = this.snapshot();
    const total = this.totalMs();
    const pad = Math.max(
      24,
      ...rows.map((row) => row.label.length),
      "Total".length
    );

    const lines = [
      "",
      `[Timing] ${title}`,
      ...rows.map(
        (row) =>
          `${row.label.padEnd(pad, ".")} ${(row.ms / 1000).toFixed(1)}s`
      ),
      `${"Total".padEnd(pad, ".")} ${(total / 1000).toFixed(1)}s`,
      "",
    ];
    console.info(lines.join("\n"));
  }
}

export type PipelineProgressStage =
  | "upload"
  | "parse"
  | "extract_resume"
  | "extract_jd"
  | "extract_interview"
  | "extract_scorecard"
  | "extract_hm"
  | "extract"
  | "evidence_graph"
  | "decision_engine"
  | "narrative"
  | "dashboard"
  | "brief"
  | "persist";

export type PipelineProgressEvent =
  | {
      type: "stage";
      id: PipelineProgressStage;
      label: string;
      status: "start" | "done";
      ms?: number;
    }
  | {
      type: "error";
      error: string;
      code?: string;
      stage?: string;
      requestId?: string;
      details?: Record<string, unknown>;
    }
  | {
      type: "result";
      data: unknown;
      requestId: string;
      timings: TimingEntry[];
      totalMs: number;
    };

export const PIPELINE_PROGRESS_LABELS: Record<PipelineProgressStage, string> = {
  upload: "Receiving documents",
  parse: "Parsing documents",
  extract_resume: "Extracting resume",
  extract_jd: "Extracting job description",
  extract_interview: "Extracting interview notes",
  extract_scorecard: "Extracting interview scorecard",
  extract_hm: "Extracting hiring manager notes",
  extract: "Extracting evidence",
  evidence_graph: "Building evidence graph",
  decision_engine: "Computing Decision Readiness",
  narrative: "Generating executive summary",
  dashboard: "Preparing dashboard",
  brief: "Assembling Decision Brief",
  persist: "Saving analysis",
};
