import { todayIsoDate } from '@/lib/meeting-validation'
import type { ActionItem, ActionItemStatus } from '@/lib/meetings'
import { supabase } from '@/lib/supabase'

// An action item on the board, with the meeting it came from.
export type BoardActionItem = ActionItem & {
  // When it was ticked off. Filled in by a database trigger; null while open.
  completedAt: string | null
  meeting: { id: string; title: string; meetingDate: string }
}

// What the filters on the board can be set to. The columns already split the
// items by status, so status is not a filter here.
export type ActionItemFilters = {
  // null means any owner; NO_OWNER means items without one.
  owner: string | null
  overdueOnly: boolean
}

// Stands for "no owner" in the filter and in the address. Owners are free text,
// so it uses a value no real name is likely to have.
export const NO_OWNER = '__none__'

// How long a finished item stays in the Done column.
export const DONE_COLUMN_DAYS = 7

// The status each column's move button sends an item to. Done is the last
// column, so it has no next step.
export const NEXT_STATUS: Record<Exclude<ActionItemStatus, 'done'>, ActionItemStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
}

// Returns the items for the board, across all of the user's meetings: every open
// item, plus items finished in the last DONE_COLUMN_DAYS days. Row Level Security
// limits the rows to this user, so there is no user_id filter.
// Soonest due date first; items without a due date go last.
export async function getBoardActionItems(): Promise<BoardActionItem[]> {
  const doneSince = new Date(Date.now() - DONE_COLUMN_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('action_items')
    .select(
      'id, description, owner, due_date, status, needs_review, position, edited_at, completed_at, meetings(id, title, meeting_date)',
    )
    // Not done, or done recently. or() takes PostgREST's filter syntax.
    .or(`status.neq.done,completed_at.gte.${doneSince}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error('Could not load your action items. Check your connection and try again.')

  return data.map((row) => ({
    id: row.id,
    description: row.description,
    owner: row.owner,
    dueDate: row.due_date,
    // The check constraint on status only allows these three values.
    status: row.status as ActionItemStatus,
    needsReview: row.needs_review,
    position: row.position,
    editedAt: row.edited_at,
    completedAt: row.completed_at,
    // Every action item belongs to exactly one meeting, so this is one object, not a list.
    meeting: {
      id: row.meetings.id,
      title: row.meetings.title,
      meetingDate: row.meetings.meeting_date,
    },
  }))
}

// Open and due before today. Worked out when needed, never stored, so it is
// always correct for the day the page is viewed.
export function isOverdue(item: Pick<ActionItem, 'status' | 'dueDate'>): boolean {
  return item.status !== 'done' && item.dueDate !== null && item.dueDate < todayIsoDate()
}

// Owner names are compared without case or extra spaces: the AI may write
// "priya" in one meeting and "Priya " in another.
export function ownerKey(owner: string): string {
  return owner.trim().toLowerCase()
}

// The owners to offer in the filter, each once, sorted alphabetically.
// The first spelling found is the one shown.
export function listOwners(items: BoardActionItem[]): string[] {
  const owners = new Map<string, string>()
  for (const item of items) {
    if (item.owner && !owners.has(ownerKey(item.owner))) {
      owners.set(ownerKey(item.owner), item.owner.trim())
    }
  }
  return [...owners.values()].sort((a, b) => a.localeCompare(b, 'en-GB'))
}

// Keeps the items that pass every filter that is set.
export function filterActionItems(
  items: BoardActionItem[],
  filters: ActionItemFilters,
): BoardActionItem[] {
  return items.filter((item) => {
    if (filters.owner === NO_OWNER && item.owner) return false
    if (
      filters.owner &&
      filters.owner !== NO_OWNER &&
      (!item.owner || ownerKey(item.owner) !== ownerKey(filters.owner))
    ) {
      return false
    }
    if (filters.overdueOnly && !isOverdue(item)) return false
    return true
  })
}
