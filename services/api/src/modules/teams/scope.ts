import type { Request } from "express";

import { HttpError } from "../../utils/httpError.js";
import { TeamMembershipModel } from "./model.js";

export interface AccessScope {
    ownerUserId: string;
    teamId?: string;
}

function readTeamHeader(request: Request): string | undefined {
    const raw = request.headers["x-team-id"];
    const teamId = Array.isArray(raw) ? raw[0] : raw;
    if (!teamId) {
        return undefined;
    }
    const normalized = String(teamId).trim();
    return normalized.length > 0 ? normalized : undefined;
}

export async function resolveAccessScope(request: Request): Promise<AccessScope> {
    const ownerUserId = request.authUser?.sub;
    if (!ownerUserId) {
        throw new HttpError("Unauthorized.", 401);
    }

    const teamId = readTeamHeader(request);
    if (!teamId) {
        return { ownerUserId };
    }

    const membership = await TeamMembershipModel.findOne({ teamId, userId: ownerUserId }).lean();
    if (!membership) {
        throw new HttpError("Forbidden: not a member of requested team.", 403);
    }

    return { ownerUserId, teamId };
}

export function scopeQuery(scope: AccessScope, extra: Record<string, unknown> = {}): Record<string, unknown> {
    if (scope.teamId) {
        return {
            ...extra,
            teamId: scope.teamId,
        };
    }

    return {
        ...extra,
        ownerUserId: scope.ownerUserId,
    };
}
