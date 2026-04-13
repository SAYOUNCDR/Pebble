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

export interface ChecklistItemEvidence {
    manual_id?: string
    section_id?: string
    page_number?: number
    excerpt?: string
}

export interface ChecklistItem {
    item_id?: string
    text?: string
    title?: string
    status?: 'todo' | 'in_progress' | 'done' | 'blocked'
    assignee?: string | null
    notes?: string | null
    priority?: string
    frequency?: string
    safety_tag?: string
    evidence?: ChecklistItemEvidence
    [key: string]: unknown
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
    items: ChecklistItem[]
    createdAt: string
    updatedAt: string
}

export interface ExportArtifact {
    exportId: string
    ownerUserId: string
    checklistId: string
    format: 'pdf'
    status: 'ready' | 'failed'
    fileName: string
    filePath: string
    downloadPath: string
    createdAt: string
    updatedAt: string
}
