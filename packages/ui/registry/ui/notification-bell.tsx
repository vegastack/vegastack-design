// @vegastack notification-bell@0.22.0 sha256-fUl/VjXZQoMGXp8ePZ0DsO9MInlSs0IBCWjLo++cmio=

"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnimationReplay } from "@/components/ui/use-animation-replay";

/**
 * `Button`'s own props, derived from the component. Batch 2 of the shadcn reset replaced the
 * hand-written `ButtonOwnProps` / `ButtonAppearance` pair with upstream's flat `variant` + `size`
 * API, so these two aliases are what a wrapper reads now. Batch 7 rebuilds this component on the
 * reset primitives and they go away with it.
 */
type ButtonOwnProps = React.ComponentProps<typeof Button>;
type ButtonAppearance = Pick<ButtonOwnProps, "variant">;

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
  ButtonOwnProps,
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
    /**
     * Words for the unread count in the accessible name, after the base
     * label: "Notifications, 3 unread". Receives the real count; the default
     * caps it at "99+" like the badge.
     * @default (n) => `${n} unread`
     */
    countLabel?: (n: number) => string;
  };

/** Props accepted by `NotificationDot`. */
export interface NotificationDotProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /**
   * The dot's fill. `default` is the primary ink, for "unread" on a row or a
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
 * accessible name. It is what `NotificationBell` draws in `dot` mode, and what
 * an unread row in a list, an inbox or a nav item shows.
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
        intent === "destructive" ? "bg-destructive" : "bg-primary",
        className,
      )}
      {...props}
    />
  );
}

function defaultCountLabel(n: number): string {
  return `${n > MAX_COUNT ? `${MAX_COUNT}+` : n} unread`;
}

/**
 * `NotificationBell` — a bell icon `Button` with an unread-count badge
 * overlaid at the top inline-end edge. **Purely presentational:** the app provides `count` and
 * the `onClick` handler; this component owns no data-fetching or state.
 *
 * The badge shows the numeric `count` (capped to `"99+"`), or the shared
 * {@link NotificationDot} when `dot` is set. The accessible name folds the count
 * in — screen readers hear "Notifications, 3 unread", worded by `countLabel` —
 * so the visual badge is `aria-hidden`.
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
  countLabel = defaultCountLabel,
  ...props
}: NotificationBellProps) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const hasUnread = safeCount > 0;
  const displayCount =
    safeCount > MAX_COUNT ? `${MAX_COUNT}+` : String(safeCount);
  const accessibleName = hasUnread
    ? `${ariaLabel}, ${countLabel(safeCount)}`
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
      <Button
        size="icon"
        {...(props as ButtonOwnProps)}
        aria-label={accessibleName}
      >
        <Bell />
      </Button>
      {hasUnread ? (
        dot ? (
          // Dot mode is the shared `NotificationDot` — solid, never a tint, because it carries no
          // text (the 3:1 non-text floor applies, and a tinted 8px dot is invisible). The count
          // pill below is a tint because it carries a number (A11Y-13). The dot's default intent is
          // the primary ink (DS-56); an unread marker is not an error.
          <NotificationDot
            className={cn(
              "pointer-events-none absolute -top-0.5 -end-0.5",
              badgePop.className,
            )}
            onAnimationEnd={badgePop.onAnimationEnd}
          />
        ) : (
          // Count mode COMPOSES <Badge> (register P2-06) — one badge implementation. It reads as
          // the family's tint rather than the dot's solid fill; see the note on the dot above.
          // No `key` here: replaying by REMOUNT was the other half of B7-03, and a remount is
          // exactly what a class toggle must not depend on.
          // Anchored by its INLINE-START edge, so single digits stay aligned while wider counts
          // grow outward past the bell in both LTR and RTL. `translate` is a separate property
          // from the `scale` that
          // motion-pop-in animates, so the pop never clobbers the anchor.
          <Badge
            data-slot="notification-bell-badge"
            aria-hidden
            variant="destructive"
            className={cn(
              "pointer-events-none absolute -top-1 start-full h-4 min-w-4 -translate-x-3 px-1 py-0 tabular-nums rtl:translate-x-3",
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
