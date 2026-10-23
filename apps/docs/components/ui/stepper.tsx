// @vegastack stepper@0.25.68 sha256-YgG06aSjCH248m+aYcyHFS8TWulExMDWbSAMROSwDAA=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Loader, TriangleAlert, X } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";

/* ---
`Stepper` exists because a bounded linear process — onboarding, wizards, checkout,
imports — has no correct substrate in the roster. `Tabs` is the tempting wrong answer:
`role="tab"` announces "tab 2 of 6" and implies free navigation between peers, which
actively misleads assistive tech about a flow where step 4 may be unreachable until
step 3 validates. The correct semantics are an ordered list with `aria-current="step"`,
and that is what this ships.

Three judgments are load-bearing and each one is pinned by a test:
- focus moves to the NEW step's label when the current step changes, and never on first
  mount — otherwise a keyboard or screen-reader user is given no "where am I now";
- `aria-current="step"` on a correctly labelled `<ol>`, never a tablist;
- states are named by the host, never derived from an index. Deriving them would bake in
  "linear and always forward", which an import with a failed step is not.

Rebuilt 2026-09-22 (`docs/plans/2026-09-22-stepper-rebuild-and-multi-step-form.md`,
approved by MK). Four things changed, and the fourth is a removal:

1. **The rail carries the progress.** Connectors behind you take `bg-primary`, ahead of
   you `bg-border`, so the stepper IS the progress bar and there is no second one to keep
   in sync. "Behind you" is read from each step's own state (`complete`/`skipped`), never
   from its index — see `connectorPassed`.
2. **Nodes are numbered**, and the number is replaced by a glyph exactly when the step has
   something to say: a check when passed, an alert when it needs attention. "How far in am
   I" is answerable without reading a label.
3. **Colour is exceptional.** `complete` and `current` are the neutral ink, because
   progress is not success and a wall of green leaves nothing louder for the step that
   genuinely needs the user. Only `warning` and `error` are coloured, and their LABELS take
   the family's `-text` ink per A11Y-13 while the filled node takes `-foreground`.
4. **`blockedReason` is gone.** It rendered under the current step's label — which in a
   horizontal rail is a one-fifth-width column, and in the collapsed form does not exist at
   all — so the one placement it had was the one layout it did not fit. A refusal now
   belongs to the control it blocks: the host renders it beside its own Next button (an
   `Alert` for a failed check, a quiet line for a gate not yet satisfied), and the rail
   carries the STATE only. `multi-step-form` owns that composition.

Tidied 2026-10-11 (MK): the whole step — node and label — is ONE target. A navigable step
is a single Button wrapping both, so the circle is as clickable as the text and the hover
wash covers the pair; the connector sits outside it, positioned against the step, so the
target never swallows the line. `complete` moved from the solid fill to a muted primary
(a check on a `primary`/10 tint, and its connector in the same `primary`/40) so the solid
fill now means "you are here" and nothing else, and the current label takes `font-medium`
— with its bold width reserved, so the rail still never shifts. A horizontal rail that
overflows its container scrolls its current step into view.

Deliberately NOT done here:
- No Back/Next buttons and no step bodies. Most uses need none — an order tracker, a
  deployment pipeline, an import running on a server: progress the SYSTEM drives and a
  person reads. Where a person drives the flow, `multi-step-form` composes this component
  and owns the controls, the guards and the bodies.
- No announcements. The focus move is the transition's one event; a live region here would
  double up with the one the host's flow already owns.
--- */

/**
 * The state of one step.
 *
 * `error` and `warning` are first-class, not decorations: a failed step and a passable
 * step carrying a caveat are both things a real flow has to say. `loading` is the state an
 * async advance gate occupies while it runs — without it, a step being checked has to
 * masquerade as `current`, which claims the flow is idle when it is not.
 */
export type StepperStepState =
  | "complete"
  | "current"
  | "loading"
  | "warning"
  | "error"
  | "skipped"
  | "upcoming";

/** Whether a step is the one the user is on: its state says so, or `current` does. */
function isCurrentStep(step: StepperStep): boolean {
  return (
    step.current === true ||
    step.state === "current" ||
    step.state === "loading"
  );
}

/** One step in the process. */
export interface StepperStep {
  /** Stable identifier — selection events return it. */
  id: string;
  /** Visible step label. Receives focus when the step becomes current. */
  label: string;
  /**
   * Optional secondary line under the label.
   * @default undefined
   */
  description?: string;
  /** The step's state. Exactly one step should be `current` or `loading`. */
  state: StepperStepState;
  /**
   * Marks the step as the current one while its `state` says something else — the step
   * the user is on has failed validation (`error`) or carries a caveat (`warning`). It
   * keeps `aria-current="step"`, the step count and focus-follow on that step, so a
   * failed step never stops being "where am I".
   * @default false
   */
  current?: boolean;
  /**
   * Marks the step as one the flow may pass over, rendering an "Optional" affix. It is a
   * label, not a state: an optional step that was passed over is `skipped`.
   * @default false
   */
  optional?: boolean;
  /**
   * Marks a step unreachable even in navigable mode (e.g. gated by a plan).
   * @default false
   */
  disabled?: boolean;
}

/**
 * Node variants — the numbered circle at the head of each step.
 *
 * `current` alone takes the solid primary fill — "you are here". `complete` is the same hue
 * muted (a check on a `primary`/10 tint), `upcoming` an outline. Status colour is reserved
 * for `warning` and `error` so that it means "this needs you", not "this exists".
 */
export const stepperNodeVariants = cva(
  // `group/stepper-node` is the class output's own hook: a squeezed DataList keeps any element
  // wearing this fixed-size circle whole, on whatever element the helper lands (data-table-parts).
  "group/stepper-node flex shrink-0 items-center justify-center rounded-full border border-transparent font-medium tabular-nums transition-colors",
  {
    variants: {
      state: {
        complete: "border-primary/40 bg-primary/10 text-primary",
        current: "bg-primary text-primary-foreground",
        loading: "border-border bg-background text-muted-foreground",
        warning: "bg-warning text-warning-foreground",
        error: "bg-destructive text-destructive-foreground",
        skipped:
          "border-dashed border-border bg-background text-muted-foreground",
        upcoming: "border-border bg-background text-muted-foreground",
      },
      size: {
        default: "size-7 text-xs [&_svg]:size-3.5",
        sm: "size-5 text-xs [&_svg]:size-3",
      },
    },
    defaultVariants: { state: "upcoming", size: "default" },
  },
);

/** Label ink per state. The two coloured states take the family's `-text` ink (A11Y-13). */
// The current step's label also takes `font-medium`; its bold width is reserved by an invisible
// twin (see `stepper-label`), so a label that becomes current never moves the rail.
const LABEL_CLASS: Record<StepperStepState, string> = {
  complete: "text-foreground",
  current: "text-foreground",
  loading: "text-foreground",
  warning: "text-warning-text",
  error: "text-destructive-text",
  skipped: "text-muted-foreground",
  upcoming: "text-muted-foreground",
};

/**
 * The box that holds a step's node AND its label, clickable or not. Identical padding and
 * radius in both cases, so a step that becomes (or stops being) revisitable never moves. The
 * connector offsets below are measured from this padding (`px-2 py-1`) and the node size.
 */
const STEP_BOX_CLASS =
  "relative flex h-auto min-h-6 max-w-full min-w-0 justify-start gap-2 rounded-md px-2 py-1 text-start";

/**
 * Connector geometry per orientation and node size. Horizontal: centred on the node row
 * (`py-1` + half the node − 1px), starting one gap after the node and running to the step's
 * end, where the next step's own `px-2` leaves the same gap before its node. Vertical: centred
 * under the node, from one gap below it to the step's bottom. Static strings so Tailwind sees
 * them.
 */
const CONNECTOR_CLASS = {
  horizontal: {
    default: "absolute end-0 top-4.25 start-11 h-0.5",
    sm: "absolute end-0 top-3.25 start-9 h-0.5",
  },
  vertical: {
    default: "absolute bottom-0 top-9 start-5.25 w-0.5",
    sm: "absolute bottom-0 top-7 start-4.25 w-0.5",
  },
} as const;

/** Sr-only state text, so state is never carried by colour or glyph alone. */
const STATE_TEXT: Record<StepperStepState, string> = {
  complete: "Completed",
  current: "Current step",
  loading: "Checking",
  warning: "Needs review",
  error: "Needs attention",
  skipped: "Skipped",
  upcoming: "Not started",
};

/** The glyph that replaces the ordinal, or `null` where the ordinal is kept. */
const STATE_GLYPH: Record<
  StepperStepState,
  React.ComponentType<{ className?: string }> | null
> = {
  complete: Check,
  current: null,
  loading: Loader,
  warning: TriangleAlert,
  error: X,
  skipped: null,
  upcoming: null,
};

/**
 * Container-query breakpoint at which the full rail replaces the compact summary. Static
 * strings so Tailwind can see them — a template literal would not be scanned.
 */
const COLLAPSE_CLASS = {
  sm: {
    summary: "@sm/stepper:hidden",
    rail: "hidden @sm/stepper:flex",
    count: "hidden @sm/stepper:block",
  },
  md: {
    summary: "@md/stepper:hidden",
    rail: "hidden @md/stepper:flex",
    count: "hidden @md/stepper:block",
  },
  lg: {
    summary: "@lg/stepper:hidden",
    rail: "hidden @lg/stepper:flex",
    count: "hidden @lg/stepper:block",
  },
  xl: {
    summary: "@xl/stepper:hidden",
    rail: "hidden @xl/stepper:flex",
    count: "hidden @xl/stepper:block",
  },
  "2xl": {
    summary: "@2xl/stepper:hidden",
    rail: "hidden @2xl/stepper:flex",
    count: "hidden @2xl/stepper:block",
  },
} as const;

/** Container-query breakpoints `collapse` accepts, plus the count-derived `auto`. */
export type StepperCollapse = keyof typeof COLLAPSE_CLASS | "auto";

/**
 * `collapse="auto"` picks the breakpoint from the step count, because the width at which a
 * rail stops being readable is a function of how many labels have to share it — roughly
 * 115px each before they start truncating to nothing. A fixed breakpoint would either
 * collapse a three-step rail that had room to spare, or leave a five-step one shredded.
 * Only horizontal rails reach this: `orientation="auto"` has already gone vertical by six.
 */
function autoCollapse(stepCount: number): keyof typeof COLLAPSE_CLASS {
  if (stepCount <= 2) return "sm";
  if (stepCount === 3) return "md";
  if (stepCount === 4) return "lg";
  return "xl";
}

/** Props accepted by `StepperNode`. */
export interface StepperNodeProps
  extends
    Omit<React.ComponentPropsWithRef<"span">, "children">,
    Pick<VariantProps<typeof stepperNodeVariants>, "size"> {
  /** The state the node draws. */
  state: StepperStepState;
  /** 1-based position, shown for the states that keep their ordinal. */
  index: number;
  /**
   * Node scale, matching `Stepper`'s own.
   * @default 'default'
   */
  size?: "default" | "sm";
}

/**
 * `StepperNode` — one step's circle, on its own. `Stepper` renders these itself; it is
 * exported because a surface that shows steps WITHOUT the rail (a phone section list, a
 * status cell in a table) needs the same glyph-and-ordinal logic, and a second copy of it
 * would drift the first time a state is added.
 *
 * @example
 * <StepperNode state="complete" index={1} size="sm" />
 */
export function StepperNode({
  state,
  index,
  size = "default",
  className,
  ref,
  ...props
}: StepperNodeProps) {
  const Glyph = STATE_GLYPH[state];
  return (
    <span
      ref={ref}
      data-slot="stepper-node"
      className={cn(stepperNodeVariants({ state, size }), className)}
      {...props}
    >
      {Glyph ? (
        // An explicit size and `data-icon-tone` stand the glyph down from a host Button's own
        // svg size and ink, so a node inside a navigable step draws exactly as it does outside.
        <Glyph
          aria-hidden
          data-icon-tone=""
          className={cn(
            size === "sm" ? "size-3" : "size-3.5",
            state === "loading" && "animate-spin",
          )}
        />
      ) : (
        index
      )}
    </span>
  );
}

/** Props accepted by `Stepper`. */
export interface StepperProps
  extends
    Omit<React.ComponentPropsWithRef<"div">, "children">,
    Pick<VariantProps<typeof stepperNodeVariants>, "size"> {
  /** The ordered steps. Exactly one should carry `state: "current"` or `"loading"`. */
  steps: StepperStep[];
  /**
   * Layout direction. `auto` reads the step count: a rail long enough to crush its own
   * labels side by side is better read down the page, so it flips to vertical at
   * `verticalFrom` steps. Both orientations keep the same DOM and reading order.
   * @default 'auto'
   */
  orientation?: "horizontal" | "vertical" | "auto";
  /**
   * How many steps make `orientation="auto"` choose vertical. Counted from `steps`, so a
   * conditional step appearing mid-flow can flip the layout by itself.
   * @default 6
   */
  verticalFrom?: number;
  /**
   * Node and label scale together — `default` is upstream's tier name, `sm` is the compact
   * rail for a card header or a toolbar.
   * @default 'default'
   */
  size?: "default" | "sm";
  /**
   * Where the label sits relative to its node, in horizontal orientation only.
   * `below` gives each step a full-width column under its node; `inline` sets the label
   * beside the node with the connector running on from it, for a compact rail in a card
   * header. Ignored when vertical.
   * @default 'below'
   */
  labelPosition?: "below" | "inline";
  /**
   * Navigable mode: completed, skipped and error steps render as real buttons that fire
   * `onStepSelect`. In linear mode (the default) no step is interactive — movement belongs
   * to the host's Back/Next controls, and non-interactive steps are a promise that order
   * matters.
   * @default false
   */
  navigable?: boolean;
  /**
   * Fired in navigable mode when a revisitable step is activated.
   * @default undefined
   */
  onStepSelect?: (id: string) => void;
  /**
   * Renders a "Step n of N" line above the rail. The compact summary always shows it, so
   * this only affects the full rail.
   * @default false
   */
  showCount?: boolean;
  /**
   * Container width below which the rail is replaced by a compact summary — the current
   * step's label, its position, and a `Progress` bar. A container query, not a viewport
   * one, so a rail inside a narrow dialog collapses on a wide screen too. `auto` derives
   * the breakpoint from the step count; a named breakpoint pins it. Applies to horizontal
   * orientation only — a vertical rail already reads correctly when narrow. Pass `false`
   * to keep the full rail at every width.
   * @default 'auto'
   */
  collapse?: StepperCollapse | false;
  /**
   * Accessible name for the process.
   * @default 'Progress'
   */
  "aria-label"?: string;
}

/** A step is "behind you" when the flow has left it — which its own state says, not its index. */
function connectorPassed(state: StepperStepState): boolean {
  return state === "complete" || state === "skipped";
}

/** `focus()` on a `display: none` node is a no-op, so pick the first candidate that is laid out. */
function focusFirstVisible(candidates: (HTMLElement | null | undefined)[]) {
  for (const node of candidates) {
    if (node && node.offsetParent !== null) {
      node.focus();
      return;
    }
  }
}

/**
 * `Stepper` — a bounded linear process as an ordered list: seven states mapped onto a
 * numbered node, a rail that fills in behind you, `aria-current="step"`, horizontal or
 * vertical orientation chosen automatically from the step count, a compact summary below a
 * container width, and focus moved to the new step's label whenever the current step
 * changes (never on first mount).
 *
 * **Not `Tabs`** — `role="tab"` implies free navigation and misleads assistive tech in a
 * linear flow. **Not a joined `ToggleGroup`** — that is a view switcher, not a sequence.
 *
 * It communicates the process and nothing else: no Back/Next controls, no step bodies, and
 * no refusal message. A reason the flow cannot advance belongs beside the control it
 * blocks, which is the host's button — `MultiStepForm` is that host for a driven flow.
 *
 * @example
 * <Stepper
 *   aria-label="Import"
 *   steps={[
 *     { id: "upload", label: "Upload file", state: "complete" },
 *     { id: "map", label: "Map columns", state: "current" },
 *     { id: "review", label: "Review", state: "upcoming" },
 *   ]}
 * />
 */
export function Stepper({
  steps,
  orientation = "auto",
  verticalFrom = 6,
  size = "default",
  labelPosition = "below",
  navigable = false,
  onStepSelect,
  showCount = false,
  collapse = "auto",
  "aria-label": ariaLabel = "Progress",
  className,
  ref,
  ...props
}: StepperProps) {
  const resolvedOrientation =
    orientation === "auto"
      ? steps.length >= verticalFrom
        ? "vertical"
        : "horizontal"
      : orientation;
  const isVertical = resolvedOrientation === "vertical";
  const isInline = !isVertical && labelPosition === "inline";

  const currentIndex = steps.findIndex(isCurrentStep);
  const current = currentIndex === -1 ? undefined : steps[currentIndex];
  const completed = steps.filter((step) => connectorPassed(step.state)).length;

  // Collapsing is a horizontal-only affordance: a vertical rail is already a column and
  // reads correctly at any width, so replacing it with a summary would lose detail for
  // nothing.
  const collapseAt =
    !isVertical && collapse && current
      ? COLLAPSE_CLASS[
          collapse === "auto" ? autoCollapse(steps.length) : collapse
        ]
      : null;

  const currentId = current?.id;
  const boxRefs = React.useRef(new Map<string, HTMLElement>());
  const summaryRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);

  // A horizontal rail wider than its container scrolls; keep the current step in view —
  // on mount too, since a flow opened at step 5 of 6 would otherwise show steps 1–3. Only
  // the list's own scroll position moves (never the page), and only when the step is
  // actually clipped. A delta, not an absolute offset, so it is correct in RTL as well.
  // Layout changes re-run the check: a resize, or the rail going from collapsed
  // (`display: none`, zero size) to laid out, can leave the current step off-screen with
  // no change to the current id.
  React.useEffect(() => {
    const list = listRef.current;
    if (isVertical || !list || currentId === undefined) return;
    const reveal = () => {
      const box = boxRefs.current.get(currentId);
      if (!box || list.scrollWidth <= list.clientWidth) return;
      const outer = list.getBoundingClientRect();
      const inner = box.getBoundingClientRect();
      if (inner.left >= outer.left && inner.right <= outer.right) return;
      list.scrollLeft +=
        inner.left - outer.left - (outer.width - inner.width) / 2;
    };
    reveal();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(reveal);
    observer.observe(list);
    return () => observer.disconnect();
  }, [currentId, isVertical]);

  // Focus follows the process: when the CURRENT step changes (a live transition, never the
  // initial render), move focus to the new step (its node and label) so keyboard and screen-reader users
  // land on "where am I now" — not on the first form field and not at the top of the page.
  // Below the collapse width the rail is `display: none`, so the summary is the target.
  const previousCurrentId = React.useRef<string | undefined>(currentId);
  React.useEffect(() => {
    if (
      previousCurrentId.current !== undefined &&
      currentId !== undefined &&
      previousCurrentId.current !== currentId
    ) {
      focusFirstVisible([boxRefs.current.get(currentId), summaryRef.current]);
    }
    previousCurrentId.current = currentId;
  }, [currentId]);

  const countText =
    currentIndex === -1
      ? undefined
      : `Step ${currentIndex + 1} of ${steps.length}`;

  return (
    <div
      ref={ref}
      data-slot="stepper"
      data-orientation={resolvedOrientation}
      data-size={size}
      data-label-position={isVertical ? undefined : labelPosition}
      className={cn("@container/stepper flex w-full flex-col gap-2", className)}
      {...props}
    >
      {/* The compact form. Always mounted when collapsing is on: `display: none` keeps it
          out of the accessibility tree at wide widths, so the two never double-announce. */}
      {collapseAt && current ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          data-slot="stepper-summary"
          className={cn("flex flex-col gap-2 outline-none", collapseAt.summary)}
        >
          <Progress
            value={Math.round((completed / Math.max(steps.length, 1)) * 100)}
          >
            <ProgressLabel className="min-w-0 truncate">
              {current.label}
            </ProgressLabel>
            <span
              data-slot="stepper-count"
              className="ms-auto shrink-0 text-xs text-muted-foreground tabular-nums"
            >
              {countText}
            </span>
          </Progress>
        </div>
      ) : null}

      {showCount && countText ? (
        <p
          data-slot="stepper-count"
          className={cn(
            "text-xs text-muted-foreground tabular-nums",
            collapseAt?.count,
          )}
        >
          {countText}
        </p>
      ) : null}

      <ol
        ref={listRef}
        data-slot="stepper-list"
        aria-label={ariaLabel}
        className={cn(
          "w-full list-none",
          collapseAt ? collapseAt.rail : "flex",
          // A horizontal rail wider than its container scrolls sideways rather than crushing
          // its labels or widening the page: every step keeps a readable minimum width.
          isVertical
            ? "flex-col"
            : // `relative`: the sr-only state text is absolutely positioned, and it must take
              // this scroller as its containing block or it escapes the clip and widens the page.
              "relative scroll-fade-x scrollbar-none flex-row items-start overflow-x-auto overscroll-x-contain",
        )}
      >
        {steps.map((step, index) => {
          const isCurrent = isCurrentStep(step);
          const isLast = index === steps.length - 1;
          const passed = connectorPassed(step.state);
          // Completed, skipped AND error steps are revisitable in navigable mode — a failed
          // step is exactly the one the user needs to get back to.
          const selectable =
            navigable &&
            !isCurrent &&
            (step.state === "complete" ||
              step.state === "skipped" ||
              step.state === "error") &&
            !step.disabled;

          const setBox = (node: HTMLElement | null) => {
            if (node) boxRefs.current.set(step.id, node);
            else boxRefs.current.delete(step.id);
          };

          const content = (
            <>
              <StepperNode state={step.state} index={index + 1} size={size} />
              <span
                data-slot="stepper-content"
                className={cn(
                  "flex min-w-0 flex-col",
                  !isVertical && !isInline ? "max-w-full" : "justify-center",
                  // Side by side, the text column is as tall as the node so a one-line label
                  // centres on it, and a description runs on below.
                  (isVertical || isInline) &&
                    (size === "sm" ? "min-h-5" : "min-h-7"),
                )}
              >
                <span
                  data-slot="stepper-label"
                  className={cn(
                    "flex min-w-0 items-center gap-1.5",
                    // `sm` scales the label with the node. Scaling only the node produced two
                    // sizes that read as one — the label is most of what a rail is.
                    size === "sm" ? "text-xs" : "text-sm",
                    LABEL_CLASS[step.state],
                  )}
                >
                  {/* The invisible twin reserves the bold width, so the label that becomes
                      current changes weight without moving anything beside it. */}
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={cn("truncate", isCurrent && "font-medium")}
                    >
                      {step.label}
                    </span>
                    <span
                      aria-hidden
                      className="invisible h-0 truncate font-medium"
                    >
                      {step.label}
                    </span>
                  </span>
                  {step.optional ? (
                    <span
                      data-slot="stepper-optional"
                      className="shrink-0 text-xs font-normal text-muted-foreground"
                    >
                      Optional
                    </span>
                  ) : null}
                  <span className="sr-only">{STATE_TEXT[step.state]}</span>
                </span>
                {step.description ? (
                  <span
                    data-slot="stepper-description"
                    className="flex min-w-0 text-xs font-normal text-muted-foreground"
                  >
                    <span className="truncate">{step.description}</span>
                  </span>
                ) : null}
              </span>
            </>
          );

          const boxLayout = cn(
            STEP_BOX_CLASS,
            isVertical || isInline
              ? "flex-row items-start"
              : "flex-col items-start gap-1.5",
            isInline && "shrink",
            step.disabled && "opacity-50",
          );

          return (
            <li
              key={step.id}
              data-slot="stepper-step"
              data-state={step.state}
              data-disabled={step.disabled ? "" : undefined}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative flex min-w-0",
                isVertical && "flex-col pb-4 last:pb-0",
                !isVertical && !isLast && "flex-1",
                !isVertical && !isInline && "min-w-28 flex-col items-start",
                isInline && "flex-row items-center gap-2",
              )}
            >
              {/* Painted BEFORE the step box: the box is positioned too, so where its hover
                  wash meets the line the wash sits on top. Under `inline` the connector is a
                  flex sibling that runs on from the box instead. */}
              {!isLast && !isInline ? (
                <span
                  aria-hidden
                  data-slot="stepper-connector"
                  data-passed={passed ? "" : undefined}
                  className={cn(
                    "rounded-full transition-colors",
                    passed ? "bg-primary/40" : "bg-border",
                    CONNECTOR_CLASS[resolvedOrientation][size],
                  )}
                />
              ) : null}

              {selectable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  ref={setBox}
                  data-slot="stepper-trigger"
                  onClick={() => onStepSelect?.(step.id)}
                  // One target for node and label. No press motion (Button's `translate-y-px`):
                  // a step is navigation, not a push button, and the rail must never move.
                  className={cn(
                    boxLayout,
                    "font-normal whitespace-normal active:not-aria-[haspopup]:translate-y-0",
                  )}
                >
                  {content}
                </Button>
              ) : (
                <span
                  ref={setBox}
                  data-slot="stepper-item"
                  // Focus target when the step becomes current — not a tab stop.
                  tabIndex={isCurrent ? -1 : undefined}
                  // The same 1px transparent border the trigger Button carries, so the node
                  // and label do not shift when a step becomes (or stops being) current.
                  className={cn(boxLayout, "border border-transparent")}
                >
                  {content}
                </span>
              )}

              {!isLast && isInline ? (
                <span
                  aria-hidden
                  data-slot="stepper-connector"
                  data-passed={passed ? "" : undefined}
                  className={cn(
                    "h-0.5 min-w-4 flex-1 rounded-full transition-colors",
                    passed ? "bg-primary/40" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
