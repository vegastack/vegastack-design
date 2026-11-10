// @vegastack use-stick-to-bottom@0.61.0 sha256-OuBuX3oUFadgOSY19tWu5PB8dtIrd6cqOCpermb8+P4=

"use client";

import * as React from "react";

import { usePrefersReducedMotion } from "@/components/ui/use-media-query";

/* ---
WHY THIS HOOK EXISTS — the chat thread's follow-the-newest behaviour, owned in one place.

`MessageScroller`'s engine (`@shadcn/react` 0.3.1, the latest) has its own `autoScroll`, but it
lets go of the bottom on the reader's INTENT rather than on a scroll: any wheel, touch-move or
scrolling key (Space, arrows, PageDown — also bubbling from a button inside a message) switches it
to "free scrolling" even when nothing moved because the view was already at the bottom, and only a
later scroll by the reader switches it back. A reader who nudges the wheel while an answer streams
loses the follow for the rest of the answer. It also never scrolls on a send while the reader is
scrolled up. The engine is upstream's (no patch may change its behaviour), so the follow lives
here and the engine keeps what it does well: the first position and the Jump to latest button.

MECHANISM — the stick-to-bottom pattern:
- Pinned while the view is within `threshold` of the bottom. A ResizeObserver on the content (and
  the viewport) moves a pinned view to the new bottom before paint: streamed tokens, an activity
  block opening, an image loading, a reconnect re-rendering the thread.
- Only a real move UP lets go: a scroll whose `scrollTop` went down while not at the bottom, or an
  upward wheel / touch drag (caught before its scroll lands, so a resize in the same frame cannot
  pull the reader back). A content shrink clamps `scrollTop` down but leaves the view at the
  bottom, so it stays pinned. Reaching the bottom again — by hand or with Jump to latest — re-pins.
- `follow` re-pins and scrolls: pass the id of the reader's newest message, and a send always shows
  it, wherever they had scrolled.
--- */

/** Options accepted by `useStickToBottom`. */
export interface UseStickToBottomOptions {
  /**
   * A value that changes when the reader acts and must see the newest line — the id of their
   * newest message. Each change pins the view and scrolls it to the bottom.
   * @default undefined
   */
  follow?: unknown;
  /**
   * How close to the bottom, in pixels, still counts as at the bottom. Keep it equal to the
   * scroller's edge threshold, so the Jump to latest button shows exactly when the view lets go.
   * @default 8
   */
  threshold?: number;
}

/** What `useStickToBottom` returns. */
export interface UseStickToBottomResult<
  Viewport extends HTMLElement,
  Content extends HTMLElement,
> {
  /**
   * Attach to the scrolling element (`MessageScrollerViewport`'s `ref`). Destructure the result:
   * React's compiler reads `result.attachViewport` in JSX as a ref read during render.
   */
  attachViewport: React.RefCallback<Viewport>;
  /** Attach to the element that grows with the messages (`MessageScrollerContent`'s `ref`). */
  attachContent: React.RefCallback<Content>;
  /**
   * Pin the view and scroll to the bottom — the Jump to latest button's action. `smooth` becomes
   * an instant jump under `prefers-reduced-motion`.
   */
  scrollToBottom: (options?: { behavior?: ScrollBehavior }) => void;
}

/** How long an upward gesture that moved nothing waits before it counts as no release at all. */
const GESTURE_SETTLE_MS = 250;

/** Within `threshold` pixels of the bottom of `element`'s scroll range. */
export function isAtScrollBottom(
  element: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
  threshold = 8,
): boolean {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}

/**
 * `useStickToBottom` — keeps a chat thread on its newest line while the reader is there, lets go the
 * moment they scroll up, and comes back when they reach the bottom again or send (`follow`). Use it
 * with `MessageScroller` and the engine's own `autoScroll` off: the engine still places the thread
 * at its end on open and drives `MessageScrollerButton`.
 *
 * @example
 * const { attachViewport, attachContent, scrollToBottom } = useStickToBottom({
 *   follow: lastOwnMessageId,
 * });
 * <MessageScrollerProvider defaultScrollPosition="end">
 *   <MessageScroller>
 *     <MessageScrollerViewport ref={attachViewport}>
 *       <MessageScrollerContent ref={attachContent}>…</MessageScrollerContent>
 *     </MessageScrollerViewport>
 *     <MessageScrollerButton
 *       onClick={(event) => {
 *         event.preventDefault();
 *         scrollToBottom({ behavior: "smooth" });
 *       }}
 *     />
 *   </MessageScroller>
 * </MessageScrollerProvider>
 */
export function useStickToBottom<
  Viewport extends HTMLElement = HTMLDivElement,
  Content extends HTMLElement = HTMLDivElement,
>({
  follow,
  threshold = 8,
}: UseStickToBottomOptions = {}): UseStickToBottomResult<Viewport, Content> {
  const [viewport, setViewport] = React.useState<Viewport | null>(null);
  const [content, setContent] = React.useState<Content | null>(null);
  const pinned = React.useRef(true);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    if (!viewport) return;
    let lastTop = viewport.scrollTop;
    let touchY: number | null = null;
    // Where an upward gesture let go. If the view never moved from there (a nested scroller took
    // the wheel, a pinch), the release was only provisional and the next resize pins it again.
    let gesture: { top: number; at: number } | null = null;
    const toBottom = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };
    const release = () => {
      if (viewport.scrollTop <= 0) return;
      pinned.current = false;
      gesture = { top: viewport.scrollTop, at: performance.now() };
    };
    const onScroll = () => {
      const top = viewport.scrollTop;
      if (isAtScrollBottom(viewport, threshold)) pinned.current = true;
      else if (top < lastTop - 1) pinned.current = false;
      if (Math.abs(top - lastTop) > 1) gesture = null;
      lastTop = top;
    };
    // An upward gesture lets go before its scroll lands, so a resize in between can't undo it.
    const onWheel = (event: WheelEvent) => {
      // ⌘/Ctrl-wheel is a zoom, not a scroll.
      if (event.deltaY < 0 && !event.ctrlKey && !event.metaKey) release();
    };
    const onTouchStart = (event: TouchEvent) => {
      touchY =
        event.touches.length === 1 ? (event.touches[0]?.clientY ?? null) : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y =
        event.touches.length === 1 ? event.touches[0]?.clientY : undefined;
      if (y === undefined) return;
      // A finger moving down drags the content down: the view goes up.
      if (touchY !== null && y > touchY) release();
      touchY = y;
    };
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (
              !pinned.current &&
              gesture &&
              viewport.scrollTop === gesture.top &&
              performance.now() - gesture.at > GESTURE_SETTLE_MS
            ) {
              pinned.current = true;
              gesture = null;
            }
            if (pinned.current) toBottom();
          });
    observer?.observe(viewport);
    if (content) observer?.observe(content);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("wheel", onWheel, { passive: true });
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      observer?.disconnect();
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
    };
  }, [viewport, content, threshold]);

  // The reader acted (sent): their newest line shows, wherever they had scrolled.
  React.useLayoutEffect(() => {
    if (!viewport) return;
    pinned.current = true;
    viewport.scrollTop = viewport.scrollHeight;
  }, [follow, viewport]);

  const scrollToBottom = React.useCallback(
    ({ behavior = "auto" }: { behavior?: ScrollBehavior } = {}) => {
      if (!viewport) return;
      pinned.current = true;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: reducedMotion ? "auto" : behavior,
      });
    },
    [viewport, reducedMotion],
  );

  return {
    attachViewport: setViewport,
    attachContent: setContent,
    scrollToBottom,
  };
}
