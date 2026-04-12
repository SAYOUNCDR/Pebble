import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Manual, Provider, RetrievalMode } from '../features/pipeline/types'

export function ManualDetailPage(): React.JSX.Element {
    const { token } = useAuth()
    const { manualId = '' } = useParams()
    const navigate = useNavigate()

    const [manual, setManual] = useState<Manual | null>(null)
    const [objective, setObjective] = useState('Generate a practical operations checklist.')
    const [maxItems, setMaxItems] = useState(20)
    const [provider, setProvider] = useState<Provider>('local')
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>('heuristic')
    const [strictCitations, setStrictCitations] = useState(true)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            if (!token || !manualId) {
                return
            }
            try {
                setLoading(true)
                const response = await pipelineApi.getManual(token, manualId)
                setManual(response.manual)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load manual.')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [manualId, token])

    const onGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!token || !manual) {
            return
        }

        setSubmitting(true)
        setError(null)
        try {
            const response = await pipelineApi.generateChecklist(token, manual.manualId, {
                objective: objective.trim(),
                maxItems,
                provider,
                retrievalMode,
                strictCitations,
            })
            navigate(`/jobs/${response.jobId}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to enqueue checklist generation.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
            <div className="mb-4">
                <Link to="/manuals" className="text-sm text-slate-600 underline underline-offset-4">
                    Back to manuals
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{manual?.manualName ?? 'Manual'}</CardTitle>
                    <CardDescription>
                        {loading ? 'Loading manual...' : `Manual ID: ${manual?.manualId ?? manualId}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                    <form className="space-y-4" onSubmit={onGenerate}>
                        <div className="space-y-2">
                            <Label htmlFor="objective">Objective</Label>
                            <textarea
                                id="objective"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="max-items">Max Items</Label>
                                <Input
                                    id="max-items"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxItems}
                                    onChange={(e) => setMaxItems(Number(e.target.value) || 1)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="provider">Provider</Label>
                                <select
                                    id="provider"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value as Provider)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                >
                                    <option value="local">local</option>
                                    <option value="pageindex">pageindex</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="retrieval-mode">Retrieval Mode</Label>
                                <select
                                    id="retrieval-mode"
                                    value={retrievalMode}
                                    onChange={(e) => setRetrievalMode(e.target.value as RetrievalMode)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                >
                                    <option value="heuristic">heuristic</option>
                                    <option value="tree_search">tree_search</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <input type="checkbox" checked={strictCitations} onChange={(e) => setStrictCitations(e.target.checked)} />
                                Strict citations
                            </label>
                        </div>

                        <Button type="submit" disabled={submitting || loading || !manual}>
                            {submitting ? 'Starting job...' : 'Generate Checklist'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}
