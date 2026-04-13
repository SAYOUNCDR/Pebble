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
        <header className="sticky top-4 z-30">
            <div className="mx-auto w-[80%] max-w-6xl rounded-2xl border border-slate-200/80 bg-white/85 px-4 shadow-lg shadow-slate-900/5 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="text-sm font-semibold tracking-[0.08em] text-slate-900 uppercase">
                        Pebble
                    </Link>

                    <nav className="flex items-center gap-2">
                        {!user ? (
                            <Link to="/" className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
                                Home
                            </Link>
                        ) : null}
                        {user ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/manuals"
                                    className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    Manuals
                                </Link>
                                <Link to="/jobs" className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
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
                                    className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
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
            </div>
        </header>
    )
}
