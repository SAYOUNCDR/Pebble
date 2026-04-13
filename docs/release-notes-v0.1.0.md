# Release Notes v0.1.0

Date: 2026-04-13
Tag: v0.1.0

## Highlights

- Delivered the first complete end-to-end version of the PageIndex checklist builder architecture.
- Established a production-style app boundary: React frontend -> Express API -> AI service worker pipeline.
- Added async job orchestration, checklist editing, PDF export, and team-aware access control foundations.

## User-Facing Improvements

- New auth experience with protected pages and session-aware navigation.
- Manual upload and checklist generation workflow with live job tracking.
- Checklist detail page now supports item status/assignee/notes edits.
- One-click checklist PDF export and download from the UI.
- Team scope selector support to switch personal vs team data context.

## Platform and Backend Improvements

- Redis + BullMQ queue/worker setup for resilient background processing.
- Mongo-backed persistence for manuals, jobs, checklists, exports, and teams.
- Team scope enforcement with membership validation using x-team-id.
- Shared type package scaffold to reduce contract drift between services.

## Testing and Docs

- Added integration health tests and a gated end-to-end pipeline test.
- Expanded repository docs: setup, architecture, API reference, operations runbook, troubleshooting, and roadmap status.

## Known Gaps

- Team/workspace UI management is foundational and should be expanded.
- E2E coverage is opt-in and should be moved into CI with stable fixtures.
- Release automation (tagging and changelog generation) is currently manual.

## Suggested Tag Annotation

v0.1.0 - Auth-first, async checklist pipeline with editing/export and team-scoped foundations.
