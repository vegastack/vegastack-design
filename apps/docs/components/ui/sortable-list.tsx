// @vegastack sortable-list@0.4.1 sha256-FTLQqLEhPGH5fjUztJEz0SPLCGJQoHObRYrtsG9D+/o=

"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  EllipsisVertical,
  GripVertical,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { IconButton } from "@/components/ui/icon-button";
import { Item, ItemContent, ItemGroup } from "@/components/ui/item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
   * Accessible name for the row's handle and menu ("Reorder {label}"). Falls
   * back to the id.

   * @default undefined
   */
  label?: string;
  /**
   * Exclude this row from reordering (its handle and menu disable).
   * @default false
   */
  disabled?: boolean;
}

/** Props accepted by `SortableList`. */
export interface SortableListProps {
  /** Rows in display order — controlled; the host re-orders on `onReorder`. */
  items: readonly SortableListItem[];
  /**
   * Apply a requested move. Return a promise for server-gated ordering — the
   * moved row shows the pending shimmer and a rejection announces + snaps back
   * (the host never applied it).
   */
  onReorder: (move: DragReorderMove) => void | Promise<void>;
  /** Render a row's content (everything except the handle and menu). */
  renderItem: (item: SortableListItem) => React.ReactNode;
  /**
   * Disable all reordering (rows render without handles or menus).
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
 * move by rejecting the `onReorder` promise.
 *
 * @example
 * const [stages, setStages] = React.useState(initialStages);
 * <SortableList
 *   aria-label="Pipeline stages"
 *   items={stages}
 *   renderItem={(stage) => <span>{stage.label}</span>}
 *   onReorder={({ id, to }) =>
 *     setStages((prev) => {
 *       const next = prev.filter((s) => s.id !== id);
 *       next.splice(to.index, 0, prev.find((s) => s.id === id)!);
 *       return next;
 *     })
 *   }
 * />
 */
export function SortableList({
  items,
  onReorder,
  renderItem,
  disabled = false,
  "aria-label": ariaLabel = "Sortable list",
  className,
  ref,
}: SortableListProps) {
  const ids = React.useMemo(() => items.map((item) => item.id), [items]);
  const byId = React.useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const reorder = useDragReorder({
    lists: { [CONTAINER]: ids },
    onReorder,
    axis: "vertical",
    disabled: disabled ? true : (id) => byId.get(id)?.disabled ?? false,
  });

  const containerProps = reorder.getContainerProps(CONTAINER);

  return (
    <div ref={ref} data-slot="sortable-list" className={className}>
      <ItemGroup
        aria-label={ariaLabel}
        ref={containerProps.ref}
        data-drop-container={containerProps["data-drop-container"]}
        data-drop-over={containerProps["data-drop-over"]}
        className="flex flex-col gap-1"
      >
        {items.map((item, index) => {
          const itemProps = reorder.getItemProps(CONTAINER, item.id);
          const handleProps = reorder.getHandleProps(CONTAINER, item.id);
          const label = item.label ?? item.id;
          const rowDisabled = disabled || item.disabled;
          return (
            <Item
              key={item.id}
              size="sm"
              ref={itemProps.ref as React.Ref<HTMLDivElement>}
              data-drag-item={itemProps["data-drag-item"]}
              data-dragging={itemProps["data-dragging"]}
              data-drop-edge={itemProps["data-drop-edge"]}
              data-drag-pending={itemProps["data-drag-pending"]}
              data-slot="sortable-list-item"
              className={cn(
                // Drop indicator: a 2px primary hairline on the closest edge.
                "relative",
                "data-[drop-edge=top]:before:absolute data-[drop-edge=top]:before:inset-x-0 data-[drop-edge=top]:before:-top-1 data-[drop-edge=top]:before:h-0.5 data-[drop-edge=top]:before:bg-primary data-[drop-edge=top]:before:content-['']",
                "data-[drop-edge=bottom]:before:absolute data-[drop-edge=bottom]:before:inset-x-0 data-[drop-edge=bottom]:before:-bottom-1 data-[drop-edge=bottom]:before:h-0.5 data-[drop-edge=bottom]:before:bg-primary data-[drop-edge=bottom]:before:content-['']",
                // A lifted row dims; separation stays the surface + border
                // (flat by doctrine — a dragged row gains no shadow).
                "data-dragging:opacity-(--opacity-dim)",
                // A server-gated move in flight shimmers (the one sanctioned
                // loader animation), instantly static under reduced motion.
                "data-drag-pending:animate-pulse motion-reduce:data-drag-pending:animate-none",
              )}
            >
              {rowDisabled ? null : (
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={`Reorder ${label}`}
                  ref={handleProps.ref as React.Ref<HTMLElement>}
                  onKeyDown={handleProps.onKeyDown}
                  onBlur={handleProps.onBlur}
                  aria-pressed={handleProps["aria-pressed"]}
                  className="cursor-grab touch-none"
                >
                  <GripVertical />
                </IconButton>
              )}
              <ItemContent>{renderItem(item)}</ItemContent>
              {rowDisabled ? null : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${label}`}
                      >
                        <EllipsisVertical />
                      </IconButton>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={index === 0}
                      onClick={() =>
                        reorder.requestMove({
                          id: item.id,
                          from: { container: CONTAINER, index },
                          to: { container: CONTAINER, index: index - 1 },
                        })
                      }
                    >
                      <ArrowUp /> Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={index === items.length - 1}
                      onClick={() =>
                        reorder.requestMove({
                          id: item.id,
                          from: { container: CONTAINER, index },
                          to: { container: CONTAINER, index: index + 1 },
                        })
                      }
                    >
                      <ArrowDown /> Move down
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={index === 0}
                      onClick={() =>
                        reorder.requestMove({
                          id: item.id,
                          from: { container: CONTAINER, index },
                          to: { container: CONTAINER, index: 0 },
                        })
                      }
                    >
                      <ArrowUpToLine /> Move to top
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={index === items.length - 1}
                      onClick={() =>
                        reorder.requestMove({
                          id: item.id,
                          from: { container: CONTAINER, index },
                          to: {
                            container: CONTAINER,
                            index: items.length - 1,
                          },
                        })
                      }
                    >
                      <ArrowDownToLine /> Move to bottom
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Item>
          );
        })}
      </ItemGroup>
      <span {...reorder.getLiveRegionProps()} />
    </div>
  );
}
