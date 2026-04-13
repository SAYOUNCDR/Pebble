import express, { type Request, type Response } from "express";
import { z } from "zod";

import { HttpError } from "../../utils/httpError.js";
import { requireAuth } from "../auth/middleware.js";
import { createChecklistPdfExport } from "../exports/service.js";
import { ChecklistModel } from "./model.js";

export const checklistsRouter = express.Router();

const patchChecklistSchema = z
    .object({
        items: z.array(z.record(z.string(), z.unknown())).min(1).optional(),
        warnings: z.array(z.string()).optional(),
    })
    .refine((value) => value.items !== undefined || value.warnings !== undefined, {
        message: "At least one mutable checklist field is required.",
    });

const patchChecklistItemSchema = z
    .object({
        status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
        assignee: z.string().max(120).nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
    })
    .refine((value) => value.status !== undefined || value.assignee !== undefined || value.notes !== undefined, {
        message: "At least one mutable item field is required.",
    });

checklistsRouter.get("/:checklistId", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const checklistId = request.params.checklistId;
    if (!checklistId) {
        throw new HttpError("Checklist ID is required.", 400);
    }

    const checklist = await ChecklistModel.findOne({ ownerUserId, checklistId }).lean();
    if (!checklist) {
        throw new HttpError("Checklist not found.", 404);
    }

    response.status(200).json({ checklist });
});

checklistsRouter.patch("/:checklistId", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const checklistId = request.params.checklistId;
    if (!checklistId) {
        throw new HttpError("Checklist ID is required.", 400);
    }

    const parsed = patchChecklistSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid checklist patch payload.", 400, parsed.error.flatten());
    }

    const checklist = await ChecklistModel.findOne({ ownerUserId, checklistId });
    if (!checklist) {
        throw new HttpError("Checklist not found.", 404);
    }

    if (parsed.data.items !== undefined) {
        checklist.items = parsed.data.items;
        checklist.itemCount = parsed.data.items.length;
    }

    if (parsed.data.warnings !== undefined) {
        checklist.warnings = parsed.data.warnings;
    }

    await checklist.save();
    response.status(200).json({ checklist });
});

checklistsRouter.patch("/:checklistId/items/:itemId", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const checklistId = request.params.checklistId;
    const itemId = request.params.itemId;
    if (!checklistId || !itemId) {
        throw new HttpError("Checklist ID and item ID are required.", 400);
    }

    const parsed = patchChecklistItemSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid checklist item patch payload.", 400, parsed.error.flatten());
    }

    const checklist = await ChecklistModel.findOne({ ownerUserId, checklistId });
    if (!checklist) {
        throw new HttpError("Checklist not found.", 404);
    }

    const currentItems = Array.isArray(checklist.items) ? checklist.items : [];
    const nextItems = currentItems.map((item) => {
        if (typeof item !== "object" || item === null) {
            return item;
        }

        const asRecord = item as Record<string, unknown>;
        const currentItemId = String(asRecord.item_id ?? asRecord.itemId ?? "");
        if (currentItemId !== itemId) {
            return item;
        }

        return {
            ...asRecord,
            ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
            ...(parsed.data.assignee !== undefined ? { assignee: parsed.data.assignee } : {}),
            ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        };
    });

    const changed = nextItems.some((item) => {
        if (typeof item !== "object" || item === null) {
            return false;
        }
        const asRecord = item as Record<string, unknown>;
        return String(asRecord.item_id ?? asRecord.itemId ?? "") === itemId;
    });

    if (!changed) {
        throw new HttpError("Checklist item not found.", 404);
    }

    checklist.items = nextItems;
    await checklist.save();

    response.status(200).json({ checklist });
});

checklistsRouter.post("/:checklistId/export/pdf", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const checklistId = request.params.checklistId;
    if (!checklistId) {
        throw new HttpError("Checklist ID is required.", 400);
    }

    const checklist = await ChecklistModel.findOne({ ownerUserId, checklistId });
    if (!checklist) {
        throw new HttpError("Checklist not found.", 404);
    }

    const exportArtifact = await createChecklistPdfExport(ownerUserId, checklist);

    response.status(201).json({
        status: exportArtifact.status,
        exportId: exportArtifact.exportId,
    });
});
