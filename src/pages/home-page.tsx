import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Loader } from '@/components/loader'
import { MeetingStats } from '@/components/meeting-stats'
import { NewMeetingDialog, type TranscriptDraft } from '@/components/new-meeting-dialog'
import { RecentMeetings } from '@/components/recent-meetings'
import { TranscriptDropzone } from '@/components/transcript-dropzone'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { analyseMeeting, getRecentMeetings, type Meeting } from '@/lib/meetings'

export function HomePage() {
  // Null until the first load finishes.
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Bumping this number runs the effect again, which reloads the meetings.
  const [reloadKey, setReloadKey] = useState(0)
  // The transcript waiting in the modal; null when the modal is closed.
  const [draft, setDraft] = useState<TranscriptDraft | null>(null)
  // Changing the key gives the dropzone a fresh start, clearing the file it shows.
  const [dropzoneKey, setDropzoneKey] = useState(0)
  // Meetings this page started analysing, shown as "Analysing" straight away.
  const [analysingIds, setAnalysingIds] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    // Ignores the result if the page unmounts before the request finishes.
    let ignore = false
    getRecentMeetings()
      .then((result) => {
        if (ignore) return
        setMeetings(result)
        setLoadError(null)
      })
      .catch((error: Error) => {
        if (!ignore) setLoadError(error.message)
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  function reload() {
    setReloadKey((key) => key + 1)
  }

  function openDraft(newDraft: TranscriptDraft) {
    setDraft(newDraft)
  }

  function closeDialog() {
    setDraft(null)
    setDropzoneKey((key) => key + 1)
  }

  function handleCreated(id: string, title: string) {
    closeDialog()
    reload()
    setAnalysingIds((ids) => [...ids, id])
    // One toast that changes as the analysis goes: loading, then success or error.
    const toastId = toast.loading(`“${title}” saved`, {
      description: 'The AI is busy analysing the transcript. This can take up to a minute.',
    })
    const openMeeting = { label: 'Open', onClick: () => navigate(`/meetings/${id}`) }

    // Starts the analysis straight away. The transcript is already saved, so a
    // failure only marks the meeting "Needs retry"; its page has a retry button.
    analyseMeeting(id)
      .then(() =>
        toast.success(`“${title}” is ready`, {
          id: toastId,
          description: 'The summary, decisions and action items are in.',
          action: openMeeting,
          duration: 8000,
        }),
      )
      .catch((error: Error) =>
        toast.error(`Could not analyse “${title}”`, {
          id: toastId,
          description: `${error.message} The transcript is saved.`,
          action: openMeeting,
          duration: 10000,
        }),
      )
      .finally(() => {
        setAnalysingIds((ids) => ids.filter((analysingId) => analysingId !== id))
        reload()
      })
  }

  // Meetings this page is analysing read "Analysing" even before the database
  // has marked them as processing.
  function withAnalysing(list: Meeting[]): Meeting[] {
    return list.map((meeting) =>
      analysingIds.includes(meeting.id) ? { ...meeting, status: 'processing' } : meeting,
    )
  }

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="font-sans text-lg font-medium">Meetings</h1>
      </header>

      {loadError && meetings === null ? (
        // The first load failed: say so, and offer a retry.
        <main className="flex flex-1 items-center justify-center p-6">
          <div role="alert" className="space-y-4 text-center">
            <p>{loadError}</p>
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          </div>
        </main>
      ) : meetings === null ? (
        <main className="flex flex-1 items-center justify-center p-6">
          <Loader label="Loading your meetings" />
        </main>
      ) : (
        // The dashboard, with or without meetings: stats, upload, then the list.
        <main className="flex flex-1 flex-col gap-10 p-6 lg:p-10">
          <MeetingStats meetings={withAnalysing(meetings)} />

          <section aria-label="Add a meeting" className="space-y-3">
            <TranscriptDropzone
              key={dropzoneKey}
              onTranscriptRead={(text, file) =>
                openDraft({ transcript: text, fileName: file.name })
              }
              onClear={closeDialog}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => openDraft({ transcript: '', fileName: null })}
                className="font-medium underline underline-offset-4"
              >
                Or paste a transcript instead
              </button>
            </div>
          </section>

          <RecentMeetings meetings={withAnalysing(meetings)} />
        </main>
      )}

      <NewMeetingDialog draft={draft} onClose={closeDialog} onCreated={handleCreated} />
    </>
  )
}
