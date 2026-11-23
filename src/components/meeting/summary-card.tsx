import { useEffect, useRef, useState } from 'react'
import { PencilIcon, WaypointsIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Loader } from '@/components/loader'
import { TextEditForm } from '@/components/meeting/text-edit-form'
import { Button } from '@/components/ui/button'
import { MAX_SUMMARY_LENGTH, updateSummary } from '@/lib/meeting-edits'
import { analyseMeeting, type MeetingDetail, type MeetingStatus } from '@/lib/meetings'

// What the card says before there is a summary.
const SUMMARY_PLACEHOLDERS: Record<MeetingStatus, string> = {
  pending: 'Not analysed yet. The summary, decisions and action items will appear here.',
  processing: 'Analysing the transcript…',
  failed: 'The analysis did not finish. The transcript is saved, so it can be analysed again.',
  done: 'No summary was produced for this meeting.',
}

type SummaryCardProps = {
  meeting: MeetingDetail
  onChanged: () => void
}

// The AI overview: the summary with an edit button, or the analysis status
// with a button to start or retry it.
export function SummaryCard({ meeting, onChanged }: SummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analyseError, setAnalyseError] = useState<string | null>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (!isEditing && returnFocus.current) {
      editButtonRef.current?.focus()
      returnFocus.current = false
    }
  }, [isEditing])

  function closeForm() {
    returnFocus.current = true
    setIsEditing(false)
  }

  // Runs the analysis, then reloads the meeting to show the result or the failed status.
  async function handleAnalyse() {
    setIsAnalysing(true)
    setAnalyseError(null)
    try {
      await analyseMeeting(meeting.id)
      toast.success('Analysis ready')
    } catch (error) {
      setAnalyseError((error as Error).message)
    } finally {
      setIsAnalysing(false)
      onChanged()
    }
  }

  return (
    <section aria-labelledby="overview-heading" className="rounded-lg border bg-white/65 p-5">
      <div className="flex items-center justify-between gap-2 pb-2">
        <h3 id="overview-heading" className="flex items-center gap-2 font-medium">
          <WaypointsIcon className="size-4 text-primary" aria-hidden="true" />
          AI Overview
          {meeting.summaryEditedAt && (
            <span className="text-xs font-normal text-muted-foreground">Edited</span>
          )}
        </h3>
        {meeting.summary && !isEditing && (
          <Button
            ref={editButtonRef}
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            aria-label="Edit summary"
            className="text-muted-foreground"
          >
            <PencilIcon />
          </Button>
        )}
      </div>

      {isEditing && meeting.summary ? (
        <TextEditForm
          label="Summary"
          initialValue={meeting.summary}
          maxLength={MAX_SUMMARY_LENGTH}
          rows={6}
          onCancel={closeForm}
          onSave={async (summary) => {
            await updateSummary(meeting.id, summary)
            toast.success('Summary saved')
            closeForm()
            onChanged()
          }}
        />
      ) : meeting.summary ? (
        // pre-line keeps the line breaks a person types into the summary.
        <p className="whitespace-pre-line">{meeting.summary}</p>
      ) : isAnalysing ? (
        <div className="flex items-center gap-3">
          <Loader className="text-[10px]" label="Analysing the transcript" />
          <p className="text-muted-foreground">
            Analysing the transcript. This can take up to a minute.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground">{SUMMARY_PLACEHOLDERS[meeting.status]}</p>
          {analyseError && (
            <p role="alert" className="text-sm text-destructive">
              {analyseError}
            </p>
          )}
          {(meeting.status === 'pending' || meeting.status === 'failed') && (
            <Button size="sm" onClick={handleAnalyse}>
              {meeting.status === 'failed' ? 'Try again' : 'Analyse meeting'}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
