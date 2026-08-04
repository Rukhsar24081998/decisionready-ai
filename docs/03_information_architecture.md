# Information Architecture

## Project

**DecisionReady AI**

**Tagline:**  
AI Decision Intelligence for Modern Hiring

---

# Purpose

This document defines the navigation structure, screen hierarchy, user flow, and information architecture for the DecisionReady AI MVP.

It translates the approved Product Requirements into a clear UX structure for Product, Design, Engineering, and AI teams. It does not redesign the product or expand MVP scope beyond the Decision Intelligence workflow.

DecisionReady AI is an AI-powered **Decision Intelligence Platform**. It is not an ATS and does not recommend Hire or Reject.

---

# Product Navigation

```
Landing Page
        ↓
Decision Dashboard
        ↓
Prepare Decision Analysis
        ↓
AI Analysis in Progress
        ↓
Decision Intelligence Dashboard
        ├── Update Evidence
        ├── Re-analyze
        └── Mark Ready for Debrief
```

### Navigation step purposes

| Step | Purpose |
|---|---|
| **Landing Page** | Public entry point. Introduces DecisionReady AI, explains Decision Intelligence, and invites the recruiter to begin. |
| **Decision Dashboard** | Home for returning recruiters. List, open, or create Decision Analyses. |
| **Prepare Decision Analysis** | Evidence workspace. Assemble a complete evidence package before AI analysis. |
| **AI Analysis in Progress** | Communicates that the AI reasoning engine is processing evidence through a structured pipeline. |
| **Decision Intelligence Dashboard** | Final destination. Review readiness, coverage, flags, conflicts, gaps, next action, and Decision Brief. |
| **Update Evidence** | Return to Prepare Decision Analysis to add or correct evidence. |
| **Re-analyze** | Regenerate Decision Intelligence from the latest evidence (via AI Analysis in Progress). |
| **Mark Ready for Debrief** | Confirm the Decision Analysis is ready for the hiring discussion. |

---

# Screen Inventory

The MVP end-to-end experience contains the following screens.

---

## 1. Landing Page

| Field | Detail |
|---|---|
| **Purpose** | Public entry point to DecisionReady AI. Introduces the product and its value proposition. |
| **Primary User** | Technical Recruiter *(first-time visitor)* |
| **User Goal** | Understand that DecisionReady AI assesses decision readiness—not hire/reject—and start a Decision Analysis. |
| **Inputs** | None required to land. |
| **Outputs** | Product orientation; entry into the Decision Analysis workflow. |
| **Primary CTA** | **Start New Decision Analysis** |
| **Navigation** | → **Prepare Decision Analysis** (primary) · → **Decision Dashboard** (secondary, for returning recruiters) |

**Messaging focus:** Explain how Decision Intelligence works (evidence → readiness → next action). Reinforce that the product does not replace an ATS and does not recommend Hire or Reject.

---

## 2. Decision Dashboard

| Field | Detail |
|---|---|
| **Purpose** | Home for returning recruiters. Find or continue post-interview Decision Analyses. |
| **Primary User** | Technical Recruiter |
| **User Goal** | Quickly open the right Decision Analysis or create a new one. |
| **Inputs** | None required to land. Optional: select an existing Decision Analysis. |
| **Outputs** | List of Decision Analyses with candidate name, role, status, and last updated timestamp. |
| **Primary CTA** | **New Decision Analysis** / **Create Decision Analysis** |
| **Navigation** | → **Prepare Decision Analysis** (create or Needs Evidence) · → **Decision Intelligence Dashboard** (when analysis already exists) · → **Landing Page** (optional brand/home link) |

**Statuses shown:** Needs Evidence · Analyzed · Ready for debrief *(readiness badges may also show Decision Ready / Partially Ready / Needs Evidence when intelligence exists)*

---

## 3. Prepare Decision Analysis

| Field | Detail |
|---|---|
| **Purpose** | Evidence workspace for assembling a complete hiring evidence package before AI analysis. |
| **Primary User** | Technical Recruiter |
| **User Goal** | Provide candidate/role context and interview evidence so DecisionReady AI can assess decision readiness. |
| **Inputs** | Candidate information · Job description (**Upload PDF/DOCX** or **Paste Text**) · Resume (**Upload PDF/DOCX**) · Multiple interviewer feedback sections · Optional paste fallbacks where upload is unavailable |
| **Outputs** | Saved Decision Analysis draft or complete evidence package ready for analysis. |
| **Primary CTA** | **Generate Decision Intelligence** |
| **Secondary CTA** | **Save Draft** |
| **Navigation** | → **AI Analysis in Progress** (after Generate) · → **Decision Dashboard** (back) |

**Minimum evidence to generate:** Job description + at least one interview feedback entry. Resume is strongly recommended for context.

---

## 4. AI Analysis in Progress

| Field | Detail |
|---|---|
| **Purpose** | Communicate that the AI reasoning engine is processing the evidence package. |
| **Primary User** | Technical Recruiter |
| **User Goal** | Understand progress and wait confidently for structured Decision Intelligence—without a chatbot experience. |
| **Inputs** | Persisted evidence package for the Decision Analysis. |
| **Outputs** | Structured progress through the reasoning pipeline; on completion, a Decision Intelligence result. |
| **Primary CTA** | None while running *(optional Cancel only if safe and supported)* |
| **Navigation** | → **Decision Intelligence Dashboard** (on success) · → **Prepare Decision Analysis** (on recoverable failure / retry path) |

**Pipeline steps shown:**

1. Extract Competencies  
2. Map Evidence  
3. Detect Interviewer Conflicts  
4. Measure Evidence Coverage  
5. Calculate Decision Readiness  
6. Generate Decision Brief  

**Explicit non-goals on this screen:** no freeform chat · no hire/reject preview · no ATS controls.

---

## 5. Decision Intelligence Dashboard

| Field | Detail |
|---|---|
| **Purpose** | Final destination of the workflow. Core product moment—answers whether the hiring team has enough evidence for a fair, confident decision. |
| **Primary User** | Technical Recruiter *(Hiring Manager as secondary viewer)* |
| **User Goal** | Understand readiness, coverage, flags, conflicts, and gaps; know the next best action before debrief. |
| **Inputs** | Persisted Decision Intelligence result for the Decision Analysis. Optional: expand competency rows. |
| **Outputs** | Decision Readiness · Competency Coverage · Evidence Mapping · Green Flags · Red Flags · Interviewer Conflicts · Evidence Gaps · Recommended Next Action · Decision Brief · Analysis Transparency |
| **Primary CTA** | **Update Evidence** *(when not ready)* or **Mark Ready for Debrief** *(when ready)* |
| **Navigation** | → **Prepare Decision Analysis** (Update Evidence) · → **AI Analysis in Progress** (Re-analyze) · → **Decision Dashboard** (done / switch analysis) |

**Explicit non-goals on this screen:** no Hire / Reject CTA · no chat composer · no ATS pipeline controls.

---

# Detailed Screen Architecture

---

## 1. Landing Page

### Screen Components

- Product identity / brand
- Hero value proposition (Decision Intelligence—not ATS, not hire/reject)
- Short explanation of how Decision Intelligence works
- Primary CTA: Start New Decision Analysis
- Secondary path: Go to Decision Dashboard (returning recruiters)
- Optional calm supporting visuals consistent with the design system

### Information Hierarchy

1. Brand / product identity
2. Value proposition (readiness over hire/reject)
3. How Decision Intelligence works (brief)
4. Primary CTA
5. Secondary entry to Decision Dashboard

### User Actions

- Start New Decision Analysis
- Navigate to Decision Dashboard
- Learn product positioning from page copy

### Empty States

- Not applicable (marketing/orientation surface)

### Loading States

- Standard page load

### Error States

- Not applicable beyond generic page failure

---

## 2. Decision Dashboard

### Screen Components

- App shell / product identity
- Page header (“Decision Dashboard”)
- Primary action: New Decision Analysis
- Decision Analysis list (or empty state)
- Status badge per row
- Compact decision-intelligence metrics when available (readiness, coverage, interviewers, blockers)
- Row metadata: candidate, role, last updated

### Information Hierarchy

1. Product / page identity
2. Create / New Decision Analysis CTA
3. List of Decision Analyses ordered by recency
4. Status, metrics, and metadata per row

### Screen Responsibilities

- Home for returning recruiters
- Display existing Decision Analyses
- Allow create new or continue existing
- Route correctly based on analysis state (prepare vs intelligence)

### User Actions

- Create Decision Analysis
- Open Decision Analysis
- Return to this screen from deeper flows

### Empty States

- No Decision Analyses yet
- Message explaining this is where post-interview decision work lives
- CTA: Create First Decision Analysis / Start New Decision Analysis

### Loading States

- Skeleton or placeholder rows while Decision Analyses load

### Error States

- Failed to load Decision Analyses
- Recoverable retry action

---

## 3. Prepare Decision Analysis

### Screen Components

- Page header with candidate/role context (once entered)
- Candidate Information (candidate name, role/requisition title)
- Job Description input: Upload PDF/DOCX or Paste Text
- Resume input: Upload PDF/DOCX *(optional paste fallback if required for MVP resilience)*
- Multiple Interviewer Feedback sections (add / edit / remove)
- Stale-intelligence indicator (when returning from Update Evidence)
- Secondary: Save Draft
- Primary CTA: Generate Decision Intelligence
- Secondary navigation: Back to Decision Dashboard

### Information Hierarchy

1. Analysis identity (Candidate Information)
2. Role evidence (Job Description)
3. Candidate context (Resume)
4. Interview evidence (multiple interviewer feedback sections)
5. Save Draft / Generate Decision Intelligence actions

### Screen Responsibilities

- Evidence workspace before AI analysis
- Support complete evidence package assembly
- Persist drafts
- Validate minimum evidence before Generate
- Hand off to AI Analysis in Progress

### User Actions

- Enter or edit Candidate Information
- Upload or paste Job Description
- Upload Resume (PDF/DOCX)
- Add, edit, or remove interviewer feedback sections
- Save Draft
- Generate Decision Intelligence
- Navigate back to Decision Dashboard

### Empty States

- No interviewer feedback added yet — prompt to add at least one interviewer entry
- Optional helper copy: evidence can come from the existing ATS or documents (DecisionReady AI is not an ATS)

### Loading States

- Saving draft
- Preparing upload / parse feedback (if applicable)
- Transition into AI Analysis in Progress after Generate

### Error States

- Validation: missing required Candidate Information fields
- Validation: insufficient evidence to generate (missing JD or feedback)
- Upload / parse failure with recoverable retry
- Save Draft failure with recoverable retry

---

## 4. AI Analysis in Progress

### Screen Components

- Analysis identity chrome (candidate · role)
- Progress headline (e.g., Generating Decision Intelligence)
- Structured pipeline checklist / stepper:
  - Extract Competencies
  - Map Evidence
  - Detect Interviewer Conflicts
  - Measure Evidence Coverage
  - Calculate Decision Readiness
  - Generate Decision Brief
- Calm status copy reinforcing Decision Support (not hire/reject)
- Optional elapsed-time or indeterminate progress indicator

### Information Hierarchy

1. What is happening (AI reasoning in progress)
2. Which pipeline step is active / complete
3. Reassurance and wait state (no competing CTAs)

### Screen Responsibilities

- Make AI reasoning feel explainable and trustworthy
- Mirror the High-Level AI Workflow without exposing a chatbot
- Block premature navigation to an empty intelligence dashboard
- On success, deliver the recruiter to Decision Intelligence Dashboard

### User Actions

- Wait for completion
- Retry on failure (returns toward Prepare or restarts analysis)
- Optional cancel only if it safely returns to Prepare Decision Analysis without corrupting saved evidence

### Empty States

- Not applicable while running

### Loading States

- This screen *is* the loading / analyzing experience
- Steps advance as the engine progresses (mock or live)

### Error States

- Analysis failure with recoverable retry
- Prior Decision Intelligence retained when re-analyze fails (if a prior result exists)

---

## 5. Decision Intelligence Dashboard

### Screen Components

- Page identity + readiness status pill
- Secondary actions: Update Evidence, Re-analyze, Back to Decision Dashboard
- Decision Readiness Verdict
- Recommended Next Action
- Competency Coverage / Evidence Health Summary
- Green Flags
- Red Flags
- Decision Blockers (Evidence Gaps + Interviewer Conflicts)
- Competency Evidence Map (+ expandable detail)
- Interviewer Contribution Overview *(optional supporting section)*
- Decision Brief
- Analysis Transparency

### Information Hierarchy

1. Orient (who/what Decision Analysis)
2. Answer (Decision Readiness)
3. Act (Recommended Next Action)
4. Justify (Competency Coverage / evidence health)
5. Reinforce (Green Flags)
6. Caution (Red Flags)
7. Unblock (Evidence Gaps + Interviewer Conflicts)
8. Inspect (Evidence Mapping / competency evidence map)
9. Handoff (Decision Brief)
10. Trust (Analysis Transparency)

### Screen Responsibilities

- Present structured Decision Intelligence as the workflow destination
- Answer readiness—not hire/reject
- Make next action explicit
- Support debrief handoff via Decision Brief
- Allow Update Evidence and Re-analyze loops

### User Actions

- Review readiness and next action
- Review green flags / red flags
- Expand competency evidence
- Copy Decision Brief
- Update Evidence
- Re-analyze
- Mark Ready for Debrief
- Return to Decision Dashboard

### Empty States

- No critical evidence gaps detected
- No material conflicts detected
- No red flags detected *(confirmation state)*
- (Full dashboard empty should not occur if navigation rules require an analysis result)

### Loading States

- Brief dashboard skeleton only if hydrating a persisted result
- Re-analyze routes through **AI Analysis in Progress** rather than a silent overlay when possible

### Error States

- Failed to load Decision Intelligence
- Re-analyze failure with prior result retained when possible
- Stale intelligence warning after evidence updates without re-analysis

---

# Decision Intelligence Dashboard

This is the core screen of DecisionReady AI.

Every section appears in the order below. The top of the page is a **verdict + next action**. Everything below is **evidence structure** that justifies or challenges that verdict.

---

## 1. Page Identity

**Purpose**  
Orient the recruiter to which Decision Analysis they are reviewing without presenting a candidate profile or ATS record.

**Information displayed**

- Page title: Decision Intelligence
- Candidate name · Role / requisition title
- Interview rounds represented
- Evidence last updated
- Analysis generated timestamp
- Status pill: Decision Ready / Partially Ready / Not Ready

**User actions**

- Update Evidence
- Re-analyze
- Back to Decision Dashboard

**Why this section exists**  
Provides context chrome so the readiness verdict can remain the primary signal.

---

## 2. Decision Readiness Verdict

**Purpose**  
Immediately communicate the product thesis: this is a readiness judgment, not a candidate ranking or hire recommendation.

**Information displayed**

- Readiness label: Ready / Partially Ready / Not Ready
- Readiness score
- One-line verdict
- Confidence note for the readiness assessment (evidence coverage quality — not hire confidence)

**User actions**

- None required; this is the primary read target

**Why this section exists**  
Answers the core question in one glance: *Do we have enough evidence to decide?*

---

## 3. Recommended Next Action

**Purpose**  
Convert intelligence into a concrete recruiter action before the hiring debrief.

**Information displayed**

- Single recommended next best action
- 1–2 evidence-backed reasons
- Short risk note if the action is ignored

**Possible recommended actions**

- Proceed to hiring debrief
- Add interview / evidence for specific competency(ies)
- Resolve interviewer conflict before deciding
- Request clarification from named interviewer(s)

**User actions**

- Execute primary CTA matching the recommendation (**Mark Ready for Debrief** or **Update Evidence**)
- Optional: Copy Decision Brief

**Why this section exists**  
Prevents the dashboard from being informative but inert. Readiness must lead to a next step.

---

## 4. Competency Coverage / Evidence Health Summary

**Purpose**  
Provide a scannable, measurable justification for the verdict.

**Information displayed**

- Competencies required
- Competencies covered
- Competencies with gaps
- Conflicts detected
- Interviewers represented
- Evidence items analyzed

**User actions**

- Scan metrics; drill into flags, blockers, or competency map as needed

**Why this section exists**  
Makes readiness feel measured rather than vibed. Reinforces Decision Intelligence positioning.

---

## 5. Green Flags

**Purpose**  
Surface evidence-backed positive signals that support a fair, confident decision process—without recommending hire.

**Information displayed**

- Competencies or themes with sufficient positive evidence
- Short evidence-backed statements (traceable to interviewers / rounds)
- Optional link into the related competency row in the Evidence Map

**User actions**

- Scan strengths-with-evidence
- Drill into Evidence Mapping for detail

**Why this section exists**  
Balances the dashboard: readiness is not only about blockers. Green Flags highlight where evidence is strong.

**Empty behavior**  
If none exist, omit the section or show a calm “No green flags identified from current evidence” line—never invent positives.

---

## 6. Red Flags

**Purpose**  
Surface evidence-backed risks, weak coverage, or concerning patterns that require attention before debrief—without recommending reject.

**Information displayed**

- Critical gaps, thin evidence, or concerning consistent signals grounded in notes/scores
- Short evidence-backed statements
- Suggested attention point (clarify, add evidence, or discuss in debrief)

**User actions**

- Scan risks
- Follow into Evidence Gaps, Conflicts, or Update Evidence

**Why this section exists**  
Makes material concerns visible early, distinct from full tables.

**Empty behavior**  
If none exist, show a confirmation line and continue.

**Important framing**  
Red Flags describe **evidence and process risk**, not a reject recommendation.

---

## 7. Decision Blockers

**Purpose**  
Surface insufficient evidence and interviewer conflicts that prevent a fair, confident decision.

### Evidence Gaps (Insufficient Evidence)

- Competency
- Criticality (Required / Important)
- Evidence found
- What’s missing
- Suggested next step

### Interviewer Conflicts

- Competency
- Interviewers involved
- Nature of conflict (score vs. score / score vs. notes / notes vs. notes)
- Summary of disagreement
- Suggested resolution

**User actions**

- Review blocker details
- Follow suggested next step via Update Evidence when appropriate

**Why this section exists**  
Attention first. Blockers are more decision-critical than a full table scan.

**Empty behavior**  
If no blockers exist, show a confirmation line and continue to the competency map.

---

## 8. Competency Evidence Map (Evidence Mapping)

**Purpose**  
Provide the structured working surface for hiring debriefs: evidence mapped to required competencies.

**Information displayed (table)**

- Competency
- Criticality
- Coverage status: Sufficient / Partial / Missing / Conflicting
- Evidence strength: Strong / Moderate / Weak
- Interviewers
- Score range (if available)
- Notes summary
- Blocker flag

**Expanded row (progressive disclosure)**

- JD expectation for the competency
- Evidence by interviewer (round, score, key notes, assessment lean)
- System reading (sufficient / partial / conflicting)
- Local action cue: request more evidence for this competency

**User actions**

- Expand / collapse competency rows
- Inspect interviewer-level evidence

**Why this section exists**  
This is the debrief ledger. It replaces manual consolidation across scorecards and notes.

---

## 9. Interviewer Contribution Overview

**Purpose**  
Show whether the decision rests on balanced input without becoming interviewer management.

**Information displayed**

- Interviewer
- Round / focus
- Competencies touched
- Feedback depth: High / Medium / Low
- Conflicts involved

**User actions**

- Scan for over-weighting of a single interviewer

**Why this section exists**  
Supports fairness and evidence quality questions: *Are we deciding from one loud voice?*

---

## 10. Decision Brief

**Purpose**  
Provide a concise handoff artifact for the hiring meeting.

**Information displayed**

- Readiness restatement (one sentence)
- Strengths with evidence
- Risks / open questions
- Recommended debrief agenda
- Explicit note: this brief does **not** recommend hire or reject

**User actions**

- Copy brief
- Mark Ready for Debrief

**Why this section exists**  
Turns dashboard review into something the recruiter can take into the debrief immediately.

---

## 11. Analysis Transparency

**Purpose**  
Build trust and reinforce explainable Decision Intelligence.

**Information displayed**

- Evidence sources used (JD, resume, scorecards, note sets, uploads)
- What the system did (extract competencies, map evidence, detect conflicts, score readiness, generate brief)
- What the system did **not** do (no hire recommendation, no candidate ranking)
- Limitations (based only on provided evidence; missing scorecards reduce coverage)

**User actions**

- Read for trust and calibration; no required action

**Why this section exists**  
Supports Evidence Before Opinion and reduces over-reliance on AI.

---

# User Journey

1. Visitor opens DecisionReady AI and lands on the **Landing Page**.
2. Visitor reviews the value proposition and how Decision Intelligence works, then selects **Start New Decision Analysis** *(or goes to the Decision Dashboard if returning)*.
3. Returning recruiters use the **Decision Dashboard** to open an existing Decision Analysis or create a new one.
4. On **Prepare Decision Analysis**, the recruiter enters Candidate Information and assembles evidence: Job Description (upload or paste), Resume (upload), and multiple Interviewer Feedback sections.
5. Recruiter selects **Save Draft** as needed, then **Generate Decision Intelligence** when minimum evidence is present.
6. Recruiter enters **AI Analysis in Progress** and sees structured pipeline progress (Extract Competencies → Map Evidence → Detect Interviewer Conflicts → Measure Evidence Coverage → Calculate Decision Readiness → Generate Decision Brief).
7. On success, recruiter arrives at the **Decision Intelligence Dashboard** and reviews Decision Readiness and Recommended Next Action first.
8. Recruiter inspects Competency Coverage, Green Flags, Red Flags, Evidence Gaps, Interviewer Conflicts, Evidence Mapping, and the Decision Brief.
9. If not ready, recruiter selects **Update Evidence**, revises the package on Prepare Decision Analysis, and **Re-analyzes** (again via AI Analysis in Progress).
10. When ready, recruiter selects **Mark Ready for Debrief** and uses the Decision Brief in the hiring discussion.
11. Recruiter may return to the **Decision Dashboard** to work on another Decision Analysis.

---

# Navigation Rules

### Primary navigation

- Public / first open prefers the **Landing Page**
- Landing Page primary CTA **Start New Decision Analysis** enters **Prepare Decision Analysis**
- Landing Page secondary path may enter **Decision Dashboard** for returning recruiters
- **Decision Dashboard** is the authenticated-style product home for ongoing work *(MVP may omit real auth)*
- Create / New Decision Analysis always enters **Prepare Decision Analysis**
- Successful **Generate Decision Intelligence** always enters **AI Analysis in Progress**, then **Decision Intelligence Dashboard** on success
- Opening an Analyzed or Ready-for-debrief Decision Analysis prefers **Decision Intelligence Dashboard**
- Opening a Needs Evidence / draft Decision Analysis enters **Prepare Decision Analysis**

### Back navigation

- From Prepare Decision Analysis → Decision Dashboard
- From AI Analysis in Progress → Prepare Decision Analysis only on cancel/failure paths (not while a successful result is finalizing)
- From Decision Intelligence Dashboard → Decision Dashboard
- Back navigation must not discard unsaved evidence without confirmation when edits are in progress

### Update Evidence flow

1. From Decision Intelligence Dashboard, select **Update Evidence**
2. Land on **Prepare Decision Analysis** with existing evidence loaded
3. Show stale-intelligence indicator if a prior result exists
4. Save Draft / save changes
5. Require **Generate Decision Intelligence** / **Re-analyze** (via AI Analysis in Progress) to refresh the dashboard

### Re-analysis flow

1. Available from Prepare Decision Analysis and Decision Intelligence Dashboard
2. Routes through **AI Analysis in Progress**
3. Runs analysis on the latest saved evidence
4. Supersedes the previous Decision Intelligence result (single current result per Decision Analysis)
5. Returns to **Decision Intelligence Dashboard**
6. Sets status to **Analyzed** (Ready for debrief only after explicit mark)

### Decision completion flow

1. Recruiter reviews readiness, flags, blockers, and Decision Brief
2. Selects **Mark Ready for Debrief**
3. Decision Analysis status becomes **Ready for debrief**
4. No Hire / Reject action is offered
5. Recruiter can still Update Evidence or Re-analyze later if needed

---

# UX Principles

### Decision Support, not Decision Making

The interface answers readiness and next actions. It never presents Hire or Reject as a system recommendation.

### Evidence before Opinion

Insights are structured and traceable to JD requirements, scorecards, and notes. Freeform AI chat is excluded from the MVP.

### Progressive Disclosure

The dashboard leads with verdict and blockers. Competency and interviewer detail expand on demand.

### Minimal Cognitive Load

One primary CTA per screen. Fixed information hierarchy on the Decision Intelligence Dashboard. The end-to-end journey stays focused on Decision Intelligence—not ATS breadth.

### Human-in-the-Loop

Recruiters and Hiring Managers retain ownership of the final hiring decision. Mark Ready for Debrief is a human confirmation, not an automated outcome.

### Explainable AI

AI Analysis in Progress, Analysis Transparency, and expandable evidence detail show what was evaluated, what was missing, and what the system did not do.

---

# Responsive Behavior

### Desktop

- Landing Page presents brand, value proposition, and primary CTA above the fold
- Decision Intelligence Dashboard presents the full vertical hierarchy with tables readable in-page
- Readiness verdict and next action visible without scrolling on a standard viewport
- Competency Evidence Map uses a full-width table with expandable rows
- AI Analysis in Progress shows the full pipeline stepper in a calm single column

### Tablet

- Same screen order and hierarchy; no screens removed
- Landing and Prepare forms use single-column stacking with comfortable spacing
- Dashboard cards and intelligence metrics wrap as needed

### Mobile

- Same screen order and hierarchy; no screens removed
- Landing Page CTA remains prominent and thumb-reachable
- Prepare Decision Analysis sections stack; upload targets remain large enough for touch
- AI Analysis in Progress pipeline stacks vertically with clear active/complete states
- Metrics wrap into stacked rows
- Tables shift to stacked cards or horizontally scrollable tables where needed
- Primary CTAs remain sticky or repeatedly accessible near the top and bottom of long screens
- Expandable competency detail remains usable with thumb-friendly targets

All screens in the end-to-end journey must remain usable on mobile; the product is decision support, not a desktop-only ops console.

---

# Future Navigation

Intentionally excluded from the MVP:

- Authentication / login
- ATS pipelines and stage boards
- Candidate sourcing
- Interview scheduling
- Analytics dashboards
- Settings / admin
- Notifications / inbox
- Organization / workspace switchers
- Chat / copilot panes
- Offer management
- Resume ranking
- Hire / Reject recommendations

These may be considered after the MVP proves the Decision Intelligence workflow.

---

# Document Control

| Field | Value |
|---|---|
| **Status** | Updated — End-to-end product experience |
| **Reference Documents** | `docs/00_execution_plan.md` · `docs/01_problem_discovery.md` · `docs/02_product_requirements.md` · `docs/04_design_system.md` · `docs/05_ai_architecture.md` |
| **Product** | DecisionReady AI — AI Decision Intelligence Platform |
| **End-to-end flow** | Landing Page · Decision Dashboard · Prepare Decision Analysis · AI Analysis in Progress · Decision Intelligence Dashboard |
