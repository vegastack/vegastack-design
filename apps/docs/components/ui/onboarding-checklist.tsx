// @vegastack onboarding-checklist@0.7.3 sha256-oEV17xbBqtz0Utnqub3kENL43DQAy9g+oVwWA+k58LE=

"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn, surfaceInteractive } from "@vegastack/design";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

/* ------------------------------------------------------------------------------------------------
 * OnboardingChecklist — the getting-started card (Wave 4, from the app teardown's floating
 * checklist): a title + "n of N" progress + segmented dash bar + icon action rows, collapsible
 * to a compact progress pill. Presentational: the HOST owns step state (`done` per item) and
 * what each action does; the component owns layout, progress math, and the collapse toggle.
 * The dash bar IS `ProgressIndicator segments` — this file owns no second `role="progressbar"`.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `OnboardingChecklist`. */
export interface OnboardingChecklistProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title"
> {
  /** Card heading. @default 'Getting started' */
  title?: React.ReactNode;
  /** Steps completed (the host counts its own items). */
  done: number;
  /** Total steps. */
  total: number;
  /** Collapsed state (controlled). Omit for uncontrolled with `defaultCollapsed`. @default undefined */
  collapsed?: boolean;
  /** Initial collapsed state for uncontrolled use. @default false */
  defaultCollapsed?: boolean;
  /** Called whenever the user requests a collapsed-state change. @default undefined */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible label for the expanded-state collapse control. @default 'Collapse checklist' */
  collapseLabel?: string;
  /** Accessible label for the collapsed-state expand control. @default 'Expand checklist' */
  expandLabel?: string;
}

/**
 * `OnboardingChecklist` — compose `OnboardingChecklistItem`s as children.
 * Collapsed, it renders as a one-line progress pill; expanded, a hairline card.
 *
 * @example
 * <OnboardingChecklist title="Getting started" done={2} total={6}>
 *   <OnboardingChecklistItem icon={<Mail />} done>Sync email account</OnboardingChecklistItem>
 *   <OnboardingChecklistItem icon={<BarChart3 />} onClick={…}>Create a report</OnboardingChecklistItem>
 * </OnboardingChecklist>
 */
export function OnboardingChecklist({
  className,
  title = "Getting started",
  done,
  total,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  collapseLabel = "Collapse checklist",
  expandLabel = "Expand checklist",
  children,
  ref,
  ...props
}: OnboardingChecklistProps) {
  const [internalCollapsed, setInternalCollapsed] =
    React.useState(defaultCollapsed);
  const isCollapsed = collapsed ?? internalCollapsed;
  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (collapsed == null) setInternalCollapsed(next);
      onCollapsedChange?.(next);
    },
    [collapsed, onCollapsedChange],
  );
  const clampedTotal = Math.max(total, 1);
  const clampedDone = Math.min(Math.max(done, 0), clampedTotal);

  if (isCollapsed) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        data-slot="onboarding-checklist"
        data-collapsed=""
        // `aria-expanded` is the toggle's state; screen readers announce "collapsed" from it, so
        // the label does not need to say so. NOTE there is deliberately no `aria-label` here: this
        // control has VISIBLE text (title + progress), and an aria-label would replace it, leaving
        // the accessible name without the visible label — WCAG 2.2 SC 2.5.3 (Label in Name), which
        // also breaks speech-input users saying what they see. `expandLabel` is appended as
        // screen-reader-only text instead, so the accessible name CONTAINS the visible label.
        aria-expanded={false}
        onClick={() => setCollapsed(false)}
        className={cn(
          "inline-flex h-(--size-sm) w-fit items-center gap-2 rounded-full border border-border bg-card px-3 text-label-sm text-foreground select-none",
          surfaceInteractive,
          className,
        )}
        {...props}
      >
        {title}
        <span className="text-muted-foreground tabular-nums">
          {clampedDone}/{clampedTotal}
        </span>
        <span className="sr-only">{expandLabel}</span>
        <ChevronUp
          aria-hidden
          className="size-(--icon-compact) text-muted-foreground"
        />
      </button>
    );
  }

  return (
    <section
      ref={ref}
      data-slot="onboarding-checklist"
      className={cn(
        "w-(--panel-width-md) max-w-full rounded-lg border border-border bg-card p-3 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-label">{title}</h3>
        <IconButton
          variant="ghost"
          size="xs"
          // Icon-only, so `aria-label` IS the accessible name here (no visible text to preserve —
          // unlike the collapsed pill above). `aria-expanded` pairs the two toggles.
          aria-label={collapseLabel}
          aria-expanded
          onClick={() => setCollapsed(true)}
          data-slot="onboarding-checklist-collapse"
          className="text-muted-foreground"
        >
          <ChevronDown aria-hidden className="size-(--icon-inline)" />
        </IconButton>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {clampedDone} of {clampedTotal}
        </span>{" "}
        steps completed
      </p>
      {/* Segmented dash progress — the primitive, not a second copy of it (B7-04). One
          `role="progressbar"` lives in `ProgressIndicator`; this component owns only the maths. */}
      <ProgressIndicator
        segments={clampedTotal}
        segmentsFill
        size="md"
        value={clampedDone}
        max={clampedTotal}
        aria-label={`${clampedDone} of ${clampedTotal} steps completed`}
        className="mt-2"
      />
      <ul className="mt-3 flex list-none flex-col gap-0.5 p-0">{children}</ul>
    </section>
  );
}

/** Props accepted by `OnboardingChecklistItem`. */
export interface OnboardingChecklistItemProps extends Omit<
  React.ComponentPropsWithRef<"button">,
  "children"
> {
  /** Leading icon (decorative). @default undefined */
  icon?: React.ReactNode;
  /** Mark the step complete: checked glyph + muted struck label. @default false */
  done?: boolean;
  /** Value for `children`.
   */
  children: React.ReactNode;
}

/**
 * `OnboardingChecklistItem` — one step row: icon + label, button-activatable
 * until `done` (a done row renders inert with a check).
 * @example <OnboardingChecklistItem icon={<Mail aria-hidden />}>Sync email</OnboardingChecklistItem>
 */
export function OnboardingChecklistItem({
  className,
  icon,
  done = false,
  children,
  ref,
  ...props
}: OnboardingChecklistItemProps) {
  return (
    <li className="list-none">
      <button
        ref={ref}
        type="button"
        data-slot="onboarding-checklist-item"
        data-done={done ? "" : undefined}
        disabled={done}
        className={cn(
          "flex h-(--size-md) w-full items-center gap-2 rounded-md px-2 text-left text-label text-foreground select-none",
          surfaceInteractive,
          "disabled:pointer-events-none data-done:text-muted-foreground data-done:line-through",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-inline) [&_svg]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {done ? <Check aria-hidden className="text-success-text" /> : icon}
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </button>
    </li>
  );
}
