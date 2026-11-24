import { useEffect, useState, type ReactNode } from 'react'
import { ListChecksIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { Loader } from '@/components/loader'
import { ActionItemRow } from '@/components/meeting/action-item-row'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui/item'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DONE_COLUMN_DAYS,
  filterActionItems,
  getBoardActionItems,
  isOverdue,
  listOwners,
  NO_OWNER,
  ownerKey,
  type ActionItemFilters,
  type BoardActionItem,
} from '@/lib/action-items'
import type { ActionItemStatus } from '@/lib/meetings'
import { cn } from '@/lib/utils'

// The owner menu's value for "any owner". Stays out of the address: no owner filter means anyone.
const ANY_OWNER = '__any__'

type Column = { status: ActionItemStatus; title: string; hint?: string; empty: string; className: string }

// The board's columns, left to right. Each item sits in the column of its status.
const COLUMNS: Column[] = [
  { status: 'todo', title: 'To do', empty: 'Nothing waiting to start.', className: 'bg-muted/70' },
  { status: 'in_progress', title: 'In progress', empty: 'Nothing in progress.', className: 'bg-kanban-yellow' },
  {
    status: 'done',
    title: 'Done',
    hint: `Last ${DONE_COLUMN_DAYS} days`,
    empty: `Nothing finished in the last ${DONE_COLUMN_DAYS} days.`,
    className: 'bg-kanban-orange',
  },
]

// Whose items the board shows: the ones assigned to the user, or every item
// in their meetings.
type Scope = 'mine' | 'everyone'

// The filters live in the address (?who=everyone&owner=Priya&overdue=1), so a
// refresh, the back button or a bookmark keeps them.
function readFilters(params: URLSearchParams): ActionItemFilters {
  return {
    owner: params.get('owner') || null,
    overdueOnly: params.get('overdue') === '1',
  }
}

// Mine is the default, so only "everyone" is written to the address.
function readScope(params: URLSearchParams): Scope {
  return params.get('who') === 'everyone' ? 'everyone' : 'mine'
}

// Every action item across the user's meetings, as a board with one column per status.
export function ActionItemsPage() {
  // Null until the first load finishes.
  const [items, setItems] = useState<BoardActionItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Bumping this number runs the effect again, which reloads the items.
  const [reloadKey, setReloadKey] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)
  const scope = readScope(searchParams)
  const { session } = useAuth()

  useEffect(() => {
    // Ignores the result if the page unmounts before the request finishes.
    let ignore = false
    getBoardActionItems()
      .then((result) => {
        if (ignore) return
        setItems(result)
        setLoadError(null)
      })
      .catch((error: Error) => {
        if (!ignore) setLoadError(error.message)
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  function reload() {
    setReloadKey((key) => key + 1)
  }

  // Sets one filter in the address, or removes it when it is back to its default.
  // replace: changing a filter does not add a step to the browser's history.
  function setFilter(name: 'who' | 'owner' | 'overdue', value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next, { replace: true })
  }

  // Clears the owner and overdue filters, but stays on Mine or Everyone.
  function clearFilters() {
    setSearchParams(scope === 'everyone' ? { who: 'everyone' } : {}, { replace: true })
  }

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="font-sans text-lg font-medium">My action items</h1>
      </header>

      {loadError && items === null ? (
        // The first load failed: say so, and offer a retry.
        <main className="flex flex-1 items-center justify-center p-6">
          <div role="alert" className="space-y-4 text-center">
            <p>{loadError}</p>
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          </div>
        </main>
      ) : items === null ? (
        <main className="flex flex-1 items-center justify-center p-6">
          <Loader label="Loading your action items" />
        </main>
      ) : items.length === 0 ? (
        // Nothing open and nothing finished lately, so the board would be three empty columns.
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm space-y-4 text-center">
            <ListChecksIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">No action items yet</p>
            <p className="text-sm text-muted-foreground">
              Action items found in your meetings show here, sorted by status.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Go to meetings</Link>
            </Button>
          </div>
        </main>
      ) : (
        <Board
          items={items}
          userId={session?.user.id ?? null}
          scope={scope}
          filters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          onChanged={reload}
        />
      )}
    </>
  )
}

type BoardProps = {
  items: BoardActionItem[]
  userId: string | null
  scope: Scope
  filters: ActionItemFilters
  onFilterChange: (name: 'who' | 'owner' | 'overdue', value: string | null) => void
  onClearFilters: () => void
  onChanged: () => void
}

// The filter bar and the three columns.
function Board({
  items,
  userId,
  scope,
  filters,
  onFilterChange,
  onClearFilters,
  onChanged,
}: BoardProps) {
  // Mine means assigned to the user. The owner name from the transcript is not
  // used: it is free text and may not match the user's name.
  const mine = items.filter((item) => userId !== null && item.assigneeId === userId)
  const scoped = scope === 'mine' ? mine : items
  // Filtered in the browser: the whole list is already loaded for the owner
  // menu and the counts, so changing a filter is instant and needs no request.
  const visible = filterActionItems(scoped, filters)
  const overdueCount = scoped.filter((item) => isOverdue(item)).length
  const owners = listOwners(scoped)
  // An owner from the address with no items left keeps its option, so the menu
  // still shows what is selected.
  const selectedOwner = filters.owner
  if (
    selectedOwner &&
    selectedOwner !== NO_OWNER &&
    !owners.some((owner) => ownerKey(owner) === ownerKey(selectedOwner))
  ) {
    owners.push(selectedOwner)
  }
  const hasFilters = filters.owner !== null || filters.overdueOnly

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 lg:p-10">
      <div role="group" aria-label="Filter action items" className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="owner-filter" className="text-sm font-medium text-muted-foreground">
            Owner
          </label>
          {/* Radix does not allow an empty value on an item, so "Anyone" has its own. */}
          <Select
            value={filters.owner ?? ANY_OWNER}
            onValueChange={(value) => onFilterChange('owner', value === ANY_OWNER ? null : value)}
          >
            <SelectTrigger id="owner-filter" size="sm" className="min-w-40 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_OWNER}>Anyone</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={ownerKey(owner)} value={owner}>
                  {owner}
                </SelectItem>
              ))}
              <SelectItem value={NO_OWNER}>No owner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div role="group" aria-label="Whose action items" className="flex gap-1">
          <FilterButton pressed={scope === 'mine'} onClick={() => onFilterChange('who', null)}>
            Mine
            <span className="text-xs opacity-75">{mine.length}</span>
          </FilterButton>
          <FilterButton
            pressed={scope === 'everyone'}
            onClick={() => onFilterChange('who', 'everyone')}
          >
            Everyone
            <span className="text-xs opacity-75">{items.length}</span>
          </FilterButton>
        </div>

        <FilterButton
          pressed={filters.overdueOnly}
          onClick={() => onFilterChange('overdue', filters.overdueOnly ? null : '1')}
        >
          Overdue only
          <span className="text-xs opacity-75">{overdueCount}</span>
        </FilterButton>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Read out by screen readers whenever a filter changes the results. */}
      <p aria-live="polite" className="sr-only">
        {hasFilters && `Showing ${visible.length} of ${scoped.length} action items`}
      </p>

      {scope === 'mine' && mine.length === 0 ? (
        // Nothing claimed yet: explain how to claim an item, rather than three empty columns.
        <div className="mx-auto max-w-sm space-y-4 py-10 text-center">
          <ListChecksIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Nothing assigned to you yet</p>
          <p className="text-sm text-muted-foreground">
            Transcripts name people, not Knots accounts, so items start unassigned. Open
            everyone&rsquo;s items and use the assign button on the ones that are yours.
          </p>
          <Button variant="outline" onClick={() => onFilterChange('who', 'everyone')}>
            Show everyone&rsquo;s items
          </Button>
        </div>
      ) : (
        // Stacked on small screens, side by side on large ones.
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.status}
              column={column}
              items={columnItems(visible, column.status)}
              hasFilters={hasFilters}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </main>
  )
}

// The items for one column. Open columns keep the loaded order (soonest due
// first); Done shows the most recently finished first.
function columnItems(items: BoardActionItem[], status: ActionItemStatus): BoardActionItem[] {
  const inColumn = items.filter((item) => item.status === status)
  if (status !== 'done') return inColumn
  return inColumn.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

type BoardColumnProps = {
  column: Column
  items: BoardActionItem[]
  hasFilters: boolean
  onChanged: () => void
}

function BoardColumn({ column, items, hasFilters, onChanged }: BoardColumnProps) {
  const headingId = `column-${column.status}`
  return (
    <section aria-labelledby={headingId} className={cn('space-y-3 rounded-xl p-3', column.className)}>
      <h2 id={headingId} className="flex items-baseline gap-2 px-1 font-medium">
        {column.title}
        <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
        {column.hint && (
          <span className="ml-auto text-xs font-normal text-muted-foreground">{column.hint}</span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {hasFilters ? 'None match the filters.' : column.empty}
        </p>
      ) : (
        <ItemGroup className="gap-2">
          {items.map((item) => (
            <ActionItemRow
              key={item.id}
              item={item}
              meeting={item.meeting}
              layout="card"
              className="rounded-sm shadow-sm p-5 bg-white/90"
              onChanged={onChanged}
            />
          ))}
        </ItemGroup>
      )}
    </section>
  )
}

type FilterButtonProps = {
  pressed: boolean
  onClick: () => void
  children: ReactNode
}

// A toggle button. aria-pressed tells screen readers whether it is on.
// The pressed style is dark ink rather than orange: white on orange is too
// low in contrast for small text.
function FilterButton({ pressed, onClick, children }: FilterButtonProps) {
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
