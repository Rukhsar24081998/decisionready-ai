import type { DecisionAnalysis } from "@/lib/types";

/**
 * Seeded demo Decision Analyses:
 * - Ready
 * - Partially Ready
 * - Not Ready
 *
 * Full intelligence payloads will be wired when the analysis engine is implemented.
 * For scaffold, Ready has a minimal intelligence stub; others await evidence/analysis.
 */

const now = new Date().toISOString();

export const seedDecisionAnalyses: DecisionAnalysis[] = [
  {
    id: "da_ready_001",
    candidateName: "Priya Sharma",
    roleTitle: "Senior Backend Engineer",
    status: "ready_for_debrief",
    evidence: {
      jobDescription:
        "We are hiring a Senior Backend Engineer to design and scale APIs, own service reliability, and mentor engineers. Required: distributed systems, system design, TypeScript/Node, ownership, and clear communication.",
      resume:
        "Backend engineer with 7 years experience in Node.js, TypeScript, PostgreSQL, and distributed systems. Led API platform work at two SaaS companies.",
      interviewFeedback: [
        {
          id: "fb_1",
          interviewerName: "Alex Kim",
          round: "System Design",
          focus: "Architecture",
          scores: { "System Design": 4, Scalability: 4 },
          notes:
            "Strong tradeoff discussion on caching and consistency. Clear ownership of prior platform migrations.",
        },
        {
          id: "fb_2",
          interviewerName: "Jordan Lee",
          round: "Coding",
          focus: "TypeScript",
          scores: { Coding: 4, Communication: 3 },
          notes:
            "Solid TypeScript problem-solving. Explained edge cases well. Minor gaps in test strategy depth.",
        },
        {
          id: "fb_3",
          interviewerName: "Sam Ortiz",
          round: "Behavioral",
          focus: "Ownership",
          scores: { Ownership: 4, Collaboration: 4 },
          notes:
            "Concrete examples of mentoring and cross-team delivery. No major concerns.",
        },
      ],
    },
    intelligence: {
      readinessLabel: "ready",
      readinessScore: 88,
      verdict:
        "Required competencies have sufficient evidence with no material conflicts.",
      confidenceNote:
        "Readiness confidence reflects evidence coverage quality, not hire recommendation.",
      nextBestAction: {
        type: "proceed_to_debrief",
        title: "Proceed to hiring debrief",
        reasons: [
          "All required competencies have sufficient evidence.",
          "No material interviewer conflicts detected.",
        ],
        riskIfIgnored:
          "Delaying debrief adds little new signal given current coverage.",
      },
      evidenceHealth: {
        competenciesRequired: 5,
        competenciesCovered: 5,
        competenciesWithGaps: 0,
        conflictsDetected: 0,
        interviewersRepresented: 3,
        evidenceItemsAnalyzed: 3,
      },
      evidenceGaps: [],
      conflicts: [],
      competencies: [
        {
          id: "comp_system_design",
          name: "System Design",
          criticality: "required",
          coverageStatus: "sufficient",
          evidenceStrength: "strong",
          interviewers: ["Alex Kim"],
          scoreRange: { min: 4, max: 4 },
          notesSummary: "Clear tradeoffs on caching and consistency.",
          blockerFlag: "none",
          jdExpectation: "Design and scale APIs and distributed systems.",
          evidenceByInterviewer: [
            {
              interviewerName: "Alex Kim",
              round: "System Design",
              score: 4,
              notesSummary: "Strong architecture discussion with tradeoffs.",
              assessmentLean: "positive",
            },
          ],
          systemReading: "Sufficient evidence from dedicated system design round.",
        },
        {
          id: "comp_typescript",
          name: "TypeScript / Node",
          criticality: "required",
          coverageStatus: "sufficient",
          evidenceStrength: "strong",
          interviewers: ["Jordan Lee"],
          scoreRange: { min: 4, max: 4 },
          notesSummary: "Solid coding and edge-case handling.",
          blockerFlag: "none",
          jdExpectation: "Build production services in TypeScript/Node.",
          evidenceByInterviewer: [
            {
              interviewerName: "Jordan Lee",
              round: "Coding",
              score: 4,
              notesSummary: "Strong problem-solving in TypeScript.",
              assessmentLean: "positive",
            },
          ],
          systemReading: "Sufficient coding evidence for required stack.",
        },
        {
          id: "comp_ownership",
          name: "Ownership",
          criticality: "required",
          coverageStatus: "sufficient",
          evidenceStrength: "strong",
          interviewers: ["Sam Ortiz", "Alex Kim"],
          scoreRange: { min: 4, max: 4 },
          notesSummary: "Concrete mentoring and delivery examples.",
          blockerFlag: "none",
          jdExpectation: "Own reliability and mentor engineers.",
          evidenceByInterviewer: [
            {
              interviewerName: "Sam Ortiz",
              round: "Behavioral",
              score: 4,
              notesSummary: "Clear ownership and mentoring examples.",
              assessmentLean: "positive",
            },
          ],
          systemReading: "Sufficient behavioral evidence for ownership.",
        },
      ],
      interviewerContributions: [
        {
          interviewerName: "Alex Kim",
          round: "System Design",
          focus: "Architecture",
          competenciesTouched: ["System Design", "Ownership"],
          feedbackDepth: "high",
          conflictsInvolved: 0,
        },
        {
          interviewerName: "Jordan Lee",
          round: "Coding",
          focus: "TypeScript",
          competenciesTouched: ["TypeScript / Node"],
          feedbackDepth: "high",
          conflictsInvolved: 0,
        },
        {
          interviewerName: "Sam Ortiz",
          round: "Behavioral",
          focus: "Ownership",
          competenciesTouched: ["Ownership"],
          feedbackDepth: "medium",
          conflictsInvolved: 0,
        },
      ],
      decisionBrief: {
        readinessRestatement:
          "This Decision Analysis is ready for hiring debrief based on current evidence.",
        strengthsWithEvidence: [
          "System Design — strong tradeoff discussion (Alex Kim).",
          "TypeScript / Node — solid coding evidence (Jordan Lee).",
          "Ownership — concrete mentoring examples (Sam Ortiz).",
        ],
        risksAndOpenQuestions: [],
        debriefAgenda: [
          "Confirm role expectations vs demonstrated system design depth.",
          "Align on leveling using coding and ownership evidence.",
          "Capture any remaining team-fit questions for the hiring manager.",
        ],
        disclaimer:
          "This brief does not recommend hire or reject. It assesses evidence readiness only.",
      },
      analysisTransparency: {
        evidenceSourcesUsed: [
          "Job description",
          "Resume",
          "3 interview feedback entries",
        ],
        whatSystemDid: [
          "Extracted required competencies from the job description",
          "Mapped interview evidence to each competency",
          "Checked for interviewer conflicts",
          "Scored decision readiness",
        ],
        whatSystemDidNotDo: [
          "Did not recommend hire or reject",
          "Did not rank the candidate against other applicants",
        ],
        limitations: [
          "Based only on provided text evidence",
          "Missing scorecards would reduce coverage",
        ],
      },
      generatedAt: now,
    },
    aiResult: null,
    ingestedDocuments: [],
    createdAt: now,
    updatedAt: now,
    evidenceUpdatedAt: now,
    analyzedAt: now,
  },
  {
    id: "da_partial_002",
    candidateName: "Marcus Chen",
    roleTitle: "Product Designer",
    status: "analyzed",
    evidence: {
      jobDescription:
        "Product Designer for B2B workflows. Required: interaction design, design systems, stakeholder communication, and research synthesis.",
      resume:
        "Product designer with 5 years in SaaS. Portfolio includes complex settings and onboarding flows.",
      interviewFeedback: [
        {
          id: "fb_4",
          interviewerName: "Riley Adams",
          round: "Portfolio",
          focus: "Interaction Design",
          scores: { "Interaction Design": 4 },
          notes:
            "Strong interaction work on workflow density. Limited discussion of research methods.",
        },
      ],
    },
    intelligence: {
      readinessLabel: "partially_ready",
      readinessScore: 58,
      verdict:
        "Interaction design is covered, but research synthesis and design systems still lack sufficient evidence.",
      confidenceNote:
        "Readiness confidence reflects evidence coverage quality, not hire recommendation.",
      nextBestAction: {
        type: "add_evidence",
        title: "Add interview evidence for research synthesis",
        reasons: [
          "Research synthesis is required and currently missing dedicated interview evidence.",
          "Design systems coverage is thin relative to role requirements.",
        ],
        riskIfIgnored:
          "Proceeding to debrief may leave critical product craft gaps unresolved.",
      },
      evidenceHealth: {
        competenciesRequired: 4,
        competenciesCovered: 1,
        competenciesWithGaps: 2,
        conflictsDetected: 0,
        interviewersRepresented: 1,
        evidenceItemsAnalyzed: 1,
      },
      evidenceGaps: [
        {
          competencyId: "comp_research",
          competencyName: "Research Synthesis",
          criticality: "required",
          evidenceFound: "Brief mention of limited research discussion.",
          whatsMissing: "Dedicated research methods and synthesis evidence.",
          suggestedNextStep: "Add a research-focused interview or scorecard notes.",
        },
      ],
      conflicts: [],
      competencies: [
        {
          id: "comp_interaction",
          name: "Interaction Design",
          criticality: "required",
          coverageStatus: "sufficient",
          evidenceStrength: "strong",
          interviewers: ["Riley Adams"],
          scoreRange: { min: 4, max: 4 },
          notesSummary: "Strong interaction work on workflow density.",
          blockerFlag: "none",
          jdExpectation: "Design complex B2B workflow interactions.",
          evidenceByInterviewer: [
            {
              interviewerName: "Riley Adams",
              round: "Portfolio",
              score: 4,
              notesSummary: "Strong interaction craft on dense workflows.",
              assessmentLean: "positive",
            },
          ],
          systemReading: "Sufficient evidence from portfolio review.",
        },
        {
          id: "comp_research",
          name: "Research Synthesis",
          criticality: "required",
          coverageStatus: "missing",
          evidenceStrength: "weak",
          interviewers: ["Riley Adams"],
          notesSummary: "Research methods were not substantively evaluated.",
          blockerFlag: "gap",
          jdExpectation: "Synthesize research into product decisions.",
          evidenceByInterviewer: [
            {
              interviewerName: "Riley Adams",
              round: "Portfolio",
              notesSummary: "Limited discussion of research methods.",
              assessmentLean: "unclear",
            },
          ],
          systemReading: "Insufficient evidence for a required competency.",
        },
      ],
      interviewerContributions: [
        {
          interviewerName: "Riley Adams",
          round: "Portfolio",
          focus: "Interaction Design",
          competenciesTouched: ["Interaction Design", "Research Synthesis"],
          feedbackDepth: "medium",
          conflictsInvolved: 0,
        },
      ],
      decisionBrief: {
        readinessRestatement:
          "This Decision Analysis is only partially ready — key research evidence is still missing.",
        strengthsWithEvidence: [
          "Interaction Design — strong portfolio evidence (Riley Adams).",
        ],
        risksAndOpenQuestions: [
          "Research synthesis has not been adequately evaluated.",
          "Design systems depth remains unclear.",
        ],
        debriefAgenda: [
          "Confirm whether an additional research interview is required.",
          "Review interaction design evidence already collected.",
        ],
        disclaimer:
          "This brief does not recommend hire or reject. It assesses evidence readiness only.",
      },
      analysisTransparency: {
        evidenceSourcesUsed: [
          "Job description",
          "Resume",
          "1 interview feedback entry",
        ],
        whatSystemDid: [
          "Extracted required competencies from the job description",
          "Mapped interview evidence to each competency",
          "Identified missing competencies",
          "Scored decision readiness",
        ],
        whatSystemDidNotDo: [
          "Did not recommend hire or reject",
          "Did not rank the candidate against other applicants",
        ],
        limitations: [
          "Based only on provided text evidence",
          "Single interviewer limits coverage confidence",
        ],
      },
      generatedAt: now,
    },
    aiResult: null,
    ingestedDocuments: [],
    createdAt: now,
    updatedAt: now,
    evidenceUpdatedAt: now,
    analyzedAt: now,
  },
  {
    id: "da_not_ready_003",
    candidateName: "Aisha Rahman",
    roleTitle: "Staff Frontend Engineer",
    status: "needs_evidence",
    evidence: {
      jobDescription:
        "Staff Frontend Engineer to lead architecture, accessibility, and mentoring. Required: React architecture, performance, accessibility, technical leadership.",
      resume: "",
      interviewFeedback: [],
    },
    intelligence: null,
    aiResult: null,
    ingestedDocuments: [],
    createdAt: now,
    updatedAt: now,
    evidenceUpdatedAt: now,
    analyzedAt: null,
  },
];
