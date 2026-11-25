import { supabase } from '@/lib/supabase'

// The feed is served by the calendar-feed Edge Function, on the same Supabase
// project as the rest of the app.
const FEED_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-feed`

// The address calendar apps subscribe to. The token is the only key, so this
// address is secret.
export function calendarFeedUrl(token: string): string {
    return `${FEED_BASE}/${token}.ics`
}

// webcal:// asks the computer to open its calendar app and subscribe, rather
// than download the file once.
export function webcalUrl(feedUrl: string): string {
    return feedUrl.replace(/^https?:/, 'webcal:')
}

// Google Calendar's "add by URL" page, with the feed filled in. Google fetches
// the feed from its own servers, so it only works once the app is deployed.
export function googleCalendarUrl(feedUrl: string): string {
    return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl(feedUrl))}`
}

// When the user's feed was created, or null if they have none. Only the date
// can be read back: the database keeps a hash of the token, not the token.
export async function getCalendarFeedCreatedAt(): Promise<string | null> {
    const { data, error } = await supabase.from('calendar_feeds').select('created_at').maybeSingle()
    if (error) throw new Error('Could not load your calendar settings. Try again.')
    return data?.created_at ?? null
}

// Creates the feed, or replaces it so the old link stops working, and returns
// the new address. This is the only time the address can be shown.
export async function createCalendarFeed(): Promise<string> {
    const { data, error } = await supabase.rpc('create_calendar_feed')
    if (error || !data) throw new Error('Could not create a calendar link. Try again.')
    return calendarFeedUrl(data)
}

// Turns the feed off. Calendars subscribed to it stop getting updates.
export async function deleteCalendarFeed(): Promise<void> {
    const { error } = await supabase.rpc('delete_calendar_feed')
    if (error) throw new Error('Could not turn off the calendar link. Try again.')
}
