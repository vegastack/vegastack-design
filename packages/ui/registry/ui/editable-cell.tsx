// @vegastack editable-cell@0.23.38 sha256-VvO9MaPRT8iIqnkxvPWJ8Oh0XGb1F8KNQzw10mzrAZ8=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
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

Edit looks like view. The text leaf renders ONE box in both modes: a CSS grid whose single cell
holds the value text and, while editing, a borderless transparent field laid over it. The text
stays in the box (invisible while editing, showing the draft) so it sizes the field — the field
grows with its content, wraps when the value wraps, and entering or leaving edit changes neither
the width nor the line box. The field inherits font, size, weight, line height, tracking and
colour; only the caret and the selection say it is being edited.

The click-to-edit TEXT LEAF is `InlineTextEditor` below, an internal part of this file. It used
to be a registry component of its own with this cell as its only consumer; Batch 7b of the shadcn
reset folded it in, because upstream's `Field` `orientation` — the replacement `extras.md` named —
is a LAYOUT prop and covers none of it, while `use-inline-edit` already owns the machine the two
shared. Nothing was duplicated: the cell now runs the leaf and the machine once each.

The status vocabulary is `AutoSaveStatus` — imported from auto-save-input, not
re-declared — so the system has exactly one word list for "an async field write".

Deliberately NOT done here:
- No persistence, no debounce. `onSave` fires once per commit; the host owns the write and
  the conflict detection. A rejected promise IS the revert signal, and the error toast's Retry
  re-runs the same `onSave`.
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
   * Save callback. Return a promise to engage the async layer: the display updates
   * optimistically, a subtle trailing spinner appears if the save takes longer than 300ms, and
   * on reject the value **rolls back to `value`**, the failure is announced, and an error toast
   * offers Retry (see `saveErrorToast`). Return `void` for synchronous hosts. Fires only when the
   * value actually changed.
   * @default undefined
   */
  onSave?: (next: string) => void | Promise<void>;
  /**
   * The original name of `onSave`, kept so existing hosts (the `DataGrid`) keep working. `onSave`
   * wins when both are passed.
   * @default undefined
   */
  onCommit?: (next: string) => void | Promise<void>;
  /**
   * Layout of the text editor. `inline` sizes the box to its value; `cell` fills the table cell
   * (the row link still takes clicks outside the text); `heading` keeps the surrounding size and
   * weight, wraps naturally and has no box padding — a page or record title edited in place, idle
   * and editing at the identical position.
   * @default "inline"
   */
  variant?: "inline" | "cell" | "heading";
  /**
   * Edit several lines. The field wraps, <kbd>Enter</kbd> inserts a newline and
   * <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> saves.
   * @default false
   */
  multiline?: boolean;
  /**
   * An empty value is not saved: the previous value is restored and `requiredMessage` is
   * announced and toasted.
   * @default false
   */
  required?: boolean;
  /**
   * The message shown when a `required` value is cleared.
   * @default "{label} can't be empty"
   */
  requiredMessage?: string;
  /**
   * Raise an error toast with a Retry action when `onSave` rejects. `false` leaves the failure to
   * the announcement and the rollback (a grid that reports errors itself).
   * @default true
   */
  saveErrorToast?: boolean;
  /**
   * Table navigation. When set, <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> and (single-line)
   * <kbd>Enter</kbd> / <kbd>Shift</kbd>+<kbd>Enter</kbd> save and then call it, so the host can
   * move to the next or previous cell.
   * @default undefined
   */
  onNavigate?: (direction: "next" | "previous") => void;
  /**
   * A hint shown on hover while displaying (the native tooltip), e.g. "Click to rename". A
   * truncated value shows the full value instead.
   * @default undefined
   */
  tooltip?: string;
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
   * the lines above and below it (a page title over its description). The hover tint extends
   * into the gutter instead; the text does not move when the editor opens.
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
  /** Called with the new (trimmed) value on commit, only when it actually changed. */
  onCommit: (value: string) => void;
  /** Placeholder for the field, and the muted display text when `value` is empty. */
  placeholder?: string;
  /** Accessible name of the value: the field's label, and "Edit {label}" on the display. */
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
  /** Wrap a long value instead of truncating it. */
  wrap?: boolean;
  /** Edit several lines (⌘/Ctrl+Enter saves). */
  multiline?: boolean;
  /** Fill the table cell; clicks outside the text fall through to the row. */
  fill?: boolean;
  /** Align the text with its surroundings by pulling the box into the gutter (the cell's `flush`). */
  flush?: boolean;
  /** Tab / Enter navigation after a save (the cell's `onNavigate`). */
  onNavigate?: (direction: "next" | "previous") => void;
  /** Native hover hint while displaying. */
  tooltip?: string;
  /**
   * No box padding (the `heading` variant): the text sits exactly where surrounding text would,
   * idle and editing alike, and only the hover tint marks it editable.
   */
  bare?: boolean;
}

/**
 * The shared box. Display and editor are the SAME element with the same padding and line box, so
 * entering or leaving edit moves nothing. The tint is the only affordance: hover and keyboard
 * focus (FOC-13) show it, editing does not. No focus ring or outline.
 */
const boxClasses = "rounded-lg px-2.5 py-1.5";
/** The `heading` box: no padding, so a title is edited exactly where it is rendered. */
const bareBoxClasses = "rounded-sm";

/** The field laid over the text: no chrome, inherits every type property from the box. */
const fieldClasses =
  "absolute inset-0 block size-full max-w-none min-w-0 resize-none appearance-none overflow-hidden rounded-none border-0 bg-transparent [color:inherit] [font:inherit] [letter-spacing:inherit] [text-align:inherit] [text-transform:inherit] shadow-none outline-none placeholder:text-muted-foreground";

/**
 * The text leaf: a value rendered as plain text with a hover tint; click, <kbd>Enter</kbd> or
 * <kbd>F2</kbd> lays a borderless field over the same text. Blur saves, Enter (single-line) or
 * ⌘/Ctrl+Enter (multiline) saves, Escape cancels — all of it `useInlineEdit`, the hook this cell
 * also runs for its own mode state, so there is exactly one edit machine in the file.
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
  multiline = false,
  fill = false,
  flush = false,
  onNavigate,
  tooltip,
  bare = false,
}: InlineTextEditorProps) {
  const box = bare ? bareBoxClasses : boxClasses;
  // `readOnly` folds into the hook's `disabled` because both mean the same thing to the machine:
  // an edit may not be entered, and one in flight reverts. They differ only in chrome.
  const edit = useInlineEdit({
    value,
    onCommit,
    editing,
    onEditingChange,
    disabled: disabled || readOnly,
    multiline,
  });
  const isEditing = edit.isEditing;
  const wrapping = wrap || multiline;
  const textId = React.useId();

  const hasDisplayValue = value.length > 0;
  const name = label ?? placeholder ?? "value";
  const displayFallback = placeholder ?? "Edit value";
  // A long single-line value truncates to its container; when it is actually clipped the full
  // value is offered as the display's `title` — and opening the editor shows all of it.
  const [textNode, setTextNode] = React.useState<HTMLSpanElement | null>(null);
  const overflowing = useOverflow(textNode, { deps: [value, wrapping] });
  const truncated = !wrapping && !isEditing && overflowing && hasDisplayValue;
  const interactive = !readOnly && !isEditing;

  const onFieldKeyDown = (event: React.KeyboardEvent) => {
    if (onNavigate && !event.nativeEvent?.isComposing) {
      const isTab = event.key === "Tab";
      const isEnter = event.key === "Enter" && !multiline;
      if (isTab || isEnter) {
        event.preventDefault();
        edit.commit();
        onNavigate(event.shiftKey ? "previous" : "next");
        return;
      }
    }
    edit.onKeyDown(event);
  };

  const fieldProps = {
    "data-slot": "editable-cell-input",
    "aria-label": name === "value" ? "Edit value" : name,
    value: edit.draft,
    placeholder,
    onBlur: edit.commit,
    onKeyDown: onFieldKeyDown,
    // The field covers the whole box and carries the box's padding, so the pointer target is the
    // full box and the caret starts exactly where the text did.
    className: cn(fieldClasses, box),
  };

  return (
    <span
      ref={edit.displayRef}
      data-slot="editable-cell-display"
      data-editing={isEditing ? "" : undefined}
      data-variant={fill ? "cell" : wrapping ? "wrap" : "inline"}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? (disabled ? -1 : tabIndex) : undefined}
      aria-disabled={disabled && !readOnly ? true : undefined}
      aria-label={interactive ? `Edit ${name}` : undefined}
      aria-describedby={interactive && hasDisplayValue ? textId : undefined}
      title={truncated ? value : interactive ? tooltip : undefined}
      data-truncated={truncated ? "" : undefined}
      onClick={
        interactive
          ? (event) => {
              // `cell`: only the text starts an edit; a click beside it bubbles on to the row.
              if (fill && textNode && !textNode.contains(event.target as Node))
                return;
              event.stopPropagation();
              edit.start();
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (event) => {
              if (
                event.key === "Enter" ||
                event.key === "F2" ||
                event.key === " "
              ) {
                event.preventDefault();
                event.stopPropagation();
                edit.start();
              }
            }
          : undefined
      }
      className={cn(
        // The text sizes the box in both modes; while editing, the field is laid over the whole
        // box (`absolute inset-0`), so it grows with its content and nothing shifts. No font of
        // its own: size, weight, line height and tracking come from the surroundings.
        "relative max-w-full min-w-0 items-center",
        box,
        fill ? "flex w-full" : "inline-flex align-top",
        // `flush`: the box starts one padding-width before its slot, so the text starts on it.
        flush && !bare && "-ms-2.5 max-w-[calc(100%+0.625rem)]",
        // The tint is the only affordance: hover here, keyboard focus from base.css FOC-13 (the
        // system's focus tint). No focus ring or outline.
        interactive && !disabled && "cursor-text hover:bg-accent",
        // FRM-4: no `pointer-events-none` for disabled. A disabled cell stays hoverable so a
        // Tooltip can explain why it cannot be edited; the hook already no-ops `start()`.
        "aria-disabled:opacity-50",
      )}
    >
      <span
        ref={setTextNode}
        id={textId}
        data-slot="editable-cell-text"
        aria-hidden={isEditing ? true : undefined}
        className={cn(
          "min-w-0",
          wrapping
            ? "wrap-break-word whitespace-pre-wrap"
            : isEditing
              ? "overflow-hidden whitespace-pre"
              : // A squeezed DataList wraps its cells rather than clipping them.
                "truncate in-data-squeezed:wrap-anywhere in-data-squeezed:whitespace-normal",
          // While editing the text is the field's invisible sizer: it holds the draft.
          isEditing && "invisible",
          !isEditing && !hasDisplayValue && "text-muted-foreground",
        )}
      >
        {isEditing
          ? // The zero-width space keeps an empty draft (or a trailing newline) one line tall.
            (edit.draft || placeholder || "") + "​"
          : hasDisplayValue
            ? (display ?? value)
            : displayFallback}
      </span>
      {isEditing ? (
        wrapping ? (
          <textarea
            ref={edit.editRef}
            rows={1}
            {...fieldProps}
            onChange={(event) => edit.setDraft(event.target.value)}
          />
        ) : (
          <input
            ref={edit.editRef}
            type="text"
            {...fieldProps}
            onChange={(event) => edit.setDraft(event.target.value)}
          />
        )
      ) : null}
    </span>
  );
}

/**
 * `EditableCell` — an inline-editable value with an async save lifecycle.
 * Runs `InlineTextEditor` as the text leaf — edit looks like view: no border, ring or background,
 * the same box and line box in both modes — and layers on what every optimistic inline edit needs
 * beyond it: a delayed trailing spinner, rollback with an announcement and a Retry toast on a
 * failed save, `required`, and a typed editor registry (`text` | `select` | `custom`).
 *
 * `focusMode` lets one component serve a record page and a grid — `standalone` owns its tab stop;
 * `managed` defers reachability and edit-mode control to a grid host.
 *
 * @example
 * // A record title
 * <h1 className="text-2xl font-semibold">
 *   <EditableCell variant="heading" required label="Title" value={deal.name}
 *     onSave={(name) => api.updateDeal({ name })} />
 * </h1>
 *
 * @example
 * // A table cell
 * <EditableCell variant="cell" label="Amount" value={row.amount}
 *   onSave={(amount) => api.update(row.id, { amount })} />
 */
export function EditableCell({
  value,
  onSave,
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
  variant = "inline",
  multiline = false,
  required = false,
  requiredMessage,
  saveErrorToast = true,
  onNavigate,
  tooltip,
  wrap = false,
  flush = false,
  className,
  ref,
}: EditableCellProps) {
  const save = onSave ?? onCommit;
  // Edit mode comes from the shared inline-edit machine (audit B9-06) — the same hook the text
  // leaf runs on, so `text`, `select` and `custom` editors all resolve controlled-vs-internal
  // `editing` one way. Only the MODE half is used here: this cell's editors commit through
  // `handleCommit` below, which owns the optimistic layer the hook knows nothing about.
  const { isEditing, setEditing: setEditingState } = useInlineEdit({
    value,
    editing,
    onEditingChange,
    disabled: disabled || readOnly,
  });

  // Async status — controlled when `status` is provided, else derived from the `onSave` promise.
  const [internalStatus, setInternalStatus] =
    React.useState<AutoSaveStatus>("idle");
  const status = statusProp ?? internalStatus;
  // The optimistically shown value while a save is in flight. Cleared on resolve (the host has
  // updated `value`) and on reject (the display rolls back to `value`).
  const [pendingValue, setPendingValue] = React.useState<string | null>(null);
  const { announce: setAnnouncement, Announcer } = useAnnouncer();
  // Guards a stale promise settling after a newer save started.
  const commitSeq = React.useRef(0);

  const displayValue = pendingValue ?? value;
  const name = label ?? "value";

  // The spinner is for SLOW saves only: a save that settles inside 300ms never shows it.
  const [spinnerVisible, setSpinnerVisible] = React.useState(false);
  React.useEffect(() => {
    if (status !== "saving") {
      setSpinnerVisible(false);
      return;
    }
    const timer = setTimeout(() => setSpinnerVisible(true), 300);
    return () => clearTimeout(timer);
  }, [status]);

  // A CONTROLLED status must announce like the internal machine does. Live transitions only.
  const previousStatusProp = React.useRef(statusProp);
  React.useEffect(() => {
    if (statusProp !== undefined && previousStatusProp.current !== statusProp) {
      if (statusProp === "saving") setAnnouncement("Saving…");
      else if (statusProp === "saved") setAnnouncement("Saved");
      else if (statusProp === "error") setAnnouncement("Save failed");
    }
    previousStatusProp.current = statusProp;
  }, [statusProp, setAnnouncement]);

  const handleCommitRef = React.useRef<(next: string) => void>(() => {});
  const handleCommit = React.useCallback(
    (next: string) => {
      setEditingState(false);
      // Compare against what the user SEES (the optimistic value while a save is in flight), not
      // the persisted prop — saving back to the persisted value during a slow save is a real edit
      // that must supersede the in-flight one. Confirming the visible value is a no-op.
      if (next === displayValue) return;
      if (required && next.trim() === "") {
        const message =
          requiredMessage ?? `${label ?? "This field"} can't be empty`;
        setAnnouncement(message);
        toast.add({ type: "warning", title: message });
        return;
      }
      if (!save) return;
      const seq = ++commitSeq.current;
      const result = save(next);
      if (result == null || typeof result.then !== "function") {
        setPendingValue(null);
        setInternalStatus("idle");
        return;
      }
      setPendingValue(next);
      setInternalStatus("saving");
      result.then(
        () => {
          if (seq !== commitSeq.current) return;
          setPendingValue(null);
          setInternalStatus("saved");
          setAnnouncement("Saved");
        },
        (error: unknown) => {
          if (seq !== commitSeq.current) return;
          setPendingValue(null);
          setInternalStatus("error");
          setAnnouncement(`Couldn't save ${name} — value restored`);
          if (saveErrorToast) {
            const id = toast.add({
              type: "error",
              title: `Couldn't save ${name}`,
              description: error instanceof Error ? error.message : undefined,
              actionProps: {
                children: "Retry",
                onClick: () => {
                  toast.close(id);
                  handleCommitRef.current(next);
                },
              },
            });
          }
        },
      );
    },
    [
      save,
      displayValue,
      required,
      requiredMessage,
      label,
      name,
      saveErrorToast,
      setEditingState,
      setAnnouncement,
    ],
  );
  handleCommitRef.current = handleCommit;

  const cancelEdit = React.useCallback(
    () => setEditingState(false),
    [setEditingState],
  );

  const managed = focusMode === "managed";

  let editorSurface: React.ReactNode;
  if (editor.type === "select" && !readOnly) {
    // The Select popover IS the editor. Commit fires on selection; the popover's open state
    // reports through `onEditingChange`, and a controlled `editing` opens it.
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
    // `text` in both modes; `custom` while displaying. For `custom`, the text leaf stays in
    // display mode (`editing={false}`) and its activation only raises our edit state.
    const isCustom = editor.type === "custom";
    // A READ-ONLY select cell reads the option's LABEL, like the editable one (2026-09-09).
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
        wrap={wrap || variant === "heading"}
        multiline={multiline}
        fill={variant === "cell"}
        flush={flush}
        onNavigate={onNavigate}
        tooltip={tooltip}
        bare={variant === "heading"}
      />
    );
  }

  return (
    <span
      ref={ref}
      data-slot="editable-cell"
      data-status={status}
      data-focus-mode={focusMode}
      data-variant={variant}
      data-wrap={wrap || variant === "heading" ? "" : undefined}
      data-flush={flush ? "" : undefined}
      aria-busy={status === "saving" ? true : undefined}
      className={cn(
        "max-w-full min-w-0 items-center gap-1.5",
        variant === "inline" ? "inline-flex" : "flex w-full",
        className,
      )}
    >
      {editorSurface}
      {/* Decorative: the announcement is the `Announcer` sibling. Appears only after 300ms. */}
      {spinnerVisible ? (
        <Spinner
          data-slot="editable-cell-status"
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
          role={undefined}
          aria-label={undefined}
        />
      ) : null}
      <Announcer />
    </span>
  );
}
