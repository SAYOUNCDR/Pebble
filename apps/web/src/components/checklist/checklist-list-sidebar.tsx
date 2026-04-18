import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useAuth } from '../../features/auth/auth-context'
import type { Checklist } from '../../features/pipeline/types'

export interface ChecklistListSidebarProps {
    manualId: string
    onRefresh?: () => void
}

export function ChecklistListSidebar({ manualId, onRefresh }: ChecklistListSidebarProps): React.JSX.Element {
    const { token } = useAuth()
    const [checklists] = useState<Checklist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadChecklists = async () => {
        if (!token) return

        try {
            setLoading(true)
            setError(null)
            // We'll need to add a getChecklistsByManual endpoint or filter on frontend
            // For now, we'll show a placeholder
            // TODO: Implement list endpoint
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
                    onClick={onRefresh}
                    className="w-full text-xs"
                >
                    Refresh
                </Button>
            </CardContent>
        </Card>
    )
}
