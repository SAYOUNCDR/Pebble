import express, { type Request, type Response } from "express";

import { HttpError } from "../../utils/httpError.js";
import { requireAuth } from "../auth/middleware.js";
import { ChecklistModel } from "./model.js";

export const checklistsRouter = express.Router();

checklistsRouter.get("/:checklistId", requireAuth, async (request: Request, response: Response) => {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const checklistId = request.params.checklistId;
    if (!checklistId) {
        throw new HttpError("Checklist ID is required.", 400);
    }

    const checklist = await ChecklistModel.findOne({ ownerUserId, checklistId }).lean();
    if (!checklist) {
        throw new HttpError("Checklist not found.", 404);
    }

    response.status(200).json({ checklist });
});
