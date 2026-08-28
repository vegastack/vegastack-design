// @vegastack use-list-nav@0.5.0 sha256-sINGKdZJIqGTeLgQC5V6/t0FtvRkqaf8hkXGKUI92Gs=

"use client";

import * as React from "react";

/* ---
`useListNav` exists because the roving-tabindex block was already written twice in this
registry (color-picker's swatch grid and emoji-picker's emoji grid) and every list-like
composition to come — data grids, boards, sortable lists — needs the identical shape:
one Tab stop for the whole collection, arrow keys moving an active index (and DOM focus),
RTL-aware horizontal arrows, and Home/End jumps.

Deliberately NOT done here:
- No selection model. Navigation is focus only; what activation means belongs to the caller.
- No DOM opinion. The hook returns props and handlers; the caller owns the elements, their
  roles, and their styling — an app that wants entirely different chrome still gets the
  hard part.
- No typeahead. Base UI owns typeahead where it matters (Select, Combobox); a grid of
  swatches or cards has no accessible name to match against by default.
- No virtualization awareness. Refs are a plain index-addressed array; a virtualized
  consumer (data-grid) manages scroll-into-view itself before focusing.
--- */

/** Options for {@link useListNav}. */
export interface UseListNavOptions {
  /** Number of items currently in the collection. The active index re-clamps when it shrinks. */
  count: number;
  /**
   * Items per visual row. `1` is a vertical list (Up/Down move by one);
   * greater values make ArrowUp/ArrowDown move a full row.
   * @default 1
   */
  columns?: number;
  /**
   * What Home/End jump to. `"collection"` (the shipped behaviour of both existing
   * grids) jumps to the first/last item of the whole collection; `"row"` jumps to
   * the start/end of the active row — the APG grid reading, for consumers that
   * render many rows.
   * @default "collection"
   */
  homeEndScope?: "collection" | "row";
  /**
   * Index the roving tabindex starts on (e.g. the currently-selected item so
   * keyboard focus lands on the current value). Clamped into range.
   * @default 0
   */
  defaultActiveIndex?: number;
  /**
   * Disable all keyboard handling (the collection stays focusable but arrows do
   * nothing) — mirror of a disabled picker.
   * @default false
   */
  disabled?: boolean;
  /**
   * Predicate consulted before handling any key. Return `false` to suppress
   * navigation — the escape hatch for "an overlay is open above this list and
   * owns the arrow keys right now".
   * @default undefined
   */
  shouldHandle?: () => boolean;
}

/** Props to spread onto each item element, from {@link UseListNavReturn.getItemProps}. */
export interface UseListNavItemProps {
  /** `0` for the active item, `-1` for the rest — one Tab stop per collection. */
  tabIndex: number;
  /** Callback ref registering the item element for programmatic focus. */
  ref: (node: HTMLElement | null) => void;
  /** Syncs the active index when focus arrives by click or `.focus()`. */
  onFocus: () => void;
}

/** Return value of {@link useListNav}. */
export interface UseListNavReturn {
  /** Index of the item currently holding the roving tab stop. */
  activeIndex: number;
  /** Directly set the active index (no focus side-effect). Rarely needed — prefer `focusIndex`. */
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Clamp `index` into range, make it active, and move DOM focus to its element. */
  focusIndex: (index: number) => void;
  /** Key handler for the container element — arrows, Home, End, RTL-aware. */
  handleKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  /** Per-item props: roving `tabIndex`, registration `ref`, and focus sync. */
  getItemProps: (index: number) => UseListNavItemProps;
}

/**
 * `useListNav` — roving-tabindex keyboard navigation for a list or grid of
 * focusable items. Exactly one item is Tab-reachable at a time; ArrowLeft/Right
 * move by one (direction-aware in RTL, read live from the container's computed
 * `direction`), ArrowUp/Down move by `columns`, and Home/End jump per
 * `homeEndScope`. Handled keys are `preventDefault()`ed; everything else passes
 * through untouched.
 *
 * @example
 * const nav = useListNav({ count: colors.length, columns: 7 });
 * return (
 *   <div role="listbox" onKeyDown={nav.handleKeyDown}>
 *     {colors.map((color, index) => (
 *       <button key={color.name} {...nav.getItemProps(index)}>…</button>
 *     ))}
 *   </div>
 * );
 */
export function useListNav({
  count,
  columns = 1,
  homeEndScope = "collection",
  defaultActiveIndex = 0,
  disabled = false,
  shouldHandle,
}: UseListNavOptions): UseListNavReturn {
  const columnCount = Number.isFinite(columns)
    ? Math.max(1, Math.floor(columns))
    : 1;
  const [activeIndex, setActiveIndex] = React.useState(() =>
    Math.max(0, Math.min(defaultActiveIndex, Math.max(count - 1, 0))),
  );
  // `HTMLElement`, not a narrower element type — items are typically Base UI
  // `render`-polymorphic components whose ref target can be any element.
  const itemRefs = React.useRef<(HTMLElement | null)[]>([]);

  // Keep the active index in range if the collection shrinks (a narrowing
  // search filter, a dynamic palette prop).
  React.useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(count - 1, 0)));
  }, [count]);

  const focusIndex = React.useCallback(
    (index: number) => {
      if (count === 0) return;
      const clamped = Math.max(0, Math.min(index, count - 1));
      setActiveIndex(clamped);
      itemRefs.current[clamped]?.focus();
    },
    [count],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled || count === 0) return;
      if (event.defaultPrevented) return;
      if (shouldHandle && !shouldHandle()) return;
      // Read direction live from the container so RTL flips the horizontal
      // arrows without a prop (house precedent: color-picker).
      const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const rowStart = Math.floor(activeIndex / columnCount) * columnCount;
      const rowEnd = Math.min(rowStart + columnCount - 1, count - 1);
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          focusIndex(activeIndex + (isRtl ? -1 : 1));
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusIndex(activeIndex + (isRtl ? 1 : -1));
          break;
        case "ArrowDown":
          event.preventDefault();
          focusIndex(activeIndex + columnCount);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusIndex(activeIndex - columnCount);
          break;
        case "Home":
          event.preventDefault();
          focusIndex(homeEndScope === "row" ? rowStart : 0);
          break;
        case "End":
          event.preventDefault();
          focusIndex(homeEndScope === "row" ? rowEnd : count - 1);
          break;
        default:
          break;
      }
    },
    [
      activeIndex,
      columnCount,
      count,
      disabled,
      focusIndex,
      homeEndScope,
      shouldHandle,
    ],
  );

  const getItemProps = React.useCallback(
    (index: number): UseListNavItemProps => ({
      tabIndex: index === activeIndex ? 0 : -1,
      ref: (node: HTMLElement | null) => {
        itemRefs.current[index] = node;
      },
      onFocus: () => setActiveIndex(index),
    }),
    [activeIndex],
  );

  return {
    activeIndex,
    setActiveIndex,
    focusIndex,
    handleKeyDown,
    getItemProps,
  };
}
