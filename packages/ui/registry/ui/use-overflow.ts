// @vegastack use-overflow@0.25.104 sha256-nR6L6YN7dpmwe4P5ewwlA519CkpvQPcJ3FW3uem+wqk=

"use client";

import * as React from "react";

/**
 * Which axis (or axes) an overflow measurement compares.
 *
 * - `inline` — `scrollWidth` vs `clientWidth`; the truncating-text and
 *   horizontal-scroll case.
 * - `block` — `scrollHeight` vs `clientHeight`; the line-clamp case.
 * - `either` — overflowing on EITHER axis; what a scroll viewport needs, because
 *   a region that scrolls vertically must be keyboard-reachable just as much as
 *   one that scrolls horizontally.
 */
export type OverflowAxis = "inline" | "block" | "either";

/** Options accepted by `useOverflow`. */
export interface UseOverflowOptions {
  /**
   * Axis to compare.
   * @default "inline"
   */
  axis?: OverflowAxis;
  /**
   * Freeze the last measured value instead of re-observing. Used by disclosures
   * that REMOVE the clamp while expanded — measuring then would report "not
   * overflowing" and immediately re-collapse the disclosure.
   * @default false
   */
  paused?: boolean;
  /**
   * Extra values that should force a re-measure when they change (e.g. the text
   * being rendered). The element and content boxes are observed already; this is
   * only for content changes that move neither box.
   * @default []
   */
  deps?: React.DependencyList;
}

/**
 * `measureOverflow` — read, once, whether `node` is overflowing along `axis`.
 *
 * The comparison `useOverflow` makes, for a caller that only needs the answer at the moment
 * someone reaches for the content — a pointer entering a grid cell, a focus — and so should not
 * pay for a live observation on every mounted copy. It reads layout, so call it from an event
 * handler, never during render.
 *
 * @example
 * onPointerEnter={(event) => setClipped(measureOverflow(event.currentTarget))}
 */
export function measureOverflow(
  node: HTMLElement,
  axis: OverflowAxis = "inline",
): boolean {
  // The +1 slack absorbs sub-pixel layout rounding: a fractional scroll size one hair over the
  // client size is not overflow, and without the slack the observer can oscillate between the
  // two values forever.
  const inline = node.scrollWidth > node.clientWidth + 1;
  const block = node.scrollHeight > node.clientHeight + 1;
  return axis === "block"
    ? block
    : axis === "either"
      ? inline || block
      : inline;
}

/*
 * ONE ResizeObserver for every `useOverflow` on the page. Its callback runs after layout, so the
 * scroll/client sizes it reads are already computed: mounting a hundred truncating cells costs a
 * hundred cheap reads in one batch, not a forced synchronous layout per cell (the hook used to
 * measure in its mount effect, right after React had written the DOM). An element maps to the
 * measurements that watch it — its own, and its parent's when it is a watched child.
 */
let sharedObserver: ResizeObserver | null = null;
const watchers = new Map<Element, Set<() => void>>();

function watch(element: Element, measure: () => void): void {
  let set = watchers.get(element);
  if (!set) {
    set = new Set();
    watchers.set(element, set);
  }
  set.add(measure);
  sharedObserver ??= new ResizeObserver((entries) => {
    const due = new Set<() => void>();
    for (const entry of entries)
      watchers.get(entry.target)?.forEach((run) => due.add(run));
    due.forEach((run) => run());
  });
  // A fresh observation queues a first notification once the element is laid out, which is how
  // a mount — or a `deps` change that moves no box — gets its measurement. Observing a target
  // that is already observed does not restart its observation, so drop it first: every watcher
  // of the element re-measures, which is cheap after layout.
  sharedObserver.unobserve(element);
  sharedObserver.observe(element);
}

function unwatch(element: Element, measure: () => void): void {
  const set = watchers.get(element);
  if (!set) return;
  set.delete(measure);
  if (set.size > 0) return;
  watchers.delete(element);
  sharedObserver?.unobserve(element);
}

/**
 * `useOverflow` — report whether `node` is currently overflowing along `axis`.
 *
 * The system's ONE overflow measurement. It backs three different jobs that all
 * asked the same question separately before: whether truncated text is actually
 * clipped (so the reveal affordance is offered only when it means something),
 * whether a scroll viewport is actually scrollable (so `tabIndex` is added only
 * when there is something to scroll — an unconditional tab stop on a table that
 * fits is a dead stop for every keyboard user), and whether a clamped block is
 * taller than its clamp.
 *
 * Measurement is live: one shared `ResizeObserver` watches the element AND its
 * element children, so it tracks both the viewport resizing and its CONTENT
 * growing — a table that gets wider inside a fixed-width container never resizes
 * the container, so observing the container alone would miss it. The sizes are
 * read in the observer's callback, after layout, so a mount never forces a
 * synchronous layout; the value lands one frame after the element is laid out.
 * A surface that mounts many copies and needs the answer only on contact (a grid
 * cell's full-text tooltip) should call `measureOverflow` from the event instead.
 *
 * SSR-safe: the first render always returns `false` and the real value lands
 * after the element is laid out, so a server render never claims content is
 * clipped.
 *
 * @example
 * const [node, setNode] = React.useState<HTMLDivElement | null>(null);
 * const scrollable = useOverflow(node, { axis: "either" });
 * return <div ref={setNode} tabIndex={scrollable ? 0 : undefined} className="overflow-auto">…</div>;
 */
export function useOverflow(
  node: HTMLElement | null,
  { axis = "inline", paused = false, deps = [] }: UseOverflowOptions = {},
): boolean {
  const [overflowing, setOverflowing] = React.useState(false);

  React.useEffect(() => {
    if (!node || paused || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      if (!node.isConnected) return;
      const next = measureOverflow(node, axis);
      setOverflowing((previous) => (previous === next ? previous : next));
    };
    const watched = [node, ...node.children];
    for (const element of watched) watch(element, measure);
    return () => {
      for (const element of watched) unwatch(element, measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, axis, paused, ...deps]);

  return overflowing;
}
