/**
 * Canonical candidate presentation model + structured resume parsing.
 * Presentation layer only — does not change extraction / APIs / scoring.
 */

import {
  computeTotalExperienceYears,
  parseResumeDate,
} from "@/lib/ai/extractors/resume-experience";

export interface CandidateCurrentRole {
  company: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
}

export interface CandidatePresentationProfile {
  name: string;
  experienceYears: number | null;
  experienceLabel: string | null;
  currentRole: CandidateCurrentRole;
  education: string | null;
  location: string | null;
  recruiter: string | null;
  hiringManager: string | null;
  hiringStage: string | null;
  noticePeriod: string | null;
  expectedSalary: string | null;
  currentSalary: string | null;
  projectsCount: number;
  skills: string[];
}

export interface BuildCandidateProfileInput {
  name?: string | null;
  roleApplied?: string | null;
  /** Raw experience string from AI candidate payload (may be years or free text). */
  experienceRaw?: string | number | null;
  location?: string | null;
  education?: string | string[] | null;
  recruiter?: string | null;
  hiringManager?: string | null;
  hiringStage?: string | null;
  noticePeriod?: string | null;
  expectedSalary?: string | null;
  currentSalary?: string | null;
  skills?: string[] | null;
  resumeText?: string | null;
}

const MISSING = null;

/** Date ranges use explicit separators — never treat bare "-" inside a dash character-class as title|company split. */
const DATE_RANGE_PAREN =
  /\(((?:\d{4}(?:[/-]\d{1,2})?)|(?:[A-Za-z]+\s+\d{4}))\s*(?:-|–|—|to)\s*((?:Present|Current|Now|Ongoing)|(?:\d{4}(?:[/-]\d{1,2})?)|(?:[A-Za-z]+\s+\d{4}))\)/i;

const DATE_RANGE_INLINE =
  /\b((?:\d{4}(?:[/-]\d{1,2})?)|(?:[A-Za-z]+\s+\d{4}))\s*(?:-|–|—|to)\s*((?:Present|Current|Now|Ongoing)|(?:\d{4}(?:[/-]\d{1,2})?)|(?:[A-Za-z]+\s+\d{4}))\b/i;

const TITLE_AT_COMPANY = /^(.+?)\s+at\s+(.+)$/i;
/** Pipe/bullet only — intentionally excludes hyphens so "NovaTech AI (2023 - Present)" is never split. */
const TITLE_PIPE_COMPANY = /^(.+?)\s*[|•·]\s*(.+)$/;

const TITLE_KEYWORDS =
  /\b(engineer|manager|director|lead|designer|analyst|scientist|architect|consultant|specialist|product|founder|intern|head|principal|vp|vice\s+president|chief|officer|developer|researcher)\b/i;

function cleanText(value: unknown): string | null {
  if (value === undefined || value === null) return MISSING;
  const raw = String(value).trim();
  if (!raw) return MISSING;
  const lower = raw.toLowerCase();
  if (
    raw === "—" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "unknown" ||
    lower === "not provided" ||
    lower === "not available" ||
    lower === "none" ||
    lower === "null" ||
    lower === "undefined"
  ) {
    return MISSING;
  }
  return raw;
}

function formatYearsLabel(years: number): string {
  if (!Number.isFinite(years) || years <= 0) return "";
  const whole = Math.max(1, Math.round(years));
  return `${whole} ${whole === 1 ? "Year" : "Years"} Experience`;
}

function extractDateRange(line: string): {
  startDate: string | null;
  endDate: string | null;
  remainder: string;
  matched: boolean;
} {
  const paren = line.match(DATE_RANGE_PAREN);
  if (paren) {
    return {
      startDate: paren[1]?.trim() || null,
      endDate: paren[2]?.trim() || null,
      remainder: line.replace(paren[0], "").replace(/\s{2,}/g, " ").trim(),
      matched: true,
    };
  }

  const inline = line.match(DATE_RANGE_INLINE);
  if (inline) {
    return {
      startDate: inline[1]?.trim() || null,
      endDate: inline[2]?.trim() || null,
      remainder: line.replace(inline[0], "").replace(/\s{2,}/g, " ").trim(),
      matched: true,
    };
  }

  return {
    startDate: null,
    endDate: null,
    remainder: line.trim(),
    matched: false,
  };
}

function hasStrongTitleKeyword(line: string): boolean {
  return TITLE_KEYWORDS.test(line);
}

function looksLikeTitle(line: string): boolean {
  if (!line || line.length > 90) return false;
  if (/^\d/.test(line)) return false;
  if (DATE_RANGE_PAREN.test(line) || DATE_RANGE_INLINE.test(line)) return false;
  if (hasStrongTitleKeyword(line)) return true;
  // Short Title Case phrases without org suffixes
  if (/\b(inc|llc|ltd|corp|company|technologies|labs|ai)\b/i.test(line)) {
    return false;
  }
  return /^[A-Z][\w/&+.,' -]{2,60}$/.test(line) && line.split(/\s+/).length <= 6;
}

function looksLikeCompany(line: string): boolean {
  if (!line || line.length > 80) return false;
  if (/^\d/.test(line)) return false;
  if (DATE_RANGE_PAREN.test(line) || DATE_RANGE_INLINE.test(line)) return false;
  if (hasStrongTitleKeyword(line) && !/\b(inc|llc|ltd|corp|technologies|labs|ai|systems)\b/i.test(line)) {
    return false;
  }
  return true;
}

/**
 * Parse a single experience block's first lines into structured role fields.
 * Date ranges are extracted from any of the first lines so formats like
 * company / title / "2023 – Present" on separate lines still capture tenure.
 */
export function parseCurrentRoleFromExperienceLines(
  lines: string[]
): CandidateCurrentRole {
  const role: CandidateCurrentRole = {
    company: null,
    title: null,
    startDate: null,
    endDate: null,
    location: null,
  };

  const usable = lines.map((l) => l.trim()).filter(Boolean).slice(0, 6);
  if (usable.length === 0) return role;

  // Tenure may sit on its own line — scan before company/title assignment
  for (const line of usable) {
    const dated = extractDateRange(line);
    if (dated.matched && !role.startDate) {
      role.startDate = dated.startDate;
      role.endDate = dated.endDate;
    }
  }

  const contentLines = usable
    .map((line) => extractDateRange(line).remainder.trim())
    .filter(Boolean);

  if (contentLines.length === 0) return role;

  const primary = contentLines[0];
  const secondary = contentLines[1] ?? "";
  // Whether the original first line carried an inline/paren date (company+tenure)
  const firstLineHadDate = extractDateRange(usable[0]).matched;

  const atMatch = primary.match(TITLE_AT_COMPANY);
  if (atMatch) {
    role.title = cleanText(atMatch[1]);
    role.company = cleanText(atMatch[2]);
  } else {
    const pipeMatch = primary.match(TITLE_PIPE_COMPANY);
    if (pipeMatch) {
      const left = pipeMatch[1].trim();
      const right = pipeMatch[2].trim();
      if (looksLikeTitle(left) && looksLikeCompany(right)) {
        role.title = cleanText(left);
        role.company = cleanText(right);
      } else if (looksLikeTitle(right) && looksLikeCompany(left)) {
        role.company = cleanText(left);
        role.title = cleanText(right);
      } else {
        role.title = cleanText(left);
        role.company = cleanText(right);
      }
    } else if (primary) {
      if (firstLineHadDate && !hasStrongTitleKeyword(primary)) {
        role.company = cleanText(primary);
        if (secondary && looksLikeTitle(secondary)) {
          role.title = cleanText(secondary);
        }
      } else if (
        looksLikeTitle(primary) &&
        secondary &&
        looksLikeCompany(secondary)
      ) {
        role.title = cleanText(primary);
        role.company = cleanText(secondary);
      } else if (
        looksLikeCompany(primary) &&
        secondary &&
        looksLikeTitle(secondary)
      ) {
        role.company = cleanText(primary);
        role.title = cleanText(secondary);
      } else if (hasStrongTitleKeyword(primary)) {
        role.title = cleanText(primary);
        role.company = cleanText(secondary) || null;
      } else {
        role.company = cleanText(primary);
        if (secondary && looksLikeTitle(secondary)) {
          role.title = cleanText(secondary);
        }
      }
    }
  }

  for (const line of usable.slice(0, 4)) {
    const loc = extractCityCountry(line, null);
    if (loc && line.trim().length <= 60) {
      role.location = loc;
      break;
    }
  }

  return role;
}

function extractCityCountry(
  line: string,
  candidateName: string | null
): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return null;

  // Require City, Region/State pattern — short segments
  const match = trimmed.match(
    /\b([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){0,2}),\s*([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){0,2})\b/
  );
  if (!match) return null;

  const city = match[1].trim();
  const region = match[2].trim();
  const location = `${city}, ${region}`;

  // Reject if it swallowed the candidate name
  if (candidateName) {
    const nameLower = candidateName.toLowerCase();
    if (location.toLowerCase().includes(nameLower)) return null;
    const nameParts = candidateName.split(/\s+/).filter((p) => p.length > 2);
    const hitCount = nameParts.filter((p) =>
      location.toLowerCase().includes(p.toLowerCase())
    ).length;
    if (hitCount >= 2) return null;
  }

  // Reject common non-location false positives
  if (/\b(university|college|institute|school|ltd|inc|llc)\b/i.test(location)) {
    return null;
  }

  return location;
}

function parseLocationFromHeader(
  resumeText: string,
  candidateName: string | null
): string | null {
  const header = resumeText.split(/\n/).slice(0, 12);
  for (const line of header) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) continue;

    // Reject lines that embed the candidate name (prevents "Name … City, Country")
    if (candidateName) {
      const nameLower = candidateName.toLowerCase();
      if (trimmed.toLowerCase().includes(nameLower)) {
        // Allow exact "City, Country" only when name is not on this line
        continue;
      }
      const nameParts = candidateName.split(/\s+/).filter((p) => p.length > 2);
      const hits = nameParts.filter((p) =>
        trimmed.toLowerCase().includes(p.toLowerCase())
      ).length;
      if (hits >= 2) continue;
    }

    const segments = trimmed.split(/[|•·]/).map((p) => p.trim());
    for (const segment of segments) {
      if (segment.length > 48) continue;
      const loc = extractCityCountry(segment, candidateName);
      if (loc && segment.length <= 48) return loc;
    }

    if (trimmed.length <= 48) {
      const direct = extractCityCountry(trimmed, candidateName);
      if (direct) return direct;
    }
  }
  return null;
}

function parseEducation(resumeText: string): string | null {
  const educationMatch = resumeText.match(
    /Education\s*\n+([\s\S]*?)(?:\n\s*\n|\nSkills|\nExperience|\nProjects|$)/i
  );
  if (!educationMatch) return null;
  const line = educationMatch[1]
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)[0];
  if (!line) return null;
  return cleanText(line.replace(/\s*--.*$/, "").trim());
}

function parseProjectsCount(resumeText: string): number {
  const projectsSection = resumeText.match(
    /Projects\s*\n+([\s\S]*?)(?:\nEducation|\nSkills|\nExperience|\nAchievements|$)/i
  );
  if (!projectsSection) return 0;
  return projectsSection[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^[•\-*]?\s*$/.test(l)).length;
}

function parseExperienceYearsExplicit(resumeText: string): number | null {
  const match = resumeText.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*Years?\s+(?:of\s+)?Experience/i
  );
  if (!match) return null;
  const years = Number.parseFloat(match[1]);
  return Number.isFinite(years) && years > 0 ? years : null;
}

function parseAllRolesForTenure(resumeText: string): Array<{
  startDate: string;
  endDate: string;
}> {
  const experienceSection = resumeText.match(
    /Experience\s*\n+([\s\S]*?)(?:\nProjects|\nSkills|\nEducation|$)/i
  );
  if (!experienceSection) return [];

  const roles: Array<{ startDate: string; endDate: string }> = [];
  for (const line of experienceSection[1].split("\n")) {
    const { startDate, endDate } = extractDateRange(line);
    if (startDate) {
      roles.push({
        startDate,
        endDate: endDate || "Present",
      });
    }
  }
  return roles;
}

function parseCurrentRole(resumeText: string): CandidateCurrentRole {
  const experienceSection = resumeText.match(
    /Experience\s*\n+([\s\S]*?)(?:\nProjects|\nSkills|\nEducation|$)/i
  );
  if (!experienceSection) {
    return {
      company: null,
      title: null,
      startDate: null,
      endDate: null,
      location: null,
    };
  }

  const lines = experienceSection[1]
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Take first role block (until blank gap — already filtered, so first 3-4 lines)
  return parseCurrentRoleFromExperienceLines(lines.slice(0, 4));
}

function yearsFromExperienceRaw(
  experienceRaw: string | number | null | undefined
): number | null {
  if (experienceRaw === undefined || experienceRaw === null) return null;
  if (typeof experienceRaw === "number") {
    return Number.isFinite(experienceRaw) && experienceRaw > 0
      ? experienceRaw
      : null;
  }
  const cleaned = cleanText(experienceRaw);
  if (!cleaned) return null;
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const years = Number.parseFloat(match[1]);
  return Number.isFinite(years) && years > 0 ? years : null;
}

/**
 * Build one canonical candidate presentation profile for Dashboard + Brief.
 */
export function buildCandidatePresentationProfile(
  input: BuildCandidateProfileInput
): CandidatePresentationProfile {
  const resumeText = input.resumeText?.trim() ?? "";
  const name = cleanText(input.name) ?? "Candidate";

  const currentRole = resumeText
    ? parseCurrentRole(resumeText)
    : {
        company: null,
        title: null,
        startDate: null,
        endDate: null,
        location: null,
      };

  const locationFromInput = cleanText(input.location);
  const locationFromResume = resumeText
    ? parseLocationFromHeader(resumeText, name)
    : null;
  // Prefer clean resume/header location when input looks polluted (name echoed into location)
  const locationInputLooksPolluted =
    Boolean(locationFromInput) &&
    (locationFromInput!.toLowerCase().includes(name.toLowerCase()) ||
      locationFromInput!.split(/\s+/).length > 6);
  const location =
    (!locationInputLooksPolluted ? locationFromInput : null) ||
    locationFromResume ||
    currentRole.location ||
    null;

  let education = cleanText(
    Array.isArray(input.education)
      ? input.education.filter(Boolean).join("; ")
      : input.education
  );
  if (!education && resumeText) {
    education = parseEducation(resumeText);
  }

  const explicitYears = resumeText
    ? parseExperienceYearsExplicit(resumeText)
    : null;
  const rawYears = yearsFromExperienceRaw(input.experienceRaw);
  const tenureYears =
    resumeText && parseAllRolesForTenure(resumeText).length > 0
      ? computeTotalExperienceYears(parseAllRolesForTenure(resumeText))
      : null;

  const experienceYears =
    explicitYears ??
    (tenureYears && tenureYears > 0 ? tenureYears : null) ??
    rawYears;

  const experienceLabel = experienceYears
    ? formatYearsLabel(experienceYears)
    : null;

  // Validate parsed dates actually parse
  if (currentRole.startDate && !parseResumeDate(currentRole.startDate, false)) {
    // keep raw string for display context; computeTenure already handled
  }

  return {
    name,
    experienceYears,
    experienceLabel,
    currentRole,
    education,
    location,
    recruiter: cleanText(input.recruiter),
    hiringManager: cleanText(input.hiringManager),
    hiringStage: cleanText(input.hiringStage),
    noticePeriod: cleanText(input.noticePeriod),
    expectedSalary: cleanText(input.expectedSalary),
    currentSalary: cleanText(input.currentSalary),
    projectsCount: resumeText ? parseProjectsCount(resumeText) : 0,
    skills: Array.isArray(input.skills)
      ? input.skills.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
}

/** Display helper — never returns concatenated "Not Available …" phrases. */
export function displayField(value: string | null | undefined): string {
  const cleaned = cleanText(value);
  return cleaned ?? "Not Available";
}

export function displayExperience(
  profile: Pick<CandidatePresentationProfile, "experienceLabel" | "experienceYears">
): string {
  if (profile.experienceLabel) return profile.experienceLabel;
  if (profile.experienceYears && profile.experienceYears > 0) {
    return formatYearsLabel(profile.experienceYears);
  }
  return "Experience not available";
}

/** Unique list keys for document names that may share a human label. */
export function uniqueDocumentKeys(
  documents: string[]
): Array<{ id: string; label: string; original: string }> {
  const seenOriginal = new Set<string>();
  const uniqueOriginals: string[] = [];

  for (const raw of documents) {
    const original = String(raw ?? "").trim();
    if (!original) continue;
    const key = original.toLowerCase();
    if (seenOriginal.has(key)) continue;
    seenOriginal.add(key);
    uniqueOriginals.push(original);
  }

  return uniqueOriginals.map((original, index) => ({
    id: `doc-${index}-${original}`,
    label: original,
    original,
  }));
}

/**
 * Years field for labeled form rows — never returns "Experience not available"
 * (that phrase is reserved for free-text header contexts).
 */
export function displayExperienceYearsField(
  profile: Pick<CandidatePresentationProfile, "experienceLabel" | "experienceYears">
): string {
  if (profile.experienceLabel) return profile.experienceLabel;
  if (profile.experienceYears && profile.experienceYears > 0) {
    return formatYearsLabel(profile.experienceYears);
  }
  return "Not Available";
}

/** Shared resume text resolution for Dashboard + Brief presentation mappers. */
export function getResumeTextFromAnalysis(analysis: {
  evidence?: { resume?: string | null } | null;
  ingestedDocuments?: Array<{
    documentType?: string | null;
    extractedText?: string | null;
  }> | null;
}): string {
  const fromEvidence = analysis.evidence?.resume?.trim();
  if (fromEvidence) return fromEvidence;

  const resumeDoc = analysis.ingestedDocuments?.find(
    (doc) => doc.documentType === "Resume"
  );
  return resumeDoc?.extractedText?.trim() ?? "";
}
