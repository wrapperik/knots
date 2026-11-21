import type { ReactNode } from 'react'

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
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* The orange mark, because the wordmark is white for the dark sidebar. */}
        <img src="/logo.svg" alt="Knots" className="mx-auto size-12" />

        <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>

        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  )
}
