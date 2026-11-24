import { useEffect, useRef, useState } from 'react'
import {
  ArrowRightIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  PencilIcon,
  UserIcon,
  UserRoundCheckIcon,
  UserRoundPlusIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { ActionItemForm } from '@/components/meeting/action-item-form'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { isOverdue as checkOverdue, NEXT_STATUS } from '@/lib/action-items'
import { useAuth } from '@/hooks/use-auth'
import {
  deleteActionItem,
  setActionItemAssignee,
  setActionItemStatus,
  updateActionItem,
} from '@/lib/meeting-edits'
import { formatMeetingDate, type ActionItem, type ActionItemStatus } from '@/lib/meetings'
import { cn } from '@/lib/utils'

// Label, icon and icon colour for each status.
type StatusStyle = { text: string; icon: typeof CircleIcon; className: string }

const STATUS_STYLES: Record<ActionItemStatus, StatusStyle> = {
  todo: { text: 'To do', icon: CircleIcon, className: 'text-muted-foreground' },
  in_progress: { text: 'In progress', icon: CircleDotIcon, className: 'text-warning' },
  done: { text: 'Done', icon: CircleCheckIcon, className: 'text-success' },
}

// The toast shown after a status change, by the status the item moved to.
const STATUS_TOASTS: Record<ActionItemStatus, string> = {
  todo: 'Moved back to to do',
  in_progress: 'Moved to in progress',
  done: 'Ticked off',
}

// The move button's label, by the status the item is in now.
const MOVE_LABELS: Record<keyof typeof NEXT_STATUS, string> = {
  todo: 'Start',
  in_progress: 'Done',
}

type ActionItemRowProps = {
  item: ActionItem
  // Called after any change, so the page reloads the meeting.
  onChanged: () => void
  // Shown as a link under the item, on pages that list items from several meetings.
  meeting?: { id: string; title: string }
  // "row" is the compact line on the meeting page. "card" is the board's card,
  // with a button that moves the item to the next status.
  layout?: 'row' | 'card'
  // Extra classes for the card, so each page can style it.
  className?: string
}

// One action item: tick it off with the circle, or edit it with the pencil.
export function ActionItemRow({
  item,
  onChanged,
  meeting,
  layout = 'row',
  className,
}: ActionItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  // Claimed by the logged-in user. The owner name from the transcript plays no
  // part: only the assignee says whose item it is.
  const isMine = userId !== null && item.assigneeId === userId
  const editButtonRef = useRef<HTMLButtonElement>(null)
  // Set when the form closes, so focus goes back to the pencil, not the top of the page.
  const returnFocus = useRef(false)

  useEffect(() => {
    if (!isEditing && returnFocus.current) {
      editButtonRef.current?.focus()
      returnFocus.current = false
    }
  }, [isEditing])

  function closeForm() {
    returnFocus.current = true
    setIsEditing(false)
  }

  // Saves a new status, with a toast that offers Undo.
  async function changeStatus(next: ActionItemStatus) {
    const previous = item.status
    setIsToggling(true)
    try {
      await setActionItemStatus(item.id, next)
      toast.success(STATUS_TOASTS[next], {
        description: item.description,
        // Longer than the default 4 seconds, so there is time to reach Undo.
        duration: 8000,
        // Moving the wrong item is an easy slip, so the toast offers a way back.
        action: {
          label: 'Undo',
          onClick: () =>
            setActionItemStatus(item.id, previous)
              .then(onChanged)
              .catch((error: Error) => toast.error(error.message)),
        },
      })
      onChanged()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsToggling(false)
    }
  }

  // Claims the item for the logged-in user, or gives it back.
  async function toggleAssignee() {
    if (!userId) return
    setIsAssigning(true)
    try {
      await setActionItemAssignee(item.id, isMine ? null : userId)
      toast.success(isMine ? 'Unassigned from you' : 'Assigned to you', {
        description: item.description,
      })
      onChanged()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsAssigning(false)
    }
  }

  // The circle ticks an item off from any status, or reopens a done one.
  function handleToggle() {
    changeStatus(item.status === 'done' ? 'todo' : 'done')
  }

  if (isEditing) {
    return (
      <div role="listitem">
        <ActionItemForm
          initialValues={item}
          submitLabel="Save"
          onCancel={closeForm}
          onSave={async (fields) => {
            await updateActionItem(item.id, fields)
            toast.success('Action item saved')
            closeForm()
            onChanged()
          }}
          onDelete={async () => {
            await deleteActionItem(item.id)
            toast.success('Action item deleted', { description: item.description })
            onChanged()
          }}
        />
      </div>
    )
  }

  const status = STATUS_STYLES[item.status]
  const isDone = item.status === 'done'
  // Open and due before today. Worked out when shown, never stored.
  const isOverdue = checkOverdue(item)
  // Where the move button sends the item, and what it says. Done items have no next step.
  // Checking for 'done' first lets TypeScript know the status is a key of NEXT_STATUS.
  const move =
    item.status === 'done'
      ? null
      : { to: NEXT_STATUS[item.status], label: MOVE_LABELS[item.status] }

  // The tick circle, shared by both layouts.
  const toggleButton = (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      aria-label={`Mark “${item.description}” as ${isDone ? 'not done' : 'done'}`}
      className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <status.icon className={cn('size-4', status.className)} aria-hidden="true" />
    </button>
  )

  // Assign to me, or unassign. aria-pressed tells screen readers which it is;
  // title shows the same words on hover, because the button is only an icon.
  const assignLabel = isMine ? 'Unassign me' : 'Assign to me'
  const assignButton = (size: 'icon-xs' | 'icon-sm') => (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleAssignee}
      disabled={isAssigning}
      aria-pressed={isMine}
      aria-label={`${assignLabel}: “${item.description}”`}
      title={assignLabel}
      className={isMine ? 'text-(--knots-orange)' : 'text-muted-foreground'}
    >
      {isMine ? <UserRoundCheckIcon /> : <UserRoundPlusIcon />}
    </Button>
  )

  if (layout === 'card') {
    // The board's card. The column already shows the status, so the card does
    // not repeat it. Reading order: what to do, who and when, then where it came
    // from and what to do next.
    return (
      <div
        role="listitem"
        className={cn('flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-xs', className)}
      >
        <div className="flex items-start gap-2.5">
          {/* mt-0.5 lines the circle up with the first line of the title. */}
          <span className="mt-0.5 flex">{toggleButton}</span>
          <p
            className={cn(
              'min-w-0 flex-1 text-sm leading-snug font-medium',
              isDone && 'text-muted-foreground line-through',
            )}
          >
            {item.description}
          </p>
        </div>

        {/* Indented to sit under the title, not under the circle. The dt labels
            are for screen readers; sighted users get the icons. */}
        <dl className="flex flex-wrap gap-x-4 gap-y-1.5 pl-6.5 text-xs">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Owner</dt>
            <UserIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <dd className={item.owner ? 'text-foreground' : 'text-muted-foreground'}>
              {item.owner ?? 'No owner'}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Due</dt>
            <CalendarIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {/* Overdue is shown by the pill below, so the date itself stays plain. */}
            <dd className={item.dueDate ? 'text-foreground' : 'text-muted-foreground'}>
              {item.dueDate ? formatMeetingDate(item.dueDate) : 'No due date'}
            </dd>
          </div>
        </dl>

        {(isMine || isOverdue || item.needsReview) && (
          // Pills with dark text on a light fill: coloured text alone is too faint
          // at this size. The dot carries the colour.
          <div className="ml-6.5 flex flex-wrap gap-1.5 text-xs font-medium">
            {isMine && (
              // Neutral grey: it is not a warning, so it stays apart from the red and amber pills.
              <p className="flex items-center gap-1.5 rounded-full bg-foreground/8 px-2 py-0.5">
                <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
                Assigned to you
              </p>
            )}
            {isOverdue && (
              <p className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-0.5">
                <span className="size-1.5 rounded-full bg-destructive" aria-hidden="true" />
                Overdue
              </p>
            )}
            {item.needsReview && (
              <p className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2 py-0.5">
                <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
                Needs review
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-3">
          {meeting ? (
            <Link
              to={`/meetings/${meeting.id}`}
              className="min-w-0 flex-1 truncate text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {meeting.title}
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {assignButton('icon-xs')}
          <Button
            ref={editButtonRef}
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit “${item.description}”`}
            className="text-muted-foreground"
          >
            <PencilIcon />
          </Button>
          {move && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => changeStatus(move.to)}
              disabled={isToggling}
              aria-label={`Move “${item.description}” to ${STATUS_STYLES[move.to].text.toLowerCase()}`}
              // Plain white instead of the page grey that outline buttons use.
              className="bg-white"
            >
              {move.label}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
   <Item role="listitem" variant="outline" size="xs" className={cn('bg-white/95', className)}>
      <ItemMedia>{toggleButton}</ItemMedia>
      <ItemContent>
        <ItemTitle className={cn(isDone && 'text-muted-foreground line-through')}>
          {item.description}
        </ItemTitle>
        {/* line-clamp-none: the overdue warning must never be cut off on narrow screens. */}
        <ItemDescription className="line-clamp-none text-xs">
          {status.text} · {item.owner ?? 'No owner'} ·{' '}
          <span className={cn(isOverdue && 'font-medium text-destructive')}>
            {item.dueDate ? formatMeetingDate(item.dueDate) : 'No due date'}
            {isOverdue && ' (overdue)'}
          </span>
          {isMine && ' · Assigned to you'}
          {item.editedAt && ' · Edited'}
        </ItemDescription>
        {item.needsReview && <p className="text-xs font-medium text-warning">Needs review</p>}
        {meeting && (
          <Link
            to={`/meetings/${meeting.id}`}
            className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {meeting.title}
          </Link>
        )}
      </ItemContent>
      <ItemActions>
        {assignButton('icon-sm')}
        <Button
          ref={editButtonRef}
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit “${item.description}”`}
          className="text-muted-foreground"
        >
          <PencilIcon />
        </Button>
      </ItemActions>
    </Item>
  )
}
