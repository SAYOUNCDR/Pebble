# Local Development Setup

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+
- MongoDB
- Redis
- Local OpenAI-compatible model endpoint (Gemma via Docker Model Runner recommended)

## Install Dependencies

### Frontend

```bash
cd apps/web
npm install
```

### API

```bash
cd services/api
npm install
```

### AI

```bash
cd services/ai
pip install -r requirements.txt
```

Optional PageIndex SDK:

```bash
pip install pageindex
```

## Environment Files

Copy templates into actual `.env` files.

### Frontend (`apps/web/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=Pebble
```

### API (`services/api/.env`)

```env
PORT=4000
JWT_SECRET=dev-change-me
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/pageindex
REDIS_URL=redis://localhost:6379
AI_SERVICE_BASE_URL=http://localhost:8001
```

### AI (`services/ai/.env`)

```env
APP_NAME=manual-checklist-ai
APP_ENV=development
APP_PORT=8001
DMR_BASE_URL=http://localhost:12434/engines/v1
DMR_MODEL=ai/gemma4:4B-Q4_K_XL
REQUEST_TIMEOUT_SECONDS=90
STRICT_CITATIONS_DEFAULT=true
STORAGE_ROOT=./storage
PAGEINDEX_BASE_URL=https://api.pageindex.ai
PAGEINDEX_API_KEY=
PAGEINDEX_POLL_INTERVAL_SECONDS=5
PAGEINDEX_POLL_TIMEOUT_SECONDS=240
```

## Run Services (4 terminals)

### 1) AI Service

```bash
cd services/ai
uvicorn app.main:app --reload --port 8001
```

### 2) API Service

```bash
cd services/api
npm run dev
```

### 3) Worker Service

```bash
cd services/api
npm run worker:dev
```

### 4) Frontend

```bash
cd apps/web
npm run dev
```

## Verify

- API: `http://localhost:4000/health`
- API deps: `http://localhost:4000/health/deps`
- AI: `http://localhost:8001/health`
