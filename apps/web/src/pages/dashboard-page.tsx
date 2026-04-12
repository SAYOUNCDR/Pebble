import { ShieldCheck, UserRound } from 'lucide-react'

import { useAuth } from '../features/auth/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function DashboardPage(): React.JSX.Element {
    const { user } = useAuth()

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
            <section className="rounded-3xl border border-slate-200 bg-linear-to-b from-white to-slate-100 p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Authenticated</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome back, {user?.fullName}</h1>
                <p className="mt-3 text-sm text-slate-600">This is your protected dashboard shell. Jobs/manual/checklist modules come next.</p>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserRound className="h-4 w-4" />
                            Account
                        </CardTitle>
                        <CardDescription>Current authenticated user details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-slate-700">
                        <p>
                            <span className="font-medium">Name:</span> {user?.fullName}
                        </p>
                        <p>
                            <span className="font-medium">Email:</span> {user?.email}
                        </p>
                        <p>
                            <span className="font-medium">Role:</span> {user?.role}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4" />
                            Status
                        </CardTitle>
                        <CardDescription>Frontend auth foundation is complete.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-700">
                        Next implementation: manuals upload, jobs queue polling, checklist pages, and exports.
                    </CardContent>
                </Card>
            </section>
        </main>
    )
}
