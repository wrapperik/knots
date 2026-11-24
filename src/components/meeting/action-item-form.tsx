import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_OWNER_LENGTH,
  type ActionItemFields,
} from '@/lib/meeting-edits'
import { cn } from '@/lib/utils'

type ActionItemFormProps = {
  initialValues: ActionItemFields
  submitLabel: string
  onSave: (fields: ActionItemFields) => Promise<void>
  onCancel: () => void
  // Only passed when editing: a new item has nothing to delete.
  onDelete?: () => Promise<void>
}

// The fields of one action item: what, who, when and status.
export function ActionItemForm({
  initialValues,
  submitLabel,
  onSave,
  onCancel,
  onDelete,
}: ActionItemFormProps) {
  const [description, setDescription] = useState(initialValues.description)
  const [owner, setOwner] = useState(initialValues.owner ?? '')
  const [dueDate, setDueDate] = useState(initialValues.dueDate ?? '')
  const [status, setStatus] = useState(initialValues.status)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Deleting takes two clicks, so a slip of the mouse cannot delete an item.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const ids = {
    description: useId(),
    owner: useId(),
    dueDate: useId(),
    status: useId(),
    error: useId(),
  }

  useEffect(() => {
    const textarea = descriptionRef.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [])

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (isSaving) return

    if (!description.trim()) return setError('Describe what needs to be done.')
    if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      return setError(`Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`)
    }
    if (owner.trim().length > MAX_OWNER_LENGTH) {
      return setError(`Keep the owner under ${MAX_OWNER_LENGTH} characters.`)
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave({
        description: description.trim(),
        // An empty box means "no owner" or "no date": saved as null, never "".
        owner: owner.trim() || null,
        dueDate: dueDate || null,
        status,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save. Try again.')
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete || isSaving) return
    setIsSaving(true)
    try {
      await onDelete()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete. Try again.')
      setIsSaving(false)
      setConfirmingDelete(false)
    }
  }

  // Escape cancels from any field; Ctrl+Enter saves from any field.
  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    // An open status menu handles Escape itself and marks it as handled. Without
    // this check, closing the menu would also close the form.
    if (event.defaultPrevented) return
    if (event.key === 'Escape') onCancel()
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      aria-describedby={error ? ids.error : undefined}
      className="space-y-3 rounded-lg border bg-white p-3 shadow-sm"
    >
      <div className="space-y-1">
        <label htmlFor={ids.description} className="text-xs font-medium">
          What needs to be done
        </label>
        <Textarea
          id={ids.description}
          ref={descriptionRef}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          aria-invalid={error && !description.trim() ? true : undefined}
        />
      </div>

      {/* Stacked on phones, side by side from sm up. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor={ids.owner} className="text-xs font-medium">
            Owner
          </label>
          <Input
            id={ids.owner}
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="No owner"
            className="bg-white"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.dueDate} className="text-xs font-medium">
            Due date
          </label>
          <Input
            id={ids.dueDate}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.status} className="text-xs font-medium">
            Status
          </label>
          {/* The menu only offers these three values, so the cast is safe. */}
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ActionItemFields['status'])}
          >
            <SelectTrigger id={ids.status} className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p id={ids.error} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          onDelete ? 'justify-between' : 'justify-end',
        )}
      >
        {onDelete &&
          (confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">Delete this item?</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                Keep
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
              disabled={isSaving}
            >
              Delete
            </Button>
          ))}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
