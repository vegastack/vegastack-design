// @vegastack editable-cell@0.23.2 sha256-IOnSfsXvBeKp+Jw/CbBPTahClO964ldwt6r950lI0Hw=

"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { useOverflow } from "@/components/ui/use-overflow";
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
a settings row, an `Item` — needs the same four things: the edit interaction (Enter-commit /
Esc-cancel / commit-on-blur with a double-commit guard), the async status layer
(idle → saving → saved | error), conflict revert (a rejected commit snaps the value back and
announces it), and a typed per-type editor so a status or date field edits with the right
control instead of a bare text box.

The click-to-edit TEXT LEAF is `InlineTextEditor` below, an internal part of this file. It used
to be a registry component of its own with this cell as its only consumer; Batch 7b of the shadcn
reset folded it in, because upstream's `Field` `orientation` — the replacement `extras.md` named —
is a LAYOUT prop and covers none of it, while `use-inline-edit` already owns the machine the two
shared. Nothing was duplicated: the cell now runs the leaf and the machine once each.

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
 * Which editor the cell opens. `text` edits in place via the internal text leaf;
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
   * back to the placeholder, then to a generic phrase; the editor is never unnamed.

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
  /**
   * What display mode shows for a non-empty value — for a value that is an id (`"u_7"`), the
   * label a person reads (`"Asha Rao"`), or any rich node (an avatar and a name). Used by every
   * editor type while displaying; editing still works on the raw `value`, and an empty value
   * keeps the placeholder.

   * @default undefined
   */
  renderValue?: (value: string) => React.ReactNode;
  /**
   * Let a long value wrap onto more lines instead of ending in an ellipsis — a page title that
   * must be read whole. The display grows taller; the editor is unchanged.
   * @default false
   */
  wrap?: boolean;
  /**
   * Pull the display box back by its own inline-start padding, so the value's text lines up with
   * the lines above and below it (a page title over its description). The hover wash and the
   * editor's box extend into the gutter instead; the text does not move when the editor opens.
   * @default false
   */
  flush?: boolean;
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

/* ------------------------------------------------------------------------------------------------
 * InlineTextEditor — the click-to-edit text leaf (internal)
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by the internal text leaf. */
interface InlineTextEditorProps {
  /** The value to display, and the seed for the draft when an edit opens. */
  value: string;
  /** Called with the new (trimmed) value on Enter or blur, only when it actually changed. */
  onCommit: (value: string) => void;
  /** Placeholder for the input, and the muted display text when `value` is empty. */
  placeholder?: string;
  /** Accessible name for the edit-mode textbox and for the display affordance. */
  label?: string;
  /** Controlled edit mode — the cell owns it, so this is always supplied. */
  editing: boolean;
  /** Reports the mode the leaf wants; the cell decides whether it changes. */
  onEditingChange: (editing: boolean) => void;
  /** Blocks editing and dims the display value, which stays hoverable (FRM-4). */
  disabled?: boolean;
  /** Renders plain, non-interactive text — no button role, no edit affordance, not dimmed. */
  readOnly?: boolean;
  /** Tab-stop override for the display element; `managed` hosts pass `-1`. */
  tabIndex?: number;
  /** What to show for a non-empty value instead of the value text (the cell's `renderValue`). */
  display?: React.ReactNode;
  /** Wrap a long value instead of truncating it (the cell's `wrap`). */
  wrap?: boolean;
  /** Align the text with its surroundings by pulling the box into the gutter (the cell's `flush`). */
  flush?: boolean;
}

/**
 * The text leaf: a value rendered as plain text with a hover affordance, which swaps for a focused
 * `Input` on click or Enter/Space. Enter or blur commits, Escape cancels — all of it
 * `useInlineEdit`, the hook this cell also runs for its own mode state, so there is exactly one
 * edit machine in the file.
 *
 * The display box mirrors upstream `Input`'s 32px height, its 1px border reservation and its
 * horizontal padding, so swapping text for the editor moves no adjacent layout.
 */
function InlineTextEditor({
  value,
  onCommit,
  placeholder,
  label,
  editing,
  onEditingChange,
  disabled = false,
  readOnly = false,
  tabIndex = 0,
  display,
  wrap = false,
  flush = false,
}: InlineTextEditorProps) {
  // `readOnly` folds into the hook's `disabled` because both mean the same thing to the machine:
  // an edit may not be entered, and one in flight reverts. They differ only in chrome.
  const edit = useInlineEdit({
    value,
    onCommit,
    editing,
    onEditingChange,
    disabled: disabled || readOnly,
  });

  const hasDisplayValue = value.length > 0;
  const displayFallback = placeholder ?? "Edit value";
  // A long value truncates to its container (a page title at 390px); when it is actually clipped,
  // the full value is offered as the display's `title` — and opening the editor shows all of it.
  const [textNode, setTextNode] = React.useState<HTMLSpanElement | null>(null);
  const overflowing = useOverflow(textNode, { deps: [value, wrap] });
  const truncated = !wrap && overflowing && hasDisplayValue;
  // `readOnly` drops button semantics entirely; `disabled` keeps the role and the handlers (so the
  // control stays discoverable, and `useInlineEdit` guards it anyway) but is dimmed and untabbable.
  const isButton = !readOnly;

  if (edit.isEditing) {
    return (
      <Input
        ref={edit.editRef}
        data-slot="editable-cell-input"
        aria-label={label ?? placeholder ?? "Edit value"}
        value={edit.draft}
        placeholder={placeholder}
        onChange={(event) => edit.setDraft(event.target.value)}
        onBlur={edit.commit}
        onKeyDown={edit.onKeyDown}
        // The editor takes its surrounding type, exactly as the display does, so a cell inside a
        // page heading edits at the heading's size and weight. Below `md` the size never drops
        // under 1rem — upstream's `text-base`, which stops iOS zooming on focus — and `1lh` is the
        // PARENT's line height, so the editor box matches the display box at every size.
        className={cn(
          "h-auto min-h-8 text-[length:max(1rem,1em)] leading-[1lh] md:text-[length:inherit]",
          // `flush`: the input's own padding (`px-2.5`, as the display's) moves into the gutter, so
          // the caret starts where the display's text did.
          flush && "-ms-2.5",
        )}
      />
    );
  }

  return (
    <span
      ref={edit.displayRef}
      data-slot="editable-cell-display"
      role={isButton ? "button" : undefined}
      tabIndex={readOnly ? undefined : disabled ? -1 : tabIndex}
      aria-disabled={disabled ? true : undefined}
      aria-label={label ?? (hasDisplayValue ? undefined : displayFallback)}
      title={truncated ? value : undefined}
      data-truncated={truncated ? "" : undefined}
      onClick={isButton ? edit.start : undefined}
      onKeyDown={
        isButton
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                edit.start();
              }
            }
          : undefined
      }
      className={cn(
        // `min-h-8`, not `h-8`: the box grows with inherited heading type instead of clipping it.
        // The value is ONE line (`truncate` on the inner span, `min-w-0` + `max-w-full` here and
        // on the root), so a long value inside a constrained parent ends in an ellipsis rather
        // than overflowing or wrapping; the clipped value is the `title` above.
        // No font size of its own: the display inherits the surrounding type (size, weight, line
        // height, tracking), so the same cell reads as body text in a table and as the title in a
        // page heading. At the 14px body default it is the same 14px text in the same 32px box.
        "inline-flex min-h-8 max-w-full min-w-0 items-center rounded-lg border border-transparent px-2.5 py-1",
        // `flush`: the box starts one padding-width before its slot, so the text starts on it. A
        // flex item shrinks to fit its margin box, so the negative margin never widens the row.
        flush && "-ms-2.5 max-w-none",
        !disabled && !readOnly && "cursor-text hover:bg-accent",
        // FRM-4: no `pointer-events-none`. A disabled cell stays hoverable so a Tooltip can
        // explain why it cannot be edited; the hook already no-ops `start()` while disabled.
        "aria-disabled:opacity-50",
      )}
    >
      <span
        ref={setTextNode}
        data-slot="editable-cell-text"
        className={cn(
          "min-w-0",
          // `wrap`: the value breaks onto more lines (anywhere, if one word is wider than the
          // slot) instead of ending in an ellipsis.
          wrap ? "wrap-break-word whitespace-normal" : "truncate",
          !hasDisplayValue && "text-muted-foreground",
        )}
      >
        {hasDisplayValue ? (display ?? value) : displayFallback}
      </span>
    </span>
  );
}

/** Fixed-width status slot so the cell doesn't shift as the indicator swaps (auto-save-input's recipe). */
const statusSlotClasses = "flex size-4 shrink-0 items-center justify-center";

/**
 * `EditableCell` — an inline-editable value with an async commit lifecycle.
 * Runs `InlineTextEditor` as the text leaf (Enter-commit / Esc-cancel /
 * commit-on-blur, double-commit guard, focus-and-select on open — all of it `useInlineEdit`,
 * which this cell shares for its own edit-mode state) and layers on the
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
  renderValue,
  wrap = false,
  flush = false,
  className,
  ref,
}: EditableCellProps) {
  // Edit mode comes from the shared inline-edit machine (audit B9-06) — the same hook the text
  // leaf runs on, so `text`, `select` and `custom` editors all resolve controlled-vs-internal
  // `editing` one way. Only the MODE half is used here: this cell's editors commit through
  // `handleCommit` below, which owns the optimistic layer the hook knows nothing about — hence
  // no `onCommit`, which the hook makes optional for exactly this case.
  const { isEditing, setEditing: setEditingState } = useInlineEdit({
    value,
    editing,
    onEditingChange,
    disabled: disabled || readOnly,
  });

  // Async status — controlled when `status` is provided, else derived from the
  // `onCommit` promise.
  const [internalStatus, setInternalStatus] =
    React.useState<AutoSaveStatus>("idle");
  const status = statusProp ?? internalStatus;
  // The optimistically shown value while a commit is in flight. Cleared on
  // resolve (the host has updated `value`) and on reject (the display snaps
  // back to `value` — the revert).
  const [pendingValue, setPendingValue] = React.useState<string | null>(null);
  // `use-announcer` owns the live region and the sequence keying that makes an
  // IDENTICAL consecutive announcement ("Save failed" twice) still re-announce.
  const { announce: setAnnouncement, Announcer } = useAnnouncer();
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
    [onCommit, displayValue, setEditingState, setAnnouncement],
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
        open={editing !== undefined ? isEditing : undefined}
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
          className="w-fit min-w-0"
        >
          <SelectValue placeholder={editor.placeholder}>
            {renderValue
              ? (selected: unknown) =>
                  typeof selected === "string" && selected
                    ? renderValue(selected)
                    : null
              : undefined}
          </SelectValue>
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
    // `text` in both modes; `custom` while displaying. For `custom`, the text leaf
    // stays permanently in display mode (`editing={false}`) and its activation
    // only raises our edit state, which swaps in the custom editor above.
    const isCustom = editor.type === "custom";
    // A READ-ONLY select cell reaches this branch (the editable one returns above), and it must
    // read the same as the editable one: the option's LABEL, not its stored value. It rendered the
    // raw value — `won` where the editable cell showed `Closed Won` — so the same column read
    // differently depending on a permission the reader cannot see (2026-09-09). An unrecognised
    // value falls back to itself rather than rendering blank.
    const displayText =
      editor.type === "select"
        ? (editor.options.find((option) => option.value === displayValue)
            ?.label ?? displayValue)
        : displayValue;
    editorSurface = (
      <InlineTextEditor
        value={displayText}
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
        display={
          renderValue && displayValue ? renderValue(displayValue) : undefined
        }
        wrap={wrap}
        flush={flush}
      />
    );
  }

  return (
    <span
      ref={ref}
      data-slot="editable-cell"
      data-status={status}
      data-focus-mode={focusMode}
      data-wrap={wrap ? "" : undefined}
      data-flush={flush ? "" : undefined}
      // `max-w-full` caps the inline root at its container, so a long value inside a heading
      // (a block parent, where `min-w-0` alone shrinks nothing) truncates instead of overflowing.
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1.5",
        className,
      )}
    >
      {editorSurface}
      {/* The VISIBLE indicator is decorative — every glyph is `aria-hidden`, and the
          announcement is the `Announcer` sibling below. Keeping the live region off this
          span is what holds the one-region-per-component rule: a status slot that is also
          a live region announces its own icon swaps. */}
      <span data-slot="editable-cell-status" className={statusSlotClasses}>
        {/* Keyed presence: each indicator remounts on status change so its
            mount animation replays. Color never carries status alone — the
            icon shape differs per state and the announcer speaks it. */}
        {status === "saving" ? (
          // Decorative — the sr-only sibling below already announces "Saving…".
          <Spinner
            className="size-3.5"
            aria-hidden
            role={undefined}
            aria-label={undefined}
          />
        ) : status === "saved" ? (
          <Check
            key="saved"
            className="motion-pop-in size-3 text-success-text"
            aria-hidden
          />
        ) : status === "error" ? (
          <X
            key="error"
            className="motion-pop-in size-3 text-destructive-text"
            aria-hidden
          />
        ) : null}
      </span>
      <Announcer />
    </span>
  );
}
