import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Checklist, ChecklistItem } from '../features/pipeline/types'

interface ChecklistItemView {
    itemId?: string
    title: string
    details?: string
    citation?: string
    priority?: string
    frequency?: string
    safetyTag?: string
    status?: 'todo' | 'in_progress' | 'done' | 'blocked'
    assignee?: string | null
    notes?: string | null
}

function normalizeChecklistItem(item: ChecklistItem | unknown): ChecklistItemView {
    if (typeof item === 'string') {
        return { title: item }
    }

    if (typeof item === 'object' && item !== null) {
        const source = item as Record<string, unknown>
        const evidence = (typeof source.evidence === 'object' && source.evidence !== null)
            ? (source.evidence as Record<string, unknown>)
            : null

        const excerpt = typeof evidence?.excerpt === 'string' ? evidence.excerpt : undefined
        const pageNumber = typeof evidence?.page_number === 'number' ? evidence.page_number : undefined
        const sectionId = typeof evidence?.section_id === 'string' ? evidence.section_id : undefined

        const citationParts: string[] = []
        if (typeof pageNumber === 'number') {
            citationParts.push(`Page ${pageNumber}`)
        }
        if (sectionId) {
            citationParts.push(`Section ${sectionId}`)
        }

        return {
            itemId: typeof source.item_id === 'string' ? source.item_id : undefined,
            title: String(source.text ?? source.title ?? source.name ?? source.label ?? 'Checklist item'),
            details:
                typeof source.description === 'string'
                    ? source.description
                    : excerpt,
            citation:
                typeof source.citation === 'string'
                    ? source.citation
                    : (citationParts.length > 0 ? citationParts.join(' | ') : undefined),
            priority: typeof source.priority === 'string' ? source.priority : undefined,
            frequency: typeof source.frequency === 'string' ? source.frequency : undefined,
            safetyTag: typeof source.safety_tag === 'string' ? source.safety_tag : undefined,
            status:
                source.status === 'todo' || source.status === 'in_progress' || source.status === 'done' || source.status === 'blocked'
                    ? source.status
                    : undefined,
            assignee: typeof source.assignee === 'string' || source.assignee === null ? source.assignee : undefined,
            notes: typeof source.notes === 'string' || source.notes === null ? source.notes : undefined,
        }
    }

    return { title: 'Checklist item' }
}

export function ChecklistDetailPage(): React.JSX.Element {
    const { token } = useAuth()
    const { checklistId = '' } = useParams()
    const [checklist, setChecklist] = useState<Checklist | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [savingItemId, setSavingItemId] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)

    const [itemDrafts, setItemDrafts] = useState<Record<string, { status: 'todo' | 'in_progress' | 'done' | 'blocked'; assignee: string; notes: string }>>({})

    useEffect(() => {
        const load = async () => {
            if (!token || !checklistId) {
                return
            }

            try {
                setLoading(true)
                const response = await pipelineApi.getChecklist(token, checklistId)
                setChecklist(response.checklist)
                const nextDrafts: Record<string, { status: 'todo' | 'in_progress' | 'done' | 'blocked'; assignee: string; notes: string }> = {}
                response.checklist.items.forEach((item) => {
                    const normalized = normalizeChecklistItem(item)
                    if (!normalized.itemId) {
                        return
                    }
                    nextDrafts[normalized.itemId] = {
                        status: normalized.status ?? 'todo',
                        assignee: normalized.assignee ?? '',
                        notes: normalized.notes ?? '',
                    }
                })
                setItemDrafts(nextDrafts)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load checklist.')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [token, checklistId])

    const onUpdateDraft = (itemId: string, field: 'status' | 'assignee' | 'notes', value: string) => {
        setItemDrafts((prev) => {
            const current = prev[itemId] ?? { status: 'todo', assignee: '', notes: '' }
            return {
                ...prev,
                [itemId]: {
                    ...current,
                    [field]: value,
                },
            }
        })
    }

    const onSaveItem = async (itemId: string) => {
        if (!token || !checklist) {
            return
        }

        const draft = itemDrafts[itemId]
        if (!draft) {
            return
        }

        try {
            setSavingItemId(itemId)
            const response = await pipelineApi.patchChecklistItem(token, checklist.checklistId, itemId, {
                status: draft.status,
                assignee: draft.assignee.trim().length > 0 ? draft.assignee.trim() : null,
                notes: draft.notes.trim().length > 0 ? draft.notes.trim() : null,
            })
            setChecklist(response.checklist)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save checklist item.')
        } finally {
            setSavingItemId(null)
        }
    }

    const onExportPdf = async () => {
        if (!token || !checklist) {
            return
        }

        try {
            setExporting(true)
            const created = await pipelineApi.exportChecklistPdf(token, checklist.checklistId)
            const blob = await pipelineApi.downloadExportPdf(token, created.exportId)
            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = `${checklist.checklistId}.pdf`
            link.click()
            URL.revokeObjectURL(objectUrl)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export checklist PDF.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
            <div className="mb-4 flex items-center justify-between gap-3">
                <Link to="/jobs" className="text-sm text-slate-600 underline underline-offset-4">
                    Back to jobs
                </Link>
                <Button size="sm" onClick={onExportPdf} disabled={exporting || loading || !checklist}>
                    {exporting ? 'Exporting...' : 'Export PDF'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{checklist?.checklistName ?? `Checklist ${checklistId}`}</CardTitle>
                    <CardDescription>{loading ? 'Loading...' : `${checklist?.itemCount ?? 0} item(s)`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                    <div className="space-y-3">
                        {checklist?.items?.map((item, index) => {
                            const view = normalizeChecklistItem(item)
                            const draft = view.itemId ? itemDrafts[view.itemId] : undefined
                            return (
                                <article key={`${view.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h3 className="font-medium text-slate-900">{index + 1}. {view.title}</h3>
                                    {(view.priority || view.frequency || view.safetyTag) ? (
                                        <p className="mt-1 text-xs text-slate-500">
                                            {view.priority ? `Priority: ${view.priority}` : null}
                                            {view.priority && view.frequency ? ' | ' : null}
                                            {view.frequency ? `Frequency: ${view.frequency}` : null}
                                            {(view.priority || view.frequency) && view.safetyTag ? ' | ' : null}
                                            {view.safetyTag ? `Safety: ${view.safetyTag}` : null}
                                        </p>
                                    ) : null}
                                    {view.details ? <p className="mt-1 text-sm text-slate-700">{view.details}</p> : null}
                                    {view.citation ? <p className="mt-2 text-xs text-slate-500">Citation: {view.citation}</p> : null}

                                    {view.itemId ? (
                                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                                            <p className="text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">Edit Item</p>
                                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`status-${view.itemId}`}>Status</Label>
                                                    <select
                                                        id={`status-${view.itemId}`}
                                                        value={draft?.status ?? view.status ?? 'todo'}
                                                        onChange={(event) => onUpdateDraft(view.itemId!, 'status', event.target.value)}
                                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                                    >
                                                        <option value="todo">todo</option>
                                                        <option value="in_progress">in_progress</option>
                                                        <option value="done">done</option>
                                                        <option value="blocked">blocked</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`assignee-${view.itemId}`}>Assignee</Label>
                                                    <Input
                                                        id={`assignee-${view.itemId}`}
                                                        value={draft?.assignee ?? view.assignee ?? ''}
                                                        onChange={(event) => onUpdateDraft(view.itemId!, 'assignee', event.target.value)}
                                                        placeholder="Optional assignee"
                                                    />
                                                </div>

                                                <div className="space-y-1.5 md:col-span-2">
                                                    <Label htmlFor={`notes-${view.itemId}`}>Notes</Label>
                                                    <textarea
                                                        id={`notes-${view.itemId}`}
                                                        value={draft?.notes ?? view.notes ?? ''}
                                                        onChange={(event) => onUpdateDraft(view.itemId!, 'notes', event.target.value)}
                                                        rows={3}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <Button size="sm" variant="outline" disabled={savingItemId === view.itemId} onClick={() => void onSaveItem(view.itemId!)}>
                                                    {savingItemId === view.itemId ? 'Saving...' : 'Save Item'}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : null}
                                </article>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
