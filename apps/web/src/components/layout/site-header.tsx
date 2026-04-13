import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAuth } from '../../features/auth/auth-context'
import { teamsApi, type TeamSummary } from '../../features/teams/teams-api'
import { getActiveTeamId, setActiveTeamId } from '../../lib/team-scope'
import { Button } from '../ui/button'

export function SiteHeader(): React.JSX.Element {
    const { user, token, logout } = useAuth()
    const navigate = useNavigate()
    const [teams, setTeams] = useState<TeamSummary[]>([])
    const [activeTeamId, setActiveTeamIdState] = useState<string | null>(() => getActiveTeamId())

    useEffect(() => {
        const loadTeams = async () => {
            if (!user || !token) {
                setTeams([])
                return
            }
            try {
                const response = await teamsApi.listTeams(token)
                setTeams(response.teams)

                const stored = getActiveTeamId()
                if (stored && !response.teams.some((team) => team.teamId === stored)) {
                    setActiveTeamId(null)
                    setActiveTeamIdState(null)
                }
            } catch {
                setTeams([])
            }
        }

        void loadTeams()
    }, [user, token])

    const onLogout = () => {
        logout()
        setActiveTeamId(null)
        setActiveTeamIdState(null)
        navigate('/')
    }

    const onTeamChange = (value: string) => {
        const teamId = value === '__personal__' ? null : value
        setActiveTeamId(teamId)
        setActiveTeamIdState(teamId)
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
                                <select
                                    value={activeTeamId ?? '__personal__'}
                                    onChange={(event) => onTeamChange(event.target.value)}
                                    className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                >
                                    <option value="__personal__">Personal</option>
                                    {teams.map((team) => (
                                        <option key={team.teamId} value={team.teamId}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
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
