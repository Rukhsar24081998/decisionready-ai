/**
 * Deterministic score helpers — all display percentages use these.
 */

/** Clamp a numeric value into [min, max]. */
export function clampPercentage(
  value: number,
  min = 0,
  max = 100
): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Round to nearest integer (safe for NaN / Infinity). */
export function safeRound(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/**
 * Normalize any confidence / score into a 0–100 scale.
 * Fractions in (0, 1] become percentages (0.78 → 78).
 * Values already on 0–100 are clamped.
 */
export function normalizeConfidence(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return clampPercentage(fallback);
  }

  // Treat unit-interval fractions as percentages (never leave 0.9 as "0.9%").
  if (value > 0 && value <= 1) {
    return clampPercentage(safeRound(value * 100));
  }

  return clampPercentage(safeRound(value));
}

/**
 * Format a score for UI display (e.g. "78%").
 * Always normalizes first so fractions never render as "0.78%".
 */
export function formatPercentage(
  value: unknown,
  options?: { fallback?: number; digits?: number }
): string {
  const normalized = normalizeConfidence(value, options?.fallback ?? 0);
  const digits = options?.digits ?? 0;
  if (digits > 0) {
    return `${normalized.toFixed(digits)}%`;
  }
  return `${normalized}%`;
}

/** Map a 0–100 score to High / Medium / Low. */
export function scoreToConfidenceLabel(
  score: number
): "High" | "Medium" | "Low" {
  const n = normalizeConfidence(score);
  if (n >= 75) return "High";
  if (n >= 50) return "Medium";
  return "Low";
}

/** Map High / Medium / Low to a midpoint score on 0–100. */
export function confidenceLabelToScore(
  label: "High" | "Medium" | "Low" | string
): number {
  if (label === "High") return 85;
  if (label === "Medium") return 65;
  return 40;
}

/** Weighted average of scores; weights must be positive. */
export function weightedAverage(
  parts: Array<{ score: number; weight: number }>
): number {
  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) return 0;
  const raw = parts.reduce(
    (sum, p) => sum + normalizeConfidence(p.score) * p.weight,
    0
  );
  return clampPercentage(safeRound(raw / totalWeight));
}
