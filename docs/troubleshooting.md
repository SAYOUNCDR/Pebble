# Troubleshooting

## Symptom: Job page returns many `304 Not Modified`

Cause:

- Browser polling is active, but job payload is unchanged.

Most common reason:

- Worker is not running, so queue job never transitions.

Fix:

```bash
cd services/api
npm run worker:dev
```

## Symptom: Jobs remain `queued`

Checklist:

1. `GET /api/jobs/health` returns Redis `PONG`.
2. Worker process exists and logs startup.
3. AI service health is `ok`.
4. API deps endpoint reports healthy dependencies.

## Symptom: Jobs show in UI but not in Redis queue browser

Cause:

- Jobs list is read from MongoDB (`jobs` collection), not directly from Redis.

Action:

1. Check MongoDB `jobs` documents for historical/completed records.
2. Use `/api/jobs/:jobId` to compare persisted status and queue state.

## Symptom: Redis warning about eviction policy

Message:

`Eviction policy is volatile-lru. It should be "noeviction"`

Impact:

- Not always fatal, but can cause queue instability under memory pressure.

Fix:

- Use Redis instance/config with `maxmemory-policy noeviction` when possible.

## Symptom: Checklist shows generic items in UI

Cause:

- Frontend mapping mismatch (`title`) vs backend payload (`text`, `evidence`).

Status:

- Fixed in checklist detail page renderer.

## Symptom: AI generate fallback warning

Example:

- Tree search routing warning due to local model endpoint 400 response.

Action:

1. Verify `DMR_BASE_URL` and `DMR_MODEL`.
2. Test model endpoint manually.
3. Retry with `retrievalMode: heuristic` to isolate tree-search prompt issues.
