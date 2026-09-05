// @vegastack action-bar@0.6.0 sha256-+DXvhkiqBy+ZMx59M8LKv29FWo7/wCTjiuc4Cb+k4xw=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

/* ---
`ActionBar` exists because three different jobs kept asking for the same object — a
floating contextual bar with a status region on one side and actions on the other:
bulk selection ("5 selected · Tag · Archive"), unsaved changes
("Unsaved changes · Discard · Save"), and batch progress ("Importing 340 of 1,000 ·
Cancel"). Naming it for one caller (`bulk-bar`) would have guaranteed a near-duplicate,
so bulk selection is its most common recipe, not its identity.

It must NOT own selection: `DataList`/grids already own `selectedIds`, and this bar only
consumes a count through the `status` slot. It also deliberately keeps results
persistent — the CRM pattern it serves retains failed rows as selection after a bulk
action, so the outcome summary lives in the bar's own `status`, not in a toast that
discards state the user is still holding.

Positioning: viewport-centred by default (auto margins — never `left: 50%`, which
mis-centres against a sidebar). Pass `containerRef` to centre over a measured container
instead: the bar tracks that element's box via ResizeObserver and positions off a
unitless CSS custom property (`--action-bar-x`, consumed as `calc(var(--action-bar-x) *
1px)`), so inline style stays custom-properties-only.

Stacking: `z-(--z-raised)` — the bar floats over page content and is correctly covered
by any dialog opened from one of its actions (`z-overlay`). It stays flat: separation is
the surface ladder (bg-background + the one border), not a shadow.
--- */

/** Props accepted by `ActionBar`. */
export interface ActionBarProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Whether the bar is shown. It stays mounted while hidden (translated below
   * the viewport edge, `data-active="false"`), so the enter/exit transition is
   * pure CSS and the live region survives.
   * @default true
   */
  open?: boolean;
  /**
   * The status region — a count ("5 selected"), a state ("Unsaved changes"),
   * or progress ("Importing 340 of 1,000…"). Rendered before the actions.

   * @default undefined
   */
  status?: React.ReactNode;
  /**
   * Text announced politely when it changes. Defaults to `status` when that is
   * a plain string; pass explicitly when `status` is composite markup.

   * @default undefined
   */
  announcement?: string;
  /**
   * Dim and inert the actions while a bulk operation is in flight
   * (`aria-busy` + non-interactive), keeping the status region readable.
   * @default false
   */
  pending?: boolean;
  /**
   * Centre the bar over this element instead of the viewport — measured via
   * `getBoundingClientRect`, kept live through ResizeObserver plus window
   * resize/scroll, so a content area beside a sidebar gets a truly centred
   * bar. (A container that moves without any resize or scroll event — a
   * transition-driven layout shift — re-measures on the next of either.)

   * @default undefined
   */
  containerRef?: React.RefObject<HTMLElement | null>;
  /**
   * Accessible name for the toolbar.
   * @default "Actions"
   */
  "aria-label"?: string;
}

/**
 * `ActionBar` — a floating contextual bar: status on one side, action children
 * on the other. Bulk selection is its most common recipe (never its owner —
 * the host's list keeps `selectedIds`); unsaved-changes and batch-progress bars
 * are the same object with different words.
 *
 * Enter/exit is the CSS-only recipe `MessageScrollerButton` established:
 * `data-[active=false]` translates the bar below the edge with `ease-exit`,
 * `data-[active=true]` returns it with `ease-emphasized` — no mount/unmount,
 * no JS animation.
 *
 * @example
 * <ActionBar open={count > 0} status={`${count} selected`}>
 *   <Button variant="ghost" size="sm">Tag</Button>
 *   <Separator orientation="vertical" />
 *   <Button variant="destructive" size="sm">Archive</Button>
 * </ActionBar>
 */
export function ActionBar({
  open = true,
  status,
  announcement,
  pending = false,
  containerRef,
  "aria-label": ariaLabel = "Actions",
  className,
  children,
  style,
  ref,
  ...props
}: ActionBarProps) {
  // Measured horizontal centre of the container (viewport px, unitless).
  const [centerX, setCenterX] = React.useState<number | null>(null);
  // Refs are not reactive — resolve the current element on every render (a
  // same-value setState is a no-op) so a container that mounts AFTER the bar
  // still gets measured.
  const [containerEl, setContainerEl] = React.useState<HTMLElement | null>(
    null,
  );
  React.useEffect(() => {
    setContainerEl(containerRef?.current ?? null);
  });

  React.useEffect(() => {
    if (!containerEl) {
      setCenterX(null);
      return;
    }
    const update = () => {
      const rect = containerEl.getBoundingClientRect();
      setCenterX(rect.left + rect.width / 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerEl);
    window.addEventListener("resize", update);
    // The rect is viewport-relative while the bar is fixed — horizontal page
    // scroll shifts the container without a resize.
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [containerEl]);

  const measured = centerX != null;
  const resolvedAnnouncement =
    announcement ?? (typeof status === "string" ? status : undefined);

  return (
    <div
      ref={ref}
      data-slot="action-bar"
      data-active={open ? "true" : "false"}
      data-pending={pending ? "" : undefined}
      // A hidden bar must not keep focusable, activatable controls — `inert`
      // removes the subtree from the tab order and the a11y tree while the
      // element stays mounted for the CSS exit transition.
      inert={!open || undefined}
      // `group`, not `toolbar`: toolbar promises APG arrow-key traversal this
      // bar does not implement — actions are ordinary Tab stops.
      role="group"
      aria-label={ariaLabel}
      // Unitless measured centre; the class consumes it as calc(var(--action-bar-x) * 1px).
      style={
        {
          ...style,
          ...(measured ? { "--action-bar-x": String(centerX) } : null),
        } as React.CSSProperties
      }
      className={cn(
        "fixed z-(--z-raised) flex w-fit max-w-[calc(100%-var(--spacing)*8)] items-center gap-2 rounded-lg border border-border bg-background py-1.5 ps-4 pe-2",
        // Pinned to the bottom viewport edge → add the safe-area inset.
        "bottom-[calc(var(--spacing)*4+env(safe-area-inset-bottom))]",
        measured
          ? "start-[calc(var(--action-bar-x)*1px)] -translate-x-1/2 rtl:translate-x-1/2"
          : "inset-x-0 mx-auto",
        // MessageScrollerButton's CSS-only enter/exit recipe, verbatim (one class
        // literal so the duration/ease pairing is visible to the lint as it is to
        // the reader): exit drops below the edge with ease-exit; enter returns
        // with ease-emphasized.
        "transition-[translate,scale,opacity] duration-base data-[active=false]:pointer-events-none data-[active=false]:translate-y-[calc(100%+var(--spacing)*4+env(safe-area-inset-bottom))] data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-slow data-[active=false]:ease-exit data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-emphasized",
        className,
      )}
      {...props}
    >
      {status != null ? (
        <div
          data-slot="action-bar-status"
          className="flex min-w-0 items-center text-sm whitespace-nowrap text-muted-foreground"
        >
          {status}
        </div>
      ) : null}
      <div
        data-slot="action-bar-actions"
        aria-busy={pending || undefined}
        // `inert`, not just pointer-events: a bulk operation in flight must not
        // be re-triggerable from the keyboard either.
        inert={pending || undefined}
        className={cn(
          "flex items-center gap-1",
          pending && "opacity-(--opacity-dim) select-none",
        )}
      >
        {children}
      </div>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {open ? resolvedAnnouncement : undefined}
      </span>
    </div>
  );
}
