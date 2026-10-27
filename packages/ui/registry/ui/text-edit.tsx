// @vegastack text-edit@0.25.93 sha256-HM7OZIziwfy50oTKYlZ0ZYxc7p0yrovmR7q53nXbUtc=

"use client";

import * as React from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import {
  cn,
  mergeRefs,
  proseClassName,
  proseDocument,
} from "@vegastack/design";
import {
  MarkdownView,
  documentPrintClassName,
  type BlockViews,
  type MarkdownCitation,
  type MarkdownSectionMark,
  type LiveBlockRender,
  type TaskQueryRenderProps,
} from "@/components/ui/markdown-view";
import type { LiveBlockKind, MentionKind } from "@/lib/text-edit-grammar";
import type { EmbedProviders } from "@/lib/embed-providers";
import type { FileViewerItem } from "@/components/ui/file-viewer";
import type { AvatarHue } from "@/components/ui/avatar";
import type { TextAnchor } from "@/lib/text-anchor";
import type { TaskInlinePerson } from "@/components/ui/task-inline";
import type { Doc as YDoc } from "yjs";
import type { Awareness } from "y-protocols/awareness";

export type { LiveBlockKind, MentionKind } from "@/lib/text-edit-grammar";
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
  | "diagram"
  | "table"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "bookmark"
  | "divider"
  | "link";

/**
 * Every slash command, in menu order — the default `slashCommands`. `file` shows only when
 * `onFileUpload` is set, `diagram` only when `blockViews.mermaid` is, `bookmark` only with
 * `bookmarks`.
 */
/**
 * Every floating part of an editing `TextEdit` — the bubble menu, link and image panels, the slash
 * and mention menus, block and table menus. Focus moving into one of them stays in the edit
 * session; a host wrapping the editor (an inline property editor) uses it to tell "focus left the
 * editor" from "focus went into the editor's own panel".
 *
 * @example
 * if ((next as Element | null)?.closest(TEXT_EDIT_SESSION_SELECTOR)) return; // still editing
 */
export const TEXT_EDIT_SESSION_SELECTOR =
  "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-image],[data-slot=text-edit-media],[data-slot=text-edit-turn-into],[data-slot=text-edit-link-card],[data-slot=text-edit-paste],[data-slot=suggestion-menu],[data-slot=suggestion-menu-sheet],[data-slot=text-edit-table-grip],[data-slot=text-edit-table-add],[data-text-edit-menu]";

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
  "diagram",
  "table",
  "image",
  "video",
  "audio",
  "file",
  "bookmark",
  "divider",
  "link",
];

/** A smaller set for comments and replies: lists, a quote, code and links — no headings. */
export const TEXT_EDIT_COMPACT_SLASH_COMMANDS: readonly TextEditSlashCommand[] =
  ["bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "link"];

/* ------------------------------------------------------------------------------------------------
 * Mentions, uploads, outline, comment anchors
 * ----------------------------------------------------------------------------------------------*/

/**
 * One kind the `@` menu offers (`TextEditMentions.kinds`): its id (`MENTION_KIND_PATTERN`), how
 * it is named and drawn, and where its group sits.
 */
export interface MentionKindConfig {
  /** The kind's id — written into the Markdown as `mention://<id>/…`. */
  id: MentionKind;
  /** One of it, in a sentence: "Page", "Family". */
  noun: string;
  /** The menu's group heading: "Pages", "Families". */
  plural: string;
  /**
   * The kind's icon, in the menu and on the chip (16px in the menu, 1em on a chip). A built-in
   * kind (`user`, `agent`) has its own; any other falls back to a link glyph.
   * @default the built-in kind's icon, else a link glyph
   */
  icon?: React.ReactNode;
  /**
   * Where its group sits in the menu: lower first; kinds with the same order keep array order.
   * With a query, groups sit by their best match on the name first (the whole name, its start, a
   * word's start, anywhere), then by `order`.
   */
  order: number;
}

/** One result the `@` menu offers. */
export interface MentionOption {
  /** What it is: one of the menu's `kinds`. */
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
  /**
   * Shows the option under this heading ("Recent") instead of its kind's: every such group comes
   * first, in the order its options arrive, ahead of the kinds' groups. Its kind must still be one
   * of the menu's `kinds`.
   * @default undefined — the kind's own group
   */
  group?: string;
  /**
   * When `description` shows: always, or only on the highlighted row. With `sections`, a
   * person's description (an email) shows only on the highlighted row unless another person in
   * the menu has the same name; pass `"always"` for a note that must stay in view ("Can't see
   * this page").
   * @default "active" for a person in a menu with `sections`, else "always"
   */
  descriptionShown?: "always" | "active";
}

/**
 * A section of the `@` menu (`TextEditMentions.sections`): `people` (the `user` kind), `agents`
 * (the `agent` kind) or `records` (every other kind, a group per kind under its `plural`).
 */
export type MentionSection = "people" | "agents" | "records";

/** The `@` menu's source: which kinds it offers, and the search behind it. */
export interface TextEditMentions {
  /**
   * The kinds the menu offers, each a group under its `plural` heading, in `order` (People ·
   * Pages · Files · …); with a query, the group holding the best match on the name comes first.
   * Each group keeps its results in the order they arrive. A result of a kind not listed here is
   * not shown.
   */
  kinds: readonly MentionKindConfig[];
  /**
   * Results for what follows the `@`: asked at once when the menu opens, then 120ms after the
   * last keystroke. The signal aborts when the query changes; an answer is kept per query and
   * shown at once when the query comes back (asked again after 30 seconds). The menu shows at
   * most five per kind.
   */
  search: (
    query: string,
    options: { signal: AbortSignal },
  ) => Promise<MentionOption[]>;
  /**
   * A pasted link to one of the app's own records, as the mention it becomes. Return `null` at
   * once for a link that is not the app's (it stays a link, titled through the
   * `InlineChipProvider`'s `linkPreview`); return a promise for one that is — the record it
   * names, as the reader may see it (a `restricted:` id for one they may not open), or `null`
   * when it names nothing to mention, and the paste stays a link. The pasted URL lands at once
   * as text; the mention replaces it when the answer comes, unless the text was edited
   * meanwhile, and a small popover offers **Mention · Link** until the next keystroke, click or
   * Escape. ⌘Z right after puts the URL back as text.
   * @default undefined — a pasted link is a link
   */
  fromUrl?: (
    url: string,
    options: { signal: AbortSignal },
  ) => Promise<MentionOption | null> | null;
  /**
   * Fixed sections, in this order: People, then Agents, then Records — each record kind its own
   * group, nearest match first — whatever the query matches best (an option's own `group`,
   * "Recent", still comes first). A section left out is not shown. People and agents show their
   * avatar (an agent's is the bot variant) when the option brings no `icon`, and a person's email
   * shows only on the highlighted row unless two people share the name.
   * @default undefined — groups by kind, ordered by `order` and the query's best match
   */
  sections?: readonly MentionSection[];
}

/** What an image upload resolves to: the image's final URL (and optional alt text and size). */
export interface TextEditImageUpload {
  /** The uploaded image's URL, written into the Markdown as `![alt](src)`. */
  src: string;
  /** Alt text for the image.
   * @default undefined */
  alt?: string;
  /** Intrinsic width in px. Read from the file when omitted: the size is stored with the image
   * (`![alt|320x180](src)` in Markdown), so its box is reserved before it loads.
   * @default undefined */
  width?: number;
  /** Intrinsic height in px (with `width`).
   * @default undefined */
  height?: number;
}

/**
 * What `onImageUpload` and `onFileUpload` are handed with the file.
 *
 * @example
 * onImageUpload={(file, { signal, onProgress }) => upload(file, { signal, onProgress })}
 */
export interface TextEditUploadOptions {
  /** Aborts when the placeholder is deleted or the editor unmounts (`TEXT_EDIT_UPLOAD_ABORT`). */
  signal: AbortSignal;
  /**
   * Report how far the upload is (0–1): the placeholder shows it — a bar on an image, a ring on a
   * file chip — instead of a spinner. Optional to call.
   */
  onProgress: (fraction: number) => void;
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
  /**
   * The heading's block id (`blockId`), stable across renames — what a heading link carries after
   * its slug (`#<slug>~<blockId>`). Absent before the editor is in, or when it has none yet.
   */
  blockId?: string;
}

/** What a host's `/` menu item can do once chosen (`TextEditSlashAction.onSelect`). */
export interface TextEditSlashActionContext {
  /**
   * Insert a mention chip at the caret, followed by a space — the chip the `@` menu inserts. In a
   * shared document a record's title is not stored (each reader's chip resolves it).
   */
  insertMention: (mention: { kind: string; id: string; label: string }) => void;
  /**
   * Insert content at the caret (ProseMirror JSON, a node or a list of nodes) — a block such as a
   * live task list. An empty paragraph the caret sits in is replaced.
   */
  insertContent: (content: JSONContent | readonly JSONContent[]) => void;
}

/** A host-defined `/` menu item (`slashActions`). */
export interface TextEditSlashAction {
  /** Stable id, unique among the host's items. */
  id: string;
  /** The row's text ("Page"). */
  label: string;
  /** Muted text after the label. @default undefined */
  description?: string;
  /** Extra words the `/` query matches. @default undefined */
  keywords?: readonly string[];
  /** The row's glyph (a lucide icon). */
  icon: React.ReactNode;
  /** Shown but not choosable. @default false */
  disabled?: boolean;
  /** Why it is disabled, shown in place of `description`. @default undefined */
  disabledReason?: string;
  /**
   * The heading it is listed under in the full menu ("Regent"); host items with the same group sit
   * together, after the basic blocks on a `menuSize="lg"` menu and at the end otherwise.
   * @default "Insert"
   */
  group?: string;
  /** Chosen: the typed `/query` is already gone. */
  onSelect: (ctx: TextEditSlashActionContext) => void;
}

/**
 * How a mention chip shows its target's state (`mentionStatus`): a done task's check, or a closed
 * target struck through with a status tag.
 */
export interface TextEditMentionStatus {
  /** A finished task: its chip leads with a check instead of the task glyph. @default false */
  done?: boolean;
  /** Strike the chip's label through (a canceled or duplicate task). @default false */
  struck?: boolean;
  /** A small tag after the label ("Canceled", "Duplicate"). @default undefined */
  status?: string;
  /**
   * A task's assignee: with `onTaskOpen`, a linked checklist line shows their avatar after the
   * title.
   * @default undefined
   */
  assignee?: TaskInlinePerson | null;
  /**
   * A task's due date, as the host words it ("Fri 31 Oct"): with `onTaskOpen`, a linked line shows
   * it as a small date chip.
   * @default undefined
   */
  due?: string | null;
  /** The due date has passed: the chip takes the destructive ink. @default false */
  overdue?: boolean;
}

/** An unlinked checklist line `onMakeTask` offers: its key and its text. */
export interface TextEditTaskItem {
  /**
   * The line's `blockId` (Make task gives it one if it has none): pass it back to
   * `linkTaskItems`. It follows the line through every edit, a collaborator's included.
   */
  key: string;
  /** The line's text, trimmed: the new task's suggested title. */
  text: string;
}

/**
 * What a host's selection action (`bubbleActions`) is handed.
 *
 * @example
 * bubbleActions={({ text, close }) => <Button size="sm" variant="ghost" onClick={() => { ask(text); close(); }}>Ask…</Button>}
 */
export interface TextEditBubbleContext {
  /** The selected text (blocks joined by line breaks). */
  text: string;
  /** Collapse the selection to its end — the bubble closes, the caret stays. */
  close: () => void;
}

/** Where `onMakeTask` was asked from: the first line's element, to point a popover at. */
export interface TextEditMakeTaskContext {
  /** The first line's element (its `li`), or null when it is not on the page. */
  anchor: HTMLElement | null;
}

/** A checklist line to link to a task (`linkTaskItems`). */
export interface TextEditTaskLink {
  /**
   * The line's key, as `onMakeTask` gave it. The line is skipped once it is removed, its text
   * changed, or it was linked.
   */
  key: string;
  /** The task's id: the line's leading chip is `mention://task/<id>`. */
  id: string;
  /** The task's title, the chip's label (a shared document stores it empty). */
  label: string;
}

/**
 * A marked section (`sectionMarks`): a gutter marker on its heading and a bar along its blocks,
 * drawn as decorations — never written to the document and never moving the text. The same mark
 * `MarkdownView` draws in a read view.
 */
export type TextEditSectionMark = MarkdownSectionMark;

/** What `linkedTaskId` reads: a ProseMirror node, or anything shaped like one. */
export interface TextEditNodeLike {
  type: { name: string };
  attrs: Record<string, unknown>;
  firstChild: TextEditNodeLike | null;
}

/**
 * The task a checklist line is linked to: the id of its leading task mention, when `node` is a
 * task item whose first inline is a `mention` of kind `task` (VegaStack Markdown's linked task
 * line, `- [x] [@Order glass](mention://task/<id>)`); otherwise `null`.
 *
 * @example
 * linkedTaskId(editor.state.doc.nodeAt(pos)); // "t1" | null
 */
export function linkedTaskId(
  node: TextEditNodeLike | null | undefined,
): string | null {
  if (!node || node.type.name !== "taskItem") return null;
  const first = node.firstChild;
  if (!first || first.type.name !== "paragraph") return null;
  const inline = first.firstChild;
  if (
    !inline ||
    inline.type.name !== "mention" ||
    inline.attrs.kind !== "task" ||
    typeof inline.attrs.id !== "string" ||
    !inline.attrs.id
  )
    return null;
  return inline.attrs.id;
}

/** A heading's slug and block id — what `headingLinkHref` builds a link from. */
export interface TextEditHeadingAnchor {
  /** The heading's block id (`blockId`), stable across renames. Absent when it has none yet. */
  id?: string;
  /** The heading's slug: its words, hyphenated, `-1`, `-2`… for a repeat. */
  slug: string;
}

/**
 * Each viewer's own open and closed toggles in a shared document (`collaboration`), kept by the
 * host — `MarkdownView`'s `toggleState`, so one record serves the read view and the editor.
 */
export interface TextEditToggleState {
  /** Whether the toggle with this block id is open for this viewer; `fallback` is the document's default. */
  isOpen: (id: string, fallback: boolean) => boolean;
  /** The viewer opened or closed a toggle (a chevron click; never a find or link reveal). */
  onToggle: (id: string, open: boolean) => void;
}

/** The document's size, as `getStats` and `onStatsChange` report it. */
export interface TextEditStats {
  /** Words: runs of non-space characters. */
  words: number;
  /** Characters of text (block breaks not counted). */
  characters: number;
  /** Minutes to read at 230 words a minute, rounded up (0 for an empty document). */
  readingMinutes: number;
  /** Words in the selection; 0 when nothing is selected. */
  selectedWords: number;
}

/**
 * Where a highlight sits in a collaborative document: Yjs relative positions of its two boundaries
 * (`Y.encodeRelativePosition` bytes), each bound to the quoted character beside it. They follow
 * every edit — anyone's — exactly; once the whole quote is deleted they meet, and the highlight is
 * orphaned.
 */
export interface TextEditYAnchor {
  /** Before the first quoted character, bound to it (text typed before the quote stays outside). */
  start: Uint8Array;
  /** After the last quoted character, bound to it (text typed after the quote stays outside). */
  end: Uint8Array;
}

/**
 * A highlight's anchor: offsets, quote and context (`TextAnchor`), and — in a collaborative
 * editor — `y`, the relative positions that resolve it before the quote fallback is needed.
 */
export type TextEditAnchor = TextAnchor & {
  /** Yjs relative positions; set by a collaborative editor. @default undefined */
  y?: TextEditYAnchor;
};

/** A comment's highlight: its id and where it sits in the text. */
export interface TextEditAnnotation {
  /** The comment (thread) id — the highlight's `data-annotation`. */
  id: string;
  /**
   * Where it sits, as stored (`anchorFromRange` / `onAnnotationsLayout`). With `y` in a
   * collaborative editor, the relative positions place it; without, the quote does.
   */
  anchor: TextEditAnchor;
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
  /**
   * The highlight's current anchor (persist it when it moved); null when orphaned. In a
   * collaborative editor it keeps its `y` relative positions, which follow every edit unchanged.
   */
  anchor: TextEditAnchor | null;
}

/** The imperative handle `handleRef` receives. */
export interface TextEditHandle {
  /**
   * Scroll a heading into view: its outline id (slug), its block id, or a heading link's
   * `<slug>~<blockId>` — the block id wins, so a renamed heading is still found, then the slug.
   * Closed toggles around it open for this viewer. Returns whether the heading was found.
   */
  scrollToHeading: (id: string) => boolean;
  /** The document's word and character counts, and the selection's words; null before the editor is in. */
  getStats: () => TextEditStats | null;
  /**
   * Open the find bar (what <kbd>⌘F</kbd> does inside the editor): a page's "Find in page" on a
   * phone. Mounts the editor first when it is not in yet. Needs an editable or read-only editor
   * with `findReplace`.
   */
  openFind: () => void;
  /** Commit pending edits now (before a comment is created, before navigating); resolves once uploads in flight have landed. */
  flush: () => Promise<void>;
  /**
   * Move focus into the editor: the caret where it was, or at the document's `start` or `end`.
   */
  focus: (position?: "start" | "end") => void;
  /** The anchor of the current selection (with `y` in a collaborative editor), or null when nothing is selected. */
  getAnchorForSelection: () => TextEditAnchor | null;
  /** Pulse an annotation's highlight for 3 seconds and scroll it into view. */
  pulseAnnotation: (id: string) => void;
  /**
   * The host has saved the current document: advance the baseline Escape reverts to (and a commit
   * compares against) to it, so a later `escapeBehavior="revert"` never restores older text.
   */
  markSaved: () => void;
  /**
   * Upload files at the caret through the editor's own upload flow (the placeholder, spinner and
   * abort a paste or drop gets) — e.g. from an attach button's file picker. Needs `onImageUpload`
   * or `onFileUpload`; mounts the editor first when it is not in yet.
   */
  uploadFiles: (files: readonly File[]) => void;
  /**
   * Open the editor's file picker (images only without `onFileUpload`); the picked files upload
   * at the caret through `uploadFiles`. Mounts the editor first when it is not in yet.
   */
  pickFiles: () => void;
  /** How many uploads are still landing: a host shows "Uploading…" and guards leaving while any are. */
  pendingUploads: () => number;
  /**
   * A shared document: forget what <kbd>⌘Z</kbd> would undo. For a host that replaced the text
   * under the reader (a version restored): undoing their earlier changes onto the new text would
   * splice the old text into it, letter by letter. Nothing happens in a document of one's own.
   */
  clearHistory: () => void;
  /**
   * Link checklist lines to tasks (after `onMakeTask` created them): each line's text becomes a
   * leading task chip — text after a matching plain-text title stays after the chip, otherwise
   * the whole line does (mentions included); nested content stays below — and its box becomes the
   * task's done state. A line removed, edited or linked since `onMakeTask` offered it is skipped. One undo step; never reported through `onTaskItemToggle`. Returns how
   * many lines were linked (0 before the editor is in).
   */
  linkTaskItems: (links: readonly TextEditTaskLink[]) => number;
  /**
   * Tick or untick every line linked to `taskId` (the task changed elsewhere). Not an undo step,
   * and never reported through `onTaskItemToggle`. Returns how many lines changed (0 before the
   * editor is in).
   */
  setTaskItemChecked: (taskId: string, checked: boolean) => number;
}

/** Who this viewer is to collaborators: their caret, selection and name label wear it. */
export interface TextEditCollaborationUser {
  /** The member's (or agent's) id. */
  id: string;
  /** The name on their caret's label ("Asha Rao", "Claude (via Manoj)"). */
  name: string;
  /** Their colour — a tag hue, never a colour string. An agent always draws purple. */
  hue: AvatarHue;
  /** A person or a member's agent. @default "person" */
  kind?: "person" | "agent";
}

/**
 * A shared document. The editor binds to `document`'s XML fragment (`field`) and shows each
 * collaborator's caret from `provider.awareness`; the app owns the provider (Hocuspocus or any
 * other) — it is typed structurally, so the design system never imports one.
 */
/**
 * A version diff to show: the newer version's text with what changed marked — `ychange` marks on
 * changed text and a `ychange` attribute on whole blocks added or removed (`textEditDiffSchema()`,
 * the shape a Yjs snapshot diff of two version states produces).
 */
export interface TextEditDiffView {
  /** The diff, as a ProseMirror document. */
  doc: JSONContent;
  /**
   * What it is compared with, named above it after "Compared with" ("the previous
   * version", "the current text", a version's name). @default undefined
   */
  baseline?: React.ReactNode;
}

export interface TextEditCollaboration {
  /** The shared Yjs document. Never seeded by the editor: a server seeds it once. */
  document: YDoc;
  /** The XML fragment the document lives in. @default "default" */
  field?: string;
  /** The connection: its `awareness` carries carets and names; "synced" fires once it has the document. */
  provider: {
    awareness: Awareness;
    on: (event: "synced", listener: () => void) => unknown;
    off: (event: "synced", listener: () => void) => unknown;
  };
  /** This viewer, as this client announces itself (the server stamps the identity peers trust). */
  user: TextEditCollaborationUser;
  /**
   * Who a collaborator is, by their awareness client id — from an authority no client can write
   * (the collaboration server's authenticated identity for that connection). A caret's name, hue
   * and agent badge come only from here: the `user` fields a client writes into awareness are
   * never shown, so no one can draw a caret as someone else. Without it, or for an unknown client,
   * a caret is a plain grey bar with no name.
   */
  peer?: (clientId: number) => TextEditCollaborationUser | null | undefined;
  /** The document's Markdown, shown read-only until the editor is in (a server-rendered read copy). @default "" */
  readCopy?: string;
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
  // A wide table fades at an edge with more beyond it (24px), like `MarkdownView`'s. CSS only —
  // scroll-driven, so nothing writes to the editable DOM ProseMirror watches; a browser without
  // scroll timelines shows no fade rather than a wrong one.
  "supports-[animation-timeline:scroll()]:[&_.tableWrapper]:scroll-fade-x [&_.tableWrapper]:[--scroll-fade-size:--spacing(6)] [&_.tableWrapper]:[--scroll-fade-reveal:--spacing(6)]",
  // Fixed layout: columns keep their width (equal, or as resized) while you type, and text wraps
  // inside its cell instead of pushing the other columns right.
  // The editor's own tables only (`.tableWrapper`), never a table a block view draws (an embedded
  // DataGrid sizes its own columns).
  "[&_.tableWrapper>table]:table-fixed",
  // A document ending in a table or an atom keeps room under it to click, where the caret goes.
  "[&.te-open-end]:pb-6",
  // Column resizing (editable only): a thin primary line on the hovered column border, and the
  // resize cursor while the pointer is on it. Scoped to the editor's own table cells (direct
  // children of `.tableWrapper`'s table): a bare `[&_td]:relative` also reached a table drawn
  // inside a block view — an embedded `DataGrid`, even one nested in an editor table's cell — and
  // beat its frozen cells' `sticky`, so the pinned column scrolled away.
  "[&_.tableWrapper>table>tbody>tr>td]:relative [&_.tableWrapper>table>tbody>tr>th]:relative [&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:-inset-y-px [&_.column-resize-handle]:-end-px [&_.column-resize-handle]:w-0.5 [&_.column-resize-handle]:bg-primary/50 [&.resize-cursor]:cursor-col-resize",
  // A selected atom (a mention, a divider) gets a tint; a selected image keeps its own radius and
  // shows its outline instead (the image node view).
  "[&_.ProseMirror-selectednode:not([data-slot=text-edit-image-node])]:rounded-sm [&_.ProseMirror-selectednode:not([data-slot=text-edit-image-node])]:bg-accent",
  // An empty toggle title or body shows its hint (the Placeholder extension's `is-empty`).
  "[&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:pointer-events-none [&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:float-start [&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:h-0 [&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:text-muted-foreground/60 [&_[data-slot=toggle-content]>[data-node-view-content-react]>[data-slot=toggle-summary].is-empty]:before:content-[attr(data-placeholder)] [&_[data-slot=toggle-content]>[data-node-view-content-react]>p.is-empty]:before:content-['Empty_toggle._Type_or_press_/_for_commands']",
);

/**
 * The editor surface at the document type scale (TYP-20): the `proseDocument` overlay merged over
 * the editor's own rules, then the print rules — the same metrics `MarkdownView` reads at with
 * `typeScale="document"`, so the swap from the read view into the editor moves nothing.
 */
const documentSurfaceClassName = cn(
  editorBaseClassName,
  Object.values(proseDocument).join(" "),
  // An image block sits 16 from its neighbours, as the read view's (`markdown-figure`) does.
  "[&_[data-slot=text-edit-image-node]]:my-4",
  documentPrintClassName,
);

/*
 * A version diff (`diff`): the same inks as `DiffView` — added text underlined on the success
 * tint, removed text struck through on the destructive tint, as `ins`/`del` (a cue beyond colour
 * either way) — and a whole block added or removed
 * (`data-ychange` on its element) tinted once, not again for each block inside it. Each change
 * starts with a visually hidden "Added:"/"Removed:" so a screen reader hears it.
 */
const diffClassName = cn(
  "[&_ins[data-ychange]]:rounded-xs [&_ins[data-ychange]]:bg-success/10 [&_ins[data-ychange]]:text-success-text [&_ins[data-ychange]]:underline [&_ins[data-ychange]]:decoration-success [&_ins[data-ychange]]:underline-offset-2 dark:[&_ins[data-ychange]]:bg-success/20",
  "[&_del[data-ychange]]:rounded-xs [&_del[data-ychange]]:bg-destructive/10 [&_del[data-ychange]]:text-destructive-text [&_del[data-ychange]]:line-through dark:[&_del[data-ychange]]:bg-destructive/20",
  "[&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:rounded-sm [&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:bg-success/10 [&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:text-success-text [&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:underline [&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:decoration-success [&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:underline-offset-2 dark:[&_:not(ins)[data-ychange=added]:not(:is([data-ychange]_*))]:bg-success/20",
  "[&_:not(del)[data-ychange=removed]:not(:is([data-ychange]_*))]:rounded-sm [&_:not(del)[data-ychange=removed]:not(:is([data-ychange]_*))]:bg-destructive/10 [&_:not(del)[data-ychange=removed]:not(:is([data-ychange]_*))]:text-destructive-text [&_:not(del)[data-ychange=removed]:not(:is([data-ychange]_*))]:line-through dark:[&_:not(del)[data-ychange=removed]:not(:is([data-ychange]_*))]:bg-destructive/20",
  "[&_img[data-ychange=added]]:outline-2 [&_img[data-ychange=added]]:outline-offset-2 [&_img[data-ychange=added]]:outline-success [&_img[data-ychange=removed]]:opacity-60 [&_img[data-ychange=removed]]:outline-2 [&_img[data-ychange=removed]]:outline-offset-2 [&_img[data-ychange=removed]]:outline-dashed [&_img[data-ychange=removed]]:outline-destructive",
  "[&_[data-ychange=added]:not(:is([data-ychange]_*))]:before:sr-only [&_[data-ychange=added]:not(:is([data-ychange]_*))]:before:content-['Added:_']",
  "[&_[data-ychange=removed]:not(:is([data-ychange]_*))]:before:sr-only [&_[data-ychange=removed]:not(:is([data-ychange]_*))]:before:content-['Removed:_']",
);

/** A diff's legend: what it is compared with, and the two inks. */
function DiffLegend({ baseline }: { baseline?: React.ReactNode }) {
  return (
    <p
      data-slot="text-edit-diff-legend"
      className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
    >
      {baseline !== undefined && baseline !== null ? (
        <span className="min-w-0 wrap-anywhere">Compared with {baseline}</span>
      ) : null}
      <ins className="rounded-xs bg-success/10 px-1 text-success-text underline decoration-success underline-offset-2 dark:bg-success/20">
        Added
      </ins>
      <del className="rounded-xs bg-destructive/10 px-1 text-destructive-text line-through dark:bg-destructive/20">
        Removed
      </del>
    </p>
  );
}

/*
 * `variant="composer"` — `Input`'s box (32px: a 1px border, 3px of padding and a 24px row; 14px
 * type from md, 16px on a phone) on a light fill, as a grid: the leading controls (attach), the
 * text, the actions (Send). The 24px controls sit 4px in from the border on every side — never on
 * the corners — centred on a single line and pinned to the last line as the text grows
 * (`self-end`); the text starts 8px in when nothing leads. One line of text is exactly the 24px row.
 * The text scrolls inside past about ten lines; the footer spans the row under it.
 */
const COMPOSER_ROOT = "grid min-h-8 items-end gap-x-1 bg-muted/30 p-[3px]";
const COMPOSER_LEADING =
  "col-start-1 row-start-1 flex shrink-0 items-center gap-1 self-end";
const COMPOSER_CONTENT =
  "row-start-1 max-h-[calc(10*1.5rem)] overflow-y-auto md:max-h-[calc(10*1.25rem+0.25rem)] [&>*]:py-0 [&>*]:text-base [&>*]:leading-6 md:[&>*]:text-sm md:[&>*]:leading-5 md:[&_[role=textbox]]:py-0.5 [&>*>*:first-child]:mt-0 [&>*>*:last-child]:mb-0 [&_[data-slot=inline-chip]]:before:hidden";
const COMPOSER_ACTIONS =
  "row-start-1 flex shrink-0 items-center gap-1 self-end";
// An empty footer (a host passing a wrapper with no files in it) takes no room.
const COMPOSER_FOOTER =
  "col-span-full row-start-2 min-w-0 px-1 pt-1 pb-1 has-[>:only-child:empty]:hidden";

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
 * Why an upload's `signal` aborted (`signal.reason`): `removed` — the person deleted its placeholder
 * (let the file go); `unmounted` — the editor went away with the placeholder still in its text (a
 * host may keep the file, as an attachment).
 *
 * @example
 * if (signal.reason === TEXT_EDIT_UPLOAD_ABORT.unmounted) keepAsAttachment(file);
 */
export const TEXT_EDIT_UPLOAD_ABORT = {
  unmounted: "text-edit:unmounted",
  removed: "text-edit:removed",
} as const;

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

/* ------------------------------------------------------------------------------------------------
 * Images in the viewer
 * ----------------------------------------------------------------------------------------------*/

const LazyFileViewer = React.lazy(() =>
  import("@/components/ui/file-viewer").then((module) => ({
    default: module.FileViewer,
  })),
);

/** Every image of a document — the read view's and the editor's — in reading order. */
const DOCUMENT_IMAGES =
  "img[data-slot=markdown-image],[data-slot=text-edit-image-node] img";

const IMAGE_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

/** One document image as a `FileViewer` item: named by its alt text, else its file name. */
function imageItem(
  image: HTMLImageElement,
  index: number,
  downloadHref?: (src: string) => string | null | undefined,
): FileViewerItem {
  const src = image.currentSrc || image.src;
  let file = "";
  try {
    file = decodeURIComponent(
      new URL(src, document.baseURI).pathname.split("/").pop() ?? "",
    );
  } catch {
    // An unparsable URL: name it by its alt text or "Image".
  }
  const extension = /\.([a-z0-9]+)$/i.exec(file)?.[1]?.toLowerCase() ?? "";
  return {
    id: `${index}:${src}`,
    name: image.alt || file || "Image",
    contentType: IMAGE_TYPES[extension] ?? "image/*",
    src,
    downloadHref: downloadHref?.(image.getAttribute("src") ?? src) ?? src,
  };
}

/**
 * The document image viewer: `open(image)` shows that image in the `FileViewer`, paging through
 * every image inside `root`.
 */
function useImageViewer(
  root: React.RefObject<HTMLElement | null>,
  downloadHref?: (src: string) => string | null | undefined,
) {
  const [viewer, setViewer] = React.useState<{
    items: FileViewerItem[];
    index: number | null;
  } | null>(null);
  const open = React.useCallback(
    (image: HTMLImageElement) => {
      const images = [
        ...(root.current?.querySelectorAll<HTMLImageElement>(DOCUMENT_IMAGES) ??
          []),
      ].filter((each) => each.currentSrc || each.src);
      const index = images.indexOf(image);
      if (index === -1) return;
      setViewer({
        items: images.map((each, at) => imageItem(each, at, downloadHref)),
        index,
      });
    },
    [root, downloadHref],
  );
  /** Show one file (a file chip) in the viewer: rendered when it can be, else its info and download. */
  const openFile = React.useCallback((item: FileViewerItem) => {
    setViewer({ items: [item], index: 0 });
  }, []);
  const element = viewer ? (
    // Stays mounted once used, so closing plays the viewer's own exit.
    <React.Suspense fallback={null}>
      <LazyFileViewer
        items={viewer.items}
        index={viewer.index}
        onIndexChange={(index) =>
          setViewer((current) => current && { ...current, index })
        }
        onOpenChange={(next) => {
          if (!next)
            setViewer((current) => current && { ...current, index: null });
        }}
      />
    </React.Suspense>
  ) : null;
  return { open, openFile, element };
}

/** A file chip's link as a `FileViewer` item. */
function fileItem(
  href: string,
  name: string,
  contentType: string | null | undefined,
): FileViewerItem {
  return {
    id: href,
    name: name || "File",
    contentType: contentType || "application/octet-stream",
    src: href,
    downloadHref: href,
  };
}

/** The read view's image under an event, unless it sits inside a link (the link wins). */
function readImage(target: EventTarget): HTMLImageElement | null {
  const image = (target as Element).closest?.<HTMLImageElement>(
    "img[data-slot=markdown-image]",
  );
  return image && !image.closest("a") ? image : null;
}

/** Click or Enter/Space on a read-view image opens it; images become buttons for the keyboard. */
function useReadImages(
  root: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  open: (image: HTMLImageElement) => void,
) {
  // The images made buttons, so turning the viewer off (or unmounting) gives them back as they were.
  const madeRef = React.useRef(new Set<HTMLImageElement>());
  React.useEffect(() => {
    if (!enabled) return;
    for (const image of madeRef.current)
      if (!image.isConnected) madeRef.current.delete(image);
    for (const image of root.current?.querySelectorAll<HTMLImageElement>(
      "img[data-slot=markdown-image]",
    ) ?? []) {
      if (image.closest("a") || image.hasAttribute("data-viewer")) continue;
      image.setAttribute("data-viewer", "");
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute(
        "aria-label",
        image.alt ? `Open image: ${image.alt}` : "Open image",
      );
      madeRef.current.add(image);
    }
  });
  React.useEffect(() => {
    if (!enabled) return;
    const made = madeRef.current;
    return () => {
      for (const image of made)
        for (const name of ["data-viewer", "tabindex", "role", "aria-label"])
          image.removeAttribute(name);
      made.clear();
    };
  }, [enabled]);
  return {
    onClick: (event: React.MouseEvent) => {
      const image = enabled ? readImage(event.target) : null;
      if (!image) return;
      event.preventDefault();
      open(image);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const image = enabled ? readImage(event.target) : null;
      if (!image || event.target !== image) return;
      event.preventDefault();
      open(image);
    },
  };
}

/** Props accepted by `ImageViewerScope`. */
export interface ImageViewerScopeProps extends React.ComponentProps<"div"> {
  /**
   * Leave the images as plain pictures.
   * @default false
   */
  disabled?: boolean;
  /**
   * The link the viewer's Download saves from, given an image's `src` (`TextEdit`'s
   * `imageDownloadHref`). Without it, Download uses the `src`.
   * @default undefined
   */
  imageDownloadHref?: (src: string) => string | null | undefined;
}

/**
 * `ImageViewerScope` — wrap a `MarkdownView` (a posted comment, a summary) so a click on one of
 * its images opens it in the `FileViewer`, paging through every image inside. `TextEdit` and
 * `CommentThread` already do this for their own documents.
 *
 * @example
 * <ImageViewerScope>
 *   <MarkdownView>{summary}</MarkdownView>
 * </ImageViewerScope>
 */
export function ImageViewerScope({
  disabled = false,
  imageDownloadHref,
  className,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: ImageViewerScopeProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const viewer = useImageViewer(rootRef, imageDownloadHref);
  const handlers = useReadImages(rootRef, !disabled, viewer.open);
  return (
    <div
      ref={setRootRef}
      data-slot="image-viewer-scope"
      className={cn("min-w-0 [&_img[data-viewer]]:cursor-zoom-in", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) handlers.onClick(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) handlers.onKeyDown(event);
      }}
      {...props}
    >
      {children}
      {viewer.element}
    </div>
  );
}

/** Where the caret goes once the editor is in: the clicked point, or an end of the document. */
type Intent = { x: number; y: number; checkbox: boolean } | "start" | "end";

/** An edit made on the read view while the editor loaded, kept to replay into it. */
type ReadInput =
  | { text: string }
  | { key: "Enter" | "Backspace" | "Delete" }
  | { html: string; text: string; files: File[] };

/** Keep a cancelled `beforeinput`: text joins the text before it, a deletion trims it first. */
function keepInput(queue: ReadInput[], event: InputEvent) {
  const last = queue.at(-1);
  const typed = last && "text" in last && !("html" in last) ? last : null;
  const trim = (pattern: RegExp) => {
    typed!.text = typed!.text.replace(pattern, "");
    if (!typed!.text) queue.pop();
  };
  switch (event.inputType) {
    case "insertText":
    case "insertReplacementText":
      if (!event.data) return;
      if (typed) typed.text += event.data;
      else queue.push({ text: event.data });
      return;
    case "insertParagraph":
    case "insertLineBreak":
      queue.push({ key: "Enter" });
      return;
    case "deleteContentBackward":
      if (typed) trim(/[\s\S]$/u);
      else queue.push({ key: "Backspace" });
      return;
    case "deleteWordBackward":
      if (typed) trim(/\S*\s*$/u);
      else queue.push({ key: "Backspace" });
      return;
    case "deleteContentForward":
    case "deleteWordForward":
      queue.push({ key: "Delete" });
      return;
  }
}

/** Keep a cancelled paste or drop's content: its HTML, text and files. */
function keepTransfer(queue: ReadInput[], data: DataTransfer | null) {
  if (!data) return;
  const html = data.getData("text/html");
  const text = data.getData("text/plain");
  const files = Array.from(data.files);
  if (html || text || files.length) queue.push({ html, text, files });
}

/** Replay one kept edit into the editor at its caret, as the key or paste would have done. */
function replayInput(editor: Editor, input: ReadInput) {
  if ("html" in input) {
    // The whole clipboard, through the editor's own paste handling (files upload, Markdown
    // parses, a lone link embeds) — a drop on the loading view lands at the caret.
    const data = new DataTransfer();
    if (input.html) data.setData("text/html", input.html);
    if (input.text) data.setData("text/plain", input.text);
    for (const file of input.files) data.items.add(file);
    editor.view.dom.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
    return;
  }
  if ("text" in input) {
    editor.commands.insertContent({ type: "text", text: input.text });
    return;
  }
  const before = editor.state.doc;
  editor.commands.keyboardShortcut(input.key);
  if (input.key === "Enter" || editor.state.doc !== before) return;
  // A character the browser itself would have deleted (no key binding takes plain text).
  const { selection } = editor.state;
  if (!selection.empty) {
    editor.commands.deleteSelection();
    return;
  }
  const { $from } = selection;
  const back = input.key === "Backspace";
  if (
    back
      ? $from.parentOffset === 0
      : $from.parentOffset === $from.parent.content.size
  )
    return;
  const at = selection.from;
  editor.commands.deleteRange(
    back ? { from: at - 1, to: at } : { from: at, to: at + 1 },
  );
}

/** Whether a saved value holds nothing to show. */
function isEmptyDocument(source: string, html: boolean): boolean {
  if (!html) return source.trim() === "";
  // A block that is all attributes (an image, a player, a live task list) is something to show.
  return (
    !/<(img|hr|table|video|audio)\b|\bdata-type\s*=\s*["']?task-query\b/i.test(
      source,
    ) && source.replace(/<[^>]*>|&nbsp;/g, "").trim() === ""
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
   * The host's own `/` menu items, listed after the built-in ones and filtered by the same query
   * (label and `keywords`). Choosing one removes the typed `/query` and calls `onSelect`, which can
   * insert a mention chip at the caret through `ctx.insertMention` (a new sub-page, say). A
   * `disabled` item shows muted with its `disabledReason` and cannot be chosen.
   * @default []
   */
  slashActions?: readonly TextEditSlashAction[];
  /**
   * The host's own selection actions ("Ask agent…"), after the formatting and before Comment, in the
   * bubble (and the dock). Called with the selection's text each time the bubble draws; return
   * `Button`s (`variant="ghost" size="sm"`). With `onMakeTask`, a selection reaching unlinked
   * checklist lines also shows **Make task** / **Make N tasks** there.
   * @default undefined
   */
  bubbleActions?: (context: TextEditBubbleContext) => React.ReactNode;
  /**
   * Where the selection's formatting shows on a coarse pointer: `bubble` floats it over the
   * selection; `dock` puts it in a 44px bar at the bottom of the window (above the on-screen
   * keyboard), as phone editors do. A fine pointer always gets the bubble.
   * @default "bubble"
   */
  toolbar?: "bubble" | "dock";
  /**
   * The block menu on a coarse pointer: `handle` shows the ⋮⋮ grip beside the caret's block (a tap
   * opens the menu); `longPress` shows no grip — a long press on a block (half a second, held
   * still) opens its menu as a bottom sheet.
   * @default "handle"
   */
  touchBlockMenu?: "handle" | "longPress";
  /**
   * The slash and mention menus' size (`SuggestionMenu`'s): `lg` is 320px wide and up to
   * `min(60vh, 440px)` tall, each block with a line saying what it is, the slash menu grouped Basic ·
   * the host's items · Media · Advanced.
   * @default "default"
   */
  menuSize?: "default" | "lg";
  /**
   * Where the slash and mention menus show (`SuggestionMenu`'s `presentation`): `auto` opens a
   * bottom sheet with a search field on a coarse pointer or a window under 640px, and floats at
   * the caret otherwise.
   * @default "popover"
   */
  menuPresentation?: "popover" | "auto";
  /**
   * Whether the placeholder yields to the "Type / for commands" hint while focused and empty.
   * Off keeps the placeholder (a comment box's "Add a comment…") in every state.
   * @default true
   */
  slashHint?: boolean;
  /**
   * Show the hover chrome: the ⋮⋮ drag handle beside the hovered block, and a table's row and
   * column grips (menus, drag to reorder), corner grip and "+" bars. Turn it off where the editor
   * sits in a tight box (comments). ⌘⇧↑ / ⌘⇧↓ move blocks and Tab / ⇧Tab move between cells either way.
   * @default true
   */
  dragHandles?: boolean;
  /**
   * The text's inline start. `auto`: inside a Dialog, Sheet, Drawer, Popover or Card whose padding
   * is narrower than the block grip needs, the content takes just enough start padding for the ⋮⋮
   * grip to sit before the text. `none`: the text starts at the editor's own edge — flush with a
   * ghost `Input` or `Textarea` title above it (a New task dialog's description), placeholder and
   * caret included — and the block grip, which would have no room, is not shown. Everything it
   * opens stays: ⌘/ and ⇧F10 open the block menu, and on touch a long-press does (as with
   * `touchBlockMenu="longPress"`, which `inset="none"` implies),
   * ⌘⇧↑ / ⌘⇧↓ move blocks, and a table keeps its own grips.
   * @default "auto"
   */
  inset?: "auto" | "none";
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
   * `"blur"` keeps the text, commits it and blurs — right for a document, where reverting would
   * erase text already saved. Defaults to `"blur"` for a `document` (and whenever `autosave` is
   * set); a `collaboration` editor always blurs.
   * @default variant === "document" || autosave ? "blur" : "revert"
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
   * Render the document without letting it be edited; the surface reports `aria-readonly`. Its
   * images still open in the `FileViewer` on a click.
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
   * `composer` is a comment box that looks exactly like `Input` at rest (32px, its border, radius,
   * padding, type and focus cue) and grows line by line to about ten lines, then scrolls inside;
   * `actions` sit at its end on the first line and stay pinned bottom-right as the text wraps, and
   * `footer` (pending file cards) renders inside the box under the text.
   * @default "document"
   */
  variant?: "document" | "boxed" | "composer";
  /**
   * `variant="composer"`: the leading controls (attach), bottom-left.
   * @default undefined
   */
  leading?: React.ReactNode;
  /**
   * `variant="composer"`: the trailing controls (Send), bottom-right.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * `variant="composer"`: content inside the box under the text (the draft's file cards).
   * @default undefined
   */
  footer?: React.ReactNode;
  /**
   * The type scale, as `MarkdownView`'s `typeScale`: `compact` (the app's own) or `document` (a
   * page's, TYP-20: 14/24 text, 16/26 on a coarse pointer or a narrow window, `#` 24 · `##` 20 ·
   * `###` 16, 12px between paragraphs). The read view and the editor wear the same metrics.
   * @default "compact"
   */
  typeScale?: "compact" | "document";
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
   * A person mention's avatar URL, by id: its chip shows it (16px) in place of the person icon.
   * @default undefined
   */
  mentionImage?: (id: string) => string | null | undefined;
  /**
   * A record mention's label for this reader, by kind and id. A collaborative document stores a
   * page's, task's or file's mention without its title (one reader may see a title another may
   * not), so each chip asks here; people and agents keep their stored name. A chip it cannot
   * label reads `@…`. Chips re-render when this function changes.
   * @default undefined
   */
  mentionLabel?: (kind: MentionKind, id: string) => string | null | undefined;
  /**
   * A target's state, by kind and id: `{ done: true }` gives a finished task's chip its check (a
   * task chip shows the task glyph otherwise); `{ struck: true, status: "Canceled" }` strikes the
   * chip's label through and adds a small status tag. Read at render, like `mentionLabel`; chips
   * re-render when this function changes. `null` leaves the chip to the `InlineChipProvider`'s
   * `state`; `{}` is a plain chip. Any state given here replaces the provider's whole answer.
   * @default undefined
   */
  mentionStatus?: (
    kind: MentionKind,
    id: string,
  ) => TextEditMentionStatus | null | undefined;
  /**
   * A linked checklist line (`linkedTaskId`) was ticked or unticked by this person — never by a
   * collaborator, a `value` change or `setTaskItemChecked`. The host sets the task's status.
   * @default undefined
   */
  onTaskItemToggle?: (taskId: string, checked: boolean) => void;
  /**
   * Adds **Make task** to the block menu of an unlinked checklist line (**Make N tasks** when
   * several are selected), and a **→ Task** button at the end of an unlinked checklist line the
   * pointer rests on; called with the lines and the first line's element (`anchor` — point a
   * `MakeTaskPopover` at it). Create the tasks, then `linkTaskItems`.
   * @default undefined
   */
  onMakeTask?: (
    items: TextEditTaskItem[],
    context: TextEditMakeTaskContext,
  ) => void;
  /**
   * A linked checklist line (`linkedTaskId`) draws as a `TaskInline`: one round box (the task's
   * done state), the title — which calls this on a click, or <kbd>Alt</kbd>+<kbd>Enter</kbd> with
   * the caret on the line: open the task's peek — then the assignee's avatar and the due date
   * (`mentionStatus`'s `assignee`, `due` and `overdue`, else the `InlineChipProvider`'s `state`)
   * and ↗ to the task's page (`mentionHref`) on hover. Without it the line is a checkbox and a task
   * chip, as before.
   * @default undefined
   */
  onTaskOpen?: (taskId: string) => void;
  /**
   * Marked sections: each draws a small marker in the gutter beside its heading (named `label`)
   * and a `tone` bar along the section — decorations only, with no layout shift. A key matching
   * no heading draws nothing.
   * @default undefined
   */
  sectionMarks?: readonly TextEditSectionMark[];
  /**
   * A section mark's marker was clicked: its `key`.
   * @default undefined
   */
  onSectionMark?: (key: string) => void;
  /**
   * `MarkdownView`'s `citation`, for the read view: a `[[n]]` marker renders as a superscript
   * citation, and clicking it is the citation's, never an edit. In the editor the markers stay
   * plain `[[n]]` text, so with `citation` set the read view stands in whenever the document is not
   * being edited: the editor swaps in on a click or focus and the read view returns once focus
   * leaves the editor and its menus and panels (after the blur commit, never mid-upload).
   * @default undefined
   */
  citation?: (n: number) => MarkdownCitation | null | undefined;
  /**
   * Upload an image pasted, dropped or picked (the image panel's Upload, the slash menu's Image).
   * It shows dimmed under a spinner until the promise resolves with its URL, then commits — even
   * after focus has left. A rejection leaves it in place as a failed upload (Retry, Remove) and
   * calls `onUploadError`. `signal` aborts when its placeholder is deleted or the editor unmounts;
   * `signal.reason` says which (`TEXT_EDIT_UPLOAD_ABORT`). Call `onProgress(0…1)` as the upload
   * goes and the placeholder (the image itself, dimmed, in its own proportions) shows a bar along
   * its foot instead of a spinner.
   * @default undefined
   */
  onImageUpload?: (
    file: File,
    options: TextEditUploadOptions,
  ) => Promise<TextEditImageUpload>;
  /**
   * Upload any other file dropped, pasted or picked (the slash menu's File): it lands as a link
   * `[name](href)`, shown as a file chip. Without it, non-image files are ignored. While it uploads
   * its chip shows a ring that fills as `onProgress` reports (a spinner until it does).
   * @default undefined
   */
  onFileUpload?: (
    file: File,
    options: TextEditUploadOptions,
  ) => Promise<TextEditFileUpload>;
  /**
   * Called when an upload rejects — show a toast. Its placeholder stays in the text, saying the
   * upload failed, with Retry and Remove (`onFailedUploadsChange` counts them).
   * @default undefined
   */
  onUploadError?: (file: File, error: unknown) => void;
  /**
   * Called with the number of failed uploads still shown (waiting for Retry or Remove), each time
   * it changes — so a host can guard leaving, as it does while uploads land.
   * @default undefined
   */
  onFailedUploadsChange?: (count: number) => void;
  /**
   * The video providers shown as players: `EMBED_PROVIDERS` from `@/lib/embed-providers`, or a
   * subset. Opt-in — without it an `embed` block shows as a link to its URL, a pasted video link
   * stays a link, and the video panel takes only video files; allow `EMBED_FRAME_ORIGINS` in the
   * page's `frame-src` before passing it.
   * @default undefined
   */
  embeds?: EmbedProviders;
  /**
   * Bookmarks: a link shown as a card with its page's title, icon and site — **Bookmark** in the
   * slash menu (paste or type the address into the new card), and **Link · Bookmark** in the
   * popover under a lone link pasted where a block can stand (**Embed · Link · Bookmark** for a
   * video with `embeds`). The preview comes from the `InlineChipProvider`'s `linkPreview` (the
   * app's server reads the page; the reader's browser never contacts the site). Stored as
   * `[url](url "bookmark")` on its own line — a link to any other reader. Without it a bookmark
   * already in the document still shows as a card.
   * @default false
   */
  bookmarks?: boolean;
  /**
   * Draws a live task list — a `taskQuery` block, `:::tasks{…}` in Markdown — with the host's own
   * component (it fetches this reader's rows), in the editor and in the read view before it.
   * `blockId` is the list's id (the directive's `id`), `query` its filter (every other attribute,
   * as written), `snapshot` the rows last stored, `editable` whether this reader may change the
   * filter. The block is an atom: selectable and draggable, nothing inside is edited by the editor.
   * Without it, or where it returns `null`/`undefined`, the snapshot shows as a quiet read-only list
   * (`MarkdownLiveBlock`). Insert one with `{ type: "taskQuery", attrs: { query, snapshot } }`; a
   * collaborative editor gives it a `blockId`.
   * @default undefined
   */
  renderTaskQuery?: (props: TaskQueryRenderProps) => React.ReactNode;
  /**
   * Draws a live block of any kind — a `taskQuery` node with that `kind` attribute, `:::<kind>{…}`
   * in Markdown (a name in `liveBlockKinds`) — with the host's own component, in the editor and in
   * the read view before it. Called with the block's kind and the same props as
   * `renderTaskQuery`. Given, it is asked for every kind, `tasks` included, and `renderTaskQuery`
   * is not used. Returning `null`/`undefined` leaves the snapshot (`MarkdownLiveBlock`). Insert one
   * with `{ type: "taskQuery", attrs: { kind, query, snapshot } }` (`kind: null` is a task list).
   * @default undefined
   */
  renderLiveBlock?: LiveBlockRender;
  /**
   * The live block kinds Markdown reads (`:::<name>{…}` … `:::`), read when the editor is
   * created, each with the heading and row kind its stored snapshot shows with where the host
   * draws nothing (`MarkdownLiveBlock`); a block of any other name stays text and a list. A shared
   * document's blocks come from its state, whatever their kind.
   * @default DEFAULT_LIVE_BLOCK_KINDS — the live task list (`tasks`) alone
   */
  liveBlockKinds?: readonly LiveBlockKind[];
  /**
   * Import an image pasted or dropped from another site: resolve with where your storage keeps a
   * copy (`src`). Each such image (one whose `src` is not this origin's or a `blob:`) is taken out
   * of the paste, shows an upload placeholder in its place, and lands as the stored image — or, when
   * the promise rejects, as a link to the original with the toast "Couldn't import that image. A
   * link was added instead." A pasted `data:` image uploads as a file through `onImageUpload`.
   * Up to 20 images a paste (the rest land as links), 3 at a time. Without it, pasted images are
   * kept as they are.
   * @default undefined
   */
  onExternalImage?: (
    url: string,
    options: { signal: AbortSignal },
  ) => Promise<{ src: string; alt?: string }>;
  /**
   * A link whose href starts with this renders as a file chip, here and in `MarkdownView`.
   * @default "/api/files/"
   */
  fileLinkPrefix?: string;
  /**
   * The link an image's Download (its toolbar and the viewer) saves from, given the image's `src`
   * — a link that answers as an attachment, say. Without it, or when it returns nothing, Download
   * uses the `src` itself.
   * @default undefined
   */
  imageDownloadHref?: (src: string) => string | null | undefined;
  /**
   * `MarkdownView`'s `fileContentType`, for the read view shown before the editor activates.
   * @default undefined
   */
  fileContentType?: (href: string) => string | null | undefined;
  /**
   * The image types a paste, drop or pick inserts inline (through `onImageUpload`); any other
   * file — an SVG, a HEIC photo — goes to `onFileUpload` and lands as a file chip.
   * @default ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
   */
  inlineImageTypes?: readonly string[];
  /**
   * The document's headings (`#`–`####`) with stable ids, after load and 150ms after each change —
   * an outline rail. The read view reports them from the Markdown before the editor is in, so
   * setting it never loads the editor on its own.
   * @default undefined
   */
  onOutlineChange?: (headings: TextEditOutlineItem[]) => void;
  /**
   * The imperative handle: `scrollToHeading`, `getStats`, `openFind`, `flush`, `focus`,
   * `getAnchorForSelection`, `pulseAnnotation`.
   * @default undefined
   */
  handleRef?: React.Ref<TextEditHandle>;
  /**
   * A heading's link, copied by the `#` button that shows on a hovered heading or the caret's, and
   * by Copy link in a heading's block menu ("Link copied"). Resolved against the page's address;
   * null shows no link for that heading. `MarkdownView`'s prop of the same name.
   * @default undefined
   */
  headingLinkHref?: (anchor: TextEditHeadingAnchor) => string | null;
  /**
   * In a shared document, each viewer's own open and closed toggles, kept by the host (in
   * `localStorage`, say) so a reload keeps them. A find result, a heading link or a comment inside a
   * closed toggle opens it for the moment without recording it here.
   * @default undefined
   */
  toggleState?: TextEditToggleState;
  /**
   * The document's word and character counts, when idle after a change (300ms) and once after
   * load — a word-count popover, a size warning. Counting never runs per keystroke.
   * @default undefined
   */
  onStatsChange?: (stats: TextEditStats) => void;
  /**
   * Find and replace: <kbd>⌘F</kbd> inside the editor opens a find bar that floats over the top of
   * the text, at its end, like a browser's — the document never moves (Replace only while editable), <kbd>⌘G</kbd> / <kbd>⇧⌘G</kbd> step through the matches,
   * and <kbd>Esc</kbd> closes it with the caret back where it was. Outside the editor the
   * browser's own find runs. `handleRef.openFind()` opens it from a menu.
   * @default false
   */
  findReplace?: boolean;
  /**
   * Type <kbd>:</kbd> and two or more letters for an emoji menu (from `emoji-data`, loaded on
   * first use); the pick lands as the character itself. `10:30`, `Note:` and `https://` never open it.
   * @default false
   */
  emoji?: boolean;
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
  onCreateAnnotation?: (anchor: TextEditAnchor) => void;
  /**
   * Px every floating part — the selection bubble, the link panel, the slash and mention menus —
   * keeps clear at the viewport's top and bottom, beyond its 8px edge gap: a sticky app header's
   * height (`{ top: 56 }`) or a bottom bar's, so none ever sits under one. The selection bubble
   * opens below the selection on a coarse pointer (the platform's own callout sits above).
   * @default undefined
   */
  floatingSafeArea?: { top?: number; bottom?: number };
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
  /**
   * Called with the number of uploads still landing, each time it changes — so a host can show
   * "Uploading…" and guard leaving (a document saved while an image uploads is not saved yet).
   * @default undefined
   */
  onPendingUploadsChange?: (count: number) => void;
  /**
   * Edit a shared Yjs document live with others. The document is the truth: `value`,
   * `defaultValue`, `onValueChange`, `onCommit`, `onRevert`, `autosave` and `markSaved` are
   * ignored, Escape blurs, and undo (⌘Z) undoes only this viewer's own changes. Each
   * collaborator's caret and selection show in their hue. The editor mounts at once — read-only
   * too (`readOnly`), so a viewer sees text and carets move. A toggle's open state is each
   * viewer's own, and a record mention is stored without its title (`mentionLabel`).
   * @default undefined
   */
  collaboration?: TextEditCollaboration;
  /**
   * Show a version diff, read-only: added text and blocks underlined in the success ink, removed ones struck
   * through in the destructive ink (`ins`/`del`, each announced "Added"/"Removed"), with a legend
   * naming its `baseline`. The document is `diff.doc` — `value`, `defaultValue` and every editing
   * prop are ignored. Fixed at mount: a TextEdit is a diff view or an editor, never both; a new
   * `diff.doc` replaces the shown one. @default undefined
   */
  diff?: TextEditDiffView;
  /**
   * Fenced languages drawn by a block view instead of as code — `{ mermaid: mermaidBlockView }`
   * draws ```` ```mermaid ```` blocks as diagrams, in the read view and the editor alike. Each block
   * shows a header with the view's label, Preview / Code (Code splits beside a live preview on a
   * block at least 720px wide when the view sets `split`), Expand and a ⋯ menu. The mode is this
   * viewer's own, never saved. ⌘/Ctrl+Enter in the source goes back to the preview, as does
   * Escape; moving the caret into a previewed block opens its source. With `mermaid` set, the
   * slash menu and Turn into offer **Diagram**, which inserts the view's `starter`.
   * @default undefined
   */
  blockViews?: BlockViews;
}

/**
 * The block grip (the editor's ⋮⋮ handle) sits 20px before the text — its 16px box and a 4px gap —
 * and at least 6px inside its frame: a Dialog, Sheet, Drawer, Popover or Card (numbers and frames
 * kept equal to `text-edit-editor`'s `HANDLE_WIDTH`/`HANDLE_GUTTER`/`FRAME_INSET`/`HANDLE_FRAME`).
 * Where the frame's padding is narrower than 26px (a Dialog's 16px) the grip used to land on the
 * first characters and the caret, so the content takes just enough start padding to clear it.
 * Measured here, in the shell, so the read view and the editor share it and the swap never moves
 * the text. A `boxed` editor is its own frame and keeps its layout.
 */
const GRIP_CLEARANCE = 6 + 16 + 4;
const GRIP_FRAME =
  '[data-slot="dialog-content"],[data-slot="sheet-content"],[data-slot="drawer-content"],[data-slot="popover-content"],[data-slot="card"]';

function useHandleGutter(
  rootRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [gutter, setGutter] = React.useState(0);
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const frame = enabled ? root?.closest<HTMLElement>(GRIP_FRAME) : null;
    if (!root || !frame) return setGutter(0);
    const measure = () =>
      setGutter(
        Math.max(
          0,
          Math.ceil(
            frame.getBoundingClientRect().left +
              GRIP_CLEARANCE -
              root.getBoundingClientRect().left,
          ),
        ),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, enabled]);
  return gutter;
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
 *   at the end; drag a column border to resize (the others keep their width; a wide table scrolls). Tab / ⇧Tab move between cells (Tab in the last cell
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
    slashHint = true,
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
    typeScale = "compact",
    leading,
    actions,
    footer,
    children,
    className,
    ref,
    handleRef,
    ...editorProps
  } = props;
  const surfaceClassName = cn(
    typeScale === "document" ? documentSurfaceClassName : editorBaseClassName,
    props.diff !== undefined && diffClassName,
  );
  // Highlights need the document model, so they mount the editor at once. An outline does not:
  // the read view reports it from the Markdown, and the editor takes over once it is in.
  const composer = variant === "composer";
  // A composer is an input: its editor mounts at once, never waiting for a click. A shared
  // document mounts at once too — read-only included — so its text and carets move live.
  const collaborative = props.collaboration !== undefined;
  // A version diff needs its document model (its markings are not Markdown): at once, read-only.
  const diffing = props.diff !== undefined;
  // Section marks are decorations on the document model: a read-only document shows them too.
  const marking = (props.sectionMarks?.length ?? 0) > 0;
  const eager =
    props.annotations !== undefined ||
    composer ||
    collaborative ||
    diffing ||
    marking;
  const boxed = variant === "boxed" || composer;
  const [field, setField] = React.useState<FieldAria>({});
  const disabled = disabledProp || field.disabled === true;
  const editable = !readOnly && !disabled && !diffing;
  const resolvedId = field.id ?? id;
  const ariaInvalidAttribute = toAriaInvalidAttribute(
    field["aria-invalid"] ?? ariaInvalid,
  );
  const invalid = ariaInvalidAttribute !== undefined;

  // `active`: the editor is mounted (hidden behind the read view until it is shown). `loaded`: its
  // document is in the DOM. `engaged`: the reader asked to edit.
  //
  // `readFirst`: the read view renders something the editor cannot — citations, which the editor
  // shows as their raw `[[…]]` markers — so it stands in whenever the document is not being
  // edited. A preloaded editor waits behind it for intent instead of swapping in on mount, and
  // when an edit session ends for good (focus left the editor and its floating parts, no upload in
  // flight) the read view comes back, the editor staying mounted for the next click. Any other
  // document swaps the editor in as soon as it is loaded, and it stays.
  const readFirst = !eager && props.citation !== undefined;
  const [active, setActive] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [engaged, setEngaged] = React.useState(false);
  const ready = loaded && (engaged || !readFirst);
  const readyRef = React.useRef(ready);
  readyRef.current = ready;
  // The editor's document as the session left it, for the read view until the host's `value`
  // moves on (`forValue` is the `value` it was left against; an uncontrolled field keeps it).
  const [leftDoc, setLeftDoc] = React.useState<{
    doc: string;
    forValue: string | undefined;
  } | null>(null);
  const editorRef = React.useRef<Editor | null>(null);
  const intentRef = React.useRef<Intent | null>(null);
  // What was typed, pasted or dropped on the read view while the editor loaded: replayed into it.
  const inputRef = React.useRef<ReadInput[]>([]);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  // Images open in the `FileViewer`: from the read view while it cannot edit (a click there starts
  // editing otherwise), and from the editor's image menu or a double-click.
  const imageViewer = useImageViewer(rootRef, props.imageDownloadHref);
  const readImages = useReadImages(rootRef, !editable, imageViewer.open);

  // Read through a ref: the imperative handle keeps the first render's `activate`.
  const editableRef = React.useRef(editable);
  editableRef.current = editable;
  /**
   * Mount the editor and swap it in. Only an editable document, unless `view`: a reader's own
   * use of the editor that edits nothing (Find in a read-only document).
   */
  const activate = (intent: Intent, view = false) => {
    if (!editableRef.current && !view) return;
    intentRef.current ??= intent;
    setActive(true);
    setEngaged(true);
  };
  const onLeaveView = React.useCallback(
    (doc: string) => {
      // Only a shown editor hands back; one still waiting behind the read view has nothing to.
      if (!readyRef.current) return;
      setLeftDoc({ doc, forValue: value });
      setEngaged(false);
    },
    [value],
  );
  // A press outside the read view (the box's padding, the blank content area) is cancelled so the
  // caret lands by intent — but focus still has to go somewhere that keeps keystrokes: the read
  // view, whose typed text is replayed into the editor once it is in.
  const activateAndHold = (intent: Intent) => {
    activate(intent);
    rootRef.current
      ?.querySelector<HTMLElement>("[data-slot=text-edit-read]")
      ?.focus({ preventScroll: true });
  };
  // The editor is already loaded (it was used on this page before), or the host needs it now:
  // mount it straight away.
  React.useEffect(() => {
    if ((editorLoaded && editable) || eager) setActive(true);
  }, [editable, eager]);
  // An editable document on screen fetches the editor when the page is idle, so the first click
  // swaps it in at once.
  React.useEffect(() => {
    if (!editable || editorLoaded) return;
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(prefetchEditor, {
        timeout: 2000,
      });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(prefetchEditor, 300);
    return () => clearTimeout(timer);
  }, [editable]);
  const onReady = React.useCallback((editor: Editor) => {
    editorRef.current = editor;
    setLoaded(true);
  }, []);

  // The public handle delegates to the editor once it is in; before that, the read view answers.
  const editorHandle = React.useRef<TextEditHandle | null>(null);
  // Files handed to `uploadFiles` before the editor was in: uploaded once it is.
  const pendingFilesRef = React.useRef<File[]>([]);
  const pendingPickRef = React.useRef(false);
  // `openFind` before the editor was in: opened once it is.
  const pendingFindRef = React.useRef(false);
  // `flush()` calls waiting for the files queued before the editor was in to be handed to it.
  const handedRef = React.useRef<(() => void)[]>([]);
  const handOver = React.useCallback(() => {
    for (const resolve of handedRef.current.splice(0)) resolve();
  }, []);
  // Unmounted (or never able to edit) with files still queued: nothing will take them.
  React.useEffect(() => {
    if (!editable) {
      pendingFilesRef.current = [];
      handOver();
    }
  }, [editable, handOver]);
  React.useEffect(() => handOver, [handOver]);
  React.useImperativeHandle(
    handleRef,
    () => ({
      scrollToHeading: (id) => {
        if (editorHandle.current && readyRef.current)
          return editorHandle.current.scrollToHeading(id);
        // The read view: by block id (`data-anchor-id`), then by slug.
        const tilde = id.lastIndexOf("~");
        const slug = tilde >= 0 ? id.slice(0, tilde) : id;
        const blockId = tilde >= 0 ? id.slice(tilde + 1) : id;
        const root = rootRef.current;
        const target =
          (blockId
            ? root?.querySelector<HTMLElement>(
                `[data-anchor-id="${CSS.escape(blockId)}"]`,
              )
            : null) ??
          root?.querySelector<HTMLElement>(`[id="${CSS.escape(slug)}"]`);
        target?.scrollIntoView({ block: "start", behavior: "smooth" });
        return Boolean(target);
      },
      getStats: () =>
        editorHandle.current && readyRef.current
          ? editorHandle.current.getStats()
          : null,
      openFind: () => {
        if (editorHandle.current && readyRef.current)
          editorHandle.current.openFind();
        else {
          pendingFindRef.current = true;
          activate("end", true);
        }
      },
      // Files queued before the editor was in are uploads in flight too: wait for the editor to
      // take them, then for every upload to land.
      flush: async () => {
        if (pendingFilesRef.current.length > 0 && editableRef.current)
          await new Promise<void>((resolve) => handedRef.current.push(resolve));
        await editorHandle.current?.flush();
      },
      focus: (position) => {
        if (editorHandle.current && readyRef.current)
          editorHandle.current.focus(position);
        // The read view takes focus meanwhile, so keys typed while the editor loads are kept and
        // replayed into it.
        else activateAndHold(position ?? "end");
      },
      getAnchorForSelection: () =>
        editorHandle.current?.getAnchorForSelection() ?? null,
      pulseAnnotation: (id) => editorHandle.current?.pulseAnnotation(id),
      markSaved: () => editorHandle.current?.markSaved(),
      uploadFiles: (files) => {
        // A mounted editor (shown, or waiting behind the read view) starts the uploads now, so a
        // `flush()` right after awaits them; a hidden one is then swapped in to show them.
        if (editorHandle.current) {
          editorHandle.current.uploadFiles(files);
          if (!readyRef.current) activate("end");
        } else {
          pendingFilesRef.current.push(...files);
          activate("end");
        }
      },
      pickFiles: () => {
        if (editorHandle.current && readyRef.current)
          editorHandle.current.pickFiles();
        else {
          pendingPickRef.current = true;
          activate("end");
        }
      },
      clearHistory: () => editorHandle.current?.clearHistory(),
      pendingUploads: () =>
        (editorHandle.current?.pendingUploads() ?? 0) +
        pendingFilesRef.current.length,
      linkTaskItems: (links) => editorHandle.current?.linkTaskItems(links) ?? 0,
      setTaskItemChecked: (taskId, checked) =>
        editorHandle.current?.setTaskItemChecked(taskId, checked) ?? 0,
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
    if (!editor || editor.isDestroyed) return;
    // What was asked of the handle before the editor was in, whatever the intent.
    const handOff = () => {
      if (pendingFilesRef.current.length > 0) {
        editorHandle.current?.uploadFiles(pendingFilesRef.current);
        pendingFilesRef.current = [];
      }
      handOver();
      if (pendingPickRef.current) {
        pendingPickRef.current = false;
        editorHandle.current?.pickFiles();
      }
      if (pendingFindRef.current) {
        pendingFindRef.current = false;
        editorHandle.current?.openFind();
      }
    };
    if (!intent) return handOff();
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
          return handOff();
        }
      }
      const pos = editor.view.posAtCoords({ left: intent.x, top: intent.y });
      editor.commands.focus(pos?.pos ?? "end");
    } else editor.commands.focus(intent);
    for (const input of inputRef.current.splice(0)) replayInput(editor, input);
    handOff();
  }, [ready, handOver]);

  const handleGutter = useHandleGutter(
    rootRef,
    editable &&
      editorProps.dragHandles !== false &&
      editorProps.inset !== "none" &&
      !boxed,
  );
  const minCss = toCssLength(minHeight);
  const maxCss = toCssLength(maxHeight);
  const contentStyle: React.CSSProperties | undefined =
    minCss != null || maxCss != null || handleGutter > 0
      ? ({
          ...(minCss != null && { ["--te-min-h"]: minCss }),
          ...(maxCss != null && { ["--te-max-h"]: maxCss }),
          ...(handleGutter > 0 && { paddingInlineStart: handleGutter }),
        } as React.CSSProperties)
      : undefined;
  const contentClassName = cn(
    // Its own block formatting context: the first and last blocks' margins stay inside it, so the
    // read view and the editor (whose root holds a file input and an announcer before it) start
    // and end at the same place.
    "relative flow-root min-w-0 max-w-full",
    minCss != null && "min-h-[var(--te-min-h)]",
    maxCss != null && "max-h-[var(--te-max-h)] overflow-y-auto",
    composer && COMPOSER_CONTENT,
    composer && (leading ? "col-start-2" : "col-start-1"),
  );

  // Nothing edits the read view itself (React owns its DOM): every native edit is cancelled, and
  // kept — typing, Enter, deletions, a paste or a drop — to replay into the editor once it is in.
  const guardReadView = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const onBeforeInput = (event: InputEvent) => {
      event.preventDefault();
      keepInput(inputRef.current, event);
    };
    node.addEventListener("beforeinput", onBeforeInput);
    return () => node.removeEventListener("beforeinput", onBeforeInput);
  }, []);

  const html = format !== "markdown";
  // A controlled `value` that moves on retires the left document for good (A → C → A must not
  // bring it back).
  React.useEffect(() => {
    setLeftDoc((left) => (left && left.forValue !== value ? null : left));
  }, [value]);
  const source = props.diff
    ? ""
    : props.collaboration
      ? (props.collaboration.readCopy ?? "")
      : leftDoc && leftDoc.forValue === value
        ? leftDoc.doc
        : (value ?? defaultValue);
  const empty = isEmptyDocument(source, html);
  const resolvedLabelledBy = field["aria-labelledby"] ?? ariaLabelledBy;
  const resolvedDescribedBy = field["aria-describedby"] ?? ariaDescribedBy;
  // The read view stands in for ProseMirror's root: the same classes, role and ARIA, and — while
  // editable — `contenteditable`, so a click shows the caret and opens the keyboard at once and the
  // `boxed` focus cue (`:has([contenteditable=true]:focus)`) applies before the editor is there.
  // A read-only document is a document, not a field (B8): no textbox role to announce.
  const entry = editable || disabled;
  const surface = {
    className: surfaceClassName,
    "data-slot": "text-edit-read",
    "data-focus-cue": boxed ? "border" : "caret",
    role: entry ? "textbox" : "document",
    "aria-multiline": entry || undefined,
    id: resolvedId,
    "aria-label": ariaLabel,
    "aria-labelledby": resolvedLabelledBy,
    "aria-describedby": resolvedDescribedBy,
    "aria-invalid":
      ariaInvalidAttribute as React.AriaAttributes["aria-invalid"],
    "aria-busy": saving || undefined,
    "aria-disabled": disabled || undefined,
    contentEditable: editable,
    suppressContentEditableWarning: true,
    translate: "no" as const,
    onMouseDown: (event: React.MouseEvent) => {
      if (event.button !== 0 || isCitation(event.target)) return;
      // The editor is already mounted behind the read view, so the swap happens inside this
      // press: keep the browser from focusing (and then losing) the read view it removes — the
      // swap places the caret at this point itself.
      if (loaded && !ready) event.preventDefault();
      activate({
        x: event.clientX,
        y: event.clientY,
        checkbox: Boolean(
          (event.target as Element).closest?.("[data-slot=checkbox]"),
        ),
      });
    },
    onFocus: (event: React.FocusEvent) => {
      if (!isCitation(event.target)) activate("start");
    },
    ref: guardReadView,
    onPaste: (event: React.ClipboardEvent) => {
      event.preventDefault();
      keepTransfer(inputRef.current, event.clipboardData);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      keepTransfer(inputRef.current, event.dataTransfer);
    },
    // A link click places the caret, as in the editor, instead of navigating.
    onClick: (event: React.MouseEvent) => {
      // A task line's ↗ and a bookmark card are links of their own: they navigate.
      if (
        editable &&
        (event.target as Element).closest?.(
          "a:not([data-slot=task-inline-open]):not([data-slot=markdown-bookmark])",
        )
      )
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
          "rounded-lg border border-input transition-[color,background-color,border-color] duration-150 ease-out has-[[contenteditable=true]:focus]:not-data-invalid:border-ring/50 data-invalid:border-destructive dark:bg-input/30 dark:data-invalid:border-destructive/50",
        boxed && !composer && "px-2.5 py-2",
        composer && COMPOSER_ROOT,
        composer &&
          (leading
            ? "grid-cols-[auto_minmax(0,1fr)_auto]"
            : "grid-cols-[minmax(0,1fr)_auto] ps-[7px]"),
        editable && "cursor-text",
        !editable && "[&_img[data-viewer]]:cursor-zoom-in",
        disabled && "opacity-50",
        className,
      )}
      onClick={readImages.onClick}
      onKeyDown={readImages.onKeyDown}
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
              else activateAndHold("end");
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
      {props.diff ? <DiffLegend baseline={props.diff.baseline} /> : null}
      {!ready ? (
        <div
          data-slot="text-edit-content"
          // Clicking the blank space around short content still starts editing, Notion-style.
          onMouseDown={(event) => {
            if (!editable || event.target !== event.currentTarget) return;
            event.preventDefault();
            activateAndHold("end");
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
              mentionImage={props.mentionImage}
              mentionStatus={props.mentionStatus}
              onTaskOpen={props.onTaskOpen}
              citation={props.citation}
              fileLinkPrefix={props.fileLinkPrefix}
              embeds={props.embeds}
              renderTaskQuery={props.renderTaskQuery}
              renderLiveBlock={props.renderLiveBlock}
              liveBlockKinds={props.liveBlockKinds}
              fileContentType={props.fileContentType}
              blockViews={props.blockViews}
              typeScale={typeScale}
              onOutlineChange={props.onOutlineChange}
              headingLinkHref={props.headingLinkHref}
              headingIds={props.headingLinkHref !== undefined}
              // A reader comments from the read view: it stands in for the editor while the
              // document cannot be edited (an editable one loads the editor on the press).
              onCreateAnnotation={
                editable || !props.onCreateAnnotation
                  ? undefined
                  : // The view's selection anchors carry their offsets (`anchorFromRange`).
                    (anchor) => props.onCreateAnnotation?.(anchor as TextAnchor)
              }
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
            readOnly={readOnly || diffing}
            disabled={disabled}
            aria-label={ariaLabel}
            aria={{
              id: resolvedId,
              "aria-labelledby": resolvedLabelledBy,
              "aria-describedby": resolvedDescribedBy,
              "aria-invalid": ariaInvalidAttribute,
            }}
            variant={variant}
            surfaceClassName={surfaceClassName}
            hintClassName={slashHint ? slashHintClassName : ""}
            contentClassName={contentClassName}
            contentStyle={contentStyle}
            rootRef={rootRef}
            hidden={!ready}
            onReady={onReady}
            onLeaveView={readFirst ? onLeaveView : undefined}
            editorHandle={editorHandle}
            onOpenImage={imageViewer.open}
            onOpenFile={(href: string, name: string) =>
              imageViewer.openFile(
                fileItem(href, name, props.fileContentType?.(href)),
              )
            }
          />
        </React.Suspense>
      ) : null}
      {composer && leading ? (
        <div data-slot="text-edit-leading" className={COMPOSER_LEADING}>
          {leading}
        </div>
      ) : null}
      {composer && actions ? (
        <div
          data-slot="text-edit-actions"
          className={cn(
            COMPOSER_ACTIONS,
            leading ? "col-start-3" : "col-start-2",
          )}
        >
          {actions}
        </div>
      ) : null}
      {composer && footer ? (
        <div data-slot="text-edit-footer" className={COMPOSER_FOOTER}>
          {footer}
        </div>
      ) : null}
      {children}
      {imageViewer.element}
    </div>
  );
}

const ALL_ORIGINS = ["*"] as const;

/** A citation marker in the read view: its press and focus belong to it, not to editing. */
/**
 * A control of its own in the read view — a citation, a task line's title or ↗, a bookmark card:
 * pressing or focusing it never starts an edit.
 */
const isCitation = (target: EventTarget) =>
  Boolean(
    (target as Element).closest?.(
      "[data-slot=markdown-citation],[data-slot=task-inline-title],[data-slot=task-inline-open],[data-slot=markdown-bookmark]",
    ),
  );
