import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";
import { UserModel } from "./model.js";
import type { LoginInput, RegisterInput } from "./schemas.js";
import type { AuthUserClaims, AuthUserPublic } from "./types.js";

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function toAuthUserPublic(input: {
    id: string;
    email: string;
    fullName: string;
    role: "owner" | "member";
    createdAt: Date;
    updatedAt: Date;
}): AuthUserPublic {
    return {
        id: input.id,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        createdAt: input.createdAt.toISOString(),
        updatedAt: input.updatedAt.toISOString(),
    };
}

function issueToken(claims: AuthUserClaims): string {
    const expiresIn = env.jwtExpiresIn as Exclude<jwt.SignOptions["expiresIn"], undefined>;
    return jwt.sign(claims, env.jwtSecret as jwt.Secret, {
        expiresIn,
    });
}

export async function registerUser(payload: RegisterInput): Promise<{ token: string; user: AuthUserPublic }> {
    const email = normalizeEmail(payload.email);
    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
        throw new HttpError("Email already registered.", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const created = await UserModel.create({
        email,
        fullName: payload.fullName.trim(),
        passwordHash,
        role: "owner",
    });

    const claims: AuthUserClaims = {
        sub: created.id,
        email: created.email,
        role: created.role,
    };

    return {
        token: issueToken(claims),
        user: toAuthUserPublic({
            id: created.id,
            email: created.email,
            fullName: created.fullName,
            role: created.role,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
        }),
    };
}

export async function loginUser(payload: LoginInput): Promise<{ token: string; user: AuthUserPublic }> {
    const email = normalizeEmail(payload.email);
    const user = await UserModel.findOne({ email });

    if (!user) {
        throw new HttpError("Invalid email or password.", 401);
    }

    const passwordOk = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordOk) {
        throw new HttpError("Invalid email or password.", 401);
    }

    const claims: AuthUserClaims = {
        sub: user.id,
        email: user.email,
        role: user.role,
    };

    return {
        token: issueToken(claims),
        user: toAuthUserPublic({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }),
    };
}

export async function getCurrentUser(userId: string): Promise<AuthUserPublic> {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new HttpError("User not found.", 404);
    }

    return toAuthUserPublic({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });
}
