import { extractWithAI } from "@/lib/ai/extractors/base-extractor";
import {
  canonicalCompetencyPromptList,
  normalizeCompetencyName,
  normalizeStringList,
} from "@/lib/ai/extractors/competency-normalize";
import {
  computeTotalExperienceYears,
  enrichRoleDuration,
} from "@/lib/ai/extractors/resume-experience";
import { inferRecruiterSkillsFromEvidence } from "@/lib/ai/extractors/resume-skill-inference";
import {
  resumeExtractionSchema,
  type ResumeAchievement,
  type ResumeCompetency,
  type ResumeExtraction,
  type ResumeProjectEvidence,
  type ResumeWorkExperience,
} from "@/lib/ai/schemas/extraction-schema";

export interface ExtractResumeInput {
  filename?: string;
  extractedText: string;
  /** @deprecated Prefer extractedText */
  text?: string;
}

/** Empty ResumeExtraction fallback — never crash the pipeline. */
export function createEmptyResumeExtraction(): ResumeExtraction {
  return {
    candidate: {
      name: "",
      title: "",
      experienceYears: 0,
      education: [],
    },
    workExperience: [],
    skills: [],
    projects: [],
    competencies: [],
    achievements: [],
  };
}

function buildResumeSystemPrompt(): string {
  return `
You are an expert technical recruiter and resume parser.

Extract rich, structured hiring evidence ONLY from the supplied resume.

Rules:
- Never invent facts.
- Never invent employers, dates, metrics, or quotes not present in the resume.
- Never calculate total years of experience (the backend computes that).
- Set candidate.experienceYears to 0 always.
- Never calculate scores.
- Never compare with a Job Description.
- Never recommend hiring.
- Never evaluate readiness.
- Return ONLY valid JSON (a single object). No markdown.

JSON shape:
{
  "candidate": {
    "name": string,
    "title": string,
    "experienceYears": 0,
    "location": string (optional),
    "education": string[]
  },
  "workExperience": [{
    "company": string,
    "title": string,
    "startDate": string,
    "endDate": string,
    "duration": string,
    "years": number,
    "responsibilities": string[],
    "measurableImpact": string[]
  }],
  "skills": string[],
  "projects": [{
    "name": string,
    "description": string,
    "technologies": string[],
    "measurableOutcomes": string[],
    "competenciesDemonstrated": string[],
    "evidenceQuote": string,
    "pageNumber": number (optional)
  }],
  "competencies": [{
    "name": string,
    "reason": string,
    "evidence": [{ "quote": string, "pageNumber": number|null }]
  }],
  "achievements": [{
    "title": string,
    "evidenceQuote": string,
    "metric": string,
    "value": string,
    "impactCategory": string
  }]
}

Work experience rules:
- Extract EVERY role with company, title, startDate, endDate when present.
- Use "Present" for current roles when the resume says so.
- responsibilities: concrete bullets from that role.
- measurableImpact: quantified outcomes tied to that role.
- years may be approximate for the role only; total experience is computed later.

Project rules:
- Extract all substantive projects (named initiatives, products, case studies).
- Include technologies, measurable outcomes, competencies demonstrated, and a supporting evidence quote.

Achievement rules:
- Extract quantified achievements separately from generic bullets.
- metric: what was measured (e.g. "conversion rate", "NPS", "revenue").
- value: the number/percentage exactly as written (e.g. "40%", "2.5x", "12").
- impactCategory: one of Growth, Efficiency, Quality, Revenue, Engagement, Cost, Other.
- title + evidenceQuote required for every achievement.

Skill rules:
- Include explicit skills AND recruiter-visible skills evidenced by resume language.
- Examples of inference (only when evidence exists):
  - Customer interviews → User Research
  - Worked with Engineering → Stakeholder Management
  - Roadmaps → Prioritization
  - Experiments / A/B tests → Analytics
  - LLM applications → AI Product Thinking

Competency rules:
- Only include competencies supported by resume quotes.
- Prefer canonical labels when applicable:
${canonicalCompetencyPromptList()}
- Every competency MUST include multiple evidence quotes whenever multiple quotes exist.
- pageNumber must be null when unknown.

If a field is not present in the resume, use empty string, 0, or [].
`.trim();
}

function buildResumeUserPrompt(input: {
  filename: string;
  extractedText: string;
}): string {
  return `
Parse this resume into recruiter-grade structured JSON only.

filename: ${input.filename}

resumeText:
"""
${input.extractedText.slice(0, 28000)}
"""
`.trim();
}

function trimText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function dedupeEvidence(
  evidence: ResumeCompetency["evidence"]
): ResumeCompetency["evidence"] {
  const seen = new Set<string>();
  const result: ResumeCompetency["evidence"] = [];

  for (const item of evidence) {
    const quote = trimText(item.quote);
    if (!quote) continue;
    const key = quote.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      quote,
      ...(typeof item.pageNumber === "number"
        ? { pageNumber: item.pageNumber }
        : item.pageNumber === null
          ? { pageNumber: null }
          : {}),
    });
  }

  return result;
}

function mergeCompetencies(
  competencies: ResumeCompetency[]
): ResumeCompetency[] {
  const byName = new Map<string, ResumeCompetency>();

  for (const competency of competencies) {
    const name = normalizeCompetencyName(competency.name);
    if (!name) continue;

    const evidence = dedupeEvidence(competency.evidence);
    if (evidence.length === 0) continue;

    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        name,
        reason: trimText(competency.reason) || `Evidence supports ${name}.`,
        evidence,
      });
      continue;
    }

    existing.evidence = dedupeEvidence([
      ...existing.evidence,
      ...evidence,
    ]);
    if (
      trimText(competency.reason).length > existing.reason.length
    ) {
      existing.reason = trimText(competency.reason);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function collectEvidenceSnippets(data: ResumeExtraction): string[] {
  const snippets: string[] = [];

  for (const role of data.workExperience) {
    snippets.push(...role.responsibilities, ...role.measurableImpact);
  }
  for (const project of data.projects) {
    snippets.push(
      project.description,
      project.evidenceQuote,
      ...project.measurableOutcomes
    );
  }
  for (const achievement of data.achievements) {
    snippets.push(achievement.title, achievement.evidenceQuote);
  }
  for (const competency of data.competencies) {
    snippets.push(competency.reason);
    for (const evidence of competency.evidence) {
      snippets.push(evidence.quote);
    }
  }

  return snippets.filter((s) => trimText(s).length > 0);
}

function normalizeWorkExperience(
  roles: ResumeWorkExperience[]
): ResumeWorkExperience[] {
  return roles
    .map((role) => {
      const { years, duration } = enrichRoleDuration({
        startDate: role.startDate,
        endDate: role.endDate,
        duration: role.duration,
        years: role.years,
      });

      return {
        company: trimText(role.company),
        title: trimText(role.title),
        startDate: trimText(role.startDate),
        endDate: trimText(role.endDate),
        duration,
        years,
        responsibilities: normalizeStringList(role.responsibilities),
        measurableImpact: normalizeStringList(role.measurableImpact),
      };
    })
    .filter((role) => role.company || role.title);
}

function normalizeProjects(
  projects: ResumeProjectEvidence[]
): ResumeProjectEvidence[] {
  return projects
    .map((project) => ({
      name: trimText(project.name),
      description: trimText(project.description),
      technologies: normalizeStringList(project.technologies),
      measurableOutcomes: normalizeStringList(project.measurableOutcomes ?? []),
      competenciesDemonstrated: normalizeStringList(
        (project.competenciesDemonstrated ?? []).map((name) =>
          normalizeCompetencyName(name)
        )
      ),
      evidenceQuote: trimText(project.evidenceQuote),
      ...(typeof project.pageNumber === "number"
        ? { pageNumber: project.pageNumber }
        : {}),
    }))
    .filter((project) => project.name || project.description);
}

function normalizeAchievements(
  achievements: ResumeAchievement[]
): ResumeAchievement[] {
  return achievements
    .map((achievement) => ({
      title: trimText(achievement.title),
      evidenceQuote: trimText(achievement.evidenceQuote),
      metric: trimText(achievement.metric ?? ""),
      value: trimText(String(achievement.value ?? "")),
      impactCategory: trimText(achievement.impactCategory ?? ""),
    }))
    .filter(
      (achievement) =>
        achievement.title ||
        achievement.evidenceQuote ||
        achievement.metric ||
        achievement.value
    );
}

function enrichCompetenciesFromProjectsAndInference(
  competencies: ResumeCompetency[],
  projects: ResumeProjectEvidence[],
  inferred: ReturnType<typeof inferRecruiterSkillsFromEvidence>
): ResumeCompetency[] {
  const merged = [...competencies];

  for (const project of projects) {
    for (const name of project.competenciesDemonstrated) {
      const quote =
        project.evidenceQuote ||
        project.measurableOutcomes[0] ||
        project.description;
      if (!quote) continue;
      merged.push({
        name,
        reason: `Demonstrated via project "${project.name || "Untitled"}".`,
        evidence: [{ quote }],
      });
    }
  }

  for (const hit of inferred) {
    merged.push({
      name: hit.skill,
      reason: `Inferred from resume evidence indicating ${hit.skill}.`,
      evidence: [{ quote: hit.quote }],
    });
  }

  return mergeCompetencies(merged);
}

/** Domain cleanup after Zod — densify evidence, compute experience, infer skills. */
function postProcessResumeExtraction(data: ResumeExtraction): ResumeExtraction {
  const workExperience = normalizeWorkExperience(data.workExperience ?? []);
  const projects = normalizeProjects(data.projects ?? []);
  const achievements = normalizeAchievements(data.achievements ?? []);

  const baseCompetencies = mergeCompetencies(data.competencies ?? []);

  const evidenceSnippets = collectEvidenceSnippets({
    ...data,
    workExperience,
    projects,
    achievements,
    competencies: baseCompetencies,
  });
  const inferred = inferRecruiterSkillsFromEvidence(evidenceSnippets);

  const competencies = enrichCompetenciesFromProjectsAndInference(
    baseCompetencies,
    projects,
    inferred
  );

  const skills = normalizeStringList([
    ...(data.skills ?? []),
    ...inferred.map((hit) => hit.skill),
    ...competencies.map((c) => c.name),
  ]);

  const experienceYears = computeTotalExperienceYears(workExperience);

  return {
    candidate: {
      name: trimText(data.candidate.name),
      title: trimText(data.candidate.title),
      experienceYears,
      ...(data.candidate.location
        ? { location: trimText(data.candidate.location) }
        : {}),
      education: normalizeStringList(data.candidate.education ?? []),
    },
    workExperience,
    skills,
    projects,
    competencies,
    achievements,
  };
}

/**
 * Extract recruiter-grade structured facts from a resume via the Base AI Extractor.
 * Never throws — returns empty on failure. Retry lives in extractWithAI().
 */
export async function extractResume(
  input: ExtractResumeInput
): Promise<ResumeExtraction> {
  const extractedText = (input.extractedText || input.text || "").trim();
  const filename = input.filename?.trim() || "resume";

  const result = await extractWithAI({
    documentText: extractedText,
    filename,
    systemPrompt: buildResumeSystemPrompt(),
    userPrompt: buildResumeUserPrompt({ filename, extractedText }),
    zodSchema: resumeExtractionSchema,
    emptyResultFactory: createEmptyResumeExtraction,
    extractorName: "resume-extractor",
    postProcess: postProcessResumeExtraction,
  });

  console.log(
    `Resume competencies extracted: ${result.competencies.length}`
  );
  console.log(`Resume projects extracted: ${result.projects.length}`);
  console.log(`Resume skills extracted: ${result.skills.length}`);
  console.log(
    `Resume work experience roles: ${result.workExperience.length}`
  );
  console.log(
    `Resume total experience years (computed): ${result.candidate.experienceYears}`
  );
  console.log(`Resume achievements extracted: ${result.achievements.length}`);

  return result;
}
