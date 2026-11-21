import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import {
  authErrorMessage,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  type FieldErrors,
} from '@/lib/auth-validation'
import { supabase } from '@/lib/supabase'

type Field = 'name' | 'email' | 'password'

export function SignupPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Set when the live project asks the user to confirm their email first.
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const newErrors: FieldErrors<Field> = {
      name: validateDisplayName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
    }
    setErrors(newErrors)
    setFormError(null)
    if (newErrors.name || newErrors.email || newErrors.password) return

    submittingRef.current = true
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Saved on the user; the handle_new_user trigger copies it into profiles.
      options: { data: { display_name: name.trim() } },
    })

    submittingRef.current = false
    setIsSubmitting(false)

    if (error) {
      setFormError(authErrorMessage(error))
      return
    }

    // Locally, email confirmation is off, so sign-up logs the user straight in.
    // On a project with confirmation on, there is no session until they click
    // the link in the email.
    if (data.session) {
      navigate('/', { replace: true })
    } else {
      setConfirmationSentTo(email.trim())
    }
  }

  function clearError(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const footer = (
    <>
      Already have an account?{' '}
      <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
        Log in
      </Link>
    </>
  )

  if (confirmationSentTo) {
    return (
      <AuthLayout
        title="Check your email"
        description="One more step before you can log in."
        footer={footer}
      >
        <p role="status" className="text-sm">
          We sent a confirmation link to <strong>{confirmationSentTo}</strong>. Open it to finish
          creating your account.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Turn your meeting transcripts into decisions and action items."
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <FormField
          label="Name"
          autoComplete="name"
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value)
            clearError('name')
          }}
        />
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
          autoComplete="new-password"
          value={password}
          error={errors.password}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
          onChange={(event) => {
            setPassword(event.target.value)
            clearError('password')
          }}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
