const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000'

async function parseError(response: Response): Promise<string> {
    try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null) {
            if ('error' in body && typeof (body as { error?: unknown }).error === 'string') {
                const error = (body as { error: string }).error
                const detail = (body as { detail?: unknown }).detail
                if (typeof detail === 'string') {
                    return `${error}: ${detail}`
                }
                return error
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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(init.headers || {}),
        },
    })

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await parseError(response)}`)
    }

    if (response.status === 204) {
        return undefined as T
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
        return (await response.text()) as T
    }

    return (await response.json()) as T
}

export function getApiBaseUrl(): string {
    return API_BASE_URL
}
