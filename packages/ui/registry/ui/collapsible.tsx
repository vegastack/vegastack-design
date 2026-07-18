// @vegastack collapsible@0.2.0 sha256-H9JcL3a0H6xF+LfwZ7+Di5Rfvp1T+ZV6nNYMcFrBJJw=

'use client';

import * as React from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { cn } from '@vegastack/design';

/* ------------------------------------------------------------------------------------------------
 * Collapsible — a single toggleable open/close region with an animated height, built on Base UI's
 * Collapsible. Exported FLAT (shadcn-style): `Collapsible` (=Root), `CollapsibleTrigger`,
 * `CollapsibleContent` (=Panel). The panel animates its height via Base UI's
 * `--collapsible-panel-height` CSS var + a token-duration transition, with enter/exit keyed off the
 * `data-starting-style`/`data-ending-style` data attributes.
 * ----------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------------------------------------
 * Collapsible (Root) — owns open/close state for the region.
 * ----------------------------------------------------------------------------------------------*/

export type CollapsibleProps = React.ComponentProps<typeof BaseCollapsible.Root>;

/**
 * `Collapsible` — the root that owns the open/close state of a single toggleable
 * region. Flat, shadcn-style API over Base UI Collapsible:
 * `Collapsible` → `CollapsibleTrigger` + `CollapsibleContent`.
 *
 * Use `defaultOpen` for an uncontrolled region, or `open` + `onOpenChange` to
 * control it. The open state is exposed as `data-open` / `data-panel-open` on the
 * parts for state styling.
 *
 * @example
 * <Collapsible defaultOpen>
 *   <CollapsibleTrigger>Show details</CollapsibleTrigger>
 *   <CollapsibleContent>…</CollapsibleContent>
 * </Collapsible>
 */
export function Collapsible({ className, ref, ...props }: CollapsibleProps) {
  return (
    <BaseCollapsible.Root
      ref={ref}
      data-slot="collapsible"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * CollapsibleTrigger — the button that toggles the region. Active/open state keys off Base UI's
 * `data-panel-open`; compose a chevron as a child and let it rotate via that attribute.
 * ----------------------------------------------------------------------------------------------*/

export type CollapsibleTriggerProps = React.ComponentProps<typeof BaseCollapsible.Trigger>;

/**
 * `CollapsibleTrigger` — the native `<button>` that toggles the region (Base UI
 * `Collapsible.Trigger`). Open state is exposed as `data-panel-open`; compose a
 * trailing chevron and rotate it via `group-data-[panel-open]` for an affordance.
 */
export function CollapsibleTrigger({ className, ref, ...props }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      ref={ref}
      data-slot="collapsible-trigger"
      className={cn(
        'group/collapsible-trigger inline-flex items-center justify-between gap-2 text-base font-medium text-foreground transition-colors duration-fast ease-standard select-none',
        'hover:underline',
        // Base UI surfaces root-level `disabled` as a `data-disabled` attribute
        // on the trigger (no native `disabled` attribute), so style both.
        'disabled:pointer-events-none disabled:opacity-(--opacity-dim)',
        'data-disabled:pointer-events-none data-disabled:opacity-(--opacity-dim)',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
        "[&_svg]:text-muted-foreground [&_svg]:transition-transform [&_svg]:duration-fast [&_svg]:ease-standard",
        'data-[panel-open]:[&_svg]:rotate-180',
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * CollapsibleContent — the panel shown when open. Animates height via Base UI's
 * `--collapsible-panel-height` CSS var + a token-duration transition; collapses to 0 at the
 * `data-starting-style`/`data-ending-style` boundaries.
 * ----------------------------------------------------------------------------------------------*/

export type CollapsibleContentProps = React.ComponentProps<typeof BaseCollapsible.Panel>;

/**
 * `CollapsibleContent` — the panel (Base UI `Collapsible.Panel`) revealed when the
 * region is open. Animates its height between `0` and the measured content height
 * using Base UI's `--collapsible-panel-height` CSS var with a token-duration
 * transition; the start/end frames (`data-starting-style`/`data-ending-style`)
 * pin the height to `0` so enter and exit both animate.
 *
 * `overflow-hidden` clips the content during the height transition. Apply padding
 * to an inner wrapper (not the panel) so it doesn't fight the height animation.
 */
export function CollapsibleContent({ className, ref, ...props }: CollapsibleContentProps) {
  return (
    <BaseCollapsible.Panel
      ref={ref}
      data-slot="collapsible-content"
      className={cn(
        'h-[var(--collapsible-panel-height)] overflow-hidden text-base text-muted-foreground',
        'transition-[height] duration-fast ease-standard',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
        className,
      )}
      {...props}
    />
  );
}
