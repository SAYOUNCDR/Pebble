# Migration Plan: React -> Express -> Python (AI)

> Last updated: 2026-04-13

## 1) Goal

Replace the temporary direct integration (`React -> FastAPI`) with the target architecture:

`React (Vite) -> Node/Express (TypeScript) -> Python/FastAPI (AI pipeline)`

This plan also lists what is already done, what is pending, and the exact next implementation sequence.

---

## 2) Current Status (Done)

### Completed

- Monorepo scaffold is created.
- Python AI service is working with:
  - `POST /v1/ingest`
  - `POST /v1/pageindex/build` (`provider=local|pageindex`)
  - `POST /v1/checklist/generate` (`retrieval_mode=heuristic|tree_search`)
  - `POST /v1/checklist/verify`
- Local Gemma4 integration via Docker Model Runner is wired in Python.
- PageIndex tree indexing option is wired in Python.
- Express TypeScript API is active with:
  - `/health`
  - `/health/deps`
  - auth/manuals/jobs/checklists modules mounted
- React frontend is migrated to call Express API (`/api/*`) and no longer calls Python directly.
- Auth module is implemented end-to-end (register/login/me + protected routes).
- Manual upload/list/detail + checklist generation enqueue flow is implemented.
- Redis + BullMQ queue/worker is implemented.
- Worker runs ingest/build/generate/verify pipeline and persists checklist data in Mongo.
- Jobs list/detail and checklist detail frontend pages are implemented.
- Landing page + authenticated navigation flow is implemented and branded as Pebble.

### Completed cleanup

- Frontend direct Python client (`apps/web/src/api/aiClient.ts`) removed.
- Frontend env now uses Express base URL (`VITE_API_BASE_URL`).

---

## 3) Target Architecture and Responsibilities

### React (public client)

- Calls only Express public API (`/api/*`).
- Handles forms, progress UI, checklist editing, and export UX.
- No direct Python calls.

### Express (orchestration + product API)

- Auth, team/workspace boundaries, manual metadata, jobs, checklist persistence.
- File upload endpoint for manuals.
- Calls Python internal endpoints for ingest/index/generate/verify.
- Calls MongoDB + Redis + export logic.

### Python (AI engine only)

- Document parsing and indexing (local/PageIndex provider).
- Retrieval and checklist generation (heuristic/tree search).
- Verification of citations/dedup logic.
- No frontend concerns, no auth logic.

---

## 4) API Contract Mapping (New Public API)

## Frontend-facing (Express)

- Implemented:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/manuals` (multipart upload)
  - `GET /api/manuals`
  - `GET /api/manuals/:manualId`
  - `POST /api/manuals/:manualId/checklists/generate`
  - `GET /api/jobs`
  - `GET /api/jobs/:jobId`
  - `GET /api/checklists/:checklistId`
- Planned / not implemented yet:
  - `PATCH /api/checklists/:checklistId`
  - `PATCH /api/checklists/:checklistId/items/:itemId`
  - `POST /api/checklists/:checklistId/export/pdf`
  - `GET /api/exports/:exportId`

## Internal Express -> Python

- `POST /v1/ingest`
- `POST /v1/pageindex/build`
- `POST /v1/checklist/generate`
- `POST /v1/checklist/verify`

---

## 5) Step-by-Step Implementation Plan

## Phase A: Express foundation and wiring

1. Create Express app structure:
   - `src/server.ts`, `src/app.ts`, shared middleware, error handler.
2. Add config/env loader:
   - `PORT`, `JWT_SECRET`, `MONGODB_URI`, `REDIS_URL`, `AI_SERVICE_BASE_URL`.
3. Build Python client module in Express:
   - typed methods for ingest/index/generate/verify.
4. Add health endpoints:
   - `/health` for Express and optional `/health/deps` for Python connectivity.

## Phase B: Data model + persistence

1. Add Mongo models/collections:
   - `users`, `teams`, `memberships`, `manuals`, `jobs`, `checklists`, `checklist_items`, `exports`.
2. Add Redis queue for async jobs:
   - lifecycle: `queued -> ingesting -> indexing -> generating -> verifying -> completed|failed`.
3. Add job worker to call Python pipeline and persist results.

## Phase C: Public API in Express

1. Auth module:
   - register/login, password hashing, JWT issuance, auth middleware.
2. Manuals module:
   - upload PDF, save file path, create manual record.
3. Generation module:
   - enqueue job, worker executes Python calls, status tracking.
4. Checklist module:
   - read/update checklist and item status/notes/assignee.
5. Export module:
   - PDF export endpoint and artifact metadata.

## Phase D: Frontend migration

1. Replace direct Python client with Express client:
   - create `apps/web/src/api/backendClient.ts`.
2. Update current pipeline UI:
   - trigger manual upload to `/api/manuals`.
   - trigger generate job via `/api/manuals/:manualId/checklists/generate`.
   - poll `/api/jobs/:jobId`.
   - fetch checklist from `/api/checklists/:checklistId`.
3. Keep existing UI style; only swap data sources and flow.
4. Remove direct FastAPI connection code.

## Phase E: Hardening and finish

1. Validation + typed DTOs in Express.
2. Retry strategy for Python/PageIndex transient errors.
3. Add route-level authorization checks by team/workspace.
4. Add test coverage:
   - API contract tests (Express <-> Python)
   - core route integration
   - one E2E flow (upload -> generate -> verify -> edit -> export).

---

## 6) What Is Left (Checklist)

### High-priority remaining tasks

- [x] Build full Express app structure and middleware.
- [x] Implement Mongo models and DB connection.
- [x] Implement Redis queue + worker.
- [x] Implement core Express modules/routes (auth/manuals/jobs/checklists read).
- [x] Wire Express to Python service with typed internal client.
- [x] Migrate React from direct Python calls to Express API.
- [ ] Add checklist editing persistence through Express (`PATCH` routes + UI wiring).
- [ ] Add PDF export flow (`exports` module + UI wiring).
- [ ] Implement team/workspace boundaries and authorization model.

### Cleanup tasks

- [x] Remove/deprecate `apps/web/src/api/aiClient.ts` direct Python calls.
- [x] Replace `VITE_AI_BASE_URL` usage with Express API base URL.
- [x] Update README with final architecture and run instructions.
- [ ] Consolidate shared contracts into `packages/shared-types` (currently docs only).

---

## 7) Acceptance Criteria (Migration Complete)

- Frontend makes **zero** direct calls to Python.
- All user-facing calls go through Express `/api/*`.
- Manual upload + async generation + checklist fetch works end-to-end.
- Checklist edit/update is still pending.
- Express persists manuals/jobs/checklists in MongoDB.
- Job states are visible and accurate.
- Python remains the AI engine only (internal service).
- Existing MVP quality behavior remains available:
  - strict citation verification
  - retrieval mode controls
  - provider controls (local/PageIndex).

---

## 8) Execution Order (Recommended Now)

1. Implement checklist edit endpoints (`PATCH /api/checklists/:checklistId`, `PATCH /api/checklists/:checklistId/items/:itemId`).
2. Add checklist edit UI interactions (status/notes/assignee update).
3. Implement export module (`POST /api/checklists/:checklistId/export/pdf`, `GET /api/exports/:exportId`).
4. Add export UI flow (generate/download artifact).
5. Implement team/workspace boundaries and authorization checks.
6. Add integration and e2e tests for upload -> generate -> verify -> edit -> export.
