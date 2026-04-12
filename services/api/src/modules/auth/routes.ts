import express, { type Request, type Response } from "express";

import { HttpError } from "../../utils/httpError.js";
import { loginSchema, registerSchema } from "./schemas.js";
import { requireAuth } from "./middleware.js";
import { getCurrentUser, loginUser, registerUser } from "./service.js";

export const authRouter = express.Router();

authRouter.post("/register", async (request: Request, response: Response) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid register payload.", 400, parsed.error.flatten());
    }

    const data = await registerUser(parsed.data);
    response.status(201).json(data);
});

authRouter.post("/login", async (request: Request, response: Response) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new HttpError("Invalid login payload.", 400, parsed.error.flatten());
    }

    const data = await loginUser(parsed.data);
    response.status(200).json(data);
});

authRouter.get("/me", requireAuth, async (request: Request, response: Response) => {
    if (!request.authUser?.sub) {
        throw new HttpError("Unauthorized.", 401);
    }

    const user = await getCurrentUser(request.authUser.sub);
    response.status(200).json({ user });
});
