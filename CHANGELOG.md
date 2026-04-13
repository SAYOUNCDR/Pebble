# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [0.1.0] - 2026-04-13

### Added

- Auth-first API and frontend flows with JWT login/register and protected routes.
- Full manuals pipeline orchestration: upload, queue, job polling, checklist persistence.
- Redis + BullMQ worker processing with stage/status progression and retry support.
- Checklist editing endpoints and frontend item edit interactions.
- PDF export generation and file download API with frontend integration.
- Team/workspace backend foundations and scoped data access via x-team-id.
- Shared contracts package scaffold under packages/shared-types.
- Integration and opt-in e2e test scaffolding for pipeline flow.
- Structured docs set for setup, architecture, API reference, operations, and troubleshooting.

### Changed

- Frontend architecture now routes all runtime calls through Express API (no direct React to AI service calls).
- Landing and app shell UX updated for auth-aware navigation and modernized UI behavior.
- README and roadmap status documentation aligned with current implementation.

### Fixed

- Checklist detail rendering aligned with persisted checklist item schema.
- Queue execution visibility improved by separating API and worker run responsibilities.
- Export/download and checklist patch flows stabilized across scoped access checks.
