import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useAuth } from "../features/auth/auth-context"
import { pipelineApi } from "../features/pipeline/pipeline-api"
import type { GenerateChecklistPayload, Manual } from "../features/pipeline/types"
import { ChatInterface } from "../components/chat/chat-interface"
import { ChecklistBuilderModal } from "../components/checklist/checklist-builder-modal"
import { ChecklistListSidebar } from "../components/checklist/checklist-list-sidebar"
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
        <main className="fixed inset-x-0 bottom-4 mx-auto flex w-[80%] max-w-6xl flex-col overflow-hidden bg-slate-50 px-0" style={{ top: '5.5rem' }}>

            <section className="sr-only">
                <div>
                    <h1>{manual.manualName}</h1>
                </div>
            </section>

            {error && (
                <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
                {/* Left sidebar: Manual info + checklist list */}
                <div key={checklistListKey} className="min-h-0 h-full self-stretch overflow-hidden rounded-3xl">
                    <ChecklistListSidebar
                        manualId={manual.manualId}
                        manual={manual}
                        onNewChecklist={() => {
                            setBuilderSuggestedPayload(undefined)
                            setBuilderOpen(true)
                        }}
                        onRefresh={() => setChecklistListKey((prev) => prev + 1)}
                    />
                </div>

                {/* Center: Chat interface */}
                <div className="min-h-0 h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                    {token && (
                        <ChatInterface
                            token={token}
                            manualId={manual.manualId}
                            onSuggestChecklist={onChatSuggestChecklist}
                        />
                    )}
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
                manualName={manual.manualName}
            />
        </main>
    )
}
