import { ArrowRight, CheckCircle2, Cpu, FileStack, Lock, Radar, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function HomePage(): React.JSX.Element {
    const { user } = useAuth()

    return (
        <main className="relative overflow-hidden pb-16">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(15,23,42,0.09),transparent_33%),radial-gradient(circle_at_80%_0%,rgba(190,24,93,0.14),transparent_36%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.11),transparent_40%)]" />

            <section className="mx-auto mt-8 w-[80%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm md:p-12">
                <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1 text-[11px] font-semibold tracking-[0.2em] text-slate-700 uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            Pebble - High-Precision Manual Checklist Builder
                        </p>
                        <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
                            Don&apos;t just search your manuals. Reason through them.
                        </h1>
                        <p className="mt-5 max-w-2xl text-sm text-slate-600 sm:text-base md:text-lg">
                            Pebble is a local-first, privacy-sovereign system that converts dense technical manuals into actionable maintenance checklists using a PageIndex-style vectorless reasoning pipeline.
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

                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-slate-900/20">
                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">Core Philosophy</p>
                        <div className="mt-4 space-y-3">
                            {[
                                'Understand structure through section hierarchy',
                                'Navigate procedural logic like a field engineer',
                                'Anchor every task to page and section citations',
                                'Reject vibe-matching and weakly grounded outputs',
                                'Keep manuals and reasoning fully local when needed',
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

            <section className="mx-auto mt-8 grid w-[80%] max-w-6xl gap-4 md:grid-cols-3">
                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Cpu className="h-4 w-4" />
                            The Brain: Gemma 4 (4B)
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Instruction-following and procedural reasoning optimized for local hardware.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Using 4B-Q4_K_XL to deliver high-quality reasoning on consumer GPUs.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Workflow className="h-4 w-4" />
                            The Engine: Docker Model Runner
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Native, GPU-backed inference with local sovereignty.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">No cloud lock-in, no rate limits, no vendor dependency for critical workflows.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Lock className="h-4 w-4" />
                            The Pipeline: Python + Node.js
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">FastAPI for reasoning loop, Express for auth/jobs/persistence.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">MongoDB stores artifacts while Redis tracks async orchestration state.</CardContent>
                </Card>
            </section>

            <section className="mx-auto mt-8 grid w-[80%] max-w-6xl gap-4 md:grid-cols-3">
                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Workflow className="h-4 w-4" />
                            Automatic Categorization
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Labels tasks as must_do vs optional recommendations.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Critical and safety actions are separated from low-risk suggestions for real maintenance planning.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <ShieldCheck className="h-4 w-4" />
                            Page-Level Grounding
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Every checklist item points to page and section context.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Outputs remain auditable and reviewable instead of generic AI text with uncertain provenance.</CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/90 bg-white/90">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                            <Radar className="h-4 w-4" />
                            Interactive Editor and Export
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base">Review and refine AI drafts against source manuals.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 md:text-base">Prepare clean operational reports and handoff-ready maintenance checklists.</CardContent>
                </Card>
            </section>

            <section className="mx-auto mt-8 w-[80%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-sm md:p-10">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">How Pebble Works</p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">From ingest to finalized checklist</h2>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {[
                        {
                            step: '01',
                            title: 'Upload Manual',
                            text: 'Ingest technical manuals (typically 15 to 80 pages) and normalize structure for reasoning.',
                        },
                        {
                            step: '02',
                            title: 'Index',
                            text: 'Build a structural map of sections, dependencies, and procedural anchors.',
                        },
                        {
                            step: '03',
                            title: 'Reason',
                            text: 'Gemma 4 navigates the map to extract tasks with context and category.',
                        },
                        {
                            step: '04',
                            title: 'Verify and Finalize',
                            text: 'Deduplicate, validate citations, review results, then export for field execution.',
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

            <section className="mx-auto mt-8 w-[80%] max-w-6xl rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-sm md:p-10">
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Build in Public</p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Privacy first, open architecture</h2>
                        <ul className="mt-4 space-y-3 text-sm text-slate-700 md:text-base">
                            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Manuals stay on your infrastructure and under your control.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />No dependency on cloud LLM uptime or rate limits.</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />Designed with modern tooling: Tailwind, Vite, Docker.</li>
                        </ul>
                        <div className="mt-6 flex flex-wrap gap-3 text-sm">
                            <a
                                href="https://github.com/SAYOUNCDR/Pebble"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                GitHub Repo
                            </a>
                            <a
                                href="https://github.com/SAYOUNCDR/Pebble"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Documentation
                            </a>
                            <a
                                href="https://github.com/SAYOUNCDR/Pebble"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Peerlist Discussion
                            </a>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Quick FAQ</p>
                        <div className="mt-3 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 md:text-base">Can I use local model only?</h3>
                                <p className="mt-1 text-sm text-slate-600 md:text-base">Yes. Choose provider <span className="font-semibold">local</span> during generation.</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 md:text-base">Is Pebble private by default?</h3>
                                <p className="mt-1 text-sm text-slate-600 md:text-base">Yes. The architecture is designed to run locally with full data sovereignty.</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 md:text-base">Why vectorless reasoning?</h3>
                                <p className="mt-1 text-sm text-slate-600 md:text-base">Procedural manuals need structural navigation, not only semantic similarity.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-8 w-[80%] max-w-6xl rounded-4xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-slate-100 shadow-xl md:p-10">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">Pebble</p>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Ready to run your first manual-to-checklist pipeline?</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base md:text-lg">
                            Local-first, high-precision checklist generation with strict grounding, modern orchestration, and practical maintenance output.
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
