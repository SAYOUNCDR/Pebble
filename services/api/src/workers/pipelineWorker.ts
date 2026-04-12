import { connectRedis } from "../db/redis.js";
import { connectMongo } from "../db/mongoose.js";
import { startPipelineWorker } from "../modules/jobs/worker.js";

async function bootstrapWorker(): Promise<void> {
    await connectMongo();
    await connectRedis();
    startPipelineWorker();
    console.log("Pipeline worker started.");
}

bootstrapWorker().catch((error) => {
    console.error("Failed to start pipeline worker", error);
    process.exit(1);
});
