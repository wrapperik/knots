import { useState, type ReactNode } from 'react'
import { Archive, ArchiveRestore, CalendarDays, MoreHorizontal, Pencil, Star } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { EditMeetingDialog } from '@/components/edit-meeting-dialog'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
    formatMeetingDate,
    formatStartTime,
    setMeetingArchived,
    setMeetingStarred,
    type Meeting,
    type MeetingStatus,
} from '@/lib/meetings'
import { cn } from '@/lib/utils'

// Text and dot colour for each status. A Record makes TypeScript complain if a
// status is ever added without a label here.
const STATUS_LABELS: Record<MeetingStatus, { text: string; dotClassName: string }> = {
    pending: { text: 'Waiting', dotClassName: 'bg-muted-foreground' },
    processing: { text: 'Analysing', dotClassName: 'bg-warning' },
    done: { text: 'Analysed', dotClassName: 'bg-success' },
    failed: { text: 'Needs retry', dotClassName: 'bg-destructive' },
}

type View = 'active' | 'starred' | 'archived'

// True when the search text appears in the title or the written-out date, so
// "november" finds every meeting held in November.
function matchesSearch(meeting: Meeting, search: string): boolean {
    const needle = search.trim().toLowerCase()
    if (!needle) return true
    return (
        meeting.title.toLowerCase().includes(needle) ||
        formatMeetingDate(meeting.meetingDate).toLowerCase().includes(needle)
    )
}

type RecentMeetingsProps = {
    // Every meeting, archived ones included.
    meetings: Meeting[]
    // Changes one meeting in the page's list, so the change shows straight away.
    onMeetingChange: (id: string, changes: Partial<Meeting>) => void
    // Loads the list again, for changes that affect the order.
    onReload: () => void
}

export function RecentMeetings({ meetings, onMeetingChange, onReload }: RecentMeetingsProps) {
    const [search, setSearch] = useState('')
    const [view, setView] = useState<View>('active')
    // The meeting in the edit dialog; null when the dialog is closed.
    const [editing, setEditing] = useState<Meeting | null>(null)

    const archivedCount = meetings.filter((meeting) => meeting.archivedAt).length
    // Starred counts only active meetings: an archived meeting stays in Archived.
    const starredCount = meetings.filter((meeting) => meeting.isStarred && !meeting.archivedAt).length
    const visible = meetings
        .filter((meeting) => {
            if (view === 'archived') return Boolean(meeting.archivedAt)
            if (view === 'starred') return meeting.isStarred && !meeting.archivedAt
            return !meeting.archivedAt
        })
        .filter((meeting) => matchesSearch(meeting, search))
        // Starred first. sort() keeps the date order the list arrived in for the
        // rest, so a star that changes here does not need a reload.
        .sort((a, b) => Number(b.isStarred) - Number(a.isStarred))

    // Stars at once, then saves. Puts the old value back if saving fails.
    function toggleStar(meeting: Meeting) {
        onMeetingChange(meeting.id, { isStarred: !meeting.isStarred })
        setMeetingStarred(meeting.id, !meeting.isStarred).catch((error: Error) => {
            onMeetingChange(meeting.id, { isStarred: meeting.isStarred })
            toast.error('Could not change the star', { description: error.message })
        })
    }

    async function archive(meeting: Meeting, isArchived: boolean) {
        try {
            const archivedAt = await setMeetingArchived(meeting.id, isArchived)
            onMeetingChange(meeting.id, { archivedAt })
            if (isArchived) {
                // Undo, so an archive clicked by mistake is one click to reverse.
                toast.success(`“${meeting.title}” archived`, {
                    action: { label: 'Undo', onClick: () => archive(meeting, false) },
                })
            } else {
                toast.success(`“${meeting.title}” restored`)
            }
        } catch (error) {
            toast.error(isArchived ? 'Could not archive the meeting' : 'Could not restore the meeting', {
                description: (error as Error).message,
            })
        }
    }

    function handleSaved() {
        setEditing(null)
        toast.success('Meeting saved.')
        // A new date can move the meeting in the list, so the server sorts it again.
        onReload()
    }

    return (
        <section aria-labelledby="recent-meetings-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="recent-meetings-heading" className="text-2xl">
                    {view === 'archived'
                        ? 'Archived meetings'
                        : view === 'starred'
                          ? 'Starred meetings'
                          : 'Recent meetings'}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                    <div role="group" aria-label="Show meetings" className="flex gap-1">
                        <ViewButton pressed={view === 'active'} onClick={() => setView('active')}>
                            Active
                        </ViewButton>
                        <ViewButton pressed={view === 'starred'} onClick={() => setView('starred')}>
                            Starred{starredCount > 0 && ` (${starredCount})`}
                        </ViewButton>
                        <ViewButton pressed={view === 'archived'} onClick={() => setView('archived')}>
                            Archived{archivedCount > 0 && ` (${archivedCount})`}
                        </ViewButton>
                    </div>
                    <Input
                        type="search"
                        placeholder="Search meetings"
                        aria-label="Search meetings by title or date"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full bg-white sm:w-64"
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                // role="status": screen readers announce it when a search empties the list.
                <p role="status" className="text-muted-foreground">
                    {search.trim()
                        ? `No meetings match “${search.trim()}”.`
                        : view === 'archived'
                          ? 'No archived meetings. Archive a meeting to move it here.'
                          : view === 'starred'
                            ? 'No starred meetings. Star a meeting to keep it here.'
                          : meetings.length === 0
                            ? 'None, upload to get started.'
                            : 'Every meeting is archived. Upload a new one to get started.'}
                </p>
            ) : (
                <ul className="space-y-2">
                    {visible.map((meeting) => (
                        <MeetingRow
                            key={meeting.id}
                            meeting={meeting}
                            onToggleStar={() => toggleStar(meeting)}
                            onEdit={() => setEditing(meeting)}
                            onArchive={() => archive(meeting, !meeting.archivedAt)}
                        />
                    ))}
                </ul>
            )}

            <EditMeetingDialog meeting={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
        </section>
    )
}

type MeetingRowProps = {
    meeting: Meeting
    onToggleStar: () => void
    onEdit: () => void
    onArchive: () => void
}

function MeetingRow({ meeting, onToggleStar, onEdit, onArchive }: MeetingRowProps) {
    const status = STATUS_LABELS[meeting.status]
    // Same test as the Active/Archived filter, so the menu always matches the list it is in.
    const isArchived = Boolean(meeting.archivedAt)

    return (
        // The buttons sit beside the link, not inside it: a button inside a link
        // is invalid HTML, and a click on it would also open the meeting.
        <li className="flex items-center gap-1 border-b pr-2 transition-colors hover:bg-accent">
            <Link
                to={`/meetings/${meeting.id}`}
                className="flex min-w-0 flex-1 items-center gap-4 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />

                {/* Stacked on small screens, side by side from sm up. */}
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                    <p className="truncate font-medium sm:w-72">{meeting.title}</p>
                    <p className="text-sm text-muted-foreground sm:flex-1">
                        {/* Joins only the parts that exist, e.g. "18 November 2026 · 09:30 · 4 open items". */}
                        {[
                            formatMeetingDate(meeting.meetingDate),
                            formatStartTime(meeting.startTime),
                            meeting.openActionItems > 0 &&
                                `${meeting.openActionItems} open ${meeting.openActionItems === 1 ? 'item' : 'items'}`,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                </div>

                {/* Fixed width, so every row's status lines up. The dot is
                    decorative; the text carries the status. */}
                <span className="flex w-28 shrink-0 items-center gap-2 text-sm">
                    <span className={cn('size-2 rounded-full', status.dotClassName)} aria-hidden="true" />
                    {status.text}
                </span>
            </Link>

            {/* aria-pressed tells screen readers whether the star is on. */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-pressed={meeting.isStarred}
                aria-label={`Star “${meeting.title}”`}
                onClick={onToggleStar}
            >
                <Star
                    className={cn(meeting.isStarred && 'fill-(--knots-orange) text-(--knots-orange)')}
                    aria-hidden="true"
                />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`More actions for “${meeting.title}”`}
                    >
                        <MoreHorizontal aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onEdit}>
                        <Pencil aria-hidden="true" />
                        Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onArchive}>
                        {isArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
                        {isArchived ? 'Restore' : 'Archive'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    )
}

type ViewButtonProps = {
    pressed: boolean
    onClick: () => void
    children: ReactNode
}

// A toggle between the active, starred and archived lists. Same look as the filters on
// the action items page.
function ViewButton({ pressed, onClick, children }: ViewButtonProps) {
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background',
                'aria-pressed:hover:bg-foreground/90 aria-pressed:hover:text-background',
            )}
        >
            {children}
        </Button>
    )
}
