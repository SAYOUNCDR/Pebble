# Manual Checklist Builder

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-orange)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![AI Service](https://img.shields.io/badge/ai-Python%20%2B%20FastAPI-009688?logo=fastapi&logoColor=white)
![Model](<https://img.shields.io/badge/model-Gemma4%20(local)-4285F4?logo=google&logoColor=white>)
![Retrieval](<https://img.shields.io/badge/retrieval-PageIndex--style%20(vectorless)-6A5ACD>)

Convert long technical manuals into actionable maintenance checklists with strict, page-level evidence.

## Overview

This repository contains a multi-service MVP for manual-to-checklist generation.

- Frontend: React + Vite UI for running the AI pipeline
- API service: Node.js + Express + TypeScript orchestration layer
- AI service: Python + FastAPI pipeline for ingest, indexing, generation, and verification
- Local LLM: Gemma4 served via OpenAI-compatible endpoint
- Retrieval: Local heuristic indexing or PageIndex tree indexing (selectable)

## Why This Exists

Vector-only RAG can miss procedural dependencies in long, structured manuals. This project uses structure-aware retrieval to improve grounding and traceability.

Expected outcomes:

- Better section-level retrieval on long documents
- Checklist items with evidence metadata
- Strict verification and rejection of weakly grounded items

## Current Capabilities

- PDF ingest and page extraction
- Index build with provider selection:
  - local: heuristic section extraction
  - pageindex: cloud tree indexing
- Checklist generation with retrieval mode selection:
  - heuristic
  - tree_search
- Optional expert routing rules for tree search prompts
- Checklist verification with citation checks
- Frontend console to execute the full pipeline end to end

## System Architecture

### Frontend (apps/web)

- Runs on Vite
- Calls FastAPI endpoints directly
- Exposes controls for:
  - index provider (local or pageindex)
  - force rebuild for PageIndex
  - retrieval mode (heuristic or tree_search)
  - optional expert rules

### API Service (services/api)

- Express service scaffold exists and runs independently
- Intended to orchestrate auth, jobs, teams, exports, and persistence workflows

### AI Service (services/ai)

- FastAPI app with endpoints:
  - GET /health
  - POST /v1/ingest
  - POST /v1/pageindex/build
  - POST /v1/checklist/generate
  - POST /v1/checklist/verify
- Uses local Gemma4-compatible chat endpoint via DMR_BASE_URL and DMR_MODEL
- Uses PageIndex SDK when installed, with HTTP fallback behavior in code

## Repository Layout

```txt
apps/
	web/
services/
	api/
	ai/
packages/
	shared-types/
infra/
docs/
test_manuals/
```

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+
- pip
- A local OpenAI-compatible LLM endpoint for Gemma4 (default: http://localhost:12434/engines/v1)
- Optional: PageIndex API key for pageindex provider mode

## Environment Setup

### Frontend env

Create apps/web/.env from apps/web/.env.example:

```env
VITE_AI_BASE_URL=http://localhost:8001
```

### AI env

Create services/ai/.env from services/ai/.env.example and set values:

```env
APP_NAME=manual-checklist-ai
APP_ENV=development
APP_PORT=8001
DMR_BASE_URL=http://localhost:12434/engines/v1
DMR_MODEL=ai/gemma4:4B-Q4_K_XL
REQUEST_TIMEOUT_SECONDS=90
STRICT_CITATIONS_DEFAULT=true
STORAGE_ROOT=./storage
PAGEINDEX_BASE_URL=https://api.pageindex.ai
PAGEINDEX_API_KEY=
PAGEINDEX_POLL_INTERVAL_SECONDS=5
PAGEINDEX_POLL_TIMEOUT_SECONDS=240
```

Notes:

- Leave PAGEINDEX_API_KEY empty if you only use local indexing.
- Add your key to enable pageindex provider mode.

## Install

### Web

```bash
cd apps/web
npm install
```

### API

```bash
cd services/api
npm install
```

### AI

```bash
cd services/ai
pip install -r requirements.txt
```

Optional PageIndex SDK install:

```bash
pip install pageindex
```

## Run Locally

Run each service in a separate terminal.

### Start AI service

```bash
cd services/ai
uvicorn app.main:app --reload --port 8001
```

### Start web app

```bash
cd apps/web
npm run dev
```

### Start API service (optional in current direct-wiring flow)

```bash
cd services/api
npm run dev
```

## Pipeline Usage (UI)

1. Open web app.
2. Run Step 1 Ingest with manual ID and PDF absolute path.
3. Run Step 2 Build Index and choose provider:
   - local for heuristic sections
   - pageindex for cloud tree indexing
4. Run Step 3 Generate Checklist and choose retrieval mode.
5. Run Step 4 Verify Checklist.

## API Reference

### AI service

- GET /health
- POST /v1/ingest
- POST /v1/pageindex/build
- POST /v1/checklist/generate
- POST /v1/checklist/verify

### Planned orchestration API (services/api)

- POST /api/auth/register
- POST /api/auth/login
- POST /api/manuals
- GET /api/manuals/:manualId
- POST /api/manuals/:manualId/checklists/generate
- GET /api/jobs/:jobId
- GET /api/checklists/:checklistId
- PATCH /api/checklists/:checklistId
- PATCH /api/checklists/:checklistId/items/:itemId
- POST /api/checklists/:checklistId/export/pdf
- GET /api/exports/:exportId

## Development Notes

- Current UI is intentionally wired directly to FastAPI for rapid iteration.
- services/api is present and can be developed as the long-term orchestrator.
- Storage artifacts are saved under services/ai/storage.

## Security Notes

- Never commit real API keys.
- If any key was exposed, rotate it immediately.
- Keep manual files and generated artifacts scoped to trusted environments.

## Roadmap

- Complete API orchestration integration between web and services/api
- Add auth and team scoping end to end
- Add job queue-backed async generation
- Add export UX and report templates
- Expand tests across AI pipeline and API modules
