// @vegastack sortable-list@0.25.3 sha256-zhRp7GImSIy0qPOBsN8tZtrLsX634FfP47NnRhw9mzA=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { EllipsisVertical, GripVertical, X } from "lucide-react";
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
and two on a phone (the `tile-overlay` recipe `AttachmentGroup` uses). The handle sits in the
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
   * @default undefined
   */
  columns?: 2 | 3 | 4 | 5 | 6;
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
  tile = "outline",
  disabled = false,
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
  const hitTest = React.useCallback(
    (point: PointerDragPoint) => {
      const current = touchRef.current;
      if (!current) return;
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
      if (current.over?.id !== over?.id || current.over?.edge !== over?.edge)
        setTouchDrag({ id: current.id, over });
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
      hitTest(point);
      const current = touchRef.current;
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

  return (
    <div
      ref={ref}
      data-slot="sortable-list"
      data-layout={layout}
      className={className}
    >
      <ItemGroup
        aria-label={ariaLabel}
        ref={setGroupRef}
        data-drop-container={containerProps["data-drop-container"]}
        data-drop-over={containerProps["data-drop-over"]}
        className={
          grid
            ? columns
              ? cn(tileColumnClasses[columns], tileGridClasses)
              : "grid grid-cols-[repeat(auto-fill,minmax(--spacing(28),1fr))] gap-2"
            : // ItemGroup's own `has-data-[size=sm]:gap-2.5` is replaced, not stacked: rows sit as
              // close as a DataList's.
              "flex flex-col gap-0.5 has-data-[size=sm]:gap-0.5"
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
                  : // DataList's row: compact padding, a subtle wash on hover.
                    "flex-nowrap gap-2 px-1 py-1 hover:bg-muted/50",
              )}
            >
              {disabled ? null : locked ? (
                // Same footprint as the handle, so locked and movable rows align.
                grid ? null : (
                  <span
                    aria-hidden="true"
                    data-slot="sortable-list-handle-spacer"
                    className="size-7 shrink-0"
                  />
                )
              ) : (
                <Button
                  variant="ghost"
                  size={grid ? "icon-xs" : "icon-sm"}
                  aria-label={`Reorder ${label}`}
                  data-slot="sortable-list-handle"
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
                            <EllipsisVertical />
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
