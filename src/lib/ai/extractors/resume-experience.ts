/**
 * Deterministic work-history experience calculations for the Resume Extractor.
 * Never asks the LLM for total years.
 */

export interface ExperienceDateRange {
  startDate: string;
  endDate: string;
  years?: number;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function isPresentToken(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return (
    !lower ||
    lower === "present" ||
    lower === "current" ||
    lower === "now" ||
    lower === "ongoing" ||
    lower === "today"
  );
}

/** Parse common resume date strings into a Date at month precision. */
export function parseResumeDate(raw: string, fallbackToNow = false): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return fallbackToNow ? new Date() : null;
  if (isPresentToken(trimmed)) return new Date();

  // ISO / YYYY-MM / YYYY-MM-DD
  const iso = trimmed.match(/^(\d{4})(?:[/-](\d{1,2}))?(?:[/-](\d{1,2}))?$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = iso[2] ? Math.max(0, Number(iso[2]) - 1) : 0;
    const day = iso[3] ? Number(iso[3]) : 1;
    if (year >= 1970 && year <= 2100) return new Date(year, month, day);
  }

  // Month YYYY / Mon YYYY
  const monthYear = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    const year = Number(monthYear[2]);
    if (month !== undefined && year >= 1970 && year <= 2100) {
      return new Date(year, month, 1);
    }
  }

  // YYYY only
  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    if (year >= 1970 && year <= 2100) return new Date(year, 0, 1);
  }

  const native = Date.parse(trimmed);
  if (!Number.isNaN(native)) return new Date(native);

  return fallbackToNow ? new Date() : null;
}

function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function yearsFromMonths(months: number): number {
  return Math.round((months / 12) * 10) / 10;
}

/** Compute years for a single role from dates; falls back to provided years. */
export function computeRoleYears(
  startDate: string,
  endDate: string,
  providedYears?: number
): number {
  const start = parseResumeDate(startDate, false);
  const end = parseResumeDate(endDate, true);

  if (start && end && end >= start) {
    return yearsFromMonths(monthsBetween(start, end));
  }

  if (typeof providedYears === "number" && Number.isFinite(providedYears) && providedYears > 0) {
    return Math.round(providedYears * 10) / 10;
  }

  return 0;
}

function formatDuration(years: number): string {
  if (years <= 0) return "";
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  if (wholeYears === 0) return `${months} mo`;
  if (months === 0) return `${wholeYears} yr${wholeYears === 1 ? "" : "s"}`;
  return `${wholeYears} yr${wholeYears === 1 ? "" : "s"} ${months} mo`;
}

export function enrichRoleDuration(input: {
  startDate: string;
  endDate: string;
  duration: string;
  years: number;
}): { years: number; duration: string } {
  const years = computeRoleYears(input.startDate, input.endDate, input.years);
  const duration =
    input.duration.trim() || formatDuration(years) || input.duration;
  return { years, duration };
}

/**
 * Total experience = union of employment intervals (no double-count on overlaps).
 * Falls back to sum of role years when dates cannot be parsed.
 */
export function computeTotalExperienceYears(
  roles: ExperienceDateRange[]
): number {
  const intervals: Array<{ start: number; end: number }> = [];

  for (const role of roles) {
    const start = parseResumeDate(role.startDate, false);
    const end = parseResumeDate(role.endDate, true);
    if (start && end && end >= start) {
      intervals.push({ start: start.getTime(), end: end.getTime() });
    }
  }

  if (intervals.length === 0) {
    const summed = roles.reduce((total, role) => {
      const years =
        typeof role.years === "number" && Number.isFinite(role.years)
          ? role.years
          : 0;
      return total + Math.max(0, years);
    }, 0);
    return Math.round(summed * 10) / 10;
  }

  intervals.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else {
      last.end = Math.max(last.end, interval.end);
    }
  }

  const totalMonths = merged.reduce((sum, interval) => {
    return sum + monthsBetween(new Date(interval.start), new Date(interval.end));
  }, 0);

  return yearsFromMonths(totalMonths);
}
