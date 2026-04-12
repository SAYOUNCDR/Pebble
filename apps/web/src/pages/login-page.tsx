import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

function readError(error: unknown): string {
    return error instanceof Error ? error.message : 'Login failed.'
}

export function LoginPage(): React.JSX.Element {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login({ email, password })
            const target = (location.state as { from?: string } | null)?.from || '/dashboard'
            navigate(target, { replace: true })
        } catch (err) {
            setError(readError(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Sign in to your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4" onSubmit={submit}>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="********"
                                required
                            />
                        </div>

                        {error && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

                        <Button type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <p className="text-center text-sm text-slate-600">
                            New here?{' '}
                            <Link to="/register" className="font-medium text-slate-900 underline underline-offset-4">
                                Create account
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}
