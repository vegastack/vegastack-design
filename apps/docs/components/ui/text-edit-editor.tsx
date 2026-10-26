// @vegastack text-edit@0.25.88 sha256-RJ+6Hm52OGtFFC65+zVzeO1ca6jadkWSFHVdlgSmbRA=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  useEditor,
  useEditorState,
  EditorContent,
  Extension,
  Node as TiptapNode,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  ReactWidgetRenderer,
  ResizableNodeView,
  mergeAttributes,
  posToDOMRect,
  textblockTypeInputRule,
  type Editor,
  type JSONContent,
  type NodeViewRenderer,
  type Range,
  type ReactNodeViewProps,
  type AnyExtension,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Placeholder } from "@tiptap/extensions";
import {
  FindAndReplace,
  FindAndReplacePluginKey,
  createSearchRegex,
} from "@tiptap/extension-find-and-replace";
import {
  Suggestion,
  exitSuggestion,
  type SuggestionMatch,
  type SuggestionProps,
  type Trigger,
} from "@tiptap/suggestion";
import { Collaboration, isChangeOrigin } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
  yCursorPlugin,
  yUndoPluginKey,
} from "@tiptap/y-tiptap";
import * as Y from "yjs";
import { Fragment, Slice, type Node as PMNode } from "@tiptap/pm/model";
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";
import { Mapping } from "@tiptap/pm/transform";
import { closeHistory } from "@tiptap/pm/history";
import {
  CellSelection,
  TableMap,
  addColumn,
  addRow,
  deleteCellSelection,
} from "@tiptap/pm/tables";
import {
  Decoration as PMDecoration,
  DecorationSet,
  type EditorProps,
  type EditorView,
} from "@tiptap/pm/view";
import { Toolbar } from "@base-ui/react/toolbar";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CaseSensitive,
  Check,
  ChevronRight,
  ChevronUp,
  CopyPlus,
  FileCode,
  ListCollapse,
  Regex,
  Repeat2,
  ReplaceAll,
  Search,
  WholeWord,
  X,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  Bot,
  ChevronDown,
  CircleCheck,
  Link2,
  Code,
  Copy,
  Download,
  Ellipsis,
  Replace,
  Eraser,
  ExternalLink,
  File as FileIcon,
  GripHorizontal,
  GripVertical,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  ListTodo,
  MessageSquarePlus,
  Minus,
  PanelLeft,
  PanelTop,
  Play,
  Pilcrow,
  Plus,
  Quote,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Upload,
  UserRound,
  WrapText,
  Workflow,
  Film,
  AudioLines,
  Captions,
  ScanText,
  Pencil,
  Unlink,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button, buttonVariants } from "@/components/ui/button";
import { dropIndicatorClasses } from "@/lib/drag-item";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import {
  CODE_LANGUAGES,
  codeBlockActionsClassName,
  codeBlockControlClassName,
  codeBlockControlsPadClassName,
  codeBlockPreClassName,
  codeBlockSurfaceClassName,
  codeBlockWrapStyle,
  codeLanguageName,
  normalizeCodeLanguage,
} from "@/components/ui/code-block";
import { codeLowlight } from "@/lib/code-highlight";
import {
  BlockViewFrame,
  initialBlockViewMode,
  type BlockView,
  type BlockViewMode,
  type BlockViews,
} from "@/components/ui/block-view";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dropzone } from "@/components/ui/dropzone";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InlineChip,
  useInlineChipResolver,
  type InlineChipLinkPreview,
  type InlineChipResolver,
} from "@/components/ui/inline-chip";
import {
  SuggestionMenu,
  suggestionMenuKeyDown,
  suggestionMenuOptionId,
  useSuggestionMenuSheet,
  type SuggestionMenuOption,
} from "@/components/ui/suggestion-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import {
  CALLOUT_STYLE,
  MarkdownEmbed,
  MarkdownLiveBlock,
  MEDIA_AUDIO_CLASS,
  MEDIA_VIDEO_CLASS,
  annotationActiveClassName,
  annotationCountClassName,
  annotationCountVisibilityClassName,
  annotationHighlightClassName,
  calloutClassName,
  calloutContentClassName,
  copyWithToast,
  headingLinkClassName,
  markdownExtrasClassName,
  sectionHeading,
  sectionMarkClassNames,
  liveBlockRenderer,
  type LiveBlockRender,
} from "@/components/ui/markdown-view";
import {
  CALLOUT_TONES,
  DEFAULT_LIVE_BLOCK_KINDS,
  headingIds,
  isRecordMentionKind,
  type CalloutTone,
  type LiveBlockKind,
  type MentionKind,
} from "@/lib/text-edit-grammar";
import {
  blockId as newBlockId,
  EMBED_CONTAINERS,
  textEditExtensions,
  ychangeType,
} from "@/lib/text-edit-schema";
import { matchEmbed, type EmbedProviders } from "@/lib/embed-providers";
import { VegaStackMarkdown } from "@/lib/text-edit-markdown";
import { useFileDrop } from "@/components/ui/use-file-drop";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { FileTypeIcon } from "@/lib/file-kind";
import {
  anchorFromRange,
  resolveAnchor,
  type TextAnchor,
} from "@/lib/text-anchor";
import {
  anchorText,
  offsetsToRange,
  rangeToOffsets,
} from "@/lib/text-anchor-doc";
import type {
  MentionKindConfig,
  MentionOption,
  MentionSection,
  TextEditAnchor,
  TextEditCollaboration,
  TextEditCollaborationUser,
  TextEditHandle,
  TextEditProps,
  TextEditSlashAction,
  TextEditSlashCommand,
  TextEditStats,
  TextEditToggleState,
  TextEditHeadingAnchor,
} from "@/components/ui/text-edit";
import type { AvatarHue } from "@/components/ui/avatar";
import { PersonAvatar } from "@/components/ui/person-avatar";
import {
  linkedTaskId,
  TEXT_EDIT_UPLOAD_ABORT,
  type TextEditSectionMark,
  type TextEditTaskItem,
  type TextEditTaskLink,
} from "@/components/ui/text-edit";

/*
 * The heavy half of `TextEdit`: the Tiptap editor itself. `text-edit.tsx` renders the saved
 * document as light read HTML (server-rendered, no editor code) and loads THIS module only on
 * intent — a hover, a focus or a click — then swaps it in place. Nothing imports this file
 * statically; use `TextEdit`.
 */

/* ------------------------------------------------------------------------------------------------
 * Slash commands
 * ----------------------------------------------------------------------------------------------*/

/**
 * A floating panel the editor can open at the caret or over a selection. `file` opens no panel:
 * it opens the file picker (the slash menu's File).
 */
type Panel = "link" | "image" | "video" | "audio" | "file" | "turnInto";

/** What an insert panel (or an upload) puts in the document. */
type MediaKind = "image" | "video" | "audio" | "file";

interface SlashSpec {
  /** A built-in command, or a host item's `host:<id>`. */
  id: TextEditSlashCommand | `host:${string}`;
  label: string;
  /** Extra words the filter matches. */
  keywords: string;
  hint?: string;
  icon: React.ComponentType;
  /** A host item's own glyph, drawn in place of `icon`. */
  glyph?: React.ReactNode;
  /** Muted text after the label (a host item's description, or why it is disabled). */
  description?: string;
  /** What the block is, in a few words: a built-in's line on a `menuSize="lg"` menu. */
  blurb?: string;
  /** A host item's heading (`TextEditSlashAction.group`). */
  hostGroup?: string;
  /** Shown but not choosable. */
  disabled?: boolean;
  run: (ed: Editor, range: Range, open: (panel: Panel) => void) => void;
}

/**
 * The `/` menu's headings, in the menu's order: what the line is, lists, blocks, media, then what
 * the caret inserts (a link, and the host's own items).
 */
const SLASH_GROUP: Record<TextEditSlashCommand, string> = {
  text: "Text",
  h1: "Text",
  h2: "Text",
  h3: "Text",
  h4: "Text",
  bulletList: "Lists",
  orderedList: "Lists",
  taskList: "Lists",
  blockquote: "Blocks",
  callout: "Blocks",
  toggle: "Blocks",
  divider: "Blocks",
  codeBlock: "Blocks",
  diagram: "Blocks",
  table: "Blocks",
  image: "Media",
  video: "Media",
  audio: "Media",
  file: "Media",
  link: "Insert",
};
const HOST_SLASH_GROUP = "Insert";

/**
 * The `menuSize="lg"` menu's headings (UXP-03): the basic blocks, then the host's own items, then
 * media, then the advanced blocks. A host item takes its own `group` ("Insert" by default).
 */
const LG_SLASH_GROUP: Record<
  TextEditSlashCommand,
  "Basic" | "Media" | "Advanced"
> = {
  text: "Basic",
  h1: "Basic",
  h2: "Basic",
  h3: "Basic",
  h4: "Basic",
  bulletList: "Basic",
  orderedList: "Basic",
  taskList: "Basic",
  blockquote: "Basic",
  callout: "Basic",
  toggle: "Basic",
  divider: "Basic",
  image: "Media",
  video: "Media",
  audio: "Media",
  file: "Media",
  link: "Media",
  codeBlock: "Advanced",
  diagram: "Advanced",
  table: "Advanced",
};

/** A slash item's heading in the full menu, by size. */
function slashGroup(spec: SlashSpec, lg: boolean): string {
  if (spec.id.startsWith("host:")) return spec.hostGroup ?? HOST_SLASH_GROUP;
  const id = spec.id as TextEditSlashCommand;
  return lg ? LG_SLASH_GROUP[id] : SLASH_GROUP[id];
}

/** Where a slash item sits on the full `lg` menu: Basic · the host's · Media · Advanced. */
function lgSlashRank(spec: SlashSpec): number {
  if (spec.id.startsWith("host:")) return 1;
  const group = LG_SLASH_GROUP[spec.id as TextEditSlashCommand];
  return group === "Basic" ? 0 : group === "Media" ? 2 : 3;
}

const heading =
  (level: 1 | 2 | 3 | 4) =>
  (ed: Editor, range: Range): void =>
    void ed.chain().focus().deleteRange(range).setHeading({ level }).run();

const SLASH: Record<TextEditSlashCommand, SlashSpec> = {
  text: {
    id: "text",
    blurb: "Plain text",
    label: "Text",
    keywords: "paragraph plain p",
    icon: Pilcrow,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setParagraph().run(),
  },
  h1: {
    id: "h1",
    blurb: "Big section heading",
    label: "Heading 1",
    keywords: "title h1 #",
    hint: "#",
    icon: Heading1,
    run: heading(1),
  },
  h2: {
    id: "h2",
    blurb: "Medium section heading",
    label: "Heading 2",
    keywords: "subtitle h2 ##",
    hint: "##",
    icon: Heading2,
    run: heading(2),
  },
  h3: {
    id: "h3",
    blurb: "Small section heading",
    label: "Heading 3",
    keywords: "h3 ###",
    hint: "###",
    icon: Heading3,
    run: heading(3),
  },
  h4: {
    id: "h4",
    blurb: "Smallest heading",
    label: "Heading 4",
    keywords: "h4 ####",
    hint: "####",
    icon: Heading4,
    run: heading(4),
  },
  bulletList: {
    id: "bulletList",
    blurb: "A simple bulleted list",
    label: "Bullet list",
    keywords: "unordered ul bullets -",
    hint: "-",
    icon: List,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  orderedList: {
    id: "orderedList",
    blurb: "A list with numbers",
    label: "Numbered list",
    keywords: "ordered ol numbers 1.",
    hint: "1.",
    icon: ListOrdered,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  taskList: {
    id: "taskList",
    blurb: "Track to-dos with checkboxes",
    label: "Checklist",
    keywords: "todo task checkbox [ ]",
    hint: "[ ]",
    icon: ListTodo,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  blockquote: {
    id: "blockquote",
    blurb: "Capture a quote",
    label: "Quote",
    keywords: "blockquote citation >",
    hint: ">",
    icon: Quote,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  callout: {
    id: "callout",
    blurb: "Make a note stand out",
    label: "Callout",
    keywords: "note tip warning alert info admonition",
    icon: Info,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).wrapIn("callout").run(),
  },
  toggle: {
    id: "toggle",
    blurb: "Hide content inside a fold",
    label: "Toggle",
    keywords: "details summary collapse disclosure fold",
    icon: ChevronDown,
    run: (ed, range) => {
      ed.chain().focus().deleteRange(range).run();
      insertToggle(ed);
    },
  },
  divider: {
    id: "divider",
    blurb: "Separate sections",
    label: "Divider",
    keywords: "hr rule separator line ---",
    hint: "---",
    icon: Minus,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  codeBlock: {
    id: "codeBlock",
    blurb: "Code with syntax highlighting",
    label: "Code block",
    keywords: "pre snippet fence ```",
    hint: "```",
    icon: SquareCode,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  diagram: {
    id: "diagram",
    blurb: "A flowchart or sequence, from text",
    label: "Diagram",
    keywords: "mermaid flowchart sequence gantt chart",
    icon: Workflow,
    run: (ed, range) => {
      ed.chain().focus().deleteRange(range).run();
      turnIntoBlockView(ed, "mermaid");
    },
  },
  table: {
    id: "table",
    blurb: "Rows and columns",
    label: "Table",
    keywords: "grid rows columns gfm",
    icon: TableIcon,
    run: (ed, range) =>
      ed
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  image: {
    id: "image",
    blurb: "Upload or link an image",
    label: "Image",
    keywords: "picture photo img url",
    icon: ImageIcon,
    run: (ed, range, open) => {
      ed.chain().focus().deleteRange(range).run();
      open("image");
    },
  },
  video: {
    id: "video",
    blurb: "Upload or link a video",
    label: "Video",
    keywords: "movie clip mp4 webm recording youtube loom embed",
    icon: Film,
    run: (ed, range, open) => {
      ed.chain().focus().deleteRange(range).run();
      open("video");
    },
  },
  audio: {
    id: "audio",
    blurb: "Upload or link a sound clip",
    label: "Audio",
    keywords: "sound music voice recording mp3",
    icon: AudioLines,
    run: (ed, range, open) => {
      ed.chain().focus().deleteRange(range).run();
      open("audio");
    },
  },
  file: {
    id: "file",
    blurb: "Attach any file",
    label: "File",
    keywords: "upload attachment document pdf",
    icon: FileIcon,
    run: (ed, range, open) => {
      ed.chain().focus().deleteRange(range).run();
      open("file");
    },
  },
  link: {
    id: "link",
    blurb: "Link to a page or site",
    label: "Link",
    keywords: "url href anchor",
    hint: "⌘K",
    icon: LinkIcon,
    run: (ed, range, open) => {
      ed.chain().focus().deleteRange(range).run();
      open("link");
    },
  },
};

/** Put an empty toggle where the caret's block is (replacing it when empty), caret in its summary. */
function insertToggle(ed: Editor) {
  const { state } = ed;
  const { $from } = state.selection;
  const toggle = state.schema.nodes.toggle!.create(null, [
    state.schema.nodes.toggleSummary!.create(),
    state.schema.nodes.paragraph!.create(),
  ]);
  const depth = $from.depth >= 1 ? $from.depth : 1;
  const block = $from.node(depth);
  const before = $from.before(depth);
  const tr = state.tr;
  let at: number;
  if (block.isTextblock && block.content.size === 0) {
    tr.replaceWith(before, before + block.nodeSize, toggle);
    at = before;
  } else {
    at = $from.after(depth);
    tr.insert(at, toggle);
  }
  tr.setSelection(TextSelection.create(tr.doc, at + 2));
  ed.view.dispatch(tr.scrollIntoView());
}

/** The commands that make a block of their own; a table cell holds one line, so it offers none. */
const BLOCK_COMMANDS: ReadonlySet<TextEditSlashCommand> = new Set([
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
  "divider",
]);

/** Whether the selection starts inside a table cell (a body or a header cell). */
function inTableCell(state: EditorState): boolean {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const role = $from.node(depth).type.spec.tableRole;
    if (role === "cell" || role === "header_cell") return true;
  }
  return false;
}

/**
 * A mention chip and the space after it — what the `@` menu inserts. A shared document never
 * stores a record's title (a page or task the reader may not see): each reader's chip resolves it.
 */
function mentionChip(
  collaborative: boolean,
  mention: { kind: string; id: string; label: string },
): JSONContent[] {
  return [
    {
      type: "mention",
      attrs: {
        kind: mention.kind,
        id: mention.id,
        label:
          collaborative && isRecordMentionKind(mention.kind as MentionKind)
            ? ""
            : mention.label.replace(/\s*\n\s*/g, " "),
      },
    },
    { type: "text", text: " " },
  ];
}

/** A host's `/` item (`slashActions`) as a menu entry: the typed query goes, then its `onSelect`. */
function hostSlashSpec(action: TextEditSlashAction): SlashSpec {
  return {
    id: `host:${action.id}`,
    label: action.label,
    keywords: (action.keywords ?? []).join(" "),
    icon: Plus,
    glyph: action.icon,
    hostGroup: action.group,
    description: action.disabled
      ? (action.disabledReason ?? action.description)
      : action.description,
    disabled: action.disabled,
    run: (ed, range) => {
      if (action.disabled) return;
      ed.chain().focus().deleteRange(range).run();
      action.onSelect({
        insertMention: (mention) => {
          if (ed.isDestroyed) return;
          ed.chain()
            .focus()
            .insertContent(mentionChip(yBinding(ed.state) !== null, mention))
            .run();
        },
        insertContent: (content) => {
          if (ed.isDestroyed) return;
          ed.chain()
            .focus()
            .insertContent(content as JSONContent | JSONContent[])
            .run();
        },
      });
    },
  };
}

/** A menu query compared loosely: lower case, without spaces (`/head2` finds "Heading 2"). */
const compact = (text: string) => text.toLowerCase().replace(/\s+/g, "");

function filterSlash(
  allowed: readonly TextEditSlashCommand[],
  query: string,
  inCell = false,
  actions: readonly TextEditSlashAction[] = [],
  lg = false,
): SlashSpec[] {
  const q = query.trim().toLowerCase();
  // Words, and a run of letters and a run of digits apart: `head2` is "head" and "2".
  const words = q
    .replace(/(\p{L})(\p{N})|(\p{N})(\p{L})/gu, "$1$3 $2$4")
    .split(/\s+/)
    .filter(Boolean);
  // One menu everywhere: the canonical order, whatever order the host's subset lists; the host's
  // own items after the built-in ones.
  const wanted = new Set(allowed);
  const found = [
    ...(Object.keys(SLASH) as TextEditSlashCommand[])
      .filter((id) => wanted.has(id) && (!inCell || !BLOCK_COMMANDS.has(id)))
      .map((id) => SLASH[id]),
    ...actions.map(hostSlashSpec),
  ].filter((spec) => {
    if (!q) return true;
    const label = spec.label.toLowerCase();
    const keywords = spec.keywords.toLowerCase();
    // "heading 2", "head2", "h2": the label read without spaces, or every word starting a word
    // of the label (or found in its keywords).
    const labelWords = label.split(/\s+/);
    return (
      compact(label).includes(compact(q)) ||
      keywords.includes(q) ||
      words.every(
        (word) =>
          labelWords.some((each) => each.startsWith(word)) ||
          keywords.includes(word),
      )
    );
  });
  // The full `lg` menu in its group order (a stable sort): the arrow keys walk it as it shows.
  return lg && !q
    ? found
        .map((spec, index) => ({ spec, index }))
        .sort(
          (a, b) =>
            lgSlashRank(a.spec) - lgSlashRank(b.spec) || a.index - b.index,
        )
        .map(({ spec }) => spec)
    : found;
}

/**
 * A suggestion trigger whose query may hold spaces and digits — `/heading 2`, `@Asha Rao` — up to
 * `maxWords` words and `maxChars` characters. Read across marks (a bold word inside the query
 * keeps the match) and closed by a leading space, two spaces in a row, or an atom (a mention).
 * The trigger must start the line or follow a space or an opening bracket, so `and/or` and a URL
 * never open a menu.
 */
function phraseMatch({
  maxWords,
  maxChars,
}: {
  maxWords: number;
  maxChars: number;
}) {
  return ({ char, $position }: Trigger): SuggestionMatch => {
    const offset = $position.parentOffset;
    const start = Math.max(0, offset - maxChars - 2);
    const read = (from: number, to: number) =>
      $position.parent.textBetween(from, to, undefined, "\ufffc");
    const before = read(start, offset);
    const at = before.lastIndexOf(char);
    if (at < 0) return null;
    const lead =
      at > 0 ? before[at - 1]! : start > 0 ? read(start - 1, start) : "";
    // Only where the line, a space or an opening bracket comes before the trigger.
    if (lead && !/[\s([{"'“‘]/.test(lead)) return null;
    const query = before.slice(at + 1);
    if (/^\s|\s\s|\ufffc/.test(query)) return null;
    if (query.length > maxChars) return null;
    if (query.trim().split(/\s+/).filter(Boolean).length > maxWords)
      return null;
    const from = $position.pos - (before.length - at);
    return {
      range: { from, to: $position.pos },
      query,
      text: before.slice(at),
    };
  };
}

interface SlashState {
  items: SlashSpec[];
  /** What follows the `/`: empty for the full, grouped menu. */
  query: string;
  index: number;
  rect: DOMRect | null;
  command: (spec: SlashSpec) => void;
}

/* ------------------------------------------------------------------------------------------------
 * Node views
 * ----------------------------------------------------------------------------------------------*/
/** Each editor's node views watching its editability (`useEditorEditable`). */
const EDITABLE_WATCHERS = new WeakMap<Editor, Set<() => void>>();

function editableWatchers(editor: Editor): Set<() => void> {
  let set = EDITABLE_WATCHERS.get(editor);
  if (!set) EDITABLE_WATCHERS.set(editor, (set = new Set()));
  return set;
}

/**
 * Tells `useEditorEditable` when the editor's editability changes. `setEditable` — silent
 * (`emitUpdate: false`) or not — ends in `view.updateState`, which updates every plugin view, so
 * this sees each change whether or not an event or a transaction goes with it.
 */
function editableWatchExtension() {
  return Extension.create({
    name: "textEditEditableWatch",
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        new Plugin({
          view: () => {
            let last = editor.isEditable;
            return {
              update: () => {
                if (editor.isEditable === last) return;
                last = editor.isEditable;
                for (const watcher of [...editableWatchers(editor)]) watcher();
              },
            };
          },
        }),
      ];
    },
  });
}

/**
 * The editor's editability, re-rendering the calling node view when it changes. A node view is
 * otherwise redrawn only when its node or decorations change, so one that reads
 * `editor.isEditable` while rendering would keep the value it mounted with — a collaborative
 * editor mounts read-only until its room is ready.
 */
function useEditorEditable(editor: Editor): boolean {
  return React.useSyncExternalStore(
    React.useCallback(
      (onChange: () => void) => {
        const watchers = editableWatchers(editor);
        watchers.add(onChange);
        return () => {
          watchers.delete(onChange);
        };
      },
      [editor],
    ),
    () => editor.isEditable,
    () => editor.isEditable,
  );
}

/**
 * Task item node view: the system `Checkbox` beside a content box — the same DOM `MarkdownView`
 * renders for a GFM task item, so `prose.taskList` lays both out identically.
 */
function TaskItemView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const checked = Boolean(node.attrs.checked);
  const editable = useEditorEditable(editor);
  return (
    <NodeViewWrapper className="contents">
      <Checkbox
        contentEditable={false}
        checked={checked}
        disabled={!editable}
        onCheckedChange={(next) => updateAttributes({ checked: next === true })}
        aria-label={checked ? "Mark task not done" : "Mark task done"}
        className="data-disabled:cursor-default data-disabled:opacity-100"
      />
      <NodeViewContent data-slot="task-item-content" />
    </NodeViewWrapper>
  );
}

/**
 * The code block's language picker (top-left, always shown): a ghost button with the language's display
 * name that opens a searchable list, "Plain text" first. Picking writes the fence's info string.
 */
function CodeLanguagePicker({
  language,
  onChange,
}: {
  language: string | undefined;
  onChange: (language: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = normalizeCodeLanguage(language);
  const known = CODE_LANGUAGES.some(([id]) => id === current);
  const options =
    language && !known
      ? [[language, language] as const, ...CODE_LANGUAGES]
      : CODE_LANGUAGES;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            data-slot="code-block-language"
            aria-label={`Code language: ${codeLanguageName(language)}`}
            className={cn(
              codeBlockControlClassName,
              "start-1.5 text-muted-foreground",
            )}
          />
        }
      >
        {codeLanguageName(language)}
        <ChevronDown aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-text-edit-menu=""
        className="w-56 gap-0 p-0"
      >
        <Command>
          <CommandInput placeholder="Search languages…" />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            {options.map(([id, name]) => (
              <CommandItem
                key={id || "plain"}
                value={`${name} ${id}`}
                data-checked={
                  (known ? id === current : id === language) || undefined
                }
                onSelect={() => {
                  setOpen(false);
                  onChange(id || null);
                }}
              >
                {name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Code block node view: `CodeBlock`'s Notion-style surface (no border or header bar; the language
 * top-left, the wrap and copy icons top-right), so a fenced block is the same box in edit mode as
 * `MarkdownView` renders in view mode. Highlighting is the lowlight extension's decorations.
 * While editable the language is a searchable picker that writes the fence's info string
 * (```` ```ts ````) and the wrap icon toggles the saved `wrap` attribute (```` ```ts wrap ````);
 * read-only the language is a label. Unwrapped lines scroll sideways inside the block only.
 */
/** A code block's text as it is now: in a version diff, without the lines it removed. */
function currentCode(node: PMNode): string {
  let text = "";
  node.forEach((child) => {
    if (
      !child.marks.some(
        (mark) =>
          mark.type.name === "ychange" &&
          ychangeType(mark.attrs.type) === "removed",
      )
    )
      text += child.text ?? "";
  });
  return text;
}

function CodeBlockView({
  node,
  editor,
  updateAttributes,
  getPos,
}: ReactNodeViewProps) {
  useEditorEditable(editor);
  const language = (node.attrs.language as string | null) || undefined;
  const blockView = blockViewOf(editor, language);
  if (blockView && language)
    return (
      <BlockCodeView
        node={node}
        editor={editor}
        getPos={getPos}
        view={blockView}
        language={language}
      />
    );
  const wrap = Boolean(node.attrs.wrap);
  const backIn = () => {
    // Back into the code block, at its end: a control took focus out of the editor.
    const pos = getPos();
    const end =
      typeof pos === "number"
        ? pos + editor.state.doc.nodeAt(pos)!.nodeSize - 1
        : undefined;
    editor.commands.focus(end, { scrollIntoView: false });
  };
  return (
    <NodeViewWrapper
      as="figure"
      data-slot="code-block"
      data-language={language}
      data-wrap={wrap ? "" : undefined}
      className={cn(codeBlockSurfaceClassName, "my-2")}
    >
      <div contentEditable={false} className="select-none">
        {editor.isEditable ? (
          <CodeLanguagePicker
            language={language}
            onChange={(next) => {
              updateAttributes({ language: next });
              backIn();
            }}
          />
        ) : language ? (
          <span
            data-slot="code-block-header"
            className={cn(
              codeBlockControlClassName,
              "start-1.5 flex h-7 items-center border border-transparent px-2 text-xs text-muted-foreground",
            )}
          >
            {codeLanguageName(language)}
          </span>
        ) : null}
        <div
          data-slot="code-block-actions"
          className={codeBlockActionsClassName}
        >
          {editor.isEditable ? (
            <MenuTip label={wrap ? "Don't wrap lines" : "Wrap lines"}>
              <Toggle
                size="sm"
                pressed={wrap}
                aria-label="Wrap lines"
                data-slot="code-block-wrap"
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={(next) => updateAttributes({ wrap: next })}
                className="size-6 min-w-6 px-0 text-muted-foreground"
              >
                <WrapText />
              </Toggle>
            </MenuTip>
          ) : null}
          <CopyButton
            value={currentCode(node)}
            size="icon-xs"
            variant="ghost"
            copyLabel="Copy code"
          />
        </div>
      </div>
      <pre
        data-slot="code-block-pre"
        data-wrap={wrap ? "" : undefined}
        style={codeBlockWrapStyle(wrap)}
        className={cn(codeBlockPreClassName, codeBlockControlsPadClassName)}
      >
        {/* Tiptap writes `white-space: pre-wrap` on the content element; it inherits the pre's. */}
        <NodeViewContent<"code">
          as="code"
          className="font-mono"
          style={{ whiteSpace: "inherit" }}
        />
      </pre>
    </NodeViewWrapper>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Block views (`blockViews`): a code block whose language the host draws (```mermaid → a diagram)
 * ----------------------------------------------------------------------------------------------*/

/** Each editor's `blockViews`, for its node views and commands (kept current as it renders). */
const blockViewsByEditor = new WeakMap<Editor, BlockViews>();

function blockViewOf(
  editor: Editor,
  language: string | null | undefined,
): BlockView | undefined {
  return language ? blockViewsByEditor.get(editor)?.[language] : undefined;
}

/** Make the caret's block a `language` block view; an empty one gets the view's starter. */
function turnIntoBlockView(ed: Editor, language: string) {
  const starter = blockViewOf(ed, language)?.starter?.replace(/\n$/, "") ?? "";
  const chain = ed.chain().focus();
  if (ed.isActive("codeBlock"))
    chain.updateAttributes("codeBlock", { language });
  else chain.clearNodes().setCodeBlock({ language });
  chain
    .command(({ tr }) => {
      const { $from } = tr.selection;
      if (
        starter &&
        $from.parent.type.name === "codeBlock" &&
        $from.parent.content.size === 0
      )
        tr.insertText(starter);
      return true;
    })
    .run();
}

/** Asks a block view's node view to change its mode (the editor's ⌘Enter and Escape). */
const BLOCK_VIEW_MODE_EVENT = "vs-block-view-mode";

/** ⌘Enter or Escape with the caret in a block view's source: back to its preview. */
function blockViewKey(view: EditorView, editor: Editor | null): boolean {
  if (!editor) return false;
  const { $from } = view.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== "codeBlock") continue;
    if (!blockViewOf(editor, node.attrs.language as string | null))
      return false;
    const dom = view.nodeDOM($from.before(depth)) as HTMLElement | null;
    const frame = dom?.querySelector?.("[data-slot=block-view]");
    if (!frame) return false;
    frame.dispatchEvent(
      new CustomEvent<BlockViewMode>(BLOCK_VIEW_MODE_EVENT, {
        detail: "preview",
      }),
    );
    return true;
  }
  return false;
}

/**
 * Which events a code block's node view keeps from ProseMirror: Tiptap's default for a plain code
 * block (its controls), plus every non-drag event inside a block view's header and preview, so a
 * press on a diagram never moves the caret into its hidden source.
 */
function codeBlockStopEvent({ event }: { event: Event }): boolean {
  const target = event.target as HTMLElement | null;
  if (!target?.closest || target.closest("[data-node-view-content]"))
    return false;
  const drag = event.type.startsWith("drag") || event.type === "drop";
  if (target.closest("[data-block-view-chrome]")) return !drag;
  if (
    ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target.tagName) ||
    target.isContentEditable
  )
    return !drag;
  return !(drag || ["copy", "paste", "cut", "mousedown"].includes(event.type));
}

/**
 * A code block a block view draws: the shared `BlockViewFrame` with the live source as its Code
 * pane. The source (`NodeViewContent`) stays mounted and is hidden in Preview. The mode is this
 * viewer's React state, never the document's: a new empty block (or one holding the starter) opens
 * in Code; Preview moves the caret on past the block; the caret arriving inside opens Code.
 */
function BlockCodeView({
  node,
  editor,
  getPos,
  view,
  language,
}: Pick<ReactNodeViewProps, "node" | "editor" | "getPos"> & {
  view: BlockView;
  language: string;
}) {
  const source = currentCode(node);
  const editable = editor.isEditable;
  const [mode, setModeState] = React.useState<BlockViewMode>(() =>
    initialBlockViewMode(view, source, editable),
  );
  const modeRef = React.useRef(mode);
  modeRef.current = mode;
  const frameRef = React.useRef<HTMLDivElement>(null);
  const span = React.useCallback(() => {
    const pos = getPos();
    const current =
      typeof pos === "number" ? editor.state.doc.nodeAt(pos) : null;
    return current && typeof pos === "number"
      ? { from: pos, to: pos + current.nodeSize }
      : null;
  }, [editor, getPos]);
  const setMode = React.useCallback(
    (next: BlockViewMode) => {
      setModeState(next);
      if (!editor.isEditable || editor.isDestroyed) return;
      const at = span();
      if (!at) return;
      if (next === "code") {
        editor.commands.focus(at.to - 1, { scrollIntoView: false });
        return;
      }
      // Preview: a caret inside the source moves on to the next text after the block.
      const { state } = editor;
      const { from, to } = state.selection;
      if (from <= at.from || to >= at.to) return;
      const after = TextSelection.findFrom(state.doc.resolve(at.to), 1, true);
      if (after) editor.view.dispatch(state.tr.setSelection(after));
      else
        frameRef.current
          ?.querySelector<HTMLElement>(
            "[data-slot=block-view-mode][aria-pressed=false]",
          )
          ?.focus();
    },
    [editor, span],
  );
  // The caret arriving inside a previewed block (arrow keys, a find) opens its source.
  React.useEffect(() => {
    if (!editable) return;
    const onSelection = () => {
      if (modeRef.current !== "preview" || !editor.isFocused) return;
      const at = span();
      const { from, to } = editor.state.selection;
      if (at && from > at.from && to < at.to) setModeState("code");
    };
    editor.on("selectionUpdate", onSelection);
    return () => {
      editor.off("selectionUpdate", onSelection);
    };
  }, [editor, editable, span]);
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onMode = (event: Event) =>
      setMode((event as CustomEvent<BlockViewMode>).detail);
    frame.addEventListener(BLOCK_VIEW_MODE_EVENT, onMode);
    return () => frame.removeEventListener(BLOCK_VIEW_MODE_EVENT, onMode);
  }, [setMode]);
  const wrap = Boolean(node.attrs.wrap);
  return (
    <NodeViewWrapper
      data-slot="code-block"
      data-language={language}
      data-block-view=""
      className="my-2"
    >
      <BlockViewFrame
        ref={frameRef}
        view={view}
        source={source}
        language={language}
        mode={mode}
        onModeChange={setMode}
        editable={editable}
        code={
          <pre
            data-slot="code-block-pre"
            data-wrap={wrap ? "" : undefined}
            style={codeBlockWrapStyle(wrap)}
            className={codeBlockPreClassName}
          >
            <NodeViewContent<"code">
              as="code"
              className="font-mono"
              style={{ whiteSpace: "inherit" }}
            />
          </pre>
        }
      />
    </NodeViewWrapper>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Block and table moves — structural edits the drag handle, the table grips and the shortcuts share
 * ----------------------------------------------------------------------------------------------*/

const LIST_TYPES = new Set(["bulletList", "orderedList", "taskList"]);
const ITEM_TYPES = new Set(["listItem", "taskItem"]);

/** A draggable block: a top-level node, or a list item (which moves among its siblings). */
interface Block {
  pos: number;
  node: PMNode;
  dom: HTMLElement;
}

/** The innermost block under `target`: a list item when it sits in one, else the top-level node. */
function blockAt(view: EditorView, target: Node): Block | null {
  let found: Block | null = null;
  const visit = (parent: PMNode, start: number, itemsOnly: boolean) => {
    parent.forEach((child, offset) => {
      if (itemsOnly && !ITEM_TYPES.has(child.type.name)) return;
      const pos = start + offset;
      const dom = view.nodeDOM(pos);
      if (!(dom instanceof HTMLElement) || !dom.contains(target)) return;
      found = { pos, node: child, dom };
      if (LIST_TYPES.has(child.type.name)) visit(child, pos + 1, true);
      else if (ITEM_TYPES.has(child.type.name))
        child.forEach((inner, innerOffset) => {
          if (!LIST_TYPES.has(inner.type.name)) return;
          const listPos = pos + 1 + innerOffset;
          const listDom = view.nodeDOM(listPos);
          if (listDom instanceof HTMLElement && listDom.contains(target))
            visit(inner, listPos + 1, true);
        });
    });
  };
  visit(view.state.doc, 0, false);
  return found;
}

/** The siblings `block` can move among, with each one's position and DOM box. */
function siblingsOf(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  const parent = $pos.parent;
  const start = $pos.start();
  const out: { pos: number; node: PMNode; dom: HTMLElement | null }[] = [];
  parent.forEach((node, offset) => {
    const at = start + offset;
    const dom = view.nodeDOM(at);
    out.push({ pos: at, node, dom: dom instanceof HTMLElement ? dom : null });
  });
  return { parent, start, index: $pos.index(), siblings: out };
}

/** Move the node at `pos` to sibling slot `target` (0…count, a gap between siblings). */
function moveNodeTo(view: EditorView, pos: number, target: number): boolean {
  const { siblings, index, start, parent } = siblingsOf(view, pos);
  if (target === index || target === index + 1) return false;
  const node = siblings[index]!.node;
  const gap =
    target < siblings.length
      ? siblings[target]!.pos
      : start + parent.content.size;
  const tr = view.state.tr.delete(pos, pos + node.nodeSize);
  const insertAt = tr.mapping.map(gap);
  tr.insert(insertAt, node);
  tr.setSelection(TextSelection.near(tr.doc.resolve(insertAt + 1)));
  view.dispatch(tr.scrollIntoView());
  return true;
}

/** The block the caret is in: its innermost list item, else its top-level node. */
function caretBlockPos(state: EditorState): number | null {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--)
    if (ITEM_TYPES.has($from.node(depth).type.name)) return $from.before(depth);
  return $from.depth >= 1 ? $from.before(1) : null;
}

/** ⌘⇧↑ / ⌘⇧↓ — move the caret's block one slot, the keyboard twin of the drag handle. */
function moveBlockBy(editor: Editor, step: -1 | 1): boolean {
  const pos = caretBlockPos(editor.state);
  if (pos === null) return false;
  const { index, siblings } = siblingsOf(editor.view, pos);
  const target = step < 0 ? index - 1 : index + 2;
  if (target < 0 || target > siblings.length) return false;
  return moveNodeTo(editor.view, pos, target);
}

interface TableCursor {
  /** Position of the `table` node. */
  tablePos: number;
  table: PMNode;
  row: number;
  col: number;
}

/** The table, row and column around `pos`, or null outside a table. */
function tableAt(state: EditorState, pos: number): TableCursor | null {
  const $pos = state.doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name !== "table") continue;
    return {
      tablePos: $pos.before(depth),
      table: $pos.node(depth),
      row: depth + 1 <= $pos.depth ? $pos.index(depth) : 0,
      col: depth + 2 <= $pos.depth ? $pos.index(depth + 1) : 0,
    };
  }
  return null;
}

/** Position just before cell (`row`, `col`) of a table starting at `tablePos`. */
function cellPos(table: PMNode, tablePos: number, row: number, col: number) {
  let pos = tablePos + 1;
  for (let r = 0; r < row; r++) pos += table.child(r).nodeSize;
  const rowNode = table.child(row);
  pos += 1;
  for (let c = 0; c < Math.min(col, rowNode.childCount - 1); c++)
    pos += rowNode.child(c).nodeSize;
  return pos;
}

/** Position of the first text inside cell (`row`, `col`) of a table starting at `tablePos`. */
function cellTextPos(
  table: PMNode,
  tablePos: number,
  row: number,
  col: number,
) {
  return cellPos(table, tablePos, row, col) + 2;
}

const isHeaderCell = (cell: PMNode) =>
  cell.type.spec.tableRole === "header_cell";

/** Every cell of the first row is a header cell (GFM's header row). */
function hasHeaderRow(table: PMNode) {
  const first = table.firstChild;
  if (!first || first.childCount === 0) return false;
  let all = true;
  first.forEach((cell) => {
    if (!isHeaderCell(cell)) all = false;
  });
  return all;
}

/** Every row starts with a header cell. */
function hasHeaderColumn(table: PMNode) {
  let all = table.childCount > 0;
  table.forEach((row) => {
    if (!row.firstChild || !isHeaderCell(row.firstChild)) all = false;
  });
  return all;
}

/** Replace the table at `tablePos` with `rows`, the caret in cell (`row`, `col`). */
function replaceTable(
  view: EditorView,
  cursor: TableCursor,
  rows: PMNode[],
  row: number,
  col: number,
) {
  const { table, tablePos } = cursor;
  const next = table.copy(Fragment.from(rows));
  const tr = view.state.tr.replaceWith(
    tablePos,
    tablePos + table.nodeSize,
    next,
  );
  tr.setSelection(
    TextSelection.near(tr.doc.resolve(cellTextPos(next, tablePos, row, col))),
  );
  view.dispatch(tr);
}

const rowsOf = (table: PMNode) => {
  const rows: PMNode[] = [];
  table.forEach((row) => rows.push(row));
  return rows;
};

const cellsOf = (row: PMNode) => {
  const cells: PMNode[] = [];
  row.forEach((cell) => cells.push(cell));
  return cells;
};

/**
 * Reorder a table's rows or columns. GFM tables have no spans, so a column move is the same cell
 * splice on every row. A header row stays first and a header column stays first — markdown has no
 * other place for a header — so the other lines move among themselves.
 */
function moveTable(
  view: EditorView,
  at: number,
  axis: "row" | "col",
  from: number,
  to: number,
): boolean {
  const cursor = tableAt(view.state, at);
  if (!cursor || from === to) return false;
  const { table } = cursor;
  const rows = rowsOf(table);
  let next: PMNode[];
  if (axis === "row") {
    const min = hasHeaderRow(table) ? 1 : 0;
    if (from < min || to < min || from >= rows.length || to >= rows.length)
      return false;
    next = rows.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
  } else {
    const min = hasHeaderColumn(table) ? 1 : 0;
    const width = rows[0]?.childCount ?? 0;
    if (from < min || to < min || from >= width || to >= width) return false;
    next = rows.map((row) => {
      const cells = cellsOf(row);
      const [moved] = cells.splice(from, 1);
      cells.splice(to, 0, moved!);
      return row.copy(Fragment.from(cells));
    });
  }
  replaceTable(
    view,
    cursor,
    next,
    axis === "row" ? to : cursor.row,
    axis === "col" ? to : cursor.col,
  );
  return true;
}

/** Insert a copy of a row or column after it. A copy of the header row is a body row. */
function duplicateTableLine(
  view: EditorView,
  cursor: TableCursor,
  axis: "row" | "col",
) {
  const { table, row, col } = cursor;
  const rows = rowsOf(table);
  const bodyCell = view.state.schema.nodes.tableCell;
  if (axis === "row") {
    const source = rows[row]!;
    const copy =
      row === 0 && hasHeaderRow(table) && bodyCell
        ? source.copy(
            Fragment.from(
              cellsOf(source).map((cell) =>
                bodyCell.create(cell.attrs, cell.content, cell.marks),
              ),
            ),
          )
        : source;
    rows.splice(row + 1, 0, copy);
    replaceTable(view, cursor, rows, row + 1, col);
  } else {
    const next = rows.map((line) => {
      const cells = cellsOf(line);
      cells.splice(col + 1, 0, cells[col]!);
      return line.copy(Fragment.from(cells));
    });
    replaceTable(view, cursor, next, row, col + 1);
  }
}

/** Select a whole row, a whole column or every cell (`CellSelection`). */
function selectTableLine(
  view: EditorView,
  cursor: TableCursor,
  kind: "row" | "col" | "table",
) {
  const { table, tablePos } = cursor;
  const { doc } = view.state;
  let selection: CellSelection;
  if (kind === "table") {
    const last = table.childCount - 1;
    selection = CellSelection.create(
      doc,
      cellPos(table, tablePos, 0, 0),
      cellPos(table, tablePos, last, table.child(last).childCount - 1),
    );
  } else {
    const $cell = doc.resolve(
      cellPos(
        table,
        tablePos,
        kind === "row" ? cursor.row : 0,
        kind === "col" ? cursor.col : 0,
      ),
    );
    selection =
      kind === "row"
        ? CellSelection.rowSelection($cell)
        : CellSelection.colSelection($cell);
  }
  view.dispatch(view.state.tr.setSelection(selection));
}

/** Add a row at the bottom or a column at the end (Notion's "+" bars), the caret in its first cell. */
function appendTableLine(
  view: EditorView,
  tablePos: number,
  axis: "row" | "col",
) {
  const table = view.state.doc.nodeAt(tablePos);
  if (!table || table.type.spec.tableRole !== "table") return;
  const map = TableMap.get(table);
  const rect = {
    map,
    table,
    tableStart: tablePos + 1,
    left: 0,
    top: 0,
    right: map.width,
    bottom: map.height,
  };
  const tr = view.state.tr;
  if (axis === "row") addRow(tr, rect, map.height);
  else addColumn(tr, rect, map.width);
  const next = tr.doc.nodeAt(tablePos)!;
  tr.setSelection(
    TextSelection.near(
      tr.doc.resolve(
        cellTextPos(
          next,
          tablePos,
          axis === "row" ? next.childCount - 1 : 0,
          axis === "row" ? 0 : next.child(0).childCount - 1,
        ),
      ),
    ),
  );
  view.dispatch(tr);
  view.focus();
}

/* ------------------------------------------------------------------------------------------------
 * Schema — fixed, so every markdown element round-trips losslessly
 * ----------------------------------------------------------------------------------------------*/

const SLASH_KEY = new PluginKey("textEditSlash");

/** What the slash extension reads from the component; refs, so the extensions are built once. */
interface SlashRuntime {
  allowed: React.RefObject<readonly TextEditSlashCommand[]>;
  /** The host's own items (`slashActions`). */
  actions: React.RefObject<readonly TextEditSlashAction[]>;
  /** A `menuSize="lg"` menu: the full list in its own group order. */
  lg: React.RefObject<boolean>;
  get: () => SlashState | null;
  set: (next: SlashState | null) => void;
  open: (panel: Panel) => void;
}

function slashExtension(runtime: SlashRuntime) {
  return Extension.create({
    name: "textEditSlash",
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        Suggestion<SlashSpec, SlashSpec>({
          editor,
          pluginKey: SLASH_KEY,
          char: "/",
          // "/heading 2": spaces and digits stay in the query (B1); a collaborator's typing never
          // opens this viewer's menu.
          allowSpaces: true,
          findSuggestionMatch: phraseMatch({ maxWords: 3, maxChars: 24 }),
          shouldShow: localQuery(SLASH_KEY),
          allow: () =>
            (runtime.allowed.current.length > 0 ||
              runtime.actions.current.length > 0) &&
            !editor.isActive("codeBlock"),
          items: ({ query, editor: ed }) =>
            filterSlash(
              runtime.allowed.current,
              query,
              inTableCell(ed.state),
              runtime.actions.current,
              runtime.lg.current,
            ),
          command: ({ editor: ed, range, props }) =>
            props.run(ed, range, runtime.open),
          render: () => {
            const show = (props: SuggestionProps<SlashSpec, SlashSpec>) => {
              // A phrase that matches nothing and goes on past a space is a sentence, not a
              // command: the menu closes (Notion's behaviour).
              // (Counted here: the plugin's first update of a query arrives before its items.)
              if (
                /\s$/.test(props.query) &&
                filterSlash(
                  runtime.allowed.current,
                  props.query,
                  inTableCell(props.editor.state),
                  runtime.actions.current,
                ).length === 0
              ) {
                exitSuggestion(editor.view, SLASH_KEY);
                return;
              }
              const previous = runtime.get();
              runtime.set({
                items: props.items,
                query: props.query.trim(),
                index:
                  previous && previous.items.length === props.items.length
                    ? Math.min(previous.index, props.items.length - 1)
                    : 0,
                rect: props.clientRect?.() ?? null,
                command: props.command,
              });
            };
            return {
              onStart: show,
              onUpdate: show,
              onExit: () => runtime.set(null),
              onKeyDown: ({ event }) => {
                const state = runtime.get();
                if (!state) return false;
                // Escape only closes the menu: a host's Escape (e.g. cancel a reply) never sees it.
                return suggestionMenuKeyDown(event, {
                  count: state.items.length,
                  activeIndex: state.index,
                  onActiveIndexChange: (index) =>
                    runtime.set({ ...state, index }),
                  onSelect: (index) => {
                    const spec = state.items[index]!;
                    if (!spec.disabled) state.command(spec);
                  },
                  onClose: () => exitSuggestion(editor.view, SLASH_KEY),
                });
              },
            };
          },
        }),
      ];
    },
  });
}

/** Shortcuts StarterKit does not bind: ⇧⌘X strike (Notion/Linear), ⌘⇧↑/↓ move the block, ⌘D duplicates it. */
const Shortcuts = Extension.create({
  name: "textEditShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-x": () => this.editor.commands.toggleStrike(),
      "Mod-Shift-ArrowUp": () => moveBlockBy(this.editor, -1),
      "Mod-Shift-ArrowDown": () => moveBlockBy(this.editor, 1),
      // Duplicate the caret's block (the block menu's Duplicate), never the browser's bookmark.
      "Mod-d": () => this.editor.isEditable && duplicateCaretBlock(this.editor),
    };
  },
});

/**
 * Where a block (an image, a video, an audio clip) lands for a caret at `pos`: in place of an empty
 * paragraph, else right after the caret's block — never splitting the text it sits in.
 */
function blockInsertRange(
  state: EditorState,
  pos: number,
): { from: number; to: number } {
  const $pos = state.doc.resolve(
    Math.min(Math.max(pos, 0), state.doc.content.size),
  );
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (!node.isTextblock) continue;
    if (node.content.size === 0)
      return { from: $pos.before(depth), to: $pos.after(depth) };
    return { from: $pos.after(depth), to: $pos.after(depth) };
  }
  return { from: pos, to: pos };
}

/* --- file chips --------------------------------------------------------------------------------*/

/** The icon at the start of a file chip, by the linked file's name. */
function FileChipIcon({ name }: { name: string }) {
  return (
    <FileTypeIcon
      name={name}
      className="me-1 inline size-[1em] align-[-0.125em] opacity-70"
    />
  );
}

/**
 * A file link's icon: a widget at the start of each link whose href starts with `fileLinkPrefix`
 * (the link itself carries `data-slot="file-chip"`, from the schema's `fileChip` attribute).
 */
function fileChips(runtime: EditorRuntime) {
  const isFile = (href: unknown) =>
    typeof href === "string" &&
    runtime.fileLinkPrefix.current !== "" &&
    href.startsWith(runtime.fileLinkPrefix.current);
  return Extension.create({
    name: "textEditFileChips",
    addDecorations() {
      return {
        create: ({ editor, state }) => {
          const widgets: ReturnType<typeof ReactWidgetRenderer>[] = [];
          state.doc.descendants((node, pos, parent, index) => {
            if (!node.isText) return;
            const link = node.marks.find(
              (mark) => mark.type.name === "link" && isFile(mark.attrs.href),
            );
            if (!link) return;
            const previous = index > 0 ? parent?.child(index - 1) : null;
            if (previous && link.isInSet(previous.marks)) return;
            widgets.push(
              ReactWidgetRenderer(FileChipIcon, {
                editor,
                pos,
                key: `file-chip:${pos}:${String(link.attrs.href)}`,
                props: { name: node.text ?? "" },
                marks: [link],
                side: 1,
              }),
            );
          });
          return widgets;
        },
      };
    },
  });
}

/* --- heading ids and the outline ----------------------------------------------------------------*/

interface HeadingEntry {
  pos: number;
  size: number;
  level: number;
  text: string;
  id: string;
}

const OUTLINE_CACHE = new WeakMap<PMNode, HeadingEntry[]>();

/** Every heading in the document, in order, with its outline text and stable id. */
function headingsOf(doc: PMNode): HeadingEntry[] {
  const cached = OUTLINE_CACHE.get(doc);
  if (cached) return cached;
  const found: Omit<HeadingEntry, "id">[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return;
    found.push({
      pos,
      size: node.nodeSize,
      level: Number(node.attrs.level) || 1,
      text: node.textBetween(0, node.content.size, "", (leaf) =>
        leaf.type.name === "mention" ? `@${leaf.attrs.label}` : "",
      ),
    });
    return false;
  });
  const ids = headingIds(found.map((entry) => entry.text));
  const entries = found.map((entry, index) => ({ ...entry, id: ids[index]! }));
  OUTLINE_CACHE.set(doc, entries);
  return entries;
}

const HEADING_DECORATIONS = new WeakMap<PMNode, DecorationSet>();

/** Every heading carries its outline id, so `scrollToHeading` and `#links` find it. */
const HeadingIds = Extension.create({
  name: "textEditHeadingIds",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            let set = HEADING_DECORATIONS.get(state.doc);
            if (!set) {
              set = DecorationSet.create(
                state.doc,
                headingsOf(state.doc).map((entry) =>
                  PMDecoration.node(entry.pos, entry.pos + entry.size, {
                    id: entry.id,
                  }),
                ),
              );
              HEADING_DECORATIONS.set(state.doc, set);
            }
            return set;
          },
        },
      }),
    ];
  },
});

/* --- comment highlights ------------------------------------------------------------------------*/

/** How the highlights present themselves: set from the editor's props, never from the document. */
interface AnnotationOptions {
  /** Read-only view with a click handler: the first text span of each highlight is a tab stop. */
  focusable: boolean;
  /** A click handler exists: the count pill is a button. */
  clickable: boolean;
  /** `annotationCounts`: whether a count pill follows each highlight. */
  counts: "never" | "auto" | "always";
  /** `annotationLabel`: a focusable highlight's accessible name. */
  label: (quote: string, count: number) => string;
  /** `annotationCountLabel`: the pill's accessible name. */
  countLabel: (count: number) => string;
}

/** A highlight's Yjs relative positions: its first and its last character. */
interface YRefs {
  start: Y.RelativePosition;
  end: Y.RelativePosition;
}

interface AnnotationPluginState {
  /** Each annotation's current range; null when its text is gone (orphaned). */
  ranges: Map<string, { from: number; to: number } | null>;
  /** A shared document's annotations: the relative positions their range is re-read from. */
  y: Map<string, YRefs>;
  /** The anchor each annotation was last resolved from, so an unchanged one keeps its mapped range. */
  keys: Map<string, string>;
  /** Each annotation's comment count, as the host gave it. */
  counts: Map<string, number | undefined>;
  active: string | null;
  pulse: string | null;
  options: AnnotationOptions;
  decorations: DecorationSet;
}

type AnnotationMeta =
  | {
      type: "set";
      items: readonly { id: string; anchor: TextEditAnchor; count?: number }[];
    }
  | { type: "active"; id: string | null }
  | { type: "pulse"; id: string | null }
  | { type: "options"; options: AnnotationOptions };

const ANNOTATION_KEY = new PluginKey<AnnotationPluginState>(
  "textEditAnnotations",
);

/** `annotationLabel`'s default. */
const defaultAnnotationLabel = (quote: string, count: number) =>
  count > 1 ? `${count} comments on “${quote}”` : `Comment on “${quote}”`;
/** `annotationCountLabel`'s default. */
const defaultAnnotationCountLabel = (count: number) =>
  count === 1 ? "1 comment" : `${count} comments`;

const DEFAULT_ANNOTATION_OPTIONS: AnnotationOptions = {
  focusable: false,
  clickable: false,
  counts: "never",
  label: defaultAnnotationLabel,
  countLabel: defaultAnnotationCountLabel,
};

// One look for a highlight and its pill in the editor and in `MarkdownView`'s read view.
const ANNOTATION_CLASS = annotationHighlightClassName;
const ANNOTATION_ACTIVE_CLASS = annotationActiveClassName;
const ANNOTATION_PULSE_CLASS = "animate-pulse bg-warning/30";
const ANNOTATION_COUNT_CLASS = annotationCountClassName;
const ANNOTATION_COUNT_VISIBILITY = annotationCountVisibilityClassName;

/** The count pill after a highlight: `contenteditable=false`, a button when there is a click handler. */
function annotationCount(
  id: string,
  count: number,
  active: boolean,
  options: AnnotationOptions,
  open: (id: string) => void,
): HTMLElement {
  const pill = document.createElement("span");
  pill.contentEditable = "false";
  pill.setAttribute("data-slot", "text-edit-annotation-count");
  pill.setAttribute("data-annotation-count", id);
  if (active) pill.setAttribute("data-active", "");
  pill.className = cn(
    ANNOTATION_COUNT_CLASS,
    options.counts !== "never" && ANNOTATION_COUNT_VISIBILITY[options.counts],
  );
  // The visible count is decoration; the name is the sentence (design.md "Counts in controls").
  const visible = document.createElement("span");
  visible.setAttribute("aria-hidden", "true");
  visible.textContent = count > 99 ? "99+" : String(count);
  const name = document.createElement("span");
  name.className = "sr-only";
  name.textContent = options.countLabel(count);
  pill.append(visible, name);
  if (options.clickable) {
    // Not a tab stop: in view mode the highlight is, and while editing Tab must stay the editor's.
    pill.setAttribute("role", "button");
    pill.tabIndex = -1;
    // Keep the caret (and focus) where it is.
    pill.addEventListener("mousedown", (event) => event.preventDefault());
    pill.addEventListener("click", (event) => {
      event.preventDefault();
      open(id);
    });
    pill.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open(id);
    });
  }
  return pill;
}

function annotationDecorations(
  doc: PMNode,
  state: Omit<AnnotationPluginState, "decorations">,
  open: (id: string) => void,
) {
  const decorations: PMDecoration[] = [];
  const { options } = state;
  for (const [id, range] of state.ranges) {
    if (!range) continue;
    const active = id === state.active;
    const count = Math.max(1, state.counts.get(id) ?? 1);
    const attrs = {
      "data-slot": "text-edit-annotation",
      "data-annotation": id,
      ...(active ? { "data-active": "" } : {}),
      class: cn(
        ANNOTATION_CLASS,
        active && ANNOTATION_ACTIVE_CLASS,
        id === state.pulse && ANNOTATION_PULSE_CLASS,
      ),
    };
    if (!options.focusable) {
      decorations.push(
        PMDecoration.inline(range.from, range.to, attrs, { id }),
      );
    } else {
      // View mode: ProseMirror draws one span per inline node, so the highlight is split into
      // segments here and only its FIRST text span is the tab stop — a button named for the whole
      // quote. The other text spans are hidden from assistive technology, which already heard
      // them in that name.
      const quote = doc
        .textBetween(range.from, range.to, " ", " ")
        .replace(/\s+/g, " ")
        .trim();
      let first = true;
      doc.nodesBetween(range.from, range.to, (node, pos) => {
        if (!node.isInline) return true;
        const from = Math.max(pos, range.from);
        const to = Math.min(pos + node.nodeSize, range.to);
        if (from >= to) return false;
        let segment: Record<string, string> = attrs;
        if (node.isText && first) {
          first = false;
          segment = {
            ...attrs,
            "data-annotation-focus": "",
            role: "button",
            tabindex: "0",
            "aria-label": options.label(quote, count),
          };
        } else if (node.isText) segment = { ...attrs, "aria-hidden": "true" };
        decorations.push(PMDecoration.inline(from, to, segment, { id }));
        return false;
      });
    }
    if (options.counts !== "never") {
      decorations.push(
        PMDecoration.widget(
          range.to,
          () => annotationCount(id, count, active, options, open),
          {
            id,
            // Reused while nothing it draws changed.
            key: `annotation-count:${id}:${count}:${active ? 1 : 0}:${options.counts}:${options.clickable ? 1 : 0}:${options.countLabel(count)}`,
            // Before a caret at the highlight's end, so typing there lands after the pill.
            side: -1,
            // Outside any mark (a link, bold): never nested in the highlighted text's markup.
            marks: [],
            ignoreSelection: true,
            stopEvent: () => true,
          },
        ),
      );
    }
  }
  return DecorationSet.create(doc, decorations);
}

/** The innermost highlight around `pos` (its ends included), or null. */
function annotationAt(
  state: AnnotationPluginState | undefined,
  pos: number,
): string | null {
  let found: string | null = null;
  let size = Infinity;
  for (const [id, range] of state?.ranges ?? []) {
    if (!range || pos < range.from || pos > range.to) continue;
    if (range.to - range.from < size) {
      found = id;
      size = range.to - range.from;
    }
  }
  return found;
}

/**
 * A suggestion menu (slash or mention) opens on this person's typing only — a collaborator's `/`
 * or `@` never opens it here — but a menu already open stays open, and follows, through a
 * collaborator's edit elsewhere. `editor.state` is still the state before the transaction.
 */
function localQuery(key: PluginKey) {
  return ({
    transaction,
    editor,
  }: {
    transaction: Transaction;
    editor: Editor;
  }) =>
    !isChangeOrigin(transaction) ||
    Boolean(
      (key.getState(editor.state) as { active?: boolean } | undefined)?.active,
    );
}

/** The Yjs binding of a collaborative editor's state; null in a single-writer one. */
function yBinding(state: EditorState) {
  const sync = ySyncPluginKey.getState(state) as
    | {
        doc: Y.Doc;
        type: Y.XmlFragment;
        binding?: { mapping: Map<unknown, unknown> };
      }
    | undefined;
  return sync?.binding
    ? { doc: sync.doc, type: sync.type, mapping: sync.binding.mapping }
    : null;
}

/**
 * A highlight's range from its relative positions: null when orphaned (its quote deleted), and
 * undefined only while the editor has no Yjs binding yet (nothing to resolve against).
 */
function resolveY(
  state: EditorState,
  refs: YRefs,
): { from: number; to: number } | null | undefined {
  const y = yBinding(state);
  if (!y) return undefined;
  const from = resolveRelative(y, refs.start);
  const to = resolveRelative(y, refs.end);
  if (from === null || to === null) return null;
  // Collapsed: the quote is gone — orphaned, never a highlight of whatever follows.
  return from < to ? { from, to } : null;
}

/**
 * A Yjs relative position as a document position; null when it no longer resolves. The binding
 * reads a position bound to the document's very first character as a misresolved one (its guard
 * against block reorders) — a quote that starts the document is valid, so a position whose text
 * still exists is resolved again through its text type instead.
 */
function resolveRelative(
  y: NonNullable<ReturnType<typeof yBinding>>,
  rel: Y.RelativePosition,
): number | null {
  const pos = relativePositionToAbsolutePosition(
    y.doc,
    y.type,
    rel,
    y.mapping as never,
  );
  if (pos !== null) return pos;
  const at = Y.createAbsolutePositionFromRelativePosition(rel, y.doc);
  if (!at || !(at.type instanceof Y.XmlText) || at.type._item?.deleted)
    return null;
  return relativePositionToAbsolutePosition(
    y.doc,
    y.type,
    Y.createRelativePositionFromTypeIndex(at.type, at.index, -1),
    y.mapping as never,
  );
}

/**
 * A Yjs relative position for document position `pos`, bound to the character after it
 * (`assoc` ≥ 0) or before it (`assoc` < 0). The binding's own conversion always binds left.
 */
function relativeAt(
  y: NonNullable<ReturnType<typeof yBinding>>,
  pos: number,
  assoc: number,
): Y.RelativePosition {
  const left = absolutePositionToRelativePosition(
    pos,
    y.type,
    y.mapping as never,
  );
  if (assoc < 0) return left;
  const at = Y.createAbsolutePositionFromRelativePosition(left, y.doc);
  return at && at.type instanceof Y.XmlText
    ? Y.createRelativePositionFromTypeIndex(at.type, at.index, assoc)
    : left;
}

/** The relative positions of `from`…`to` (exclusive), as `TextEditYAnchor` bytes. */
function yAnchorOf(state: EditorState, from: number, to: number) {
  const y = yBinding(state);
  if (!y || to <= from) return undefined;
  return {
    start: Y.encodeRelativePosition(relativeAt(y, from, 0)),
    end: Y.encodeRelativePosition(relativeAt(y, to, -1)),
  };
}

/** A position held while others may edit: where it is now, or null once what it held is gone. */
interface HeldPosition {
  get: () => number | null;
  /** Stop following (the position read last stays readable). */
  release: () => void;
}

/**
 * Hold `pos` across later changes, anyone's — a menu left open, a drag, a file dialog, an upload.
 * A collaborator's change rebuilds this editor's whole document (the Yjs binding replaces it), so
 * no mapping can follow one: in a shared document a block (`block`: the node starting at `pos`) is
 * held by its own Yjs element, any other position by a Yjs relative position. A single-writer
 * editor maps the position through each change. A held block is gone once it is deleted or
 * replaced (turned into another type) — never another block in its place.
 */
function holdPosition(
  editor: Editor,
  pos: number,
  block = false,
): HeldPosition {
  const { doc } = editor.state;
  const node = block ? doc.nodeAt(pos) : null;
  if (block && !node) return { get: () => null, release: () => {} };
  const y = yBinding(editor.state);
  if (y) {
    const element = node ? yElementOf(y, node) : undefined;
    if (element !== null) {
      const rel = element ? null : relativeAt(y, pos, -1);
      return {
        get: () => {
          const now = yBinding(editor.state);
          if (!now) return null;
          return element
            ? yElementPos(now, element, editor.state.doc)
            : resolveRelative(now, rel!);
        },
        release: () => {},
      };
    }
  }
  let at: number | null = pos;
  const follow = ({
    transaction,
    appendedTransactions,
  }: {
    transaction: Transaction;
    appendedTransactions?: readonly Transaction[];
  }) => {
    // The change and every transaction a plugin appended to it, in order.
    for (const tr of [transaction, ...(appendedTransactions ?? [])]) {
      if (at === null || !tr.docChanged) continue;
      const mapped = tr.mapping.mapResult(at, block ? 1 : -1);
      at = block && mapped.deletedAfter ? null : mapped.pos;
    }
  };
  editor.on("transaction", follow);
  return {
    get: () => {
      if (at === null || editor.isDestroyed) return null;
      return !node || editor.state.doc.nodeAt(at)?.type === node.type
        ? at
        : null;
    },
    release: () => {
      editor.off("transaction", follow);
    },
  };
}

/** The Yjs element the binding maps `node` to; null when there is no single one. */
function yElementOf(
  y: NonNullable<ReturnType<typeof yBinding>>,
  node: PMNode,
): Y.XmlElement | null {
  let found: unknown = null;
  for (const [type, mapped] of y.mapping)
    if (mapped === node) {
      if (found) return null;
      found = type;
    }
  return found instanceof Y.XmlElement ? found : null;
}

/** Where the Yjs `element`'s block starts in `doc` now; null once it (or a block around it) is gone. */
function yElementPos(
  y: NonNullable<ReturnType<typeof yBinding>>,
  element: Y.XmlElement,
  doc: PMNode,
): number | null {
  type Typed = { _item: { deleted: boolean; parent: unknown } | null };
  for (
    let type = element as unknown as Typed | null;
    type?._item;
    type = type._item.parent as Typed | null
  )
    if (type._item.deleted) return null;
  const inside = relativePositionToAbsolutePosition(
    y.doc,
    y.type,
    Y.createRelativePositionFromTypeIndex(element, 0, -1),
    y.mapping as never,
  );
  if (inside === null || inside < 1) return null;
  // The binding's node for the element is the one there: never a neighbour after a rebuild.
  const node = y.mapping.get(element);
  return node !== undefined && doc.nodeAt(inside - 1) === node
    ? inside - 1
    : null;
}

/** An anchor's identity for "unchanged since last time": its text fields and its `y` bytes. */
function annotationKey(anchor: TextEditAnchor): string {
  const { y, ...text } = anchor;
  return JSON.stringify([
    text,
    y ? [Array.from(y.start), Array.from(y.end)] : null,
  ]);
}

/** A highlight's range: from its Y anchor when it has one (null once orphaned), else its quote. */
function resolveAnchorY(
  state: EditorState,
  anchor: TextEditAnchor,
  refs: YRefs | undefined,
) {
  const placed = refs ? resolveY(state, refs) : undefined;
  return placed === undefined ? resolveInDoc(state.doc, anchor) : placed;
}

/** Resolve an anchor in `doc`: offsets → context → unique quote, then into document positions. */
function resolveInDoc(doc: PMNode, anchor: TextAnchor) {
  const offsets = resolveAnchor(anchorText(doc), anchor);
  if (!offsets) return null;
  const range = offsetsToRange(doc, offsets.start, offsets.end);
  return range && range.from < range.to ? range : null;
}

/**
 * Comment highlights: each annotation's anchor is resolved to document positions once, then its
 * range maps through every transaction — typing before a highlight keeps it on the same words.
 * Decorations only: the document (and its Markdown) never carries a comment, and neither does the
 * count pill, which is a widget.
 *
 * Keyboard: in view mode (read-only) each highlight's first text span is a tab stop, and Enter or
 * Space opens its thread. While editing, a highlight is never a tab stop — a focusable island in
 * the contenteditable would steal the caret and Tab — so Alt+Enter with the caret inside (or at
 * either end of) a highlight opens its thread instead; anywhere else Alt+Enter is left alone.
 */
function annotationsExtension(runtime: {
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Whether the host listens for clicks (`onAnnotationClick`). */
  canOpen: () => boolean;
}) {
  return Extension.create({
    name: "textEditAnnotations",
    addKeyboardShortcuts() {
      return {
        "Alt-Enter": () => {
          const { state } = this.editor;
          if (!this.editor.isEditable || !runtime.canOpen()) return false;
          const id = annotationAt(
            ANNOTATION_KEY.getState(state),
            state.selection.from,
          );
          if (!id) return false;
          runtime.onClick(id);
          return true;
        },
      };
    },
    addProseMirrorPlugins() {
      let hoverTimer: ReturnType<typeof setTimeout> | undefined;
      let hovered: string | null = null;
      const annotationOf = (target: EventTarget | null) =>
        target instanceof Element
          ? (target
              .closest("[data-annotation]")
              ?.getAttribute("data-annotation") ?? null)
          : null;
      return [
        new Plugin<AnnotationPluginState>({
          key: ANNOTATION_KEY,
          state: {
            init: (_config, state) => ({
              ranges: new Map(),
              y: new Map(),
              keys: new Map(),
              counts: new Map(),
              active: null,
              pulse: null,
              options: DEFAULT_ANNOTATION_OPTIONS,
              decorations: DecorationSet.create(state.doc, []),
            }),
            apply(tr, previous, _oldState, newState) {
              const meta = tr.getMeta(ANNOTATION_KEY) as
                AnnotationMeta | undefined;
              if (!tr.docChanged && !meta) return previous;
              let ranges = previous.ranges;
              let y = previous.y;
              let keys = previous.keys;
              let counts = previous.counts;
              let { active, pulse, options } = previous;
              if (tr.docChanged) {
                ranges = new Map();
                // A collaborator's change replaces whole blocks, so positions inside them can't
                // be mapped: a shared highlight is read again from its relative positions.
                const remote = isChangeOrigin(tr);
                for (const [id, range] of previous.ranges) {
                  const refs = y.get(id);
                  if (remote && refs) {
                    ranges.set(id, resolveY(newState, refs) ?? null);
                    continue;
                  }
                  if (!range) {
                    ranges.set(id, null);
                    continue;
                  }
                  const from = tr.mapping.map(range.from, 1);
                  const to = tr.mapping.map(range.to, -1);
                  ranges.set(id, from < to ? { from, to } : null);
                }
              }
              if (meta?.type === "set") {
                const nextRanges = new Map<
                  string,
                  { from: number; to: number } | null
                >();
                const nextKeys = new Map<string, string>();
                const nextCounts = new Map<string, number | undefined>();
                const nextY = new Map<string, YRefs>();
                for (const { id, anchor, count } of meta.items) {
                  const key = annotationKey(anchor);
                  nextKeys.set(id, key);
                  nextCounts.set(id, count);
                  const refs = anchor.y
                    ? ((keys.get(id) === key ? y.get(id) : undefined) ?? {
                        start: Y.decodeRelativePosition(anchor.y.start),
                        end: Y.decodeRelativePosition(anchor.y.end),
                      })
                    : undefined;
                  if (refs) nextY.set(id, refs);
                  nextRanges.set(
                    id,
                    keys.get(id) === key && ranges.has(id)
                      ? ranges.get(id)!
                      : // A Y anchor is the truth: when it no longer resolves the highlight is
                        // orphaned — its quote is never looked for elsewhere (another occurrence).
                        // The quote is read only for an anchor without one, or before the binding.
                        resolveAnchorY(newState, anchor, refs),
                  );
                }
                ranges = nextRanges;
                y = nextY;
                keys = nextKeys;
                counts = nextCounts;
              } else if (meta?.type === "active") active = meta.id;
              else if (meta?.type === "pulse") pulse = meta.id;
              else if (meta?.type === "options") options = meta.options;
              const next = { ranges, y, keys, counts, active, pulse, options };
              return {
                ...next,
                decorations: annotationDecorations(
                  newState.doc,
                  next,
                  runtime.onClick,
                ),
              };
            },
          },
          props: {
            decorations: (state) => ANNOTATION_KEY.getState(state)?.decorations,
            handleDOMEvents: {
              click: (_view, event) => {
                const id = annotationOf(event.target);
                if (id) runtime.onClick(id);
                return false;
              },
              // View mode: a focused highlight opens on Enter or Space, as a button does.
              keydown: (_view, event) => {
                if (event.key !== "Enter" && event.key !== " ") return false;
                const target = event.target;
                if (
                  !(target instanceof Element) ||
                  !target.hasAttribute("data-annotation-focus")
                )
                  return false;
                const id = target.getAttribute("data-annotation");
                if (!id) return false;
                event.preventDefault();
                runtime.onClick(id);
                return true;
              },
              mouseover: (_view, event) => {
                const id = annotationOf(event.target);
                if (id === hovered) return false;
                clearTimeout(hoverTimer);
                if (!id) {
                  if (hovered !== null) {
                    hovered = null;
                    runtime.onHover(null);
                  }
                  return false;
                }
                hoverTimer = setTimeout(() => {
                  hovered = id;
                  runtime.onHover(id);
                }, 250);
                return false;
              },
              mouseleave: () => {
                clearTimeout(hoverTimer);
                if (hovered !== null) {
                  hovered = null;
                  runtime.onHover(null);
                }
                return false;
              },
            },
          },
          view: () => ({ destroy: () => clearTimeout(hoverTimer) }),
        }),
      ];
    },
  });
}

/* --- uploads -----------------------------------------------------------------------------------*/

interface UploadWidget {
  id: string;
  pos: number;
  name: string;
  /** An object URL of the image being uploaded; null for any other file. */
  preview: string | null;
  /** The upload failed: the placeholder stays, saying so, with Retry and Remove. */
  failed?: { retry: () => void; remove: () => void };
}

type UploadMeta =
  | { add: UploadWidget }
  | { remove: string }
  | { fail: { id: string; failed: NonNullable<UploadWidget["failed"]> } };

const UPLOAD_KEY = new PluginKey<DecorationSet>("textEditUploads");

const SVG_NS = "http://www.w3.org/2000/svg";
/** lucide `Loader`'s strokes (lucide-react `LoaderIcon`). */
const LOADER_PATHS = [
  "M12 2v4",
  "m16.2 7.8 2.9-2.9",
  "M18 12h4",
  "m16.2 16.2 2.9 2.9",
  "M12 18v4",
  "m4.9 19.1 2.9-2.9",
  "M2 12h4",
  "m4.9 4.9 2.9 2.9",
];

/** lucide `CircleAlert`'s strokes. */
const ALERT_PATHS = [
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  "M12 8v4",
  "M12 16h.01",
];

/** A lucide icon's strokes as DOM: a ProseMirror widget is not a React tree. */
function strokeIcon(
  paths: readonly string[],
  className: string,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", cn("shrink-0", className));
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

/**
 * A failed upload's placeholder: the file (a thumbnail of an image) with "Couldn't upload", Retry
 * and Remove. It stays until one is chosen, so a failure never vanishes without a word.
 */
function failedUploadPlaceholder(
  upload: UploadWidget & { failed: NonNullable<UploadWidget["failed"]> },
): HTMLElement {
  const root = document.createElement("span");
  root.contentEditable = "false";
  root.setAttribute("data-slot", "text-edit-upload");
  root.setAttribute("data-failed", "");
  root.setAttribute("data-kind", upload.preview ? "image" : "file");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", `Couldn't upload ${upload.name}`);
  root.className =
    "my-2 flex max-w-full items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-2 align-bottom text-sm leading-snug";
  if (upload.preview) {
    const thumb = document.createElement("img");
    thumb.src = upload.preview;
    thumb.alt = "";
    thumb.className = "m-0 size-10 shrink-0 rounded-md object-cover opacity-60";
    root.append(thumb);
  } else root.append(strokeIcon(ALERT_PATHS, "size-4 text-destructive-text"));
  const text = document.createElement("span");
  text.className = "flex min-w-0 flex-1 flex-col";
  const title = document.createElement("span");
  title.className = "font-medium text-destructive-text";
  title.textContent = "Couldn't upload";
  const name = document.createElement("span");
  name.className = "truncate text-muted-foreground";
  name.textContent = upload.name;
  text.append(title, name);
  const button = (
    label: string,
    variant: "outline" | "ghost",
    run: () => void,
  ) => {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = label;
    // Named for its file: several failed uploads each have their own.
    element.setAttribute("aria-label", `${label} ${upload.name}`);
    element.className = buttonVariants({ variant, size: "xs" });
    // The editor never sees the press: no caret moves and no selection changes under it.
    element.addEventListener("mousedown", (event) => event.preventDefault());
    element.addEventListener("click", (event) => {
      event.preventDefault();
      run();
    });
    return element;
  };
  const actions = document.createElement("span");
  actions.className = "flex shrink-0 items-center gap-1";
  actions.append(
    button("Retry", "outline", upload.failed.retry),
    button("Remove", "ghost", upload.failed.remove),
  );
  root.append(text, actions);
  return root;
}

/** The placeholder an upload shows until it resolves: the image dimmed under a spinner, or the file's name. */
function uploadPlaceholder(upload: UploadWidget): HTMLElement {
  if (upload.failed)
    return failedUploadPlaceholder({ ...upload, failed: upload.failed });
  // The system's one loader shape (lucide `Loader`, as `Spinner` draws it).
  const spinner = (size: string) =>
    strokeIcon(LOADER_PATHS, cn("animate-spin", size));
  const root = document.createElement("span");
  root.contentEditable = "false";
  root.setAttribute("data-slot", "text-edit-upload");
  root.setAttribute("data-uploading", "");
  root.setAttribute("role", "status");
  root.setAttribute("aria-label", `Uploading ${upload.name}`);
  if (upload.preview) {
    root.setAttribute("data-kind", "image");
    root.className = "relative inline-block max-w-full align-bottom";
    const image = document.createElement("img");
    image.src = upload.preview;
    image.alt = "";
    image.className = "block max-h-60 opacity-50";
    const overlay = document.createElement("span");
    overlay.className =
      "absolute inset-0 grid place-items-center text-foreground";
    overlay.append(spinner("size-5"));
    root.append(image, overlay);
  } else {
    root.setAttribute("data-kind", "file");
    root.className =
      "inline-flex max-w-full items-center gap-1.5 rounded-sm bg-muted px-1 align-baseline text-muted-foreground";
    const name = document.createElement("span");
    name.className = "truncate";
    name.textContent = upload.name;
    root.append(spinner("size-3"), name);
  }
  return root;
}

/** Upload placeholders: widgets that ride along with edits until their upload resolves. */
const Uploads = Extension.create({
  name: "textEditUploads",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: UPLOAD_KEY,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set, _old, state) {
            // A collaborator's change replaces whole blocks, so a placeholder inside one can't be
            // mapped through it: in a shared document each placeholder is placed again from its
            // Yjs relative position, never dropped.
            const y =
              tr.docChanged && isChangeOrigin(tr) ? yBinding(state) : null;
            let next = y
              ? placeUploads(set, tr, y)
              : set.map(tr.mapping, tr.doc);
            const meta = tr.getMeta(UPLOAD_KEY) as UploadMeta | undefined;
            if (meta && "add" in meta) {
              const binding = yBinding(state);
              next = next.add(tr.doc, [
                uploadWidget(
                  meta.add,
                  meta.add.pos,
                  binding ? relativeAt(binding, meta.add.pos, -1) : undefined,
                ),
              ]);
            } else if (meta && "remove" in meta)
              next = next.remove(
                next.find(
                  undefined,
                  undefined,
                  (spec) => spec.id === meta.remove,
                ),
              );
            else if (meta && "fail" in meta) {
              // The placeholder turns into its failed state where it stands.
              const [was] = next.find(
                undefined,
                undefined,
                (spec) => spec.id === meta.fail.id,
              );
              if (was) {
                const spec = was.spec as {
                  upload: UploadWidget;
                  ref?: Y.RelativePosition;
                };
                next = next
                  .remove([was])
                  .add(tr.doc, [
                    uploadWidget(
                      { ...spec.upload, failed: meta.fail.failed },
                      was.from,
                      spec.ref,
                    ),
                  ]);
              }
            }
            return next;
          },
        },
        props: {
          decorations: (state) => UPLOAD_KEY.getState(state),
        },
        // In a shared document each placeholder's relative position is taken again after every
        // change, once Yjs holds it (the binding syncs in its own view update): a local edit that
        // rebuilds the block (a paragraph turned heading) would otherwise leave it pointing into
        // deleted text, and a collaborator's next change would lose the placeholder.
        view: () => ({
          update: (view, previous) => {
            if (previous.doc === view.state.doc) return;
            queueMicrotask(() => {
              if (view.isDestroyed) return;
              const y = yBinding(view.state);
              if (!y) return;
              for (const placeholder of UPLOAD_KEY.getState(
                view.state,
              )?.find() ?? [])
                (placeholder.spec as { ref?: Y.RelativePosition }).ref =
                  relativeAt(y, placeholder.from, -1);
            });
          },
        }),
      }),
    ];
  },
});

/** An upload's placeholder widget at `pos`; `ref` is its Yjs relative position when shared. */
function uploadWidget(
  upload: UploadWidget,
  pos: number,
  ref: Y.RelativePosition | undefined,
) {
  return PMDecoration.widget(pos, () => uploadPlaceholder(upload), {
    id: upload.id,
    // A new key once failed, so the placeholder is drawn again in its failed state.
    key: upload.failed ? `${upload.id}:failed` : upload.id,
    side: -1,
    upload,
    ref,
    // Retry and Remove are the widget's own: the editor leaves their events alone.
    stopEvent: () => Boolean(upload.failed),
    ignoreSelection: Boolean(upload.failed),
  });
}

/** Upload placeholders placed again after a collaborator's change, from their relative positions. */
function placeUploads(
  set: DecorationSet,
  tr: Transaction,
  y: NonNullable<ReturnType<typeof yBinding>>,
): DecorationSet {
  const mapped = set.map(tr.mapping, tr.doc);
  const placed = set.find().flatMap((decoration) => {
    const spec = decoration.spec as {
      id: string;
      upload: UploadWidget;
      ref?: Y.RelativePosition;
    };
    const kept = mapped.find(
      undefined,
      undefined,
      (each) => each.id === spec.id,
    );
    if (!spec.ref) return kept;
    // A pending upload is never dropped by a collaborator's change: where its position no longer
    // resolves (its block was replaced or deleted), it stays where the change mapped it, or where
    // it was — the file still lands, near the place it was put.
    const pos =
      resolveRelative(y, spec.ref) ?? kept[0]?.from ?? decoration.from;
    return [
      uploadWidget(
        spec.upload,
        Math.min(Math.max(pos, 0), tr.doc.content.size),
        spec.ref,
      ),
    ];
  });
  return DecorationSet.create(tr.doc, placed);
}

/** Where an upload's placeholder sits now, or null once it is gone (its text was deleted). */
function uploadPos(state: EditorState, id: string): number | null {
  const found = UPLOAD_KEY.getState(state)?.find(
    undefined,
    undefined,
    (spec) => spec.id === id,
  );
  return found?.[0]?.from ?? null;
}

/* --- mention menu -------------------------------------------------------------------------------*/

const MENTION_KEY = new PluginKey("textEditMention");

/** The built-in kinds' glyphs (`user`, `agent`); a host kind without its own icon takes `Link2`. */
const BUILT_IN_MENTION_ICON: Record<string, React.ReactElement> = {
  user: <UserRound />,
  agent: <Bot />,
};

/** A kind's menu icon: the host's, else the built-in glyph, else a link glyph — 16px. */
function mentionKindIcon(config: MentionKindConfig | undefined, kind: string) {
  const icon = config?.icon ?? BUILT_IN_MENTION_ICON[kind] ?? <Link2 />;
  return React.isValidElement<{ className?: string }>(icon)
    ? React.cloneElement(icon, {
        className: cn("size-4", icon.props.className),
      })
    : icon;
}

/** The menu's kinds in group order: by `order`, ties in the array's order. */
function orderedKinds(
  kinds: readonly MentionKindConfig[],
): MentionKindConfig[] {
  return kinds
    .map((kind, index) => ({ kind, index }))
    .sort((a, b) => a.kind.order - b.kind.order || a.index - b.index)
    .map(({ kind }) => kind);
}

interface MentionMenuState {
  query: string;
  /** The grouped, capped results in menu order; null until the first search answers. */
  results: MentionOption[] | null;
  loading: boolean;
  error: boolean;
  index: number;
  rect: DOMRect | null;
  command: (option: MentionOption) => void;
}

const flatOptions = (results: MentionOption[] | null) => results ?? [];

/**
 * How well a label matches the query, lower first: the whole label (0), its start (1), a word's
 * start (2), anywhere (3), not in the label (4: a match on the description). Case and accents
 * aside; an empty query matches every label alike.
 */
function mentionMatchRank(label: string, query: string): number {
  const fold = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const q = fold(query);
  if (!q) return 0;
  const name = fold(label);
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}`, "u").test(name)) return 2;
  return name.includes(q) ? 3 : 4;
}

/**
 * The menu's rows, only of the enabled kinds: first every option's own group (`group`, "Recent")
 * in the order the groups arrive, then the kinds' groups — at most five per group, in the order
 * they arrive. With a query, a kind's group sits by its best match (`mentionMatchRank`: a whole
 * name before a name's start, a word's start, anywhere), ties in `order`; with none, in `order`.
 */
function groupResults(
  options: readonly MentionOption[],
  kinds: readonly MentionKindConfig[],
  query = "",
  sections?: readonly MentionSection[],
): MentionOption[] {
  const enabled = new Set(kinds.map((kind) => kind.id));
  const offered = options.filter((option) => enabled.has(option.kind));
  const own = [
    ...new Set(
      offered.flatMap((option) => (option.group ? [option.group] : [])),
    ),
  ];
  const groups = orderedKinds(kinds).map((kind) =>
    offered
      .filter((option) => !option.group && option.kind === kind.id)
      .slice(0, 5),
  );
  const best = (group: MentionOption[]) =>
    Math.min(...group.map((option) => mentionMatchRank(option.label, query)));
  // A stable sort: groups that match as well keep their `order`.
  const byMatch = (list: MentionOption[][]) =>
    list
      .filter((group) => group.length > 0)
      .map((group) => ({ group, rank: best(group) }))
      .sort((a, b) => a.rank - b.rank)
      .flatMap(({ group }) => group);
  const ownRows = own.flatMap((group) =>
    offered.filter((option) => option.group === group).slice(0, 5),
  );
  if (!sections) return [...ownRows, ...byMatch(groups)];
  // Fixed sections: people, agents, then the records — only the records sort by match.
  const kindOf = (group: MentionOption[]) => group[0]?.kind;
  return [
    ...ownRows.filter((option) =>
      sections.includes(mentionSection(option.kind)),
    ),
    ...sections.flatMap((section) => {
      const inSection = groups.filter(
        (group) =>
          group.length > 0 && mentionSection(kindOf(group)!) === section,
      );
      return section === "records" ? byMatch(inSection) : inSection.flat();
    }),
  ];
}

/** The `@` menu section a kind belongs to (`TextEditMentions.sections`). */
function mentionSection(kind: MentionKind): MentionSection {
  return kind === "user" ? "people" : kind === "agent" ? "agents" : "records";
}

/** How long a keystroke waits for the next before the mention search asks. */
const MENTION_DEBOUNCE_MS = 120;
/** How long a cached answer is shown without asking again. */
const MENTION_FRESH_MS = 30_000;
/** How many queries one editor keeps answers for. */
const MENTION_CACHE_SIZE = 50;

/**
 * One editor's mention answers by query, for one `mentions` source: a new source (other kinds,
 * another subject) starts empty. Oldest out first past `MENTION_CACHE_SIZE`.
 */
class MentionSearchCache {
  private source: unknown = null;
  private answers = new Map<string, { at: number; options: MentionOption[] }>();
  get(source: unknown, query: string) {
    if (source !== this.source) return null;
    const hit = this.answers.get(query);
    return hit
      ? { options: hit.options, fresh: Date.now() - hit.at < MENTION_FRESH_MS }
      : null;
  }
  set(source: unknown, query: string, options: MentionOption[]) {
    if (source !== this.source) {
      this.source = source;
      this.answers.clear();
    }
    this.answers.delete(query);
    this.answers.set(query, { at: Date.now(), options });
    if (this.answers.size > MENTION_CACHE_SIZE)
      this.answers.delete(this.answers.keys().next().value!);
  }
}

/** Whether every word of `query` starts a word of the option's label or description. */
function matchesMentionQuery(option: MentionOption, query: string): boolean {
  const words = `${option.label} ${option.description ?? ""}`
    .toLowerCase()
    .split(/[\s@.]+/);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => words.some((word) => word.startsWith(part)));
}

/**
 * What the mention menu says instead of rows: only a failed search. A search in flight keeps the
 * rows on show, or shows placeholder rows (`SuggestionMenu`'s `loading`) before the first answer.
 */
function mentionStatus(state: MentionMenuState): string | undefined {
  return state.error ? "Couldn't search" : undefined;
}

/**
 * The mention menu's rows: under their own group or their kind's `plural`, each with its kind's
 * icon (as its chip shows it) or its own.
 */
function mentionOptions(
  state: MentionMenuState,
  kinds: readonly MentionKindConfig[],
  sections?: readonly MentionSection[],
): SuggestionMenuOption[] {
  const byId = new Map(kinds.map((kind) => [kind.id, kind]));
  const results = flatOptions(state.results);
  // People who share a name keep their email in view, to tell them apart.
  const names = new Map<string, number>();
  for (const option of results)
    if (option.kind === "user")
      names.set(option.label, (names.get(option.label) ?? 0) + 1);
  return results.map((option) => {
    const config = byId.get(option.kind);
    const person =
      sections !== undefined &&
      (option.kind === "user" || option.kind === "agent");
    return {
      key: `${option.group ? `${option.group}:` : ""}${option.kind}:${option.id}`,
      label: option.label,
      description: option.description,
      descriptionShown:
        option.descriptionShown ??
        (sections &&
        option.kind === "user" &&
        (names.get(option.label) ?? 0) < 2
          ? "active"
          : "always"),
      group: option.group ?? config?.plural ?? option.kind,
      icon: (
        <span
          aria-hidden
          data-slot="text-edit-mention-icon"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center overflow-hidden",
            person && !option.icon ? "rounded-full" : "rounded-sm",
          )}
        >
          {option.icon ??
            (person ? (
              <PersonAvatar
                person={{
                  name: option.label,
                  kind: option.kind === "agent" ? "agent" : "person",
                }}
                className="size-5"
              />
            ) : (
              mentionKindIcon(config, option.kind)
            ))}
        </span>
      ),
    };
  });
}

/* ------------------------------------------------------------------------------------------------
 * Images — Tiptap's `ResizableNodeView` (the official Image extension's resize), with a width that
 * round-trips through Markdown (`![alt|320](src)`) and HTML (`width`), snap guides while dragging,
 * and a ⋯ menu the editor renders into each image (Open, Download, Copy link, Remove image).
 * ----------------------------------------------------------------------------------------------*/

/** One image node view's menu slot, rendered into by `ImageMenus`. */
interface ImageSlot {
  host: HTMLElement;
  image: HTMLImageElement;
  getPos: () => number | undefined;
}

/** The mounted image node views; `ImageMenus` subscribes. */
class ImageSlots {
  private slots: ImageSlot[] = [];
  private listeners = new Set<() => void>();
  add(slot: ImageSlot) {
    this.slots = [...this.slots, slot];
    this.emit();
    return () => {
      this.slots = this.slots.filter((each) => each !== slot);
      this.emit();
    };
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
  get = () => this.slots;
  private emit() {
    for (const listener of this.listeners) listener();
  }
}

interface ImageRuntime {
  slots: ImageSlots;
  open: React.RefObject<((image: HTMLImageElement) => void) | undefined>;
}

const IMAGE_MIN_WIDTH = 48;
/** How close (px) a dragged width comes to a guide before it snaps to it. */
const IMAGE_SNAP = 8;
/** The guides: a quarter, a half, three quarters and the full width left of the image. */
const IMAGE_GUIDES = [0.25, 0.5, 0.75, 1] as const;

// The image keeps one radius (`rounded-lg`, the media radius) at rest, hovered, selected and while
// resizing; the selection is a thin primary outline hugging it (no frame, no extra spacing).
// An image that can't load (gone, or another site's the page may not show) keeps a visible frame
// with its alt text, so its toolbar can still replace it.
const IMAGE_CONTAINER =
  "group/image relative my-2 flex-col items-start max-w-full leading-none [&_img]:block [&_img]:max-w-full [&_img]:rounded-lg [&_img[data-broken]]:h-24 [&_img[data-broken]]:min-w-full [&_img[data-broken]]:border [&_img[data-broken]]:border-dashed [&_img[data-broken]]:border-border [&_img[data-broken]]:bg-muted [&_img[data-broken]]:p-3 [&_img[data-broken]]:text-sm [&_img[data-broken]]:text-muted-foreground";
const IMAGE_WRAPPER =
  "max-w-full rounded-lg outline-offset-0 in-[.ProseMirror-selectednode]:outline-2 in-[.ProseMirror-selectednode]:outline-info group-data-[resize-state=true]/image:outline-2 group-data-[resize-state=true]/image:outline-info";
// Notion-style side handles: a pill bar inside the left and right edges, shown on hover, while
// selected (a tap on touch) and while resizing; never in a read-only editor.
const IMAGE_HANDLE = cn(
  "z-10 w-4 touch-none opacity-0 transition-opacity duration-150 group-hover/image:opacity-100 group-data-[resize-state=true]/image:opacity-100 in-[.ProseMirror-selectednode]:opacity-100 in-[.ProseMirror[contenteditable=false]]:hidden pointer-coarse:w-6",
  "data-[resize-handle=left]:cursor-ew-resize data-[resize-handle=right]:cursor-ew-resize",
  "after:absolute after:inset-x-1.5 after:top-1/2 after:h-10 after:max-h-[60%] after:-translate-y-1/2 after:rounded-full after:border after:border-background after:bg-info after:shadow-sm pointer-coarse:after:inset-x-2",
);
/** The hover toolbar's frame: top-right on the image, a blurred translucent pill. */
const IMAGE_MENU_SLOT =
  "absolute end-2 top-2 z-20 flex items-center gap-0.5 rounded-md border border-border bg-background/70 p-0.5 shadow-sm backdrop-blur-sm opacity-0 transition-opacity duration-150 group-hover/image:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 in-[.ProseMirror-selectednode]:opacity-100 group-data-[resize-state=true]/image:hidden empty:hidden data-narrow:hidden";
const IMAGE_CAPTION =
  "mt-1.5 max-w-full text-sm leading-snug text-muted-foreground wrap-break-word select-text";
const IMAGE_SIZE_LABEL =
  "pointer-events-none absolute bottom-1.5 start-1/2 z-10 hidden -translate-x-1/2 rounded-md bg-popover px-1.5 py-0.5 text-xs text-popover-foreground tabular-nums shadow-sm border border-border group-data-[resize-state=true]/image:block";
const IMAGE_GUIDE =
  "pointer-events-none absolute top-0 bottom-0 z-10 w-0 border-s border-dashed border-border data-active:border-solid data-active:border-primary";

/** The editor's content box: the snap guides' layer. */
function guideLayer(editor: Editor): HTMLElement | null {
  return editor.view.dom.closest<HTMLElement>("[data-slot=text-edit-content]");
}

/** An image block's node view: the resizable image, its snap guides, and the hover toolbar slot. */
function imageView(runtime: ImageRuntime): NodeViewRenderer {
  return ({ node, getPos, editor }) => {
    const image = document.createElement("img");
    image.draggable = false;
    // The prose recipe's image margin would pad the frame above and below.
    image.style.margin = "0";
    image.addEventListener("error", () => {
      image.dataset.broken = "";
    });
    image.addEventListener("load", () => {
      delete image.dataset.broken;
    });
    // The caption (Markdown's title, `![alt](src "caption")`): under the image, at its start.
    const caption = document.createElement("div");
    caption.className = IMAGE_CAPTION;
    caption.dataset.slot = "text-edit-image-caption";
    caption.contentEditable = "false";
    const sync = (next: PMNode) => {
      const { src, alt, title, width, height } = next.attrs as {
        src: string | null;
        alt: string | null;
        title: string | null;
        width: number | null;
        height: number | null;
      };
      if (src) {
        if (image.getAttribute("src") !== src) image.src = src;
      } else image.removeAttribute("src");
      image.alt = alt ?? "";
      // The title is the caption, shown under the image rather than as a tooltip.
      image.removeAttribute("title");
      caption.textContent = title ?? "";
      caption.hidden = !title;
      image.style.width = width ? `${width}px` : "";
      image.style.height = "";
      // A known size reserves the image's box before it loads, as the read view does.
      image.style.aspectRatio = width && height ? `${width} / ${height}` : "";
      // A version diff: the image is marked (an outline — the inks cannot show on a picture), and
      // its alt text says so.
      const change = ychangeType(next.attrs.ychange);
      if (change) {
        image.dataset.ychange = change;
        image.alt = `${change === "added" ? "Added" : "Removed"}: ${alt ?? ""}`;
      } else delete image.dataset.ychange;
    };
    sync(node);

    // Snap guides, drawn in the content box while a handle is dragged.
    let guides: HTMLElement[] = [];
    let available = Number.POSITIVE_INFINITY;
    const clearGuides = () => {
      for (const guide of guides) guide.remove();
      guides = [];
    };
    const startGuides = () => {
      clearGuides();
      const layer = guideLayer(editor);
      const content = editor.view.dom.getBoundingClientRect();
      const left = image.getBoundingClientRect().left;
      const style = getComputedStyle(editor.view.dom);
      available = Math.max(
        IMAGE_MIN_WIDTH,
        content.right - Number.parseFloat(style.paddingRight || "0") - left,
      );
      view.maxSize = { width: available };
      if (!layer) return;
      const origin = layer.getBoundingClientRect().left - layer.scrollLeft;
      guides = IMAGE_GUIDES.map((fraction) => {
        const guide = document.createElement("div");
        guide.className = IMAGE_GUIDE;
        guide.dataset.slot = "text-edit-image-guide";
        guide.style.left = `${left - origin + fraction * available}px`;
        layer.append(guide);
        return guide;
      });
    };

    const sizeLabel = document.createElement("span");
    sizeLabel.className = IMAGE_SIZE_LABEL;
    sizeLabel.dataset.slot = "text-edit-image-size";

    const view = new ResizableNodeView({
      element: image,
      editor,
      node,
      getPos,
      onResize: (width) => {
        let next = width;
        let snapped = -1;
        IMAGE_GUIDES.forEach((fraction, index) => {
          const target = Math.round(fraction * available);
          if (Math.abs(width - target) <= IMAGE_SNAP) {
            next = target;
            snapped = index;
          }
        });
        image.style.width = `${next}px`;
        image.style.height = "";
        guides.forEach((guide, index) =>
          guide.toggleAttribute("data-active", index === snapped),
        );
        sizeLabel.textContent =
          snapped === -1
            ? `${Math.round(next)} px`
            : `${Math.round(next)} px · ${IMAGE_GUIDES[snapped]! * 100}%`;
      },
      onCommit: (width) => {
        clearGuides();
        image.style.height = "";
        const pos = getPos();
        if (pos === undefined) return;
        const next = Math.round(width);
        if (next === view.node.attrs.width) return;
        // The height keeps the image's aspect ratio (unknown: none).
        const { width: was, height: tall } = view.node.attrs as {
          width: number | null;
          height: number | null;
        };
        editor
          .chain()
          .setNodeSelection(pos)
          .updateAttributes("image", {
            width: next,
            height:
              was && tall ? Math.max(1, Math.round((next * tall) / was)) : null,
          })
          .run();
      },
      onUpdate: (next) => {
        if (next.type !== node.type) return false;
        sync(next);
        return true;
      },
      options: {
        directions: ["left", "right"],
        min: { width: IMAGE_MIN_WIDTH },
        preserveAspectRatio: true,
        className: {
          container: IMAGE_CONTAINER,
          wrapper: IMAGE_WRAPPER,
          handle: IMAGE_HANDLE,
        },
      },
    });
    view.dom.dataset.slot = "text-edit-image-node";
    // The view sets a stored height in px; the width alone sizes the image (the ratio follows).
    image.style.height = "";

    // Tiptap ends a resize on `mouseup` only: end a touch drag the same way. The guides and
    // the maximum width are measured as a drag starts.
    const wrapper = view.wrapper as HTMLElement;
    const onStart = (event: Event) => {
      if (!(event.target as Element).closest?.("[data-resize-handle]")) return;
      startGuides();
      if (event.type === "touchstart") {
        const end = () => document.dispatchEvent(new MouseEvent("mouseup"));
        document.addEventListener("touchend", end, { once: true });
        document.addEventListener("touchcancel", end, { once: true });
      }
    };
    wrapper.addEventListener("mousedown", onStart, true);
    wrapper.addEventListener("touchstart", onStart, true);

    const host = document.createElement("span");
    host.className = IMAGE_MENU_SLOT;
    host.contentEditable = "false";
    host.dataset.slot = "text-edit-image-menu";
    wrapper.append(sizeLabel, host);
    wrapper.after(caption);
    const remove = runtime.slots.add({ host, image, getPos });
    // An image narrower than its toolbar shows none (a double-click still opens it).
    const narrow =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() =>
            host.toggleAttribute("data-narrow", image.clientWidth < 160),
          );
    narrow?.observe(image);

    // A click selects the image (Notion): the ring, the handles and the toolbar follow.
    wrapper.addEventListener("click", (event) => {
      const target = event.target as Element;
      if (
        !editor.isEditable ||
        target.closest?.(
          "[data-resize-handle],[data-slot=text-edit-image-menu]",
        )
      )
        return;
      const pos = getPos();
      if (typeof pos === "number") editor.commands.setNodeSelection(pos);
    });

    image.addEventListener("dblclick", (event) => {
      event.preventDefault();
      runtime.open.current?.(image);
    });

    const destroy = view.destroy.bind(view);
    return Object.assign(view, {
      // The menu and its popup are React's: ProseMirror leaves their events alone.
      stopEvent: (event: Event) => host.contains(event.target as Node),
      ignoreMutation: (mutation: { type: string }) =>
        mutation.type !== "selection",
      destroy: () => {
        clearGuides();
        narrow?.disconnect();
        remove();
        destroy();
      },
    });
  };
}

/**
 * Each image's hover toolbar (top-right, blurred): while editable Replace, Caption and Alt text, then Open,
 * Download and Copy link. Delete is the block menu's (and Backspace on the selected image).
 */
function ImageMenus({
  editor,
  slots,
  editable,
  onOpen,
  downloadHref,
  onReplace,
  onLeave,
  onCommit,
}: {
  editor: Editor;
  slots: ImageSlots;
  editable: boolean;
  onOpen?: (image: HTMLImageElement) => void;
  /** Where Download saves from, given the image's `src` (`imageDownloadHref`). */
  downloadHref?: (src: string) => string | null | undefined;
  /** Select the image and open the image panel, whose insert replaces it. */
  onReplace?: (pos: number) => void;
  /** The edit session's end check (`leave`). */
  onLeave?: (next: EventTarget | null) => void;
  /** Commit the document now (`commitNow`). */
  onCommit?: () => void;
}) {
  const mounted = React.useSyncExternalStore(
    slots.subscribe,
    slots.get,
    slots.get,
  );
  return mounted.map((slot, index) =>
    createPortal(
      <ImageMenu
        editor={editor}
        slot={slot}
        editable={editable}
        onOpen={onOpen}
        downloadHref={downloadHref}
        onReplace={onReplace}
        onLeave={onLeave}
        onCommit={onCommit}
      />,
      slot.host,
      String(index),
    ),
  );
}

function ImageToolButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <MenuTip label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={label}
        onMouseDown={(event) => event.preventDefault()}
        {...props}
      >
        {children}
      </Button>
    </MenuTip>
  );
}

function ImageMenu({
  editor,
  slot,
  editable,
  onOpen,
  downloadHref,
  onReplace,
  onLeave,
  onCommit,
}: {
  editor: Editor;
  slot: ImageSlot;
  editable: boolean;
  onOpen?: (image: HTMLImageElement) => void;
  downloadHref?: (src: string) => string | null | undefined;
  onReplace?: (pos: number) => void;
  onLeave?: (next: EventTarget | null) => void;
  onCommit?: () => void;
}) {
  const src = slot.image.currentSrc || slot.image.src;
  const raw = slot.image.getAttribute("src") ?? "";
  // A link worth copying: a real URL, not an upload's local preview.
  const shareable = /^(https?:|\/)/i.test(raw);
  const absolute = React.useMemo(() => {
    try {
      return new URL(src, document.baseURI).href;
    } catch {
      return src;
    }
  }, [src]);
  // The host's attachment link saves the file in place; the image's own URL opens in a new tab.
  const saveFrom = (shareable ? downloadHref?.(raw) : null) ?? null;
  return (
    <>
      {editable && onReplace ? (
        <ImageToolButton
          label="Replace"
          onClick={() => {
            const pos = slot.getPos();
            if (pos !== undefined) onReplace(pos);
          }}
        >
          <Replace />
        </ImageToolButton>
      ) : null}
      {editable ? (
        <>
          <ImageTextAttribute
            editor={editor}
            slot={slot}
            attribute="title"
            onLeave={onLeave}
            onCommit={onCommit}
          />
          <ImageTextAttribute
            editor={editor}
            slot={slot}
            attribute="alt"
            onLeave={onLeave}
            onCommit={onCommit}
          />
        </>
      ) : null}
      {onOpen ? (
        <ImageToolButton label="Open" onClick={() => onOpen(slot.image)}>
          <Maximize2 />
        </ImageToolButton>
      ) : null}
      <ImageToolButton
        label="Download"
        render={
          saveFrom ? (
            <a href={saveFrom} download />
          ) : (
            <a href={src} download target="_blank" rel="noopener noreferrer" />
          )
        }
        nativeButton={false}
      >
        <Download />
      </ImageToolButton>
      {shareable ? (
        <ImageToolButton
          label="Copy link"
          onClick={() => void navigator.clipboard?.writeText(absolute)}
        >
          <LinkIcon />
        </ImageToolButton>
      ) : null}
    </>
  );
}

/** The image text attributes its toolbar edits: the alt text, and the caption (Markdown's title). */
const IMAGE_TEXT = {
  alt: {
    label: "Alt text",
    placeholder: "Describe the image for screen readers",
    icon: ScanText,
  },
  title: {
    label: "Caption",
    placeholder: "Add a caption",
    icon: Captions,
  },
} as const;

/**
 * One of the image's text attributes (`IMAGE_TEXT`), edited in a popover from its toolbar: Enter or
 * closing saves it; an untouched draft saves nothing (a collaborator's newer text stays).
 */
function ImageTextAttribute({
  editor,
  slot,
  attribute,
  onLeave,
  onCommit,
}: {
  editor: Editor;
  slot: ImageSlot;
  attribute: keyof typeof IMAGE_TEXT;
  /** The edit session's end check, once focus settles after the popover closes. */
  onLeave?: (next: EventTarget | null) => void;
  /** Commit the document now (an attribute edit made outside a typing session). */
  onCommit?: () => void;
}) {
  const copy = IMAGE_TEXT[attribute];
  const Icon = copy.icon;
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const openedRef = React.useRef("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();
  const current = () => {
    const pos = slot.getPos();
    const node = pos === undefined ? null : editor.state.doc.nodeAt(pos);
    return node?.type.name === "image" ? { pos: pos!, node } : null;
  };
  const save = () => {
    const found = current();
    if (!found || value === openedRef.current) return;
    const next = value.trim() || null;
    if ((found.node.attrs[attribute] ?? null) === next) return;
    editor.view.dispatch(
      editor.state.tr.setNodeAttribute(found.pos, attribute, next),
    );
    // Committed now (`onValueChange` and `onCommit`), whether or not an edit session was open.
    onCommit?.();
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          openedRef.current = String(current()?.node.attrs[attribute] ?? "");
          setValue(openedRef.current);
        } else {
          save();
          // Closed by a click elsewhere: the session ends (and commits) unless focus came back.
          requestAnimationFrame(() => onLeave?.(document.activeElement));
        }
        setOpen(next);
      }}
    >
      <MenuTip label={copy.label}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={copy.label}
              onMouseDown={(event) => event.preventDefault()}
            />
          }
        >
          <Icon />
        </PopoverTrigger>
      </MenuTip>
      <PopoverContent
        align="end"
        data-text-edit-menu=""
        className="w-72 gap-2 p-2"
        // The field first, so typing goes straight in (never to the page's shortcuts).
        initialFocus={() => inputRef.current ?? true}
      >
        <form
          className="flex flex-col gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            save();
            editor.commands.focus();
          }}
        >
          <label
            htmlFor={inputId}
            className="px-1 text-xs font-medium text-muted-foreground"
          >
            {copy.label}
          </label>
          <Input
            ref={inputRef}
            id={inputId}
            size="sm"
            value={value}
            placeholder={copy.placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
        </form>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Library constructs — mentions, callouts, toggles, file chips, heading ids, comment highlights and
 * uploads. Every one round-trips through Markdown exactly; decorations never touch the document.
 * ----------------------------------------------------------------------------------------------*/

/** What the extensions read from the component; refs, so the extensions are built once. */
/** A tiny store: subscribers re-render when the version moves (a new `mentionLabel`). */
class Versioned {
  private version = 0;
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
  get = () => this.version;
  bump() {
    this.version++;
    for (const listener of this.listeners) listener();
  }
}

interface EditorRuntime {
  mentionHref: React.RefObject<TextEditProps["mentionHref"]>;
  mentionImage: React.RefObject<TextEditProps["mentionImage"]>;
  /** A record mention's label for this reader (`mentionLabel`); `labels` bumps when it changes. */
  mentionLabel: React.RefObject<TextEditProps["mentionLabel"]>;
  /** A closed target's struck chip and status tag (`mentionStatus`); read with the labels. */
  mentionStatus: React.RefObject<TextEditProps["mentionStatus"]>;
  labels: Versioned;
  /** A shared document: record mentions are inserted without their title. */
  collaborative: boolean;
  fileLinkPrefix: React.RefObject<string>;
  /** The live block kinds Markdown reads (`liveBlockKinds`), fixed when the editor is created. */
  liveBlockKinds: readonly LiveBlockKind[];
  mention: {
    enabled: () => boolean;
    get: () => MentionMenuState | null;
    set: (next: MentionMenuState | null) => void;
    query: (query: string) => void;
  };
}

/**
 * A mention chip's node view: the shared `InlineChip` (hover card from the nearest
 * `InlineChipProvider`); a click places the caret, ⌘/Ctrl-click opens its target in a new tab.
 */
function mentionView(runtime: EditorRuntime) {
  return function MentionView({ node }: ReactNodeViewProps) {
    const {
      kind,
      id,
      label: stored,
    } = node.attrs as {
      kind: MentionKind;
      id: string;
      label: string;
    };
    // A record mention in a shared document carries no title: this reader's label comes from the
    // host, and stays `…` when it has none.
    React.useSyncExternalStore(
      runtime.labels.subscribe,
      runtime.labels.get,
      runtime.labels.get,
    );
    // In a shared document a record's label is always this reader's — a title that reached the
    // document anyway (an old copy, a peer's client) is never shown.
    const own = isRecordMentionKind(kind)
      ? (runtime.mentionLabel.current?.(kind, id) ?? "")
      : "";
    const label =
      (runtime.collaborative && isRecordMentionKind(kind)
        ? own
        : stored || own) || "…";
    const hrefFor = runtime.mentionHref.current;
    const closed = runtime.mentionStatus.current?.(kind, id);
    return (
      // An atom: never editable text, never spellchecked.
      <NodeViewWrapper
        as="span"
        className="inline"
        contentEditable={false}
        spellCheck={false}
      >
        <InlineChip
          kind={kind}
          targetId={id}
          label={label}
          // No state of the surface's own: the chip asks the provider's (`InlineChipResolver.state`).
          struck={closed ? closed.struck === true : undefined}
          done={closed ? closed.done === true : undefined}
          status={closed ? closed.status : undefined}
          openOn="modifier"
          href={hrefFor ? hrefFor(kind, id) : undefined}
          image={
            kind === "user" ? runtime.mentionImage.current?.(id) : undefined
          }
          title={kind === "user" ? undefined : `${label} — ⌘-click to open`}
        />
      </NodeViewWrapper>
    );
  };
}

/** The `@` mention's editing behaviour: a chip deletes whole, and `@` opens the mention menu. */
function mentionBehaviour(runtime: EditorRuntime) {
  return Extension.create({
    name: "textEditMention",
    addKeyboardShortcuts() {
      // A chip goes whole: the caret beside it deletes the atom, never half its label.
      const removeBeside = (before: boolean) => () => {
        const { selection } = this.editor.state;
        if (!selection.empty) return false;
        const $pos = selection.$from;
        const beside = before ? $pos.nodeBefore : $pos.nodeAfter;
        if (beside?.type.name !== "mention") return false;
        const from = before ? $pos.pos - beside.nodeSize : $pos.pos;
        this.editor.view.dispatch(
          this.editor.state.tr.delete(from, from + beside.nodeSize),
        );
        return true;
      };
      return {
        Backspace: removeBeside(true),
        Delete: removeBeside(false),
      };
    },
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        Suggestion<MentionOption, MentionOption>({
          editor,
          pluginKey: MENTION_KEY,
          char: "@",
          // "@Asha Rao": a name with spaces stays one query (B1); a collaborator's typing never
          // opens this viewer's menu.
          allowSpaces: true,
          findSuggestionMatch: phraseMatch({ maxWords: 4, maxChars: 40 }),
          shouldShow: localQuery(MENTION_KEY),
          allow: () =>
            runtime.mention.enabled() && !editor.isActive("codeBlock"),
          items: () => [],
          command: ({ editor: ed, range, props }) => {
            // A record's title is not everyone's to read: a shared document stores the mention
            // without it, and each reader's chip resolves it (`mentionLabel`).
            ed.chain()
              .focus()
              .insertContentAt(range, mentionChip(runtime.collaborative, props))
              .run();
          },
          render: () => {
            const show = (
              props: SuggestionProps<MentionOption, MentionOption>,
            ) => {
              const previous = runtime.mention.get();
              runtime.mention.set({
                query: props.query,
                results: previous?.results ?? null,
                loading: previous ? previous.loading : true,
                error: previous?.error ?? false,
                index: previous?.index ?? 0,
                rect: props.clientRect?.() ?? null,
                command: props.command,
              });
              if (props.query !== previous?.query || !previous)
                runtime.mention.query(props.query);
            };
            return {
              onStart: show,
              onUpdate: show,
              onExit: () => runtime.mention.set(null),
              onKeyDown: ({ event }) => {
                const state = runtime.mention.get();
                if (!state) return false;
                const options = flatOptions(state.results);
                // While a search is in flight the menu holds ↑ ↓ and Enter: the caret stays put
                // and Enter never breaks the line.
                return suggestionMenuKeyDown(event, {
                  count: options.length,
                  activeIndex: state.index,
                  onActiveIndexChange: (index) =>
                    runtime.mention.set({ ...state, index }),
                  onSelect: (index) => state.command(options[index]!),
                  onClose: () => exitSuggestion(editor.view, MENTION_KEY),
                  holdWhenEmpty: true,
                });
              },
            };
          },
        }),
        recordLabelsStripped(runtime),
      ];
    },
  });
}

/**
 * A shared document never stores a record mention's title (a page or task the reader may not be
 * allowed to see): whatever inserts one here — the menu, a paste, `setContent`, an import — the
 * label is cleared before it syncs, and each reader's chip resolves its own (`mentionLabel`).
 * Only this person's own changes are scanned, and only where they changed the document.
 */
function recordLabelsStripped(runtime: EditorRuntime) {
  return new Plugin({
    appendTransaction(transactions, _old, state) {
      if (!runtime.collaborative) return null;
      const ranges: [number, number][] = [];
      transactions.forEach((tr, t) => {
        if (!tr.docChanged || isChangeOrigin(tr)) return;
        tr.mapping.maps.forEach((map, i) => {
          const rest = tr.mapping.slice(i + 1);
          map.forEach((_from, _to, start, end) => {
            let from = rest.map(start, -1);
            let to = rest.map(end, 1);
            for (const later of transactions.slice(t + 1)) {
              from = later.mapping.map(from, -1);
              to = later.mapping.map(to, 1);
            }
            ranges.push([from, to]);
          });
        });
      });
      let out: Transaction | null = null;
      const size = state.doc.content.size;
      for (const [from, to] of ranges)
        state.doc.nodesBetween(
          Math.max(0, from),
          Math.min(size, to),
          (node, pos) => {
            if (
              node.type.name === "mention" &&
              node.attrs.label &&
              isRecordMentionKind(node.attrs.kind as MentionKind)
            ) {
              out ??= state.tr;
              out.setNodeMarkup(pos, undefined, { ...node.attrs, label: "" });
            }
          },
        );
      return out;
    },
  });
}

/**
 * A callout's node view: the DS `Alert` for its tone. While editable the tone icon is a menu
 * button that switches the tone; read-only it is the plain icon, as `MarkdownView` renders it.
 */
function CalloutView({ node, editor, updateAttributes }: ReactNodeViewProps) {
  useEditorEditable(editor);
  const tone = (node.attrs.tone as CalloutTone) ?? "note";
  const style = CALLOUT_STYLE[tone] ?? CALLOUT_STYLE.note;
  const Icon = style.icon;
  return (
    <NodeViewWrapper as="div" className="contents">
      <Alert
        variant={style.variant}
        role="note"
        aria-label={style.label}
        data-slot="callout"
        data-tone={tone}
        className={calloutClassName}
      >
        {editor.isEditable ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  contentEditable={false}
                  aria-label={`Callout type: ${style.label}`}
                  onMouseDown={(event) => event.preventDefault()}
                  // One text line tall (20px, the Alert's line), so the icon sits centred on it.
                  className={cn("-mx-1 -my-0.5 size-6", style.washClassName)}
                />
              }
            >
              <Icon
                data-icon-tone=""
                className={cn("size-4", style.iconClassName)}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" data-text-edit-menu="">
              {CALLOUT_TONES.map((option) => {
                const OptionIcon = CALLOUT_STYLE[option].icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={option === tone}
                    onClick={() => updateAttributes({ tone: option })}
                  >
                    <OptionIcon
                      data-icon-tone=""
                      className={CALLOUT_STYLE[option].iconClassName}
                    />
                    {CALLOUT_STYLE[option].label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Icon aria-hidden />
        )}
        <AlertDescription className={calloutContentClassName}>
          <NodeViewContent data-slot="callout-content" className="min-w-0" />
        </AlertDescription>
      </Alert>
    </NodeViewWrapper>
  );
}

/**
 * Each viewer's own open and closed toggles in a shared document, by the toggle's `blockId`. A
 * chevron click there changes only this map — never the document — so a reader folding a toggle
 * folds it for themselves, without an edit, a version or a collaborator's toggle moving. The
 * author's default stays the node's `open` attribute ("Open by default").
 */
class ToggleStates {
  private open = new Map<string, boolean>();
  /** A read-only single-writer editor's folds, by the toggle's node (it has no ids): never kept. */
  private local = new WeakMap<PMNode, boolean>();
  private listeners = new Set<() => void>();
  private version = 0;
  /** The host's own record (`toggleState`): read for a toggle this session has not flipped. */
  constructor(
    private readonly host: React.RefObject<TextEditToggleState | undefined>,
  ) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
  snapshot = () => this.version;
  /** Whether the toggle `id` shows open for this viewer; `fallback` is the document's default. */
  get(id: FoldKey, fallback: boolean): boolean {
    if (typeof id !== "string") return this.local.get(id) ?? fallback;
    const own = this.open.get(id);
    if (own !== undefined) return own;
    return this.host.current?.isOpen(id, fallback) ?? fallback;
  }
  /**
   * This viewer opened or closed a toggle. `persist` false is a passing reveal (a find result, a
   * link or a comment inside it): shown open now, not recorded as the viewer's choice.
   */
  set(id: FoldKey, open: boolean, persist = true) {
    if (typeof id !== "string") this.local.set(id, open);
    else {
      this.open.set(id, open);
      if (persist) this.host.current?.onToggle(id, open);
    }
    this.version++;
    for (const listener of this.listeners) listener();
  }
}

/** A toggle's key in `ToggleStates`: its `blockId` in a shared document, else its node. */
type FoldKey = string | PMNode;

/** The toggles' runtime: each viewer's own folds, and whether the document is shared (or a diff). */
interface ToggleRuntime {
  states: ToggleStates;
  shared: boolean;
}

/**
 * Whose fold a toggle's chevron changes: this viewer's own — in a shared document (by `blockId`;
 * none until it has one) or a read-only one, which never edits — else null: the document's `open`
 * attribute.
 */
function foldKey(
  runtime: ToggleRuntime,
  editor: Editor,
  node: PMNode,
): FoldKey | null {
  if (runtime.shared) return (node.attrs.blockId as string | null) || null;
  return editor.isEditable ? null : node;
}

/** Whether the toggle at `node` shows open for this viewer. */
function toggleOpen(
  runtime: ToggleRuntime,
  editor: Editor,
  node: PMNode,
): boolean {
  const fallback = node.attrs.open !== false;
  const key = foldKey(runtime, editor, node);
  return key === null ? fallback : runtime.states.get(key, fallback);
}

/**
 * Open every closed toggle around `pos` for this viewer, so what sits there shows: a find result,
 * a linked heading, a comment's text, the caret. In a shared document it is this viewer's passing
 * view (not recorded as their choice); in a single-writer one the toggle's `open` attribute.
 * Returns whether any opened.
 */
function expandAncestors(
  editor: Editor,
  runtime: ToggleRuntime,
  pos: number,
): boolean {
  if (editor.isDestroyed) return false;
  const { doc } = editor.state;
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
  const tr = editor.state.tr;
  let opened = false;
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name !== "toggle" || toggleOpen(runtime, editor, node))
      continue;
    // The title line always shows: only a position in the body needs the toggle open.
    const summaryEnd = $pos.before(depth) + 1 + node.firstChild!.nodeSize;
    if (pos < summaryEnd) continue;
    const key = foldKey(runtime, editor, node);
    if (key !== null) runtime.states.set(key, true, false);
    else if (!runtime.shared && editor.isEditable)
      tr.setNodeAttribute($pos.before(depth), "open", true);
    else continue;
    opened = true;
  }
  if (tr.docChanged) editor.view.dispatch(tr.setMeta("addToHistory", false));
  return opened;
}

/**
 * The caret moved into a closed toggle's hidden body (arrow keys, a click on the folded title's
 * end, an undo): in a shared document the toggle opens for this viewer, so the caret is never
 * somewhere unseen. A single-writer document's toggles are its own `open` attribute: the caret
 * alone never writes it.
 */
function toggleReveal(runtime: ToggleRuntime) {
  return Extension.create({
    name: "textEditToggleReveal",
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        new Plugin({
          view: () => ({
            update: (view, previous) => {
              if (
                !runtime.shared ||
                !view.hasFocus() ||
                previous.selection.eq(view.state.selection)
              )
                return;
              const head = view.state.selection.head;
              // After this update: dispatching inside a view update is not allowed.
              queueMicrotask(() => expandAncestors(editor, runtime, head));
            },
          }),
        }),
      ];
    },
  });
}

/**
 * A toggle's node view, Notion-style: a real chevron button in the gutter (hover wash, pointer,
 * a 24px target that works on touch) that opens and closes the toggle; closed, only the title
 * line shows. In a single-writer document the open state is the node's `open` attribute
 * (`<details open>` in markdown); in a shared one it is each viewer's own (`ToggleStates`), and
 * "Open by default" in the block menu sets the attribute for everyone.
 */
function toggleView(runtime: ToggleRuntime) {
  return function ToggleView({ node, editor, getPos }: ReactNodeViewProps) {
    useEditorEditable(editor);
    const { states } = runtime;
    React.useSyncExternalStore(
      states.subscribe,
      states.snapshot,
      states.snapshot,
    );
    const open = toggleOpen(runtime, editor, node);
    const blockId = node.attrs.blockId as string | null;
    const flip = () => {
      const pos = getPos();
      if (typeof pos !== "number") return;
      const { state } = editor;
      const key = foldKey(runtime, editor, node);
      // A shared document without an id for this toggle yet: nothing to key a viewer's state by,
      // and a reader must not edit — the click waits for the id.
      if (runtime.shared && !blockId && !editor.isEditable) return;
      const tr =
        key !== null ? state.tr : state.tr.setNodeAttribute(pos, "open", !open);
      // Closing with the caret in the hidden body: move it to the end of the title line.
      const summaryEnd = pos + 1 + node.firstChild!.nodeSize - 1;
      if (
        open &&
        state.selection.from > summaryEnd &&
        state.selection.to < pos + node.nodeSize
      )
        tr.setSelection(TextSelection.create(tr.doc, summaryEnd));
      if (key !== null) states.set(key, !open);
      if (tr.docChanged || tr.selectionSet) editor.view.dispatch(tr);
    };
    return (
      <NodeViewWrapper
        data-slot="toggle"
        data-open={open ? "" : undefined}
        // The body hides when closed. Tiptap's React content box nests the blocks one level down
        // (`[data-node-view-content-react]`), so the rules reach the summary's siblings, not children.
        className="group/toggle relative my-2 ps-6 [&_[data-slot=toggle-summary]]:min-h-6 [&_[data-slot=toggle-summary]]:py-0.5 [&_[data-slot=toggle-summary]]:font-medium [&:not([data-open])_[data-slot=toggle-summary]~*]:hidden print:[&:not([data-open])_[data-slot=toggle-summary]~*]:block print:[&_[data-slot=toggle-chevron]]:hidden"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          contentEditable={false}
          aria-expanded={open}
          aria-label={open ? "Collapse toggle" : "Expand toggle"}
          data-slot="toggle-chevron"
          // Keep the caret where it is: a click must not move the selection or blur the editor.
          onMouseDown={(event) => event.preventDefault()}
          onClick={flip}
          // Notion's triangle: ▶ closed, turning 90° to ▼ open.
          // An open toggle is not a pressed button: no fill while open, only on hover.
          className="absolute start-0 top-0 cursor-pointer text-muted-foreground select-none hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground hover:aria-expanded:bg-muted hover:aria-expanded:text-foreground [&_svg]:transition-transform [&_svg]:duration-150 group-data-open/toggle:[&_svg]:rotate-90 rtl:[&_svg]:-scale-x-100"
        >
          <Play aria-hidden data-icon-tone="" className="size-3 fill-current" />
        </Button>

        <NodeViewContent data-slot="toggle-content" className="min-w-0" />
      </NodeViewWrapper>
    );
  };
}

/** A toggle's editing keys: Enter in the summary goes to the body (a summary is one line). */
function toggleKeys(runtime: ToggleRuntime) {
  return Extension.create({
    name: "textEditToggleKeys",
    addKeyboardShortcuts() {
      const intoBody = () => {
        const { $from } = this.editor.state.selection;
        if ($from.parent.type.name !== "toggleSummary") return false;
        const after = $from.after();
        const tr = this.editor.state.tr;
        // A closed toggle opens: its body is where the caret goes (this viewer's own state in a
        // shared document).
        const toggle = $from.node($from.depth - 1);
        if (
          toggle.type.name === "toggle" &&
          !toggleOpen(runtime, this.editor, toggle)
        ) {
          const key = foldKey(runtime, this.editor, toggle);
          if (key !== null) runtime.states.set(key, true);
          else tr.setNodeAttribute($from.before($from.depth - 1), "open", true);
        }
        tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
        this.editor.view.dispatch(tr.scrollIntoView());
        return true;
      };
      return { Enter: intoBody, "Shift-Enter": intoBody };
    },
  });
}

/** The video and audio types a drop, paste or pick lands as a player (through `onFileUpload`). */
const INLINE_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];
const INLINE_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

/** A video or audio block's node view: the native player, selectable and draggable as a block. */
function MediaView({ node, selected }: ReactNodeViewProps) {
  const kind = node.type.name as "video" | "audio";
  const src = node.attrs.src as string;
  return (
    <NodeViewWrapper
      data-slot={`text-edit-${kind}`}
      data-drag-handle=""
      contentEditable={false}
      data-selected={selected ? "true" : undefined}
      className="my-2 rounded-lg"
    >
      {kind === "video" ? (
        <video
          src={src}
          controls
          preload="metadata"
          playsInline
          className={MEDIA_VIDEO_CLASS}
        />
      ) : (
        <audio
          src={src}
          controls
          preload="metadata"
          className={MEDIA_AUDIO_CLASS}
        />
      )}
    </NodeViewWrapper>
  );
}

/* --- embeds and external images ----------------------------------------------------------------*/

/**
 * A YouTube or Loom embed's node view: `MarkdownEmbed`'s facade (nothing loads from the provider
 * until Play), selectable and draggable as a block.
 */
/**
 * Each editor's `embeds` (the providers it shows as players), read by its embed node views, its
 * paste and its video panel. An editor without them shows embeds as links.
 */
const EDITOR_EMBEDS = new WeakMap<Editor, EmbedProviders | undefined>();

/** Whether `editor` shows `provider`'s videos as players. */
function embedsOn(editor: Editor, provider: string): boolean {
  return Boolean(
    (EDITOR_EMBEDS.get(editor) as Record<string, unknown> | undefined)?.[
      provider
    ],
  );
}

function EmbedView({ node, selected, editor }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper
      data-slot="text-edit-embed"
      data-drag-handle=""
      contentEditable={false}
      data-selected={selected ? "true" : undefined}
      className="my-2 rounded-lg data-selected:[&_[data-slot=markdown-embed-frame]]:outline-2 data-selected:[&_[data-slot=markdown-embed-frame]]:outline-info"
    >
      <MarkdownEmbed
        url={String(node.attrs.url ?? "")}
        providers={EDITOR_EMBEDS.get(editor)}
        className="my-0"
      />
    </NodeViewWrapper>
  );
}

/* --- live blocks -----------------------------------------------------------------------------*/

/**
 * Each editor's live block drawing (the host's `renderLiveBlock`, or `renderTaskQuery` for a task
 * list: `liveBlockRenderer`) and the `taskQuery` node views reading it. A new function re-renders
 * every node view, so a host's changed data or a reader's changed access never leaves an old
 * drawing on screen.
 */
const EDITOR_LIVE_BLOCK = new WeakMap<
  Editor,
  { render: LiveBlockRender | undefined; listeners: Set<() => void> }
>();

function liveBlockStore(editor: Editor) {
  let store = EDITOR_LIVE_BLOCK.get(editor);
  if (!store) {
    store = { render: undefined, listeners: new Set() };
    EDITOR_LIVE_BLOCK.set(editor, store);
  }
  return store;
}

/** Hand `editor`'s node views the host's current live block drawing. */
function setLiveBlockRender(
  editor: Editor,
  render: LiveBlockRender | undefined,
) {
  const store = liveBlockStore(editor);
  if (store.render === render) return;
  store.render = render;
  for (const listener of store.listeners) listener();
}

/** The host's current live block drawing, re-rendering the caller when it changes. */
function useLiveBlockRender(editor: Editor): LiveBlockRender | undefined {
  const store = liveBlockStore(editor);
  return React.useSyncExternalStore(
    React.useCallback(
      (listener: () => void) => {
        store.listeners.add(listener);
        return () => store.listeners.delete(listener);
      },
      [store],
    ),
    () => store.render,
    () => store.render,
  );
}

/** A live block's filter key, as its `:::<kind>` directive writes one. */
const TASK_QUERY_KEY = /^[a-z][a-z0-9-]*$/;

/**
 * A live block's node view (a task list, or any kind the host reads): an atom, selectable and
 * draggable as a block, nothing editable inside. The host draws it (`renderLiveBlock`, or
 * `renderTaskQuery` for a task list); without one — or where it draws nothing — the stored
 * snapshot shows as `MarkdownView`'s quiet card, under its kind's heading.
 */
function TaskQueryView({
  node,
  selected,
  editor,
  extension,
  updateAttributes,
}: ReactNodeViewProps) {
  const snapshot = String(node.attrs.snapshot ?? "");
  const query = node.attrs.query as Record<string, string> | null;
  const render = useLiveBlockRender(editor);
  const editable = useEditorEditable(editor);
  const kind = String(node.attrs.kind ?? "tasks");
  const drawn = render?.(kind, {
    blockId: String(node.attrs.blockId ?? ""),
    query: query && typeof query === "object" ? { ...query } : {},
    snapshot,
    editable,
    ...(editable && {
      // Re-checked at call time (a host may keep the setter past a switch to read-only). Only
      // what the directive can write back is stored: keys of its grammar, values on one line.
      setQuery: (next: Record<string, string>) => {
        if (!editor.isEditable) return;
        updateAttributes({
          query: Object.fromEntries(
            Object.entries(next)
              .filter(([key]) => TASK_QUERY_KEY.test(key))
              .map(([key, value]) => [
                key,
                String(value).replace(/[\r\n]+/g, " "),
              ]),
          ),
        });
      },
    }),
  });
  return (
    <NodeViewWrapper
      data-slot="text-edit-task-query"
      data-kind={kind}
      data-drag-handle=""
      contentEditable={false}
      data-selected={selected ? "true" : undefined}
      className="my-2 rounded-lg data-selected:outline-2 data-selected:outline-info"
    >
      {drawn ?? (
        <MarkdownLiveBlock
          snapshot={snapshot}
          kind={(
            extension.options as { kinds?: readonly LiveBlockKind[] }
          ).kinds?.find((k) => k.name === kind)}
          className="my-0"
        />
      )}
    </NodeViewWrapper>
  );
}

/* --- pasted links -----------------------------------------------------------------------------*/

/**
 * What a lone pasted link is in the document: its URL as typed text (the paste itself, until its
 * default applies), a link, a mention of the app's record (`TextEditMentions.fromUrl`) or a video
 * embed.
 */
type PastedForm = "text" | "link" | "mention" | "embed";

/** A form the paste popover offers. */
type PastedChoice = Exclude<PastedForm, "text">;

/** The lone link pasted last, what it is now, and what the paste popover offers instead. */
interface PastedLink {
  /** This paste: the tracker (`PASTED_KEY`) follows one at a time. */
  id: number;
  url: string;
  /** The popover's choices, the default first: Mention · Link, Embed · Link, or Link alone. */
  offers: readonly PastedChoice[];
  /** What the document holds now. */
  form: PastedForm;
  /** A link's text: the URL, or its page's title. */
  text: string;
  /** The record it names, once the host answered `fromUrl`. */
  mention: MentionOption | null;
  /** The popover shows: until the next keystroke (Tab moves into it), click or Escape. */
  open: boolean;
  /** Aborts the host's `fromUrl` when another paste replaces this one. */
  controller: AbortController;
}

/** Keys that are only modifiers: holding one (for ⌘Z) leaves the paste popover open. */
const MODIFIER_KEYS = new Set(["Shift", "Meta", "Control", "Alt", "CapsLock"]);

/** The elements a pasted URL's HTML may wrap it in and still be one lone link. */
const LONE_URL_WRAPPERS = new Set([
  "A",
  "SPAN",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "FONT",
  "P",
  "DIV",
  "BR",
  "META",
]);

/** The longest URL a paste turns into a link, mention or embed. */
const PASTED_URL_MAX = 2048;

/**
 * How long a pasted link waits for its page's title (`linkPreview`) before it becomes a link with
 * the URL as its text — so the link and its title are one undo step, never two.
 */
const LINK_TITLE_WAIT_MS = 1500;

/**
 * The one http(s) URL a paste is, or null: its plain text is the URL and nothing else, and its
 * HTML (when it has any) shows only that URL — a link copied with its own text pastes as written.
 */
function loneUrl(text: string, html: string | undefined): string | null {
  const url = text.trim();
  if (url.length > PASTED_URL_MAX || !/^https?:\/\/\S+$/i.test(url))
    return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  if (html) {
    // The URL and nothing else: inline wrappers only (a link copied from a page, a styled run),
    // never a table, an image or a list around it — those paste as they are.
    const { body } = new DOMParser().parseFromString(html, "text/html");
    if (body.textContent?.trim() !== url) return null;
    const href = new URL(url).href;
    for (const element of body.querySelectorAll("*")) {
      if (!LONE_URL_WRAPPERS.has(element.tagName)) return null;
      // A link whose text is one address and whose target another pastes as that link.
      if (element.tagName === "A") {
        const target = element.getAttribute("href") ?? "";
        if (!URL.canParse(target) || new URL(target).href !== href) return null;
      }
    }
  }
  return url;
}

/** A page title as one line of text. */
const cleanTitle = (title: string | null | undefined) =>
  title?.replace(/\s+/g, " ").trim() || undefined;

/**
 * Where the pasted link is: its exact range, and — in a shared document — that range as Yjs
 * relative positions (`bindPasted`), so it survives the binding rebuilding the document for a
 * collaborator's change.
 */
interface PastedRange {
  id: number;
  from: number;
  to: number;
  /**
   * Its two ends as Yjs relative positions, bound to its first and last characters (a text or a
   * link), or to the mention or embed itself: an end whose character is deleted no longer meets
   * the other at its size, and the tracking ends.
   */
  rel: { start: Y.RelativePosition; end: Y.RelativePosition } | null;
  /** The mention's or embed's own Yjs type: once deleted, the tracking ends. */
  node: Y.XmlElement | null;
  /**
   * While the URL waits as text: the character after it when it landed (`""` at the end of its
   * block) — anything typed onto its end but a space makes it another address. Null once it is a
   * link, a mention or an embed.
   */
  after: string | null;
}

const PASTED_KEY = new PluginKey<PastedRange | null>("textEditPasted");

/**
 * Follows the pasted link's exact range: mapped through this editor's own changes, resolved again
 * from its relative positions after a collaborator's (or the shared history's), and dropped when
 * a change lands inside it. A change of what it holds is caught by `pastedRange`.
 */
function pastedTracker() {
  return new Plugin<PastedRange | null>({
    key: PASTED_KEY,
    state: {
      init: () => null,
      apply(tr, value, _old, state) {
        const meta = tr.getMeta(PASTED_KEY) as PastedRange | null | undefined;
        if (meta !== undefined) return meta;
        if (!value || !tr.docChanged) return value;
        if (
          (
            tr.getMeta(ySyncPluginKey) as
              { isChangeOrigin?: boolean } | undefined
          )?.isChangeOrigin
        ) {
          const y = yBinding(state);
          if (!y || !value.rel || value.node?._item?.deleted) return null;
          const from = resolveRelative(y, value.rel.start);
          const end = resolveRelative(y, value.rel.end);
          const size = value.to - value.from;
          if (from === null || end === null) return null;
          // A node is anchored on itself (its end is its start); text on its first and last
          // characters, so both ends must still span its size.
          const to = value.node ? from + size : end;
          return to - from === size ? { ...value, from, to } : null;
        }
        let { from, to } = value;
        let touched = false;
        tr.mapping.maps.forEach((map, step) => {
          const doc = tr.docs[step + 1] ?? tr.doc;
          map.forEach((start, end, newStart, newEnd) => {
            if (start < to && end > from) touched = true;
            // Text typed straight onto a URL still waiting to convert makes it another address
            // (`…/t1` → `…/t12`); a space after it does not.
            if (
              value.after !== null &&
              start === to &&
              end === to &&
              /^\S/.test(doc.textBetween(newStart, newEnd, "\n", "\ufffc"))
            )
              touched = true;
          });
          from = map.map(from, 1);
          to = map.map(to, -1);
        });
        return touched || from >= to ? null : { ...value, from, to };
      },
    },
  });
}

/**
 * In a shared document, where the tracked range starts as a relative position, taken now it is
 * in Yjs: bound to its first character, or to the mention or embed itself (a position beside a
 * node binds to its neighbour, which a collaborator's insertion would move it past).
 */
function bindPasted(view: EditorView) {
  const range = PASTED_KEY.getState(view.state);
  const y = yBinding(view.state);
  if (!range || !y) return;
  const node = view.state.doc.nodeAt(range.from);
  if (node && !node.isText)
    for (const [type, mapped] of y.mapping as Map<
      Y.AbstractType<unknown>,
      unknown
    >)
      if (mapped === node && type.parent) {
        const parent = type.parent as Y.XmlElement;
        range.node = type as Y.XmlElement;
        const at = Y.createRelativePositionFromTypeIndex(
          parent,
          parent.toArray().indexOf(range.node),
          0,
        );
        range.rel = { start: at, end: at };
        return;
      }
  range.rel = {
    start: relativeAt(y, range.from, 0),
    end: relativeAt(y, range.to, -1),
  };
}

/**
 * The pasted link's range, while it still holds exactly what this paste left there: the URL as
 * unlinked text, the whole link (URL or title, every character linked to the URL), the mention or
 * the embed. Null once it was edited, split, undone or removed — nothing then replaces it.
 */
function pastedRange(
  state: EditorState,
  pasted: PastedLink,
): PastedRange | null {
  const range = PASTED_KEY.getState(state);
  if (!range || range.id !== pasted.id) return null;
  const { doc } = state;
  const { from, to } = range;
  if (to > doc.content.size) return null;
  // Turned into a code block meanwhile (it holds neither links nor mentions): it stays as typed.
  if (doc.resolve(from).parent.type.spec.code) return null;
  if (pasted.form === "mention" || pasted.form === "embed") {
    const node = doc.nodeAt(from);
    const same =
      pasted.form === "mention"
        ? node?.type.name === "mention" &&
          node.attrs.kind === pasted.mention?.kind &&
          node.attrs.id === pasted.mention?.id
        : node?.type.name === "embed" && node.attrs.url === pasted.url;
    return same && from + node!.nodeSize === to ? range : null;
  }
  const want = pasted.form === "link" ? pasted.text : pasted.url;
  if (doc.textBetween(from, to, "\n", "\ufffc") !== want) return null;
  // Text typed straight onto the URL's end (`…/t1` → `…/t12`) makes it another address.
  if (pasted.form === "text" && range.after !== null) {
    const next = charAfter(doc, to);
    if (next !== range.after && !/^\s?$/.test(next)) return null;
  }
  // A link: every character linked to the URL. Text: no link to anywhere else (typing a space
  // after it may autolink it to itself, which changes nothing).
  let linked = true;
  let elsewhere = false;
  doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return true;
    const link = node.marks.find((mark) => mark.type.name === "link");
    if (link?.attrs.href !== pasted.url) linked = false;
    if (link && link.attrs.href !== pasted.url) elsewhere = true;
    // Made inline code meanwhile: code holds neither links nor mentions.
    if (node.marks.some((mark) => mark.type.name === "code")) {
      elsewhere = true;
      linked = false;
    }
    return false;
  });
  return (pasted.form === "link" ? linked : !elsewhere) ? range : null;
}

/** The character after `pos` in its own block (`""` at the block's end; `\ufffc` for a node). */
function charAfter(doc: PMNode, pos: number): string {
  const $pos = doc.resolve(pos);
  const end = Math.min($pos.parentOffset + 1, $pos.parent.content.size);
  return $pos.parent.textBetween($pos.parentOffset, end, "\n", "\ufffc");
}

/**
 * The block an embed can stand in for at `pos`: a paragraph in a container that holds embeds.
 * Null where an embed cannot go (a list item, a table cell, a heading).
 */
function embedHost(doc: PMNode, pos: number) {
  const $pos = doc.resolve(pos);
  if ($pos.depth < 1 || $pos.parent.type.name !== "paragraph") return null;
  if (!EMBED_CONTAINERS.has($pos.node(-1).type.name)) return null;
  return { from: $pos.before(), to: $pos.after(), paragraph: $pos.parent };
}

/**
 * Dispatch `tr` as an undo step of its own under either history — ProseMirror's (one editor) and
 * the Yjs undo manager's (a shared document): nothing typed just before or just after joins it,
 * so ⌘Z right after a paste's conversion takes back only that.
 */
function dispatchOwnStep(view: EditorView, tr: Transaction) {
  const undo = (
    yUndoPluginKey.getState(view.state) as
      { undoManager?: { stopCapturing: () => void } } | undefined
  )?.undoManager;
  undo?.stopCapturing();
  view.dispatch(closeHistory(tr));
  undo?.stopCapturing();
  // A change-less close: the next change starts a new step.
  view.dispatch(closeHistory(view.state.tr));
}

/** The answers one host's `linkPreview` gave, by URL (each asked once per page load). */
const LINK_PREVIEWS = new WeakMap<
  NonNullable<InlineChipResolver["linkPreview"]>,
  Map<string, Promise<InlineChipLinkPreview | null>>
>();
/** How many URLs' answers a host's `linkPreview` keeps. */
const LINK_PREVIEW_CACHE_SIZE = 200;

/** Another site's page title and icon for `url`, asked of the host once and kept. */
function linkPreviewOf(
  source: InlineChipResolver["linkPreview"] | undefined,
  url: string,
): Promise<InlineChipLinkPreview | null> | null {
  if (!source || !/^https?:/i.test(url)) return null;
  let answers = LINK_PREVIEWS.get(source);
  if (!answers) LINK_PREVIEWS.set(source, (answers = new Map()));
  let answer = answers.get(url);
  if (!answer) {
    answer = source(url, { signal: new AbortController().signal }).catch(
      () => null,
    );
    answers.set(url, answer);
    if (answers.size > LINK_PREVIEW_CACHE_SIZE)
      answers.delete(answers.keys().next().value!);
  }
  return answer;
}

/** Whether `url` is a video file to play natively: one of this site's, or a video file's link. */
function isVideoFileUrl(url: string): boolean {
  if (/^\/(?!\/)/.test(url) || /^blob:/i.test(url)) return true;
  try {
    return /\.(?:mp4|m4v|webm|ogv|ogg|mov)$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/**
 * Where the block of `type` just inserted at `from` sits: the node the insert selected, else the
 * first one of that type from `from` (a container that needs a leading line — an empty list item —
 * keeps it, and the block lands after).
 */
function insertedAt(editor: Editor, from: number, type: string | undefined) {
  const { selection, doc } = editor.state;
  if (selection instanceof NodeSelection && selection.node.type.name === type)
    return selection.from;
  let found = from;
  let seen = false;
  const end = Math.min(selection.to + 1, doc.content.size);
  doc.nodesBetween(from, end, (node, pos) => {
    if (seen) return false;
    if (node.type.name === type) {
      found = pos;
      seen = true;
      return false;
    }
    return true;
  });
  return found;
}

/** Put the caret on the line after the block at `pos`, adding an empty one when none follows. */
function caretAfterBlockAt(editor: Editor, pos: number) {
  const { state } = editor;
  const node = state.doc.nodeAt(pos);
  if (!node || !node.isBlock || node.isTextblock) return;
  const after = pos + node.nodeSize;
  const tr = state.tr;
  const $after = tr.doc.resolve(after);
  const next = $after.nodeAfter;
  // An empty line already there takes the caret; otherwise a new one does.
  if (!(next?.type.name === "paragraph" && next.content.size === 0)) {
    const paragraph = state.schema.nodes.paragraph;
    if (
      !paragraph ||
      !$after.parent.canReplaceWith($after.index(), $after.index(), paragraph)
    )
      return;
    tr.insert(after, paragraph.create());
  }
  tr.setSelection(TextSelection.create(tr.doc, after + 1));
  editor.view.dispatch(tr.scrollIntoView());
}

/**
 * `content` (an image) keeping the alt text and caption of the image it replaces where it brings
 * none of its own: Replace swaps the picture, never what was written about it.
 */
function keepImageText(
  content: JSONContent,
  replaced: PMNode | null | undefined,
): JSONContent {
  if (!replaced || content.type !== "image") return content;
  const attrs = { ...content.attrs };
  if (!attrs.alt) attrs.alt = replaced.attrs.alt ?? null;
  if (!attrs.title) attrs.title = replaced.attrs.title ?? null;
  return { ...content, attrs };
}

/** The image an upload or import replaces (an image's Replace): where it was, and its `src`. */
interface ImageToReplace {
  pos: number;
  src: string;
}

/** An image pasted or dropped from elsewhere, taken out of the slice to be imported. */
interface ExternalImage {
  src: string;
  alt: string | null;
  /** A pasted `data:` image, as a file for `onImageUpload`. */
  file?: File;
}

/** How many images one paste or drop imports; the rest land as links. */
/** How long an image's size is waited for before it lands without one. */
const IMAGE_SIZE_TIMEOUT_MS = 5_000;

/** An image's natural size once it loads; null when it can't load, or after a few seconds. */
function imageSize(
  src: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const probe = new Image();
    const finish = (size: { width: number; height: number } | null) => {
      clearTimeout(timer);
      probe.onload = null;
      probe.onerror = null;
      resolve(size);
    };
    const timer = setTimeout(() => finish(null), IMAGE_SIZE_TIMEOUT_MS);
    probe.onload = () =>
      finish(
        probe.naturalWidth > 0 && probe.naturalHeight > 0
          ? { width: probe.naturalWidth, height: probe.naturalHeight }
          : null,
      );
    probe.onerror = () => finish(null);
    probe.src = src;
  });
}

/**
 * The size an image lands with: the host's (`width`, `height`), else its natural size — so its
 * box is reserved before it loads. A host width without a height keeps the natural aspect ratio.
 */
function imageSizeAttrs(
  given: { width?: number; height?: number },
  natural: { width: number; height: number } | null,
): { width: number | null; height: number | null } {
  if (given.width)
    return {
      width: given.width,
      height:
        given.height ??
        (natural
          ? Math.max(
              1,
              Math.round((given.width * natural.height) / natural.width),
            )
          : null),
    };
  return natural
    ? { width: natural.width, height: natural.height }
    : { width: null, height: null };
}

const EXTERNAL_IMAGE_LIMIT = 20;
/** How many imports run at once. */
const EXTERNAL_IMAGE_CONCURRENCY = 3;
const EXTERNAL_IMAGE_FAILED =
  "Couldn't import that image. A link was added instead.";
const EXTERNAL_IMAGE_REPLACE_FAILED =
  "Couldn't import that image. The image wasn't replaced.";

/**
 * A URL's last path segment, decoded — kept as written where it is not valid percent-encoding
 * (`100%.png`), so a name never throws.
 */
function urlFileName(url: string): string {
  const segment = url.split(/[?#]/)[0]!.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Whether an image `src` is another site's (not this origin's, not a `blob:` or relative URL). */
function isExternalImage(src: string): boolean {
  if (typeof window === "undefined" || /^blob:/i.test(src)) return false;
  try {
    const url = new URL(src, window.location.href);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.origin !== window.location.origin
    );
  } catch {
    return false;
  }
}

/** A `data:image/…;base64,` URL as a file, or null. */
function dataImageFile(src: string, index: number): File | null {
  const match =
    /^data:(image\/(?:png|jpeg|gif|webp|avif));base64,([A-Za-z0-9+/=\s]+)$/i.exec(
      src,
    );
  if (!match) return null;
  try {
    const binary = atob(match[2]!.replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const type = match[1]!.toLowerCase();
    const extension = type.split("/")[1]!.replace("jpeg", "jpg");
    return new File([bytes], `pasted-image-${index + 1}.${extension}`, {
      type,
    });
  } catch {
    return null;
  }
}

/**
 * Pasted HTML's `data:` images as `blob:` URLs the paste can carry (the image node refuses `data:`),
 * each one's file remembered in `files` for `onImageUpload`.
 */
function dataImagesToBlobs(html: string, files: Map<string, File>): string {
  return html.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])(data:image\/[^"']+)\2/gi,
    (whole, start: string, quote: string, src: string) => {
      const file = dataImageFile(src, files.size);
      if (!file) return whole;
      const url = URL.createObjectURL(file);
      files.set(url, file);
      return `${start}${quote}${url}${quote}`;
    },
  );
}

/** The images in `slice` to import: another site's, and pasted `data:` ones (as files), by `src`. */
function importableImages(
  slice: Slice,
  files: ReadonlyMap<string, File>,
): Map<string, ExternalImage[]> {
  const images = new Map<string, ExternalImage[]>();
  slice.content.descendants((node) => {
    if (node.type.name !== "image") return true;
    const src = String(node.attrs.src ?? "");
    const file = files.get(src);
    if (file || isExternalImage(src))
      images.set(src, [
        ...(images.get(src) ?? []),
        {
          src,
          alt: (node.attrs.alt as string | null) ?? null,
          ...(file ? { file } : {}),
        },
      ]);
    return false;
  });
  return images;
}

/** A pasted image taken out to import, and where it sat. */
interface PlacedImage {
  image: ExternalImage;
  pos: number;
}

/**
 * Pasted images to import (`onExternalImage`): the paste lands with them, and in the same step —
 * before it renders or reaches a collaborator — each leaves the document, recorded where it sat,
 * so its import lands in its own place among the pasted blocks. A `data:` image always uploads (it
 * is the person's own file); past `EXTERNAL_IMAGE_LIMIT`, another site's image lands as a link.
 */
function pastedImagesExtension(runtime: {
  /** The images the paste being handled carries to import (taken: each paste has its own). */
  take: () => Map<string, ExternalImage[]> | null;
  place: (images: PlacedImage[]) => void;
}) {
  return Extension.create({
    name: "textEditPastedImages",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          appendTransaction(transactions, _old, state) {
            const index = transactions.findIndex(
              (tr) =>
                tr.docChanged &&
                ["paste", "drop"].includes(tr.getMeta("uiEvent") as string),
            );
            if (index < 0) return null;
            const pending = runtime.take();
            if (!pending?.size) return null;
            // Where the paste landed, in the document as it is now.
            const paste = transactions[index]!;
            const after = new Mapping();
            for (const tr of transactions.slice(index + 1))
              after.appendMapping(tr.mapping);
            let from = Infinity;
            let to = -Infinity;
            paste.mapping.maps.forEach((map, step) => {
              const rest = paste.mapping.slice(step + 1);
              map.forEach((_a, _b, start, end) => {
                from = Math.min(from, after.map(rest.map(start, -1), -1));
                to = Math.max(to, after.map(rest.map(end, 1), 1));
              });
            });
            if (from > to) return null;
            const found: (PlacedImage & { node: PMNode })[] = [];
            state.doc.nodesBetween(
              Math.max(0, from),
              Math.min(to, state.doc.content.size),
              (node, pos) => {
                if (node.type.name !== "image") return true;
                const image = pending
                  .get(String(node.attrs.src ?? ""))
                  ?.shift();
                if (image) found.push({ image, pos, node });
                return false;
              },
            );
            if (!found.length) return null;
            const tr = state.tr;
            const placed: (PlacedImage & { steps: number })[] = [];
            let imports = found.filter((each) => !each.image.file).length;
            // From the last: each step leaves the positions before it as they are.
            for (const { image, pos, node } of found.reverse()) {
              const external = !image.file;
              if (external && imports-- > EXTERNAL_IMAGE_LIMIT) {
                tr.replaceWith(
                  pos,
                  pos + node.nodeSize,
                  state.schema.nodes.paragraph!.create(
                    null,
                    state.schema.text(image.src, [
                      state.schema.marks.link!.create({ href: image.src }),
                    ]),
                  ),
                );
                continue;
              }
              // An empty line holds its place, so images side by side keep their order (and a
              // cell or list item that held only the image stays valid); the image replaces it.
              tr.replaceWith(
                pos,
                pos + node.nodeSize,
                state.schema.nodes.paragraph!.create(),
              );
              placed.push({ image, pos: pos + 1, steps: tr.steps.length });
            }
            const images = placed
              .map(({ image, pos, steps }) => ({
                image,
                pos: tr.mapping.slice(steps).map(pos),
              }))
              .reverse();
            // Once this state is in the view: the uploads' placeholders go where the images were.
            if (images.length) queueMicrotask(() => runtime.place(images));
            return tr;
          },
        }),
      ];
    },
  });
}

/**
 * A collaborator's colours, by hue — literal classes, so Tailwind sees every one; only the hue key
 * travels over awareness, never a colour string. The caret is a 2px bar in the solid tag colour,
 * its name label the soft tag ground and ink, the selection a light wash.
 */
const COLLABORATOR_HUE: Record<
  AvatarHue,
  { caret: string; label: string; selection: string }
> = {
  blue: {
    caret: "border-tag-blue",
    label: "bg-tag-blue-subtle text-tag-blue-text",
    selection: "bg-tag-blue/20",
  },
  cyan: {
    caret: "border-tag-cyan",
    label: "bg-tag-cyan-subtle text-tag-cyan-text",
    selection: "bg-tag-cyan/20",
  },
  green: {
    caret: "border-tag-green",
    label: "bg-tag-green-subtle text-tag-green-text",
    selection: "bg-tag-green/20",
  },
  lime: {
    caret: "border-tag-lime",
    label: "bg-tag-lime-subtle text-tag-lime-text",
    selection: "bg-tag-lime/20",
  },
  yellow: {
    caret: "border-tag-yellow",
    label: "bg-tag-yellow-subtle text-tag-yellow-text",
    selection: "bg-tag-yellow/20",
  },
  orange: {
    caret: "border-tag-orange",
    label: "bg-tag-orange-subtle text-tag-orange-text",
    selection: "bg-tag-orange/20",
  },
  red: {
    caret: "border-tag-red",
    label: "bg-tag-red-subtle text-tag-red-text",
    selection: "bg-tag-red/20",
  },
  pink: {
    caret: "border-tag-pink",
    label: "bg-tag-pink-subtle text-tag-pink-text",
    selection: "bg-tag-pink/20",
  },
  magenta: {
    caret: "border-tag-magenta",
    label: "bg-tag-magenta-subtle text-tag-magenta-text",
    selection: "bg-tag-magenta/20",
  },
  purple: {
    caret: "border-tag-purple",
    label: "bg-tag-purple-subtle text-tag-purple-text",
    selection: "bg-tag-purple/20",
  },
};

/** An unidentified collaborator's caret: neutral, with no name. */
const UNKNOWN_COLLABORATOR = {
  caret: "border-muted-foreground",
  label: "bg-muted text-muted-foreground",
  selection: "bg-muted-foreground/15",
};

/** A collaborator's hue as drawn: an agent always purple, an unknown hue blue; nobody, neutral. */
function collaboratorHue(user: TextEditCollaborationUser | null) {
  if (!user) return UNKNOWN_COLLABORATOR;
  const hue = user.kind === "agent" ? "purple" : user.hue;
  return COLLABORATOR_HUE[hue && hue in COLLABORATOR_HUE ? hue : "blue"];
}

/** How long a collaborator's name shows after their caret moves. */
const CARET_LABEL_MS = 2000;

/**
 * A collaborator's caret: a 2px bar with their name above it, shown while they type or move and
 * for 2s after (and on hover). Built anew for every move, so each move shows the name again.
 */
function collaboratorCaret(
  user: TextEditCollaborationUser | null,
): HTMLElement {
  const hue = collaboratorHue(user);
  const caret = document.createElement("span");
  caret.setAttribute("data-slot", "text-edit-caret");
  // A presence cue: a collaborator's name is not part of the text a screen reader reads.
  caret.setAttribute("aria-hidden", "true");
  caret.className = cn(
    "group/caret relative -mx-px border-x pointer-events-auto",
    hue.caret,
  );
  const label = document.createElement("span");
  label.setAttribute("data-slot", "text-edit-caret-label");
  label.setAttribute("data-active", "");
  label.className = cn(
    "pointer-events-none absolute start-[-1px] bottom-full z-10 rounded-sm px-1 py-px font-sans text-xs leading-none font-medium whitespace-nowrap select-none opacity-0 transition-opacity duration-150 group-hover/caret:opacity-100 data-active:opacity-100",
    hue.label,
  );
  if (!user) return caret;
  label.textContent = user.name;
  caret.append(label);
  setTimeout(() => label.removeAttribute("data-active"), CARET_LABEL_MS);
  return caret;
}

/**
 * Carets whose identity comes from `peer` (the server's word, by awareness client id), never from
 * the fields a client writes into awareness — the upstream caret draws those as given.
 */
function trustedCarets(peer: TextEditCollaboration["peer"]) {
  const identity = (clientId: number) => peer?.(clientId) ?? null;
  return CollaborationCaret.extend({
    addProseMirrorPlugins() {
      const upstream = CollaborationCaret.config.addProseMirrorPlugins as
        ((this: unknown) => Plugin[]) | undefined;
      // The awareness listener (this viewer's own state, the users list) stays upstream's.
      const [listener] = upstream?.call(this) ?? [];
      return [
        ...(listener ? [listener] : []),
        yCursorPlugin(this.options.provider.awareness, {
          cursorBuilder: (_claimed: unknown, clientId: number) =>
            collaboratorCaret(identity(clientId)),
          selectionBuilder: (_claimed: unknown, clientId: number) => ({
            class: collaboratorHue(identity(clientId)).selection,
          }),
        }),
      ];
    },
  });
}

/** The extensions a shared document adds: the Yjs binding and the collaborators' carets. */
function collaborationExtensions(collaboration: TextEditCollaboration) {
  const user: TextEditCollaborationUser = collaboration.user;
  return [
    Collaboration.configure({
      document: collaboration.document,
      field: collaboration.field ?? "default",
    }),
    trustedCarets(collaboration.peer).configure({
      provider: collaboration.provider,
      user: {
        id: user.id,
        name: user.name,
        hue: user.kind === "agent" ? "purple" : user.hue,
        kind: user.kind ?? "person",
      },
    }),
    CaretKept,
  ];
}

/**
 * This person's caret through a collaborator's change, exactly where Yjs puts it. After a remote
 * change the binding resolves the caret's relative positions, then second-guesses any landing in a
 * paragraph whose text changed and re-places it by its old offset — so when two people type at the
 * same spot, the collaborator's character arriving first puts this caret back before the one just
 * typed, and the next keystroke lands in front of it (typing comes out reversed). Where the caret's
 * own text still exists in the shared document (no block moved or deleted under it), its Yjs
 * position is the truth and is kept; everything else is left to the binding's recovery.
 */
const CaretKept = Extension.create({
  name: "textEditCaretKept",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, old, state) {
          if (!transactions.some((tr) => tr.docChanged && isChangeOrigin(tr)))
            return null;
          const y = yBinding(state);
          const sync = ySyncPluginKey.getState(state) as
            | {
                binding?: {
                  beforeTransactionSelection?: RelativeSelection | null;
                };
              }
            | undefined;
          const before = sync?.binding?.beforeTransactionSelection;
          if (!y || !before || before.type !== "text") return null;
          const size = old.doc.content.size;
          if (
            before.absAnchor == null ||
            before.absHead == null ||
            before.absAnchor > size ||
            before.absHead > size
          )
            return null;
          const anchor = livePosition(y, before.anchor);
          const head = livePosition(y, before.head);
          if (anchor === null || head === null) return null;
          if (
            state.selection.anchor === anchor &&
            state.selection.head === head
          )
            return null;
          const max = state.doc.content.size;
          if (anchor > max || head > max) return null;
          return state.tr
            .setSelection(TextSelection.create(state.doc, anchor, head))
            .setMeta("addToHistory", false);
        },
      }),
    ];
  },
});

/** The binding's record of this person's selection before a Yjs change (`getRelativeSelection`). */
interface RelativeSelection {
  type: string;
  anchor: Y.RelativePosition | null;
  head: Y.RelativePosition | null;
  absAnchor?: number;
  absHead?: number;
}

/**
 * A relative position's document position when the text it points into is still in the shared
 * document — its text type and every block around it alive; null otherwise (a block moved or
 * deleted: the binding's own recovery handles those).
 */
function livePosition(
  y: NonNullable<ReturnType<typeof yBinding>>,
  rel: Y.RelativePosition | null,
): number | null {
  if (!rel) return null;
  const at = Y.createAbsolutePositionFromRelativePosition(rel, y.doc);
  if (!at || !(at.type instanceof Y.XmlText)) return null;
  // Every enclosing type, up to the document's fragment, still alive.
  type Typed = { _item: { deleted: boolean; parent: unknown } | null };
  for (
    let type = at.type as unknown as Typed | null;
    type?._item;
    type = type._item.parent as Typed | null
  )
    if (type._item.deleted) return null;
  return resolveRelative(y, rel);
}

/** A version diff's change on a node, as its element's attribute; none outside a diff. */
function changeAttrs(node: PMNode): Record<string, string> {
  const change = ychangeType(node.attrs.ychange);
  return change ? { "data-ychange": change } : {};
}
const changeAttrsOf = ({ node }: { node: PMNode }) => changeAttrs(node);

function buildExtensions(
  placeholder: React.RefObject<string | undefined>,
  runtime: SlashRuntime,
  editorRuntime: EditorRuntime,
  annotationRuntime: Parameters<typeof annotationsExtension>[0],
  imageRuntime: ImageRuntime,
  toggleRuntime: ToggleRuntime,
  collaboration: TextEditCollaboration | null,
  diff = false,
  extras: AnyExtension[] = [],
) {
  // The schema and its Markdown rules are the shared `text-edit-schema`; the editor adds its node
  // views and behaviour only, so a server reads and writes exactly the documents it edits.
  return textEditExtensions({
    lowlight: codeLowlight,
    fileLinkPrefix: () => editorRuntime.fileLinkPrefix.current,
    liveBlockKinds: editorRuntime.liveBlockKinds,
    ...(collaboration ? { collaboration: { isRemote: isChangeOrigin } } : {}),
    // A version diff's `ychange` mark and attribute: only ever in a diff view's schema.
    diff,
    // A node view draws its own element: a version diff's change (`data-ychange`) is put on it
    // here, as `renderHTML` would — a removed code block, mention or video looks removed.
    nodeViews: {
      taskItem: () =>
        ReactNodeViewRenderer(TaskItemView, {
          as: "li",
          attrs: ({ node }) => ({
            "data-type": "taskItem",
            "data-checked": String(Boolean(node.attrs.checked)),
            ...changeAttrs(node),
          }),
        }),
      codeBlock: () =>
        ReactNodeViewRenderer(CodeBlockView, {
          attrs: changeAttrsOf,
          stopEvent: codeBlockStopEvent,
        }),
      image: () => imageView(imageRuntime),
      mention: () =>
        ReactNodeViewRenderer(mentionView(editorRuntime), {
          as: "span",
          attrs: changeAttrsOf,
        }),
      callout: () =>
        ReactNodeViewRenderer(CalloutView, { attrs: changeAttrsOf }),
      toggle: () =>
        ReactNodeViewRenderer(toggleView(toggleRuntime), {
          attrs: changeAttrsOf,
        }),
      video: () => ReactNodeViewRenderer(MediaView, { attrs: changeAttrsOf }),
      audio: () => ReactNodeViewRenderer(MediaView, { attrs: changeAttrsOf }),
      embed: () => ReactNodeViewRenderer(EmbedView, { attrs: changeAttrsOf }),
      taskQuery: () =>
        ReactNodeViewRenderer(TaskQueryView, { attrs: changeAttrsOf }),
    },
    plugins: [
      Placeholder.configure({
        // Nested nodes too, so an empty toggle title or body gets its own hint.
        includeChildren: true,
        placeholder: ({ node }) =>
          node.type.name === "toggleSummary"
            ? "Toggle"
            : (placeholder.current ?? ""),
      }),
      CaretFromDom,
      VegaStackMarkdown,
      Shortcuts,
      slashExtension(runtime),
      mentionBehaviour(editorRuntime),
      toggleKeys(toggleRuntime),
      fileChips(editorRuntime),
      // A shared document links headings by block id (`scrollToHeading`): no per-change rebuild of
      // every heading's slug decoration on each keystroke.
      ...(collaboration ? [] : [HeadingIds]),
      annotationsExtension(annotationRuntime),
      Uploads,
      toggleReveal(toggleRuntime),
      ...extras,
      ...(collaboration ? collaborationExtensions(collaboration) : []),
    ],
  });
}

/**
 * A key acts at the caret the reader sees. ProseMirror reads a caret the browser moved (a click,
 * an arrow key) on `selectionchange`, which the browser queues behind input already waiting: a key
 * pressed before it runs — Enter, Backspace, ⌘A, a shortcut — would act on the selection from
 * before, in a page opened a moment ago the start of the document (Enter there splits the first
 * line, and what follows is typed into it). So before anything handles a key, a caret the editor
 * hasn't read yet is read — ProseMirror's own reading, as `selectionchange` would do it. A capture
 * listener on the editor: it runs before every key handler (the editor's own props included), and
 * only for the browser's own key events, never for a key ProseMirror replays while reading input.
 */
/** Keys that never act at the caret: modifiers alone, and an input method's dead or pending key. */
const NOT_ACTING_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Dead",
  "Process",
]);

const CaretFromDom = Extension.create({
  name: "textEditCaretFromDom",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(view) {
          const onKeyDown = (event: KeyboardEvent) => {
            // An input method's key (229, a dead key, mid-composition): its text arrives through
            // the DOM. A modifier alone acts on nothing.
            if (
              event.isComposing ||
              event.keyCode === 229 ||
              view.composing ||
              NOT_ACTING_KEYS.has(event.key)
            )
              return;
            if (!view.hasFocus()) return;
            (
              view as unknown as { domObserver?: { flush?: () => void } }
            ).domObserver?.flush?.();
          };
          view.dom.addEventListener("keydown", onKeyDown, true);
          return {
            destroy: () =>
              view.dom.removeEventListener("keydown", onKeyDown, true),
          };
        },
      }),
    ];
  },
});

/** Whether pasted plain text reads as markdown worth parsing rather than inserting verbatim. */
function looksLikeMarkdown(text: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|\|.+\||-{3,}\s*$)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`\n]+`|!?\[[^\]]*\]\([^)]+\)/.test(
    text,
  );
}

/** Tags that make pasted HTML rich: with none of them it is only a wrapper around code or text. */
const RICH_PASTE_TAGS =
  "h1,h2,h3,h4,h5,h6,ul,ol,li,strong,b,em,i,a,table,blockquote,img,figure.callout,aside";

/**
 * The pasted HTML is just a wrapper around its text — a `pre`/`code`, VS Code's monospace `div`s,
 * or anything without headings, lists, emphasis, links, tables, quotes or images — so the
 * plain-text flavour is the real content. `"code"` for a pre / monospace wrapper, `"text"` for
 * another bare wrapper, `null` for rich HTML.
 */
function codeWrapperKind(html: string): "code" | "text" | null {
  if (typeof DOMParser === "undefined") return null;
  const body = new DOMParser().parseFromString(html, "text/html").body;
  if (body.querySelector(RICH_PASTE_TAGS)) return null;
  const mono = body.querySelector(
    "pre, code, [style*='monospace' i], [style*='white-space: pre' i], [style*='white-space:pre' i]",
  );
  return mono ? "code" : "text";
}

/** Markdown construct kinds the text uses: 2+ kinds, or a heading / list with inline marks, is strong. */
function strongMarkdown(text: string) {
  const block = {
    heading: /(^|\n) {0,3}#{1,6}\s+\S/,
    list: /(^|\n)\s*([-*+]|\d+[.)])\s+\S/,
    quote: /(^|\n) {0,3}>\s/,
    table: /(^|\n)\s*\|.+\|\s*\n\s*\|?\s*:?-{3,}/,
    fence: /(^|\n) {0,3}(```|~~~)/,
  };
  const inline = {
    emphasis: /\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~/,
    link: /!?\[[^\]\n]+\]\([^)\s]+\)/,
    code: /`[^`\n]+`/,
  };
  const has = (r: Record<string, RegExp>) =>
    Object.values(r).filter((re) => re.test(text)).length;
  const blocks = has(block);
  const inlines = has(inline);
  if (blocks + inlines >= 2) return true;
  return (block.heading.test(text) || block.list.test(text)) && inlines > 0;
}

/** Source code rather than prose: many lines ending in `;` `{` `}`, or most lines indented. */
function looksLikeCode(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return false;
  const codeEnds = lines.filter((l) => /[;{}]\s*$/.test(l)).length;
  const indented = lines.filter((l) => /^(\t| {2,})/.test(l)).length;
  return codeEnds / lines.length >= 0.3 || indented / lines.length >= 0.6;
}

/** Text that is exactly one fenced code block: its language and code. */
function singleFence(text: string) {
  const match = /^\s*(`{3,}|~{3,})([^\n`]*)\n([\s\S]*?)\n?\1\s*$/.exec(text);
  if (!match || match[3]!.includes(match[1]!)) return null;
  return { language: match[2]!.trim() || null, code: match[3]! };
}

/** Strip what the schema would drop anyway, before it is parsed: scripts, styles, handlers, `javascript:`. */
/** A leading emoji (a Notion callout's icon) and the space after it. */
const LEADING_EMOJI =
  /^\s*\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*\s*/u;
/** What an icon never is: content, kept wherever it sits (an image, a player, a link, a field). */
const CALLOUT_ICON_CONTENT =
  "img, picture, video, audio, iframe, svg, a, input";

/** Text that is one emoji and nothing else (a pasted callout's icon). */
const LONE_EMOJI =
  /^\s*\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*\s*$/u;

/** The callout tone a pasted callout's emoji icon reads as; a note for any other. */
function calloutToneForEmoji(emoji: string): CalloutTone {
  const icon = emoji.replace(/\uFE0F/g, "");
  if (/^(?:💡|✅|✨|👍|🌱)$/u.test(icon)) return "tip";
  if (/^(?:⚠|🚧|🔥)$/u.test(icon)) return "warning";
  if (/^(?:❗|‼|📌|⭐|🔔)$/u.test(icon)) return "important";
  if (/^(?:🚫|⛔|❌|🛑|☠)$/u.test(icon)) return "caution";
  return "note";
}

/**
 * Notion's clipboard HTML in the editor's terms: a to-do list (`ul.to-do-list`, each item's box a
 * `div.checkbox-on|off`, or any list item led by a checkbox input) becomes a checklist, and a
 * callout (`figure.callout`, or `aside`) a callout without its icon. Anything else is left as is.
 */
function notionPastedHTML(html: string): string {
  if (
    typeof DOMParser === "undefined" ||
    !/to-do-list|checkbox|callout|<aside/i.test(html)
  )
    return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  let changed = false;
  for (const list of doc.querySelectorAll("ul")) {
    const items = [...list.children].filter((child) => child.tagName === "LI");
    const box = (item: Element) =>
      item.querySelector(
        ":scope > .checkbox, :scope > input[type=checkbox], :scope > div > .checkbox",
      );
    if (!items.length) continue;
    if (!list.classList.contains("to-do-list") && !items.every(box)) continue;
    list.setAttribute("data-type", "taskList");
    for (const item of items) {
      const mark = box(item);
      // This item's own box (never a nested item's): Notion's on/off class, an input's state, or
      // the item's own checked-text marker when there is no box.
      const checked = mark
        ? mark.classList.contains("checkbox-on") ||
          (mark as HTMLInputElement).checked === true
        : Boolean(item.querySelector(":scope > .to-do-children-checked"));
      mark?.remove();
      item.setAttribute("data-type", "taskItem");
      item.setAttribute("data-checked", checked ? "true" : "false");
      // An item's text sits in a paragraph, as the checklist's schema holds it.
      if (!item.querySelector(":scope > p")) {
        const paragraph = doc.createElement("p");
        while (item.firstChild) paragraph.append(item.firstChild);
        item.append(paragraph);
      }
    }
    changed = true;
  }
  for (const callout of doc.querySelectorAll("figure.callout, aside")) {
    // The callout's icon: Notion's `.icon`, or a leading element holding a lone emoji. It picks the
    // tone (💡 a tip, ⚠️ a warning…) and never stays behind as a paragraph of its own.
    const lead = [...callout.children].find((child) =>
      child.textContent?.trim(),
    );
    // Only an element holding the emoji and nothing else: an image or a link beside it is content.
    const iconHost =
      callout.querySelector(".icon")?.closest("div:not(.callout), span") ??
      (lead &&
      LONE_EMOJI.test(lead.textContent ?? "") &&
      !lead.matches(CALLOUT_ICON_CONTENT) &&
      !lead.querySelector(CALLOUT_ICON_CONTENT)
        ? lead
        : null);
    const icon = iconHost?.textContent?.trim() ?? "";
    iconHost?.remove();
    const wrapper = doc.createElement("div");
    wrapper.setAttribute("data-slot", "callout");
    wrapper.setAttribute("data-tone", calloutToneForEmoji(icon));
    const content = doc.createElement("div");
    content.setAttribute("data-slot", "callout-content");
    const blocks = [...callout.childNodes];
    const first = blocks.find((node) => node.textContent?.trim());
    if (first?.nodeType === Node.TEXT_NODE)
      first.textContent = (first.textContent ?? "").replace(LEADING_EMOJI, "");
    // Inline runs (text, links, images) gather into paragraphs between the blocks; a run with
    // anything but blank text in it is kept (an image alone too).
    let paragraph = doc.createElement("p");
    const flush = () => {
      if (paragraph.textContent?.trim() || paragraph.querySelector("*"))
        content.append(paragraph);
      paragraph = doc.createElement("p");
    };
    for (const node of blocks)
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^(P|UL|OL|PRE|BLOCKQUOTE|H[1-6]|TABLE|DIV|FIGURE|ASIDE)$/.test(
          (node as Element).tagName,
        )
      ) {
        flush();
        content.append(node);
      } else paragraph.append(node);
    flush();
    wrapper.append(content);
    callout.replaceWith(wrapper);
    changed = true;
  }
  return changed ? doc.body.innerHTML : html;
}

/**
 * Notion's Markdown in the editor's terms: an `<aside>` callout (Notion's export, its icon first)
 * becomes a GitHub alert (`> [!NOTE]`). Checklists (`- [ ]`) are already Markdown.
 */
function notionMarkdown(text: string): string {
  const out: string[] = [];
  /** The fence a line opens (a run of 3+ backticks or tildes), or null. */
  const opens = (line: string) =>
    /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1] ?? null;
  /** Whether `line` closes `fence`: a bare run of its character, at least as long. */
  const closes = (line: string, fence: string) => {
    const run = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line)?.[1];
    return Boolean(run && run[0] === fence[0] && run.length >= fence.length);
  };
  let fence: string | null = null;
  // An open `<aside>`: its body lines so far, and a fence open inside it.
  let aside: { lines: string[]; fence: string | null; depth: number } | null =
    null;
  let afterCallout = false;
  const emit = (line: string) => {
    // A callout is its own block: a blank line keeps it apart from what follows.
    if (afterCallout && line.trim()) out.push("");
    afterCallout = false;
    out.push(line);
  };
  const callout = (lines: string[]) => {
    if (out.length && out[out.length - 1]!.trim()) out.push("");
    out.push("> [!NOTE]");
    let start = 0;
    let end = lines.length;
    while (start < end && !lines[start]!.trim()) start++;
    while (end > start && !lines[end - 1]!.trim()) end--;
    if (start < end) lines[start] = lines[start]!.replace(LEADING_EMOJI, "");
    // The body is Notion Markdown too: an `<aside>` inside it is a callout inside this one.
    const body = notionMarkdown(lines.slice(start, end).join("\n")).split("\n");
    for (const line of body) out.push(line ? `> ${line}` : ">");
    afterCallout = true;
  };
  const END = "</aside>";
  for (const line of text.split(/\r?\n/)) {
    if (aside) {
      // Code inside the callout is code: a fence opens before any tag is read.
      if (aside.fence) {
        if (closes(line, aside.fence)) aside.fence = null;
        aside.lines.push(line);
        continue;
      }
      const fenced = opens(line);
      if (fenced) {
        aside.fence = fenced;
        aside.lines.push(line);
        continue;
      }
      // Nested callouts: each `<aside>` opens one level, each `</aside>` closes one.
      const trimmed = line.trimEnd();
      if (line.startsWith("<aside>")) aside.depth++;
      if (trimmed.endsWith(END)) aside.depth--;
      if (aside.depth === 0) {
        aside.lines.push(trimmed.slice(0, -END.length));
        callout(aside.lines);
        aside = null;
        continue;
      }
      aside.lines.push(line);
      continue;
    }
    // Inside a fenced code block, text stays as written (an HTML example keeps its tags).
    if (fence) {
      if (closes(line, fence)) fence = null;
      emit(line);
      continue;
    }
    const open = opens(line);
    if (open) {
      fence = open;
      emit(line);
      continue;
    }
    if (line.startsWith("<aside>")) {
      const rest = line.slice("<aside>".length);
      const trimmed = rest.trimEnd();
      if (trimmed.endsWith(END)) callout([trimmed.slice(0, -END.length)]);
      else aside = { lines: [rest], fence: opens(rest), depth: 1 };
      continue;
    }
    emit(line);
  }
  // An `<aside>` never closed stays as it was written.
  if (aside) {
    emit(`<aside>${aside.lines[0] ?? ""}`);
    for (let at = 1; at < aside.lines.length; at++) emit(aside.lines[at]!);
  }
  return out.join("\n");
}

function sanitizePastedHTML(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /(href|src)\s*=\s*(["']?)\s*(javascript|vbscript|data):[^"'\s>]*\2/gi,
      "",
    );
}

/**
 * A typed link as an href, or null when it is not one. Taken: a web address (`http(s)://`), a bare
 * domain (`example.com/page` → `https://`), `mailto:` and `tel:`, and a path or anchor inside the
 * app (`/…`, `#…`). Anything else — words, another scheme — is refused, never saved as a broken
 * `https://` link.
 */
function parseLink(raw: string): string | null {
  const value = raw.trim();
  // Spaces never; a backslash never either (URL parsing reads `/\host` as another site).
  if (!value || /[\s\\]/.test(value)) return null;
  if (/^(?:\/(?!\/)|#)/.test(value)) return value;
  if (/^(?:mailto|tel):\S/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).hostname ? value : null;
    } catch {
      return null;
    }
  }
  return /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(?::\d{1,5})?(?:[/?#]\S*)?$/i.test(
    value,
  )
    ? `https://${value}`
    : null;
}

const LINK_INVALID =
  "That isn't a link. Try example.com, a full web address, mailto: or a path starting with /.";

/* ------------------------------------------------------------------------------------------------
 * Styling
 * ----------------------------------------------------------------------------------------------*/

const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";

/** Every floating part of the editor — focus moving into one of them stays in the edit session. */
const FLOATING_SLOTS =
  "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-image],[data-slot=text-edit-media],[data-slot=text-edit-turn-into],[data-slot=text-edit-link-card],[data-slot=text-edit-paste],[data-slot=suggestion-menu],[data-slot=suggestion-menu-sheet],[data-slot=text-edit-table-grip],[data-slot=text-edit-table-add],[data-text-edit-menu]";

/**
 * The one portal the editor's own floating parts render through (drag handle, table grips and
 * "+" bars, drop line; the slash and mention menus are `SuggestionMenu`, which portals itself):
 * `<body>` (or the portal of the modal the editor sits in, `FloatingHostContext`), so no overflow
 * container clips it, with the theme scope restored on a
 * `display: contents` wrapper. While a modal (a Dialog or Sheet opened over the editor) holds the
 * editor `inert`, the layer hides, so nothing floats over the modal's backdrop.
 */
function FloatingLayer({ children }: { children: React.ReactNode }) {
  const themeScope = useInternalThemeScope();
  const { behindModal, host } = React.useContext(FloatingHostContext);
  if (typeof document === "undefined") return null;
  return createPortal(
    // Inside a modal's portal it marks itself a portal too: the modal's outside-marking exempts
    // nested portals, so it is never hidden from assistive tech or made inert.
    <div
      data-slot="text-edit-layer"
      data-base-ui-portal={host ? "" : undefined}
      hidden={behindModal}
      className={cn("contents", themeScope)}
    >
      {children}
    </div>,
    host ?? document.body,
  );
}

/**
 * Where the editor's floating parts go, and whether they hide. `host`: the portal of the modal the
 * editor sits in (a Dialog or Sheet), else `null` for `<body>` — inside the modal's own portal,
 * its outside-marking never makes them inert. `behindModal`: a modal holds the editor itself
 * inert, so nothing of it floats over that modal's backdrop.
 */
const FloatingHostContext = React.createContext<{
  behindModal: boolean;
  host: HTMLElement | null;
}>({ behindModal: false, host: null });

/**
 * Whether `element` is inside an `inert` subtree now — a modal Dialog or Sheet opened over it.
 * Watches `inert` across the document, which a modal toggles on the page's other `<body>`
 * children as it opens and closes.
 */
function useBehindModal(element: HTMLElement | null | undefined): boolean {
  const [behind, setBehind] = React.useState(false);
  React.useEffect(() => {
    if (!element) return;
    const read = () => setBehind(element.closest("[inert]") !== null);
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["inert"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [element]);
  return behind;
}

/** Floating parts keep this far from the viewport's edges. */
const VIEWPORT_GAP = 8;

/* ------------------------------------------------------------------------------------------------
 * Bubble menu
 * ----------------------------------------------------------------------------------------------*/

const MARKS = [
  {
    id: "bold",
    label: "Bold",
    shortcut: "⌘B",
    icon: Bold,
    run: (ed: Editor) => ed.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    label: "Italic",
    shortcut: "⌘I",
    icon: Italic,
    run: (ed: Editor) => ed.chain().focus().toggleItalic().run(),
  },
  {
    id: "strike",
    label: "Strikethrough",
    shortcut: "⇧⌘X",
    icon: Strikethrough,
    run: (ed: Editor) => ed.chain().focus().toggleStrike().run(),
  },
  {
    id: "code",
    label: "Inline code",
    shortcut: "⌘E",
    icon: Code,
    run: (ed: Editor) => ed.chain().focus().toggleCode().run(),
  },
] as const;

/** The block types "Turn into" converts the selection's block to, in menu order. */
const BLOCK_TYPES = [
  {
    id: "text",
    label: "Text",
    icon: Pilcrow,
    run: (ed: Editor) => ed.chain().focus().clearNodes().run(),
  },
  ...([1, 2, 3, 4] as const).map((level) => ({
    id: `h${level}`,
    label: `Heading ${level}`,
    icon: [Heading1, Heading2, Heading3, Heading4][level - 1]!,
    run: (ed: Editor) =>
      ed.chain().focus().clearNodes().setHeading({ level }).run(),
  })),
  {
    id: "bulletList",
    label: "Bullet list",
    icon: List,
    run: (ed: Editor) =>
      ed.chain().focus().clearNodes().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "Numbered list",
    icon: ListOrdered,
    run: (ed: Editor) =>
      ed.chain().focus().clearNodes().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    label: "Checklist",
    icon: ListTodo,
    run: (ed: Editor) => ed.chain().focus().clearNodes().toggleTaskList().run(),
  },
  {
    id: "blockquote",
    label: "Quote",
    icon: Quote,
    run: (ed: Editor) =>
      ed.chain().focus().clearNodes().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    label: "Code block",
    icon: SquareCode,
    run: (ed: Editor) => ed.chain().focus().clearNodes().setCodeBlock().run(),
  },
  {
    // Only while the host draws ```mermaid (`blockViews.mermaid`).
    id: "diagram",
    label: "Diagram",
    icon: Workflow,
    run: (ed: Editor) => turnIntoBlockView(ed, "mermaid"),
  },
] as const;

/** The block type the selection sits in, innermost wrapper first. */
function currentBlockType(ed: Editor): (typeof BLOCK_TYPES)[number]["id"] {
  if (ed.isActive("codeBlock"))
    return ed.isActive("codeBlock", { language: "mermaid" }) &&
      blockViewOf(ed, "mermaid")
      ? "diagram"
      : "codeBlock";
  for (const level of [1, 2, 3, 4] as const)
    if (ed.isActive("heading", { level })) return `h${level}`;
  if (ed.isActive("taskList")) return "taskList";
  if (ed.isActive("orderedList")) return "orderedList";
  if (ed.isActive("bulletList")) return "bulletList";
  if (ed.isActive("blockquote")) return "blockquote";
  return "text";
}

/** A labelled icon button with its name in a tooltip — the shape every menu control takes. */
function MenuTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Focus a panel's first control once its menu is attached: the panel mounts before the menu that
 * hosts it is shown (the show is the parent's effect), so `autoFocus` would find it detached.
 */
function useFocusOnShow<T extends HTMLElement>(
  pick: (root: T) => HTMLElement | null,
) {
  const ref = React.useRef<T>(null);
  const pickRef = React.useRef(pick);
  React.useEffect(() => {
    let frame = 0;
    let tries = 0;
    const tick = () => {
      const target = ref.current && pickRef.current(ref.current);
      // `preventScroll`: the menu is attached a frame before Floating UI places it, and a plain
      // focus would scroll the page to wherever it sits for that frame.
      if (target?.isConnected && ref.current?.closest("body"))
        target.focus({ preventScroll: true });
      else if (tries++ < 10) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return ref;
}

/** Close a panel form when focus leaves it for somewhere outside the editing session. */
function panelBlur(
  onClose: () => void,
  onLeave: (next: EventTarget | null) => void,
) {
  return (event: React.FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    // The window lost focus (a file picker opened, another app): the panel stays.
    if (!document.hasFocus()) return;
    onClose();
    onLeave(event.relatedTarget);
  };
}

function escapeTo(editor: Editor, onClose: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
    editor.commands.focus();
  };
}

function LinkPanel({
  editor,
  onClose,
  onLeave,
  onOpenFile,
}: {
  editor: Editor;
  onClose: () => void;
  onLeave: (next: EventTarget | null) => void;
  /** Open a file link in the viewer; false when `href` is not a file link. */
  onOpenFile?: (href: string) => boolean;
}) {
  const current = (editor.getAttributes("link").href as string) ?? "";
  const [href, setHref] = React.useState(current);
  const [invalid, setInvalid] = React.useState(false);
  const errorId = React.useId();
  const formRef = useFocusOnShow<HTMLFormElement>((root) =>
    root.querySelector("input"),
  );
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    // Cleared: the link comes off. Not a link: say so here, and keep the panel open.
    const next = href.trim() ? parseLink(href) : "";
    if (next === null) {
      setInvalid(true);
      return;
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!next) chain.unsetLink().run();
    else if (editor.state.selection.empty && !editor.isActive("link"))
      chain
        .insertContent({
          type: "text",
          text: next,
          marks: [{ type: "link", attrs: { href: next } }],
        })
        .run();
    else chain.setLink({ href: next }).run();
    onClose();
  };
  return (
    <form
      ref={formRef}
      data-slot="text-edit-link"
      onSubmit={apply}
      onBlur={panelBlur(onClose, onLeave)}
      onKeyDown={escapeTo(editor, onClose)}
      className={cn(
        MENU_SURFACE,
        "flex w-80 max-w-[calc(100vw-1rem)] flex-wrap items-center gap-1",
      )}
    >
      <Input
        aria-label="Link URL"
        placeholder="Paste or type a link"
        value={href}
        onChange={(event) => {
          setHref(event.target.value);
          setInvalid(false);
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        size="sm"
        className="min-w-0 flex-1"
      />
      {current ? (
        <>
          <MenuTip label="Open link">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Open link"
              onClick={() => {
                // A file link opens in the viewer; any other link in a new tab.
                if (onOpenFile?.(current)) return;
                window.open(current, "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink />
            </Button>
          </MenuTip>
          <MenuTip label="Remove link">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Remove link"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                onClose();
              }}
            >
              <Unlink />
            </Button>
          </MenuTip>
        </>
      ) : null}
      {invalid ? (
        <p
          id={errorId}
          role="alert"
          className="basis-full px-1 pb-0.5 text-xs text-destructive-text"
        >
          {LINK_INVALID}
        </p>
      ) : null}
    </form>
  );
}

/** Longer than this, a link's text keeps its start and its end with "…" between them. */
const LINK_CARD_CHARS = 34;

/** `example.com/a/very/long/…/page.html`: the start and the end of a long link stay readable. */
function middleTruncate(text: string): string {
  if (text.length <= LINK_CARD_CHARS) return text;
  const end = Math.floor((LINK_CARD_CHARS - 1) / 3);
  return `${text.slice(0, LINK_CARD_CHARS - 1 - end)}…${text.slice(-end)}`;
}

/** The paste popover's words for each choice. */
const PASTED_CHOICE_LABEL: Record<PastedChoice, string> = {
  mention: "Mention",
  embed: "Embed",
  link: "Link",
};

/**
 * The paste popover (Notion, Google Docs): under a lone link just pasted, its choices — Mention ·
 * Link or Embed · Link — the one in effect pressed. In passing: the next keystroke, a click
 * elsewhere or Escape closes it; Tab moves into it (its arrows, Enter, and Escape back to the
 * text), and ⌘Z right after puts the URL back as text either way. What the paste became is
 * announced.
 */
function PasteMenu({
  editor,
  pasted,
  onPick,
  onClose,
  onLeave,
}: {
  editor: Editor;
  pasted: PastedLink;
  onPick: (choice: PastedChoice) => void;
  onClose: (refocus: boolean) => void;
  /** Focus left for somewhere outside the editor: the edit session ends. */
  onLeave: (next: EventTarget | null) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { announce, Announcer } = useAnnouncer();
  // Text still resolving reads as its default.
  const current: PastedChoice =
    pasted.form === "text" ? pasted.offers[0]! : pasted.form;
  React.useEffect(() => {
    announce(
      `${current === "embed" ? "Embedded" : `Pasted as a ${PASTED_CHOICE_LABEL[current].toLowerCase()}`}. Tab to change.`,
    );
  }, [announce, current]);
  React.useLayoutEffect(() => {
    const place = () => {
      const node = ref.current;
      if (!node || editor.isDestroyed) return;
      const range = pastedRange(editor.state, pasted);
      node.hidden = !range;
      if (!range) return;
      const start = editor.view.coordsAtPos(range.from);
      const block =
        pasted.form === "embed" ? editor.view.nodeDOM(range.from) : null;
      const bottom =
        block instanceof HTMLElement
          ? block.getBoundingClientRect().bottom
          : editor.view.coordsAtPos(range.to).bottom;
      // Under the paste, or above it when the viewport's bottom is too close; never off screen.
      const height = node.offsetHeight;
      const below = bottom + 4 + height <= window.innerHeight - 8;
      const top = below ? bottom + 4 : start.top - 4 - height;
      node.style.left = `${Math.max(8, Math.min(start.left, window.innerWidth - node.offsetWidth - 8))}px`;
      node.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
    };
    place();
    editor.on("transaction", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      editor.off("transaction", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [editor, pasted]);
  return (
    <FloatingLayer>
      <Toolbar.Root
        ref={ref}
        data-slot="text-edit-paste"
        aria-label="Paste as"
        style={{ position: "fixed" }}
        // A click keeps the caret where it is; Tab is the way in.
        onMouseDown={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          onClose(true);
        }}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          onClose(false);
          if (document.hasFocus()) onLeave(event.relatedTarget);
        }}
        className={cn(MENU_SURFACE, "flex items-center gap-0.5")}
      >
        {pasted.offers.map((choice, at) => (
          <React.Fragment key={choice}>
            {at > 0 ? (
              <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
            ) : null}
            <Toolbar.Button
              render={
                <Button
                  variant="ghost"
                  size="xs"
                  aria-pressed={choice === current}
                  onClick={() => onPick(choice)}
                  className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                />
              }
            >
              {PASTED_CHOICE_LABEL[choice]}
            </Toolbar.Button>
          </React.Fragment>
        ))}
      </Toolbar.Root>
      <Announcer />
    </FloatingLayer>
  );
}

/**
 * The card over a link the caret is in (Google Docs, Notion): the destination, which opens it (a
 * file link in the viewer, any other in a new tab), then Edit (the link panel) and Remove.
 */
function LinkCard({
  editor,
  href,
  onEdit,
  onOpenFile,
  onLeave,
}: {
  editor: Editor;
  href: string;
  onEdit: () => void;
  onOpenFile?: (href: string) => boolean;
  onLeave: (next: EventTarget | null) => void;
}) {
  let shown = href;
  let host = "";
  try {
    const url = new URL(href, document.baseURI);
    const own = url.origin === window.location.origin;
    shown = own
      ? url.pathname + url.search + url.hash
      : url.host + (url.pathname === "/" ? "" : url.pathname);
    if (!own) host = url.host.replace(/^www\./, "");
  } catch {
    // Not a URL: shown as written.
  }
  // Another site's page: its title and icon (`linkPreview`), once known.
  const source = useInlineChipResolver()?.linkPreview;
  const [preview, setPreview] = React.useState<{
    href: string;
    title: string;
    icon: string | null;
  } | null>(null);
  const [iconFailed, setIconFailed] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    setIconFailed(false);
    linkPreviewOf(host ? source : undefined, href)?.then((answer) => {
      const title = answer?.title.replace(/\s+/g, " ").trim();
      const icon = answer?.icon ?? "";
      if (live && title)
        setPreview({
          href,
          title,
          // The host's own copy: a path on this site, or https.
          icon: /^(?:\/(?!\/)|https:)/i.test(icon) ? icon : null,
        });
    });
    return () => {
      live = false;
    };
  }, [host, source, href]);
  const page = preview?.href === href ? preview : null;
  return (
    <Toolbar.Root
      data-slot="text-edit-link-card"
      aria-label="Link"
      // Focus leaving the card for somewhere outside the editor ends the edit session.
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        if (!document.hasFocus()) return;
        onLeave(event.relatedTarget);
      }}
      className={cn(MENU_SURFACE, "flex max-w-80 items-center gap-0.5")}
    >
      <Toolbar.Button
        render={
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (onOpenFile?.(href)) return;
              window.open(href, "_blank", "noopener,noreferrer");
            }}
            title={href}
            aria-label={`Open ${href}`}
            // It gives way to the card's width (the Button never shrinks by default).
            className="min-w-0 shrink justify-start gap-1.5 px-2 font-normal text-info-text"
          />
        }
      >
        {page?.icon && !iconFailed ? (
          <img
            src={page.icon}
            alt=""
            data-slot="text-edit-link-icon"
            onError={() => setIconFailed(true)}
            className="size-4 shrink-0 rounded-sm"
          />
        ) : (
          <ExternalLink aria-hidden />
        )}
        {page ? (
          <>
            <span className="min-w-0 truncate text-foreground">
              {page.title}
            </span>
            <span className="max-w-[40%] shrink-0 truncate text-muted-foreground">
              {host}
            </span>
          </>
        ) : (
          <span className="min-w-0 truncate">
            {middleTruncate(shown || href)}
          </span>
        )}
      </Toolbar.Button>
      <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
      <MenuTip label="Edit link">
        <Toolbar.Button
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit link"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onEdit}
            />
          }
        >
          <Pencil />
        </Toolbar.Button>
      </MenuTip>
      <MenuTip label="Remove link">
        <Toolbar.Button
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove link"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              }
            />
          }
        >
          <Unlink />
        </Toolbar.Button>
      </MenuTip>
    </Toolbar.Root>
  );
}

const MEDIA_PANEL: Record<
  MediaKind,
  { label: string; accept: Record<string, string[]>; drop: string; url: string }
> = {
  image: {
    label: "image",
    accept: { "image/*": [] },
    drop: "Drop an image, or click to choose one",
    url: "Paste an image link",
  },
  video: {
    label: "video",
    accept: { "video/*": [] },
    drop: "Drop a video, or click to choose one",
    url: "Paste a video link (MP4, WebM)",
  },
  audio: {
    label: "audio",
    accept: { "audio/*": [] },
    drop: "Drop an audio file, or click to choose one",
    url: "Paste an audio link (MP3, M4A, WAV)",
  },
  file: {
    label: "file",
    accept: {},
    drop: "Drop a file, or click to choose one",
    url: "Paste a file link",
  },
};

/**
 * The insert panel for an image, a video, an audio clip or a file: `Tabs` (line) with **Upload**
 * — a dropzone that uploads through the host and lands the block at the caret — and **Link** — a
 * URL and Insert. Without an upload handler for the kind, only the link form shows.
 */
function MediaPanel({
  editor,
  kind,
  onClose,
  onLeave,
  onUpload,
  onLink,
}: {
  editor: Editor;
  kind: MediaKind;
  onClose: () => void;
  onLeave: (next: EventTarget | null) => void;
  /** Upload picked or dropped files as this kind; absent when the host takes no such uploads. */
  onUpload?: (files: File[]) => void;
  /**
   * Take an image link the host imports itself (`onExternalImage`): true when it did, and the
   * panel inserts nothing. Another site's image is never inserted as a hotlink the page can't show.
   */
  onLink?: (url: string) => boolean;
}) {
  const copy = MEDIA_PANEL[kind];
  const [tab, setTab] = React.useState<"upload" | "link">(
    onUpload ? "upload" : "link",
  );
  const [src, setSrc] = React.useState("");
  // Choosing the Link tab is choosing to type a link: the field takes focus.
  const linkInputRef = React.useRef<HTMLInputElement>(null);
  const pickedLinkRef = React.useRef(false);
  React.useEffect(() => {
    if (tab !== "link" || !pickedLinkRef.current) return;
    pickedLinkRef.current = false;
    linkInputRef.current?.focus();
  }, [tab]);
  // The video panel's link: a YouTube or Loom link embeds; a video file link plays natively.
  const [error, setError] = React.useState<string | null>(null);
  const errorId = React.useId();
  // With `embeds`, the video panel's link also takes the providers' links.
  const embedding =
    kind === "video" && Object.keys(EDITOR_EMBEDS.get(editor) ?? {}).length > 0;
  const rootRef = useFocusOnShow<HTMLDivElement>((root) =>
    root.querySelector<HTMLElement>(
      "[data-slot=dropzone], input:not([type=file])",
    ),
  );
  const insert = (event: React.FormEvent) => {
    event.preventDefault();
    const url = src.trim();
    if (!url) return;
    // A web address or a path: never an email, a phone number or an anchor.
    const safe = parseLink(url);
    if (safe === null || /^(?:mailto:|tel:|#)/i.test(safe)) {
      setError(`That isn't a link. Paste the ${copy.label}'s web address.`);
      return;
    }
    if (kind === "image" && onLink?.(safe)) {
      onClose();
      return;
    }
    const match = kind === "video" ? matchEmbed(safe) : null;
    const embed = match && embedsOn(editor, match.provider) ? match : null;
    if (kind === "video" && embedding && !embed && !isVideoFileUrl(safe)) {
      setError("Paste a YouTube or Loom link");
      return;
    }
    const content: JSONContent = embed
      ? { type: "embed", attrs: { provider: embed.provider, url: safe } }
      : kind === "file"
        ? {
            type: "text",
            text: urlFileName(safe) || safe,
            marks: [{ type: "link", attrs: { href: safe } }],
          }
        : kind === "image"
          ? { type: "image", attrs: { src: safe, alt: null } }
          : { type: kind, attrs: { src: safe } };
    const { selection } = editor.state;
    // A selected image (its Replace) is replaced; otherwise a block lands after the caret's block.
    const target =
      kind === "file" || selection instanceof NodeSelection
        ? { from: selection.from, to: selection.to }
        : blockInsertRange(editor.state, selection.from);
    const replaced =
      selection instanceof NodeSelection && selection.node.type.name === "image"
        ? selection.node
        : null;
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .insertContentAt(target, keepImageText(content, replaced))
      .run();
    // A new block (an embed, an image, a player): the caret goes to the line after it, so typing
    // continues the text instead of replacing the block. A replaced image stays selected.
    if (kind !== "file" && !replaced)
      caretAfterBlockAt(editor, insertedAt(editor, target.from, content.type));
    onClose();
  };
  const link = (
    <form onSubmit={insert} className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
          ref={linkInputRef}
          aria-label={`${copy.label[0]!.toUpperCase()}${copy.label.slice(1)} URL`}
          placeholder={
            embedding ? "Paste a YouTube, Loom or video link" : copy.url
          }
          value={src}
          onChange={(event) => {
            setSrc(event.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          size="sm"
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="sm" disabled={!src.trim()}>
          Insert
        </Button>
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="px-1 text-xs text-destructive-text"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
  return (
    <div
      ref={rootRef}
      data-slot={`text-edit-${kind === "image" ? "image" : "media"}`}
      role="dialog"
      aria-label={`Insert ${copy.label}`}
      onBlur={panelBlur(onClose, onLeave)}
      onKeyDown={escapeTo(editor, onClose)}
      className={cn(
        MENU_SURFACE,
        "flex w-80 max-w-[calc(100vw-1rem)] flex-col p-2",
      )}
    >
      {onUpload ? (
        <Tabs
          value={tab}
          onValueChange={(next) => {
            pickedLinkRef.current = next === "link";
            setTab(next as "upload" | "link");
          }}
        >
          <TabsList variant="line">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <Dropzone
              accept={copy.accept}
              multiple={false}
              paste={false}
              preventWindowDrop={false}
              aria-label={`Upload ${copy.label}`}
              onFilesAccepted={(files) => {
                if (!files.length) return;
                onClose();
                onUpload(files);
              }}
            >
              <Empty size="sm" className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Upload />
                  </EmptyMedia>
                  <EmptyDescription>{copy.drop}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Dropzone>
          </TabsContent>
          <TabsContent value="link">{link}</TabsContent>
        </Tabs>
      ) : (
        link
      )}
    </div>
  );
}

function TurnIntoPanel({
  editor,
  onClose,
  onLeave,
}: {
  editor: Editor;
  onClose: () => void;
  onLeave: (next: EventTarget | null) => void;
}) {
  const current = currentBlockType(editor);
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>("[aria-checked=true]")
      ?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={listRef}
      role="menu"
      aria-label="Turn into"
      data-slot="text-edit-turn-into"
      onBlur={panelBlur(onClose, onLeave)}
      onKeyDown={(event) => {
        escapeTo(editor, onClose)(event);
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const items = [
          ...(listRef.current?.querySelectorAll<HTMLElement>(
            "[role=menuitemradio]",
          ) ?? []),
        ];
        const at = items.indexOf(document.activeElement as HTMLElement);
        const step = event.key === "ArrowDown" ? 1 : -1;
        items[(at + step + items.length) % items.length]?.focus();
      }}
      className={cn(MENU_SURFACE, "flex w-52 flex-col")}
    >
      {BLOCK_TYPES.filter(
        (type) => type.id !== "diagram" || blockViewOf(editor, "mermaid"),
      ).map((type) => {
        const Icon = type.icon;
        return (
          <Button
            key={type.id}
            type="button"
            variant="ghost"
            size="sm"
            role="menuitemradio"
            aria-checked={type.id === current}
            tabIndex={type.id === current ? 0 : -1}
            onClick={() => {
              type.run(editor);
              onClose();
            }}
            className="justify-start gap-2 px-2 font-normal aria-checked:font-medium focus:bg-muted"
          >
            <Icon />
            {type.label}
          </Button>
        );
      })}
    </div>
  );
}

function SelectionMenu({
  editor,
  panel,
  onPanelChange,
  onLeave,
  onUpload,
  onComment,
  onOpenFile,
  onImageLink,
}: {
  editor: Editor;
  panel: Panel | null;
  onPanelChange: (panel: Panel | null) => void;
  onLeave: (next: EventTarget | null) => void;
  /** Upload files as each kind, where the host takes that kind of upload. */
  onUpload?: Partial<Record<MediaKind, (files: File[]) => void>>;
  /** An image link the host imports (`onExternalImage`); true when it took it. */
  onImageLink?: (url: string) => boolean;
  /** Open a file link in the viewer; false when it is not a file link. */
  onOpenFile?: (href: string) => boolean;
  /** Start a comment on the selection; absent when the host takes no comments. */
  onComment?: () => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      strike: ed.isActive("strike"),
      code: ed.isActive("code"),
      link: ed.isActive("link"),
      href: ed.isActive("link")
        ? String(ed.getAttributes("link").href ?? "")
        : "",
      empty: ed.state.selection.empty,
      block: currentBlockType(ed),
      // A cell holds one line: no block to turn it into.
      cell: inTableCell(ed.state),
    }),
  });
  const close = () => onPanelChange(null);

  if (panel === "link")
    return (
      <LinkPanel
        editor={editor}
        onClose={close}
        onLeave={onLeave}
        onOpenFile={onOpenFile}
      />
    );
  if (
    panel === "image" ||
    panel === "video" ||
    panel === "audio" ||
    panel === "file"
  )
    return (
      <MediaPanel
        key={panel}
        editor={editor}
        kind={panel}
        onClose={close}
        onLeave={onLeave}
        onUpload={onUpload?.[panel]}
        onLink={panel === "image" ? onImageLink : undefined}
      />
    );
  if (panel === "turnInto")
    return <TurnIntoPanel editor={editor} onClose={close} onLeave={onLeave} />;
  // The caret in a link: its card — where it goes, Open, Edit and Remove.
  if (editor.isEditable && state.empty && state.link)
    return (
      <LinkCard
        editor={editor}
        href={state.href}
        onEdit={() => onPanelChange("link")}
        onOpenFile={onOpenFile}
        onLeave={onLeave}
      />
    );

  const commentButton = onComment ? (
    <Toolbar.Button
      render={
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onComment}
          className="gap-1 px-2 text-xs"
        >
          <MessageSquarePlus />
          Comment
        </Button>
      }
    />
  ) : null;
  // Read-only: the selection can only be commented on.
  if (!editor.isEditable)
    return (
      <Toolbar.Root
        data-slot="text-edit-bubble-menu"
        aria-label="Selection actions"
        className={cn(MENU_SURFACE, "flex items-center gap-0.5")}
      >
        {commentButton}
      </Toolbar.Root>
    );

  const block = BLOCK_TYPES.find((type) => type.id === state?.block);
  return (
    <Toolbar.Root
      data-slot="text-edit-bubble-menu"
      aria-label="Selection formatting"
      className={cn(MENU_SURFACE, "flex items-center gap-0.5")}
    >
      {state?.cell ? null : (
        <>
          <Toolbar.Button
            render={
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Turn into (${block?.label ?? "Text"})`}
                aria-haspopup="menu"
                onClick={() => onPanelChange("turnInto")}
                className="gap-1 px-2 text-xs"
              >
                {block?.label ?? "Text"}
                <ChevronDown />
              </Button>
            }
          />
          <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
        </>
      )}
      {MARKS.map((mark) => {
        const Icon = mark.icon;
        return (
          <MenuTip key={mark.id} label={`${mark.label} ${mark.shortcut}`}>
            <Toolbar.Button
              render={
                <Toggle
                  size="sm"
                  pressed={state?.[mark.id] ?? false}
                  onPressedChange={() => mark.run(editor)}
                  aria-label={mark.label}
                  className="min-w-7 px-0"
                >
                  <Icon />
                </Toggle>
              }
            />
          </MenuTip>
        );
      })}
      <MenuTip label="Link ⌘K">
        <Toolbar.Button
          render={
            <Toggle
              size="sm"
              pressed={state?.link ?? false}
              onPressedChange={() => onPanelChange("link")}
              aria-label="Link"
              className="min-w-7 px-0"
            >
              <LinkIcon />
            </Toggle>
          }
        />
      </MenuTip>
      <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
      <MenuTip label="Clear formatting">
        <Toolbar.Button
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear formatting"
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
            >
              <RemoveFormatting />
            </Button>
          }
        />
      </MenuTip>
      {/* Formatting first (what the selection is, then its marks, its link, clearing them), the
          conversation last. */}
      {commentButton ? (
        <>
          <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
          {commentButton}
        </>
      ) : null}
    </Toolbar.Root>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Hover chrome — the block handle, and the table's grips, menus and "+" bars
 * ----------------------------------------------------------------------------------------------*/

interface DragLine {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Where a pointer at `coord` would drop among `rects` along one axis: the nearest slot index. */
function slotAt(rects: DOMRect[], coord: number, axis: "x" | "y") {
  for (let index = 0; index < rects.length; index++) {
    const rect = rects[index]!;
    const mid =
      axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
    if (coord < mid) return index;
  }
  return rects.length;
}

/**
 * Pointer drag shared by the block handle and the table grips: calls `onMove` with each pointer
 * position once it has travelled a few pixels, and `onDrop` (drag) or `onClick` (no travel) on
 * release. The listeners sit on `window`, so the gesture survives the pointer leaving the handle.
 */
function startDrag(
  event: React.PointerEvent,
  handlers: {
    onMove: (event: PointerEvent) => void;
    onDrop: () => void;
    onClick: () => void;
    onEnd: () => void;
  },
) {
  if (event.button !== 0) return;
  event.preventDefault();
  const origin = { x: event.clientX, y: event.clientY };
  let dragging = false;
  // Touch: a drag needs a 350ms hold first (a quick tap is a click); moving before then lets go.
  let armed = event.pointerType !== "touch";
  const hold = armed
    ? undefined
    : setTimeout(() => {
        armed = true;
      }, 350);
  const move = (next: PointerEvent) => {
    if (
      !dragging &&
      Math.hypot(next.clientX - origin.x, next.clientY - origin.y) < 4
    )
      return;
    if (!armed) {
      cancel();
      return;
    }
    dragging = true;
    handlers.onMove(next);
  };
  const stop = (drop: boolean) => () => {
    clearTimeout(hold);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    if (drop) {
      if (dragging) handlers.onDrop();
      else handlers.onClick();
    }
    handlers.onEnd();
  };
  const up = stop(true);
  const cancel = stop(false);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
}

const GRIP =
  "fixed z-50 flex cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing data-popup-open:bg-muted data-popup-open:text-foreground [&_svg]:size-4 [&_svg]:shrink-0";
/** A row or column grip: a small pill on the table's inner edge, over the cell padding. */
const LINE_GRIP =
  "fixed z-50 flex cursor-grab touch-none items-center justify-center rounded-sm border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing data-popup-open:bg-muted data-popup-open:text-foreground [&_svg]:size-3";
/** Notion's "+" bars below and beside a table. */
const ADD_BAR =
  "fixed z-50 size-auto min-w-0 rounded-sm bg-muted/50 text-muted-foreground/70 hover:bg-muted hover:text-foreground [&_svg]:size-3";
// The drop line's ink is the shared reorder token (`drag-item`, info blue), the same as
// SortableList's: a 2px rounded line.
const DROP_LINE = cn(
  "pointer-events-none fixed z-50 rounded-full",
  dropIndicatorClasses,
);
/**
 * The block grip's width (its 16px icon's own box) and its start offset from the text (+ 4px).
 * `text-edit`'s handle gutter mirrors these three numbers and `HANDLE_FRAME`.
 */
const HANDLE_WIDTH = 16;
const HANDLE_GUTTER = HANDLE_WIDTH + 4;
/** How far the grip and the drop line stay inside the frame's edge. */
const FRAME_INSET = 6;
/** The containers whose padding the block grip stays inside. */
const HANDLE_FRAME =
  '[data-slot="dialog-content"],[data-slot="sheet-content"],[data-slot="drawer-content"],[data-slot="popover-content"],[data-slot="card"]';

/** The frame the block grip and the drop line stay inside: a boxed editor's border, else a Dialog, Sheet, Popover or Card. */
function handleFrame(editor: Editor) {
  return (
    editor.view.dom.closest(
      '[data-slot="text-edit"]:is([data-variant="boxed"],[data-variant="composer"])',
    ) ?? editor.view.dom.closest(HANDLE_FRAME)
  );
}

/**
 * The block grip's left edge for a block starting at `left`: 4px before the text (clearing a list
 * marker), clamped `FRAME_INSET` inside the frame (see `handleFrame`) when its padding is
 * narrower, so the grip never sits on the frame's edge.
 */
function handleLeft(editor: Editor, left: number) {
  const frame = handleFrame(editor);
  return Math.max(
    left - HANDLE_GUTTER,
    frame ? frame.getBoundingClientRect().left + FRAME_INSET : -Infinity,
  );
}

/**
 * A hover overlay's target: kept while the pointer crosses from the target to the overlay, dropped
 * a beat after it leaves both, held while pinned (a drag, an open menu), and dropped on scroll (its
 * fixed position would go stale). `same` stops a mousemove over the same target from re-rendering.
 */
function useHover<T>(same: (a: T, b: T) => boolean) {
  const [value, setValue] = React.useState<T | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pinnedRef = React.useRef(false);
  const sameRef = React.useRef(same);
  sameRef.current = same;
  const show = React.useCallback((next: T | null) => {
    clearTimeout(timer.current);
    setValue((previous) =>
      previous !== null && next !== null && sameRef.current(previous, next)
        ? previous
        : next,
    );
  }, []);
  const hideSoon = React.useCallback(() => {
    if (pinnedRef.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!pinnedRef.current) setValue(null);
    }, 250);
  }, []);
  const keep = React.useCallback(() => clearTimeout(timer.current), []);
  React.useEffect(() => {
    const onScroll = () => {
      if (!pinnedRef.current) setValue(null);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);
  return { value, show, hideSoon, keep, pinnedRef };
}

/** The resolved position just before the table cell `cell` (what `CellSelection` takes). */
function resolveCell(view: EditorView, cell: HTMLElement) {
  const $inside = view.state.doc.resolve(view.posAtDOM(cell, 0));
  for (let depth = $inside.depth; depth > 0; depth--) {
    const role = $inside.node(depth).type.spec.tableRole as string | undefined;
    if (role === "cell" || role === "header_cell")
      return view.state.doc.resolve($inside.before(depth));
  }
  return null;
}

/**
 * Drag the block at `pos` among its siblings (a line shows the drop slot), or `onClick` when the
 * pointer never travelled. Shared by the block handle and the table's corner grip.
 *
 * Safe while others edit: the block is held from the press (`holdPosition`), and the drop
 * re-resolves it — when it is gone (deleted, or replaced by a collaborator) the move is dropped
 * with a toast. A remote change during the drag re-measures the slots. Near the top or
 * bottom of the window (48px) the page scrolls.
 */
function startBlockDrag(
  editor: Editor,
  pos: number,
  event: React.PointerEvent,
  handlers: {
    setLine: (line: DragLine | null) => void;
    onClick: () => void;
    onEnd: () => void;
  },
) {
  if (event.button !== 0) return;
  const held = holdPosition(editor, pos, true);
  let rects: DOMRect[] = [];
  let left = 0;
  let right = 0;
  const measure = () => {
    const { siblings } = siblingsOf(editor.view, held.get() ?? pos);
    rects = siblings.map(
      (sibling) => sibling.dom?.getBoundingClientRect() ?? new DOMRect(),
    );
    // The line is inset from the blocks' own edges, and kept inside the frame, so it never touches
    // a section's or card's edge.
    const frame = handleFrame(editor)?.getBoundingClientRect();
    left = Math.max(
      Math.min(...rects.map((rect) => rect.left)) + 4,
      frame ? frame.left + FRAME_INSET : -Infinity,
    );
    right = Math.min(
      Math.max(...rects.map((rect) => rect.right)) - 4,
      frame ? frame.right - FRAME_INSET : Infinity,
    );
  };
  measure();
  let slot = -1;
  let pointerY = event.clientY;
  let frame = 0;
  const place = () => {
    if (slot < 0) return;
    const edge =
      slot >= rects.length ? rects[rects.length - 1]!.bottom : rects[slot]!.top;
    handlers.setLine({ left, top: edge - 1, width: right - left, height: 2 });
  };
  // Edge auto-scroll: faster the closer the pointer is to the window's edge.
  const scrollTick = () => {
    frame = 0;
    const band = 48;
    const top = pointerY - band;
    const bottom = window.innerHeight - band - pointerY;
    const step =
      top < 0
        ? Math.max(-16, top / 3)
        : bottom < 0
          ? Math.min(16, -bottom / 3)
          : 0;
    if (step === 0) return;
    window.scrollBy(0, step);
    measure();
    slot = slotAt(rects, pointerY, "y");
    place();
    frame = requestAnimationFrame(scrollTick);
  };
  const onRemote = ({ transaction }: { transaction: Transaction }) => {
    if (!transaction.docChanged || !isChangeOrigin(transaction)) return;
    measure();
    if (slot >= 0) {
      slot = slotAt(rects, pointerY, "y");
      place();
    }
  };
  editor.on("transaction", onRemote);
  // Synchronous (tiptap's `focus()` waits a frame): the edit session opens before the move.
  editor.view.focus();
  startDrag(event, {
    onMove: (next) => {
      pointerY = next.clientY;
      slot = slotAt(rects, next.clientY, "y");
      place();
      if (!frame) frame = requestAnimationFrame(scrollTick);
    },
    onDrop: () => {
      if (slot < 0) return;
      const now = held.get();
      if (now === null) {
        toast.add({
          title: "That block changed while you moved it. Try again.",
        });
        return;
      }
      moveNodeTo(editor.view, now, slot);
    },
    onClick: handlers.onClick,
    onEnd: () => {
      cancelAnimationFrame(frame);
      editor.off("transaction", onRemote);
      held.release();
      handlers.setLine(null);
      handlers.onEnd();
    },
  });
}

type TableMenuKind = "row" | "col" | "table";

/**
 * The table under `cursor`, held while a menu is open or a grip is dragged (`holdPosition`): its
 * position now while its content is unchanged, else null — row and column indices taken from it
 * then name other lines (a collaborator added or moved one), so the action must not run.
 */
function holdTable(editor: Editor, cursor: TableCursor): HeldPosition {
  const held = holdPosition(editor, cursor.tablePos, true);
  return {
    get: () => {
      const pos = held.get();
      const node = pos === null ? null : editor.state.doc.nodeAt(pos);
      return node && node.eq(cursor.table) ? pos : null;
    },
    release: held.release,
  };
}

/** The hovered cell, as DOM indices (GFM tables have no spans, so they are the model's too). */
interface TableTarget {
  table: HTMLTableElement;
  row: number;
  col: number;
}

/** The table, row and column the DOM cell (`row`, `col`) of `table` stands for. */
function tableCursor(
  view: EditorView,
  table: HTMLTableElement,
  row: number,
  col: number,
): TableCursor | null {
  const cell = table.rows[row]?.cells[col];
  if (!cell) return null;
  const $cell = resolveCell(view, cell);
  return $cell ? tableAt(view.state, $cell.pos + 1) : null;
}

interface TableMenuItem {
  label: string;
  icon: React.ComponentType;
  run: () => unknown;
  disabled?: boolean;
  destructive?: boolean;
  /** A header toggle: rendered as a checkbox item. */
  checked?: boolean;
}

/**
 * A grip that is also a menu trigger. A press without travel selects the line and opens the menu;
 * a drag reorders instead. Base UI's own mousedown opener is held off so the two never race — a
 * screen reader's virtual click (no pointer, `detail` 0) still opens the menu through Base UI.
 */
function GripMenu({
  label,
  icon: Icon,
  axis,
  style,
  className,
  open,
  onOpenChange,
  onPointerDown,
  onMouseEnter,
  onMouseLeave,
  items,
  finalFocus,
}: {
  label: string;
  icon: React.ComponentType;
  axis: TableMenuKind;
  style: React.CSSProperties;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPointerDown: (event: React.PointerEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  items: (TableMenuItem | "separator")[];
  finalFocus: React.RefObject<HTMLElement | null>;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        data-slot="text-edit-table-grip"
        data-axis={axis}
        aria-label={label}
        title={`${label} · drag to move`}
        tabIndex={-1}
        style={style}
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={(event) => {
          event.preventDefault();
          event.preventBaseUIHandler();
        }}
        onClick={(event) => {
          if (event.detail !== 0) event.preventBaseUIHandler();
        }}
        onPointerDown={onPointerDown}
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-text-edit-menu=""
        aria-label={label}
        finalFocus={finalFocus}
        className="w-auto min-w-44"
      >
        {items.map((item, index) =>
          item === "separator" ? (
            <DropdownMenuSeparator key={`separator-${index}`} />
          ) : item.checked !== undefined ? (
            <DropdownMenuCheckboxItem
              key={item.label}
              checked={item.checked}
              disabled={item.disabled}
              onClick={() => void item.run()}
            >
              <item.icon />
              {item.label}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={item.label}
              disabled={item.disabled}
              variant={item.destructive ? "destructive" : "default"}
              onClick={() => void item.run()}
            >
              <item.icon />
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Notion-style simple-table chrome, for the hovered table only:
 *
 * - a ⠿ grip on the hovered row's inner left edge and on the hovered column's inner top edge —
 *   click it to select the line and open its menu, drag it to reorder;
 * - the corner grip, where every block's handle sits — click it to select the whole table and open
 *   the table menu, drag it to move the table;
 * - "+" bars below and beside the table that add a row or a column at the end.
 *
 * <kbd>Shift</kbd>+<kbd>F10</kbd> (or the context-menu key) opens the menu for the selection from
 * the keyboard: a selected column, the whole table, else the caret's row.
 */
function TableControls({
  editor,
  markdown,
}: {
  editor: Editor;
  markdown: boolean;
}) {
  const { value, show, hideSoon, keep, pinnedRef } = useHover<TableTarget>(
    (a, b) => a.table === b.table && a.row === b.row && a.col === b.col,
  );
  const [menu, setMenu] = React.useState<TableMenuKind | null>(null);
  const [line, setLine] = React.useState<DragLine | null>(null);
  // Positions are read from the DOM at render: re-render after every transaction.
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  const editorDom = React.useRef<HTMLElement | null>(null);
  editorDom.current = editor.view.dom;

  // The open menu's table: a collaborator's change to it closes the menu (its lines moved).
  const menuTableRef = React.useRef<HeldPosition | null>(null);
  const openMenu = React.useCallback(
    (kind: TableMenuKind, cursor: TableCursor) => {
      pinnedRef.current = true;
      menuTableRef.current?.release();
      menuTableRef.current = holdTable(editor, cursor);
      setMenu(kind);
    },
    [editor, pinnedRef],
  );
  const closeMenu = React.useCallback(() => {
    menuTableRef.current?.release();
    menuTableRef.current = null;
    pinnedRef.current = false;
    setMenu(null);
    hideSoon();
  }, [pinnedRef, hideSoon]);
  React.useEffect(() => {
    const onRemote = ({ transaction }: { transaction: Transaction }) => {
      const held = menuTableRef.current;
      if (held && transaction.docChanged && isChangeOrigin(transaction))
        if (held.get() === null) closeMenu();
    };
    editor.on("transaction", onRemote);
    return () => {
      editor.off("transaction", onRemote);
      menuTableRef.current?.release();
    };
  }, [editor, closeMenu]);

  React.useEffect(() => {
    const dom = editor.view.dom;
    const onMove = (event: MouseEvent) => {
      if (pinnedRef.current) return;
      const target = event.target as Element | null;
      const cell = target?.closest?.("td,th") as HTMLTableCellElement | null;
      const table = cell?.closest("table");
      if (cell && table && dom.contains(table))
        show({
          table,
          row: (cell.parentElement as HTMLTableRowElement).rowIndex,
          col: cell.cellIndex,
        });
      else if (!target?.closest?.(".tableWrapper")) hideSoon();
    };
    const onKey = (event: KeyboardEvent) => {
      const opens =
        event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
      if (!opens) {
        if (!pinnedRef.current) show(null);
        return;
      }
      const { selection } = editor.state;
      const cells = selection instanceof CellSelection ? selection : null;
      const cursor = tableAt(
        editor.state,
        cells ? cells.$headCell.pos + 1 : selection.from,
      );
      if (!cursor) return;
      const wrapper = editor.view.nodeDOM(cursor.tablePos);
      const table =
        wrapper instanceof HTMLTableElement
          ? wrapper
          : wrapper instanceof HTMLElement
            ? wrapper.querySelector("table")
            : null;
      if (!table) return;
      event.preventDefault();
      const kind: TableMenuKind = !cells
        ? "row"
        : cells.isRowSelection() && cells.isColSelection()
          ? "table"
          : cells.isColSelection()
            ? "col"
            : "row";
      if (!cells) selectTableLine(editor.view, cursor, "row");
      show({ table, row: cursor.row, col: cursor.col });
      openMenu(kind, cursor);
    };
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", hideSoon);
    dom.addEventListener("keydown", onKey);
    editor.on("transaction", rerender);
    return () => {
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", hideSoon);
      dom.removeEventListener("keydown", onKey);
      editor.off("transaction", rerender);
    };
  }, [editor, show, hideSoon, pinnedRef, openMenu]);

  if (!value || !value.table.isConnected) return null;
  const { table } = value;
  const rowEl = table.rows[value.row];
  const colCell = table.rows[0]?.cells[value.col];
  const cursor = tableCursor(editor.view, table, value.row, value.col);
  if (!rowEl || !colCell || !cursor) return null;

  const node = cursor.table;
  const rows = node.childCount;
  const cols = node.child(0).childCount;
  const headerRow = hasHeaderRow(node);
  const headerCol = hasHeaderColumn(node);
  const minRow = headerRow ? 1 : 0;
  const minCol = headerCol ? 1 : 0;
  const { row, col } = cursor;
  const view = editor.view;
  const at = cellTextPos(node, cursor.tablePos, row, col);

  const tableBox = table.getBoundingClientRect();
  const wrapBox = (table.parentElement ?? table).getBoundingClientRect();
  // A wide table scrolls in its wrapper: the chrome follows the visible part.
  const visibleLeft = Math.max(tableBox.left, wrapBox.left);
  const visibleRight = Math.min(tableBox.right, wrapBox.right);
  const rowBox = rowEl.getBoundingClientRect();
  const colBox = colCell.getBoundingClientRect();
  const colCenter = colBox.left + colBox.width / 2;
  const colVisible =
    colCenter > visibleLeft + 10 && colCenter < visibleRight - 10;

  const menuOpenChange = (kind: TableMenuKind) => (open: boolean) => {
    if (!open) return closeMenu();
    // Base UI opened it (a virtual click): select the line first, as a press does.
    selectTableLine(view, cursor, kind);
    openMenu(kind, cursor);
  };

  const dragLine = (axis: "row" | "col") => (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const from = axis === "col" ? col : row;
    const movable = from >= (axis === "col" ? minCol : minRow);
    const rects =
      axis === "col"
        ? [...(table.rows[0]?.cells ?? [])].map((c) =>
            c.getBoundingClientRect(),
          )
        : [...table.rows].map((r) => r.getBoundingClientRect());
    let to = from;
    let opened = false;
    // The rows and columns are indices into the table as the press found it.
    const held = holdTable(editor, cursor);
    // Synchronous (tiptap's `focus()` waits a frame): the edit session opens before the move.
    view.focus();
    pinnedRef.current = true;
    startDrag(event, {
      onMove: (next) => {
        if (!movable) return;
        const slot = Math.max(
          axis === "row" ? minRow : minCol,
          slotAt(
            rects,
            axis === "col" ? next.clientX : next.clientY,
            axis === "col" ? "x" : "y",
          ),
        );
        // A slot is a gap; past its own position the moved line lands one index lower.
        to = slot > from ? slot - 1 : slot;
        const edge =
          slot >= rects.length
            ? axis === "col"
              ? rects[rects.length - 1]!.right
              : rects[rects.length - 1]!.bottom
            : axis === "col"
              ? rects[slot]!.left
              : rects[slot]!.top;
        setLine(
          axis === "col"
            ? {
                left: edge - 1,
                top: tableBox.top,
                width: 2,
                height: tableBox.height,
              }
            : {
                left: visibleLeft,
                top: edge - 1,
                width: visibleRight - visibleLeft,
                height: 2,
              },
        );
      },
      onDrop: () => {
        const pos = held.get();
        if (pos === null) {
          toast.add({
            title: "That table changed while you moved it. Try again.",
          });
          return;
        }
        moveTable(
          view,
          cellTextPos(cursor.table, pos, row, col),
          axis,
          from,
          to,
        );
      },
      onClick: () => {
        opened = true;
        selectTableLine(view, cursor, axis);
        openMenu(axis, cursor);
      },
      onEnd: () => {
        held.release();
        setLine(null);
        if (!opened) pinnedRef.current = false;
      },
    });
  };

  const dragTable = (event: React.PointerEvent) => {
    let opened = false;
    pinnedRef.current = true;
    startBlockDrag(editor, cursor.tablePos, event, {
      setLine,
      onClick: () => {
        opened = true;
        selectTableLine(view, cursor, "table");
        openMenu("table", cursor);
      },
      onEnd: () => {
        if (!opened) pinnedRef.current = false;
      },
    });
  };

  const clear = (kind: TableMenuKind) => () => {
    selectTableLine(view, cursor, kind);
    deleteCellSelection(view.state, view.dispatch);
    view.focus();
  };
  const chain = () => editor.chain().focus();
  // Header toggles are HTML-only: GFM always has exactly one header row and no header column.
  const headerRowItem: TableMenuItem = {
    label: "Header row",
    icon: PanelTop,
    checked: headerRow,
    run: () => chain().toggleHeaderRow().run(),
  };
  const headerColItem: TableMenuItem = {
    label: "Header column",
    icon: PanelLeft,
    checked: headerCol,
    run: () => chain().toggleHeaderColumn().run(),
  };

  const rowItems: (TableMenuItem | "separator")[] = [
    {
      label: "Insert above",
      icon: BetweenHorizontalStart,
      run: () => chain().addRowBefore().run(),
      disabled: row < minRow,
    },
    {
      label: "Insert below",
      icon: BetweenHorizontalEnd,
      run: () => chain().addRowAfter().run(),
    },
    {
      label: "Move up",
      icon: ArrowUp,
      run: () => moveTable(view, at, "row", row, row - 1),
      disabled: row <= minRow,
    },
    {
      label: "Move down",
      icon: ArrowDown,
      run: () => moveTable(view, at, "row", row, row + 1),
      disabled: row < minRow || row >= rows - 1,
    },
    {
      label: "Duplicate",
      icon: Copy,
      run: () => duplicateTableLine(view, cursor, "row"),
    },
    { label: "Clear contents", icon: Eraser, run: clear("row") },
    ...(!markdown && row === 0 ? [headerRowItem] : []),
    "separator",
    {
      label: "Delete row",
      icon: Trash2,
      run: () => chain().deleteRow().run(),
      disabled: rows <= 1 || row < minRow,
      destructive: true,
    },
  ];
  const colItems: (TableMenuItem | "separator")[] = [
    {
      label: "Insert left",
      icon: BetweenVerticalStart,
      run: () => chain().addColumnBefore().run(),
      disabled: col < minCol,
    },
    {
      label: "Insert right",
      icon: BetweenVerticalEnd,
      run: () => chain().addColumnAfter().run(),
    },
    {
      label: "Move left",
      icon: ArrowLeft,
      run: () => moveTable(view, at, "col", col, col - 1),
      disabled: col <= minCol,
    },
    {
      label: "Move right",
      icon: ArrowRight,
      run: () => moveTable(view, at, "col", col, col + 1),
      disabled: col < minCol || col >= cols - 1,
    },
    {
      label: "Duplicate",
      icon: Copy,
      run: () => duplicateTableLine(view, cursor, "col"),
    },
    { label: "Clear contents", icon: Eraser, run: clear("col") },
    ...(!markdown && col === 0 ? [headerColItem] : []),
    "separator",
    {
      label: "Delete column",
      icon: Trash2,
      run: () => chain().deleteColumn().run(),
      disabled: cols <= 1,
      destructive: true,
    },
  ];
  const tableItems: (TableMenuItem | "separator")[] = [
    ...(!markdown ? [headerRowItem, headerColItem] : []),
    { label: "Clear contents", icon: Eraser, run: clear("table") },
    "separator",
    {
      label: "Delete table",
      icon: Trash2,
      run: () => chain().deleteTable().run(),
      destructive: true,
    },
  ];

  const hover = { onMouseEnter: keep, onMouseLeave: hideSoon };
  const addBar = (axis: "row" | "col", style: React.CSSProperties) => {
    const label = axis === "row" ? "Add row" : "Add column";
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        data-slot="text-edit-table-add"
        data-axis={axis}
        aria-label={label}
        title={label}
        tabIndex={-1}
        style={style}
        className={ADD_BAR}
        {...hover}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => appendTableLine(view, cursor.tablePos, axis)}
      >
        <Plus />
      </Button>
    );
  };

  return (
    <FloatingLayer>
      <GripMenu
        label="Table options"
        icon={GripVertical}
        axis="table"
        open={menu === "table"}
        onOpenChange={menuOpenChange("table")}
        onPointerDown={dragTable}
        items={tableItems}
        finalFocus={editorDom}
        // Where every block's handle sits: beside the table's first line.
        style={{
          left: handleLeft(editor, wrapBox.left),
          top: wrapBox.top + Math.min(wrapBox.height, 24) / 2 - 10,
          width: HANDLE_WIDTH,
          height: 20,
        }}
        className={GRIP}
        {...hover}
      />
      <GripMenu
        label="Row options"
        icon={GripVertical}
        axis="row"
        open={menu === "row"}
        onOpenChange={menuOpenChange("row")}
        onPointerDown={dragLine("row")}
        items={rowItems}
        finalFocus={editorDom}
        style={{
          left: visibleLeft + 2,
          top: rowBox.top + rowBox.height / 2 - 10,
          width: 8,
          height: 20,
        }}
        className={LINE_GRIP}
        {...hover}
      />
      {colVisible ? (
        <GripMenu
          label="Column options"
          icon={GripHorizontal}
          axis="col"
          open={menu === "col"}
          onOpenChange={menuOpenChange("col")}
          onPointerDown={dragLine("col")}
          items={colItems}
          finalFocus={editorDom}
          style={{
            left: colCenter - 10,
            top: tableBox.top + 2,
            width: 20,
            height: 8,
          }}
          className={LINE_GRIP}
          {...hover}
        />
      ) : null}
      {addBar("row", {
        left: visibleLeft,
        top: wrapBox.bottom + 2,
        width: visibleRight - visibleLeft,
        height: 10,
      })}
      {addBar("col", {
        left: visibleRight + 2,
        top: tableBox.top,
        width: 10,
        height: tableBox.height,
      })}
      {line ? (
        <div
          data-slot="text-edit-drop-indicator"
          className={DROP_LINE}
          style={line}
        />
      ) : null}
    </FloatingLayer>
  );
}

/* --- `:` emoji (B4) ----------------------------------------------------------------------------*/

const EMOJI_KEY = new PluginKey("textEditEmoji");

type EmojiModule = typeof import("@/lib/emoji-data");
let emojiModule: Promise<EmojiModule> | null = null;
/** The emoji table, loaded on the first `:` query (never on load). */
function loadEmoji(): Promise<EmojiModule> {
  emojiModule ??= import("@/lib/emoji-data").catch((error: unknown) => {
    emojiModule = null;
    throw error;
  });
  return emojiModule;
}

interface EmojiMenuState {
  query: string;
  items: { char: string; name: string }[];
  index: number;
  rect: DOMRect | null;
  command: (item: { char: string; name: string }) => void;
}

interface EmojiRuntime {
  get: () => EmojiMenuState | null;
  set: (next: EmojiMenuState | null) => void;
}

/** A query worth a menu: two or more letters (digits, `_`, `+`, `-` after the first). */
const EMOJI_QUERY = /^[a-z][a-z0-9_+-]+$/i;

/** Up to 8 emoji whose name or keywords match `query` (`thumbs_up` reads as "thumbs up"). */
function emojiMatches(data: EmojiModule, query: string) {
  const words = query.toLowerCase().replace(/[_-]+/g, " ").trim();
  const out: { char: string; name: string }[] = [];
  for (const category of data.EMOJI_CATEGORIES)
    for (const entry of data.EMOJI[category]) {
      if (out.length >= 8) return out;
      if (data.matchesEmoji(entry, words))
        out.push({ char: entry.char, name: entry.name });
    }
  return out;
}

/**
 * `:` + two letters opens the emoji menu; the pick lands as the character itself (plain text — the
 * Markdown is the emoji). Only at the start of a block, after a space or `(`: `10:30`, `Note:` and
 * `https://` never open it. A collaborator's typing never opens this viewer's menu.
 */
function emojiExtension(runtime: EmojiRuntime) {
  return Extension.create({
    name: "textEditEmoji",
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        Suggestion<
          { char: string; name: string },
          { char: string; name: string }
        >({
          editor,
          pluginKey: EMOJI_KEY,
          char: ":",
          allowedPrefixes: [" ", "("],
          shouldShow: localQuery(EMOJI_KEY),
          allow: () =>
            !editor.isActive("codeBlock") && !editor.isActive("code"),
          items: () => [],
          command: ({ editor: ed, range, props }) => {
            ed.chain().focus().insertContentAt(range, props.char).run();
          },
          render: () => {
            let latest = "";
            const show = (
              props: SuggestionProps<
                { char: string; name: string },
                { char: string; name: string }
              >,
            ) => {
              latest = props.query;
              if (!EMOJI_QUERY.test(props.query)) {
                runtime.set(null);
                return;
              }
              const query = props.query;
              const rect = props.clientRect?.() ?? null;
              void loadEmoji()
                .then((data) => {
                  // A later keystroke has moved on: its own load answers.
                  if (latest !== query) return;
                  const items = emojiMatches(data, query);
                  const previous = runtime.get();
                  runtime.set(
                    items.length
                      ? {
                          query,
                          items,
                          index:
                            previous && previous.query === query
                              ? Math.min(previous.index, items.length - 1)
                              : 0,
                          rect,
                          command: props.command,
                        }
                      : null,
                  );
                })
                .catch(() => runtime.set(null));
            };
            return {
              onStart: show,
              onUpdate: show,
              onExit: () => {
                latest = "";
                runtime.set(null);
              },
              onKeyDown: ({ event }) => {
                const state = runtime.get();
                if (!state) return false;
                return suggestionMenuKeyDown(event, {
                  count: state.items.length,
                  activeIndex: state.index,
                  onActiveIndexChange: (index) =>
                    runtime.set({ ...state, index }),
                  onSelect: (index) => state.command(state.items[index]!),
                  onClose: () => exitSuggestion(editor.view, EMOJI_KEY),
                });
              },
            };
          },
        }),
      ];
    },
  });
}

/* --- find & replace (B3) -----------------------------------------------------------------------*/

/** The find bar's view of the find plugin. */
interface FindSnapshot {
  term: string;
  results: number;
  current: number | null;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

function findSnapshot(editor: Editor): FindSnapshot {
  const state = FindAndReplacePluginKey.getState(editor.state);
  return {
    term: state?.searchTerm ?? "",
    results: state?.results.length ?? 0,
    current: state?.currentIndex ?? null,
    caseSensitive: state?.caseSensitive ?? false,
    wholeWord: state?.wholeWord ?? false,
    useRegex: state?.useRegex ?? false,
  };
}

/** Whether `from`–`to` is the find bar's current match (the selection Find put there). */
function isFindMatch(state: EditorState, from: number, to: number): boolean {
  const find = FindAndReplacePluginKey.getState(state);
  const current =
    find && find.searchTerm && find.currentIndex !== null
      ? find.results[find.currentIndex]
      : null;
  return !!current && current.from === from && current.to === to;
}

/** The matches' tints: every match, and the current one (darker, underlined). */
const FIND_RESULT_CLASS =
  "[&_.find-and-replace-result]:rounded-[2px] [&_.find-and-replace-result]:bg-warning/35 [&_.find-and-replace-result-current]:bg-warning/60 [&_.find-and-replace-result-current]:underline [&_.find-and-replace-result-current]:decoration-2 [&_.find-and-replace-result-current]:underline-offset-2 print:[&_.find-and-replace-result]:bg-transparent";

/** The find plugin's keys while the bar is open: ⌘G / ⇧⌘G step (Esc closes it: `handleKeyDown`). */
interface FindRuntime {
  open: () => boolean;
  isOpen: () => boolean;
  step: (direction: 1 | -1) => boolean;
}

function findKeys(runtime: FindRuntime) {
  return Extension.create({
    name: "textEditFindKeys",
    addKeyboardShortcuts() {
      return {
        // Only inside an editable editor: elsewhere the browser's own find runs.
        "Mod-f": () => this.editor.isEditable && runtime.open(),
        "Mod-g": () => runtime.isOpen() && runtime.step(1),
        "Shift-Mod-g": () => runtime.isOpen() && runtime.step(-1),
      };
    },
  });
}

/**
 * The find bar (`role="search"`), docked at the top of the text: a Find field with "3 of 12",
 * previous / next, match case, whole word and regular expression (RE2: no runaway patterns), and —
 * while editable — a Replace row with Replace and Replace all (one undo step). A match inside a
 * closed toggle opens it for this viewer. Esc closes it with the caret back where it was.
 */
function FindBar({
  editor,
  editable,
  top,
  focusKey,
  initialTerm,
  onClose,
  onReveal,
}: {
  editor: Editor;
  editable: boolean;
  /** The selection's text to search for when opened; null keeps the last term. */
  initialTerm: string | null;
  /** The sticky offset: below a host's header (`floatingSafeArea.top`). */
  top: number;
  /** Changes whenever the bar is asked to open again: the Find field takes focus. */
  focusKey: number;
  onClose: () => void;
  /** Show the current match: open toggles around it, then scroll it into view. */
  onReveal: (from: number) => void;
}) {
  const [snap, setSnap] = React.useState(() => findSnapshot(editor));
  const [term, setTerm] = React.useState(snap.term);
  const [replacing, setReplacing] = React.useState(false);
  // The plugin's own replacement: what Replace and Replace all insert is what the field shows.
  const [replacement, setReplacement] = React.useState(
    () => FindAndReplacePluginKey.getState(editor.state)?.replaceTerm ?? "",
  );
  const findRef = React.useRef<HTMLInputElement>(null);
  const { announce, Announcer } = useAnnouncer();
  const inputId = React.useId();
  const replaceId = React.useId();

  React.useEffect(() => {
    const update = () => setSnap(findSnapshot(editor));
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  React.useEffect(() => {
    if (initialTerm !== null) {
      setTerm(initialTerm);
      editor.commands.setSearchTerm(initialTerm);
    }
    findRef.current?.focus();
    // Selected once the new term is in the field (the next frame), so typing replaces it.
    const frame = requestAnimationFrame(() => findRef.current?.select());
    return () => cancelAnimationFrame(frame);
    // Only on each open: the term is the field's own after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  // A regular expression that doesn't compile is not "no results": say so.
  const badPattern =
    snap.useRegex &&
    snap.term !== "" &&
    createSearchRegex(snap.term, {
      useRegex: true,
      caseSensitive: snap.caseSensitive,
      wholeWord: snap.wholeWord,
    }) === null;
  const count =
    snap.term === ""
      ? ""
      : badPattern
        ? "Invalid pattern"
        : snap.results === 0
          ? "No results"
          : snap.current === null
            ? snap.results === 1
              ? "1 result"
              : `${snap.results} results`
            : `${snap.current + 1} of ${snap.results}`;
  // "3 of 12", announced once it settles (250ms), never per keystroke.
  React.useEffect(() => {
    if (!count) return;
    const timer = setTimeout(() => announce(count), 250);
    return () => clearTimeout(timer);
  }, [count, announce]);

  const reveal = () => {
    const state = FindAndReplacePluginKey.getState(editor.state);
    const result =
      state && state.currentIndex !== null
        ? state.results[state.currentIndex]
        : null;
    if (result) onReveal(result.from);
  };
  const step = (direction: 1 | -1) => {
    if (direction > 0) editor.commands.goToNextResult();
    else editor.commands.goToPreviousResult();
    reveal();
  };
  const toggle = (
    label: string,
    icon: React.ReactNode,
    pressed: boolean,
    set: (value: boolean) => void,
  ) => (
    <MenuTip label={label}>
      <Toggle
        size="sm"
        aria-label={label}
        pressed={pressed}
        onPressedChange={set}
        className="pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      >
        {icon}
      </Toggle>
    </MenuTip>
  );
  const iconButton = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    disabled = false,
  ) => (
    <MenuTip label={label}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </Button>
    </MenuTip>
  );

  return (
    <div
      role="search"
      aria-label="Find in page"
      data-slot="text-edit-find"
      data-text-edit-menu=""
      style={{ top }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        } else if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "g"
        ) {
          event.preventDefault();
          step(event.shiftKey ? -1 : 1);
        } else if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "f"
        ) {
          event.preventDefault();
          findRef.current?.select();
        }
      }}
      className="sticky z-20 mb-3 flex flex-col gap-1.5 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md print:hidden"
    >
      <div className="flex flex-wrap items-center gap-1">
        <label htmlFor={inputId} className="sr-only">
          Find
        </label>
        {/* The field gives way first, so the bar stays one row in a 27rem text column. */}
        <div className="relative min-w-24 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={findRef}
            id={inputId}
            value={term}
            placeholder="Find"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={badPattern || undefined}
            onChange={(event) => {
              setTerm(event.target.value);
              editor.commands.setSearchTerm(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              step(event.shiftKey ? -1 : 1);
            }}
            className="h-8 ps-8 pointer-coarse:h-11"
          />
        </div>
        <span
          aria-hidden
          className="min-w-16 text-center text-xs text-muted-foreground tabular-nums"
        >
          {count}
        </span>
        {iconButton(
          "Previous match",
          <ChevronUp />,
          () => step(-1),
          snap.results === 0,
        )}
        {iconButton(
          "Next match",
          <ChevronDown />,
          () => step(1),
          snap.results === 0,
        )}
        {toggle("Match case", <CaseSensitive />, snap.caseSensitive, (value) =>
          editor.commands.setCaseSensitive(value),
        )}
        {toggle("Whole word", <WholeWord />, snap.wholeWord, (value) =>
          editor.commands.setWholeWord(value),
        )}
        {toggle("Regular expression", <Regex />, snap.useRegex, (value) =>
          editor.commands.setUseRegex(value),
        )}
        {editable
          ? toggle("Replace", <Replace />, replacing, setReplacing)
          : null}
        {iconButton("Close find", <X />, onClose)}
      </div>
      {editable && replacing ? (
        <div className="flex flex-wrap items-center gap-1">
          <label htmlFor={replaceId} className="sr-only">
            Replace with
          </label>
          <Input
            id={replaceId}
            value={replacement}
            placeholder="Replace with"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setReplacement(event.target.value);
              editor.commands.setReplaceTerm(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              editor.commands.replace();
              reveal();
            }}
            className="h-8 min-w-40 flex-1 pointer-coarse:h-11"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={snap.results === 0}
            onClick={() => {
              editor.commands.replace();
              reveal();
            }}
          >
            <Replace />
            Replace
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={snap.results === 0}
            onClick={() => {
              const n = snap.results;
              editor.commands.replaceAll();
              announce(n === 1 ? "Replaced 1 match" : `Replaced ${n} matches`);
            }}
          >
            <ReplaceAll />
            Replace all
          </Button>
        </div>
      ) : null}
      <Announcer />
    </div>
  );
}

/* --- heading links (B4) ------------------------------------------------------------------------*/

/** A heading's slug (its outline id) and block id, for `headingLinkHref`. */
function headingAnchorAt(
  doc: PMNode,
  pos: number,
): TextEditHeadingAnchor | null {
  const entry = headingsOf(doc).find((heading) => heading.pos === pos);
  if (!entry) return null;
  const blockId = doc.nodeAt(pos)?.attrs.blockId as string | null | undefined;
  return blockId ? { id: blockId, slug: entry.id } : { slug: entry.id };
}

/** The heading link's 24px box and its 2px clearance from the text, in the gutter before it. */
const HEADING_LINK_SIZE = 24;
const HEADING_LINK_GUTTER = HEADING_LINK_SIZE + 2;

/**
 * Whether a heading's `#` link sits in the gutter before it: on a fine pointer, with room for the
 * link and the block grip beside it inside the editor's frame (a boxed editor, a Dialog, a Card).
 * Otherwise it follows the heading's text, and the grip keeps its place.
 */
function headingLinkInGutter(
  editor: Editor,
  heading: HTMLElement,
  coarse: boolean,
): boolean {
  if (coarse) return false;
  const frame = handleFrame(editor);
  if (!frame) return true;
  // A marked heading's dot sits between the link and the grip.
  const marker = heading.querySelector('[data-slot="text-edit-section-mark"]')
    ? 24
    : 0;
  return (
    heading.getBoundingClientRect().left -
      HEADING_LINK_GUTTER -
      marker -
      HANDLE_GUTTER >=
    frame.getBoundingClientRect().left + FRAME_INSET
  );
}

/**
 * The `#` copy-link button for the hovered heading, or the caret's (works read-only too): one
 * floating button in the gutter just before the heading's first line, so nothing is decorated per
 * heading on every change and the text never moves — after the heading's text on a coarse
 * pointer, where a narrow screen has no gutter. The block grip moves further out beside it
 * (`BlockHandle`). A press copies the absolute link and confirms in a toast.
 */
function HeadingLink({
  editor,
  href,
}: {
  editor: Editor;
  href: (anchor: TextEditHeadingAnchor) => string | null;
}) {
  const hover = useHover<number>((a, b) => a === b);
  const [caret, setCaret] = React.useState<number | null>(null);
  // While the page scrolls the link hides (a hover under a still pointer would otherwise ride
  // along with a heading the pointer has left); it comes back a beat after the scroll ends.
  const [scrolling, setScrolling] = React.useState(false);
  const [, redraw] = React.useReducer((n: number) => n + 1, 0);
  const coarse = useCoarsePointer();

  React.useEffect(() => {
    const dom = editor.view.dom;
    const headingPos = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const heading = target.closest("h1,h2,h3,h4,h5,h6");
      if (!heading || !dom.contains(heading)) return null;
      const pos = editor.view.posAtDOM(heading, 0) - 1;
      return editor.state.doc.nodeAt(pos)?.type.name === "heading" ? pos : null;
    };
    const onMove = (event: MouseEvent) => {
      const pos = headingPos(event.target);
      if (pos !== null) hover.show(pos);
      else hover.hideSoon();
    };
    const onSelection = () => {
      const { $from } = editor.state.selection;
      setCaret(
        editor.isFocused && $from.parent.type.name === "heading"
          ? $from.before()
          : null,
      );
    };
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      setScrolling(true);
      clearTimeout(settle);
      settle = setTimeout(() => setScrolling(false), 150);
    };
    // The text changed (a collaborator's edit, an embed, typing in the heading): a hovered
    // position may name another block now, so the hover is dropped until the pointer moves; the
    // caret's heading is re-read, and the link redraws — its label, its URL and, after the text
    // on a coarse pointer, its place follow the heading's new text.
    const onChange = ({ transaction }: { transaction: Transaction }) => {
      if (!transaction.docChanged) return;
      hover.show(null);
      onSelection();
      redraw();
    };
    editor.on("transaction", onChange);
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", hover.hideSoon);
    editor.on("selectionUpdate", onSelection);
    editor.on("focus", onSelection);
    editor.on("blur", onSelection);
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      clearTimeout(settle);
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", hover.hideSoon);
      editor.off("selectionUpdate", onSelection);
      editor.off("focus", onSelection);
      editor.off("blur", onSelection);
      window.removeEventListener("scroll", onScroll, { capture: true });
      editor.off("transaction", onChange);
    };
  }, [editor, hover.show, hover.hideSoon]);

  const shown = scrolling ? null : (hover.value ?? caret);
  // While it shows, the link follows its heading wherever the page moves it — a banner or an
  // image arriving above, the margin opening, a resize — never left at stale coordinates.
  const placed = React.useRef("");
  React.useEffect(() => {
    if (shown === null) return;
    let frame = requestAnimationFrame(function follow() {
      const dom = editor.isDestroyed ? null : editor.view.nodeDOM(shown);
      if (dom instanceof HTMLElement) {
        const box = dom.getBoundingClientRect();
        const key = `${box.left},${box.top},${box.width},${box.height}`;
        if (key !== placed.current) {
          placed.current = key;
          redraw();
        }
      }
      frame = requestAnimationFrame(follow);
    });
    return () => cancelAnimationFrame(frame);
  }, [editor, shown]);

  const pos = shown;
  if (pos === null || editor.isDestroyed) return null;
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== "heading" || node.content.size === 0) return null;
  const anchor = headingAnchorAt(editor.state.doc, pos);
  const link = anchor ? href(anchor) : null;
  if (!link) return null;
  const dom = editor.view.nodeDOM(pos);
  if (!(dom instanceof HTMLElement)) return null;
  const box = dom.getBoundingClientRect();
  const size = HEADING_LINK_SIZE;
  // The first line's middle (the gutter) or, without room there, the end of the last line.
  const gutter = headingLinkInGutter(editor, dom, coarse);
  const line = editor.view.coordsAtPos(
    gutter ? pos + 1 : pos + node.nodeSize - 1,
  );
  const left = gutter
    ? box.left - HEADING_LINK_GUTTER
    : Math.min(line.right + 4, box.right - size);
  return (
    <FloatingLayer>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        data-slot="text-edit-heading-link"
        aria-label={`Copy link to “${node.textContent}”`}
        title="Copy link"
        onMouseEnter={hover.keep}
        onMouseLeave={hover.hideSoon}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          void copyWithToast(
            new URL(link, window.location.href).href,
            "Link copied",
          )
        }
        style={{
          position: "fixed",
          left,
          top: (line.top + line.bottom) / 2 - size / 2,
        }}
        className={cn("z-50", headingLinkClassName)}
      >
        <Hash aria-hidden />
      </Button>
    </FloatingLayer>
  );
}

/* --- linked task items (J9) ---------------------------------------------------------------------*/

/**
 * Marks a transaction this editor makes for the host (`linkTaskItems`, `setTaskItemChecked`): it
 * is never reported as a person's toggle (`onTaskItemToggle`).
 */
const TASK_SYNC_META = "textEditTaskSync";

/** The trimmed text of a task item's own line (its first paragraph). */
function taskItemText(node: PMNode): string {
  const line = node.firstChild;
  return line?.isTextblock ? line.textContent.trim() : "";
}

/** An unlinked checklist line Make task acts on: where it is and its text. */
interface OfferedLine {
  pos: number;
  text: string;
}

/**
 * The unlinked checklist lines Make task acts on from `block`: every unlinked, non-empty task item
 * whose line the selection reaches when the selection covers the block, else the block alone.
 * Empty when the block is not an unlinked task item with text.
 */
function makeTaskItems(state: EditorState, block: LiveBlock): OfferedLine[] {
  const { node, pos, range } = block;
  if (node.type.name !== "taskItem" || linkedTaskId(node) !== null) return [];
  const end = pos + node.nodeSize;
  const size = state.doc.content.size;
  if (
    range &&
    range.to > range.from &&
    range.from < end &&
    range.to > pos &&
    range.to <= size
  ) {
    const items: OfferedLine[] = [];
    state.doc.nodesBetween(range.from, range.to, (child, at) => {
      if (child.isTextblock) return false;
      if (child.type.name !== "taskItem") return true;
      // Only the lines the selection reaches into: a parent item whose nested line is selected
      // is not one.
      const lineEnd = at + 1 + (child.firstChild?.nodeSize ?? 0);
      if (range.from < lineEnd && range.to > at + 1 && !linkedTaskId(child)) {
        const text = taskItemText(child);
        if (text) items.push({ pos: at, text });
      }
      return true;
    });
    if (items.some((item) => item.pos === pos)) return items;
  }
  const text = taskItemText(node);
  return text ? [{ pos, text }] : [];
}

/** The position in `line` after `offset` characters of its text (atoms count as none). */
function lineOffsetToPos(line: PMNode, offset: number): number {
  let left = offset;
  let at = 0;
  for (let index = 0; index < line.childCount; index++) {
    const child = line.child(index);
    const length = child.isText ? (child.text ?? "").length : 0;
    if (left <= length) return at + left;
    left -= length;
    at += child.nodeSize;
  }
  return at;
}

/**
 * The lines Make task offered (`onMakeTask`), by `blockId` → the text offered. A line keeps its
 * `blockId` through every edit and through Yjs, so the offer follows it however the document
 * moves while the host works (a dialog); a deleted line is gone, never mistaken for another.
 */
const TASK_OFFERS_KEY = new PluginKey<ReadonlyMap<string, string>>(
  "textEditTaskOffers",
);
/** Offers kept for a host that never links them: the oldest go first. */
const TASK_OFFERS_MAX = 200;

function taskOffersExtension() {
  return Extension.create({
    name: "textEditTaskOffers",
    addProseMirrorPlugins() {
      return [
        new Plugin<ReadonlyMap<string, string>>({
          key: TASK_OFFERS_KEY,
          state: {
            init: () => new Map(),
            apply(tr, offers) {
              const meta = tr.getMeta(TASK_OFFERS_KEY) as
                | { offer?: readonly TextEditTaskItem[]; drop?: string[] }
                | undefined;
              if (!meta) return offers;
              const next = new Map(offers);
              for (const key of meta.drop ?? []) next.delete(key);
              for (const item of meta.offer ?? []) {
                next.delete(item.key);
                next.set(item.key, item.text);
              }
              for (const key of next.keys()) {
                if (next.size <= TASK_OFFERS_MAX) break;
                next.delete(key);
              }
              return next;
            },
          },
          props: {
            // A pasted or dropped line is a new line: it never carries an identity (an offer, a
            // toggle's pairing). A collaborative editor's UniqueID gives it a fresh id; elsewhere
            // it has none. A drag is treated the same whether it ends as a move or a copy (the
            // modifier can change until the drop): a moved line's pending offer lapses, and its
            // later ticks pair by position.
            transformPasted: (slice) => withoutTaskItemIds(slice),
          },
        }),
      ];
    },
  });
}

/** `slice` with no `blockId` on its task items. */
function withoutTaskItemIds(slice: Slice): Slice {
  const strip = (fragment: Fragment): Fragment => {
    const nodes: PMNode[] = [];
    fragment.forEach((node) => {
      if (node.isText || node.isLeaf) {
        nodes.push(node);
        return;
      }
      const content = strip(node.content);
      nodes.push(
        node.type.name === "taskItem" && node.attrs.blockId
          ? node.type.create(
              { ...node.attrs, blockId: null },
              content,
              node.marks,
            )
          : node.copy(content),
      );
    });
    return Fragment.from(nodes);
  };
  return new Slice(strip(slice.content), slice.openStart, slice.openEnd);
}

/** Every task item's position by `blockId`, and the ids more than one item carries. */
function taskItemsById(doc: PMNode) {
  const byId = new Map<string, number>();
  const shared = new Set<string>();
  doc.descendants((node, pos) => {
    if (node.isTextblock) return false;
    const id = node.attrs.blockId as string | null | undefined;
    if (node.type.name === "taskItem" && id) {
      if (byId.has(id)) shared.add(id);
      byId.set(id, pos);
    }
    return true;
  });
  return { byId, shared };
}

/**
 * Offer Make task's lines: each gets a `blockId` if it has none (or shares one with another line,
 * as a pasted copy in a document without ids does), in one transaction that is no undo step, and
 * is recorded so `linkTaskItems` can find it by that key after any later edit.
 */
function offerTaskItems(
  editor: Editor,
  lines: readonly OfferedLine[],
): TextEditTaskItem[] {
  const { state } = editor;
  const { shared } = taskItemsById(state.doc);
  const tr = state.tr;
  const items: TextEditTaskItem[] = [];
  for (const line of lines) {
    const node = state.doc.nodeAt(line.pos);
    if (!node || node.type.name !== "taskItem") continue;
    let key = node.attrs.blockId as string | null | undefined;
    if (!key || shared.has(key)) {
      key = newBlockId();
      tr.setNodeAttribute(line.pos, "blockId", key);
    }
    items.push({ key, text: line.text });
  }
  editor.view.dispatch(
    tr
      .setMeta(TASK_OFFERS_KEY, { offer: items })
      .setMeta(TASK_SYNC_META, true)
      .setMeta("addToHistory", false),
  );
  return items;
}

/**
 * Where the line Make task offered as `key` is now: the one task item with that `blockId`, still
 * unlinked and with the text it was offered with; else null (a line removed, edited or linked
 * since, or never offered, is never linked).
 */
function offeredTaskItem(
  doc: PMNode,
  offers: ReadonlyMap<string, string>,
  items: ReturnType<typeof taskItemsById>,
  key: string,
): number | null {
  const text = offers.get(key);
  const pos = items.byId.get(key);
  if (text === undefined || pos === undefined || items.shared.has(key))
    return null;
  const node = doc.nodeAt(pos);
  return node && !linkedTaskId(node) && taskItemText(node) === text
    ? pos
    : null;
}

/**
 * What stays after a linked line's chip. A leading plain-text title (the line `onMakeTask`
 * offered) is dropped, what follows it staying; otherwise the whole line stays, a space after the
 * chip — a mention or other atom on the line, and the text after it, is never dropped.
 */
function lineAfterTitle(line: PMNode, label: string): Fragment {
  // Only the line's leading run of plain text can be the title.
  let plain = "";
  for (let index = 0; index < line.childCount; index++) {
    const child = line.child(index);
    if (!child.isText) break;
    plain += child.text ?? "";
  }
  const lead = plain.length - plain.trimStart().length;
  // The rest after the title, from a word boundary ("Order glass — Friday").
  const rest = plain.slice(lead + label.length);
  if (
    label &&
    plain.slice(lead).startsWith(label) &&
    (rest === "" || /^[\s\p{P}]/u.test(rest))
  )
    return line.content.cut(lineOffsetToPos(line, lead + label.length));
  const first = line.firstChild;
  if (!first || (first.isText && /^\s/.test(first.text ?? "")))
    return line.content;
  return Fragment.from(line.type.schema.text(" ")).append(line.content);
}

/**
 * Link checklist lines to tasks (`linkTaskItems`): each line Make task offered (found by its
 * `blockId`, `offeredTaskItem`) becomes a leading task chip and what `lineAfterTitle` keeps. A
 * line removed, edited or linked since, or never offered, is skipped. Nested content stays.
 */
function linkTaskItemsIn(
  editor: Editor,
  links: readonly TextEditTaskLink[],
  collaborative: boolean,
): number {
  const { state } = editor;
  const { mention } = state.schema.nodes;
  const offers = TASK_OFFERS_KEY.getState(state);
  if (!mention || !offers) return 0;
  const items = taskItemsById(state.doc);
  const targets = new Map<number, TextEditTaskLink>();
  for (const link of links) {
    if (!link.id) continue;
    const at = offeredTaskItem(state.doc, offers, items, link.key);
    if (at !== null && !targets.has(at)) targets.set(at, link);
  }
  const tr = state.tr;
  let linked = 0;
  for (const [at, link] of [...targets].sort((a, b) => a[0] - b[0])) {
    const pos = tr.mapping.map(at);
    const node = tr.doc.nodeAt(pos);
    if (!node || node.type.name !== "taskItem" || linkedTaskId(node)) continue;
    const line = node.firstChild;
    if (!line || line.type.name !== "paragraph") continue;
    const label = link.label.replace(/\s*\n\s*/g, " ").trim();
    const chip = mention.create({
      kind: "task",
      id: link.id,
      // A shared document never stores a record's title (`recordLabelsStripped`).
      label: collaborative ? "" : label,
    });
    const start = pos + 2;
    tr.replaceWith(
      start,
      start + line.content.size,
      Fragment.from(chip).append(lineAfterTitle(line, label)),
    );
    linked++;
  }
  if (linked)
    editor.view.dispatch(
      tr.setMeta(TASK_SYNC_META, true).setMeta(TASK_OFFERS_KEY, {
        drop: [...targets.values()].map((link) => link.key),
      }),
    );
  return linked;
}

/** Tick or untick every line linked to `taskId` (`setTaskItemChecked`): not an undo step. */
function setLinkedTaskChecked(
  editor: Editor,
  taskId: string,
  checked: boolean,
): number {
  const { state } = editor;
  const tr = state.tr;
  let changed = 0;
  state.doc.descendants((node, pos) => {
    if (node.isTextblock) return false;
    if (
      node.type.name === "taskItem" &&
      Boolean(node.attrs.checked) !== checked &&
      linkedTaskId(node) === taskId
    ) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked });
      changed++;
    }
    return true;
  });
  if (changed)
    editor.view.dispatch(
      tr.setMeta(TASK_SYNC_META, true).setMeta("addToHistory", false),
    );
  return changed;
}

/** Each step's changed ranges: in the document before it, and in the one after it. */
function forEachStepRange(
  tr: Transaction,
  visit: (
    before: PMNode,
    from: number,
    to: number,
    after: PMNode,
    newFrom: number,
    newTo: number,
  ) => void,
) {
  tr.steps.forEach((step, index) => {
    const before = tr.docs[index]!;
    const after = tr.docs[index + 1] ?? tr.doc;
    let any = false;
    step.getMap().forEach((from, to, newFrom, newTo) => {
      any = true;
      visit(before, from, to, after, newFrom, newTo);
    });
    // An attribute step changes no range: the node at its position is the change.
    const at = (step as { pos?: unknown }).pos;
    if (!any && typeof at === "number")
      visit(before, at, at + 1, after, at, at + 1);
  });
}

/** A linked line a step's range reaches: its task, box and `blockId`, and where it starts. */
interface LinkedLine {
  pos: number;
  taskId: string;
  checked: boolean;
  blockId: string | null;
}

/** The linked lines between `from` and `to` (and their ancestors). */
function linkedLines(doc: PMNode, from: number, to: number): LinkedLine[] {
  const lines: LinkedLine[] = [];
  const size = doc.content.size;
  doc.nodesBetween(
    Math.max(0, Math.min(from, size)),
    Math.max(0, Math.min(to, size)),
    (node, pos) => {
      if (node.isTextblock) return false;
      if (node.type.name !== "taskItem") return true;
      const taskId = linkedTaskId(node);
      if (taskId)
        lines.push({
          pos,
          taskId,
          checked: Boolean(node.attrs.checked),
          blockId: (node.attrs.blockId as string | null | undefined) ?? null,
        });
      return true;
    },
  );
  return lines;
}

/** How many of `lines` carry each `blockId`. */
function idCounts(lines: readonly LinkedLine[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines)
    if (line.blockId)
      counts.set(line.blockId, (counts.get(line.blockId) ?? 0) + 1);
  return counts;
}

/**
 * The linked lines `tr` ticked or unticked, by task id → checked: the same line before and after
 * a step, with the same task and a different box. The same line is the one `blockId` (unique on
 * each side), or — for lines without one — the line whose inside survives the step's mapping. A
 * pasted line (its copied id is cleared, `withoutTaskItemIds`), a deleted or newly linked one is
 * never a toggle.
 */
function taskToggles(tr: Transaction): Map<string, boolean> {
  const toggles = new Map<string, boolean>();
  tr.steps.forEach((step, index) => {
    const before = tr.docs[index]!;
    const after = tr.docs[index + 1] ?? tr.doc;
    const map = step.getMap();
    const ranges: [number, number, number, number][] = [];
    map.forEach((from, to, newFrom, newTo) =>
      ranges.push([from, to, newFrom, newTo]),
    );
    // An attribute step changes no range: the node at its position is the change.
    const at = (step as { pos?: unknown }).pos;
    if (ranges.length === 0 && typeof at === "number")
      ranges.push([at, at + 1, at, at + 1]);
    for (const [from, to, newFrom, newTo] of ranges) {
      const now = linkedLines(after, newFrom, newTo);
      const was = linkedLines(before, from, to);
      const nowIds = idCounts(now);
      const wasIds = idCounts(was);
      for (const old of was) {
        let next: LinkedLine | undefined;
        if (old.blockId) {
          if (nowIds.get(old.blockId) !== 1 || wasIds.get(old.blockId) !== 1)
            continue;
          next = now.find((line) => line.blockId === old.blockId);
        } else {
          const inside = map.mapResult(old.pos + 1, 1);
          if (inside.deleted) continue;
          next = now.find(
            (line) => line.blockId === null && line.pos === inside.pos - 1,
          );
        }
        if (next && next.taskId === old.taskId && next.checked !== old.checked)
          toggles.set(old.taskId, next.checked);
      }
    }
  });
  return toggles;
}

/** Whether `tr` was this person's own edit: not a collaborator's, not a value sync or task sync. */
function isOwnEdit(tr: Transaction): boolean {
  if (
    !tr.docChanged ||
    tr.getMeta(TASK_SYNC_META) ||
    tr.getMeta("preventUpdate")
  )
    return false;
  if (!isChangeOrigin(tr)) return true;
  // A shared document's undo and redo come back through Yjs, but they are this person's own.
  return Boolean(
    (
      tr.getMeta(ySyncPluginKey) as
        { isUndoRedoOperation?: boolean } | undefined
    )?.isUndoRedoOperation,
  );
}

/* --- section marks (J1/J3) ----------------------------------------------------------------------*/

const SECTION_MARKS_KEY = new PluginKey<SectionMarksState>(
  "textEditSectionMarks",
);

interface SectionMarksState {
  marks: readonly TextEditSectionMark[];
  set: DecorationSet;
}

/** The marker widget's DOM: a button named by the mark, calling `onMark` on a click. */
function sectionMarker(
  mark: TextEditSectionMark,
  onMark: (key: string) => void,
) {
  return () => {
    const button = document.createElement("button");
    button.type = "button";
    button.contentEditable = "false";
    button.dataset.slot = "text-edit-section-mark";
    button.dataset.tone = mark.tone;
    button.className = sectionMarkClassNames.marker;
    button.title = mark.label;
    button.setAttribute("aria-label", mark.label);
    const dot = document.createElement("span");
    dot.className = sectionMarkClassNames.dot[mark.tone];
    dot.setAttribute("aria-hidden", "true");
    button.append(dot);
    // The caret stays where it was; the click is the marker's.
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onMark(mark.key);
    });
    return button;
  };
}

/**
 * The marks' decorations over the document's top-level blocks: each marked `#`–`###` heading (by
 * `blockId`) gets the marker and its bar, and every block up to the next `#`–`###` heading, of
 * any level, the bar too (`sectionHeading`: sections are flat, so marks never nest).
 */
function sectionDecorations(
  doc: PMNode,
  marks: readonly TextEditSectionMark[],
  onMark: (key: string) => void,
): DecorationSet {
  if (marks.length === 0) return DecorationSet.empty;
  const byKey = new Map(marks.map((mark) => [mark.key, mark]));
  // Sections are a flat partition: each `#`–`###` heading starts one, which runs to the next
  // such heading whatever its level (a `####` and deeper is a block of its section).
  let current: TextEditSectionMark | null = null;
  const decorations: PMDecoration[] = [];
  doc.forEach((node, pos) => {
    if (node.type.name === "heading" && sectionHeading(node.attrs.level)) {
      const id = node.attrs.blockId as string | null | undefined;
      current = (id ? byKey.get(id) : undefined) ?? null;
      if (current)
        decorations.push(
          PMDecoration.node(pos, pos + node.nodeSize, {
            class: sectionMarkClassNames.heading[current.tone],
            "data-section-mark": current.tone,
          }),
          PMDecoration.widget(pos + 1, sectionMarker(current, onMark), {
            side: -1,
            ignoreSelection: true,
            stopEvent: () => true,
            key: `section-mark:${current.key}:${current.tone}:${current.label}`,
          }),
        );
      return;
    }
    if (current)
      decorations.push(
        PMDecoration.node(pos, pos + node.nodeSize, {
          class: sectionMarkClassNames.block[current.tone],
          "data-section-mark": current.tone,
        }),
      );
  });
  return DecorationSet.create(doc, decorations);
}

/**
 * Whether `tr` changed the document's top-level structure — a block added, removed, replaced,
 * retyped or re-attributed — where a section boundary or a block's decoration may move. An edit
 * inside one top-level block is not.
 */
function touchesTopLevel(tr: Transaction): boolean {
  const inside = (doc: PMNode, from: number, to: number) => {
    const size = doc.content.size;
    const $from = doc.resolve(Math.max(0, Math.min(from, size)));
    const $to = doc.resolve(Math.max(0, Math.min(to, size)));
    return $from.depth > 0 && $to.depth > 0 && $from.index(0) === $to.index(0);
  };
  let found = false;
  forEachStepRange(tr, (before, from, to, after, newFrom, newTo) => {
    if (!found && (!inside(before, from, to) || !inside(after, newFrom, newTo)))
      found = true;
  });
  return found;
}

/**
 * Section marks (`sectionMarks`) as decorations: nothing is written to the document. They are
 * rebuilt when the marks change or an edit changes the top-level structure (`touchesTopLevel`);
 * an edit inside one block maps them.
 */
function sectionMarksExtension(onMark: (key: string) => void) {
  return Extension.create({
    name: "textEditSectionMarks",
    addProseMirrorPlugins() {
      return [
        new Plugin<SectionMarksState>({
          key: SECTION_MARKS_KEY,
          state: {
            init: () => ({ marks: [], set: DecorationSet.empty }),
            apply(tr, previous, _oldState, newState) {
              const marks = tr.getMeta(SECTION_MARKS_KEY) as
                readonly TextEditSectionMark[] | undefined;
              if (marks)
                return {
                  marks,
                  set: sectionDecorations(newState.doc, marks, onMark),
                };
              if (!tr.docChanged || previous.marks.length === 0)
                return previous;
              if (touchesTopLevel(tr))
                return {
                  marks: previous.marks,
                  set: sectionDecorations(newState.doc, previous.marks, onMark),
                };
              return {
                marks: previous.marks,
                set: previous.set.map(tr.mapping, tr.doc),
              };
            },
          },
          props: {
            decorations: (state) => SECTION_MARKS_KEY.getState(state)?.set,
          },
        }),
      ];
    },
  });
}

/* --- block menu (B2) ---------------------------------------------------------------------------*/

/** The block a handle or ⇧F10 menu acts on. */
interface BlockTarget {
  pos: number;
  node: PMNode;
  dom: HTMLElement;
  /** The selection when the menu opened: Make task acts on every checklist line it reaches. */
  range?: { from: number; to: number };
}

/** A block as it is now: where it starts, the node, and the selection the menu opened with. */
type LiveBlock = Pick<BlockTarget, "pos" | "node" | "range">;

/**
 * The block menu's block, held while the menu is open (`holdPosition`): a collaborator may edit
 * meanwhile, so every action reads the block as it is when it runs, never where it was.
 */
interface MenuBlock extends BlockTarget {
  /** The block now; null once it is gone (deleted, or replaced by another type). */
  live: () => LiveBlock | null;
  release: () => void;
}

function holdBlock(editor: Editor, block: BlockTarget): MenuBlock {
  const at = holdPosition(editor, block.pos, true);
  const from = block.range ? holdPosition(editor, block.range.from) : null;
  const to = block.range ? holdPosition(editor, block.range.to) : null;
  return {
    ...block,
    live: () => {
      const pos = at.get();
      const node = pos === null ? null : editor.state.doc.nodeAt(pos);
      if (pos === null || !node) return null;
      const start = from?.get() ?? null;
      const end = to?.get() ?? null;
      return {
        pos,
        node,
        ...(start !== null && end !== null
          ? { range: { from: start, to: end } }
          : {}),
      };
    },
    release: () => {
      at.release();
      from?.release();
      to?.release();
    },
  };
}

const BLOCK_CHANGED = "That block changed meanwhile. Try again.";

/** `action` on the menu's block as it is when it runs; a block gone meanwhile says so instead. */
function onLiveBlock(block: MenuBlock, action: (now: LiveBlock) => void) {
  return () => {
    const now = block.live();
    if (now) action(now);
    else toast.add({ title: BLOCK_CHANGED });
  };
}

/** What the block menu needs from the editor beyond the block itself. */
interface BlockMenuRuntime {
  /** `headingLinkHref`: a heading's Copy link. */
  headingLink: (pos: number) => string | null;
  /** `onMakeTask`: Make task on an unlinked checklist line. */
  makeTask: () => ((items: TextEditTaskItem[]) => void) | undefined;
}

/** A block kind the block menu marks as current: the turn-into kinds, a callout or a toggle. */
type BlockKind = (typeof BLOCK_TYPES)[number]["id"] | "callout" | "toggle";

/** The kind of the block at `node` — a callout or toggle by its wrapper, else as Turn into names it. */
function blockKind(node: PMNode): BlockKind | null {
  switch (node.type.name) {
    case "paragraph":
      return "text";
    case "heading":
      return `h${Math.min(4, Math.max(1, Number(node.attrs.level) || 1))}` as BlockKind;
    case "codeBlock":
      return node.attrs.language === "mermaid" ? "diagram" : "codeBlock";
    case "blockquote":
      return "blockquote";
    case "callout":
      return "callout";
    case "toggle":
      return "toggle";
    case "listItem":
      return null;
    case "taskItem":
      return "taskList";
    case "bulletList":
      return "bulletList";
    case "orderedList":
      return "orderedList";
    case "taskList":
      return "taskList";
    default:
      return null;
  }
}

/** Blocks Turn into applies to: text, headings, lists and their items, quotes, code, callouts, toggles. */
const TURNABLE = new Set([
  "paragraph",
  "heading",
  "codeBlock",
  "blockquote",
  "callout",
  "toggle",
  "listItem",
  "taskItem",
  "bulletList",
  "orderedList",
  "taskList",
]);

/** A copy of `node` with no block ids, so the duplicate gets its own (UniqueID assigns them). */
function withoutBlockIds(node: PMNode): PMNode {
  if (node.isText) return node;
  const content: PMNode[] = [];
  node.forEach((child) => content.push(withoutBlockIds(child)));
  const attrs =
    "blockId" in node.attrs ? { ...node.attrs, blockId: null } : node.attrs;
  return node.type.create(attrs, Fragment.from(content), node.marks);
}

/** Put the caret at the start of the block at `pos`, so a command for "the caret's block" acts on it. */
function caretInto(editor: Editor, pos: number) {
  const { state } = editor;
  const at = Math.min(pos + 1, state.doc.content.size);
  editor.view.dispatch(
    state.tr.setSelection(TextSelection.near(state.doc.resolve(at))),
  );
}

/** Duplicate the block at `pos` right after it (⌘D), the caret moving into the copy. */
function duplicateBlock(editor: Editor, pos: number): boolean {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return false;
  const at = pos + node.nodeSize;
  const tr = editor.state.tr.insert(at, withoutBlockIds(node));
  tr.setSelection(TextSelection.near(tr.doc.resolve(at + 1)));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

/** ⌘D: duplicate the caret's block. */
function duplicateCaretBlock(editor: Editor): boolean {
  const pos = caretBlockPos(editor.state);
  return pos === null ? false : duplicateBlock(editor, pos);
}

/**
 * Turn the block at `pos` into a toggle: a paragraph or heading's text becomes the toggle's title
 * with an empty body below it; anything else gets an empty toggle after it.
 */
function turnIntoToggle(editor: Editor, pos: number) {
  const { state } = editor;
  const node = state.doc.nodeAt(pos);
  const { toggle, toggleSummary, paragraph } = state.schema.nodes;
  if (!node || !toggle || !toggleSummary || !paragraph) return;
  if (node.type.name === "toggle") return;
  if (node.type.name === "paragraph" || node.type.name === "heading") {
    const created = toggle.create(null, [
      toggleSummary.create(null, node.content),
      paragraph.create(),
    ]);
    const tr = state.tr.replaceWith(pos, pos + node.nodeSize, created);
    tr.setSelection(TextSelection.create(tr.doc, pos + 2 + node.content.size));
    editor.view.dispatch(tr.scrollIntoView());
    return;
  }
  caretInto(editor, pos);
  insertToggle(editor);
}

/** Turn the block at `pos` into a callout of `tone` (or retone the callout it is). */
function turnIntoCallout(editor: Editor, pos: number, tone: CalloutTone) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  if (node.type.name === "callout") {
    editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, "tone", tone));
    return;
  }
  caretInto(editor, pos);
  editor.chain().focus().wrapIn("callout", { tone }).run();
}

/** The block at `pos` as Markdown (Copy as Markdown). */
function blockMarkdown(editor: Editor, node: PMNode): string {
  const manager = editor.markdown;
  if (!manager) return node.textContent;
  return manager
    .serialize({ type: "doc", content: [node.toJSON() as JSONContent] })
    .trim();
}

interface BlockAction {
  key: string;
  label: string;
  icon: React.ComponentType;
  run: () => void;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  /** A check item: shown with its state. */
  checked?: boolean;
}

/**
 * The menu's actions for `block`, in order; `null` marks the separator before Delete. What it
 * shows is the block as the menu opened; what it does reads the block as it is then (`live`).
 */
function blockActions(
  editor: Editor,
  block: MenuBlock,
  runtime: BlockMenuRuntime,
): (BlockAction | null)[] {
  const { pos, node } = block;
  const { index, siblings } = siblingsOf(editor.view, pos);
  const link = node.type.name === "heading" ? runtime.headingLink(pos) : null;
  const makeTask = runtime.makeTask();
  const tasks =
    makeTask && editor.isEditable ? makeTaskItems(editor.state, block) : [];
  const live = (action: (now: LiveBlock) => void) => onLiveBlock(block, action);
  /** Move the block `step` slots among its siblings, as they are now. */
  const move = (step: -1 | 1) =>
    live((now) => {
      const at = siblingsOf(editor.view, now.pos).index;
      moveNodeTo(editor.view, now.pos, step < 0 ? at - 1 : at + 2);
    });
  const actions: (BlockAction | null)[] = [];
  if (makeTask && tasks.length > 0)
    actions.push(
      {
        key: "make-task",
        label: tasks.length > 1 ? `Make ${tasks.length} tasks` : "Make task",
        icon: CircleCheck,
        run: live((now) => {
          const lines = makeTaskItems(editor.state, now);
          if (lines.length > 0) makeTask(offerTaskItems(editor, lines));
        }),
      },
      null,
    );
  actions.push({
    key: "duplicate",
    label: "Duplicate",
    icon: CopyPlus,
    shortcut: "⌘D",
    run: live((now) => duplicateBlock(editor, now.pos)),
  });
  if (link)
    actions.push({
      key: "link",
      label: "Copy link",
      icon: LinkIcon,
      run: () =>
        void copyWithToast(
          new URL(link, window.location.href).href,
          "Link copied",
        ),
    });
  actions.push(
    {
      key: "markdown",
      label: "Copy as Markdown",
      icon: FileCode,
      run: live(
        (now) =>
          void copyWithToast(
            blockMarkdown(editor, now.node),
            "Copied as Markdown",
          ),
      ),
    },
    {
      key: "up",
      label: "Move up",
      icon: ArrowUp,
      shortcut: "⌘⇧↑",
      disabled: index === 0,
      run: move(-1),
    },
    {
      key: "down",
      label: "Move down",
      icon: ArrowDown,
      shortcut: "⌘⇧↓",
      disabled: index >= siblings.length - 1,
      run: move(1),
    },
  );
  if (node.type.name === "toggle")
    actions.push({
      key: "open",
      label: "Open by default",
      icon: ListCollapse,
      checked: node.attrs.open !== false,
      run: live((now) =>
        editor.view.dispatch(
          editor.state.tr.setNodeAttribute(
            now.pos,
            "open",
            now.node.attrs.open === false,
          ),
        ),
      ),
    });
  actions.push(null, {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    shortcut: "⌫",
    destructive: true,
    run: live((now) => {
      const tr = editor.state.tr.delete(now.pos, now.pos + now.node.nodeSize);
      editor.view.dispatch(tr.scrollIntoView());
      editor.commands.focus();
    }),
  });
  return actions;
}

/** The Turn into choices for `block`: the block types, then a callout (by tone) and a toggle. */
function turnIntoChoices(editor: Editor, block: MenuBlock) {
  const current = blockKind(block.node);
  const live = (action: (now: LiveBlock) => void) => onLiveBlock(block, action);
  return {
    current,
    // Diagram only while the host draws ```mermaid (`blockViews.mermaid`).
    types: BLOCK_TYPES.filter(
      (type) => type.id !== "diagram" || blockViewOf(editor, "mermaid"),
    ).map((type) => ({
      key: type.id,
      label: type.label,
      icon: type.icon as React.ComponentType,
      run: live((now) => {
        caretInto(editor, now.pos);
        type.run(editor);
      }),
    })),
    tones: CALLOUT_TONES.map((tone) => ({
      key: tone,
      label: CALLOUT_STYLE[tone].label,
      icon: CALLOUT_STYLE[tone].icon as React.ComponentType,
      run: live((now) => turnIntoCallout(editor, now.pos, tone)),
    })),
    toggle: live((now) => turnIntoToggle(editor, now.pos)),
  };
}

/**
 * The block menu (B2) as a dropdown: opened by the block handle (a click, no drag) or ⇧F10 /
 * the context-menu key for the caret's block. Turn into ▸ (with Callout ▸ by tone, and Toggle),
 * Duplicate, Copy link (headings), Copy as Markdown, Move up / down, Open by default (toggles), Delete.
 */
function BlockMenuItems({
  editor,
  block,
  runtime,
}: {
  editor: Editor;
  block: MenuBlock;
  runtime: BlockMenuRuntime;
}) {
  const turnable = TURNABLE.has(block.node.type.name);
  const choices = turnable ? turnIntoChoices(editor, block) : null;
  return (
    <>
      {choices ? (
        <>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Repeat2 />
              Turn into
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              data-text-edit-menu=""
              aria-label="Turn into"
              className="w-auto min-w-48"
            >
              {choices.types.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type.key}
                  checked={choices.current === type.key}
                  // A choice made: the menu closes (its block is rebuilt as the new type).
                  closeOnClick
                  onClick={type.run}
                >
                  <type.icon />
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Info />
                  Callout
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  data-text-edit-menu=""
                  aria-label="Callout"
                  className="w-auto min-w-40"
                >
                  {choices.tones.map((tone) => (
                    <DropdownMenuCheckboxItem
                      key={tone.key}
                      checked={
                        choices.current === "callout" &&
                        block.node.attrs.tone === tone.key
                      }
                      closeOnClick
                      onClick={tone.run}
                    >
                      <tone.icon />
                      {tone.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuCheckboxItem
                checked={choices.current === "toggle"}
                closeOnClick
                onClick={choices.toggle}
              >
                <ListCollapse />
                Toggle
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
        </>
      ) : null}
      {blockActions(editor, block, runtime).map((action, index) =>
        action === null ? (
          <DropdownMenuSeparator key={`separator-${index}`} />
        ) : action.checked !== undefined ? (
          <DropdownMenuCheckboxItem
            key={action.key}
            checked={action.checked}
            disabled={action.disabled}
            onClick={action.run}
          >
            <action.icon />
            {action.label}
          </DropdownMenuCheckboxItem>
        ) : (
          <DropdownMenuItem
            key={action.key}
            disabled={action.disabled}
            variant={action.destructive ? "destructive" : "default"}
            onClick={action.run}
          >
            <action.icon />
            {action.label}
            {action.shortcut ? (
              <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
            ) : null}
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}

/** The block menu on a coarse pointer: a bottom sheet with 44px rows; Turn into is a second page. */
function BlockMenuSheet({
  editor,
  block,
  runtime,
  onClose,
}: {
  editor: Editor;
  block: MenuBlock | null;
  runtime: BlockMenuRuntime;
  onClose: () => void;
}) {
  const [page, setPage] = React.useState<"actions" | "turn" | "callout">(
    "actions",
  );
  const [shown, setShown] = React.useState(block);
  if (block !== shown) {
    setShown(block);
    setPage("actions");
  }
  // 44px rows, start-aligned: the sheet's menu items.
  const row =
    "h-auto min-h-11 w-full justify-start gap-3 px-3 text-start font-normal [&_svg]:text-muted-foreground";
  const act = (run: () => void) => () => {
    onClose();
    run();
  };
  const body = (() => {
    if (!block) return null;
    if (page === "actions") {
      const turnable = TURNABLE.has(block.node.type.name);
      return (
        <>
          {turnable ? (
            <Button
              variant="ghost"
              type="button"
              className={row}
              onClick={() => setPage("turn")}
            >
              <Repeat2 />
              <span className="flex-1">Turn into</span>
              <ChevronRight aria-hidden className="rtl:-scale-x-100" />
            </Button>
          ) : null}
          {blockActions(editor, block, runtime).map((action, index) =>
            action === null ? (
              <Separator key={`separator-${index}`} className="my-1" />
            ) : (
              <Button
                variant="ghost"
                key={action.key}
                type="button"
                className={cn(
                  row,
                  action.destructive &&
                    "text-destructive [&_svg]:text-destructive",
                )}
                disabled={action.disabled}
                aria-pressed={action.checked}
                onClick={act(action.run)}
              >
                <action.icon />
                <span className="flex-1">{action.label}</span>
                {action.checked ? <Check aria-hidden /> : null}
              </Button>
            ),
          )}
        </>
      );
    }
    const choices = turnIntoChoices(editor, block);
    if (page === "callout")
      return choices.tones.map((tone) => (
        <Button
          variant="ghost"
          key={tone.key}
          type="button"
          className={row}
          onClick={act(tone.run)}
        >
          <tone.icon />
          <span className="flex-1">{tone.label}</span>
        </Button>
      ));
    return (
      <>
        {choices.types.map((type) => (
          <Button
            variant="ghost"
            key={type.key}
            type="button"
            className={row}
            onClick={act(type.run)}
          >
            <type.icon />
            <span className="flex-1">{type.label}</span>
            {choices.current === type.key ? <Check aria-hidden /> : null}
          </Button>
        ))}
        <Button
          variant="ghost"
          type="button"
          className={row}
          onClick={() => setPage("callout")}
        >
          <Info />
          <span className="flex-1">Callout</span>
          <ChevronRight aria-hidden className="rtl:-scale-x-100" />
        </Button>
        <Button
          variant="ghost"
          type="button"
          className={row}
          onClick={act(choices.toggle)}
        >
          <ListCollapse />
          <span className="flex-1">Toggle</span>
          {choices.current === "toggle" ? <Check aria-hidden /> : null}
        </Button>
      </>
    );
  })();
  return (
    <Sheet open={block !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" data-text-edit-menu="" aria-label="Block">
        <SheetHeader>
          <SheetTitle>
            {page === "actions"
              ? "Block"
              : page === "turn"
                ? "Turn into"
                : "Callout"}
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-0.5 pb-4">{body}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/**
 * `block` as it is now, found again by its DOM (positions move with every edit since it was
 * taken, a collaborator's included); null once it is gone.
 */
function blockNow(editor: Editor, block: BlockTarget): BlockTarget | null {
  const { view } = editor;
  const { doc } = view.state;
  if (!block.dom.isConnected) return null;
  let inside: number;
  try {
    inside = view.posAtDOM(block.dom, 0);
  } catch {
    return null;
  }
  const $inside = doc.resolve(Math.min(Math.max(inside, 0), doc.content.size));
  const candidates = [inside - 1, inside];
  for (let depth = $inside.depth; depth > 0; depth--)
    candidates.push($inside.before(depth));
  for (const pos of candidates) {
    if (pos < 0 || pos >= doc.content.size || view.nodeDOM(pos) !== block.dom)
      continue;
    const node = doc.nodeAt(pos);
    // The selection it carried belongs to the document it was taken in: never kept.
    return node ? { dom: block.dom, pos, node } : null;
  }
  return null;
}

/** Whether the primary pointer is coarse (touch): the handle follows the caret, not the hover. */
function useCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia?.("(pointer: coarse)");
    if (!query) return;
    const update = () => setCoarse(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return coarse;
}

/** The block the caret is in, as the handle shows it (a table is its own controls' business). */
function caretBlock(editor: Editor): BlockTarget | null {
  const pos = caretBlockPos(editor.state);
  if (pos === null) return null;
  const node = editor.state.doc.nodeAt(pos);
  const dom = editor.view.nodeDOM(pos);
  if (!node || !(dom instanceof HTMLElement) || node.type.name === "table")
    return null;
  const { from, to } = editor.state.selection;
  return { pos, node, dom, range: { from, to } };
}

/**
 * The block handle: a ⋮⋮ grip beside the hovered block (on touch, the caret's block). Drag it to
 * move the block; click or tap it — or press <kbd>⇧F10</kbd> / the context-menu key — for the block
 * menu (a dropdown, or a bottom sheet on touch). On touch a drag starts after a 350ms hold.
 */
function BlockHandle({
  editor,
  runtime,
}: {
  editor: Editor;
  runtime: BlockMenuRuntime;
}) {
  const { value, show, hideSoon, keep, pinnedRef } = useHover<BlockTarget>(
    (a, b) => a.dom === b.dom && a.pos === b.pos,
  );
  const [line, setLine] = React.useState<DragLine | null>(null);
  const [menu, setMenu] = React.useState<MenuBlock | null>(null);
  // The open menu's block, held until the menu closes.
  const heldRef = React.useRef<MenuBlock | null>(null);
  const menuOpenRef = React.useRef(false);
  const coarse = useCoarsePointer();
  const handleRef = React.useRef<HTMLButtonElement>(null);

  const openMenu = React.useCallback(
    (block: BlockTarget) => {
      pinnedRef.current = true;
      menuOpenRef.current = true;
      show(block);
      heldRef.current?.release();
      heldRef.current = holdBlock(editor, block);
      setMenu(heldRef.current);
    },
    [editor, pinnedRef, show],
  );
  const closeMenu = React.useCallback(() => {
    heldRef.current?.release();
    heldRef.current = null;
    setMenu(null);
    menuOpenRef.current = false;
    pinnedRef.current = false;
  }, [pinnedRef]);
  React.useEffect(() => () => heldRef.current?.release(), []);

  React.useEffect(() => {
    const dom = editor.view.dom;
    const onMove = (event: MouseEvent) => {
      if (coarse || pinnedRef.current || !(event.target instanceof Node))
        return;
      if (event.target === dom) return;
      const block = blockAt(editor.view, event.target);
      if (block) show(block.node.type.name === "table" ? null : block);
    };
    const onKey = (event: KeyboardEvent) => {
      const menuKey =
        event.key === "ContextMenu" ||
        (event.shiftKey && event.key === "F10") ||
        ((event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          event.key === "/");
      // In a table its own controls answer (TableControls).
      if (menuKey && !inTableCell(editor.state)) {
        const block = caretBlock(editor);
        if (block) {
          event.preventDefault();
          openMenu(block);
          return;
        }
      }
      if (!coarse) show(null);
    };
    // Touch: the handle follows the caret's block (there is no hover).
    const onSelection = () => {
      if (!coarse || pinnedRef.current) return;
      show(editor.isFocused ? caretBlock(editor) : null);
    };
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", hideSoon);
    dom.addEventListener("keydown", onKey);
    editor.on("selectionUpdate", onSelection);
    editor.on("focus", onSelection);
    return () => {
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", hideSoon);
      dom.removeEventListener("keydown", onKey);
      editor.off("selectionUpdate", onSelection);
      editor.off("focus", onSelection);
    };
  }, [editor, show, hideSoon, pinnedRef, coarse, openMenu]);

  const block = value && value.dom.isConnected ? value : null;
  // The open dropdown's block went from the page (Turn into rebuilt it, a collaborator deleted it):
  // the dropdown goes with its trigger, so close the menu here — its own close never fires, and a
  // menu left "open" would pin the handle off for good.
  const lost = menu !== null && !coarse && block === null;
  React.useEffect(() => {
    if (lost) closeMenu();
  }, [lost, closeMenu]);
  // While the menu is open, every change (a collaborator's too) checks its block: gone, the menu
  // closes; redrawn, the grip moves to its new element, so the open dropdown keeps its trigger.
  React.useEffect(() => {
    if (!menu) return;
    const follow = () => {
      const now = menu.live();
      if (!now) {
        closeMenu();
        return;
      }
      const dom = editor.view.nodeDOM(now.pos);
      if (!coarse && dom instanceof HTMLElement) show({ ...now, dom });
    };
    editor.on("transaction", follow);
    return () => {
      editor.off("transaction", follow);
    };
  }, [menu, coarse, editor, closeMenu, show]);
  const box = block?.dom.getBoundingClientRect();
  // A bullet or number sits in the list's start padding, outside the item's box; clear it. A
  // heading's `#` link sits where the grip would (`HeadingLink`), and a marked section's dot
  // beside it: the grip moves out past them.
  const linked =
    !!box &&
    block?.node.type.name === "heading" &&
    block.node.content.size > 0 &&
    runtime.headingLink(block.pos) !== null &&
    headingLinkInGutter(editor, block.dom, coarse);
  const marked =
    linked &&
    block.dom.querySelector('[data-slot="text-edit-section-mark"]') !== null;
  const marker =
    block?.node.type.name === "listItem"
      ? 20
      : linked
        ? HEADING_LINK_GUTTER + (marked ? 24 : 0)
        : 0;
  const lineHeight = box ? Math.min(box.height, 24) : 0;
  // Touch: a 24px grip (44px hit area); otherwise the 16px grip.
  const size = coarse ? 24 : HANDLE_WIDTH;

  const onPointerDown = (event: React.PointerEvent) => {
    // The hovered block where it is now: a collaborator's edit since the hover moved it.
    const pressed = block && blockNow(editor, block);
    if (!pressed) return;
    pinnedRef.current = true;
    // The selection before the grip selects its block: Make task reads the lines it reaches.
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    startBlockDrag(editor, pressed.pos, event, {
      setLine,
      onClick: () => {
        // Found again on release: the document may have changed during the press.
        const now = blockNow(editor, pressed);
        if (!now) {
          pinnedRef.current = false;
          return;
        }
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, now.pos),
          ),
        );
        openMenu(
          editor.state.doc === doc || editor.state.doc.eq(doc)
            ? { ...now, range: { from, to } }
            : now,
        );
      },
      onEnd: () => {
        if (!menuOpenRef.current) pinnedRef.current = false;
      },
    });
  };

  return (
    <>
      <FloatingLayer>
        {block && box ? (
          <DropdownMenu
            open={menu !== null && !coarse}
            onOpenChange={(open) => {
              if (!open) closeMenu();
            }}
          >
            <DropdownMenuTrigger
              ref={handleRef}
              data-slot="text-edit-block-handle"
              aria-label="Block options"
              title="Drag to move · click for options"
              // Off the tab order (it follows the pointer); the keyboard opens the same menu for the
              // caret's block with ⌘/ or ⇧F10.
              aria-keyshortcuts="Meta+/ Control+/ Shift+F10"
              tabIndex={-1}
              onMouseEnter={keep}
              onMouseLeave={hideSoon}
              onMouseDown={(event) => {
                event.preventDefault();
                event.preventBaseUIHandler();
              }}
              onClick={(event) => {
                // A pointer click is the drag's own (no travel → the menu); a screen reader's
                // virtual click (`detail` 0) opens it through Base UI.
                if (event.detail !== 0) event.preventBaseUIHandler();
              }}
              onPointerDown={onPointerDown}
              style={{
                left:
                  handleLeft(editor, box.left - marker) - (size - HANDLE_WIDTH),
                top: box.top + lineHeight / 2 - (coarse ? 12 : 10),
                width: size,
                height: coarse ? 24 : 20,
              }}
              className={cn(
                GRIP,
                // A 44px hit area on touch, centred on the 24px grip.
                "pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']",
              )}
            >
              <GripVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-text-edit-menu=""
              align="start"
              finalFocus={() => {
                editor.view.focus();
                return false;
              }}
              className="w-auto min-w-52"
            >
              {menu ? (
                <BlockMenuItems
                  editor={editor}
                  block={menu}
                  runtime={runtime}
                />
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {line ? (
          <div
            data-slot="text-edit-drop-indicator"
            className={DROP_LINE}
            style={line}
          />
        ) : null}
      </FloatingLayer>
      {coarse ? (
        <BlockMenuSheet
          editor={editor}
          block={menu}
          runtime={runtime}
          onClose={closeMenu}
        />
      ) : null}
    </>
  );
}

/** What a menu's `shouldShow` reads. */
interface MenuShowProps {
  editor: Editor;
  state: EditorState;
  from: number;
  to: number;
}

const FLOATING = {
  strategy: "fixed" as const,
  offset: 8,
  flip: { padding: VIEWPORT_GAP },
  shift: { padding: VIEWPORT_GAP },
};

/* ------------------------------------------------------------------------------------------------
 * TextEdit
 * ----------------------------------------------------------------------------------------------*/

const NO_SLASH_ACTIONS: readonly TextEditSlashAction[] = [];

/** Run `work` when the browser is idle (or on the next tick where it cannot say). */
function whenIdle(work: () => void) {
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(work, { timeout: 1000 });
  else setTimeout(work, 0);
}

/** Words are runs of non-space characters (one definition, here and in a host's read copy). */
const countWords = (text: string) => (text.match(/\S+/g) ?? []).length;

/** The document's words and characters, and the selection's words (`getStats`). */
function docStats(state: EditorState): TextEditStats {
  const { doc, selection } = state;
  // A chip reads as one word; block breaks separate words but are not characters.
  const words = countWords(doc.textBetween(0, doc.content.size, " ", " "));
  const characters = doc.textBetween(0, doc.content.size, "", " ").length;
  return {
    words,
    characters,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 230)),
    selectedWords: selection.empty
      ? 0
      : countWords(doc.textBetween(selection.from, selection.to, " ", " ")),
  };
}

/** The image types a browser shows everywhere: inline by default; others land as file chips. */
const INLINE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

/**
 * Props `TextEdit` hands the editor once it loads: its own behaviour props, plus what the light
 * shell already resolved (ARIA from an enclosing `Field`, the surface classes, the content box).
 */
export interface TextEditEditorProps extends Omit<
  TextEditProps,
  | "children"
  | "className"
  | "ref"
  | "id"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-invalid"
  | "minHeight"
  | "maxHeight"
  | "handleRef"
> {
  /** The surface's resolved ARIA wiring (own props merged with an enclosing `Field`). */
  aria: {
    id?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: string;
  };
  /** The ProseMirror root's classes, shared with the read view. */
  surfaceClassName: string;
  /** Added to the surface while editable with a slash menu: the "Type / for commands" hint. */
  hintClassName: string;
  /** The content box's classes, shared with the read view. */
  contentClassName: string;
  /**
   * The content box's `minHeight` / `maxHeight` custom properties, shared with the read view.
   * @default undefined
   */
  contentStyle?: React.CSSProperties;
  /** The shell's root: focus inside it (or in a floating part) stays in the edit session. */
  rootRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Keep the content box hidden: true while the read view still stands in for it.
   * @default false
   */
  hidden?: boolean;
  /** Called once the editor's document is in the DOM, so the shell can swap it in. */
  onReady: (editor: Editor) => void;
  /**
   * Called with the serialized document once the edit session has ended for good — focus left the
   * editor and every floating part, the window still has focus, and no upload is in flight — so
   * the shell can swap its read view back in. Runs after the session's commit.
   * @default undefined
   */
  onLeaveView?: (doc: string) => void;
  /**
   * Filled with the editor's imperative handle; the shell's `handleRef` delegates to it.
   * @default undefined
   */
  editorHandle?: React.RefObject<TextEditHandle | null>;
  /**
   * Show an image in the shell's `FileViewer` (an image's Open, or a double-click on it).
   * @default undefined
   */
  onOpenImage?: (image: HTMLImageElement) => void;
  /**
   * Show a file chip's file in the shell's `FileViewer` (a double-click on the chip, or Open in
   * the link panel).
   * @default undefined
   */
  onOpenFile?: (href: string, name: string) => void;
}

/**
 * `TextEditEditor` — the Tiptap editor behind `TextEdit` (slash menu, bubble menu, tables, block
 * handles, markdown round trip, the one commit path). `TextEdit` renders it inside its own root in
 * place of its read view, once the reader shows intent; it is never used directly.
 *
 * @example
 * // Internal — use TextEdit, which loads this module lazily:
 * <TextEdit format="markdown" defaultValue={md} onCommit={save} />
 */
export function TextEditEditor({
  format = "html",
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  slashCommands = [],
  dragHandles = true,
  onCommit,
  onRevert,
  onSubmit,
  autosave = false,
  escapeBehavior: escapeBehaviorProp,
  saving = false,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel,
  variant = "document",
  mentions,
  mentionHref,
  mentionImage,
  mentionLabel,
  mentionStatus: mentionStatusProp,
  onTaskItemToggle,
  onMakeTask,
  sectionMarks,
  onSectionMark,
  onImageUpload,
  onFileUpload,
  onUploadError,
  onExternalImage,
  fileLinkPrefix = "/api/files/",
  inlineImageTypes = INLINE_IMAGE_TYPES,
  embeds,
  renderTaskQuery,
  renderLiveBlock,
  liveBlockKinds,
  onOutlineChange,
  annotations,
  activeAnnotationId = null,
  onAnnotationClick,
  onAnnotationHover,
  onCreateAnnotation,
  onAnnotationsLayout,
  floatingSafeArea,
  annotationCounts = "never",
  annotationLabel = defaultAnnotationLabel,
  annotationCountLabel = defaultAnnotationCountLabel,
  onPendingUploadsChange,
  onFailedUploadsChange,
  collaboration,
  diff,
  blockViews,
  aria,
  surfaceClassName,
  hintClassName,
  contentClassName,
  contentStyle,
  rootRef,
  hidden = false,
  onReady,
  onLeaveView,
  editorHandle,
  onOpenImage,
  onOpenFile,
  imageDownloadHref,
  slashActions = NO_SLASH_ACTIONS,
  headingLinkHref,
  toggleState,
  onStatsChange,
  findReplace = false,
  emoji = false,
  menuSize = "default",
  menuPresentation = "popover",
}: TextEditEditorProps) {
  const boxed = variant === "boxed" || variant === "composer";
  const editable = !readOnly && !disabled;
  // A shared document, fixed at creation: the Yjs document is the truth, so nothing here commits,
  // reverts or applies a value — and Escape only blurs (A2).
  const [collab] = React.useState(() => collaboration ?? null);
  // A version diff, fixed at creation (its schema has the `ychange` markings); its document
  // follows the prop.
  const [diffing] = React.useState(() => diff !== undefined);
  // Nothing here is ever the host's to save — a shared document (its Yjs state is the truth) or a
  // version diff (read-only, and its text holds removed passages): no value in, no commit out.
  const quiet = collab !== null || diffing;
  const escapeBehavior = collab
    ? "blur"
    : (escapeBehaviorProp ??
      (autosave || variant === "document" ? "blur" : "revert"));
  // Fixed at creation: the parser is chosen once.
  const [markdown] = React.useState(format === "markdown");
  const serialize = React.useCallback(
    (ed: Editor) => (markdown ? ed.getMarkdown() : ed.getHTML()),
    [markdown],
  );

  const callbacks = React.useRef({
    onValueChange,
    onCommit,
    onRevert,
    onSubmit,
    mentions,
    onImageUpload,
    onFileUpload,
    onUploadError,
    onExternalImage,
    onOutlineChange,
    onStatsChange,
    onAnnotationClick,
    onAnnotationHover,
    onCreateAnnotation,
    onAnnotationsLayout,
    onPendingUploadsChange,
    onFailedUploadsChange,
  });
  React.useEffect(() => {
    callbacks.current = {
      onValueChange,
      onCommit,
      onRevert,
      onSubmit,
      mentions,
      onImageUpload,
      onFileUpload,
      onUploadError,
      onExternalImage,
      onOutlineChange,
      onStatsChange,
      onAnnotationClick,
      onAnnotationHover,
      onCreateAnnotation,
      onAnnotationsLayout,
      onPendingUploadsChange,
      onFailedUploadsChange,
    };
  }, [
    onValueChange,
    onCommit,
    onRevert,
    onSubmit,
    mentions,
    onImageUpload,
    onFileUpload,
    onUploadError,
    onExternalImage,
    onOutlineChange,
    onStatsChange,
    onStatsChange,
    onAnnotationClick,
    onAnnotationHover,
    onCreateAnnotation,
    onAnnotationsLayout,
    onPendingUploadsChange,
    onFailedUploadsChange,
  ]);

  const placeholderRef = React.useRef(placeholder);
  placeholderRef.current = placeholder;
  // `file` needs somewhere to send the file; `diagram` a view that draws ```mermaid.
  const allowedSlash = React.useMemo(
    () =>
      slashCommands.filter(
        (command) =>
          (command !== "file" || onFileUpload) &&
          (command !== "diagram" || blockViews?.mermaid),
      ),
    [slashCommands, onFileUpload, blockViews],
  );
  const slashRef = React.useRef<readonly TextEditSlashCommand[]>(allowedSlash);
  slashRef.current = allowedSlash;
  const slashActionsRef =
    React.useRef<readonly TextEditSlashAction[]>(slashActions);
  slashActionsRef.current = slashActions;
  const menuLg = menuSize === "lg";
  const menuLgRef = React.useRef(menuLg);
  menuLgRef.current = menuLg;
  // `menuPresentation="auto"` on a phone: the menus are sheets with their own search field.
  const menuSheet = useSuggestionMenuSheet(menuPresentation);
  const [sheetQuery, setSheetQuery] = React.useState("");
  const toggleStateRef = React.useRef(toggleState);
  toggleStateRef.current = toggleState;
  const headingLinkRef = React.useRef(headingLinkHref);
  headingLinkRef.current = headingLinkHref;
  const [emojiMenu, setEmojiMenu] = React.useState<EmojiMenuState | null>(null);
  const emojiMenuRef = React.useRef<EmojiMenuState | null>(null);
  // The find bar: open, and a counter that asks its field for focus on each ⌘F.
  const [find, setFind] = React.useState<{
    key: number;
    term: string | null;
  } | null>(null);
  const findOpenRef = React.useRef(false);
  findOpenRef.current = find !== null;
  const findCaretRef = React.useRef<number | null>(null);
  // Filled once the editor exists; the extensions (built first) call through them.
  const openFindRef = React.useRef<() => void>(() => {});
  const closeFindRef = React.useRef<() => void>(() => {});
  const revealFindRef = React.useRef<() => void>(() => {});
  const mentionHrefRef = React.useRef(mentionHref);
  mentionHrefRef.current = mentionHref;
  const mentionImageRef = React.useRef(mentionImage);
  mentionImageRef.current = mentionImage;
  const mentionLabelRef = React.useRef(mentionLabel);
  mentionLabelRef.current = mentionLabel;
  const mentionStatusRef = React.useRef(mentionStatusProp);
  mentionStatusRef.current = mentionStatusProp;
  // Chips read `mentionLabel` and `mentionStatus` at render: a new one re-renders them.
  const [labels] = React.useState(() => new Versioned());
  React.useEffect(
    () => labels.bump(),
    [labels, mentionLabel, mentionStatusProp],
  );
  // Linked checklist lines and section marks: read through refs by the extensions and the menu.
  const taskToggleRef = React.useRef(onTaskItemToggle);
  taskToggleRef.current = onTaskItemToggle;
  const makeTaskRef = React.useRef(onMakeTask);
  makeTaskRef.current = onMakeTask;
  const sectionMarkRef = React.useRef(onSectionMark);
  sectionMarkRef.current = onSectionMark;
  const [toggleRuntime] = React.useState<ToggleRuntime>(() => ({
    // Shared or a diff: opening a toggle is this viewer's view, never a document change.
    states: new ToggleStates(toggleStateRef),
    shared: quiet,
  }));
  const inlineImageTypesRef = React.useRef(inlineImageTypes);
  inlineImageTypesRef.current = inlineImageTypes;
  const fileLinkPrefixRef = React.useRef(fileLinkPrefix);
  fileLinkPrefixRef.current = fileLinkPrefix;

  const [panel, setPanel] = React.useState<Panel | null>(null);
  // One key per instance for each floating menu, so an effect can show or hide exactly this
  // editor's menu.
  const [menuKeys] = React.useState(() => ({
    bubble: new PluginKey("textEditBubbleMenu"),
  }));
  const [slash, setSlashState] = React.useState<SlashState | null>(null);
  const slashStateRef = React.useRef<SlashState | null>(null);
  const [mentionMenu, setMentionState] =
    React.useState<MentionMenuState | null>(null);
  const mentionStateRef = React.useRef<MentionMenuState | null>(null);
  const setMention = React.useCallback((next: MentionMenuState | null) => {
    mentionStateRef.current = next;
    setMentionState(next);
  }, []);

  const editorRef = React.useRef<Editor | null>(null);
  // The slash menu's rows: the plugin's for the typed `/query`, or — in a sheet, whose search
  // field takes the typing — filtered by that field.
  const slashFiltered = menuSheet ? sheetQuery.trim() !== "" : !!slash?.query;
  const slashRows = React.useMemo(
    () =>
      !slash
        ? []
        : menuSheet
          ? filterSlash(
              allowedSlash,
              sheetQuery,
              editorRef.current ? inTableCell(editorRef.current.state) : false,
              slashActions,
              menuLg,
            )
          : slash.items,
    [slash, menuSheet, sheetQuery, allowedSlash, slashActions, menuLg],
  );
  // A sheet's search starts empty each time a menu opens.
  const menuOpen = slash !== null || mentionMenu !== null;
  React.useEffect(() => {
    if (!menuOpen) setSheetQuery("");
  }, [menuOpen]);
  const chipResolver = useInlineChipResolver();
  const chipResolverRef = React.useRef(chipResolver);
  chipResolverRef.current = chipResolver;

  // The lone link pasted last (`pasteLink`): what it is now, and the paste popover's choices.
  const [pasted, setPastedState] = React.useState<PastedLink | null>(null);
  const pastedRef = React.useRef<PastedLink | null>(null);
  const pasteIdRef = React.useRef(0);
  /** Ends the edit session (`leave`, set once it exists). */
  const leaveRef = React.useRef<(next: EventTarget | null) => void>(() => {});
  const setPasted = React.useCallback((next: PastedLink | null) => {
    pastedRef.current = next;
    setPastedState(next);
  }, []);
  React.useEffect(() => () => pastedRef.current?.controller.abort(), []);

  /**
   * The pasted link as `form` — an undo step of its own, its range tracked on. The default keeps
   * the popover open (it goes on the next keystroke); a choice from it closes it.
   */
  const applyPasted = React.useCallback(
    (form: PastedChoice, opts: { keepOpen?: boolean; title?: string } = {}) => {
      const ed = editorRef.current;
      const pasted = pastedRef.current;
      if (!ed || ed.isDestroyed || !pasted) return;
      const open = Boolean(opts.keepOpen) && pasted.open;
      // A mention still being looked up is already the default: nothing to change.
      if (form === "mention" && !pasted.mention)
        return setPasted({ ...pasted, open });
      const range = pastedRange(ed.state, pasted);
      if (!range) return setPasted(null);
      if (form === pasted.form) return setPasted({ ...pasted, open });
      const { state } = ed;
      const { schema } = state;
      const tr = state.tr;
      const text = form === "link" ? (opts.title ?? pasted.url) : pasted.url;
      let from = range.from;
      let size: number;
      if (form === "embed") {
        const match = matchEmbed(pasted.url);
        const host = embedHost(state.doc, range.from);
        if (!match || !host || !schema.nodes.embed) return;
        const embed = schema.nodes.embed.create({
          provider: match.provider,
          url: pasted.url,
        });
        // Alone in its paragraph, the link becomes the embed; beside text, the embed follows it.
        if (host.paragraph.content.size === range.to - range.from) {
          tr.replaceWith(host.from, host.to, embed);
          from = host.from;
        } else {
          tr.delete(range.from, range.to);
          from = tr.mapping.map(host.to);
          tr.insert(from, embed);
        }
        size = embed.nodeSize;
        if (tr.doc.resolve(from + size).nodeAfter === null)
          tr.insert(from + size, schema.nodes.paragraph!.create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(from + size + 1)));
      } else {
        // The pasted text's own marks (bold, …) stay; a link's or a mention's are its own.
        const marks =
          pasted.form === "text"
            ? (state.doc.nodeAt(range.from)?.marks ?? [])
            : [];
        const inline =
          form === "mention"
            ? schema.nodeFromJSON(
                mentionChip(collab !== null, pasted.mention!)[0]!,
              )
            : schema.text(
                text,
                schema.marks.link!.create({ href: pasted.url }).addToSet(marks),
              );
        if (pasted.form === "embed") {
          tr.replaceWith(
            range.from,
            range.to,
            schema.nodes.paragraph!.create(null, inline),
          );
          from = range.from + 1;
          tr.setSelection(TextSelection.create(tr.doc, from + inline.nodeSize));
        } else tr.replaceWith(range.from, range.to, inline);
        size = inline.nodeSize;
      }
      tr.setMeta(PASTED_KEY, {
        id: pasted.id,
        from,
        to: from + size,
        rel: null,
        node: null,
        after: null,
      })
        .setMeta("preventAutolink", true)
        .scrollIntoView();
      dispatchOwnStep(ed.view, tr);
      bindPasted(ed.view);
      setPasted({ ...pasted, form, text, open });
    },
    [collab, setPasted],
  );

  /**
   * A paste still waiting for its answer becomes a link now — the edit session is ending (so what
   * it commits, and the read view shows, is final) or another paste takes over the tracking. A
   * late answer then changes nothing.
   */
  const settlePasted = React.useCallback(() => {
    const now = pastedRef.current;
    if (now?.form !== "text") return;
    now.controller.abort();
    applyPasted("link");
  }, [applyPasted]);

  /**
   * A lone link pasted at the caret (not over a selection, not in code). It lands as the URL's
   * text — an undo step of its own — then becomes its default in a second: a mention of the app's
   * record once the host answers `fromUrl`, an embed where a video can stand in for an empty
   * paragraph, else a link, titled when `linkPreview` answers within `LINK_TITLE_WAIT_MS`. With a
   * second choice, the paste popover offers it.
   */
  const pasteLink = React.useCallback(
    (url: string): boolean => {
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed) return false;
      // A caret in text: a gap cursor beside a block (or a node selected) pastes as it always did.
      const { selection } = ed.state;
      if (!(selection instanceof TextSelection) || !selection.empty)
        return false;
      if (ed.isActive("code")) return false;
      // The paste before it, still waiting, settles first (as a link) and stops being tracked.
      settlePasted();
      pastedRef.current?.controller.abort();
      const { state } = ed;
      const { from, to } = state.selection;
      const link = state.schema.marks.link;
      if (!link) return false;
      const controller = new AbortController();
      const answer =
        callbacks.current.mentions?.fromUrl?.(url, {
          signal: controller.signal,
        }) ?? null;
      const match = answer ? null : matchEmbed(url);
      const host =
        match && embedsOn(ed, match.provider) && state.schema.nodes.embed
          ? embedHost(state.doc, from)
          : null;
      const offers: PastedChoice[] = answer
        ? ["mention", "link"]
        : host
          ? ["embed", "link"]
          : ["link"];
      const id = ++pasteIdRef.current;
      const end = from + url.length;
      const tr = state.tr
        .insertText(url, from, to)
        // Pasted inside or just after a link, the URL never takes that link's address.
        .removeMark(from, end, link);
      const after = charAfter(tr.doc, end);
      dispatchOwnStep(
        ed.view,
        tr
          .setMeta(PASTED_KEY, {
            id,
            from,
            to: end,
            rel: null,
            node: null,
            after,
          })
          .setMeta("preventAutolink", true)
          .scrollIntoView(),
      );
      bindPasted(ed.view);
      setPasted({
        id,
        url,
        offers,
        form: "text",
        text: url,
        mention: null,
        open: offers.length > 1,
        controller,
      });
      // Still this paste, still the URL as text: another paste or a choice meanwhile wins.
      const current = () => {
        const now = pastedRef.current;
        return !controller.signal.aborted &&
          now?.id === id &&
          now.form === "text"
          ? now
          : null;
      };
      if (answer) {
        const settle = (option: MentionOption | null) => {
          const now = current();
          if (!now) return;
          if (option) {
            setPasted({ ...now, mention: option });
            applyPasted("mention", { keepOpen: true });
          } else {
            // Nothing to mention: a link, with nothing else to offer. A popover holding focus
            // (Tab) hands it back to the text as it goes.
            if (document.activeElement?.closest("[data-slot=text-edit-paste]"))
              editorRef.current?.commands.focus();
            setPasted({ ...now, offers: ["link"], open: false });
            applyPasted("link");
          }
        };
        Promise.resolve(answer).then(settle, () => settle(null));
        return true;
      }
      // An embed by default only where it stands in for an empty paragraph.
      if (host?.paragraph.content.size === 0) {
        applyPasted("embed", { keepOpen: true });
        return true;
      }
      const preview = linkPreviewOf(chipResolverRef.current?.linkPreview, url);
      if (!preview) {
        applyPasted("link", { keepOpen: true });
        return true;
      }
      let settled = false;
      const settle = (title?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (current()) applyPasted("link", { keepOpen: true, title });
      };
      const timer = setTimeout(() => settle(), LINK_TITLE_WAIT_MS);
      preview.then((answered) => settle(cleanTitle(answered?.title)));
      return true;
    },
    [applyPasted, setPasted, settlePasted],
  );
  const pasteLinkRef = React.useRef(pasteLink);
  pasteLinkRef.current = pasteLink;

  /** Close the paste popover; `refocus` puts the caret back in the text. */
  const closePasted = React.useCallback(
    (refocus = false) => {
      const now = pastedRef.current;
      if (now?.open) setPasted({ ...now, open: false });
      if (refocus) editorRef.current?.commands.focus();
    },
    [setPasted],
  );

  // A click anywhere but the paste popover closes it.
  React.useEffect(() => {
    if (!pasted?.open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("[data-slot=text-edit-paste]")) return;
      // Focus was in the popover (Tab): the editor already let it go, so its session ends here.
      const focused = document.activeElement?.closest(
        "[data-slot=text-edit-paste]",
      );
      closePasted();
      if (focused) leaveRef.current(target);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [pasted?.open, closePasted]);

  // The mention search: one AbortSignal per keystroke, and answers kept per query for this
  // editor (`MentionSearchCache`): a query asked before shows at once (and is asked again when
  // older than `MENTION_FRESH_MS`); the menu's first query goes out at once, every later one
  // `MENTION_DEBOUNCE_MS` after the last keystroke. While an answer is on its way the rows that
  // still match stay (none left: placeholder rows, so Enter never picks a row that no longer
  // matches).
  const searchRef = React.useRef<{
    timer?: ReturnType<typeof setTimeout>;
    controller?: AbortController;
  }>({});
  /** The open menu has asked once: its later queries wait for the debounce. */
  const askedRef = React.useRef(false);
  const [searchCache] = React.useState(() => new MentionSearchCache());
  const stopSearch = React.useCallback(() => {
    clearTimeout(searchRef.current.timer);
    searchRef.current.controller?.abort();
    searchRef.current = {};
  }, []);
  const runSearch = React.useCallback(
    (query: string) => {
      stopSearch();
      const source = callbacks.current.mentions;
      const current = mentionStateRef.current;
      if (!source || !current) return;
      const first = !askedRef.current;
      askedRef.current = true;
      // An answer (cached or fresh) for `query`: its rows — or, when no one matches and the phrase
      // goes on past a space, the menu closes (it was a sentence). A cached answer arrives inside
      // the suggestion's own update, so its close waits for that update to finish (and for the
      // menu to still be on this query).
      const close = () => {
        const ed = editorRef.current;
        if (mentionStateRef.current?.query !== query || !ed || ed.isDestroyed)
          return;
        exitSuggestion(ed.view, MENTION_KEY);
      };
      const show = (options: MentionOption[], loading: boolean) => {
        const state = mentionStateRef.current;
        if (!state) return false;
        if (!loading && options.length === 0 && /\s$/.test(query)) return true;
        setMention({
          ...state,
          results: groupResults(options, source.kinds, query, source.sections),
          loading,
          error: false,
          index: 0,
        });
        return false;
      };
      const hit = searchCache.get(source, query);
      if (hit) {
        if (show(hit.options, !hit.fresh)) {
          searchRef.current.timer = setTimeout(close);
          return;
        }
        if (hit.fresh) return;
      } else
        setMention({
          ...current,
          // The rows that still match, grouped again for the query as it now reads.
          results: current.results
            ? groupResults(
                current.results.filter((option) =>
                  matchesMentionQuery(option, query),
                ),
                source.kinds,
                query,
                source.sections,
              )
            : null,
          loading: true,
          error: false,
          index: 0,
        });
      const controller = new AbortController();
      searchRef.current.controller = controller;
      searchRef.current.timer = setTimeout(
        () => {
          source.search(query, { signal: controller.signal }).then(
            (options) => {
              if (controller.signal.aborted) return;
              searchCache.set(source, query, options);
              if (show(options, false)) close();
            },
            () => {
              if (controller.signal.aborted) return;
              const state = mentionStateRef.current;
              if (!state) return;
              setMention({
                ...state,
                results: [],
                loading: false,
                error: true,
              });
            },
          );
        },
        hit || first ? 0 : MENTION_DEBOUNCE_MS,
      );
    },
    [searchCache, setMention, stopSearch],
  );
  React.useEffect(() => stopSearch, [stopSearch]);

  // Uploads in flight: aborted on unmount, awaited by `flush()`.
  const uploadsRef = React.useRef(
    new Map<string, { controller: AbortController; done: Promise<void> }>(),
  );
  // Checks whether the edit session is over and hands the shell its read view back (below, once
  // `isInside` exists); an upload settling after focus left re-runs it.
  const leaveViewRef = React.useRef<(() => void) | null>(null);
  const pickRef = React.useRef<(() => void) | null>(null);
  const openPanel = React.useCallback((next: Panel | null) => {
    setPanel(next);
  }, []);

  const openImageRef = React.useRef(onOpenImage);
  openImageRef.current = onOpenImage;
  const openFileRef = React.useRef(onOpenFile);
  openFileRef.current = onOpenFile;
  const openFileLink = React.useCallback((href: string) => {
    const open = openFileRef.current;
    const prefix = fileLinkPrefixRef.current;
    if (!open || !prefix || !href.startsWith(prefix)) return false;
    const chip = editorRef.current?.view.dom.querySelector<HTMLAnchorElement>(
      `a[href="${CSS.escape(href)}"]`,
    );
    open(href, chip?.textContent ?? "");
    return true;
  }, []);
  const [imageSlots] = React.useState(() => new ImageSlots());

  // Built once: the editor is never recreated by a re-render.
  const [extensions] = React.useState(() =>
    buildExtensions(
      placeholderRef,
      {
        allowed: slashRef,
        actions: slashActionsRef,
        lg: menuLgRef,
        get: () => slashStateRef.current,
        set: (next) => {
          slashStateRef.current = next;
          setSlashState(next);
        },
        open: openPanel,
      },
      {
        mentionHref: mentionHrefRef,
        mentionImage: mentionImageRef,
        mentionLabel: mentionLabelRef,
        mentionStatus: mentionStatusRef,
        labels,
        collaborative: collab !== null,
        fileLinkPrefix: fileLinkPrefixRef,
        liveBlockKinds: liveBlockKinds ?? DEFAULT_LIVE_BLOCK_KINDS,
        mention: {
          enabled: () => Boolean(callbacks.current.mentions?.kinds.length),
          get: () => mentionStateRef.current,
          set: (next) => {
            if (!next) {
              stopSearch();
              askedRef.current = false;
            }
            setMention(next);
          },
          query: runSearch,
        },
      },
      {
        onClick: (id) => callbacks.current.onAnnotationClick?.(id),
        onHover: (id) => callbacks.current.onAnnotationHover?.(id),
        canOpen: () => Boolean(callbacks.current.onAnnotationClick),
      },
      { slots: imageSlots, open: openImageRef },
      toggleRuntime,
      collab,
      diffing,
      [
        sectionMarksExtension((key) => sectionMarkRef.current?.(key)),
        taskOffersExtension(),
        editableWatchExtension(),
        pastedImagesExtension({
          take: () => {
            const images = importRef.current;
            importRef.current = null;
            return images;
          },
          place: (images) => placeImagesRef.current(images),
        }),
        ...(findReplace
          ? [
              FindAndReplace.configure({
                searchDebounceMs: 250,
                injectCSS: false,
              }),
              findKeys({
                open: () => {
                  openFindRef.current();
                  return true;
                },
                isOpen: () => findOpenRef.current,
                step: (direction) => {
                  const ed = editorRef.current;
                  if (!ed) return false;
                  if (direction > 0) ed.commands.goToNextResult();
                  else ed.commands.goToPreviousResult();
                  revealFindRef.current();
                  return true;
                },
              }),
            ]
          : []),
        ...(emoji
          ? [
              emojiExtension({
                get: () => emojiMenuRef.current,
                set: (next) => {
                  emojiMenuRef.current = next;
                  setEmojiMenu(next);
                },
              }),
            ]
          : []),
      ],
    ),
  );

  const {
    id: resolvedId,
    "aria-labelledby": resolvedLabelledBy,
    "aria-describedby": resolvedDescribedBy,
    "aria-invalid": ariaInvalidAttribute,
  } = aria;
  const hasSlash = allowedSlash.length > 0 || slashActions.length > 0;
  // Find: open (⌘F, `openFind`) with the selection's text as the term; close (Esc, ✕) with the
  // caret back where it was; reveal a match inside a closed toggle.
  const revealAt = React.useCallback(
    (from: number) => {
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed) return;
      expandAncestors(ed, toggleRuntime, from);
      requestAnimationFrame(() => {
        if (ed.isDestroyed) return;
        const { node } = ed.view.domAtPos(from);
        (node instanceof Element ? node : node.parentElement)?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      });
    },
    [toggleRuntime],
  );
  openFindRef.current = () => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed || !findReplace) return;
    const { selection } = ed.state;
    const { from, to, empty, $from, $to } = selection;
    if (!findOpenRef.current) findCaretRef.current = from;
    // Only selected words in one block are a term: a selected block (the block menu's) is not.
    const text =
      empty || !(selection instanceof TextSelection) || !$from.sameParent($to)
        ? ""
        : ed.state.doc.textBetween(from, to, " ", " ");
    setFind((previous) => ({
      key: (previous?.key ?? 0) + 1,
      term: text && text.length <= 100 && !text.includes("\n") ? text : null,
    }));
  };
  closeFindRef.current = () => {
    const ed = editorRef.current;
    setFind(null);
    if (!ed || ed.isDestroyed) return;
    ed.chain().clearSearch().setReplaceTerm("").run();
    const at = findCaretRef.current;
    findCaretRef.current = null;
    if (at !== null)
      ed.chain()
        .focus()
        .setTextSelection(Math.min(at, ed.state.doc.content.size))
        .run();
  };
  revealFindRef.current = () => {
    const ed = editorRef.current;
    const state = ed ? FindAndReplacePluginKey.getState(ed.state) : undefined;
    const result =
      state && state.currentIndex !== null
        ? state.results[state.currentIndex]
        : undefined;
    if (result) revealAt(result.from);
  };
  const blockMenuRuntime = React.useMemo<BlockMenuRuntime>(
    () => ({
      headingLink: (pos) => {
        const ed = editorRef.current;
        const href = headingLinkRef.current;
        if (!ed || !href) return null;
        const anchor = headingAnchorAt(ed.state.doc, pos);
        return anchor ? href(anchor) : null;
      },
      makeTask: () => makeTaskRef.current,
    }),
    [],
  );

  const slashListId = React.useId();
  const mentionListId = React.useId();
  const emojiListId = React.useId();
  // The open menu the surface points at (`aria-controls`, `aria-activedescendant`); focus stays
  // in the editor, so the active row is announced through the textbox.
  const openMenu =
    !editable || disabled
      ? null
      : slash
        ? { id: slashListId, count: slash.items.length, index: slash.index }
        : mentionMenu
          ? {
              id: mentionListId,
              count: mentionStatus(mentionMenu)
                ? 0
                : flatOptions(mentionMenu.results).length,
              index: mentionMenu.index,
            }
          : emojiMenu
            ? {
                id: emojiListId,
                count: emojiMenu.items.length,
                index: emojiMenu.index,
              }
            : null;
  const menuControls = openMenu?.id;
  const menuActive =
    openMenu && openMenu.count > 0
      ? suggestionMenuOptionId(openMenu.id, openMenu.index)
      : undefined;
  const editorAttributes = React.useMemo(
    () => ({
      class: cn(
        surfaceClassName,
        markdownExtrasClassName,
        editable && hasSlash && hintClassName,
      ),
      // `document`: the caret is this surface's whole focus cue — no ring, border or fill (see
      // the geometry lane's caret-only exemption). `boxed`: the box's border is the cue.
      "data-focus-cue": boxed ? "border" : "caret",
      ...(resolvedId ? { id: resolvedId } : {}),
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(resolvedLabelledBy ? { "aria-labelledby": resolvedLabelledBy } : {}),
      ...(ariaInvalidAttribute ? { "aria-invalid": ariaInvalidAttribute } : {}),
      ...(resolvedDescribedBy
        ? { "aria-describedby": resolvedDescribedBy }
        : {}),
      // A read-only document is a document, not a field (B8): no textbox role to announce.
      ...(editable || disabled
        ? { role: "textbox", "aria-multiline": "true" }
        : { role: "document" }),
      ...(saving ? { "aria-busy": "true" } : {}),
      ...(disabled ? { "aria-disabled": "true" } : {}),
      ...(menuControls
        ? { "aria-autocomplete": "list", "aria-controls": menuControls }
        : {}),
      ...(menuActive ? { "aria-activedescendant": menuActive } : {}),
    }),
    [
      menuControls,
      menuActive,
      boxed,
      saving,
      disabled,
      editable,
      hasSlash,
      resolvedDescribedBy,
      ariaInvalidAttribute,
      ariaLabel,
      resolvedLabelledBy,
      resolvedId,
      surfaceClassName,
      hintClassName,
    ],
  );

  // The document as focus found it: a commit compares against it, Escape restores it. Null while
  // no edit session is open, which is what makes every commit path idempotent.
  const baselineRef = React.useRef<string | null>(null);
  // The last document the host has — loaded, committed or applied from `value` — so a commit
  // that happens outside an edit session (an upload finishing after blur) knows what changed.
  const committedRef = React.useRef<string | null>(null);
  // The live document, kept across a rebuild: hidden (React `<Activity>`), Tiptap destroys the
  // editor, and the one it creates on show would otherwise start from the last-rendered props.
  const liveDocRef = React.useRef<PMNode | null>(null);
  const commit = React.useCallback(() => {
    const ed = editorRef.current;
    if (quiet || !ed || ed.isDestroyed || baselineRef.current === null) return;
    const next = serialize(ed);
    if (next === baselineRef.current) return;
    baselineRef.current = next;
    committedRef.current = next;
    callbacks.current.onCommit?.(next);
  }, [serialize]);
  /**
   * Commit now, focused or not: a programmatic change (an upload landing) must reach the host
   * even when no edit session is open. Idempotent with `commit`.
   */
  const commitNow = React.useCallback(() => {
    const ed = editorRef.current;
    if (quiet || !ed || ed.isDestroyed) return;
    if (baselineRef.current !== null) {
      commit();
      return;
    }
    const next = serialize(ed);
    if (next === committedRef.current) return;
    committedRef.current = next;
    callbacks.current.onCommit?.(next);
  }, [commit, serialize]);
  // Read by the key handler, which the editor captures once.
  const escapeRef = React.useRef(escapeBehavior);
  React.useLayoutEffect(() => {
    escapeRef.current = escapeBehavior;
  });
  /** The host saved the current document: it becomes the baseline Escape and commits compare to. */
  const markSaved = React.useCallback(() => {
    const ed = editorRef.current;
    if (quiet || !ed || ed.isDestroyed) return;
    const next = serialize(ed);
    if (baselineRef.current !== null) baselineRef.current = next;
    committedRef.current = next;
  }, [serialize]);
  const revert = React.useCallback(() => {
    const ed = editorRef.current;
    if (quiet || !ed || baselineRef.current === null) return;
    const previous = baselineRef.current;
    if (serialize(ed) !== previous) {
      ed.commands.setContent(previous, {
        emitUpdate: false,
        ...(markdown ? { contentType: "markdown" as const } : {}),
      });
      callbacks.current.onValueChange?.(previous);
    }
    baselineRef.current = null;
    ed.commands.blur();
    callbacks.current.onRevert?.();
  }, [markdown, serialize]);

  /**
   * Failed uploads still shown (Retry or Remove), each with what to let go of once it goes: its
   * image preview, and the hold on the image it would replace.
   */
  const failedRef = React.useRef(new Map<string, () => void>());
  const startUploadRef = React.useRef<
    | ((
        file: File,
        pos: number,
        as?: MediaKind,
        replace?: ImageToReplace,
      ) => boolean)
    | null
  >(null);
  /** No upload landing and none failed: an edit session that ended may hand its view back. */
  const uploadsSettled = React.useCallback(() => {
    callbacks.current.onFailedUploadsChange?.(failedRef.current.size);
    if (uploadsRef.current.size === 0 && failedRef.current.size === 0)
      leaveViewRef.current?.();
  }, []);

  /**
   * Upload `file` into the document at `pos`: a placeholder now, the image or link on success.
   * `replace` (an image's Replace): that image stays until the upload lands, then gives way to it
   * in one step; a failed upload leaves it. Gone meanwhile, the upload lands where it was put.
   */
  const startUpload = React.useCallback(
    (
      file: File,
      pos: number,
      as?: MediaKind,
      replace?: ImageToReplace,
    ): boolean => {
      const ed = editorRef.current;
      const type = file.type.split(";")[0]!.trim().toLowerCase();
      const kind: MediaKind =
        as ??
        (inlineImageTypesRef.current.includes(type)
          ? "image"
          : INLINE_VIDEO_TYPES.includes(type)
            ? "video"
            : INLINE_AUDIO_TYPES.includes(type)
              ? "audio"
              : "file");
      const image = kind === "image";
      const { onImageUpload: uploadImage, onFileUpload: uploadFile } =
        callbacks.current;
      if (!ed || ed.isDestroyed || (image ? !uploadImage : !uploadFile))
        return false;
      const id = `upload-${Math.random().toString(36).slice(2)}`;
      const controller = new AbortController();
      const preview = image ? URL.createObjectURL(file) : null;
      // The image to replace, followed through every change while the upload runs (anyone's).
      const target = replace ? holdPosition(ed, replace.pos, true) : null;
      /** The image to replace, where it is now; null once it is gone or changed. */
      const replaced = (state: EditorState) => {
        const at = target?.get() ?? null;
        const node = at === null ? null : state.doc.nodeAt(at);
        return node?.type.name === "image" && node.attrs.src === replace?.src
          ? { from: at!, to: at! + node.nodeSize, node }
          : null;
      };
      // An image's size, read from the file while it uploads: stored with it, so its box is
      // reserved before it loads (here and in every read view).
      const natural = preview ? imageSize(preview) : Promise.resolve(null);
      ed.view.dispatch(
        ed.state.tr.setMeta(UPLOAD_KEY, {
          add: { id, pos, name: file.name, preview },
        } satisfies UploadMeta),
      );
      const land = (content: JSONContent) => {
        // Landed: no longer in flight, so the placeholder giving way never reads as its removal.
        uploadsRef.current.delete(id);
        const current = editorRef.current;
        if (!current || current.isDestroyed) return;
        const at = uploadPos(current.state, id);
        current.view.dispatch(
          current.state.tr.setMeta(UPLOAD_KEY, {
            remove: id,
          } satisfies UploadMeta),
        );
        const swap = replaced(current.state);
        if (at === null && !swap) return;
        // An image, video or audio clip is a block of its own: after the block it was dropped in.
        current
          .chain()
          .insertContentAt(
            swap
              ? { from: swap.from, to: swap.to }
              : content.type === "text"
                ? at!
                : blockInsertRange(current.state, at!),
            keepImageText(content, swap?.node),
          )
          .run();
        commitNow();
      };
      let failed = false;
      const fail = (error: unknown) => {
        const current = editorRef.current;
        const live = current && !current.isDestroyed ? current : null;
        const removePlaceholder = () =>
          live?.view.dispatch(
            live.state.tr.setMeta(UPLOAD_KEY, {
              remove: id,
            } satisfies UploadMeta),
          );
        if (controller.signal.aborted) return removePlaceholder();
        // Nowhere left to show it (its text was deleted): the host's toast says so.
        if (!live || uploadPos(live.state, id) === null) {
          removePlaceholder();
          callbacks.current.onUploadError?.(file, error);
          return;
        }
        // The placeholder stays, saying it failed, until Retry or Remove.
        failed = true;
        const letGo = () => {
          target?.release();
          if (preview) URL.revokeObjectURL(preview);
        };
        failedRef.current.set(id, letGo);
        const settle = (): number | null => {
          if (!failedRef.current.has(id)) return null;
          failedRef.current.delete(id);
          letGo();
          const now = editorRef.current;
          if (!now || now.isDestroyed) return null;
          const at = uploadPos(now.state, id);
          now.view.dispatch(
            now.state.tr.setMeta(UPLOAD_KEY, {
              remove: id,
            } satisfies UploadMeta),
          );
          return at;
        };
        live.view.dispatch(
          live.state.tr.setMeta(UPLOAD_KEY, {
            fail: {
              id,
              failed: {
                retry: () => {
                  const still = editorRef.current
                    ? replaced(editorRef.current.state)
                    : null;
                  const at = settle();
                  if (at !== null)
                    startUploadRef.current?.(
                      file,
                      at,
                      kind,
                      still && replace
                        ? { pos: still.from, src: replace.src }
                        : undefined,
                    );
                  uploadsSettled();
                },
                remove: () => {
                  settle();
                  uploadsSettled();
                },
              },
            },
          } satisfies UploadMeta),
        );
        callbacks.current.onUploadError?.(file, error);
      };
      const done = (
        image
          ? Promise.all([
              uploadImage!(file, { signal: controller.signal }),
              natural,
            ]).then(([result, size]) =>
              land({
                type: "image",
                attrs: {
                  src: result.src,
                  alt: result.alt ?? null,
                  ...imageSizeAttrs(result, size),
                },
              }),
            )
          : uploadFile!(file, { signal: controller.signal }).then((result) =>
              land(
                kind === "video" || kind === "audio"
                  ? { type: kind, attrs: { src: result.href } }
                  : {
                      type: "text",
                      text: result.name,
                      marks: [{ type: "link", attrs: { href: result.href } }],
                    },
              ),
            )
      )
        .catch(fail)
        .finally(() => {
          if (preview && !failed) URL.revokeObjectURL(preview);
          if (!failed) target?.release();
          uploadsRef.current.delete(id);
          callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
          uploadsSettled();
        });
      uploadsRef.current.set(id, { controller, done });
      callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
      return true;
    },
    [commitNow, uploadsSettled],
  );
  React.useLayoutEffect(() => {
    startUploadRef.current = startUpload;
  }, [startUpload]);
  React.useEffect(() => {
    const failedUploads = failedRef.current;
    return () => {
      for (const letGo of failedUploads.values()) letGo();
      failedUploads.clear();
    };
  }, []);
  // Unmounted mid-upload: a placeholder still in the text says the editor went away (a host may
  // keep the file elsewhere), one already deleted that the person removed it.
  React.useEffect(() => {
    const uploads = uploadsRef.current;
    return () => {
      const ed = editorRef.current;
      for (const [id, { controller }] of uploads) {
        let kept = false;
        try {
          kept = !!ed && uploadPos(ed.state, id) !== null;
        } catch {
          // A destroyed editor with no state left to read: the editor went away.
          kept = true;
        }
        controller.abort(
          kept
            ? TEXT_EDIT_UPLOAD_ABORT.unmounted
            : TEXT_EDIT_UPLOAD_ABORT.removed,
        );
      }
    };
  }, []);

  /** Pasted `data:` images as files, by the `blob:` URL the paste carries each under. */
  const pastedFilesRef = React.useRef(new Map<string, File>());
  /** The images the paste or drop being handled carries to import (`pastedImagesExtension`). */
  const importRef = React.useRef<Map<string, ExternalImage[]> | null>(null);
  const importQueue = React.useRef({
    active: 0,
    waiting: [] as (() => void)[],
  });

  /** Import an image from another site at `pos`: a placeholder now, the image or a link once done. */
  const startExternalImage = React.useCallback(
    (
      image: ExternalImage,
      pos: number,
      failed: () => void,
      /**
       * Replace this image (an image's Replace): it stays until the import lands, then gives way
       * in one step (one undo); a failed import leaves it.
       */
      replace?: ImageToReplace,
    ) => {
      const ed = editorRef.current;
      const importImage = callbacks.current.onExternalImage;
      if (!ed || ed.isDestroyed || !importImage) return;
      const id = `upload-${Math.random().toString(36).slice(2)}`;
      const controller = new AbortController();
      const name = urlFileName(image.src) || "image";
      // The image being replaced, followed through every change while the import runs (anyone's):
      // once a change removes or rewrites it, it is lost and the replacement is dropped — never
      // another image in its place.
      const target = replace ? holdPosition(ed, replace.pos, true) : null;
      ed.view.dispatch(
        ed.state.tr.setMeta(UPLOAD_KEY, {
          add: { id, pos, name, preview: null },
        } satisfies UploadMeta),
      );
      const land = (content: JSONContent | null) => {
        // Landed: no longer in flight, so the placeholder giving way never reads as its removal.
        uploadsRef.current.delete(id);
        const current = editorRef.current;
        if (!current || current.isDestroyed) return;
        const at = uploadPos(current.state, id);
        current.view.dispatch(
          current.state.tr.setMeta(UPLOAD_KEY, {
            remove: id,
          } satisfies UploadMeta),
        );
        if (at === null || !content) return;
        let range = blockInsertRange(current.state, at);
        let replaced: PMNode | null = null;
        if (replace) {
          const from = target?.get() ?? null;
          replaced = from === null ? null : current.state.doc.nodeAt(from);
          // The image to replace is gone (removed or changed meanwhile): nothing lands.
          if (
            replaced?.type.name !== "image" ||
            replaced.attrs.src !== replace.src
          )
            return;
          range = { from: from!, to: from! + replaced.nodeSize };
        }
        current
          .chain()
          .insertContentAt(range, keepImageText(content, replaced))
          .run();
        commitNow();
      };
      const run = () =>
        controller.signal.aborted
          ? Promise.resolve()
          : importImage(image.src, { signal: controller.signal }).then(
              async (result) =>
                land({
                  type: "image",
                  attrs: {
                    src: result.src,
                    alt: result.alt ?? image.alt,
                    ...imageSizeAttrs({}, await imageSize(result.src)),
                  },
                }),
              () => {
                if (controller.signal.aborted) return;
                // A replacement that fails keeps the image it would have replaced.
                if (replace) {
                  land(null);
                  failed();
                  return;
                }
                land({
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: image.src,
                      marks: [{ type: "link", attrs: { href: image.src } }],
                    },
                  ],
                });
                failed();
              },
            );
      // At most three imports at a time; the rest wait their turn.
      const queue = importQueue.current;
      const done = new Promise<void>((resolve) => {
        const go = () => {
          queue.active++;
          void run().finally(() => {
            queue.active--;
            queue.waiting.shift()?.();
            resolve();
          });
        };
        if (queue.active < EXTERNAL_IMAGE_CONCURRENCY) go();
        else queue.waiting.push(go);
      }).finally(() => {
        target?.release();
        uploadsRef.current.delete(id);
        callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
        uploadsSettled();
      });
      uploadsRef.current.set(id, { controller, done });
      callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
    },
    [commitNow, uploadsSettled],
  );

  /** Import the images a paste or drop carried, each where it sat (a `data:` image uploads). */
  const placeImages = React.useCallback(
    (images: readonly PlacedImage[]) => {
      let warned = false;
      const failed = () => {
        if (warned) return;
        warned = true;
        toast.add({ title: EXTERNAL_IMAGE_FAILED });
      };
      for (const { image, pos } of images) {
        if (image.file) {
          startUpload(image.file, pos, "image");
          pastedFilesRef.current.delete(image.src);
          URL.revokeObjectURL(image.src);
        } else startExternalImage(image, pos, failed);
      }
    },
    [startExternalImage, startUpload],
  );
  const placeImagesRef = React.useRef(placeImages);
  placeImagesRef.current = placeImages;

  /** Set by Mod-Shift-V: the next paste is plain text. */
  const plainPasteRef = React.useRef(false);

  /** Upload each file at `pos`; true when at least one had somewhere to go. */
  const uploadFiles = React.useCallback(
    (files: readonly File[], pos: number, as?: MediaKind) => {
      let started = false;
      for (const file of files) started = startUpload(file, pos, as) || started;
      return started;
    },
    [startUpload],
  );
  // The insert panels' Upload tabs: each kind the host can take, landing at the caret.
  const panelUploads = React.useMemo(() => {
    const at = (as: MediaKind) => (files: File[]) => {
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed) return;
      // A selected image (the image's Replace) gives way to the first file once it has landed;
      // until then — and for good if the upload fails — the image stays.
      const { selection } = ed.state;
      const [first, ...rest] = files;
      if (
        first &&
        selection instanceof NodeSelection &&
        selection.node.type.name === "image"
      ) {
        startUpload(first, selection.from, as, {
          pos: selection.from,
          src: String(selection.node.attrs.src ?? ""),
        });
        uploadFiles(rest, selection.to, as);
        return;
      }
      uploadFiles(files, selection.from, as);
    };
    const uploads: Partial<Record<MediaKind, (files: File[]) => void>> = {};
    if (onImageUpload) uploads.image = at("image");
    if (onFileUpload) {
      uploads.video = at("video");
      uploads.audio = at("audio");
      uploads.file = at("file");
    }
    return uploads;
  }, [onImageUpload, onFileUpload, startUpload, uploadFiles]);

  // The image panel's Link with `onExternalImage`: another site's image is imported (rehosted)
  // like a pasted one — a placeholder now, the image (or a link, with a toast) once done. A
  // selected image (its Replace) gives way to it. Without the hook, the link is inserted as is.
  const panelImageLink = React.useCallback(
    (url: string) => {
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed || !callbacks.current.onExternalImage)
        return false;
      if (!isExternalImage(url)) return false;
      const { selection } = ed.state;
      const replacing =
        selection instanceof NodeSelection &&
        selection.node.type.name === "image";
      if (replacing)
        startExternalImage(
          { src: url, alt: null },
          selection.to,
          () => toast.add({ title: EXTERNAL_IMAGE_REPLACE_FAILED }),
          { pos: selection.from, src: String(selection.node.attrs.src ?? "") },
        );
      else
        startExternalImage({ src: url, alt: null }, selection.from, () =>
          toast.add({ title: EXTERNAL_IMAGE_FAILED }),
        );
      return true;
    },
    [startExternalImage],
  );

  // The view's event props, rebuilt each render (they read this render's state) but handed to
  // Tiptap through one stable object: a new \`editorProps\` each render made \`useEditor\` call
  // \`setOptions\` from an effect, redrawing the view (and creating React node views) inside React's
  // commit — "flushSync was called from inside a lifecycle method" on every callout or code block.
  const liveProps: EditorProps = {
    handleDOMEvents: {
      // A double-click on a file chip opens the file in the viewer.
      dblclick: (_view, event) => {
        const chip = (event.target as Element).closest?.<HTMLAnchorElement>(
          "a[data-slot=file-chip]",
        );
        const open = openFileRef.current;
        if (!chip || !open) return false;
        event.preventDefault();
        open(chip.getAttribute("href") ?? "", chip.textContent ?? "");
        return true;
      },
    },
    handleKeyDown: (view, event) => {
      // The paste popover goes on the next keystroke (Tab moves into it); Escape only closes it.
      if (pastedRef.current?.open && !MODIFIER_KEYS.has(event.key)) {
        // Tab moves into the popover, onto the choice in effect.
        const choice = document.querySelector<HTMLElement>(
          "[data-slot=text-edit-paste] [aria-pressed=true]",
        );
        if (event.key === "Tab" && !event.shiftKey && choice) {
          event.preventDefault();
          choice.focus();
          return true;
        }
        closePasted();
        if (event.key === "Escape") {
          event.preventDefault();
          return true;
        }
      }
      // The slash and mention menus own Enter, arrows and Escape while open.
      if (SLASH_KEY.getState(view.state)?.active) return false;
      if (MENTION_KEY.getState(view.state)?.active) return false;
      const mod = event.metaKey || event.ctrlKey;
      // In a block view's source, ⌘Enter and Escape go back to its preview.
      if (
        ((event.key === "Enter" && mod) || event.key === "Escape") &&
        blockViewKey(view, editorRef.current)
      ) {
        event.preventDefault();
        return true;
      }
      if (event.key === "Enter" && mod) {
        event.preventDefault();
        const ed = editorRef.current;
        if (!ed) return true;
        if (callbacks.current.onSubmit) {
          // What is submitted is final: a paste still waiting becomes a link now.
          settlePasted();
          const next = serialize(ed);
          // Submitted is handled: a later blur must not commit the same text.
          if (baselineRef.current !== null) baselineRef.current = next;
          callbacks.current.onSubmit(next);
        } else ed.commands.blur();
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        // An open find bar closes first, the caret back where it was.
        if (findOpenRef.current) closeFindRef.current();
        else if (escapeRef.current === "blur") {
          // Keep what is typed: a document that saves as you type must never lose saved text.
          commit();
          editorRef.current?.commands.blur();
        } else revert();
        return true;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "v") {
        // Paste as plain text: the paste that follows inserts the text literally.
        plainPasteRef.current = true;
        setTimeout(() => (plainPasteRef.current = false), 1000);
        return false;
      }
      // ⌘A in a code block (a diagram's source too) selects its code first; a second ⌘A, the page.
      if (mod && !event.shiftKey && event.key.toLowerCase() === "a") {
        const { $from, $to, from, to } = view.state.selection;
        if (
          $from.parent.type.name === "codeBlock" &&
          $from.sameParent($to) &&
          (from !== $from.start() || to !== $from.end())
        ) {
          event.preventDefault();
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(view.state.doc, $from.start(), $from.end()),
            ),
          );
          return true;
        }
      }
      if (mod && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // The editor's ⌘K is the link panel; an app's own ⌘K palette must not open too.
        event.stopPropagation();
        setPanel("link");
        return true;
      }
      return false;
    },
    transformPastedHTML: (html) => {
      // With `onExternalImage`, a pasted `data:` image is kept, as a file to upload.
      for (const url of pastedFilesRef.current.keys()) URL.revokeObjectURL(url);
      pastedFilesRef.current.clear();
      const { onExternalImage: importing, onImageUpload: uploading } =
        callbacks.current;
      return sanitizePastedHTML(
        notionPastedHTML(
          importing && uploading
            ? dataImagesToBlobs(html, pastedFilesRef.current)
            : html,
        ),
      );
    },
    // With `onExternalImage`, another site's images (and pasted `data:` ones) never stay in the
    // document as they are: the paste lands with them, and `pastedImagesExtension` takes them out
    // in the same step, each to import where it sat.
    transformPasted: (slice, view) => {
      importRef.current =
        callbacks.current.onExternalImage && !view.dragging
          ? importableImages(slice, pastedFilesRef.current)
          : null;
      return slice;
    },
    // Markdown pasted as plain text is parsed, not inserted verbatim. A bare URL over a selection
    // is left to the link extension, which links the selection. Pasted files (a
    // screenshot) upload, when the host takes uploads.
    // Markdown in the plain-text flavour is parsed even beside HTML that only wraps it (a code
    // editor's copy); real rich HTML still pastes rich. One fenced block becomes a code block.
    // Inside a code block everything stays literal; Mod-Shift-V pastes as plain text.
    handlePaste: (view, event) => {
      const ed = editorRef.current;
      const files = Array.from(event.clipboardData?.files ?? []);
      const text = event.clipboardData?.getData("text/plain");
      const plain = plainPasteRef.current;
      plainPasteRef.current = false;
      const supported = files.some((file) =>
        inlineImageTypesRef.current.includes(
          file.type.split(";")[0]!.trim().toLowerCase(),
        )
          ? Boolean(callbacks.current.onImageUpload)
          : Boolean(callbacks.current.onFileUpload),
      );
      if (ed && files.length > 0 && !text && !supported) {
        // Keep the selection, but say why nothing happened.
        toast.add({
          title:
            files.length === 1
              ? "This file can't be pasted here"
              : "These files can't be pasted here",
        });
        return true;
      }
      if (ed && !ed.isDestroyed && supported && !text) {
        const { from, to } = view.state.selection;
        if (from !== to) view.dispatch(view.state.tr.deleteSelection());
        if (uploadFiles(files, view.state.selection.from)) return true;
      }
      if (!ed || !text || ed.isActive("codeBlock")) return false;
      const html = event.clipboardData?.getData("text/html");
      // A lone link: a mention of the app's record, an embed or a link (`pasteLink`), with the
      // paste popover to choose another.
      const url = plain ? null : loneUrl(text, html);
      if (url && pasteLinkRef.current(url)) return true;
      const insertLiteral = () => {
        ed.commands.insertContent(
          text.split(/\r?\n/).map((line) => ({
            type: "paragraph",
            content: line ? [{ type: "text", text: line }] : [],
          })),
        );
        return true;
      };
      const insertCode = (code: string, language: string | null = null) => {
        ed.commands.insertContent({
          type: "codeBlock",
          attrs: { language },
          content: code ? [{ type: "text", text: code }] : [],
        });
        return true;
      };
      if (plain) return insertLiteral();
      const wrapper = html ? codeWrapperKind(html) : null;
      if (html && !wrapper) return false;
      const fence = singleFence(text);
      if (fence) return insertCode(fence.code, fence.language);
      // Notion's Markdown (its callouts) read as the editor's.
      const markdownText = notionMarkdown(text);
      if (wrapper) {
        // Copied from a code editor: markdown only on strong signals and when it isn't code.
        if (!strongMarkdown(text) || looksLikeCode(text)) {
          return wrapper === "code" && /\n./.test(text.trim())
            ? insertCode(text.replace(/\r\n/g, "\n").replace(/\n+$/, ""))
            : insertLiteral();
        }
      } else if (!looksLikeMarkdown(markdownText)) return false;
      ed.commands.insertContent(markdownText, { contentType: "markdown" });
      return true;
    },
    handleDrop: (view, event, _slice, moved) => {
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (moved || files.length === 0) return false;
      const pos =
        view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
        view.state.selection.from;
      if (!uploadFiles(files, pos)) return false;
      event.preventDefault();
      return true;
    },
  };
  const livePropsRef = React.useRef(liveProps);
  livePropsRef.current = liveProps;
  const [stableHandlers] = React.useState<EditorProps>(() => ({
    handleDOMEvents: {
      dblclick: (view, event) =>
        livePropsRef.current.handleDOMEvents?.dblclick?.call(
          view,
          view,
          event,
        ) ?? false,
    },
    handleKeyDown: (view, event) =>
      livePropsRef.current.handleKeyDown?.call(view, view, event) ?? false,
    transformPastedHTML: (html, view) =>
      livePropsRef.current.transformPastedHTML?.call(view, html, view) ?? html,
    transformPasted: (slice, view, plain) =>
      livePropsRef.current.transformPasted?.call(view, slice, view, plain) ??
      slice,
    handlePaste: (view, event, slice) =>
      livePropsRef.current.handlePaste?.call(view, view, event, slice) ?? false,
    handleDrop: (view, event, slice, moved) =>
      livePropsRef.current.handleDrop?.call(view, view, event, slice, moved) ??
      false,
  }));
  // The root's attributes change with the menus (`aria-activedescendant`) and the props: read
  // through a ref by a stable function, so they never re-prop the editor either.
  const attributesRef = React.useRef(editorAttributes);
  attributesRef.current = editorAttributes;
  const [editorProps] = React.useState<EditorProps>(() => ({
    attributes: () => attributesRef.current,
    ...stableHandlers,
  }));

  const editor = useEditor({
    extensions,
    // A shared document's content is its Yjs document's: never seeded from here (a client-seeded
    // document duplicates its text when it meets the server's).
    ...(collab
      ? {}
      : diff
        ? { content: diff.doc }
        : {
            content: value ?? defaultValue,
            ...(markdown ? { contentType: "markdown" as const } : {}),
          }),
    editable,
    immediatelyRender: false,
    editorProps,
    onUpdate: ({ editor: ed }) => {
      // A shared document is never serialized per keystroke (E3): its Markdown is derived on save.
      if (quiet) return;
      liveDocRef.current = ed.state.doc;
      callbacks.current.onValueChange?.(serialize(ed));
    },
  });

  // New root attributes reach the view after React's commit (a microtask), as one view update —
  // never from an effect, where a redraw that makes a React node view would \`flushSync\` mid-commit.
  React.useEffect(() => {
    if (!editor) return;
    let live = true;
    queueMicrotask(() => {
      if (live && !editor.isDestroyed) editor.view.setProps({});
    });
    return () => {
      live = false;
    };
  }, [editor, editorAttributes]);

  // A diff view follows its document: another pair of versions replaces it (never an edit).
  const diffDoc = diff?.doc;
  React.useEffect(() => {
    if (!editor || editor.isDestroyed || !diffing || !diffDoc) return;
    editor.commands.setContent(diffDoc, { emitUpdate: false });
  }, [editor, diffing, diffDoc]);

  editorRef.current = editor;
  if (editor) EDITOR_EMBEDS.set(editor, embeds);
  // Published only once this render commits (before paint): an abandoned render never reaches a
  // node view, and a new function re-renders every one already mounted.
  const liveBlockRender = React.useMemo(
    () => liveBlockRenderer(renderLiveBlock, renderTaskQuery),
    [renderLiveBlock, renderTaskQuery],
  );
  React.useLayoutEffect(() => {
    if (editor && !editor.isDestroyed)
      setLiveBlockRender(editor, liveBlockRender);
  }, [editor, liveBlockRender]);
  // Its node views and commands read the host's block views from here, during their own render.
  if (editor) blockViewsByEditor.set(editor, blockViews ?? {});

  // The document the host passed in is the committed one until something changes it.
  React.useEffect(() => {
    if (!quiet && editor && committedRef.current === null)
      committedRef.current = serialize(editor);
  }, [quiet, editor, serialize]);

  // The file picker behind the image panel's Upload and the slash menu's File. Files land where
  // the caret was when it opened, held while the dialog is open (others may edit meanwhile).
  const pickAtRef = React.useRef<HeldPosition | null>(null);
  React.useEffect(() => () => pickAtRef.current?.release(), []);
  const picker = useFileDrop({
    onFilesAccepted: (files) => {
      const ed = editorRef.current;
      const held = pickAtRef.current;
      pickAtRef.current = null;
      held?.release();
      if (!ed || ed.isDestroyed) return;
      uploadFiles(files, held?.get() ?? ed.state.selection.from);
    },
    accept: onFileUpload ? undefined : { "image/*": [] },
    paste: false,
    preventWindowDrop: false,
  });
  pickRef.current = () => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) return;
    pickAtRef.current?.release();
    pickAtRef.current = holdPosition(ed, ed.state.selection.from);
    picker.open();
  };
  const canUpload = Boolean(onImageUpload || onFileUpload);

  // The document is in the DOM once `EditorContent` has mounted it (a child's layout effect), so
  // the shell swaps the read view out before the browser paints.
  React.useLayoutEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  React.useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // Autosave: `onCommit` after an idle gap. Off unless `autosave` is set.
  // The pasted link's range, followed through every change (`pastedTracker`).
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.registerPlugin(pastedTracker());
    return () => {
      if (!editor.isDestroyed) editor.unregisterPlugin(PASTED_KEY);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!editor || !autosave || collab) return;
    const delay = autosave === true ? 1000 : autosave;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(commit, delay);
    };
    editor.on("update", schedule);
    return () => {
      clearTimeout(timer);
      editor.off("update", schedule);
    };
  }, [editor, autosave, commit]);

  // A hidden page (tab switch, close) and an unmount mid-edit both commit through the same path.
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") commit();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      commit();
    };
  }, [commit]);

  // External value: applied at once while unfocused, deferred to blur while focused.
  const pendingValueRef = React.useRef<string | undefined>(undefined);
  const applyValue = React.useCallback(
    (ed: Editor, next: string) => {
      committedRef.current = next;
      if (serialize(ed) === next) return;
      ed.commands.setContent(next, {
        emitUpdate: false,
        ...(markdown ? { contentType: "markdown" as const } : {}),
      });
    },
    [markdown, serialize],
  );

  // Hidden and shown again, the editor is a new one: give it the live document, and treat that as
  // what the host has (the hide committed it). A value deferred while focused applies now.
  const shownEditorRef = React.useRef<Editor | null>(null);
  React.useEffect(() => {
    if (!editor) return;
    const previous = shownEditorRef.current;
    shownEditorRef.current = editor;
    const live = liveDocRef.current;
    if (!collab && previous && previous !== editor && live) {
      editor.commands.setContent(live.toJSON(), { emitUpdate: false });
      committedRef.current = serialize(editor);
      baselineRef.current = null;
      const pending = pendingValueRef.current;
      pendingValueRef.current = undefined;
      if (pending !== undefined) applyValue(editor, pending);
    }
    return () => {
      if (!editor.isDestroyed) liveDocRef.current = editor.state.doc;
    };
  }, [editor, serialize, applyValue]);

  // Only a value that changed is news: a rebuilt editor already holds the live document.
  const seenValueRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    // A diff shows `diff.doc`: a `value` never replaces it.
    if (!editor || value === undefined || quiet) return;
    if (value === seenValueRef.current) return;
    seenValueRef.current = value;
    if (editor.isFocused) {
      pendingValueRef.current = value;
      return;
    }
    pendingValueRef.current = undefined;
    applyValue(editor, value);
  }, [editor, value, applyValue]);

  // Focus: the editor and every floating part (bubble menu, panels, slash menu, table menus) are one
  // editing session. Arriving records the baseline; leaving all of them commits.
  const isInside = React.useCallback((node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      Boolean(rootRef.current?.contains(node)) ||
      Boolean(node.closest(FLOATING_SLOTS))
    );
  }, []);
  const leave = React.useCallback(
    (next: EventTarget | null) => {
      if (isInside(next)) return;
      settlePasted();
      commit();
      baselineRef.current = null;
      setPanel(null);
      const ed = editorRef.current;
      // The menus live in `<body>`, so tiptap's own blur check never hides them; the session
      // ending does.
      if (ed && !ed.isDestroyed)
        ed.view.dispatch(ed.state.tr.setMeta(menuKeys.bubble, "hide"));
      const pending = pendingValueRef.current;
      if (ed && pending !== undefined) {
        pendingValueRef.current = undefined;
        applyValue(ed, pending);
      }
      leaveViewRef.current?.();
    },
    [commit, isInside, applyValue, menuKeys, settlePasted],
  );
  leaveRef.current = leave;

  // The read view comes back once the session is over for good. Checked a task later, when focus
  // has settled: not while the editor or one of its floating parts holds focus, not while the
  // window itself is blurred (a file picker, another app — focus returns to the editor), and not
  // while an upload is still landing or a failed one waits for Retry or Remove (settling re-runs this).
  const onLeaveViewRef = React.useRef(onLeaveView);
  onLeaveViewRef.current = onLeaveView;
  const leaveTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  leaveViewRef.current = () => {
    if (!onLeaveViewRef.current) return;
    clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      const ed = editorRef.current;
      const onLeaveViewNow = onLeaveViewRef.current;
      if (!ed || ed.isDestroyed || !onLeaveViewNow) return;
      if (ed.view.hasFocus() || isInside(document.activeElement)) return;
      if (
        !document.hasFocus() ||
        uploadsRef.current.size > 0 ||
        failedRef.current.size > 0
      )
        return;
      // Reached from an upload settling too, where no blur ran `leave()`: close the session
      // (commit is idempotent) before the editor is hidden.
      commit();
      baselineRef.current = null;
      onLeaveViewNow(serialize(ed));
    }, 0);
  };
  // A check skipped while the window was blurred (another tab, a file picker) runs again when it
  // comes back; with the editor focused again it is a no-op.
  const leavesView = onLeaveView !== undefined;
  React.useEffect(() => {
    if (!leavesView) return;
    const recheck = () => leaveViewRef.current?.();
    const onVisibility = () => {
      if (document.visibilityState === "visible") recheck();
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [leavesView]);
  React.useEffect(() => () => clearTimeout(leaveTimerRef.current), []);

  // An upload whose placeholder went with its text (deleted, a block replaced) is let go — in
  // flight, it is stopped; failed:
  // its preview, its hold on an image it would replace, its count and the hold it put on handing
  // the read view back.
  React.useEffect(() => {
    if (!editor) return;
    const reconcile = ({ transaction }: { transaction: Transaction }) => {
      if (!transaction.docChanged) return;
      // An upload still in flight whose placeholder was deleted (its text removed) is stopped
      // now, saying so: the host can let go of the file at once. A placeholder an upload removes
      // itself (it landed, or gave way to a retry) carries the upload meta.
      if (!transaction.getMeta(UPLOAD_KEY))
        for (const [id, { controller }] of uploadsRef.current)
          if (
            !controller.signal.aborted &&
            uploadPos(editor.state, id) === null
          )
            controller.abort(TEXT_EDIT_UPLOAD_ABORT.removed);
      if (failedRef.current.size === 0) return;
      let gone = false;
      for (const [id, letGo] of failedRef.current)
        if (uploadPos(editor.state, id) === null) {
          failedRef.current.delete(id);
          letGo();
          gone = true;
        }
      if (gone) uploadsSettled();
    };
    editor.on("transaction", reconcile);
    return () => {
      editor.off("transaction", reconcile);
    };
  }, [editor, uploadsSettled]);

  React.useEffect(() => {
    if (!editor) return;
    const onFocus = () => {
      if (!quiet && editor.isEditable && baselineRef.current === null)
        baselineRef.current = serialize(editor);
    };
    const onBlur = ({ event }: { event: FocusEvent }) => {
      if (panel) return;
      leave(event.relatedTarget);
    };
    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    return () => {
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
    };
  }, [editor, serialize, leave, panel]);

  // Outline: every heading's id, level and text — after load, then when idle after a change (300ms).
  React.useEffect(() => {
    if (!editor || !onOutlineChange) return;
    let last = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const emit = () => {
      if (editor.isDestroyed) return;
      const { doc } = editor.state;
      const outline = headingsOf(doc)
        .filter((entry) => entry.level <= 4)
        .map((entry) => {
          const blockId = doc.nodeAt(entry.pos)?.attrs.blockId as
            string | null | undefined;
          return {
            id: entry.id,
            level: entry.level as 1 | 2 | 3 | 4,
            text: entry.text,
            ...(blockId ? { blockId } : {}),
          };
        });
      const key = JSON.stringify(outline);
      if (key === last) return;
      last = key;
      callbacks.current.onOutlineChange?.(outline);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => whenIdle(emit), 300);
    };
    emit();
    editor.on("update", schedule);
    return () => {
      clearTimeout(timer);
      editor.off("update", schedule);
    };
  }, [editor, onOutlineChange]);

  // Word and character counts: once after load, then when idle after a change (300ms) — never per
  // keystroke (counting walks the whole document).
  React.useEffect(() => {
    if (!editor || !onStatsChange) return;
    let last = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const emit = () => {
      if (editor.isDestroyed) return;
      const stats = docStats(editor.state);
      const key = `${stats.words}:${stats.characters}`;
      if (key === last) return;
      last = key;
      callbacks.current.onStatsChange?.(stats);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => whenIdle(emit), 300);
    };
    whenIdle(emit);
    editor.on("update", schedule);
    return () => {
      clearTimeout(timer);
      editor.off("update", schedule);
    };
  }, [editor, onStatsChange]);

  // Linked checklist lines: this person's own ticks reach the host — never a collaborator's, a
  // value sync or the host's own `setTaskItemChecked`.
  React.useEffect(() => {
    if (!editor) return;
    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      const notify = taskToggleRef.current;
      if (!notify || !isOwnEdit(transaction)) return;
      for (const [taskId, checked] of taskToggles(transaction))
        notify(taskId, checked);
    };
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("transaction", onTransaction);
    };
  }, [editor]);

  // Section marks: rebuilt when the host's list changes (by content, not identity).
  const sectionMarksKey = JSON.stringify(sectionMarks ?? []);
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.state.tr
        .setMeta(
          SECTION_MARKS_KEY,
          JSON.parse(sectionMarksKey) as TextEditSectionMark[],
        )
        .setMeta("addToHistory", false),
    );
  }, [editor, sectionMarksKey]);

  // Annotations: resolved into the document whenever the host's list changes.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.state.tr
        .setMeta(ANNOTATION_KEY, {
          type: "set",
          items: annotations ?? [],
        } satisfies AnnotationMeta)
        .setMeta("addToHistory", false),
    );
  }, [editor, annotations]);
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.state.tr
        .setMeta(ANNOTATION_KEY, {
          type: "active",
          id: activeAnnotationId,
        } satisfies AnnotationMeta)
        .setMeta("addToHistory", false),
    );
  }, [editor, activeAnnotationId]);
  // How highlights present themselves: tab stops in view mode, and the optional count pills.
  const clickable = Boolean(onAnnotationClick);
  const viewing = readOnly && !disabled;
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.state.tr
        .setMeta(ANNOTATION_KEY, {
          type: "options",
          options: {
            focusable: viewing && clickable,
            clickable,
            counts: annotationCounts,
            label: annotationLabel,
            countLabel: annotationCountLabel,
          },
        } satisfies AnnotationMeta)
        .setMeta("addToHistory", false),
    );
  }, [
    editor,
    viewing,
    clickable,
    annotationCounts,
    annotationLabel,
    annotationCountLabel,
  ]);

  // Annotation layout: each highlight's top (relative to the TextEdit root) and its current
  // anchor, reported once per frame when either changes.
  React.useEffect(() => {
    if (!editor || !onAnnotationsLayout) return;
    let frame = 0;
    let last = "";
    const report = () => {
      frame = 0;
      if (editor.isDestroyed) return;
      const state = ANNOTATION_KEY.getState(editor.state);
      const root = rootRef.current;
      if (!state || !root) return;
      const { doc } = editor.state;
      const origin = root.getBoundingClientRect().top;
      const items = [...state.ranges].map(([id, range]) => {
        if (!range) return { id, top: null, anchor: null };
        let top: number | null = null;
        try {
          top = editor.view.coordsAtPos(range.from).top - origin;
        } catch {
          top = null;
        }
        const offsets = rangeToOffsets(doc, range.from, range.to);
        const anchor: TextEditAnchor = anchorFromRange(
          anchorText(doc),
          offsets.start,
          offsets.end,
        );
        // A shared highlight's relative positions travel with it: persisting the moved anchor
        // must not drop them (they are what keep it exact through collaborators' edits).
        const refs = state.y.get(id);
        if (refs)
          anchor.y = {
            start: Y.encodeRelativePosition(refs.start),
            end: Y.encodeRelativePosition(refs.end),
          };
        return { id, top, anchor };
      });
      const key = JSON.stringify(items, (_key, value: unknown) =>
        value instanceof Uint8Array ? Array.from(value) : value,
      );
      if (key === last) return;
      last = key;
      callbacks.current.onAnnotationsLayout?.(items);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(report);
    };
    schedule();
    editor.on("transaction", schedule);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    if (rootRef.current) observer?.observe(rootRef.current);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      editor.off("transaction", schedule);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [editor, onAnnotationsLayout, rootRef]);

  const getAnchorForSelection = React.useCallback((): TextEditAnchor | null => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) return null;
    const { from, to, empty } = ed.state.selection;
    if (empty) return null;
    const { doc } = ed.state;
    const offsets = rangeToOffsets(doc, from, to);
    if (offsets.start === offsets.end) return null;
    const anchor = anchorFromRange(anchorText(doc), offsets.start, offsets.end);
    // A shared document's highlight also carries its Yjs relative positions.
    const y = yAnchorOf(ed.state, from, to);
    return y ? { ...anchor, y } : anchor;
  }, []);

  // The imperative handle the shell's `handleRef` delegates to.
  const pulseTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(pulseTimerRef.current), []);
  React.useImperativeHandle(
    editorHandle,
    () => ({
      scrollToHeading: (id: string) => {
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return false;
        // `<slug>~<blockId>`, a block id or a slug: the block id wins (a renamed heading keeps its
        // link), then the slug.
        const tilde = id.lastIndexOf("~");
        const slug = tilde >= 0 ? id.slice(0, tilde) : id;
        const blockId = tilde >= 0 ? id.slice(tilde + 1) : id;
        const headings = headingsOf(ed.state.doc);
        const entry =
          headings.find(
            (heading) =>
              blockId !== "" &&
              ed.state.doc.nodeAt(heading.pos)?.attrs.blockId === blockId,
          ) ?? headings.find((heading) => heading.id === slug);
        if (!entry) return false;
        const scroll = () => {
          if (ed.isDestroyed) return;
          const dom = ed.view.nodeDOM(entry.pos);
          if (dom instanceof HTMLElement)
            dom.scrollIntoView({ block: "start", behavior: "smooth" });
        };
        // Toggles around it open first; it scrolls once they have drawn.
        if (expandAncestors(ed, toggleRuntime, entry.pos + 1))
          requestAnimationFrame(scroll);
        else scroll();
        return true;
      },
      getStats: () => {
        const ed = editorRef.current;
        return ed && !ed.isDestroyed ? docStats(ed.state) : null;
      },
      openFind: () => openFindRef.current(),
      flush: async () => {
        settlePasted();
        commitNow();
        await Promise.allSettled(
          [...uploadsRef.current.values()].map((upload) => upload.done),
        );
      },
      focus: (position) => {
        editorRef.current?.commands.focus(position ?? null);
      },
      getAnchorForSelection,
      markSaved,
      uploadFiles: (files: readonly File[]) => {
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return;
        uploadFiles(files, ed.state.selection.from);
      },
      pickFiles: () => pickRef.current?.(),
      pendingUploads: () => uploadsRef.current.size,
      clearHistory: () => {
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return;
        const undo = yUndoPluginKey.getState(ed.state) as
          { undoManager?: Y.UndoManager } | undefined;
        undo?.undoManager?.clear();
      },
      linkTaskItems: (links: readonly TextEditTaskLink[]) => {
        const ed = editorRef.current;
        return ed && !ed.isDestroyed
          ? linkTaskItemsIn(ed, links, collab !== null)
          : 0;
      },
      setTaskItemChecked: (taskId: string, checked: boolean) => {
        const ed = editorRef.current;
        return ed && !ed.isDestroyed
          ? setLinkedTaskChecked(ed, taskId, checked)
          : 0;
      },
      pulseAnnotation: (id: string) => {
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return;
        const set = (pulse: string | null) =>
          ed.view.dispatch(
            ed.state.tr
              .setMeta(ANNOTATION_KEY, {
                type: "pulse",
                id: pulse,
              } satisfies AnnotationMeta)
              .setMeta("addToHistory", false),
          );
        set(id);
        const range = ANNOTATION_KEY.getState(ed.state)?.ranges.get(id);
        // A comment inside a closed toggle: it opens for this viewer first.
        if (range && expandAncestors(ed, toggleRuntime, range.from))
          requestAnimationFrame(() =>
            ed.view.domAtPos(range.from).node.parentElement?.scrollIntoView({
              block: "center",
              behavior: "smooth",
            }),
          );
        else if (range)
          ed.view.domAtPos(range.from).node.parentElement?.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = setTimeout(() => {
          if (!ed.isDestroyed) set(null);
        }, 3000);
      },
    }),
    [
      commitNow,
      getAnchorForSelection,
      markSaved,
      rootRef,
      settlePasted,
      uploadFiles,
    ],
  );

  const canComment = Boolean(onCreateAnnotation);
  const comment = React.useCallback(() => {
    const anchor = getAnchorForSelection();
    if (anchor) callbacks.current.onCreateAnnotation?.(anchor);
  }, [getAnchorForSelection]);

  const themeScope = useInternalThemeScope();
  // Floating UI inside the bubble menus: fixed to the viewport, flipped and shifted into view —
  // and hidden while its selection is scrolled out of a clipping ancestor (the reference below
  // carries the editor as its context element, so that is the editor's own scrollers, not only
  // the viewport). `floatingSafeArea` keeps it off a sticky header or a bottom bar, and a
  // selection under one counts as scrolled out. On a coarse pointer it opens below the selection:
  // the platform's own callout sits above.
  const safeTop = floatingSafeArea?.top ?? 0;
  const safeBottom = floatingSafeArea?.bottom ?? 0;
  // The caret in a link: its card sits under the link, like the panels.
  const caretInLink =
    useEditorState({
      editor,
      selector: ({ editor: ed }) =>
        Boolean(ed && ed.state.selection.empty && ed.isActive("link")),
    }) ?? false;
  const bubbleOptions = React.useMemo(() => {
    const padding = {
      top: VIEWPORT_GAP + safeTop,
      bottom: VIEWPORT_GAP + safeBottom,
      left: VIEWPORT_GAP,
      right: VIEWPORT_GAP,
    };
    const coarse =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ?? false);
    return {
      ...FLOATING,
      flip: { padding },
      shift: { padding },
      // A link or media panel opens under its line, at the caret's start, like the slash menu that
      // opened it — never over the text above (the title, the previous block). The formatting
      // toolbar sits above the selection.
      placement: coarse
        ? ("bottom" as const)
        : (panel !== null && panel !== "turnInto") || caretInLink
          ? ("bottom-start" as const)
          : ("top" as const),
      // `-2`: a collapsed caret (a link or media panel opened from the slash menu) is a zero-width
      // rect, which floating-ui counts as fully clipped the moment it touches a clipping edge —
      // the start of an empty line. The menu would hide with focus in its field.
      hide: {
        padding: {
          top: safeTop - 2,
          bottom: safeBottom - 2,
          left: -2,
          right: -2,
        },
      },
    };
  }, [safeTop, safeBottom, panel, caretInLink]);
  const showBubble = React.useCallback(
    ({ editor: ed, from, to, state }: MenuShowProps) =>
      // A panel asked for opens; Find stepping onto a match brings no toolbar over the find bar.
      panel !== null ||
      (!isFindMatch(state, from, to) &&
        // The caret in a link (editable): the link card.
        ((ed.isEditable &&
          from === to &&
          ed.isActive("link") &&
          !ed.isActive("codeBlock")) ||
          ((ed.isEditable || canComment) &&
            from !== to &&
            // Select all in an empty editor (or a run of empty lines) selects no text: nothing to
            // format, so no menu.
            state.doc.textBetween(from, to, "\n", "").trim() !== "" &&
            !(state.selection instanceof NodeSelection) &&
            !(state.selection instanceof CellSelection) &&
            !ed.isActive("codeBlock")))),
    [panel, canComment],
  );
  // The bubble menu's anchor: the selection's live rect, with the editor as its context element so
  // the `hide` middleware measures it against the editor's clipping ancestors. A cell selection
  // keeps the plugin's own anchor (null falls back to it).
  const bubbleReference = React.useCallback(() => {
    if (!editor || editor.isDestroyed) return null;
    const { view } = editor;
    const { selection } = view.state;
    if (selection instanceof CellSelection) return null;
    const rect = () => {
      if (selection instanceof NodeSelection) {
        const node = view.nodeDOM(selection.from);
        if (node instanceof HTMLElement) return node.getBoundingClientRect();
      }
      return posToDOMRect(view, selection.from, selection.to);
    };
    return {
      getBoundingClientRect: rect,
      getClientRects: () => [rect()],
      contextElement: view.dom,
    };
  }, [editor]);
  // The plugin repositions on WINDOW scroll only, so inside a scrolling dialog or panel the menu
  // stayed put while the text moved under it. Any scroll (captured, so a nested scroller counts)
  // repositions it, once per frame.
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!editor) return;
    let frame = 0;
    const onScroll = () => {
      // Hidden menus are detached: nothing to move.
      if (frame || !bubbleRef.current?.isConnected) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (editor.isDestroyed) return;
        editor.view.dispatch(
          editor.state.tr.setMeta(menuKeys.bubble, "updatePosition"),
        );
      });
    };
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [editor, menuKeys]);
  // A panel opens from React state (⌘K, the slash menu), not from a selection change, so the
  // bubble menu is told directly; closing one re-evaluates it against the selection.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.isInitialized) return;
    const { state } = editor;
    const args = {
      editor,
      state,
      from: state.selection.from,
      to: state.selection.to,
    };
    const show = showBubble(args);
    editor.view.dispatch(
      state.tr.setMeta(menuKeys.bubble, show ? "show" : "hide"),
    );
    // The plugin's "show" positions before it attaches (a no-op while hidden): place it now that
    // it is attached, so it opens at the caret rather than wherever it last sat (or the page top).
    if (show)
      editor.view.dispatch(
        editor.state.tr.setMeta(menuKeys.bubble, "updatePosition"),
      );
  }, [editor, panel, caretInLink, menuKeys, showBubble]);

  // Behind a modal (a Dialog or Sheet opened over the editor) nothing of the editor floats over its
  // backdrop: the bubble toolbar and every floating layer hide.
  const [editorDom, setEditorDom] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setEditorDom(editor && !editor.isDestroyed ? editor.view.dom : null);
  }, [editor]);
  const behindModal = useBehindModal(editorDom);
  const host = editorDom?.closest<HTMLElement>("[data-base-ui-portal]") ?? null;
  const floating = React.useMemo(
    () => ({ behindModal, host }),
    [behindModal, host],
  );
  const appendToHost = React.useCallback(() => host ?? document.body, [host]);

  return (
    <FloatingHostContext.Provider value={floating}>
      {(editable || canComment) && editor ? (
        <BubbleMenu
          ref={bubbleRef}
          editor={editor}
          pluginKey={menuKeys.bubble}
          appendTo={appendToHost}
          options={bubbleOptions}
          getReferencedVirtualElement={bubbleReference}
          shouldShow={showBubble}
          data-base-ui-portal={host ? "" : undefined}
          className={cn("z-50", themeScope, behindModal && "hidden")}
        >
          <SelectionMenu
            editor={editor}
            panel={panel}
            onPanelChange={setPanel}
            onLeave={leave}
            onUpload={editable ? panelUploads : undefined}
            onImageLink={editable ? panelImageLink : undefined}
            onOpenFile={openFileLink}
            onComment={canComment ? comment : undefined}
          />
        </BubbleMenu>
      ) : null}
      {slash && editable ? (
        <SuggestionMenu
          id={slashListId}
          aria-label="Insert block"
          data-menu="text-edit-slash"
          className={menuLg ? undefined : "w-60"}
          size={menuSize}
          presentation={menuPresentation}
          query={sheetQuery}
          onQueryChange={(query) => {
            setSheetQuery(query);
            const next = { ...slash, index: 0 };
            slashStateRef.current = next;
            setSlashState(next);
          }}
          onClose={() => {
            const ed = editorRef.current;
            if (ed && !ed.isDestroyed) exitSuggestion(ed.view, SLASH_KEY);
          }}
          searchPlaceholder="Search blocks"
          anchor={slash.rect}
          floatingSafeArea={floatingSafeArea}
          options={slashRows.map((spec) => {
            const Icon = spec.icon;
            return {
              key: spec.id,
              label: spec.label,
              // Headings only on the full menu: a filtered list is short enough to scan.
              group: slashFiltered ? undefined : slashGroup(spec, menuLg),
              icon: menuLg ? (
                <span
                  aria-hidden
                  data-slot="text-edit-slash-icon"
                  className="flex size-7 items-center justify-center rounded-md border border-border bg-background"
                >
                  {spec.glyph ?? <Icon />}
                </span>
              ) : (
                (spec.glyph ?? <Icon />)
              ),
              shortcut: spec.hint,
              description:
                spec.description ?? (menuLg ? spec.blurb : undefined),
              disabled: spec.disabled,
            };
          })}
          activeIndex={Math.min(slash.index, Math.max(slashRows.length - 1, 0))}
          onActiveIndexChange={(index) => {
            const next = { ...slash, index };
            slashStateRef.current = next;
            setSlashState(next);
          }}
          onSelect={(index) => {
            const spec = slashRows[index];
            if (spec && !spec.disabled) slash.command(spec);
          }}
        />
      ) : null}
      {pasted?.open && editable && editor ? (
        <PasteMenu
          editor={editor}
          pasted={pasted}
          onPick={(choice) => {
            applyPasted(choice);
            editor.commands.focus();
          }}
          onClose={closePasted}
          onLeave={leave}
        />
      ) : null}
      {mentionMenu && editable ? (
        <SuggestionMenu
          id={mentionListId}
          aria-label="Mention"
          data-menu="text-edit-mention"
          className={menuLg ? undefined : "w-72"}
          size={menuSize}
          presentation={menuPresentation}
          query={sheetQuery}
          onQueryChange={(query) => {
            setSheetQuery(query);
            setMention({ ...mentionMenu, query, index: 0 });
            runSearch(query);
          }}
          onClose={() => {
            const ed = editorRef.current;
            if (ed && !ed.isDestroyed) exitSuggestion(ed.view, MENTION_KEY);
          }}
          searchPlaceholder="Search people and pages"
          anchor={mentionMenu.rect}
          floatingSafeArea={floatingSafeArea}
          options={mentionOptions(
            mentionMenu,
            mentions?.kinds ?? [],
            mentions?.sections,
          )}
          status={mentionStatus(mentionMenu)}
          emptyMessage="No matches"
          loading={mentionMenu.loading}
          activeIndex={mentionMenu.index}
          onActiveIndexChange={(index) => setMention({ ...mentionMenu, index })}
          onSelect={(index) =>
            mentionMenu.command(flatOptions(mentionMenu.results)[index]!)
          }
        />
      ) : null}
      {emojiMenu && editable ? (
        <SuggestionMenu
          id={emojiListId}
          aria-label="Emoji"
          data-menu="text-edit-emoji"
          className="w-64"
          anchor={emojiMenu.rect}
          floatingSafeArea={floatingSafeArea}
          options={emojiMenu.items.map((item) => ({
            key: item.char,
            label: item.name,
            icon: (
              <span aria-hidden className="text-base leading-none">
                {item.char}
              </span>
            ),
          }))}
          activeIndex={emojiMenu.index}
          onActiveIndexChange={(index) => {
            const next = { ...emojiMenu, index };
            emojiMenuRef.current = next;
            setEmojiMenu(next);
          }}
          onSelect={(index) => emojiMenu.command(emojiMenu.items[index]!)}
        />
      ) : null}
      {headingLinkHref && editor && !diffing ? (
        <HeadingLink
          editor={editor}
          href={(anchor) => headingLinkRef.current?.(anchor) ?? null}
        />
      ) : null}
      {dragHandles && editable && editor ? (
        <>
          <BlockHandle editor={editor} runtime={blockMenuRuntime} />
          <TableControls editor={editor} markdown={markdown} />
        </>
      ) : null}
      {editor ? (
        <ImageMenus
          editor={editor}
          slots={imageSlots}
          editable={editable}
          onOpen={onOpenImage}
          downloadHref={imageDownloadHref}
          onLeave={editable ? leave : undefined}
          onCommit={editable ? commitNow : undefined}
          onReplace={
            editable
              ? (pos) => {
                  editor.chain().focus().setNodeSelection(pos).run();
                  setPanel("image");
                }
              : undefined
          }
        />
      ) : null}
      {canUpload && editable ? (
        <>
          <input {...picker.inputProps} className="hidden" />
          <picker.Announcer />
        </>
      ) : null}
      {find && editor && !hidden ? (
        <FindBar
          editor={editor}
          editable={editable}
          top={safeTop}
          focusKey={find.key}
          initialTerm={find.term}
          onClose={() => closeFindRef.current()}
          onReveal={revealAt}
        />
      ) : null}
      <div
        data-slot="text-edit-content"
        // Clicking the blank space around short content still starts editing, Notion-style.
        onMouseDown={(event) => {
          if (!editor || !editable || event.target !== event.currentTarget)
            return;
          event.preventDefault();
          // A document that ends in a table or an atom gets an empty paragraph to type in.
          if (!editor.chain().appendParagraphAfterLastBlock().focus().run())
            editor.commands.focus("end");
        }}
        className={cn(contentClassName, findReplace && FIND_RESULT_CLASS)}
        style={contentStyle}
        hidden={hidden}
      >
        <EditorContent editor={editor} />
      </div>
    </FloatingHostContext.Provider>
  );
}
