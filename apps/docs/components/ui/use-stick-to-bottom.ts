// @vegastack use-stick-to-bottom@0.61.0 sha256-zPYmcLsrapKFb3YLI4lxfRSaekABlikXD9sBOe4KV5Y=

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
- The reader opening something (a press on a control with `aria-expanded` or `aria-controls` inside
  the content: Show more, an activity block) never moves the view: the growth that follows is
  theirs, so the view stays where they are reading and only lets go if it is no longer at the bottom.
- `scroller: "page"` follows the page instead of a pane: the nearest scrolling ancestor of the
  content (the app shell's content region, or the document) is the viewport, so a full-page chat
  scrolls like a document with the composer pinned under it. `atBottom` then drives the page's own
  Jump to latest button, since the engine's button only watches its own viewport.
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
  /**
   * What scrolls: `"viewport"`, the element passed to `attachViewport` (a `MessageScroller` pane);
   * `"page"`, the nearest scrolling ancestor of the element passed to `attachContent` — the page
   * itself — with no `MessageScroller` engine around the thread.
   * @default "viewport"
   */
  scroller?: "viewport" | "page";
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
  /**
   * The view is within `threshold` of the bottom. Drives a Jump to latest button the engine does
   * not own (`scroller: "page"`); a `MessageScroller` pane's own button already knows.
   */
  atBottom: boolean;
}

/** How long an upward gesture that moved nothing waits before it counts as no release at all. */
const GESTURE_SETTLE_MS = 250;

/** How long after the reader opens something its growth is theirs, not the thread's. */
const OPEN_HOLD_MS = 600;

/** The nearest ancestor of `node` that scrolls vertically, or the document's scrolling element. */
export function scrollParentOf(node: HTMLElement): HTMLElement {
  const page =
    (document.scrollingElement as HTMLElement | null) ??
    document.documentElement;
  for (let el = node.parentElement; el; el = el.parentElement) {
    // `<body>`'s and `<html>`'s overflow propagates to the viewport: the document scrolls.
    if (el === document.body || el === document.documentElement) return page;
    const { overflowY } = getComputedStyle(el);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    )
      return el;
  }
  return page;
}

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
 *
 * @example
 * // A full-page chat: the page scrolls, the composer is sticky at its foot.
 * const { attachContent, scrollToBottom, atBottom } = useStickToBottom({
 *   follow: lastOwnMessageId,
 *   scroller: "page",
 * });
 * <div ref={attachContent} role="log">…</div>
 * <div className="sticky bottom-0">
 *   {atBottom ? null : (
 *     <Button variant="secondary" size="icon-sm" onClick={() => scrollToBottom({ behavior: "smooth" })}>
 *       <ArrowDownIcon />
 *     </Button>
 *   )}
 *   <ChatComposer />
 * </div>
 */
export function useStickToBottom<
  Viewport extends HTMLElement = HTMLDivElement,
  Content extends HTMLElement = HTMLDivElement,
>({
  follow,
  threshold = 8,
  scroller = "viewport",
}: UseStickToBottomOptions = {}): UseStickToBottomResult<Viewport, Content> {
  const [ownViewport, setViewport] = React.useState<Viewport | null>(null);
  const [content, setContent] = React.useState<Content | null>(null);
  // Resolved after commit, and again when the window resizes: a responsive layout can move the
  // scrolling from the shell's content region to the document.
  const [pageScroller, setPageScroller] = React.useState<HTMLElement | null>(
    null,
  );
  React.useLayoutEffect(() => {
    if (scroller !== "page" || !content) {
      setPageScroller(null);
      return;
    }
    const resolve = () => setPageScroller(scrollParentOf(content));
    resolve();
    window.addEventListener("resize", resolve);
    return () => window.removeEventListener("resize", resolve);
  }, [scroller, content]);
  const viewport: HTMLElement | null =
    scroller === "page" ? pageScroller : ownViewport;
  const pinned = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    if (!viewport) return;
    // The document's scrolling element reports its scrolls on the window.
    const events: HTMLElement | Window =
      viewport === document.scrollingElement ? window : viewport;
    const report = () => setAtBottom(isAtScrollBottom(viewport, threshold));
    let lastTop = viewport.scrollTop;
    // Until when a resize is the reader's own opening of something (`OPEN_HOLD_MS`).
    let heldUntil = 0;
    let touchY: number | null = null;
    // Where an upward gesture let go. If the view never moved from there (a nested scroller took
    // the wheel, a pinch), the release was only provisional and the next resize pins it again.
    let gesture: { top: number; at: number } | null = null;
    const toBottom = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };
    const release = () => {
      // Only a pinned view has something to let go of; a reader already up stays where they are.
      if (!pinned.current || viewport.scrollTop <= 0) return;
      pinned.current = false;
      gesture = { top: viewport.scrollTop, at: performance.now() };
    };
    const onScroll = () => {
      const top = viewport.scrollTop;
      if (isAtScrollBottom(viewport, threshold)) pinned.current = true;
      else if (top < lastTop - 1) pinned.current = false;
      if (Math.abs(top - lastTop) > 1) gesture = null;
      lastTop = top;
      report();
    };
    // The reader opened or closed something: what grows is theirs to read, so the view stays put.
    // The browser's own scroll anchoring would keep a node below the opened part in place and so
    // push the opened text up out of view (measured: a Show more near the bottom moved the view
    // ~100px a frame later), so it is off for the hold too.
    let unhold: number | undefined;
    const anchoring = viewport.style.overflowAnchor;
    const onPress = (event: Event) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[aria-expanded],[aria-controls]")) return;
      heldUntil = performance.now() + OPEN_HOLD_MS;
      viewport.style.overflowAnchor = "none";
      window.clearTimeout(unhold);
      unhold = window.setTimeout(() => {
        viewport.style.overflowAnchor = anchoring;
      }, OPEN_HOLD_MS);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") onPress(event);
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
            if (performance.now() < heldUntil) {
              pinned.current = isAtScrollBottom(viewport, threshold);
              report();
              return;
            }
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
            report();
          });
    observer?.observe(viewport);
    if (content) observer?.observe(content);
    events.addEventListener("scroll", onScroll, { passive: true });
    events.addEventListener("wheel", onWheel as EventListener, {
      passive: true,
    });
    events.addEventListener("touchstart", onTouchStart as EventListener, {
      passive: true,
    });
    events.addEventListener("touchmove", onTouchMove as EventListener, {
      passive: true,
    });
    content?.addEventListener("click", onPress, { capture: true });
    content?.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.clearTimeout(unhold);
      viewport.style.overflowAnchor = anchoring;
      observer?.disconnect();
      events.removeEventListener("scroll", onScroll);
      events.removeEventListener("wheel", onWheel as EventListener);
      events.removeEventListener("touchstart", onTouchStart as EventListener);
      events.removeEventListener("touchmove", onTouchMove as EventListener);
      content?.removeEventListener("click", onPress, { capture: true });
      content?.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [viewport, content, threshold]);

  // The reader acted (sent): their newest line shows, wherever they had scrolled.
  React.useLayoutEffect(() => {
    if (!viewport) return;
    pinned.current = true;
    viewport.scrollTop = viewport.scrollHeight;
    setAtBottom(true);
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
    atBottom,
  };
}
