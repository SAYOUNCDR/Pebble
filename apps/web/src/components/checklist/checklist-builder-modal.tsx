import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { GenerateChecklistPayload, Provider, RetrievalMode } from '../../features/pipeline/types'

export interface ChecklistBuilderModalProps {
    open: boolean
    onClose: () => void
    onGenerate: (payload: GenerateChecklistPayload) => Promise<void>
    loading?: boolean
    suggestedPayload?: Partial<GenerateChecklistPayload>
    manualName?: string
}

export function ChecklistBuilderModal({
    open,
    onClose,
    onGenerate,
    loading = false,
    suggestedPayload,
    manualName,
}: ChecklistBuilderModalProps): React.JSX.Element | null {
    const suggestedChecklistName = suggestedPayload?.checklistName ?? (manualName ? `${manualName} Checklist` : '')
    const [objective, setObjective] = useState(suggestedPayload?.objective ?? 'Generate a practical operations checklist.')
    const [checklistName, setChecklistName] = useState(suggestedChecklistName)
    const [maxItems, setMaxItems] = useState(suggestedPayload?.maxItems ?? 20)
    const [provider, setProvider] = useState<Provider>(suggestedPayload?.provider ?? 'local')
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(suggestedPayload?.retrievalMode ?? 'heuristic')
    const [strictCitations, setStrictCitations] = useState(suggestedPayload?.strictCitations ?? true)
    const [error, setError] = useState<string | null>(null)

    if (!open) return null

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        try {
            await onGenerate({
                checklistName: checklistName.trim() || undefined,
                objective: objective.trim(),
                maxItems,
                provider,
                retrievalMode,
                strictCitations,
            })
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate checklist')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Build Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="checklistName">Checklist Name</Label>
                            <Input
                                id="checklistName"
                                value={checklistName}
                                onChange={(e) => setChecklistName(e.target.value)}
                                placeholder="Boiler Safety Checklist"
                            />
                            <p className="text-xs text-slate-500">A friendly name that will appear in the sidebar and checklist pages.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="objective">Objective</Label>
                            <textarea
                                id="objective"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="maxItems">Max Items</Label>
                                <Input
                                    id="maxItems"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={maxItems}
                                    onChange={(e) => setMaxItems(Number(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="provider">Provider</Label>
                                <select
                                    id="provider"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value as Provider)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                >
                                    <option value="local">Local (Gemma)</option>
                                    <option value="pageindex">PageIndex</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="retrievalMode">Retrieval Mode</Label>
                                <select
                                    id="retrievalMode"
                                    value={retrievalMode}
                                    onChange={(e) => setRetrievalMode(e.target.value as RetrievalMode)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                >
                                    <option value="heuristic">Heuristic</option>
                                    <option value="tree_search">Tree Search</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    id="strictCitations"
                                    type="checkbox"
                                    checked={strictCitations}
                                    onChange={(e) => setStrictCitations(e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                <Label htmlFor="strictCitations" className="cursor-pointer text-sm">
                                    Strict Citations
                                </Label>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'Generating...' : 'Generate Checklist'}
                            </Button>
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
