import { env } from "./config/env.js";
import { connectMongo } from "./db/mongoose.js";
import { connectRedis } from "./db/redis.js";
import { app } from "./app.js";

async function startServer(): Promise<void> {
  await connectMongo();
  await connectRedis();

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
