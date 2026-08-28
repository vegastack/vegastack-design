// @vegastack tabs@0.5.0 sha256-qO5xLEPYD54DepR2cU/2wpS9zmnoZTYFk6LNJl0L6+I=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * Tabs (Root) — groups the list and the panels, owns orientation.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `Tabs`. */
export interface TabsProps extends React.ComponentProps<typeof BaseTabs.Root> {
  /**
   * Layout flow direction. `horizontal` lays the tab row above the panels;
   * `vertical` stacks the tab list beside the panels.
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * `Tabs` — the root that groups a `TabsList` with its `TabsContent` panels and
 * owns the `orientation`. Flat, shadcn-style API over Base UI Tabs:
 * `Tabs` → `TabsList` → `TabsTrigger` + `TabsContent`.
 *
 * @example
 * <Tabs defaultValue="overview">
 *   <TabsList variant="line">
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *     <TabsTrigger value="activity" count={3}>Activity</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">…</TabsContent>
 *   <TabsContent value="activity">…</TabsContent>
 * </Tabs>
 */
export function Tabs({
  className,
  orientation = "horizontal",
  ref,
  ...props
}: TabsProps) {
  return (
    <BaseTabs.Root
      ref={ref}
      data-slot="tabs"
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-4 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * TabsList — the row/column of triggers. `variant` drives the active treatment:
 *   - line: transparent track with a moving underline `Indicator`.
 *   - pill: muted track; the active trigger gets a raised `bg-background` chip.
 * ----------------------------------------------------------------------------------------------*/

export const tabsListVariants = cva(
  // Horizontal lists scroll instead of overflowing the viewport when the tab row is wider than
  // its container (labels are whitespace-nowrap); max-w-full keeps the scroll region inside the
  // parent rather than growing past it. scroll-fade-x (the CSS-only edge-fade utility from
  // @vegastack/design-tokens/utilities.css, same family message-scroller uses) masks the clipped edge
  // so a partially-hidden last tab reads as "more tabs this way" instead of a hard cut — the
  // fade only appears on the edge that actually has off-screen content (scroll-driven
  // animation, zero JS).
  "group/tabs-list relative inline-flex items-center group-data-[orientation=horizontal]/tabs:max-w-full group-data-[orientation=horizontal]/tabs:overflow-x-auto group-data-[orientation=horizontal]/tabs:scroll-fade-x group-data-[orientation=horizontal]/tabs:scrollbar-none group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:items-stretch",
  {
    variants: {
      variant: {
        line: cn(
          "gap-1 bg-transparent",
          // bottom rule the underline indicator rides along (horizontal)…
          "group-data-[orientation=horizontal]/tabs:border-b group-data-[orientation=horizontal]/tabs:border-border",
          // …or an inline-start rule (vertical), mirrored in RTL.
          "group-data-[orientation=vertical]/tabs:border-s group-data-[orientation=vertical]/tabs:border-border",
        ),
        pill: "gap-1 rounded-lg bg-muted p-1 text-muted-foreground group-data-[orientation=vertical]/tabs:w-fit",
        /** Free-standing chip tabs (Wave 2 — the record-page treatment): no track;
         * the active trigger raises to a secondary chip with the one hairline. */
        chip: "gap-1 bg-transparent group-data-[orientation=vertical]/tabs:w-fit",
      },
    },
    defaultVariants: { variant: "line" },
  },
);

/** Props accepted by `TabsList`. */
export interface TabsListProps
  extends
    React.ComponentProps<typeof BaseTabs.List>,
    VariantProps<typeof tabsListVariants> {
  /**
   * Active-tab treatment.
   * - `line`: transparent track with a moving underline indicator (default).
   * - `pill`: muted track; the active tab becomes a raised `bg-background` chip.
   * - `chip`: free-standing tabs, no track; the active tab raises to a
   *   hairline-ringed `secondary` chip (the dense record-page treatment).
   * @default 'line'
   */
  variant?: "line" | "pill" | "chip";
}

/**
 * `TabsList` — groups the `TabsTrigger`s. For the `line` variant it also hosts
 * the moving `TabsIndicator`; the `pill` variant styles the active trigger
 * directly. Carries `data-variant` so triggers can react via `group` selectors.

 *
 * @example
 * <TabsList />
 */
export function TabsList({
  className,
  variant = "line",
  children,
  ref,
  ...props
}: TabsListProps) {
  return (
    <BaseTabs.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {variant === "line" ? (
        <BaseTabs.Indicator
          data-slot="tabs-indicator"
          // Rides the active tab via Base UI's --active-tab-* CSS vars (positions
          // are token-driven, not hardcoded). Underline on the bottom rule for
          // horizontal, on the inline-start rule for vertical.
          className={cn(
            // The active-tab underline is `primary` (the selected-state ink).
            "absolute bg-primary transition-[inset-inline-start,top,width,height] duration-fast ease-standard",
            // Sits flush on the list rule. Horizontal uses `bottom-0` (NOT a negative `-bottom-px`)
            // on purpose: the list is a horizontal scroll container (`overflow-x-auto`), and per the
            // CSS overflow spec an `auto` x-axis promotes the `visible` y-axis to `auto` too — so a
            // 1px negative offset would spill 1px below the box and leave the strip scrollable
            // vertically by that sliver even when every tab fits (the scrollbar is hidden by
            // `scrollbar-none`, so it reads as a phantom "still scrolls a bit"). `bottom-0` keeps the
            // 2px underline fully inside the box, so a fitting tab row has no scrollable overflow at all.
            // `--active-tab-left`/`--active-tab-right` are PHYSICAL distances (from the container's
            // left / right edge), but `start-*` is LOGICAL. In LTR start==left so the left var is
            // correct; in RTL start==right, where the left distance puts the underline under the
            // wrong tab — so RTL is fed Base UI's matching `--active-tab-right`.
            "group-data-[orientation=horizontal]/tabs:bottom-0 group-data-[orientation=horizontal]/tabs:start-[var(--active-tab-left)] rtl:group-data-[orientation=horizontal]/tabs:start-[var(--active-tab-right)] group-data-[orientation=horizontal]/tabs:h-0.5 group-data-[orientation=horizontal]/tabs:w-[var(--active-tab-width)]",
            "group-data-[orientation=vertical]/tabs:-start-px group-data-[orientation=vertical]/tabs:top-[var(--active-tab-top)] group-data-[orientation=vertical]/tabs:h-[var(--active-tab-height)] group-data-[orientation=vertical]/tabs:w-0.5",
          )}
        />
      ) : null}
    </BaseTabs.List>
  );
}

/* ------------------------------------------------------------------------------------------------
 * TabsTrigger — an individual tab button. Active styling keys off Base UI's
 * `data-active`, scoped per-variant via the list's `group-data-[variant=…]`.
 * Supports a leading icon (composed as children) + a trailing `count` badge.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `TabsTrigger`. */
export interface TabsTriggerProps extends React.ComponentProps<
  typeof BaseTabs.Tab
> {
  /**
   * Optional count rendered as a trailing badge — e.g. unread or item totals.
   * Tinted muted by default; the active tab brightens it.

   * @default undefined
   */
  count?: number;
}

/**
 * `TabsTrigger` — a single tab button (Base UI `Tabs.Tab`). Active state is
 * exposed as `data-active` and styled per the parent list's `variant`. Compose a
 * leading icon as the first child (`<TabsTrigger value="x"><Icon />Label</…>`)
 * and pass `count` for a trailing badge.

 *
 * @example
 * <TabsTrigger />
 */
export function TabsTrigger({
  className,
  count,
  children,
  ref,
  ...props
}: TabsTriggerProps) {
  return (
    <BaseTabs.Tab
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        // Shared chrome.
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-label text-muted-foreground focus-visible:-outline-offset-2 select-none",
        "hover:text-foreground data-[active]:text-foreground",
        // Base UI's Tabs.Tab is `focusableWhenDisabled` (no native `disabled` attribute —
        // disabled state is surfaced as `data-disabled`/`aria-disabled`), so style `data-disabled`;
        // the native variant is kept for a consumer-rendered plain button via `render`.
        "disabled:pointer-events-none disabled:opacity-(--opacity-dim)",
        "data-disabled:pointer-events-none data-disabled:opacity-(--opacity-dim)",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
        // line: flush, sized to align with the list rule on the 32px control scale;
        // active color only (the moving Indicator paints the primary underline).
        "group-data-[variant=line]/tabs-list:h-(--size-md) group-data-[variant=line]/tabs-list:rounded-md group-data-[variant=line]/tabs-list:px-3",
        "group-data-[variant=line]/tabs-list:hover:bg-muted/(--alpha-wash-strong)",
        "group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:justify-start",
        // pill: raised chip on active, on the 32px control scale.
        "group-data-[variant=pill]/tabs-list:h-(--size-md) group-data-[variant=pill]/tabs-list:rounded-md group-data-[variant=pill]/tabs-list:px-3",
        "group-data-[variant=pill]/tabs-list:data-[active]:bg-background group-data-[variant=pill]/tabs-list:data-[active]:text-foreground",
        "group-data-[orientation=vertical]/tabs:group-data-[variant=pill]/tabs-list:justify-start",
        // chip: free-standing on the 28px scale; active = secondary chip + the one border.
        "group-data-[variant=chip]/tabs-list:h-(--size-sm) group-data-[variant=chip]/tabs-list:rounded-md group-data-[variant=chip]/tabs-list:border group-data-[variant=chip]/tabs-list:border-transparent group-data-[variant=chip]/tabs-list:px-2.5 group-data-[variant=chip]/tabs-list:text-label-sm",
        "group-data-[variant=chip]/tabs-list:hover:bg-muted/(--alpha-wash-strong)",
        "group-data-[variant=chip]/tabs-list:data-[active]:border-border group-data-[variant=chip]/tabs-list:data-[active]:bg-secondary group-data-[variant=chip]/tabs-list:data-[active]:text-foreground",
        "group-data-[orientation=vertical]/tabs:group-data-[variant=chip]/tabs-list:justify-start",
        className,
      )}
      {...props}
    >
      {children}
      {count != null ? (
        <span
          data-slot="tabs-trigger-count"
          className={cn(
            "ms-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-muted px-1 text-label-sm tabular-nums text-muted-foreground ",
            "group-data-[variant=pill]/tabs-list:bg-background/(--alpha-backdrop-soft)",
            "group-data-[variant=chip]/tabs-list:bg-muted/(--alpha-wash-strong)",
          )}
        >
          {count}
        </span>
      ) : null}
    </BaseTabs.Tab>
  );
}

/* ------------------------------------------------------------------------------------------------
 * TabsContent — the panel shown for the active tab.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `TabsContent`. */
export type TabsContentProps = React.ComponentProps<typeof BaseTabs.Panel>;

/**
 * `TabsContent` — the panel (Base UI `Tabs.Panel`) shown when its sibling
 * `TabsTrigger` of the same `value` is active. Keeps a `:focus-visible` ring for
 * keyboard users who tab into the panel.

 *
 * @example
 * <TabsContent />
 */
export function TabsContent({ className, ref, ...props }: TabsContentProps) {
  return (
    <BaseTabs.Panel
      ref={ref}
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
