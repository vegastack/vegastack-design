// @vegastack notification-bell@0.8.1 sha256-kOdg7p08o6HGpxAXJMLv8ssYzhSZCgyoP8OFifqrDJ4=

"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@vegastack/design";
import type { ButtonAppearance } from "@/components/ui/button";
import {
  IconButton,
  type IconButtonOwnProps,
  type IconButtonProps,
} from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { useAnimationReplay } from "@/components/ui/use-animation-replay";

/** Above this count the badge caps to the `"99+"` overflow label. */
const MAX_COUNT = 99;

/**
 * What the badge actually SHOWS for a given count. The pop cue is gated on this, not on the raw
 * count, so an increase the eye cannot see (100 → 101, both `"99+"`; 3 → 4 in `dot` mode, where
 * only presence is rendered) plays no animation.
 */
function badgeKeyFor(count: number, dot: boolean): string {
  if (count <= 0) return "none";
  if (dot) return "dot";
  return count > MAX_COUNT ? `${MAX_COUNT}+` : String(count);
}

/**
 * Props for {@link NotificationBell}.
 *
 * **Presentational only** — the component never fetches. The host application
 * owns the unread `count` (e.g. from its own query) and passes it down, along
 * with the `onClick` that opens the notifications surface.
 */
export type NotificationBellProps = Omit<
  IconButtonOwnProps,
  "children" | "aria-label" | "label"
> &
  ButtonAppearance & {
    /**
     * Unread notification count, supplied by the app. `0` (or omitted) hides the
     * badge; values above `99` render as `"99+"`.
     * @default 0
     */
    count?: number;
    /**
     * Render a minimal dot instead of the numeric count when there are unread
     * items — useful in dense chrome where the exact number is noise.
     * @default false
     */
    dot?: boolean;
    /**
     * Accessible name for the trigger. The unread count is appended to the
     * announced name automatically, so pass the base label only (e.g.
     * `"Notifications"`).
     * @default 'Notifications'
     */
    "aria-label"?: string;
  };

/**
 * `NotificationBell` — a bell {@link IconButton} with an unread-count badge
 * overlaid at the top inline-end edge. **Purely presentational:** the app provides `count` and
 * the `onClick` handler; this component owns no data-fetching or state.
 *
 * The badge shows the numeric `count` (capped to `"99+"`), or a small dot when
 * `dot` is set. The accessible name folds the count in — screen readers hear
 * "Notifications, 3 unread" — so the visual badge is `aria-hidden`.
 *
 * The badge pops in (`motion-pop-in`) when `count` RISES after mount and the visible badge
 * changes with it — new activity, in other words. It never pops on mount, so a page that loads
 * with unread items sits still, and it never pops for a change nobody can see (100 → 101 both
 * read `"99+"`; in `dot` mode only the first unread item is visible as a change).
 *
 * @example
 * <NotificationBell count={unread} onClick={openPanel} />
 *
 * @example
 * // Dot indicator instead of a number
 * <NotificationBell count={unread} dot onClick={openPanel} />
 */
export function NotificationBell({
  count = 0,
  dot = false,
  className,
  "aria-label": ariaLabel = "Notifications",
  ...props
}: NotificationBellProps) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const hasUnread = safeCount > 0;
  const displayCount =
    safeCount > MAX_COUNT ? `${MAX_COUNT}+` : String(safeCount);
  const accessibleName = hasUnread
    ? `${ariaLabel}, ${displayCount} unread`
    : ariaLabel;

  // The pop is a class toggle driven by `useAnimationReplay`, never a remount (B7-03). The old
  // implementation read a mount ref DURING render and flipped it in an effect that scheduled no
  // re-render, so the class first landed on whatever unrelated re-render happened next — a parent
  // state change popped the badge with no new notification behind it.
  //
  // `previousCount` lives in state, so comparing it is a real render-to-render comparison rather
  // than a ref read. The rule: pop when the count went UP after mount **and** the badge the user
  // can see actually changed. On the first commit `previousCount === safeCount`, so a page that
  // loads with unread items sits still. Two counts that both cap to "99+", or a dot that was
  // already showing, produce the same `badgeKey` and replay no cue for a change nobody can see.
  const badgePop = useAnimationReplay("motion-pop-in");
  const replayBadgePop = badgePop.replay;
  const [previousCount, setPreviousCount] = React.useState(safeCount);

  React.useEffect(() => {
    if (safeCount === previousCount) return;
    if (
      safeCount > previousCount &&
      badgeKeyFor(safeCount, dot) !== badgeKeyFor(previousCount, dot)
    ) {
      replayBadgePop();
    }
    setPreviousCount(safeCount);
  }, [safeCount, previousCount, dot, replayBadgePop]);

  return (
    <span
      data-slot="notification-bell"
      data-unread={hasUnread ? "" : undefined}
      className={cn("relative inline-flex", className)}
    >
      <IconButton {...(props as IconButtonProps)} aria-label={accessibleName}>
        <Bell />
      </IconButton>
      {hasUnread ? (
        dot ? (
          // Dot mode stays a bare status dot — Badge has no 8px dot-only form.
          <span
            data-slot="notification-bell-badge"
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-0.5 -end-0.5 size-2 shrink-0 rounded-full bg-destructive",
              badgePop.className,
            )}
            onAnimationEnd={badgePop.onAnimationEnd}
          />
        ) : (
          // Count mode COMPOSES <Badge> (register P2-06) — same tokens, one badge implementation.
          // No `key` here: replaying by REMOUNT was the other half of B7-03, and a remount is
          // exactly what a class toggle must not depend on.
          // Anchored by its INLINE-START edge, so single digits stay aligned while wider counts
          // grow outward past the bell in both LTR and RTL. `translate` is a separate property
          // from the `scale` that
          // motion-pop-in animates, so the pop never clobbers the anchor.
          <Badge
            data-slot="notification-bell-badge"
            aria-hidden
            variant="solid"
            intent="destructive"
            size="sm"
            className={cn(
              "pointer-events-none absolute -top-1 start-full h-4 min-w-4 -translate-x-3 px-1 tabular-nums rtl:translate-x-3",
              badgePop.className,
            )}
            onAnimationEnd={badgePop.onAnimationEnd}
          >
            {displayCount}
          </Badge>
        )
      ) : null}
    </span>
  );
}
