# Agent Handoff Context

## Project
- Name: Manual Checklist Builder
- Goal: Convert long technical PDF manuals into grounded maintenance checklists.
- Retrieval style: PageIndex-style vectorless retrieval (structure-aware, iterative), no vector DB in v1.
- Local model: Gemma4 via Docker Model Runner.

## Tech Stack
- Frontend: React + Vite + Tailwind (`apps/web`)
- API orchestration: Node + Express + TypeScript (`services/api`)
- AI service: Python + FastAPI (`services/ai`)
- Data: MongoDB (primary), Redis (jobs/cache) in planned full version

## Decisions Locked (v1)
- Input: PDF only
- Language: English only
- Users: small team
- Processing: async pipeline in final architecture
- Citation policy: strict by default
- Checklist editing before export: required

## Current Implementation Status
- Folder scaffold created for full monorepo.
- Root `.gitignore` created.
- `services/api` TypeScript Express health route works:
  - `GET /health` -> `{ status: "ok", service: "api", ... }`
- Python AI MVP backend implemented in `services/ai/app` with endpoints:
  - `GET /health`
  - `POST /v1/ingest`
  - `POST /v1/pageindex/build`
  - `POST /v1/checklist/generate`
  - `POST /v1/checklist/verify`

## Python MVP Behavior
- `/v1/ingest`: reads local PDF, stores parsed page text in local JSON storage.
- `/v1/pageindex/build`: builds section map using heading heuristics (fallback fixed-size chunks).
- `/v1/checklist/generate`: attempts Gemma4 generation through DMR; falls back to deterministic checklist if model call fails or output is invalid.
- `/v1/checklist/verify`: deduplicates and enforces strict citation checks.

## Local Storage Layout (AI MVP)
- `services/ai/storage/manuals/*.json`
- `services/ai/storage/indexes/*.json`
- `services/ai/storage/checklists/*.json`

## Run Commands
- API service:
  - `cd services/api`
  - `npm.cmd run dev`
- AI service:
  - `cd services/ai`
  - `venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001`

## Next Recommended Steps
1. Validate AI endpoints with a sample PDF (ingest -> build -> generate -> verify).
2. Implement Node API modules and job orchestration.
3. Wire Node -> Python internal calls.
4. Build React flows for upload, progress, checklist editing, export.
5. Add MongoDB + Redis persistence and queues.

## Environment Notes
- DMR endpoint default: `http://localhost:12434/engines/v1`
- DMR model default: `ai/gemma4:4B-Q4_K_XL`
- AI env template is at `services/ai/.env.example`

