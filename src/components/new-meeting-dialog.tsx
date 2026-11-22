import { useRef, useState, type FormEvent } from 'react'
import { FileText } from 'lucide-react'

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
import {
  titleFromFileName,
  todayIsoDate,
  validateMeetingDate,
  validateTitle,
  validateTranscript,
} from '@/lib/meeting-validation'
import { createMeeting } from '@/lib/meetings'
import { cn } from '@/lib/utils'

// A transcript waiting to be saved: read from a file, or empty for pasting.
export type TranscriptDraft = {
  transcript: string
  // The uploaded file's name; null when the user is pasting instead.
  fileName: string | null
}

type NewMeetingDialogProps = {
  // The modal is open while there is a draft.
  draft: TranscriptDraft | null
  onClose: () => void
  // Called with the saved meeting's title.
  onCreated: (id: string, title: string) => void
}

export function NewMeetingDialog({ draft, onClose, onCreated }: NewMeetingDialogProps) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New meeting</DialogTitle>
          <DialogDescription>Check the details, then save the meeting.</DialogDescription>
        </DialogHeader>
        {/* Rendered only while open, so each draft starts with a fresh form. */}
        {draft && <NewMeetingForm draft={draft} onCancel={onClose} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  )
}

type Field = 'title' | 'meetingDate' | 'transcript'
type FieldErrors = Partial<Record<Field, string>>

type NewMeetingFormProps = {
  draft: TranscriptDraft
  onCancel: () => void
  onCreated: (id: string, title: string) => void
}

function NewMeetingForm({ draft, onCancel, onCreated }: NewMeetingFormProps) {
  // Starting values come from the draft: an uploaded file suggests a title.
  const [title, setTitle] = useState(() =>
    draft.fileName ? titleFromFileName(draft.fileName) : '',
  )
  const [meetingDate, setMeetingDate] = useState(todayIsoDate)
  const [startTime, setStartTime] = useState('')
  const [transcript, setTranscript] = useState(draft.transcript)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
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
      transcript: validateTranscript(transcript),
    }
    setErrors(newErrors)
    setFormError(null)
    if (newErrors.title || newErrors.meetingDate || newErrors.transcript) return

    savingRef.current = true
    setIsSaving(true)

    try {
      const id = await createMeeting({
        title,
        meetingDate,
        // An empty time input means the start time is unknown.
        startTime: startTime || null,
        transcript,
        source: draft.fileName ? 'upload' : 'paste',
        fileName: draft.fileName,
      })
      onCreated(id, title.trim())
    } catch (error) {
      // The form keeps everything the user entered, so they can try again.
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

      {draft.fileName ? (
        // Uploaded: show which file will be saved.
        <div className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-medium">{draft.fileName}</span>
          <span className="shrink-0 text-muted-foreground">
            {transcript.length.toLocaleString('en-GB')} characters
          </span>
        </div>
      ) : (
        // Pasting: a text box for the transcript.
        <div className="space-y-1.5">
          <label htmlFor="transcript-text" className="text-sm font-medium">
            Transcript
          </label>
          <textarea
            id="transcript-text"
            rows={8}
            value={transcript}
            aria-invalid={errors.transcript ? true : undefined}
            aria-describedby={errors.transcript ? 'transcript-error' : undefined}
            onChange={(event) => {
              setTranscript(event.target.value)
              clearError('transcript')
            }}
            className={cn(
              'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
              'shadow-xs outline-none',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              'aria-invalid:border-destructive',
            )}
          />
        </div>
      )}
      {errors.transcript && (
        <p id="transcript-error" className="text-sm text-destructive">
          {errors.transcript}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save meeting'}
        </Button>
      </DialogFooter>
    </form>
  )
}
