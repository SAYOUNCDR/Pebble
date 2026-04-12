export type UserRole = "owner" | "member";

export interface AuthUserClaims {
    sub: string;
    email: string;
    role: UserRole;
}

export interface AuthUserPublic {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}
