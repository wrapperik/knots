import { Navigate, Outlet, useLocation } from 'react-router'
import { Loader } from '@/components/loader'
import { useAuth } from '@/hooks/use-auth'
function FullPageLoader() {
    return (
        <div className="flex min-h-svh items-center justify-center">
            <Loader label="Checking your session" />
        </div>
    )
}
// Wraps pages that need a logged-in user. Anyone else goes to the login page,
// which sends them back here afterwards.
export function RequireAuth() {
    const { session, isLoading } = useAuth()
    const location = useLocation()
    if (isLoading) return <FullPageLoader />
    if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
    return <Outlet />
}
// Wraps the login and sign-up pages. Someone already logged in goes home.
export function RequireGuest() {
    const { session, isLoading } = useAuth()
    if (isLoading) return <FullPageLoader />
    if (session) return <Navigate to="/" replace />
    return <Outlet />
}