import { Queue, QueueEvents, type JobsOptions } from "bullmq";

import { getRedisClient } from "../../db/redis.js";

export const PIPELINE_QUEUE_NAME = "pipeline-checklist-generation";

export interface ChecklistGenerationJobPayload {
    manualId: string;
    checklistName?: string;
    objective: string;
    maxItems: number;
    provider: "local" | "pageindex";
    retrievalMode: "heuristic" | "tree_search";
    strictCitations: boolean;
    enqueuedByUserId: string;
}

const lowMemoryJobOptions: JobsOptions = {
    attempts: 2,
    backoff: {
        type: "exponential",
        delay: 2000,
    },
    removeOnComplete: {
        age: 60 * 60,
        count: 200,
    },
    removeOnFail: {
        age: 6 * 60 * 60,
        count: 300,
    },
};

export const pipelineQueue = new Queue<ChecklistGenerationJobPayload>(PIPELINE_QUEUE_NAME, {
    connection: getRedisClient(),
    defaultJobOptions: lowMemoryJobOptions,
});

export const pipelineQueueEvents = new QueueEvents(PIPELINE_QUEUE_NAME, {
    connection: getRedisClient(),
});

export async function enqueueChecklistGenerationJob(
    payload: ChecklistGenerationJobPayload,
): Promise<{ jobId: string }> {
    const job = await pipelineQueue.add("generate-checklist", payload);
    return { jobId: String(job.id) };
}
