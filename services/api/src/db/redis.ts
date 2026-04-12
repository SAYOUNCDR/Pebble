import { Redis } from "ioredis";

import { env } from "../config/env.js";

let redisClient: Redis | null = null;
let redisConnectPromise: Promise<void> | null = null;

function buildRedisClient(): Redis {
    const isTls = env.redisUrl.startsWith("rediss://");
    return new Redis(env.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
        tls: isTls ? {} : undefined,
    });
}

export function getRedisClient(): Redis {
    if (!redisClient) {
        redisClient = buildRedisClient();
    }
    return redisClient;
}

export async function connectRedis(): Promise<void> {
    const client = getRedisClient();

    if (client.status === "ready") {
        return;
    }

    if (redisConnectPromise) {
        await redisConnectPromise;
        return;
    }

    if (client.status === "connecting" || client.status === "connect" || client.status === "reconnecting") {
        redisConnectPromise = new Promise<void>((resolve, reject) => {
            const cleanup = () => {
                client.off("ready", onReady);
                client.off("error", onError);
                redisConnectPromise = null;
            };

            const onReady = () => {
                cleanup();
                resolve();
            };

            const onError = (error: Error) => {
                cleanup();
                reject(error);
            };

            client.once("ready", onReady);
            client.once("error", onError);
        });

        await redisConnectPromise;
        return;
    }

    redisConnectPromise = client
        .connect()
        .then(() => undefined)
        .finally(() => {
            redisConnectPromise = null;
        });

    await redisConnectPromise;
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
