# Roadmap Status

## Completed

- React frontend routed through Express API
- Auth module (register/login/me)
- Manual upload and listing
- Async jobs with BullMQ + Redis
- Worker orchestration to AI service
- Checklist retrieval and rendering
- Landing page redesign and Pebble branding

## In Progress / Next

- Checklist update endpoints (`PATCH`)
- Checklist item update endpoint
- Export endpoints and downloadable artifacts
- Team/workspace boundaries
- Expanded automated tests

## Technical Debt

- Add stronger queue observability metrics
- Improve worker stage granularity and retry visibility
- Consolidate shared DTO contracts into `packages/shared-types`
