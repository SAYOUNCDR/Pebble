import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../utils/httpError.js";

export function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({
            error: error.message,
            detail: error.detail ?? null,
        });
        return;
    }

    if (error instanceof Error) {
        res.status(500).json({
            error: "Internal Server Error",
            detail: error.message,
        });
        return;
    }

    res.status(500).json({
        error: "Internal Server Error",
        detail: null,
    });
}
