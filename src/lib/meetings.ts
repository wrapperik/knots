import type { PostgrestError } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

// The shape of a meeting as the UI uses it
export type MeetingStatus = 'pending' | 'processing' | 'done' | 'failed'
export type Meeting = {
    id: string
    title: string
    meetingDate: string // ISO date
    startTime: string | null // 24h time (Null when unknown)
    status: MeetingStatus
    openActionItems: number
}

// What the new meeting form sends. The owner is filled in by the DB
export type NewMeeting = {
    title: string
    meetingDate: string
    startTime: string | null
    transcript: string
    source: 'upload' | 'paste'
    fileName: string | null
}

// Returns the signed-in user's most recent meetings, newest first.
// No user_id filter: Row Level Security already limits the rows to this user,
// and later to meetings shared with them.
export async function getRecentMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
        .from('meetings')
        // action_items(count) asks for a count of each meeting's items instead
        // of the items themselves. The transcript is left out on purpose.
        .select('id, title, meeting_date, start_time, analysis_status, action_items(count)')
        // Only count items that are not done.
        .neq('action_items.status', 'done')
        .order('meeting_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)
    if (error) throw new Error(meetingErrorMessage(error))
    // Turn database rows (snake_case) into the shape the UI uses (camelCase).
    return data.map((row) => ({
        id: row.id,
        title: row.title,
        meetingDate: row.meeting_date,
        startTime: row.start_time,
        // The check constraint on analysis_status only allows these four values.
        status: row.analysis_status as MeetingStatus,
        openActionItems: row.action_items[0]?.count ?? 0,
    }))
}

// Saves a new meeting and returns its id. Its analysis status starts as pending.
export async function createMeeting(meeting: NewMeeting): Promise<string> {
    const { data, error } = await supabase
        .from('meetings')
        .insert({
            title: meeting.title.trim(),
            meeting_date: meeting.meetingDate,
            start_time: meeting.startTime,
            transcript: meeting.transcript,
            source: meeting.source,
            file_name: meeting.fileName,
        })
        // Return the new row's id, so the app can open it later.
        .select('id')
        .single()
    if (error) throw new Error(meetingErrorMessage(error))
    return data.id
}

// Turns database errors into plain messages.
function meetingErrorMessage(error: PostgrestError): string {
    switch (error.code) {
        // A check constraint rejected a value, such as an empty title.
        case '23514':
            return 'Something in the form was not accepted. Check the title, date and transcript.'
        // Row Level Security or a column permission blocked the request.
        case '42501':
            return 'You do not have permission to do that. Try logging in again.'
        default:
            return 'Something went wrong. Check your connection and try again.'
    }
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
