// @vegastack notification-dot@0.143.1 sha256-aw4pkfG23eMofIYYLXL1OAAi8a0D1itd5dQYyn1MqnM=

import * as React from "react";
import { cn } from "@vegastack/design";

/** Props accepted by `NotificationDot`. */
export interface NotificationDotProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /**
   * The dot's fill. `default` is the `unread` ink (blue, or the accent: COL-27), for "unread" on a row or a
   * nav item; `destructive` is for something that needs attention.
   * @default "default"
   */
  intent?: "default" | "destructive";
  /**
   * Classes merged onto the dot.
   * @default undefined
   */
  className?: string;
}

/**
 * `NotificationDot` — the one unread dot: an 8px solid circle, decorative
 * (`aria-hidden`), so the row or control it marks must say "unread" in its own
 * accessible name. An unread row in a list, an inbox or a nav item shows it.
 *
 * It is solid, never a tint: a dot carries no text, so the 3:1 non-text floor
 * applies and the saturated fill is the only thing legible at 8px.
 *
 * @example
 * <ItemTitle>
 *   Design review <NotificationDot />
 * </ItemTitle>
 */
export function NotificationDot({
  intent = "default",
  className,
  ...props
}: NotificationDotProps) {
  return (
    <span
      data-slot="notification-dot"
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        intent === "destructive" ? "bg-destructive" : "bg-unread",
        className,
      )}
      {...props}
    />
  );
}
