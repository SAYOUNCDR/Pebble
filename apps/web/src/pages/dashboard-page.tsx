import { ShieldCheck, UserRound, FileText, Zap, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function DashboardPage(): React.JSX.Element {
    const { user } = useAuth()

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
            <section className="rounded-3xl border border-slate-200 bg-linear-to-b from-white to-slate-100 p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Authenticated</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome back, {user?.fullName}</h1>
                <p className="mt-3 text-sm text-slate-600">Manage manuals, run AI checklist generation jobs, and review completed checklists.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/upload-manual">
                        <Button>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload Manual
                        </Button>
                    </Link>
                    <Link to="/manuals">
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            View Manuals
                        </Button>
                    </Link>
                    <Link to="/jobs">
                        <Button variant="outline">
                            <Zap className="mr-2 h-4 w-4" />
                            View Jobs
                        </Button>
                    </Link>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserRound className="h-4 w-4" />
                            Account
                        </CardTitle>
                        <CardDescription>Your profile information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                        <p>
                            <span className="font-medium">Name:</span> {user?.fullName}
                        </p>
                        <p>
                            <span className="font-medium">Email:</span> {user?.email}
                        </p>
                        <p>
                            <span className="font-medium">Role:</span> <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{user?.role}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" />
                            Manuals
                        </CardTitle>
                        <CardDescription>Upload and manage PDF manuals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-700 mb-3">Store your PDF manuals and generate checklists from their content using AI.</p>
                        <Link to="/manuals" className="inline-block">
                            <Button size="sm" variant="outline">Go to Manuals</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-4 w-4" />
                            Jobs
                        </CardTitle>
                        <CardDescription>Track AI generation jobs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-700 mb-3">Monitor your checklist generation jobs and view their results.</p>
                        <Link to="/jobs" className="inline-block">
                            <Button size="sm" variant="outline">Go to Jobs</Button>
                        </Link>
                    </CardContent>
                </Card>
            </section>

            <section className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4" />
                            System Status
                        </CardTitle>
                        <CardDescription>Overview of your connected services.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                            <span>Authentication</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                                Active
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>AI Pipeline</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                                Ready
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>File Storage</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                                Connected
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </main>
    )
}
