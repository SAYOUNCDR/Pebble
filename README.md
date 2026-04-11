# Manual Checklist Builder

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-orange)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![AI Service](https://img.shields.io/badge/ai-Python%20%2B%20FastAPI-009688?logo=fastapi&logoColor=white)
![Model](https://img.shields.io/badge/model-Gemma4%20(local)-4285F4?logo=google&logoColor=white)
![Retrieval](https://img.shields.io/badge/retrieval-PageIndex--style%20(vectorless)-6A5ACD)

Convert long technical manuals into actionable maintenance checklists with strict page-level grounding.

This project is a small-team workflow app built with:
- React + Vite + Tailwind (frontend)
- Node.js + Express + TypeScript (orchestration API)
- Python + FastAPI (AI pipeline)
- MongoDB + Redis (data and jobs)
- Gemma4 running locally via Docker Model Runner
- PageIndex-style vectorless retrieval pipeline (no vector DB)

## Why this project

Traditional vector-only RAG can miss procedural dependencies in long manuals.  
This system uses iterative, structure-aware retrieval (PageIndex-style) to extract maintenance tasks with citations and confidence, then lets users edit and export checklist reports.

## Core v1 features

- Team auth and workspace separation
- PDF manual upload and processing
- Async checklist generation jobs with progress states
- Checklist items labeled as `must_do` or `optional`
- Strict citation metadata for each item (manual, section, page, excerpt)
- In-app checklist editing before finalization
- PDF export of finalized checklist

## High-level flow

1. Upload PDF manual.
2. Parse and index document structure (sections + page mapping).
3. Run iterative retrieval + generation using local Gemma4.
4. Verify output for duplicates/conflicts and reject uncited items.
5. Save checklist draft, edit in UI, and export PDF.

## Planned API surface

### Public API (Node/Express)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/manuals`
- `GET /api/manuals/:manualId`
- `POST /api/manuals/:manualId/checklists/generate`
- `GET /api/jobs/:jobId`
- `GET /api/checklists/:checklistId`
- `PATCH /api/checklists/:checklistId`
- `PATCH /api/checklists/:checklistId/items/:itemId`
- `POST /api/checklists/:checklistId/export/pdf`
- `GET /api/exports/:exportId`

### Internal AI API (Python/FastAPI)
- `POST /v1/ingest`
- `POST /v1/pageindex/build`
- `POST /v1/checklist/generate`
- `POST /v1/checklist/verify`

## Workspace structure

```txt
apps/web
services/api
services/ai
packages/shared-types
infra
docs
```

## Local development status

- Monorepo scaffold is created
- TypeScript Express starter route is live at `GET /health`
- AI and frontend modules are being implemented next

## Project goals

- Improve reliability of manual-to-checklist conversion
- Ensure strict traceability with source citations
- Keep inference local-first for privacy and control
