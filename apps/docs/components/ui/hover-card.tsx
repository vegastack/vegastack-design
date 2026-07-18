// @vegastack hover-card@0.1.0 sha256-9aR2QG+uauZgMCsdlf2eSsn9OAvP/0XxxrdMduNUf3Y=

"use client";

import * as React from "react";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { cn, TIMINGS, FLOATING } from "@vegastack/design";

function mergeStateClassName<State>(
  className: string,
  userClassName: string | ((state: State) => string | undefined) | undefined,
) {
  if (typeof userClassName === "function") {
    return (state: State) => cn(className, userClassName(state));
  }

  return cn(className, userClassName);
}

/* ------------------------------------------------------------------------------------------------
 * HoverCard — a rich preview panel that opens when a trigger is hovered or focused, built on Base
 * UI's PreviewCard. Unlike a Tooltip, the panel is fully interactive: the open/close delays give
 * the pointer time to travel from the trigger into the card, so consumers can put links, buttons,
 * and selectable text inside.
 *
 * Exported FLAT (shadcn-style): `HoverCard` (=Root, owns `openDelay` / `closeDelay`),
 * `HoverCardTrigger`, `HoverCardContent` (composes Portal + Positioner + Popup, optionally wraps
 * children in Viewport, uses the `bg-popover` token surface, owns `side` / `align` positioning, and
 * can render an arrow), plus `HoverCardArrow` for direct composition.
 *
 * Enter/exit animate via Base UI's `data-starting-style` / `data-ending-style` data attributes +
 * token-duration transitions.
 *
 * PRESENTATIONAL (G7): the card renders whatever children it is given. It does NOT fetch, resolve,
 * or know about any entity — the app passes already-resolved user / agent / team preview content as
 * children. Keep data-loading (and its loading / empty / error states) in app-side wrappers.
 * ----------------------------------------------------------------------------------------------*/

// Base UI puts the open/close delays on the *Trigger* (not the Root). The platform API — and our
// flat surface — exposes them on the root, so we flow them down through context to the trigger
// without forcing consumers to pass them twice.
const DelayContext = React.createContext<{
  openDelay?: number;
  closeDelay?: number;
}>({});

/**
 * `HoverCard` — the root that groups the trigger and content. Renders no DOM of its own — compose
 * `HoverCardTrigger` + `HoverCardContent` inside it. Owns open/close state (`open` / `defaultOpen`
 * / `onOpenChange`) and the hover open/close delays.
 *
 * @example
 * <HoverCard>
 *   <HoverCardTrigger render={<a href="/u/ada">@ada</a>} />
 *   <HoverCardContent>
 *     {/* app passes resolved preview content here *\/}
 *     <UserPreview user={user} />
 *   </HoverCardContent>
 * </HoverCard>
 */
export interface HoverCardProps extends Omit<
  React.ComponentProps<typeof BasePreviewCard.Root>,
  "children"
> {
  /**
   * How long to wait before opening, in milliseconds, after the pointer enters the trigger. The
   * delay guards against accidental opens while the pointer passes over.
   * @default 700
   */
  openDelay?: number;
  /**
   * How long to wait before closing, in milliseconds, after the pointer leaves. Gives the pointer
   * time to travel from the trigger into the (interactive) card.
   * @default 300
   */
  closeDelay?: number;
  /** The trigger and content parts. */
  children?: React.ReactNode;
}

export function HoverCard({
  children,
  openDelay = TIMINGS.hoverOpenDelayMs,
  closeDelay = TIMINGS.hoverCloseDelayMs,
  ...props
}: HoverCardProps) {
  const delay = React.useMemo(
    () => ({ openDelay, closeDelay }),
    [openDelay, closeDelay],
  );
  return (
    <BasePreviewCard.Root data-slot="hover-card" {...props}>
      <DelayContext.Provider value={delay}>{children}</DelayContext.Provider>
    </BasePreviewCard.Root>
  );
}

export interface HoverCardTriggerProps extends React.ComponentProps<
  typeof BasePreviewCard.Trigger
> {}

/**
 * `HoverCardTrigger` — the element the card attaches to. Renders an `<a>` by default (preview cards
 * typically anchor to a link, e.g. a `@username`); pass `render` to project the card onto your own
 * element. Inherits the root's `openDelay` / `closeDelay` unless overridden here. Wraps Base UI's
 * `PreviewCard.Trigger`.
 */
export function HoverCardTrigger({
  delay,
  closeDelay,
  ...props
}: HoverCardTriggerProps) {
  const inherited = React.useContext(DelayContext);
  return (
    <BasePreviewCard.Trigger
      data-slot="hover-card-trigger"
      delay={delay ?? inherited.openDelay}
      closeDelay={closeDelay ?? inherited.closeDelay}
      {...props}
    />
  );
}

export interface HoverCardContentProps extends React.ComponentProps<
  typeof BasePreviewCard.Popup
> {
  /**
   * Which side of the trigger to place the card on.
   * @default "bottom"
   */
  side?: React.ComponentProps<typeof BasePreviewCard.Positioner>["side"];
  /**
   * Distance between the trigger and the card, in pixels.
   * @default 8
   */
  sideOffset?: React.ComponentProps<
    typeof BasePreviewCard.Positioner
  >["sideOffset"];
  /**
   * Alignment relative to the chosen side.
   * @default "center"
   */
  align?: React.ComponentProps<typeof BasePreviewCard.Positioner>["align"];
  /**
   * Minimum distance to keep between the card and the viewport edge, in pixels.
   * @default 8
   */
  collisionPadding?: React.ComponentProps<
    typeof BasePreviewCard.Positioner
  >["collisionPadding"];
  /** Props forwarded to the underlying Base UI `PreviewCard.Portal`. */
  portalProps?: Omit<
    React.ComponentProps<typeof BasePreviewCard.Portal>,
    "children"
  >;
  /** Props forwarded to the underlying Base UI `PreviewCard.Positioner`. */
  positionerProps?: Omit<
    React.ComponentProps<typeof BasePreviewCard.Positioner>,
    "side" | "sideOffset" | "align" | "collisionPadding" | "children"
  >;
  /** Props forwarded to an optional Base UI `PreviewCard.Viewport` that wraps popup children. */
  viewportProps?: Omit<
    React.ComponentProps<typeof BasePreviewCard.Viewport>,
    "children"
  >;
  /**
   * Render a directional arrow pointing at the trigger.
   * @default false
   */
  arrow?: boolean;
}

/**
 * `HoverCardContent` — the floating preview panel. Bundles Base UI PreviewCard's `Portal` +
 * `Positioner` + `Popup` so consumers render a single part, while exposing pass-through props for
 * advanced portal, positioner, and viewport configuration. Themed with `bg-popover` /
 * `text-popover-foreground`, a bordered `rounded-lg` `w-64` surface with `p-4` padding, and
 * animated in/out via `data-[starting-style]` / `data-[ending-style]`.
 *
 * Place arbitrary, app-resolved content inside — an avatar + name + stats row, a team summary, an
 * agent card. Override `className` (e.g. `w-80`) when the preview needs more room.
 */
export function HoverCardContent({
  className,
  children,
  side = "bottom",
  sideOffset = FLOATING.sideOffsetDetached,
  align = "center",
  collisionPadding = FLOATING.collisionPadding,
  portalProps,
  positionerProps,
  viewportProps,
  arrow = false,
  ...props
}: HoverCardContentProps) {
  const { className: positionerClassName, ...positionerPropsRest } =
    positionerProps ?? {};

  return (
    <BasePreviewCard.Portal {...portalProps}>
      <BasePreviewCard.Positioner
        {...positionerPropsRest}
        data-slot="hover-card-positioner"
        side={side}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={mergeStateClassName<BasePreviewCard.Positioner.State>(
          "z-(--z-overlay)",
          positionerClassName,
        )}
      >
        <BasePreviewCard.Popup
          data-slot="hover-card-content"
          className={cn(
            // The native outline is deliberately NOT stripped: the centralized base.css
            // `:focus-visible` outline stays as the indicator if the popup ever receives
            // keyboard focus (register P0-02).
            "z-(--z-overlay) w-64 max-w-[calc(100vw-var(--spacing)*8)] origin-(--transform-origin) rounded-lg border border-border bg-popover p-4 text-base text-popover-foreground shadow-overlay",
            // Enter/exit — scale + fade, token duration + standard easing.
            "transition-[transform,scale,opacity] duration-fast ease-standard",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {arrow ? <HoverCardArrow /> : null}
          {viewportProps ? (
            <BasePreviewCard.Viewport
              {...viewportProps}
              data-slot="hover-card-viewport"
            >
              {children}
            </BasePreviewCard.Viewport>
          ) : (
            children
          )}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}

export type HoverCardArrowProps = React.ComponentProps<
  typeof BasePreviewCard.Arrow
>;

/**
 * `HoverCardArrow` — a small triangle anchored to the trigger. Rendered automatically when
 * `HoverCardContent` receives `arrow`, or compose it directly. Wraps Base UI's `PreviewCard.Arrow`.
 */
export function HoverCardArrow({ className, ...props }: HoverCardArrowProps) {
  return (
    <BasePreviewCard.Arrow
      data-slot="hover-card-arrow"
      className={cn(
        "data-[side=bottom]:-top-1.5 data-[side=top]:-bottom-1.5 data-[side=left]:-right-1.5 data-[side=right]:-left-1.5",
        className,
      )}
      {...props}
    >
      <span className="block size-2.5 rotate-45 rounded-xs border-r border-b border-border bg-popover" />
    </BasePreviewCard.Arrow>
  );
}
