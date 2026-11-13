// @vegastack markdown-view@0.81.0 sha256-/8zWz0JVKrqZTc4SKpf450PjP8jT48EhF85A1E8KtIg=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** A summary's source for a `[[n]]` marker. */
export interface MarkdownCitation {
  /** The marker's accessible name, e.g. "Source 3". */
  label: string;
  /** What hovering, focusing or long-pressing the marker shows (a quote, who said it, when). */
  content?: React.ReactNode;
  /**
   * Clicking or tapping the marker does something in place (play the recording from there).
   * Absent — as in a chat answer — a click or tap only opens `content`, and the link inside
   * `content` is what opens the source. Never pass a navigation here: the marker sits in the
   * middle of a sentence, and a stray click must not take the reader away from it.
   */
  onSelect?: () => void;
}

/** Props accepted by `MarkdownCitationMarker`. */
export interface MarkdownCitationMarkerProps extends MarkdownCitation {
  /** The number the marker shows. */
  n: number;
  /**
   * How many more sources the marker stands for: adjacent `[[n]]` markers group into one pill,
   * "1 +2", whose `content` lists them all.
   * @default 0
   */
  more?: number;
  /**
   * Classes for the wrapper.
   * @default undefined
   */
  className?: string;
}

/**
 * How far to move a card that starts at the marker back inside the reading column (the
 * `MarkdownView` around it) so its end stays inside the column's, never past the column's start.
 * The offset is logical: negative moves the card toward its start side, so one sign serves a
 * left-to-right column (the card shifts left) and a right-to-left one (it shifts right).
 */
function columnShift(trigger: HTMLElement | null, width: number): number {
  const column = trigger?.closest<HTMLElement>("[data-slot=markdown-view]");
  if (!trigger || !column) return 0;
  const marker = trigger.getBoundingClientRect();
  const bounds = column.getBoundingClientRect();
  const rtl = getComputedStyle(column).direction === "rtl";
  const overflow = rtl
    ? bounds.left - (marker.right - width)
    : marker.left + width - bounds.right;
  if (overflow <= 0) return 0;
  const room = rtl ? bounds.right - marker.right : marker.left - bounds.left;
  return -Math.min(overflow, Math.max(0, room));
}

/** How long a touch must rest on the marker before its `content` opens instead of a tap. */
const LONG_PRESS_MS = 450;

// An inline pill on the text's middle line: tabular numerals on the muted tint, the selected tint
// while its card is open. It is never a superscript — a raised marker crowds the line above and
// reads as a footnote — and at 16px it fits inside every body line (20, 24 or 26px), so the line
// keeps its height. Keyboard focus is `base.css`'s own background tint — no ring (FOC-13). The
// `after:` box grows the hit area to 24px without moving the text (WCAG 2.5.8).
const MARKER =
  "h-4 min-w-4 rounded-full bg-muted px-1.5 text-xs leading-none font-medium text-muted-foreground tabular-nums no-underline state-layer hover:text-foreground aria-expanded:bg-state-selected aria-expanded:text-foreground after:absolute after:-inset-1.5";

/**
 * `MarkdownCitationMarker` — the citation `MarkdownView` renders for a `[[n]]` marker when its
 * `citation` prop answers for `n`: a small numbered pill on the text's middle line, a button named
 * by `label`. Hover, focus or a long press opens `content` in a popover; a click or tap calls
 * `onSelect`, and without `onSelect` (a chat answer) a click or tap opens `content` too. Mousedown and focus stay on the marker, so a host that
 * activates on either (`TextEdit`'s read view) leaves the click to the citation.
 *
 * @example
 * <MarkdownCitationMarker n={3} label="Source 3" content="“Ship Friday” — Asha, 12:04" onSelect={() => seek(724)} />
 */
export function MarkdownCitationMarker({
  n,
  more = 0,
  label,
  content,
  onSelect,
  className,
}: MarkdownCitationMarkerProps) {
  const [open, setOpen] = React.useState(false);
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = React.useRef(false);
  const hasContent = content !== undefined && content !== null;
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    [],
  );

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const button = (
    <Button
      variant="ghost"
      size="xs"
      ref={triggerRef}
      aria-label={label}
      data-slot="markdown-citation-trigger"
      className={MARKER}
      onPointerDown={(event) => {
        longPressed.current = false;
        if (event.pointerType !== "touch" || !hasContent) return;
        endPress();
        pressTimer.current = setTimeout(() => {
          longPressed.current = true;
          setOpen(true);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onContextMenu={(event) => {
        // A long press opens the source, not the platform's callout.
        if (longPressed.current) event.preventDefault();
      }}
      onFocus={(event) => {
        if (hasContent && event.currentTarget.matches(":focus-visible"))
          setOpen(true);
      }}
      onBlur={() => setOpen(false)}
      onClick={() => {
        // The press that opened the source is not also a select.
        if (!longPressed.current) onSelect?.();
      }}
    >
      {n}
      {more > 0 ? (
        <span data-slot="markdown-citation-more" className="ms-1">
          +{more}
        </span>
      ) : null}
    </Button>
  );

  return (
    <span
      data-slot="markdown-citation"
      // An island in an editable host: never part of the text, and its events are its own.
      contentEditable={false}
      className={cn(
        // `align-middle` centres the pill on the text's middle line (baseline + half an x-height);
        // `leading-none` keeps the wrapper from adding a line box of its own.
        "ms-0.5 inline-flex align-middle leading-none select-none",
        className,
      )}
      onMouseDown={(event) => event.stopPropagation()}
      onFocus={(event) => event.stopPropagation()}
    >
      {hasContent ? (
        <Popover
          open={open}
          onOpenChange={(next, details) => {
            // With `onSelect`, a press selects; the source opens on hover, focus or a long press.
            // The press that ended a long press leaves it open.
            if (
              details.reason === "trigger-press" &&
              (onSelect || longPressed.current)
            )
              return;
            setOpen(next);
          }}
        >
          <PopoverTrigger
            openOnHover
            delay={200}
            closeDelay={100}
            render={button}
          />
          <PopoverContent
            // Under the marker, from its start, and shifted back inside the reading column when it
            // would run past the column's end: it doesn't cover the line above (an answer's author
            // line) or hang off the column. Only with no room below the viewport's edge does it flip
            // above, where it stays readable.
            side="bottom"
            align="start"
            alignOffset={({ positioner }) =>
              // The card is never wider than its `max-w-80` (20rem), whatever the first measure says.
              columnShift(
                triggerRef.current,
                Math.min(
                  positioner.width,
                  20 *
                    (parseFloat(
                      getComputedStyle(document.documentElement).fontSize,
                    ) || 16),
                ),
              )
            }
            initialFocus={false}
            finalFocus={false}
            data-slot="markdown-citation-content"
            className="w-auto max-w-80"
          >
            {content}
          </PopoverContent>
        </Popover>
      ) : (
        button
      )}
    </span>
  );
}
