// @vegastack drag-item@0.23.14 sha256-nNZwJ7XN56tQILlU/OZzBZw7vDgrf4mUy/3ZOTQqDGc=

/**
 * drag-item — the ONE visual recipe for an item that `use-drag-reorder` can move. The hook owns
 * the mechanics and writes the state attributes (`data-dragging`, `data-drop-edge`,
 * `data-drag-pending`); this module owns what those attributes look like, so `Board`,
 * `SortableList` and any future drag surface read from one place instead of copying six utilities
 * each (audit B8-05).
 *
 * Spread it onto the element the hook's `getItemProps()` attributes are on — the positioned
 * ancestor of the row's own chrome, since the drop indicator is a `::before` on it:
 *
 * ```tsx
 * const itemProps = reorder.getItemProps(containerId, id);
 * <div
 *   ref={itemProps.ref}
 *   data-drag-item={itemProps["data-drag-item"]}
 *   data-dragging={itemProps["data-dragging"]}
 *   data-drop-edge={itemProps["data-drop-edge"]}
 *   data-drag-pending={itemProps["data-drag-pending"]}
 *   className={cn(dragItemClasses, className)}
 * />
 * ```
 *
 * Every class is a literal in this file so a consumer's Tailwind scanner sees it: a recipe assembled
 * at runtime from fragments would compile to nothing in their build.
 */
export const dragItemClasses = [
  // `relative` is load-bearing, not cosmetic: the drop indicator below is an absolutely
  // positioned `::before` and needs this element as its containing block.
  "relative",
  // Drop indicator — a 2px primary hairline on whichever edge the pointer is closest to. On a
  // vertical axis it sits in the gap ABOVE/BELOW the item (`-top-1` / `-bottom-1`), so it reads as
  // a seam between two rows rather than a border on one of them.
  "data-[drop-edge=top]:before:absolute data-[drop-edge=top]:before:inset-x-0 data-[drop-edge=top]:before:-top-1 data-[drop-edge=top]:before:h-0.5 data-[drop-edge=top]:before:bg-primary data-[drop-edge=top]:before:content-['']",
  "data-[drop-edge=bottom]:before:absolute data-[drop-edge=bottom]:before:inset-x-0 data-[drop-edge=bottom]:before:-bottom-1 data-[drop-edge=bottom]:before:h-0.5 data-[drop-edge=bottom]:before:bg-primary data-[drop-edge=bottom]:before:content-['']",
  // The same seam for a HORIZONTAL axis (a row of tiles, or a grid that wraps): a vertical hairline
  // in the gap beside the item. The hook's closest-edge hitbox reports PHYSICAL left/right, so
  // these are physical offsets, not logical `start`/`end` — in RTL the engine's "left" is still
  // the left of the box.
  "data-[drop-edge=left]:before:absolute data-[drop-edge=left]:before:inset-y-0 data-[drop-edge=left]:before:-left-1 data-[drop-edge=left]:before:w-0.5 data-[drop-edge=left]:before:bg-primary data-[drop-edge=left]:before:content-['']",
  "data-[drop-edge=right]:before:absolute data-[drop-edge=right]:before:inset-y-0 data-[drop-edge=right]:before:-right-1 data-[drop-edge=right]:before:w-0.5 data-[drop-edge=right]:before:bg-primary data-[drop-edge=right]:before:content-['']",
  // Lift = dim on the ORIGIN item. Flat by doctrine: a dragged item never gains a shadow.
  "data-dragging:opacity-50",
  // A server-gated move in flight shimmers — the one sanctioned loader animation. The global
  // reduced-motion rule stops it; a per-component `motion-reduce:` copy would be dead weight.
  "data-drag-pending:animate-pulse",
].join(" ");
