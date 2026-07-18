// @vegastack field-inline@0.1.0 sha256-qkpnP5ftU3Kbh5EhBx7d1f2ZrIbjrOqiBPD1/hNNqGE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Input } from "@/components/ui/input";

export interface FieldInlineProps {
  /** The current value, shown as text in display mode and seeded into the input on edit. */
  value: string;
  /**
   * Called with the new (trimmed) value when the user commits via <kbd>Enter</kbd>
   * or blur. Fired only when the value actually changed; the component is
   * presentational, so the app owns persistence (sync or async).
   */
  onCommit: (value: string) => void;
  /**
   * Placeholder shown in the input, and — when `value` is empty — as muted text
   * in display mode. Used as the input's accessible name only as a fallback when
   * neither `label` nor `aria-label`/`aria-labelledby` is supplied.
   */
  placeholder?: string;
  /**
   * Accessible name for the edit-mode `<input>` (its `aria-label`). Prefer a
   * clear semantic name (e.g. `"Task title"`) so screen-reader users hear what
   * they're editing even when no `placeholder` is set. Resolution order for the
   * input's accessible name: `aria-labelledby` → `aria-label` → `label` →
   * `placeholder` → a generic fallback. The edit-mode textbox is therefore never
   * unnamed.
   */
  label?: string;
  /** Optional `aria-label` passed straight to the edit-mode input (wins over `label`). */
  "aria-label"?: string;
  /** Optional `aria-labelledby` passed straight to the edit-mode input (wins over `aria-label`). */
  "aria-labelledby"?: string;
  /**
   * Strip the input's border, background, and padding in edit mode for a
   * seamless inline-text feel (e.g. editing a title in place).
   * @default false
   */
  borderless?: boolean;
  /**
   * Blocks entering edit mode — clicking or pressing <kbd>Enter</kbd>/<kbd>Space</kbd> on the
   * display value no longer starts an edit, and the display root is dimmed and dropped from the
   * tab order (`aria-disabled` + `tabIndex={-1}`, since it's a `role="button"` span rather than a
   * native control). If the field is mid-edit when `disabled` turns on, the edit is cancelled
   * (reverted, `onCommit` is not called) the same way <kbd>Escape</kbd> does.
   * @default false
   */
  disabled?: boolean;
  /**
   * Renders the value as plain, non-interactive text — no `role="button"`, no hover affordance, no
   * click/keyboard handler, and edit mode can never be entered. Unlike `disabled`, the text is not
   * dimmed (it reads as normal content, just not editable here). If the field is mid-edit when
   * `readOnly` turns on, the edit is cancelled the same way `disabled` does.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Validation error message. When set: the edit-mode {@link Input} receives `aria-invalid` (which
   * drives its built-in destructive-border styling) plus `aria-describedby` pointing at the error
   * text, and the error text itself renders below the control — same treatment as `field.tsx`'s
   * `FieldError` (`role="alert"`, `text-sm text-destructive-text`). Shown in both display and edit
   * mode whenever it's set.
   */
  error?: string;
  /** Extra classes merged onto the outer wrapper. */
  className?: string;
  /**
   * Ref forwarded to the component's root host element — the display `<span>` when idle, the edit
   * `<input>` while editing (the root swaps with mode).
   */
  ref?: React.Ref<HTMLElement>;
}

/**
 * `FieldInline` — click-to-edit text. Displays a `value` as plain text with a
 * hover affordance; clicking (or <kbd>Enter</kbd>/<kbd>Space</kbd> when focused)
 * swaps it for a focused {@link Input}. <kbd>Enter</kbd> or blur commits via
 * `onCommit` (only when changed); <kbd>Escape</kbd> cancels and restores the
 * original value.
 *
 * Purely presentational — `onCommit` is a callback and the app persists the
 * result. Token-only styling; the display affordance is `hover:bg-muted`.
 *
 * The edit-mode `<input>` always carries an accessible name: pass `label` (or
 * `aria-label`/`aria-labelledby`) for a clear semantic name, otherwise it falls
 * back to `placeholder`, then to a generic default — it is never unnamed.
 *
 * `disabled` blocks entering edit mode and dims the display value; `readOnly` renders the value as
 * plain non-interactive text with no edit affordance at all (not dimmed). `error` marks the
 * edit-mode input invalid and renders an associated error message below the control — see each
 * prop's doc for the exact behavior.
 *
 * @example
 * // Inline-edit a task title
 * <FieldInline
 *   value={task.title}
 *   label="Task title"
 *   onCommit={(title) => updateTask({ title })}
 * />
 *
 * @example
 * // Borderless, with a placeholder for the empty state
 * <FieldInline
 *   value={name}
 *   onCommit={setName}
 *   label="Name"
 *   placeholder="Add a name…"
 *   borderless
 * />
 */
export function FieldInline({
  value,
  onCommit,
  placeholder,
  label,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  borderless = false,
  disabled = false,
  readOnly = false,
  error,
  className,
  ref,
}: FieldInlineProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Edit mode: feed both the internal inputRef (focus management) and the consumer ref.
  const setInputRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );
  // Guard against a double-commit: Enter sets isEditing=false → the input
  // unmounts → the browser fires blur → commit would run a second time.
  const committedRef = React.useRef(false);
  // Associates the edit-mode input with the error text below it (see `error` prop doc).
  const errorId = React.useId();

  // Keep the draft in sync when the parent updates `value` from outside an edit.
  React.useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  const startEdit = React.useCallback(() => {
    // `disabled`/`readOnly` block entering edit mode entirely.
    if (disabled || readOnly) return;
    committedRef.current = false;
    setDraft(value);
    setIsEditing(true);
  }, [value, disabled, readOnly]);

  const commit = React.useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const next = draft.trim();
    setIsEditing(false);
    if (next !== value) onCommit(next);
    else setDraft(value);
  }, [draft, value, onCommit]);

  const cancel = React.useCallback(() => {
    committedRef.current = true;
    setDraft(value);
    setIsEditing(false);
  }, [value]);

  // If `disabled`/`readOnly` turn on mid-edit, cancel the in-flight edit the same way Escape does
  // (revert the draft, skip `onCommit`) rather than leaving an now-uneditable field stuck open.
  React.useEffect(() => {
    if ((disabled || readOnly) && isEditing) cancel();
  }, [disabled, readOnly, isEditing, cancel]);

  // Focus + select the whole value when entering edit mode.
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const hasDisplayValue = value.length > 0;
  const displayFallback = placeholder ?? "Edit value";
  const displayAriaLabel =
    ariaLabelledBy != null
      ? undefined
      : (ariaLabel ?? label ?? (hasDisplayValue ? undefined : displayFallback));
  // `readOnly` drops button semantics entirely (plain text, no edit affordance at all).
  // `disabled` keeps the button role/handlers (so it stays discoverable + defended-in-depth by
  // `startEdit`'s own guard) but is dimmed, `aria-disabled`, and out of the tab order.
  const isButton = !readOnly;

  // Same treatment as `field.tsx`'s `FieldError`: an alert role so it's announced, tinted
  // destructive text. Rendered in both display and edit mode whenever `error` is set.
  const errorText = error ? (
    <span id={errorId} role="alert" data-slot="field-inline-error" className="mt-1 block text-sm leading-normal text-destructive-text">
      {error}
    </span>
  ) : null;

  if (isEditing) {
    // The edit-mode textbox must never be unnamed. Prefer an explicit
    // `aria-labelledby`, then `aria-label`/`label`, then `placeholder`, and
    // finally a generic fallback — so every valid render has a non-empty
    // accessible name. When `aria-labelledby` is set we omit `aria-label`
    // (the referenced element supplies the name).
    const resolvedAriaLabel = ariaLabel ?? label ?? placeholder ?? "Edit value";
    return (
      <>
        <Input
          ref={setInputRef}
          data-slot="field-inline"
          aria-label={ariaLabelledBy ? undefined : resolvedAriaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className={cn(
            borderless &&
              "h-auto rounded-none border-none bg-transparent px-0 py-0 dark:bg-transparent",
            className,
          )}
        />
        {errorText}
      </>
    );
  }

  return (
    <>
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        data-slot="field-inline"
        role={isButton ? "button" : undefined}
        tabIndex={readOnly ? undefined : disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        aria-label={displayAriaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={isButton ? startEdit : undefined}
        onKeyDown={
          isButton
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  startEdit();
                }
              }
            : undefined
        }
        className={cn(
          "inline-flex min-w-0 items-center rounded-md px-2 py-1 text-base transition-colors duration-fast ease-standard",
          !disabled && !readOnly && "cursor-text hover:bg-muted",
          "aria-disabled:pointer-events-none aria-disabled:opacity-(--opacity-dim)",
          className,
        )}
      >
        {hasDisplayValue ? (
          value
        ) : (
          <span className="text-muted-foreground">{displayFallback}</span>
        )}
      </span>
      {errorText}
    </>
  );
}
