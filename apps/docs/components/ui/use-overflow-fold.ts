// @vegastack use-overflow-fold@0.25.101 sha256-Da/BP8S1s8HE2ZFa9SGzoar5VZqGlWD/DhSSnaxOK3I=

"use client";

import * as React from "react";

/** Options accepted by `useOverflowFold`. */
export interface UseOverflowFoldOptions {
  /**
   * How much wider than the content the room must grow before a folded row unfolds again, in
   * pixels. The gap stops a row sitting right at the edge from folding and unfolding on every
   * frame (the fold control is narrower than the row it replaces, so the room jumps when it folds).
   * @default 24
   */
  hysteresis?: number;
  /**
   * Room the content shares with siblings inside the root that do not shrink (a `+` button, a ⋯),
   * in pixels — or a function that measures them on each pass.
   * @default 0
   */
  reserve?: number | ((root: HTMLElement) => number);
  /**
   * Never fold: the content always shows (a page that wants a scrolling row instead).
   * @default false
   */
  disabled?: boolean;
  /**
   * Values whose change should force a re-measure (the tab labels, their counts). The root and the
   * content are observed already; this is for content changes that move neither box.
   * @default []
   */
  deps?: React.DependencyList;
}

/** What `useOverflowFold` returns. */
export interface UseOverflowFoldResult<
  Root extends HTMLElement,
  Content extends HTMLElement,
> {
  /** Attach to the element whose width is the room — it must fill its host (`w-full min-w-0`). */
  rootRef: React.RefCallback<Root>;
  /**
   * Attach to the row that folds. Keep it mounted while folded (out of flow, `invisible`, `inert`)
   * so its natural width can still be measured.
   */
  contentRef: React.RefCallback<Content>;
  /** Whether the row is folded (the content does not fit the room). `false` until measured. */
  folded: boolean;
}

/**
 * `measureFold` — the decision `useOverflowFold` makes, as a pure function: fold when the content
 * (plus what it shares the room with) is wider than the room; unfold only once the room is wider
 * than that by `hysteresis`. Exported for a host that measures on its own schedule.
 *
 * @example
 * const next = measureFold({ need: list.scrollWidth, available: root.clientWidth, folded });
 */
export function measureFold({
  need,
  available,
  folded,
  hysteresis = 24,
}: {
  need: number;
  available: number;
  folded: boolean;
  hysteresis?: number;
}): boolean {
  // The +0.5 slack absorbs sub-pixel rounding, as `measureOverflow`'s +1 does.
  if (!folded) return need > available + 0.5;
  return need + hysteresis >= available;
}

/**
 * `useOverflowFold` — fold a row (tabs, saved views) into one control when it does not fit the
 * room it is given, measured rather than set by a breakpoint. The row stays mounted while folded
 * so its natural width is always known; the root's own width is the room. One `ResizeObserver`
 * watches both, so a window resize, a sidebar opening and a count arriving all re-decide.
 *
 * Shared by `TabsList overflow="menu"`, `RouteTabs overflow="menu"` and `ViewTabs`, so every row
 * that folds folds the same way (ListToolbar's collapse order relies on it).
 *
 * @example
 * const { rootRef, contentRef, folded } = useOverflowFold<HTMLDivElement, HTMLDivElement>();
 * <div ref={rootRef} className="w-full min-w-0">
 *   <div ref={contentRef} inert={folded} className={folded ? "invisible absolute" : "flex"}>…</div>
 *   {folded ? <FoldMenu /> : null}
 * </div>
 */
export function useOverflowFold<
  Root extends HTMLElement = HTMLElement,
  Content extends HTMLElement = HTMLElement,
>({
  hysteresis = 24,
  reserve = 0,
  disabled = false,
  deps = [],
}: UseOverflowFoldOptions = {}): UseOverflowFoldResult<Root, Content> {
  const [root, setRoot] = React.useState<Root | null>(null);
  const [content, setContent] = React.useState<Content | null>(null);
  const [folded, setFolded] = React.useState(false);
  const reserveRef = React.useRef(reserve);
  React.useEffect(() => {
    reserveRef.current = reserve;
  });

  React.useLayoutEffect(() => {
    if (disabled) {
      setFolded(false);
      return;
    }
    if (!root || !content) return;
    const measure = () => {
      const extra =
        typeof reserveRef.current === "function"
          ? reserveRef.current(root)
          : reserveRef.current;
      setFolded((current) =>
        measureFold({
          need: content.scrollWidth + extra,
          available: root.clientWidth,
          folded: current,
          hysteresis,
        }),
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(content);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, content, disabled, hysteresis, ...deps]);

  return {
    rootRef: setRoot as React.RefCallback<Root>,
    contentRef: setContent as React.RefCallback<Content>,
    folded: disabled ? false : folded,
  };
}
