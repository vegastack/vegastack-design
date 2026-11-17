// @vegastack global-bar@0.107.0 sha256-j6oYTvie5SXO1kKPf3WhCO2wDT9qQgJ8PXK5xlSPfLU=

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export {
  GlobalBarAsk,
  GlobalBarSearch,
  type GlobalBarAskProps,
  type GlobalBarSearchProps,
} from "@/components/ui/global-bar-client";

/* ---
WHY THIS SHAPE — one bar over the whole app (Layout v2, D1).

A 44px bar runs the full width of the window above the rail, the column and the page, on every
page: the app's own controls in three slots — leading (the column toggle, back and forward, the
workspace switcher), centre (the search trigger, ⌘K) and trailing (Ask, ⌘J, Help, the account).
The centre slot is centred on the window, whatever the two sides hold.

In the desktop app it is the window's title row: with `data-desktop-titlebar="macos"|"windows"` on
`<html>` the bar drags the window, its controls stay clickable, and its ends clear the window's own
buttons (`--shell-titlebar-mac-inset` before the leading slot, `--shell-titlebar-win-inset` after
the trailing one; the desktop app writes the real widths from its `titleBarGeometry`, 0 in full
screen). In a browser the leading slot's first control sits on the rail's centre line, so the bar
and the rail share one axis. On a phone (under 40rem of shell) the bar is hidden: the page's own
top row takes over. It renders on the server; only the search and Ask triggers, which print the
platform's shortcut, are client leaves.
--- */

/** Props accepted by `GlobalBar`. */
export type GlobalBarProps = React.ComponentProps<"header">;

/**
 * `GlobalBar` — the app's 44px top bar: `GlobalBarLeading`, `GlobalBarCenter` and
 * `GlobalBarTrailing`. Pass it to `Shell` as `globalBar`; it is the desktop app's title row.
 *
 * @example
 * <GlobalBar>
 *   <GlobalBarLeading><ShellColumnToggle /><GlobalBarHistory history={history} /><WorkspaceSwitcher /></GlobalBarLeading>
 *   <GlobalBarCenter><GlobalBarSearch onClick={openSearch} /></GlobalBarCenter>
 *   <GlobalBarTrailing><GlobalBarAsk onClick={openAsk} /><HelpMenu … /><AccountMenu /></GlobalBarTrailing>
 * </GlobalBar>
 */
export function GlobalBar({ className, ...props }: GlobalBarProps) {
  return (
    <header
      data-slot="global-bar"
      data-shell-region="global-bar"
      tabIndex={-1}
      className={cn(
        // Equal side columns and no padding of its own, so the centre slot is the window's centre.
        "@container/global-bar grid h-(--shell-globalbar-height) min-w-0 flex-none grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 bg-sidebar text-sidebar-foreground outline-none @max-[40rem]/shell:hidden",
        // The desktop title row drags the window; everything you can press stays pressable.
        "in-data-desktop-titlebar:[-webkit-app-region:drag] in-data-desktop-titlebar:[&_:is(button,a,input,[role=button],[role=combobox])]:[-webkit-app-region:no-drag]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `GlobalBarLeading` — the bar's start: the column toggle, back and forward, the workspace
 * switcher.
 *
 * @example
 * <GlobalBarLeading><ShellColumnToggle /><WorkspaceSwitcher /></GlobalBarLeading>
 */
export function GlobalBarLeading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="global-bar-leading"
      className={cn(
        "flex min-w-0 items-center justify-start gap-0.5",
        // In a browser the first control (28px) sits on the rail's centre line: half the rail,
        // less its 1px edge, less half the control. In the desktop app the traffic lights win.
        "ps-[calc((var(--shell-rail-width)-1px)/2-0.875rem)]",
        // The window's buttons stay on their physical edge in either direction: the traffic lights
        // on the left (the leading slot's side in LTR), Windows' captions on the right.
        "in-data-[desktop-titlebar=macos]:ltr:ps-[max(var(--shell-titlebar-mac-inset),calc((var(--shell-rail-width)-1px)/2-0.875rem))]",
        "in-data-[desktop-titlebar=windows]:rtl:ps-[max(calc(var(--shell-titlebar-win-inset)+0.5rem),calc((var(--shell-rail-width)-1px)/2-0.875rem))]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `GlobalBarCenter` — the bar's middle, centred on the window: the search trigger.
 *
 * @example
 * <GlobalBarCenter><GlobalBarSearch onClick={openSearch} /></GlobalBarCenter>
 */
export function GlobalBarCenter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="global-bar-center"
      className={cn("flex min-w-0 items-center justify-center", className)}
      {...props}
    />
  );
}

/**
 * `GlobalBarTrailing` — the bar's end: Ask, Help and the account.
 *
 * @example
 * <GlobalBarTrailing><GlobalBarAsk onClick={openAsk} /><AccountMenu /></GlobalBarTrailing>
 */
export function GlobalBarTrailing({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="global-bar-trailing"
      className={cn(
        "flex min-w-0 items-center justify-end gap-1 pe-2",
        // The Windows caption buttons sit over the bar's end.
        "in-data-[desktop-titlebar=windows]:ltr:pe-[calc(var(--shell-titlebar-win-inset)+0.5rem)]",
        "in-data-[desktop-titlebar=macos]:rtl:pe-[max(var(--shell-titlebar-mac-inset),0.5rem)]",
        className,
      )}
      {...props}
    />
  );
}

/** Back and forward: the desktop app's history (browsers have their own). */
export interface GlobalBarHistoryState {
  canGoBack: boolean;
  canGoForward: boolean;
  back: () => void;
  forward: () => void;
}

/** Props accepted by `GlobalBarHistory`. */
export interface GlobalBarHistoryProps extends React.ComponentProps<"div"> {
  /** Where the window can go, and how to go there. */
  history: GlobalBarHistoryState;
}

/**
 * `GlobalBarHistory` — ‹ › in the leading slot. Render it in the desktop app only; a browser has
 * its own back and forward.
 *
 * @example
 * {history ? <GlobalBarHistory history={history} /> : null}
 */
export function GlobalBarHistory({
  history,
  className,
  ...props
}: GlobalBarHistoryProps) {
  return (
    <div
      data-slot="global-bar-history"
      // A narrow bar keeps its room for the workspace: ‹ › leave (the window keeps ⌘[ and ⌘]).
      className={cn(
        "flex flex-none items-center gap-0.5 @max-3xl/global-bar:hidden",
        className,
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Back"
        disabled={!history.canGoBack}
        onClick={history.back}
      >
        <ChevronLeft aria-hidden="true" className="rtl:-scale-x-100" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Forward"
        disabled={!history.canGoForward}
        onClick={history.forward}
      >
        <ChevronRight aria-hidden="true" className="rtl:-scale-x-100" />
      </Button>
    </div>
  );
}
