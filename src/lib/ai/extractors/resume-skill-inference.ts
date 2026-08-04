/**
 * Deterministic recruiter-visible skill / competency inference from resume text.
 */

import type { CanonicalCompetency } from "@/lib/ai/extractors/competency-normalize";

export interface InferredSkillHit {
  skill: CanonicalCompetency;
  quote: string;
}

const SKILL_INFERENCE_RULES: Array<{
  skill: CanonicalCompetency;
  match: RegExp;
}> = [
  {
    skill: "User Research",
    match:
      /customer\s+interviews?|user\s+interviews?|usability\s+stud(?:y|ies)|user\s+research|discovery\s+interviews?/i,
  },
  {
    skill: "Stakeholder Management",
    match:
      /worked\s+with\s+engineering|partnered\s+with\s+(?:eng|engineering|design|sales|marketing)|stakeholder|executive\s+alignment|influenc(?:e|ing)\s+stakeholders/i,
  },
  {
    skill: "Prioritization",
    match:
      /roadmaps?|priorit(?:y|ies|ization)|backlog\s+grooming|stack\s*rank/i,
  },
  {
    skill: "Analytics",
    match:
      /experiments?|a\/b\s*tests?|ab\s*tests?|hypothesis|funnel\s+analys|data[-\s]?driven|metrics|analytics/i,
  },
  {
    skill: "AI Product Thinking",
    match:
      /\bllms?\b|gpt|generative\s+ai|ai\s+(?:product|feature|application)|prompt\s+engineering|machine\s+learning\s+product/i,
  },
  {
    skill: "Prompt Engineering",
    match: /prompt\s+(?:design|engineering|tuning|iteration)|system\s+prompt/i,
  },
  {
    skill: "Product Discovery",
    match:
      /product\s+discovery|problem\s+discovery|opportunity\s+assessment|jobs?\s+to\s+be\s+done|jtbd/i,
  },
  {
    skill: "Communication",
    match:
      /presented\s+to|executive\s+presentation|wrote\s+(?:specs?|briefs?)|storytell/i,
  },
  {
    skill: "Execution",
    match:
      /shipped|launched|delivered\s+to\s+production|go[-\s]?to[-\s]?market|rollout/i,
  },
  {
    skill: "Ownership",
    match:
      /owned\s+the|end[-\s]?to[-\s]?end\s+ownership|accountable\s+for|drove\s+the\s+initiative/i,
  },
  {
    skill: "Cross-functional Collaboration",
    match:
      /cross[-\s]?functional|worked\s+across\s+teams|collaborated\s+with\s+(?:design|eng|product|marketing)/i,
  },
  {
    skill: "Technical Understanding",
    match:
      /api(?:s)?\b|system\s+design|architecture|technical\s+tradeoffs?|sql|python|typescript|react/i,
  },
];

/** Scan a single text blob for recruiter-visible skill signals. */
export function inferSkillsFromText(text: string): InferredSkillHit[] {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return [];

  const hits: InferredSkillHit[] = [];
  for (const rule of SKILL_INFERENCE_RULES) {
    if (!rule.match.test(trimmed)) continue;
    // Prefer a short evidence window around the match when possible
    const match = trimmed.match(rule.match);
    let quote = trimmed;
    if (match?.index !== undefined) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(trimmed.length, match.index + match[0].length + 80);
      quote = trimmed.slice(start, end).trim();
    }
    hits.push({ skill: rule.skill, quote });
  }
  return hits;
}

/** Infer skills from many resume evidence snippets. */
export function inferRecruiterSkillsFromEvidence(
  snippets: string[]
): InferredSkillHit[] {
  const bySkill = new Map<string, InferredSkillHit>();

  for (const snippet of snippets) {
    for (const hit of inferSkillsFromText(snippet)) {
      const existing = bySkill.get(hit.skill);
      if (!existing) {
        bySkill.set(hit.skill, hit);
        continue;
      }
      // Keep the longer quote as richer evidence
      if (hit.quote.length > existing.quote.length) {
        bySkill.set(hit.skill, hit);
      }
    }
  }

  return Array.from(bySkill.values());
}
