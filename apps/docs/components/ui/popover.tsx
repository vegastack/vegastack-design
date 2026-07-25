// @vegastack popover@0.3.0 sha256-yrrcqEnM0GnT9cSa3FQt3qc8K/7rLFnpueDqCG+MnV8=

"use client";

import * as React from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { cn, FLOATING } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

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
 * Popover — a click-triggered floating panel for arbitrary content, built on Base UI's Popover.
 * Exported FLAT (shadcn-style): `Popover` (=Root), `PopoverTrigger`, `PopoverContent` (composes
 * Portal + Positioner + Popup, optionally wraps children in Viewport, uses the `bg-popover` token
 * surface, owns side/sideOffset/align positioning, and can render an arrow), `PopoverClose`,
 * `PopoverArrow`, plus optional `PopoverTitle` / `PopoverDescription` for labelled panels.
 *
 * Enter/exit animate via Base UI's `data-starting-style` / `data-ending-style` data attributes +
 * token-duration transitions. Dismiss is built in — outside-press and Escape close the popover and
 * restore focus to the trigger.
 * ----------------------------------------------------------------------------------------------*/

/**
 * `Popover` — the root; owns open/close state (`open` / `defaultOpen` / `onOpenChange`). Renders no
 * DOM of its own — compose `PopoverTrigger` + `PopoverContent` inside it. **Modal by default**: while
 * open it locks background scroll so the anchored panel stays put (no page shift) — this is what the
 * popover-based pickers (date, color, emoji, country, combobox) want. Pass `modal={false}` for a
 * lightweight, non-blocking popover that keeps the rest of the page scrollable/interactive.
 *
 * @example
 * <Popover>
 *   <PopoverTrigger render={<Button variant="outline">Open</Button>} />
 *   <PopoverContent>
 *     <PopoverTitle>Dimensions</PopoverTitle>
 *     <PopoverDescription>Set the layout dimensions.</PopoverDescription>
 *   </PopoverContent>
 * </Popover>
 */
export type PopoverProps = React.ComponentProps<typeof BasePopover.Root>;

/** `Popover` root; controls anchored-panel open state and modality.
 *
 * @example
 * <Popover />
 */
export function Popover({ modal = true, ...props }: PopoverProps) {
  return <BasePopover.Root modal={modal} {...props} />;
}

/** Props accepted by `PopoverTrigger`. */
export type PopoverTriggerProps = React.ComponentProps<
  typeof BasePopover.Trigger
>;

/**
 * `PopoverTrigger` — the control that opens the popover on click. Renders a
 * `<button>`; pass `render` to compose it with a `Button` or any other action
 * element.

 *
 * @example
 * <PopoverTrigger />
 */
export function PopoverTrigger({ className, ...props }: PopoverTriggerProps) {
  return (
    <BasePopover.Trigger
      data-slot="popover-trigger"
      className={className}
      {...props}
    />
  );
}

/** Props accepted by `PopoverContent`. */
export interface PopoverContentProps extends React.ComponentProps<
  typeof BasePopover.Popup
> {
  /**
   * Which side of the trigger to place the popover on.
   * @default "bottom"
   */
  side?: React.ComponentProps<typeof BasePopover.Positioner>["side"];
  /**
   * Distance between the trigger and the popover, in pixels.
   * @default 8
   */
  sideOffset?: React.ComponentProps<
    typeof BasePopover.Positioner
  >["sideOffset"];
  /**
   * Alignment relative to the chosen side.
   * @default "center"
   */
  align?: React.ComponentProps<typeof BasePopover.Positioner>["align"];
  /**
   * Minimum distance to keep between the popover and the viewport edge, in pixels.
   * @default 8
   */
  collisionPadding?: React.ComponentProps<
    typeof BasePopover.Positioner
  >["collisionPadding"];
  /** Props forwarded to the underlying Base UI `Portal`.
   * @default undefined
   */
  portalProps?: Omit<
    React.ComponentProps<typeof BasePopover.Portal>,
    "children"
  >;
  /** Props forwarded to the underlying Base UI `Positioner`.
   * @default undefined
   */
  positionerProps?: Omit<
    React.ComponentProps<typeof BasePopover.Positioner>,
    "side" | "sideOffset" | "align" | "collisionPadding" | "children"
  >;
  /** Props forwarded to an optional Base UI `Viewport` that wraps popup children.
   * @default undefined
   */
  viewportProps?: Omit<
    React.ComponentProps<typeof BasePopover.Viewport>,
    "children"
  >;
  /**
   * Render a directional arrow pointing at the trigger.
   * @default false
   */
  arrow?: boolean;
}

/**
 * `PopoverContent` — the floating panel. Bundles Base UI's `Portal` + `Positioner` + `Popup` so
 * consumers render a single part, while exposing pass-through props for advanced Base UI portal,
 * positioner, and viewport configuration. Themed with `bg-popover` / `text-popover-foreground`, a
 * bordered `rounded-lg` surface with `p-4` padding, and animated in/out via
 * `data-[starting-style]` / `data-[ending-style]`. Place arbitrary content inside — text, forms,
 * menus, etc.

 *
 * @example
 * <PopoverContent />
 */
export function PopoverContent({
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
}: PopoverContentProps) {
  const themeScope = useInternalThemeScope();
  const { className: positionerClassName, ...positionerPropsRest } =
    positionerProps ?? {};
  const { className: viewportClassName, ...viewportPropsRest } =
    viewportProps ?? {};

  return (
    <BasePopover.Portal {...portalProps}>
      <BasePopover.Positioner
        {...positionerPropsRest}
        data-slot="popover-positioner"
        side={side}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={mergeStateClassName<BasePopover.Positioner.State>(
          cn(themeScope, "z-(--z-overlay)"),
          positionerClassName,
        )}
      >
        <BasePopover.Popup
          data-slot="popover-content"
          className={cn(
            themeScope,
            // The native outline is deliberately NOT stripped: the popup itself can receive
            // keyboard focus (initial focus / focus wrap), so the centralized base.css
            // `:focus-visible` outline stays as the indicator (WCAG 2.4.7, register P0-02).
            "z-(--z-overlay) w-72 max-w-[calc(100vw-var(--spacing)*8)] origin-(--transform-origin) rounded-lg border border-border bg-popover p-4 text-base text-popover-foreground shadow-overlay",
            // Enter/exit — scale + fade, token duration + standard easing.
            "transition-[transform,scale,opacity] duration-fast ease-standard",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {arrow ? <PopoverArrow /> : null}
          {viewportProps ? (
            <BasePopover.Viewport
              {...viewportPropsRest}
              data-slot="popover-viewport"
              className={mergeStateClassName<BasePopover.Viewport.State>(
                themeScope ?? "",
                viewportClassName,
              )}
            >
              {children}
            </BasePopover.Viewport>
          ) : (
            children
          )}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

/** Props accepted by `PopoverClose`. */
export type PopoverCloseProps = React.ComponentProps<typeof BasePopover.Close>;

/**
 * `PopoverClose` — closes the popover. Renders a `<button>`; pass `render` to compose it with a
 * `Button` (e.g. a "Done" or "Cancel" action inside the panel).

 *
 * @example
 * <PopoverClose />
 */
export function PopoverClose({ className, ...props }: PopoverCloseProps) {
  return (
    <BasePopover.Close
      data-slot="popover-close"
      className={className}
      {...props}
    />
  );
}

/** Props accepted by `PopoverArrow`. */
export type PopoverArrowProps = React.ComponentProps<typeof BasePopover.Arrow>;

/**
 * `PopoverArrow` — a small triangle anchored to the trigger. Rendered automatically when
 * `PopoverContent` receives `arrow`, or compose it directly. Wraps Base UI's `Popover.Arrow`.

 *
 * @example
 * <PopoverArrow />
 */
export function PopoverArrow({ className, ...props }: PopoverArrowProps) {
  return (
    <BasePopover.Arrow
      data-slot="popover-arrow"
      className={cn(
        "data-[side=bottom]:-top-1.5 data-[side=top]:-bottom-1.5 data-[side=left]:-right-1.5 data-[side=right]:-left-1.5",
        className,
      )}
      {...props}
    >
      <span className="block size-2.5 rotate-45 rounded-xs border-r border-b border-border bg-popover" />
    </BasePopover.Arrow>
  );
}

/** Props accepted by `PopoverTitle`. */
export type PopoverTitleProps = React.ComponentProps<typeof BasePopover.Title>;

/**
 * `PopoverTitle` — the popover's accessible name. Renders an `<h2>`; Base UI wires it to the popup
 * via `aria-labelledby`. Include one whenever the panel needs a heading.

 *
 * @example
 * <PopoverTitle />
 */
export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      data-slot="popover-title"
      className={cn("text-label text-foreground", className)}
      {...props}
    />
  );
}

/** Props accepted by `PopoverDescription`. */
export type PopoverDescriptionProps = React.ComponentProps<
  typeof BasePopover.Description
>;

/**
 * `PopoverDescription` — supporting text under the title. Renders a `<p>`; Base UI wires it to the
 * popup via `aria-describedby`.

 *
 * @example
 * <PopoverDescription />
 */
export function PopoverDescription({
  className,
  ...props
}: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      data-slot="popover-description"
      className={cn(
        "text-base leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
