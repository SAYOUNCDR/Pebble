import axios from "axios";

import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const aiApi = axios.create({
    baseURL: env.aiServiceBaseUrl,
    timeout: 120000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

function toHttpError(error: unknown, fallback: string): HttpError {
    if (!axios.isAxiosError(error)) {
        return new HttpError(fallback, 500);
    }

    const status = error.response?.status ?? 502;
    const responseData = error.response?.data as { detail?: unknown } | undefined;
    const detail = responseData?.detail ?? error.message;
    const message = typeof detail === "string" ? detail : fallback;
    return new HttpError(message, status, detail);
}

export async function healthCheck(): Promise<unknown> {
    try {
        const response = await aiApi.get("/health");
        return response.data;
    } catch (error) {
        throw toHttpError(error, "AI health check failed.");
    }
}

export async function ingest(payload: unknown): Promise<unknown> {
    try {
        const response = await aiApi.post("/v1/ingest", payload);
        return response.data;
    } catch (error) {
        throw toHttpError(error, "AI ingest failed.");
    }
}

export async function buildIndex(payload: unknown): Promise<unknown> {
    try {
        const response = await aiApi.post("/v1/pageindex/build", payload);
        return response.data;
    } catch (error) {
        throw toHttpError(error, "AI index build failed.");
    }
}

export async function generateChecklist(payload: unknown): Promise<unknown> {
    try {
        const response = await aiApi.post("/v1/checklist/generate", payload);
        return response.data;
    } catch (error) {
        throw toHttpError(error, "AI checklist generation failed.");
    }
}

export async function verifyChecklist(payload: unknown): Promise<unknown> {
    try {
        const response = await aiApi.post("/v1/checklist/verify", payload);
        return response.data;
    } catch (error) {
        throw toHttpError(error, "AI checklist verification failed.");
    }
}

export interface ChatRequest {
    manual_id: string;
    message: string;
    manual_name?: string;
    file_path?: string;
}

export interface ChatResponse {
    manual_id: string;
    reply: string;
    suggested_checklist_payload?: {
        checklist_name?: string;
        objective: string;
        max_items: number;
        provider: "local" | "pageindex";
        retrieval_mode: "heuristic" | "tree_search";
        strict_citations: boolean;
    } | null;
}

export async function chat(payload: ChatRequest): Promise<ChatResponse> {
    try {
        const response = await aiApi.post<ChatResponse>("/v1/chat/query", payload);
        return response.data;
    } catch (error) {
        throw toHttpError(error, "AI chat failed.");
    }
}

export interface PipelineRunInput {
    manualId: string;
    manualName: string;
    filePath: string;
    checklistName?: string;
    provider: "local" | "pageindex";
    objective: string;
    maxItems: number;
    retrievalMode: "heuristic" | "tree_search";
    strictCitations: boolean;
}

export interface PipelineRunResult {
    ingest: unknown;
    index: unknown;
    generate: {
        checklist_id?: string;
        checklist_name?: string;
        [key: string]: unknown;
    };
    verify: unknown;
}

export async function runFullPipeline(input: PipelineRunInput): Promise<PipelineRunResult> {
    const ingestResponse = await ingest({
        manual_id: input.manualId,
        manual_name: input.manualName,
        file_path: input.filePath,
    });

    const indexResponse = await buildIndex({
        manual_id: input.manualId,
        provider: input.provider,
    });

    const generateResponse = (await generateChecklist({
        manual_id: input.manualId,
        checklist_name: input.checklistName,
        objective: input.objective,
        max_items: input.maxItems,
        strict_citations: input.strictCitations,
        retrieval_mode: input.retrievalMode,
    })) as {
        checklist_id?: string;
        checklist_name?: string;
        [key: string]: unknown;
    };

    const verifyResponse = await verifyChecklist({
        manual_id: input.manualId,
        checklist_id: generateResponse.checklist_id,
        strict_citations: input.strictCitations,
    });

    return {
        ingest: ingestResponse,
        index: indexResponse,
        generate: generateResponse,
        verify: verifyResponse,
    };
}
