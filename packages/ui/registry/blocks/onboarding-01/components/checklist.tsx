// @vegastack onboarding-01@0.15.0 sha256-i52VXyompXC806DRjPkhxISok2YXkJkQiZyegewGImE=

"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/* ------------------------------------------------------------------------------------------------
 * `onboarding-01`'s OWN checklist parts.
 *
 * `extras.md` dispositions `onboarding-checklist` as **TO BLOCK — block only**: the component is
 * retired and this block is where it lives. A block is a copy-once composition, so it carries its
 * parts rather than importing a registry item that no longer exists — and a consumer who pulls
 * `onboarding-01` now owns these two files outright and can edit them, which is the whole point of
 * the disposition.
 *
 * Copied verbatim from the component, including the two accessibility properties that are easy to
 * get backwards and that its comments explain in place: the COLLAPSED pill has visible text, so it
 * must not take an `aria-label` (SC 2.5.3, Label in Name) and appends its action as `sr-only`
 * text; the EXPANDED card's collapse toggle is icon-only, so there `aria-label` IS the whole
 * accessible name. `onboarding-01.test.tsx` pins both, because the cross-cutting
 * `accessible-name.browser.test.tsx` case went with the component.
 * ----------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------------------------------------
 * OnboardingChecklist — the getting-started card (Wave 4, from the app teardown's floating
 * checklist): a title + "n of N" progress + a determinate bar + icon action rows, collapsible
 * to a compact progress pill. Presentational: the HOST owns step state (`done` per item) and
 * what each action does; the component owns layout, progress math, and the collapse toggle.
 * The bar IS upstream's `Progress` — this file owns no second `role="progressbar"`.
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
          "inline-flex h-7 w-fit items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground select-none",
          "hover:bg-accent",
          className,
        )}
        {...props}
      >
        {title}
        <span className="text-muted-foreground tabular-nums">
          {clampedDone}/{clampedTotal}
        </span>
        <span className="sr-only">{expandLabel}</span>
        <ChevronUp aria-hidden className="size-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <section
      ref={ref}
      data-slot="onboarding-checklist"
      className={cn(
        "w-72 max-w-full rounded-lg border border-border bg-card p-3 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          variant="ghost"
          size="icon-xs"
          // Icon-only, so `aria-label` IS the accessible name here (no visible text to preserve —
          // unlike the collapsed pill above). `aria-expanded` pairs the two toggles.
          aria-label={collapseLabel}
          aria-expanded
          onClick={() => setCollapsed(true)}
          data-slot="onboarding-checklist-collapse"
          className="text-muted-foreground"
        >
          <ChevronDown aria-hidden className="size-3.5" />
        </Button>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {clampedDone} of {clampedTotal}
        </span>{" "}
        steps completed
      </p>
      {/* The progress bar is upstream's `Progress`, not a second copy of it (B7-04). One
          `role="progressbar"` lives there; this component owns only the maths. Batch 7a of the
          shadcn reset retired `progress-indicator`, whose segmented dash shape this used to take;
          the value, the max and the accessible name are unchanged. */}
      <Progress
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
          "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-foreground select-none",
          "hover:bg-accent",
          "disabled:pointer-events-none data-done:text-muted-foreground data-done:line-through",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:text-muted-foreground",
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
