import { Schema, model } from "mongoose";

import type { UserRole } from "./types.js";

export interface UserDocument {
    email: string;
    fullName: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
    {
        email: { type: String, required: true, unique: true, index: true },
        fullName: { type: String, required: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["owner", "member"], default: "owner" },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const UserModel = model<UserDocument>("User", userSchema);
