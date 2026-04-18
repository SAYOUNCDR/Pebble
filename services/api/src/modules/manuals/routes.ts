import express, { type Request, type Response } from "express";
import { z } from "zod";

import { HttpError } from "../../utils/httpError.js";
import { requireAuth } from "../auth/middleware.js";
import { ChecklistModel } from "../checklists/model.js";
import { JobModel } from "../jobs/model.js";
import { enqueueChecklistGenerationJob } from "../jobs/queue.js";
import { ManualModel } from "./model.js";
import { manualUpload } from "./storage.js";

export const manualsRouter = express.Router();

const createManualSchema = z.object({
    manualId: z.string().min(3).max(80),
    manualName: z.string().min(2).max(140),
});

const generateSchema = z.object({
    checklistName: z.string().min(3).max(120).optional(),
    objective: z.string().min(3).max(400),
    maxItems: z.number().int().min(1).max(100).default(20),
    provider: z.enum(["local", "pageindex"]).default("local"),
    retrievalMode: z.enum(["heuristic", "tree_search"]).default("heuristic"),
    strictCitations: z.boolean().default(true),
});

manualsRouter.post("/", requireAuth, manualUpload.single("file"), async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const parsed = createManualSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid manual payload.", 400, parsed.error.flatten());
    }

    if (!request.file) {
        throw new HttpError("PDF file is required in multipart field 'file'.", 400);
    }

    const manualId = parsed.data.manualId.trim();
    const existing = await ManualModel.findOne({ ownerUserId, manualId }).lean();
    if (existing) {
        throw new HttpError("Manual ID already exists for this user.", 409);
    }

    const created = await ManualModel.create({
        ownerUserId,
        manualId,
        manualName: parsed.data.manualName.trim(),
        originalFileName: request.file.originalname,
        storedFilePath: request.file.path,
        mimeType: request.file.mimetype || "application/pdf",
        fileSizeBytes: request.file.size,
    });

    response.status(201).json({
        manual: {
            id: created.id,
            manualId: created.manualId,
            manualName: created.manualName,
            originalFileName: created.originalFileName,
            storedFilePath: created.storedFilePath,
            mimeType: created.mimeType,
            fileSizeBytes: created.fileSizeBytes,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
        },
    });
});

manualsRouter.get("/", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const manuals = await ManualModel.find({ ownerUserId }).sort({ createdAt: -1 }).lean();
    response.status(200).json({ manuals });
});

manualsRouter.get("/:manualId/checklists", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const manualId = request.params.manualId;
    if (!manualId) {
        throw new HttpError("Manual ID is required.", 400);
    }

    const manual = await ManualModel.findOne({ ownerUserId, manualId }).lean();
    if (!manual) {
        throw new HttpError("Manual not found.", 404);
    }

    const checklists = await ChecklistModel.find({ ownerUserId, manualId }).sort({ createdAt: -1 }).lean();
    response.status(200).json({ checklists });
});

manualsRouter.post("/:manualId/checklists/generate", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const manualId = request.params.manualId;
    if (!manualId) {
        throw new HttpError("Manual ID is required.", 400);
    }

    const manual = await ManualModel.findOne({ ownerUserId, manualId }).lean();
    if (!manual) {
        throw new HttpError("Manual not found.", 404);
    }

    const parsed = generateSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid checklist generation payload.", 400, parsed.error.flatten());
    }

    const normalizedChecklistName = parsed.data.checklistName?.trim() || `${manual.manualName.trim()} Checklist`;

    const jobEnqueue = await enqueueChecklistGenerationJob({
        manualId: manual.manualId,
        checklistName: normalizedChecklistName,
        objective: parsed.data.objective,
        maxItems: parsed.data.maxItems,
        provider: parsed.data.provider,
        retrievalMode: parsed.data.retrievalMode,
        strictCitations: parsed.data.strictCitations,
        enqueuedByUserId: ownerUserId,
    });

    await JobModel.create({
        queueJobId: jobEnqueue.jobId,
        ownerUserId,
        manualId: manual.manualId,
        checklistName: normalizedChecklistName,
        status: "queued",
        provider: parsed.data.provider,
        retrievalMode: parsed.data.retrievalMode,
        objective: parsed.data.objective,
        maxItems: parsed.data.maxItems,
        strictCitations: parsed.data.strictCitations,
    });

    response.status(202).json({
        status: "queued",
        jobId: jobEnqueue.jobId,
        manualId: manual.manualId,
    });
});

manualsRouter.get("/:manualId", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const manualId = request.params.manualId;
    if (!manualId) {
        throw new HttpError("Manual ID is required.", 400);
    }

    const manual = await ManualModel.findOne({ ownerUserId, manualId }).lean();
    if (!manual) {
        throw new HttpError("Manual not found.", 404);
    }

    response.status(200).json({ manual });
});
