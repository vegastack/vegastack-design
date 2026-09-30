// @vegastack text-edit@0.23.82 sha256-GzltQbmbpcEUJb0NOrKCofEzx/8mBYHk6Zd1xee8Cgo=

"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn, mergeRefs, proseClassName } from "@vegastack/design";
import { MarkdownView, type MentionKind } from "@/components/ui/markdown-view";
import type { TextAnchor } from "@/lib/text-anchor";

export type { MentionKind } from "@/components/ui/markdown-view";
export type { TextAnchor } from "@/lib/text-anchor";

/* ------------------------------------------------------------------------------------------------
 * Slash commands
 * ----------------------------------------------------------------------------------------------*/

/** A block the `/` menu can insert. */
export type TextEditSlashCommand =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "callout"
  | "toggle"
  | "codeBlock"
  | "table"
  | "image"
  | "file"
  | "divider"
  | "link";

/**
 * Every slash command, in menu order — the default `slashCommands`. `file` shows only when
 * `onFileUpload` is set.
 */
export const TEXT_EDIT_SLASH_COMMANDS: readonly TextEditSlashCommand[] = [
  "text",
  "h1",
  "h2",
  "h3",
  "h4",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "callout",
  "toggle",
  "codeBlock",
  "table",
  "image",
  "file",
  "divider",
  "link",
];

/** A smaller set for comments and replies: lists, a quote, code and links — no headings. */
export const TEXT_EDIT_COMPACT_SLASH_COMMANDS: readonly TextEditSlashCommand[] =
  ["bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "link"];

/* ------------------------------------------------------------------------------------------------
 * Mentions, uploads, outline, comment anchors
 * ----------------------------------------------------------------------------------------------*/

/** One result the `@` menu offers. */
export interface MentionOption {
  /** What it is: a person, a page, a file or a task. */
  kind: MentionKind;
  /** The target's id — written into the Markdown as `mention://<kind>/<id>`. */
  id: string;
  /** The name shown in the menu and on the chip. */
  label: string;
  /**
   * A second, muted line of context (an email, a folder, a status).
   * @default undefined
   */
  description?: string;
  /**
   * Replaces the kind's icon in the menu (a page's emoji, a person's avatar).
   * @default undefined
   */
  icon?: React.ReactNode;
}

/** The `@` menu's source: which kinds it offers, and the search behind it. */
export interface TextEditMentions {
  /** The kinds the menu offers, grouped in the order People · Pages · Files · Tasks. */
  kinds: readonly MentionKind[];
  /**
   * Results for what follows the `@` (debounced 150ms). The signal aborts when the query
   * changes; the menu shows at most five per kind.
   */
  search: (
    query: string,
    options: { signal: AbortSignal },
  ) => Promise<MentionOption[]>;
}

/** What an image upload resolves to: the image's final URL (and optional alt text and size). */
export interface TextEditImageUpload {
  /** The uploaded image's URL, written into the Markdown as `![alt](src)`. */
  src: string;
  /** Alt text for the image.
   * @default undefined */
  alt?: string;
  /** Intrinsic width in px (HTML format only; Markdown has no size).
   * @default undefined */
  width?: number;
  /** Intrinsic height in px (HTML format only).
   * @default undefined */
  height?: number;
}

/** What a file upload resolves to: a link inserted as `[name](href)`, shown as a file chip. */
export interface TextEditFileUpload {
  /** The file's URL; one starting with `fileLinkPrefix` renders as a file chip. */
  href: string;
  /** The link text — the file's name. */
  name: string;
}

/** One heading in the document's outline. */
export interface TextEditOutlineItem {
  /** The heading's element id — its words, hyphenated, `-1`, `-2`… for a repeat. */
  id: string;
  /** `#` to `####`. */
  level: 1 | 2 | 3 | 4;
  /** The heading's text; a mention reads as `@label`. */
  text: string;
}

/** A comment's highlight: its id and where it sits in the text. */
export interface TextEditAnnotation {
  /** The comment (thread) id — the highlight's `data-annotation`. */
  id: string;
  /** Where it sits, as stored (`anchorFromRange` / `onAnnotationsLayout`). */
  anchor: TextAnchor;
  /**
   * How many comments the thread holds — the number on its count pill (`annotationCounts`) and in
   * its accessible name. Absent (or below 1) counts as 1.
   * @default undefined
   */
  count?: number;
}

/** Where a highlight sits now, for laying out comments beside the text. */
export interface TextEditAnnotationLayout {
  /** The annotation's id. */
  id: string;
  /** The highlight's top edge, in px from the TextEdit root's top; null when orphaned. */
  top: number | null;
  /** The highlight's current anchor (persist it when it moved); null when orphaned. */
  anchor: TextAnchor | null;
}

/** The imperative handle `handleRef` receives. */
export interface TextEditHandle {
  /** Scroll the heading with this outline id into view. */
  scrollToHeading: (id: string) => void;
  /** Commit pending edits now (before a comment is created, before navigating); resolves once uploads in flight have landed. */
  flush: () => Promise<void>;
  /** Move focus into the editor. */
  focus: () => void;
  /** The anchor of the current selection, or null when nothing is selected. */
  getAnchorForSelection: () => TextAnchor | null;
  /** Pulse an annotation's highlight for 3 seconds and scroll it into view. */
  pulseAnnotation: (id: string) => void;
  /**
   * The host has saved the current document: advance the baseline Escape reverts to (and a commit
   * compares against) to it, so a later `escapeBehavior="revert"` never restores older text.
   */
  markSaved: () => void;
}

/* ------------------------------------------------------------------------------------------------
 * Styling — shared by the read view below and the editor (`text-edit-editor.tsx`)
 * ----------------------------------------------------------------------------------------------*/

/**
 * The editor surface (ProseMirror's `.tiptap` root) wears the shared `prose` recipe — the SAME
 * string `MarkdownView` puts on its root — so edited and rendered markdown are one typography.
 * Added here: no outline, no border and NO fill in any state — the caret is the focus cue
 * (`data-focus-cue="caret"`); the placeholder as a faint zero-height pseudo-element (no reflow on
 * the first keystroke), which becomes the "Type / for commands" hint while focused; the table
 * scroll box, the selected-cell wash and the column-resize line; and the selected-node wash
 * `MarkdownView` has no equivalent of.
 */
const editorBaseClassName = cn(
  proseClassName,
  "tiptap min-h-6 min-w-0 max-w-full outline-none",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground/60 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
  "[&_.tableWrapper]:my-2 [&_.tableWrapper]:w-full [&_.tableWrapper]:max-w-full [&_.tableWrapper]:overflow-x-auto [&_.selectedCell]:bg-accent",
  // Column resizing (editable only): a thin primary line on the hovered column border, and the
  // resize cursor while the pointer is on it.
  "[&_td]:relative [&_th]:relative [&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:-inset-y-px [&_.column-resize-handle]:-end-px [&_.column-resize-handle]:w-0.5 [&_.column-resize-handle]:bg-primary/50 [&.resize-cursor]:cursor-col-resize",
  "[&_.ProseMirror-selectednode]:rounded-sm [&_.ProseMirror-selectednode]:bg-accent",
);

/** While focused and empty, the placeholder yields to the slash hint. */
const slashHintClassName =
  "[&.ProseMirror-focused_p.is-editor-empty:first-child]:before:content-['Type_/_for_commands']";

/* ------------------------------------------------------------------------------------------------
 * Field bridge
 * ----------------------------------------------------------------------------------------------*/

function toCssLength(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function isAriaInvalid(value: React.AriaAttributes["aria-invalid"]): boolean {
  return value !== undefined && value !== false && value !== "false";
}

function toAriaInvalidAttribute(
  value: React.AriaAttributes["aria-invalid"],
): string | undefined {
  if (!isAriaInvalid(value)) return undefined;
  return value === true ? "true" : String(value);
}

/** The ARIA wiring an enclosing `Field` resolved for the editor (see `FieldControlBridge`). */
interface FieldAria {
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  disabled?: boolean;
}

/**
 * DS-47: renders nothing, and reports the props Base UI's `Field.Control` resolved so `TextEdit`
 * can put them on its editable surface (the read view, then the contenteditable Tiptap creates),
 * which cannot itself BE the control element.
 */
function FieldControlBridge({
  control,
  onResolve,
}: {
  control: FieldAria;
  onResolve: (aria: FieldAria) => void;
}) {
  const {
    id,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    disabled,
  } = control;
  React.useLayoutEffect(() => {
    onResolve({
      id,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      "aria-invalid": invalid,
      disabled,
    });
  }, [id, labelledBy, describedBy, invalid, disabled, onResolve]);
  return null;
}

/* ------------------------------------------------------------------------------------------------
 * The lazily loaded editor
 * ----------------------------------------------------------------------------------------------*/

type EditorModule = typeof import("@/components/ui/text-edit-editor");

let editorLoad: Promise<EditorModule> | undefined;
/** True once the module is here: a `TextEdit` mounted after that swaps its editor in at once. */
let editorLoaded = false;

/** Fetch the editor module once. Safe to call on every hover and focus; a failed load retries. */
function loadEditor(): Promise<EditorModule> {
  editorLoad ??= import("@/components/ui/text-edit-editor").then(
    (module) => {
      editorLoaded = true;
      return module;
    },
    (error: unknown) => {
      editorLoad = undefined;
      throw error;
    },
  );
  return editorLoad;
}

/**
 * `preloadTextEdit` — start loading the editor now, instead of on the first hover, focus or tap.
 * Once it has loaded, every `TextEdit` mounted afterwards swaps its editor in right after its
 * first paint. Call it where editing is about to start (a "New" dialog opening); a no-op on the
 * server.
 *
 * @example
 * <Button onPointerEnter={() => void preloadTextEdit()}>New task</Button>
 */
export function preloadTextEdit(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return loadEditor().then(() => undefined);
}

function prefetchEditor() {
  void loadEditor().catch(() => {});
}

const LazyEditor = React.lazy(() =>
  loadEditor().then((module) => ({ default: module.TextEditEditor })),
);

/** Where the caret goes once the editor is in: the clicked point, or an end of the document. */
type Intent = { x: number; y: number; checkbox: boolean } | "start" | "end";

/** Whether a saved value holds nothing to show. */
function isEmptyDocument(source: string, html: boolean): boolean {
  if (!html) return source.trim() === "";
  return (
    !/<(img|hr|table)\b/i.test(source) &&
    source.replace(/<[^>]*>|&nbsp;/g, "").trim() === ""
  );
}

/* ------------------------------------------------------------------------------------------------
 * TextEdit
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `TextEdit`. */
export interface TextEditProps {
  /**
   * What `value`, `defaultValue` and `onValueChange` carry: HTML, or Markdown (CommonMark + GFM
   * through `@tiptap/markdown`, lossless for headings, lists, tasks, code, links, images, quotes
   * and tables). Fixed for the editor's life.
   * @default "html"
   */
  format?: "html" | "markdown";
  /**
   * Controlled value. Synced into the editor when it changes externally and the editor is not
   * focused — a change that arrives while focused is applied on blur, so the caret never jumps.
   * @default undefined
   */
  value?: string;
  /**
   * Uncontrolled initial content, used only on first render. Ignored when `value` is provided.
   * @default ''
   */
  defaultValue?: string;
  /**
   * Called with the serialized document whenever it changes.
   * @default undefined
   */
  onValueChange?: (value: string) => void;
  /**
   * Shown, faint, in the first line while the document is empty — "Add a description…", "Add a
   * summary…", "Add a comment…". While focused and still empty it becomes the "Type / for
   * commands" hint (when any slash command is allowed).
   * @default undefined
   */
  placeholder?: string;
  /**
   * The blocks the `/` menu offers, in order. `[]` turns the menu off. Markdown typed or pasted
   * for any block still works — this limits the menu, not the schema.
   * @default TEXT_EDIT_SLASH_COMMANDS (all)
   */
  slashCommands?: readonly TextEditSlashCommand[];
  /**
   * Show the hover chrome: the ⋮⋮ drag handle beside the hovered block, and a table's row and
   * column grips (menus, drag to reorder), corner grip and "+" bars. Turn it off where the editor
   * sits in a tight box (comments). ⌘⇧↑ / ⌘⇧↓ move blocks and Tab / ⇧Tab move between cells either way.
   * @default true
   */
  dragHandles?: boolean;
  /**
   * Called with the serialized document when an edit is committed: focus leaves the editor with a
   * document that differs from the one focus arrived with, the page is hidden, the editor
   * unmounts mid-edit, or `autosave` fires. One commit path — a value is never committed twice.
   * @default undefined
   */
  onCommit?: (value: string) => void;
  /**
   * Called after Escape reverts the document to what it was when focus arrived and blurs the
   * editor (`escapeBehavior="revert"`). Nothing is committed.
   * @default undefined
   */
  onRevert?: () => void;
  /**
   * What Escape does. `"revert"` restores the document as focus found it (or as the last
   * `markSaved()` left it), blurs and calls `onRevert` — right for a field edited then confirmed.
   * `"blur"` keeps the text, commits it and blurs — right for a document that saves as you type,
   * where reverting would erase text already saved. Defaults to `"blur"` whenever `autosave` is
   * set, `"revert"` otherwise.
   * @default autosave ? "blur" : "revert"
   */
  escapeBehavior?: "revert" | "blur";
  /**
   * Fired on Cmd/Ctrl+Enter with the serialized document (send a comment, create the record).
   * Without it, Cmd/Ctrl+Enter commits and blurs.
   * @default undefined
   */
  onSubmit?: (value: string) => void;
  /**
   * Also call `onCommit` after this many milliseconds without typing (`true` is 1000ms).
   * @default false
   */
  autosave?: boolean | number;
  /**
   * Mark the editor busy (`aria-busy`) while the host persists a commit.
   * @default false
   */
  saving?: boolean;
  /**
   * Render the document without letting it be edited; the surface reports `aria-readonly`.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Disable the editor: the surface reports `aria-disabled`, and the root dims.
   * @default false
   */
  disabled?: boolean;
  /**
   * Minimum height of the editable content area (a number is `px`).
   * @default undefined
   */
  minHeight?: number | string;
  /**
   * Maximum height of the editable content area; it grows with its text up to this, then scrolls
   * inside.
   * @default undefined
   */
  maxHeight?: number | string;
  /** Accessible label for the editable region.
   * @default undefined
   */
  "aria-label"?: string;
  /** `id` applied to the contenteditable surface.
   * @default undefined
   */
  id?: string;
  /** Id(s) of the element(s) that label the editable region.
   * @default undefined
   */
  "aria-labelledby"?: string;
  /** Marks the textbox invalid.
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /** Id(s) of helper or error text describing the editor.
   * @default undefined
   */
  "aria-describedby"?: string;
  /**
   * The editor's chrome and focus cue. `document` is the Notion-style page editor (a task
   * description, a meeting summary): no border and no fill in any state, the caret is the focus
   * cue. `boxed` frames the editor in a bordered field (a comment composer): the border darkens
   * subtly with a 150ms ease while the editor holds focus, an invalid box keeps its destructive
   * border, and a click anywhere in the box starts editing. Neither mode paints a focus fill.
   * @default "document"
   */
  variant?: "document" | "boxed";
  /**
   * Rendered inside the box, after the document — a composer's actions row. Meant for
   * `variant="boxed"`.
   * @default undefined
   */
  children?: React.ReactNode;
  /** Additional class names on the editor container.
   * @default undefined
   */
  className?: string;
  /** Ref forwarded to the editor's root container `<div>`.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * `@` mentions (Markdown format): typing `@` after a space or at a line start opens a menu of
   * people, pages, files and tasks from `search`. A pick becomes a chip stored as
   * `[@<label>](mention://<kind>/<id>)`.
   * @default undefined
   */
  mentions?: TextEditMentions;
  /**
   * Where a mention chip links, by kind and id; ⌘/Ctrl-click opens it while editing. People are
   * never links, and neither is a `restricted:` id (a target the reader may not open).
   * @default undefined
   */
  mentionHref?: (kind: MentionKind, id: string) => string | null;
  /**
   * Upload an image pasted, dropped or picked (the image panel's Upload, the slash menu's Image).
   * It shows dimmed under a spinner until the promise resolves with its URL, then commits — even
   * after focus has left. A rejection removes it and calls `onUploadError`.
   * @default undefined
   */
  onImageUpload?: (
    file: File,
    options: { signal: AbortSignal },
  ) => Promise<TextEditImageUpload>;
  /**
   * Upload any other file dropped, pasted or picked (the slash menu's File): it lands as a link
   * `[name](href)`, shown as a file chip. Without it, non-image files are ignored.
   * @default undefined
   */
  onFileUpload?: (
    file: File,
    options: { signal: AbortSignal },
  ) => Promise<TextEditFileUpload>;
  /**
   * Called when an upload rejects (its placeholder is already gone) — show a toast.
   * @default undefined
   */
  onUploadError?: (file: File, error: unknown) => void;
  /**
   * A link whose href starts with this renders as a file chip, here and in `MarkdownView`.
   * @default "/api/files/"
   */
  fileLinkPrefix?: string;
  /**
   * The document's headings (`#`–`####`) with stable ids, after load and 150ms after each change —
   * an outline rail. Setting it mounts the editor at once.
   * @default undefined
   */
  onOutlineChange?: (headings: TextEditOutlineItem[]) => void;
  /**
   * The imperative handle: `scrollToHeading`, `flush`, `focus`, `getAnchorForSelection`,
   * `pulseAnnotation`.
   * @default undefined
   */
  handleRef?: React.Ref<TextEditHandle>;
  /**
   * Comment highlights, drawn as decorations over their anchored text (never written into the
   * document), and kept on the same words while the text around them changes. Setting it mounts
   * the editor at once — read-only too, where the highlights still draw.
   * @default undefined
   */
  annotations?: readonly TextEditAnnotation[];
  /**
   * The annotation shown as active: its highlight fills.
   * @default null
   */
  activeAnnotationId?: string | null;
  /**
   * Called with an annotation's id to open its thread: a click on its highlight or its count pill,
   * and from the keyboard — in view mode (`readOnly`) each highlight is a tab stop (a button named
   * by `annotationLabel`) that opens on Enter or Space; while editing, a highlight is never a tab
   * stop (it would steal the caret and Tab), so Alt+Enter with the caret inside or at either end
   * of a highlight opens it. Without it, highlights are neither tab stops nor buttons.
   * @default undefined
   */
  onAnnotationClick?: (id: string) => void;
  /**
   * Called with an annotation's id after the pointer rests on its highlight for 250ms, and with
   * `null` when it leaves.
   * @default undefined
   */
  onAnnotationHover?: (id: string | null) => void;
  /**
   * Adds "Comment" to the selection bubble (read-only too; never in code blocks) and calls this
   * with the selection's anchor.
   * @default undefined
   */
  onCreateAnnotation?: (anchor: TextAnchor) => void;
  /**
   * Each annotation's highlight top (px from this root's top; null when orphaned) and its current
   * anchor — for laying comments beside the text and persisting moved anchors. Called once per
   * frame when anything changed.
   * @default undefined
   */
  onAnnotationsLayout?: (items: TextEditAnnotationLayout[]) => void;
  /**
   * A count pill after each highlight (not orphaned ones), showing its `count` — where the text
   * shows comments without hover or a margin. `auto` shows it only on a coarse pointer or below
   * the `lg` breakpoint (CSS only); `always` everywhere; `never` renders none. The pill is a
   * widget (`contenteditable=false`, never in the document or its Markdown, never copied) with a
   * 24px hit area, a button that calls `onAnnotationClick` without moving the caret, and follows
   * the active highlight (`data-active`). It is not a tab stop: the highlight (view mode) or
   * Alt+Enter (editing) is the keyboard path.
   * @default "never"
   */
  annotationCounts?: "never" | "auto" | "always";
  /**
   * A view-mode highlight's accessible name, from its quoted text and `count`.
   * @default (quote, count) => count > 1 ? `${count} comments on “${quote}”` : `Comment on “${quote}”`
   */
  annotationLabel?: (quote: string, count: number) => string;
  /**
   * The count pill's accessible name (the visible number is `aria-hidden`).
   * @default (count) => count === 1 ? "1 comment" : `${count} comments`
   */
  annotationCountLabel?: (count: number) => string;
}

/**
 * `TextEdit` — a Tiptap v3 markdown-first rich-text editor, Notion-style: no toolbar, no border, no
 * ring and no fill in any state — the caret is the focus cue. `variant="boxed"` frames it in a
 * bordered field whose border darkens subtly while it holds focus (the comment composer). The
 * surface wears the shared `prose` recipe — the same string `MarkdownView` renders with — so an
 * idle editor looks exactly like rendered markdown. Click anywhere and type.
 *
 * - **Light first paint** — the saved document renders as plain read HTML (`MarkdownView`, on the
 *   server too), in the editor's exact typography and still editable to the touch. The editor
 *   (Tiptap, ~180 KB) loads only on intent — a hover, a focus or a tap — and swaps in place before
 *   the next paint, with the caret where the click landed and anything typed meanwhile kept.
 *   `readOnly` and `disabled` never load it.
 * - **Slash menu** — `/` opens a filterable block menu (↑↓, Enter, Esc): text, H1–H4, lists, a
 *   checklist, quote, code block, table, image, divider, link. `slashCommands` limits it.
 * - **Bubble menu** — a selection offers "Turn into", bold, italic, strike, inline code, link
 *   (edit, open, remove) and clear formatting. Every menu floats in a `<body>` portal and flips
 *   to stay in view, so no overflow container clips it.
 * - **Tables** — Notion's simple table: bordered, rounded, a muted header row. Hover a row or column
 *   for its ⠿ grip — click for its menu (insert, move, duplicate, clear, delete), drag to reorder;
 *   the corner grip selects the table (header toggles in HTML, delete); "+" bars add a row or column
 *   at the end; drag a column border to resize. Tab / ⇧Tab move between cells (Tab in the last cell
 *   adds a row), ⇧F10 opens the menu from the keyboard, and a fully selected table deletes with ⌫.
 * - **Blocks** — a ⋮⋮ handle drags any block (and any list item) to a new place; ⌘⇧↑ / ⌘⇧↓ too.
 * - **Markdown** — input rules (`#`–`####`, `- `, `* `, `1. `, `[ ] `, `> `, ```` ```lang ````,
 *   `---`, `**`, `*`, `_`, `~~`, `` ` ``), ⌘B / ⌘I / ⌘E / ⇧⌘X / ⌘K / ⌘⇧7·8·9, markdown and URL
 *   paste, sanitized HTML paste, and a lossless round-trip with `format="markdown"`.
 * - **Commit** — `onCommit(value)` when focus leaves with a change (and on hide, unmount and
 *   `autosave`); Escape reverts and calls `onRevert`; Cmd/Ctrl+Enter calls `onSubmit`.
 * - **Comments** — `annotations` draw highlights (and, with `annotationCounts`, a count pill after
 *   each). Read-only, each highlight is a tab stop that Enter opens; while editing, Alt+Enter with
 *   the caret in a highlight opens it — both call `onAnnotationClick`.
 *
 * @example
 * <TextEdit format="markdown" defaultValue={md} onCommit={save} placeholder="Add a description…" aria-label="Description" />
 */
export function TextEdit(props: TextEditProps) {
  const {
    format = "html",
    value,
    defaultValue = "",
    placeholder,
    slashCommands = TEXT_EDIT_SLASH_COMMANDS,
    saving = false,
    readOnly = false,
    disabled: disabledProp = false,
    minHeight,
    maxHeight,
    "aria-label": ariaLabel,
    id,
    "aria-labelledby": ariaLabelledBy,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    variant = "document",
    children,
    className,
    ref,
    handleRef,
    ...editorProps
  } = props;
  // Highlights and an outline need the document model, so they mount the editor at once.
  const eager =
    props.annotations !== undefined || props.onOutlineChange !== undefined;
  const boxed = variant === "boxed";
  const [field, setField] = React.useState<FieldAria>({});
  const disabled = disabledProp || field.disabled === true;
  const editable = !readOnly && !disabled;
  const resolvedId = field.id ?? id;
  const ariaInvalidAttribute = toAriaInvalidAttribute(
    field["aria-invalid"] ?? ariaInvalid,
  );
  const invalid = ariaInvalidAttribute !== undefined;

  // `active`: the editor is mounting (hidden, behind the read view). `ready`: it is in the DOM and
  // has replaced the read view. Once active it stays — the read view never comes back.
  const [active, setActive] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const editorRef = React.useRef<Editor | null>(null);
  const intentRef = React.useRef<Intent | null>(null);
  const typedRef = React.useRef("");
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);

  const activate = (intent: Intent) => {
    if (!editable) return;
    intentRef.current ??= intent;
    setActive(true);
  };
  // The editor is already loaded (it was used on this page before), or the host needs it now:
  // mount it straight away.
  React.useEffect(() => {
    if ((editorLoaded && editable) || eager) setActive(true);
  }, [editable, eager]);
  const onReady = React.useCallback((editor: Editor) => {
    editorRef.current = editor;
    setReady(true);
  }, []);

  // The public handle delegates to the editor once it is in; before that, the read view answers.
  const editorHandle = React.useRef<TextEditHandle | null>(null);
  React.useImperativeHandle(
    handleRef,
    () => ({
      scrollToHeading: (id) => {
        if (editorHandle.current) editorHandle.current.scrollToHeading(id);
        else
          rootRef.current
            ?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)
            ?.scrollIntoView({ block: "start", behavior: "smooth" });
      },
      flush: () => editorHandle.current?.flush() ?? Promise.resolve(),
      focus: () => {
        if (editorHandle.current) editorHandle.current.focus();
        else activate("end");
      },
      getAnchorForSelection: () =>
        editorHandle.current?.getAnchorForSelection() ?? null,
      pulseAnnotation: (id) => editorHandle.current?.pulseAnnotation(id),
      markSaved: () => editorHandle.current?.markSaved(),
    }),
    // `activate` reads only refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The swap: the editor's document now sits exactly where the read view was, so the clicked point
  // maps to the same place in it. Focus it there, repeat a click on a task checkbox, and replay
  // any text typed while it loaded.
  React.useLayoutEffect(() => {
    if (!ready) return;
    const editor = editorRef.current;
    const intent = intentRef.current;
    intentRef.current = null;
    if (!editor || editor.isDestroyed || !intent) return;
    // Focus synchronously (Tiptap's `focus` command waits a frame), so no keystroke lands on
    // `<body>` between the swap and the caret.
    editor.view.focus();
    if (typeof intent === "object") {
      if (intent.checkbox) {
        const box = document
          .elementFromPoint(intent.x, intent.y)
          ?.closest<HTMLElement>("[data-slot=checkbox]");
        if (box) {
          box.click();
          return;
        }
      }
      const pos = editor.view.posAtCoords({ left: intent.x, top: intent.y });
      editor.commands.focus(pos?.pos ?? "end");
    } else editor.commands.focus(intent);
    if (typedRef.current) {
      editor.commands.insertContent(typedRef.current);
      typedRef.current = "";
    }
  }, [ready]);

  const minCss = toCssLength(minHeight);
  const maxCss = toCssLength(maxHeight);
  const contentStyle: React.CSSProperties | undefined =
    minCss != null || maxCss != null
      ? ({
          ...(minCss != null && { ["--te-min-h"]: minCss }),
          ...(maxCss != null && { ["--te-max-h"]: maxCss }),
        } as React.CSSProperties)
      : undefined;
  const contentClassName = cn(
    "relative min-w-0 max-w-full",
    minCss != null && "min-h-[var(--te-min-h)]",
    maxCss != null && "max-h-[var(--te-max-h)] overflow-y-auto",
  );

  // Nothing edits the read view itself (React owns its DOM): every native edit is cancelled, and
  // typed text is kept and replayed into the editor once it is in.
  const guardReadView = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const onBeforeInput = (event: InputEvent) => {
      event.preventDefault();
      if (event.inputType === "insertText" && event.data)
        typedRef.current += event.data;
    };
    node.addEventListener("beforeinput", onBeforeInput);
    return () => node.removeEventListener("beforeinput", onBeforeInput);
  }, []);

  const html = format !== "markdown";
  const source = value ?? defaultValue;
  const empty = isEmptyDocument(source, html);
  const resolvedLabelledBy = field["aria-labelledby"] ?? ariaLabelledBy;
  const resolvedDescribedBy = field["aria-describedby"] ?? ariaDescribedBy;
  // The read view stands in for ProseMirror's root: the same classes, role and ARIA, and — while
  // editable — `contenteditable`, so a click shows the caret and opens the keyboard at once and the
  // `boxed` focus cue (`:has([contenteditable=true]:focus)`) applies before the editor is there.
  const surface = {
    className: editorBaseClassName,
    "data-slot": "text-edit-read",
    "data-focus-cue": boxed ? "border" : "caret",
    role: "textbox",
    "aria-multiline": true,
    id: resolvedId,
    "aria-label": ariaLabel,
    "aria-labelledby": resolvedLabelledBy,
    "aria-describedby": resolvedDescribedBy,
    "aria-invalid":
      ariaInvalidAttribute as React.AriaAttributes["aria-invalid"],
    "aria-busy": saving || undefined,
    "aria-disabled": disabled || undefined,
    "aria-readonly": (!disabled && !editable) || undefined,
    contentEditable: editable,
    suppressContentEditableWarning: true,
    translate: "no" as const,
    onMouseDown: (event: React.MouseEvent) => {
      if (event.button !== 0) return;
      activate({
        x: event.clientX,
        y: event.clientY,
        checkbox: Boolean(
          (event.target as Element).closest?.("[data-slot=checkbox]"),
        ),
      });
    },
    onFocus: () => activate("start"),
    ref: guardReadView,
    onPaste: (event: React.ClipboardEvent) => event.preventDefault(),
    onDrop: (event: React.DragEvent) => event.preventDefault(),
    // A link click places the caret, as in the editor, instead of navigating.
    onClick: (event: React.MouseEvent) => {
      if (editable && (event.target as Element).closest?.("a"))
        event.preventDefault();
    },
  };

  return (
    <div
      ref={setRootRef}
      data-slot="text-edit"
      data-variant={variant}
      data-editable={editable ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "relative min-w-0 max-w-full bg-transparent",
        // `boxed`: text entry's border cue (FOC-3) — a subtle darker border that eases in while
        // the editor holds focus, never a fill; an invalid box keeps its destructive border.
        boxed &&
          "rounded-lg border border-input px-2.5 py-2 transition-[color,background-color,border-color] duration-150 ease-out has-[[contenteditable=true]:focus]:not-data-invalid:border-ring/40 data-invalid:border-destructive dark:bg-input/30 dark:data-invalid:border-destructive/50",
        editable && "cursor-text",
        disabled && "opacity-50",
        className,
      )}
      // Intent: fetch the editor before the click lands.
      onPointerEnter={editable ? prefetchEditor : undefined}
      onTouchStart={editable ? prefetchEditor : undefined}
      onFocus={editable ? prefetchEditor : undefined}
      // `boxed`: a click on the box's own padding starts editing, as a textarea's would.
      onMouseDown={
        boxed
          ? (event) => {
              if (!editable || event.target !== event.currentTarget) return;
              event.preventDefault();
              if (editorRef.current && ready)
                editorRef.current.commands.focus("end");
              else activate("end");
            }
          : undefined
      }
    >
      <FieldPrimitive.Control
        id={id}
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
        {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
        {...(ariaInvalid !== undefined ? { "aria-invalid": ariaInvalid } : {})}
        render={(control) => (
          <FieldControlBridge control={control} onResolve={setField} />
        )}
      />
      {!ready ? (
        <div
          data-slot="text-edit-content"
          // Clicking the blank space around short content still starts editing, Notion-style.
          onMouseDown={(event) => {
            if (!editable || event.target !== event.currentTarget) return;
            event.preventDefault();
            activate("end");
          }}
          className={contentClassName}
          style={contentStyle}
        >
          {empty ? (
            <div {...surface}>
              <p
                className="is-empty is-editor-empty"
                data-placeholder={editable ? placeholder : undefined}
              >
                <br />
              </p>
            </div>
          ) : (
            <MarkdownView
              {...surface}
              format={html ? "html" : "markdown"}
              // The editor shows every image; so does the view that stands in for it.
              allowedImageOrigins={ALL_ORIGINS}
              mentionHref={props.mentionHref}
              fileLinkPrefix={props.fileLinkPrefix}
              headingIds={props.onOutlineChange !== undefined}
            >
              {source}
            </MarkdownView>
          )}
        </div>
      ) : null}
      {active ? (
        <React.Suspense fallback={null}>
          <LazyEditor
            {...editorProps}
            format={format}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            slashCommands={slashCommands}
            saving={saving}
            readOnly={readOnly}
            disabled={disabled}
            aria-label={ariaLabel}
            aria={{
              id: resolvedId,
              "aria-labelledby": resolvedLabelledBy,
              "aria-describedby": resolvedDescribedBy,
              "aria-invalid": ariaInvalidAttribute,
            }}
            variant={variant}
            surfaceClassName={editorBaseClassName}
            hintClassName={slashHintClassName}
            contentClassName={contentClassName}
            contentStyle={contentStyle}
            rootRef={rootRef}
            hidden={!ready}
            onReady={onReady}
            editorHandle={editorHandle}
          />
        </React.Suspense>
      ) : null}
      {children}
    </div>
  );
}

const ALL_ORIGINS = ["*"] as const;
