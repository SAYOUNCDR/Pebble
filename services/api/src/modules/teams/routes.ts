import express, { type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { HttpError } from "../../utils/httpError.js";
import { requireAuth } from "../auth/middleware.js";
import { UserModel } from "../auth/model.js";
import { TeamMembershipModel, TeamModel } from "./model.js";

export const teamsRouter = express.Router();

const createTeamSchema = z.object({
    name: z.string().min(2).max(120),
    teamId: z.string().min(3).max(80).optional(),
});

const addMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(["owner", "member"]).default("member"),
});

teamsRouter.get("/", requireAuth, async (request: Request, response: Response) => {
    const userId = request.authUser?.sub;
    if (!userId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const memberships = await TeamMembershipModel.find({ userId }).lean();
    const teamIds = memberships.map((membership) => membership.teamId);

    const teams = teamIds.length > 0 ? await TeamModel.find({ teamId: { $in: teamIds } }).lean() : [];

    response.status(200).json({
        teams: teams.map((team) => ({
            ...team,
            role: memberships.find((membership) => membership.teamId === team.teamId)?.role ?? "member",
        })),
    });
});

teamsRouter.post("/", requireAuth, async (request: Request, response: Response) => {
    const userId = request.authUser?.sub;
    if (!userId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const parsed = createTeamSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid team payload.", 400, parsed.error.flatten());
    }

    const requestedTeamId = parsed.data.teamId?.trim();
    const teamId = requestedTeamId && requestedTeamId.length > 0 ? requestedTeamId : `team-${uuidv4().slice(0, 12)}`;

    const existing = await TeamModel.findOne({ teamId }).lean();
    if (existing) {
        throw new HttpError("Team ID already exists.", 409);
    }

    const team = await TeamModel.create({
        teamId,
        name: parsed.data.name.trim(),
        ownerUserId: userId,
    });

    await TeamMembershipModel.create({
        teamId: team.teamId,
        userId,
        role: "owner",
    });

    response.status(201).json({ team });
});

teamsRouter.post("/:teamId/members", requireAuth, async (request: Request, response: Response) => {
    const userId = request.authUser?.sub;
    if (!userId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const teamId = request.params.teamId;
    if (!teamId) {
        throw new HttpError("Team ID is required.", 400);
    }

    const parsed = addMemberSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid team member payload.", 400, parsed.error.flatten());
    }

    const membership = await TeamMembershipModel.findOne({ teamId, userId }).lean();
    if (!membership || membership.role !== "owner") {
        throw new HttpError("Only team owners can add members.", 403);
    }

    const targetUser = await UserModel.findOne({ email: parsed.data.email.trim().toLowerCase() }).lean();
    if (!targetUser) {
        throw new HttpError("User not found for provided email.", 404);
    }

    await TeamMembershipModel.updateOne(
        { teamId, userId: String(targetUser._id) },
        {
            $set: {
                teamId,
                userId: String(targetUser._id),
                role: parsed.data.role,
            },
        },
        { upsert: true },
    );

    response.status(200).json({
        status: "ok",
        teamId,
        userId: String(targetUser._id),
        role: parsed.data.role,
    });
});
