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
- User-validated route sequence:
  - Ingest tested with real PDF (`newiomanual.pdf`): success (`page_count=32`, `word_count=12729`)
  - Generate tested and returned checklist successfully
  - Verify tested and returned accepted items successfully

## Python MVP Behavior
- `/v1/ingest`: reads local PDF, stores parsed page text in local JSON storage.
- `/v1/pageindex/build`: builds section map using heading heuristics (fallback fixed-size chunks).
- `/v1/checklist/generate`: attempts Gemma4 generation through DMR; falls back to deterministic checklist if model call fails or output is invalid.
- `/v1/checklist/verify`: deduplicates and enforces strict citation checks.
- Important verify rule:
  - If request includes `items`, verification runs on provided `items`.
  - If `items` is omitted, service loads checklist items from stored `checklist_id`.

## Route Contracts (MVP)
- `GET /health`
  - Returns service status and timestamp.
- `POST /v1/ingest`
  - Input: `manual_id`, `file_path`, `manual_name?`
  - Output: ingest metadata (`page_count`, `word_count`, status)
  - Note: Windows path in JSON must use escaped backslashes or forward slashes.
- `POST /v1/pageindex/build`
  - Input: `manual_id`, `chunk_size_pages?`
  - Output: section list with `section_id`, title, page range, summary.
- `POST /v1/checklist/generate`
  - Input: `manual_id`, `objective?`, `max_items?`, `strict_citations?`
  - Output: `checklist_id`, generated checklist items, warnings.
- `POST /v1/checklist/verify`
  - Input: `manual_id`, `checklist_id?`, `strict_citations`, `items?`
  - Output: accepted/rejected counts, accepted items, rejected reasons.

## Data Flow Architecture (Current AI MVP)
1. Ingest reads PDF pages with PyMuPDF and stores parsed text.
2. PageIndex builder scans page text for heading-like lines to form section map.
3. Generator selects candidate sections, prompts Gemma4 via DMR, parses JSON output.
4. If model output is invalid/unavailable, deterministic fallback checklist is produced.
5. Generated checklist is persisted as JSON with evidence fields.
6. Verify enforces strict citation rules, removes duplicates, and stores verified output.

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
1. Harden verify validation (reject placeholder/manual-mismatch evidence).
2. Add async job wrapper in Node for ingest/build/generate/verify stages.
3. Persist checklist data to MongoDB (replace local JSON as source of truth).
4. Add React flows for upload, progress, checklist review and edit.
5. Add PDF export route and frontend download flow.

## Environment Notes
- DMR endpoint default: `http://localhost:12434/engines/v1`
- DMR model default: `ai/gemma4:4B-Q4_K_XL`
- AI env template is at `services/ai/.env.example`
