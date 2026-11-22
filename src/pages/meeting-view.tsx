import { useEffect, useState } from 'react'
import {
  CheckIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  CopyIcon,
  GavelIcon,
  WaypointsIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'

import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'
import { WaveBackground } from '@/components/wave-background'
import {
  formatMeetingDate,
  formatStartTime,
  getMeeting,
  type ActionItemStatus,
  type MeetingDetail,
  type MeetingStatus,
} from '@/lib/meetings'
import { cn } from '@/lib/utils'

// What the summary card says before there is a summary.
const SUMMARY_PLACEHOLDERS: Record<MeetingStatus, string> = {
  pending: 'Not analysed yet. The summary, decisions and action items will appear here.',
  processing: 'Analysing the transcript…',
  failed: 'The analysis did not finish. The transcript is saved, so it can be analysed again.',
  done: 'No summary was produced for this meeting.',
}

// Label, icon and icon colour for each action item status.
type StatusStyle = { text: string; icon: typeof CircleIcon; className: string }

const ACTION_ITEM_STATUS: Record<ActionItemStatus, StatusStyle> = {
  todo: { text: 'To do', icon: CircleIcon, className: 'text-muted-foreground' },
  in_progress: { text: 'In progress', icon: CircleDotIcon, className: 'text-warning' },
  done: { text: 'Done', icon: CircleCheckIcon, className: 'text-success' },
}

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

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="truncate font-sans text-lg font-medium">
          {meeting?.title ?? 'Meeting'}
        </h1>
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
        <MeetingContent meeting={meeting} />
      )}
    </>
  )
}

// The loaded meeting: summary, decisions and action items beside the transcript.
function MeetingContent({ meeting }: { meeting: MeetingDetail }) {
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

  return (
    <main className="h-[calc(100svh-3.5rem)]">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="40%" className="relative">
          <WaveBackground />

          {/* Scrolls on its own, so the waves stay fixed behind the content. */}
          <div className="relative h-full space-y-6 overflow-y-auto p-5">
            <div>
              <h2 className="text-lg font-bold">Summary</h2>
              <p className="text-sm text-muted-foreground">
                {[formatMeetingDate(meeting.meetingDate), formatStartTime(meeting.startTime)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <section className="rounded-lg border bg-white/65 p-5">
              <h3 className="flex items-center gap-2 pb-2 font-medium">
                <WaypointsIcon className="size-4 text-primary" aria-hidden="true" />
                AI Overview
              </h3>
              {meeting.summary ? (
                <p>{meeting.summary}</p>
              ) : (
                <p className="text-muted-foreground">{SUMMARY_PLACEHOLDERS[meeting.status]}</p>
              )}
            </section>

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
                    <Item
                      key={decision.id}
                      role="listitem"
                      variant="outline"
                      size="xs"
                      className="bg-white/95"
                    >
                      <ItemMedia>
                        <GavelIcon className="size-4 text-primary" aria-hidden="true" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{decision.description}</ItemTitle>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </section>

            <section aria-labelledby="action-items-heading">
              <h3 id="action-items-heading" className="flex items-center gap-2 pb-2 font-medium">
                Action items
                <span className="text-xs font-normal text-muted-foreground">
                  {meeting.actionItems.length}
                </span>
              </h3>
              {meeting.actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No action items.</p>
              ) : (
                <ItemGroup className="gap-2">
                  {meeting.actionItems.map((item) => {
                    const status = ACTION_ITEM_STATUS[item.status]
                    return (
                      <Item
                        key={item.id}
                        role="listitem"
                        variant="outline"
                        size="xs"
                        className="bg-white/95"
                      >
                        <ItemMedia>
                          <status.icon
                            className={cn('size-4', status.className)}
                            aria-hidden="true"
                          />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{item.description}</ItemTitle>
                          <ItemDescription className="text-xs">
                            {[
                              status.text,
                              item.owner ?? 'No owner',
                              item.dueDate ? formatMeetingDate(item.dueDate) : 'No due date',
                            ].join(' · ')}
                          </ItemDescription>
                          {item.needsReview && (
                            <p className="text-xs font-medium text-warning">Needs review</p>
                          )}
                        </ItemContent>
                      </Item>
                    )
                  })}
                </ItemGroup>
              )}
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
            <label htmlFor="transcript" className="sr-only">Transcript</label>
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
