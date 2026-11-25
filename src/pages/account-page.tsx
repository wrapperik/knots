import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { FormField } from '@/components/auth/form-field'
import { CalendarFeedCard } from '@/components/calendar-feed-card'
import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { deleteAccount, getDisplayName, updateDisplayName } from '@/lib/account'
import { validateDisplayName } from '@/lib/auth-validation'
import { useAuth } from '@/hooks/use-auth'

export function AccountPage() {
  const { session } = useAuth()
  // RequireAuth guarantees a session, but the type does not know that.
  const user = session?.user
  if (!user) return null

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="font-sans text-lg font-medium">Account</h1>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6 lg:p-10">
        <NameCard userId={user.id} />
        <EmailCard email={user.email ?? ''} />
        <CalendarFeedCard />
        <DeleteCard email={user.email ?? ''} />
      </main>
    </>
  )
}

// Rename: one field, saved to the profiles table.
function NameCard({ userId }: { userId: string }) {
  // The saved name. Null until it has loaded.
  const [savedName, setSavedName] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // A ref changes immediately, so a fast double click cannot send twice.
  const submittingRef = useRef(false)

  useEffect(() => {
    // Ignores the result if the page unmounts before the request finishes.
    let ignore = false
    getDisplayName(userId)
      .then((result) => {
        if (ignore) return
        setSavedName(result)
        setName(result)
      })
      .catch((failure: Error) => {
        if (!ignore) setLoadError(failure.message)
      })
    return () => {
      ignore = true
    }
  }, [userId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const problem = validateDisplayName(name)
    setError(problem)
    if (problem) return

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const saved = await updateDisplayName(userId, name)
      setSavedName(saved)
      setName(saved)
      toast.success('Name saved.')
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name</CardTitle>
        <CardDescription>How you appear in Knots.</CardDescription>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <p role="alert" className="text-sm text-destructive">
            {loadError}
          </p>
        ) : savedName === null ? (
          <Loader label="Loading your profile" />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              label="Display name"
              autoComplete="name"
              value={name}
              error={error}
              onChange={(event) => {
                setName(event.target.value)
                setError(undefined)
              }}
            />
            <Button type="submit" disabled={isSubmitting || name.trim() === savedName}>
              {isSubmitting ? 'Saving…' : 'Save name'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// The login email, shown but not editable.
function EmailCard({ email }: { email: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>
          You log in with <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

// Delete: a soft delete behind a confirmation that asks for the password.
function DeleteCard({ email }: { email: string }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)

  function handleOpenChange(open: boolean) {
    // Closing is blocked while the request runs, so it cannot be half-cancelled.
    if (isSubmitting) return
    setIsOpen(open)
    // A fresh start each time the dialog opens.
    setPassword('')
    setError(undefined)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    if (!password) {
      setError('Enter your password to confirm.')
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await deleteAccount(email, password)
      toast.success('Your account has been deleted.')
      navigate('/login', { replace: true })
    } catch (failure) {
      setError((failure as Error).message)
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          You will be logged out and cannot log in again. Your meetings are no longer shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => handleOpenChange(true)}>
          Delete my account
        </Button>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This logs you out straight away and you cannot log in again. Enter your password to
                confirm.
              </DialogDescription>
            </DialogHeader>
            <FormField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              error={error}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(undefined)
              }}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Deleting…' : 'Delete account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
