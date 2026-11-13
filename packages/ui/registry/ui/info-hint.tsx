// @vegastack info-hint@0.81.0 sha256-ki6Xj6wNkmQ/cVQusXQ88GkMXituioojSxVnJVWbxig=

"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ------------------------------------------------------------------------------------------------
 * InfoHint — a small muted (i) beside a heading or label that opens one sentence of explanation and,
 * optionally, a "Learn more" link. It is a Popover, not a Tooltip: it opens on click, tap, Enter or
 * Space, so it works on touch and the link inside it is reachable. Like a tooltip, it also opens on
 * hover and when the keyboard focuses it, and closes when the pointer or focus leaves, so a hint is
 * never only behind a press. It never takes initial focus on its own; inside a Dialog, point the
 * dialog's `initialFocus` at the first field so the hint in the title is not focused first.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `InfoHint`. */
export interface InfoHintProps extends Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "children" | "variant" | "size" | "aria-label"
> {
  /** The trigger's accessible name — "About <topic>", e.g. "About spaces". */
  label: string;
  /** The explanation: one sentence. */
  children: React.ReactNode;
  /** Optional link under the sentence, opened in a new tab. @default undefined */
  href?: string;
  /** Text of the optional link. @default "Learn more" */
  linkLabel?: string;
  /** Which side of the trigger the popover opens on. @default "bottom" */
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  /** How the popover aligns with the trigger. @default "start" */
  align?: "start" | "center" | "end";
  /** `className` for the popover panel. @default undefined */
  contentClassName?: string;
}

/**
 * `InfoHint` — an icon-only info button that opens a one-sentence explanation with an optional link.
 *
 * @example
 * <h2 className="flex items-center gap-1">
 *   Spaces
 *   <InfoHint label="About spaces" href="https://help.example.com/spaces">
 *     A space groups the people and records that work together.
 *   </InfoHint>
 * </h2>
 */
export function InfoHint({
  label,
  children,
  href,
  linkLabel = "Learn more",
  side = "bottom",
  align = "start",
  contentClassName,
  className,
  onKeyUp,
  onBlur,
  ...props
}: InfoHintProps) {
  const [open, setOpen] = React.useState(false);
  // Opened by keyboard focus and focus still on the trigger: a press or the pointer leaving keeps
  // it open, and it closes when focus leaves (or on Escape, or a press outside).
  const byFocus = React.useRef(false);
  const popup = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(settle.current), []);
  const change = (
    next: boolean,
    details?: { reason: string; cancel: () => void },
  ) => {
    if (
      !next &&
      byFocus.current &&
      (details?.reason === "trigger-press" ||
        details?.reason === "trigger-hover")
    )
      return details.cancel();
    if (!next) byFocus.current = false;
    setOpen(next);
  };
  return (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger
        openOnHover
        closeDelay={150}
        // Tabbed to: the Tab key's release lands on the element it moved focus to. Focus that
        // comes back on its own (Escape, a click) never opens it.
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (event.key !== "Tab" || open) return;
          byFocus.current = true;
          setOpen(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!byFocus.current) return;
          const trigger = event.currentTarget;
          // Once focus settles: Tab into the hint passes through Base UI's focus guards first.
          clearTimeout(settle.current);
          settle.current = setTimeout(() => {
            const now = document.activeElement;
            if (
              byFocus.current &&
              now !== trigger &&
              !popup.current?.contains(now)
            )
              change(false);
          });
        }}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            data-slot="info-hint"
            aria-label={label}
            className={cn("text-muted-foreground", className)}
            {...props}
          />
        }
      >
        <InfoIcon aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        data-slot="info-hint-content"
        ref={popup}
        // Opened by focus, focus stays on the trigger; opened by a tap, the hint itself takes it
        // (Base UI's own touch default); opened by a click or a key, its first stop does.
        initialFocus={(type) =>
          byFocus.current ? false : type === "touch" ? popup.current : true
        }
        side={side}
        align={align}
        className={cn("w-64 gap-1.5", contentClassName)}
      >
        <p className="text-sm text-popover-foreground">{children}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            data-slot="info-hint-link"
            className={cn(
              buttonVariants({ variant: "link", size: "xs" }),
              "h-auto self-start px-0",
            )}
          >
            {linkLabel}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
