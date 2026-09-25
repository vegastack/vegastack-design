// @vegastack board@0.23.35 sha256-Sw9ezFrpDefyGBWmGk+Bw2RpHE4c5Z2sdF7l5qW0S1k=

"use client";

import * as React from "react";
import {
  EllipsisVertical,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  defaultActionsLabel,
  pickShortcut,
  RowActionMenuItems,
  type RowAction,
} from "@/components/ui/data-table-parts";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { LoadMore, type LoadMoreProps } from "@/components/ui/load-more";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { TruncationFocusProvider } from "@/components/ui/truncated-text";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";
import { useIsMobile } from "@/components/ui/use-mobile";
import {
  edgeScroll,
  usePointerDrag,
  type DragReorderMove,
  type PointerDragPoint,
} from "@/components/ui/use-drag-reorder";

// Bundlers replace `process.env.NODE_ENV` at build time; declared here so consumers without
// @types/node still type-check the dev-only warning below.
declare const process: { env: { NODE_ENV?: string } };

/* ---
`Board` owns the lanes, the drag and move model, the keyboard equivalent, and the
optimistic/rollback affordances — the host renders card CONTENT only (a `BoardCard`, usually) and
owns the move command. The component owns all chrome: lane shells, sticky headers, counts, the
collapse strip, empty drop zones, skeletons, paging, the add button, the lifted card and the gap.

Layout. By default the board FILLS the viewport below where it starts (`height="fill"`): lanes run
to the bottom of the screen and their cards scroll inside them, so the page itself never scrolls.
Lanes are 320px with a 12px gap and grow to share a wide screen. The board scrolls sideways with a
hidden scrollbar and edge fades. Below 768px it shows one lane at a time at full width: a swipe
moves between lanes (scroll snap) and a lane strip above names each lane with its count.

Drag. `usePointerDrag` (in `use-drag-reorder`) is the gesture: a 4px mouse drag or a 250ms touch
long-press. The card lifts (fixed to the viewport, not portalled) with a shadow and a slight tilt, a gap opens where it
would land and the cards around it slide to make room (FLIP, Web Animations), and on release it
settles into the gap before the move commits. Lanes and the board auto-scroll near their edges;
on a phone, holding a card at the screen edge turns to the next lane. Reduced motion drops every
transition and the tilt — the card still follows the pointer.

Keyboard. Space picks the focused card up, the arrows move it (↑/↓ within the lane, ←/→ across),
Space drops it and Escape puts it back — nothing is committed until the drop, and every step is
announced. `M` opens the card's ⋯ menu (its own actions — the menu lists no Move items).

Moves are optimistic: the card lands at once, `onMove` runs, and when its promise rejects the card
snaps back, the rejection is announced and an error toast says so (the app mounts `Toaster`).

Deliberately NOT done here:
- No data behaviour: ordering, persistence and the move command are the host's.
- No virtualization — lanes page with `loadMore` instead.
- No focus ring (FOC-13): the focus cue on a card is the system background tint.
--- */

/** The copy of an empty lane's design-system `Empty`. */
export interface BoardEmpty {
  /**
   * The icon.
   * @default <Inbox />
   */
  icon?: React.ReactNode;
  /**
   * The title.
   * @default "Nothing here"
   */
  title?: React.ReactNode;
  /**
   * A short line under the title. A locked lane (`droppable: false`) shows its `lockedReason`.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * An action under the text, e.g. a small "Add task" button.
   * @default undefined
   */
  action?: React.ReactNode;
}

/** One board column (lane). */
export interface BoardColumn<T> {
  /** Stable column id — the container identity moves target. */
  id: string;
  /** Column heading content. */
  title: React.ReactNode;
  /**
   * Plain-text lane name — used in the lane's accessible name and every
   * announcement. Required when `title` is not a string (a
   * `Badge`, an icon + text): the board cannot read a name out of a node, and
   * warns in development when it has to fall back to the column `id`.
   * @default the `title` when it is a string
   */
  label?: string;
  /** Cards in display order (controlled) — the loaded cards of a paged lane. */
  items: readonly T[];
  /**
   * The lane's total, when it holds more than it has loaded. Shown as the
   * lane's muted count and spoken in its name ("Open, 14 tasks").
   * @default items.length
   */
  count?: number;
  /**
   * The lane is fetching: skeleton cards show below any loaded cards (in
   * place of the empty state) and the lane is `aria-busy`.
   * @default false
   */
  loading?: boolean;
  /**
   * An empty lane's copy: the design-system `Empty` it shows at rest (an Inbox icon and
   * "Nothing here" by default). Pass only what this lane needs to say differently.
   * @default undefined
   */
  empty?: BoardEmpty;
  /**
   * Replace the empty lane's `Empty` with your own node. Prefer `empty`, which keeps the
   * standard look. While a card is being dragged an empty droppable lane always shows the
   * "Drop here" zone.
   * @default undefined
   */
  emptyState?: React.ReactNode;
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
   * Start collapsed to a narrow strip (terminal columns). Activating the
   * strip expands the column read-only: cards show but do not drag, and it is
   * not a drop target.
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * Alias of `defaultCollapsed`, kept for existing boards.
   * @deprecated Use `defaultCollapsed`.
   * @default false
   */
  collapsed?: boolean;
  /**
   * Keyset paging for this lane. The lane loads its next batch as its foot scrolls into view,
   * and the shared `LoadMore` button stays at the foot as the fallback and the retry after an
   * error.
   * @default undefined
   */
  loadMore?: Omit<LoadMoreProps, "className" | "ref">;
  /**
   * Show the "+ Add" button at this lane's foot (when the board has `onAdd`).
   * @default true
   */
  addable?: boolean;
}

/** Props accepted by `Board`. */
export interface BoardProps<T> {
  /** Columns in display order. */
  columns: readonly BoardColumn<T>[];
  /** Stable card identity. */
  getItemId: (item: T) => string;
  /**
   * Render a card's CONTENT only — the board owns the card chrome (surface,
   * border, focus, drag affordances). A `BoardCard` with `surface={false}` is the standard content.
   */
  renderCard: (item: T, column: BoardColumn<T>) => React.ReactNode;
  /**
   * Apply a move (drag, keyboard, or menu). The card moves at once; return a promise for a
   * server-gated move — the card shimmers while it is pending, and a rejection snaps it back,
   * announces it and raises an error toast.
   */
  onMove: (move: DragReorderMove) => void | Promise<void>;
  /**
   * Plain-text card name — used in the card's accessible name, its menu control ("Move Write
   * spec") and in move announcements. Without it the card is named by its content, the control
   * is "Move card" and announcements say "card".
   * @default undefined
   */
  getItemLabel?: (item: T) => string;
  /**
   * A card's own actions (open, edit, archive), listed in its ⋯ menu — one menu per card.
   * A card with no actions shows no ⋯.
   * @default undefined
   */
  getItemActions?: (item: T) => RowAction[];
  /**
   * Accessible name of a card's ⋯ trigger when the card has actions, from its `getItemLabel`.
   * @default (label) => `Actions for ${label}`
   */
  actionsLabel?: (label: string) => string;
  /**
   * The lane's count in words, for the lane's accessible name ("Open, 14
   * tasks"). Name the host's noun here.
   * @default (n) => n === 1 ? "1 card" : `${n} cards`
   */
  countLabel?: (n: number) => string;
  /**
   * Make a card a real link. A card with an href renders as an `<a>` (or
   * `itemLinkRender`): a click, Enter, and every modifier click are the
   * browser's own, and `onCardActivate` is not called for it. Space still
   * picks it up.
   * @default undefined
   */
  getItemHref?: (item: T) => string | undefined;
  /**
   * The element a card link renders — a router link such as `<Link />`. It
   * receives the `href` and the board's props.
   * @default <a />
   */
  itemLinkRender?: React.ReactElement;
  /**
   * Activate a card (open its record). Cards without an href are real
   * buttons; a card with one is a link and never calls this.
   * @default undefined
   */
  onCardActivate?: (item: T) => void;
  /**
   * Show "+ Add" at each lane's foot and call this with the lane's id — the host opens its create
   * form with the lane's status filled in.
   * @default undefined
   */
  onAdd?: (columnId: string) => void;
  /**
   * The add button's label ("Add task").
   * @default "Add card"
   */
  addLabel?: string | ((column: BoardColumn<T>) => string);
  /**
   * Let the user collapse a lane to a slim strip from its header's ⋯ menu.
   * @default true
   */
  collapsible?: boolean;
  /**
   * The collapsed lanes' ids, controlled. Pair with `onCollapsedChange`.
   * @default undefined
   */
  collapsedColumns?: readonly string[];
  /**
   * Called with the collapsed lanes' ids when the user collapses or expands one.
   * @default undefined
   */
  onCollapsedChange?: (ids: string[]) => void;
  /**
   * A lane's own actions, listed in its header's ⋯ menu; the ⋯ hides when a lane has none. Collapse is its own icon button left of the ⋯.
   * @default undefined
   */
  getColumnActions?: (column: BoardColumn<T>) => RowAction[];
  /**
   * Raise an error toast when `onMove` rejects. A function builds the toast's title from the
   * card's label; `false` leaves the rejection to the announcement alone.
   * @default (label) => `Couldn't move ${label}`
   */
  moveErrorToast?: false | ((label: string, error: unknown) => React.ReactNode);
  /**
   * The board's height: `"fill"` runs the lanes from where the board starts to the bottom of the
   * viewport (cards scroll inside each lane, the page does not scroll); `"auto"` sizes lanes to
   * their cards up to `columnMaxHeight`; any other value is a CSS length.
   * @default "fill", or "auto" when `columnMaxHeight` is set
   */
  height?: "fill" | "auto" | (string & {});
  /**
   * Space kept below a `"fill"` board, as a CSS length — the page's bottom padding.
   * @default "1rem"
   */
  fillOffset?: string;
  /**
   * Every lane's width as a CSS length. Lanes keep it whatever the board's width and however
   * many lanes are collapsed (the board scrolls sideways when they overflow); on a phone each
   * lane takes the full width.
   * @default "20rem"
   */
  columnWidth?: string;
  /**
   * Maximum height of a lane's card list on an `"auto"` board, as a CSS length.
   * @default "calc(100dvh - 16rem)"
   */
  columnMaxHeight?: string;
  /**
   * Extra per-column header action (a filter menu, an add button) rendered
   * in the lane header, before its ⋯ menu.
   * @default undefined
   */
  renderColumnAction?: (column: BoardColumn<T>) => React.ReactNode;
  /**
   * Turn off pointer and touch dragging (the keyboard move and the menu remain).
   * @default false
   */
  dragDisabled?: boolean;
  /**
   * Turn off every move — drag and keyboard. Cards still open and keep their
   * own actions.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Accessible name for the board.
   * @default "Board"
   */
  "aria-label"?: string;
  /**
   * Extra classes for the board root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the board root (`data-slot="board"`).
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

type Lists = Record<string, string[]>;
interface Position {
  container: string;
  index: number;
}

/** The plain-text name of a lane: its `label`, else a string `title`, else its `id`. */
function laneLabel<T>(column: BoardColumn<T>): string {
  if (column.label !== undefined) return column.label;
  return typeof column.title === "string" ? column.title : column.id;
}

/** Sentence case for a label that opens an announcement. */
function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "1 card" / "4 cards" — the lane's count in words. */
function cardCount(n: number): string {
  return `${n} ${n === 1 ? "card" : "cards"}`;
}

/** `lists` with `id` moved to `to` (its index counted without the card itself). */
function moveInLists(lists: Lists, id: string, to: Position): Lists {
  const next: Lists = {};
  for (const [key, ids] of Object.entries(lists))
    next[key] = ids.filter((other) => other !== id);
  const target = next[to.container] ?? [];
  const index = Math.max(0, Math.min(to.index, target.length));
  next[to.container] = [...target.slice(0, index), id, ...target.slice(index)];
  return next;
}

function positionIn(lists: Lists, id: string): Position | null {
  for (const [container, ids] of Object.entries(lists)) {
    const index = ids.indexOf(id);
    if (index !== -1) return { container, index };
  }
  return null;
}

/** Props for the internal card surface. */
interface BoardCardSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  href?: string;
  linkRender?: React.ReactElement;
  ref?: React.Ref<HTMLElement>;
}

/**
 * The card's activator, stretched over the card beneath its content: a `role="button"` div, or —
 * with an `href` — a link rendered through `linkRender` (default `<a />`). The card's own props
 * (its `href` above all) win over the link template's, exactly as `DataList`'s row link does.
 */
function BoardCardSurface({
  href,
  linkRender,
  ref,
  ...props
}: BoardCardSurfaceProps) {
  const template = href ? (linkRender ?? <a />) : undefined;
  return useRender({
    defaultTagName: "div",
    render: template
      ? (renderProps) => {
          const own = template.props as { ref?: React.Ref<HTMLElement> };
          return React.cloneElement(template, {
            ...(mergeProps(own as object, renderProps) as object),
            // `mergeProps` does not merge refs: the template's own ref and the card's both land.
            ref: mergeRefs(
              own.ref,
              (renderProps as { ref?: React.Ref<HTMLElement> }).ref,
            ),
          } as object);
        }
      : undefined,
    ref,
    props: mergeProps<"div">(
      href
        ? ({ href, draggable: false } as React.ComponentProps<"div">)
        : { role: "button" },
      props,
    ),
  });
}

/** The card chrome, shared by a resting card and the lifted one. */
const cardClasses =
  "group/board-card relative flex min-w-0 flex-col rounded-lg border border-border bg-card p-3 text-start text-sm text-card-foreground transition-colors select-none [-webkit-touch-callout:none]";

/** Loads a lane's next batch when its foot scrolls into view. */
function LaneAutoLoad({
  loadMore,
  root,
}: {
  loadMore: Omit<LoadMoreProps, "className" | "ref">;
  root: HTMLElement | null;
}) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const latest = React.useRef(loadMore);
  latest.current = loadMore;
  React.useEffect(() => {
    const node = sentinel.current;
    if (!node || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const state = latest.current;
        if (
          entries.some((entry) => entry.isIntersecting) &&
          state.hasMore &&
          !state.loading &&
          !state.error
        )
          state.onLoadMore();
      },
      { root, rootMargin: "0px 0px 160px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [root, loadMore.hasMore, loadMore.loading, loadMore.error]);
  return (
    <div
      ref={sentinel}
      aria-hidden="true"
      data-slot="board-column-sentinel"
      className="h-px shrink-0"
    />
  );
}

/**
 * `Board` — kanban lanes: full-height lanes whose cards scroll inside them, sticky lane headers
 * with a collapse menu, "+ Add" at each lane's foot, empty lanes as a design-system `Empty` ("Nothing here") and a "Drop here" zone while dragging,
 * per-lane skeletons and load-on-scroll paging. Cards drag live (a mouse drag, or a 250ms touch
 * long-press) with lift, make-room and settle motion and edge auto-scroll; Space, the arrows,
 * Space and Escape move them from the keyboard; every card's ⋯ menu lists its actions. Moves are optimistic and roll back with a toast when `onMove` rejects. On a phone it
 * shows one lane at a time with a lane strip. The host renders card content and owns the move.
 *
 * @example
 * <Board
 *   aria-label="Tasks"
 *   columns={statuses.map((s) => ({ id: s.id, title: s.label, items: tasksBy[s.id] }))}
 *   getItemId={(task) => task.id}
 *   getItemLabel={(task) => task.title}
 *   renderCard={(task) => <BoardCard surface={false} title={task.title} due={task.dueAt} />}
 *   onMove={({ id, to }) => api.moveTask(id, to.container, to.index)}
 *   onAdd={(status) => openCreate({ status })}
 *   addLabel="Add task"
 * />
 */
export function Board<T>({
  columns,
  getItemId,
  renderCard,
  onMove,
  getItemLabel,
  getItemActions,
  actionsLabel = defaultActionsLabel,
  countLabel = cardCount,
  getItemHref,
  itemLinkRender,
  onCardActivate,
  onAdd,
  addLabel = "Add card",
  collapsible = true,
  collapsedColumns,
  onCollapsedChange,
  getColumnActions,
  moveErrorToast = (label) => `Couldn't move ${label}`,
  height,
  fillOffset = "1rem",
  columnWidth = "20rem",
  columnMaxHeight,
  renderColumnAction,
  dragDisabled = false,
  readOnly: boardReadOnly = false,
  "aria-label": ariaLabel = "Board",
  className,
  ref,
}: BoardProps<T>) {
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const { announce, Announcer } = useAnnouncer();
  const resolvedHeight = height ?? (columnMaxHeight ? "auto" : "fill");
  const fill = resolvedHeight !== "auto";

  // ---- collapse -------------------------------------------------------------------------------
  const declaredCollapsed = (column: BoardColumn<T>) =>
    column.defaultCollapsed ?? column.collapsed ?? false;
  const [ownCollapsed, setOwnCollapsed] = React.useState<readonly string[]>(
    () => columns.filter(declaredCollapsed).map((column) => column.id),
  );
  const collapsedIds = collapsedColumns ?? ownCollapsed;
  const setCollapsed = (id: string, collapse: boolean) => {
    const next = collapse
      ? [...collapsedIds.filter((other) => other !== id), id]
      : collapsedIds.filter((other) => other !== id);
    if (collapsedColumns === undefined) setOwnCollapsed(next);
    onCollapsedChange?.(next);
  };
  const isCollapsed = (column: BoardColumn<T>) =>
    collapsedIds.includes(column.id);
  /** Columns declared collapsed stay read-only even while expanded to view. */
  const isReadOnly = (column: BoardColumn<T>) =>
    boardReadOnly || declaredCollapsed(column);
  const canReceive = (column: BoardColumn<T>) =>
    column.droppable !== false && !isReadOnly(column);

  /** "Open, 14 tasks" — the lane's accessible name, from its total. */
  const laneName = (column: BoardColumn<T>) =>
    `${laneLabel(column)}, ${countLabel(column.count ?? column.items.length)}`;

  // A lane whose title is a node has no name to read unless the host gives one.
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    for (const column of columns)
      if (column.label === undefined && typeof column.title !== "string")
        console.warn(
          `Board: column "${column.id}" has a non-string title and no \`label\`; its accessible name falls back to the id.`,
        );
  }, [columns]);

  // ---- lists: the host's, an optimistic move over them, and a drag over that ------------------
  const baseLists = React.useMemo(() => {
    const record: Lists = {};
    for (const column of columns)
      record[column.id] = column.items.map(getItemId);
    return record;
  }, [columns, getItemId]);
  const baseSignature = JSON.stringify(baseLists);
  const itemsById = React.useMemo(() => {
    const map = new Map<string, { item: T; column: BoardColumn<T> }>();
    for (const column of columns)
      for (const item of column.items)
        map.set(getItemId(item), { item, column });
    return map;
  }, [columns, getItemId]);
  const columnsById = new Map(columns.map((column) => [column.id, column]));

  // An optimistic move holds until the host's data changes (it applied the move, or something
  // newer arrived) or the move is rejected.
  const [optimistic, setOptimistic] = React.useState<{
    lists: Lists;
    base: string;
  } | null>(null);
  const lists =
    optimistic && optimistic.base === baseSignature
      ? optimistic.lists
      : baseLists;
  const listsRef = React.useRef(lists);
  listsRef.current = lists;
  const [pendingIds, setPendingIds] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const cardLabel = (id: string) => {
    const entry = itemsById.get(id);
    return entry && getItemLabel ? getItemLabel(entry.item) : "card";
  };
  const laneLabelById = (container: string) => {
    const column = columnsById.get(container);
    return column ? laneLabel(column) : container;
  };

  const commitMove = (move: DragReorderMove) => {
    if (
      move.from.container === move.to.container &&
      move.from.index === move.to.index
    )
      return;
    const next = moveInLists(listsRef.current, move.id, move.to);
    setOptimistic({ lists: next, base: baseSignature });
    const count = next[move.to.container]?.length ?? 0;
    const label = cardLabel(move.id);
    announce(
      move.from.container === move.to.container
        ? `Moved ${label} to position ${move.to.index + 1} of ${count}`
        : `Moved ${label} to ${laneLabelById(move.to.container)}, position ${move.to.index + 1} of ${count}`,
    );
    let result: void | Promise<void>;
    try {
      result = onMove(move);
    } catch (error) {
      result = Promise.reject(error);
    }
    if (result == null || typeof result.then !== "function") return;
    setPendingIds((prev) => new Set(prev).add(move.id));
    const settle = () =>
      setPendingIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(move.id);
        return nextSet;
      });
    result.then(settle, (error: unknown) => {
      settle();
      setOptimistic(null);
      announce(
        `Move rejected — ${label} stays in ${laneLabelById(move.from.container)}`,
      );
      if (moveErrorToast !== false)
        toast.add({
          type: "error",
          title: moveErrorToast(label, error),
          description: error instanceof Error ? error.message : undefined,
        });
    });
  };

  // ---- keyboard move (a ghost position, committed on drop) ------------------------------------
  const [lifted, setLifted] = React.useState<{
    id: string;
    from: Position;
    to: Position;
  } | null>(null);
  const liftedRef = React.useRef(lifted);
  liftedRef.current = lifted;

  // ---- pointer drag ---------------------------------------------------------------------------
  const [drag, setDrag] = React.useState<{
    id: string;
    from: Position;
    over: Position | null;
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const dragRef = React.useRef(drag);
  dragRef.current = drag;
  const dragGeometry = React.useRef({ offsetX: 0, offsetY: 0 });
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const laneBodies = React.useRef(new Map<string, HTMLElement>());
  const [laneBodyNodes, setLaneBodyNodes] = React.useState<
    Record<string, HTMLElement | null>
  >({});
  const edgeDwell = React.useRef<{ side: -1 | 1; since: number } | null>(null);
  const [settling, setSettling] = React.useState(false);

  // What the lanes show: the committed (or optimistic) lists, the keyboard ghost, the pointer gap.
  const display: Lists = lifted
    ? moveInLists(lists, lifted.id, lifted.to)
    : drag
      ? Object.fromEntries(
          Object.entries(lists).map(([key, ids]) => [
            key,
            ids.filter((id) => id !== drag.id),
          ]),
        )
      : lists;

  const placeOverlay = (point: PointerDragPoint) => {
    const node = overlayRef.current;
    if (!node) return;
    node.style.setProperty(
      "--drag-x",
      `${point.x - dragGeometry.current.offsetX}px`,
    );
    node.style.setProperty(
      "--drag-y",
      `${point.y - dragGeometry.current.offsetY}px`,
    );
  };

  /** Which lane and slot the pointer is over, or null outside every droppable lane. */
  const hitTest = (point: PointerDragPoint): Position | null => {
    const current = dragRef.current;
    if (!current) return null;
    const under = document.elementFromPoint(point.x, point.y);
    const laneNode = under?.closest<HTMLElement>("[data-board-lane]");
    if (!laneNode || !scrollerRef.current?.contains(laneNode)) return null;
    const container = laneNode.dataset.boardLane!;
    const column = columnsById.get(container);
    if (!column || !canReceive(column)) return null;
    const ids = (listsRef.current[container] ?? []).filter(
      (id) => id !== current.id,
    );
    const body = laneBodies.current.get(container);
    if (!body || laneNode.hasAttribute("data-board-strip"))
      return { container, index: ids.length };
    const origin = body.getBoundingClientRect().top - body.scrollTop;
    let index = 0;
    for (const card of body.querySelectorAll<HTMLElement>(
      "[data-board-card-id]",
    )) {
      if (origin + card.offsetTop + card.offsetHeight / 2 < point.y) index += 1;
      else break;
    }
    return { container, index: Math.min(index, ids.length) };
  };

  const pointerDrag = usePointerDrag({
    disabled: dragDisabled,
    onStart: (id, element, point) => {
      if (liftedRef.current) return false;
      const from = positionIn(listsRef.current, id);
      const owner = itemsById.get(id)?.column;
      if (!from || !owner || isReadOnly(owner)) return false;
      const rect = element.getBoundingClientRect();
      dragGeometry.current = {
        offsetX: point.x - rect.left,
        offsetY: point.y - rect.top,
      };
      setDrag({
        id,
        from,
        over: from,
        width: rect.width,
        height: rect.height,
        x: rect.left,
        y: rect.top,
      });
      announce(
        `Picked up ${cardLabel(id)} in ${laneLabelById(from.container)}. Release over a lane to drop it, or press Escape to cancel`,
      );
      return true;
    },
    onFrame: (point) => {
      placeOverlay(point);
      const scroller = scrollerRef.current;
      if (scroller) {
        if (isMobile) {
          // On a phone the board shows one lane: holding the card at the screen edge turns to the
          // next lane, one lane per dwell.
          const rect = scroller.getBoundingClientRect();
          const side =
            point.x < rect.left + 24 ? -1 : point.x > rect.right - 24 ? 1 : 0;
          if (side === 0) edgeDwell.current = null;
          else if (!edgeDwell.current || edgeDwell.current.side !== side)
            edgeDwell.current = { side, since: performance.now() };
          else if (performance.now() - edgeDwell.current.since > 450) {
            const direction =
              getComputedStyle(scroller).direction === "rtl" ? -side : side;
            scroller.scrollBy({
              left: direction * scroller.clientWidth,
              behavior: reducedMotion ? "auto" : "smooth",
            });
            edgeDwell.current = { side, since: performance.now() + 400 };
          }
        } else {
          edgeScroll(scroller, point, "x");
        }
      }
      const over = hitTest(point);
      const body = over ? laneBodies.current.get(over.container) : undefined;
      if (body) edgeScroll(body, point, "y");
      const current = dragRef.current;
      if (
        current &&
        (current.over?.container !== over?.container ||
          current.over?.index !== over?.index)
      )
        setDrag({ ...current, over });
    },
    onDrop: () => {
      const current = dragRef.current;
      if (!current) return;
      const target = current.over;
      const finish = () => {
        setSettling(false);
        setDrag(null);
        if (target)
          commitMove({
            id: current.id,
            from: current.from,
            to: target,
            input: "pointer",
          });
        else announce(`${upperFirst(cardLabel(current.id))} returned`);
      };
      const gap = document.querySelector<HTMLElement>(
        '[data-slot="board-card-placeholder"]',
      );
      const overlay = overlayRef.current;
      if (reducedMotion || !gap || !overlay || !target) {
        finish();
        return;
      }
      // Settle: glide the lifted card into its gap, then commit.
      const rect = gap.getBoundingClientRect();
      setSettling(true);
      overlay.style.setProperty("--drag-x", `${rect.left}px`);
      overlay.style.setProperty("--drag-y", `${rect.top}px`);
      window.setTimeout(finish, 180);
    },
    onCancel: () => {
      const current = dragRef.current;
      setDrag(null);
      if (current)
        announce(
          `Move cancelled. ${upperFirst(cardLabel(current.id))} stays in ${laneLabelById(current.from.container)}`,
        );
    },
  });

  // ---- roving focus across the ragged card grid -----------------------------------------------
  const [activeCard, setActiveCard] = React.useState<string | null>(null);
  const [openMenuCard, setOpenMenuCard] = React.useState<string | null>(null);
  // Card activators (focus targets) and card nodes (the FLIP and hit-test boxes), by card id. One
  // stable ref callback per card: an inline arrow would detach and re-attach on every render.
  const cardRefs = React.useRef(new Map<string, HTMLElement>());
  const cardNodes = React.useRef(new Map<string, HTMLElement>());
  const refCallbacks = React.useRef(
    new Map<string, (node: HTMLElement | null) => void>(),
  );
  const stableRef = (
    kind: "surface" | "node",
    id: string,
  ): ((node: HTMLElement | null) => void) => {
    const key = `${kind}:${id}`;
    let callback = refCallbacks.current.get(key);
    if (!callback) {
      const map = kind === "surface" ? cardRefs.current : cardNodes.current;
      callback = (node) => {
        if (node) map.set(id, node);
        else if (map.get(id)?.isConnected !== true) map.delete(id);
      };
      refCallbacks.current.set(key, callback);
    }
    return callback;
  };
  const uid = React.useId();
  const contentId = (id: string) => `${uid}-card-${encodeURIComponent(id)}`;
  const visibleColumns = columns.filter((column) => !isCollapsed(column));
  const firstCardId = visibleColumns.flatMap(
    (column) => display[column.id] ?? [],
  )[0];
  const activeCardStillVisible =
    activeCard !== null &&
    visibleColumns.some((column) =>
      (display[column.id] ?? []).includes(activeCard),
    );
  const rovingTarget =
    (activeCardStillVisible ? activeCard : null) ?? firstCardId ?? null;

  const focusCard = React.useCallback((id: string | undefined) => {
    if (!id) return;
    setActiveCard(id);
    cardRefs.current.get(id)?.focus();
  }, []);

  // A keyboard move re-parents the card when it changes lane; keep focus on it.
  React.useLayoutEffect(() => {
    if (!lifted) return;
    const node = cardRefs.current.get(lifted.id);
    if (node && document.activeElement !== node) node.focus();
    node?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [lifted]);

  // ---- make room: slide cards that moved within their lane (FLIP) -----------------------------
  const lastTops = React.useRef(
    new Map<string, { lane: string; top: number }>(),
  );
  React.useLayoutEffect(() => {
    const next = new Map<string, { lane: string; top: number }>();
    for (const [id, node] of cardNodes.current) {
      if (!node.isConnected) continue;
      const lane = node.dataset.lane ?? "";
      const top = node.offsetTop;
      next.set(id, { lane, top });
      const before = lastTops.current.get(id);
      if (
        !reducedMotion &&
        before &&
        before.lane === lane &&
        before.top !== top &&
        typeof node.animate === "function"
      )
        node.animate(
          [
            { transform: `translateY(${before.top - top}px)` },
            { transform: "translateY(0)" },
          ],
          { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
    }
    lastTops.current = next;
  });

  const liftCard = (id: string) => {
    const from = positionIn(listsRef.current, id);
    if (!from) return;
    setLifted({ id, from, to: from });
    const count = listsRef.current[from.container]?.length ?? 0;
    announce(
      `Picked up ${cardLabel(id)}, position ${from.index + 1} of ${count} in ${laneLabelById(from.container)}. Use the arrow keys to move, Space to drop, Escape to cancel`,
    );
  };
  const dropLifted = () => {
    const current = liftedRef.current;
    if (!current) return;
    setLifted(null);
    if (
      current.from.container === current.to.container &&
      current.from.index === current.to.index
    ) {
      announce(
        `Dropped ${cardLabel(current.id)}. ${upperFirst(laneLabelById(current.to.container))}, position ${current.to.index + 1}, unchanged`,
      );
      return;
    }
    commitMove({ ...current, input: "keyboard" });
  };
  const cancelLifted = () => {
    const current = liftedRef.current;
    if (!current) return;
    setLifted(null);
    announce(
      `Move cancelled. ${upperFirst(cardLabel(current.id))} returned to ${laneLabelById(current.from.container)}, position ${current.from.index + 1}`,
    );
  };
  const stepLifted = (key: string, rtl: boolean) => {
    const current = liftedRef.current;
    if (!current) return;
    const ghost = moveInLists(listsRef.current, current.id, current.to);
    let to = current.to;
    if (key === "ArrowUp" || key === "ArrowDown") {
      const count = ghost[to.container]?.length ?? 1;
      const index = Math.max(
        0,
        Math.min(to.index + (key === "ArrowUp" ? -1 : 1), count - 1),
      );
      to = { container: to.container, index };
    } else {
      const logical = key === "ArrowRight" ? 1 : -1;
      const delta = rtl ? -logical : logical;
      const targets = columns.filter(
        (column) =>
          !isCollapsed(column) &&
          (canReceive(column) || column.id === current.from.container),
      );
      const at = targets.findIndex((column) => column.id === to.container);
      const next = targets[at + delta];
      if (!next) return;
      const count = (ghost[next.id] ?? []).filter(
        (id) => id !== current.id,
      ).length;
      to = { container: next.id, index: Math.min(to.index, count) };
    }
    if (to.container === current.to.container && to.index === current.to.index)
      return;
    setLifted({ ...current, to });
    const count =
      (ghost[to.container] ?? []).filter((id) => id !== current.id).length + 1;
    announce(
      `${upperFirst(laneLabelById(to.container))}, position ${to.index + 1} of ${count}`,
    );
  };

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    column: BoardColumn<T>,
    index: number,
    id: string,
    href: string | undefined,
    item: T,
  ) => {
    if (lifted?.id === id) {
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      switch (event.key) {
        case " ":
        case "Enter":
          event.preventDefault();
          dropLifted();
          return;
        case "Escape":
          event.preventDefault();
          cancelLifted();
          return;
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          event.preventDefault();
          stepLifted(event.key, rtl);
          return;
        case "Tab":
          cancelLifted();
          return;
        default:
          return;
      }
    }
    const laneIds = display[column.id] ?? [];
    const columnIndex = visibleColumns.findIndex((c) => c.id === column.id);
    switch (event.key) {
      case "Enter":
        if (href) return;
        event.preventDefault();
        onCardActivate?.(item);
        break;
      case " ":
        event.preventDefault();
        if (!isReadOnly(column) && !lifted) liftCard(id);
        break;
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        focusCard(
          laneIds[Math.max(0, Math.min(index + delta, laneIds.length - 1))],
        );
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        event.preventDefault();
        const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const logical = event.key === "ArrowRight" ? 1 : -1;
        const delta = isRtl ? -logical : logical;
        const next = visibleColumns[columnIndex + delta];
        const ids = next ? (display[next.id] ?? []) : [];
        if (ids.length === 0) return;
        focusCard(ids[Math.min(index, ids.length - 1)]);
        break;
      }
      case "Home":
        event.preventDefault();
        focusCard(laneIds[0]);
        break;
      case "End":
        event.preventDefault();
        focusCard(laneIds.at(-1));
        break;
      case "m":
      case "M":
        event.preventDefault();
        setOpenMenuCard(id);
        break;
      default:
        break;
    }
  };

  // ---- layout: fill the viewport, edge fades, the phone's lane strip ---------------------------
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [fillTop, setFillTop] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || resolvedHeight !== "fill") return;
    const measure = () => {
      const top = Math.max(
        0,
        Math.round(root.getBoundingClientRect().top + window.scrollY),
      );
      setFillTop((prev) => (prev === top ? prev : top));
    };
    measure();
    window.addEventListener("resize", measure);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    if (root.parentElement) observer?.observe(root.parentElement);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [resolvedHeight]);
  const boardHeight =
    resolvedHeight === "fill"
      ? `max(20rem, calc(100dvh - ${fillTop ?? 0}px - ${fillOffset}))`
      : resolvedHeight;

  const [fades, setFades] = React.useState({ start: false, end: false });
  const [activeLane, setActiveLane] = React.useState(0);
  const onScrollerScroll = React.useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrolled = Math.abs(scroller.scrollLeft);
    const max = scroller.scrollWidth - scroller.clientWidth;
    const next = { start: scrolled > 1, end: scrolled < max - 1 };
    setFades((prev) =>
      prev.start === next.start && prev.end === next.end ? prev : next,
    );
    if (scroller.clientWidth > 0)
      setActiveLane(Math.round(scrolled / (scroller.clientWidth + 12)));
  }, []);
  React.useEffect(() => {
    onScrollerScroll();
    const scroller = scrollerRef.current;
    if (!scroller || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(onScrollerScroll);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [onScrollerScroll, columns.length]);
  const showLane = (index: number) => {
    const scroller = scrollerRef.current;
    const lane =
      scroller?.querySelectorAll<HTMLElement>("[data-board-lane]")[index];
    if (!scroller || !lane) return;
    lane.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  const laneBodyRef = (id: string) => (node: HTMLElement | null) => {
    if (node) laneBodies.current.set(id, node);
    else laneBodies.current.delete(id);
    setLaneBodyNodes((prev) =>
      prev[id] === node ? prev : { ...prev, [id]: node },
    );
  };
  const laneBodyRefs = React.useRef(
    new Map<string, (node: HTMLElement | null) => void>(),
  );
  const stableLaneBodyRef = (id: string) => {
    let callback = laneBodyRefs.current.get(id);
    if (!callback) {
      callback = laneBodyRef(id);
      laneBodyRefs.current.set(id, callback);
    }
    return callback;
  };

  const dragging = drag !== null;
  const dragItem = drag ? itemsById.get(drag.id) : undefined;

  const renderCardItem = (
    column: BoardColumn<T>,
    id: string,
    index: number,
    laneIds: readonly string[],
  ) => {
    const entry = itemsById.get(id);
    if (!entry) return null;
    const { item } = entry;
    const readOnly = isReadOnly(column);
    const itemActions = getItemActions?.(item) ?? [];
    const href = getItemHref?.(item);
    const canDrag = !dragDisabled && !readOnly;
    const hasMenu = itemActions.length > 0;
    const isLifted = lifted?.id === id;
    const label = getItemLabel?.(item);
    const menuLabel = label ? actionsLabel(label) : "Card actions";
    return (
      <div
        key={id}
        role="listitem"
        ref={stableRef("node", id)}
        data-slot="board-card"
        data-board-card-id={id}
        data-lane={column.id}
        data-lifted={isLifted ? "" : undefined}
        data-drag-pending={pendingIds.has(id) ? "" : undefined}
        {...(canDrag ? pointerDrag.getSourceProps(id) : {})}
        className={cn(
          cardClasses,
          "hover:bg-accent/50 has-[[data-slot=board-card-surface]:focus-visible]:bg-accent",
          canDrag && "cursor-grab touch-manipulation",
          "data-drag-pending:animate-pulse",
          "data-lifted:z-10 data-lifted:bg-card data-lifted:shadow-lg motion-safe:data-lifted:rotate-1",
        )}
      >
        <BoardCardSurface
          href={href}
          linkRender={itemLinkRender}
          tabIndex={rovingTarget === id ? 0 : -1}
          data-slot="board-card-surface"
          data-drag-surface=""
          aria-label={label}
          aria-labelledby={label ? undefined : contentId(id)}
          aria-roledescription={canDrag ? "Draggable card" : undefined}
          aria-pressed={href ? undefined : isLifted}
          ref={stableRef("surface", id)}
          onFocus={() => setActiveCard(id)}
          onBlur={() => {
            if (liftedRef.current?.id !== id) return;
            // A lane change re-parents the card and focus follows it; only a real blur cancels.
            requestAnimationFrame(() => {
              const node = cardRefs.current.get(id);
              const focused = document.activeElement;
              if (
                liftedRef.current?.id === id &&
                focused !== node &&
                focused !== document.body &&
                focused !== null
              )
                cancelLifted();
            });
          }}
          onKeyDown={(event: React.KeyboardEvent<HTMLElement>) =>
            handleCardKeyDown(event, column, index, id, href, item)
          }
          onClick={href ? undefined : () => onCardActivate?.(item)}
          className="absolute inset-0 rounded-[inherit] outline-none"
        />
        {/* Content sits above the activator but lets the pointer through to it; its own
            controls (a done tick) stay clickable. One tab stop per card: truncated text in the
            content must not add its own. */}
        <div
          id={contentId(id)}
          data-slot="board-card-body"
          className={cn(
            "pointer-events-none relative min-w-0 [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_[role=checkbox]]:pointer-events-auto",
            hasMenu && "pe-6",
          )}
        >
          <TruncationFocusProvider focusable={false}>
            {renderCard(item, column)}
          </TruncationFocusProvider>
        </div>
        {!hasMenu ? null : (
          <DropdownMenu
            open={openMenuCard === id}
            onOpenChange={(open) => setOpenMenuCard(open ? id : null)}
          >
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={menuLabel}
                  // One card-layer tab stop per board: M (or Tab from the active card) reaches
                  // the menu.
                  tabIndex={rovingTarget === id ? 0 : -1}
                  className="absolute end-2 top-2 z-10 opacity-0 transition-opacity group-hover/board-card:opacity-100 group-has-[[data-slot=board-card-surface]:focus-visible]/board-card:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
                >
                  <EllipsisVertical />
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="w-auto min-w-48"
              onKeyDown={pickShortcut}
            >
              <RowActionMenuItems actions={itemActions} />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const renderLane = (column: BoardColumn<T>) => {
    const readOnly = isReadOnly(column);
    const receivable = canReceive(column);
    const count = column.count ?? column.items.length;
    const dropOver = drag?.over?.container === column.id;
    if (isCollapsed(column)) {
      return (
        <Tooltip key={column.id}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                data-slot="board-column-collapsed"
                data-board-lane={column.id}
                data-board-strip=""
                data-drop-over={dropOver ? "" : undefined}
                onClick={() => setCollapsed(column.id, false)}
                // `relative`: the sr-only child is absolutely positioned and must not resolve against
                // the page, where its static x would widen the page's scroll area.
                className="relative h-full min-h-48 w-10 shrink-0 flex-col max-md:snap-start items-center justify-start gap-2 rounded-xl border border-dashed border-border px-1 py-3 hover:bg-muted data-drop-over:bg-accent"
              >
                <PanelLeftOpen
                  aria-hidden="true"
                  data-slot="board-column-expand-icon"
                />
                <span
                  aria-hidden="true"
                  data-slot="board-column-count"
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {count}
                </span>
                <span
                  aria-hidden="true"
                  data-slot="board-column-collapsed-title"
                  className="min-h-0 flex-1 [writing-mode:vertical-rl] text-xs font-medium text-muted-foreground"
                >
                  {column.title}
                </span>
                <span className="sr-only">
                  {readOnly
                    ? `${laneName(column)}. Expand column, read-only`
                    : `${laneName(column)}. Expand column`}
                </span>
              </Button>
            }
          />
          <TooltipContent side="right">Expand lane</TooltipContent>
        </Tooltip>
      );
    }
    const laneIds = display[column.id] ?? [];
    const gapIndex = dropOver && drag?.over ? drag.over.index : -1;
    const columnActions = getColumnActions?.(column) ?? [];
    const hasLaneMenu = columnActions.length > 0;
    const addText =
      typeof addLabel === "function" ? addLabel(column) : addLabel;
    const showAdd =
      onAdd !== undefined && column.addable !== false && !readOnly;
    const empty = laneIds.length === 0 && gapIndex === -1;
    const gap = (
      <div
        key="__gap"
        aria-hidden="true"
        data-slot="board-card-placeholder"
        className="h-(--board-gap-height) shrink-0 rounded-lg border border-dashed border-primary/40 bg-primary/5"
      />
    );
    const cards = laneIds.map((id, index) =>
      renderCardItem(column, id, index, laneIds),
    );
    if (gapIndex !== -1) cards.splice(gapIndex, 0, gap);
    return (
      <section
        key={column.id}
        role="region"
        aria-label={laneName(column)}
        aria-busy={column.loading ? true : undefined}
        data-slot="board-column"
        data-column={column.id}
        data-board-lane={column.id}
        data-read-only={readOnly ? "" : undefined}
        data-drop-over={dropOver ? "" : undefined}
        className={cn(
          "flex min-h-0 min-w-0 shrink-0 grow-0 basis-(--board-column-width) flex-col rounded-xl transition-colors data-drop-over:bg-accent/60",
          "max-md:basis-full max-md:snap-start max-md:snap-always",
          fill ? "h-full" : "self-start",
        )}
      >
        <header
          data-slot="board-column-header"
          className="flex min-w-0 shrink-0 items-center gap-2 px-3 pt-3 pb-2"
        >
          <span
            data-slot="board-column-title"
            className="min-w-0 truncate text-sm font-medium"
          >
            {column.title}
          </span>
          <span
            data-slot="board-column-count"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {count}
          </span>
          <div className="ms-auto flex shrink-0 items-center gap-0.5">
            {renderColumnAction ? renderColumnAction(column) : null}
            {collapsible ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Collapse ${laneLabel(column)} lane`}
                      data-slot="board-column-collapse"
                      onClick={() => setCollapsed(column.id, true)}
                    >
                      <PanelLeftClose />
                    </Button>
                  }
                />
                <TooltipContent>Collapse lane</TooltipContent>
              </Tooltip>
            ) : null}
            {hasLaneMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${laneLabel(column)} lane actions`}
                      data-slot="board-column-menu"
                    >
                      <EllipsisVertical />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <RowActionMenuItems actions={columnActions} />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </header>
        <div
          ref={stableLaneBodyRef(column.id)}
          data-slot="board-column-body"
          className={cn(
            "relative flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-2 pb-2",
            fill ? "flex-1" : "max-h-(--board-column-max-height)",
          )}
        >
          {empty ? (
            column.loading ? null : dragging && receivable ? (
              <div
                data-slot="board-column-empty"
                data-dragging=""
                className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-primary/40 text-sm text-foreground"
              >
                Drop here
              </div>
            ) : column.emptyState !== undefined ? (
              column.emptyState
            ) : (
              <Empty
                size="sm"
                data-slot="board-column-empty"
                icon={column.empty?.icon ?? <Inbox aria-hidden />}
              >
                <EmptyHeader>
                  <EmptyTitle>
                    {column.empty?.title ?? "Nothing here"}
                  </EmptyTitle>
                  {column.droppable === false && column.lockedReason ? (
                    <EmptyDescription>{column.lockedReason}</EmptyDescription>
                  ) : column.empty?.description != null ? (
                    <EmptyDescription>
                      {column.empty.description}
                    </EmptyDescription>
                  ) : null}
                </EmptyHeader>
                {column.empty?.action != null ? (
                  <EmptyContent>{column.empty.action}</EmptyContent>
                ) : null}
              </Empty>
            )
          ) : (
            <div
              role="list"
              // The lane (region) carries the total; the list is named by the lane alone.
              aria-label={laneLabel(column)}
              className="flex flex-col gap-2"
            >
              {cards}
            </div>
          )}
          {column.loading ? (
            <div
              aria-hidden="true"
              data-slot="board-column-skeleton"
              className="flex flex-col gap-2"
            >
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center gap-1.5 pt-1">
                    <Skeleton className="h-5 w-16 rounded-4xl" />
                    <Skeleton className="ms-auto size-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {column.loadMore ? (
            <>
              {column.loadMore.hasMore ? (
                <LaneAutoLoad
                  loadMore={column.loadMore}
                  root={laneBodyNodes[column.id] ?? null}
                />
              ) : null}
              <LoadMore {...column.loadMore} className="pt-1" />
            </>
          ) : null}
        </div>
        {showAdd ? (
          <div className="shrink-0 px-2 pb-2">
            <Button
              variant="ghost"
              size="sm"
              data-slot="board-column-add"
              onClick={() => onAdd(column.id)}
              className="w-full justify-start text-muted-foreground"
            >
              <Plus />
              {addText}
            </Button>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      data-slot="board"
      data-dragging={dragging ? "" : undefined}
      role="group"
      aria-label={ariaLabel}
      // Only --* custom properties — the classes consume them.
      style={
        {
          ["--board-column-width"]: columnWidth,
          ["--board-column-max-height"]:
            columnMaxHeight ?? "calc(100dvh - 16rem)",
          ["--board-gap-height"]: `${drag?.height ?? 64}px`,
          ["--board-height"]: boardHeight,
        } as React.CSSProperties
      }
      className={cn(
        "flex w-full max-w-full min-w-0 flex-col gap-2",
        fill && "h-(--board-height)",
        className,
      )}
    >
      {isMobile && columns.length > 1 ? (
        <div
          data-slot="board-lane-tabs"
          className="flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {columns.map((column, index) => (
            <Button
              key={column.id}
              variant="ghost"
              size="sm"
              aria-current={activeLane === index ? "true" : undefined}
              data-active={activeLane === index ? "" : undefined}
              onClick={() => showLane(index)}
              className="shrink-0 text-muted-foreground data-active:bg-accent data-active:text-foreground"
            >
              {laneLabel(column)}
              <span className="text-xs text-muted-foreground tabular-nums">
                {column.count ?? column.items.length}
              </span>
            </Button>
          ))}
        </div>
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-1">
        <div
          ref={scrollerRef}
          data-slot="board-scroller"
          onScroll={onScrollerScroll}
          // w-full + max-w-full: inside a flex/grid parent the board must never size to its
          // lanes' max-content — it scrolls internally instead (the 320px reflow contract).
          className={cn(
            "flex w-full max-w-full min-w-0 gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "max-md:snap-x max-md:snap-mandatory",
            fill ? "h-full items-stretch" : "items-start",
          )}
        >
          {columns.map(renderLane)}
        </div>
        <div
          aria-hidden="true"
          data-slot="board-fade-start"
          data-visible={fades.start ? "" : undefined}
          className="pointer-events-none absolute inset-y-0 start-0 w-8 bg-linear-to-r from-background to-transparent opacity-0 transition-opacity data-visible:opacity-100 rtl:bg-linear-to-l"
        />
        <div
          aria-hidden="true"
          data-slot="board-fade-end"
          data-visible={fades.end ? "" : undefined}
          className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-linear-to-l from-background to-transparent opacity-0 transition-opacity data-visible:opacity-100 rtl:bg-linear-to-r"
        />
      </div>
      <Announcer />
      {/* The lifted card: fixed to the viewport from inside the board (no portal), so it keeps
          the board's theme scope and escapes the lanes' overflow clipping. */}
      {drag && dragItem ? (
        <div
          ref={(node) => {
            overlayRef.current = node;
          }}
          aria-hidden="true"
          data-slot="board-drag-overlay"
          data-settling={settling ? "" : undefined}
          style={
            {
              ["--drag-w"]: `${drag.width}px`,
              // The start position; each frame then writes the live one to the node.
              ["--drag-x"]: `${drag.x}px`,
              ["--drag-y"]: `${drag.y}px`,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none fixed start-0 top-0 z-50 w-(--drag-w) translate-x-(--drag-x) translate-y-(--drag-y) cursor-grabbing",
            "data-settling:transition-[translate] data-settling:duration-200 data-settling:ease-out",
          )}
        >
          <div
            className={cn(
              cardClasses,
              "shadow-lg transition-transform duration-200 ease-out",
              settling ? "rotate-0" : "motion-safe:rotate-2",
            )}
          >
            <div className="min-w-0 pe-6">
              <TruncationFocusProvider focusable={false}>
                {renderCard(dragItem.item, dragItem.column)}
              </TruncationFocusProvider>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
