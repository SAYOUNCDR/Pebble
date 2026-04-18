import { Worker } from "bullmq";

import { runFullPipeline } from "../../clients/aiServiceClient.js";
import { getRedisClient } from "../../db/redis.js";
import { ChecklistModel } from "../checklists/model.js";
import { ManualModel } from "../manuals/model.js";
import { PIPELINE_QUEUE_NAME, type ChecklistGenerationJobPayload } from "./queue.js";
import { setJobStatus } from "./service.js";

export function startPipelineWorker(): Worker<ChecklistGenerationJobPayload> {
    const worker = new Worker<ChecklistGenerationJobPayload>(
        PIPELINE_QUEUE_NAME,
        async (job) => {
            const queueJobId = String(job.id);
            await setJobStatus(queueJobId, "ingesting");

            const manual = await ManualModel.findOne({
                ownerUserId: job.data.enqueuedByUserId,
                manualId: job.data.manualId,
            }).lean();

            if (!manual) {
                await setJobStatus(queueJobId, "failed", { errorMessage: "Manual not found for queued job." });
                throw new Error("Manual not found for queued job.");
            }

            await setJobStatus(queueJobId, "indexing");

            const pipelineResult = await runFullPipeline({
                manualId: manual.manualId,
                manualName: manual.manualName,
                filePath: manual.storedFilePath,
                provider: job.data.provider,
                objective: job.data.objective,
                maxItems: job.data.maxItems,
                retrievalMode: job.data.retrievalMode,
                strictCitations: job.data.strictCitations,
                ...(job.data.checklistName ? { checklistName: job.data.checklistName } : {}),
            });

            await setJobStatus(queueJobId, "generating");

            const checklistId = String(pipelineResult.generate.checklist_id ?? "").trim();
            if (!checklistId) {
                await setJobStatus(queueJobId, "failed", { errorMessage: "Pipeline generate response missing checklist_id." });
                throw new Error("Pipeline generate response missing checklist_id.");
            }

            await setJobStatus(queueJobId, "verifying");

            await ChecklistModel.updateOne(
                { checklistId },
                {
                    $set: {
                        checklistId,
                        checklistName: String(
                            pipelineResult.generate.checklist_name ?? job.data.checklistName ?? manual.manualName,
                        ).trim(),
                        ownerUserId: job.data.enqueuedByUserId,
                        manualId: manual.manualId,
                        sourceJobId: queueJobId,
                        itemCount: Number(pipelineResult.generate.item_count ?? 0),
                        retrievalMode: job.data.retrievalMode,
                        warnings: Array.isArray(pipelineResult.generate.warnings) ? pipelineResult.generate.warnings : [],
                        selectedNodeIds: Array.isArray(pipelineResult.generate.selected_node_ids)
                            ? pipelineResult.generate.selected_node_ids
                            : [],
                        items: Array.isArray(pipelineResult.generate.items) ? pipelineResult.generate.items : [],
                        rawGenerateResponse: pipelineResult.generate,
                        rawVerifyResponse: pipelineResult.verify,
                    },
                },
                { upsert: true },
            );

            await setJobStatus(queueJobId, "completed", { checklistId });

            return {
                status: "completed",
                queueJobId,
                checklistId,
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
