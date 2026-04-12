import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { aiRouter } from "./modules/ai/routes.js";

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

        res.status(200).json({
            status: aiStatus.ok ? "ok" : "degraded",
            service: "api",
            dependencies: {
                ai: aiStatus,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

app.use("/api/ai", aiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
