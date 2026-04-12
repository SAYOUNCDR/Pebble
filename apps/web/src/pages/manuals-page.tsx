import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Manual } from '../features/pipeline/types'

export function ManualsPage(): React.JSX.Element {
    const { token } = useAuth()
    const [manuals, setManuals] = useState<Manual[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [manualId, setManualId] = useState('')
    const [manualName, setManualName] = useState('')
    const [file, setFile] = useState<File | null>(null)

    const canSubmit = useMemo(() => Boolean(manualId.trim() && manualName.trim() && file), [manualId, manualName, file])

    const loadManuals = async () => {
        if (!token) {
            return
        }

        try {
            setLoading(true)
            const response = await pipelineApi.listManuals(token)
            setManuals(response.manuals)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load manuals.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadManuals()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    const onCreateManual = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!token || !file || !canSubmit) {
            return
        }

        setError(null)
        setSubmitting(true)
        try {
            await pipelineApi.createManual(token, {
                manualId: manualId.trim(),
                manualName: manualName.trim(),
                file,
            })
            setManualId('')
            setManualName('')
            setFile(null)
            await loadManuals()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create manual.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manuals</h1>
                <p className="mt-2 text-sm text-slate-600">Upload a PDF manual, then generate checklists from its content.</p>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Upload Manual</CardTitle>
                        <CardDescription>Create a manual record with an attached PDF file.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={onCreateManual}>
                            <div className="space-y-2">
                                <Label htmlFor="manual-id">Manual ID</Label>
                                <Input id="manual-id" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="newio-manual" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual-name">Manual Name</Label>
                                <Input id="manual-name" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="New IO System Manual" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual-file">PDF File</Label>
                                <Input
                                    id="manual-file"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                />
                            </div>
                            <Button type="submit" disabled={!canSubmit || submitting}>
                                {submitting ? 'Uploading...' : 'Upload Manual'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Your Manuals</CardTitle>
                        <CardDescription>{loading ? 'Loading manuals...' : `${manuals.length} manual(s) found.`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                        {manuals.length === 0 && !loading ? <p className="text-sm text-slate-600">No manuals yet.</p> : null}

                        <div className="space-y-3">
                            {manuals.map((manual) => (
                                <div key={manual.manualId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-slate-900">{manual.manualName}</p>
                                            <p className="text-xs text-slate-500">ID: {manual.manualId}</p>
                                            <p className="text-xs text-slate-500">File: {manual.originalFileName}</p>
                                        </div>
                                        <Link to={`/manuals/${manual.manualId}`}>
                                            <Button size="sm" variant="outline">
                                                Open
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </main>
    )
}
