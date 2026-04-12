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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000'

async function parseError(response: Response): Promise<string> {
    try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null) {
            if ('error' in body && typeof (body as { error?: unknown }).error === 'string') {
                const detail = (body as { detail?: unknown }).detail
                if (typeof detail === 'string') {
                    return `${(body as { error: string }).error}: ${detail}`
                }
                return (body as { error: string }).error
            }
            if ('detail' in body) {
                const detail = (body as { detail?: unknown }).detail
                return typeof detail === 'string' ? detail : JSON.stringify(detail)
            }
        }
        return JSON.stringify(body)
    } catch {
        return response.statusText
    }
}

async function getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
        throw new Error(`GET ${path} failed (${response.status}): ${await parseError(response)}`)
    }
    return (await response.json()) as T
}

async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
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

export const backendClient = {
    health: () => getJson<HealthResponse>('/api/ai/health'),
    ingest: (payload: IngestRequest) => postJson<IngestResponse, IngestRequest>('/api/ai/ingest', payload),
    buildIndex: (payload: BuildIndexRequest) =>
        postJson<BuildIndexResponse, BuildIndexRequest>('/api/ai/pageindex/build', payload),
    generate: (payload: GenerateChecklistRequest) =>
        postJson<GenerateChecklistResponse, GenerateChecklistRequest>('/api/ai/checklist/generate', payload),
    verify: (payload: VerifyChecklistRequest) =>
        postJson<VerifyChecklistResponse, VerifyChecklistRequest>('/api/ai/checklist/verify', payload),
}
