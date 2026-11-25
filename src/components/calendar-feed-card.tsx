import { useEffect, useRef, useState } from 'react'
import { CalendarPlusIcon, CheckIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  createCalendarFeed,
  deleteCalendarFeed,
  getCalendarFeedCreatedAt,
  googleCalendarUrl,
  webcalUrl,
} from '@/lib/calendar'

// "2026-11-25T09:30:00Z" as "25 November 2026", in the user's own time zone.
function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )
}

// The calendar integration: a private link that calendar apps subscribe to.
export function CalendarFeedCard() {
  // undefined while loading, null when there is no feed.
  const [createdAt, setCreatedAt] = useState<string | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  // The link, only after it was created on this visit. It cannot be fetched again.
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  // Turning off takes two clicks, so a slip cannot break a subscribed calendar.
  const [confirmingOff, setConfirmingOff] = useState(false)
  const [copied, setCopied] = useState(false)
  // A ref changes immediately, so a fast double click cannot send twice.
  const busyRef = useRef(false)

  useEffect(() => {
    let ignore = false
    getCalendarFeedCreatedAt()
      .then((result) => {
        if (!ignore) setCreatedAt(result)
      })
      .catch((error: Error) => {
        if (!ignore) setLoadError(error.message)
      })
    return () => {
      ignore = true
    }
  }, [])

  // Runs one action with the buttons disabled, and shows its error as a toast.
  async function run(action: () => Promise<void>) {
    if (busyRef.current) return
    busyRef.current = true
    setIsBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      busyRef.current = false
      setIsBusy(false)
    }
  }

  function handleCreate() {
    const isReplacing = createdAt !== null
    run(async () => {
      const url = await createCalendarFeed()
      setFeedUrl(url)
      setCreatedAt(new Date().toISOString())
      setConfirmingOff(false)
      toast.success(
        isReplacing ? 'New link created. The old one no longer works.' : 'Calendar link created.',
      )
    })
  }

  function handleTurnOff() {
    run(async () => {
      await deleteCalendarFeed()
      setFeedUrl(null)
      setCreatedAt(null)
      setConfirmingOff(false)
      toast.success('Calendar link turned off.')
    })
  }

  async function handleCopy() {
    if (!feedUrl) return
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked; the link is still selectable in the box.
      toast.error('Could not copy. Select the link and copy it instead.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>
          Show your open action items on their due dates in Google Calendar, Apple Calendar or
          Outlook. Items without a due date and items from archived meetings are left out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError ? (
          <p role="alert" className="text-sm text-destructive">
            {loadError}
          </p>
        ) : createdAt === undefined ? (
          <Loader label="Loading your calendar settings" />
        ) : (
          <>
            {feedUrl && (
              // Shown once, straight after creating: the database only keeps a hash.
              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                <label htmlFor="calendar-feed-url" className="text-sm font-medium">
                  Your private calendar link
                </label>
                <div className="flex gap-2">
                  <Input
                    id="calendar-feed-url"
                    readOnly
                    value={feedUrl}
                    // Selects the whole link on click, ready to copy by hand.
                    onFocus={(event) => event.target.select()}
                    className="bg-white font-mono text-xs"
                  />
                  <Button type="button" variant="outline" className="bg-white" onClick={handleCopy}>
                    {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy it now: for your security, Knots only shows it once. Anyone with this link
                  can see these action items, so keep it private.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="bg-white">
                    <a href={googleCalendarUrl(feedUrl)} target="_blank" rel="noreferrer">
                      Add to Google Calendar
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="bg-white">
                    <a href={webcalUrl(feedUrl)}>Add to Apple Calendar or Outlook</a>
                  </Button>
                </div>
              </div>
            )}

            {createdAt === null ? (
              <Button type="button" onClick={handleCreate} disabled={isBusy}>
                <CalendarPlusIcon aria-hidden="true" />
                {isBusy ? 'Creating…' : 'Create calendar link'}
              </Button>
            ) : (
              <div className="space-y-3">
                {!feedUrl && (
                  <p className="text-sm">
                    Your calendar link was created on {formatCreatedAt(createdAt)}. It is only shown
                    once. If you lost it, create a new one.
                  </p>
                )}
                {confirmingOff ? (
                  <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
                    <span>Calendars using this link will stop updating.</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleTurnOff}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Turning off…' : 'Turn off'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmingOff(false)}
                      disabled={isBusy}
                    >
                      Keep it
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={handleCreate} disabled={isBusy}>
                      {isBusy ? 'Creating…' : 'Create a new link'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmingOff(true)}
                      disabled={isBusy}
                    >
                      Turn off
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  A new link replaces this one straight away, so the old link stops working.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
