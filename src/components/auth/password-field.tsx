import { useState, type ComponentProps } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, 'type' | 'endAdornment'>

// A password input with a button that shows or hides what was typed, so people
// can check for typos.
export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <FormField
      {...props}
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <Button
          // type="button": a plain button inside a form would submit it.
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsVisible((visible) => !visible)}
          // The label stays the same and aria-pressed says whether it is on,
          // which is how screen readers expect a toggle button to work.
          aria-label="Show password"
          aria-pressed={isVisible}
          className="text-muted-foreground"
        >
          {isVisible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
        </Button>
      }
    />
  )
}
