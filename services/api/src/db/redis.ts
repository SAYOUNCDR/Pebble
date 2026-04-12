import IORedis from "ioredis";

import { env } from "../config/env.js";

let redisClient: IORedis | null = null;

function buildRedisClient(): IORedis {
    const isTls = env.redisUrl.startsWith("rediss://");
    return new IORedis(env.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
        tls: isTls ? {} : undefined,
    });
}

export function getRedisClient(): IORedis {
    if (!redisClient) {
        redisClient = buildRedisClient();
    }
    return redisClient;
}

export async function connectRedis(): Promise<void> {
    const client = getRedisClient();
    if (client.status === "ready" || client.status === "connect") {
        return;
    }
    await client.connect();
}

export async function pingRedis(): Promise<{ ok: boolean; response: string }> {
    try {
        const client = getRedisClient();
        if (client.status !== "ready") {
            await connectRedis();
        }
        const response = await client.ping();
        return { ok: response === "PONG", response };
    } catch {
        return { ok: false, response: "ERROR" };
    }
}
