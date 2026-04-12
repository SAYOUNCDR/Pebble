export type RetrievalMode = 'heuristic' | 'tree_search'
export type Provider = 'local' | 'pageindex'

export interface Manual {
    manualId: string
    manualName: string
    originalFileName: string
    storedFilePath: string
    mimeType: string
    fileSizeBytes: number
    createdAt: string
    updatedAt: string
}

export interface CreateManualPayload {
    manualId: string
    manualName: string
    file: File
}

export interface GenerateChecklistPayload {
    objective: string
    maxItems: number
    provider: Provider
    retrievalMode: RetrievalMode
    strictCitations: boolean
}

export interface Job {
    queueJobId: string
    ownerUserId: string
    manualId: string
    status: 'queued' | 'ingesting' | 'indexing' | 'generating' | 'verifying' | 'completed' | 'failed'
    provider: Provider
    retrievalMode: RetrievalMode
    objective: string
    maxItems: number
    strictCitations: boolean
    checklistId?: string
    errorMessage?: string
    createdAt: string
    updatedAt: string
}

export interface QueueStatus {
    state: string
    progress?: number | object
    failedReason?: string | null
    attemptsMade?: number
    finishedOn?: number | null
}

export interface Checklist {
    checklistId: string
    ownerUserId: string
    manualId: string
    sourceJobId: string
    itemCount: number
    retrievalMode: RetrievalMode
    warnings: string[]
    selectedNodeIds: string[]
    items: unknown[]
    createdAt: string
    updatedAt: string
}
