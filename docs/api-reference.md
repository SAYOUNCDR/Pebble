# API Reference

## API Service (`services/api`)

Base URL: `http://localhost:4000`

### Health

- `GET /health`
- `GET /health/deps`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Manuals

- `POST /api/manuals` (multipart form-data, field: `file`)
- `GET /api/manuals`
- `GET /api/manuals/:manualId`
- `POST /api/manuals/:manualId/checklists/generate`

Generate request body:

```json
{
  "objective": "Generate a practical maintenance checklist",
  "maxItems": 20,
  "provider": "local",
  "retrievalMode": "tree_search",
  "strictCitations": true
}
```

### Jobs

- `GET /api/jobs/health`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`

### Checklists

- `GET /api/checklists/:checklistId`

## AI Service (`services/ai`)

Base URL: `http://localhost:8001`

- `GET /health`
- `POST /v1/ingest`
- `POST /v1/pageindex/build`
- `POST /v1/checklist/generate`
- `POST /v1/checklist/verify`

## Auth Notes

Most `/api/*` routes require Bearer token except auth register/login and health routes.

## Planned (Not Implemented Yet)

- `PATCH /api/checklists/:checklistId`
- `PATCH /api/checklists/:checklistId/items/:itemId`
- `POST /api/checklists/:checklistId/export/pdf`
- `GET /api/exports/:exportId`
