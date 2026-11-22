//Mirror the checks on the meeting table, so mistakes show before saving
//The database enforces the same limits, whatever the browser sends.
export const MAX_TITLE_LENGTH = 200
export const MAX_TRANSCRIPT_LENGTH = 1_000_000

export function validateTitle(title: string): string | undefined {
    if (!title.trim()) return 'Give the meeting a title.'
    if (title.trim().length > MAX_TITLE_LENGTH) {
        return `Keep the title under ${MAX_TITLE_LENGTH} characters.`
    }
}

export function validateMeetingDate(date: string): string | undefined {
    if (!date) return 'Choose the date of the meeting.'
}

export function validateTranscript(transcript: string): string | undefined {
    if (!transcript.trim()) return 'Upload a transcript or paste one in.'
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
        return 'That transcript is too long. Split it into shorter meetings.'
    }
}
// Today as "2026-11-22" in the user's own time zone. toISOString() would use
// UTC, which is yesterday or tomorrow for part of the day in many places.
export function todayIsoDate(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}
// Suggests a title from a file name: "weekly-product_sync.vtt" becomes
// "Weekly product sync".
export function titleFromFileName(fileName: string): string {
    const words = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
}
