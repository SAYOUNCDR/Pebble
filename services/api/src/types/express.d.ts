import type { AuthUserClaims } from "../modules/auth/types.js";

declare global {
    namespace Express {
        interface Request {
            authUser?: AuthUserClaims;
        }
    }
}

export { };
