// @vegastack message-scroller@0.1.0 sha256-Bnz0Eht/t0N8PbjgjpDsYxitmaGRdz/ga65PSROtU1Q=

"use client";

import * as React from "react";
import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "@shadcn/react/message-scroller";
import { ArrowDown } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button, type ButtonProps } from "@/components/ui/button";

/* ------------------------------------------------------------------------------------------------
 * MessageScroller — a virtualised, auto-scrolling conversation viewport built on the headless
 * `@shadcn/react/message-scroller` primitive (the one external primitive beyond Base UI, approved
 * for this component). It keeps a chat pinned to the latest message, preserves scroll position when
 * older messages prepend, tracks which message is the current anchor, and exposes a floating
 * scroll-to-end/start Button. Every class is a semantic token / our motion-ease tokens / the
 * `scroll-fade` + `scrollbar-*` utilities from `@vegastack/design-tokens/utilities.css`.
 * ----------------------------------------------------------------------------------------------*/

/**
 * SSR-safe read of the `(prefers-reduced-motion: reduce)` media query. `window`/`matchMedia` are
 * undefined during server rendering, so this returns `false` (no motion assumed reduced) until the
 * client effect in {@link usePrefersReducedMotion} can check the real value.
 */
function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tracks the user's `prefers-reduced-motion` OS setting, live — it re-reads on change (e.g. the user
 * flips the setting while the page is open), not just on mount. SSR-safe: the initial render always
 * returns `false` and the real value is picked up in a client-only effect, so this never throws or
 * mismatches during hydration.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(getPrefersReducedMotion);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQueryList.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQueryList.addEventListener("change", onChange);
    return () => mediaQueryList.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

export type MessageScrollerProviderProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Provider
>;

/**
 * `MessageScrollerProvider` — holds the scroll state (auto-scroll, anchor,
 * visibility). Wrap a `MessageScroller` in it; the hooks read from it.
 */
export function MessageScrollerProvider(props: MessageScrollerProviderProps) {
  return <MessageScrollerPrimitive.Provider {...props} />;
}

export type MessageScrollerProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Root
>;

/**
 * `MessageScroller` — the root flex column that fills its parent and clips
 * overflow. Holds the `MessageScrollerViewport`.
 */
export function MessageScroller({ className, ...props }: MessageScrollerProps) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export type MessageScrollerViewportProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Viewport
>;

/**
 * `MessageScrollerViewport` — the scrollable region. Fades its bottom edge
 * (`scroll-fade-b`), keeps a stable scrollbar gutter, and hides the scrollbar
 * during programmatic auto-scroll.
 */
export function MessageScrollerViewport({
  className,
  ...props
}: MessageScrollerViewportProps) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-none",
        className,
      )}
      {...props}
    />
  );
}

export type MessageScrollerContentProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Content
>;

/**
 * `MessageScrollerContent` — the inner column that holds the message items.
 * Grows to at least the viewport height so a short thread can still pin to the
 * bottom. Set `aria-busy` while a response is streaming.
 */
export function MessageScrollerContent({
  className,
  ...props
}: MessageScrollerContentProps) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn("flex h-max min-h-full flex-col gap-8", className)}
      {...props}
    />
  );
}

export type MessageScrollerItemProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Item
>;

/**
 * `MessageScrollerItem` — one item in the thread. Uses `content-visibility` to
 * skip rendering off-screen items (the `contain-intrinsic-size` hint reserves a
 * sensible default height). Set `scrollAnchor` on the item that should stay in
 * view, and `messageId` to target it from `useMessageScroller().scrollToMessage`.
 */
export function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: MessageScrollerItemProps) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn(
        "min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]",
        className,
      )}
      {...props}
    />
  );
}

export type MessageScrollerButtonProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Button
> &
  Pick<ButtonProps, "variant" | "size">;

/**
 * `MessageScrollerButton` — the floating "scroll to end" (or "start") affordance.
 * Renders our `Button`; it slides in only when the viewport is scrolled away
 * from the target edge (`data-active`) and animates out with our motion-ease
 * tokens. Defaults to a secondary `icon-sm` button with a down arrow.
 *
 * **Reduced motion:** the vendored primitive defaults its click-triggered scroll to
 * `behavior: "smooth"` (see `MessageScrollerButtonProps["behavior"]`, from
 * `@shadcn/react/message-scroller`) with no reduced-motion awareness. This wrapper checks
 * `(prefers-reduced-motion: reduce)` (via an SSR-safe `matchMedia` hook) and, when the user
 * prefers reduced motion, overrides the scroll to `behavior: "auto"` (an instant jump) —
 * regardless of what `behavior` the consumer passes — so the click-to-scroll affordance never
 * animates for someone who has asked the OS not to animate. Pass an explicit `behavior` to
 * control the non-reduced-motion case; it has no effect while reduced motion is preferred.
 *
 * @example
 * <MessageScrollerButton direction="end" />
 */
export function MessageScrollerButton({
  direction = "end",
  className,
  children,
  render,
  variant = "secondary",
  size = "icon-sm",
  behavior = "smooth",
  ...props
}: MessageScrollerButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const resolvedBehavior: ScrollBehavior = prefersReducedMotion ? "auto" : behavior;

  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      data-variant={variant}
      data-size={size}
      direction={direction}
      behavior={resolvedBehavior}
      className={cn(
        "absolute start-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-base hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-slow data-[active=false]:ease-exit data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-emphasized data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
        className,
      )}
      render={render ?? <Button variant={variant} size={size} />}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDown />
          <span className="sr-only">
            {direction === "end" ? "Scroll to end" : "Scroll to start"}
          </span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  );
}

export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
