// @vegastack global-bar@0.112.0 sha256-OiPSnE5V2OHaFHPx/EGK4aJ9p1IqNhrsv1etzTqSexY=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { formatShortcut, usePlatform } from "@/components/ui/use-platform";

/* ---
The global bar's client leaves: the two triggers that print the platform's shortcut (⌘K on a
Mac, Ctrl+K elsewhere). They only open things; the app owns the search palette and the
assistant, and their shortcuts.
--- */

/** Props accepted by `GlobalBarSearch`. */
export interface GlobalBarSearchProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "size"
> {
  /** The words in the trigger. @default 'Search' */
  label?: string;
}

/**
 * `GlobalBarSearch` — the centre slot's search trigger: a field-shaped button with its shortcut
 * (⌘K). Clicking it opens the app's search palette.
 *
 * @example
 * <GlobalBarSearch onClick={() => setSearchOpen(true)} />
 */
export function GlobalBarSearch({
  label = "Search",
  className,
  ...props
}: GlobalBarSearchProps) {
  const { os } = usePlatform({ fallbackOs: "mac" });
  return (
    <Button
      data-slot="global-bar-search"
      variant="outline"
      size="sm"
      aria-keyshortcuts={os === "mac" ? "Meta+K" : "Control+K"}
      className={cn(
        // Sized by the bar, not the window, so the sides keep room in a narrow shell; under 42rem it
        // shrinks to its icon and shortcut.
        "w-[min(28rem,30cqw)] min-w-0 @max-2xl/global-bar:w-auto justify-start gap-2 font-normal text-muted-foreground",
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

/** Props accepted by `GlobalBarAsk`. */
export interface GlobalBarAskProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "size"
> {
  /** The words in the button. @default 'Ask' */
  label?: string;
}

/**
 * `GlobalBarAsk` — the trailing slot's Ask button with its shortcut (⌘J): opens the assistant.
 *
 * @example
 * <GlobalBarAsk onClick={() => setAskOpen(true)} />
 */
export function GlobalBarAsk({
  label = "Ask",
  className,
  ...props
}: GlobalBarAskProps) {
  const { os } = usePlatform({ fallbackOs: "mac" });
  return (
    <Button
      data-slot="global-bar-ask"
      variant="ghost"
      size="sm"
      aria-keyshortcuts={os === "mac" ? "Meta+J" : "Control+J"}
      className={cn("gap-1.5", className)}
      {...props}
    >
      <Sparkles aria-hidden="true" />
      <span className="@max-3xl/global-bar:sr-only">{label}</span>
      <Kbd aria-hidden="true" className="@max-3xl/global-bar:hidden">
        {formatShortcut(["mod", "J"], os)}
      </Kbd>
    </Button>
  );
}
