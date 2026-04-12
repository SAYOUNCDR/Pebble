import express, { type Request, type Response } from "express";
import { z } from "zod";

import { pingRedis } from "../../db/redis.js";
import { HttpError } from "../../utils/httpError.js";
import { requireAuth } from "../auth/middleware.js";
import { JobModel } from "./model.js";
import { enqueueChecklistGenerationJob, pipelineQueue } from "./queue.js";

export const jobsRouter = express.Router();

const createJobSchema = z.object({
    manualId: z.string().min(3).max(80),
    objective: z.string().min(3).max(400),
    maxItems: z.number().int().min(1).max(100).default(20),
    provider: z.enum(["local", "pageindex"]).default("local"),
    retrievalMode: z.enum(["heuristic", "tree_search"]).default("heuristic"),
    strictCitations: z.boolean().default(true),
    enqueuedByUserId: z.string().min(1),
});

jobsRouter.get("/health", async (_request: Request, response: Response) => {
    const redis = await pingRedis();
    response.status(200).json({
        service: "jobs",
        redis,
        timestamp: new Date().toISOString(),
    });
});

jobsRouter.post("/generate", requireAuth, async (request: Request, response: Response) => {
    const parsed = createJobSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid job payload.", 400, parsed.error.flatten());
    }

    const created = await enqueueChecklistGenerationJob(parsed.data);
    response.status(202).json({
        status: "queued",
        ...created,
    });
});

jobsRouter.get("/:jobId", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const rawJobId = request.params.jobId;
    const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
    if (!jobId) {
        throw new HttpError("Job ID is required.", 400);
    }

    const persisted = await JobModel.findOne({ queueJobId: jobId, ownerUserId }).lean();
    if (!persisted) {
        throw new HttpError("Job not found.", 404);
    }

    const queueJob = await pipelineQueue.getJob(jobId);
    const queueState = queueJob ? await queueJob.getState() : "missing";

    response.status(200).json({
        job: persisted,
        queue: queueJob
            ? {
                state: queueState,
                progress: queueJob.progress,
                failedReason: queueJob.failedReason ?? null,
                attemptsMade: queueJob.attemptsMade,
                finishedOn: queueJob.finishedOn ?? null,
            }
            : {
                state: queueState,
            },
    });
});
