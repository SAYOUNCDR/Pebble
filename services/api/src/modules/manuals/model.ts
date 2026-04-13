import { Schema, model } from "mongoose";

export interface ManualDocument {
    ownerUserId: string;
    teamId?: string;
    manualId: string;
    manualName: string;
    originalFileName: string;
    storedFilePath: string;
    mimeType: string;
    fileSizeBytes: number;
    createdAt: Date;
    updatedAt: Date;
}

const manualSchema = new Schema<ManualDocument>(
    {
        ownerUserId: { type: String, required: true, index: true },
        teamId: { type: String, index: true },
        manualId: { type: String, required: true, unique: true, index: true },
        manualName: { type: String, required: true },
        originalFileName: { type: String, required: true },
        storedFilePath: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileSizeBytes: { type: Number, required: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const ManualModel = model<ManualDocument>("Manual", manualSchema);
