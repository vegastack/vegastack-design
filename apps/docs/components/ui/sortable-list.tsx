// @vegastack sortable-list@0.26.0 sha256-4iRqwuOwKZsDm2lES2e3nLe0c6jQjv8hleVzFLmGOCE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Ellipsis, GripVertical, X } from "lucide-react";
import { dragItemClasses } from "@/lib/drag-item";
import {
  tileColumnClasses,
  tileCornerClasses,
  tileGridClasses,
  tileGroupClass,
  tileOverlayButtonClasses,
} from "@/lib/tile-overlay";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@/components/ui/item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  defaultActionsLabel,
  RowActionMenuItems,
  type RowAction,
} from "@/components/ui/data-table-parts";
import {
  edgeScroll,
  useDragReorder,
  usePointerDrag,
  type DragReorderMove,
  type PointerDragPoint,
} from "@/components/ui/use-drag-reorder";

/* ---
`SortableList` is the single-list consumer of `use-drag-reorder`: settings reordering,
ordered taxonomies, pipeline stages, ordered photos. It is CONTROLLED and presentational —
the ordered `items` come in, `onReorder` emits a requested move, and the host persists (or
refuses) the order. What is app-coupled is the PERSISTED order, which stays app-side; the
mechanism (pointer + touch + keyboard + announcements + drop indicators) is presentational
and belongs here — the G7 reading argued openly in the plan (§7.9) and reconciled on the
data-list docs page.

Three paths reach every order, so there is no Move menu (removed 2026-09-27, operator
brief): a mouse or pen drags the handle (Pragmatic's native drag); a finger long-presses
the row or tile — `usePointerDrag`'s touch model, the one `Board` runs on: a 250ms hold that
moves less than 8px lifts it, `touchmove` is cancelled only while the drag is live, and the
long-press context menu is suppressed — then drops on the edge it is over; and the keyboard
lifts from the handle (Space, arrows, Escape), every step announced. A touch pointer turns the
native drag off until the next mouse or pen press, so the two engines never race.

`footer` is the list's one non-item row — an "Add a value" field — laid on the rows' grid so its
content starts and ends where theirs do. `header` is the same kind of row above the list, full
width with no gutters, for an add field whose new item lands first. `flush` drops the rows' hover
wash and the side padding kept for it, for rows whose content is its own bordered control.
`align="start"` pins the handle and the row's actions to the row's first line instead of its
middle, for tall rows — a card with a title line and an expandable body.

Row actions: `onRemove` gives each row a small × ("Remove {label}") in its trailing corner; a
host that needs more than remove passes `getItemActions` and gets the ⋯ menu instead — the
escape hatch. Both show on hover or focus within the row (and while the menu is open), and
always on a coarse pointer. List rows are DataList-dense: compact padding, a subtle hover wash.

A LOCKED row (`item.disabled`) is still a row of the list, not a hole in it: its handle
becomes a same-size spacer so the column of handles stays aligned, it shows no ×, and its
`getItemActions` menu and `renderActions` still render. Other rows move past it freely — a
lock pins the row's own identity, not the positions around it.

`layout="grid"` wraps the same list into tiles (image galleries, ordered media): auto-fill
tracks at least `--spacing(28)` wide, or at most `columns` per row — fewer as the container
narrows, never below 8.5rem a tile, so `columns={4}` is four on a desktop, three on a tablet
and two on a phone (the `tile-overlay` recipe `AttachmentGroup` uses); `columns="cards"` is
`DataList`'s dense card grid instead, so sortable cards line up with the lists around them. The handle sits in the
tile's top-left overlay slot and the actions in its top-right one, inset from the corner on a
blurred scrim (`z-20`, above positioned tile content such as `Image` and an `Attachment`'s
full-tile open button); both show on hover or focus within the tile, always on a touch
screen. The hook runs on a horizontal axis so drops read left/right of a tile, and ↑/↓ in
move mode step a whole measured row. `tile="bare"` drops the tile's own border and padding so
its content — an `Attachment` — is the one frame. A drag starts only from the handle (or a
touch long-press), so a plain click or tap on the tile still reaches the tile: an
`Attachment` with a `file` opens its viewer.

Deliberately NOT done here:
- No selection. Reordering and multi-select on one surface produce ambiguous drag
  intent — the constraint the reference implementation documents. Compose `DataList`
  (which owns selection) for selectable tables; do not add checkboxes to rows here.
- No persistence, no optimistic insertion. A promise-returning `onReorder` gets the
  hook's pending shimmer and rejection snap-back for free.
- No virtualization. Settings-scale lists; a thousand-row sortable table is data-grid
  territory.
- No motion on press: the handle and × stay still under the pointer.
--- */

/** One row in the list. */
export interface SortableListItem {
  /** Stable id — the identity `onReorder` moves. */
  id: string;
  /**
   * Accessible name for the row's handle and actions ("Reorder {label}",
   * "Remove {label}", "Actions for {label}"). Falls back to the id.
   * @default undefined
   */
  label?: string;
  /**
   * Lock this row in place: its handle becomes a same-size spacer and it shows no
   * remove button, while its `getItemActions` menu and `renderActions` stay. Other
   * rows can still move past it.
   * @default false
   */
  disabled?: boolean;
}

/** Props accepted by `SortableList`. */
export interface SortableListProps<
  T extends SortableListItem = SortableListItem,
> {
  /** Rows in display order — controlled; the host re-orders on `onReorder`. */
  items: readonly T[];
  /**
   * Apply a requested move. Return a promise for server-gated ordering — the
   * moved row shows the pending shimmer and a rejection announces + snaps back
   * (the host never applied it).
   */
  onReorder: (move: DragReorderMove) => void | Promise<void>;
  /** Render a row's content (everything except the handle and actions). */
  renderItem: (item: T) => React.ReactNode;
  /**
   * Remove a row. Each unlocked row gets a small × button ("Remove {label}") in its
   * trailing corner, shown on hover or focus within the row and always on a coarse
   * pointer. Focus moves to the row that takes the removed row's place.
   * @default undefined
   */
  onRemove?: (item: T) => void;
  /**
   * Accessible name of a row's remove button, from the row's label.
   * @default (label) => `Remove ${label}`
   */
  removeLabel?: (label: string) => string;
  /**
   * Inline actions rendered before the row's remove button or menu — a rename
   * button, a visibility toggle. Rendered on locked rows too, and on every row
   * when the whole list is `disabled`.
   * @default undefined
   */
  renderActions?: (item: T) => React.ReactNode;
  /**
   * A row's own actions (rename, delete) in a ⋯ menu — the escape hatch for a host
   * that needs more than `onRemove`. One menu per row, as Board's `getItemActions`;
   * on a locked row it stays available. No actions, no menu.
   * @default undefined
   */
  getItemActions?: (item: T) => RowAction[];
  /**
   * @deprecated Use `getItemActions`, the same accessor under the collection name.
   * @default undefined
   */
  menuItems?: (item: T) => RowAction[];
  /**
   * Accessible name of a row's menu trigger, from the row's label.
   * @default (label) => `Actions for ${label}`
   */
  actionsLabel?: (label: string) => string;
  /**
   * Why locked rows cannot move — the accessible description of a locked row
   * ("Built-in values can't move").
   * @default undefined
   */
  lockedReason?: string;
  /**
   * `list` stacks rows. `grid` wraps them into tiles with the handle and actions
   * overlaid on the tile's top corners; drops read left/right of a tile, and ↑/↓
   * in move mode step a whole row.
   * @default "list"
   */
  layout?: "list" | "grid";
  /**
   * Grid only: the most tiles a row holds — fewer as the container narrows, never
   * below 8.5rem a tile (`4` is four on a desktop, three on a tablet, two on a
   * phone). Without it the grid auto-fills tracks at least `--spacing(28)` wide.
   * `"cards"` is `DataList`'s dense grid of default-size cards, column for column: one a
   * row, two from a 32rem list, three from 48rem and four from 72rem, 12px apart — so
   * a sortable row of `MediaCard`s lines up with the `DataList` grids beside it.
   * @default undefined
   */
  columns?: 2 | 3 | 4 | 5 | 6 | "cards";
  /**
   * Grid with numeric `columns` only: the narrowest a tile goes before the row holds one fewer, in px
   * (a card with a name and a meta line needs more than a thumbnail's 8.5rem: `240` holds one
   * card a row on a phone and four on a desktop).
   * @default 136
   */
  minTileWidth?: number;
  /**
   * Grid only: `outline` frames each tile; `bare` drops the tile's border and
   * padding so its content — an `Attachment` — is the tile's one frame.
   * @default "outline"
   */
  tile?: "outline" | "bare";
  /**
   * Disable all reordering (rows render without handles, remove buttons or menus;
   * `renderActions` still renders).
   * @default false
   */
  disabled?: boolean;
  /**
   * A trailing row under the list (`layout="list"` only) laid on the rows' own grid: its content
   * starts where a row's content starts (after the handle gutter) and ends where it ends (before
   * the × gutter), so an "Add a value" field lines up with the values above it. It is not an item:
   * it never drags, and it renders when `items` is empty too. Controls from `renderActions` have
   * no fixed width, so the footer does not reserve room for them.
   * @default undefined
   */
  footer?: React.ReactNode;
  /**
   * A leading row above the list (`layout="list"` only), full width: no handle or × gutters, so
   * an "Add a value" field and its Add button span the rows' whole width. Put the add field here
   * when a new item is inserted first. It is not an item: it never drags, and it renders when
   * `items` is empty too.
   * @default undefined
   */
  header?: React.ReactNode;
  /**
   * List rows without the hover wash and the side padding reserved for it, so a row's content
   * (an editable `Input`) runs the list's full width between the handle and the ×. For rows
   * whose content is its own bordered control; plain-text rows keep the wash.
   * @default false
   */
  flush?: boolean;
  /**
   * Where the handle and the row's actions sit on a list row: `center` on its middle, `start` on
   * its first line, for rows taller than one line (a title row over an expandable body). The ×
   * keeps its centre on the handle's.
   * @default "center"
   */
  align?: "center" | "start";
  /**
   * When the drag handle (⠿) shows. `always`: on every pointer. `fine`: only on a mouse or pen —
   * on a touch screen there is no grip (it would sit over the content, a card's type icon) and a
   * long-press on the row or tile still lifts it. The handle stays in the tab order either way:
   * hidden visually on touch, it reappears while it has keyboard focus, so Space-to-move works
   * with a keyboard on any device. `auto`: like `always`, but only while there is something to
   * reorder — with fewer than two movable rows there is no handle column at all, so a one-key
   * `SortBuilder` or a one-level `GroupByPicker` starts at the menu's inset like every other row
   * (MK 2026-10-30, list-toolbar T15); the column appears with the second movable row.
   * @default "always"
   */
  handle?: "always" | "fine" | "auto";
  /**
   * Accessible name for the list.
   * @default "Sortable list"
   */
  "aria-label"?: string;
  /** Extra classes for the list root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the list root (`data-slot="sortable-list"`).

   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

const CONTAINER = "list";

// The nearest ancestor that scrolls vertically — a touch drag auto-scrolls it.
function scrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    )
      return node;
    node = node.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
}

type TouchEdge = "top" | "bottom" | "left" | "right";

/**
 * `SortableList` — reorderable rows on `ItemGroup`/`Item`, driven by
 * `use-drag-reorder`: pointer drag on the handle with closest-edge drop indicators,
 * a touch long-press on the row, the keyboard move mode (Space on the handle,
 * arrows, Escape), and a polite announcement per step. Controlled: the host owns
 * the order and may refuse a move by rejecting the `onReorder` promise. `onRemove`
 * adds a × per row; `getItemActions` a ⋯ menu. A locked row cannot be moved itself;
 * other rows still move past it. `layout="grid"` wraps the rows into tiles.
 *
 * @example
 * const [stages, setStages] = React.useState(initialStages);
 * <SortableList
 *   aria-label="Pipeline stages"
 *   items={stages}
 *   renderItem={(stage) => <span>{stage.label}</span>}
 *   onRemove={(stage) => setStages((prev) => prev.filter((s) => s.id !== stage.id))}
 *   onReorder={({ id, to }) =>
 *     setStages((prev) => {
 *       const next = prev.filter((s) => s.id !== id);
 *       next.splice(to.index, 0, prev.find((s) => s.id === id)!);
 *       return next;
 *     })
 *   }
 * />
 */
export function SortableList<T extends SortableListItem = SortableListItem>({
  items,
  onReorder,
  renderItem,
  onRemove,
  removeLabel = (label) => `Remove ${label}`,
  renderActions,
  getItemActions,
  menuItems,
  actionsLabel = defaultActionsLabel,
  lockedReason,
  layout = "list",
  columns,
  minTileWidth,
  tile = "outline",
  disabled = false,
  footer,
  header,
  flush = false,
  align = "center",
  handle = "always",
  "aria-label": ariaLabel = "Sortable list",
  className,
  ref,
}: SortableListProps<T>) {
  const ids = React.useMemo(() => items.map((item) => item.id), [items]);
  const byId = React.useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const grid = layout === "grid";
  const bare = grid && tile === "bare";
  // A finger drives the long-press path below; the native drag stays off until a mouse or pen
  // presses again, so a long-press never starts both engines.
  const [touchInput, setTouchInput] = React.useState(false);
  const reorder = useDragReorder({
    lists: { [CONTAINER]: ids },
    onReorder,
    axis: grid ? "horizontal" : "vertical",
    columns: grid ? "auto" : undefined,
    pointerDisabled: touchInput,
    disabled: disabled ? true : (id) => byId.get(id)?.disabled ?? false,
  });
  const reasonId = React.useId();
  const describeLocked =
    !disabled && lockedReason !== undefined && items.some((i) => i.disabled);

  // ---- touch long-press (usePointerDrag's touch model) ----------------------
  const groupRef = React.useRef<HTMLElement | null>(null);
  const idsRef = React.useRef(ids);
  idsRef.current = ids;
  const [touchDrag, setTouchDrag] = React.useState<{
    id: string;
    over: { id: string; edge: TouchEdge } | null;
  } | null>(null);
  const touchRef = React.useRef(touchDrag);
  touchRef.current = touchDrag;
  const scroller = React.useRef<HTMLElement | null>(null);
  // The drag as of `point` (also what it renders): a drop reads this, not the last render's state.
  const hitTest = React.useCallback(
    (point: PointerDragPoint) => {
      const current = touchRef.current;
      if (!current) return null;
      const hit = document
        .elementFromPoint(point.x, point.y)
        ?.closest<HTMLElement>("[data-drag-item]");
      const id = hit?.getAttribute("data-drag-item");
      let over: { id: string; edge: TouchEdge } | null = null;
      if (hit && id && id !== current.id && groupRef.current?.contains(hit)) {
        const rect = hit.getBoundingClientRect();
        const edge: TouchEdge = grid
          ? point.x < rect.left + rect.width / 2
            ? "left"
            : "right"
          : point.y < rect.top + rect.height / 2
            ? "top"
            : "bottom";
        over = { id, edge };
      }
      if (current.over?.id === over?.id && current.over?.edge === over?.edge)
        return current;
      const next = { id: current.id, over };
      touchRef.current = next;
      setTouchDrag(next);
      return next;
    },
    [grid],
  );
  const pointerDrag = usePointerDrag({
    disabled,
    onStart: (id, element, _point, pointerType) => {
      if (pointerType !== "touch" || byId.get(id)?.disabled) return false;
      scroller.current = scrollParent(element);
      setTouchDrag({ id, over: null });
    },
    onFrame: (point) => {
      if (scroller.current) edgeScroll(scroller.current, point, "y");
      hitTest(point);
    },
    onDrop: (point) => {
      const current = hitTest(point);
      setTouchDrag(null);
      const over = current?.over;
      if (!current || !over) return;
      const list = idsRef.current;
      const from = list.indexOf(current.id);
      const target = list.indexOf(over.id);
      if (from === -1 || target === -1) return;
      let index =
        over.edge === "bottom" || over.edge === "right" ? target + 1 : target;
      if (from < index) index -= 1;
      if (index === from) return;
      reorder.requestMove({
        id: current.id,
        from: { container: CONTAINER, index: from },
        to: { container: CONTAINER, index },
      });
    },
    onCancel: () => setTouchDrag(null),
  });

  const containerProps = reorder.getContainerProps(CONTAINER);
  const setGroupRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      groupRef.current = element;
      containerProps.ref(element);
    },
    // `containerProps.ref` is identity-stable per container.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containerProps.ref],
  );

  // `handle="auto"`: the grip shows only while two or more rows can move. With no grip on any
  // row there is no handle column either, so the rows' content starts at the list's edge.
  const movableCount = items.filter((item) => item.disabled !== true).length;
  const noHandles = handle === "auto" && movableCount < 2;
  // A flush list with no rows: its footer stands alone (see the footer).
  const loneFooter = flush && items.length === 0;

  return (
    <div
      ref={ref}
      data-slot="sortable-list"
      data-layout={layout}
      // A card grid's columns follow the list's own width, as DataList's do.
      className={cn(
        grid && columns === "cards" && "@container/sortable-list",
        className,
      )}
    >
      {header != null && !grid ? (
        <div
          data-slot="sortable-list-header"
          className="mb-0.5 flex min-w-0 items-center gap-2 py-1"
        >
          {header}
        </div>
      ) : null}
      <ItemGroup
        aria-label={ariaLabel}
        ref={setGroupRef}
        data-drop-container={containerProps["data-drop-container"]}
        data-drop-over={containerProps["data-drop-over"]}
        style={
          grid && typeof columns === "number" && minTileWidth
            ? ({ "--tile-min": `${minTileWidth}px` } as React.CSSProperties)
            : undefined
        }
        // ItemGroup's own `has-data-[size=sm]:gap-2.5` and `has-data-[size=xs]:gap-2` are
        // replaced, not stacked: they match any small control inside an item (a size-`xs` chip in a
        // card's meta line), and would pull the gap in from under the layout's own.
        className={
          grid
            ? columns === "cards"
              ? // DataList's dense grid at its default card size, column for column.
                "grid grid-cols-1 gap-3 has-data-[size=sm]:gap-3 has-data-[size=xs]:gap-3 @lg/sortable-list:grid-cols-2 @3xl/sortable-list:grid-cols-3 @6xl/sortable-list:grid-cols-4"
              : columns
                ? cn(
                    tileColumnClasses[columns],
                    tileGridClasses,
                    "has-data-[size=sm]:gap-3 has-data-[size=xs]:gap-3",
                  )
                : "grid grid-cols-[repeat(auto-fill,minmax(--spacing(28),1fr))] gap-2 has-data-[size=sm]:gap-2 has-data-[size=xs]:gap-2"
            : // Rows sit as close as a DataList's.
              "flex flex-col gap-0.5 has-data-[size=sm]:gap-0.5 has-data-[size=xs]:gap-0.5"
        }
      >
        {items.map((item) => {
          const itemProps = reorder.getItemProps(CONTAINER, item.id);
          const handleProps = reorder.getHandleProps(CONTAINER, item.id);
          const sourceProps = pointerDrag.getSourceProps(item.id);
          const label = item.label ?? item.id;
          const locked = !disabled && item.disabled === true;
          const actions = renderActions?.(item);
          const rowMenuItems = disabled
            ? []
            : ((getItemActions ?? menuItems)?.(item) ?? []);
          const removable = onRemove !== undefined && !disabled && !locked;
          const touchEdge =
            touchDrag?.over?.id === item.id ? touchDrag.over.edge : undefined;
          const hasActions =
            actions != null || removable || rowMenuItems.length > 0;
          return (
            <Item
              key={item.id}
              size="sm"
              variant={grid && !bare ? "outline" : "default"}
              ref={itemProps.ref as React.Ref<HTMLDivElement>}
              data-drag-item={itemProps["data-drag-item"]}
              data-dragging={
                itemProps["data-dragging"] ??
                (touchDrag?.id === item.id ? "" : undefined)
              }
              data-drop-edge={itemProps["data-drop-edge"] ?? touchEdge}
              data-drag-pending={itemProps["data-drag-pending"]}
              data-locked={locked ? "" : undefined}
              data-slot="sortable-list-item"
              aria-describedby={locked && describeLocked ? reasonId : undefined}
              onPointerDown={(event: React.PointerEvent<HTMLElement>) => {
                const touch = event.pointerType === "touch";
                if (touch !== touchInput) setTouchInput(touch);
                if (touch) sourceProps.onPointerDown(event);
              }}
              onContextMenu={sourceProps.onContextMenu}
              // The ONE drag-item recipe, shared with Board.
              className={cn(
                dragItemClasses,
                // A row never wraps its actions under the handle; its content truncates instead.
                grid
                  ? cn(
                      tileGroupClass,
                      "flex-col flex-nowrap items-stretch gap-1",
                      // Bare: the Attachment fills the tile. The child path outranks its own
                      // `has-…:w-30`, which would otherwise hold it at 120px in a narrower tile,
                      // and `flex-nowrap` keeps its progress bar in the column instead of
                      // wrapping it into a second one beside the image.
                      bare
                        ? "border-0 p-0 [&>[data-slot=item-content]>[data-slot=attachment]]:w-full [&>[data-slot=item-content]>[data-slot=attachment]]:min-w-0 [&>[data-slot=item-content]>[data-slot=attachment]]:flex-nowrap"
                        : "p-1",
                    )
                  : cn(
                      flush
                        ? // Flush: the content runs edge to edge; no wash, no padding kept for one.
                          "flex-nowrap gap-2 px-0 py-1"
                        : // DataList's row: compact padding, a subtle wash on hover.
                          "flex-nowrap gap-2 px-1 py-1 hover:bg-muted/50",
                      // Start: the handle and actions keep to the first line of a tall row.
                      align === "start" && "items-start",
                    ),
              )}
            >
              {disabled || noHandles ? null : locked ? (
                // Same footprint as the handle, so locked and movable rows align.
                grid ? null : (
                  <span
                    aria-hidden="true"
                    data-slot="sortable-list-handle-spacer"
                    className={cn(
                      "size-7 shrink-0",
                      handle === "fine" && "pointer-coarse:hidden",
                    )}
                  />
                )
              ) : (
                <Button
                  variant="ghost"
                  size={grid ? "icon-xs" : "icon-sm"}
                  aria-label={`Reorder ${label}`}
                  data-slot="sortable-list-handle"
                  data-handle={handle}
                  // A long-press on the handle lifts the row too.
                  data-drag-surface=""
                  ref={handleProps.ref as React.Ref<HTMLButtonElement>}
                  onKeyDown={handleProps.onKeyDown}
                  onBlur={handleProps.onBlur}
                  aria-pressed={handleProps["aria-pressed"]}
                  className={cn(
                    "cursor-grab touch-none active:not-aria-[haspopup]:translate-y-0",
                    // The tile's top-left overlay slot, on the scrim.
                    grid &&
                      cn(tileCornerClasses.start, tileOverlayButtonClasses),
                    // `handle="fine"`: no grip on touch (a long-press lifts the row), back while
                    // the handle has keyboard focus.
                    handle === "fine" &&
                      "pointer-coarse:not-focus-visible:sr-only",
                  )}
                >
                  <GripVertical />
                </Button>
              )}
              {/* In a tile column, Item's `flex-1` basis of 0% collapses the content to nothing. */}
              <ItemContent className={grid ? "flex-none" : "min-w-0"}>
                {renderItem(item)}
              </ItemContent>
              {hasActions ? (
                <ItemActions
                  data-slot="sortable-list-actions"
                  className={cn("gap-1", grid && tileCornerClasses.end)}
                >
                  {actions}
                  {removable ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={removeLabel(label)}
                      data-slot="sortable-list-remove"
                      onClick={() => {
                        reorder.keepFocusAfter(CONTAINER, item.id);
                        onRemove(item);
                      }}
                      className={cn(
                        "active:not-aria-[haspopup]:translate-y-0",
                        // A grid's corner slot reveals its buttons together; a row reveals each.
                        grid
                          ? tileOverlayButtonClasses
                          : "opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
                        // On the first line, the 24px × takes the 28px handle's height, so it centres on it beside a ⋯ too.
                        !grid && align === "start" && "my-0.5",
                      )}
                    >
                      <X />
                    </Button>
                  ) : null}
                  {rowMenuItems.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size={grid ? "icon-xs" : "icon-sm"}
                            aria-label={actionsLabel(label)}
                            className={
                              grid
                                ? tileOverlayButtonClasses
                                : "opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
                            }
                          >
                            <Ellipsis />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <RowActionMenuItems
                          actions={rowMenuItems}
                          onAction={() =>
                            reorder.keepFocusAfter(CONTAINER, item.id)
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </ItemActions>
              ) : null}
            </Item>
          );
        })}
      </ItemGroup>
      {footer != null && !grid ? (
        // The row recipe without the row: the same transparent border and padding, a handle-sized
        // gutter, and a gutter the width of the row's trailing control (× or ⋯) when rows have one.
        // A flush list with no rows has no grid to line up with: the footer is its first row, the
        // control at the list's edge with nothing above or beside it (a one-level GroupByPicker's
        // "+ Group by" in a menu sits on the menu's inset like the rows around it).
        <div
          data-slot="sortable-list-footer"
          className={cn(
            "flex items-center gap-2",
            loneFooter
              ? null
              : [
                  "mt-0.5 border border-transparent py-1",
                  flush ? "px-0" : "px-1",
                ],
          )}
        >
          {disabled || noHandles || loneFooter ? null : (
            <span aria-hidden="true" className="size-7 shrink-0" />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2">{footer}</div>
          {disabled ||
          loneFooter ||
          (onRemove === undefined &&
            getItemActions === undefined &&
            menuItems === undefined) ? null : (
            // The rows' `ItemActions` column: × (icon-xs) and ⋯ (icon-sm), `gap-1` between.
            <span aria-hidden="true" className="flex shrink-0 gap-1">
              {onRemove !== undefined ? <span className="w-6" /> : null}
              {getItemActions !== undefined || menuItems !== undefined ? (
                <span className="w-7" />
              ) : null}
            </span>
          )}
        </div>
      ) : null}
      {describeLocked ? (
        // Referenced by `aria-describedby` on each locked row.
        <span id={reasonId} hidden>
          {lockedReason}
        </span>
      ) : null}
      <reorder.Announcer />
    </div>
  );
}
