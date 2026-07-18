// @vegastack notification-bell@0.1.0 sha256-NuU9XNAQZ4HKix3yDhjS1QSn5bZK/oKDx6laPBvfZ50=

'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@vegastack/design';
import { IconButton, type IconButtonProps } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';

/** Above this count the badge caps to the `"99+"` overflow label. */
const MAX_COUNT = 99;

/**
 * Props for {@link NotificationBell}.
 *
 * **Presentational only** — the component never fetches. The host application
 * owns the unread `count` (e.g. from its own query) and passes it down, along
 * with the `onClick` that opens the notifications surface.
 */
export interface NotificationBellProps
  extends Omit<IconButtonProps, 'children' | 'aria-label' | 'label'> {
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
  'aria-label'?: string;
}

/**
 * `NotificationBell` — a bell {@link IconButton} with an unread-count badge
 * overlaid top-right. **Purely presentational:** the app provides `count` and
 * the `onClick` handler; this component owns no data-fetching or state.
 *
 * The badge shows the numeric `count` (capped to `"99+"`), or a small dot when
 * `dot` is set. The accessible name folds the count in — screen readers hear
 * "Notifications, 3 unread" — so the visual badge is `aria-hidden`.
 *
 * The badge pops in (`motion-pop-in`) whenever unread activity first appears, and
 * in count mode it replays that pop each time the displayed number changes — the
 * "new activity" cue. This is unconditional (not opt-in): a bell badge only ever
 * renders in response to a real state change, so it never fires on a static list.
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
  'aria-label': ariaLabel = 'Notifications',
  ...props
}: NotificationBellProps) {
  const safeCount = Math.max(0, Math.floor(count)); // clamp negatives + floor fractions
  const hasUnread = safeCount > 0;
  const displayCount = safeCount > MAX_COUNT ? `${MAX_COUNT}+` : String(safeCount);
  const accessibleName = hasUnread ? `${ariaLabel}, ${displayCount} unread` : ariaLabel;

  return (
    <span
      data-slot="notification-bell"
      data-unread={hasUnread ? '' : undefined}
      className={cn('relative inline-flex', className)}
    >
      <IconButton {...props} aria-label={accessibleName}>
        <Bell />
      </IconButton>
      {hasUnread ? (
        dot ? (
          // Dot mode stays a bare status dot — Badge has no 8px dot-only form. Conditional
          // rendering already remounts this on the false->true "new activity" transition, so
          // motion-pop-in plays on mount without any extra keying.
          <span
            data-slot="notification-bell-badge"
            aria-hidden
            className="motion-pop-in pointer-events-none absolute -top-0.5 -right-0.5 size-2 shrink-0 rounded-full bg-destructive"
          />
        ) : (
          // Count mode COMPOSES <Badge> (register P2-06) — same tokens, one badge implementation.
          // Keyed on the DISPLAYED value (not the raw count) so the pop replays whenever the
          // visible number actually changes, but two counts that both cap to "99+" don't replay
          // a cue for a change nobody can see.
          // Anchored by its LEFT edge (`left-full -translate-x-3`) at exactly where a one-digit
          // badge's left edge sat under the old `-right-1` anchor (min-w-4 = 16px wide, right
          // inset -4px → left edge 12px in from the bell's right edge), so single digits render
          // identically on every bell size while wider counts ("99+") grow OUTWARD past the bell
          // instead of inward over it. `translate` is a separate property from the `scale` that
          // motion-pop-in animates, so the pop never clobbers the anchor.
          <Badge
            key={displayCount}
            data-slot="notification-bell-badge"
            aria-hidden
            variant="solid"
            intent="destructive"
            size="sm"
            className="motion-pop-in pointer-events-none absolute -top-1 left-full h-4 min-w-4 -translate-x-3 px-1 tabular-nums"
          >
            {displayCount}
          </Badge>
        )
      ) : null}
    </span>
  );
}
