import { apiRequest } from '../../lib/http'
import { getApiBaseUrl } from '../../lib/http'
import { getActiveTeamId } from '../../lib/team-scope'
import type { Checklist, CreateManualPayload, ExportArtifact, GenerateChecklistPayload, Job, Manual, QueueStatus } from './types'

export const pipelineApi = {
    listManuals: (token: string) =>
        apiRequest<{ manuals: Manual[] }>('/api/manuals', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),

    getManual: (token: string, manualId: string) =>
        apiRequest<{ manual: Manual }>(`/api/manuals/${encodeURIComponent(manualId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),

    createManual: async (token: string, payload: CreateManualPayload) => {
        const body = new FormData()
        body.append('manualId', payload.manualId)
        body.append('manualName', payload.manualName)
        body.append('file', payload.file)

        return apiRequest<{ manual: Manual }>('/api/manuals', {
            method: 'POST',
            body,
            headers: { Authorization: `Bearer ${token}` },
        })
    },

    generateChecklist: (token: string, manualId: string, payload: GenerateChecklistPayload) =>
        apiRequest<{ status: string; jobId: string; manualId: string }>(`/api/manuals/${encodeURIComponent(manualId)}/checklists/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        }),

    listJobs: (token: string) =>
        apiRequest<{ jobs: Job[] }>('/api/jobs', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),

    getJob: (token: string, jobId: string) =>
        apiRequest<{ job: Job; queue: QueueStatus }>(`/api/jobs/${encodeURIComponent(jobId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),

    getChecklist: (token: string, checklistId: string) =>
        apiRequest<{ checklist: Checklist }>(`/api/checklists/${encodeURIComponent(checklistId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),

    patchChecklistItem: (token: string, checklistId: string, itemId: string, payload: { status?: 'todo' | 'in_progress' | 'done' | 'blocked'; assignee?: string | null; notes?: string | null }) =>
        apiRequest<{ checklist: Checklist }>(`/api/checklists/${encodeURIComponent(checklistId)}/items/${encodeURIComponent(itemId)}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        }),

    exportChecklistPdf: (token: string, checklistId: string) =>
        apiRequest<{ status: 'ready'; exportId: string }>(`/api/checklists/${encodeURIComponent(checklistId)}/export/pdf`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }),

    getExport: (token: string, exportId: string) =>
        apiRequest<{ export: ExportArtifact }>(`/api/exports/${encodeURIComponent(exportId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        }),

    downloadExportPdf: async (token: string, exportId: string): Promise<Blob> => {
        const activeTeamId = getActiveTeamId()
        const response = await fetch(`${getApiBaseUrl()}/api/exports/${encodeURIComponent(exportId)}/file`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                ...(activeTeamId ? { 'x-team-id': activeTeamId } : {}),
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to download export (${response.status}).`)
        }

        return await response.blob()
    },
}
