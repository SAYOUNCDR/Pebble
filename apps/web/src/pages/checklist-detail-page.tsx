import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Checklist, ChecklistItem } from '../features/pipeline/types'

type ChecklistStatus = 'todo' | 'in_progress' | 'done' | 'blocked'

const STATUS_OPTIONS: Array<{ value: ChecklistStatus; label: string; toneClass: string }> = [
    { value: 'todo', label: 'To Do', toneClass: 'bg-slate-100 text-slate-700' },
    { value: 'in_progress', label: 'In Progress', toneClass: 'bg-blue-50 text-blue-700' },
    { value: 'done', label: 'Done', toneClass: 'bg-emerald-50 text-emerald-700' },
    { value: 'blocked', label: 'Blocked', toneClass: 'bg-rose-50 text-rose-700' },
]

interface StatusDropdownProps {
    id: string
    value: ChecklistStatus
    onChange: (value: ChecklistStatus) => void
}

function StatusDropdown({ id, value, onChange }: StatusDropdownProps): React.JSX.Element {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!containerRef.current) {
                return
            }
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', onPointerDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
        }
    }, [])

    const selected = STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0]

    return (
        <div ref={containerRef} className="relative">
            <button
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left shadow-sm transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${selected.toneClass}`}>
                    {selected.label}
                </span>
                <span aria-hidden="true" className={`text-xs text-slate-500 transition ${open ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {open ? (
                <div
                    role="listbox"
                    className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
                >
                    {STATUS_OPTIONS.map((option) => {
                        const selectedOption = option.value === value
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={selectedOption}
                                onClick={() => {
                                    onChange(option.value)
                                    setOpen(false)
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${selectedOption
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {selectedOption ? <span aria-hidden="true">✓</span> : null}
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

interface ChecklistItemView {
    itemId?: string
    title: string
    details?: string
    citation?: string
    priority?: string
    frequency?: string
    safetyTag?: string
    status?: ChecklistStatus
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

    const [itemDrafts, setItemDrafts] = useState<Record<string, { status: ChecklistStatus; notes: string }>>({})

    useEffect(() => {
        const load = async () => {
            if (!token || !checklistId) {
                return
            }

            try {
                setLoading(true)
                const response = await pipelineApi.getChecklist(token, checklistId)
                setChecklist(response.checklist)
                const nextDrafts: Record<string, { status: ChecklistStatus; notes: string }> = {}
                response.checklist.items.forEach((item) => {
                    const normalized = normalizeChecklistItem(item)
                    if (!normalized.itemId) {
                        return
                    }
                    nextDrafts[normalized.itemId] = {
                        status: normalized.status ?? 'todo',
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

    const onUpdateDraft = (itemId: string, field: 'status' | 'notes', value: string) => {
        setItemDrafts((prev) => {
            const current = prev[itemId] ?? { status: 'todo', notes: '' }
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
                assignee: null,
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

    const doneCount = checklist?.items
        ? checklist.items.reduce((count, item) => {
            const view = normalizeChecklistItem(item)
            const status = view.itemId ? (itemDrafts[view.itemId]?.status ?? view.status ?? 'todo') : (view.status ?? 'todo')
            return status === 'done' ? count + 1 : count
        }, 0)
        : 0

    const totalCount = checklist?.itemCount ?? checklist?.items?.length ?? 0

    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-8">
            <section className="mb-5 rounded-2xl border border-slate-200 bg-linear-to-r from-white to-slate-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/jobs"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                        <span aria-hidden="true">&larr;</span>
                        <span>Back to Jobs</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {doneCount}/{totalCount} done
                        </div>
                        <Button size="sm" onClick={onExportPdf} disabled={exporting || loading || !checklist}>
                            {exporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                    </div>
                </div>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">{checklist?.checklistName ?? `Checklist ${checklistId}`}</CardTitle>
                    <CardDescription>{loading ? 'Loading checklist...' : `${totalCount} total item(s) ready for execution`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                    <div className="space-y-4">
                        {checklist?.items?.map((item, index) => {
                            const view = normalizeChecklistItem(item)
                            const draft = view.itemId ? itemDrafts[view.itemId] : undefined
                            return (
                                <article key={`${view.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <h3 className="text-base font-semibold text-slate-900">{index + 1}. {view.title}</h3>
                                        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                            {draft?.status ?? view.status ?? 'todo'}
                                        </div>
                                    </div>

                                    {(view.priority || view.frequency || view.safetyTag) ? (
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            {view.priority ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Priority: {view.priority}</span> : null}
                                            {view.frequency ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Frequency: {view.frequency}</span> : null}
                                            {view.safetyTag ? <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">Safety: {view.safetyTag}</span> : null}
                                        </div>
                                    ) : null}

                                    {view.details ? <p className="mt-2 text-sm leading-6 text-slate-700">{view.details}</p> : null}
                                    {view.citation ? <p className="mt-2 text-xs text-slate-500">Citation: {view.citation}</p> : null}

                                    {view.itemId ? (
                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                            <p className="text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">Execution Notes</p>
                                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`status-${view.itemId}`} className="cursor-pointer">Status</Label>
                                                    <StatusDropdown
                                                        id={`status-${view.itemId}`}
                                                        value={draft?.status ?? view.status ?? 'todo'}
                                                        onChange={(nextStatus) => onUpdateDraft(view.itemId!, 'status', nextStatus)}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 md:col-span-2">
                                                    <Label htmlFor={`notes-${view.itemId}`} className="cursor-pointer">Notes</Label>
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
