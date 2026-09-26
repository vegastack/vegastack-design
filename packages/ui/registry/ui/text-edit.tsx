// @vegastack text-edit@0.23.42 sha256-ZCzMYUHvS5x26BGZxvM0T2If4X2fZ5r5NSF0sJ6x8m4=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  useEditor,
  useEditorState,
  EditorContent,
  Extension,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type Editor,
  type Range,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CodeBlock as CodeBlockNode } from "@tiptap/extension-code-block";
import { Image } from "@tiptap/extension-image";
import { Paragraph } from "@tiptap/extension-paragraph";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  Suggestion,
  exitSuggestion,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { Fragment, type Node as PMNode } from "@tiptap/pm/model";
import {
  NodeSelection,
  PluginKey,
  TextSelection,
  type EditorState,
} from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Toolbar } from "@base-ui/react/toolbar";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  ChevronDown,
  Code,
  Columns3,
  ExternalLink,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Quote,
  RemoveFormatting,
  Rows3,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { cn, mergeRefs, proseClassName } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  | "codeBlock"
  | "table"
  | "image"
  | "divider"
  | "link";

/** Every slash command, in menu order — the default `slashCommands`. */
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
  "codeBlock",
  "table",
  "image",
  "divider",
  "link",
];

/** A smaller set for comments and replies: lists, a quote, code and links — no headings. */
export const TEXT_EDIT_COMPACT_SLASH_COMMANDS: readonly TextEditSlashCommand[] =
  ["bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "link"];

/** A floating panel the editor can open at the caret or over a selection. */
type Panel = "link" | "image" | "turnInto";

interface SlashSpec {
  id: TextEditSlashCommand;
  label: string;
  /** Extra words the filter matches. */
  keywords: string;
  hint?: string;
  icon: React.ComponentType;
  run: (ed: Editor, range: Range, open: (panel: Panel) => void) => void;
}

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
  codeBlock: {
    id: "codeBlock",
    label: "Code block",
    keywords: "pre snippet fence ```",
    hint: "```",
    icon: SquareCode,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setCodeBlock().run(),
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
  divider: {
    id: "divider",
    label: "Divider",
    keywords: "hr rule separator line ---",
    hint: "---",
    icon: Minus,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHorizontalRule().run(),
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

function filterSlash(
  allowed: readonly TextEditSlashCommand[],
  query: string,
): SlashSpec[] {
  const q = query.trim().toLowerCase();
  return allowed
    .map((id) => SLASH[id])
    .filter(
      (spec) =>
        !q ||
        spec.label.toLowerCase().includes(q) ||
        spec.keywords.toLowerCase().includes(q),
    );
}

interface SlashState {
  items: SlashSpec[];
  index: number;
  rect: DOMRect | null;
  command: (spec: SlashSpec) => void;
}

/* ------------------------------------------------------------------------------------------------
 * Node views
 * ----------------------------------------------------------------------------------------------*/
/**
 * Task item node view: the system `Checkbox` beside a content box — the same DOM `MarkdownView`
 * renders for a GFM task item, so `prose.taskList` lays both out identically.
 */
function TaskItemView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const checked = Boolean(node.attrs.checked);
  return (
    <NodeViewWrapper className="contents">
      <Checkbox
        contentEditable={false}
        checked={checked}
        disabled={!editor.isEditable}
        onCheckedChange={(next) => updateAttributes({ checked: next === true })}
        aria-label={checked ? "Mark task not done" : "Mark task done"}
        className="data-disabled:cursor-default data-disabled:opacity-100"
      />
      <NodeViewContent data-slot="task-item-content" />
    </NodeViewWrapper>
  );
}

/** The languages the code block's selector offers; any other fence language is kept as-is. */
const CODE_LANGUAGES = [
  "bash",
  "css",
  "diff",
  "go",
  "html",
  "java",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "python",
  "ruby",
  "rust",
  "sql",
  "swift",
  "tsx",
  "typescript",
  "yaml",
] as const;

/**
 * Code block node view: the `CodeBlock` surface (header with language and copy, sunken panel), so
 * a fenced block is the same box in edit mode as `MarkdownView` renders in view mode. While
 * editable, the language is a native select — it writes the fence's info string (```` ```ts ````).
 */
function CodeBlockView({ node, editor, updateAttributes }: ReactNodeViewProps) {
  const language = (node.attrs.language as string | null) || undefined;
  const options =
    language && !(CODE_LANGUAGES as readonly string[]).includes(language)
      ? [language, ...CODE_LANGUAGES]
      : CODE_LANGUAGES;
  return (
    <NodeViewWrapper
      as="figure"
      data-slot="code-block"
      data-language={language}
      className="my-2 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-muted text-foreground"
    >
      <figcaption
        data-slot="code-block-header"
        contentEditable={false}
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5 select-none"
      >
        {editor.isEditable ? (
          <NativeSelect
            size="sm"
            aria-label="Code language"
            value={language ?? ""}
            onChange={(event) => {
              updateAttributes({ language: event.target.value || null });
              editor.commands.focus();
            }}
          >
            <NativeSelectOption value="">Plain text</NativeSelectOption>
            {options.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {language ?? "code"}
          </span>
        )}
        <CopyButton
          value={node.textContent}
          size="icon-xs"
          variant="ghost"
          copyLabel={`Copy ${language ?? "code"}`}
        />
      </figcaption>
      <pre data-slot="code-block-pre" className="overflow-x-auto p-4 text-sm">
        <NodeViewContent<"code"> as="code" className="font-mono" />
      </pre>
    </NodeViewWrapper>
  );
}

const TaskItemWithView = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView, {
      as: "li",
      attrs: ({ node }) => ({
        "data-type": "taskItem",
        "data-checked": String(Boolean(node.attrs.checked)),
      }),
    });
  },
});

const CodeBlockWithView = CodeBlockNode.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

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

/** Position of the first text inside cell (`row`, `col`) of a table starting at `tablePos`. */
function cellTextPos(
  table: PMNode,
  tablePos: number,
  row: number,
  col: number,
) {
  let pos = tablePos + 1;
  for (let r = 0; r < row; r++) pos += table.child(r).nodeSize;
  const rowNode = table.child(row);
  pos += 1;
  for (let c = 0; c < Math.min(col, rowNode.childCount - 1); c++)
    pos += rowNode.child(c).nodeSize;
  return pos + 2;
}

/**
 * Reorder a table's rows or columns. GFM tables have no spans, so a column move is the same cell
 * splice on every row. The header row stays first — markdown has no other place for it — so rows
 * move among the body rows only.
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
  const { table, tablePos } = cursor;
  const rows: PMNode[] = [];
  table.forEach((row) => rows.push(row));
  let next: PMNode[];
  if (axis === "row") {
    if (from < 1 || to < 1 || from >= rows.length || to >= rows.length)
      return false;
    next = rows.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
  } else {
    const width = rows[0]?.childCount ?? 0;
    if (from < 0 || to < 0 || from >= width || to >= width) return false;
    next = rows.map((row) => {
      const cells: PMNode[] = [];
      row.forEach((cell) => cells.push(cell));
      const [moved] = cells.splice(from, 1);
      cells.splice(to, 0, moved!);
      return row.copy(Fragment.from(cells));
    });
  }
  const moved = table.copy(Fragment.from(next));
  const tr = view.state.tr.replaceWith(
    tablePos,
    tablePos + table.nodeSize,
    moved,
  );
  const row = axis === "row" ? to : cursor.row;
  const col = axis === "col" ? to : cursor.col;
  tr.setSelection(
    TextSelection.near(tr.doc.resolve(cellTextPos(moved, tablePos, row, col))),
  );
  view.dispatch(tr);
  return true;
}

/* ------------------------------------------------------------------------------------------------
 * Schema — fixed, so every markdown element round-trips losslessly
 * ----------------------------------------------------------------------------------------------*/

const SLASH_KEY = new PluginKey("textEditSlash");

/** What the slash extension reads from the component; refs, so the extensions are built once. */
interface SlashRuntime {
  allowed: React.RefObject<readonly TextEditSlashCommand[]>;
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
          allow: () =>
            runtime.allowed.current.length > 0 && !editor.isActive("codeBlock"),
          items: ({ query }) => filterSlash(runtime.allowed.current, query),
          command: ({ editor: ed, range, props }) =>
            props.run(ed, range, runtime.open),
          render: () => {
            const show = (props: SuggestionProps<SlashSpec, SlashSpec>) => {
              const previous = runtime.get();
              runtime.set({
                items: props.items,
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
                const count = state.items.length;
                if (event.key === "Escape") {
                  exitSuggestion(editor.view, SLASH_KEY);
                  return true;
                }
                if (!count) return false;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  const step = event.key === "ArrowDown" ? 1 : -1;
                  runtime.set({
                    ...state,
                    index: (state.index + step + count) % count,
                  });
                  return true;
                }
                if (event.key === "Enter" || event.key === "Tab") {
                  state.command(state.items[state.index]!);
                  return true;
                }
                return false;
              },
            };
          },
        }),
      ];
    },
  });
}

/** Shortcuts StarterKit does not bind: ⇧⌘X strike (Notion/Linear), ⌘⇧↑/↓ move the block. */
const Shortcuts = Extension.create({
  name: "textEditShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-x": () => this.editor.commands.toggleStrike(),
      "Mod-Shift-ArrowUp": () => moveBlockBy(this.editor, -1),
      "Mod-Shift-ArrowDown": () => moveBlockBy(this.editor, 1),
    };
  },
});

/**
 * Images are inline (GFM's `![]()` sits in a paragraph, mid-sentence or alone), so a paragraph
 * holding only an image stays a paragraph. Tiptap's default unwraps it into a block image, which is
 * invalid under an inline schema and broke the caret and the round trip.
 */
const ParagraphKeepingImages = Paragraph.extend({
  parseMarkdown: (token, helpers) => {
    const tokens = token.tokens ?? [];
    if (tokens.length === 1 && tokens[0]?.type === "image")
      return helpers.createNode(
        "paragraph",
        undefined,
        helpers.parseInline(tokens),
      );
    return Paragraph.config.parseMarkdown!(token, helpers);
  },
});

const LINK_ATTRIBUTES = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

function buildExtensions(
  placeholder: React.RefObject<string | undefined>,
  runtime: SlashRuntime,
) {
  return [
    StarterKit.configure({
      codeBlock: false,
      paragraph: false,
      underline: false,
      // A trailing empty paragraph would add a line edit mode has and view mode does not.
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: true,
        // Pasting a URL over a selection links the selection.
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: LINK_ATTRIBUTES,
      },
    }),
    ParagraphKeepingImages,
    CodeBlockWithView,
    TaskList,
    TaskItemWithView.configure({ nested: true }),
    // GFM tables: a header row, then body rows. The wrapper is the table's own scroll box.
    TableKit.configure({ table: { resizable: false, renderWrapper: true } }),
    // Inline, like GFM's `![]()` inside a paragraph, so an image sits where view mode puts it.
    Image.configure({ inline: true }),
    Placeholder.configure({ placeholder: () => placeholder.current ?? "" }),
    Markdown,
    Shortcuts,
    slashExtension(runtime),
  ];
}

/** Whether pasted plain text reads as markdown worth parsing rather than inserting verbatim. */
function looksLikeMarkdown(text: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|\|.+\||-{3,}\s*$)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`\n]+`|!?\[[^\]]*\]\([^)]+\)/.test(
    text,
  );
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

/**
 * The editor surface (ProseMirror's `.tiptap` root) wears the shared `prose` recipe — the SAME
 * string `MarkdownView` puts on its root — so edited and rendered markdown are one typography.
 * Added here: no outline, no border and NO fill in any state — the caret is the focus cue
 * (`data-focus-cue="caret"`); the placeholder as a faint zero-height pseudo-element (no reflow on
 * the first keystroke), which becomes the "Type / for commands" hint while focused; the table
 * scroll box; and the selected-node wash `MarkdownView` has no equivalent of.
 */
const editorBaseClassName = cn(
  proseClassName,
  "tiptap min-h-6 min-w-0 max-w-full outline-none",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground/60 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
  "[&_.tableWrapper]:my-2 [&_.tableWrapper]:w-full [&_.tableWrapper]:max-w-full [&_.tableWrapper]:overflow-x-auto [&_.selectedCell]:bg-accent",
  "[&_.ProseMirror-selectednode]:rounded-sm [&_.ProseMirror-selectednode]:bg-accent",
);

/** While focused and empty, the placeholder yields to the slash hint. */
const slashHintClassName =
  "[&.ProseMirror-focused_p.is-editor-empty:first-child]:before:content-['Type_/_for_commands']";

const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";

/** Every floating part of the editor — focus moving into one of them stays in the edit session. */
const FLOATING_SLOTS =
  "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-image],[data-slot=text-edit-turn-into],[data-slot=text-edit-slash-menu],[data-slot=text-edit-table-menu]";

/**
 * The one portal every floating part renders through (slash menu, drag handle, table grips, drop
 * line): `<body>`, so no overflow container clips it, with the theme scope restored on a
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

/* ------------------------------------------------------------------------------------------------
 * Slash menu
 * ----------------------------------------------------------------------------------------------*/

const SLASH_MENU_WIDTH = 240;
const SLASH_MENU_HEIGHT = 320;
const VIEWPORT_GAP = 8;

function SlashMenu({
  state,
  onHover,
}: {
  state: SlashState;
  onHover: (index: number) => void;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    listRef.current
      ?.querySelector("[data-selected]")
      ?.scrollIntoView({ block: "nearest" });
  }, [state.index]);
  if (!state.rect || typeof window === "undefined") return null;
  // Floating-UI's flip + shift, by hand: below the caret unless it would not fit and above has
  // more room, and slid horizontally so it never leaves the viewport.
  const below = state.rect.bottom + 4;
  const roomBelow = window.innerHeight - below - VIEWPORT_GAP;
  const roomAbove = state.rect.top - 4 - VIEWPORT_GAP;
  const flip = roomBelow < SLASH_MENU_HEIGHT && roomAbove > roomBelow;
  const left = Math.max(
    VIEWPORT_GAP,
    Math.min(
      state.rect.left,
      window.innerWidth - SLASH_MENU_WIDTH - VIEWPORT_GAP,
    ),
  );
  const style: React.CSSProperties = {
    position: "fixed",
    left,
    maxHeight: Math.max(
      120,
      Math.min(SLASH_MENU_HEIGHT, flip ? roomAbove : roomBelow),
    ),
    ...(flip
      ? { bottom: window.innerHeight - state.rect.top + 4 }
      : { top: below }),
  };
  return (
    <div
      ref={listRef}
      data-slot="text-edit-slash-menu"
      data-side={flip ? "top" : "bottom"}
      role="listbox"
      aria-label="Insert block"
      style={style}
      // Keep focus (and the caret) in the editor.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(MENU_SURFACE, "w-60 overflow-y-auto")}
    >
      {state.items.length === 0 ? (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          No results
        </div>
      ) : (
        state.items.map((spec, index) => {
          const Icon = spec.icon;
          const selected = index === state.index;
          return (
            <div
              key={spec.id}
              role="option"
              aria-selected={selected}
              data-selected={selected ? "" : undefined}
              data-slot="text-edit-slash-item"
              onMouseEnter={() => onHover(index)}
              onClick={() => state.command(spec)}
              className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-selected:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
            >
              <Icon />
              <span className="flex-1">{spec.label}</span>
              {spec.hint ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {spec.hint}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * Tidy serialized markdown. Tiptap writes an empty paragraph (a blank line typed with Enter) as
 * `&nbsp;` between extra blank lines; markdown has no empty paragraph, so they collapse: `&nbsp;`
 * lines go, and runs of blank lines become one. Fenced code is left exactly as typed. The result
 * parses back to itself, so the round trip is stable.
 */
function cleanMarkdown(md: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  for (const line of md.split("\n")) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      out.push(line);
      if (marker && marker[0] === fence[0] && marker.length >= fence.length)
        fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      out.push(line);
      continue;
    }
    const blank = line.trim() === "" || line.trim() === "&nbsp;";
    if (blank && (out.length === 0 || out[out.length - 1] === "")) continue;
    out.push(blank ? "" : line);
  }
  return out.join("\n").trim();
}

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
] as const;

/** The block type the selection sits in, innermost wrapper first. */
function currentBlockType(ed: Editor): (typeof BLOCK_TYPES)[number]["id"] {
  if (ed.isActive("codeBlock")) return "codeBlock";
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
      if (target?.isConnected && ref.current?.closest("body")) target.focus();
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
}: {
  editor: Editor;
  onClose: () => void;
  onLeave: (next: EventTarget | null) => void;
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
              onClick={() =>
                window.open(current, "_blank", "noopener,noreferrer")
              }
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
              <Trash2 />
            </Button>
          </MenuTip>
        </>
      ) : null}
    </form>
  );
}

function ImagePanel({
  editor,
  onClose,
  onLeave,
}: {
  editor: Editor;
  onClose: () => void;
  onLeave: (next: EventTarget | null) => void;
}) {
  const [src, setSrc] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const formRef = useFocusOnShow<HTMLFormElement>((root) =>
    root.querySelector("input"),
  );
  const insert = (event: React.FormEvent) => {
    event.preventDefault();
    const url = src.trim();
    if (!url) return;
    const safe = /^(https?:|\/)/i.test(url) ? url : `https://${url}`;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: { src: safe, alt: alt.trim() || null },
      })
      .run();
    onClose();
  };
  return (
    <form
      ref={formRef}
      data-slot="text-edit-image"
      aria-label="Insert image"
      onSubmit={insert}
      onBlur={panelBlur(onClose, onLeave)}
      onKeyDown={escapeTo(editor, onClose)}
      className={cn(
        MENU_SURFACE,
        "flex w-80 max-w-[calc(100vw-1rem)] flex-col gap-1",
      )}
    >
      <Input
        aria-label="Image URL"
        placeholder="Image URL"
        value={src}
        onChange={(event) => setSrc(event.target.value)}
        size="sm"
      />
      <div className="flex items-center gap-1">
        <Input
          aria-label="Alt text"
          placeholder="Alt text (describe the image)"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          size="sm"
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="sm" disabled={!src.trim()}>
          Insert
        </Button>
      </div>
    </form>
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
    listRef.current?.querySelector<HTMLElement>("[aria-checked=true]")?.focus();
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
      {BLOCK_TYPES.map((type) => {
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
}: {
  editor: Editor;
  panel: Panel | null;
  onPanelChange: (panel: Panel | null) => void;
  onLeave: (next: EventTarget | null) => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      strike: ed.isActive("strike"),
      code: ed.isActive("code"),
      link: ed.isActive("link"),
      block: currentBlockType(ed),
    }),
  });
  const close = () => onPanelChange(null);

  if (panel === "link")
    return <LinkPanel editor={editor} onClose={close} onLeave={onLeave} />;
  if (panel === "image")
    return <ImagePanel editor={editor} onClose={close} onLeave={onLeave} />;
  if (panel === "turnInto")
    return <TurnIntoPanel editor={editor} onClose={close} onLeave={onLeave} />;

  const block = BLOCK_TYPES.find((type) => type.id === state?.block);
  return (
    <Toolbar.Root
      data-slot="text-edit-bubble-menu"
      aria-label="Selection formatting"
      className={cn(MENU_SURFACE, "flex items-center gap-0.5")}
    >
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
    </Toolbar.Root>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Table menu and grips
 * ----------------------------------------------------------------------------------------------*/

function TableMenu({ editor }: { editor: Editor }) {
  const cursor = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const at = tableAt(ed.state, ed.state.selection.from);
      return at
        ? {
            row: at.row,
            col: at.col,
            rows: at.table.childCount,
            cols: at.table.child(0).childCount,
          }
        : null;
    },
  });
  if (!cursor) return null;
  const header = cursor.row === 0;
  const move = (axis: "row" | "col", to: number) => () => {
    editor.commands.focus();
    moveTable(
      editor.view,
      editor.state.selection.from,
      axis,
      axis === "row" ? cursor.row : cursor.col,
      to,
    );
  };
  const actions: {
    label: string;
    icon: React.ComponentType;
    run: () => unknown;
    disabled?: boolean;
    destructive?: boolean;
    separatorBefore?: boolean;
  }[] = [
    {
      label: "Insert row above",
      icon: BetweenHorizontalStart,
      run: () => editor.chain().focus().addRowBefore().run(),
      disabled: header,
    },
    {
      label: "Insert row below",
      icon: BetweenHorizontalEnd,
      run: () => editor.chain().focus().addRowAfter().run(),
    },
    {
      label: "Move row up",
      icon: ArrowUp,
      run: move("row", cursor.row - 1),
      disabled: cursor.row <= 1,
    },
    {
      label: "Move row down",
      icon: ArrowDown,
      run: move("row", cursor.row + 1),
      disabled: header || cursor.row >= cursor.rows - 1,
    },
    {
      label: "Delete row",
      icon: Rows3,
      run: () => editor.chain().focus().deleteRow().run(),
      disabled: header,
      destructive: true,
    },
    {
      label: "Insert column left",
      icon: BetweenVerticalStart,
      run: () => editor.chain().focus().addColumnBefore().run(),
      separatorBefore: true,
    },
    {
      label: "Insert column right",
      icon: BetweenVerticalEnd,
      run: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      label: "Move column left",
      icon: ArrowLeft,
      run: move("col", cursor.col - 1),
      disabled: cursor.col === 0,
    },
    {
      label: "Move column right",
      icon: ArrowRight,
      run: move("col", cursor.col + 1),
      disabled: cursor.col >= cursor.cols - 1,
    },
    {
      label: "Delete column",
      icon: Columns3,
      run: () => editor.chain().focus().deleteColumn().run(),
      disabled: cursor.cols <= 1,
      destructive: true,
    },
    {
      label: "Delete table",
      icon: Trash2,
      run: () => editor.chain().focus().deleteTable().run(),
      destructive: true,
      separatorBefore: true,
    },
  ];
  return (
    <Toolbar.Root
      data-slot="text-edit-table-menu"
      aria-label="Table"
      className={cn(
        MENU_SURFACE,
        "flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-0.5",
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <React.Fragment key={action.label}>
            {action.separatorBefore ? (
              <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
            ) : null}
            <MenuTip label={action.label}>
              <Toolbar.Button
                disabled={action.disabled}
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={action.label}
                    onClick={() => void action.run()}
                    className={cn(
                      action.destructive &&
                        "hover:text-destructive-text [&_svg]:hover:text-destructive-text",
                    )}
                  >
                    <Icon />
                  </Button>
                }
              />
            </MenuTip>
          </React.Fragment>
        );
      })}
    </Toolbar.Root>
  );
}

/** The DOM box the table menu anchors to: the table the caret is in. */
function tableRect(editor: Editor) {
  if (editor.isDestroyed || !editor.isInitialized) return null;
  const { from } = editor.state.selection;
  const at = editor.view.domAtPos(from).node;
  const el = at instanceof Element ? at : at.parentElement;
  const table = el?.closest("table");
  return table
    ? { getBoundingClientRect: () => table.getBoundingClientRect() }
    : null;
}

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
  const move = (next: PointerEvent) => {
    if (
      !dragging &&
      Math.hypot(next.clientX - origin.x, next.clientY - origin.y) < 4
    )
      return;
    dragging = true;
    handlers.onMove(next);
  };
  const stop = (drop: boolean) => () => {
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
  "fixed z-50 flex cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing [&_svg]:size-3.5";
const DROP_LINE = "pointer-events-none fixed z-50 rounded-full bg-primary";

/**
 * A hover overlay's target: kept while the pointer crosses from the target to the overlay, dropped
 * a beat after it leaves both, held for the length of a drag, and dropped on scroll (its fixed
 * position would go stale). `same` stops a mousemove over the same target from re-rendering.
 */
function useHover<T>(same: (a: T, b: T) => boolean) {
  const [value, setValue] = React.useState<T | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const draggingRef = React.useRef(false);
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
    if (draggingRef.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setValue(null), 250);
  }, []);
  const keep = React.useCallback(() => clearTimeout(timer.current), []);
  React.useEffect(() => {
    const onScroll = () => {
      if (!draggingRef.current) setValue(null);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);
  return { value, show, hideSoon, keep, draggingRef };
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
 * Column and row grips on the hovered table cell. Drag a grip to reorder that column or row (a
 * line shows where it lands); click it to select the whole column or row. Keyboard users get the
 * same moves from the table menu.
 */
function TableGrips({ editor }: { editor: Editor }) {
  const { value, show, hideSoon, keep, draggingRef } = useHover<{
    table: HTMLTableElement;
    cell: HTMLTableCellElement;
  }>((a, b) => a.cell === b.cell);
  const [line, setLine] = React.useState<DragLine | null>(null);

  React.useEffect(() => {
    const dom = editor.view.dom;
    const onMove = (event: MouseEvent) => {
      if (draggingRef.current) return;
      const cell = (event.target as Element | null)?.closest?.("td,th");
      const table = cell?.closest("table");
      if (cell && table && dom.contains(table))
        show({
          table: table as HTMLTableElement,
          cell: cell as HTMLTableCellElement,
        });
      else hideSoon();
    };
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", hideSoon);
    return () => {
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", hideSoon);
    };
  }, [editor, show, hideSoon, draggingRef]);

  if (!value || !value.cell.isConnected) return null;
  const { table, cell } = value;
  const tableBox = table.getBoundingClientRect();
  const cellBox = cell.getBoundingClientRect();
  const colIndex = cell.cellIndex;
  const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex;

  const drag = (axis: "row" | "col") => (event: React.PointerEvent) => {
    const $cell = resolveCell(editor.view, cell);
    if (!$cell) return;
    const inside = $cell.pos + 2;
    const rects =
      axis === "col"
        ? [...(table.rows[0]?.cells ?? [])].map((c) =>
            c.getBoundingClientRect(),
          )
        : [...table.rows].map((r) => r.getBoundingClientRect());
    const from = axis === "col" ? colIndex : rowIndex;
    let to = from;
    // Synchronous (tiptap's `focus()` waits a frame): the edit session opens before the move.
    editor.view.focus();
    draggingRef.current = true;
    startDrag(event, {
      onMove: (next) => {
        const slot = Math.max(
          axis === "row" ? 1 : 0,
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
                left: tableBox.left,
                top: edge - 1,
                width: tableBox.width,
                height: 2,
              },
        );
      },
      onDrop: () => void moveTable(editor.view, inside, axis, from, to),
      onClick: () =>
        editor.view.dispatch(
          editor.state.tr.setSelection(
            axis === "col"
              ? CellSelection.colSelection($cell)
              : CellSelection.rowSelection($cell),
          ),
        ),
      onEnd: () => {
        draggingRef.current = false;
        setLine(null);
      },
    });
  };

  const grip = (axis: "row" | "col", style: React.CSSProperties) => (
    <div
      data-slot="text-edit-table-grip"
      data-axis={axis}
      aria-hidden
      title={`Drag to move ${axis === "col" ? "column" : "row"} · click to select`}
      onMouseEnter={keep}
      onMouseLeave={hideSoon}
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={drag(axis)}
      style={style}
      className={cn(GRIP, axis === "col" && "[&_svg]:rotate-90")}
    >
      <GripVertical />
    </div>
  );

  return (
    <FloatingLayer>
      {grip("col", {
        left: cellBox.left + cellBox.width / 2 - 12,
        top: tableBox.top - 14,
        width: 24,
        height: 12,
      })}
      {rowIndex > 0
        ? grip("row", {
            left: tableBox.left - 14,
            top: cellBox.top + cellBox.height / 2 - 12,
            width: 12,
            height: 24,
          })
        : null}
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

/* ------------------------------------------------------------------------------------------------
 * Block handle
 * ----------------------------------------------------------------------------------------------*/

/**
 * The ⋮⋮ handle beside the hovered block (a top-level block, or a list item among its siblings).
 * Drag it to reorder; a line shows the drop slot. Click it to select the block (then ⌫ deletes,
 * ⌘C copies). ⌘⇧↑ / ⌘⇧↓ move the caret's block from the keyboard. Moves are node moves, so the
 * markdown is the same blocks in a new order.
 */
function BlockHandle({ editor }: { editor: Editor }) {
  const { value, show, hideSoon, keep, draggingRef } = useHover<Block>(
    (a, b) => a.dom === b.dom && a.pos === b.pos,
  );
  const [line, setLine] = React.useState<DragLine | null>(null);

  React.useEffect(() => {
    const dom = editor.view.dom;
    const onMove = (event: MouseEvent) => {
      if (draggingRef.current || !(event.target instanceof Node)) return;
      if (event.target === dom) return;
      const block = blockAt(editor.view, event.target);
      if (block) show(block);
    };
    const onKey = () => show(null);
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("mouseleave", hideSoon);
    dom.addEventListener("keydown", onKey);
    return () => {
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("mouseleave", hideSoon);
      dom.removeEventListener("keydown", onKey);
    };
  }, [editor, show, hideSoon, draggingRef]);

  if (!value || !value.dom.isConnected) return null;
  const block = value;
  const box = block.dom.getBoundingClientRect();
  // A bullet or number sits in the list's start padding, outside the item's box; clear it.
  const marker = block.node.type.name === "listItem" ? 20 : 0;
  const lineHeight = Math.min(box.height, 24);

  const onPointerDown = (event: React.PointerEvent) => {
    const { siblings } = siblingsOf(editor.view, block.pos);
    const rects = siblings.map(
      (sibling) => sibling.dom?.getBoundingClientRect() ?? new DOMRect(),
    );
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    let slot = -1;
    // Synchronous (tiptap's `focus()` waits a frame): the edit session opens before the move.
    editor.view.focus();
    draggingRef.current = true;
    startDrag(event, {
      onMove: (next) => {
        slot = slotAt(rects, next.clientY, "y");
        const edge =
          slot >= rects.length
            ? rects[rects.length - 1]!.bottom
            : rects[slot]!.top;
        setLine({ left, top: edge - 1, width: right - left, height: 2 });
      },
      onDrop: () => {
        if (slot >= 0) moveNodeTo(editor.view, block.pos, slot);
      },
      onClick: () =>
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, block.pos),
          ),
        ),
      onEnd: () => {
        draggingRef.current = false;
        setLine(null);
        show(null);
      },
    });
  };

  return (
    <FloatingLayer>
      <div
        data-slot="text-edit-block-handle"
        aria-hidden
        title="Drag to move · click to select"
        onMouseEnter={keep}
        onMouseLeave={hideSoon}
        onMouseDown={(event) => event.preventDefault()}
        onPointerDown={onPointerDown}
        style={{
          left: box.left - marker - 22,
          top: box.top + lineHeight / 2 - 10,
          width: 18,
          height: 20,
        }}
        className={GRIP}
      >
        <GripVertical />
      </div>
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
 * can put them on the contenteditable Tiptap creates, which cannot itself BE the control element.
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
   * Show the ⋮⋮ drag handle beside the hovered block and the drag grips on table rows and columns.
   * Turn it off where the editor sits in a tight box (comments). ⌘⇧↑ / ⌘⇧↓ move blocks either way.
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
   * editor. Nothing is committed.
   * @default undefined
   */
  onRevert?: () => void;
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
  /** Additional class names on the editor container.
   * @default undefined
   */
  className?: string;
  /** Ref forwarded to the editor's root container `<div>`.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * `TextEdit` — a Tiptap v3 markdown-first rich-text editor, Notion-style: no toolbar, no border, no
 * ring and no fill in any state — the caret is the focus cue. The surface wears the shared `prose`
 * recipe — the same string `MarkdownView` renders with — so an idle editor looks exactly like
 * rendered markdown. Click anywhere and type.
 *
 * - **Slash menu** — `/` opens a filterable block menu (↑↓, Enter, Esc): text, H1–H4, lists, a
 *   checklist, quote, code block, table, image, divider, link. `slashCommands` limits it.
 * - **Bubble menu** — a selection offers "Turn into", bold, italic, strike, inline code, link
 *   (edit, open, remove) and clear formatting. Every menu floats in a `<body>` portal and flips
 *   to stay in view, so no overflow container clips it.
 * - **Tables** — GFM tables with a menu (insert, move and delete rows and columns), Tab / ⇧Tab
 *   between cells, and drag grips to reorder rows and columns.
 * - **Blocks** — a ⋮⋮ handle drags any block (and any list item) to a new place; ⌘⇧↑ / ⌘⇧↓ too.
 * - **Markdown** — input rules (`#`–`####`, `- `, `* `, `1. `, `[ ] `, `> `, ```` ```lang ````,
 *   `---`, `**`, `*`, `_`, `~~`, `` ` ``), ⌘B / ⌘I / ⌘E / ⇧⌘X / ⌘K / ⌘⇧7·8·9, markdown and URL
 *   paste, sanitized HTML paste, and a lossless round-trip with `format="markdown"`.
 * - **Commit** — `onCommit(value)` when focus leaves with a change (and on hide, unmount and
 *   `autosave`); Escape reverts and calls `onRevert`; Cmd/Ctrl+Enter calls `onSubmit`.
 *
 * @example
 * <TextEdit format="markdown" defaultValue={md} onCommit={save} placeholder="Add a description…" aria-label="Description" />
 */
export function TextEdit({
  format = "html",
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  slashCommands = TEXT_EDIT_SLASH_COMMANDS,
  dragHandles = true,
  onCommit,
  onRevert,
  onSubmit,
  autosave = false,
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
  className,
  ref,
}: TextEditProps) {
  const [field, setField] = React.useState<FieldAria>({});
  const disabled = disabledProp || field.disabled === true;
  const editable = !readOnly && !disabled;
  // Fixed at creation: the parser is chosen once.
  const [markdown] = React.useState(format === "markdown");
  const serialize = React.useCallback(
    (ed: Editor) => (markdown ? cleanMarkdown(ed.getMarkdown()) : ed.getHTML()),
    [markdown],
  );

  const callbacks = React.useRef({
    onValueChange,
    onCommit,
    onRevert,
    onSubmit,
  });
  React.useEffect(() => {
    callbacks.current = { onValueChange, onCommit, onRevert, onSubmit };
  }, [onValueChange, onCommit, onRevert, onSubmit]);

  const placeholderRef = React.useRef(placeholder);
  placeholderRef.current = placeholder;
  const slashRef = React.useRef<readonly TextEditSlashCommand[]>(slashCommands);
  slashRef.current = slashCommands;

  const [panel, setPanel] = React.useState<Panel | null>(null);
  // One key per instance for each floating menu, so an effect can show or hide exactly this
  // editor's menu.
  const [menuKeys] = React.useState(() => ({
    bubble: new PluginKey("textEditBubbleMenu"),
    table: new PluginKey("textEditTableMenu"),
  }));
  const [slash, setSlashState] = React.useState<SlashState | null>(null);
  const slashStateRef = React.useRef<SlashState | null>(null);

  // Built once: the editor is never recreated by a re-render.
  const [extensions] = React.useState(() =>
    buildExtensions(placeholderRef, {
      allowed: slashRef,
      get: () => slashStateRef.current,
      set: (next) => {
        slashStateRef.current = next;
        setSlashState(next);
      },
      open: setPanel,
    }),
  );

  const editorRef = React.useRef<Editor | null>(null);
  const resolvedId = field.id ?? id;
  const resolvedLabelledBy = field["aria-labelledby"] ?? ariaLabelledBy;
  const resolvedDescribedBy = field["aria-describedby"] ?? ariaDescribedBy;
  const ariaInvalidAttribute = toAriaInvalidAttribute(
    field["aria-invalid"] ?? ariaInvalid,
  );
  const invalid = ariaInvalidAttribute !== undefined;
  const hasSlash = slashCommands.length > 0;
  const editorAttributes = React.useMemo(
    () => ({
      class: cn(
        editorBaseClassName,
        editable && hasSlash && slashHintClassName,
      ),
      // The caret is this surface's whole focus cue — no ring, border or fill (see the
      // geometry lane's caret-only exemption).
      "data-focus-cue": "caret",
      ...(resolvedId ? { id: resolvedId } : {}),
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(resolvedLabelledBy ? { "aria-labelledby": resolvedLabelledBy } : {}),
      ...(ariaInvalidAttribute ? { "aria-invalid": ariaInvalidAttribute } : {}),
      ...(resolvedDescribedBy
        ? { "aria-describedby": resolvedDescribedBy }
        : {}),
      role: "textbox",
      "aria-multiline": "true",
      ...(saving ? { "aria-busy": "true" } : {}),
      ...(disabled ? { "aria-disabled": "true" } : {}),
      ...(!disabled && !editable ? { "aria-readonly": "true" } : {}),
    }),
    [
      saving,
      disabled,
      editable,
      hasSlash,
      resolvedDescribedBy,
      ariaInvalidAttribute,
      ariaLabel,
      resolvedLabelledBy,
      resolvedId,
    ],
  );

  // The document as focus found it: a commit compares against it, Escape restores it. Null while
  // no edit session is open, which is what makes every commit path idempotent.
  const baselineRef = React.useRef<string | null>(null);
  const commit = React.useCallback(() => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed || baselineRef.current === null) return;
    const next = serialize(ed);
    if (next === baselineRef.current) return;
    baselineRef.current = next;
    callbacks.current.onCommit?.(next);
  }, [serialize]);
  const revert = React.useCallback(() => {
    const ed = editorRef.current;
    if (!ed || baselineRef.current === null) return;
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

  const editor = useEditor({
    extensions,
    content: value ?? defaultValue,
    ...(markdown ? { contentType: "markdown" as const } : {}),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: editorAttributes,
      handleKeyDown: (view, event) => {
        // The slash menu owns Enter, arrows and Escape while it is open.
        if (SLASH_KEY.getState(view.state)?.active) return false;
        const mod = event.metaKey || event.ctrlKey;
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
          revert();
          return true;
        }
        if (mod && !event.shiftKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          setPanel("link");
          return true;
        }
        return false;
      },
      transformPastedHTML: sanitizePastedHTML,
      // Markdown pasted as plain text is parsed, not inserted verbatim. A bare URL is left to the
      // link extension, which turns it into a link over the selection.
      handlePaste: (_view, event) => {
        const ed = editorRef.current;
        const text = event.clipboardData?.getData("text/plain");
        if (
          !ed ||
          !text ||
          event.clipboardData?.getData("text/html") ||
          ed.isActive("codeBlock") ||
          !looksLikeMarkdown(text)
        )
          return false;
        ed.commands.insertContent(text, { contentType: "markdown" });
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      callbacks.current.onValueChange?.(serialize(ed));
    },
  });

  editorRef.current = editor;

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
    if (!editor || !autosave) return;
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
      if (serialize(ed) === next) return;
      ed.commands.setContent(next, {
        emitUpdate: false,
        ...(markdown ? { contentType: "markdown" as const } : {}),
      });
    },
    [markdown, serialize],
  );

  React.useEffect(() => {
    if (!editor || value === undefined) return;
    if (editor.isFocused) {
      pendingValueRef.current = value;
      return;
    }
    pendingValueRef.current = undefined;
    applyValue(editor, value);
  }, [editor, value, applyValue]);

  // Focus: the editor and every floating part (bubble menu, panels, slash menu, table menu) are one
  // editing session. Arriving records the baseline; leaving all of them commits.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
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
        ed.view.dispatch(
          ed.state.tr
            .setMeta(menuKeys.bubble, "hide")
            .setMeta(menuKeys.table, "hide"),
        );
      const pending = pendingValueRef.current;
      if (ed && pending !== undefined) {
        pendingValueRef.current = undefined;
        applyValue(ed, pending);
      }
    },
    [commit, isInside, applyValue, menuKeys],
  );

  React.useEffect(() => {
    if (!editor) return;
    const onFocus = () => {
      if (editor.isEditable && baselineRef.current === null)
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

  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);

  const themeScope = useInternalThemeScope();
  const minCss = toCssLength(minHeight);
  const maxCss = toCssLength(maxHeight);
  const contentStyle: React.CSSProperties | undefined =
    minCss != null || maxCss != null
      ? ({
          ...(minCss != null && { ["--te-min-h"]: minCss }),
          ...(maxCss != null && { ["--te-max-h"]: maxCss }),
        } as React.CSSProperties)
      : undefined;
  // Floating UI inside the bubble menus: fixed to the viewport, flipped and shifted into view.
  const bubbleOptions = React.useMemo(
    () => ({ ...FLOATING, placement: "top-start" as const }),
    [],
  );
  const tableOptions = React.useMemo(
    () => ({ ...FLOATING, offset: 20, placement: "top-end" as const }),
    [],
  );
  const showBubble = React.useCallback(
    ({ editor: ed, from, to, state }: MenuShowProps) =>
      panel !== null ||
      (ed.isEditable &&
        from !== to &&
        !(state.selection instanceof NodeSelection) &&
        !(state.selection instanceof CellSelection) &&
        !ed.isActive("codeBlock")),
    [panel],
  );
  const showTable = React.useCallback(
    ({ editor: ed, state }: MenuShowProps) =>
      panel === null &&
      ed.isEditable &&
      // Focused editor, or focus on the menu's own buttons (tiptap refocuses a frame later).
      (ed.isFocused ||
        Boolean(document.activeElement?.closest(FLOATING_SLOTS))) &&
      ed.isActive("table") &&
      (state.selection.empty || state.selection instanceof CellSelection),
    [panel],
  );
  const tableAnchor = React.useCallback(
    () => (editor ? tableRect(editor) : null),
    [editor],
  );
  // A panel opens from React state (⌘K, the slash menu), not from a selection change, so the
  // menus are told directly; closing one re-evaluates both against the selection.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.isInitialized) return;
    const { state } = editor;
    const args = {
      editor,
      state,
      from: state.selection.from,
      to: state.selection.to,
    };
    editor.view.dispatch(
      state.tr
        .setMeta(menuKeys.bubble, showBubble(args) ? "show" : "hide")
        .setMeta(menuKeys.table, showTable(args) ? "show" : "hide"),
    );
  }, [editor, panel, menuKeys, showBubble, showTable]);

  return (
    <div
      ref={setRootRef}
      data-slot="text-edit"
      data-editable={editable ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "relative min-w-0 max-w-full bg-transparent",
        editable && "cursor-text",
        disabled && "opacity-50",
        className,
      )}
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
      {editable && editor ? (
        <BubbleMenu
          editor={editor}
          pluginKey={menuKeys.bubble}
          appendTo={appendToBody}
          options={bubbleOptions}
          shouldShow={showBubble}
          className={cn("z-50", themeScope)}
        >
          <SelectionMenu
            editor={editor}
            panel={panel}
            onPanelChange={setPanel}
            onLeave={leave}
          />
        </BubbleMenu>
      ) : null}
      {editable && editor ? (
        <BubbleMenu
          editor={editor}
          pluginKey={menuKeys.table}
          appendTo={appendToBody}
          getReferencedVirtualElement={tableAnchor}
          options={tableOptions}
          shouldShow={showTable}
          className={cn("z-50", themeScope)}
        >
          <TableMenu editor={editor} />
        </BubbleMenu>
      ) : null}
      {slash && editable ? (
        <FloatingLayer>
          <SlashMenu
            state={slash}
            onHover={(index) => {
              const next = { ...slash, index };
              slashStateRef.current = next;
              setSlashState(next);
            }}
          />
        </FloatingLayer>
      ) : null}
      {dragHandles && editable && editor ? (
        <>
          <BlockHandle editor={editor} />
          <TableGrips editor={editor} />
        </>
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
        className={cn(
          "relative min-w-0 max-w-full",
          minCss != null && "min-h-[var(--te-min-h)]",
          maxCss != null && "max-h-[var(--te-max-h)] overflow-y-auto",
        )}
        style={contentStyle}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
