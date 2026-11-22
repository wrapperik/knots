import { CalendarDays } from 'lucide-react'

import { formatMeetingDate, formatStartTime, type Meeting, type MeetingStatus } from '@/lib/meetings'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Text and dot colour for each status. A Record makes TypeScript complain if a
// status is ever added without a label here.
const STATUS_LABELS: Record<MeetingStatus, { text: string; dotClassName: string }> = {
    pending: { text: 'Waiting', dotClassName: 'bg-muted-foreground' },
    processing: { text: 'Analysing', dotClassName: 'bg-warning' },
    done: { text: 'Analysed', dotClassName: 'bg-success' },
    failed: { text: 'Needs retry', dotClassName: 'bg-destructive' },
}

type RecentMeetingsProps = {
    meetings: Meeting[]
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
    return (
        <section aria-labelledby="recent-meetings-heading" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
            <h2 id="recent-meetings-heading" className="text-2xl">
                Recent meetings
            </h2>
            <Input type="search"
            placeholder="Search meetings"
            aria-label="Search meetings"
            className="max-w-xs"/>
            </div>
            {meetings.length === 0 ? (
                // Empty state: no meetings yet.
                <p className="text-muted-foreground">None, upload to get started.</p>
            ) : (
            <ul className="space-y-2">
                {meetings.map((meeting) => {
                    const status = STATUS_LABELS[meeting.status]
                    return (
                        <li key={meeting.id}>
                            <a
                                href={`/meetings/${meeting.id}`}
                                className={cn(
                                    'flex items-center gap-4 border-b p-4 transition-colors outline-none',
                                    'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                                )}
                            >
                                <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />

                                {/* Stacked on small screens, side by side from sm up. */}
                               <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                                        <p className="truncate font-medium sm:w-72">{meeting.title}</p>
                                        <p className="text-sm text-muted-foreground sm:flex-1">
                                        {/* Joins only the parts that exist, e.g. "18 November 2026 · 09:30 · 4 open items". */}
                                        {[
                                            formatMeetingDate(meeting.meetingDate),
                                            formatStartTime(meeting.startTime),
                                            meeting.openActionItems > 0 &&
                                                `${meeting.openActionItems} open ${meeting.openActionItems === 1 ? 'item' : 'items'}`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>

                                {/* Fixed width, so every row's date starts at the same point. The dot is
                                    decorative; the text carries the status. */}
                                <span className="flex w-28 shrink-0 items-center gap-2 text-sm">
                                    <span className={cn('size-2 rounded-full', status.dotClassName)} aria-hidden="true" />
                                    {status.text}
                                </span>
                            </a>
                        </li>
                    )
                })}
            </ul>
            )}
        </section>
    )
}
