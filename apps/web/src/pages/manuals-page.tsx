import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Manual } from '../features/pipeline/types'

export function ManualsPage(): React.JSX.Element {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [manuals, setManuals] = useState<Manual[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Manuals</h1>
                        <p className="mt-2 text-sm text-slate-600">Manage your uploaded PDF manuals and generate checklists from their content.</p>
                    </div>
                    <Button onClick={() => navigate('/upload-manual')} className="whitespace-nowrap">
                        Upload Manual
                    </Button>
                </div>
            </section>

            <section className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Available Manuals</CardTitle>
                        <CardDescription>{loading ? 'Loading manuals...' : `${manuals.length} manual(s) found.`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                        {manuals.length === 0 && !loading ? (
                            <p className="text-center text-sm text-slate-600 py-8">
                                No manuals yet.{' '}
                                <button className="font-medium text-blue-600 hover:underline" onClick={() => navigate('/upload-manual')}>
                                    Upload your first manual
                                </button>
                            </p>
                        ) : null}

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
