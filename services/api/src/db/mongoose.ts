import mongoose from "mongoose";

import { env } from "../config/env.js";

let hasConnected = false;

export async function connectMongo(): Promise<void> {
    if (hasConnected) {
        return;
    }

    await mongoose.connect(env.mongoDbUri);
    hasConnected = true;
}

export function getMongoHealth(): { state: string; readyState: number } {
    const readyState = mongoose.connection.readyState;
    const state =
        readyState === 1
            ? "connected"
            : readyState === 2
                ? "connecting"
                : readyState === 3
                    ? "disconnecting"
                    : "disconnected";

    return { state, readyState };
}
