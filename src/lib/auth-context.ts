import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
export type AuthState = {
    // Null when nobody is logged in.
    session: Session | null
    // True until Supabase has said whether there is a saved session.
    isLoading: boolean
}
export const AuthContext = createContext<AuthState | null>(null)