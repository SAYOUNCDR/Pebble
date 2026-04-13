# Pebble: High-Precision Manual Checklist Builder

![Status](https://img.shields.io/badge/status-active%20development-orange)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![AI Service](https://img.shields.io/badge/ai-Python%20%2B%20FastAPI-009688?logo=fastapi&logoColor=white)
![Queue](https://img.shields.io/badge/queue-BullMQ-red)
![Data](https://img.shields.io/badge/data-MongoDB%20%2B%20Redis-4EA94B)

Don\'t just search your manuals. Reason through them.

Pebble is a local-first tool that converts dense technical manuals into actionable maintenance checklists using a PageIndex-style vectorless pipeline.

## Core Idea

Traditional vector-only RAG can miss procedural dependencies in technical docs. Pebble focuses on structural navigation and grounding:

1. Understand document hierarchy.
2. Navigate sections with reasoning.
3. Generate checklist tasks with strict citation requirements.

## Architecture

Pebble runs as a 3-service stack:

- Frontend: `apps/web` (React + Vite)
- API: `services/api` (Express + TypeScript)
- AI engine: `services/ai` (FastAPI)

Current request flow:

`React -> Express (/api/*) -> FastAPI (/v1/*)`

Async generation uses Redis + BullMQ worker:

`Express API enqueue -> Worker process -> FastAPI pipeline -> Mongo persistence`

## What Is Implemented

- JWT auth (`register`, `login`, `me`)
- Manual upload and metadata persistence
- Async checklist generation jobs
- Job status polling via API
- Checklist retrieval page
- Provider selection (`local` or `pageindex`)
- Retrieval mode selection (`heuristic` or `tree_search`)

## API Endpoints

Implemented Express endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/manuals`
- `GET /api/manuals`
- `GET /api/manuals/:manualId`
- `POST /api/manuals/:manualId/checklists/generate`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `GET /api/checklists/:checklistId`

AI service endpoints:

- `GET /health`
- `POST /v1/ingest`
- `POST /v1/pageindex/build`
- `POST /v1/checklist/generate`
- `POST /v1/checklist/verify`

## Requirements

- Node.js 20+
- npm 10+
- Python 3.11+
- pip
- MongoDB
- Redis
- Local OpenAI-compatible model endpoint (Gemma via Docker Model Runner is recommended)

## Environment

### Frontend (`apps/web/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=Pebble
```

### API (`services/api/.env`)

```env
PORT=4000
JWT_SECRET=dev-change-me
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/pageindex
REDIS_URL=redis://localhost:6379
AI_SERVICE_BASE_URL=http://localhost:8001
```

### AI (`services/ai/.env`)

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

## Install

```bash
cd apps/web && npm install
cd ../..\services\api && npm install
cd ..\ai && pip install -r requirements.txt
```

Optional:

```bash
pip install pageindex
```

## Run Locally

Use 4 terminals.

### 1) AI service

```bash
cd services/ai
uvicorn app.main:app --reload --port 8001
```

### 2) API service

```bash
cd services/api
npm run dev
```

### 3) Worker service (required for job processing)

```bash
cd services/api
npm run worker:dev
```

### 4) Web app

```bash
cd apps/web
npm run dev
```

## Health Checks

- API health: `GET http://localhost:4000/health`
- API deps: `GET http://localhost:4000/health/deps`
- AI health: `GET http://localhost:8001/health`

## Common Pitfall

If job pages keep returning `304 Not Modified` for a long time, usually the worker is not running. Start:

```bash
cd services/api
npm run worker:dev
```

## Roadmap

- Checklist edit endpoints (`PATCH`)
- Export flow (`/api/exports`)
- Team/workspace boundaries
- More integration and e2e tests

## Documentation

- Docs index: `docs/README.md`
- Architecture: `docs/architecture.md`
- Setup guide: `docs/setup-local.md`
- API reference: `docs/api-reference.md`
- Operations runbook: `docs/operations-runbook.md`
- Troubleshooting: `docs/troubleshooting.md`
- Roadmap status: `docs/roadmap-status.md`
- Environment templates: `infra/env/README.md`
