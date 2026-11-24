import { useRef, useState, type FormEvent } from 'react'

import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { validateMeetingDate, validateTitle } from '@/lib/meeting-validation'
import { formatStartTime, updateMeetingDetails, type Meeting } from '@/lib/meetings'

type EditMeetingDialogProps = {
  // The modal is open while there is a meeting to edit.
  meeting: Meeting | null
  onClose: () => void
  onSaved: () => void
}

export function EditMeetingDialog({ meeting, onClose, onSaved }: EditMeetingDialogProps) {
  return (
    <Dialog open={meeting !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>Change the title, date or start time.</DialogDescription>
        </DialogHeader>
        {/* Rendered only while open, so each meeting starts with a fresh form. */}
        {meeting && <EditMeetingForm meeting={meeting} onCancel={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

type Field = 'title' | 'meetingDate'
type FieldErrors = Partial<Record<Field, string>>

type EditMeetingFormProps = {
  meeting: Meeting
  onCancel: () => void
  onSaved: () => void
}

function EditMeetingForm({ meeting, onCancel, onSaved }: EditMeetingFormProps) {
  const [title, setTitle] = useState(meeting.title)
  const [meetingDate, setMeetingDate] = useState(meeting.meetingDate)
  // The time input wants "09:30", but Postgres returns "09:30:00".
  const [startTime, setStartTime] = useState(formatStartTime(meeting.startTime) ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // A ref changes immediately, so a fast double click cannot save twice.
  const savingRef = useRef(false)

  function clearError(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return

    const newErrors: FieldErrors = {
      title: validateTitle(title),
      meetingDate: validateMeetingDate(meetingDate),
    }
    setErrors(newErrors)
    setFormError(null)
    if (newErrors.title || newErrors.meetingDate) return

    savingRef.current = true
    setIsSaving(true)
    try {
      // An empty time input means the start time is unknown.
      await updateMeetingDetails(meeting.id, { title, meetingDate, startTime: startTime || null })
      onSaved()
    } catch (error) {
      // The form keeps what the user entered, so they can try again.
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Try again.')
      savingRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <FormField
        label="Title"
        value={title}
        error={errors.title}
        onChange={(event) => {
          setTitle(event.target.value)
          clearError('title')
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Date"
          type="date"
          value={meetingDate}
          error={errors.meetingDate}
          onChange={(event) => {
            setMeetingDate(event.target.value)
            clearError('meetingDate')
          }}
        />
        <FormField
          label="Start time (optional)"
          type="time"
          value={startTime}
          hint="Leave empty if you do not know."
          onChange={(event) => setStartTime(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}
