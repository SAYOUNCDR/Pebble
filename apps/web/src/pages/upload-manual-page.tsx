import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../features/auth/auth-context'
import { pipelineApi } from '../features/pipeline/pipeline-api'

export function UploadManualPage(): React.JSX.Element {
    const { token } = useAuth()
    const navigate = useNavigate()

    const [manualId, setManualId] = useState('')
    const [manualName, setManualName] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const canSubmit = useMemo(() => Boolean(manualId.trim() && manualName.trim() && file), [manualId, manualName, file])

    const onCreateManual = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!token || !file || !canSubmit) {
            return
        }

        setError(null)
        setSuccess(false)
        setSubmitting(true)
        try {
            await pipelineApi.createManual(token, {
                manualId: manualId.trim(),
                manualName: manualName.trim(),
                file,
            })
            setSuccess(true)
            setManualId('')
            setManualName('')
            setFile(null)

            // Redirect to manuals list after 2 seconds
            setTimeout(() => {
                navigate('/manuals')
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create manual.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-4 py-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Manual</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Create a new manual record with an attached PDF file. After uploading, you'll be able to generate checklists from the content.
                </p>
            </section>

            <section className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Manual Details</CardTitle>
                        <CardDescription>Fill in the form below to upload a new manual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                        {success && (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                Manual uploaded successfully! Redirecting to manuals list...
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={onCreateManual}>
                            <div className="space-y-2">
                                <Label htmlFor="manual-id">Manual ID</Label>
                                <Input
                                    id="manual-id"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    placeholder="e.g., newio-manual"
                                    disabled={submitting || success}
                                />
                                <p className="text-xs text-slate-500">Unique identifier for this manual (no spaces or special characters).</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manual-name">Manual Name</Label>
                                <Input
                                    id="manual-name"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                    placeholder="e.g., New IO System Manual"
                                    disabled={submitting || success}
                                />
                                <p className="text-xs text-slate-500">A descriptive name for this manual.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manual-file">PDF File</Label>
                                <Input
                                    id="manual-file"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    disabled={submitting || success}
                                />
                                <p className="text-xs text-slate-500">Upload a PDF file (maximum file size may vary).</p>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={!canSubmit || submitting || success}>
                                    {submitting ? 'Uploading...' : success ? 'Uploaded!' : 'Upload Manual'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => navigate('/manuals')} disabled={submitting}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </section>
        </main>
    )
}
