// @vegastack editable-cell@0.6.0 sha256-ZfJnuInJsoH5E9QiuFUXAEZ8LPkxHO8OAxh9OwKW6TA=

"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { FieldInline } from "@/components/ui/field-inline";
import { Spinner } from "@/components/ui/spinner";
import type { AutoSaveStatus } from "@/components/ui/auto-save-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---
`EditableCell` exists because every optimistic inline edit — in a grid, a property list,
a settings row, an `Item` — needs the same four things, and `FieldInline` supplies only
the first: the edit interaction (Enter-commit / Esc-cancel / commit-on-blur with a
double-commit guard), the async status layer (idle → saving → saved | error), conflict
revert (a rejected commit snaps the value back and announces it), and a typed per-type
editor so a status or date field edits with the right control instead of a bare text box.

The status vocabulary is `AutoSaveStatus` — imported from auto-save-input, not
re-declared — so the system has exactly one word list for "an async field write".

Deliberately NOT done here:
- No persistence, no debounce. `onCommit` fires once per commit; the host owns the write,
  the retry policy, and the conflict detection. A rejected promise IS the revert signal.
- No focus registry. `focusMode="managed"` only removes this cell's own tab stop
  (`tabIndex -1` on the display) and hands edit-mode control to the host via
  `editing`/`onEditingChange`; the roving model itself belongs to the grid.
- No built-in date/actor/currency editors. `text` and `select` cover the common cases;
  everything else plugs in through the open `custom` editor contract, because real
  editors beyond these two are app vocabularies (the platform's are status/priority/
  assignee pickers), not design-system chrome.
--- */

/** What a `custom` editor receives while the cell is in edit mode. */
export interface EditableCellEditorProps {
  /** The value being edited (the optimistic value while a commit is in flight). */
  value: string;
  /** Commit `next` and leave edit mode. No-ops the async layer when unchanged. */
  commit: (next: string) => void;
  /** Leave edit mode without committing. */
  cancel: () => void;
}

/**
 * Which editor the cell opens. `text` edits in place via `FieldInline`;
 * `select` renders a `Select` whose popover is the editor; `custom` is the open
 * registry — any app editor (date, actor, currency, multi-select) plugs in by
 * rendering its own control against the same commit/cancel contract.
 */
export type EditableCellEditor =
  | { type: "text"; placeholder?: string }
  | {
      type: "select";
      options: readonly { value: string; label: string }[];
      placeholder?: string;
    }
  | {
      type: "custom";
      render: (props: EditableCellEditorProps) => React.ReactNode;
    };

/** Props accepted by `EditableCell`. */
export interface EditableCellProps {
  /** The persisted value. The cell displays it, edits a draft of it, and reverts to it on a failed commit. */
  value: string;
  /**
   * Commit callback. Return a promise to engage the async status layer: the
   * cell shows the committed value optimistically with a `saving` indicator,
   * flips to `saved` on resolve, and on reject **reverts to `value`** and
   * announces the revert (the `version_conflict` path). Return `void` for
   * synchronous hosts.
   */
  onCommit: (next: string) => void | Promise<void>;
  /**
   * The editor to open. See {@link EditableCellEditor}.
   * @default { type: "text" }
   */
  editor?: EditableCellEditor;
  /**
   * Controlled status override. Omit it to let the cell derive status from the
   * `onCommit` promise; pass it when the host owns the write lifecycle (a
   * grid's `cellStatus`). Uses `AutoSaveStatus` — the system's one vocabulary
   * for async field writes.

   * @default undefined
   */
  status?: AutoSaveStatus;
  /**
   * Focus policy. `standalone` (a card, a property list) gives the cell its own
   * tab stop. `managed` removes it — the host's roving focus model owns
   * reachability and opens the editor through `editing`/`onEditingChange`.
   * @default "standalone"
   */
  focusMode?: "standalone" | "managed";
  /**
   * Controlled edit mode, forwarded to the underlying editor. Required in
   * practice for `managed` hosts (the grid opens the editor on Enter/F2); omit
   * for the built-in click / <kbd>Enter</kbd> / <kbd>Space</kbd> activation.

   * @default undefined
   */
  editing?: boolean;
  /**
   * Called when the cell wants to enter (`true`) or leave (`false`) edit mode.

   * @default undefined
   */
  onEditingChange?: (editing: boolean) => void;
  /**
   * Accessible name for the value being edited (e.g. `"Deal amount"`). Falls
   * back the same way `FieldInline` does; the editor is never unnamed.

   * @default undefined
   */
  label?: string;
  /**
   * Blocks editing; the display is dimmed and out of the tab order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Renders the value as plain non-interactive text with no edit affordance.
   * @default false
   */
  readOnly?: boolean;
  /** Extra classes merged onto the cell root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the cell's root `<span>` (`data-slot="editable-cell"`).

   * @default undefined
   */
  ref?: React.Ref<HTMLSpanElement>;
}

/** Fixed-width status slot so the cell doesn't shift as the indicator swaps (auto-save-input's recipe). */
const statusSlotClasses = "flex size-4 shrink-0 items-center justify-center";

/**
 * `EditableCell` — an inline-editable value with an async commit lifecycle.
 * Composes `FieldInline` as the text leaf (Enter-commit / Esc-cancel /
 * commit-on-blur, double-commit guard, focus-and-select on open) and layers on the
 * three things every optimistic inline edit needs beyond it: the
 * `idle → saving → saved | error` status indicator, conflict revert with a
 * polite announcement, and a typed editor registry (`text` | `select` |
 * `custom`).
 *
 * Its second consumer is not a table: record pages edit fields inline on
 * `Card`/`PropertyList` surfaces. `focusMode` is what lets one component serve
 * both — `standalone` owns its tab stop; `managed` defers reachability and
 * edit-mode control to a grid host.
 *
 * @example
 * // Standalone, async commit with automatic revert on rejection
 * <EditableCell
 *   value={deal.name}
 *   label="Deal name"
 *   onCommit={(name) => api.updateDeal({ name })} // reject → revert + announce
 * />
 *
 * @example
 * // Select editor
 * <EditableCell
 *   value={deal.stage}
 *   label="Stage"
 *   editor={{ type: "select", options: stages }}
 *   onCommit={(stage) => api.updateDeal({ stage })}
 * />
 */
export function EditableCell({
  value,
  onCommit,
  editor = { type: "text" },
  status: statusProp,
  focusMode = "standalone",
  editing,
  onEditingChange,
  label,
  disabled = false,
  readOnly = false,
  className,
  ref,
}: EditableCellProps) {
  // Edit mode — controlled when `editing` is provided (the managed-grid path),
  // else internal.
  const [internalEditing, setInternalEditing] = React.useState(false);
  const isEditingControlled = editing !== undefined;
  const isEditing = isEditingControlled ? editing : internalEditing;
  const setEditingState = React.useCallback(
    (next: boolean) => {
      if (!isEditingControlled) setInternalEditing(next);
      onEditingChange?.(next);
    },
    [isEditingControlled, onEditingChange],
  );

  // Async status — controlled when `status` is provided, else derived from the
  // `onCommit` promise.
  const [internalStatus, setInternalStatus] =
    React.useState<AutoSaveStatus>("idle");
  const status = statusProp ?? internalStatus;
  // The optimistically shown value while a commit is in flight. Cleared on
  // resolve (the host has updated `value`) and on reject (the display snaps
  // back to `value` — the revert).
  const [pendingValue, setPendingValue] = React.useState<string | null>(null);
  const [announcement, setAnnouncementState] = React.useState({
    text: "",
    seq: 0,
  });
  // Sequence-keyed so an IDENTICAL consecutive announcement still mutates the
  // DOM (a same-string setState is a React bail-out and never re-announces).
  const setAnnouncement = React.useCallback(
    (text: string) =>
      setAnnouncementState((prev) => ({ text, seq: prev.seq + 1 })),
    [],
  );
  // Guards a stale promise settling after a newer commit started.
  const commitSeq = React.useRef(0);

  const displayValue = pendingValue ?? value;

  // A CONTROLLED status must announce like the internal machine does — the
  // documented grid recipe drives `status` from the host, and the indicator
  // must never change silently. Announces live transitions only, not mount.
  const previousStatusProp = React.useRef(statusProp);
  React.useEffect(() => {
    if (statusProp !== undefined && previousStatusProp.current !== statusProp) {
      if (statusProp === "saving") setAnnouncement("Saving…");
      else if (statusProp === "saved") setAnnouncement("Saved");
      else if (statusProp === "error") setAnnouncement("Save failed");
    }
    previousStatusProp.current = statusProp;
  }, [statusProp, setAnnouncement]);

  const handleCommit = React.useCallback(
    (next: string) => {
      setEditingState(false);
      // Compare against what the user SEES (the optimistic value while a
      // commit is in flight), not the persisted prop — committing back to the
      // persisted value during a slow save is a real edit that must supersede
      // the in-flight one, or the cell wedges on a stale spinner. Confirming
      // the visible value is a no-op that leaves any in-flight save alone.
      if (next === displayValue) return;
      const seq = ++commitSeq.current;
      const result = onCommit(next);
      if (result == null || typeof result.then !== "function") {
        setPendingValue(null);
        setInternalStatus("idle");
        return;
      }
      setPendingValue(next);
      setInternalStatus("saving");
      setAnnouncement("Saving…");
      result.then(
        () => {
          if (seq !== commitSeq.current) return;
          setPendingValue(null);
          setInternalStatus("saved");
          setAnnouncement("Saved");
        },
        () => {
          if (seq !== commitSeq.current) return;
          setPendingValue(null);
          setInternalStatus("error");
          setAnnouncement("Save failed — value reverted");
        },
      );
    },
    [onCommit, displayValue, setEditingState],
  );

  const cancelEdit = React.useCallback(
    () => setEditingState(false),
    [setEditingState],
  );

  const managed = focusMode === "managed";

  let editorSurface: React.ReactNode;
  if (editor.type === "select" && !readOnly) {
    // The Select popover IS the editor — matching how real inline cell editors
    // are popover-based per type. Commit fires on selection; the popover's
    // open state reports through `onEditingChange`, and a controlled `editing`
    // opens it — so managed grid hosts drive this editor exactly like `text`.
    editorSurface = (
      <Select
        items={editor.options}
        value={displayValue}
        open={isEditingControlled ? isEditing : undefined}
        onOpenChange={(nextOpen) => setEditingState(nextOpen)}
        onValueChange={(next) => {
          if (typeof next === "string") handleCommit(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          aria-label={label}
          tabIndex={managed ? -1 : undefined}
          className="min-w-0"
        >
          <SelectValue placeholder={editor.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {editor.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (editor.type === "custom" && isEditing) {
    editorSurface = editor.render({
      value: displayValue,
      commit: handleCommit,
      cancel: cancelEdit,
    });
  } else {
    // `text` in both modes; `custom` while displaying. For `custom`, FieldInline
    // stays permanently in display mode (`editing={false}`) and its activation
    // only raises our edit state, which swaps in the custom editor above.
    const isCustom = editor.type === "custom";
    editorSurface = (
      <FieldInline
        value={displayValue}
        label={label}
        placeholder={editor.type === "text" ? editor.placeholder : undefined}
        onCommit={handleCommit}
        editing={isCustom ? false : isEditing}
        onEditingChange={(next) => {
          if (next) setEditingState(true);
          else if (!isCustom) setEditingState(false);
        }}
        tabIndex={managed ? -1 : 0}
        disabled={disabled}
        readOnly={readOnly}
      />
    );
  }

  return (
    <span
      ref={ref}
      data-slot="editable-cell"
      data-status={status}
      data-focus-mode={focusMode}
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
    >
      {editorSurface}
      <span
        data-slot="editable-cell-status"
        className={statusSlotClasses}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Keyed presence: each indicator remounts on status change so its
            mount animation replays. Color never carries status alone — the
            icon shape differs per state and the sr-only text announces it. */}
        {status === "saving" ? (
          // Decorative (label="") — the sr-only sibling announces "Saving…".
          <Spinner size="sm" label="" />
        ) : status === "saved" ? (
          <Check
            key="saved"
            className="motion-pop-in size-(--icon-compact) text-success-text"
            aria-hidden
          />
        ) : status === "error" ? (
          <X
            key="error"
            className="motion-pop-in size-(--icon-compact) text-destructive-text"
            aria-hidden
          />
        ) : null}
        <span key={announcement.seq} className="sr-only">
          {announcement.text}
        </span>
      </span>
    </span>
  );
}
