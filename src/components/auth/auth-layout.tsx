import type { ReactNode } from 'react'

import { WaveBackground } from '@/components/wave-background'

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  // The "Already have an account?" line under the form.
  footer: ReactNode
}

// The centred card shared by the login and sign-up pages.
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    // relative: the waves are positioned against this element.
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <WaveBackground />

      {/* relative puts the content above the waves, which come earlier in the page. */}
      <div className="relative w-full max-w-sm space-y-6">
        {/* The orange mark, because the wordmark is white for the dark sidebar. */}
        <img src="/logo.svg" alt="Knots" className="mx-auto size-12" />

        <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>

        {/* Dark text, because muted grey is too faint on the orange waves. */}
        <p className="text-center text-sm text-foreground">{footer}</p>
      </div>
    </main>
  )
}
