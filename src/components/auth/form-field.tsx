import { useId, type ComponentProps, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FormFieldProps = ComponentProps<typeof Input> & {
  label: string
  error?: string
  // Shown under the input when there is no error, such as password rules.
  hint?: string
  // A small button inside the right-hand end of the input, such as show password.
  endAdornment?: ReactNode
}

// A labelled input with its hint or error underneath. The ids link them, so
// screen readers read the error when the input is focused.
export function FormField({
  label,
  error,
  hint,
  endAdornment,
  className,
  ...inputProps
}: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {/* relative: the adornment is positioned against this wrapper. */}
      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          // Room on the right so typed text never runs under the adornment.
          className={cn(endAdornment && 'pr-10', className)}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-1 flex items-center">{endAdornment}</div>
        )}
      </div>
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
