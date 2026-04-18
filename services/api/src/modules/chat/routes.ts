import express, { type Request, type Response } from 'express'
import { z } from 'zod'

import { chat as chatWithAiService } from '../../clients/aiServiceClient.js'
import { HttpError } from '../../utils/httpError.js'
import { requireAuth } from '../auth/middleware.js'
import { ManualModel } from '../manuals/model.js'

export const chatRouter = express.Router()

const chatQuerySchema = z.object({
    manualId: z.string().min(3).max(80),
    message: z.string().min(1).max(500),
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

    const aiResponse = await chatWithAiService({
        manual_id: manual.manualId,
        message: parsed.data.message,
        manual_name: manual.manualName,
        file_path: manual.storedFilePath,
    })

    response.status(200).json({
        reply: aiResponse.reply,
        ...(aiResponse.suggested_checklist_payload && { suggestedChecklistPayload: aiResponse.suggested_checklist_payload }),
    })
})
