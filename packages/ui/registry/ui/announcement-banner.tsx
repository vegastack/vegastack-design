// @vegastack announcement-banner@0.23.29 sha256-eEmI320PZ4Z13csko1FfSa+LiwoXpb66xhZm3CpbwEc=

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------------------------------------
 * AnnouncementBanner — the full-width inverse strip across the top of a page (Wave 4, from the
 * marketing-site top band): one message, one optional action, one dismiss.
 *
 * This is the ONE genuinely distinct banner: a foreground-on-background-flip full-bleed strip.
 * The in-content "inline" notice and the plan/trial row are NOT separate components — they are
 * upstream's `Alert`, which since Batch 2 of the shadcn reset is a compact card-ground row with
 * an icon, a title, a description and an `AlertAction` slot (its `strip` variant went with the
 * reset; the five variants are `default` plus the four status tones). Reach for `Alert` for
 * anything that sits inside content; reach for this only for the page-top inverse band.
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
 * For an in-content notice or a plan/trial row, use `Alert` instead.
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
        "flex w-full items-center justify-center gap-3 bg-foreground px-4 py-2 text-sm text-background",
        // Scoped to the band's OWN glyphs and the action slot. As a descendant rule it also
        // matched the `<X/>` inside the dismiss `Button`, competing at equal specificity with
        // `button.tsx`'s `icon-xs` rule — so which size landed was decided by Tailwind's emission
        // order rather than by intent. Button owns its own icon geometry.
        "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 text-center wrap-break-word">{children}</span>
      {action ? (
        <span
          data-slot="announcement-banner-action"
          className="shrink-0 [&_a]:inline-flex [&_a]:min-h-6 [&_a]:min-w-6 [&_a]:items-center [&_a]:justify-center [&_button]:inline-flex [&_button]:min-h-6 [&_button]:min-w-6 [&_button]:items-center [&_button]:justify-center"
        >
          {action}
        </span>
      ) : null}
      {dismissable ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={dismissLabel}
          onClick={handleDismiss}
          data-slot="announcement-banner-dismiss"
          // Upstream's `ghost` hovers to `bg-muted` / `text-foreground` — page tokens. On this
          // inverse band that painted a light chip with near-black ink in light theme, i.e. the
          // page's own colours inside the strip. The hover and pressed steps are restated in the
          // band's own ink so it stays inside the flip.
          className="text-current hover:bg-background/15 hover:text-current active:bg-background/25 active:not-aria-[haspopup]:translate-y-0"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
