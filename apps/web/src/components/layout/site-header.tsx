import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth/auth-context'
import { Button } from '../ui/button'

export function SiteHeader(): React.JSX.Element {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const onLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
                <Link to="/" className="text-sm font-semibold tracking-tight text-slate-900">
                    PageIndex Console
                </Link>

                <nav className="flex items-center gap-2">
                    <Link to="/" className="rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                        Home
                    </Link>
                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/manuals"
                                className="rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                Manuals
                            </Link>
                            <Link to="/jobs" className="rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                                Jobs
                            </Link>
                            <Button variant="outline" size="sm" onClick={onLogout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                Login
                            </Link>
                            <Link to="/register">
                                <Button size="sm">Sign up</Button>
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}
