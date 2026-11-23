import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type TextEditFormProps = {
  // Names the field for screen readers and messages, e.g. "Decision".
  label: string
  initialValue: string
  maxLength: number
  rows?: number
  onSave: (value: string) => Promise<void>
  onCancel: () => void
}

// A text box with Save and Cancel, used to edit the summary and decisions.
// Ctrl+Enter (or Cmd+Enter) saves and Escape cancels.
export function TextEditForm({
  label,
  initialValue,
  maxLength,
  rows = 3,
  onSave,
  onCancel,
}: TextEditFormProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Unique ids link the text box to its error and hint for screen readers.
  const errorId = useId()
  const hintId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // When the form opens: focus the text box with the cursor after the last word.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [])

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (isSaving) return

    const trimmed = value.trim()
    if (!trimmed) return setError(`${label} cannot be empty.`)
    if (trimmed.length > maxLength) return setError(`Keep it under ${maxLength} characters.`)
    // Saving an unchanged value would add an empty step to the history.
    if (trimmed === initialValue.trim()) return onCancel()

    setIsSaving(true)
    setError(null)
    try {
      // On success the parent closes the form, so there is nothing to reset.
      await onSave(trimmed)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save. Try again.')
      setIsSaving(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') onCancel()
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleSubmit()
  }

  // The count only appears near the limit, where it is useful.
  const nearLimit = value.length > maxLength * 0.8

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        aria-label={label}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        ref={textareaRef}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hintId}
        className="bg-white"
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={hintId} className="text-xs text-muted-foreground">
          {nearLimit
            ? `${value.length} / ${maxLength} characters`
            : 'Ctrl+Enter to save, Esc to cancel'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}
