import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Fail loudly at start-up rather than with confusing errors later.
if (!url || !publishableKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.')
}

// The publishable key is safe in the browser: Row Level Security decides what each user can read or write.
// The secret key bypasses Row Level Security, so it never belongs in a VITE_ variable.
export const supabase = createClient(url, publishableKey)
