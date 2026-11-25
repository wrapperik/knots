import { createClient } from '@supabase/supabase-js'

import { buildCalendar, type FeedItem } from './ics.ts'

// A private calendar feed, at /functions/v1/calendar-feed/<token>.ics.
//
// Calendar apps cannot log in, so this function does not check for a login
// (verify_jwt = false in supabase/config.toml). The secret token in the address
// is the key instead. The function uses the public anon key, not the secret
// service key: the calendar_feed_items database function turns the token into
// a user and returns only that user's items.

// 32 random bytes written as hex, as create_calendar_feed makes them.
const TOKEN_PATTERN = /^[0-9a-f]{64}$/

function textReply(status: number, body: string) {
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}

Deno.serve(async (req) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return textReply(405, 'Use GET.')

    // The last part of the path, without ".ics". The path is used rather than
    // ?token=, because some calendar apps only accept links ending in .ics.
    const lastSegment = new URL(req.url).pathname.split('/').pop() ?? ''
    const token = lastSegment.replace(/\.ics$/, '')
    // Anything that is not a well-formed token is refused before the database is asked.
    if (!TOKEN_PATTERN.test(token)) return textReply(404, 'Calendar not found.')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data, error } = await supabase.rpc('calendar_feed_items', { p_token: token })
    if (error) {
        console.error('calendar_feed_items failed', error)
        return textReply(500, 'The calendar could not be loaded. Try again later.')
    }

    // An unknown or revoked token gives an empty calendar, the same as a user
    // with nothing due. Nothing in the reply says whether the token was real.
    return new Response(buildCalendar(data as FeedItem[]), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="knots-action-items.ics"',
            // Never cached, so a link that is turned off or replaced stops
            // working at once, and no shared cache keeps personal data.
            'Cache-Control': 'no-store',
            // The token is in the address, so it must not leak to other sites.
            'Referrer-Policy': 'no-referrer',
        },
    })
})
