import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { AuthContext } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// Keeps track of who is logged in and shares it with the whole app.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Fires once straight away with the saved session (or null), then again on
        // every login, logout and token refresh, including in other tabs.
        const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
            setIsLoading(false)
        })

        return () => data.subscription.unsubscribe()
    }, [])

    return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}
