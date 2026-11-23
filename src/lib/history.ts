import { formatMeetingDate } from '@/lib/meetings'
import { supabase } from '@/lib/supabase'

export type HistoryEntityType = 'summary' | 'decision' | 'action_item'
export type HistoryAction = 'created' | 'updated' | 'deleted'

// One field that changed, with its old and new value as stored in the database.
export type FieldChange = {
  field: string
  from: string | null
  to: string | null
}

export type HistoryEntry = {
  id: string
  entityType: HistoryEntityType
  action: HistoryAction
  label: string // What the item said at the time.
  changes: FieldChange[]
  changedBy: string | null
  createdAt: string
}

// The meeting's history, newest first. RLS limits it to the owner's meetings.
export async function getHistory(meetingId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('edit_history')
    .select('id, entity_type, action, label, changes, changed_by, created_at')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: false })
  if (error) throw new Error('Could not load the history. Check your connection and try again.')

  return data.map((row) => ({
    id: row.id,
    // The check constraints only allow these values.
    entityType: row.entity_type as HistoryEntityType,
    action: row.action as HistoryAction,
    label: row.label,
    // changes is {"owner": {"from": …, "to": …}}; a list is easier to render.
    changes: Object.entries(
      (row.changes ?? {}) as Record<string, { from: unknown; to: unknown }>,
    ).map(([field, change]) => ({
      field,
      from: change.from === null ? null : String(change.from),
      to: change.to === null ? null : String(change.to),
    })),
    changedBy: row.changed_by,
    createdAt: row.created_at,
  }))
}

const ENTITY_NAMES: Record<HistoryEntityType, string> = {
  summary: 'summary',
  decision: 'decision',
  action_item: 'action item',
}

const FIELD_NAMES: Record<string, string> = {
  summary: 'Summary',
  description: 'Text',
  owner: 'Owner',
  due_date: 'Due date',
  status: 'Status',
}

const STATUS_NAMES: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

// A one-line description of the entry, e.g. "Changed the action item".
export function describeEntry(entry: HistoryEntry): string {
  const name = ENTITY_NAMES[entry.entityType]
  if (entry.action === 'created') return `Added ${name}`
  if (entry.action === 'deleted') return `Deleted ${name}`
  // A status change on its own reads better as what happened.
  if (entry.changes.length === 1 && entry.changes[0].field === 'status') {
    const to = entry.changes[0].to
    if (to === 'done') return 'Ticked off action item'
    if (to === 'in_progress') return 'Started action item'
    return 'Reopened action item'
  }
  return `Edited ${name}`
}

export function fieldName(field: string): string {
  return FIELD_NAMES[field] ?? field
}

// A field's value as people read it: dates and statuses in words, empty as "None".
export function formatFieldValue(field: string, value: string | null): string {
  if (value === null || value === '') return 'None'
  if (field === 'due_date') return formatMeetingDate(value)
  if (field === 'status') return STATUS_NAMES[value] ?? value
  return value
}

// Long text (a summary or a description) is shown as before and after blocks
// instead of on one line.
export function isLongField(field: string): boolean {
  return field === 'summary' || field === 'description'
}

// "Today", "Yesterday" or "20 November 2026", for grouping the timeline by day.
export function formatDayHeading(timestamp: string): string {
  const day = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (day.toDateString() === today.toDateString()) return 'Today'
  if (day.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(day)
}

// "14:32", in 24-hour time.
export function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(timestamp),
  )
}
