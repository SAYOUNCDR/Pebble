import { apiRequest } from '../../lib/http'
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from './types'

export const authApi = {
    register: (payload: RegisterPayload) =>
        apiRequest<AuthResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    login: (payload: LoginPayload) =>
        apiRequest<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    me: (token: string) =>
        apiRequest<{ user: AuthUser }>('/api/auth/me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
}
