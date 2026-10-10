// @vegastack tile-overlay@0.25.9 sha256-YnRf+SP4wjmbhHcckOLL6qZE+edOyzrT7ySXVDaZchE=

/**
 * tile-overlay — the ONE visual recipe for media tiles and the chrome that floats over them:
 * how many tiles fit in a row, where the corner controls sit, when they show, and the scrim their
 * buttons paint. `Attachment` (its vertical tiles and `AttachmentGroup`), `SortableList`'s grid and
 * `AvatarPicker`'s photo overlay read from here, so a tile grid, a sortable gallery and a profile
 * photo all dim the same way and put their buttons in the same place.
 *
 * - `scrimClasses` — `scrim-foreground` ink on a subtle `scrim` wash, the overlay a photo wears
 *   under a control. `--scrim` / `--scrim-foreground` are theme-invariant tokens (black and white in
 *   both themes), because the wash lies over a photograph, not over the page.
 * - `tileOverlayButtonClasses` — the same scrim with a light blur, for an icon `Button` over an
 *   image (pass them to a `variant="ghost"` Button; `cn` replaces the ghost fills and icon ink).
 * - `tileCornerClasses.start` / `.end` — the top-left and top-right slots, inset from the tile's
 *   corner so a button sits on the image, not on its edge. They show on hover or focus within the
 *   tile (`group/tile`), while a menu opened from them is open, and always on a coarse pointer.
 * - `tileGridClasses` / `tileScrollRowClasses` — a tile grid, or a scrolling row, with at most `--tile-columns` per row
 *   (set it with `tileColumnClasses`): fewer when the container is narrow, never below 8.5rem a
 *   tile, so four on a desktop form, three on a tablet and two on a phone come from the container's
 *   own width, not the viewport's.
 *
 * Every class is a literal so a consumer's Tailwind scanner sees it.
 */

/** The dim a photo wears under a control: `scrim-foreground` ink over a subtle `scrim` wash. */
export const scrimClasses = "bg-scrim/40 text-scrim-foreground";

/** The group name the corner slots read hover and focus from — put it on the tile's root. */
export const tileGroupClass = "group/tile";

/**
 * An icon `Button` over an image: the scrim, a light blur, and `scrim-foreground` icon ink in every
 * state.
 * Written against the ghost variant's own selectors so `cn` replaces them rather than stacking.
 */
export const tileOverlayButtonClasses = [
  "bg-scrim/40 text-scrim-foreground backdrop-blur-sm",
  "hover:bg-scrim/60 hover:text-scrim-foreground dark:hover:bg-scrim/60",
  "aria-expanded:bg-scrim/60 aria-expanded:text-scrim-foreground",
  "[&_svg:not([class*='text-']):not([data-icon-tone])]:text-scrim-foreground",
  "hover:**:[svg:not([data-icon-tone])]:text-scrim-foreground",
  "aria-expanded:**:[svg:not([data-icon-tone])]:text-scrim-foreground",
].join(" ");

// Shown on hover or focus within the tile, while a menu from the slot is open, and always where
// there is no hover to reveal it. Only opacity changes: the controls never move.
const reveal =
  "opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 has-aria-expanded:opacity-100 pointer-coarse:opacity-100";

/** The top-left and top-right overlay slots, inset from the tile's corner. */
export const tileCornerClasses = {
  start: `absolute start-3 top-3 z-20 flex items-center gap-1 ${reveal}`,
  end: `absolute end-3 top-3 z-20 flex items-center gap-1 ${reveal}`,
} as const;

/** The most tiles a row holds — sets `--tile-columns` for the grid and scroll recipes below. */
export const tileColumnClasses = {
  2: "[--tile-columns:2]",
  3: "[--tile-columns:3]",
  4: "[--tile-columns:4]",
  5: "[--tile-columns:5]",
  6: "[--tile-columns:6]",
} as const;

/** A tile grid: `--tile-columns` equal tracks at most, fewer below 8.5rem a tile. `gap-3`. */
export const tileGridClasses =
  "grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,max(--spacing(34),calc((100%_-_(var(--tile-columns)_-_1)_*_var(--spacing)*3)/var(--tile-columns)))),1fr))]";

/**
 * A sideways-scrolling row's tiles (`AttachmentGroup layout="scroll"` children), each sized so
 * `--tile-columns` fit the row and the rest scroll — never below 8.5rem, so a phone shows two and
 * a peek.
 */
export const tileScrollRowClasses =
  "*:data-[slot=attachment]:w-[max(--spacing(34),calc((100%_-_(var(--tile-columns)_-_1)_*_var(--spacing)*3)/var(--tile-columns)))] *:data-[slot=attachment]:min-w-0 *:data-[slot=attachment]:data-[orientation=vertical]:flex-nowrap";
