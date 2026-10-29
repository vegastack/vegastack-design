// @vegastack editable-cell@0.25.98 sha256-SnfLrxNHaeuMAZK1TFLXkkOx01vYrNFHFpVf7IPJdXQ=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  useInlineEdit,
  useInlineEditMode,
  type UseInlineEditResult,
} from "@/components/ui/use-inline-edit";
import { measureOverflow, useOverflow } from "@/components/ui/use-overflow";
import { DatePicker } from "@/components/ui/date-picker";
import { parseCalendarDay, toCalendarDay } from "@/lib/date-time";
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
- No built-in date/actor/currency editors. `text`, `number` and `select` cover the common cases;
  everything else plugs in through the open `custom` editor contract, because real
  editors beyond these two are app vocabularies (the platform's are status/priority/
  assignee pickers), not design-system chrome.
--- */

/**
 * The inline-edit hover: no border at rest, on hover or while open — the quiet tint a property
 * value shows in a `PropertyList` (a ghost `RecordChip`), so a list cell, a board card field and a
 * record's properties all read as the same editable value. Keyboard focus keeps the system ring.
 */
const INLINE_EDIT_TINT =
  "border-transparent shadow-none hover:border-transparent hover:bg-muted aria-expanded:border-transparent aria-expanded:bg-muted data-popup-open:bg-muted dark:border-transparent dark:bg-transparent dark:hover:bg-muted/50";

/** Props for `InlineEditTrigger`. */
export interface InlineEditTriggerProps extends Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
> {
  /**
   * `cell` fills its container — a list cell, where the WHOLE cell (icon and text) opens the
   * editor, its padding hung outside so the value's text starts where a plain value does. `chip`
   * sizes to its value — a board card field.
   * @default "cell"
   */
  layout?: "cell" | "chip";
}

/**
 * `InlineEditTrigger` — the click target of an app-owned inline editor (a status, priority or
 * assignee menu, a date popover) inside a `DataList` cell or a `BoardCard` field. The whole value —
 * icon and text — is one button: no border at rest, the property-panel tint on hover, focus and
 * while its menu is open. Enter or Space opens the editor. Pass it as the `render` of a
 * `DropdownMenuTrigger` or `PopoverTrigger`, and mark the column `interactive`. Render it only
 * where the viewer may edit; a read-only value stays plain text.
 *
 * @example
 * <DropdownMenuTrigger
 *   render={<InlineEditTrigger aria-label="Priority: High — change priority" />}
 * >
 *   <PriorityIcon priority="high" size="sm" label="" /> High
 * </DropdownMenuTrigger>
 */
export function InlineEditTrigger({
  layout = "cell",
  className,
  type = "button",
  ...props
}: InlineEditTriggerProps) {
  return (
    <Button
      data-slot="inline-edit-trigger"
      data-layout={layout}
      variant="ghost"
      size="xs"
      type={type}
      className={cn(
        "min-w-0 justify-start gap-1.5 rounded-md px-1.5 font-normal text-inherit active:not-aria-[haspopup]:translate-y-0 [&>span]:min-w-0 [&>span]:truncate",
        INLINE_EDIT_TINT,
        layout === "cell"
          ? // Block-level, so a table cell's `vertical-align: middle` centres it on the row
            // instead of seating it on the text baseline.
            "-mx-1.5 -my-0.5 flex w-[calc(100%+0.75rem)] max-w-[calc(100%+0.75rem)] text-sm"
          : "max-w-full text-xs",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Where a commit moves the host's focus afterwards — the spreadsheet keyboard model: <kbd>Enter</kbd>
 * moves `down`, <kbd>Shift</kbd>+<kbd>Enter</kbd> `up`, <kbd>Tab</kbd> `right` and
 * <kbd>Shift</kbd>+<kbd>Tab</kbd> `left`.
 */
export type EditableCellMove = "down" | "up" | "right" | "left";

/** What a `custom` editor receives while the cell is in edit mode. */
export interface EditableCellEditorProps {
  /** The value being edited (the optimistic value while a commit is in flight). */
  value: string;
  /**
   * The printable character that opened the editor (type-to-edit, the cell's `editSeed`), or
   * `undefined` for a click, <kbd>Enter</kbd> or <kbd>F2</kbd> open. A text-like editor starts its
   * draft from it, replacing the value; a picker starts its search from it.
   * @default undefined
   */
  seed?: string;
  /**
   * Commit `next` and leave edit mode, then — with `move` — hand the move to the host's
   * `onNavigate`, so a grid steps to the next cell. No-ops the async layer when unchanged, so an
   * editor that saves a typed value itself leaves (and moves) with `commit(value, move)`.
   */
  commit: (next: string, move?: EditableCellMove) => void;
  /** Leave edit mode without committing. */
  cancel: () => void;
}

/** A move in `onNavigate`'s terms: across is Tab, down and up are Enter. */
const NAVIGATION: Record<
  EditableCellMove,
  [direction: "next" | "previous", via: "tab" | "enter"]
> = {
  down: ["next", "enter"],
  up: ["previous", "enter"],
  right: ["next", "tab"],
  left: ["previous", "tab"],
};

/**
 * Which editor the cell opens. `text` edits in place via the internal text leaf;
 * `number` edits the same way with a decimal keyboard, shows `1,234 mm` (the value stays a string,
 * formatted with `toLocaleString`, the unit muted after it) and refuses a draft that is not a
 * number or falls outside `min`/`max` — the field stays open, `aria-invalid`, with the draft kept;
 * an empty draft commits `""`. `date` renders a ghost `DatePicker` whose calendar is the editor; the
 * value is an ISO calendar date (`"2026-10-08"`), shown with `Intl.DateTimeFormat`, and clearing it
 * commits `""`. `select` renders a `Select` whose popover is the editor; `custom` is the open
 * registry — any app editor (date, actor, currency, multi-select) plugs in by
 * rendering its own control against the same commit/cancel contract, starting from the `seed`
 * that opened it and committing with a `move` so a grid steps on (`EditableCellEditorProps`).
 */
export type EditableCellEditor =
  | {
      type: "text";
      placeholder?: string;
      /**
       * The most characters the value may hold (the field's `maxlength`). Typing stops there, a
       * paste keeps what fits and says so, and a quiet `n/max` count shows from 90% of it.
       */
      maxLength?: number;
    }
  | {
      type: "number";
      /** A unit shown muted after the value and inside the edit box, e.g. `"mm"`. */
      unit?: string;
      /** The smallest value that commits. */
      min?: number;
      /** The largest value that commits. */
      max?: number;
      /** The step the value is expected in; a draft off the step does not commit. */
      step?: number;
      placeholder?: string;
    }
  | {
      type: "date";
      /** Shown while no date is set. */
      placeholder?: string;
      /** How the date reads at rest. @default { year: "numeric", month: "short", day: "numeric" } */
      formatOptions?: Intl.DateTimeFormatOptions;
      /** The locale the date is formatted in. @default the user's */
      locale?: string;
      /** Offer a clear control that commits `""`. @default false */
      clearable?: boolean;
    }
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
   * move to the next or previous cell. `via` says which key did it, so a grid moves down on
   * <kbd>Enter</kbd> and across on <kbd>Tab</kbd>. A `custom` editor reaches it through
   * `commit(next, move)`.
   * @default undefined
   */
  onNavigate?: (direction: "next" | "previous", via: "tab" | "enter") => void;
  /**
   * The draft the text and number editors start from when a host opens them through `editing`,
   * instead of `value` — type-to-edit, where the printable key that opened the editor replaces the
   * value. A `custom` editor receives it as `seed`. Ignored by the `date` and `select` editors and
   * by a click or Enter open.
   * @default undefined
   */
  editSeed?: string;
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
   * The status before this cell mounted, for a host that mounts it in the middle of a change (a
   * grid's resting cell becoming the full one when its status moves): a move from it to
   * `status` is announced as a live change would be.
   * @default the first `status`
   */
  previousStatus?: AutoSaveStatus;
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
   * the lines above and below it (a page title over its description). The box (and its
   * hit area) extends into the gutter instead; the text does not move when the editor opens.
   * @default false
   */
  flush?: boolean;
  /**
   * What an EMPTY value shows at rest (text, number and `custom` editors). `""` shows nothing — a
   * grid's empty cells stay blank and the editor's placeholder appears only once the cell edits.
   * @default the editor's `placeholder`, else "Edit value"
   */
  emptyText?: string;
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
 * Number editor helpers
 * ----------------------------------------------------------------------------------------------*/

/** A typed number with its grouping (`1,234`, `1 234`) removed; `null` when it is not a number. */
function parseNumber(draft: string): number | null {
  const plain = draft.replace(/[\s,_]/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(plain)) return null;
  const n = Number(plain);
  return Number.isFinite(n) ? n : null;
}

/** `1234.5` → `1,234.5` in the reader's locale; a value that is not a number shows as typed. */
function formatNumber(value: string): string {
  const n = parseNumber(value);
  return n === null
    ? value
    : n.toLocaleString(undefined, { maximumFractionDigits: 20 });
}

/* ------------------------------------------------------------------------------------------------
 * InlineTextEditor — the click-to-edit text leaf (internal)
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by the internal text leaf. */
interface InlineTextEditorProps {
  /** The value to display, and the seed for the draft when an edit opens. */
  value: string;
  /**
   * Measure clipping when the pointer or focus arrives instead of observing it live — for a
   * grid host, which mounts a copy per cell on every scroll tick and has no use for the answer
   * until someone reaches for the value.
   */
  measureOnContact?: boolean;
  /** Called with the new (trimmed) value on commit, only when it actually changed. */
  onCommit: (value: string) => void;
  /** Placeholder for the field, and the muted display text when `value` is empty. */
  placeholder?: string;
  /** The display text when `value` is empty, over `placeholder` (`""`: nothing). */
  emptyText?: string;
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
  onNavigate?: (direction: "next" | "previous", via: "tab" | "enter") => void;
  /** The draft a host-driven open starts from (the cell's `editSeed`). */
  seed?: string;
  /** Native hover hint while displaying. */
  tooltip?: string;
  /**
   * No box padding (the `heading` variant): the text sits exactly where surrounding text would,
   * idle and editing alike, and only the text cursor marks it editable.
   */
  bare?: boolean;
  /** The field's `inputMode` (`decimal` for the number editor). */
  inputMode?: React.HTMLAttributes<HTMLElement>["inputMode"];
  /** Muted text after the value in both modes — the number editor's unit. */
  suffix?: string;
  /**
   * Checked before a commit: returning `false` keeps the field open with the draft and
   * `aria-invalid` set, and calls `onInvalid`.
   */
  validate?: (draft: string) => boolean;
  /** Called when a commit was refused by `validate`. */
  onInvalid?: (draft: string) => void;
  /** The field's `maxlength`: a count shows near it, and a paste cut to fit says so. */
  maxLength?: number;
  /** A paste was cut to fit `maxLength` (the cell announces it). */
  onClipped?: () => void;
}

/**
 * The shared box. Display and editor are the SAME element with the same padding and line box, so
 * entering or leaving edit moves nothing. No fill at rest, on hover or while editing — the text
 * cursor is the pointer affordance; only keyboard focus on the resting value shows base.css's
 * tint (FOC-13). No focus ring or outline.
 */
const boxClasses = "rounded-lg px-2.5 py-1.5";
/** The `heading` box: no padding, so a title is edited exactly where it is rendered. */
const bareBoxClasses = "rounded-sm";

/** The field laid over the text: no chrome, inherits every type property from the box. */
const fieldClasses =
  "absolute inset-0 block size-full max-w-none min-w-0 resize-none appearance-none overflow-hidden rounded-none border-0 bg-transparent [color:inherit] [font:inherit] [letter-spacing:inherit] [text-align:inherit] [text-transform:inherit] shadow-none outline-none placeholder:text-muted-foreground aria-invalid:text-destructive-text";

/**
 * The text leaf: a value rendered as plain text with a text cursor; click, <kbd>Enter</kbd> or
 * <kbd>F2</kbd> lays a borderless field over the same text. Blur saves, Enter (single-line) or
 * ⌘/Ctrl+Enter (multiline) saves, Escape cancels — all of it `useInlineEdit`, the hook this cell
 * also runs for its own mode state, so there is exactly one edit machine in the file.
 */
function InlineTextEditor(props: InlineTextEditorProps) {
  // `readOnly` folds into the hook's `disabled` because both mean the same thing to the machine:
  // an edit may not be entered, and one in flight reverts. They differ only in chrome.
  const edit = useInlineEdit({
    value: props.value,
    onCommit: props.onCommit,
    editing: props.editing,
    onEditingChange: props.onEditingChange,
    disabled: props.disabled || props.readOnly,
    multiline: props.multiline,
    seed: props.seed,
  });
  return <InlineTextBody {...props} edit={edit} />;
}

/**
 * The text leaf of a `custom` editor while it displays: the custom editor replaces it to edit,
 * so it never edits text itself and needs none of the text machine — only activation, which
 * raises the cell's edit state. A grid mounts one per editable cell on every scroll tick.
 */
function InlineTextDisplay(props: InlineTextEditorProps) {
  const { disabled, readOnly, onEditingChange } = props;
  const edit = React.useMemo<UseInlineEditResult>(
    () => ({
      isEditing: false,
      draft: props.value,
      setDraft: () => {},
      start: () => {
        if (!disabled && !readOnly) onEditingChange(true);
      },
      commit: () => {},
      cancel: () => {},
      setEditing: onEditingChange,
      editRef: () => {},
      displayRef: () => {},
      onKeyDown: () => {},
    }),
    [props.value, disabled, readOnly, onEditingChange],
  );
  return <InlineTextBody {...props} edit={edit} />;
}

function InlineTextBody({
  edit,
  value,
  placeholder,
  emptyText,
  label,
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
  inputMode,
  suffix,
  validate,
  onInvalid,
  maxLength,
  onClipped,
  measureOnContact = false,
}: InlineTextEditorProps & { edit: UseInlineEditResult }) {
  const box = bare ? bareBoxClasses : boxClasses;
  const isEditing = edit.isEditing;
  const wrapping = wrap || multiline;
  const textId = React.useId();

  const hasDisplayValue = value.length > 0;
  const name = label ?? placeholder ?? "value";
  const displayFallback = emptyText ?? placeholder ?? "Edit value";
  // A long single-line value truncates to its container; when it is actually clipped the full
  // value is offered as the display's `title` — and opening the editor shows all of it.
  // The text element: a ref for the handlers, and STATE only while it is observed — on contact
  // nothing re-renders for it, so a grid's newly mounted cell renders once, not twice.
  const textRef = React.useRef<HTMLSpanElement | null>(null);
  const [observedNode, setObservedNode] =
    React.useState<HTMLSpanElement | null>(null);
  const setTextNode = React.useCallback(
    (node: HTMLSpanElement | null) => {
      textRef.current = node;
      if (!measureOnContact) setObservedNode(node);
    },
    [measureOnContact],
  );
  const observed = useOverflow(measureOnContact ? null : observedNode, {
    deps: [value, wrapping],
    paused: measureOnContact,
  });
  // On contact the title is set by the time the browser would show it: it reads `title` on hover.
  const [contacted, setContacted] = React.useState(false);
  const probe = measureOnContact
    ? () => {
        if (textRef.current) setContacted(measureOverflow(textRef.current));
      }
    : undefined;
  // A new value under a resting pointer or focus is looked at again (an untouched cell is not).
  React.useEffect(() => {
    const textNode = textRef.current;
    if (!measureOnContact || !textNode) return;
    const host = textNode.parentElement ?? textNode;
    if (!host.matches(":hover") && !host.matches(":focus")) return;
    setContacted(measureOverflow(textNode));
  }, [measureOnContact, value]);
  const overflowing = measureOnContact ? contacted : observed;
  const truncated = !wrapping && !isEditing && overflowing && hasDisplayValue;
  const interactive = !readOnly && !isEditing;

  // A refused commit (the number editor's validation) keeps the field open with its draft.
  const [invalid, setInvalid] = React.useState(false);
  React.useEffect(() => {
    if (!isEditing) setInvalid(false);
  }, [isEditing]);
  const accepts = (draft: string) => {
    if (!validate || validate(draft.trim())) return true;
    setInvalid(true);
    onInvalid?.(draft.trim());
    return false;
  };

  const onFieldKeyDown = (event: React.KeyboardEvent) => {
    if (
      onNavigate &&
      !(event.nativeEvent?.isComposing || event.keyCode === 229)
    ) {
      const isTab = event.key === "Tab";
      const isEnter = event.key === "Enter" && !multiline;
      if (isTab || isEnter) {
        event.preventDefault();
        if (!accepts(edit.draft)) return;
        edit.commit();
        onNavigate(
          event.shiftKey ? "previous" : "next",
          isTab ? "tab" : "enter",
        );
        return;
      }
    }
    if (
      event.key === "Enter" &&
      (!multiline || event.metaKey || event.ctrlKey) &&
      !(event.nativeEvent?.isComposing || event.keyCode === 229) &&
      !accepts(edit.draft)
    ) {
      event.preventDefault();
      return;
    }
    edit.onKeyDown(event);
  };

  // `maxLength`: the count from 90% of it, and a paste that was cut to fit says so until the next
  // change (a paste's own change keeps it).
  const [clipped, setClipped] = React.useState(false);
  React.useEffect(() => {
    if (!isEditing) setClipped(false);
  }, [isEditing]);
  const counted =
    isEditing &&
    maxLength !== undefined &&
    (clipped || edit.draft.length >= maxLength * 0.9);
  const onDraftChange = (next: string) => {
    setClipped(false);
    edit.setDraft(next);
  };
  /**
   * A paste the field's `maxlength` cut short: measured once the browser has inserted what fit
   * (the next task), against the field as it now holds it. Engines differ on a single-line field's
   * line breaks (Chromium makes them spaces) and refuse half a surrogate pair at the limit, so a
   * break counts as one character and a field one short of the limit counts as full.
   */
  const onPaste = (
    event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (maxLength === undefined) return;
    const field = event.currentTarget;
    const kept =
      field.value.length -
      ((field.selectionEnd ?? 0) - (field.selectionStart ?? 0));
    const pasted = event.clipboardData
      .getData("text/plain")
      .replace(/\r\n?/g, "\n");
    setTimeout(() => {
      if (
        field.value.length >= maxLength - 1 &&
        field.value.length - kept < pasted.length
      ) {
        setClipped(true);
        onClipped?.();
      }
    }, 0);
  };

  const fieldProps = {
    "data-slot": "editable-cell-input",
    "aria-label": name === "value" ? "Edit value" : name,
    "aria-describedby": counted ? `${textId}-count` : undefined,
    value: edit.draft,
    placeholder,
    inputMode,
    maxLength,
    onPaste,
    "aria-invalid": invalid || undefined,
    onBlur: () => {
      if (accepts(edit.draft)) edit.commit();
    },
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
      aria-describedby={
        interactive && hasDisplayValue
          ? suffix
            ? `${textId} ${textId}-unit`
            : textId
          : undefined
      }
      title={truncated ? value : interactive ? tooltip : undefined}
      data-truncated={truncated ? "" : undefined}
      onPointerEnter={probe}
      onFocus={probe}
      onClick={
        interactive
          ? (event) => {
              // `cell`: only the text starts an edit; a click beside it bubbles on to the row.
              const textNode = textRef.current;
              if (fill && textNode && !textNode.contains(event.target as Node))
                return;
              // A click on a widget inside the value (a link chip) is the widget's: it opens
              // the link, it doesn't start an edit.
              const widget = (event.target as Element).closest(
                'a[href], button, [role="button"], [role="link"]',
              );
              if (
                widget &&
                widget !== event.currentTarget &&
                event.currentTarget.contains(widget)
              )
                return;
              event.stopPropagation();
              // The click's point puts the caret where it landed in the text.
              edit.start(event);
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (event) => {
              // A key on a widget inside the value (a link chip reached from a grid cell) is
              // the widget's own: Enter follows the link, it doesn't start an edit.
              if (event.target !== event.currentTarget) return;
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
        // its own: size, weight, line height and tracking come from the surroundings. Positioned
        // only then: at rest a grid holds hundreds of these, and each positioned box is a paint
        // layer of its own.
        "max-w-full min-w-0 items-center",
        isEditing && "relative",
        box,
        fill ? "flex w-full" : "inline-flex align-top",
        // `flush`: the box starts one padding-width before its slot, so the text starts on it.
        flush && !bare && "-ms-2.5 max-w-[calc(100%+0.625rem)]",
        // No fill at rest, on hover or while editing: the text cursor is the only pointer
        // affordance. Keyboard focus on the resting value keeps base.css's focus tint (FOC-13) —
        // the one cue a keyboard user has; a click goes straight to the transparent field.
        interactive && !disabled && "cursor-text",
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
      {/* The unit follows the text in both modes. While editing it sits under the transparent
          field, right after the invisible sizer that holds the draft — so it trails the caret. */}
      {suffix && (isEditing || hasDisplayValue) ? (
        <span
          id={`${textId}-unit`}
          data-slot="editable-cell-unit"
          aria-hidden={isEditing ? true : undefined}
          className="shrink-0 ps-1 whitespace-pre text-muted-foreground"
        >
          {suffix}
        </span>
      ) : null}
      {isEditing ? (
        wrapping ? (
          <textarea
            ref={edit.editRef}
            rows={1}
            {...fieldProps}
            onChange={(event) => onDraftChange(event.target.value)}
          />
        ) : (
          <input
            ref={edit.editRef}
            type="text"
            {...fieldProps}
            onChange={(event) => {
              onDraftChange(event.target.value);
              if (invalid && validate?.(event.target.value.trim()))
                setInvalid(false);
            }}
          />
        )
      ) : null}
      {counted ? (
        // Under the box, over what follows, as wide as the box: nothing moves when it shows and it
        // never leaves the box's side. The count is the field's description; a paste cut to fit
        // is announced by the cell.
        <span
          id={`${textId}-count`}
          data-slot="editable-cell-count"
          className="pointer-events-none absolute inset-x-0 top-full z-10 mt-1 font-sans text-xs font-normal text-end text-pretty wrap-anywhere text-muted-foreground tabular-nums"
        >
          {edit.draft.length}/{maxLength}
          {clipped ? ` · Only the first ${maxLength} characters fit` : null}
        </span>
      ) : null}
    </span>
  );
}

function formatIsoDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale?: string,
): string {
  const date = parseCalendarDay(value);
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : value;
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
  previousStatus,
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
  editSeed,
  tooltip,
  wrap = false,
  flush = false,
  emptyText,
  className,
  ref,
}: EditableCellProps) {
  const save = onSave ?? onCommit;
  // Edit mode comes from the shared inline-edit machine (audit B9-06) — its MODE half, which the
  // text leaf's `useInlineEdit` runs on too, so `text`, `select` and `custom` editors all resolve
  // controlled-vs-internal `editing` one way. This cell's editors commit through `handleCommit`
  // below, which owns the optimistic layer the machine knows nothing about.
  const { isEditing, setEditing: setEditingState } = useInlineEditMode({
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
  // Inside a grid the status is spoken through the grid's one region (`AnnouncerScope`).
  const { announce: setAnnouncement, Announcer } = useAnnouncer({
    scoped: true,
  });
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
  const previousStatusProp = React.useRef(previousStatus ?? statusProp);
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
          variant="ghost"
          aria-label={label}
          tabIndex={managed ? -1 : undefined}
          className={cn(
            INLINE_EDIT_TINT,
            variant === "cell" ? "w-full" : "w-fit",
            "min-w-0",
          )}
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
  } else if (editor.type === "date" && !readOnly) {
    // The DatePicker popover IS the editor, like `select`: Enter or Space opens the calendar, the
    // arrow keys move the day, Enter commits and Escape cancels — all owned by the picker.
    editorSurface = (
      <DatePicker
        size="sm"
        variant="ghost"
        value={parseCalendarDay(displayValue)}
        onValueChange={(date) => handleCommit(date ? toCalendarDay(date) : "")}
        placeholder={editor.placeholder}
        formatOptions={editor.formatOptions}
        locale={editor.locale}
        clearable={editor.clearable}
        disabled={disabled}
        aria-label={label}
        renderValue={
          renderValue ? (date) => renderValue(toCalendarDay(date)) : undefined
        }
        className={cn(
          INLINE_EDIT_TINT,
          variant === "cell" && !editor.clearable ? "w-full" : "w-fit",
          // Shrinks so a slow save's spinner fits beside a full-width trigger.
          "min-w-0 shrink",
        )}
      />
    );
  } else if (editor.type === "custom" && isEditing) {
    editorSurface = editor.render({
      value: displayValue,
      seed: editSeed,
      commit: (next, move) => {
        handleCommit(next);
        if (move) onNavigate?.(...NAVIGATION[move]);
      },
      cancel: cancelEdit,
    });
  } else {
    // `text` in both modes; `custom` while displaying. For `custom`, the text leaf stays in
    // display mode (`editing={false}`) and its activation only raises our edit state.
    const isCustom = editor.type === "custom";
    const number = editor.type === "number" ? editor : null;
    // A READ-ONLY select cell reads the option's LABEL, like the editable one (2026-09-09).
    const displayText =
      editor.type === "select"
        ? (editor.options.find((option) => option.value === displayValue)
            ?.label ?? displayValue)
        : editor.type === "date"
          ? formatIsoDate(displayValue, editor.formatOptions, editor.locale)
          : displayValue;
    const TextLeaf = isCustom ? InlineTextDisplay : InlineTextEditor;
    editorSurface = (
      <TextLeaf
        value={displayText}
        label={label}
        emptyText={emptyText}
        placeholder={
          editor.type === "text" || editor.type === "number"
            ? editor.placeholder
            : undefined
        }
        onCommit={
          number
            ? (next) => {
                const n = parseNumber(next);
                handleCommit(next === "" || n === null ? "" : String(n));
              }
            : handleCommit
        }
        inputMode={number ? "decimal" : undefined}
        maxLength={editor.type === "text" ? editor.maxLength : undefined}
        onClipped={() =>
          setAnnouncement(
            `Only the first ${editor.type === "text" ? editor.maxLength : ""} characters fit`,
          )
        }
        suffix={number?.unit}
        validate={
          number
            ? (draft) => {
                if (draft === "") return true;
                const n = parseNumber(draft);
                if (n === null) return false;
                if (number.min !== undefined && n < number.min) return false;
                if (number.max !== undefined && n > number.max) return false;
                if (number.step !== undefined && number.step > 0) {
                  const steps = (n - (number.min ?? 0)) / number.step;
                  if (Math.abs(steps - Math.round(steps)) > 1e-9) return false;
                }
                return true;
              }
            : undefined
        }
        onInvalid={
          number
            ? () =>
                setAnnouncement(
                  number.min !== undefined && number.max !== undefined
                    ? `Enter a number from ${number.min} to ${number.max}`
                    : number.min !== undefined
                      ? `Enter a number of at least ${number.min}`
                      : number.max !== undefined
                        ? `Enter a number of at most ${number.max}`
                        : "Enter a number",
                )
            : undefined
        }
        editing={isCustom ? false : isEditing}
        onEditingChange={(next) => {
          if (next) setEditingState(true);
          else if (!isCustom) setEditingState(false);
        }}
        tabIndex={managed ? -1 : 0}
        disabled={disabled}
        readOnly={readOnly}
        display={
          renderValue && displayValue ? (
            renderValue(displayValue)
          ) : number && displayValue ? (
            <span className="tabular-nums">{formatNumber(displayValue)}</span>
          ) : undefined
        }
        wrap={wrap || variant === "heading"}
        multiline={multiline}
        fill={variant === "cell"}
        flush={flush}
        onNavigate={onNavigate}
        seed={editSeed}
        tooltip={tooltip}
        bare={variant === "heading"}
        measureOnContact={managed}
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

/** Props for {@link EditableCellRest}. */
export interface EditableCellRestProps {
  /** The persisted value, as text. */
  value: string;
  /** The field's name, for the display's accessible name ("Edit Stage"). @default "value" */
  label?: string;
  /** Renders a non-empty value (tags, chips, avatars) instead of its text. @default undefined */
  renderValue?: (value: string) => React.ReactNode;
  /** The reader asked to edit: a click on the value, or Enter, F2 or Space on the display. */
  onStartEditing: () => void;
  /**
   * What an empty value shows (`""`: nothing), as `EditableCell`'s `emptyText`.
   * @default "Edit value"
   */
  emptyText?: string;
  /** Extra classes for the root. @default undefined */
  className?: string;
  /** The display element (a callback ref may return a cleanup). @default undefined */
  ref?: React.Ref<HTMLSpanElement>;
}

// The resting display of a managed, inline `custom` EditableCell, class for class (the full cell
// also wraps it in a root span, for its status spinner and live region).
const REST_CLASS = cn(
  "max-w-full min-w-0 items-center",
  boxClasses,
  "inline-flex align-top",
  "cursor-text",
);
const REST_TEXT_CLASS = cn(
  "min-w-0",
  "truncate in-data-squeezed:wrap-anywhere in-data-squeezed:whitespace-normal",
);
const REST_TEXT_EMPTY_CLASS = cn(REST_TEXT_CLASS, "text-muted-foreground");

/** Whether the value is clipped, published the way the full cell publishes it: as the title. */
function probeRest(display: HTMLElement, value: string) {
  const text = display.firstElementChild as HTMLElement | null;
  const truncated = value.length > 0 && text != null && measureOverflow(text);
  if (truncated) {
    display.setAttribute("title", value);
    display.setAttribute("data-truncated", "");
  } else {
    display.removeAttribute("title");
    display.removeAttribute("data-truncated");
  }
}

/**
 * `EditableCellRest` — a grid-managed `EditableCell` with a `custom` editor, at rest: the same
 * display button and value, name, description and activation, and nothing else. No state machine,
 * no effect, no live region: a grid mounts dozens of cells per scroll tick, and only the cell
 * being edited (or still saving) needs `EditableCell` itself. A clipped value gets its title when
 * the pointer or focus reaches it, as the full cell's does.
 *
 * @example
 * editing ? (
 *   <EditableCell focusMode="managed" editing editor={editor} value={value} label="Stage" />
 * ) : (
 *   <EditableCellRest value={value} label="Stage" onStartEditing={() => setEditing(true)} />
 * )
 */
export function EditableCellRest({
  value,
  label,
  renderValue,
  onStartEditing,
  emptyText = "Edit value",
  className,
  ref: forwardedRef,
}: EditableCellRestProps) {
  const id = React.useId();
  const hasDisplayValue = value.length > 0;
  // A new value under a resting pointer or focus, or one that was clipped, is looked at again.
  const ref = React.useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) return;
      if (
        node.hasAttribute("title") ||
        node.matches(":hover") ||
        node.matches(":focus")
      )
        probeRest(node, value);
    },
    [value],
  );
  const displayRef = React.useMemo(
    () => (forwardedRef ? mergeRefs(ref, forwardedRef) : ref),
    [ref, forwardedRef],
  );
  const probe = (event: React.SyntheticEvent<HTMLSpanElement>) =>
    probeRest(event.currentTarget, value);
  return (
    <span
      ref={displayRef}
      data-slot="editable-cell-display"
      data-variant="inline"
      data-rest=""
      role="button"
      tabIndex={-1}
      aria-label={`Edit ${label ?? "value"}`}
      aria-describedby={hasDisplayValue ? id : undefined}
      onPointerEnter={probe}
      onFocus={probe}
      onClick={(event) => {
        // A click on a widget inside the value (a link chip) is the widget's: it opens the
        // link, it doesn't start an edit.
        const widget = (event.target as Element).closest(
          'a[href], button, [role="button"], [role="link"]',
        );
        if (
          widget &&
          widget !== event.currentTarget &&
          event.currentTarget.contains(widget)
        )
          return;
        event.stopPropagation();
        onStartEditing();
      }}
      onKeyDown={(event) => {
        // A key on a widget inside the value is the widget's own.
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === "F2" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onStartEditing();
        }
      }}
      className={className ? cn(REST_CLASS, className) : REST_CLASS}
    >
      <span
        id={id}
        data-slot="editable-cell-text"
        className={hasDisplayValue ? REST_TEXT_CLASS : REST_TEXT_EMPTY_CLASS}
      >
        {hasDisplayValue
          ? renderValue
            ? renderValue(value)
            : value
          : emptyText}
      </span>
    </span>
  );
}
