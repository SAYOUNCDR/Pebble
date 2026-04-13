# Operations Runbook

## Services

- Frontend: `apps/web`
- API: `services/api`
- Worker: `services/api` (`worker:dev` / `worker:start`)
- AI: `services/ai`

## Startup Order

1. AI service
2. API service
3. Worker service
4. Frontend

This order avoids jobs being queued with no worker consumer.

## Build and Typecheck

### Frontend

```bash
cd apps/web
npm run build
```

### API

```bash
cd services/api
npm run typecheck
npm run build
```

## Worker Health Signals

- Healthy worker logs: `Pipeline worker started.`
- Job completion logs: `[worker] completed job ...`
- Job failure logs: `[worker] failed job ...`

## Queue Diagnostics

If jobs are stuck in `queued` state:

1. Confirm worker process is running.
2. Check `/api/jobs/health` for Redis connectivity.
3. Query queue counts using ad-hoc script or inspect job endpoint.

## Deployment Notes

- API and worker should run as separate processes.
- Redis eviction policy `noeviction` is recommended for BullMQ reliability.
- Keep API and worker on same Redis instance/namespace.
