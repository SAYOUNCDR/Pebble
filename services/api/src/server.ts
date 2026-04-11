import express = require("express");
import type { Request, Response } from "express";

const app = express();
const port = 4000;

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
