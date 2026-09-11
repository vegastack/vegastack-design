// @vegastack use-inline-edit@0.7.0 sha256-LDa3IaTjMVWaPZwq5Re2X9CKG9qsrxLv8qfueoQtptI=

"use client";

import * as React from "react";

/* ---
`useInlineEdit` exists because the click-to-edit state machine was written twice, in
`field-inline.tsx` and `editable-cell.tsx`, and the two copies had already drifted: only one
of them re-armed its double-commit guard when a controlled host flipped `editing` on, and
only one returned focus to the display element after a KEYBOARD commit. Both bugs are the
kind that never surface in a demo and always surface in a grid.

What it owns, and why each piece is not optional:
- the controlled/uncontrolled `editing` pair, so a grid host can drive edit mode with
  Enter/F2 while a standalone field drives itself;
- the draft, seeded from `value` on every open so a cancelled edit cannot leak forward;
- the double-commit guard. Enter sets editing=false, which unmounts the input, which makes
  the browser fire `blur`, which would commit a second time. One boolean ref, checked and
  set before any callback runs;
- focus restoration, but ONLY when the keyboard closed the edit. A commit that came from a
  blur means the user has already clicked somewhere else; stealing focus back is a trap.

Deliberately NOT done here:
- No persistence, no async, no status. `onCommit` is a plain callback; the optimistic
  `idle → saving → saved | error` layer belongs to `EditableCell`, which composes this hook.
- No DOM. The hook hands back two refs and a key handler; the caller owns the elements,
  their roles and their chrome. That is what lets one machine serve a bare inline field, a
  grid cell, and a Select-based cell editor that has no text input at all.
- No trimming policy of its own beyond `trim` — normalisation past whitespace is the app's.
--- */

/** Options for {@link useInlineEdit}. */
export interface UseInlineEditOptions {
  /** The committed value. Seeds the draft every time an edit opens. */
  value: string;
  /**
   * Called with the new value when the user commits (<kbd>Enter</kbd> or blur), and only when
   * it actually changed. The host owns persistence.
   *
   * Optional, because some editors are a MODE and not a text box: a cell whose editor is a
   * `Select` popup commits from the selection handler, and wants this hook only for the
   * controlled/uncontrolled `editing` pair and the guard around it. Omit it there rather than
   * passing a callback that can never fire.

   * @default undefined
   */
  onCommit?: (value: string) => void;
  /**
   * Controlled edit mode. Pair with `onEditingChange` to let a host (a grid's keyboard model)
   * decide when the field edits. Omit for the built-in uncontrolled behaviour.

   * @default undefined
   */
  editing?: boolean;
  /**
   * Called when the field wants to enter (`true`) or leave (`false`) edit mode. With `editing`
   * controlled, the host decides whether the mode actually changes.

   * @default undefined
   */
  onEditingChange?: (editing: boolean) => void;
  /**
   * Blocks entering edit mode, and cancels an edit already in flight — the same revert
   * <kbd>Escape</kbd> performs, never a silent commit.
   * @default false
   */
  disabled?: boolean;
  /**
   * Trim surrounding whitespace before comparing and committing.
   * @default true
   */
  trim?: boolean;
}

/** What {@link useInlineEdit} returns. */
export interface UseInlineEditResult {
  /** Whether the field is currently editing (resolved across controlled/uncontrolled). */
  isEditing: boolean;
  /** The in-flight draft value. Bind it to the editor's `value`. */
  draft: string;
  /** Update the draft from the editor's change handler. */
  setDraft: (value: string) => void;
  /** Enter edit mode. No-ops while `disabled`. */
  start: () => void;
  /** Commit the draft and leave edit mode. Safe to call twice — the second call no-ops. */
  commit: () => void;
  /** Leave edit mode, reverting the draft. */
  cancel: () => void;
  /** Set edit mode directly — for an editor whose own open state IS the edit (a Select popup). */
  setEditing: (editing: boolean) => void;
  /**
   * Attach to the edit-mode input. Focuses and selects the whole value when the edit opens, so
   * typing replaces rather than appends.
   */
  editRef: React.RefCallback<HTMLInputElement>;
  /**
   * Attach to the display element. Focus returns here when a KEYBOARD commit or cancel closed
   * the edit — never when a blur committed it, where the user has already moved on.
   */
  displayRef: React.RefCallback<HTMLElement>;
  /** <kbd>Enter</kbd> commits, <kbd>Escape</kbd> cancels; both restore focus to the display. */
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * `useInlineEdit` — the click-to-edit machine shared by `FieldInline` and `EditableCell`:
 * draft, commit, cancel, focus restoration and the double-commit guard, with no opinion about
 * what the editor or the display look like.
 *
 * 'use client' — state, refs and focus management. A consumer that wires this in becomes a
 * client component, which every inline editor already is.
 *
 * @example
 * const edit = useInlineEdit({ value: task.title, onCommit: (title) => save({ title }) });
 * return edit.isEditing ? (
 *   <Input
 *     ref={edit.editRef}
 *     value={edit.draft}
 *     onChange={(e) => edit.setDraft(e.target.value)}
 *     onBlur={edit.commit}
 *     onKeyDown={edit.onKeyDown}
 *   />
 * ) : (
 *   <span ref={edit.displayRef} role="button" tabIndex={0} onClick={edit.start}>
 *     {task.title}
 *   </span>
 * );
 */
export function useInlineEdit({
  value,
  onCommit,
  editing,
  onEditingChange,
  disabled = false,
  trim = true,
}: UseInlineEditOptions): UseInlineEditResult {
  const [internalEditing, setInternalEditing] = React.useState(false);
  const isEditingControlled = editing !== undefined;
  const isEditing = isEditingControlled ? editing : internalEditing;
  const [draft, setDraft] = React.useState(value);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const displayElementRef = React.useRef<HTMLElement | null>(null);
  // Enter closes the edit, which unmounts the input, which makes the browser fire blur — and
  // blur commits. Without this the second commit fires against a stale draft.
  const committedRef = React.useRef(false);
  // Set only when the KEYBOARD closed the edit. A commit from blur must not steal focus back.
  const restoreFocusRef = React.useRef(false);

  const setEditing = React.useCallback(
    (next: boolean) => {
      if (!isEditingControlled) setInternalEditing(next);
      onEditingChange?.(next);
    },
    [isEditingControlled, onEditingChange],
  );

  // Keep the draft current when the host updates `value` from outside an edit.
  React.useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  // A CONTROLLED host flipping `editing` on must seed the draft and re-arm the guard exactly as
  // `start()` does — the drift that made the two hand-rolled copies behave differently in a grid.
  const previousEditing = React.useRef(isEditing);
  React.useEffect(() => {
    if (isEditing && !previousEditing.current) {
      committedRef.current = false;
      setDraft(value);
    }
    previousEditing.current = isEditing;
  }, [isEditing, value]);

  const start = React.useCallback(() => {
    if (disabled) return;
    committedRef.current = false;
    setDraft(value);
    setEditing(true);
  }, [disabled, value, setEditing]);

  const commit = React.useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const next = trim ? draft.trim() : draft;
    setEditing(false);
    if (next !== value) onCommit?.(next);
    else setDraft(value);
  }, [draft, value, trim, onCommit, setEditing]);

  const cancel = React.useCallback(() => {
    committedRef.current = true;
    setDraft(value);
    setEditing(false);
  }, [value, setEditing]);

  // Turning `disabled` on mid-edit reverts, exactly as Escape does — never a silent commit of
  // a value the user is no longer allowed to set.
  React.useEffect(() => {
    if (disabled && isEditing) cancel();
  }, [disabled, isEditing, cancel]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else if (!isEditing && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      displayElementRef.current?.focus();
    }
  }, [isEditing]);

  const editRef = React.useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
  }, []);

  const displayRef = React.useCallback((node: HTMLElement | null) => {
    displayElementRef.current = node;
  }, []);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        restoreFocusRef.current = true;
        commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        restoreFocusRef.current = true;
        cancel();
      }
    },
    [commit, cancel],
  );

  return {
    isEditing,
    draft,
    setDraft,
    start,
    commit,
    cancel,
    setEditing,
    editRef,
    displayRef,
    onKeyDown,
  };
}
