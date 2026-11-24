import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { Loader } from '@/components/loader'
import { ActionItemRow } from '@/components/meeting/action-item-row'
import { AddActionItem } from '@/components/meeting/add-action-item'
import { DecisionRow } from '@/components/meeting/decision-row'
import { HistorySheet } from '@/components/meeting/history-sheet'
import { SummaryCard } from '@/components/meeting/summary-card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui/item'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'
import { WaveBackground } from '@/components/wave-background'
import { formatMeetingDate, formatStartTime, getMeeting, type MeetingDetail } from '@/lib/meetings'

export function MeetingView() {
  // The id from the address, e.g. /meetings/1a2b… gives "1a2b…".
  const { meetingId } = useParams()
  // undefined while loading, null when there is no such meeting.
  const [meeting, setMeeting] = useState<MeetingDetail | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Bumping this number runs the effect again, which reloads the meeting.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!meetingId) return
    // Ignores the result if the page unmounts before the request finishes.
    let ignore = false
    getMeeting(meetingId)
      .then((result) => {
        if (ignore) return
        setMeeting(result)
        setLoadError(null)
      })
      .catch((error: Error) => {
        if (!ignore) setLoadError(error.message)
      })
    return () => {
      ignore = true
    }
  }, [meetingId, reloadKey])

  // While an analysis is running, checks again every 3 seconds until it finishes.
  useEffect(() => {
    if (meeting?.status !== 'processing') return
    const timer = setTimeout(() => setReloadKey((key) => key + 1), 3000)
    return () => clearTimeout(timer)
  }, [meeting])

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        {/* Meetings > title. flex-nowrap and min-w-0 keep it on one line, so a
            long title is cut short with an ellipsis instead of wrapping. */}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap text-lg">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Meetings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              {/* Still the page's h1, so screen readers find the title as the
                  main heading. aria-current marks it as the page being viewed. */}
              <h1 aria-current="page" className="truncate font-sans text-lg font-medium text-foreground">
                {meeting?.title ?? 'Meeting'}
              </h1>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {loadError && meeting === undefined ? (
        // The load failed: say so, and offer a retry.
        <main className="flex flex-1 items-center justify-center p-6">
          <div role="alert" className="space-y-4 text-center">
            <p>{loadError}</p>
            <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </Button>
          </div>
        </main>
      ) : meeting === undefined ? (
        <main className="flex flex-1 items-center justify-center p-6">
          <Loader label="Loading the meeting" />
        </main>
      ) : meeting === null ? (
        // Also shown for someone else's meeting, so the page gives nothing away.
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="space-y-4 text-center">
            <p>Meeting not found. It may have been deleted, or the link is wrong.</p>
            <Button asChild variant="outline">
              <Link to="/">Back to meetings</Link>
            </Button>
          </div>
        </main>
      ) : (
        <MeetingContent meeting={meeting} onChanged={() => setReloadKey((key) => key + 1)} />
      )}
    </>
  )
}

type MeetingContentProps = {
  meeting: MeetingDetail
  // Called after any change, so the page reloads the meeting.
  onChanged: () => void
}

// The loaded meeting: summary, decisions and action items beside the transcript.
function MeetingContent({ meeting, onChanged }: MeetingContentProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  // Copies the transcript and shows "Copied" for two seconds.
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(meeting.transcript)
      setCopyError(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(true)
    }
  }

  // New items go after the last one. Math.max(-1, …) makes the first item 0.
  const nextPosition = Math.max(-1, ...meeting.actionItems.map((item) => item.position)) + 1

  return (
    <main className="h-[calc(100svh-3.5rem)]">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="40%" className="relative">
          <WaveBackground />

          {/* Scrolls on its own, so the waves stay fixed behind the content. */}
          <div className="relative h-full space-y-6 overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Summary</h2>
                <p className="text-sm text-muted-foreground">
                  {[formatMeetingDate(meeting.meetingDate), formatStartTime(meeting.startTime)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {/* Only once someone has changed something: before that, there is no history. */}
              {meeting.historyCount > 0 && (
                <HistorySheet meetingId={meeting.id} count={meeting.historyCount} />
              )}
            </div>

            <SummaryCard meeting={meeting} onChanged={onChanged} />

            <section aria-labelledby="decisions-heading">
              <h3 id="decisions-heading" className="flex items-center gap-2 pb-2 font-medium">
                Decisions
                <span className="text-xs font-normal text-muted-foreground">
                  {meeting.decisions.length}
                </span>
              </h3>
              {meeting.decisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No decisions recorded.</p>
              ) : (
                <ItemGroup className="gap-2">
                  {meeting.decisions.map((decision) => (
                    <DecisionRow key={decision.id} decision={decision} onChanged={onChanged} />
                  ))}
                </ItemGroup>
              )}
            </section>

            <section aria-labelledby="action-items-heading" className="space-y-2">
              <h3 id="action-items-heading" className="flex items-center gap-2 font-medium">
                Action items
                <span className="text-xs font-normal text-muted-foreground">
                  {meeting.actionItems.length}
                </span>
              </h3>
              {meeting.actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No action items.</p>
              ) : (
                <ItemGroup className="gap-2">
                  {meeting.actionItems.map((item) => (
                    <ActionItemRow key={item.id} item={item} onChanged={onChanged} />
                  ))}
                </ItemGroup>
              )}
              <AddActionItem
                meetingId={meeting.id}
                nextPosition={nextPosition}
                onChanged={onChanged}
              />
            </section>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="60%">
          <div className="flex h-full flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Transcript</h2>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            {copyError && (
              <p role="alert" className="text-sm text-destructive">
                Could not copy the transcript. Select the text and copy it manually.
              </p>
            )}
            <label htmlFor="transcript" className="sr-only">
              Transcript
            </label>
            <Textarea
              id="transcript"
              value={meeting.transcript}
              readOnly
              className="min-h-0 flex-1 resize-none field-sizing-fixed bg-white"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  )
}
