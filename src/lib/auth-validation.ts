import type { AuthError } from '@supabase/supabase-js'

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export const MIN_PASSWORD_LENGTH = 8

export function validateEmail(email: string): string | undefined {
    if (!email.trim()) return 'Enter your email address.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Enter a valid email address, like name@example.com'
    }
}

export function validateNewPassword(password: string): string | undefined {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Include an uppercase letter, a lowercase letter and a number.'
    }
}

// The second password box on sign-up. Only checked in the browser: the server
// receives one password, and its own rules still apply to that.
export function validatePasswordConfirmation(
    password: string,
    confirmation: string,
): string | undefined {
    if (!confirmation) return 'Enter your password again.'
    if (confirmation !== password) return 'The passwords do not match.'
}

export function validateDisplayName(name: string): string | undefined {
    if (!name.trim()) return 'Enter your name.'
    if (name.trim().length > 100) return 'Keep your name under 100 characters.'
}
// Turns Supabase Auth errors into plain messages. Unknown errors get a
// general message rather than a technical one.
export function authErrorMessage(error: AuthError): string {
    switch (error.code) {
        case 'invalid_credentials':
            return 'That email and password do not match. Check them and try again.'
        case 'user_already_exists':
        case 'email_exists':
            return 'An account with that email already exists. Try logging in instead.'
        case 'weak_password':
            return 'That password is too weak. Use upper and lower case letters and a number.'
        case 'email_not_confirmed':
            return 'Confirm your email address first. Check your inbox for the link.'
        case 'user_banned':
            return 'This account has been deleted.'
        case 'over_request_rate_limit':
        case 'over_email_send_rate_limit':
            return 'Too many attempts. Wait a minute and try again.'
        case 'signup_disabled':
            return 'Sign-ups are closed at the moment.'
        default:
            return 'Something went wrong. Check your connection and try again.'
    }
}