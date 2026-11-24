import { authErrorMessage } from '@/lib/auth-validation'
import { supabase } from '@/lib/supabase'

// Reads the display name from the profiles table.
export async function getDisplayName(userId: string): Promise<string> {
    const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

    if (error) throw new Error('Could not load your profile. Try again.')
    return data.display_name ?? ''
}

// True when the user has deleted their account. Used right after logging in:
// a deleted account still has a valid login, but sees no data.
export async function isAccountDeleted(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('profiles')
        .select('deleted_at')
        .eq('id', userId)
        .single()

    // If the check itself fails, fail safe and let the login through. The
    // database policies already hide everything from a deleted account.
    if (error) return false
    return data.deleted_at !== null
}

// Saves a new display name. The database also limits it to 1 to 100
// characters, so a name that skips the form's check is still refused.
// .select('id').single() turns "no row changed" into an error, because RLS
// matches nothing rather than failing when a row is not yours.
export async function updateDisplayName(userId: string, name: string): Promise<string> {
    const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: name.trim() })
        .eq('id', userId)
        .select('display_name')
        .single()

    if (error) throw new Error('Could not save your name. Try again.')
    return data.display_name ?? ''
}

// Soft-deletes the account and logs out. The password is checked first by
// logging in again, so someone at an unlocked computer cannot delete it. The
// deletion itself is a database function, which only ever touches the caller.
export async function deleteAccount(email: string, password: string): Promise<void> {
    const { error: passwordError } = await supabase.auth.signInWithPassword({ email, password })
    if (passwordError) {
        // Only a wrong password is the user's mistake. Anything else is a failed request.
        throw new Error(
            passwordError.code === 'invalid_credentials'
                ? 'That password is not right.'
                : authErrorMessage(passwordError),
        )
    }

    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw new Error('Could not delete your account. Try again.')

    await supabase.auth.signOut()
}
