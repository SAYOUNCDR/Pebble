import { Navigate } from 'react-router-dom'

import { useAuth } from '../../features/auth/auth-context'

export function PublicOnlyRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-50">
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
                    Loading session...
                </div>
            </div>
        )
    }

    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
