// @vegastack marketing-surface@0.6.0 sha256-jQpTD+ux89Jjvsa7GhyO3NGVNtru6o90/6D7EowM3kw=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@vegastack/design";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";

/** Props accepted by `MarketingSurface`. */
export interface MarketingSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Replace the rendered element via Base UI `render` composition — e.g.
   * `render={<section />}` so a hero band is a real `<section>` landmark.
   * Pass a `ReactElement` or a render function.
   * @default undefined
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
 * Portaled VegaStack overlays keep this scope through an internal React
 * context. Their portaled backdrop/viewport/positioner/surface DOM nodes apply
 * `vs-marketing`, so they resolve the same semantic values even though Base UI
 * mounts them under `<body>`.
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
  const surface = useRender({
    render: render ?? <div />,
    defaultTagName: "div",
    ref,
    props: {
      "data-slot": "marketing-surface",
      className: cn("vs-marketing bg-background text-foreground", className),
      children,
      ...props,
    },
  });

  return (
    <InternalThemeScopeProvider scope="vs-marketing">
      {surface}
    </InternalThemeScopeProvider>
  );
}
