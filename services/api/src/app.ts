import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { getMongoHealth } from "./db/mongoose.js";
import { pingRedis } from "./db/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { aiRouter } from "./modules/ai/routes.js";
import { authRouter } from "./modules/auth/routes.js";
import { checklistsRouter } from "./modules/checklists/routes.js";
import { exportsRouter } from "./modules/exports/routes.js";
import { jobsRouter } from "./modules/jobs/routes.js";
import { manualsRouter } from "./modules/manuals/routes.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        service: "api",
        timestamp: new Date().toISOString(),
    });
});

app.get("/health/deps", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const aiStatus = await fetch(`${env.aiServiceBaseUrl}/health`)
            .then((response) => ({ ok: response.ok, status: response.status }))
            .catch(() => ({ ok: false, status: 0 }));
        const mongo = getMongoHealth();
        const redis = await pingRedis();

        res.status(200).json({
            status: aiStatus.ok && mongo.state === "connected" && redis.ok ? "ok" : "degraded",
            service: "api",
            dependencies: {
                ai: aiStatus,
                mongo,
                redis,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/manuals", manualsRouter);
app.use("/api/checklists", checklistsRouter);
app.use("/api/exports", exportsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
