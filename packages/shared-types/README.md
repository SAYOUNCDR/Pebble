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

## Adoption Plan

1. Define API response contracts currently duplicated in web/api code.
2. Export from this package.
3. Import these types in frontend and backend route modules.

This folder is currently documentation-only and ready for incremental migration.
