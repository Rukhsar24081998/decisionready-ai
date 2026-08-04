# Product Requirements Document (PRD)

## Project

**DecisionReady AI**

**Tagline:**  
AI Decision Intelligence for Modern Hiring

---

## 1. Product Overview

DecisionReady AI is an AI-powered **Decision Intelligence Platform** for modern hiring. It works alongside existing Applicant Tracking Systems (ATS) and focuses exclusively on the post-interview decision stage.

ATS platforms collect and organize hiring data. Recruiters still manually synthesize fragmented interview feedback, resolve conflicting opinions, and judge whether enough evidence exists to decide. That process slows hiring, introduces inconsistency, and increases the risk of decisions based on incomplete evidence.

DecisionReady AI analyzes existing hiring evidence—job description, candidate resume, interview scorecards, and interviewer feedback—to determine whether the hiring team has **sufficient, reliable, and complete evidence** to make a fair and confident hiring decision.

The system provides structured decision support by:

- Extracting required competencies from the job description
- Mapping interview evidence to each competency
- Detecting conflicting interviewer opinions
- Identifying competencies with insufficient evidence
- Measuring overall decision readiness
- Recommending the next best hiring action

DecisionReady AI does **not** replace an ATS and does **not** recommend Hire or Reject.

It answers one question:

> **Do we have enough evidence to make a fair and confident hiring decision?**

---

## 2. Product Goals

### Business Goals

| Goal | MVP target |
|---|---|
| Prove the Decision Intelligence product thesis | Reviewers can distinguish DecisionReady AI from an ATS or chatbot within the first screen of the Decision Intelligence Dashboard |
| Deliver a demo-ready end-to-end MVP | Complete recruiter journey: open app → assemble evidence → receive decision intelligence |
| Establish a durable analysis contract | Typed `DecisionIntelligence` output usable by UI today and real AI providers later |
| Enable portfolio and engineering handoff | Documentation, deployable app, and clear integration points |

### User Goals

| User | Goal |
|---|---|
| Technical Recruiter | Reduce time spent manually consolidating interview feedback before a hiring debrief |
| Technical Recruiter | Know whether required competencies are covered, conflicting, or missing |
| Technical Recruiter | Receive a clear next best action before facilitating the hiring discussion |
| Hiring Manager | Enter debriefs with a concise, evidence-backed view of readiness, strengths with evidence, and open risks |

---

## Product Principles

### 1. Decision Support, Not Decision Making

DecisionReady AI helps hiring teams determine whether enough evidence exists to make a confident hiring decision. It never recommends hiring or rejecting a candidate.

### 2. AI as a Decision Intelligence Layer

The platform complements existing ATS systems rather than replacing them. DecisionReady AI operates as an AI-powered Decision Intelligence Layer on top of hiring evidence already collected elsewhere.

### 3. Evidence Before Opinion

Every insight should be traceable to interview evidence instead of unsupported AI reasoning. Structured outputs must map back to scorecards, notes, and role requirements.

### 4. Human-in-the-Loop

Recruiters and Hiring Managers always retain ownership of the final hiring decision. DecisionReady AI informs readiness and next actions; people decide outcomes.

### 5. Simplicity Over Complexity

The MVP focuses exclusively on the post-interview decision workflow. Features outside that workflow remain out of scope.

---

## 3. Target Users

### Primary User

**Technical Recruiter**

Responsible for managing hiring pipelines, coordinating interviews, collecting interviewer feedback, facilitating hiring discussions, and driving final hiring decisions.

**Pain points**

- Interview feedback is scattered across multiple scorecards and notes
- Interviewers evaluate candidates differently and at uneven levels of detail
- Recruiters manually compare feedback before every hiring discussion
- It is difficult to determine whether all required competencies have been evaluated

### Secondary User

**Hiring Manager**

Responsible for making the final hiring decision.

**Needs**

- A clear understanding of candidate strengths and weaknesses grounded in evidence
- Confidence that critical competencies have been evaluated
- Faster, evidence-backed hiring decisions

Hiring managers primarily consume the Decision Intelligence Dashboard and Decision Brief; they are not the primary operators of evidence intake in the MVP.

---

## 4. MVP Scope

### In Scope

- Three-screen recruiter journey:
  1. **Decision Dashboard** — list and open post-interview Decision Analyses
  2. **New Decision Analysis** — capture job description, resume, and interview feedback/scorecards
  3. **Decision Intelligence Dashboard** — readiness, competency coverage, evidence mapping, conflicts, gaps, next best action, decision brief, and analysis transparency
- Structured decision intelligence outputs (not freeform chat)
- Mock analysis pipeline with typed contracts ready for OpenAI/Groq integration
- Decision Analysis statuses: Needs evidence · Analyzed · Ready for debrief
- Modern, minimal SaaS UI (Ashby / Linear / Stripe–inspired)
- Mobile-responsive layout
- Seeded demo Decision Analyses representing Ready / Partially Ready / Not Ready outcomes
- Product documentation for discovery, execution, and requirements

### Out of Scope

- ATS functionality (pipeline stages, requisition management, offer workflows)
- Candidate sourcing
- Interview scheduling
- Authentication and multi-tenancy
- Email automation and interviewer reminders
- Offer management
- Automated resume parsing pipelines
- Real ATS integrations / webhooks
- Hire / Reject recommendations
- AI chatbot interface
- Production database and background job infrastructure
- Billing, admin consoles, and organization settings
- Real-time multi-user collaboration

---

## 5. Core User Journey

1. Recruiter opens the application and lands on the **Decision Dashboard**.
2. Recruiter creates a new Decision Analysis or opens an existing one.
3. Recruiter enters analysis identity (candidate name and role/requisition title).
4. Recruiter pastes the **job description**, **resume**, and one or more **interview feedback/scorecard** entries.
5. Recruiter saves the evidence package and selects **Generate Decision Intelligence**.
6. The system analyzes the evidence and produces a structured Decision Intelligence result.
7. Recruiter is taken to the **Decision Intelligence Dashboard**.
8. Recruiter reviews decision readiness, next best action, evidence health, blockers, competency coverage, interviewer contribution, and the decision brief.
9. If not ready, recruiter selects **Update Evidence**, adds or corrects feedback, and **re-analyzes**.
10. If ready, recruiter marks the Decision Analysis **Ready for Debrief** and uses the Decision Brief in the hiring discussion.

---

## 6. Functional Requirements

### FR-1 Create Decision Analysis

**Description**  
Allow a recruiter to create a new Decision Analysis for a post-interview candidate evaluation.

**Inputs**

- Candidate name
- Role / requisition title

**Outputs**

- A new Decision Analysis with unique ID
- Initial status: Needs evidence
- Navigation to New Decision Analysis

**Acceptance Criteria**

- Recruiter can create a Decision Analysis with candidate name and role
- Decision Analysis appears on the Decision Dashboard after creation
- Decision Analysis opens in the evidence preparation view
- Required identity fields cannot be empty

---

### FR-2 Manage Decision Analyses

**Description**  
Allow a recruiter to view and open existing Decision Analyses from the Decision Dashboard.

**Inputs**

- Existing Decision Analyses from the store/seed data
- User selection of a Decision Analysis

**Outputs**

- List of Decision Analyses with candidate name, role, status, and last updated timestamp
- Empty state when no Decision Analyses exist
- Navigation to New Decision Analysis or Decision Intelligence Dashboard (when analysis exists)

**Acceptance Criteria**

- Decision Dashboard shows all available Decision Analyses
- Status badges reflect Needs evidence / Analyzed / Ready for debrief
- Selecting a Decision Analysis opens the correct next screen based on analysis state
- Empty state provides a clear CTA to create a new Decision Analysis

---

### FR-3 Generate Decision Intelligence

**Description**  
Analyze the Decision Analysis evidence package and produce a structured Decision Intelligence result.

**Inputs**

- Job description (text)
- Candidate resume (text)
- Interview feedback / scorecards (interviewer, round, scores, qualitative notes)

**Outputs**

- Structured `DecisionIntelligence` object including:
  - Decision readiness label and score
  - Competency coverage
  - Evidence mapping
  - Interviewer conflicts
  - Missing / insufficient competencies
  - Next best hiring action
  - Decision brief content
  - Analysis transparency metadata
- Decision Analysis status updated to Analyzed
- Navigation to Decision Intelligence Dashboard

**Acceptance Criteria**

- Generate is blocked or clearly warned when minimum evidence is missing (at least JD + one feedback entry)
- Analysis returns structured fields consumed by the Decision Intelligence Dashboard (not freeform chat)
- Result is persisted on the Decision Analysis for later viewing
- DecisionReady AI does not output Hire or Reject recommendations
- Analysis runs through a stable interface that can later call OpenAI/Groq

---

### FR-4 View Decision Readiness

**Description**  
Display the primary decision readiness verdict and supporting health metrics on the Decision Intelligence Dashboard.

**Inputs**

- Persisted Decision Intelligence result for the Decision Analysis

**Outputs**

- Page identity (candidate, role, evidence last updated, analysis timestamp)
- Readiness status: Ready / Partially Ready / Not Ready
- Readiness score
- One-line verdict
- Confidence note for the readiness assessment (evidence coverage quality—not hire confidence)
- Evidence Health Summary metrics (competencies required/covered/gaps, conflicts, interviewers, evidence items)
- Recommended Next Action with rationale

**Acceptance Criteria**

- Readiness verdict is visible without scrolling on a standard desktop viewport
- Decision Intelligence Dashboard framing answers readiness, not hire/reject
- Next best action is explicit and actionable
- Health metrics match the underlying analysis result

---

### FR-5 Review Competency Evidence

**Description**  
Allow recruiters to review how interview evidence maps to competencies extracted from the job description.

**Inputs**

- Competency assessments from Decision Intelligence
- Optional row expansion for a selected competency

**Outputs**

- Competency Evidence Map table with:
  - Competency name
  - Criticality
  - Coverage status (Sufficient / Partial / Missing / Conflicting)
  - Evidence strength
  - Interviewers
  - Score range (if available)
  - Notes summary
  - Blocker flag
- Expanded evidence detail per interviewer (round, score, notes, assessment lean, system reading)

**Acceptance Criteria**

- All extracted competencies are listed
- Coverage status is visible per competency
- Expanding a row reveals interviewer-level evidence
- Empty or weak evidence is visible as Partial or Missing—not hidden

---

### FR-6 Identify Decision Blockers

**Description**  
Surface insufficient evidence and interviewer conflicts that prevent a fair, confident decision.

**Inputs**

- Evidence gaps and conflicts from Decision Intelligence

**Outputs**

- Insufficient Evidence list/table: competency, criticality, evidence found, what’s missing, suggested next step
- Interviewer Conflicts list/table: competency, interviewers involved, conflict nature, disagreement summary, suggested resolution
- Empty states when no gaps or conflicts exist

**Acceptance Criteria**

- Blockers appear above the full competency map when present
- Critical gaps and material conflicts are prioritized
- Each blocker includes a suggested next step or resolution
- Absence of blockers shows a clear confirmation state

---

### FR-7 View Decision Brief

**Description**  
Provide a concise, structured handoff artifact for the hiring debrief.

**Inputs**

- Decision Intelligence result

**Outputs**

- Readiness restatement (one sentence)
- Strengths with evidence (only competencies with sufficient positive evidence)
- Risks / open questions (gaps and conflicts only)
- Recommended debrief agenda (derived from blockers and weak coverage)
- Explicit note that the brief does not recommend hire or reject
- Optional copy action for the brief

**Acceptance Criteria**

- Brief is scannable and suitable for meeting use
- Brief contains no Hire/Reject recommendation
- Content is derived from structured analysis fields
- Recruiter can mark the Decision Analysis Ready for Debrief from this context or the primary CTA zone

---

### FR-8 Update Evidence

**Description**  
Allow the recruiter to return from the Decision Intelligence Dashboard and modify the evidence package.

**Inputs**

- Existing Decision Analysis evidence
- Updated JD, resume, and/or interview feedback entries

**Outputs**

- Updated saved evidence package
- Decision Analysis remains linked to prior intelligence until re-analyzed (or analysis is marked stale)

**Acceptance Criteria**

- Update Evidence navigates from the Decision Intelligence Dashboard to New Decision Analysis
- Existing evidence is editable and persistable
- Recruiter can add, edit, or remove interview feedback entries
- UI indicates that intelligence may be outdated until re-analysis

---

### FR-9 Re-analyze Candidate

**Description**  
Re-run decision intelligence after evidence has changed.

**Inputs**

- Updated evidence package for the Decision Analysis

**Outputs**

- New Decision Intelligence result replacing the previous analysis
- Updated readiness, blockers, competency map, brief, and next action
- Updated analysis timestamp

**Acceptance Criteria**

- Re-analyze is available from New Decision Analysis and the Decision Intelligence Dashboard
- New result reflects the latest evidence
- Previous intelligence is superseded (single current result per Decision Analysis for MVP)
- Decision Analysis status returns to Analyzed (or Ready for debrief only after explicit mark)

---

## 7. Non-Functional Requirements

### Performance

- Decision Dashboard and Decision Analysis views should load within **2 seconds** under normal local/demo conditions
- Mock analysis should complete within **3 seconds**
- If live AI is enabled later, the UI must show a clear analyzing state; target completion under **15 seconds** for MVP-sized evidence packages

### Reliability

- Analysis failures must surface a recoverable error state without corrupting saved evidence
- Mock analyzer must remain available as a fallback when AI credentials are absent
- Seeded demo Decision Analyses must load consistently for walkthroughs

### Security

- No authentication in MVP; treat as a single-user local/demo application
- Do not log or expose API keys in the client
- Do not claim production-grade data protection in MVP documentation
- Avoid storing secrets in the repository

### Usability

- Primary actions must be obvious on each screen (Create Decision Analysis, Generate Decision Intelligence, Update Evidence / Ready for Debrief)
- Information hierarchy on the Decision Intelligence Dashboard must prioritize verdict → next action → blockers → evidence detail
- Empty, loading, and error states are required for core flows
- Product language must reinforce DecisionReady AI as a Decision Intelligence Platform, not an ATS or chatbot

### Accessibility

- Semantic headings and labels for primary forms and tables
- Keyboard-accessible primary actions and expandable competency rows
- Sufficient color contrast for status badges and text
- Do not rely on color alone to communicate Ready / Partially Ready / Not Ready

### Scalability

- Architecture must keep analysis behind a single interface (`analyzeCase`) so providers can change without UI rewrites
- Domain types must be centralized for future persistence and ATS ingestion
- MVP may use mock/in-memory persistence; design should not hard-code UI to mock-only shapes

---

## 8. Success Metrics

MVP success is measured qualitatively in demo and review, with quantitative targets defined for post-MVP validation.

| Metric | MVP signal | Post-MVP KPI direction |
|---|---|---|
| Recruiter review time | Recruiter reaches a readiness judgment without manual note consolidation in the demo flow | Reduction in time-to-debrief-prep |
| Debrief preparation speed | Decision Brief is usable as the meeting agenda in walkthrough | Faster hiring debrief preparation |
| Evidence completeness | Gaps and missing competencies are explicitly surfaced before decision | Improved evidence completeness before final decision |
| Evaluation consistency | Conflicts and uneven interviewer coverage are visible on the Decision Intelligence Dashboard | Improved evaluation consistency across interview panels |
| Product clarity | Reviewers identify DecisionReady AI as a Decision Intelligence Platform (not ATS/chat) | Higher concept comprehension in user tests |
| Decision readiness usefulness | Next best action is judged actionable by reviewers | Higher “ready to facilitate debrief” confidence scores |

**MVP release bar (from execution plan)**

1. End-to-end journey works without external explanation beyond the UI  
2. Decision Intelligence Dashboard answers readiness, not hire/reject  
3. Outputs include coverage, mapping, conflicts, gaps, and next action  
4. Analysis uses a stable typed contract  
5. App is deployable and responsive  

---

## North Star Metric

### Primary Metric

Percentage of hiring decisions that are considered **Decision Ready** before entering the hiring debrief.

### Supporting Metrics

- Average recruiter review time
- Competency coverage percentage
- Evidence completeness score
- Decision blocker count
- Interviewer conflict rate
- Time to hiring debrief

---

## 9. Risks & Assumptions

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Model hallucinations** (if AI enabled) | False coverage, invented conflicts, misleading readiness | Structured output schema; Analysis Transparency section; mock-first path; no hire/reject claims |
| **Interviewer bias encoded in feedback** | Intelligence may reflect biased notes as “evidence” | Frame output as evidence quality/readiness, not candidate worth; surface conflicts rather than averaging them away |
| **Missing interview feedback** | Incomplete analysis or false “ready” signal | Require minimum evidence; mark Missing/Partial explicitly; recommend next action to collect evidence |
| **Incomplete or low-quality evidence** | Weak intelligence, low trust | Evidence strength labels; readiness confidence note; blockers prioritized above full tables |
| **Over-reliance on AI** | Teams treat readiness as a hiring decision | Explicit product copy: no hire/reject; brief states limitations; transparency footer; human-in-the-loop principle |
| **Scope creep into ATS features** | Diluted MVP, missed sprint outcomes | Freeze to three screens and out-of-scope list |
| **Ambiguous readiness scoring** | Stakeholder debate over metrics | Simple, documented scoring rules in Analysis Transparency |

### Assumptions

- Recruiters can paste JD, resume, and feedback text from their existing ATS or documents
- Interview feedback includes enough structure (interviewer identity + notes and/or scores) to map to competencies
- Hiring decisions remain human-owned; DecisionReady AI only assesses decision readiness
- Mock analysis is acceptable for MVP demonstration if contracts match the future AI path
- Authentication is unnecessary for the assignment/demo environment

---

## 10. Future Enhancements

Intentionally postponed beyond MVP:

- ATS integrations (Greenhouse, Ashby, Lever, etc.)
- Automated resume parsing
- Interview scheduling
- Authentication and role-based access
- Multi-tenant / workspace support
- Real-time collaboration on debriefs
- Email/Slack interviewer follow-ups for missing evidence
- Analytics on readiness trends across roles and teams
- Production database and asynchronous analysis jobs
- Calibration of readiness scoring against historical hiring outcomes
- Offer management and post-decision workflows

---

## Document Control

| Field | Value |
|---|---|
| Status | Approved for MVP implementation |
| Sources of truth | `docs/00_execution_plan.md`, `docs/01_problem_discovery.md` |
| Product principles | Decision support, not decision making; AI as a Decision Intelligence Layer; evidence before opinion; human-in-the-loop; simplicity over complexity |
