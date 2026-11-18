// @vegastack global-bar@0.117.0 sha256-ZG3yumpSUI89JYmTpv6NshvukPI3/n/WhkGrc1X+58I=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { formatShortcut, usePlatform } from "@/components/ui/use-platform";

/* ---
The global bar's client leaf: the search trigger, which prints the platform's shortcuts (⌘K and
⌘J on a Mac, Ctrl+K and Ctrl+J elsewhere). With `ask` it is the one search-or-ask box (LAY-26),
whose "Ask {name}" chip replaced the trailing slot's Ask button. It only opens things; the app owns
the search palette and the assistant, and their shortcuts.
--- */

/** Props accepted by `GlobalBarSearch`. */
export interface GlobalBarSearchProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "size"
> {
  /** The words in the trigger. @default 'Search' */
  label?: string;
  /**
   * Search or ask in one box (LAY-26): an "Ask {name}" chip with its shortcut (⌘J) at the box's
   * end. The box turns into a 32px pill as wide as the bar allows; the trigger still opens the
   * search palette and the chip opens the assistant.
   * @default undefined
   */
  ask?: GlobalBarSearchAsk;
}

/** The ask chip at the end of `GlobalBarSearch`. */
export interface GlobalBarSearchAsk {
  /** The chip's words: "Ask William". */
  label: string;
  /** Opens the assistant. */
  onClick: () => void;
  /** The assistant's element id, for `aria-controls`. @default undefined */
  controls?: string;
  /** Whether the assistant is open, for `aria-expanded`. @default undefined */
  expanded?: boolean;
}

/**
 * `GlobalBarSearch` — the centre slot's search trigger: a field-shaped button with its shortcut
 * (⌘K). Clicking it opens the app's search palette. With `ask`, it is the one "Search or ask
 * anything…" box: a pill with an "Ask {name}" chip (⌘J) at its end.
 *
 * @example
 * <GlobalBarSearch onClick={() => setSearchOpen(true)} />
 * <GlobalBarSearch label="Search or ask anything…" onClick={openSearch}
 *   ask={{ label: "Ask William", onClick: openAssistant }} />
 */
export function GlobalBarSearch({
  label = "Search",
  ask,
  className,
  ...props
}: GlobalBarSearchProps) {
  const { os } = usePlatform({ fallbackOs: "mac" });
  if (ask)
    return (
      <div
        data-slot="global-bar-search"
        data-ask=""
        className={cn(
          // 580px at most (the bar's own width decides under that); a field on the canvas, so its
          // ground is the card's. The pill's ring darkens on hover like a text field's border.
          // A capsule (the top bar is the app's frame, BRD-12): the search and Ask sit 3px in on
          // every side (1px border + `p-0.5`), so their hover fills are concentric pills with an even
          // gap all round (operator, 2026-11-19).
          "flex h-8 w-[min(36.25rem,42cqw)] min-w-0 items-center gap-0.5 rounded-capsule border border-input bg-shell-card p-0.5 text-sm text-muted-foreground transition-colors duration-instant hover:border-input-hover @max-2xl/global-bar:w-auto",
          className,
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          aria-keyshortcuts={os === "mac" ? "Meta+K" : "Control+K"}
          className="h-6.5 min-w-0 flex-1 justify-start gap-2 rounded-capsule ps-2.5 pe-2 text-sm font-normal text-muted-foreground [&_svg:not([class*='size-'])]:size-4 hover:bg-transparent aria-expanded:bg-transparent"
          {...props}
        >
          <Search aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-start @max-2xl/global-bar:sr-only">
            {label}
          </span>
          <Kbd aria-hidden="true" className="@max-3xl/global-bar:hidden">
            {formatShortcut(["mod", "K"], os)}
          </Kbd>
        </Button>
        <span aria-hidden="true" className="h-4.5 w-px flex-none bg-border" />
        <Button
          data-slot="global-bar-search-ask"
          variant="ghost"
          size="xs"
          aria-keyshortcuts={os === "mac" ? "Meta+J" : "Control+J"}
          aria-controls={ask.controls}
          aria-expanded={ask.expanded}
          onClick={ask.onClick}
          className="h-6.5 flex-none gap-1.5 rounded-capsule bg-info/10 px-2.5 text-xs font-semibold text-info-text hover:bg-info/15 hover:text-info-text aria-expanded:bg-info/15"
        >
          <Sparkles aria-hidden="true" />
          <span className="@max-2xl/global-bar:sr-only">{ask.label}</span>
          <span
            aria-hidden="true"
            className="font-normal @max-3xl/global-bar:hidden"
          >
            {formatShortcut(["mod", "J"], os)}
          </span>
        </Button>
      </div>
    );
  return (
    <Button
      data-slot="global-bar-search"
      variant="outline"
      size="sm"
      aria-keyshortcuts={os === "mac" ? "Meta+K" : "Control+K"}
      className={cn(
        // Sized by the bar, not the window, so the sides keep room in a narrow shell; under 42rem it
        // shrinks to its icon and shortcut.
        "w-[min(28rem,30cqw)] min-w-0 @max-2xl/global-bar:w-auto justify-start gap-2 rounded-capsule font-normal text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Search aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-start @max-2xl/global-bar:sr-only">
        {label}
      </span>
      <Kbd aria-hidden="true">{formatShortcut(["mod", "K"], os)}</Kbd>
    </Button>
  );
}
