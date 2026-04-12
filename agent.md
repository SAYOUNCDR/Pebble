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
- PageIndex + local Gemma hybrid upgrade implemented:
  - `/v1/pageindex/build` supports `provider: "local" | "pageindex"`
  - PageIndex cloud tree indexing via API key when provider is `pageindex`
  - Local Gemma4 `llm_tree_search` added for node selection (`retrieval_mode: "tree_search"`)
  - Checklist generation can now run with heuristic mode or tree-search mode
- User-validated route sequence:
  - Ingest tested with real PDF (`newiomanual.pdf`): success (`page_count=32`, `word_count=12729`)
  - Generate tested and returned checklist successfully
  - Verify tested and returned accepted items successfully

## Python MVP Behavior
- `/v1/ingest`: reads local PDF, stores parsed page text in local JSON storage.
- `/v1/pageindex/build`:
  - `provider="local"`: heading heuristics + fixed chunk fallback
  - `provider="pageindex"`: uploads PDF to PageIndex, polls completion, fetches tree, flattens to sections
- `/v1/checklist/generate`:
  - `retrieval_mode="heuristic"`: section scoring by keywords
  - `retrieval_mode="tree_search"`: Gemma4 picks `node_id` list from tree structure, then generation uses selected nodes
  - falls back to deterministic checklist if model call/output fails
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
  - Input: `manual_id`, `chunk_size_pages?`, `provider?`, `force_rebuild?`
  - Output: section list + provider metadata (`provider`, optional `doc_id`, optional `tree_node_count`).
- `POST /v1/checklist/generate`
  - Input: `manual_id`, `objective?`, `max_items?`, `strict_citations?`, `retrieval_mode?`, `expert_rules?`
  - Output: `checklist_id`, generated checklist items, warnings, `retrieval_mode`, `selected_node_ids`.
- `POST /v1/checklist/verify`
  - Input: `manual_id`, `checklist_id?`, `strict_citations`, `items?`
  - Output: accepted/rejected counts, accepted items, rejected reasons.

## Data Flow Architecture (Current AI MVP)
1. Ingest reads PDF pages with PyMuPDF and stores parsed text.
2. Index builder runs in one of two providers:
   - local heuristics, or
   - PageIndex API tree indexing.
3. Retrieval runs in one of two modes:
   - heuristic section scoring, or
   - local Gemma tree search selecting `node_id`s.
4. Generator prompts Gemma4 with selected sections and parses JSON output.
5. If model output is invalid/unavailable, deterministic fallback checklist is produced.
6. Generated checklist is persisted as JSON with evidence fields + retrieval metadata.
7. Verify enforces strict citation rules, removes duplicates, and stores verified output.

## Local Storage Layout (AI MVP)
- `services/ai/storage/manuals/*.json`
- `services/ai/storage/indexes/*.json`
- `services/ai/storage/checklists/*.json`
- `services/ai/storage/pageindex/*.doc.json` (doc_id mapping)
- `services/ai/storage/pageindex/*.tree.json` (raw tree payload)

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
- PageIndex base URL default: `https://api.pageindex.ai`
- Set `PAGEINDEX_API_KEY` to enable `provider="pageindex"`
- AI env template is at `services/ai/.env.example`
