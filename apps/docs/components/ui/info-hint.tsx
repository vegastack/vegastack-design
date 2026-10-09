// @vegastack info-hint@0.25.6 sha256-XRIi5JI1a/Hwx3Pq0YDdXS/2RDjMPLGHl52/zA96lhU=

import type * as React from "react";
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
 * Space, so it works on touch and the link inside it is reachable. It never takes initial focus on
 * its own; inside a Dialog, point the dialog's `initialFocus` at the first field so the hint in the
 * title is not focused first.
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
  ...props
}: InfoHintProps) {
  return (
    <Popover>
      <PopoverTrigger
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
