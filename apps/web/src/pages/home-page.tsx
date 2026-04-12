import { ArrowRight, CheckCircle2, Clock3, FileStack, Layers3, Radar, ShieldCheck, Sparkles, Users2, Workflow } from 'lucide-react'
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

            <section className="mx-auto mt-8 w-[90%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm md:p-12">
                <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1 text-[11px] font-semibold tracking-[0.2em] text-slate-700 uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            React - Express - Python
                        </p>
                        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
                            Turn heavy manuals into operational checklists in minutes.
                        </h1>
                        <p className="mt-5 max-w-2xl text-sm text-slate-600 sm:text-base md:text-lg">
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

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600 sm:text-sm">
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
                                <div key={item} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm md:text-base">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-8 grid w-[90%] max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Avg setup time', value: '8 min', icon: Clock3 },
                    { label: 'Pipeline stages', value: '5 stages', icon: Layers3 },
                    { label: 'Team-ready flow', value: 'Multi-page', icon: Users2 },
                    { label: 'Grounded output', value: 'Citation-first', icon: ShieldCheck },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            <stat.icon className="h-4 w-4" />
                            <p className="text-xs font-semibold tracking-[0.12em] uppercase">{stat.label}</p>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{stat.value}</p>
                    </div>
                ))}
            </section>

            <section className="mx-auto mt-8 grid w-[90%] max-w-6xl gap-4 md:grid-cols-3">
                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Workflow className="h-4 w-4" />
                            API-Orchestrated Flow
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Frontend never talks directly to Python.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Express controls auth, queueing, persistence, and contracts.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <ShieldCheck className="h-4 w-4" />
                            Protected Workspaces
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">JWT auth and owner-scoped records.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Manuals, jobs, and checklists are linked to authenticated users.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Radar className="h-4 w-4" />
                            Retrieval Control
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Swap strategy per job without code changes.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Choose provider, retrieval mode, item limits, and strict verification.</CardContent>
                </Card>
            </section>

            <section className="mx-auto mt-8 w-[90%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-sm md:p-10">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">How It Works</p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">A clean 4-step workflow</h2>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {[
                        {
                            step: '01',
                            title: 'Upload Manual',
                            text: 'Create a manual record, upload a PDF, and prepare source content for pipeline execution.',
                        },
                        {
                            step: '02',
                            title: 'Run Generation Job',
                            text: 'Select provider and retrieval mode, then enqueue an async checklist generation run.',
                        },
                        {
                            step: '03',
                            title: 'Track Progress',
                            text: 'Monitor queue state transitions and view completion or failure details in real time.',
                        },
                        {
                            step: '04',
                            title: 'Review Checklist',
                            text: 'Open generated checklist results, inspect items and citations, and continue downstream actions.',
                        },
                    ].map((item) => (
                        <article key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">Step {item.step}</p>
                            <h3 className="mt-2 text-lg font-bold text-slate-900 md:text-xl">{item.title}</h3>
                            <p className="mt-2 text-sm text-slate-600 md:text-base">{item.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mx-auto mt-8 w-[90%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-sm md:p-10">
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Why Teams Like It</p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Built for practical execution</h2>
                        <ul className="mt-4 space-y-3 text-sm text-slate-700 md:text-base">
                            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Consistent output format from large manuals.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Auth and ownership boundaries from day one.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Flexible provider and retrieval strategy per job.</li>
                        </ul>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Quick FAQ</p>
                        <div className="mt-3 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 md:text-base">Can I use local model only?</h3>
                                <p className="mt-1 text-sm text-slate-600 md:text-base">Yes. Choose provider <span className="font-semibold">local</span> during generation.</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 md:text-base">Does frontend call Python directly?</h3>
                                <p className="mt-1 text-sm text-slate-600 md:text-base">No. Browser requests go to Express API only.</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 md:text-base">Can I track long jobs?</h3>
                                <p className="mt-1 text-sm text-slate-600 md:text-base">Yes. Job pages show persisted status and queue state.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-8 w-[90%] max-w-6xl rounded-4xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-slate-100 shadow-xl md:p-10">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">Built For Real Operations</p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Ready to run your first manual-to-checklist pipeline?</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base md:text-lg">
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
