import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";
import type { AuthUserClaims } from "./types.js";

function readBearerToken(request: Request): string {
    const header = request.headers.authorization;
    if (!header) {
        throw new HttpError("Authorization header is required.", 401);
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        throw new HttpError("Authorization header must be Bearer token.", 401);
    }

    return token;
}

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
    try {
        const token = readBearerToken(request);
        const decoded = jwt.verify(token, env.jwtSecret);

        if (!decoded || typeof decoded !== "object") {
            throw new HttpError("Invalid token.", 401);
        }

        const claims = decoded as Partial<AuthUserClaims>;
        if (!claims.sub || !claims.email || !claims.role) {
            throw new HttpError("Invalid token claims.", 401);
        }

        request.authUser = {
            sub: claims.sub,
            email: claims.email,
            role: claims.role,
        };

        next();
    } catch (error) {
        if (error instanceof HttpError) {
            next(error);
            return;
        }
        next(new HttpError("Unauthorized.", 401));
    }
}
