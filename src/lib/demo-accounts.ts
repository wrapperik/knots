import { authErrorMessage } from '@/lib/auth-validation'
import { supabase } from '@/lib/supabase'

// The seeded demo users (supabase/seed.sql). The sidebar lists them so a
// reviewer can switch between them in one click and see that each one only
// reaches their own data. The password is public on purpose: these accounts
// hold demo data only, never real meetings.
export const DEMO_PASSWORD = 'Knots-demo-1'

export type DemoAccount = {
  email: string
  name: string
  // What the account holds, shown under the name.
  note: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'alex@knots.test', name: 'Alex Morgan', note: 'Two meetings' },
  { email: 'sam@knots.test', name: 'Sam Patel', note: 'One meeting' },
  { email: 'jordan@knots.test', name: 'Jordan Lee', note: 'No meetings' },
]

// Logs in as a demo user. Supabase replaces the current session with the new
// one, so there is no log-out step in between.
export async function switchToDemoAccount(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
  if (error) {
    throw new Error(
      error.code === 'invalid_credentials'
        ? 'This demo account does not exist on this server yet.'
        : authErrorMessage(error),
    )
  }
}
