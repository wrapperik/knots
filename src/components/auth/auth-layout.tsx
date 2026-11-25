import type { ReactNode } from 'react'

import { PhotoGridBackground } from '@/components/auth/photo-grid-background'

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
    // relative: the photo grid is positioned against this element.
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      <PhotoGridBackground />

      {/* relative puts the content above the grid, which comes earlier in the page. */}
      <div className="relative w-full max-w-sm">
        <div className="space-y-6 rounded-xl border bg-card p-6 shadow-2xl">
          {/* The orange mark, because the wordmark is white for the dark sidebar. */}
          <img src="/logo.svg" alt="Knots" className="size-10" />
          <div className="space-y-1">
            <h1 className="text-2xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          {/* Inside the card, so it never sits on top of a photo. */}
          <p className="border-t pt-4 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </main>
  )
}
