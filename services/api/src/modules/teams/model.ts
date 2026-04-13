import { Schema, model } from "mongoose";

export interface TeamDocument {
    teamId: string;
    name: string;
    ownerUserId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TeamMembershipDocument {
    teamId: string;
    userId: string;
    role: "owner" | "member";
    createdAt: Date;
    updatedAt: Date;
}

const teamSchema = new Schema<TeamDocument>(
    {
        teamId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        ownerUserId: { type: String, required: true, index: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const teamMembershipSchema = new Schema<TeamMembershipDocument>(
    {
        teamId: { type: String, required: true, index: true },
        userId: { type: String, required: true, index: true },
        role: { type: String, enum: ["owner", "member"], required: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

teamMembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export const TeamModel = model<TeamDocument>("Team", teamSchema);
export const TeamMembershipModel = model<TeamMembershipDocument>("TeamMembership", teamMembershipSchema);
