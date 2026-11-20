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
                                    'flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors outline-none',
                                    'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                                )}
                            >
                                <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{meeting.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatMeetingDate(meeting.meetingDate)}
                                        {meeting.openActionItems > 0 && ` · ${meeting.openActionItems} open items`}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
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
