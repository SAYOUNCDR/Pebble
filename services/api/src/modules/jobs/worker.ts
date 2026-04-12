import { Worker } from "bullmq";

import { getRedisClient } from "../../db/redis.js";
import { PIPELINE_QUEUE_NAME, type ChecklistGenerationJobPayload } from "./queue.js";

export function startPipelineWorker(): Worker<ChecklistGenerationJobPayload> {
    const worker = new Worker<ChecklistGenerationJobPayload>(
        PIPELINE_QUEUE_NAME,
        async (job) => {
            // Placeholder processor: real AI pipeline orchestration and persistence will be added next.
            return {
                status: "queued_for_pipeline",
                manualId: job.data.manualId,
                provider: job.data.provider,
                retrievalMode: job.data.retrievalMode,
                processedAt: new Date().toISOString(),
            };
        },
        {
            connection: getRedisClient(),
            concurrency: 2,
        },
    );

    worker.on("completed", (job) => {
        console.log(`[worker] completed job ${job?.id ?? "unknown"}`);
    });

    worker.on("failed", (job, error) => {
        console.error(`[worker] failed job ${job?.id ?? "unknown"}`, error.message);
    });

    return worker;
}
