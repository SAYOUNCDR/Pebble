import { apiRequest } from '../../lib/http'

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    suggestedChecklistPayload?: {
        checklistName?: string
        objective: string
        maxItems: number
        provider: 'local' | 'pageindex'
        retrievalMode: 'heuristic' | 'tree_search'
        strictCitations: boolean
    }
}

export interface ChatQuery {
    manualId: string
    message: string
}

export interface ChatResponse {
    reply: string
    suggestedChecklistPayload?: ChatMessage['suggestedChecklistPayload']
}

export const chatApi = {
    sendMessage: (token: string, query: ChatQuery) =>
        apiRequest<ChatResponse>('/api/chat/query', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(query),
        }),
}
