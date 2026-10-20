// @vegastack text-edit@0.25.47 sha256-RgpdFEZtfCTrTMObLJW5iNlWOsOFyddP8zzdVySK/PU=

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
  Building2,
  CalendarDays,
  CircleCheck,
  FolderKanban,
  Code,
  Copy,
  Download,
  Ellipsis,
  Replace,
  Eraser,
  ExternalLink,
  File as FileIcon,
  FileText,
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
  Pencil,
  Unlink,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button } from "@/components/ui/button";
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
import { InlineChip } from "@/components/ui/inline-chip";
import {
  SuggestionMenu,
  suggestionMenuKeyDown,
  suggestionMenuOptionId,
  type SuggestionMenuOption,
} from "@/components/ui/suggestion-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import {
  CALLOUT_STYLE,
  MarkdownEmbed,
  MarkdownTaskList,
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
  sectionMarkClassNames,
  type TaskQueryRenderProps,
} from "@/components/ui/markdown-view";
import {
  CALLOUT_TONES,
  headingIds,
  isRecordMentionKind,
  type CalloutTone,
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
  MentionOption,
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
import {
  linkedTaskId,
  type TextEditSectionMark,
  type TextEditTaskItem,
  type TextEditTaskLink,
} from "@/components/ui/text-edit";
import { Package } from "lucide-react";

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

const heading =
  (level: 1 | 2 | 3 | 4) =>
  (ed: Editor, range: Range): void =>
    void ed.chain().focus().deleteRange(range).setHeading({ level }).run();

const SLASH: Record<TextEditSlashCommand, SlashSpec> = {
  text: {
    id: "text",
    label: "Text",
    keywords: "paragraph plain p",
    icon: Pilcrow,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setParagraph().run(),
  },
  h1: {
    id: "h1",
    label: "Heading 1",
    keywords: "title h1 #",
    hint: "#",
    icon: Heading1,
    run: heading(1),
  },
  h2: {
    id: "h2",
    label: "Heading 2",
    keywords: "subtitle h2 ##",
    hint: "##",
    icon: Heading2,
    run: heading(2),
  },
  h3: {
    id: "h3",
    label: "Heading 3",
    keywords: "h3 ###",
    hint: "###",
    icon: Heading3,
    run: heading(3),
  },
  h4: {
    id: "h4",
    label: "Heading 4",
    keywords: "h4 ####",
    hint: "####",
    icon: Heading4,
    run: heading(4),
  },
  bulletList: {
    id: "bulletList",
    label: "Bullet list",
    keywords: "unordered ul bullets -",
    hint: "-",
    icon: List,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  orderedList: {
    id: "orderedList",
    label: "Numbered list",
    keywords: "ordered ol numbers 1.",
    hint: "1.",
    icon: ListOrdered,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  taskList: {
    id: "taskList",
    label: "Checklist",
    keywords: "todo task checkbox [ ]",
    hint: "[ ]",
    icon: ListTodo,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  blockquote: {
    id: "blockquote",
    label: "Quote",
    keywords: "blockquote citation >",
    hint: ">",
    icon: Quote,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  callout: {
    id: "callout",
    label: "Callout",
    keywords: "note tip warning alert info admonition",
    icon: Info,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).wrapIn("callout").run(),
  },
  toggle: {
    id: "toggle",
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
    label: "Divider",
    keywords: "hr rule separator line ---",
    hint: "---",
    icon: Minus,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  codeBlock: {
    id: "codeBlock",
    label: "Code block",
    keywords: "pre snippet fence ```",
    hint: "```",
    icon: SquareCode,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  diagram: {
    id: "diagram",
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
  return [
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
}

type UploadMeta = { add: UploadWidget } | { remove: string };

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

/** The placeholder an upload shows until it resolves: the image dimmed under a spinner, or the file's name. */
function uploadPlaceholder(upload: UploadWidget): HTMLElement {
  // The system's one loader shape (lucide `Loader`, as `Spinner` draws it), built as DOM because
  // a ProseMirror widget is not a React tree.
  const spinner = (size: string) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", cn("shrink-0 animate-spin", size));
    for (const d of LOADER_PATHS) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  };
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
    key: upload.id,
    side: -1,
    upload,
    ref,
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

/** The mention kinds in menu order, with their group headings. */
const MENTION_GROUPS: readonly { kind: MentionKind; label: string }[] = [
  { kind: "user", label: "People" },
  { kind: "page", label: "Pages" },
  { kind: "file", label: "Files" },
  { kind: "task", label: "Tasks" },
  { kind: "meeting", label: "Meetings" },
  { kind: "customer", label: "Customers" },
  { kind: "project", label: "Projects" },
  { kind: "product", label: "Products" },
  { kind: "agent", label: "Your agents" },
];

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

/** At most five per kind, grouped People · Pages · Files · Tasks, only the enabled kinds. */
function groupResults(
  options: readonly MentionOption[],
  kinds: readonly MentionKind[],
): MentionOption[] {
  return MENTION_GROUPS.filter((group) => kinds.includes(group.kind)).flatMap(
    (group) =>
      options.filter((option) => option.kind === group.kind).slice(0, 5),
  );
}

const MENTION_GROUP_LABEL = Object.fromEntries(
  MENTION_GROUPS.map((group) => [group.kind, group.label]),
) as Record<MentionKind, string>;

/** What the mention menu says instead of rows: a search in flight, or a failed one. */
function mentionStatus(state: MentionMenuState): string | undefined {
  if (state.error) return "Couldn't search";
  if (state.results === null) return "Searching…";
  if (state.results.length === 0 && state.loading) return "Searching…";
  return undefined;
}

/** The mention menu's rows: grouped by kind, each with its kind's tinted icon or its own. */
function mentionOptions(state: MentionMenuState): SuggestionMenuOption[] {
  return flatOptions(state.results).map((option) => {
    const Icon = MENTION_ICON[option.kind];
    return {
      key: `${option.kind}:${option.id}`,
      label: option.label,
      description: option.description,
      group: MENTION_GROUP_LABEL[option.kind],
      icon: (
        <span
          aria-hidden
          data-slot="text-edit-mention-icon"
          data-tinted={option.icon ? undefined : ""}
          className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm data-tinted:bg-info/10"
        >
          {option.icon ?? (
            <Icon data-icon-tone="" className="size-3.5 text-info-text" />
          )}
        </span>
      ),
    };
  });
}

const MENTION_ICON: Record<
  MentionKind,
  React.ComponentType<React.ComponentProps<"svg">>
> = {
  user: UserRound,
  page: FileText,
  file: FileIcon,
  task: ListTodo,
  meeting: CalendarDays,
  customer: Building2,
  project: FolderKanban,
  product: Package,
  agent: Bot,
};

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
  "group/image relative my-2 max-w-full leading-none [&_img]:block [&_img]:max-w-full [&_img]:rounded-lg [&_img[data-broken]]:h-24 [&_img[data-broken]]:min-w-full [&_img[data-broken]]:border [&_img[data-broken]]:border-dashed [&_img[data-broken]]:border-border [&_img[data-broken]]:bg-muted [&_img[data-broken]]:p-3 [&_img[data-broken]]:text-sm [&_img[data-broken]]:text-muted-foreground";
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
    const sync = (next: PMNode) => {
      const { src, alt, title, width } = next.attrs as {
        src: string | null;
        alt: string | null;
        title: string | null;
        width: number | null;
      };
      if (src) {
        if (image.getAttribute("src") !== src) image.src = src;
      } else image.removeAttribute("src");
      image.alt = alt ?? "";
      if (title) image.title = title;
      else image.removeAttribute("title");
      image.style.width = width ? `${width}px` : "";
      image.style.height = "";
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
        editor
          .chain()
          .setNodeSelection(pos)
          .updateAttributes("image", { width: next, height: null })
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
 * Each image's hover toolbar (top-right, blurred): while editable Replace and Alt text, then Open,
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
        <ImageAltText
          editor={editor}
          slot={slot}
          onLeave={onLeave}
          onCommit={onCommit}
        />
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

/** The image's alt text, edited in a popover from its toolbar: Enter or closing saves it. */
function ImageAltText({
  editor,
  slot,
  onLeave,
  onCommit,
}: {
  editor: Editor;
  slot: ImageSlot;
  /** The edit session's end check, once focus settles after the popover closes. */
  onLeave?: (next: EventTarget | null) => void;
  /** Commit the document now (an attribute edit made outside a typing session). */
  onCommit?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  // What the field opened with: an untouched draft saves nothing (a collaborator's new text stays).
  const openedRef = React.useRef("");
  const inputId = React.useId();
  const save = () => {
    const pos = slot.getPos();
    if (pos === undefined) return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "image") return;
    if (value === openedRef.current) return;
    const alt = value.trim() || null;
    if ((node.attrs.alt ?? null) === alt) return;
    editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, "alt", alt));
    // Committed now (`onValueChange` and `onCommit`), whether or not an edit session was open.
    onCommit?.();
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          openedRef.current = slot.image.getAttribute("alt") ?? "";
          setValue(openedRef.current);
        } else {
          save();
          // Closed by a click elsewhere: the session ends (and commits) unless focus came back.
          requestAnimationFrame(() => onLeave?.(document.activeElement));
        }
        setOpen(next);
      }}
    >
      <MenuTip label="Alt text">
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Alt text"
              onMouseDown={(event) => event.preventDefault()}
            />
          }
        >
          <Captions />
        </PopoverTrigger>
      </MenuTip>
      <PopoverContent
        align="end"
        data-text-edit-menu=""
        className="w-72 gap-2 p-2"
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
            Alt text
          </label>
          <Input
            id={inputId}
            size="sm"
            value={value}
            placeholder="Describe the image for screen readers"
            autoFocus
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
          struck={closed?.struck === true}
          done={closed?.done === true}
          status={closed?.status}
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
  get(id: unknown, fallback: boolean): boolean {
    if (typeof id !== "string") return fallback;
    const own = this.open.get(id);
    if (own !== undefined) return own;
    return this.host.current?.isOpen(id, fallback) ?? fallback;
  }
  /**
   * This viewer opened or closed a toggle. `persist` false is a passing reveal (a find result, a
   * link or a comment inside it): shown open now, not recorded as the viewer's choice.
   */
  set(id: string, open: boolean, persist = true) {
    this.open.set(id, open);
    this.version++;
    if (persist) this.host.current?.onToggle(id, open);
    for (const listener of this.listeners) listener();
  }
  /** The host's record changed (a reload of it): re-read it. */
  refresh() {
    this.version++;
    for (const listener of this.listeners) listener();
  }
}

/** The toggles' runtime: per-viewer state in a shared document, null otherwise. */
interface ToggleRuntime {
  states: ToggleStates | null;
}

/** Whether the toggle at `node` shows open for this viewer. */
function toggleOpen(runtime: ToggleRuntime, node: PMNode): boolean {
  const fallback = node.attrs.open !== false;
  return runtime.states
    ? runtime.states.get(node.attrs.blockId, fallback)
    : fallback;
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
    if (node.type.name !== "toggle" || toggleOpen(runtime, node)) continue;
    // The title line always shows: only a position in the body needs the toggle open.
    const summaryEnd = $pos.before(depth) + 1 + node.firstChild!.nodeSize;
    if (pos < summaryEnd) continue;
    const id = node.attrs.blockId as string | null;
    if (runtime.states && id) runtime.states.set(id, true, false);
    else if (!runtime.states && editor.isEditable)
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
                !runtime.states ||
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
    const states = runtime.states;
    React.useSyncExternalStore(
      states?.subscribe ?? noSubscribe,
      states?.snapshot ?? zero,
      states?.snapshot ?? zero,
    );
    const open = toggleOpen(runtime, node);
    const blockId = node.attrs.blockId as string | null;
    const flip = () => {
      const pos = getPos();
      if (typeof pos !== "number") return;
      const { state } = editor;
      const perViewer = Boolean(states && blockId);
      // A shared document without an id for this toggle yet: nothing to key a viewer's state by,
      // and a reader must not edit — the click waits for the id.
      if (states && !blockId && !editor.isEditable) return;
      const tr = perViewer
        ? state.tr
        : state.tr.setNodeAttribute(pos, "open", !open);
      // Closing with the caret in the hidden body: move it to the end of the title line.
      const summaryEnd = pos + 1 + node.firstChild!.nodeSize - 1;
      if (
        open &&
        state.selection.from > summaryEnd &&
        state.selection.to < pos + node.nodeSize
      )
        tr.setSelection(TextSelection.create(tr.doc, summaryEnd));
      if (perViewer) states!.set(blockId!, !open);
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

const noSubscribe = () => () => {};
const zero = () => 0;

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
        if (toggle.type.name === "toggle" && !toggleOpen(runtime, toggle)) {
          const id = toggle.attrs.blockId as string | null;
          if (runtime.states && id) runtime.states.set(id, true);
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

/* --- live task lists ---------------------------------------------------------------------------*/

type TaskQueryRender = (props: TaskQueryRenderProps) => React.ReactNode;

/**
 * Each editor's `renderTaskQuery` (the host's live task list) and the `taskQuery` node views
 * reading it. A new function re-renders every node view, so a host's changed data or a reader's
 * changed access never leaves an old drawing on screen.
 */
const EDITOR_TASK_QUERY = new WeakMap<
  Editor,
  { render: TaskQueryRender | undefined; listeners: Set<() => void> }
>();

function taskQueryStore(editor: Editor) {
  let store = EDITOR_TASK_QUERY.get(editor);
  if (!store) {
    store = { render: undefined, listeners: new Set() };
    EDITOR_TASK_QUERY.set(editor, store);
  }
  return store;
}

/** Hand `editor`'s node views the host's current `renderTaskQuery`. */
function setTaskQueryRender(
  editor: Editor,
  render: TaskQueryRender | undefined,
) {
  const store = taskQueryStore(editor);
  if (store.render === render) return;
  store.render = render;
  for (const listener of store.listeners) listener();
}

/** The host's current `renderTaskQuery`, re-rendering the caller when it changes. */
function useTaskQueryRender(editor: Editor): TaskQueryRender | undefined {
  const store = taskQueryStore(editor);
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

/**
 * A live task list's node view: an atom, selectable and draggable as a block, nothing editable
 * inside. The host draws it (`renderTaskQuery`); without one — or where it draws nothing — the
 * stored snapshot shows as `MarkdownView`'s quiet list.
 */
/** A live task list's filter key, as the `:::tasks` directive writes one. */
const TASK_QUERY_KEY = /^[a-z][a-z0-9-]*$/;

function TaskQueryView({
  node,
  selected,
  editor,
  updateAttributes,
}: ReactNodeViewProps) {
  const snapshot = String(node.attrs.snapshot ?? "");
  const query = node.attrs.query as Record<string, string> | null;
  const render = useTaskQueryRender(editor);
  const editable = useEditorEditable(editor);
  const drawn = render?.({
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
      data-drag-handle=""
      contentEditable={false}
      data-selected={selected ? "true" : undefined}
      className="my-2 rounded-lg data-selected:outline-2 data-selected:outline-info"
    >
      {drawn ?? <MarkdownTaskList snapshot={snapshot} className="my-0" />}
    </NodeViewWrapper>
  );
}

/** The embed a pasted lone URL makes, when the caret sits in an empty paragraph that can hold one. */
function embedForPaste(editor: Editor, text: string): PMNode | null {
  const { state } = editor;
  const url = text.trim();
  const match = /\s/.test(url) ? null : matchEmbed(url);
  if (match && !embedsOn(editor, match.provider)) return null;
  const type = state.schema.nodes.embed;
  const { $from, empty } = state.selection;
  if (!match || !type || !empty || $from.depth < 1) return null;
  if ($from.parent.type.name !== "paragraph" || $from.parent.content.size)
    return null;
  if (!EMBED_CONTAINERS.has($from.node(-1).type.name)) return null;
  return type.create({ provider: match.provider, url });
}

/**
 * Put `embed` where the caret's empty paragraph is, the caret after it (a new paragraph when it is
 * the last block), and toast "Embedded" with an Undo that turns it back into a link.
 */
function pasteEmbed(editor: Editor, embed: PMNode) {
  const { state } = editor;
  const { $from } = state.selection;
  const from = $from.before();
  const tr = state.tr.replaceWith(from, $from.after(), embed);
  const after = from + embed.nodeSize;
  if (tr.doc.resolve(after).nodeAfter === null)
    tr.insert(after, state.schema.nodes.paragraph!.create());
  tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
  editor.view.dispatch(tr.scrollIntoView());
  const url = String(embed.attrs.url);
  toast.add({
    title: "Embedded",
    actionProps: {
      children: "Undo",
      onClick: () => unembed(editor, url, from),
    },
  });
}

/** The embed of `url` nearest `near`, back to a paragraph linking its URL. */
function unembed(editor: Editor, url: string, near: number) {
  if (editor.isDestroyed) return;
  let found: { pos: number; node: PMNode } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "embed" && node.attrs.url === url) {
      if (!found || Math.abs(pos - near) < Math.abs(found.pos - near))
        found = { pos, node };
      return false;
    }
    return true;
  });
  if (!found) return;
  const { pos, node } = found as { pos: number; node: PMNode };
  const { schema } = editor.state;
  const link = schema.text(url, [schema.marks.link!.create({ href: url })]);
  editor.view.dispatch(
    editor.state.tr.replaceWith(
      pos,
      pos + node.nodeSize,
      schema.nodes.paragraph!.create(null, link),
    ),
  );
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

/** An image pasted or dropped from elsewhere, taken out of the slice to be imported. */
interface ExternalImage {
  src: string;
  alt: string | null;
  /** A pasted `data:` image, as a file for `onImageUpload`. */
  file?: File;
}

/** How many images one paste or drop imports; the rest land as links. */
const EXTERNAL_IMAGE_LIMIT = 20;
/** How many imports run at once. */
const EXTERNAL_IMAGE_CONCURRENCY = 3;
const EXTERNAL_IMAGE_FAILED =
  "Couldn't import that image. A link was added instead.";
const EXTERNAL_IMAGE_REPLACE_FAILED =
  "Couldn't import that image. The image wasn't replaced.";

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

/**
 * `fragment` without the images `take` claims (collected into `out`); a node left without the
 * content it needs (a cell that held only an image) is filled.
 */
function withoutImages(
  fragment: Fragment,
  take: (image: PMNode) => boolean,
  out: PMNode[],
): Fragment {
  const kept: PMNode[] = [];
  fragment.forEach((child) => {
    if (child.type.name === "image" && take(child)) {
      out.push(child);
      return;
    }
    if (!child.childCount) {
      kept.push(child);
      return;
    }
    const content = withoutImages(child.content, take, out);
    if (content === child.content) kept.push(child);
    else if (child.type.validContent(content)) kept.push(child.copy(content));
    else {
      const filled = child.type.createAndFill(
        child.attrs,
        content,
        child.marks,
      );
      if (filled) kept.push(filled);
    }
  });
  return kept.length === fragment.childCount &&
    kept.every((node, index) => node === fragment.child(index))
    ? fragment
    : Fragment.from(kept);
}

/** `slice` without its external (and pasted `data:`) images, which are returned to import. */
function takeExternalImages(
  slice: Slice,
  files: ReadonlyMap<string, File>,
): { slice: Slice; images: ExternalImage[] } {
  const taken: PMNode[] = [];
  const content = withoutImages(
    slice.content,
    (image) => {
      const src = String(image.attrs.src ?? "");
      return files.has(src) || isExternalImage(src);
    },
    taken,
  );
  if (!taken.length) return { slice, images: [] };
  const open = Slice.maxOpen(content);
  return {
    slice: new Slice(
      content,
      Math.min(slice.openStart, open.openStart),
      Math.min(slice.openEnd, open.openEnd),
    ),
    images: taken.map((image) => {
      const src = String(image.attrs.src ?? "");
      const file = files.get(src);
      return {
        src,
        alt: (image.attrs.alt as string | null) ?? null,
        ...(file ? { file } : {}),
      };
    }),
  };
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

/** Whether pasted plain text reads as markdown worth parsing rather than inserting verbatim. */
function looksLikeMarkdown(text: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|\|.+\||-{3,}\s*$)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`\n]+`|!?\[[^\]]*\]\([^)]+\)/.test(
    text,
  );
}

/** Tags that make pasted HTML rich: with none of them it is only a wrapper around code or text. */
const RICH_PASTE_TAGS =
  "h1,h2,h3,h4,h5,h6,ul,ol,li,strong,b,em,i,a,table,blockquote,img";

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

function normalizeHref(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value;
  return `https://${value}`;
}

/* ------------------------------------------------------------------------------------------------
 * Styling
 * ----------------------------------------------------------------------------------------------*/

const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";

/** Every floating part of the editor — focus moving into one of them stays in the edit session. */
const FLOATING_SLOTS =
  "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-image],[data-slot=text-edit-media],[data-slot=text-edit-turn-into],[data-slot=text-edit-link-card],[data-slot=suggestion-menu],[data-slot=text-edit-table-grip],[data-slot=text-edit-table-add],[data-text-edit-menu]";

/**
 * The one portal the editor's own floating parts render through (drag handle, table grips and
 * "+" bars, drop line; the slash and mention menus are `SuggestionMenu`, which portals itself):
 * `<body>`, so no overflow container clips it, with the theme scope restored on a
 * `display: contents` wrapper.
 */
function FloatingLayer({ children }: { children: React.ReactNode }) {
  const themeScope = useInternalThemeScope();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-slot="text-edit-layer" className={cn("contents", themeScope)}>
      {children}
    </div>,
    document.body,
  );
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
  const formRef = useFocusOnShow<HTMLFormElement>((root) =>
    root.querySelector("input"),
  );
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const next = normalizeHref(href);
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
        "flex w-80 max-w-[calc(100vw-1rem)] items-center gap-1",
      )}
    >
      <Input
        aria-label="Link URL"
        placeholder="Paste or type a link"
        value={href}
        onChange={(event) => setHref(event.target.value)}
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
    </form>
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
  try {
    const url = new URL(href, document.baseURI);
    shown =
      url.origin === window.location.origin
        ? url.pathname + url.search + url.hash
        : url.host + (url.pathname === "/" ? "" : url.pathname);
  } catch {
    // Not a URL: shown as written.
  }
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
            className="min-w-0 justify-start gap-1.5 px-2 font-normal text-info-text"
          />
        }
      >
        <ExternalLink aria-hidden />
        <span className="truncate">{shown || href}</span>
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
    const safe = /^(https?:|\/)/i.test(url) ? url : `https://${url}`;
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
            text: decodeURIComponent(
              safe.split(/[?#]/)[0]!.split("/").filter(Boolean).pop() ?? safe,
            ),
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
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .insertContentAt(target, content)
      .run();
    onClose();
  };
  const link = (
    <form onSubmit={insert} className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
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
          onValueChange={(next) => setTab(next as "upload" | "link")}
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
 * Safe while others edit: the block is held by a Yjs relative position from the press, and the
 * drop re-resolves it — when it is gone (deleted, or replaced by a collaborator) the move is
 * dropped with a toast. A remote change during the drag re-measures the slots. Near the top or
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
  const type = editor.state.doc.nodeAt(pos)?.type.name;
  const y = yBinding(editor.state);
  const held = y ? relativeAt(y, pos, 1) : null;
  let rects: DOMRect[] = [];
  let left = 0;
  let right = 0;
  const measure = () => {
    const { siblings } = siblingsOf(editor.view, currentPos() ?? pos);
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
  /** The dragged block's position now: re-read from Yjs in a shared document; null when it is gone. */
  function currentPos(): number | null {
    if (!held) return pos;
    const binding = yBinding(editor.state);
    const at = binding ? resolveRelative(binding, held) : null;
    if (at === null) return null;
    // The relative position is bound to the block's first character: step out to the block.
    const $at = editor.state.doc.resolve(at);
    for (let depth = $at.depth; depth >= 0; depth--) {
      const before = depth > 0 ? $at.before(depth) : 0;
      if (depth > 0 && $at.node(depth).type.name === type) return before;
    }
    return editor.state.doc.nodeAt(at)?.type.name === type ? at : null;
  }
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
      const now = currentPos();
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
      handlers.setLine(null);
      handlers.onEnd();
    },
  });
}

type TableMenuKind = "row" | "col" | "table";

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

  const openMenu = React.useCallback(
    (kind: TableMenuKind) => {
      pinnedRef.current = true;
      setMenu(kind);
    },
    [pinnedRef],
  );
  const closeMenu = React.useCallback(() => {
    pinnedRef.current = false;
    setMenu(null);
    hideSoon();
  }, [pinnedRef, hideSoon]);

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
      openMenu(kind);
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
    openMenu(kind);
  };

  const dragLine = (axis: "row" | "col") => (event: React.PointerEvent) => {
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
      onDrop: () => void moveTable(view, at, axis, from, to),
      onClick: () => {
        opened = true;
        selectTableLine(view, cursor, axis);
        openMenu(axis);
      },
      onEnd: () => {
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
        openMenu("table");
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

/** The matches' tints: every match, and the current one (darker, underlined). */
const FIND_RESULT_CLASS =
  "[&_.find-and-replace-result]:rounded-[2px] [&_.find-and-replace-result]:bg-warning/35 [&_.find-and-replace-result-current]:bg-warning/60 [&_.find-and-replace-result-current]:underline [&_.find-and-replace-result-current]:decoration-2 [&_.find-and-replace-result-current]:underline-offset-2 print:[&_.find-and-replace-result]:bg-transparent";

/** The find plugin's keys while the bar is open: ⌘G / ⇧⌘G step, Esc closes. */
interface FindRuntime {
  open: () => boolean;
  isOpen: () => boolean;
  step: (direction: 1 | -1) => boolean;
  close: () => boolean;
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
        Escape: () => runtime.isOpen() && runtime.close(),
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
  const [replacement, setReplacement] = React.useState("");
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

  const count =
    snap.term === ""
      ? ""
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
    const onScroll = () => redraw();
    // The text above moved (an embed, a collaborator's edit): the button follows its heading.
    const onChange = ({ transaction }: { transaction: Transaction }) => {
      if (transaction.docChanged) redraw();
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
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", hover.hideSoon);
      editor.off("selectionUpdate", onSelection);
      editor.off("focus", onSelection);
      editor.off("blur", onSelection);
      window.removeEventListener("scroll", onScroll, { capture: true });
      editor.off("transaction", onChange);
    };
  }, [editor, hover.show, hover.hideSoon]);

  const pos = hover.value ?? caret;
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
function makeTaskItems(state: EditorState, block: BlockTarget): OfferedLine[] {
  const { node, pos, range } = block;
  if (node.type.name !== "taskItem" || linkedTaskId(node) !== null) return [];
  const end = pos + node.nodeSize;
  if (range && range.to > range.from && range.from < end && range.to > pos) {
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
 * The marks' decorations over the document's top-level blocks: each marked heading (by
 * `blockId`) gets the marker and its bar, and every block up to the next heading of the same or
 * a higher level the bar too (a nested marked section's tone wins inside it).
 */
function sectionDecorations(
  doc: PMNode,
  marks: readonly TextEditSectionMark[],
  onMark: (key: string) => void,
): DecorationSet {
  if (marks.length === 0) return DecorationSet.empty;
  const byKey = new Map(marks.map((mark) => [mark.key, mark]));
  const open: { level: number; mark: TextEditSectionMark | null }[] = [];
  const decorations: PMDecoration[] = [];
  doc.forEach((node, pos) => {
    if (node.type.name === "heading") {
      const level = Number(node.attrs.level) || 1;
      while (open.length > 0 && open[open.length - 1]!.level >= level)
        open.pop();
      const id = node.attrs.blockId as string | null | undefined;
      const mark = id ? byKey.get(id) : undefined;
      if (mark) {
        open.push({ level, mark });
        decorations.push(
          PMDecoration.node(pos, pos + node.nodeSize, {
            class: sectionMarkClassNames.heading[mark.tone],
            "data-section-mark": mark.tone,
          }),
          PMDecoration.widget(pos + 1, sectionMarker(mark, onMark), {
            side: -1,
            ignoreSelection: true,
            stopEvent: () => true,
            key: `section-mark:${mark.key}:${mark.tone}:${mark.label}`,
          }),
        );
        return;
      }
      // An unmarked heading inside a marked section is one of its blocks.
      open.push({ level, mark: null });
    }
    const inner = [...open].reverse().find((section) => section.mark)?.mark;
    if (inner)
      decorations.push(
        PMDecoration.node(pos, pos + node.nodeSize, {
          class: sectionMarkClassNames.block[inner.tone],
          "data-section-mark": inner.tone,
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

/** The menu's actions for `block`, in order; `null` marks the separator before Delete. */
function blockActions(
  editor: Editor,
  block: BlockTarget,
  runtime: BlockMenuRuntime,
): (BlockAction | null)[] {
  const { pos, node } = block;
  const { index, siblings } = siblingsOf(editor.view, pos);
  const link = node.type.name === "heading" ? runtime.headingLink(pos) : null;
  const makeTask = runtime.makeTask();
  const tasks =
    makeTask && editor.isEditable ? makeTaskItems(editor.state, block) : [];
  const actions: (BlockAction | null)[] = [];
  if (makeTask && tasks.length > 0)
    actions.push(
      {
        key: "make-task",
        label: tasks.length > 1 ? `Make ${tasks.length} tasks` : "Make task",
        icon: CircleCheck,
        run: () => makeTask(offerTaskItems(editor, tasks)),
      },
      null,
    );
  actions.push({
    key: "duplicate",
    label: "Duplicate",
    icon: CopyPlus,
    shortcut: "⌘D",
    run: () => duplicateBlock(editor, pos),
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
      run: () =>
        void copyWithToast(blockMarkdown(editor, node), "Copied as Markdown"),
    },
    {
      key: "up",
      label: "Move up",
      icon: ArrowUp,
      shortcut: "⌘⇧↑",
      disabled: index === 0,
      run: () => moveNodeTo(editor.view, pos, index - 1),
    },
    {
      key: "down",
      label: "Move down",
      icon: ArrowDown,
      shortcut: "⌘⇧↓",
      disabled: index >= siblings.length - 1,
      run: () => moveNodeTo(editor.view, pos, index + 2),
    },
  );
  if (node.type.name === "toggle")
    actions.push({
      key: "open",
      label: "Open by default",
      icon: ListCollapse,
      checked: node.attrs.open !== false,
      run: () =>
        editor.view.dispatch(
          editor.state.tr.setNodeAttribute(
            pos,
            "open",
            node.attrs.open === false,
          ),
        ),
    });
  actions.push(null, {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    shortcut: "⌫",
    destructive: true,
    run: () => {
      const tr = editor.state.tr.delete(pos, pos + node.nodeSize);
      editor.view.dispatch(tr.scrollIntoView());
      editor.commands.focus();
    },
  });
  return actions;
}

/** The Turn into choices for `block`: the block types, then a callout (by tone) and a toggle. */
function turnIntoChoices(editor: Editor, block: BlockTarget) {
  const current = blockKind(block.node);
  return {
    current,
    // Diagram only while the host draws ```mermaid (`blockViews.mermaid`).
    types: BLOCK_TYPES.filter(
      (type) => type.id !== "diagram" || blockViewOf(editor, "mermaid"),
    ).map((type) => ({
      key: type.id,
      label: type.label,
      icon: type.icon as React.ComponentType,
      run: () => {
        caretInto(editor, block.pos);
        type.run(editor);
      },
    })),
    tones: CALLOUT_TONES.map((tone) => ({
      key: tone,
      label: CALLOUT_STYLE[tone].label,
      icon: CALLOUT_STYLE[tone].icon as React.ComponentType,
      run: () => turnIntoCallout(editor, block.pos, tone),
    })),
    toggle: () => turnIntoToggle(editor, block.pos),
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
  block: BlockTarget;
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
  block: BlockTarget | null;
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
  const [menu, setMenu] = React.useState<BlockTarget | null>(null);
  const menuOpenRef = React.useRef(false);
  const coarse = useCoarsePointer();
  const handleRef = React.useRef<HTMLButtonElement>(null);

  const openMenu = React.useCallback(
    (block: BlockTarget) => {
      pinnedRef.current = true;
      menuOpenRef.current = true;
      show(block);
      setMenu(block);
    },
    [pinnedRef, show],
  );
  const closeMenu = React.useCallback(() => {
    setMenu(null);
    menuOpenRef.current = false;
    pinnedRef.current = false;
  }, [pinnedRef]);

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
        event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
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
    if (!block) return;
    pinnedRef.current = true;
    // The selection before the grip selects its block: Make task reads the lines it reaches.
    const { from, to } = editor.state.selection;
    startBlockDrag(editor, block.pos, event, {
      setLine,
      onClick: () => {
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, block.pos),
          ),
        );
        openMenu({ ...block, range: { from, to } });
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

const appendToBody = () => document.body;

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
    states: quiet ? new ToggleStates(toggleStateRef) : null,
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
  // The mention search: debounced 150ms, one AbortSignal per keystroke.
  const searchRef = React.useRef<{
    timer?: ReturnType<typeof setTimeout>;
    controller?: AbortController;
  }>({});
  const stopSearch = React.useCallback(() => {
    clearTimeout(searchRef.current.timer);
    searchRef.current.controller?.abort();
    searchRef.current = {};
  }, []);
  const runSearch = React.useCallback(
    (query: string) => {
      stopSearch();
      const source = callbacks.current.mentions;
      if (!source) return;
      const current = mentionStateRef.current;
      if (current) setMention({ ...current, loading: true, error: false });
      const controller = new AbortController();
      searchRef.current.controller = controller;
      searchRef.current.timer = setTimeout(() => {
        source.search(query, { signal: controller.signal }).then(
          (options) => {
            if (controller.signal.aborted) return;
            const state = mentionStateRef.current;
            if (!state) return;
            // No one by that name, and the phrase goes on past a space: it was a sentence.
            const ed = editorRef.current;
            if (
              options.length === 0 &&
              /\s$/.test(query) &&
              ed &&
              !ed.isDestroyed
            ) {
              exitSuggestion(ed.view, MENTION_KEY);
              return;
            }
            setMention({
              ...state,
              results: groupResults(options, source.kinds),
              loading: false,
              error: false,
              index: 0,
            });
          },
          () => {
            if (controller.signal.aborted) return;
            const state = mentionStateRef.current;
            if (!state) return;
            setMention({ ...state, results: [], loading: false, error: true });
          },
        );
      }, 150);
    },
    [setMention, stopSearch],
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
        mention: {
          enabled: () => Boolean(callbacks.current.mentions?.kinds.length),
          get: () => mentionStateRef.current,
          set: (next) => {
            if (!next) stopSearch();
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
                close: () => {
                  closeFindRef.current();
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
    ed.commands.clearSearch();
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

  /** Upload `file` into the document at `pos`: a placeholder now, the image or link on success. */
  const startUpload = React.useCallback(
    (file: File, pos: number, as?: MediaKind): boolean => {
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
      ed.view.dispatch(
        ed.state.tr.setMeta(UPLOAD_KEY, {
          add: { id, pos, name: file.name, preview },
        } satisfies UploadMeta),
      );
      const land = (content: JSONContent) => {
        const current = editorRef.current;
        if (!current || current.isDestroyed) return;
        const at = uploadPos(current.state, id);
        current.view.dispatch(
          current.state.tr.setMeta(UPLOAD_KEY, {
            remove: id,
          } satisfies UploadMeta),
        );
        if (at === null) return;
        // An image, video or audio clip is a block of its own: after the block it was dropped in.
        current
          .chain()
          .insertContentAt(
            content.type === "text" ? at : blockInsertRange(current.state, at),
            content,
          )
          .run();
        commitNow();
      };
      const drop = (error: unknown) => {
        const current = editorRef.current;
        if (current && !current.isDestroyed)
          current.view.dispatch(
            current.state.tr.setMeta(UPLOAD_KEY, {
              remove: id,
            } satisfies UploadMeta),
          );
        if (!controller.signal.aborted)
          callbacks.current.onUploadError?.(file, error);
      };
      const done = (
        image
          ? uploadImage!(file, { signal: controller.signal }).then((result) =>
              land({
                type: "image",
                attrs: {
                  src: result.src,
                  alt: result.alt ?? null,
                  width: result.width ?? null,
                  height: result.height ?? null,
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
        .catch(drop)
        .finally(() => {
          if (preview) URL.revokeObjectURL(preview);
          uploadsRef.current.delete(id);
          callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
          if (uploadsRef.current.size === 0) leaveViewRef.current?.();
        });
      uploadsRef.current.set(id, { controller, done });
      callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
      return true;
    },
    [commitNow],
  );
  React.useEffect(() => {
    const uploads = uploadsRef.current;
    return () => {
      for (const { controller } of uploads.values()) controller.abort();
    };
  }, []);

  /** Pasted `data:` images as files, by the `blob:` URL the paste carries each under. */
  const pastedFilesRef = React.useRef(new Map<string, File>());
  /** Images taken out of the paste or drop being handled: placed once it has landed. */
  const externalRef = React.useRef<ExternalImage[] | null>(null);
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
       * Replace this image (an image's Replace, `from`–`to` now): it stays until the import lands,
       * then gives way in one step (one undo); a failed import leaves it.
       */
      replace?: { from: number; to: number; src: string },
    ) => {
      const ed = editorRef.current;
      const importImage = callbacks.current.onExternalImage;
      if (!ed || ed.isDestroyed || !importImage) return;
      const id = `upload-${Math.random().toString(36).slice(2)}`;
      const controller = new AbortController();
      const name =
        decodeURIComponent(
          image.src.split(/[?#]/)[0]!.split("/").filter(Boolean).pop() ?? "",
        ) || "image";
      // The image being replaced, followed through every change while the import runs (anyone's):
      // once a change removes, splits or rewrites it, it is lost and the replacement is dropped —
      // never another image in its place.
      let target = replace ? { from: replace.from, to: replace.to } : null;
      const follow = ({
        transaction,
        appendedTransactions,
      }: {
        transaction: Transaction;
        appendedTransactions?: readonly Transaction[];
      }) => {
        // The change and every transaction a plugin appended to it, in order.
        for (const tr of [transaction, ...(appendedTransactions ?? [])]) {
          if (!target || !tr.docChanged) continue;
          const size = target.to - target.from;
          const from = tr.mapping.mapResult(target.from, 1);
          const to = tr.mapping.mapResult(target.to, -1);
          target =
            from.deleted || to.deleted || to.pos - from.pos !== size
              ? null
              : { from: from.pos, to: to.pos };
        }
      };
      if (replace) ed.on("transaction", follow);
      ed.view.dispatch(
        ed.state.tr.setMeta(UPLOAD_KEY, {
          add: { id, pos, name, preview: null },
        } satisfies UploadMeta),
      );
      const land = (content: JSONContent | null) => {
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
        if (replace) {
          const node = target ? current.state.doc.nodeAt(target.from) : null;
          // The image to replace is gone (removed or changed meanwhile): nothing lands.
          if (
            !target ||
            node?.type.name !== "image" ||
            node.attrs.src !== replace.src ||
            node.nodeSize !== target.to - target.from
          )
            return;
          range = target;
        }
        current.chain().insertContentAt(range, content).run();
        commitNow();
      };
      const run = () =>
        controller.signal.aborted
          ? Promise.resolve()
          : importImage(image.src, { signal: controller.signal }).then(
              (result) =>
                land({
                  type: "image",
                  attrs: { src: result.src, alt: result.alt ?? image.alt },
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
        if (replace) ed.off("transaction", follow);
        uploadsRef.current.delete(id);
        callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
        if (uploadsRef.current.size === 0) leaveViewRef.current?.();
      });
      uploadsRef.current.set(id, { controller, done });
      callbacks.current.onPendingUploadsChange?.(uploadsRef.current.size);
    },
    [commitNow],
  );

  /**
   * Place the images the paste or drop that just landed left out: each imports where the pasted
   * content ends (a `data:` image uploads as a file); past the limit, they land as links.
   */
  const placeExternalImages = React.useCallback(() => {
    const images = externalRef.current;
    externalRef.current = null;
    const ed = editorRef.current;
    if (!images?.length || !ed || ed.isDestroyed) return;
    const at = ed.state.selection.to;
    let warned = false;
    const failed = () => {
      if (warned) return;
      warned = true;
      toast.add({ title: EXTERNAL_IMAGE_FAILED });
    };
    const links: JSONContent[] = [];
    images.forEach((image, index) => {
      if (image.file) {
        if (index < EXTERNAL_IMAGE_LIMIT) startUpload(image.file, at, "image");
        pastedFilesRef.current.delete(image.src);
        URL.revokeObjectURL(image.src);
      } else if (index < EXTERNAL_IMAGE_LIMIT)
        startExternalImage(image, at, failed);
      else
        links.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: image.src,
              marks: [{ type: "link", attrs: { href: image.src } }],
            },
          ],
        });
    });
    if (links.length)
      ed.chain().insertContentAt(blockInsertRange(ed.state, at), links).run();
  }, [startExternalImage, startUpload]);

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
      // A selected image (the image's Replace) gives way to the upload.
      const { selection } = ed.state;
      const replacing =
        selection instanceof NodeSelection &&
        selection.node.type.name === "image";
      // The upload lands where the image was, not after the block the caret moves to.
      if (replacing) ed.view.dispatch(ed.state.tr.deleteSelection());
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
  }, [onImageUpload, onFileUpload, uploadFiles]);

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
          {
            from: selection.from,
            to: selection.to,
            src: String(selection.node.attrs.src ?? ""),
          },
        );
      else
        startExternalImage({ src: url, alt: null }, selection.from, () =>
          toast.add({ title: EXTERNAL_IMAGE_FAILED }),
        );
      return true;
    },
    [startExternalImage],
  );

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
    editorProps: {
      attributes: editorAttributes,
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
            const next = serialize(ed);
            // Submitted is handled: a later blur must not commit the same text.
            if (baselineRef.current !== null) baselineRef.current = next;
            callbacks.current.onSubmit(next);
          } else ed.commands.blur();
          return true;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          if (escapeRef.current === "blur") {
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
                TextSelection.create(
                  view.state.doc,
                  $from.start(),
                  $from.end(),
                ),
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
        for (const url of pastedFilesRef.current.keys())
          URL.revokeObjectURL(url);
        pastedFilesRef.current.clear();
        const { onExternalImage: importing, onImageUpload: uploading } =
          callbacks.current;
        return sanitizePastedHTML(
          importing && uploading
            ? dataImagesToBlobs(html, pastedFilesRef.current)
            : html,
        );
      },
      // With `onExternalImage`, another site's images (and pasted `data:` ones) never enter the
      // document as they are: they leave the slice and import once the paste or drop has landed.
      transformPasted: (slice, view) => {
        if (!callbacks.current.onExternalImage || view.dragging) return slice;
        const taken = takeExternalImages(slice, pastedFilesRef.current);
        if (!taken.images.length) return slice;
        externalRef.current = taken.images;
        queueMicrotask(placeExternalImages);
        return taken.slice;
      },
      // Markdown pasted as plain text is parsed, not inserted verbatim. A bare URL is left to the
      // link extension, which turns it into a link over the selection. Pasted files (a
      // screenshot) upload, when the host takes uploads.
      // Markdown in the plain-text flavour is parsed even beside HTML that only wraps it (a code
      // editor's copy); real rich HTML still pastes rich. One fenced block becomes a code block.
      // Inside a code block everything stays literal; Mod-Shift-V pastes as plain text.
      handlePaste: (view, event) => {
        const ed = editorRef.current;
        // Images taken out of the slice import only when the slice itself is pasted (`passOn`).
        const external = externalRef.current;
        externalRef.current = null;
        const passOn = () => {
          externalRef.current = external;
          return false;
        };
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
        if (!ed || !text || ed.isActive("codeBlock")) return passOn();
        // A lone YouTube or Loom link pasted into an empty paragraph becomes an embed.
        const embed = plain ? null : embedForPaste(ed, text);
        if (embed) {
          pasteEmbed(ed, embed);
          return true;
        }
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
        const html = event.clipboardData?.getData("text/html");
        const wrapper = html ? codeWrapperKind(html) : null;
        if (html && !wrapper) return passOn();
        const fence = singleFence(text);
        if (fence) return insertCode(fence.code, fence.language);
        if (wrapper) {
          // Copied from a code editor: markdown only on strong signals and when it isn't code.
          if (!strongMarkdown(text) || looksLikeCode(text)) {
            return wrapper === "code" && /\n./.test(text.trim())
              ? insertCode(text.replace(/\r\n/g, "\n").replace(/\n+$/, ""))
              : insertLiteral();
          }
        } else if (!looksLikeMarkdown(text)) return false;
        ed.commands.insertContent(text, { contentType: "markdown" });
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
        externalRef.current = null;
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      // A shared document is never serialized per keystroke (E3): its Markdown is derived on save.
      if (quiet) return;
      liveDocRef.current = ed.state.doc;
      callbacks.current.onValueChange?.(serialize(ed));
    },
  });

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
  React.useLayoutEffect(() => {
    if (editor && !editor.isDestroyed)
      setTaskQueryRender(editor, renderTaskQuery);
  }, [editor, renderTaskQuery]);
  // Its node views and commands read the host's block views from here, during their own render.
  if (editor) blockViewsByEditor.set(editor, blockViews ?? {});

  // The document the host passed in is the committed one until something changes it.
  React.useEffect(() => {
    if (!quiet && editor && committedRef.current === null)
      committedRef.current = serialize(editor);
  }, [quiet, editor, serialize]);

  // The file picker behind the image panel's Upload and the slash menu's File. Files land where
  // the caret was when it opened.
  const pickAtRef = React.useRef(0);
  const picker = useFileDrop({
    onFilesAccepted: (files) => uploadFiles(files, pickAtRef.current),
    accept: onFileUpload ? undefined : { "image/*": [] },
    paste: false,
    preventWindowDrop: false,
  });
  pickRef.current = () => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) return;
    pickAtRef.current = ed.state.selection.from;
    picker.open();
  };
  const canUpload = Boolean(onImageUpload || onFileUpload);

  // The document is in the DOM once `EditorContent` has mounted it (a child's layout effect), so
  // the shell swaps the read view out before the browser paints.
  React.useLayoutEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: editorAttributes,
      },
    });
  }, [editor, editorAttributes]);

  React.useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // Autosave: `onCommit` after an idle gap. Off unless `autosave` is set.
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
    [commit, isInside, applyValue, menuKeys],
  );

  // The read view comes back once the session is over for good. Checked a task later, when focus
  // has settled: not while the editor or one of its floating parts holds focus, not while the
  // window itself is blurred (a file picker, another app — focus returns to the editor), and not
  // while an upload is still landing (its settling re-runs this).
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
      if (!document.hasFocus() || uploadsRef.current.size > 0) return;
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
        commitNow();
        await Promise.allSettled(
          [...uploadsRef.current.values()].map((upload) => upload.done),
        );
      },
      focus: () => {
        editorRef.current?.commands.focus();
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
    [commitNow, getAnchorForSelection, markSaved, rootRef, uploadFiles],
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
      panel !== null ||
      // The caret in a link (editable): the link card.
      (ed.isEditable &&
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
        !ed.isActive("codeBlock")),
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

  return (
    <>
      {(editable || canComment) && editor ? (
        <BubbleMenu
          ref={bubbleRef}
          editor={editor}
          pluginKey={menuKeys.bubble}
          appendTo={appendToBody}
          options={bubbleOptions}
          getReferencedVirtualElement={bubbleReference}
          shouldShow={showBubble}
          className={cn("z-50", themeScope)}
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
          className="w-60"
          anchor={slash.rect}
          floatingSafeArea={floatingSafeArea}
          options={slash.items.map((spec) => {
            const Icon = spec.icon;
            return {
              key: spec.id,
              label: spec.label,
              // Headings only on the full menu: a filtered list is short enough to scan.
              group: slash.query
                ? undefined
                : spec.id.startsWith("host:")
                  ? HOST_SLASH_GROUP
                  : SLASH_GROUP[spec.id as TextEditSlashCommand],
              icon: spec.glyph ?? <Icon />,
              shortcut: spec.hint,
              description: spec.description,
              disabled: spec.disabled,
            };
          })}
          activeIndex={slash.index}
          onActiveIndexChange={(index) => {
            const next = { ...slash, index };
            slashStateRef.current = next;
            setSlashState(next);
          }}
          onSelect={(index) => {
            const spec = slash.items[index]!;
            if (!spec.disabled) slash.command(spec);
          }}
        />
      ) : null}
      {mentionMenu && editable ? (
        <SuggestionMenu
          id={mentionListId}
          aria-label="Mention"
          data-menu="text-edit-mention"
          className="w-72"
          anchor={mentionMenu.rect}
          floatingSafeArea={floatingSafeArea}
          options={mentionOptions(mentionMenu)}
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
          editor.commands.focus("end");
        }}
        className={cn(contentClassName, findReplace && FIND_RESULT_CLASS)}
        style={contentStyle}
        hidden={hidden}
      >
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
