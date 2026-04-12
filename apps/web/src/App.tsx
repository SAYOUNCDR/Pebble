import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/auth/protected-route'
import { SiteHeader } from './components/layout/site-header'
import { DashboardPage } from './pages/dashboard-page'
import { HomePage } from './pages/home-page'
import { LoginPage } from './pages/login-page'
import { NotFoundPage } from './pages/not-found-page'
import { RegisterPage } from './pages/register-page'

function App(): React.JSX.Element {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <SiteHeader />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </div>
    )
}

export default App
