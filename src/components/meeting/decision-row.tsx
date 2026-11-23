import { useEffect, useRef, useState } from 'react'
import { GavelIcon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'

import { TextEditForm } from '@/components/meeting/text-edit-form'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { MAX_DESCRIPTION_LENGTH, updateDecision } from '@/lib/meeting-edits'
import type { Decision } from '@/lib/meetings'

type DecisionRowProps = {
  decision: Decision
  onChanged: () => void
}

// One decision, with a pencil to edit its text in place.
export function DecisionRow({ decision, onChanged }: DecisionRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  // After the form closes, focus goes back to the pencil.
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

  if (isEditing) {
    return (
      <div role="listitem" className="rounded-lg border bg-white p-3 shadow-sm">
        <TextEditForm
          label="Decision"
          initialValue={decision.description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={2}
          onCancel={closeForm}
          onSave={async (description) => {
            await updateDecision(decision.id, description)
            toast.success('Decision saved')
            closeForm()
            onChanged()
          }}
        />
      </div>
    )
  }

  return (
    <Item role="listitem" variant="outline" size="xs" className="bg-white/95">
      <ItemMedia>
        <GavelIcon className="size-4 text-primary" aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{decision.description}</ItemTitle>
        {decision.editedAt && <ItemDescription className="text-xs">Edited</ItemDescription>}
      </ItemContent>
      <ItemActions>
        <Button
          ref={editButtonRef}
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit decision “${decision.description}”`}
          className="text-muted-foreground"
        >
          <PencilIcon />
        </Button>
      </ItemActions>
    </Item>
  )
}
