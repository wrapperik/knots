// The shape of a meeting as the UI uses it.
export type MeetingStatus = 'pending' | 'processing' | 'done' | 'failed'
export type Meeting = {
    id: string
    title: string
    meetingDate: string // ISO date, e.g. "2026-11-18"
    startTime: string | null // 24-hour time, e.g. "09:30". Null when unknown.
    status: MeetingStatus
    openActionItems: number
}
// Placeholder meetings used until data is loaded from Supabase.
// An empty array shows the centred upload layout.
const SAMPLE_MEETINGS: Meeting[] = [
    {
        id: '1',
        title: 'Weekly product sync',
        meetingDate: '2026-11-18',
        startTime: '09:30',
        status: 'done',
        openActionItems: 4,
    },
    {
        id: '2',
        title: 'Client kick-off: Ridgeway',
        meetingDate: '2026-11-16',
        startTime: '14:00',
        status: 'processing',
        openActionItems: 0,
    },
    {
        id: '3',
        title: 'Design review',
        meetingDate: '2026-11-12',
        startTime: '11:15',
        status: 'failed',
        openActionItems: 0,
    },
]

// Returns the signed-in user's most recent meetings, newest first.
// Async so the Supabase query can replace the placeholder data without
// changing the components that call it.
export async function getRecentMeetings(): Promise<Meeting[]> {
    return SAMPLE_MEETINGS
}

// Format "2026-11-18" as "18 November 2026".
// Adding T00:00:00 makes the browser read it as local time; a bare date is read
// as UTC midnight, which shows as the previous day in time zones behind UTC.
export function formatMeetingDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${isoDate}T00:00:00`))
}

// Format "09:30:00" or "09:30" as "09:30". Postgres time columns include seconds.
export function formatStartTime(time: string | null): string | null {
    return time ? time.slice(0, 5) : null
}
