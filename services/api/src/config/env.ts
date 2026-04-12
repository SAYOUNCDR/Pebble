import { config } from "dotenv";

config();

function required(name: string, fallback?: string): string {
    const value = process.env[name]?.trim() || fallback;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function optionalNumber(name: string, fallback: number): number {
    const raw = process.env[name]?.trim();
    if (!raw) {
        return fallback;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a number.`);
    }
    return parsed;
}

export const env = {
    nodeEnv: process.env.NODE_ENV?.trim() || "development",
    port: optionalNumber("PORT", 4000),
    jwtSecret: required("JWT_SECRET", "dev-change-me"),
    jwtExpiresIn: required("JWT_EXPIRES_IN", "7d"),
    mongoDbUri: required("MONGODB_URI", "mongodb://localhost:27017/pageindex"),
    redisUrl: required("REDIS_URL", "redis://localhost:6379"),
    aiServiceBaseUrl: required("AI_SERVICE_BASE_URL", "http://localhost:8001"),
} as const;
