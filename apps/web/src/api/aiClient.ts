import type {
  BuildIndexRequest,
  BuildIndexResponse,
  GenerateChecklistRequest,
  GenerateChecklistResponse,
  HealthResponse,
  IngestRequest,
  IngestResponse,
  VerifyChecklistRequest,
  VerifyChecklistResponse,
} from '../types/pipeline'

export const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL?.trim() || 'http://localhost:8001'

async function parseError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const detail = (body as { detail?: unknown }).detail
      if (typeof detail === 'string') {
        return detail
      }
      return JSON.stringify(detail)
    }
    return JSON.stringify(body)
  } catch {
    return response.statusText
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${AI_BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`GET ${path} failed (${response.status}): ${await parseError(response)}`)
  }
  return (await response.json()) as T
}

async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${AI_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`POST ${path} failed (${response.status}): ${await parseError(response)}`)
  }
  return (await response.json()) as TResponse
}

export const aiClient = {
  health: () => getJson<HealthResponse>('/health'),
  ingest: (payload: IngestRequest) => postJson<IngestResponse, IngestRequest>('/v1/ingest', payload),
  buildIndex: (payload: BuildIndexRequest) =>
    postJson<BuildIndexResponse, BuildIndexRequest>('/v1/pageindex/build', payload),
  generate: (payload: GenerateChecklistRequest) =>
    postJson<GenerateChecklistResponse, GenerateChecklistRequest>('/v1/checklist/generate', payload),
  verify: (payload: VerifyChecklistRequest) =>
    postJson<VerifyChecklistResponse, VerifyChecklistRequest>('/v1/checklist/verify', payload),
}

