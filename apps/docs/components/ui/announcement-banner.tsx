// @vegastack announcement-banner@0.6.0 sha256-ff9+6c9I3UjOp0k6cQ1KzW128c7UvsnFGVNzAD3nUaQ=

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@vegastack/design";
import { IconButton } from "@/components/ui/icon-button";

/* ------------------------------------------------------------------------------------------------
 * AnnouncementBanner — the full-width inverse strip across the top of a page (Wave 4, from the
 * marketing-site top band): one message, one optional action, one dismiss.
 *
 * This is the ONE genuinely distinct banner: a foreground-on-background-flip full-bleed strip.
 * The in-content "inline" notice and the plan/trial row are NOT separate components — they are
 * `Alert variant="strip"` (compact single-line ribbon with icon + message + action + optional
 * dismiss). Reach for Alert for anything that sits inside content; reach for this only for the
 * page-top inverse band.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `AnnouncementBanner`. */
export interface AnnouncementBannerProps extends React.ComponentPropsWithRef<"div"> {
  /** Action slot rendered after the message (a link or small Button). @default undefined */
  action?: React.ReactNode;
  /**
   * Show the dismiss button; the banner removes itself unless `onDismiss` is
   * given (controlled dismissal — persist it and stop rendering the banner).
   * @default false
   */
  dismissable?: boolean;
  /** Called when dismissal is controlled by the host. @default undefined */
  onDismiss?: () => void;
  /** Accessible name for the dismiss control. @default 'Dismiss announcement' */
  dismissLabel?: string;
  /**
   * Mark this strip as a runtime announcement — mounted (or re-worded) after the page settled.
   * Only then does it become a polite `role="status"` live region. The default is deliberately NO
   * live role: a page-top band that is in the DOM at load is chrome, and announcing it competes
   * with the page's own heading for the first thing a screen reader user hears (D23).
   * @default false
   */
  live?: boolean;
}

/**
 * `AnnouncementBanner` — the full-width inverse page-top strip. Announce one thing, quietly.
 * For an in-content notice or a plan/trial row, use `Alert variant="strip"` instead.
 *
 * @example
 * <AnnouncementBanner
 *   dismissable
 *   action={<a href="/changelog" className="inline-flex items-center gap-1 font-medium underline underline-offset-4">Read more<ArrowRight /></a>}
 * >
 *   Workflows now orchestrate revenue agents.
 * </AnnouncementBanner>
 */
export function AnnouncementBanner({
  className,
  action,
  dismissable = false,
  onDismiss,
  dismissLabel = "Dismiss announcement",
  live = false,
  children,
  ref,
  ...props
}: AnnouncementBannerProps) {
  const [open, setOpen] = React.useState(true);
  const handleDismiss = React.useCallback(() => {
    if (onDismiss) onDismiss();
    else setOpen(false);
  }, [onDismiss]);
  if (!open) return null;

  return (
    <div
      ref={ref}
      // D23: no live role at load. A `status` region that already exists when the page loads
      // announces nothing anyway; keeping the role off makes the intent explicit and leaves the
      // band as ordinary chrome. `live` opts a runtime banner into the polite region.
      {...(live
        ? {
            role: "status" as const,
            "aria-live": "polite" as const,
            "aria-atomic": true,
          }
        : undefined)}
      data-live={live ? "" : undefined}
      data-slot="announcement-banner"
      className={cn(
        "flex w-full items-center justify-center gap-3 bg-foreground px-4 py-2 text-base text-background",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-inline)",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 text-center wrap-break-word">{children}</span>
      {action ? (
        <span
          data-slot="announcement-banner-action"
          className="shrink-0 [&_a]:inline-flex [&_a]:min-h-(--size-xs) [&_a]:min-w-(--size-xs) [&_a]:items-center [&_a]:justify-center [&_button]:inline-flex [&_button]:min-h-(--size-xs) [&_button]:min-w-(--size-xs) [&_button]:items-center [&_button]:justify-center"
        >
          {action}
        </span>
      ) : null}
      {dismissable ? (
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={dismissLabel}
          onClick={handleDismiss}
          data-slot="announcement-banner-dismiss"
          className="text-current"
        >
          <X aria-hidden />
        </IconButton>
      ) : null}
    </div>
  );
}
