import { cn } from '@/lib/utils'

// Decorative background for the login and sign-up pages: a table of cells with
// different widths and heights, thin dividers in the page colour, greyscale
// photos in some cells and a grain texture over everything.
//
// Each row is a flex row, so every row can split its width differently. Most
// cells use grow: a share of the row compared with their neighbours. A few use
// width instead: a fixed CSS width, for edges that must land in an exact place.

// Half the login card's width (max-w-sm, 24rem). The card is centred, so
// calc(50% - CARD_HALF) is its left edge at any screen width.
const CARD_HALF = '12rem'

type Cell = {
  // Either a share of the leftover space, or a fixed CSS width.
  grow?: number
  width?: string
  photo?: string
  // Which part of the photo stays in view when the cell crops it. CSS
  // object-position, e.g. "right" keeps the right-hand side.
  position?: string
  // A short line of faint heading text in an empty cell.
  tagline?: string
}
type Row = { grow: number; cells: Cell[] }

const ROWS: Row[] = [
  {
    grow: 1,
    cells: [
      { width: '12%' },
      // Ends 5rem past the card's left edge (50% - CARD_HALF + 5rem), so the
      // photo runs behind the form. "center 20%" keeps the face in view when
      // the wide, short cell crops the photo.
      { width: `calc(38% - ${CARD_HALF} + 5rem)`, photo: 'cafe-call', position: 'center 20%' },
      { grow: 1.8, tagline: 'No loose threads.' },
      { grow: 1 },
      // Fixed at 1.6 of 5.5 of the row, so it starts where the photo in the
      // middle row ends and their corners keep meeting.
      { width: 'calc(100% * 1.6 / 5.5)', photo: 'meeting-room' },
    ],
  },
  {
    grow: 1.3,
    cells: [
      { grow: 1.6, photo: 'kitchen-call' },
      { grow: 1 },
      { grow: 0.5 },
      // Starts under the card, so it runs a little behind the form, and ends
      // 3.9 of 5.5 across the row, where the photo above-right begins, so
      // their corners meet. "right" keeps the person in view.
      { grow: 0.8, photo: 'desk-smile', position: 'right' },
      { grow: 1.6, tagline: 'Every decision, knotted down.' },
    ],
  },
  {
    grow: 1,
    cells: [
      { grow: 1, tagline: 'Never lose the thread again.' },
      { grow: 1.6, photo: 'office-laptop' },
      { grow: 1.1 },
      { grow: 1.8, photo: 'team-desks' },
    ],
  },
]

export function PhotoGridBackground() {
  return (
    // aria-hidden: decoration only, so screen readers skip it.
    // The dividers are solid 1px borders in the page colour, under every row
    // and right of every cell except the last.
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col">
      {ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          // Checked by index, not not-last:, because the grain layer below is
          // the real last child of this container.
          className={cn(
            'flex min-h-0 border-background',
            rowIndex < ROWS.length - 1 && 'border-b',
          )}
          style={{ flex: `${row.grow} 1 0` }}
        >
          {row.cells.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              className="relative min-w-0 overflow-hidden border-background bg-foreground/[0.04] not-last:border-r"
              // A fixed width does not grow or shrink; a share grows to fill.
              style={{ flex: cell.width ? `0 0 ${cell.width}` : `${cell.grow ?? 1} 1 0` }}
            >
              {cell.tagline && (
                // Faint, so it reads as part of the background, not as content
                // to act on. Hidden on small screens, like the photos. The
                // whole grid is aria-hidden, so screen readers skip it too.
                <p className="font-heading absolute top-0 left-0 hidden max-w-[14ch] p-6 text-2xl leading-tight font-semibold text-foreground/20 md:block lg:text-3xl">
                  {cell.tagline}
                </p>
              )}
              {cell.photo && (
                // Hidden on small screens, where the card covers almost all of
                // the page. The files are already greyscale and cropped near
                // the person, so object-cover keeps them in view in any cell.
                <img
                  src={`/auth/${cell.photo}.webp`}
                  alt=""
                  loading="lazy"
                  style={{ objectPosition: cell.position }}
                  className="hidden size-full object-cover opacity-90 md:block"
                />
              )}

            </div>
          ))}
        </div>
      ))}
      {/* Film grain over the whole table. */}
      <div className="grain absolute inset-0" />
    </div>
  )
}
