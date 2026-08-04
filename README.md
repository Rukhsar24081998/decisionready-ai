# DecisionReady AI

**AI-powered hiring intelligence that turns resumes, interview notes, scorecards, and hiring documents into evidence-backed Decision Readiness—never Hire or Reject.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-LLM-F55036?logo=groq&logoColor=white)](https://groq.com/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Product Workflow](#product-workflow)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Future Roadmap](#future-roadmap)
- [Limitations](#limitations)
- [Author](#author)

---

## Overview

**DecisionReady AI** is a Decision Intelligence layer for modern hiring. Recruiters and hiring managers upload the evidence they already collect—job descriptions, resumes, interview notes, scorecards, and hiring-manager notes—and the product answers one question:

> **Do we have enough evidence to make a fair and confident hiring decision?**

Traditional ATS workflows store documents and comments, but they rarely make evidence completeness, conflicts, and competency coverage legible before debrief. Teams still scroll through fragmented notes, reconcile inconsistent scorecards, and enter calibration meetings without a shared picture of what is known versus missing.

DecisionReady AI closes that gap by extracting structured signals, mapping evidence to role competencies with citations, computing **Decision Readiness** (coverage, quality, alignment, completeness), and presenting an executive dashboard, evidence explorer, recruiter copilot, and printable Decision Brief.

Hiring decisions stay with people. The product evaluates the **evidence substrate**—not whether a candidate should be hired.

---

## Features

| Capability | What it does |
|---|---|
| **Multi-document upload** | Upload JD (required), resume, interview notes, interview scorecards, and hiring-manager notes (PDF / DOCX) |
| **Candidate context** | Capture candidate name, role, department, hiring manager, and hiring stage before analysis |
| **Resume extraction** | Parse experience, skills, and candidate context from the resume |
| **Job Description analysis** | Treat the JD as the requirement authority and extract target competencies |
| **Interview notes analysis** | Extract qualitative evidence and interviewer signals from notes |
| **Interview scorecards** | Pull structured scores and comments into the evidence graph |
| **Hiring manager notes** | Include HM perspective as an evidence source when provided |
| **Evidence Graph** | Merge document-level extractions into a competency-linked evidence graph with citations |
| **Competency mapping** | Map quotes and signals to competencies without inventing evidence |
| **Decision Readiness** | Deterministic readiness score and label (Ready / Partially Ready / Not Ready) |
| **Executive Hiring Profile** | Shared candidate presentation model (company, title, location, experience, skills) |
| **Decision Intelligence Dashboard** | KPIs, scorecard, strengths, gaps, alignment, and processing summary |
| **Evidence Intelligence Matrix** | Coverage matrix across resume / interview / scorecard sources |
| **Interactive Evidence Explorer** | Search, filter, and inspect competency → quote → document mappings |
| **AI Hiring Analyst** | Recruiter copilot grounded in the uploaded package; structured answers with citations |
| **Executive Decision Brief** | Debrief-ready report with summary, strengths, gaps, discussion topics, and appendix |
| **Print report** | Browser print (`window.print`) for dashboard and Decision Brief handoff |

---

## Product Workflow

```text
Create Analysis + Context
        │
        ▼
Upload Evidence (JD · Resume · Notes · Scorecards · HM Notes)
        │
        ▼
AI Analysis Pipeline (Extract → Evidence Graph → Decision Engine)
        │
        ▼
Decision Intelligence Dashboard (Profile · Matrix · Explorer · Copilot)
        │
        ▼
Decision Brief + Print Report
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router, Turbopack), React 19, TypeScript, Base UI / shadcn-style components, Recharts, Lucide React |
| **Backend** | Next.js Route Handlers (`/api/analyses`, `/api/analyze`, `/api/copilot`); local JSON persistence under `.data/` (MVP) |
| **AI** | Groq via OpenAI-compatible client; document extractors; Evidence Graph; Decision Engine; Zod schemas; citation-aware copilot |
| **Ingestion** | pdf-parse (PDF), mammoth (DOCX) |
| **Styling** | Tailwind CSS 4; custom landing / prepare / intelligence tokens |
| **Deploy** | Standard Next.js target (e.g. Vercel); requires `GROQ_API_KEY` at runtime |

---

## Architecture

```text
Documents (PDF/DOCX)
        │
        ▼
 Document Upload  →  Extractors  →  Evidence Graph  →  Decision Engine
                                                              │
                                                              ▼
                                              Shared Candidate Presentation Model
                                                              │
                                                              ▼
                                              Presentation Layer
                                              (Dashboard · Matrix · Explorer · Copilot · Brief · Print)
```

| Layer | Responsibility |
|---|---|
| **Document Upload** | Collect context + evidence package; validate formats and required JD |
| **Extractors** | Turn raw document text into structured signals (JD, resume, interview, scorecard, HM notes) |
| **Evidence Graph** | Merge multi-source evidence with competency links and citations |
| **Decision Engine** | Compute Decision Readiness and evidence gaps deterministically |
| **Shared Candidate Presentation Model** | Normalize profile fields for dashboard + brief |
| **Presentation Layer** | Recruiter-facing intelligence UI and printable brief |

Product principle: **Decision Support, not Decision Making.**

---

## Folder Structure

```text
.
├── docs/                 # Product docs, screenshot gallery, images/
│   ├── images/
│   └── screenshots.md
├── public/               # Logo, icons, manifest
├── scripts/              # Screenshot capture helper
├── src/
│   ├── ai/               # Analyze orchestration, schemas, prompts
│   ├── app/              # (marketing) · (app) · (prepare) · api/
│   ├── components/       # landing · prepare · analysis · intelligence · brief · …
│   ├── hooks/
│   └── lib/ai/           # Provider, extractors, evidence graph, decision engine, copilot
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Running Locally

```bash
git clone https://github.com/Rukhsar24081998/decisionready-ai.git
cd decisionready-ai
npm install
cp .env.example .env.local   # add GROQ_API_KEY — see below
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run build` / `npm start` | Production build + serve |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key for Groq (Decision Intelligence + copilot) |
| `GROQ_MODEL` | No | Primary model (defaults per `.env.example`; provider may fall back if unavailable) |

```bash
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Keep secrets in `.env.local` only. `.env*` is gitignored (`.env.example` is committed).

---

## Future Roadmap

- Persistent cloud storage and multi-user auth (replace local `.data/` JSON)
- ATS connectors (Greenhouse / Lever / Ashby) for document sync
- Native PDF export (beyond browser print)
- Shareable report links with access control
- Deeper conflict resolution workflows for interviewer disagreement
- Evaluation harness for extractor + readiness regression tests
- Team workspaces and role-based permissions

---

## Limitations

- **No Hire / Reject recommendations by design** — readiness only
- **Local file-backed storage** (`.data/analyses.json`), not production multi-tenant persistence
- **No authentication / multi-user isolation** yet
- **LLM extraction quality depends on document clarity** and Groq availability
- **Share / PDF export** UI actions are partially “Coming soon”; print uses the browser print dialog
- **Not an ATS replacement** — Decision Intelligence layer only
- Screenshots and sample analyses use demo candidate packages for illustration

---

## Author

**Rukhsar Khan** — Aspiring Product Manager · AI product builds with LLMs, React, and end-to-end craft

- Live App: [decisionready-ai.vercel.app](https://decisionready-ai.vercel.app)
- Portfolio: [rukhsar-khan-portfolio.vercel.app](https://rukhsar-khan-portfolio.vercel.app)
- LinkedIn: [rukhsar-khan-1a8382120](https://www.linkedin.com/in/rukhsar-khan-1a8382120/)
- Email: [rukhsarkhan24081998@gmail.com](mailto:rukhsarkhan24081998@gmail.com)

---

Built for recruiters, hiring managers, product managers, and engineers who care about **evidence before opinion**.
