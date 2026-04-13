import path from "node:path";

import express, { type Request, type Response } from "express";

import { HttpError } from "../../utils/httpError.js";
import { requireAuth } from "../auth/middleware.js";
import { resolveAccessScope, scopeQuery } from "../teams/scope.js";
import { ExportModel } from "./model.js";

export const exportsRouter = express.Router();

exportsRouter.get("/:exportId", requireAuth, async (request: Request, response: Response) => {
    const scope = await resolveAccessScope(request);

    const exportId = request.params.exportId;
    if (!exportId) {
        throw new HttpError("Export ID is required.", 400);
    }

    const exportArtifact = await ExportModel.findOne(scopeQuery(scope, { exportId })).lean();
    if (!exportArtifact) {
        throw new HttpError("Export not found.", 404);
    }

    response.status(200).json({
        export: {
            ...exportArtifact,
            downloadPath: `/api/exports/${exportArtifact.exportId}/file`,
        },
    });
});

exportsRouter.get("/:exportId/file", requireAuth, async (request: Request, response: Response) => {
    const scope = await resolveAccessScope(request);

    const exportId = request.params.exportId;
    if (!exportId) {
        throw new HttpError("Export ID is required.", 400);
    }

    const exportArtifact = await ExportModel.findOne(scopeQuery(scope, { exportId })).lean();
    if (!exportArtifact) {
        throw new HttpError("Export not found.", 404);
    }

    if (exportArtifact.status !== "ready") {
        throw new HttpError("Export is not ready.", 409);
    }

    const absolutePath = path.resolve(exportArtifact.filePath);
    response.download(absolutePath, exportArtifact.fileName);
});
