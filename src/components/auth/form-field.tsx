import { useId, type ComponentProps } from 'react'

import { Input } from '@/components/ui/input'

type FormFieldProps = ComponentProps<typeof Input> & {
  label: string
  error?: string
  // Shown under the input when there is no error, such as password rules.
  hint?: string
}

// A labelled input with its hint or error underneath. The ids link them, so
// screen readers read the error when the input is focused.
export function FormField({ label, error, hint, ...inputProps }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message && (
        <p
          id={messageId}
          className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
        >
          {message}
        </p>
      )}
    </div>
  )
}
