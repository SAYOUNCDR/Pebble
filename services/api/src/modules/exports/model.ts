import { Schema, model } from "mongoose";

export type ExportStatus = "ready" | "failed";

export interface ExportDocument {
    exportId: string;
    ownerUserId: string;
    teamId?: string;
    checklistId: string;
    format: "pdf";
    status: ExportStatus;
    fileName: string;
    filePath: string;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const exportSchema = new Schema<ExportDocument>(
    {
        exportId: { type: String, required: true, unique: true, index: true },
        ownerUserId: { type: String, required: true, index: true },
        teamId: { type: String, index: true },
        checklistId: { type: String, required: true, index: true },
        format: { type: String, enum: ["pdf"], required: true },
        status: { type: String, enum: ["ready", "failed"], required: true, index: true },
        fileName: { type: String, required: true },
        filePath: { type: String, required: true },
        errorMessage: { type: String },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const ExportModel = model<ExportDocument>("Export", exportSchema);
