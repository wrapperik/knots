import { AlertCircle, CalendarDays, CircleCheck, ListChecks, type LucideIcon } from 'lucide-react'

import type { Meeting } from '@/lib/meetings'
import { cn } from '@/lib/utils'

type Stat = {
  label: string
  value: number
  icon: LucideIcon
  // Shows the card in the brand orange as the page's key number.
  isHighlight?: boolean
  // Highlights the card when the value needs the user's attention.
  isWarning?: boolean
}

type MeetingStatsProps = {
  meetings: Meeting[]
}

// Works out the four headline numbers from the meetings list.
function getStats(meetings: Meeting[]): Stat[] {
  const openActionItems = meetings.reduce((total, meeting) => total + meeting.openActionItems, 0)
  const analysed = meetings.filter((meeting) => meeting.status === 'done').length
  const needsRetry = meetings.filter((meeting) => meeting.status === 'failed').length

  return [
    { label: 'Meetings', value: meetings.length, icon: CalendarDays },
    { label: 'Open action items', value: openActionItems, icon: ListChecks, isHighlight: true },
    { label: 'Analysed', value: analysed, icon: CircleCheck },
    { label: 'Needs retry', value: needsRetry, icon: AlertCircle, isWarning: needsRetry > 0 },
  ]
}

export function MeetingStats({ meetings }: MeetingStatsProps) {
  const stats = getStats(meetings)

  return (
    // A description list: each card is a label (dt) paired with a value (dd).
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'space-y-2 rounded-xl border bg-card p-4',
            stat.isHighlight && 'border-primary bg-primary text-primary-foreground',
          )}
        >
          <dt
            className={cn(
              'flex items-center gap-2 text-sm text-muted-foreground',
              stat.isHighlight && 'font-medium text-primary-foreground',
            )}
          >
            <stat.icon
              className={cn('size-4 shrink-0', stat.isWarning && 'text-destructive')}
              aria-hidden="true"
            />
            {stat.label}
          </dt>
          <dd className={cn('font-heading text-3xl', stat.isWarning && 'text-destructive')}>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
