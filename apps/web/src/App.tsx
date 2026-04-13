import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/auth/protected-route'
import { PublicOnlyRoute } from './components/auth/public-only-route'
import { SiteHeader } from './components/layout/site-header'
import { DashboardPage } from './pages/dashboard-page'
import { ChecklistDetailPage } from './pages/checklist-detail-page'
import { HomePage } from './pages/home-page'
import { JobDetailPage } from './pages/job-detail-page'
import { JobsPage } from './pages/jobs-page'
import { LoginPage } from './pages/login-page'
import { ManualDetailPage } from './pages/manual-detail-page'
import { ManualsPage } from './pages/manuals-page'
import { NotFoundPage } from './pages/not-found-page'
import { RegisterPage } from './pages/register-page'

function App(): React.JSX.Element {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <SiteHeader />
            <Routes>
                <Route
                    path="/"
                    element={
                        <PublicOnlyRoute>
                            <HomePage />
                        </PublicOnlyRoute>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <PublicOnlyRoute>
                            <LoginPage />
                        </PublicOnlyRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicOnlyRoute>
                            <RegisterPage />
                        </PublicOnlyRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manuals"
                    element={
                        <ProtectedRoute>
                            <ManualsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manuals/:manualId"
                    element={
                        <ProtectedRoute>
                            <ManualDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/jobs"
                    element={
                        <ProtectedRoute>
                            <JobsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/jobs/:jobId"
                    element={
                        <ProtectedRoute>
                            <JobDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/checklists/:checklistId"
                    element={
                        <ProtectedRoute>
                            <ChecklistDetailPage />
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
