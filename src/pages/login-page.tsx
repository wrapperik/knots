import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { authErrorMessage, validateEmail, type FieldErrors } from '@/lib/auth-validation'
import { supabase } from '@/lib/supabase'

type Field = 'email' | 'password'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // The page the user was sent away from, so they land back on it.
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // State updates are not instant, so a fast double click could slip past
  // isSubmitting. A ref changes immediately and blocks the second click.
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const newErrors: FieldErrors<Field> = {
      email: validateEmail(email),
      password: password ? undefined : 'Enter your password.',
    }
    setErrors(newErrors)
    setFormError(null)
    if (newErrors.email || newErrors.password) return

    submittingRef.current = true
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    submittingRef.current = false
    setIsSubmitting(false)

    if (error) {
      setFormError(authErrorMessage(error))
      return
    }
    navigate(from, { replace: true })
  }

  // Clears a field's error as soon as the user starts fixing it.
  function clearError(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  return (
    
    <AuthLayout
      title="Log in"
      description="Welcome back. Pick up where you left off."
      footer={
        <>
          New to Knots?{' '}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      {/* noValidate: our own messages replace the browser's pop-ups. */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value)
            clearError('email')
          }}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value)
            clearError('password')
          }}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
