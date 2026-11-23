import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { ActionItemForm } from '@/components/meeting/action-item-form'
import { Button } from '@/components/ui/button'
import { createActionItem } from '@/lib/meeting-edits'

type AddActionItemProps = {
  meetingId: string
  // Where the new item goes: after the last one.
  nextPosition: number
  onChanged: () => void
}

const EMPTY_ITEM = { description: '', owner: null, dueDate: null, status: 'todo' } as const

// A button under the action items that opens an empty form.
export function AddActionItem({ meetingId, nextPosition, onChanged }: AddActionItemProps) {
  const [isAdding, setIsAdding] = useState(false)

  if (!isAdding) {
    return (
      <Button
        size="sm"
        onClick={() => setIsAdding(true)}
        className="text-black bg-white/60 hover:text-white"
      >
        <PlusIcon />
        Add action item
      </Button>
    )
  }

  return (
    <ActionItemForm
      initialValues={EMPTY_ITEM}
      submitLabel="Add"
      onCancel={() => setIsAdding(false)}
      onSave={async (fields) => {
        await createActionItem(meetingId, fields, nextPosition)
        toast.success('Action item added')
        setIsAdding(false)
        onChanged()
      }}
    />
  )
}
