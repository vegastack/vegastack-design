// @vegastack panel-search@0.25.10 sha256-kP1edNC1FAIjRGMT/HXjKrvp5cr9A1TMDmgRqbWDShY=

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
 * hairline. The row is a field group (`data-field-group`), so while the field inside it holds
 * focus the row's hairline darkens subtly with an ease (text entry's border cue, FOC-3) and no fill
 * is painted — neither on the row nor on the field.
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
      data-field-group=""
      className={cn(
        "sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-border bg-popover px-3 transition-[color,background-color,border-color] duration-150 ease-out has-[input:focus]:border-ring/50",
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

/** Props accepted by `PanelList`. */
export type PanelListProps = React.ComponentProps<"div">;

/**
 * `PanelList` — the scrolling list under a `PanelSearch` row in a menu or popup. It scrolls on its
 * own (capped at 16rem), so the search row above it and the `PanelActions` footer below it stay
 * put, and its `py-1` keeps the first and last rows' highlight off the hairlines around it.
 *
 * @example
 * <DropdownMenuSubContent>
 *   <PanelSearch><PanelSearchField aria-label="Search members" /></PanelSearch>
 *   <PanelList>{members.map((m) => <DropdownMenuItem key={m.id}>{m.name}</DropdownMenuItem>)}</PanelList>
 * </DropdownMenuSubContent>
 */
export function PanelList({ className, ...props }: PanelListProps) {
  return (
    <div
      data-slot="panel-list"
      className={cn(
        "max-h-64 min-h-0 overflow-y-auto overscroll-contain py-1",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `PanelActions`. */
export interface PanelActionsProps extends React.ComponentProps<"div"> {
  /** The actions — menu items (`DropdownMenuItem`, `CommandItem`), each with a leading icon. */
  children: React.ReactNode;
}

/**
 * `PanelActions` — the footer of a searchable menu or popup: the static actions that are not
 * results ("Assign to me", "Unassign", "Clear"), below the list behind a hairline. It stays at the
 * bottom while the list scrolls (sticky, on the popup's own surface), renders whatever the search
 * matched — including nothing — and its items are ordinary menu items, so the arrow keys reach them
 * after the last result. Pair it with `PanelSearch` and `PanelList`; inside a cmdk `Command`, use
 * `CommandActions`, which keeps its items out of the filter.
 *
 * @example
 * <PanelActions>
 *   <DropdownMenuItem disabled={mine}><UserCheck />Assign to me</DropdownMenuItem>
 *   <DropdownMenuItem disabled={!assignee}><UserMinus />Unassign</DropdownMenuItem>
 * </PanelActions>
 */
export function PanelActions({
  className,
  children,
  ...props
}: PanelActionsProps) {
  return (
    <div
      role="group"
      data-slot="panel-actions"
      className={cn(
        "sticky bottom-0 z-10 -mx-1 -mb-1 border-t border-border bg-popover p-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
