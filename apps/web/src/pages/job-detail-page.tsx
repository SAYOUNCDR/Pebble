import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Job, QueueStatus } from '../features/pipeline/types'

export function JobDetailPage(): React.JSX.Element {
    const { token } = useAuth()
    const { jobId = '' } = useParams()
    const [job, setJob] = useState<Job | null>(null)
    const [queue, setQueue] = useState<QueueStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadJob = async () => {
        if (!token || !jobId) {
            return
        }

        try {
            setLoading(true)
            const response = await pipelineApi.getJob(token, jobId)
            setJob(response.job)
            setQueue(response.queue)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load job.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadJob()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, jobId])

    useEffect(() => {
        if (!job || job.status === 'completed' || job.status === 'failed') {
            return
        }

        const timer = setInterval(() => {
            void loadJob()
        }, 3000)

        return () => clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [job?.status])

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
            <div className="mb-4 flex items-center gap-3">
                <Link to="/jobs" className="text-sm text-slate-600 underline underline-offset-4">
                    Back to jobs
                </Link>
                <Button variant="outline" size="sm" onClick={() => void loadJob()}>
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Job {jobId}</CardTitle>
                    <CardDescription>{loading ? 'Loading...' : `Status: ${job?.status ?? 'unknown'}`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                    {job ? (
                        <>
                            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
                                <p>
                                    <span className="font-medium text-slate-900">Manual:</span> {job.manualId}
                                </p>
                                <p>
                                    <span className="font-medium text-slate-900">Provider:</span> {job.provider}
                                </p>
                                <p>
                                    <span className="font-medium text-slate-900">Retrieval:</span> {job.retrievalMode}
                                </p>
                                <p>
                                    <span className="font-medium text-slate-900">Queue:</span> {queue?.state ?? 'unknown'}
                                </p>
                                {job.errorMessage ? (
                                    <p className="md:col-span-2 text-red-700">
                                        <span className="font-medium">Error:</span> {job.errorMessage}
                                    </p>
                                ) : null}
                            </div>

                            {job.checklistId ? (
                                <Link to={`/checklists/${job.checklistId}`}>
                                    <Button>Open Checklist</Button>
                                </Link>
                            ) : null}
                        </>
                    ) : null}
                </CardContent>
            </Card>
        </main>
    )
}
