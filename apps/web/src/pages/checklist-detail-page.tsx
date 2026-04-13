import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Checklist } from '../features/pipeline/types'

interface ChecklistItemView {
    title: string
    details?: string
    citation?: string
    priority?: string
    frequency?: string
    safetyTag?: string
}

function normalizeChecklistItem(item: unknown): ChecklistItemView {
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

    useEffect(() => {
        const load = async () => {
            if (!token || !checklistId) {
                return
            }

            try {
                setLoading(true)
                const response = await pipelineApi.getChecklist(token, checklistId)
                setChecklist(response.checklist)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load checklist.')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [token, checklistId])

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
            <div className="mb-4">
                <Link to="/jobs" className="text-sm text-slate-600 underline underline-offset-4">
                    Back to jobs
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Checklist {checklistId}</CardTitle>
                    <CardDescription>{loading ? 'Loading...' : `${checklist?.itemCount ?? 0} item(s)`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                    <div className="space-y-3">
                        {checklist?.items?.map((item, index) => {
                            const view = normalizeChecklistItem(item)
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
                                </article>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
