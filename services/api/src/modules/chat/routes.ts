import express, { type Request, type Response } from 'express'
import { z } from 'zod'

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

    // Simple AI response generation - enhance with real LLM integration
    const reply = await generateChatReply(parsed.data.message, manual.manualName)
    const suggestedChecklistPayload = detectChecklistRequest(parsed.data.message)

    response.status(200).json({
        reply,
        ...(suggestedChecklistPayload && { suggestedChecklistPayload }),
    })
})

async function generateChatReply(message: string, manualName: string): Promise<string> {
    // TODO: Integrate with AI service for real responses
    // For now, return a contextual response
    if (message.toLowerCase().includes('checklist')) {
        return `I can help generate a checklist from "${manualName}". Tell me what specific areas you'd like to cover, and I'll create a checklist for you. You can also use the "New Checklist" button to customize generation settings.`
    }

    if (message.toLowerCase().includes('question') || message.toLowerCase().includes('?')) {
        return `I'm analyzing "${manualName}" to answer your question. Based on the manual content, here's what I found relevant to your inquiry. You can also generate a checklist to create structured documentation.`
    }

    return `I'm here to help with "${manualName}". I can answer questions about the manual content, suggest checklist items, or help you generate a complete checklist. What would you like to do?`
}

function detectChecklistRequest(message: string): Partial<{ objective: string; maxItems: number; provider: string; retrievalMode: string; strictCitations: boolean }> | null {
    const lowerMessage = message.toLowerCase()

    // Detect keywords that suggest checklist generation
    if (
        lowerMessage.includes('generate') &&
        (lowerMessage.includes('checklist') || lowerMessage.includes('list'))
    ) {
        // Extract objective from message or use default
        let objective = 'Generate a practical checklist based on the manual.'

        if (lowerMessage.includes('safety')) {
            objective = 'Generate a safety compliance checklist.'
        } else if (lowerMessage.includes('operations')) {
            objective = 'Generate an operations checklist.'
        } else if (lowerMessage.includes('maintenance')) {
            objective = 'Generate a maintenance checklist.'
        }

        // Default payload for suggested checklist
        return {
            objective,
            maxItems: 20,
            provider: 'local',
            retrievalMode: 'heuristic',
            strictCitations: true,
        }
    }

    return null
}
