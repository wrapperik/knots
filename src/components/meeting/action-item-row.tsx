import { useEffect, useRef, useState } from 'react'
import { CircleCheckIcon, CircleDotIcon, CircleIcon, PencilIcon } from 'lucide-react'
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
import { deleteActionItem, setActionItemStatus, updateActionItem } from '@/lib/meeting-edits'
import { todayIsoDate } from '@/lib/meeting-validation'
import { formatMeetingDate, type ActionItem, type ActionItemStatus } from '@/lib/meetings'
import { cn } from '@/lib/utils'

// Label, icon and icon colour for each status.
type StatusStyle = { text: string; icon: typeof CircleIcon; className: string }

const STATUS_STYLES: Record<ActionItemStatus, StatusStyle> = {
  todo: { text: 'To do', icon: CircleIcon, className: 'text-muted-foreground' },
  in_progress: { text: 'In progress', icon: CircleDotIcon, className: 'text-warning' },
  done: { text: 'Done', icon: CircleCheckIcon, className: 'text-success' },
}

type ActionItemRowProps = {
  item: ActionItem
  // Called after any change, so the page reloads the meeting.
  onChanged: () => void
}

// One action item: tick it off with the circle, or edit it with the pencil.
export function ActionItemRow({ item, onChanged }: ActionItemRowProps) {
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

  async function handleToggle() {
    const previous = item.status
    const next: ActionItemStatus = previous === 'done' ? 'todo' : 'done'
    setIsToggling(true)
    try {
      await setActionItemStatus(item.id, next)
      toast.success(next === 'done' ? 'Ticked off' : 'Moved back to to do', {
        description: item.description,
        // Longer than the default 4 seconds, so there is time to reach Undo.
        duration: 8000,
        // Ticking the wrong item is an easy slip, so the toast offers a way back.
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
  const isOverdue = !isDone && item.dueDate !== null && item.dueDate < todayIsoDate()

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
        <ItemDescription className="text-xs">
          {status.text} · {item.owner ?? 'No owner'} ·{' '}
          <span className={cn(isOverdue && 'font-medium text-destructive')}>
            {item.dueDate ? formatMeetingDate(item.dueDate) : 'No due date'}
            {isOverdue && ' (overdue)'}
          </span>
          {item.editedAt && ' · Edited'}
        </ItemDescription>
        {item.needsReview && <p className="text-xs font-medium text-warning">Needs review</p>}
      </ItemContent>
      <ItemActions>
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
