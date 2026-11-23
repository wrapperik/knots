import { useEffect, useState } from 'react'
import { ArrowRightIcon, HistoryIcon } from 'lucide-react'

import { Loader } from '@/components/loader'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/hooks/use-auth'
import {
  describeEntry,
  fieldName,
  formatDayHeading,
  formatFieldValue,
  formatTime,
  getHistory,
  isLongField,
  type FieldChange,
  type HistoryEntry,
} from '@/lib/history'
import { cn } from '@/lib/utils'

type HistorySheetProps = {
  meetingId: string
  // How many entries exist. A new edit changes it, which reloads an open panel.
  count: number
}

// The History button and the panel it opens from the right.
export function HistorySheet({ meetingId, count }: HistorySheetProps) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const { session } = useAuth()

  // Loads only when the panel is open: most visits never need the history.
  useEffect(() => {
    if (!open) return
    let ignore = false
    getHistory(meetingId)
      .then((result) => {
        if (ignore) return
        setEntries(result)
        setLoadError(null)
      })
      .catch((error: Error) => {
        if (!ignore) setLoadError(error.message)
      })
    return () => {
      ignore = true
    }
  }, [open, meetingId, count, reloadKey])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/80">
          <HistoryIcon />
          History
          <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
            {count}
            <span className="sr-only"> changes</span>
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Edit history</SheetTitle>
          <SheetDescription>
            Every change to this meeting's summary, decisions and action items, newest first. The
            AI's first results are where it starts.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {loadError ? (
            <div role="alert" className="space-y-3 py-6 text-center">
              <p className="text-sm">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
                Try again
              </Button>
            </div>
          ) : entries === null ? (
            <div className="flex justify-center py-10">
              <Loader className="text-[10px]" label="Loading the history" />
            </div>
          ) : (
            <ol className="space-y-2">
              {groupByDay(entries).map((group) => (
                <li key={group.day}>
                  {/* Sticky, so the day stays visible while scrolling through it. */}
                  <h3
                    className={cn(
                      'sticky top-0 z-10 bg-background py-3',
                      'text-xs font-medium text-muted-foreground',
                    )}
                  >
                    {group.day}
                  </h3>
                  <ol className="ml-1 space-y-5 border-l pl-5">
                    {group.entries.map((entry) => (
                      <TimelineEntry
                        key={entry.id}
                        entry={entry}
                        actor={entry.changedBy === session?.user.id ? 'You' : 'Someone else'}
                      />
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TimelineEntry({ entry, actor }: { entry: HistoryEntry; actor: string }) {
  // A text change already shows the old and new wording, so the label would repeat it.
  const showLabel =
    entry.entityType !== 'summary' &&
    !entry.changes.some((change) => change.field === 'description')

  return (
    <li className="relative">
      {/* The dot on the timeline line. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1.5 -left-[25px] size-2.5 rounded-full',
          'border-2 border-background bg-primary',
        )}
      />
      <p className="text-sm font-medium">{describeEntry(entry)}</p>
      <p className="text-xs text-muted-foreground">
        {actor} · <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
      </p>
      {showLabel && <p className="mt-1 text-sm">“{entry.label}”</p>}
      {entry.changes.length > 0 && (
        <dl className="mt-2 space-y-2">
          {entry.changes.map((change) => (
            <ChangeDetail key={change.field} change={change} />
          ))}
        </dl>
      )}
    </li>
  )
}

// One changed field. Long text shows the previous and new version as blocks;
// short values show "old → new" on one line.
function ChangeDetail({ change }: { change: FieldChange }) {
  const from = formatFieldValue(change.field, change.from)
  const to = formatFieldValue(change.field, change.to)

  if (isLongField(change.field)) {
    return (
      <div className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{fieldName(change.field)}</dt>
        <dd className="space-y-1 text-sm">
          <p className="rounded-md bg-muted px-2 py-1.5 whitespace-pre-line text-muted-foreground">
            <span className="block text-[11px] font-medium uppercase">Before</span>
            {from}
          </p>
          <p
            className={cn(
              'rounded-md bg-white px-2 py-1.5',
              'whitespace-pre-line',
            )}
          >
            <span className="block text-[11px] font-medium text-muted-foreground uppercase">
              After
            </span>
            {to}
          </p>
        </dd>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <dt className="text-xs font-medium text-muted-foreground">{fieldName(change.field)}</dt>
      <dd className="flex flex-wrap items-center gap-1.5">
        <del className="text-muted-foreground">{from}</del>
        <ArrowRightIcon className="size-3 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">changed to</span>
        <span>{to}</span>
      </dd>
    </div>
  )
}

// Splits the entries (already newest first) into one group per day.
function groupByDay(entries: HistoryEntry[]): { day: string; entries: HistoryEntry[] }[] {
  const groups: { day: string; entries: HistoryEntry[] }[] = []
  for (const entry of entries) {
    const day = formatDayHeading(entry.createdAt)
    const last = groups.at(-1)
    if (last?.day === day) last.entries.push(entry)
    else groups.push({ day, entries: [entry] })
  }
  return groups
}
