import { connectRedis } from "../db/redis.js";
import { startPipelineWorker } from "../modules/jobs/worker.js";

async function bootstrapWorker(): Promise<void> {
    await connectRedis();
    startPipelineWorker();
    console.log("Pipeline worker started.");
}

bootstrapWorker().catch((error) => {
    console.error("Failed to start pipeline worker", error);
    process.exit(1);
});
