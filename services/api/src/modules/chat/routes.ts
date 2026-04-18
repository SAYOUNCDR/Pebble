import express, { type Request, type Response } from 'express'
import { z } from 'zod'

import { chat as chatWithAiService } from '../../clients/aiServiceClient.js'
import { HttpError } from '../../utils/httpError.js'
import { requireAuth } from '../auth/middleware.js'
import { ChatThreadModel } from './model.js'
import { ManualModel } from '../manuals/model.js'

export const chatRouter = express.Router()

const chatQuerySchema = z.object({
    manualId: z.string().min(3).max(80),
    message: z.string().min(1).max(500),
})

const chatHistoryQuerySchema = z.object({
    manualId: z.string().min(3).max(80),
})

const persistedChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.union([z.date(), z.string(), z.number()]),
    suggestedChecklistPayload: z
        .object({
            checklistName: z.string().optional(),
            objective: z.string(),
            maxItems: z.number(),
            provider: z.enum(['local', 'pageindex']),
            retrievalMode: z.enum(['heuristic', 'tree_search']),
            strictCitations: z.boolean(),
        })
        .optional(),
})

type PersistedChatMessage = z.infer<typeof persistedChatMessageSchema>

type SerializedChatMessage = {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    suggestedChecklistPayload?: PersistedChatMessage['suggestedChecklistPayload']
}

function serializeChatMessages(messages: unknown[]): SerializedChatMessage[] {
    const serialized: SerializedChatMessage[] = []

    for (const rawMessage of messages) {
        const parsed = persistedChatMessageSchema.safeParse(rawMessage)
        if (!parsed.success) {
            continue
        }

        const message = parsed.data
        const normalizedTimestamp =
            message.timestamp instanceof Date
                ? message.timestamp.getTime()
                : typeof message.timestamp === 'number'
                  ? message.timestamp
                  : new Date(message.timestamp).getTime()

        serialized.push({
            role: message.role,
            content: message.content,
            timestamp: normalizedTimestamp,
            ...(message.suggestedChecklistPayload ? { suggestedChecklistPayload: message.suggestedChecklistPayload } : {}),
        })
    }

    return serialized
}

chatRouter.get('/history', requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub
    if (!ownerUserId) {
        throw new HttpError('Unauthorized.', 401)
    }

    const parsed = chatHistoryQuerySchema.safeParse(request.query)
    if (!parsed.success) {
        throw new HttpError('Invalid chat history payload.', 400, parsed.error.flatten())
    }

    const manual = await ManualModel.findOne({ ownerUserId, manualId: parsed.data.manualId }).lean()
    if (!manual) {
        throw new HttpError('Manual not found.', 404)
    }

    const thread = await ChatThreadModel.findOne({ ownerUserId, manualId: parsed.data.manualId }).lean()

    response.status(200).json({
        manualId: parsed.data.manualId,
        messages: serializeChatMessages(thread?.messages ?? []),
    })
})

chatRouter.post('/query', requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub
    if (!ownerUserId) {
        throw new HttpError('Unauthorized.', 401)
    }

    const parsed = chatQuerySchema.safeParse(request.body)
    if (!parsed.success) {
        throw new HttpError('Invalid chat query payload.', 400, parsed.error.flatten())
    }

    const manual = await ManualModel.findOne({ ownerUserId, manualId: parsed.data.manualId }).lean()
    if (!manual) {
        throw new HttpError('Manual not found.', 404)
    }

    const thread = await ChatThreadModel.findOneAndUpdate(
        { ownerUserId, manualId: manual.manualId },
        {
            $setOnInsert: { ownerUserId, manualId: manual.manualId },
            $set: { updatedAt: new Date() },
        },
        { new: true, upsert: true },
    ).lean()

    const chatHistory = serializeChatMessages(thread?.messages ?? []).slice(-12)

    const aiResponse = await chatWithAiService({
        manual_id: manual.manualId,
        message: parsed.data.message,
        manual_name: manual.manualName,
        file_path: manual.storedFilePath,
        chat_history: chatHistory.map((message) => ({ role: message.role, content: message.content })),
    })

    const nextMessages = [
        ...(thread?.messages ?? []),
        {
            role: 'user',
            content: parsed.data.message,
            timestamp: new Date(),
        },
        {
            role: 'assistant',
            content: aiResponse.reply,
            timestamp: new Date(),
            ...(aiResponse.suggested_checklist_payload ? { suggestedChecklistPayload: aiResponse.suggested_checklist_payload } : {}),
        },
    ]

    await ChatThreadModel.updateOne(
        { ownerUserId, manualId: manual.manualId },
        { $set: { messages: nextMessages } },
        { upsert: true },
    )

    response.status(200).json({
        reply: aiResponse.reply,
        ...(aiResponse.suggested_checklist_payload && { suggestedChecklistPayload: aiResponse.suggested_checklist_payload }),
    })
})
