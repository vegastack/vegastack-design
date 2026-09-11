// @vegastack terminal@0.7.5 sha256-Kz6nPW6s+W3cJ690YXvzsja0XKB/fwGAXGVG1I6dIBM=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { useOverflow } from "@/components/ui/use-overflow";

/** Props for `TerminalBody` — the scrollable command pane inside `Terminal`. */
export interface TerminalBodyProps extends React.ComponentProps<"div"> {
  /**
   * Accessible name for the pane. Wins over `labelledBy` — the two are never
   * emitted together, because `aria-labelledby` would silently take precedence
   * in the accessibility tree and the caller's `label` would be dropped.
   * @default undefined
   */
  label?: string;
  /**
   * Id of the element naming the pane — the visible Terminal title, by default.
   * Ignored when `label` is set.
   * @default undefined
   */
  labelledBy?: string;
}

/**
 * `TerminalBody` — the horizontally scrollable command pane, and the only client
 * leaf in the Terminal family.
 *
 * Terminal itself is server-safe (non-negotiable #3) and stays that way: the one
 * thing here that needs a hook — measuring whether the pane actually scrolls — is
 * isolated in this file, exactly as `table-scroll-region.tsx` is for `Table`.
 *
 * The pane takes `tabIndex={0}` **only while it overflows**. A scrollable region
 * that cannot be focused is unreachable without a pointer (axe
 * `scrollable-region-focusable`); an unconditional tab stop on a one-line install
 * snippet is the opposite error — a dead stop on every marketing page that shows
 * one. `useOverflow` settles which of the two applies, live.
 *
 * The NAME and the ROLE are unconditional, and only the tab stop moves. A bare
 * `<div tabindex="0">` maps to `generic`, which prohibits naming, so `aria-label`
 * on it is not reliably exposed; `group` accepts a name and is not a landmark —
 * `region` is, and a docs page with five install snippets would put five
 * landmarks in the rotor for no navigational value. Keeping the named group when
 * the pane happens to fit costs nothing and keeps the announced structure stable
 * across a resize, whereas a role that appears and disappears under the reader
 * as the viewport changes width does not.
 *
 * `scroll-fade-x` masks the element to its own border box, and the Terminal root
 * is `overflow-hidden`, so an outward focus outline is not painted at all — hence
 * `-outline-offset-2`. A border tint is not an option either: `forced-colors:
 * active` replaces border-color outright, which would leave this region with no
 * focus indicator in the forced palette.
 *
 * @example
 * <TerminalBody labelledBy={titleId}>
 *   <pre>pnpm add @vegastack/design</pre>
 * </TerminalBody>
 */
export function TerminalBody({
  className,
  label,
  labelledBy,
  children,
  ...props
}: TerminalBodyProps) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const scrollable = useOverflow(node, { axis: "inline" });

  return (
    <div
      {...props}
      ref={setNode}
      // Identity AFTER the spread — consumer props must not overwrite the slot
      // every selector and generated surface keys on.
      data-slot="terminal-body"
      data-scrollable={scrollable ? "" : undefined}
      tabIndex={scrollable ? 0 : undefined}
      role="group"
      aria-label={label}
      // Never emit both: `aria-labelledby` wins in the AT, so a caller passing
      // `aria-label` would otherwise be silently ignored.
      aria-labelledby={label ? undefined : labelledBy}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 overflow-x-auto scroll-fade-x px-4 py-3 font-mono text-code text-foreground focus-visible:-outline-offset-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
