// @vegastack context-ring@0.81.0 sha256-huN4wKCin+EBkWrd//vNUip+ZhUZrFUM1j5A+OPvo60=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  ContextPanel,
  contextTotal,
  formatContextTokens,
  type ContextPanelLabels,
  type ContextPart,
} from "@/components/ui/context-panel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * ContextRing — how full a chat's working memory is, as a still 10px ring and its share in the
 * quiet line under the composer: a muted track with a foreground arc, primary from 75%, the warning
 * ink from 90%. Nothing shows before the first measurement, and it never spins. Hover or focus opens
 * the `ContextPanel` after 150ms; a click toggles it.
 * ----------------------------------------------------------------------------------------------*/

/** The ring's ink: `default` under 75%, `high` from 75%, `full` from 90%. */
export type ContextRingTone = "default" | "high" | "full";

/** Props accepted by `ContextRing`. */
export interface ContextRingProps extends Omit<
  React.ComponentPropsWithRef<"button">,
  "children"
> {
  /** Tokens the last request carried; `null` before the chat's first answer (nothing shows). */
  used: number | null;
  /** The chat's working window, in tokens. */
  window: number;
  /** Where older messages get summarised, as a share of the window (0–1). @default 0.9 */
  threshold?: number;
  /** What fills the window, for the panel. @default [] */
  parts?: readonly ContextPart[];
  /** Summarize now in the panel; without it, no button. @default undefined */
  onSummarize?: () => void | Promise<unknown>;
  /** A summary is under way. @default false */
  summarizing?: boolean;
  /**
   * Pressing opens the host's own surface (a phone's sheet) instead of the hover panel.
   * @default undefined
   */
  onOpen?: () => void;
  /** Words for a token count. @default compact: 25.9k, 1M */
  formatTokens?: (tokens: number) => string;
  /** The ring's accessible name. @default (percent) => `Chat memory ${percent}% used` */
  label?: (percent: number) => string;
  /** The panel's words. @default undefined */
  labels?: ContextPanelLabels;
}

/** The ink for a share of the window (0–1). */
export function contextRingTone(share: number): ContextRingTone {
  if (share >= 0.9) return "full";
  if (share >= 0.75) return "high";
  return "default";
}

const ARC: Record<ContextRingTone, string> = {
  default: "var(--color-foreground)",
  high: "var(--color-primary)",
  full: "var(--color-warning-text)",
};

/** Hover and focus wait this long before the panel opens, so passing over it does nothing. */
const OPEN_DELAY_MS = 150;

/**
 * `ContextRing` — a still 10px ring and its share ("◔ 26%") for a chat composer's actions row (`ChatComposerActionsEnd`): muted
 * track, foreground arc, primary from 75%, the warning ink from 90%. Hidden until measured. Hover or
 * focus opens `ContextPanel` after 150ms and a click toggles it; with `onOpen` the host opens its
 * own surface instead. When the share drops (a summary ran) it says the new share once.
 *
 * @example
 * <ContextRing
 *   used={25_900}
 *   window={200_000}
 *   parts={[
 *     { id: "instructions", label: "Instructions and tools", tokens: 15_700 },
 *     { id: "conversation", label: "Conversation", tokens: 10_200 },
 *   ]}
 *   onSummarize={summarize}
 * />
 */
export function ContextRing({
  used,
  window: windowTokens,
  threshold = 0.9,
  parts,
  onSummarize,
  summarizing = false,
  onOpen,
  formatTokens = formatContextTokens,
  label,
  labels,
  className,
  onClick,
  onFocus,
  onBlur,
  ...props
}: ContextRingProps) {
  // The same total its panel shows, so the two never disagree.
  const total = contextTotal(used, windowTokens, parts);
  const measured = total !== null;
  const shareOf = measured ? total / windowTokens : 0;
  const percent = Math.round(shareOf * 100);
  const tone = contextRingTone(shareOf);
  const name = label?.(percent) ?? `Chat memory ${percent}% used`;

  const { announce, Announcer } = useAnnouncer();
  // Say the new share once when it drops (a summary ran), never on mount or as it grows.
  // The share shown is what's compared, so a drop the parts make is said too.
  const previous = React.useRef(total);
  React.useEffect(() => {
    const before = previous.current;
    previous.current = total;
    if (before !== null && total !== null && total < before) announce(name);
  }, [total, name, announce]);

  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const later = (next: boolean) => {
    clear();
    timer.current = setTimeout(() => setOpen(next), OPEN_DELAY_MS);
  };
  React.useEffect(() => clear, []);

  if (!measured) return null;

  const trigger = (
    <Button
      variant="ghost"
      size="xs"
      data-slot="context-ring"
      data-tone={tone}
      aria-label={name}
      className={cn(
        "h-8 gap-1.5 rounded-full px-2.5 text-xs font-normal text-muted-foreground tabular-nums hover:text-foreground",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (onOpen && !event.defaultPrevented) onOpen();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!onOpen && event.currentTarget.matches(":focus-visible"))
          later(true);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        clear();
      }}
      {...props}
    >
      <span
        aria-hidden
        data-slot="context-ring-ring"
        className="block size-2.5 shrink-0 rounded-full [mask-image:radial-gradient(farthest-side,transparent_calc(100%-var(--spacing)*0.5),black_calc(100%-var(--spacing)*0.5))]"
        style={{
          backgroundImage: `conic-gradient(${ARC[tone]} ${percent}%, var(--color-border) 0)`,
        }}
      />
      <span
        aria-hidden
        data-slot="context-ring-percent"
        className={cn(tone === "full" && "text-warning-text")}
      >
        {percent}%
      </span>
    </Button>
  );

  if (onOpen) {
    return (
      <>
        {trigger}
        <Announcer />
      </>
    );
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          clear();
          setOpen(next);
        }}
      >
        <PopoverTrigger
          render={trigger}
          openOnHover
          delay={OPEN_DELAY_MS}
          closeDelay={100}
        />
        <PopoverContent
          side="top"
          align="end"
          size="md"
          data-slot="context-ring-panel"
          // Hover and focus show the panel without taking focus; Enter or a click on the ring moves
          // into it, so Summarize now is a Tab away.
          initialFocus={(type) => type === "keyboard"}
        >
          <ContextPanel
            used={used}
            window={windowTokens}
            threshold={threshold}
            parts={parts}
            onSummarize={onSummarize}
            summarizing={summarizing}
            formatTokens={formatTokens}
            labels={labels}
          />
        </PopoverContent>
      </Popover>
      <Announcer />
    </>
  );
}
