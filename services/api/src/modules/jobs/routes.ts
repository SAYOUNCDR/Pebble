import express, { type Request, type Response } from "express";
import { z } from "zod";

import { pingRedis } from "../../db/redis.js";
import { HttpError } from "../../utils/httpError.js";
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

jobsRouter.post("/generate", async (request: Request, response: Response) => {
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

jobsRouter.get("/:jobId", async (request: Request, response: Response) => {
    const jobId = request.params.jobId;
    const job = await pipelineQueue.getJob(jobId);
    if (!job) {
        throw new HttpError("Job not found.", 404);
    }

    const state = await job.getState();
    response.status(200).json({
        jobId: String(job.id),
        name: job.name,
        state,
        data: job.data,
        progress: job.progress,
        returnvalue: job.returnvalue ?? null,
        failedReason: job.failedReason ?? null,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        finishedOn: job.finishedOn ?? null,
    });
});
