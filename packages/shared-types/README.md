# shared-types

Shared TypeScript contracts for cross-service consistency.

## Purpose

Use this package to store request/response DTOs and shared domain types used by:

- `apps/web`
- `services/api`

## Suggested Structure

- `src/auth.ts`
- `src/manuals.ts`
- `src/jobs.ts`
- `src/checklists.ts`
- `src/index.ts`

## Current State

Documentation-first scaffold. Incremental migration is ongoing.

## Next Steps

1. Move shared DTOs currently duplicated in `apps/web` and `services/api`.
2. Export DTO barrels from `src/index.ts`.
3. Consume this package from both app and API modules.
