// @vegastack use-inline-edit@0.25.9 sha256-eEgFuFuPUuBlFNxDOJJgtmogkp6QQJJ1QIZZ8N+DvQE=

"use client";

import * as React from "react";

/* ---
`useInlineEdit` exists because the click-to-edit state machine had been written twice, and the
two copies had already drifted: only one of them re-armed its double-commit guard when a
controlled host flipped `editing` on, and only one returned focus to the display element after a
KEYBOARD commit. Both bugs are the kind that never surface in a demo and always surface in a grid.
`EditableCell` is the in-repo consumer — it runs this hook twice, once for its own edit mode and
once inside its text leaf — and the hook is published on its own so an app editor can too.

What it owns, and why each piece is not optional:
- the controlled/uncontrolled `editing` pair, so a grid host can drive edit mode with
  Enter/F2 while a standalone field drives itself;
- the draft, seeded from `value` on every open so a cancelled edit cannot leak forward;
- the double-commit guard. Enter sets editing=false, which unmounts the input, which makes
  the browser fire `blur`, which would commit a second time. One boolean ref, checked and
  set before any callback runs;
- caret placement: a pointer click opens the editor with the caret where the click landed in
  the text; a keyboard open (Enter/F2, or a controlled host) puts it at the end. Never select-all
  — a click on a title means "edit here", and a select-all turns the next keystroke into a wipe;
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
  /**
   * A multi-line editor: <kbd>Enter</kbd> inserts a newline and <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd>
   * commits. Single-line editors (the default) commit on a plain <kbd>Enter</kbd> — even when the
   * editor is a wrapping `textarea`, as a heading's is.
   * @default false
   */
  multiline?: boolean;
}

/** The opening pointer position — a `MouseEvent`/`PointerEvent` (React or DOM) satisfies it. */
export interface InlineEditStartPoint {
  clientX: number;
  clientY: number;
  /** Click count; `0` marks a keyboard-synthesised click, which places the caret at the end. */
  detail?: number;
}

/** What {@link useInlineEdit} returns. */
export interface UseInlineEditResult {
  /** Whether the field is currently editing (resolved across controlled/uncontrolled). */
  isEditing: boolean;
  /** The in-flight draft value. Bind it to the editor's `value`. */
  draft: string;
  /** Update the draft from the editor's change handler. */
  setDraft: (value: string) => void;
  /**
   * Enter edit mode. No-ops while `disabled`. Pass the opening pointer event (anything with
   * `clientX`/`clientY`) and the caret lands where it hit the display's text; call it bare, or
   * with a keyboard-synthesised click (`detail === 0`), and the caret goes to the end.
   */
  start: (from?: InlineEditStartPoint) => void;
  /** Commit the draft and leave edit mode. Safe to call twice — the second call no-ops. */
  commit: () => void;
  /** Leave edit mode, reverting the draft. */
  cancel: () => void;
  /** Set edit mode directly — for an editor whose own open state IS the edit (a Select popup). */
  setEditing: (editing: boolean) => void;
  /**
   * Attach to the edit-mode input. Focuses it when the edit opens, with the caret at the click
   * position (see `start`) or at the end — never selecting the whole value.
   */
  editRef: React.RefCallback<HTMLInputElement | HTMLTextAreaElement>;
  /**
   * Attach to the display element. Focus returns here when a KEYBOARD commit or cancel closed
   * the edit — never when a blur committed it, where the user has already moved on.
   */
  displayRef: React.RefCallback<HTMLElement>;
  /**
   * <kbd>Enter</kbd> (single-line) or <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> (multiline) commits,
   * <kbd>Escape</kbd> cancels; both restore focus to the display. Keys pressed while an IME is
   * composing are left alone.
   */
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * `useInlineEdit` — the click-to-edit machine behind `EditableCell` and any editor like it:
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
  multiline = false,
}: UseInlineEditOptions): UseInlineEditResult {
  const [internalEditing, setInternalEditing] = React.useState(false);
  const isEditingControlled = editing !== undefined;
  const isEditing = isEditingControlled ? editing : internalEditing;
  const [draft, setDraft] = React.useState(value);

  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(
    null,
  );
  const displayElementRef = React.useRef<HTMLElement | null>(null);
  // Enter closes the edit, which unmounts the input, which makes the browser fire blur — and
  // blur commits. Without this the second commit fires against a stale draft.
  const committedRef = React.useRef(false);
  // Set only when the KEYBOARD closed the edit. A commit from blur must not steal focus back.
  const restoreFocusRef = React.useRef(false);
  // The caret offset `start()` measured from the opening click; null = the end of the value.
  const caretRef = React.useRef<number | null>(null);

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
  // Set by `start()` so the effect below keeps the caret it measured; a host-driven open has none.
  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (isEditing && !previousEditing.current) {
      committedRef.current = false;
      if (!startedRef.current) caretRef.current = null;
      startedRef.current = false;
      setDraft(value);
    }
    previousEditing.current = isEditing;
  }, [isEditing, value]);

  const start = React.useCallback(
    (from?: InlineEditStartPoint) => {
      if (disabled) return;
      caretRef.current =
        from && from.detail !== 0
          ? caretOffsetFromPoint(displayElementRef.current, from, value)
          : null;
      startedRef.current = true;
      committedRef.current = false;
      setDraft(value);
      setEditing(true);
    },
    [disabled, value, setEditing],
  );

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
      const input = inputRef.current;
      input.focus();
      const end = input.value.length;
      const at = Math.min(caretRef.current ?? end, end);
      caretRef.current = null;
      try {
        input.setSelectionRange(at, at);
      } catch {
        // An input type without a text selection (number, email) keeps the browser's caret.
      }
    } else if (!isEditing && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      displayElementRef.current?.focus();
    }
  }, [isEditing]);

  const editRef = React.useCallback(
    (node: HTMLInputElement | HTMLTextAreaElement | null) => {
      inputRef.current = node;
    },
    [],
  );

  const displayRef = React.useCallback((node: HTMLElement | null) => {
    displayElementRef.current = node;
  }, []);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.nativeEvent?.isComposing) return;
      if (
        event.key === "Enter" &&
        (!multiline || event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        restoreFocusRef.current = true;
        commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        restoreFocusRef.current = true;
        cancel();
      }
    },
    [commit, cancel, multiline],
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

/**
 * The offset in `value` a viewport point falls at inside `root`; `null` (the end) when the point
 * misses the root's text, the browser has no caret-from-point API, or the text before the point
 * is not a prefix of `value` — a formatted display (`1,234` for `1234`) or a trailing unit, where
 * a rendered offset would put the caret in the wrong place.
 */
function caretOffsetFromPoint(
  root: HTMLElement | null,
  { clientX, clientY }: InlineEditStartPoint,
  value: string,
): number | null {
  if (!root || typeof document === "undefined") return null;
  let node: Node | null = null;
  let offset = 0;
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  if (typeof doc.caretPositionFromPoint === "function") {
    const position = doc.caretPositionFromPoint(clientX, clientY);
    if (position) {
      node = position.offsetNode;
      offset = position.offset;
    }
  } else if (typeof doc.caretRangeFromPoint === "function") {
    const range = doc.caretRangeFromPoint(clientX, clientY);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!node || !root.contains(node)) return null;
  try {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    const before = range.toString();
    return value.startsWith(before) ? before.length : null;
  } catch {
    return null;
  }
}
