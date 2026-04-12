import { Link } from 'react-router-dom'

import { Button } from '../components/ui/button'

export function NotFoundPage(): React.JSX.Element {
    return (
        <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-8">
            <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">404</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
                <p className="mt-2 text-sm text-slate-600">The route you requested does not exist.</p>
                <div className="mt-6">
                    <Link to="/">
                        <Button>Go home</Button>
                    </Link>
                </div>
            </div>
        </main>
    )
}
