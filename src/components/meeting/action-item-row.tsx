import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CircleCheckIcon, CircleDotIcon, CircleIcon, PencilIcon } from 'lucide-react'
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
import { deleteActionItem, setActionItemStatus, updateActionItem } from '@/lib/meeting-edits'
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
  // Shows a button that moves the item to the next status, for the board.
  showMoveButton?: boolean
}

// One action item: tick it off with the circle, or edit it with the pencil.
export function ActionItemRow({ item, onChanged, meeting, showMoveButton = false }: ActionItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
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

  return (
    <Item role="listitem" variant="outline" size="xs" className="bg-white/95">
      <ItemMedia>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isToggling}
          aria-label={`Mark “${item.description}” as ${isDone ? 'not done' : 'done'}`}
          className={cn(
            'rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-50',
          )}
        >
          <status.icon className={cn('size-4', status.className)} aria-hidden="true" />
        </button>
      </ItemMedia>
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
        {showMoveButton && move && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => changeStatus(move.to)}
            disabled={isToggling}
            aria-label={`Move “${item.description}” to ${STATUS_STYLES[move.to].text.toLowerCase()}`}
          >
            {move.label}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
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
