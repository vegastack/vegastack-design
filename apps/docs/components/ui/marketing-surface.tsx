// @vegastack marketing-surface@0.2.0 sha256-rrVo0BMSmKA6VrM3zwFJNvivnZ8aMB33e60hsgHMmRQ=

// @vegastack marketing-surface@0.1.0 — new component; run `pnpm run registry:build` to stamp
// integrity + regenerate the copy-in/JSON.

'use client';

import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
import { cn } from '@vegastack/design';

export interface MarketingSurfaceProps extends React.ComponentPropsWithRef<'div'> {
  /**
   * Replace the rendered element via Base UI `render` composition — e.g.
   * `render={<section />}` so a hero band is a real `<section>` landmark.
   * Pass a `ReactElement` or a render function.
   */
  render?: useRender.RenderProp;
}

/**
 * `MarketingSurface` — opts a subtree into the marketing brand's dark warm
 * ground (`.vs-marketing`, `@vegastack/design-tokens/utilities.css`; audit
 * 17-brand-direction §Color & surface, CX-10), INDEPENDENT of the page's
 * `.dark` class. This is THE scope mechanism: a product page can stay light
 * while its marketing hero renders dark, because `.vs-marketing` re-binds the
 * same semantic custom properties `.dark` sets, scoped locally instead of
 * gated on the page-root class.
 *
 * Every semantic token utility inside it — `bg-background`, `text-foreground`,
 * `border-border`, `bg-brand`, a composed `Button`/`Badge`/`Card` — resolves
 * to the dark warm-ramp values with **zero code changes**, because only the
 * custom-property VALUES change, never the utility-to-var wiring. Nest
 * `MarketingSurface` inside `MarketingSurface` and inside `.dark` freely; the
 * values are identical either way.
 *
 * Renders a plain `<div>` by default; pass `render={<section />}` (or a
 * render function) to compose a different host element.
 *
 * **Portal limitation** (documented, not solved here): Base UI floating
 * surfaces (Popover, Dialog, Menu, Select, Tooltip, …) portal to `<body>`,
 * OUTSIDE this scoped subtree — anything portaled from inside a
 * `MarketingSurface` renders with the PAGE theme, not the marketing dark
 * ground. Marketing surfaces rarely need portals (a hero/section band is not
 * app chrome); if one genuinely does, style it explicitly at the portal root.
 *
 * @example
 * <MarketingSurface render={<section />} className="px-6 py-24">
 *   <SectionHeader eyebrow="VegaStack" title="Ship agentic UI, fast." />
 * </MarketingSurface>
 */
export function MarketingSurface({
  className,
  render,
  children,
  ref,
  ...props
}: MarketingSurfaceProps) {
  return useRender({
    render: render ?? <div />,
    defaultTagName: 'div',
    ref,
    props: {
      'data-slot': 'marketing-surface',
      className: cn('vs-marketing bg-background text-foreground', className),
      children,
      ...props,
    },
  });
}
