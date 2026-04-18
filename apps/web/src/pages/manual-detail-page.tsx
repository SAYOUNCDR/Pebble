import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useAuth } from "../features/auth/auth-context"
import { pipelineApi } from "../features/pipeline/pipeline-api"
import type { GenerateChecklistPayload, Manual } from "../features/pipeline/types"
import { ChatInterface } from "../components/chat/chat-interface"
import { ChecklistBuilderModal } from "../components/checklist/checklist-builder-modal"
import { ChecklistListSidebar } from "../components/checklist/checklist-list-sidebar"
import { ManualInfoPanel } from "../components/manual/manual-info-panel"
import type { ChatMessage } from "../features/chat/chat-api"

export function ManualDetailPage(): React.JSX.Element {
    const { token } = useAuth()
    const { manualId = "" } = useParams()
    const navigate = useNavigate()

    const [manual, setManual] = useState<Manual | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [builderOpen, setBuilderOpen] = useState(false)
    const [builderSuggestedPayload, setBuilderSuggestedPayload] = useState<Partial<GenerateChecklistPayload> | undefined>()
    const [generatingChecklist, setGeneratingChecklist] = useState(false)
    const [checklistListKey, setChecklistListKey] = useState(0)

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
                setError(err instanceof Error ? err.message : "Failed to load manual.")
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [manualId, token])

    const onGenerateChecklist = async (payload: GenerateChecklistPayload) => {
        if (!token || !manual) return

        setGeneratingChecklist(true)
        setError(null)

        try {
            const response = await pipelineApi.generateChecklist(token, manual.manualId, payload)
            setChecklistListKey((prev) => prev + 1)
            navigate(`/jobs/${response.jobId}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate checklist")
        } finally {
            setGeneratingChecklist(false)
        }
    }

    const onChatSuggestChecklist = (payload: ChatMessage["suggestedChecklistPayload"]) => {
        if (payload) {
            setBuilderSuggestedPayload(payload)
            setBuilderOpen(true)
        }
    }

    if (loading) {
        return (
            <main className="mx-auto w-full px-4 py-10">
                <p className="text-center text-slate-600">Loading manual...</p>
            </main>
        )
    }

    if (!manual) {
        return (
            <main className="mx-auto w-full px-4 py-10">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">Manual not found</p>
                    <Link to="/manuals" className="text-sm text-slate-600 underline underline-offset-4">
                        Back to manuals
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto w-full h-screen flex flex-col bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{manual.manualName}</h1>
                        <p className="text-sm text-slate-600">Chat, build checklists, and manage</p>
                    </div>
                    <Link to="/manuals" className="text-sm text-slate-600 underline underline-offset-4">
                        Back to manuals
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex-1 overflow-hidden px-6 py-4">
                <div className="grid gap-4 h-full grid-cols-4">
                    {/* Left sidebar: Checklist list */}
                    <div key={checklistListKey} className="col-span-1 overflow-y-auto">
                        <ChecklistListSidebar
                            manualId={manual.manualId}
                            onRefresh={() => setChecklistListKey((prev) => prev + 1)}
                        />
                    </div>

                    {/* Center: Chat interface */}
                    <div className="col-span-2 overflow-hidden">
                        {token && (
                            <ChatInterface
                                token={token}
                                manualId={manual.manualId}
                                onSuggestChecklist={onChatSuggestChecklist}
                            />
                        )}
                    </div>

                    {/* Right sidebar: Manual info + New Checklist button */}
                    <div key={`${checklistListKey}-info`} className="col-span-1 overflow-y-auto">
                        <ManualInfoPanel
                            manual={manual}
                            onNewChecklist={() => {
                                setBuilderSuggestedPayload(undefined)
                                setBuilderOpen(true)
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Checklist Builder Modal */}
            <ChecklistBuilderModal
                open={builderOpen}
                onClose={() => {
                    setBuilderOpen(false)
                    setBuilderSuggestedPayload(undefined)
                }}
                onGenerate={onGenerateChecklist}
                loading={generatingChecklist}
                suggestedPayload={builderSuggestedPayload}
            />
        </main>
    )
}
