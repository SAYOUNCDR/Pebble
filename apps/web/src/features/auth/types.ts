export interface AuthUser {
    id: string
    email: string
    fullName: string
    role: 'owner' | 'member'
    createdAt: string
    updatedAt: string
}

export interface AuthResponse {
    token: string
    user: AuthUser
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    email: string
    password: string
    fullName: string
}
