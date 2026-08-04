# AI Architecture

## Project

**DecisionReady AI**

**Tagline:**  
AI Decision Intelligence for Modern Hiring

---

# Purpose

This document describes how the AI Decision Intelligence Engine reasons over hiring evidence.

It is a **product architecture** document for Product, AI Engineers, and Backend Engineers. It is not an implementation guide, API reference, or prompt-engineering runbook.

DecisionReady AI is an AI-powered **Decision Intelligence Layer**. It does not replace an ATS and does not recommend Hire or Reject.

It answers one question:

> **Do we have enough evidence to make a fair and confident hiring decision?**

---

# AI Philosophy

Hiring decisions belong to people. Recruiters and Hiring Managers retain ownership of whether a candidate advances, is declined, or needs further evaluation. DecisionReady AI exists because those humans are often forced to decide from fragmented scorecards, uneven notes, and incomplete competency coverage—without a clear view of whether the evidence itself is ready.

The AI therefore **never decides whether a candidate should be hired**.

It does not score “hire worthiness,” rank candidates against each other, or collapse panel feedback into a recommendation. Doing so would convert Decision Support into Decision Making, violate product principles, and increase the risk that teams over-trust model judgment in place of evidence and accountability.

Instead, the AI evaluates the **decision substrate**:

| Dimension | Meaning |
|---|---|
| **Evidence completeness** | Have the competencies implied by the job description been addressed by interview evidence at all? |
| **Evidence quality** | Is the available evidence substantive enough (depth, specificity, strength) to support a fair reading—or is it thin, vague, or uneven? |
| **Evidence consistency** | Do interviewers agree, partially diverge, or materially conflict on the same competency? |
| **Decision readiness** | Given completeness, quality, and consistency, is the hiring team ready to enter debrief—or must they collect, clarify, or resolve evidence first? |

Readiness confidence in the product always refers to **evidence coverage quality**, not confidence that the candidate should be hired.

This philosophy keeps the system aligned with:

- **Decision Support, not Decision Making**
- **Evidence before Opinion**
- **Human-in-the-Loop**
- **Explainable AI**

The AI’s job is to make the state of the evidence legible—so humans can decide with eyes open.

---

# AI Responsibilities

## What the AI is responsible for

The Decision Intelligence Engine transforms a Decision Analysis evidence package into a structured intelligence result. Its responsibilities are bounded and explicit:

| Responsibility | Description |
|---|---|
| **Extract competencies from the Job Description** | Identify the skills, behaviors, and requirements the role demands, including relative criticality where the JD supports it |
| **Use the Resume as candidate context** | Ground role fit context in provided resume text without treating the resume as a substitute for interview evidence |
| **Extract evidence from interview notes and scorecards** | Pull scores, qualitative claims, and interviewer/round attribution from submitted feedback |
| **Map evidence to competencies** | Attach interviewer-level evidence to each extracted competency so coverage is inspectable |
| **Detect conflicting feedback** | Surface material disagreements (score vs. score, score vs. notes, notes vs. notes) that block a fair reading |
| **Detect missing or insufficient evidence** | Mark competencies that are absent, thin, or only partially assessed |
| **Assess evidence quality / strength** | Characterize evidence as strong, moderate, or weak based on what was provided—not on invented detail |
| **Calculate Decision Readiness** | Produce a readiness label (Ready / Partially Ready / Not Ready), score, verdict, and confidence note about evidence quality |
| **Recommend Next Best Action** | Propose a single actionable next step (e.g., proceed to debrief, add evidence, resolve conflict, request clarification) with rationale |
| **Generate Decision Brief** | Produce a concise debrief handoff: readiness restatement, strengths with evidence, risks/open questions, agenda—explicitly without hire/reject language |
| **Provide Analysis Transparency** | State evidence sources used, what the system did, what it did not do, and known limitations |

Outputs must remain **structured Decision Intelligence** fields consumable by the Decision Intelligence Dashboard—not freeform chatbot replies.

## What the AI must NEVER do

| Prohibition | Rationale |
|---|---|
| **Never recommend Hire or Reject** | Outcomes are human decisions; the product thesis is readiness, not selection |
| **Never replace recruiter or hiring-manager judgment** | The AI informs; people own debrief facilitation and final calls |
| **Never infer evidence that does not exist** | Missing scorecards or thin notes must appear as gaps—not be filled with plausible invention |
| **Never invent interviewer opinions or scores** | Attribution must trace to submitted feedback only |
| **Never rank candidates against each other** | The unit of analysis is one Decision Analysis’s evidence package |
| **Never optimize for “who looks best”** | Strengths in the Decision Brief are competencies with sufficient positive evidence—not a hire case |
| **Never hide conflicts by averaging them away** | Conflicts are decision blockers and must remain visible |
| **Never present readiness as hire confidence** | Confidence notes describe evidence coverage quality only |
| **Never operate as an ATS** | No pipeline stages, sourcing, scheduling, or offer logic |
| **Never answer as an open-ended hiring chatbot** | MVP excludes freeform AI chat; reasoning produces structured artifacts |

If a model behavior would make the product feel like it is deciding for the team, it is out of scope for the AI Architecture.

---

# High-Level AI Workflow

The engine reasons over a single Decision Analysis evidence package in a fixed pipeline. Each stage feeds the next; later stages must not invent inputs earlier stages did not establish.

```
Job Description
        ↓
Resume
        ↓
Interview Feedback
        ↓
Evidence Extraction
        ↓
Competency Mapping
        ↓
Conflict Detection
        ↓
Evidence Coverage
        ↓
Decision Readiness
        ↓
Decision Brief
```

### Job Description

The JD is the requirement authority. The engine reads role expectations to define what “complete evidence” would mean for this Decision Analysis. Without a JD, competency targets are undefined and readiness cannot be fairly assessed.

### Resume

The resume provides candidate context (background, claimed experience, trajectory). It helps interpret interview discussion but **does not replace** interview evidence. Resume-only claims are not treated as panel-validated competency coverage.

### Interview Feedback

Scorecards and qualitative notes are the primary evidence corpus. Each entry carries interviewer identity, round/focus, optional scores, and notes. Minimum viable generation requires the JD plus at least one feedback entry; thinner packages increase gaps and lower readiness.

### Evidence Extraction

The engine extracts discrete evidentiary signals from feedback: scored dimensions, stated strengths/concerns, examples, and assessment lean. Extraction preserves source attribution (who said what, in which round). It does not add facts absent from the text.

### Competency Mapping

Extracted signals are mapped onto competencies derived from the JD. Each competency receives a structured assessment: coverage status, evidence strength, interviewers involved, score range when available, notes summary, and expandable interviewer-level detail. This map is the debrief ledger that replaces manual consolidation.

### Conflict Detection

Where multiple interviewers address the same competency, the engine compares scores and narrative lean. Material conflicts are recorded with nature, disagreement summary, and suggested resolution. Conflicts become decision blockers rather than silent averages.

### Evidence Coverage

Across the competency map, the engine summarizes health: competencies required vs. covered, gaps, conflicts detected, interviewers represented, and evidence items analyzed. Insufficient and missing competencies are listed with suggested next steps. Coverage answers: *What is evaluated well, weakly, or not at all?*

### Decision Readiness

Using completeness, quality, and consistency, the engine produces the readiness verdict: label (Ready / Partially Ready / Not Ready), score, one-line verdict, and an evidence-quality confidence note. It also selects a **Next Best Action**—the single most useful recruiter move before or into debrief (proceed, add evidence, resolve conflict, or request clarification).

### Decision Brief

Finally, the engine composes a concise handoff artifact for the hiring discussion: readiness restatement, strengths **with evidence**, risks and open questions drawn from gaps/conflicts, and a recommended debrief agenda. The brief always includes an explicit disclaimer that it does **not** recommend hire or reject. Analysis Transparency accompanies the result so teams can see sources, system actions, non-actions, and limitations.

---

# Decision Readiness Algorithm

Decision readiness is a **structured judgment about the evidence package**, not a prediction of hire outcome. The algorithm is conceptual: it aggregates several evaluation dimensions into a single readiness assessment (label, score, verdict, and confidence note about evidence quality).

There is no claim of a universal proprietary formula. The MVP uses transparent, documented rules so Product, AI, and Backend share the same meaning of Ready / Partially Ready / Not Ready.

## Evaluation dimensions

### Competency Coverage

For each competency extracted from the job description, the engine asks whether interview evidence addresses it.

Coverage states include:

- **Sufficient** — enough attributable evidence to discuss the competency in debrief
- **Partial** — some signal exists, but depth or specificity is limited
- **Missing** — no meaningful interview evidence for the competency
- **Conflicting** — evidence exists but interviewers materially disagree

Coverage answers: *Which role requirements were actually evaluated?*

### Evidence Completeness

Completeness looks across the full competency set and the evidence package shape:

- How many required / important competencies have any interview signal?
- How many interviewers and rounds are represented?
- Is the minimum package present (JD + at least one feedback entry), or is the corpus still thin?

Completeness answers: *Is the panel input broad enough to decide fairly?*

### Evidence Quality

Quality assesses strength of what was provided—not candidate merit.

Signals of stronger evidence include specific examples, clear scores with supporting notes, and coherent interviewer narratives. Weak evidence includes vague adjectives, empty scorecards, or single shallow mentions of a critical skill.

Quality answers: *Can we trust what we have, or is it too thin to lean on?*

### Interview Consistency

When multiple interviewers touch the same competency, the engine compares scores and narrative lean.

Consistent panels increase readiness. Material conflicts (score vs. score, score vs. notes, notes vs. notes) decrease readiness and become blockers until resolved or explicitly accepted by the human team.

Consistency answers: *Are we looking at one coherent evidence picture—or competing stories?*

### Critical Competency Validation

Not all competencies weigh equally. Requirements marked required (or otherwise critical in the JD) must clear a higher bar than nice-to-have skills.

A Decision Analysis cannot be Ready if critical competencies remain Missing or Conflicting—even if many secondary skills look Sufficient. Partial coverage on a critical skill typically caps readiness at Partially Ready or Not Ready.

Critical validation answers: *Did we actually test what the role cannot proceed without?*

## How dimensions combine into Decision Readiness

The engine synthesizes these dimensions into one assessment:

1. **Inventory** competencies and map evidence (coverage + criticality).
2. **Score health** across completeness (breadth of panel and competencies touched) and quality (strength labels per competency).
3. **Apply blockers** from missing critical competencies and material conflicts—these constrain the ceiling of readiness.
4. **Assign a readiness label**
   - **Ready** — required competencies sufficiently evidenced; no material unresolved conflicts; evidence quality adequate for debrief
   - **Partially Ready** — mixed coverage; some gaps or weak areas remain; decision possible only after targeted follow-up or with known open risks
   - **Not Ready** — critical gaps, severe thinness, and/or blocking conflicts make a fair decision premature
5. **Produce a readiness score** as a compact 0–100 expression of that synthesis for scanning—not as hire probability.
6. **Write a one-line verdict** that states the evidence conclusion in plain language.
7. **Attach a confidence note** that describes confidence in *evidence coverage quality*, never confidence that the candidate should be hired.
8. **Select Next Best Action** as the logical consequence of the assessment (proceed to debrief, add evidence, resolve conflict, or request clarification).

Readiness therefore emerges from **coverage + completeness + quality + consistency**, gated by **critical competency validation**. Improving readiness means improving the evidence—not persuading the model to be more optimistic.

---

# Structured AI Output

The Decision Intelligence Engine returns a single structured object. The UI and persistence layer consume this shape; freeform chat is not the product interface.

Conceptual fields (JSON-like, illustrative—not an implementation schema):

```
DecisionIntelligence
├── Decision Readiness
├── Confidence
├── Competencies
├── Evidence Map
├── Conflicts
├── Evidence Gaps
├── Next Best Action
├── Decision Brief
└── Analysis Transparency (supporting)
```

### Decision Readiness

The primary verdict block.

Represents:

- **Label** — Ready / Partially Ready / Not Ready (product language may surface “Decision Ready” in the UI)
- **Score** — numeric readiness indicator for scanability
- **Verdict** — one-sentence evidence conclusion
- Supporting timestamps / generation metadata as needed by the product

This field answers the core product question for the Decision Intelligence Dashboard.

### Confidence

The readiness confidence note and related confidence framing.

Represents confidence in **how well the evidence supports a fair decision process**—coverage quality, depth, and consistency—not confidence in a hire outcome.

If evidence is thin, confidence should be low even when a partial score exists.

### Competencies

The set of competencies extracted from the job description.

Each competency conceptually includes:

- Name
- Criticality (e.g., required / important / nice-to-have)
- Coverage status
- Evidence strength
- Interviewers involved
- Optional score range
- Short notes summary
- Blocker flag (gap / conflict / none)

Competencies are the unit of structured evaluation.

### Evidence Map

The detailed mapping from competencies to interviewer-level evidence.

Represents, for each competency:

- JD expectation for that competency
- Evidence by interviewer (round, score if any, notes summary, assessment lean)
- System reading (sufficient / partial / conflicting / missing interpretation)

This is the expandable debrief ledger behind the competency list.

### Conflicts

Material interviewer disagreements that impede a fair reading.

Each conflict conceptually includes:

- Competency involved
- Interviewers involved
- Nature of conflict
- Disagreement summary
- Suggested resolution

Conflicts are decision blockers, not footnotes.

### Evidence Gaps

Competencies with missing or insufficient evidence.

Each gap conceptually includes:

- Competency and criticality
- What evidence was found (if any)
- What is missing
- Suggested next step to collect or deepen evidence

Gaps drive Update Evidence workflows and Next Best Action when readiness is incomplete.

### Next Best Action

A single recommended recruiter action derived from readiness and blockers.

Conceptually includes:

- Action type (proceed to debrief / add evidence / resolve conflict / request clarification)
- Title
- Short evidence-backed reasons
- Risk if ignored

Prevents the dashboard from being informative but inert.

### Decision Brief

A concise handoff artifact for the hiring discussion.

Conceptually includes:

- Readiness restatement
- Strengths with evidence (only where evidence is sufficient and positive)
- Risks / open questions (from gaps and conflicts)
- Recommended debrief agenda
- Explicit disclaimer: does **not** recommend hire or reject

### Supporting fields (conceptual)

Alongside the fields above, the structured result also carries:

- **Evidence Health Summary** — aggregate counts (required, covered, gaps, conflicts, interviewers, evidence items)
- **Interviewer Contribution Overview** — balance of panel input without becoming interviewer management
- **Analysis Transparency** — sources used, what the system did / did not do, limitations

Together these fields are the contract between AI reasoning and the Decision Intelligence Dashboard.

---

# AI Limitations

DecisionReady AI is powerful only within the bounds of provided text evidence. The following limitations are product truths, not temporary gaps.

### Cannot determine culture fit

Culture fit, team chemistry, and organizational values alignment are not reliably reducible from pasted JD/resume/notes alone. The engine may surface related behavioral evidence if interviewers wrote it down; it does not certify culture fit.

### Cannot infer missing evidence

If a competency was never interviewed, the system must mark it Missing or Partial. It must not invent examples, scores, or interviewer opinions to complete the picture.

### Cannot replace recruiter judgment

Facilitating debrief, weighing political/context factors, and making the final hiring call remain human responsibilities. Mark Ready for Debrief is a human confirmation, not an automated outcome.

### Cannot guarantee fairness

The engine can surface uneven coverage and conflicts, which supports fairer process design. It cannot guarantee bias-free interviews, equitable panel composition, or lawful hiring outcomes. Biased notes may still appear as “evidence”; the product frames outputs as evidence quality/readiness, not candidate worth.

### Depends on evidence quality

Garbage-in remains garbage-out. Vague notes, missing scorecards, or single-interviewer packages produce weak readiness—correctly. The AI cannot upgrade low-quality input into high-confidence readiness.

### Cannot recommend Hire or Reject

By architecture and principle, the system never outputs selection recommendations. Any such language is a defect.

### Cannot see evidence outside the package

ATS records, private Slack threads, hallway conversations, or live interview recordings not pasted into the Decision Analysis are invisible. Analysis Transparency must state that limitation.

### Cannot fully neutralize interviewer bias encoded in feedback

Conflicts can be highlighted; biased-but-consistent panels may still look “ready.” Humans must still interrogate fairness beyond readiness metrics.

### Cannot replace an ATS or operate as a chatbot

The engine does not manage pipeline stages, scheduling, or offers, and MVP reasoning is not exposed as open-ended chat.

### Readiness is not truth about the candidate

A Ready label means the team has enough evidence to decide—not that the candidate is the right hire. A Not Ready label means evidence is insufficient—not that the candidate should be rejected.

These limitations should appear in Analysis Transparency and product communication so teams calibrate trust appropriately.

---

| Field | Value |
|---|---|
| **Status** | In progress — through AI Limitations |
| **Reference Documents** | `docs/00_execution_plan.md` · `docs/01_problem_discovery.md` · `docs/02_product_requirements.md` · `docs/03_information_architecture.md` · `docs/04_design_system.md` |
| **Product** | DecisionReady AI — AI Decision Intelligence Platform |
