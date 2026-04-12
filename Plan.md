# Migration Plan: React -> Express -> Python (AI)

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
- Temporary React UI directly calls Python endpoints and works for MVP testing.
- Express TypeScript service basic health route is up.

### Temporary pieces to remove
- Frontend direct API base URL to Python (`VITE_AI_BASE_URL`) and direct calls in `apps/web/src/api/aiClient.ts`.
- Any frontend assumptions that know Python route shapes directly.

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
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/manuals` (multipart upload)
- `GET /api/manuals/:manualId`
- `POST /api/manuals/:manualId/checklists/generate`
- `GET /api/jobs/:jobId`
- `GET /api/checklists/:checklistId`
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
- [ ] Build full Express app structure and middleware.
- [ ] Implement Mongo models and DB connection.
- [ ] Implement Redis queue + worker.
- [ ] Implement Express modules/routes listed above.
- [ ] Wire Express to Python service with typed internal client.
- [ ] Migrate React from direct Python calls to Express API.
- [ ] Add checklist editing persistence through Express.
- [ ] Add PDF export flow.

### Cleanup tasks
- [ ] Remove/deprecate `apps/web/src/api/aiClient.ts` direct Python calls.
- [ ] Replace `VITE_AI_BASE_URL` usage with Express API base URL.
- [ ] Update README with final architecture and run instructions.

---

## 7) Acceptance Criteria (Migration Complete)
- Frontend makes **zero** direct calls to Python.
- All user-facing calls go through Express `/api/*`.
- Manual upload + async generation + checklist fetch/edit works end-to-end.
- Express persists manuals/jobs/checklists in MongoDB.
- Job states are visible and accurate.
- Python remains the AI engine only (internal service).
- Existing MVP quality behavior remains available:
  - strict citation verification
  - retrieval mode controls
  - provider controls (local/PageIndex).

---

## 8) Execution Order (Recommended Now)
1. Express app skeleton + env + error middleware.
2. Express Python client + manual generation service wrappers.
3. Mongo models + jobs collection + Redis queue.
4. `POST /api/manuals`, `POST /api/manuals/:id/checklists/generate`, `GET /api/jobs/:id`, `GET /api/checklists/:id`.
5. Frontend migration to these 4 routes first (minimum end-to-end).
6. Auth/team/export as next increment.

