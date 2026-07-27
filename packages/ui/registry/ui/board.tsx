// @vegastack board@0.3.0 sha256-d+4GDHG2Hrl9Dd+tuaVKl+xwMewv2u2WYQhqc+2Z1o0=

"use client";

import * as React from "react";
import { EllipsisVertical } from "lucide-react";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { IconButton } from "@/components/ui/icon-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/components/ui/use-mobile";
import {
  useDragReorder,
  type DragReorderMove,
} from "@/components/ui/use-drag-reorder";

/* ---
`Board` owns column layout, the drag/move model, the keyboard-and-menu equivalent, and
the pending/rejected affordances — the host renders card CONTENT only and owns the
move command. That content/chrome split is the cleanest boundary in the reference
implementation and is inherited deliberately: the component owns all chrome (column
shells, counts, empty drop targets, collapsed strips), the app owns what a card says.

The keyboard path is not a fallback here — below 768px drag is disabled outright
(engine drags are pointer-first and fight touch scrolling), so the "Move to…" menu and
the handle's move mode are the ONLY paths on mobile and must be lossless by
construction. Every card's menu lists every droppable column with per-target lock
reasons; `M` on a focused card opens it directly.

Elevation: a dragged card must NOT gain a shadow — only true overlays get
`shadow-overlay` (design.md §Elevation). Lift is expressed by dimming the origin card;
the native drag preview is the browser's snapshot of the flat card, so separation
comes from the surface ladder + the one border. This will feel wrong to anyone coming
from other kanbans; it is the system's position.

Deliberately NOT done here:
- No card focus-roving via `use-list-nav` — its grid model assumes uniform columns and
  a board is ragged. The small board-specific roving model below (↑/↓ within a column,
  ←/→ across columns at a clamped index — the reference's cross-column behaviour) is
  more honest than contorting the hook. Cards keep one Tab stop per board.
- No data behaviour: ordering, persistence, and the move command are the host's
  (`onMove` may return a promise → pending shimmer, announced snap-back on rejection).
- No virtualization — columns are bounded by design at this component's scale.
- No custom drag-preview portal. The native preview is the flat card snapshot; a
  custom `z-(--z-overlay)` portal preview is a consumer option, not built-in chrome.
--- */

/** One board column. */
export interface BoardColumn<T> {
  /** Stable column id — the container identity moves target. */
  id: string;
  /** Column heading content. */
  title: React.ReactNode;
  /** Cards in display order (controlled). */
  items: readonly T[];
  /**
   * Whether cards can be dropped into (or moved to) this column. A parked
   * lane sets `false` — it still renders, but is never a target.
   * @default true
   */
  droppable?: boolean;
  /**
   * Reason shown (and announced) for an unavailable move target — pairs with
   * `droppable: false` or business gating.

   * @default undefined
   */
  lockedReason?: string;
  /**
   * Render collapsed to a narrow strip (terminal columns). Activating the
   * strip expands the column read-only: cards show but do not drag, and it is
   * not a drop target.
   * @default false
   */
  collapsed?: boolean;
}

/** Props accepted by `Board`. */
export interface BoardProps<T> {
  /** Columns in display order. */
  columns: readonly BoardColumn<T>[];
  /** Stable card identity. */
  getItemId: (item: T) => string;
  /**
   * Render a card's CONTENT only — the board owns the card chrome (surface,
   * border, focus, drag affordances).
   */
  renderCard: (item: T, column: BoardColumn<T>) => React.ReactNode;
  /**
   * Apply a move (drag, keyboard, or menu). Return a promise for server-gated
   * moves: the card shimmers in place while pending, and a rejection announces
   * the snap-back (the host never applied it).
   */
  onMove: (move: DragReorderMove) => void | Promise<void>;
  /**
   * Activate a card (open its record). Cards render as real buttons.

   * @default undefined
   */
  onCardActivate?: (item: T) => void;
  /**
   * Column width as a CSS length, applied through the `--board-column-width`
   * custom property.
   * @default "18rem"
   */
  columnWidth?: string;
  /**
   * Extra per-column header action (a filter menu, an add button) rendered in
   * the column's `CardAction` seat.

   * @default undefined
   */
  renderColumnAction?: (column: BoardColumn<T>) => React.ReactNode;
  /**
   * Force-disable dragging (the menu and move mode remain). Dragging is
   * always disabled below 768px.
   * @default false
   */
  dragDisabled?: boolean;
  /**
   * Accessible name for the board.
   * @default "Board"
   */
  "aria-label"?: string;
  /** Extra classes for the board root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the board root (`data-slot="board"`).

   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * `Board` — kanban columns over `use-drag-reorder`: pointer drag with
 * closest-edge indicators, the keyboard move mode on each card's handle-free
 * surface (Space lifts the focused card), the lossless per-card "Move to…"
 * menu (<kbd>M</kbd> opens it), cross-column roving focus (↑/↓ within, ←/→
 * across), pending shimmer + announced snap-back for server-refused moves,
 * collapsed terminal columns, and `Empty bordered` drop targets for empty
 * columns. The host renders card content and owns the move command.
 *
 * @example
 * <Board
 *   aria-label="Deals"
 *   columns={stages.map((s) => ({ id: s.id, title: s.label, items: s.deals }))}
 *   getItemId={(deal) => deal.id}
 *   renderCard={(deal) => <>{deal.name} · {deal.amount}</>}
 *   onMove={({ id, to }) => api.moveDeal(id, to.container, to.index)}
 * />
 */
export function Board<T>({
  columns,
  getItemId,
  renderCard,
  onMove,
  onCardActivate,
  columnWidth = "18rem",
  renderColumnAction,
  dragDisabled = false,
  "aria-label": ariaLabel = "Board",
  className,
  ref,
}: BoardProps<T>) {
  const isMobile = useIsMobile();
  const [expandedOverrides, setExpandedOverrides] = React.useState<
    ReadonlySet<string>
  >(new Set());
  const [openMenuCard, setOpenMenuCard] = React.useState<string | null>(null);

  const isCollapsed = (column: BoardColumn<T>) =>
    (column.collapsed ?? false) && !expandedOverrides.has(column.id);
  /** Columns declared collapsed stay read-only even while expanded to view. */
  const isReadOnly = (column: BoardColumn<T>) => column.collapsed ?? false;

  const lists = React.useMemo(() => {
    const record: Record<string, string[]> = {};
    for (const column of columns)
      record[column.id] = column.items.map(getItemId);
    return record;
  }, [columns, getItemId]);

  const itemsById = React.useMemo(() => {
    const map = new Map<string, { item: T; column: BoardColumn<T> }>();
    for (const column of columns)
      for (const item of column.items)
        map.set(getItemId(item), { item, column });
    return map;
  }, [columns, getItemId]);

  const reorder = useDragReorder({
    lists,
    onReorder: onMove,
    axis: "vertical",
    // Pointer drags disable on mobile / by prop; the keyboard move mode and
    // the Move menu — the lossless paths — always survive.
    pointerDisabled: dragDisabled || isMobile,
    disabled: (id) => {
      const owner = itemsById.get(id)?.column;
      return owner ? isReadOnly(owner) : true;
    },
    // Locked lanes must refuse POINTER drops on their cards too — the
    // container ref gating alone leaves every card a valid target.
    canDropInContainer: (containerId) => {
      const column = columns.find((c) => c.id === containerId);
      return column ? column.droppable !== false && !isReadOnly(column) : false;
    },
  });

  // ---- roving focus across the ragged card grid ----------------------------
  const [activeCard, setActiveCard] = React.useState<string | null>(null);
  const cardRefs = React.useRef(new Map<string, HTMLElement>());
  const visibleColumns = columns.filter((column) => !isCollapsed(column));
  const firstCardId = visibleColumns.flatMap((column) =>
    column.items.map(getItemId),
  )[0];
  // Reconcile the roving target against the CURRENT card set: if the active
  // card was removed (poll, filter) or its column collapsed, fall back to the
  // first card — otherwise the board loses its only tab stop permanently.
  const activeCardStillVisible =
    activeCard !== null &&
    visibleColumns.some((column) =>
      column.items.some((item) => getItemId(item) === activeCard),
    );
  const rovingTarget =
    (activeCardStillVisible ? activeCard : null) ?? firstCardId ?? null;

  const focusCard = React.useCallback((id: string | undefined) => {
    if (!id) return;
    setActiveCard(id);
    cardRefs.current.get(id)?.focus();
  }, []);

  const handleCardKeyDown = (
    event: React.KeyboardEvent,
    column: BoardColumn<T>,
    index: number,
    id: string,
  ) => {
    // The move-mode handler (Space/arrows while lifted) runs first; browsing
    // keys below only apply when the card is not in move mode.
    if (reorder.activeId === id) return;
    const columnIndex = visibleColumns.findIndex((c) => c.id === column.id);
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const ids = column.items.map(getItemId);
        focusCard(ids[Math.max(0, Math.min(index + delta, ids.length - 1))]);
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        event.preventDefault();
        const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const logical = event.key === "ArrowRight" ? 1 : -1;
        const delta = isRtl ? -logical : logical;
        const next = visibleColumns[columnIndex + delta];
        if (!next || next.items.length === 0) return;
        const ids = next.items.map(getItemId);
        focusCard(ids[Math.min(index, ids.length - 1)]);
        break;
      }
      case "Home": {
        event.preventDefault();
        focusCard(column.items.map(getItemId)[0]);
        break;
      }
      case "End": {
        event.preventDefault();
        focusCard(column.items.map(getItemId).at(-1));
        break;
      }
      case "m":
      case "M": {
        event.preventDefault();
        setOpenMenuCard(id);
        break;
      }
      default:
        break;
    }
  };

  const moveTargetsFor = (id: string, from: BoardColumn<T>) =>
    columns
      .filter((column) => column.id !== from.id)
      .map((column) => ({
        column,
        locked: column.droppable === false || isReadOnly(column),
      }));

  return (
    <div
      ref={ref}
      data-slot="board"
      role="group"
      aria-label={ariaLabel}
      // Only a --* custom property — the class consumes it (contract-clean).
      style={{ ["--board-column-width"]: columnWidth } as React.CSSProperties}
      className={cn("w-full max-w-full min-w-0", className)}
    >
      <div
        data-slot="board-scroller"
        // w-full + max-w-full: inside a flex/grid parent the board must never
        // size to its columns' max-content — it scrolls internally instead
        // (the 320px reflow contract). The live region lives OUTSIDE this
        // scroller: an sr-only absolute element as the row's last child would
        // anchor at the row's content width and leak the page's scroll area.
        className="flex w-full max-w-full min-w-0 items-start gap-3 overflow-x-auto pb-2"
      >
        {columns.map((column) => {
          const collapsed = isCollapsed(column);
          const readOnly = isReadOnly(column);
          const containerProps = reorder.getContainerProps(column.id);
          if (collapsed) {
            return (
              <Button
                key={column.id}
                variant="outline"
                data-slot="board-column-collapsed"
                onClick={() =>
                  setExpandedOverrides((prev) => new Set(prev).add(column.id))
                }
                // `relative`: the sr-only child is absolutely positioned — without a
                // positioned ancestor it resolves against the ICB, and inside this
                // horizontally scrolled row its static x (~900px) would extend the
                // PAGE's scroll width (measured; the 320px reflow contract catches it).
                className="relative h-auto min-h-48 w-(--size-lg) shrink-0 flex-col items-center gap-2 rounded-lg bg-card px-1 py-3"
              >
                <Badge variant="subtle" size="sm">
                  {column.items.length}
                </Badge>
                <span
                  data-slot="board-column-collapsed-title"
                  className="min-h-0 flex-1 [writing-mode:vertical-rl] text-label-sm text-muted-foreground"
                >
                  {column.title}
                </span>
                <span className="sr-only">Expand column, read-only</span>
              </Button>
            );
          }
          return (
            <Card
              key={column.id}
              size="sm"
              data-slot="board-column"
              data-column={column.id}
              data-read-only={readOnly ? "" : undefined}
              data-drop-over={
                column.droppable === false || readOnly
                  ? undefined
                  : containerProps["data-drop-over"]
              }
              className={cn(
                "w-(--board-column-width) shrink-0 gap-2 bg-muted/(--alpha-wash) py-2",
                "data-drop-over:border-primary/(--alpha-outline-border)",
              )}
            >
              <CardHeader className="px-3">
                <CardTitle
                  data-slot="board-column-title"
                  className="flex min-w-0 items-center gap-2 text-label-sm text-muted-foreground"
                >
                  <span className="min-w-0 truncate">{column.title}</span>
                  <Badge variant="subtle" size="sm">
                    {column.items.length}
                  </Badge>
                </CardTitle>
                {renderColumnAction ? (
                  <CardAction>{renderColumnAction(column)}</CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="px-2">
                <ScrollArea className="max-h-[calc(100dvh-var(--spacing)*64)]">
                  <div
                    data-slot="board-column-body"
                    ref={
                      column.droppable === false || readOnly
                        ? undefined
                        : containerProps.ref
                    }
                    className="flex min-h-16 flex-col gap-2 p-1"
                  >
                    {column.items.length === 0 ? (
                      <Empty size="sm" bordered data-slot="board-column-empty">
                        <EmptyHeader>
                          <EmptyTitle>No cards</EmptyTitle>
                          <EmptyDescription>
                            {column.droppable === false
                              ? (column.lockedReason ?? "Not a drop target")
                              : "Drag a card here"}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div
                        role="list"
                        aria-label={
                          typeof column.title === "string"
                            ? column.title
                            : undefined
                        }
                        className="flex flex-col gap-2"
                      >
                        {column.items.map((item, index) => {
                          const id = getItemId(item);
                          const itemProps = reorder.getItemProps(column.id, id);
                          const handleProps = reorder.getHandleProps(
                            column.id,
                            id,
                          );
                          return (
                            <div
                              key={id}
                              role="listitem"
                              ref={itemProps.ref}
                              data-drag-item={itemProps["data-drag-item"]}
                              data-dragging={itemProps["data-dragging"]}
                              data-drop-edge={itemProps["data-drop-edge"]}
                              data-drag-pending={itemProps["data-drag-pending"]}
                              data-slot="board-card"
                              className={cn(
                                "relative",
                                "data-[drop-edge=top]:before:absolute data-[drop-edge=top]:before:inset-x-0 data-[drop-edge=top]:before:-top-1 data-[drop-edge=top]:before:h-0.5 data-[drop-edge=top]:before:bg-primary data-[drop-edge=top]:before:content-['']",
                                "data-[drop-edge=bottom]:before:absolute data-[drop-edge=bottom]:before:inset-x-0 data-[drop-edge=bottom]:before:-bottom-1 data-[drop-edge=bottom]:before:h-0.5 data-[drop-edge=bottom]:before:bg-primary data-[drop-edge=bottom]:before:content-['']",
                                // Lift = dim; flat by doctrine, never a shadow.
                                "data-dragging:opacity-(--opacity-dim)",
                                "data-drag-pending:animate-pulse motion-reduce:data-drag-pending:animate-none",
                              )}
                            >
                              <div
                                role="button"
                                tabIndex={rovingTarget === id ? 0 : -1}
                                ref={(node: HTMLElement | null) => {
                                  if (node) cardRefs.current.set(id, node);
                                  else cardRefs.current.delete(id);
                                  (
                                    handleProps.ref as (
                                      el: HTMLElement | null,
                                    ) => void
                                  )(node);
                                }}
                                data-slot="board-card-surface"
                                aria-pressed={handleProps["aria-pressed"]}
                                onFocus={() => setActiveCard(id)}
                                onBlur={handleProps.onBlur}
                                onKeyDown={(event) => {
                                  // Enter ACTIVATES (Space lifts) — the hook
                                  // treats both as lift, so Enter never reaches it.
                                  if (
                                    event.key === "Enter" &&
                                    reorder.activeId !== id
                                  ) {
                                    event.preventDefault();
                                    onCardActivate?.(item);
                                    return;
                                  }
                                  handleProps.onKeyDown(event);
                                  if (!event.defaultPrevented)
                                    handleCardKeyDown(event, column, index, id);
                                }}
                                onClick={() => onCardActivate?.(item)}
                                className={cn(
                                  "flex w-full min-w-0 cursor-grab flex-col gap-1 rounded-md border border-border bg-card p-3 text-start text-base",
                                  "hover:bg-accent",
                                  readOnly && "cursor-default",
                                )}
                              >
                                {renderCard(item, column)}
                              </div>
                              {readOnly ? null : (
                                <DropdownMenu
                                  open={openMenuCard === id}
                                  onOpenChange={(open) =>
                                    setOpenMenuCard(open ? id : null)
                                  }
                                >
                                  <DropdownMenuTrigger
                                    render={
                                      <IconButton
                                        variant="ghost"
                                        size="xs"
                                        aria-label="Move card"
                                        className="absolute end-1 top-1"
                                      >
                                        <EllipsisVertical />
                                      </IconButton>
                                    }
                                  />
                                  <DropdownMenuContent align="end">
                                    {/* Within-column ordering — on touch the
                                        menu is the ONLY ordering path, so it
                                        must be lossless on its own. */}
                                    {[
                                      {
                                        label: "Move up",
                                        index: index - 1,
                                        enabled: index > 0,
                                      },
                                      {
                                        label: "Move down",
                                        index: index + 1,
                                        enabled:
                                          index < column.items.length - 1,
                                      },
                                      {
                                        label: "Move to top",
                                        index: 0,
                                        enabled: index > 0,
                                      },
                                      {
                                        label: "Move to bottom",
                                        index: column.items.length - 1,
                                        enabled:
                                          index < column.items.length - 1,
                                      },
                                    ].map((step) => (
                                      <DropdownMenuItem
                                        key={step.label}
                                        disabled={!step.enabled}
                                        onClick={() =>
                                          reorder.requestMove({
                                            id,
                                            from: {
                                              container: column.id,
                                              index,
                                            },
                                            to: {
                                              container: column.id,
                                              index: step.index,
                                            },
                                          })
                                        }
                                      >
                                        {step.label}
                                      </DropdownMenuItem>
                                    ))}
                                    {moveTargetsFor(id, column).map(
                                      ({ column: target, locked }) => (
                                        <DropdownMenuItem
                                          key={target.id}
                                          disabled={locked}
                                          onClick={() =>
                                            reorder.requestMove({
                                              id,
                                              from: {
                                                container: column.id,
                                                index,
                                              },
                                              to: {
                                                container: target.id,
                                                index: target.items.length,
                                              },
                                            })
                                          }
                                        >
                                          <span className="flex min-w-0 flex-col">
                                            <span className="truncate">
                                              Move to{" "}
                                              {typeof target.title === "string"
                                                ? target.title
                                                : target.id}
                                            </span>
                                            {locked && target.lockedReason ? (
                                              <span className="text-sm text-muted-foreground">
                                                {target.lockedReason}
                                              </span>
                                            ) : null}
                                          </span>
                                        </DropdownMenuItem>
                                      ),
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <span {...reorder.getLiveRegionProps()} />
    </div>
  );
}
