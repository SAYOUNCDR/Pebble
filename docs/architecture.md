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
- Manual upload and generation flow
- Jobs polling and checklist detail rendering
- Calls only Express API

### API (`services/api`)

- Authentication and JWT middleware
- Manual upload/storage metadata
- Job creation and queue orchestration
- Checklist persistence and retrieval
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

- MongoDB: users, manuals, jobs, checklists
- Redis: queue and queue metadata (BullMQ)

## Current Constraints

- Team/workspace boundaries are planned, not fully implemented.
- Checklist edit/update and export endpoints are planned, not fully implemented.
