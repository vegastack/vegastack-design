// @vegastack multi-step-form@0.19.0 sha256-6tArBQZQ43IyX8d4As0KMk3nSIhrIuz9w4Ja4VS9BjE=

"use client";

import * as React from "react";
import { ChevronRight, ChevronLeft, CircleAlert } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";

import {
  Stepper,
  StepperNode,
  type StepperStep,
} from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/components/ui/use-mobile";

/* ---
`MultiStepForm` is the flow around a `Stepper`: it owns sequencing, guards, locking,
reachability and placement, and it owns nothing about forms. A step body is whatever the
host passes as children — a `Field` form, a static review table, a `Dropzone`, a chart — so
the component never needs a schema, a validator or a values store, and ships zero new
dependencies. `react-hook-form` and `zod` would each be a new sanctioned dependency
exception; because the guard contract is a function returning a promise, either plugs in
from the host side without one.

Approved 2026-09-22 (`docs/plans/2026-09-22-stepper-rebuild-and-multi-step-form.md`). It
replaces the recipe that used to live in the multi-step form guide, which now documents the
component instead.

FOUR DECISIONS WORTH KNOWING, because each replaced an obvious-looking alternative:

1. **Reachability is one predicate, not a `mode` flag.** "Can someone open step 4 directly?"
   has the same answer as "should the rail start complete?" and "which nav does a phone
   get?": a step is reachable when every step before it is SATISFIED. Creating a record
   satisfies nothing, so a pasted link rewinds to step 1; editing an existing one satisfies
   everything from loaded data, so the same link opens exactly where it points. A
   `mode="create" | "edit"` flag would have to be kept consistent with the data by hand.

2. **A refusal lives beside the control it blocks, and its weight follows its cause.** A gate
   that is merely unsatisfied ("map every column") is a quiet polite line; a check that RAN
   and FAILED ("your bank declined this card") is an assertive `Alert`. Both sit directly
   above the action row — the same place in every orientation, and the one place that
   survives the phone layout. A transient toast cannot carry either: it is gone before a
   slow reader reaches it and it is not tied to the button, which is WCAG 3.3.1. A toast is
   right for the third case only — the check could not run at all — and that is
   `onTransportError`, which the host renders.

3. **The flow never advances optimistically.** While a guard runs, the step is `loading` in
   the rail and the action is a loading `Button`. A wizard that walks backwards after the
   fact loses the user's place and their trust.

4. **Exactly one focus move per transition.** `Stepper` already moves focus to the new step's
   label, so this component must NOT also focus the first field, and mounts no live region of
   its own for step changes — the focused label and `aria-current` are the announcement.
   The refusal surfaces are the only regions here, and they exist because they appear AFTER
   mount in response to something the user did.

DELIBERATELY NOT DONE:
- No headless hook (MK, 2026-09-22). A host needing wizard behaviour without this chrome
  composes `Stepper` directly. Adding one later breaks nothing.
- No direction-aware slide between steps. It would need a new `motion-*` utility, which is a
  token change and belongs in a wave PR, not a component one. Steps use `motion-enter-up`,
  the sanctioned keyed-presence mechanism, which the global reduced-motion reset already
  collapses.
--- */

/** What a guard says when it will not let the flow move. */
export interface MultiStepFormRefusal {
  /** One sentence, shown beside the control it blocks and read out with it. */
  reason: string;
  /**
   * `soft` is a gate not yet satisfied — a quiet polite line. `error` is a check that ran
   * and failed — an assertive `Alert`, and the step is marked in the rail.
   * @default 'error'
   */
  tone?: "soft" | "error";
  /**
   * Optional heading for the `error` form. With none, the reason is the whole message.
   * @default undefined
   */
  title?: string;
}

/** What a guard may return: `true` to pass, a sentence to refuse, or a full refusal. */
export type MultiStepFormGuardResult = true | string | MultiStepFormRefusal;

/** What a guard is told about the move it is being asked to allow. */
export interface MultiStepFormGuardContext {
  /** The step the flow is leaving. */
  id: string;
  /** Its index among the visible steps. */
  index: number;
  /** How many steps are currently visible — conditional steps are already filtered out. */
  total: number;
  /** Which way the flow is trying to move. */
  direction: "next" | "back";
}

/** Runs before a move and decides whether it happens. May be async; the flow waits. */
export type MultiStepFormGuard = (
  context: MultiStepFormGuardContext,
) => MultiStepFormGuardResult | Promise<MultiStepFormGuardResult>;

/** One step's declaration — the flow, never the body. */
export interface MultiStepFormStepSpec {
  /** Stable identifier. Also the value written to the address bar under `urlSync`. */
  id: string;
  /** Shown in the rail and on the phone's section row. */
  label: string;
  /**
   * Secondary line under the label.
   * @default undefined
   */
  description?: string;
  /**
   * Renders an "Optional" affix and offers a Skip control, which advances without running
   * `beforeNext` and marks the step `skipped`.
   * @default false
   */
  optional?: boolean;
  /**
   * Whether the step exists in this flow at all. `false` removes it from the rail, the
   * count and the sequence, so "step 3 of 4" stays true when a branch drops one. The host
   * computes it from its own answers — this component holds no values of its own.
   * @default true
   */
  when?: boolean;
  /**
   * Whether the step is already complete independently of this session — because a record
   * being edited already carries its data. It decides which steps are REACHABLE, which in
   * turn decides deep links, whether jumping is offered, and which phone layout renders.
   * @default whether the step has been passed in this session
   */
  satisfied?: boolean;
  /**
   * A cheap synchronous gate: `false` disables the action with no round trip, for the case
   * where the answer is plainly incomplete. Use `beforeNext` when there is a reason worth
   * showing.
   * @default true
   */
  canGoNext?: boolean;
  /**
   * Runs before the flow leaves this step forwards. Return `true` to pass, or a sentence to
   * refuse. On the last step this is the submit check.
   * @default undefined
   */
  beforeNext?: MultiStepFormGuard;
  /**
   * Runs before the flow leaves this step backwards — for a step that cannot simply be
   * abandoned.
   * @default undefined
   */
  beforeBack?: MultiStepFormGuard;
  /**
   * Once this step is passed, every step before it is sealed for good: Back is disabled and
   * neither a jump nor a stale link can reopen them. For a step that commits something —
   * a payment taken, a document signed.
   * @default false
   */
  lock?: boolean;
  /**
   * Marks the step as passable but carrying something the user should know. Renders the
   * rail's `warning` state.
   * @default false
   */
  warning?: boolean;
  /**
   * Never reachable, even when everything before it is satisfied — gated by a plan, say.
   * @default false
   */
  disabled?: boolean;
  /**
   * Overrides the forward action's label on this step alone.
   * @default undefined
   */
  nextLabel?: string;
  /**
   * Overrides the back action's label on this step alone.
   * @default undefined
   */
  backLabel?: string;
}

interface ResolvedRefusal extends Required<
  Pick<MultiStepFormRefusal, "reason">
> {
  id: string;
  tone: "soft" | "error";
  title?: string;
}

interface MultiStepFormContextValue {
  steps: MultiStepFormStepSpec[];
  current: MultiStepFormStepSpec | undefined;
  currentIndex: number;
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  refusal: ResolvedRefusal | null;
  refusalId: string;
  stepperSteps: StepperStep[];
  navigable: boolean;
  sealedIndex: number;
  reachable: (index: number) => boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  goNext: () => void;
  goBack: () => void;
  goTo: (id: string) => void;
  skip: () => void;
  labels: {
    back: string;
    next: string;
    submit: string;
    finish: string;
    skip: string;
  };
  complete: () => void;
  layout: "flow" | "panel";
  dirty: boolean;
  requestExit: () => void;
  isMobile: boolean;
  overview: boolean;
  setOverview: (open: boolean) => void;
  usesSectionList: boolean;
}

const MultiStepFormContext =
  React.createContext<MultiStepFormContextValue | null>(null);

function useMultiStepFormContext(part: string): MultiStepFormContextValue {
  const context = React.useContext(MultiStepFormContext);
  if (!context) {
    throw new Error(`${part} must be rendered inside <MultiStepForm>`);
  }
  return context;
}

const HASH_PREFIX = "#step=";
const STORAGE_PREFIX = "vegastack:multi-step-form:";

/**
 * The hash is namespaced (`#step=billing`, not `#billing`) so it cannot collide with an
 * in-page heading anchor, and it is a hash rather than a query parameter because a registry
 * component may not import a framework's router — a hash is plain browser API, works with no
 * adapter passed in, and never reaches the server, so a step id stays out of server logs.
 */
function readHash(): string | null {
  if (typeof window === "undefined") return null;
  const { hash } = window.location;
  return hash.startsWith(HASH_PREFIX)
    ? decodeURIComponent(hash.slice(HASH_PREFIX.length))
    : null;
}

/** Browser storage can throw outright (private mode, blocked site data), so never assume. */
function readStored(key: string): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    /* storage is a convenience here; the flow works without it */
  }
}

/** The second argument of `onStepChange`. */
export interface MultiStepFormStepChangeDetails {
  /** Replace the current history entry instead of pushing one (a correction, not a move). */
  replace: boolean;
}

/** Props accepted by `MultiStepForm`. */
export interface MultiStepFormProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onSubmit"
> {
  /** Every step the flow can contain, including ones `when` currently hides. */
  steps: MultiStepFormStepSpec[];
  /**
   * The current step, when the host wants to own it. Pair with `onStepChange`.
   * @default undefined
   */
  step?: string;
  /**
   * The step to open on first render, when uncontrolled. A deep link, saved progress, or an
   * unreachable value all resolve against reachability, so this is a request, not a command.
   * @default the first visible step
   */
  defaultStep?: string;
  /**
   * Fired whenever the current step changes, however it changed. `details.replace` tells a
   * route-driven host whether to push a history entry or replace the current one: it is `false`
   * for Next, Back and a jump from the rail, and `true` when the form corrected the step itself
   * (a requested step it will not admit, clamped to the furthest reachable one) or followed the
   * address bar's hash. A one-argument handler keeps working.
   * @default undefined
   */
  onStepChange?: (id: string, details: MultiStepFormStepChangeDetails) => void;
  /**
   * Fired when the last step's guard passes — the flow is finished.
   * @default undefined
   */
  onComplete?: () => void;
  /**
   * Fired when a guard THREW rather than refused: the check could not run at all. This is
   * the one failure a toast belongs to, and the host raises it. With no handler the flow
   * falls back to an inline error, so a transport failure is never silent.
   * @default undefined
   */
  onTransportError?: (
    error: unknown,
    context: MultiStepFormGuardContext,
  ) => void;
  /**
   * Whether reachable steps can be jumped to. `auto` offers it exactly when more than the
   * first step is reachable — which is what editing an existing record looks like, and what
   * a fresh create flow does not.
   * @default 'auto'
   */
  navigable?: boolean | "auto";
  /**
   * Remembers the current step and the steps passed, under this key, for the life of the
   * TAB. Opt-in and off by default: wizard answers are frequently personal, and writing
   * them to storage is not a default a design system gets to choose. Never use it for
   * payment data.
   * @default undefined
   */
  persistKey?: string;
  /**
   * Mirrors the current step to the address bar as `#step=<id>`, so the browser's Back
   * button moves a step instead of leaving the page.
   * @default false
   */
  urlSync?: boolean;
  /**
   * Label for the backward action.
   * @default 'Back'
   */
  backLabel?: string;
  /**
   * Label for the forward action on every step but the last.
   * @default 'Continue'
   */
  nextLabel?: string;
  /**
   * Label for the forward action on the last step.
   * @default 'Submit'
   */
  submitLabel?: string;
  /**
   * Label for the skip action offered on an optional step.
   * @default 'Skip'
   */
  skipLabel?: string;
  /**
   * `panel` is the shape a wizard takes inside a `Dialog`, `Sheet` or `Drawer`: the nav and
   * the action row hold their place while the step body becomes the one scrolling region.
   * `flow` lets the whole thing grow down the page.
   * @default 'flow'
   */
  layout?: "flow" | "panel";
  /**
   * Whether the current step holds work that would be lost. The component does not decide
   * what dirty means — you do. While it is true, `MultiStepFormExit` asks before leaving and
   * the browser warns on a refresh or a closed tab.
   * @default false
   */
  dirty?: boolean;
  /**
   * What leaving actually does — close the dialog, navigate away. Called once the user has
   * confirmed, or straight away when nothing is dirty.
   * @default undefined
   */
  onExit?: () => void;
  /**
   * Heading of the confirmation raised when someone tries to leave dirty work.
   * @default 'Leave without finishing?'
   */
  exitTitle?: string;
  /**
   * Body of that confirmation.
   * @default "Your answers on this step haven't been saved yet."
   */
  exitDescription?: string;
  /**
   * Label of its confirming action.
   * @default 'Leave'
   */
  exitConfirmLabel?: string;
  /**
   * Label of its dismissing action.
   * @default 'Keep editing'
   */
  exitCancelLabel?: string;
}

/**
 * `MultiStepForm` — a guarded, branching flow around a `Stepper`. It owns sequencing,
 * conditional steps, forward and backward guards (sync or async), locking, reachability,
 * optional hash deep links and optional resume; it owns no fields, no schema and no
 * validation library, because a step body is whatever you pass as children.
 *
 * Compose it from `MultiStepFormNav`, one `MultiStepFormStep` per step, and
 * `MultiStepFormActions`.
 *
 * @example
 * <MultiStepForm
 *   steps={[
 *     { id: "account", label: "Account" },
 *     { id: "company", label: "Business details", when: type === "business" },
 *     {
 *       id: "billing",
 *       label: "Billing",
 *       lock: true,
 *       beforeNext: async () => (await charge()) || "Your bank declined this card.",
 *     },
 *     { id: "review", label: "Review" },
 *   ]}
 * >
 *   <MultiStepFormNav />
 *   <MultiStepFormStep id="account">…</MultiStepFormStep>
 *   <MultiStepFormStep id="company">…</MultiStepFormStep>
 *   <MultiStepFormStep id="billing">…</MultiStepFormStep>
 *   <MultiStepFormStep id="review">…</MultiStepFormStep>
 *   <MultiStepFormActions />
 * </MultiStepForm>
 */
export function MultiStepForm({
  steps,
  step: controlledStep,
  defaultStep,
  onStepChange,
  onComplete,
  onTransportError,
  navigable = "auto",
  persistKey,
  urlSync = false,
  backLabel = "Back",
  nextLabel = "Continue",
  submitLabel = "Submit",
  skipLabel = "Skip",
  layout = "flow",
  dirty = false,
  onExit,
  exitTitle = "Leave without finishing?",
  exitDescription = "Your answers on this step haven't been saved yet.",
  exitConfirmLabel = "Leave",
  exitCancelLabel = "Keep editing",
  className,
  children,
  ref,
  ...props
}: MultiStepFormProps) {
  const refusalId = React.useId();
  const isMobile = useIsMobile();

  const visible = React.useMemo(
    () => steps.filter((s) => s.when !== false),
    [steps],
  );

  const [passed, setPassed] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [skipped, setSkipped] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [failedId, setFailedId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [refusal, setRefusal] = React.useState<ResolvedRefusal | null>(null);
  const [sealedIndex, setSealedIndex] = React.useState(-1);
  const [uncontrolledStep, setUncontrolledStep] = React.useState<
    string | undefined
  >(defaultStep);
  const [exitPrompt, setExitPrompt] = React.useState(false);

  // The other half of an unsaved-changes guard, and the half a component cannot fake: a
  // refresh or a closed tab never reaches React. Attached only while the host says the step
  // is dirty, so a clean flow adds no interstitial.
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const satisfied = React.useCallback(
    (spec: MultiStepFormStepSpec) => spec.satisfied ?? passed.has(spec.id),
    [passed],
  );

  // A step is reachable when everything before it is satisfied. This single predicate
  // answers the deep-link question, the "offer jumping?" question and the phone-layout
  // question, which is why there is no create/edit mode flag anywhere in this file.
  const reachable = React.useCallback(
    (index: number) => {
      if (index <= 0) return true;
      const spec = visible[index];
      if (spec?.disabled) return false;
      return visible.slice(0, index).every(satisfied);
    },
    [visible, satisfied],
  );

  const requested = controlledStep ?? uncontrolledStep;
  const requestedIndex = visible.findIndex((s) => s.id === requested);
  // Clamp to the furthest step the flow will admit. A pasted link, a restored session and a
  // conditional step vanishing under the current position all land here.
  const currentIndex = (() => {
    if (requestedIndex === -1) return 0;
    if (reachable(requestedIndex) && requestedIndex > sealedIndex) {
      return requestedIndex;
    }
    for (let i = Math.min(requestedIndex, visible.length - 1); i >= 0; i--) {
      if (i > sealedIndex && reachable(i)) return i;
    }
    return Math.max(0, Math.min(sealedIndex + 1, visible.length - 1));
  })();
  const current = visible[currentIndex];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visible.length - 1;

  const setCurrent = React.useCallback(
    (id: string, replace = false) => {
      if (controlledStep === undefined) setUncontrolledStep(id);
      onStepChange?.(id, { replace });
    },
    [controlledStep, onStepChange],
  );

  // A requested step the flow will not admit is CORRECTED, not merely ignored. Without this
  // the host — controlled or not — keeps believing the flow is somewhere it is not, and the
  // disagreement only surfaces later as an inexplicable jump. Reported once per resolution,
  // so a host that ignores it cannot be spun.
  const reported = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const resolved = current?.id;
    if (!resolved || requested === resolved) {
      reported.current = undefined;
      return;
    }
    if (reported.current === resolved) return;
    reported.current = resolved;
    setCurrent(resolved, true);
  }, [current?.id, requested, setCurrent]);

  /* ---------------------------------------------------------------- resume */

  const restored = React.useRef(false);
  React.useEffect(() => {
    if (restored.current || !persistKey) return;
    restored.current = true;
    const raw = readStored(persistKey);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { step?: string; passed?: string[] };
      if (Array.isArray(saved.passed)) setPassed(new Set(saved.passed));
      // The step is applied as a REQUEST — the clamp above still has the final say, so a
      // saved position whose prerequisites no longer hold cannot reopen a gated step.
      if (saved.step && controlledStep === undefined) {
        setUncontrolledStep(saved.step);
      }
    } catch {
      /* a corrupt entry is not worth failing the flow over */
    }
  }, [persistKey, controlledStep]);

  React.useEffect(() => {
    if (!persistKey || !current) return;
    writeStored(
      persistKey,
      JSON.stringify({ step: current.id, passed: [...passed] }),
    );
  }, [persistKey, current, passed]);

  /* ------------------------------------------------------------- url sync */

  const hashApplied = React.useRef(false);
  React.useEffect(() => {
    if (!urlSync || hashApplied.current) return;
    hashApplied.current = true;
    const fromHash = readHash();
    if (fromHash && controlledStep === undefined) setUncontrolledStep(fromHash);
  }, [urlSync, controlledStep]);

  React.useEffect(() => {
    if (!urlSync) return;
    const onHashChange = () => {
      const fromHash = readHash();
      // The address bar already moved; the host records nothing new.
      if (fromHash) setCurrent(fromHash, true);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [urlSync, setCurrent]);

  React.useEffect(() => {
    if (!urlSync || !current) return;
    const next = HASH_PREFIX + encodeURIComponent(current.id);
    // Only write when the clamp settled somewhere else, so a forged or stale hash is
    // corrected in the bar rather than silently disagreeing with what is on screen.
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [urlSync, current]);

  /* ---------------------------------------------------------------- moves */

  const move = React.useCallback(
    async (direction: "next" | "back") => {
      if (!current || pending) return;
      // A disabled Button here keeps pointer events and focus (aria-disabled, not the native
      // attribute), which is deliberate — so the refusal has to live in the move, not only in
      // the control's appearance.
      if (
        direction === "back" &&
        (isFirst || currentIndex - 1 <= sealedIndex)
      ) {
        return;
      }
      if (direction === "next" && current.canGoNext === false) return;
      const context: MultiStepFormGuardContext = {
        id: current.id,
        index: currentIndex,
        total: visible.length,
        direction,
      };
      const guard =
        direction === "next" ? current.beforeNext : current.beforeBack;

      const commit = () => {
        setRefusal(null);
        if (direction === "back") {
          setCurrent(visible[currentIndex - 1]!.id);
          return;
        }
        setFailedId((id) => (id === current.id ? null : id));
        setPassed((done) => new Set(done).add(current.id));
        setSkipped((done) => {
          if (!done.has(current.id)) return done;
          const next = new Set(done);
          next.delete(current.id);
          return next;
        });
        if (current.lock) setSealedIndex(currentIndex);
        if (isLast) onComplete?.();
        else setCurrent(visible[currentIndex + 1]!.id);
      };

      if (!guard) {
        commit();
        return;
      }

      setRefusal(null);
      setPending(true);
      try {
        const result = await guard(context);
        setPending(false);
        if (result === true) {
          commit();
          return;
        }
        const resolved: ResolvedRefusal =
          typeof result === "string"
            ? { id: current.id, reason: result, tone: "error" }
            : {
                id: current.id,
                tone: "error",
                ...result,
              };
        setRefusal(resolved);
        // A soft gate is "not yet", not "broken", so it leaves the rail alone.
        if (resolved.tone === "error") setFailedId(current.id);
      } catch (error) {
        setPending(false);
        if (onTransportError) {
          onTransportError(error, context);
        } else {
          setRefusal({
            id: current.id,
            reason: "That check could not run. Try again.",
            tone: "error",
          });
        }
      }
    },
    [
      current,
      currentIndex,
      isFirst,
      isLast,
      onComplete,
      onTransportError,
      pending,
      sealedIndex,
      setCurrent,
      visible,
    ],
  );

  const goNext = React.useCallback(() => void move("next"), [move]);
  const goBack = React.useCallback(() => void move("back"), [move]);

  const skip = React.useCallback(() => {
    if (!current || pending || isLast) return;
    setRefusal(null);
    setSkipped((done) => new Set(done).add(current.id));
    setPassed((done) => new Set(done).add(current.id));
    setCurrent(visible[currentIndex + 1]!.id);
  }, [current, currentIndex, isLast, pending, setCurrent, visible]);

  const requestExit = React.useCallback(() => {
    // Nothing to lose means no interstitial — a confirmation nobody needs is the fastest way
    // to teach people to dismiss confirmations without reading them.
    if (dirty) setExitPrompt(true);
    else onExit?.();
  }, [dirty, onExit]);

  const goTo = React.useCallback(
    (id: string) => {
      const index = visible.findIndex((s) => s.id === id);
      // A jump crosses only territory the flow has already admitted, so it runs no guard —
      // but it can never reopen a sealed step or reach an unsatisfied one.
      if (index === -1 || index <= sealedIndex || !reachable(index)) return;
      setRefusal(null);
      setCurrent(id);
    },
    [reachable, sealedIndex, setCurrent, visible],
  );

  /* ----------------------------------------------------------------- rail */

  const stepperSteps = React.useMemo<StepperStep[]>(
    () =>
      visible.map((spec, index) => ({
        id: spec.id,
        label: spec.label,
        description: spec.description,
        optional: spec.optional,
        disabled: spec.disabled || index <= sealedIndex,
        // A failed CURRENT step is still where the user is: keep it marked current.
        current: index === currentIndex,
        state:
          failedId === spec.id
            ? "error"
            : pending && index === currentIndex
              ? "loading"
              : index === currentIndex
                ? "current"
                : skipped.has(spec.id)
                  ? "skipped"
                  : spec.warning && satisfied(spec)
                    ? "warning"
                    : satisfied(spec)
                      ? "complete"
                      : "upcoming",
      })),
    [currentIndex, failedId, pending, satisfied, sealedIndex, skipped, visible],
  );

  const anyJumpTarget = visible.some(
    (_, index) =>
      index !== currentIndex && index > sealedIndex && reachable(index),
  );
  const resolvedNavigable =
    navigable === "auto" ? anyJumpTarget : navigable === true;

  const usesSectionList = isMobile && resolvedNavigable;
  // Editing a record that is already complete opens on the section list; a fresh flow opens
  // on its first step. Same predicate, one more time.
  const [overview, setOverview] = React.useState<boolean | undefined>(
    undefined,
  );
  const everySatisfied = visible.length > 0 && visible.every(satisfied);
  const resolvedOverview = usesSectionList && (overview ?? everySatisfied);

  const canGoBack = !isFirst && !pending && currentIndex - 1 > sealedIndex;
  const canGoNext = !pending && current?.canGoNext !== false;

  const context: MultiStepFormContextValue = {
    steps: visible,
    current,
    currentIndex,
    isFirst,
    isLast,
    pending,
    refusal,
    refusalId,
    stepperSteps,
    navigable: resolvedNavigable,
    sealedIndex,
    reachable,
    canGoBack,
    canGoNext,
    goNext,
    goBack,
    goTo,
    skip,
    labels: {
      back: current?.backLabel ?? backLabel,
      next: current?.nextLabel ?? nextLabel,
      submit: current?.nextLabel ?? submitLabel,
      // The overview belongs to no step, so it takes the ROOT label — a per-step override
      // would leak whichever step happened to be selected behind it.
      finish: submitLabel,
      skip: skipLabel,
    },
    complete: () => onComplete?.(),
    layout,
    dirty,
    requestExit,
    isMobile,
    overview: resolvedOverview,
    setOverview: (open: boolean) => setOverview(open),
    usesSectionList,
  };

  return (
    <MultiStepFormContext.Provider value={context}>
      <div
        ref={ref}
        data-slot="multi-step-form"
        data-step={current?.id}
        data-pending={pending ? "" : undefined}
        data-layout={layout}
        className={cn(
          "@container/multi-step-form flex min-w-0 flex-col gap-6",
          // `panel` gives the flow a fixed frame to live in, so its own middle can scroll
          // rather than the dialog growing past the viewport.
          layout === "panel" && "h-full min-h-0",
          className,
        )}
        {...props}
      >
        {children}
        <AlertDialog open={exitPrompt} onOpenChange={setExitPrompt}>
          <AlertDialogContent data-slot="multi-step-form-exit-prompt">
            <AlertDialogHeader>
              <AlertDialogTitle>{exitTitle}</AlertDialogTitle>
              <AlertDialogDescription>{exitDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{exitCancelLabel}</AlertDialogCancel>
              <AlertDialogAction
                data-slot="multi-step-form-exit-confirm"
                onClick={() => {
                  setExitPrompt(false);
                  onExit?.();
                }}
              >
                {exitConfirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MultiStepFormContext.Provider>
  );
}

/** Props accepted by `MultiStepFormNav`. */
export interface MultiStepFormNavProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * Accessible name for the process.
   * @default 'Progress'
   */
  "aria-label"?: string;
  /**
   * Passed through to `Stepper`. `auto` reads the step count.
   * @default 'auto'
   */
  orientation?: "horizontal" | "vertical" | "auto";
}

/**
 * `MultiStepFormNav` — the flow's progress display. On a wide screen it is the `Stepper`,
 * navigable exactly when some other step is reachable. On a phone whose steps ARE reachable
 * it becomes a section list instead: full-width rows that open a step, because rows promise
 * tapping and there it is a promise the flow can keep. On a phone whose steps are not
 * reachable it stays the `Stepper`, which collapses itself to a line and a bar.
 *
 * @example
 * <MultiStepFormNav aria-label="Signup" />
 */
export function MultiStepFormNav({
  className,
  "aria-label": ariaLabel = "Progress",
  orientation = "auto",
  ref,
  ...props
}: MultiStepFormNavProps) {
  const {
    steps,
    stepperSteps,
    current,
    currentIndex,
    goTo,
    navigable,
    overview,
    setOverview,
    usesSectionList,
    reachable,
    sealedIndex,
    layout,
  } = useMultiStepFormContext("MultiStepFormNav");
  const hold = layout === "panel" ? "shrink-0" : undefined;

  // On the phone the rail is not rendered, so `Stepper`'s focus move has no target and the
  // flow's one guarantee — focus follows the process — would silently become zero moves.
  // This is the same contract, on the same terms: a live transition only, never first mount,
  // and exactly one mover, because the two branches are mutually exclusive.
  const focusTargetRef = React.useRef<HTMLElement | null>(null);
  const previousView = React.useRef<string | null>(null);
  const view = `${overview ? "overview" : "step"}:${current?.id ?? ""}`;
  React.useEffect(() => {
    if (!usesSectionList) {
      previousView.current = null;
      return;
    }
    if (previousView.current !== null && previousView.current !== view) {
      focusTargetRef.current?.focus();
    }
    previousView.current = view;
  }, [usesSectionList, view]);

  if (usesSectionList) {
    if (!overview) {
      return (
        <div
          ref={ref}
          data-slot="multi-step-form-nav"
          data-variant="drill-in"
          className={cn("flex min-w-0 flex-col gap-1", hold, className)}
          {...props}
        >
          <Button
            variant="ghost"
            size="sm"
            data-slot="multi-step-form-overview-trigger"
            className="-ms-2 h-7 w-fit gap-1 px-2 text-muted-foreground"
            onClick={() => setOverview(true)}
          >
            <ChevronLeft aria-hidden />
            All steps
          </Button>
          <p
            ref={focusTargetRef as React.Ref<HTMLParagraphElement>}
            tabIndex={-1}
            data-slot="multi-step-form-heading"
            className="text-base font-medium"
          >
            {current?.label}
          </p>
          {current?.description ? (
            <p className="text-sm text-muted-foreground">
              {current.description}
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-slot="multi-step-form-nav"
        data-variant="section-list"
        className={cn("flex min-w-0 flex-col gap-2", hold, className)}
        {...props}
      >
        <ol
          ref={focusTargetRef as React.Ref<HTMLOListElement>}
          tabIndex={-1}
          aria-label={ariaLabel}
          className="flex list-none flex-col gap-1"
        >
          {steps.map((spec, index) => {
            const railStep = stepperSteps[index]!;
            const openable =
              index > sealedIndex && reachable(index) && !spec.disabled;
            return (
              <li key={spec.id} data-slot="multi-step-form-section">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!openable}
                  data-slot="multi-step-form-section-trigger"
                  data-state={railStep.state}
                  aria-current={index === currentIndex ? "step" : undefined}
                  className="h-auto min-h-12 w-full justify-start gap-3 px-3 py-2 text-start font-normal whitespace-normal"
                  onClick={() => {
                    goTo(spec.id);
                    setOverview(false);
                  }}
                >
                  <StepperNode
                    state={railStep.state}
                    index={index + 1}
                    size="sm"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {spec.label}
                    </span>
                    {spec.description ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {spec.description}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="ms-auto shrink-0 text-muted-foreground"
                  />
                </Button>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="multi-step-form-nav"
      data-variant="stepper"
      className={cn("min-w-0", hold, className)}
      {...props}
    >
      <Stepper
        aria-label={ariaLabel}
        orientation={orientation}
        steps={stepperSteps}
        navigable={navigable}
        onStepSelect={goTo}
      />
    </div>
  );
}

/** Props accepted by `MultiStepFormStep`. */
export interface MultiStepFormStepProps extends React.ComponentPropsWithRef<"div"> {
  /** Which step this body belongs to — matches an `id` in `steps`. */
  id: string;
}

/**
 * `MultiStepFormStep` — one step's body. It renders only while its step is current, so the
 * flow mounts exactly one at a time and a mount-triggered entrance replays on every move.
 * The content is entirely yours: a `Field` form, a review table, an upload surface, nothing
 * at all.
 *
 * @example
 * <MultiStepFormStep id="billing">
 *   <Field>
 *     <FieldLabel htmlFor="card">Card number</FieldLabel>
 *     <Input id="card" />
 *   </Field>
 * </MultiStepFormStep>
 */
export function MultiStepFormStep({
  id,
  className,
  ref,
  ...props
}: MultiStepFormStepProps) {
  const { current, overview, layout } =
    useMultiStepFormContext("MultiStepFormStep");
  if (overview || current?.id !== id) return null;
  return (
    <div
      ref={ref}
      data-slot="multi-step-form-step"
      data-step={id}
      className={cn(
        "motion-enter-up flex min-w-0 flex-col gap-4",
        // In a panel the body is the ONE scrolling region — `min-h-0` is what lets a flex
        // child shrink below its content instead of pushing the action row off the frame.
        layout === "panel" && "min-h-0 flex-1 overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `MultiStepFormBack` — the backward action. Disabled on the first step, while a guard is
 * running, and for good once a locking step has been passed.
 *
 * @example
 * <MultiStepFormBack />
 */
export function MultiStepFormBack({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { canGoBack, goBack, labels, isFirst, sealedIndex, currentIndex } =
    useMultiStepFormContext("MultiStepFormBack");
  const sealed = !isFirst && currentIndex - 1 <= sealedIndex;
  return (
    <Button
      variant="outline"
      data-slot="multi-step-form-back"
      data-sealed={sealed ? "" : undefined}
      disabled={!canGoBack}
      onClick={goBack}
      className={cn(className)}
      {...props}
    >
      {children ?? labels.back}
    </Button>
  );
}

/**
 * `MultiStepFormNext` — the forward action, which becomes the submit action on the last
 * step. It shows a spinner while a guard runs, and is described by the refusal whenever one
 * is showing, so the reason reads out with the control it blocks.
 *
 * @example
 * <MultiStepFormNext />
 */
export function MultiStepFormNext({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { canGoNext, goNext, labels, isLast, pending, refusal, refusalId } =
    useMultiStepFormContext("MultiStepFormNext");
  return (
    <Button
      data-slot="multi-step-form-next"
      loading={pending}
      disabled={!canGoNext}
      aria-describedby={refusal ? refusalId : undefined}
      onClick={goNext}
      className={cn(className)}
      {...props}
    >
      {children ?? (isLast ? labels.submit : labels.next)}
    </Button>
  );
}

/**
 * `MultiStepFormSkip` — offered only on an optional step. Advances without running
 * `beforeNext` and records the step as skipped rather than complete.
 *
 * @example
 * <MultiStepFormSkip />
 */
export function MultiStepFormSkip({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { current, isLast, labels, pending, skip } =
    useMultiStepFormContext("MultiStepFormSkip");
  if (!current?.optional || isLast) return null;
  return (
    <Button
      variant="ghost"
      data-slot="multi-step-form-skip"
      disabled={pending}
      onClick={skip}
      className={cn(className)}
      {...props}
    >
      {children ?? labels.skip}
    </Button>
  );
}

/**
 * `MultiStepFormExit` — a control that leaves the flow, asking first when the current step
 * holds unsaved work. Put it wherever leaving belongs: a dialog's Cancel, a page's "Back to
 * settings". With nothing dirty it simply calls `onExit`; a confirmation nobody needs is the
 * fastest way to teach people to dismiss confirmations unread.
 *
 * @example
 * <MultiStepFormExit>Cancel</MultiStepFormExit>
 */
export function MultiStepFormExit({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { requestExit, dirty } = useMultiStepFormContext("MultiStepFormExit");
  return (
    <Button
      variant="ghost"
      data-slot="multi-step-form-exit"
      data-dirty={dirty ? "" : undefined}
      onClick={requestExit}
      className={cn(className)}
      {...props}
    >
      {children ?? "Cancel"}
    </Button>
  );
}

/** Props accepted by `MultiStepFormActions`. */
export interface MultiStepFormActionsProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Keep the refusal and the action row in view at the bottom of the scroll area while a long
   * step scrolls under them. `"narrow"` does so only while the form is narrower than its `@md`
   * container rung — a phone — and leaves the row in the flow on a wide screen. The row reports
   * `data-stuck` while it is actually pinned over content.
   * @default false
   */
  sticky?: boolean | "narrow";
}

/**
 * `MultiStepFormActions` — the refusal, then the action row: back at the far start, forward
 * at the far end, with skip beside forward on an optional step. Pass children to compose the
 * row yourself; the refusal is rendered either way. `sticky` pins both to the bottom of the
 * scroll area on a long step.
 *
 * @example
 * <MultiStepFormActions />
 *
 * @example
 * // A long step on a phone: the actions stay in reach
 * <MultiStepFormActions sticky="narrow" />
 */
export function MultiStepFormActions({
  className,
  children,
  sticky = false,
  ref,
  ...props
}: MultiStepFormActionsProps) {
  const { refusal, refusalId, overview, labels, complete, layout } =
    useMultiStepFormContext("MultiStepFormActions");
  const hold = layout === "panel" ? "shrink-0" : undefined;
  // DS-23: `data-stuck` — the row is pinned over content: it is `position: sticky` right now
  // (`"narrow"` is not on a wide form), it sits on its scroll area's bottom edge, and there is
  // still content below to scroll to. Resting at the end of the step, it is not stuck. The scroll
  // area is the nearest scrolling ancestor (a dialog body, a panel), else the page.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const setMergedRef = React.useMemo(() => mergeRefs(setNode, ref), [ref]);
  const [stuck, setStuck] = React.useState(false);
  React.useEffect(() => {
    if (!sticky || !node) return;
    let root: HTMLElement | null = node.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) {
      root = root.parentElement;
    }
    const scroller: HTMLElement = root ?? document.documentElement;
    const target: HTMLElement | Window = root ?? window;
    const update = () => {
      if (getComputedStyle(node).position !== "sticky") {
        setStuck(false);
        return;
      }
      const edge = root
        ? root.getBoundingClientRect().top +
          root.clientTop +
          root.clientHeight -
          parseFloat(getComputedStyle(root).paddingBottom)
        : window.innerHeight;
      const remaining =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      setStuck(
        node.getBoundingClientRect().bottom >= edge - 1 && remaining > 1,
      );
    };
    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      setStuck(false);
    };
  }, [sticky, node]);
  const stickyClasses =
    sticky === true
      ? "sticky bottom-0 z-10 bg-background pb-[calc(var(--spacing)*3+env(safe-area-inset-bottom))]"
      : sticky === "narrow"
        ? "@max-md/multi-step-form:sticky @max-md/multi-step-form:bottom-0 @max-md/multi-step-form:z-10 @max-md/multi-step-form:bg-background @max-md/multi-step-form:pb-[calc(var(--spacing)*3+env(safe-area-inset-bottom))]"
        : undefined;
  if (overview) {
    // The section list IS the screen for a record being edited, so it carries the one action
    // that belongs to the whole record rather than to any step in it.
    return (
      <div
        ref={ref}
        data-slot="multi-step-form-actions"
        data-variant="overview"
        className={cn("flex min-w-0 justify-end", hold, className)}
        {...props}
      >
        <Button data-slot="multi-step-form-finish" onClick={complete}>
          {labels.finish}
        </Button>
      </div>
    );
  }
  return (
    <div
      ref={setMergedRef}
      data-slot="multi-step-form-actions"
      data-sticky={sticky === false ? undefined : String(sticky)}
      data-stuck={sticky && stuck ? "" : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-3",
        hold,
        stickyClasses,
        className,
      )}
      {...props}
    >
      {refusal?.tone === "error" ? (
        // `live` makes this destructive `Alert` `role="alert"`, which is assertive — correct here
        // and only here (A11Y-3): the message appeared after mount because the user asked to move
        // and a check said no. Without `live` an Alert is a polite `status`.
        <Alert
          id={refusalId}
          variant="destructive"
          live
          data-slot="multi-step-form-refusal"
          data-tone="error"
        >
          <CircleAlert aria-hidden />
          {refusal.title ? (
            <>
              <AlertTitle>{refusal.title}</AlertTitle>
              <AlertDescription>{refusal.reason}</AlertDescription>
            </>
          ) : (
            <AlertTitle>{refusal.reason}</AlertTitle>
          )}
        </Alert>
      ) : null}
      {refusal?.tone === "soft" ? (
        <p
          id={refusalId}
          role="status"
          aria-live="polite"
          data-slot="multi-step-form-refusal"
          data-tone="soft"
          className="flex items-start gap-2 text-sm text-warning-text"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{refusal.reason}</span>
        </p>
      ) : null}
      <div
        data-slot="multi-step-form-action-row"
        className="flex min-w-0 items-center justify-between gap-2 border-t border-border pt-4"
      >
        {children ?? (
          <>
            <MultiStepFormBack />
            <div className="flex items-center gap-2">
              <MultiStepFormSkip />
              <MultiStepFormNext />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
