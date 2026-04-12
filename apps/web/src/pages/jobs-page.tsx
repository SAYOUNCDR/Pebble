import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'
import type { Job } from '../features/pipeline/types'

export function JobsPage(): React.JSX.Element {
    const { token } = useAuth()
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadJobs = async () => {
        if (!token) {
            return
        }

        try {
            setLoading(true)
            const response = await pipelineApi.listJobs(token)
            setJobs(response.jobs)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load jobs.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadJobs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Jobs</CardTitle>
                        <CardDescription>{loading ? 'Loading jobs...' : `${jobs.length} job(s)`}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void loadJobs()}>
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                    {jobs.length === 0 && !loading ? <p className="text-sm text-slate-600">No jobs yet.</p> : null}

                    <div className="space-y-3">
                        {jobs.map((job) => (
                            <div key={job.queueJobId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-slate-900">{job.objective}</p>
                                        <p className="text-xs text-slate-500">Job ID: {job.queueJobId}</p>
                                        <p className="text-xs text-slate-500">Manual: {job.manualId}</p>
                                        <p className="text-xs text-slate-500">Status: {job.status}</p>
                                    </div>
                                    <Link to={`/jobs/${job.queueJobId}`}>
                                        <Button size="sm" variant="outline">
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
