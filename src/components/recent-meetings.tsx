import { CalendarDays } from 'lucide-react'

import { formatMeetingDate, type Meeting, type MeetingStatus } from '@/lib/meetings'
import { cn } from '@/lib/utils'

// Text and colour for each status. A Record makes TypeScript complain if a
// status is ever added without a label here.
const STATUS_LABELS: Record<MeetingStatus, { text: string; className: string }> = {
    pending: { text: 'Waiting', className: 'bg-muted text-muted-foreground' },
    processing: { text: 'Analysing', className: 'bg-muted text-foreground' },
    done: { text: 'Analysed', className: 'bg-primary/15 text-foreground' },
    failed: { text: 'Needs retry', className: 'bg-destructive/10 text-destructive' },
}

type RecentMeetingsProps = {
    meetings: Meeting[]
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
    return (
        <section aria-labelledby="recent-meetings-heading" className="space-y-4">
            <h2 id="recent-meetings-heading" className="text-2xl">
                Recent meetings
            </h2>
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
                                        {formatMeetingDate(meeting.meetingDate)}
                                        {meeting.openActionItems > 0 && ` · ${meeting.openActionItems} open items`}
                                    </p>
                                </div>

                                {/* Fixed width, so every row's date starts at the same point. */}
                                <span
                                    className={cn(
                                        'w-24 shrink-0 rounded-full py-0.5 text-center text-xs font-medium',
                                        status.className,
                                    )}
                                >
                                    {status.text}
                                </span>
                            </a>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
