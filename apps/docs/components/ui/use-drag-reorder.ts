// @vegastack use-drag-reorder@0.3.0 sha256-DmQP1vkNu55cKs4bc5sRZX64KF4wqbygu/sq4B3iFm4=

"use client";

import * as React from "react";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

/* ---
`use-drag-reorder` is the ONE file that imports the drag engine
(`@atlaskit/pragmatic-drag-and-drop`, sanctioned D3) — `board`, `sortable-list`, and
grid column reorder all consume this hook, so an engine swap touches one module and
its tests. Pragmatic owns the pointer/touch drag lifecycle and hit-testing
(per-element drop targets + closest-edge, which cannot mis-target narrow columns the
way whole-surface collision detection can); everything the engine deliberately does
not own is implemented here, because it must match this system's interaction voice:

- the KEYBOARD layer — Space/Enter on the handle toggles move mode; arrows commit one
  reorder step at a time (each step lands in the host's state and is announced);
  Escape ends move mode. Commit-per-step follows Atlassian's own user-tested guidance
  (and their "Move to…" menu preference) rather than a ghost-position model: there is
  no virtual position to lose, the host's data is always the truth, and "cancel" is
  arrowing back. Consumers additionally ship a menu equivalent (sortable-list's
  move-up/down/to-position; board's "Move to…"), which is the REQUIRED lossless path.
- the LIVE REGION vocabulary — lifted / moved / dropped / move-ended / rejected, with
  overridable announcement builders.
- the ASYNC drop contract — `onReorder` may return a promise. While it is in flight
  the move is `pending` (consumers render the shimmer); on rejection the hook
  announces it and clears — the host never applied the move, so the snap-back is
  automatic. No drag library models refusable drops; the CRM's server-gated moves
  need it.

Deliberately NOT done here:
- No DOM, no styling, no drag preview chrome. Consumers style off the returned state
  (`draggingId`, `closestEdge`, `pending`) with `data-*` attributes.
- No optimistic insertion. The host owns ordering; optimistic UI is host state.
- No auto-scroll. Compose Pragmatic's autoScroller in the consumer if a surface
  needs it.
--- */

/** Where an item sits: its container id and index within it. */
export interface DragReorderPosition {
  /** Container id (a single list uses the hook's default container). */
  container: string;
  /** Index within the container. */
  index: number;
}

/** One requested move — the payload `onReorder` receives. */
export interface DragReorderMove {
  /** The dragged item's id. */
  id: string;
  /** Where the item came from. */
  from: DragReorderPosition;
  /** Where the item should land. */
  to: DragReorderPosition;
  /** What initiated the move. */
  input: "pointer" | "keyboard";
}

/** Overridable announcement builders for the live region. */
export interface DragReorderAnnouncements {
  /** Move mode entered on `id`. */
  lifted: (move: {
    id: string;
    position: number;
    count: number;
    container: string;
  }) => string;
  /** A step (keyboard) or drop (pointer) landed. */
  moved: (move: DragReorderMove & { count: number }) => string;
  /** Move mode ended (Space/Enter again, Escape, or blur). */
  ended: (move: { id: string }) => string;
  /** The host rejected the move (the `onReorder` promise rejected). */
  rejected: (move: DragReorderMove) => string;
}

const DEFAULT_ANNOUNCEMENTS: DragReorderAnnouncements = {
  lifted: ({ position, count }) =>
    `Move mode on. Item ${position} of ${count}. Use the arrow keys to move, Escape to finish`,
  moved: ({ to, count, from }) =>
    from.container === to.container
      ? `Moved to position ${to.index + 1} of ${count}`
      : `Moved to ${to.container}, position ${to.index + 1} of ${count}`,
  ended: () => "Move mode off",
  rejected: () => "Move rejected — position restored",
};

/** Options for {@link useDragReorder}. */
export interface UseDragReorderOptions {
  /**
   * Ordered item ids per container. A single list passes one entry (any key).
   * The hook never reorders this — it only requests moves via `onReorder`.
   */
  lists: Record<string, readonly string[]>;
  /**
   * Apply a move to host state. Return a promise for server-gated moves: the
   * move is `pending` until it settles, and a rejection announces + clears
   * (the host never applied it, so the visual snap-back is automatic).
   */
  onReorder: (move: DragReorderMove) => void | Promise<void>;
  /**
   * Axis items are ordered along inside a container. Drives the closest-edge
   * hitboxes and which arrow keys move within vs across containers.
   * @default "vertical"
   */
  axis?: "vertical" | "horizontal";
  /**
   * Disable all dragging and keyboard moves — statically, or per item.
   * @default false
   */
  disabled?: boolean | ((id: string) => boolean);
  /**
   * Override the live-region announcement builders.

   * @default undefined
   */
  announcements?: Partial<DragReorderAnnouncements>;
}

/** What {@link useDragReorder} returns. */
export interface UseDragReorderReturn {
  /**
   * Register an item element (callback ref) as draggable + drop target.
   * `handle` optionally scopes dragging to a handle element registered via
   * `getHandleProps`' ref.
   */
  getItemProps: (
    container: string,
    id: string,
  ) => {
    ref: (element: HTMLElement | null) => void;
    "data-drag-item": string;
    "data-dragging": "" | undefined;
    "data-drop-edge": Edge | undefined;
    "data-drag-pending": "" | undefined;
  };
  /**
   * Keyboard move-mode handler props for the item's drag handle (an
   * `IconButton`). Space/Enter toggles move mode; arrows commit steps;
   * Escape ends.
   */
  getHandleProps: (
    container: string,
    id: string,
  ) => {
    ref: (element: HTMLElement | null) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    onBlur: () => void;
    "aria-pressed": boolean;
  };
  /**
   * Register a container element as a drop target (needed so items can be
   * dropped into an EMPTY container).
   */
  getContainerProps: (container: string) => {
    ref: (element: HTMLElement | null) => void;
    "data-drop-container": string;
    "data-drop-over": "" | undefined;
  };
  /** Props for the consumer-rendered polite live region. */
  getLiveRegionProps: () => {
    role: "status";
    "aria-live": "polite";
    "aria-atomic": "true";
    className: string;
    children: React.ReactNode;
  };
  /** Id currently dragged by pointer, or in keyboard move mode. */
  activeId: string | null;
  /** The move currently awaiting its `onReorder` promise. */
  pending: DragReorderMove | null;
  /** Programmatically request a move — the menu equivalent's entry point. */
  requestMove: (move: Omit<DragReorderMove, "input">) => void;
}

/** Locate an id across the lists. */
function positionOf(
  lists: Record<string, readonly string[]>,
  id: string,
): DragReorderPosition | null {
  for (const [container, ids] of Object.entries(lists)) {
    const index = ids.indexOf(id);
    if (index !== -1) return { container, index };
  }
  return null;
}

/**
 * `useDragReorder` — pointer/touch drag via Pragmatic drag-and-drop plus this
 * system's keyboard move mode, live-region vocabulary, and async
 * pending/rejected contract. One API covers a single list (`sortable-list`)
 * and cross-container boards; the host stays the owner of order.
 *
 * @example
 * const reorder = useDragReorder({
 *   lists: { list: ids },
 *   onReorder: ({ id, to }) => moveItem(id, to.index),
 * });
 * // <li {...reorder.getItemProps("list", id)}>
 * //   <IconButton aria-label={`Move ${label}`} {...reorder.getHandleProps("list", id)}>
 * //     <GripVertical />
 * //   </IconButton>
 * // </li>
 * // <span {...reorder.getLiveRegionProps()} />
 */
export function useDragReorder({
  lists,
  onReorder,
  axis = "vertical",
  disabled = false,
  announcements,
}: UseDragReorderOptions): UseDragReorderReturn {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<DragReorderMove | null>(null);
  const [dropEdges, setDropEdges] = React.useState<Record<string, Edge>>({});
  const [overContainer, setOverContainer] = React.useState<string | null>(null);
  const [announcement, setAnnouncementState] = React.useState({
    text: "",
    seq: 0,
  });

  const announceRef = React.useRef<DragReorderAnnouncements>(
    DEFAULT_ANNOUNCEMENTS,
  );
  announceRef.current = { ...DEFAULT_ANNOUNCEMENTS, ...announcements };
  const listsRef = React.useRef(lists);
  listsRef.current = lists;
  const onReorderRef = React.useRef(onReorder);
  onReorderRef.current = onReorder;
  const disabledRef = React.useRef(disabled);
  disabledRef.current = disabled;
  const pendingSeq = React.useRef(0);

  const announce = React.useCallback((text: string) => {
    setAnnouncementState((prev) => ({ text, seq: prev.seq + 1 }));
  }, []);

  const isDisabled = React.useCallback((id: string) => {
    const value = disabledRef.current;
    return typeof value === "function" ? value(id) : value;
  }, []);

  /** Commit a move through the host, tracking the async contract. */
  const commitMove = React.useCallback(
    (move: DragReorderMove) => {
      const result = onReorderRef.current(move);
      const count = listsRef.current[move.to.container]?.length ?? 0;
      announce(announceRef.current.moved({ ...move, count }));
      if (result == null || typeof result.then !== "function") return;
      const seq = ++pendingSeq.current;
      setPending(move);
      result.then(
        () => {
          if (seq === pendingSeq.current) setPending(null);
        },
        () => {
          if (seq !== pendingSeq.current) return;
          setPending(null);
          announce(announceRef.current.rejected(move));
        },
      );
    },
    [announce],
  );

  const requestMove = React.useCallback(
    (move: Omit<DragReorderMove, "input">) => {
      commitMove({ ...move, input: "keyboard" });
    },
    [commitMove],
  );

  // ---- pointer path (Pragmatic) --------------------------------------------

  // The instance token scopes monitors so two hooks on one page never
  // cross-talk. A ref-stable symbol is identity enough.
  const instanceToken = React.useRef<symbol | null>(null);
  if (instanceToken.current === null)
    instanceToken.current = Symbol("use-drag-reorder");

  React.useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) =>
        source.data.instance === instanceToken.current,
      onDrop: ({ source, location }) => {
        setActiveId(null);
        setDropEdges({});
        setOverContainer(null);
        const target = location.current.dropTargets[0];
        if (!target) return;
        const from = positionOf(listsRef.current, String(source.data.id));
        if (!from) return;
        let to: DragReorderPosition;
        if (target.data.kind === "container") {
          // Dropped on an (empty area of a) container — append.
          const container = String(target.data.container);
          to = {
            container,
            index: listsRef.current[container]?.length ?? 0,
          };
        } else {
          const container = String(target.data.container);
          const targetIndex = Number(target.data.index);
          const edge = extractClosestEdge(target.data);
          let index =
            edge === "bottom" || edge === "right"
              ? targetIndex + 1
              : targetIndex;
          // Removing the item first shifts later indexes down within the
          // same container.
          if (from.container === container && from.index < index) index -= 1;
          to = { container, index };
        }
        if (to.container === from.container && to.index === from.index) return;
        commitMove({
          id: String(source.data.id),
          from,
          to,
          input: "pointer",
        });
      },
    });
  }, [commitMove]);

  const cleanups = React.useRef(new Map<string, () => void>());
  const handleElements = React.useRef(new Map<string, HTMLElement>());
  // Ref-callback identity MUST be stable per (container, id): React re-runs a
  // changed callback ref on every render (null → cleanup → re-attach), which
  // would tear down the ACTIVE draggable mid-drag the moment drop-edge state
  // re-renders the list. Cache one callback per key.
  const refCache = React.useRef(
    new Map<string, (element: HTMLElement | null) => void>(),
  );
  const axisRef = React.useRef(axis);
  axisRef.current = axis;

  const makeItemRef = React.useCallback(
    (container: string, id: string) => (element: HTMLElement | null) => {
      const key = `item:${container}:${id}`;
      cleanups.current.get(key)?.();
      cleanups.current.delete(key);
      if (!element) return;
      const allowedEdges: Edge[] =
        axisRef.current === "vertical" ? ["top", "bottom"] : ["left", "right"];
      const cleanup = combine(
        draggable({
          element,
          dragHandle: handleElements.current.get(`${container}:${id}`),
          canDrag: () => !isDisabled(id),
          getInitialData: () => ({
            instance: instanceToken.current,
            id,
            container,
          }),
          onDragStart: () => {
            setActiveId(id);
            const position = positionOf(listsRef.current, id);
            if (position)
              announce(
                announceRef.current.lifted({
                  id,
                  position: position.index + 1,
                  count: listsRef.current[position.container]?.length ?? 0,
                  container: position.container,
                }),
              );
          },
          onDrop: () => setActiveId(null),
        }),
        dropTargetForElements({
          element,
          canDrop: ({ source }) =>
            source.data.instance === instanceToken.current &&
            source.data.id !== id,
          getData: ({ input, element: el }) => {
            const index = listsRef.current[container]?.indexOf(id) ?? -1;
            return attachClosestEdge(
              { kind: "item", id, container, index },
              { element: el, input, allowedEdges },
            );
          },
          onDrag: ({ self }) => {
            const edge = extractClosestEdge(self.data);
            setDropEdges((prev) =>
              prev[id] === edge ? prev : edge ? { [id]: edge } : {},
            );
          },
          onDragLeave: () =>
            setDropEdges((prev) => {
              if (!(id in prev)) return prev;
              const next = { ...prev };
              delete next[id];
              return next;
            }),
          onDrop: () => setDropEdges({}),
        }),
      );
      cleanups.current.set(key, cleanup);
    },
    [announce, isDisabled],
  );
  const registerItem = React.useCallback(
    (container: string, id: string) => {
      const key = `item-ref:${container}:${id}`;
      let cached = refCache.current.get(key);
      if (!cached) {
        cached = makeItemRef(container, id);
        refCache.current.set(key, cached);
      }
      return cached;
    },
    [makeItemRef],
  );

  const makeContainerRef = React.useCallback(
    (container: string) => (element: HTMLElement | null) => {
      const key = `container:${container}`;
      cleanups.current.get(key)?.();
      cleanups.current.delete(key);
      if (!element) return;
      const cleanup = dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.instance === instanceToken.current,
        getData: () => ({ kind: "container", container }),
        onDragEnter: () => setOverContainer(container),
        onDragLeave: () =>
          setOverContainer((prev) => (prev === container ? null : prev)),
        onDrop: () => setOverContainer(null),
      });
      cleanups.current.set(key, cleanup);
    },
    [],
  );
  const registerContainer = React.useCallback(
    (container: string) => {
      const key = `container-ref:${container}`;
      let cached = refCache.current.get(key);
      if (!cached) {
        cached = makeContainerRef(container);
        refCache.current.set(key, cached);
      }
      return cached;
    },
    [makeContainerRef],
  );

  React.useEffect(() => {
    const map = cleanups.current;
    return () => {
      for (const cleanup of map.values()) cleanup();
      map.clear();
    };
  }, []);

  // ---- keyboard move mode (ours) -------------------------------------------

  const endMoveMode = React.useCallback(
    (id: string) => {
      setActiveId((prev) => {
        if (prev !== id) return prev;
        announce(announceRef.current.ended({ id }));
        return null;
      });
    },
    [announce],
  );

  const handleKeyDown = React.useCallback(
    (container: string, id: string, event: React.KeyboardEvent) => {
      if (isDisabled(id)) return;
      const inMoveMode = activeId === id;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (inMoveMode) {
          endMoveMode(id);
        } else {
          setActiveId(id);
          const position = positionOf(listsRef.current, id);
          if (position)
            announce(
              announceRef.current.lifted({
                id,
                position: position.index + 1,
                count: listsRef.current[position.container]?.length ?? 0,
                container: position.container,
              }),
            );
        }
        return;
      }
      if (!inMoveMode) return;
      if (event.key === "Escape") {
        event.preventDefault();
        endMoveMode(id);
        return;
      }
      const from = positionOf(listsRef.current, id);
      if (!from) return;
      const withinPrev = axis === "vertical" ? "ArrowUp" : "ArrowLeft";
      const withinNext = axis === "vertical" ? "ArrowDown" : "ArrowRight";
      const acrossPrev = axis === "vertical" ? "ArrowLeft" : "ArrowUp";
      const acrossNext = axis === "vertical" ? "ArrowRight" : "ArrowDown";
      const containers = Object.keys(listsRef.current);
      if (event.key === withinPrev || event.key === withinNext) {
        event.preventDefault();
        const delta = event.key === withinPrev ? -1 : 1;
        const count = listsRef.current[from.container]?.length ?? 0;
        const index = Math.max(0, Math.min(from.index + delta, count - 1));
        if (index === from.index) return;
        commitMove({
          id,
          from,
          to: { container: from.container, index },
          input: "keyboard",
        });
      } else if (
        (event.key === acrossPrev || event.key === acrossNext) &&
        containers.length > 1
      ) {
        event.preventDefault();
        const delta = event.key === acrossPrev ? -1 : 1;
        const containerIndex = containers.indexOf(from.container);
        const next = containers[containerIndex + delta];
        if (next === undefined) return;
        const count = listsRef.current[next]?.length ?? 0;
        commitMove({
          id,
          from,
          to: { container: next, index: Math.min(from.index, count) },
          input: "keyboard",
        });
      }
    },
    [activeId, axis, announce, commitMove, endMoveMode, isDisabled],
  );

  const registerHandle = React.useCallback((container: string, id: string) => {
    const key = `handle-ref:${container}:${id}`;
    let cached = refCache.current.get(key);
    if (!cached) {
      cached = (element: HTMLElement | null) => {
        const mapKey = `${container}:${id}`;
        if (element) handleElements.current.set(mapKey, element);
        else handleElements.current.delete(mapKey);
      };
      refCache.current.set(key, cached);
    }
    return cached;
  }, []);

  return {
    getItemProps: (container, id) => ({
      ref: registerItem(container, id),
      "data-drag-item": id,
      "data-dragging": activeId === id ? "" : undefined,
      "data-drop-edge": dropEdges[id],
      "data-drag-pending": pending?.id === id ? "" : undefined,
    }),
    getHandleProps: (container, id) => ({
      ref: registerHandle(container, id),
      onKeyDown: (event) => handleKeyDown(container, id, event),
      onBlur: () => endMoveMode(id),
      "aria-pressed": activeId === id,
    }),
    getContainerProps: (container) => ({
      ref: registerContainer(container),
      "data-drop-container": container,
      "data-drop-over": overContainer === container ? "" : undefined,
    }),
    getLiveRegionProps: () => ({
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      className: "sr-only",
      children: React.createElement(
        "span",
        { key: announcement.seq },
        announcement.text,
      ),
    }),
    activeId,
    pending,
    requestMove,
  };
}
