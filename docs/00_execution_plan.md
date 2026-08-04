# Execution Plan

## Project

**DecisionReady AI**  
*5-Day AI Product Sprint*

---

# Project Objective

Build a production-quality MVP of **DecisionReady AI** — an AI-powered Decision Intelligence Layer for modern hiring.

The product helps recruiters and hiring managers determine whether they have **sufficient, reliable, and complete interview evidence** to make a fair and confident hiring decision.

DecisionReady AI does **not** replace an ATS. It does **not** recommend Hire or Reject.

It answers one question:

> **Do we have enough evidence to make a fair and confident hiring decision?**

---

# MVP Scope

## In Scope

- Three-screen recruiter journey:
  1. **Decision Cases** — list and open post-interview decision cases
  2. **Prepare Decision Case** — capture job description, resume, and interview feedback/scorecards
  3. **Decision Intelligence Dashboard** — decision readiness, competency coverage, evidence mapping, conflicts, gaps, and next best action
- Structured decision intelligence outputs (not freeform chat)
- Mock analysis pipeline with typed contracts ready for real AI integration
- Modern, minimal SaaS UI (Ashby / Linear / Stripe–inspired)
- Mobile-responsive layout
- Product documentation suitable for a production-grade repository
- Demo-ready end-to-end flow

## Out of Scope

- ATS replacement (sourcing, pipeline stages, scheduling, offer management)
- Authentication and multi-tenancy
- Automated resume parsing pipelines
- Real ATS integrations / webhooks
- Hire / Reject recommendations
- AI chatbot interface
- Production database and background job infrastructure
- Billing, admin consoles, and organization settings

---

# Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Language | TypeScript |
| Styling | TailwindCSS |
| Components | shadcn/ui |
| AI (later phase) | OpenAI / Groq |
| Hosting | Vercel |

---

# Development Phases

## Phase 1 — Foundation

Establish the application scaffold and shared system.

- Initialize Next.js 15 + TypeScript + TailwindCSS
- Configure shadcn/ui and base design tokens
- Define domain types (`DecisionCase`, evidence models, `DecisionIntelligence`)
- Set up App Router routes aligned to the approved information architecture
- Implement `AppShell`, `PageHeader`, and core reusable UI primitives
- Add mock data store and seed cases

**Exit criteria:** App runs locally; navigation between empty screen shells works.

---

## Phase 2 — Decision Cases (Screen 1)

Ship the product entry point.

- Decision Cases list with status badges
- Empty state and seeded demo cases
- Create / open case navigation
- Case status model: Needs evidence · Analyzed · Ready for debrief

**Exit criteria:** Recruiter can open the app and enter a case workflow.

---

## Phase 3 — Prepare Decision Case (Screen 2)

Ship the evidence intake workspace.

- Case identity (candidate + role)
- Inputs for job description, resume, and interview feedback/scorecards
- Save case evidence to mock store
- Primary CTA: **Generate Decision Intelligence**

**Exit criteria:** A complete evidence package can be assembled and submitted for analysis.

---

## Phase 4 — Decision Intelligence Dashboard (Screen 3)

Ship the core product moment.

Information hierarchy:

1. Page identity + readiness status
2. Decision Readiness Verdict
3. Recommended Next Action
4. Evidence Health Summary
5. Decision Blockers (gaps + conflicts)
6. Competency Evidence Map (expandable evidence detail)
7. Interviewer Contribution Overview
8. Decision Brief
9. Analysis Transparency

**Exit criteria:** Dashboard clearly communicates Decision Intelligence (not ATS, not chatbot) and supports debrief handoff.

---

## Phase 5 — Decision Analysis Engine

Connect evidence to structured intelligence.

- Implement `analyzeCase()` behind a stable interface
- Deterministic mock analyzer producing readiness, coverage, conflicts, gaps, and next action
- Wire `POST /api/cases/[caseId]/analyze`
- Persist analysis results on the case for Screen 3 consumption
- Leave clear integration points for OpenAI/Groq without UI rewrites

**Exit criteria:** End-to-end flow works: evidence → analyze → intelligence dashboard.

---

## Phase 6 — AI Integration (Stretch / Partial)

Introduce real model inference if timeline allows; otherwise document the path.

- Structured output schema matching `DecisionIntelligence`
- Prompt / tool strategy for competency extraction and evidence mapping
- Fallback to mock analyzer when API keys are absent
- Document AI workflow, limitations, and evaluation approach

**Exit criteria:** Either live AI path works with graceful fallback, or handoff docs fully specify how to enable it.

---

## Phase 7 — Testing, Polish & Engineering Handoff

Make the MVP demo- and review-ready.

- Responsive QA across desktop and mobile
- Empty, loading, and error states
- Copy and information hierarchy polish on Screen 3
- Product docs (discovery, execution, IA/architecture notes as needed)
- Engineering handoff notes (structure, contracts, next steps)
- Demo script + short demo video

**Exit criteria:** A reviewer can run, understand, and demo the product without tribal knowledge.

---

# Deliverables

| Deliverable | Description |
|---|---|
| **Working MVP** | Deployable Next.js app with the complete 3-screen recruiter journey |
| **Product Documentation** | Discovery and execution docs in `docs/` |
| **AI Workflow** | Documented analysis contract + mock path; optional live model integration |
| **Evaluation** | Clear success criteria and qualitative demo checklist for decision intelligence quality |
| **Engineering Handoff** | Architecture, domain types, integration points, and recommended next steps |
| **Demo Video** | Short walkthrough of evidence → readiness → next action |

---

# Project Timeline

| Day | Focus | Outcomes |
|---|---|---|
| **Day 1** | Foundation + Screen 1 | Project scaffold, types, mock store, Decision Cases list |
| **Day 2** | Screen 2 | Prepare Decision Case evidence workspace + save/create flow |
| **Day 3** | Screen 3 (UI) | Decision Intelligence Dashboard information hierarchy implemented with fixtures |
| **Day 4** | Analysis engine + wiring | Mock analyzer, API routes, end-to-end Generate Intelligence flow; begin AI stretch if ahead |
| **Day 5** | Polish, docs, demo | Responsive QA, documentation, handoff, demo video; deploy to Vercel |

---

# Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Scope creep into ATS features** | Dilutes core value; burns sprint time | Strict out-of-scope list; freeze to 3 screens |
| **Screen 3 information overload** | Dashboard feels noisy; product thesis unclear | Ship hierarchy in fixed order; prioritize verdict + next action + blockers |
| **AI quality / latency if integrated early** | Unreliable demo; blocked UI work | Mock-first analyzer; typed contracts; AI as swap-in Phase 6 |
| **Weak demo data** | Intelligence looks generic or empty | Seed 3 realistic cases (Ready / Partial / Not Ready) |
| **Ambiguous “readiness” scoring** | Stakeholders debate metrics instead of value | Keep scoring rules simple, transparent, and documented in Analysis Transparency |
| **Timeline slip on polish** | MVP works but feels unfinished | Time-box AI stretch; protect Day 5 for demo readiness |

---

# Success Criteria

The MVP is successful when all of the following are true:

1. A recruiter can move from **opening the app → assembling evidence → receiving decision intelligence** without explanation beyond the UI.
2. The Decision Intelligence Dashboard answers **decision readiness**, not hire/reject.
3. Outputs include **competency coverage, evidence mapping, conflict detection, missing competencies, and next best action**.
4. The product is visually and structurally recognizable as a **Decision Intelligence Platform** (not an ATS or chatbot).
5. Analysis is produced through a **stable typed contract** that can later call OpenAI/Groq without redesigning screens.
6. Documentation and demo artifacts are sufficient for **portfolio review and engineering handoff**.
7. The app is deployable on **Vercel** and usable on desktop and mobile viewports.

---

# Guiding Principle

> Prefer a sharp, demoable Decision Intelligence experience over a broad hiring suite.

Every implementation choice should reinforce the core question: **Are we ready to decide?**
