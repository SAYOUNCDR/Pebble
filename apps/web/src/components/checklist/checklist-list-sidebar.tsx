import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useAuth } from '../../features/auth/auth-context'
import { pipelineApi } from '../../features/pipeline/pipeline-api'
import type { Checklist, Manual } from '../../features/pipeline/types'

export interface ChecklistListSidebarProps {
    manualId: string
    manual: Manual
    onNewChecklist: () => void
    onRefresh?: () => void
}

export function ChecklistListSidebar({ manualId, manual, onNewChecklist, onRefresh }: ChecklistListSidebarProps): React.JSX.Element {
    const { token } = useAuth()
    const [checklists, setChecklists] = useState<Checklist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadChecklists = async () => {
        if (!token) return

        try {
            setLoading(true)
            setError(null)
            const response = await pipelineApi.getChecklistsByManual(token, manualId)
            setChecklists(response.checklists)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load checklists')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadChecklists()
    }, [manualId, token])

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Manual Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-700">
                    <div>
                        <p className="font-semibold text-slate-600">Name</p>
                        <p className="text-sm text-slate-900">{manual.manualName}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-600">File</p>
                        <p className="truncate">{manual.originalFileName}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-600">Uploaded</p>
                        <p>{new Date(manual.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button onClick={onNewChecklist} className="w-full">
                        New Checklist
                    </Button>
                </CardContent>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-base">Generated Checklists</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading && <p className="text-xs text-slate-500">Loading...</p>}
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    {checklists.length === 0 && !loading && (
                        <p className="text-xs text-slate-500">No checklists yet. Generate one from the chat or builder.</p>
                    )}
                    {checklists.map((checklist) => (
                        <Link
                            key={checklist.checklistId}
                            to={`/checklists/${checklist.checklistId}`}
                            className="block rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs hover:bg-slate-100"
                        >
                            <p className="font-semibold text-slate-900 truncate">{checklist.checklistId}</p>
                            <p className="text-slate-600">{checklist.itemCount} items</p>
                        </Link>
                    ))}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            void loadChecklists()
                            onRefresh?.()
                        }}
                        className="w-full text-xs"
                    >
                        Refresh
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
