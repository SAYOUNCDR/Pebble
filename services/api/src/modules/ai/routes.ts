import express, { type Request, type Response } from "express";

import {
    buildIndex,
    generateChecklist,
    healthCheck,
    ingest,
    verifyChecklist,
} from "../../clients/aiServiceClient.js";

export const aiRouter = express.Router();

aiRouter.get("/health", async (_req: Request, res: Response) => {
    const data = await healthCheck();
    res.status(200).json(data);
});

aiRouter.post("/ingest", async (req: Request, res: Response) => {
    const data = await ingest(req.body);
    res.status(200).json(data);
});

aiRouter.post("/pageindex/build", async (req: Request, res: Response) => {
    const data = await buildIndex(req.body);
    res.status(200).json(data);
});

aiRouter.post("/checklist/generate", async (req: Request, res: Response) => {
    const data = await generateChecklist(req.body);
    res.status(200).json(data);
});

aiRouter.post("/checklist/verify", async (req: Request, res: Response) => {
    const data = await verifyChecklist(req.body);
    res.status(200).json(data);
});
