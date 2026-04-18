import { Schema, model } from "mongoose";

export interface ChecklistDocument {
    checklistId: string;
    checklistName?: string;
    ownerUserId: string;
    manualId: string;
    sourceJobId: string;
    itemCount: number;
    retrievalMode: "heuristic" | "tree_search";
    warnings: string[];
    selectedNodeIds: string[];
    items: unknown[];
    rawGenerateResponse: unknown;
    rawVerifyResponse: unknown;
    createdAt: Date;
    updatedAt: Date;
}

const checklistSchema = new Schema<ChecklistDocument>(
    {
        checklistId: { type: String, required: true, unique: true, index: true },
        checklistName: { type: String },
        ownerUserId: { type: String, required: true, index: true },
        manualId: { type: String, required: true, index: true },
        sourceJobId: { type: String, required: true, index: true },
        itemCount: { type: Number, required: true },
        retrievalMode: { type: String, enum: ["heuristic", "tree_search"], required: true },
        warnings: { type: [String], default: [] },
        selectedNodeIds: { type: [String], default: [] },
        items: { type: [Schema.Types.Mixed], default: [] },
        rawGenerateResponse: { type: Schema.Types.Mixed, required: true },
        rawVerifyResponse: { type: Schema.Types.Mixed, required: true },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const ChecklistModel = model<ChecklistDocument>("Checklist", checklistSchema);
