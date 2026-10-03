// @vegastack auto-save-input@0.23.120 sha256-NSprrWRQh2xBVY5Tb+ohxvskRGZ0IqLQT1f6JuV+nk4=

"use client";

import * as React from "react";
import { Check, TriangleAlert, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Spinner } from "@/components/ui/spinner";
import { TIMINGS } from "@vegastack/design";
// `InputGroup` is owned by the sibling Input Group component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

/**
 * Lifecycle of an auto-save: `idle` (no pending change), `saving` (debounce
 * elapsed, `onSave` in flight), `saved` (last save resolved), `error` (last save
 * rejected or failed validation). Drives the trailing status indicator.
 */
export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/** Props accepted by `AutoSaveInput`. */
export interface AutoSaveInputProps extends Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue" | "onChange"
> {
  /**
   * Controlled value of the field. Pair with `onValueChange` so user edits are
   * mirrored by the parent. External `value` changes are treated as a new saved
   * baseline, so switching records never auto-saves stale data.

   * @default undefined
   */
  value?: string;
  /**
   * Initial value for uncontrolled use. The component owns the draft from here
   * on and compares typed input against the last saved value to decide whether a
   * save is needed.
   * @default ''
   */
  defaultValue?: string;
  /**
   * Fired whenever the draft value changes. Required for controlled `value`
   * usage; optional for uncontrolled `defaultValue` usage.

   * @default undefined
   */
  onValueChange?: (value: string) => void;
  /**
   * Async persistence callback invoked after the debounce window when the value
   * changed. Resolve to flag `saved`; reject (or throw) to flag `error`. The
   * status indicator reflects the outcome inline — the app may also react here
   * (e.g. fire a toast), but the component never couples to one.
   */
  onSave: (value: string) => Promise<void>;
  /**
   * Debounce delay in milliseconds between the last keystroke and the `onSave`
   * call. Keystrokes within the window reset the timer.
   * @default 800
   */
  debounceMs?: number;
  /**
   * Optional synchronous guard run before saving — return `false` to skip the
   * save and surface the `error` status (e.g. empty or malformed input).

   * @default undefined
   */
  validate?: (value: string) => boolean;
  /**
   * Fired whenever the save status changes. Use it to drive surrounding UI
   * (disable a submit button, etc.) without re-deriving the state yourself.

   * @default undefined
   */
  onStatusChange?: (status: AutoSaveStatus) => void;
}

/** Trailing status-slot classes — fixed-width so the field doesn't shift as the icon swaps. */
const statusSlotClasses = "flex size-4 shrink-0 items-center justify-center";

/**
 * `AutoSaveInput` — an {@link Input} that debounces edits and persists them via
 * an async `onSave(value)`, surfacing the result through a trailing status
 * indicator: a spinning `Loader` while saving, a muted `Check` once
 * saved, and a `text-warning-text` `X` on error. Color is paired with a distinct
 * icon and a polite live status so status never relies on color alone.
 *
 * **Presentational only.** The component owns the debounce timer and the
 * idle/saving/saved/error status UI; persistence, success/error toasts, and any
 * cross-field side effects live in the app via `onSave` / `onStatusChange`. There
 * is no toast coupling — the status is inline.
 *
 * Client-only (`useState` + `useEffect` debounce). Use `defaultValue` for local
 * uncontrolled drafts, or `value` + `onValueChange` for controlled drafts; the
 * ref forwards to the underlying `<input>`.
 *
 * @example
 * <AutoSaveInput
 *   aria-label="Workspace name"
 *   defaultValue={workspace.name}
 *   onSave={async (name) => { await updateWorkspace({ name }); }}
 *   validate={(v) => v.trim().length > 0}
 * />
 */
export function AutoSaveInput({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  onSave,
  debounceMs = TIMINGS.autoSaveDebounceMs,
  validate,
  onStatusChange,
  className,
  disabled,
  ref,
  ...props
}: AutoSaveInputProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const value = isControlled ? (controlledValue ?? "") : uncontrolledValue;
  const [status, setStatus] = React.useState<AutoSaveStatus>("idle");

  // The last value successfully persisted — typing back to it cancels the save.
  const savedValue = React.useRef(value);
  const previousControlledValue = React.useRef(controlledValue);
  const pendingControlledEdit = React.useRef<string | null>(null);
  // Mirror of `status` so the debounce effect can read the live status without
  // taking it as a dependency (which would restart the timer on every status change).
  const statusRef = React.useRef<AutoSaveStatus>("idle");
  // Latest props captured in refs so the debounce effect doesn't re-fire on
  // every render (only the value/delay should restart the timer).
  const onSaveRef = React.useRef(onSave);
  const validateRef = React.useRef(validate);
  const onStatusChangeRef = React.useRef(onStatusChange);
  React.useEffect(() => {
    onSaveRef.current = onSave;
    validateRef.current = validate;
    onStatusChangeRef.current = onStatusChange;
  });

  const updateStatus = React.useCallback((next: AutoSaveStatus) => {
    statusRef.current = next;
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);

  React.useEffect(() => {
    if (!isControlled || controlledValue === previousControlledValue.current)
      return;
    const nextControlledValue = controlledValue ?? "";

    // A controlled value that matches the last `onValueChange` came from this
    // input and should still be saved after the debounce. Any other controlled
    // value change is an external record/baseline update and should not be
    // auto-saved back over itself.
    if (pendingControlledEdit.current === nextControlledValue) {
      pendingControlledEdit.current = null;
    } else {
      savedValue.current = nextControlledValue;
      if (statusRef.current !== "idle") updateStatus("idle");
    }

    previousControlledValue.current = controlledValue;
  }, [controlledValue, isControlled, updateStatus]);

  React.useEffect(() => {
    // Nothing to save while the field matches the last persisted value. If a prior
    // invalid/in-flight edit was reverted back to the saved value, clear the stale
    // `error`/`saving` status (and `aria-invalid`) so a valid value never stays flagged.
    if (value === savedValue.current) {
      if (statusRef.current === "error" || statusRef.current === "saving")
        updateStatus("idle");
      return;
    }

    if (validateRef.current && !validateRef.current(value)) {
      updateStatus("error");
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      updateStatus("saving");
      const pending = value;
      Promise.resolve()
        .then(() => onSaveRef.current(pending))
        .then(() => {
          if (!active) return;
          savedValue.current = pending;
          updateStatus("saved");
        })
        .catch(() => {
          if (!active) return;
          updateStatus("error");
        });
    }, debounceMs);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, debounceMs, updateStatus]);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        ref={ref}
        data-slot="auto-save-input"
        data-state={status}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          pendingControlledEdit.current = next;
          if (!isControlled) setUncontrolledValue(next);
          onValueChange?.(next);
        }}
        disabled={disabled}
        aria-invalid={status === "error" || undefined}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <span
          data-slot="auto-save-input-status"
          className={statusSlotClasses}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {/*
           * Keyed presence (CX-13): each icon is keyed to its status so it
           * remounts and replays its mount animation on every lifecycle swap.
           * The saved Check uses the pop-in utility, not a stroke-draw-in — see
           * copy-button.tsx for why the draw-in isn't reachable through
           * lucide-react's public Check component (props land on the root svg
           * element, never the generated path), and the same choice is made
           * here for visual consistency between the two saved checks.
           */}
          {status === "saving" ? (
            <Spinner
              key="saving"
              className="text-muted-foreground"
              aria-hidden
              role={undefined}
              aria-label={undefined}
            />
          ) : status === "saved" ? (
            <Check
              key="saved"
              className="size-4 text-muted-foreground motion-pop-in"
              aria-hidden
            />
          ) : status === "error" ? (
            <X
              key="error"
              className="size-4 text-warning-text motion-pop-in"
              aria-hidden
            />
          ) : null}
          {/*
           * This status text is visually hidden (sr-only) — a motion class here
           * would animate a node no sighted user ever sees, so it's left plain.
           * The screen-reader announcement is carried by aria-live="polite" on
           * the parent, not by an entrance animation.
           */}
          {status === "idle" ? null : (
            <span className="sr-only">
              {status === "saving"
                ? "Saving"
                : status === "saved"
                  ? "Saved"
                  : "Save failed"}
            </span>
          )}
        </span>
      </InputGroupAddon>
    </InputGroup>
  );
}

/* -------------------------------------------------------------- useAutoSave */

/**
 * `useAutoSave`'s status: `AutoSaveStatus` plus `conflict` — someone else saved the record
 * first (the host's `isConflict` recognised the error). Auto-saving stops until `reset`.
 */
export type AutoSaveFormStatus = AutoSaveStatus | "conflict";

/** Options accepted by `useAutoSave`. */
export interface UseAutoSaveOptions<T extends Record<string, unknown>> {
  /** The current values. Every change starts (or restarts) the debounce. */
  value: T;
  /**
   * Persists the CHANGED fields only — the keys whose value differs from what was last
   * saved. Receives the version the host last reported (or the previous save returned) for
   * optimistic concurrency; resolve with `{ version }` to advance it, reject to flag an error.
   */
  onSave: (
    changes: Partial<T>,
    context: { version: number | undefined },
  ) => Promise<{ version?: number } | void>;
  /**
   * The record's version as the host knows it. A higher value (another write moved the
   * record on) is adopted before the next save; a lower one is ignored.
   * @default undefined
   */
  version?: number;
  /**
   * Whether saving is on. Turning it on takes the current `value` as the saved baseline, so
   * a record that has just been created is not saved a second time.
   * @default true
   */
  enabled?: boolean;
  /**
   * Quiet time after the last change before saving, in milliseconds.
   * @default 600
   */
  delay?: number;
  /**
   * Recognises a stale-version error, which becomes the `conflict` status.
   * @default undefined
   */
  isConflict?: (error: unknown) => boolean;
}

/** What `useAutoSave` returns. */
export interface UseAutoSaveResult<T extends Record<string, unknown>> {
  /** `idle` → `saving` → `saved`, or `error` / `conflict`. */
  status: AutoSaveFormStatus;
  /** The last save's error, or `null`. */
  error: unknown;
  /** Changes not saved yet (waiting for the debounce or in flight). */
  dirty: boolean;
  /**
   * Save now, skipping the debounce, and wait for every save queued before it. Resolves
   * `true` when everything is saved. Call it before a step change or a navigation.
   */
  flush: () => Promise<boolean>;
  /**
   * Take `baseline` (default: the current value) as saved and `version` as current — after
   * reloading the record following a conflict. Clears the status and resumes saving.
   */
  reset: (baseline?: T, version?: number) => void;
}

function sameValue(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function changesOf<T extends Record<string, unknown>>(
  value: T,
  baseline: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(value) as (keyof T)[]) {
    if (!sameValue(value[key], baseline[key])) out[key] = value[key];
  }
  return out;
}

/**
 * `useAutoSave` — save a form as the user types: debounced (600ms), changed fields only,
 * one save in flight at a time (a change made during a save is sent right after it, with the
 * latest values — never an older snapshot), a version carried for optimistic concurrency,
 * and a status for `AutoSaveIndicator`. Pending changes are saved on `flush()`, on unmount,
 * and when the tab is closed (which also warns while anything is unsaved).
 *
 * @example
 * const autosave = useAutoSave({
 *   value: entries,
 *   version: product.version,
 *   enabled: product !== null,
 *   onSave: async (changes, { version }) => {
 *     const saved = await saveProduct({ changes, expectedVersion: version });
 *     return { version: saved.version };
 *   },
 *   isConflict: (e) => e instanceof StaleError,
 * });
 * <AutoSaveIndicator status={autosave.status} />
 */
export function useAutoSave<T extends Record<string, unknown>>({
  value,
  onSave,
  version,
  enabled = true,
  delay = 600,
  isConflict,
}: UseAutoSaveOptions<T>): UseAutoSaveResult<T> {
  const [status, setStatus] = React.useState<AutoSaveFormStatus>("idle");
  const [error, setError] = React.useState<unknown>(null);
  const [dirty, setDirty] = React.useState(false);
  const [resets, setResets] = React.useState(0);

  const baseline = React.useRef<T>(value);
  const versionRef = React.useRef<number | undefined>(version);
  const statusRef = React.useRef<AutoSaveFormStatus>("idle");
  const latest = React.useRef({ value, onSave, isConflict, enabled });
  React.useEffect(() => {
    latest.current = { value, onSave, isConflict, enabled };
  });

  const updateStatus = React.useCallback((next: AutoSaveFormStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  // A host-reported version only ever moves the record forward.
  React.useEffect(() => {
    if (
      version !== undefined &&
      (versionRef.current === undefined || version > versionRef.current)
    ) {
      versionRef.current = version;
    }
  }, [version]);

  // Turning saving on adopts the current values as saved: they were just created or loaded.
  const wasEnabled = React.useRef(enabled);
  React.useEffect(() => {
    if (enabled && !wasEnabled.current) baseline.current = latest.current.value;
    wasEnabled.current = enabled;
  }, [enabled]);

  // One attempt reads the LATEST values when it runs, so queued attempts collapse: the first
  // sends everything changed, the rest find nothing left to send.
  const attempt = React.useCallback(async (): Promise<boolean> => {
    const current = latest.current;
    if (!current.enabled || statusRef.current === "conflict") return false;
    const changes = changesOf(current.value, baseline.current);
    if (Object.keys(changes).length === 0) return true;
    updateStatus("saving");
    try {
      const result = await current.onSave(changes, {
        version: versionRef.current,
      });
      baseline.current = { ...baseline.current, ...changes };
      if (result && typeof result.version === "number") {
        versionRef.current = result.version;
      }
      setError(null);
      const left = changesOf(latest.current.value, baseline.current);
      setDirty(Object.keys(left).length > 0);
      updateStatus("saved");
      return true;
    } catch (caught) {
      setError(caught);
      updateStatus(current.isConflict?.(caught) ? "conflict" : "error");
      return false;
    }
  }, [updateStatus]);

  const queue = React.useRef<Promise<boolean>>(Promise.resolve(true));
  const flush = React.useCallback(() => {
    const next = queue.current.then(attempt, attempt);
    queue.current = next;
    return next;
  }, [attempt]);

  const valueKey = JSON.stringify(value);
  React.useEffect(() => {
    if (!enabled) return;
    const pending =
      Object.keys(changesOf(latest.current.value, baseline.current)).length > 0;
    setDirty(pending);
    if (!pending) return;
    const timer = setTimeout(() => void flush(), delay);
    return () => clearTimeout(timer);
  }, [valueKey, enabled, delay, flush, resets]);

  // Leaving the form saves what is left; closing the tab also asks the browser to warn.
  React.useEffect(() => () => void flush(), [flush]);
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      void flush();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, flush]);

  const reset = React.useCallback(
    (nextBaseline?: T, nextVersion?: number) => {
      baseline.current = nextBaseline ?? latest.current.value;
      if (nextVersion !== undefined) versionRef.current = nextVersion;
      setError(null);
      updateStatus("idle");
      setResets((n) => n + 1);
    },
    [updateStatus],
  );

  return { status, error, dirty, flush, reset };
}

/* ---------------------------------------------------------- AutoSaveIndicator */

const INDICATOR_TEXT: Record<Exclude<AutoSaveFormStatus, "idle">, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
  conflict: "Not saved",
};

/** What the icon variant says to a screen reader, per status. */
const INDICATOR_ICON_LABEL: Record<
  Exclude<AutoSaveFormStatus, "idle">,
  string
> = {
  saving: "Saving",
  saved: "Saved",
  error: "Couldn't save",
  conflict: "Not saved",
};

/** Props accepted by `AutoSaveIndicator`. */
export interface AutoSaveIndicatorProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The status to show — `useAutoSave().status`. `idle` shows nothing. */
  status: AutoSaveFormStatus;
  /**
   * Replaces the default wording per status — the visible line for `text`, the screen-reader
   * label for `icon`.
   * @default { saving: 'Saving…', saved: 'Saved', error: "Couldn't save", conflict: 'Not saved' } (icon: 'Saving', 'Saved', "Couldn't save", 'Not saved')
   */
  labels?: Partial<Record<Exclude<AutoSaveFormStatus, "idle">, string>>;
  /**
   * `text` — icon and wording, for an action row. `icon` — the icon alone in a fixed 16px box,
   * for a field's trailing slot (`InputGroupAddon align="inline-end"`, or beside a select): a
   * muted spinner while saving, a muted check once saved (it fades out when the status
   * returns to `idle`), and a warning-ink triangle on error or conflict.
   * The wording stays as screen-reader text in the live region.
   * @default 'text'
   */
  variant?: "text" | "icon";
}

/**
 * `AutoSaveIndicator` — a quiet "Saving…" / "Saved" line for a form that saves as you go,
 * sized to sit in an action row (`MultiStepFormActions`' `status`). A spinner while saving, a
 * check once saved, and the `-text` ink with its own icon for an error or a conflict, so
 * colour is never the only cue. It is a polite live region, mounted empty while idle.
 *
 * `variant="icon"` is the same status as a single icon inside a field: each state pops in
 * (fade plus a 0.9 → 1 scale, `motion-pop-in`), a saved check fades out over `duration-slow`
 * when the host clears it, and the 16px box is always reserved so nothing shifts. Reduced
 * motion collapses every transition (MOT-5).
 *
 * @example
 * <AutoSaveIndicator status={autosave.status} />
 * <InputGroupAddon align="inline-end">
 *   <AutoSaveIndicator variant="icon" status={autosave.status} />
 * </InputGroupAddon>
 */
export function AutoSaveIndicator({
  status,
  labels,
  variant = "text",
  className,
  ref,
  ...props
}: AutoSaveIndicatorProps) {
  // The icon variant keeps the last shown state so it can fade out on `idle`.
  const [last, setLast] = React.useState<Exclude<
    AutoSaveFormStatus,
    "idle"
  > | null>(status === "idle" ? null : status);
  if (status !== "idle" && status !== last) setLast(status);

  if (variant === "icon") {
    const shown = status === "idle" ? last : status;
    const label =
      status === "idle"
        ? null
        : (labels?.[status] ?? INDICATOR_ICON_LABEL[status]);
    return (
      <span
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-slot="auto-save-indicator"
        data-variant="icon"
        data-state={status}
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-4 items-center justify-center transition-opacity duration-slow ease-(--motion-ease-exit)",
            status === "idle" && "opacity-0",
          )}
        >
          {shown === "saving" ? (
            <Spinner
              key="saving"
              className="size-4 text-muted-foreground motion-pop-in"
              aria-hidden
              role={undefined}
              aria-label={undefined}
            />
          ) : shown === "saved" ? (
            <Check
              key="saved"
              className="size-4 text-muted-foreground motion-pop-in"
            />
          ) : shown === "error" ? (
            <TriangleAlert
              key="error"
              className="size-4 text-warning-text motion-pop-in"
            />
          ) : shown === "conflict" ? (
            <TriangleAlert
              key="conflict"
              className="size-4 text-warning-text motion-pop-in"
            />
          ) : null}
        </span>
        {label ? <span className="sr-only">{label}</span> : null}
      </span>
    );
  }

  const text =
    status === "idle" ? null : (labels?.[status] ?? INDICATOR_TEXT[status]);
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot="auto-save-indicator"
      data-state={status}
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground",
        status === "error" && "text-warning-text",
        status === "conflict" && "text-warning-text",
        className,
      )}
      {...props}
    >
      {status === "saving" ? (
        <Spinner aria-hidden role={undefined} aria-label={undefined} />
      ) : status === "saved" ? (
        <Check aria-hidden className="size-4 shrink-0" />
      ) : status === "error" ? (
        <X aria-hidden className="size-4 shrink-0" />
      ) : status === "conflict" ? (
        <TriangleAlert aria-hidden className="size-4 shrink-0" />
      ) : null}
      {text ? <span className="truncate">{text}</span> : null}
    </span>
  );
}
