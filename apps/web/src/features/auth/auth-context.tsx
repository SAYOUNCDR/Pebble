import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { authApi } from './auth-api'
import type { AuthResponse, LoginPayload, RegisterPayload } from './types'
import type { AuthUser } from './types'

interface AuthContextValue {
    user: AuthUser | null
    token: string | null
    loading: boolean
    login: (payload: LoginPayload) => Promise<void>
    register: (payload: RegisterPayload) => Promise<void>
    logout: () => void
}

const TOKEN_KEY = 'pageindex.auth.token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

function persistAuth(data: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token)
}

function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const hydrate = async () => {
            const stored = readStoredToken()
            if (!stored) {
                setLoading(false)
                return
            }

            try {
                const response = await authApi.me(stored)
                setToken(stored)
                setUser(response.user)
            } catch {
                clearAuth()
                setToken(null)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        void hydrate()
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            loading,
            login: async (payload) => {
                const response = await authApi.login(payload)
                persistAuth(response)
                setToken(response.token)
                setUser(response.user)
            },
            register: async (payload) => {
                const response = await authApi.register(payload)
                persistAuth(response)
                setToken(response.token)
                setUser(response.user)
            },
            logout: () => {
                clearAuth()
                setToken(null)
                setUser(null)
            },
        }),
        [loading, token, user],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }
    return context
}
