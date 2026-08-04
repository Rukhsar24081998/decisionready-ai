/**
 * Shared display formatters for DecisionReady AI.
 * Explicit locale + options + UTC so SSR and client HTML always match.
 */

function toValidDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

const timeWithSecondsFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

/** Date + time, e.g. "Aug 4, 2026, 3:54 AM" (UTC) */
export function formatDateTime(value: Date | string): string {
  const date = toValidDate(value);
  if (!date) return typeof value === "string" ? value : "Unknown";
  return dateTimeFormatter.format(date);
}

/** Date only, e.g. "Aug 4, 2026" (UTC) */
export function formatDate(value: Date | string): string {
  const date = toValidDate(value);
  if (!date) return "Not Available";
  return dateFormatter.format(date);
}

/** Short time, e.g. "3:54 AM" (UTC) */
export function formatTime(value: Date | string | number): string {
  const date = toValidDate(value);
  if (!date) return "";
  return timeFormatter.format(date);
}

/** Clock with seconds, e.g. "03:54:00 AM" (UTC) */
export function formatClock(value: Date | string | number): string {
  const date = toValidDate(value);
  if (!date) return "";
  return timeWithSecondsFormatter.format(date);
}

/** Dashboard card "Updated" label — date only (UTC). */
export function formatUpdatedAt(iso: string): string {
  const date = toValidDate(iso);
  if (!date) return "Unknown";
  return dateFormatter.format(date);
}
