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
