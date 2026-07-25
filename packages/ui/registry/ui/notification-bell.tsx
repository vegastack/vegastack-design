// @vegastack notification-bell@0.3.0 sha256-acHiPpuX0epmHEBzGyKp4LyjlTilAJeyz1BPVKY1ZgU=

"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@vegastack/design";
import { IconButton, type IconButtonProps } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";

/** Above this count the badge caps to the `"99+"` overflow label. */
const MAX_COUNT = 99;

/**
 * Props for {@link NotificationBell}.
 *
 * **Presentational only** — the component never fetches. The host application
 * owns the unread `count` (e.g. from its own query) and passes it down, along
 * with the `onClick` that opens the notifications surface.
 */
export interface NotificationBellProps extends Omit<
  IconButtonProps,
  "children" | "aria-label" | "label"
> {
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
}

/**
 * `NotificationBell` — a bell {@link IconButton} with an unread-count badge
 * overlaid at the top inline-end edge. **Purely presentational:** the app provides `count` and
 * the `onClick` handler; this component owns no data-fetching or state.
 *
 * The badge shows the numeric `count` (capped to `"99+"`), or a small dot when
 * `dot` is set. The accessible name folds the count in — screen readers hear
 * "Notifications, 3 unread" — so the visual badge is `aria-hidden`.
 *
 * After the component mounts, the badge pops in (`motion-pop-in`) whenever unread
 * activity first appears. In count mode it replays that pop each time the displayed
 * number changes. Static unread state never animates merely because the page mounted.
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
  // KNOWN ISSUE (cosmetic, deliberately not changed here): `mountedRef.current` is READ during
  // render, but the effect that flips it schedules no re-render. So the class is not applied on the
  // commit after mount — it first appears on whatever unrelated re-render happens next, meaning a
  // parent state change can pop the badge with no new notification behind it.
  //
  // Fixing it is not a one-liner, because the two modes replay by REMOUNTING (dot mode via
  // conditional render, count mode via `key={displayCount}`): a `useAnimationReplay` class-toggle
  // never reaches a freshly remounted element, and a `useState` mount flag re-applies the class to
  // the already-mounted badge and pops it on load — the exact cue this ref was added to suppress.
  // Reconciling remount-replay with mount-suppression is a design decision, so it is recorded
  // rather than guessed at.
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
  }, []);

  const badgeMotion = mountedRef.current && "motion-pop-in";

  return (
    <span
      data-slot="notification-bell"
      data-unread={hasUnread ? "" : undefined}
      className={cn("relative inline-flex", className)}
    >
      <IconButton {...props} aria-label={accessibleName}>
        <Bell />
      </IconButton>
      {hasUnread ? (
        dot ? (
          // Dot mode stays a bare status dot — Badge has no 8px dot-only form. Conditional
          // rendering remounts this on the false->true "new activity" transition. The class is
          // withheld from the component's initial mount so static unread state stays still.
          <span
            data-slot="notification-bell-badge"
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-0.5 -end-0.5 size-2 shrink-0 rounded-full bg-destructive",
              badgeMotion,
            )}
          />
        ) : (
          // Count mode COMPOSES <Badge> (register P2-06) — same tokens, one badge implementation.
          // Keyed on the DISPLAYED value (not the raw count) so the pop replays whenever the
          // visible number actually changes, but two counts that both cap to "99+" don't replay
          // a cue for a change nobody can see.
          // Anchored by its INLINE-START edge, so single digits stay aligned while wider counts
          // grow outward past the bell in both LTR and RTL. `translate` is a separate property
          // from the `scale` that
          // motion-pop-in animates, so the pop never clobbers the anchor.
          <Badge
            key={displayCount}
            data-slot="notification-bell-badge"
            aria-hidden
            variant="solid"
            intent="destructive"
            size="sm"
            className={cn(
              "pointer-events-none absolute -top-1 start-full h-4 min-w-4 -translate-x-3 px-1 tabular-nums rtl:translate-x-3",
              badgeMotion,
            )}
          >
            {displayCount}
          </Badge>
        )
      ) : null}
    </span>
  );
}
