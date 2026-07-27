// @vegastack auto-save-input@0.4.0 sha256-//bBUg2luhAkHOHlpnHcAlbM7CNpAyQ2XQAQSs4HKpo=

"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn, TIMINGS } from "@vegastack/design";
// `Input` is owned by the sibling Input component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { Input } from "@/components/ui/input";

/**
 * Lifecycle of an auto-save: `idle` (no pending change), `saving` (debounce
 * elapsed, `onSave` in flight), `saved` (last save resolved), `error` (last save
 * rejected or failed validation). Drives the trailing status indicator.
 */
export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/** Props accepted by `AutoSaveInput`. */
export interface AutoSaveInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "suffix"
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
 * indicator: a spinning `Loader` while saving, a `text-success-text` `Check` once
 * saved, and a `text-destructive-text` `X` on error. Color is paired with a distinct
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
    <Input
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
      suffix={
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
           * here for visual consistency between the two success checks.
           */}
          {status === "saving" ? (
            <Spinner key="saving" label="" className="text-muted-foreground" />
          ) : status === "saved" ? (
            <Check
              key="saved"
              className="size-(--icon-default) text-success-text motion-pop-in"
              aria-hidden
            />
          ) : status === "error" ? (
            <X
              key="error"
              className="size-(--icon-default) text-destructive-text motion-pop-in"
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
      }
      className={cn(className)}
      {...props}
    />
  );
}
