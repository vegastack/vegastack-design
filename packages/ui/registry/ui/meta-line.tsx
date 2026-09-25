// @vegastack meta-line@0.23.12 sha256-pYzlrCzgGSQQNmddvg7EiZSDzU5x4m4AYdo4mcLBAgY=

import * as React from "react";
import { cn } from "@vegastack/design";

/** Props accepted by `MetaLine`. */
export interface MetaLineProps extends React.ComponentProps<"div"> {
  /**
   * `MetaLineItem`s.
   * @default undefined
   */
  children?: React.ReactNode;
}

/**
 * `MetaLine` — a wrapping line of small icon + text facts about a record (type, date and time,
 * duration, owner). Muted ink, one step below the title it sits under.
 *
 * @example
 * <MetaLine>
 *   <MetaLineItem icon={<Video />}>Video call</MetaLineItem>
 *   <MetaLineItem icon={<Calendar />}>25 Sep, 10:30</MetaLineItem>
 * </MetaLine>
 */
export function MetaLine({ className, ...props }: MetaLineProps) {
  return (
    <div
      data-slot="meta-line"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MetaLineItem`. */
export interface MetaLineItemProps extends React.ComponentProps<"span"> {
  /**
   * A leading icon, drawn at 14px in the muted ink. Decorative: the text carries the meaning.
   * @default undefined
   */
  icon?: React.ReactNode;
}

/**
 * `MetaLineItem` — one fact in a `MetaLine`: an optional icon and its text.
 *
 * @example
 * <MetaLineItem icon={<Clock />}>42 min</MetaLineItem>
 */
export function MetaLineItem({
  icon,
  className,
  children,
  ...props
}: MetaLineItemProps) {
  return (
    <span
      data-slot="meta-line-item"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
