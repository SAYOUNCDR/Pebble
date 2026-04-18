# Architecture

## High-Level Design

Pebble is a three-service application:

- Frontend: React + Vite (`apps/web`)
- API: Express + TypeScript (`services/api`)
- AI service: FastAPI (`services/ai`)

Request path:

`Browser -> Express (/api/*) -> FastAPI (/v1/*)`

Async generation path:

`Express route -> BullMQ queue (Redis) -> Worker -> FastAPI pipeline -> MongoDB persistence`

## Responsibilities

### Frontend (`apps/web`)

- Auth UI and route guards
- Manual upload, generation flow, and job/status UX
- Jobs polling and checklist detail rendering
- Checklist edit and export UX
- Manual-specific chat UI
- Calls only Express API

### API (`services/api`)

- Authentication and JWT middleware
- Manual upload/storage metadata
- Job creation and queue orchestration
- Checklist persistence and retrieval
- Chat history persistence per manual
- Dependency health checks (`/health`, `/health/deps`)

### Worker (`services/api/src/workers/pipelineWorker.ts`)

- Consumes queue jobs
- Runs ingest/build/generate/verify sequence through AI client
- Updates job status transitions
- Persists checklist output

### AI Service (`services/ai`)

- PDF ingest and parsing
- Index build (`local` or `pageindex` provider)
- Checklist generation (`heuristic` or `tree_search` retrieval)
- Checklist verification with strict citation behavior

## Data Stores

- MongoDB: users, manuals, jobs, checklists, exports, chat threads
- Redis: queue and queue metadata (BullMQ)

## Current Constraints

- Team/workspace management can be expanded in UI and policy depth.
- Automated test coverage can be increased (integration/e2e).
