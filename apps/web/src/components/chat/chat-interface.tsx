import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { ChatMessage } from '../../features/chat/chat-api'
import { chatApi } from '../../features/chat/chat-api'

export interface ChatInterfaceProps {
    token: string
    manualId: string
    onSuggestChecklist?: (payload: ChatMessage['suggestedChecklistPayload']) => void
}

export function ChatInterface({ token, manualId, onSuggestChecklist }: ChatInterfaceProps): React.JSX.Element {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, sending])

    const onSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || sending) return

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setSending(true)
        setError(null)

        try {
            const response = await chatApi.sendMessage(token, {
                manualId,
                message: input,
            })

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.reply,
                timestamp: Date.now(),
                suggestedChecklistPayload: response.suggestedChecklistPayload,
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center text-center">
                        <div>
                            <p className="text-sm text-slate-500">Start a conversation about this manual</p>
                            <p className="mt-1 text-xs text-slate-400">Ask questions or request checklist generation</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-xs rounded-lg px-3 py-2 ${msg.role === 'user'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-900'
                                }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                            {msg.suggestedChecklistPayload && (
                                <button
                                    onClick={() => onSuggestChecklist?.(msg.suggestedChecklistPayload)}
                                    className="mt-2 text-xs font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900"
                                >
                                    Generate this checklist →
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex justify-start">
                        <div className="max-w-xs rounded-lg bg-slate-100 px-3 py-2 text-slate-900">
                            <div className="flex items-center gap-1">
                                <span className="sr-only">Assistant is typing</span>
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 p-4">
                <form onSubmit={onSendMessage} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the manual or request a checklist..."
                        disabled={sending}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={sending || !input.trim()} size="sm">
                        {sending ? 'Thinking...' : 'Send'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
