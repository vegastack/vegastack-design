// @vegastack accordion@0.1.0 sha256-B3lsKZXcK0BaGGs2wE+AYUJy4XsTZrmI0342r0qJk4E=

'use client';

import * as React from 'react';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@vegastack/design';

/* ------------------------------------------------------------------------------------------------
 * Accordion (Root) — groups the collapsible items and owns single/multiple open behavior.
 * ----------------------------------------------------------------------------------------------*/

export type AccordionProps = React.ComponentProps<typeof BaseAccordion.Root>;

/**
 * `Accordion` — the root that groups a stack of collapsible `AccordionItem`s.
 * Flat, shadcn-style API over Base UI Accordion:
 * `Accordion` → `AccordionItem` → `AccordionTrigger` + `AccordionContent`.
 *
 * Single-open by default; pass Base UI's `multiple` prop when more than one
 * item can stay open at the same time. Controlled via `value`/`onValueChange`,
 * or uncontrolled via `defaultValue` (both arrays).
 *
 * @example
 * <Accordion defaultValue={['shipping']}>
 *   <AccordionItem value="shipping">
 *     <AccordionTrigger>Shipping</AccordionTrigger>
 *     <AccordionContent>Ships in 2–3 business days.</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="returns">
 *     <AccordionTrigger>Returns</AccordionTrigger>
 *     <AccordionContent>30-day return window.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 */
export function Accordion({ className, ref, ...props }: AccordionProps) {
  return (
    <BaseAccordion.Root
      ref={ref}
      data-slot="accordion"
      className={cn('w-full', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * AccordionItem — a single collapsible section. Carries the bottom rule that
 * separates stacked items; the last item drops its border.
 * ----------------------------------------------------------------------------------------------*/

export type AccordionItemProps = React.ComponentProps<typeof BaseAccordion.Item>;

/**
 * `AccordionItem` — pairs an `AccordionTrigger` (header) with its
 * `AccordionContent` (panel). Identify it with a unique `value`; pass `disabled`
 * to lock the section. Renders a bottom rule between stacked items.
 */
export function AccordionItem({ className, ref, ...props }: AccordionItemProps) {
  return (
    <BaseAccordion.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn('border-b border-border last:border-b-0', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * AccordionTrigger — the header button that opens/closes the panel. The trailing
 * chevron rotates 180° when the panel is open via Base UI's `data-panel-open`.
 * ----------------------------------------------------------------------------------------------*/

export type AccordionTriggerProps = React.ComponentProps<typeof BaseAccordion.Trigger>;

/**
 * `AccordionTrigger` — the header button (wrapped in an `AccordionHeader`
 * heading) that toggles its panel. Active state is exposed as `data-panel-open`,
 * which rotates the trailing `ChevronDown` 180°. Compose the label as children.
 */
export function AccordionTrigger({ className, children, ref, ...props }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header data-slot="accordion-header" className="flex">
      <BaseAccordion.Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger flex flex-1 items-center justify-between gap-4 py-3 text-left text-base font-medium text-foreground transition-colors duration-fast ease-standard',
          'hover:underline',
          // Base UI surfaces item/root-level `disabled` as a `data-disabled` attribute
          // on the trigger (no native `disabled` attribute), so style both.
          'disabled:pointer-events-none disabled:opacity-(--opacity-dim)',
          'data-disabled:pointer-events-none data-disabled:opacity-(--opacity-dim)',
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'shrink-0 text-muted-foreground transition-transform duration-fast ease-standard',
            'group-data-[panel-open]/accordion-trigger:rotate-180',
          )}
        />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

/* ------------------------------------------------------------------------------------------------
 * AccordionContent — the collapsible panel. Height animates from 0 ↔ content
 * height using Base UI's `--accordion-panel-height` CSS var, driven on the
 * `data-starting-style`/`data-ending-style` transition hooks.
 * ----------------------------------------------------------------------------------------------*/

export type AccordionContentProps = React.ComponentProps<typeof BaseAccordion.Panel>;

/**
 * `AccordionContent` — the collapsible panel (Base UI `Accordion.Panel`) shown
 * when its sibling `AccordionTrigger` is open. Animates its height between `0`
 * and the measured content height via the `--accordion-panel-height` CSS var,
 * transitioning on Base UI's `data-starting-style`/`data-ending-style` hooks.
 */
export function AccordionContent({ className, children, ref, ...props }: AccordionContentProps) {
  return (
    <BaseAccordion.Panel
      ref={ref}
      data-slot="accordion-content"
      className={cn(
        // Height animates the wrapper from 0 → measured height (and back).
        'h-[var(--accordion-panel-height)] overflow-hidden text-base text-muted-foreground',
        'transition-[height] duration-fast ease-standard',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
        className,
      )}
      {...props}
    >
      <div className="pb-3">{children}</div>
    </BaseAccordion.Panel>
  );
}
