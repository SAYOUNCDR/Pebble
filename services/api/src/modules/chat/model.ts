import { Schema, model } from "mongoose";

export interface ChatSuggestedChecklistPayloadDocument {
    checklistName?: string;
    objective: string;
    maxItems: number;
    provider: "local" | "pageindex";
    retrievalMode: "heuristic" | "tree_search";
    strictCitations: boolean;
}

export interface ChatMessageDocument {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    suggestedChecklistPayload?: ChatSuggestedChecklistPayloadDocument;
}

export interface ChatThreadDocument {
    ownerUserId: string;
    manualId: string;
    messages: ChatMessageDocument[];
    createdAt: Date;
    updatedAt: Date;
}

const suggestedChecklistPayloadSchema = new Schema<ChatSuggestedChecklistPayloadDocument>(
    {
        checklistName: { type: String },
        objective: { type: String, required: true },
        maxItems: { type: Number, required: true },
        provider: { type: String, required: true, enum: ["local", "pageindex"] },
        retrievalMode: { type: String, required: true, enum: ["heuristic", "tree_search"] },
        strictCitations: { type: Boolean, required: true },
    },
    { _id: false, versionKey: false },
);

const chatMessageSchema = new Schema<ChatMessageDocument>(
    {
        role: { type: String, required: true, enum: ["user", "assistant"] },
        content: { type: String, required: true },
        timestamp: { type: Date, required: true },
        suggestedChecklistPayload: { type: suggestedChecklistPayloadSchema, required: false },
    },
    { _id: false, versionKey: false },
);

const chatThreadSchema = new Schema<ChatThreadDocument>(
    {
        ownerUserId: { type: String, required: true, index: true },
        manualId: { type: String, required: true, index: true },
        messages: { type: [chatMessageSchema], default: [] },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

chatThreadSchema.index({ ownerUserId: 1, manualId: 1 }, { unique: true });

export const ChatThreadModel = model<ChatThreadDocument>("ChatThread", chatThreadSchema);