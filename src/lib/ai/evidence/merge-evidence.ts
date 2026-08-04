import {
  normalizeCompetencyList,
  normalizeCompetencyName,
  normalizeStringList,
} from "@/lib/ai/extractors/competency-normalize";
import { inferSkillsFromText } from "@/lib/ai/extractors/resume-skill-inference";
import {
  createEmptyEvidenceGraph,
  type CandidateEvidenceGraph,
  type CompetencyEvidence,
  type EvidenceConfidence,
  type EvidenceDocumentType,
  type EvidenceSource,
} from "@/lib/ai/evidence/evidence-graph";
import type {
  HiringManagerExtraction,
  InterviewExtraction,
  JobDescriptionExtraction,
  ResumeAchievement,
  ResumeExtraction,
  ResumeProjectEvidence,
  ResumeWorkExperience,
  ScorecardExtraction,
} from "@/lib/ai/schemas/extraction-schema";

export interface MergeEvidenceDocumentNames {
  resume?: string;
  jobDescription?: string;
  interview?: string;
  scorecard?: string;
  hiringManagerNotes?: string;
}

export interface MergeEvidenceInput {
  resume?: ResumeExtraction;
  jobDescription?: JobDescriptionExtraction;
  interview?: InterviewExtraction;
  scorecard?: ScorecardExtraction;
  hiringManagerNotes?: HiringManagerExtraction;
  /** Optional source filenames for citations. */
  documentNames?: MergeEvidenceDocumentNames;
}

type CompetencyBucket = {
  name: string;
  sources: EvidenceSource[];
};

function documentName(
  names: MergeEvidenceDocumentNames | undefined,
  key: keyof MergeEvidenceDocumentNames,
  fallback: string
): string {
  return names?.[key]?.trim() || fallback;
}

function trimQuote(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Richer source wins on collision — never replace richer metadata with poorer. */
function sourceRichness(source: EvidenceSource): number {
  let score = 0;
  if (typeof source.pageNumber === "number") score += 4;
  if (source.documentName.toLowerCase().includes("project")) score += 2;
  if (source.documentName.includes("·")) score += 1;
  if (source.quote.length > 80) score += 1;
  return score;
}

/**
 * Append evidence. Deduplicate identical quotes only within the same
 * documentType + documentName. Always append otherwise — never overwrite.
 */
function appendSource(
  bucket: CompetencyBucket,
  source: EvidenceSource
): void {
  const quote = trimQuote(source.quote);
  if (!quote) return;

  const next: EvidenceSource = {
    documentType: source.documentType,
    documentName: source.documentName,
    quote,
    ...(typeof source.pageNumber === "number"
      ? { pageNumber: source.pageNumber }
      : {}),
  };

  const existingIndex = bucket.sources.findIndex(
    (existing) =>
      existing.quote.toLowerCase() === quote.toLowerCase() &&
      existing.documentType === next.documentType &&
      existing.documentName.toLowerCase() === next.documentName.toLowerCase()
  );

  if (existingIndex === -1) {
    bucket.sources.push(next);
    return;
  }

  const existing = bucket.sources[existingIndex];
  if (sourceRichness(next) > sourceRichness(existing)) {
    bucket.sources[existingIndex] = {
      ...existing,
      ...next,
      // Keep original quote casing if lengths match; otherwise prefer longer.
      quote:
        next.quote.length >= existing.quote.length ? next.quote : existing.quote,
      pageNumber:
        typeof next.pageNumber === "number"
          ? next.pageNumber
          : existing.pageNumber,
    };
  }
}

function getOrCreateBucket(
  map: Map<string, CompetencyBucket>,
  rawName: string
): CompetencyBucket | null {
  const name = normalizeCompetencyName(rawName);
  if (!name) return null;
  const key = name.toLowerCase();
  let bucket = map.get(key);
  if (!bucket) {
    bucket = { name, sources: [] };
    map.set(key, bucket);
  }
  return bucket;
}

function computeConfidence(sources: EvidenceSource[]): EvidenceConfidence {
  const documentTypes = new Set(
    sources.map((source) => source.documentType)
  );
  if (documentTypes.size >= 3) return "high";
  if (documentTypes.size === 2) return "medium";
  return "low";
}

function signalText(topic: string, quote: string): string {
  const trimmedQuote = trimQuote(quote);
  const trimmedTopic = trimQuote(topic);
  if (trimmedQuote) return trimmedQuote;
  return trimmedTopic;
}

function pageNumberOrUndefined(
  value: number | null | undefined
): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** Attach a quote to every competency inferred from the text blob. */
function appendInferredCompetencyEvidence(
  map: Map<string, CompetencyBucket>,
  text: string,
  meta: {
    documentType: EvidenceDocumentType;
    documentName: string;
    pageNumber?: number;
    fallbackCompetency?: string;
  }
): void {
  const quote = trimQuote(text);
  if (!quote) return;

  const hits = inferSkillsFromText(quote);
  const names =
    hits.length > 0
      ? hits.map((hit) => hit.skill)
      : meta.fallbackCompetency
        ? [meta.fallbackCompetency]
        : [];

  for (const name of names) {
    const bucket = getOrCreateBucket(map, name);
    if (!bucket) continue;
    appendSource(bucket, {
      documentType: meta.documentType,
      documentName: meta.documentName,
      quote: hits.find((h) => h.skill === name)?.quote || quote,
      pageNumber: meta.pageNumber,
    });
  }
}

function appendNamedCompetencyEvidence(
  map: Map<string, CompetencyBucket>,
  competencyName: string,
  quote: string,
  meta: {
    documentType: EvidenceDocumentType;
    documentName: string;
    pageNumber?: number;
  }
): void {
  const bucket = getOrCreateBucket(map, competencyName);
  if (!bucket) return;
  appendSource(bucket, {
    documentType: meta.documentType,
    documentName: meta.documentName,
    quote,
    pageNumber: meta.pageNumber,
  });
}

function populateResumeCompetencies(
  map: Map<string, CompetencyBucket>,
  resume: ResumeExtraction,
  resumeDoc: string
): void {
  for (const competency of resume.competencies) {
    const bucket = getOrCreateBucket(map, competency.name);
    if (!bucket) continue;

    const evidenceItems =
      competency.evidence.length > 0
        ? competency.evidence
        : [{ quote: competency.reason || competency.name, pageNumber: null }];

    for (const evidence of evidenceItems) {
      appendSource(bucket, {
        documentType: "resume",
        documentName: resumeDoc,
        quote: evidence.quote || competency.reason || competency.name,
        pageNumber: pageNumberOrUndefined(evidence.pageNumber),
      });
    }
  }
}

function populateResumeWorkExperience(
  map: Map<string, CompetencyBucket>,
  roles: ResumeWorkExperience[],
  resumeDoc: string,
  strengths: string[]
): void {
  for (const role of roles) {
    const company = role.company.trim() || "Unknown company";
    const title = role.title.trim() || "Role";
    const roleDocName = `${resumeDoc} · ${title} @ ${company}`;

    for (const impact of role.measurableImpact) {
      const quote = trimQuote(impact);
      if (!quote) continue;
      strengths.push(quote);
      appendInferredCompetencyEvidence(map, quote, {
        documentType: "resume",
        documentName: roleDocName,
        fallbackCompetency: "Execution",
      });
    }

    for (const responsibility of role.responsibilities) {
      const quote = trimQuote(responsibility);
      if (!quote) continue;
      appendInferredCompetencyEvidence(map, quote, {
        documentType: "resume",
        documentName: roleDocName,
        fallbackCompetency: "Ownership",
      });
    }
  }
}

function populateResumeProjects(
  map: Map<string, CompetencyBucket>,
  projects: ResumeProjectEvidence[],
  resumeDoc: string,
  skills: string[],
  strengths: string[],
  projectNames: string[]
): void {
  for (const project of projects) {
    const projectLabel = project.name.trim() || "Untitled project";
    projectNames.push(projectLabel);
    const projectDocName = `${resumeDoc} Project · ${projectLabel}`;
    const pageNumber = pageNumberOrUndefined(project.pageNumber);

    skills.push(...project.technologies);

    for (const tech of project.technologies) {
      const quote = trimQuote(tech);
      if (!quote) continue;
      appendNamedCompetencyEvidence(map, "Technical Understanding", quote, {
        documentType: "resume",
        documentName: projectDocName,
        pageNumber,
      });
    }

    for (const outcome of project.measurableOutcomes) {
      const quote = trimQuote(outcome);
      if (!quote) continue;
      strengths.push(quote);
      appendInferredCompetencyEvidence(map, quote, {
        documentType: "resume",
        documentName: projectDocName,
        pageNumber,
        fallbackCompetency: "Execution",
      });
    }

    const supportingQuote = trimQuote(project.evidenceQuote);
    const description = trimQuote(project.description);

    for (const competencyName of project.competenciesDemonstrated) {
      const bucket = getOrCreateBucket(map, competencyName);
      if (!bucket) continue;

      if (supportingQuote) {
        appendSource(bucket, {
          documentType: "resume",
          documentName: projectDocName,
          quote: supportingQuote,
          pageNumber,
        });
      }
      if (description && description.toLowerCase() !== supportingQuote.toLowerCase()) {
        appendSource(bucket, {
          documentType: "resume",
          documentName: projectDocName,
          quote: description,
          pageNumber,
        });
      }
      for (const outcome of project.measurableOutcomes) {
        appendSource(bucket, {
          documentType: "resume",
          documentName: projectDocName,
          quote: outcome,
          pageNumber,
        });
      }
    }

    // If no explicit competencies, still harvest evidence from project text.
    if (project.competenciesDemonstrated.length === 0) {
      if (supportingQuote) {
        appendInferredCompetencyEvidence(map, supportingQuote, {
          documentType: "resume",
          documentName: projectDocName,
          pageNumber,
          fallbackCompetency: "Execution",
        });
      }
      if (description) {
        appendInferredCompetencyEvidence(map, description, {
          documentType: "resume",
          documentName: projectDocName,
          pageNumber,
        });
      }
    }
  }
}

function formatAchievementStrength(achievement: ResumeAchievement): string {
  const title = trimQuote(achievement.title);
  const quote = trimQuote(achievement.evidenceQuote);
  const metric = trimQuote(achievement.metric);
  const value = trimQuote(achievement.value);
  const category = trimQuote(achievement.impactCategory);

  const metricPart =
    metric && value ? `${metric}: ${value}` : metric || value || "";
  const categoryPart = category ? `[${category}]` : "";

  return normalizeStringList(
    [title, metricPart, categoryPart, quote].filter(Boolean)
  ).join(" — ");
}

function populateResumeAchievements(
  map: Map<string, CompetencyBucket>,
  achievements: ResumeAchievement[],
  resumeDoc: string,
  strengths: string[]
): void {
  for (const achievement of achievements) {
    const strength = formatAchievementStrength(achievement);
    if (strength) strengths.push(strength);

    const quotes = normalizeStringList(
      [
        achievement.evidenceQuote,
        achievement.title,
        achievement.metric && achievement.value
          ? `${achievement.metric} ${achievement.value}`
          : "",
      ].filter(Boolean)
    );

    const achievementDocName = `${resumeDoc} · Achievement${
      achievement.title.trim() ? ` · ${achievement.title.trim()}` : ""
    }`;

    for (const quote of quotes) {
      appendInferredCompetencyEvidence(map, quote, {
        documentType: "resume",
        documentName: achievementDocName,
        fallbackCompetency: "Execution",
      });
    }
  }
}

function populateInterviewEvidence(
  map: Map<string, CompetencyBucket>,
  interview: InterviewExtraction,
  interviewDoc: string
): void {
  for (const example of interview.behaviorExamples) {
    appendNamedCompetencyEvidence(map, example.competency, example.example, {
      documentType: "interview_notes",
      documentName: interviewDoc,
    });
  }

  for (const competencyName of interview.competenciesObserved) {
    const bucket = getOrCreateBucket(map, competencyName);
    if (!bucket) continue;

    const relatedQuotes = interview.quotes.filter((quote) =>
      quote.toLowerCase().includes(bucket.name.toLowerCase())
    );

    if (relatedQuotes.length > 0) {
      for (const quote of relatedQuotes) {
        appendSource(bucket, {
          documentType: "interview_notes",
          documentName: interviewDoc,
          quote,
        });
      }
    } else {
      const matchingExample = interview.behaviorExamples.find(
        (example) =>
          normalizeCompetencyName(example.competency).toLowerCase() ===
          bucket.name.toLowerCase()
      );
      appendSource(bucket, {
        documentType: "interview_notes",
        documentName: interviewDoc,
        quote: matchingExample?.example || `Observed: ${bucket.name}`,
      });
    }
  }

  // Positive / negative signals can also ground competencies.
  for (const signal of [
    ...interview.positiveSignals,
    ...interview.negativeSignals,
  ]) {
    const text = signalText(signal.topic, signal.quote);
    appendInferredCompetencyEvidence(map, text, {
      documentType: "interview_notes",
      documentName: interviewDoc,
    });
    // If the topic itself maps to a known competency signal, attach directly.
    if (signal.topic.trim()) {
      const topicHits = inferSkillsFromText(signal.topic);
      if (topicHits.length > 0) {
        appendNamedCompetencyEvidence(map, topicHits[0].skill, text, {
          documentType: "interview_notes",
          documentName: interviewDoc,
        });
      }
    }
  }

  // Remaining free-floating interview quotes — infer competencies.
  for (const quote of interview.quotes) {
    appendInferredCompetencyEvidence(map, quote, {
      documentType: "interview_notes",
      documentName: interviewDoc,
    });
  }
}

function populateScorecardEvidence(
  map: Map<string, CompetencyBucket>,
  scorecard: ScorecardExtraction,
  scorecardDoc: string
): void {
  for (const rating of scorecard.ratings) {
    const quote =
      trimQuote(rating.comments) ||
      `${normalizeCompetencyName(rating.competency) || rating.competency} rated ${rating.rating}`;
    appendNamedCompetencyEvidence(map, rating.competency, quote, {
      documentType: "scorecard",
      documentName: scorecardDoc,
    });
  }

  for (const strength of scorecard.strengths) {
    appendInferredCompetencyEvidence(map, strength, {
      documentType: "scorecard",
      documentName: scorecardDoc,
      fallbackCompetency: "Execution",
    });
  }

  for (const concern of scorecard.concerns) {
    appendInferredCompetencyEvidence(map, concern, {
      documentType: "scorecard",
      documentName: scorecardDoc,
    });
  }
}

function populateHiringManagerEvidence(
  map: Map<string, CompetencyBucket>,
  notes: HiringManagerExtraction,
  hmDoc: string
): void {
  const blobs = [
    ...notes.decisionFactors,
    ...notes.risks,
    ...notes.missingEvidence,
    ...notes.discussionPoints,
  ];

  for (const text of blobs) {
    appendInferredCompetencyEvidence(map, text, {
      documentType: "hiring_manager_notes",
      documentName: hmDoc,
    });
  }
}

/**
 * Merge document extractions into a CandidateEvidenceGraph.
 * Deterministic — appends all unique evidence; never invents scores.
 */
export function mergeEvidence(
  input: MergeEvidenceInput
): CandidateEvidenceGraph {
  const graph = createEmptyEvidenceGraph();
  const names = input.documentNames;
  const competencyMap = new Map<string, CompetencyBucket>();

  const resumeDoc = documentName(names, "resume", "Resume");
  const interviewDoc = documentName(names, "interview", "Interview Notes");
  const scorecardDoc = documentName(names, "scorecard", "Scorecard");
  const hmDoc = documentName(
    names,
    "hiringManagerNotes",
    "Hiring Manager Notes"
  );

  const strengths: string[] = [];
  const skills: string[] = [];
  const projectNames: string[] = [];

  // --- Resume (full structured utilization) ---
  if (input.resume) {
    graph.candidate.name = input.resume.candidate.name.trim();
    graph.candidate.role = input.resume.candidate.title.trim();

    skills.push(...input.resume.skills);

    populateResumeCompetencies(competencyMap, input.resume, resumeDoc);
    populateResumeWorkExperience(
      competencyMap,
      input.resume.workExperience ?? [],
      resumeDoc,
      strengths
    );
    populateResumeProjects(
      competencyMap,
      input.resume.projects ?? [],
      resumeDoc,
      skills,
      strengths,
      projectNames
    );
    populateResumeAchievements(
      competencyMap,
      input.resume.achievements ?? [],
      resumeDoc,
      strengths
    );
  }

  // --- Job Description (requirements only) ---
  if (input.jobDescription) {
    if (input.jobDescription.role.trim()) {
      graph.candidate.role = input.jobDescription.role.trim();
    }
    graph.requiredCompetencies = normalizeCompetencyList(
      input.jobDescription.requiredCompetencies
    );
  }

  // --- Interview ---
  if (input.interview) {
    graph.interviewerSignals = {
      positive: normalizeStringList(
        input.interview.positiveSignals.map((signal) =>
          signalText(signal.topic, signal.quote)
        )
      ),
      negative: normalizeStringList(
        input.interview.negativeSignals.map((signal) =>
          signalText(signal.topic, signal.quote)
        )
      ),
    };

    for (const signal of input.interview.positiveSignals) {
      strengths.push(signalText(signal.topic, signal.quote));
    }

    populateInterviewEvidence(competencyMap, input.interview, interviewDoc);
  }

  // --- Scorecard ---
  if (input.scorecard) {
    strengths.push(...input.scorecard.strengths);
    populateScorecardEvidence(competencyMap, input.scorecard, scorecardDoc);
  }

  // --- Hiring manager notes ---
  if (input.hiringManagerNotes) {
    strengths.push(...input.hiringManagerNotes.decisionFactors);
    populateHiringManagerEvidence(
      competencyMap,
      input.hiringManagerNotes,
      hmDoc
    );
  }

  // --- Concerns ---
  const concerns: string[] = [];
  if (input.interview) {
    for (const signal of input.interview.negativeSignals) {
      concerns.push(signalText(signal.topic, signal.quote));
    }
  }
  if (input.scorecard) {
    concerns.push(...input.scorecard.concerns);
  }
  if (input.hiringManagerNotes) {
    concerns.push(...input.hiringManagerNotes.risks);
  }

  graph.skills = normalizeStringList(skills);
  graph.projects = normalizeStringList(projectNames);
  graph.strengths = normalizeStringList(strengths);
  graph.concerns = normalizeStringList(concerns);

  // --- Merged competencies + confidence (formula unchanged) ---
  const competencies: CompetencyEvidence[] = Array.from(competencyMap.values())
    .filter((bucket) => bucket.sources.length > 0)
    .map((bucket) => ({
      name: bucket.name,
      sources: bucket.sources,
      confidence: computeConfidence(bucket.sources),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  graph.competencies = competencies;

  const observedKeys = new Set(
    competencies.map((item) => item.name.toLowerCase())
  );
  graph.missingCompetencies = graph.requiredCompetencies.filter(
    (required) => !observedKeys.has(required.toLowerCase())
  );

  const totalQuotes = competencies.reduce(
    (sum, item) => sum + item.sources.length,
    0
  );
  const multiSource = competencies.filter((item) => {
    const types = new Set(item.sources.map((s) => s.documentType));
    return types.size >= 2;
  }).length;

  console.log(`Merged competencies: ${graph.competencies.length}`);
  console.log(`Merged supporting quotes: ${totalQuotes}`);
  console.log(`Multi-document competencies: ${multiSource}`);
  console.log(`Merged strengths: ${graph.strengths.length}`);
  console.log(`Merged concerns: ${graph.concerns.length}`);
  console.log(`Missing competencies: ${graph.missingCompetencies.length}`);

  return graph;
}
