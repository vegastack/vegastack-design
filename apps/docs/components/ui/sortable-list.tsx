// @vegastack sortable-list@0.23.21 sha256-9VM1J8qM0Aoy6fgx7r2htM6HyT5GIpg7SXhmp0hW8sk=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  EllipsisVertical,
  GripVertical,
} from "lucide-react";
import { dragItemClasses } from "@/lib/drag-item";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  defaultActionsLabel,
  RowActionMenuItems,
  type RowAction,
} from "@/components/ui/data-table-parts";
import {
  useDragReorder,
  type DragReorderMove,
} from "@/components/ui/use-drag-reorder";

/* ---
`SortableList` is the single-list consumer of `use-drag-reorder`: settings reordering,
ordered taxonomies, pipeline stages. It is CONTROLLED and presentational — the ordered
`items` come in, `onReorder` emits a requested move, and the host persists (or refuses)
the order. What is app-coupled is the PERSISTED order, which stays app-side; the
mechanism (pointer + keyboard + announcements + drop indicators + the menu equivalent)
is presentational and belongs here — the G7 reading argued openly in the plan (§7.9)
and reconciled on the data-list docs page.

The "Move…" menu is not a convenience — it is the REQUIRED lossless path: drag is
pointer-only by engine design and unavailable on touch-first surfaces, so every
reorder must be reachable through Move up / Move down / Move to top / Move to bottom.
("Move to position N…" was considered and dropped: a per-position submenu is unusable
past a handful of items, and top/bottom + stepping covers the same reachability.)

A LOCKED row (`item.disabled`) is still a row of the list, not a hole in it: its handle
becomes a same-size spacer so the column of handles stays aligned, its row menu STAYS
with the Move items disabled (and described by `lockedReason` when the host gives
one), and `renderActions` still renders. Other rows move past it freely — a lock pins
the row's own identity, not the positions around it.

`layout="grid"` wraps the same list into auto-fill tiles (image galleries, ordered
media): the handle and the actions overlay the tile's top corners (`z-10`, so positioned tile
content such as `Image` cannot paint over them), the hook runs on a
horizontal axis so drops read left/right of a tile, and ↑/↓ in move mode step a whole
measured row.

Deliberately NOT done here:
- No selection. Reordering and multi-select on one surface produce ambiguous drag
  intent — the constraint the reference implementation documents. Compose `DataList`
  (which owns selection) for selectable tables; do not add checkboxes to rows here.
- No persistence, no optimistic insertion. A promise-returning `onReorder` gets the
  hook's pending shimmer and rejection snap-back for free.
- No virtualization. Settings-scale lists; a thousand-row sortable table is data-grid
  territory.
--- */

/** One row in the list. */
export interface SortableListItem {
  /** Stable id — the identity `onReorder` moves. */
  id: string;
  /**
   * Accessible name for the row's handle and menu ("Reorder {label}",
   * "Actions for {label}"). Falls back to the id.
   * @default undefined
   */
  label?: string;
  /**
   * Lock this row in place: its handle becomes a same-size spacer and its Move
   * items disable (described by `lockedReason`), while its row menu and
   * `renderActions` stay. Other rows can still move past it.
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
   * Inline actions rendered before the row menu — a rename button, a
   * visibility toggle. Rendered on locked rows too, and on every row when the
   * whole list is `disabled`.
   * @default undefined
   */
  renderActions?: (item: T) => React.ReactNode;
  /**
   * A row's own actions (rename, delete), listed first in its ⋯ menu, above a separator and
   * the Move items — one menu per row, as Board's `getItemActions`. On a locked row they stay
   * available.
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
   * Why locked rows cannot move — the accessible description of a locked
   * row's disabled Move items ("Built-in values can't move").
   * @default undefined
   */
  lockedReason?: string;
  /**
   * `list` stacks rows. `grid` wraps them into auto-fill tiles (at least
   * `--spacing(28)` wide) with the handle and actions overlaid on the tile's
   * top corners; drops read left/right of a tile, and ↑/↓ in move mode step a
   * whole row.
   * @default "list"
   */
  layout?: "list" | "grid";
  /**
   * Disable all reordering (rows render without handles or menus;
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

/**
 * `SortableList` — reorderable rows on `ItemGroup`/`Item`, driven by
 * `use-drag-reorder`: pointer/touch drag with closest-edge drop indicators,
 * the keyboard move mode (Space on the handle, arrows, Escape), a polite
 * announcement per step, and the required menu equivalent (Move up / down /
 * to top / to bottom). Controlled: the host owns the order and may refuse a
 * move by rejecting the `onReorder` promise. A locked row cannot be moved itself
 * and keeps its menu; other rows still move past it, so a host that needs a
 * position held refuses that move in `onReorder`. `layout="grid"` wraps the rows
 * into tiles.
 *
 * @example
 * const [stages, setStages] = React.useState(initialStages);
 * <SortableList
 *   aria-label="Pipeline stages"
 *   items={stages}
 *   renderItem={(stage) => <span>{stage.label}</span>}
 *   lockedReason="Closed stages can't be moved"
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
  renderActions,
  getItemActions,
  menuItems,
  actionsLabel = defaultActionsLabel,
  lockedReason,
  layout = "list",
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
  const reorder = useDragReorder({
    lists: { [CONTAINER]: ids },
    onReorder,
    axis: grid ? "horizontal" : "vertical",
    columns: grid ? "auto" : undefined,
    disabled: disabled ? true : (id) => byId.get(id)?.disabled ?? false,
  });
  const reasonId = React.useId();
  const describeLocked =
    !disabled && lockedReason !== undefined && items.some((i) => i.disabled);

  const containerProps = reorder.getContainerProps(CONTAINER);
  const last = items.length - 1;

  return (
    <div
      ref={ref}
      data-slot="sortable-list"
      data-layout={layout}
      className={className}
    >
      <ItemGroup
        aria-label={ariaLabel}
        ref={containerProps.ref}
        data-drop-container={containerProps["data-drop-container"]}
        data-drop-over={containerProps["data-drop-over"]}
        className={
          grid
            ? "grid grid-cols-[repeat(auto-fill,minmax(--spacing(28),1fr))] gap-2"
            : "flex flex-col gap-1"
        }
      >
        {items.map((item, index) => {
          const itemProps = reorder.getItemProps(CONTAINER, item.id);
          const handleProps = reorder.getHandleProps(CONTAINER, item.id);
          const label = item.label ?? item.id;
          const locked = !disabled && item.disabled === true;
          const actions = renderActions?.(item);
          const rowMenuItems = (getItemActions ?? menuItems)?.(item) ?? [];
          const move = (to: number) => () =>
            reorder.requestMove({
              id: item.id,
              from: { container: CONTAINER, index },
              to: { container: CONTAINER, index: to },
            });
          // A locked row's Move items are all disabled, and say why.
          const moveItemProps = (edge: boolean) => ({
            disabled: locked || edge,
            "aria-describedby": locked && describeLocked ? reasonId : undefined,
          });
          return (
            <Item
              key={item.id}
              size="sm"
              variant={grid ? "outline" : "default"}
              ref={itemProps.ref as React.Ref<HTMLDivElement>}
              data-drag-item={itemProps["data-drag-item"]}
              data-dragging={itemProps["data-dragging"]}
              data-drop-edge={itemProps["data-drop-edge"]}
              data-drag-pending={itemProps["data-drag-pending"]}
              data-locked={locked ? "" : undefined}
              data-slot="sortable-list-item"
              // The ONE drag-item recipe, shared with Board.
              className={cn(
                dragItemClasses,
                // A row never wraps its menu under the handle; its content truncates instead.
                grid
                  ? "flex-col flex-nowrap items-stretch gap-1 p-1"
                  : "flex-nowrap",
              )}
            >
              {disabled ? null : locked ? (
                // Same footprint as the handle, so locked and movable rows align.
                <span
                  aria-hidden="true"
                  data-slot="sortable-list-handle-spacer"
                  className={cn(
                    "size-7 shrink-0",
                    grid && "absolute start-1 top-1 z-10",
                  )}
                />
              ) : (
                <Button
                  variant={grid ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label={`Reorder ${label}`}
                  data-slot="sortable-list-handle"
                  ref={handleProps.ref as React.Ref<HTMLButtonElement>}
                  onKeyDown={handleProps.onKeyDown}
                  onBlur={handleProps.onBlur}
                  aria-pressed={handleProps["aria-pressed"]}
                  className={cn(
                    "cursor-grab touch-none",
                    grid && "absolute start-1 top-1 z-10",
                  )}
                >
                  <GripVertical />
                </Button>
              )}
              {/* In a tile column, Item's `flex-1` basis of 0% collapses the content to nothing. */}
              <ItemContent className={grid ? "flex-none" : "min-w-0"}>
                {renderItem(item)}
              </ItemContent>
              {actions == null && disabled ? null : (
                <ItemActions
                  data-slot="sortable-list-actions"
                  className={cn("gap-1", grid && "absolute end-1 top-1 z-10")}
                >
                  {actions}
                  {disabled ? null : (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant={grid ? "secondary" : "ghost"}
                            size="icon-sm"
                            aria-label={actionsLabel(label)}
                          >
                            <EllipsisVertical />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {rowMenuItems.length > 0 ? (
                          <>
                            <RowActionMenuItems
                              actions={rowMenuItems}
                              onAction={() =>
                                reorder.keepFocusAfter(CONTAINER, item.id)
                              }
                            />
                            <DropdownMenuSeparator />
                          </>
                        ) : null}
                        <DropdownMenuItem
                          {...moveItemProps(index === 0)}
                          onClick={move(index - 1)}
                        >
                          <ArrowUp /> Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          {...moveItemProps(index === last)}
                          onClick={move(index + 1)}
                        >
                          <ArrowDown /> Move down
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          {...moveItemProps(index === 0)}
                          onClick={move(0)}
                        >
                          <ArrowUpToLine /> Move to top
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          {...moveItemProps(index === last)}
                          onClick={move(last)}
                        >
                          <ArrowDownToLine /> Move to bottom
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </ItemActions>
              )}
            </Item>
          );
        })}
      </ItemGroup>
      {describeLocked ? (
        // Referenced by `aria-describedby`, so it needs no rendering of its own; kept OUT of the
        // menu items, where it would join their accessible NAME instead.
        <span id={reasonId} hidden>
          {lockedReason}
        </span>
      ) : null}
      <reorder.Announcer />
    </div>
  );
}
