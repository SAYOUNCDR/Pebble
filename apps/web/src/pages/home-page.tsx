import { ArrowRight, ShieldCheck, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { getApiBaseUrl } from '../lib/http'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function HomePage(): React.JSX.Element {
    const { user } = useAuth()

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-100 p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">React - Express - Python</p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Manual Checklist Builder</h1>
                <p className="mt-3 max-w-2xl text-slate-600">
                    Minimal modern frontend for auth and pipeline orchestration. Frontend talks only to Express API.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link to={user ? '/dashboard' : '/register'}>
                        <Button size="lg">
                            {user ? 'Go to Dashboard' : 'Get Started'}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
                        API: {getApiBaseUrl()}
                    </span>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Workflow className="h-4 w-4" />
                            Structured Workflow
                        </CardTitle>
                        <CardDescription>Auth, jobs, and AI endpoints mediated by Express.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">No direct browser calls to internal Python services.</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4" />
                            Session Safety
                        </CardTitle>
                        <CardDescription>JWT-based auth with protected dashboard route.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">Login and register flows are ready and connected.</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Ready for Next Phase</CardTitle>
                        <CardDescription>Manual upload, jobs, and checklist pages come next.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">UI scaffold is now clean, routed, and auth-aware.</CardContent>
                </Card>
            </section>
        </main>
    )
}
