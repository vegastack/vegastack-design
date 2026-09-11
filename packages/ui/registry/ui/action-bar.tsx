// @vegastack action-bar@0.8.1 sha256-qxQ6oBx4WCXYm9gAbEFOenOyIMt8yyenTXy4+G6D+X0=

"use client";

import * as React from "react";
import { Toolbar } from "@base-ui/react/toolbar";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";

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
  /**
   * The actions. Compose {@link ActionBarButton} and {@link ActionBarSeparator}: Base UI's toolbar
   * builds its single tab stop from the items that register with it, so a bare `<Button>` renders
   * but keeps its own tab stop and the arrow keys skip it.
   *
   * @default undefined
   */
  children?: React.ReactNode;
}

/**
 * `ActionBar` — a floating contextual bar: status on one side, action children
 * on the other. Bulk selection is its most common recipe (never its owner —
 * the host's list keeps `selectedIds`); unsaved-changes and batch-progress bars
 * are the same object with different words.
 *
 * It is a Base UI `Toolbar` (audit B8-11): one tab stop, arrow keys between the
 * actions, Shift+Tab out. Compose the actions as {@link ActionBarButton} and
 * {@link ActionBarSeparator} — those are what register with the roving order.
 *
 * Enter/exit is the shared docked-control pair: `motion-dock-in` (150ms,
 * `ease-emphasized`) and `motion-dock-out` (100ms, `ease-exit`), translate and
 * fade, no scale — no mount/unmount, no JS animation.
 *
 * @example
 * <ActionBar open={count > 0} status={`${count} selected`}>
 *   <ActionBarButton onClick={tag}>Tag</ActionBarButton>
 *   <ActionBarSeparator />
 *   <ActionBarButton render={<Button variant="soft" tone="destructive" size="sm" />}>
 *     Archive
 *   </ActionBarButton>
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
    <Toolbar.Root
      ref={ref}
      data-slot="action-bar"
      data-active={open ? "true" : "false"}
      data-pending={pending ? "" : undefined}
      // A hidden bar must not keep focusable, activatable controls — `inert`
      // removes the subtree from the tab order and the a11y tree while the
      // element stays mounted for the CSS exit transition.
      inert={!open || undefined}
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
        // The shared docked-control grammar (audit B8-11 / D11 amendment #7): 150ms in on
        // `ease-emphasized`, 100ms out on `ease-exit`, translate + fade and no scale. Only the
        // DISTANCE is stated here — the bar clears its own height plus the bottom gap and the
        // safe-area inset — because that is the one part of a dock that is geometry, not grammar.
        "data-[active=true]:motion-dock-in data-[active=true]:translate-y-0 data-[active=false]:motion-dock-out data-[active=false]:translate-y-[calc(100%+var(--spacing)*4+env(safe-area-inset-bottom))]",
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
      <Toolbar.Group
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
      </Toolbar.Group>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {open ? resolvedAnnouncement : undefined}
      </span>
    </Toolbar.Root>
  );
}

/** Props accepted by `ActionBarButton`. */
export type ActionBarButtonProps = React.ComponentPropsWithRef<
  typeof Toolbar.Button
>;

/**
 * `ActionBarButton` — one action inside an {@link ActionBar}, and the reason the bar's roving
 * focus is a real promise rather than a role that lies.
 *
 * Base UI's toolbar builds its single tab stop from the items that REGISTER with it, so an action
 * has to be a `Toolbar.Button` to join the arrow-key order; a bare `<Button>` dropped into the bar
 * still renders, but stays its own tab stop and the arrows skip it. This is that registration, with
 * the bar's default action shape (a `ghost` `sm` button) already applied.
 *
 * Pass `render` to change the shape — a destructive action, an `IconButton`, a menu trigger:
 *
 * @example
 * <ActionBarButton onClick={tag}>Tag</ActionBarButton>
 * <ActionBarButton render={<Button variant="soft" tone="destructive" size="sm" />}>
 *   Archive
 * </ActionBarButton>
 */
export function ActionBarButton({ render, ...props }: ActionBarButtonProps) {
  return (
    <Toolbar.Button
      data-slot="action-bar-button"
      render={render ?? <Button variant="ghost" size="sm" />}
      {...props}
    />
  );
}

/** Props accepted by `ActionBarSeparator`. */
export type ActionBarSeparatorProps = React.ComponentPropsWithRef<
  typeof Toolbar.Separator
>;

/**
 * `ActionBarSeparator` — the hairline between two clusters of actions. `Toolbar.Separator` takes
 * the orientation perpendicular to the toolbar, so a horizontal bar gets a vertical rule without
 * being told.
 *
 * @example <ActionBarSeparator />
 */
export function ActionBarSeparator({
  className,
  ...props
}: ActionBarSeparatorProps) {
  return (
    <Toolbar.Separator
      data-slot="action-bar-separator"
      className={cn("mx-0.5 h-4 w-px shrink-0 bg-border", className)}
      {...props}
    />
  );
}
