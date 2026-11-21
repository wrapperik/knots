import { useContext } from 'react'
import { AuthContext } from '@/lib/auth-context'
// Returns the current session. Only works inside <AuthProvider>.
export function useAuth() {
    const auth = useContext(AuthContext)
    if (!auth) throw new Error('useAuth must be used inside <AuthProvider>.')
    return auth
}