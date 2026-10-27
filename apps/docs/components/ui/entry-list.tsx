// @vegastack entry-list@0.25.92 sha256-wUUCcNt0Q9XrePZ6pElUXnKj2ZE7FARNV2qrYux/W3w=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * EntryList — a short, compact list of plain entries inside a sheet, a dialog or a popover: a
 * line of 14px text, its muted details (who, when, a state) and small actions at its end. Not a
 * table and not a list of cards: no padding, no borders, no hover — `Item` is for rows that are
 * themselves targets, `DataList` for records. Space the entries with a gap on the list.
 * ----------------------------------------------------------------------------------------------*/

/**
 * `EntryList` — the list (`ul`), its entries stacked; give it the gap between them.
 *
 * @example
 * <EntryList className="gap-1">
 *   <Entry>Task Install glazing is now Done <EntryMeta>(Asha, 2h ago)</EntryMeta></Entry>
 * </EntryList>
 */
export function EntryList({
  className,
  ...props
}: React.ComponentPropsWithRef<"ul">) {
  return (
    // `role="list"`: the reset's `list-style: none` makes Safari drop the list semantics.
    <ul
      role="list"
      data-slot="entry-list"
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    />
  );
}

/** Props accepted by `Entry`. */
export interface EntryProps extends React.ComponentPropsWithRef<"li"> {
  /**
   * `row` — text, details and actions on one line that wraps; `stack` — the details on their own
   * line over the text (an edit: "2h ago · Asha" then what changed).
   * @default "row"
   */
  layout?: "row" | "stack";
}

/**
 * `Entry` — one entry (`li`): 14px text in the foreground ink, with `EntryMeta` details and
 * `EntryActions` at its end.
 *
 * @example
 * <Entry>
 *   Section moved <EntryMeta>(Asha, 2h ago)</EntryMeta>
 *   <EntryActions><Button size="xs" variant="ghost">Open</Button></EntryActions>
 * </Entry>
 */
export function Entry({ layout = "row", className, ...props }: EntryProps) {
  return (
    <li
      data-slot="entry"
      data-layout={layout}
      className={cn(
        "min-w-0 text-sm text-foreground",
        layout === "row"
          ? "flex flex-wrap items-center gap-x-2 gap-y-1"
          : "flex flex-col items-start",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `EntryMeta` — an entry's details in the muted ink: who, when, a state.
 *
 * @example
 * <Entry>Section moved <EntryMeta>(Asha, 2h ago)</EntryMeta></Entry>
 */
export function EntryMeta({
  className,
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="entry-meta"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * `EntryActions` — an entry's small actions, pushed to the end of its line.
 *
 * @example
 * <EntryActions><Button size="xs" variant="ghost">Open</Button></EntryActions>
 */
export function EntryActions({
  className,
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="entry-actions"
      className={cn("ms-auto flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}
