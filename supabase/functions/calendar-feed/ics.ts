// Builds an iCalendar (.ics) file: the plain-text format every calendar app
// reads. The rules come from RFC 5545: lines end in CRLF, long lines are folded,
// and some characters in text must be escaped.

export type FeedItem = {
    id: string
    description: string
    owner: string | null
    due_date: string // "2026-11-28"
    status: string
    meeting_title: string
    updated_at: string // ISO timestamp
}

const STATUS_LABELS: Record<string, string> = {
    todo: 'To do',
    in_progress: 'In progress',
}

// Backslashes, semicolons, commas and line breaks have a meaning in .ics text,
// so they are escaped. Backslash first, so the others are not escaped twice.
function escapeText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n')
}

// Lines may be at most 75 bytes. A longer line continues on the next line,
// which starts with a space. Bytes, not characters, are counted, and a
// character is never split, so names like "Zoë" stay intact.
function foldLine(line: string): string {
    const encoder = new TextEncoder()
    const parts: string[] = []
    let current = ''
    let currentBytes = 0
    for (const char of line) {
        const charBytes = encoder.encode(char).length
        // The first line has 75 bytes; later ones lose one to the leading space.
        const limit = parts.length === 0 ? 75 : 74
        if (currentBytes + charBytes > limit) {
            parts.push(current)
            current = ''
            currentBytes = 0
        }
        current += char
        currentBytes += charBytes
    }
    parts.push(current)
    return parts.join('\r\n ')
}

// "2026-11-28" becomes "20261128".
function icsDate(isoDate: string): string {
    return isoDate.replaceAll('-', '')
}

// The day after a date, as .ics wants for the end of an all-day event.
// Worked out in UTC so a time zone change cannot shift the day.
function nextDay(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
}

// "2026-11-25T09:30:00.123Z" becomes "20261125T093000Z".
function icsTimestamp(iso: string): string {
    return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// One all-day event per action item, on its due date.
function itemToEvent(item: FeedItem): string[] {
    const details = [
        `Owner: ${item.owner ?? 'No owner'}`,
        `Status: ${STATUS_LABELS[item.status] ?? item.status}`,
        `From the meeting: ${item.meeting_title}`,
    ].join('\n')

    return [
        'BEGIN:VEVENT',
        // The same id every time, so calendar apps update the event rather than
        // adding a copy when the feed is fetched again.
        `UID:${item.id}@knots`,
        `DTSTAMP:${icsTimestamp(item.updated_at)}`,
        `DTSTART;VALUE=DATE:${icsDate(item.due_date)}`,
        `DTEND;VALUE=DATE:${icsDate(nextDay(item.due_date))}`,
        `SUMMARY:${escapeText(item.description)}`,
        `DESCRIPTION:${escapeText(details)}`,
        // Shows as free time, so a due date does not block the day.
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
    ]
}

export function buildCalendar(items: FeedItem[]): string {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Knots//Action items//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Knots action items',
        // Asks calendar apps to fetch again every hour. Google sets its own pace.
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        'X-PUBLISHED-TTL:PT1H',
        ...items.flatMap(itemToEvent),
        'END:VCALENDAR',
    ]
    return lines.map(foldLine).join('\r\n') + '\r\n'
}
