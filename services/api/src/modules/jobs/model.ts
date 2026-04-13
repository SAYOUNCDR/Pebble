import { Schema, model } from "mongoose";

export type JobStatus =
    | "queued"
    | "ingesting"
    | "indexing"
    | "generating"
    | "verifying"
    | "completed"
    | "failed";

export interface JobDocument {
    queueJobId: string;
    ownerUserId: string;
    teamId?: string;
    manualId: string;
    status: JobStatus;
    provider: "local" | "pageindex";
    retrievalMode: "heuristic" | "tree_search";
    objective: string;
    maxItems: number;
    strictCitations: boolean;
    checklistId?: string;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const jobSchema = new Schema<JobDocument>(
    {
        queueJobId: { type: String, required: true, unique: true, index: true },
        ownerUserId: { type: String, required: true, index: true },
        teamId: { type: String, index: true },
        manualId: { type: String, required: true, index: true },
        status: {
            type: String,
            enum: ["queued", "ingesting", "indexing", "generating", "verifying", "completed", "failed"],
            required: true,
            index: true,
        },
        provider: { type: String, enum: ["local", "pageindex"], required: true },
        retrievalMode: { type: String, enum: ["heuristic", "tree_search"], required: true },
        objective: { type: String, required: true },
        maxItems: { type: Number, required: true },
        strictCitations: { type: Boolean, required: true },
        checklistId: { type: String },
        errorMessage: { type: String },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const JobModel = model<JobDocument>("Job", jobSchema);
