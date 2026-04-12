import { apiRequest } from '../../lib/http'
import type { Checklist, CreateManualPayload, GenerateChecklistPayload, Job, Manual, QueueStatus } from './types'

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
}
