// @vegastack message-scroller@0.7.0 sha256-Yzr1/mnkuXkau6FzGmkII7OxsNqbYVTsQwJ24YIh5ug=

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
import {
  type ButtonAppearance,
  type ButtonOwnProps,
} from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";

/* ------------------------------------------------------------------------------------------------
 * MessageScroller — a virtualised, auto-scrolling conversation viewport built on the headless
 * `@shadcn/react/message-scroller` primitive (the one external primitive beyond Base UI, approved
 * for this component). It keeps a chat pinned to the latest message, preserves scroll position when
 * older messages prepend, tracks which message is the current anchor, and exposes a floating
 * scroll-to-end/start Button. Every class is a semantic token / our motion-ease tokens / the
 * `scroll-fade` + `scrollbar-*` utilities from `@vegastack/design-tokens/utilities.css`.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageScrollerProvider`. */
export type MessageScrollerProviderProps = React.ComponentPropsWithRef<
  typeof MessageScrollerPrimitive.Provider
>;

/**
 * `MessageScrollerProvider` — holds the scroll state (auto-scroll, anchor,
 * visibility). Wrap a `MessageScroller` in it; the hooks read from it.
 * @example <MessageScrollerProvider><MessageScroller /></MessageScrollerProvider>
 */
export function MessageScrollerProvider(props: MessageScrollerProviderProps) {
  return <MessageScrollerPrimitive.Provider {...props} />;
}

/** Props accepted by `MessageScroller`. */
export type MessageScrollerProps = React.ComponentPropsWithRef<
  typeof MessageScrollerPrimitive.Root
>;

/**
 * `MessageScroller` — the root flex column that fills its parent and clips
 * overflow. Holds the `MessageScrollerViewport`.
 * @example <MessageScroller><MessageScrollerViewport /></MessageScroller>
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

/** Props accepted by `MessageScrollerViewport`. */
export type MessageScrollerViewportProps = React.ComponentPropsWithRef<
  typeof MessageScrollerPrimitive.Viewport
>;

/**
 * `MessageScrollerViewport` — the scrollable region. Fades its bottom edge
 * (`scroll-fade-b`), keeps a stable scrollbar gutter, and hides the scrollbar
 * during programmatic auto-scroll.
 *
 * **`data-pending-scroll`** (`@shadcn/react` ≥ 0.3.1): the primitive sets this on the root AND the
 * viewport from the first render until `defaultScrollPosition` (`"end"` / `"last-anchor"`) has been
 * applied in a layout effect. A server-rendered transcript would otherwise paint the TOP of the
 * thread for one frame before jumping to the bottom. We answer it with `invisible`
 * (`visibility: hidden`) rather than `hidden`/`display:none`: the primitive measures
 * `clientHeight` and `scrollHeight` to compute where to scroll, and a display-none viewport
 * measures zero. The attribute is cleared unconditionally on mount — with items it clears once the
 * scroll lands, and with an empty thread the primitive clears it directly — so this can never
 * strand a permanently invisible viewport (asserted in `message-scroller.test.tsx`).
 * @example <MessageScrollerViewport><MessageScrollerContent /></MessageScrollerViewport>
 */
export function MessageScrollerViewport({
  className,
  ...props
}: MessageScrollerViewportProps) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        // The ring turns inward: the scroller root clips (`overflow-hidden`), so an
        // outward-offset outline on the viewport was being cut off (SP-03).
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content focus-visible:-outline-offset-2 data-autoscrolling:scrollbar-none data-pending-scroll:invisible",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MessageScrollerContent`. */
export type MessageScrollerContentProps = React.ComponentPropsWithRef<
  typeof MessageScrollerPrimitive.Content
>;

/**
 * `MessageScrollerContent` — the inner column that holds the message items.
 * Grows to at least the viewport height so a short thread can still pin to the
 * bottom. Set `aria-busy` while a response is streaming.
 * @example <MessageScrollerContent aria-busy={streaming}>{messages}</MessageScrollerContent>
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

/** Props accepted by `MessageScrollerItem`. */
export type MessageScrollerItemProps = React.ComponentPropsWithRef<
  typeof MessageScrollerPrimitive.Item
>;

/**
 * `MessageScrollerItem` — one item in the thread. Uses `content-visibility` to
 * skip rendering off-screen items (the `contain-intrinsic-size` hint reserves a
 * sensible default height). Set `scrollAnchor` on the item that should stay in
 * view, and `messageId` to target it from `useMessageScroller().scrollToMessage`.
 * @example <MessageScrollerItem messageId="message-1">Hello</MessageScrollerItem>
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
        "min-w-0 shrink-0 [contain-intrinsic-size:auto_calc(var(--spacing)*40)] [content-visibility:auto]",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MessageScrollerButton`. */
export type MessageScrollerButtonProps = React.ComponentPropsWithRef<
  typeof MessageScrollerPrimitive.Button
> &
  Pick<ButtonOwnProps, "size"> &
  ButtonAppearance;

/**
 * `MessageScrollerButton` — the floating "scroll to end" (or "start") affordance.
 * Renders our `IconButton`; it docks in only when the viewport is scrolled away
 * from the target edge (`data-active`), using the shared `motion-dock-in` /
 * `motion-dock-out` pair — 150ms in, 100ms out, translate and fade, no scale.
 *
 * Defaults to an `outline` `sm` icon button with a down arrow: `outline` IS a
 * page-coloured face with the one hairline and the surface-ladder hover, which
 * is what this control used to reach by overriding `variant="secondary"` with
 * `bg-background border-border hover:bg-muted` inline (audit B9-08).
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
  variant = "outline",
  tone,
  size = "sm",
  behavior = "smooth",
  ...props
}: MessageScrollerButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const resolvedBehavior: ScrollBehavior = prefersReducedMotion
    ? "auto"
    : behavior;

  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      data-variant={variant}
      data-size={size}
      direction={direction}
      behavior={resolvedBehavior}
      className={cn(
        // Docked to an edge of the viewport, horizontally centred. The enter/exit grammar is the
        // shared `motion-dock-*` pair (150 in / 100 out, no scale — audit B9-08/B8-11); only the
        // per-edge DISTANCE is stated here, which is what the pair deliberately leaves to the dock.
        "absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2",
        "data-[active=true]:motion-dock-in data-[active=true]:translate-y-0 data-[active=false]:motion-dock-out",
        "data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full",
        "data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full data-[direction=start]:[&_svg]:rotate-180",
        className,
      )}
      render={
        render ?? (
          <IconButton
            {...({ variant, tone } as ButtonAppearance)}
            size={size}
            aria-label={
              direction === "end" ? "Scroll to end" : "Scroll to start"
            }
          />
        )
      }
      {...props}
    >
      {/* Icon-only by contract: the accessible name comes from the `IconButton`'s `aria-label`
          above, so a `children` override should be an icon, never visible text. */}
      {children ?? <ArrowDown />}
    </MessageScrollerPrimitive.Button>
  );
}

export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
