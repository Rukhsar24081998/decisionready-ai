# DecisionReady AI

**DecisionReady AI is an AI-powered Decision Intelligence platform that transforms hiring evidence into structured, evidence-backed recruiting insights while keeping hiring decisions firmly in human hands.**

## 🚀 Live Demo

🌐 **https://decisionready-ai.vercel.app**

Experience the complete Decision Intelligence workflow—from document upload to an evidence-backed Decision Brief.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-LLM-F55036?logo=groq&logoColor=white)](https://groq.com/)

---

## Documentation

- 📄 **[Product Case Study & Engineering Handoff](./CASE_STUDY.md)** → assignment-ready case study
- 🌐 **[Live Demo](https://decisionready-ai.vercel.app)**
- 💻 **[GitHub Repository](https://github.com/Rukhsar24081998/decisionready-ai)**

---

## Table of Contents

- [Live Demo](#live-demo)
- [Documentation](#documentation)
- [Overview](#overview)
- [Current Status](#current-status)
- [Why I Built DecisionReady AI](#why-i-built-decisionready-ai)
- [Features](#features)
- [Product Workflow](#product-workflow)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [Limitations](#limitations)
- [Author](#author)

---

## Overview

**DecisionReady AI** is a Decision Intelligence layer for modern hiring. Recruiters and hiring managers upload the evidence they already collect—job descriptions, resumes, interview notes, scorecards, and hiring-manager notes—and the product answers one question:

> **Do we have enough evidence to make a fair and confident hiring decision?**

Traditional ATS workflows store documents and comments, but they rarely make evidence completeness, conflicts, and competency coverage legible before debrief. Teams still scroll through fragmented notes, reconcile inconsistent scorecards, and enter calibration meetings without a shared picture of what is known versus missing.

DecisionReady AI closes that gap by extracting structured signals, mapping evidence to role competencies with citations, computing **Decision Readiness** (coverage, quality, alignment, completeness), and presenting an executive dashboard, evidence explorer, recruiter copilot, and printable Decision Brief.

Hiring decisions stay with people. The product evaluates the **evidence substrate**—not whether a candidate should be hired.

## Current Status

**Status:** MVP (`v1.0.0`)

This project demonstrates the complete Decision Intelligence workflow from document upload through AI analysis, dashboard review, and Decision Brief generation. It is designed as a product prototype that shows the end-to-end concept clearly, not as a production ATS.

## Why I Built DecisionReady AI

Recruiters already have most of the evidence they need: resumes, interview notes, scorecards, and hiring-manager feedback.
The real challenge is not collecting more inputs, but turning fragmented hiring evidence into something coherent before debrief.
DecisionReady AI explores how AI can help synthesize that evidence into a Decision Intelligence layer.
Instead of replacing recruiters or hiring managers, it focuses on making evidence coverage, strength, and gaps visible.
The goal is to support more structured, evidence-backed hiring discussions.
It is a product exploration of how AI can improve decision readiness while keeping final judgment human.

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
| **Backend** | Next.js Route Handlers (`/api/analyses`, `/api/analyze`, `/api/copilot`) |
| **Persistence** | Local JSON (`.data/`) in development; **Vercel Blob** in production when `BLOB_READ_WRITE_TOKEN` is set |
| **AI** | Groq via OpenAI-compatible client; document extractors; Evidence Graph; Decision Engine; Zod schemas; citation-aware copilot |
| **Ingestion** | pdf-parse (PDF), mammoth (DOCX) |
| **Styling** | Tailwind CSS 4; custom landing / prepare / intelligence tokens |
| **Deploy** | Vercel; requires `GROQ_API_KEY` (and Blob token for durable cross-instance storage) |

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
| **Persistence** | Local JSON for development; Vercel Blob for production durability across serverless instances |

Product principle: **Decision Support, not Decision Making.**

---

## Folder Structure

```text
.
├── CASE_STUDY.md   # Product Case Study & Engineering Handoff
├── docs/           # Product docs, images, supporting documentation
├── public/         # Static assets
├── scripts/        # Local utilities and helpers
├── src/
│   ├── ai/         # Analysis orchestration, schemas, prompts
│   ├── app/        # App Router pages and API routes
│   ├── components/ # UI and product surfaces
│   ├── hooks/      # Shared React hooks
│   └── lib/        # AI, ingestion, utilities, shared logic
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
| `BLOB_READ_WRITE_TOKEN` | Production | Persistent storage for production deployments using Vercel Blob |

```bash
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx
```

**Persistence behavior**

- **Development:** uses the local JSON store under `.data/` (fallback when no Blob token is set).
- **Production:** automatically uses **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is configured, so analyses persist across serverless instances.
- Local storage remains the fallback for local development.

Keep secrets in `.env.local` only. `.env*` is gitignored (`.env.example` is committed).

---

## Roadmap

- Multi-user auth and role-based access
- ATS connectors (Greenhouse / Lever / Ashby) for document sync
- Native PDF export (beyond browser print)
- Shareable report links with access control
- Deeper conflict resolution workflows for interviewer disagreement
- Evaluation harness for extractor + readiness regression tests
- Team workspaces and permissions

---

## Limitations

- **Intentionally avoids automated Hire/Reject recommendations.** DecisionReady AI supports evidence-based hiring discussions rather than replacing human judgment.
- **No authentication / multi-user isolation** yet (demo MVP)
- **LLM extraction quality depends on document clarity** and Groq availability
- **Share / PDF export** UI actions are partially “Coming soon”; print uses the browser print dialog
- **Not an ATS replacement** — Decision Intelligence layer only
- Screenshots and sample analyses use demo candidate packages for illustration

---

## Author

**Rukhsar Khan** — Aspiring Product Manager · AI product builds with LLMs, React, and end-to-end craft

- Live App: [decisionready-ai.vercel.app](https://decisionready-ai.vercel.app)
- Case Study: [CASE_STUDY.md](./CASE_STUDY.md)
- Portfolio: [rukhsar-khan-portfolio.vercel.app](https://rukhsar-khan-portfolio.vercel.app)
- LinkedIn: [rukhsar-khan-1a8382120](https://www.linkedin.com/in/rukhsar-khan-1a8382120/)
- Email: [rukhsarkhan24081998@gmail.com](mailto:rukhsarkhan24081998@gmail.com)

---

Built for recruiters, hiring managers, product managers, and engineers who care about **evidence before opinion**.
