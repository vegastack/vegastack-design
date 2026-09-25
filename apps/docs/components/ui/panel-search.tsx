// @vegastack panel-search@0.23.29 sha256-66bgaCjx9RbPnezafmgjlRKfk2pkj9DKGzTGj5vqhFg=

"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * PanelSearch — the panel's own search row (decision OVL-11), and the ONE copy of it.
 *
 * A popup that filters its own content puts the search at the top of the panel as a sticky header
 * row: a leading glyph, a hairline below, and NO bordered box of its own, because a bordered input
 * inside a bordered popup nests two borders (audit B8-04). Upstream has no equivalent — its
 * `CommandInput` IS an `InputGroup` box inside the panel, which is exactly the box-in-box OVL-11
 * rejects — so this row is ours, and it stays ours.
 *
 * It used to live inside `floating-surface` as `PanelSearchFrame`/`PanelSearchInput`. Batch 7a of
 * the shadcn reset retired that component on the rule that each popup owns its chrome, which left
 * `emoji-picker` and `shortcut-overlay` holding two byte-identical private copies; Batch 7c gives
 * the row one owner again. "Each popup owns its chrome" is about a popup's SURFACE — its portal,
 * positioner, padding and border, which upstream now paints per component. A search row shared
 * across popups is not that: it is the exception itself, and an exception with two
 * implementations is an exception waiting to drift.
 *
 * Off the components nav, like `data-table-parts` and `table-scroll-region`: it is an internal
 * shared part, documented in the components guide, installed as a dependency of the popups that
 * use it rather than browsed on its own.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `PanelSearch`. */
export interface PanelSearchProps extends React.ComponentProps<"div"> {
  /** The field — normally a `PanelSearchField`. */
  children: React.ReactNode;
}

/**
 * `PanelSearch` — the sticky search header inside a popup panel: leading glyph, the field, and a
 * hairline that tints to `ring/70` while the field inside it holds focus (FOC-3's border tint,
 * lifted to the row because the row is what draws the border).
 *
 * @example
 * <PopoverContent>
 *   <PanelSearch>
 *     <PanelSearchField placeholder="Search emoji" value={query} onChange={…} />
 *   </PanelSearch>
 *   …results…
 * </PopoverContent>
 */
export function PanelSearch({
  className,
  children,
  ...props
}: PanelSearchProps) {
  return (
    <div
      data-slot="panel-search"
      className={cn(
        "sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-border bg-popover px-3 focus-within:border-ring/70",
        className,
      )}
      {...props}
    >
      <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      {children}
    </div>
  );
}

/** Props accepted by `PanelSearchField`. */
export type PanelSearchFieldProps = React.ComponentProps<typeof BaseInput>;

/**
 * `PanelSearchField` — the borderless `type="search"` field that fills a `PanelSearch` row. It
 * paints no box and no focus ring of its own: the row above owns both, which is the whole point
 * of OVL-11.
 *
 * @example
 * <PanelSearchField placeholder="Search shortcuts" aria-label="Search shortcuts" />
 */
export function PanelSearchField({
  className,
  ...props
}: PanelSearchFieldProps) {
  return (
    <BaseInput
      type="search"
      className={cn(
        "h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
