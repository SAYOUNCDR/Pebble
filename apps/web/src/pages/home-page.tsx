import { ArrowRight, CheckCircle2, FileStack, Radar, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { getApiBaseUrl } from '../lib/http'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function HomePage(): React.JSX.Element {
    const { user } = useAuth()

    return (
        <main className="relative overflow-hidden pb-16">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(15,23,42,0.09),transparent_33%),radial-gradient(circle_at_80%_0%,rgba(190,24,93,0.14),transparent_36%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.11),transparent_40%)]" />

            <section className="mx-auto mt-8 w-[90%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm md:p-12">
                <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1 text-[11px] font-semibold tracking-[0.2em] text-slate-700 uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            React - Express - Python
                        </p>
                        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
                            Turn heavy manuals into operational checklists in minutes.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base text-slate-600 md:text-lg">
                            PageIndex Console gives teams a production flow for ingest, indexing, AI generation, verification, and job tracking without exposing your AI service to the browser.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link to={user ? '/manuals' : '/register'}>
                                <Button size="lg" className="rounded-xl px-6">
                                    {user ? 'Open Manuals' : 'Start Building'}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to={user ? '/jobs' : '/login'}>
                                <Button size="lg" variant="outline" className="rounded-xl px-6">
                                    {user ? 'Track Jobs' : 'Sign In'}
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="rounded-full border border-slate-300 bg-white px-3 py-1">API: {getApiBaseUrl()}</span>
                            <span className="rounded-full border border-slate-300 bg-white px-3 py-1">Strict citations enabled</span>
                            <span className="rounded-full border border-slate-300 bg-white px-3 py-1">Local or PageIndex provider</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-slate-900/20">
                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">Pipeline Preview</p>
                        <div className="mt-4 space-y-3">
                            {[
                                'Upload manual PDF',
                                'Build index with local/pageindex',
                                'Generate checklist with retrieval mode',
                                'Verify citations and grounding',
                                'Review results and export',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-8 grid w-[90%] max-w-6xl gap-4 md:grid-cols-3">
                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Workflow className="h-4 w-4" />
                            API-Orchestrated Flow
                        </CardTitle>
                        <CardDescription>Frontend never talks directly to Python.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">Express controls auth, queueing, persistence, and contracts.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4" />
                            Protected Workspaces
                        </CardTitle>
                        <CardDescription>JWT auth and owner-scoped records.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">Manuals, jobs, and checklists are linked to authenticated users.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Radar className="h-4 w-4" />
                            Retrieval Control
                        </CardTitle>
                        <CardDescription>Swap strategy per job without code changes.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">Choose provider, retrieval mode, item limits, and strict verification.</CardContent>
                </Card>
            </section>

            <section className="mx-auto mt-8 w-[90%] max-w-6xl rounded-4xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-slate-100 shadow-xl md:p-10">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">Built For Real Operations</p>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Ready to run your first manual-to-checklist pipeline?</h2>
                        <p className="mt-2 max-w-2xl text-slate-300">
                            Use the new landing flow to onboard quickly, upload a PDF, trigger async generation, and monitor completion in one interface.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to={user ? '/manuals' : '/register'}>
                            <Button size="lg" className="rounded-xl bg-white text-slate-900 hover:bg-slate-200">
                                <FileStack className="h-4 w-4" />
                                {user ? 'Go to Manuals' : 'Create Account'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
