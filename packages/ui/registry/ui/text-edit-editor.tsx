// @vegastack text-edit@0.23.94 sha256-m2seArylkFGw72TqS1ePji+VlUdoG8hgfcIqdsS9Umg=

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
  mergeAttributes,
  type Editor,
  type JSONContent,
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
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
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
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  ChevronDown,
  CircleCheck,
  Code,
  Copy,
  Eraser,
  ExternalLink,
  File as FileIcon,
  FileText,
  GripHorizontal,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Info,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  MessageSquarePlus,
  Minus,
  PanelLeft,
  PanelTop,
  Pilcrow,
  Plus,
  Quote,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button } from "@/components/ui/button";
import { dropIndicatorClasses } from "@/lib/drag-item";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MentionChip,
  headingIds,
  markdownExtrasClassName,
  mentionMarkdown,
  parseMentionLink,
  type CalloutTone,
  type MentionKind,
} from "@/components/ui/markdown-view";
import { useFileDrop } from "@/components/ui/use-file-drop";
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
  TextEditHandle,
  TextEditProps,
  TextEditSlashCommand,
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
type Panel = "link" | "image" | "turnInto" | "file";

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

function filterSlash(
  allowed: readonly TextEditSlashCommand[],
  query: string,
  inCell = false,
): SlashSpec[] {
  const q = query.trim().toLowerCase();
  return allowed
    .filter((id) => !inCell || !BLOCK_COMMANDS.has(id))
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
          items: ({ query, editor: ed }) =>
            filterSlash(runtime.allowed.current, query, inTableCell(ed.state)),
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

/* --- file chips --------------------------------------------------------------------------------*/

/** The icon at the start of a file chip, by the linked file's name. */
function FileChipIcon({ name }: { name: string }) {
  return (
    <FileTypeIcon
      name={name}
      className="me-1 inline size-3.5 align-text-bottom"
    />
  );
}

/**
 * A link whose href starts with `fileLinkPrefix` is a file (`[report.pdf](/api/files/…)`): the
 * link carries `data-slot="file-chip"` and an icon widget sits at its start. The Markdown is an
 * ordinary link.
 */
function fileChips(runtime: EditorRuntime) {
  const isFile = (href: unknown) =>
    typeof href === "string" &&
    runtime.fileLinkPrefix.current !== "" &&
    href.startsWith(runtime.fileLinkPrefix.current);
  return Extension.create({
    name: "textEditFileChips",
    addGlobalAttributes() {
      return [
        {
          types: ["link"],
          attributes: {
            fileChip: {
              default: null,
              parseHTML: () => null,
              renderHTML: (attrs) =>
                isFile(attrs.href) ? { "data-slot": "file-chip" } : {},
            },
          },
        },
      ];
    },
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

interface AnnotationPluginState {
  /** Each annotation's current range; null when its text is gone (orphaned). */
  ranges: Map<string, { from: number; to: number } | null>;
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
      items: readonly { id: string; anchor: TextAnchor; count?: number }[];
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

const ANNOTATION_CLASS =
  "cursor-pointer rounded-xs underline decoration-warning-text/60 decoration-dashed underline-offset-4 transition-colors duration-150 hover:bg-warning/15";
const ANNOTATION_ACTIVE_CLASS = "bg-warning/25 decoration-solid";
const ANNOTATION_PULSE_CLASS = "animate-pulse bg-warning/30";
/**
 * The count pill: a 16px warning-tinted pill (the highlight's own hue) with a 24px invisible hit
 * area. `auto` shows it only on a coarse pointer or below the `lg` breakpoint, where a comment
 * margin has no room — CSS alone, no JS media branch.
 */
const ANNOTATION_COUNT_CLASS =
  "relative ms-0.5 h-4 min-w-4 select-none items-center justify-center rounded-full bg-warning/10 px-1 align-middle font-sans text-xs leading-none font-medium text-warning-text tabular-nums transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-warning/20 data-active:bg-warning/30";
const ANNOTATION_COUNT_VISIBILITY = {
  auto: "hidden pointer-coarse:inline-flex max-lg:inline-flex",
  always: "inline-flex",
} as const;

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
              let keys = previous.keys;
              let counts = previous.counts;
              let { active, pulse, options } = previous;
              if (tr.docChanged) {
                ranges = new Map();
                for (const [id, range] of previous.ranges) {
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
                for (const { id, anchor, count } of meta.items) {
                  const key = JSON.stringify(anchor);
                  nextKeys.set(id, key);
                  nextCounts.set(id, count);
                  nextRanges.set(
                    id,
                    keys.get(id) === key && ranges.has(id)
                      ? ranges.get(id)!
                      : resolveInDoc(newState.doc, anchor),
                  );
                }
                ranges = nextRanges;
                keys = nextKeys;
                counts = nextCounts;
              } else if (meta?.type === "active") active = meta.id;
              else if (meta?.type === "pulse") pulse = meta.id;
              else if (meta?.type === "options") options = meta.options;
              const next = { ranges, keys, counts, active, pulse, options };
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

/** The placeholder an upload shows until it resolves: the image dimmed under a spinner, or the file's name. */
function uploadPlaceholder(upload: UploadWidget): HTMLElement {
  const spinner = (size: string) => {
    const ring = document.createElement("span");
    ring.className = cn(
      "inline-block shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent",
      size,
    );
    return ring;
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
    overlay.className = "absolute inset-0 grid place-items-center";
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
          apply(tr, set) {
            let next = set.map(tr.mapping, tr.doc);
            const meta = tr.getMeta(UPLOAD_KEY) as UploadMeta | undefined;
            if (meta && "add" in meta)
              next = next.add(tr.doc, [
                PMDecoration.widget(
                  meta.add.pos,
                  () => uploadPlaceholder(meta.add),
                  { id: meta.add.id, key: meta.add.id, side: -1 },
                ),
              ]);
            else if (meta && "remove" in meta)
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
      }),
    ];
  },
});

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

const MENTION_MENU_WIDTH = 288;

function MentionMenu({
  state,
  onHover,
}: {
  state: MentionMenuState;
  onHover: (index: number) => void;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const baseId = React.useId();
  React.useEffect(() => {
    listRef.current
      ?.querySelector("[data-selected]")
      ?.scrollIntoView({ block: "nearest" });
  }, [state.index]);
  if (!state.rect || typeof window === "undefined") return null;
  const below = state.rect.bottom + 4;
  const roomBelow = window.innerHeight - below - VIEWPORT_GAP;
  const roomAbove = state.rect.top - 4 - VIEWPORT_GAP;
  const flip = roomBelow < SLASH_MENU_HEIGHT && roomAbove > roomBelow;
  const left = Math.max(
    VIEWPORT_GAP,
    Math.min(
      state.rect.left,
      window.innerWidth - MENTION_MENU_WIDTH - VIEWPORT_GAP,
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
  const options = flatOptions(state.results);
  const message = state.error
    ? "Couldn't search"
    : state.results === null
      ? "Searching…"
      : options.length === 0
        ? state.loading
          ? "Searching…"
          : "No matches"
        : null;
  let index = -1;
  return (
    <div
      ref={listRef}
      data-slot="text-edit-mention-menu"
      data-side={flip ? "top" : "bottom"}
      role="listbox"
      aria-label="Mention"
      aria-busy={state.loading || undefined}
      style={style}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(MENU_SURFACE, "w-72 overflow-y-auto")}
    >
      {message ? (
        <div
          data-slot="text-edit-mention-status"
          className="px-2 py-1.5 text-sm text-muted-foreground"
        >
          {message}
        </div>
      ) : (
        MENTION_GROUPS.map((group) => {
          const items = options.filter((option) => option.kind === group.kind);
          if (items.length === 0) return null;
          const labelId = `${baseId}-${group.kind}`;
          return (
            <div key={group.kind} role="group" aria-labelledby={labelId}>
              <div
                id={labelId}
                className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground"
              >
                {group.label}
              </div>
              {items.map((option) => {
                index += 1;
                const at = index;
                const selected = at === state.index;
                const Icon = MENTION_ICON[option.kind];
                return (
                  <div
                    key={`${option.kind}:${option.id}`}
                    role="option"
                    aria-selected={selected}
                    data-selected={selected ? "" : undefined}
                    data-slot="text-edit-mention-item"
                    onMouseEnter={() => onHover(at)}
                    onClick={() => state.command(option)}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-selected:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="flex size-4 shrink-0 items-center justify-center"
                    >
                      {option.icon ?? <Icon />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="max-w-[45%] truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

const MENTION_ICON: Record<MentionKind, React.ComponentType> = {
  user: UserRound,
  page: FileText,
  file: FileIcon,
  task: CircleCheck,
};

/* ------------------------------------------------------------------------------------------------
 * Library constructs — mentions, callouts, toggles, file chips, heading ids, comment highlights and
 * uploads. Every one round-trips through Markdown exactly; decorations never touch the document.
 * ----------------------------------------------------------------------------------------------*/

/** What the extensions read from the component; refs, so the extensions are built once. */
interface EditorRuntime {
  mentionHref: React.RefObject<TextEditProps["mentionHref"]>;
  fileLinkPrefix: React.RefObject<string>;
  mention: {
    enabled: () => boolean;
    get: () => MentionMenuState | null;
    set: (next: MentionMenuState | null) => void;
    query: (query: string) => void;
  };
}

/** A mention chip's node view: the shared `MentionChip`; ⌘/Ctrl-click opens its target. */
function mentionView(runtime: EditorRuntime) {
  return function MentionView({ node }: ReactNodeViewProps) {
    const { kind, id, label } = node.attrs as {
      kind: MentionKind;
      id: string;
      label: string;
    };
    const href =
      kind === "user" || id.startsWith("restricted:")
        ? null
        : (runtime.mentionHref.current?.(kind, id) ?? null);
    return (
      <NodeViewWrapper
        as="span"
        className="inline"
        onClick={(event: React.MouseEvent) => {
          if (!href || !(event.metaKey || event.ctrlKey)) return;
          event.preventDefault();
          window.open(href, "_blank", "noopener,noreferrer");
        }}
      >
        <MentionChip
          kind={kind}
          id={id}
          label={label}
          title={href ? `${label} — ⌘-click to open` : undefined}
        />
      </NodeViewWrapper>
    );
  };
}

/**
 * `@` mention — an inline atom `{ kind, id, label }`. Markdown: `[@<label>](mention://<kind>/<id>)`,
 * read by a tokenizer that runs before marked's own link rule, so it never becomes a link.
 */
function mentionNode(runtime: EditorRuntime) {
  return TiptapNode.create({
    name: "mention",
    group: "inline",
    inline: true,
    atom: true,
    selectable: false,
    draggable: false,
    addAttributes() {
      return {
        kind: {
          default: "user",
          parseHTML: (element) => element.getAttribute("data-kind"),
          renderHTML: (attrs) => ({ "data-kind": attrs.kind }),
        },
        id: {
          default: "",
          parseHTML: (element) => element.getAttribute("data-id"),
          renderHTML: (attrs) => ({ "data-id": attrs.id }),
        },
        label: {
          default: "",
          parseHTML: (element) => element.getAttribute("data-label"),
          renderHTML: (attrs) => ({ "data-label": attrs.label }),
        },
      };
    },
    parseHTML() {
      return [{ tag: "span[data-type=mention]" }];
    },
    renderHTML({ node, HTMLAttributes }) {
      return [
        "span",
        mergeAttributes({ "data-type": "mention" }, HTMLAttributes),
        `@${node.attrs.label}`,
      ];
    },
    renderText: ({ node }) => `@${node.attrs.label}`,
    // The anchor text (`anchorText`) and a heading's outline text read a mention as `@label`.
    extendNodeSchema(extension) {
      return extension.name === "mention"
        ? { leafText: (node: PMNode) => `@${node.attrs.label}` }
        : {};
    },
    markdownTokenName: "mention",
    markdownTokenizer: {
      name: "mention",
      level: "inline",
      start: (src: string) => src.indexOf("[@"),
      tokenize: (src: string) => {
        const mention = parseMentionLink(src);
        if (!mention) return undefined;
        return {
          type: "mention",
          raw: mention.raw,
          kind: mention.kind,
          id: mention.id,
          label: mention.label,
        };
      },
    },
    parseMarkdown: (token, helpers) =>
      helpers.createNode("mention", {
        kind: token.kind,
        id: token.id,
        label: token.label,
      }),
    renderMarkdown: (node) =>
      mentionMarkdown(
        node.attrs?.kind ?? "user",
        node.attrs?.id ?? "",
        node.attrs?.label ?? "",
      ),
    addNodeView() {
      return ReactNodeViewRenderer(mentionView(runtime), { as: "span" });
    },
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
          allowedPrefixes: [" "],
          allow: () =>
            runtime.mention.enabled() && !editor.isActive("codeBlock"),
          items: () => [],
          command: ({ editor: ed, range, props }) => {
            ed.chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "mention",
                  attrs: {
                    kind: props.kind,
                    id: props.id,
                    label: props.label.replace(/\s*\n\s*/g, " "),
                  },
                },
                { type: "text", text: " " },
              ])
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
                if (event.key === "Escape") {
                  exitSuggestion(editor.view, MENTION_KEY);
                  return true;
                }
                const options = flatOptions(state.results);
                const count = options.length;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  if (!count) return true;
                  const step = event.key === "ArrowDown" ? 1 : -1;
                  runtime.mention.set({
                    ...state,
                    index: (state.index + step + count) % count,
                  });
                  return true;
                }
                if (event.key === "Enter" || event.key === "Tab") {
                  const picked = options[state.index];
                  if (!picked) return event.key === "Enter";
                  state.command(picked);
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

const CALLOUT_TONES: readonly CalloutTone[] = ["note", "tip", "warning"];
const CALLOUT_ICON: Record<CalloutTone, React.ComponentType> = {
  note: Info,
  tip: Lightbulb,
  warning: TriangleAlert,
};
const CALLOUT_NAME: Record<CalloutTone, string> = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
};

/** A callout's node view: the tone icon (a button that cycles the tone while editable) and its blocks. */
function CalloutView({ node, editor, updateAttributes }: ReactNodeViewProps) {
  const tone = (node.attrs.tone as CalloutTone) ?? "note";
  const Icon = CALLOUT_ICON[tone] ?? Info;
  return (
    <NodeViewWrapper
      role="note"
      aria-label={CALLOUT_NAME[tone]}
      data-slot="callout"
      data-tone={tone}
    >
      {editor.isEditable ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          contentEditable={false}
          aria-label={`Callout type: ${CALLOUT_NAME[tone]}`}
          title="Change callout type"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            updateAttributes({
              tone: CALLOUT_TONES[
                (CALLOUT_TONES.indexOf(tone) + 1) % CALLOUT_TONES.length
              ],
            })
          }
          className="-my-1 -ms-1.5 size-6 [&_svg]:text-current"
          data-tone={tone}
        >
          <Icon />
        </Button>
      ) : (
        <Icon aria-hidden />
      )}
      <NodeViewContent data-slot="callout-content" />
    </NodeViewWrapper>
  );
}

/** `> [!NOTE]` … — the callout's quote lines, from the start of `src`. */
const CALLOUT_BLOCK =
  /^> \[!(NOTE|TIP|WARNING)\][ \t]*(?:\n|$)((?:>[^\n]*(?:\n|$))*)/;

/** Callout — GitHub's alert syntax (`> [!NOTE]`, `[!TIP]`, `[!WARNING]`) around its blocks. */
const Callout = TiptapNode.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      tone: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-tone") ?? "note",
        renderHTML: (attrs) => ({ "data-tone": attrs.tone }),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-slot=callout]",
        contentElement: "[data-slot=callout-content]",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-slot": "callout", role: "note" }, HTMLAttributes),
      ["div", { "data-slot": "callout-content" }, 0],
    ];
  },
  markdownTokenName: "callout",
  markdownTokenizer: {
    name: "callout",
    level: "block",
    start: (src: string) => {
      const match = /^> \[!(?:NOTE|TIP|WARNING)\]/m.exec(src);
      return match ? match.index : -1;
    },
    tokenize: (src: string, _tokens, lexer) => {
      const match = CALLOUT_BLOCK.exec(src);
      if (!match) return undefined;
      const body = (match[2] ?? "")
        .replace(/\n$/, "")
        .split("\n")
        .map((line) => line.replace(/^> ?/, ""))
        .join("\n");
      return {
        type: "callout",
        raw: match[0],
        tone: match[1]!.toLowerCase(),
        tokens: body.trim() ? lexer.blockTokens(body) : [],
      };
    },
  },
  parseMarkdown: (token, helpers) => {
    const children = helpers.parseChildren(token.tokens ?? []);
    return helpers.createNode(
      "callout",
      { tone: token.tone },
      children.length ? children : [helpers.createNode("paragraph")],
    );
  },
  renderMarkdown: (node, helpers) => {
    const lines = [`> [!${String(node.attrs?.tone ?? "note").toUpperCase()}]`];
    (node.content ?? []).forEach((child: JSONContent, index: number) => {
      if (index > 0) lines.push(">");
      const text =
        helpers.renderChild?.(child, index) ?? helpers.renderChildren([child]);
      for (const line of text.split("\n"))
        lines.push(line.trim() === "" ? ">" : `> ${line}`);
    });
    return lines.join("\n");
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

/** A toggle's node view: a chevron in the gutter, then its summary and body (always open while editing). */
function ToggleView() {
  return (
    <NodeViewWrapper data-slot="toggle" className="relative my-2 ps-5">
      <span
        aria-hidden
        contentEditable={false}
        className="pointer-events-none absolute start-0 top-0.5 text-muted-foreground [&_svg]:size-4"
      >
        <ChevronDown />
      </span>
      <NodeViewContent
        data-slot="toggle-content"
        className="[&>[data-slot=toggle-summary]]:font-medium"
      />
    </NodeViewWrapper>
  );
}

/**
 * Toggle — `<details><summary>Title</summary>` + blank line + its blocks + blank line +
 * `</details>`. `MarkdownView` renders it as a native disclosure, collapsed.
 */
const ToggleNode = TiptapNode.create({
  name: "toggle",
  group: "block",
  content: "toggleSummary block+",
  defining: true,
  parseHTML() {
    return [{ tag: "details" }, { tag: "div[data-slot=toggle]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes({ open: "" }, HTMLAttributes), 0];
  },
  markdownTokenName: "toggle",
  markdownTokenizer: {
    name: "toggle",
    level: "block",
    start: (src: string) => {
      const match = /^<details>/m.exec(src);
      return match ? match.index : -1;
    },
    tokenize: (src: string, _tokens, lexer) => {
      const open =
        /^<details>[ \t]*<summary>([^\n]*?)<\/summary>[ \t]*(?:\n|$)/.exec(src);
      if (!open) return undefined;
      // The matching `</details>` line, nested toggles counted.
      let depth = 1;
      let at = open[0].length;
      let bodyEnd = -1;
      let end = -1;
      while (at < src.length) {
        const next = src.indexOf("\n", at);
        const lineEnd = next === -1 ? src.length : next;
        const line = src.slice(at, lineEnd);
        if (/^<details>/.test(line)) depth++;
        else if (/^<\/details>[ \t]*$/.test(line) && --depth === 0) {
          bodyEnd = at;
          end = next === -1 ? lineEnd : lineEnd + 1;
          break;
        }
        at = lineEnd + 1;
      }
      if (end === -1) return undefined;
      const body = src.slice(open[0].length, bodyEnd).trim();
      return {
        type: "toggle",
        raw: src.slice(0, end),
        summary: lexer.inlineTokens(open[1]!),
        tokens: body ? lexer.blockTokens(body) : [],
      };
    },
  },
  parseMarkdown: (token, helpers) => {
    const body = helpers.parseChildren(token.tokens ?? []);
    return helpers.createNode("toggle", undefined, [
      helpers.createNode(
        "toggleSummary",
        undefined,
        helpers.parseInline(token.summary ?? []),
      ),
      ...(body.length ? body : [helpers.createNode("paragraph")]),
    ]);
  },
  renderMarkdown: (node, helpers) => {
    const [summary, ...body] = (node.content ?? []) as JSONContent[];
    const title = summary?.content?.length
      ? helpers.renderChildren(summary.content)
      : "";
    const blocks = body
      .map(
        (child, index) =>
          helpers.renderChild?.(child, index + 1) ??
          helpers.renderChildren([child]),
      )
      .join("\n\n");
    return `<details><summary>${title}</summary>\n\n${blocks}\n\n</details>`;
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },
  addKeyboardShortcuts() {
    // Enter in the summary goes to the body: a summary is one line.
    const intoBody = () => {
      const { $from } = this.editor.state.selection;
      if ($from.parent.type.name !== "toggleSummary") return false;
      const after = $from.after();
      const tr = this.editor.state.tr;
      tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
      this.editor.view.dispatch(tr.scrollIntoView());
      return true;
    };
    return { Enter: intoBody, "Shift-Enter": intoBody };
  },
});

/** A toggle's title line. */
const ToggleSummary = TiptapNode.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "summary" }, { tag: "div[data-slot=toggle-summary]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-slot": "toggle-summary" }, HTMLAttributes),
      0,
    ];
  },
});

const LINK_ATTRIBUTES = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

function buildExtensions(
  placeholder: React.RefObject<string | undefined>,
  runtime: SlashRuntime,
  editorRuntime: EditorRuntime,
  annotationRuntime: Parameters<typeof annotationsExtension>[0],
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
    // Columns resize by dragging their border (a session-only width in markdown, which has no
    // column widths; kept as `colwidth` in HTML).
    TableKit.configure({
      table: { resizable: true, renderWrapper: true, cellMinWidth: 48 },
    }),
    // Inline, like GFM's `![]()` inside a paragraph, so an image sits where view mode puts it.
    Image.configure({ inline: true }),
    Placeholder.configure({ placeholder: () => placeholder.current ?? "" }),
    Markdown,
    Shortcuts,
    slashExtension(runtime),
    mentionNode(editorRuntime),
    Callout,
    ToggleNode,
    ToggleSummary,
    fileChips(editorRuntime),
    HeadingIds,
    annotationsExtension(annotationRuntime),
    Uploads,
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

const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";

/** Every floating part of the editor — focus moving into one of them stays in the edit session. */
const FLOATING_SLOTS =
  "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-image],[data-slot=text-edit-turn-into],[data-slot=text-edit-slash-menu],[data-slot=text-edit-mention-menu],[data-slot=text-edit-table-grip],[data-slot=text-edit-table-add],[data-text-edit-menu]";

/**
 * The one portal every floating part renders through (slash menu, drag handle, table grips and
 * "+" bars, drop line): `<body>`, so no overflow container clips it, with the theme scope restored on a
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
  onUpload,
}: {
  editor: Editor;
  onClose: () => void;
  onLeave: (next: EventTarget | null) => void;
  /** Open the file picker for an image upload; absent when the host takes no uploads. */
  onUpload?: () => void;
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
      {onUpload ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onClose();
            onUpload();
          }}
          className="justify-start"
        >
          <Upload />
          Upload image
        </Button>
      ) : null}
      <Input
        aria-label="Image URL"
        placeholder={onUpload ? "Or paste an image URL" : "Image URL"}
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
  onUploadImage,
  onComment,
}: {
  editor: Editor;
  panel: Panel | null;
  onPanelChange: (panel: Panel | null) => void;
  onLeave: (next: EventTarget | null) => void;
  onUploadImage?: () => void;
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
      block: currentBlockType(ed),
      // A cell holds one line: no block to turn it into.
      cell: inTableCell(ed.state),
    }),
  });
  const close = () => onPanelChange(null);

  if (panel === "link")
    return <LinkPanel editor={editor} onClose={close} onLeave={onLeave} />;
  if (panel === "image")
    return (
      <ImagePanel
        editor={editor}
        onClose={close}
        onLeave={onLeave}
        onUpload={onUploadImage}
      />
    );
  if (panel === "turnInto")
    return <TurnIntoPanel editor={editor} onClose={close} onLeave={onLeave} />;

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
      {commentButton ? (
        <>
          {commentButton}
          <Toolbar.Separator className="mx-0.5 h-4 w-px bg-border" />
        </>
      ) : null}
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
  "fixed z-50 flex cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing data-popup-open:bg-muted data-popup-open:text-foreground [&_svg]:size-3.5";
/** A row or column grip: a small pill on the table's inner edge, over the cell padding. */
const LINE_GRIP =
  "fixed z-50 flex cursor-grab touch-none items-center justify-center rounded-sm border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing data-popup-open:bg-muted data-popup-open:text-foreground [&_svg]:size-3";
/** Notion's "+" bars below and beside a table. */
const ADD_BAR =
  "fixed z-50 size-auto min-w-0 rounded-sm bg-muted/50 text-muted-foreground/70 hover:bg-muted hover:text-foreground [&_svg]:size-3";
// The drop line's ink is the shared reorder token (`drag-item`), the same as SortableList's.
const DROP_LINE = cn(
  "pointer-events-none fixed z-50 rounded-full",
  dropIndicatorClasses,
);
/** The block grip's width and its start offset from the text (width + a 3px gap). */
const HANDLE_WIDTH = 10;
const HANDLE_GUTTER = HANDLE_WIDTH + 3;
/** The containers whose padding the block grip stays inside. */
const HANDLE_FRAME =
  '[data-slot="dialog-content"],[data-slot="sheet-content"],[data-slot="drawer-content"],[data-slot="popover-content"],[data-slot="card"]';

/**
 * The block grip's left edge for a block starting at `left`: 3px before the text (clearing a list
 * marker), which fits the 16px padding of a Dialog, Sheet, Popover or Card, clamped inside that
 * frame (a boxed editor's own border first) when the padding is narrower.
 */
function handleLeft(editor: Editor, left: number) {
  const frame =
    editor.view.dom.closest('[data-slot="text-edit"][data-variant="boxed"]') ??
    editor.view.dom.closest(HANDLE_FRAME);
  return Math.max(
    left - HANDLE_GUTTER,
    frame ? frame.getBoundingClientRect().left + 2 : -Infinity,
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
  const { siblings } = siblingsOf(editor.view, pos);
  const rects = siblings.map(
    (sibling) => sibling.dom?.getBoundingClientRect() ?? new DOMRect(),
  );
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.right));
  let slot = -1;
  // Synchronous (tiptap's `focus()` waits a frame): the edit session opens before the move.
  editor.view.focus();
  startDrag(event, {
    onMove: (next) => {
      slot = slotAt(rects, next.clientY, "y");
      const edge =
        slot >= rects.length
          ? rects[rects.length - 1]!.bottom
          : rects[slot]!.top;
      handlers.setLine({ left, top: edge - 1, width: right - left, height: 2 });
    },
    onDrop: () => {
      if (slot >= 0) moveNodeTo(editor.view, pos, slot);
    },
    onClick: handlers.onClick,
    onEnd: () => {
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

/**
 * The ⋮⋮ handle beside the hovered block (a top-level block, or a list item among its siblings).
 * Drag it to reorder; a line shows the drop slot. Click it to select the block (then ⌫ deletes,
 * ⌘C copies). ⌘⇧↑ / ⌘⇧↓ move the caret's block from the keyboard. Moves are node moves, so the
 * markdown is the same blocks in a new order. A table's handle is `TableControls`' corner grip.
 */
function BlockHandle({ editor }: { editor: Editor }) {
  const { value, show, hideSoon, keep, pinnedRef } = useHover<Block>(
    (a, b) => a.dom === b.dom && a.pos === b.pos,
  );
  const [line, setLine] = React.useState<DragLine | null>(null);

  React.useEffect(() => {
    const dom = editor.view.dom;
    const onMove = (event: MouseEvent) => {
      if (pinnedRef.current || !(event.target instanceof Node)) return;
      if (event.target === dom) return;
      const block = blockAt(editor.view, event.target);
      if (block) show(block.node.type.name === "table" ? null : block);
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
  }, [editor, show, hideSoon, pinnedRef]);

  if (!value || !value.dom.isConnected) return null;
  const block = value;
  const box = block.dom.getBoundingClientRect();
  // A bullet or number sits in the list's start padding, outside the item's box; clear it.
  const marker = block.node.type.name === "listItem" ? 20 : 0;
  const lineHeight = Math.min(box.height, 24);

  const onPointerDown = (event: React.PointerEvent) => {
    pinnedRef.current = true;
    startBlockDrag(editor, block.pos, event, {
      setLine,
      onClick: () =>
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, block.pos),
          ),
        ),
      onEnd: () => {
        pinnedRef.current = false;
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
          left: handleLeft(editor, box.left - marker),
          top: box.top + lineHeight / 2 - 10,
          width: HANDLE_WIDTH,
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
 * TextEdit
 * ----------------------------------------------------------------------------------------------*/

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
   * Filled with the editor's imperative handle; the shell's `handleRef` delegates to it.
   * @default undefined
   */
  editorHandle?: React.RefObject<TextEditHandle | null>;
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
  escapeBehavior = autosave ? "blur" : "revert",
  saving = false,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel,
  variant = "document",
  mentions,
  mentionHref,
  onImageUpload,
  onFileUpload,
  onUploadError,
  fileLinkPrefix = "/api/files/",
  onOutlineChange,
  annotations,
  activeAnnotationId = null,
  onAnnotationClick,
  onAnnotationHover,
  onCreateAnnotation,
  onAnnotationsLayout,
  annotationCounts = "never",
  annotationLabel = defaultAnnotationLabel,
  annotationCountLabel = defaultAnnotationCountLabel,
  aria,
  surfaceClassName,
  hintClassName,
  contentClassName,
  contentStyle,
  rootRef,
  hidden = false,
  onReady,
  editorHandle,
}: TextEditEditorProps) {
  const boxed = variant === "boxed";
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
    mentions,
    onImageUpload,
    onFileUpload,
    onUploadError,
    onOutlineChange,
    onAnnotationClick,
    onAnnotationHover,
    onCreateAnnotation,
    onAnnotationsLayout,
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
      onOutlineChange,
      onAnnotationClick,
      onAnnotationHover,
      onCreateAnnotation,
      onAnnotationsLayout,
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
    onOutlineChange,
    onAnnotationClick,
    onAnnotationHover,
    onCreateAnnotation,
    onAnnotationsLayout,
  ]);

  const placeholderRef = React.useRef(placeholder);
  placeholderRef.current = placeholder;
  // `file` needs somewhere to send the file.
  const allowedSlash = React.useMemo(
    () => slashCommands.filter((command) => command !== "file" || onFileUpload),
    [slashCommands, onFileUpload],
  );
  const slashRef = React.useRef<readonly TextEditSlashCommand[]>(allowedSlash);
  slashRef.current = allowedSlash;
  const mentionHrefRef = React.useRef(mentionHref);
  mentionHrefRef.current = mentionHref;
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
  const pickRef = React.useRef<(() => void) | null>(null);
  const openPanel = React.useCallback((next: Panel | null) => {
    if (next === "file") pickRef.current?.();
    else setPanel(next);
  }, []);

  // Built once: the editor is never recreated by a re-render.
  const [extensions] = React.useState(() =>
    buildExtensions(
      placeholderRef,
      {
        allowed: slashRef,
        get: () => slashStateRef.current,
        set: (next) => {
          slashStateRef.current = next;
          setSlashState(next);
        },
        open: openPanel,
      },
      {
        mentionHref: mentionHrefRef,
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
    ),
  );

  const editorRef = React.useRef<Editor | null>(null);
  const {
    id: resolvedId,
    "aria-labelledby": resolvedLabelledBy,
    "aria-describedby": resolvedDescribedBy,
    "aria-invalid": ariaInvalidAttribute,
  } = aria;
  const hasSlash = allowedSlash.length > 0;
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
      role: "textbox",
      "aria-multiline": "true",
      ...(saving ? { "aria-busy": "true" } : {}),
      ...(disabled ? { "aria-disabled": "true" } : {}),
      ...(!disabled && !editable ? { "aria-readonly": "true" } : {}),
    }),
    [
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
    if (!ed || ed.isDestroyed || baselineRef.current === null) return;
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
    if (!ed || ed.isDestroyed) return;
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
    if (!ed || ed.isDestroyed) return;
    const next = serialize(ed);
    if (baselineRef.current !== null) baselineRef.current = next;
    committedRef.current = next;
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

  /** Upload `file` into the document at `pos`: a placeholder now, the image or link on success. */
  const startUpload = React.useCallback(
    (file: File, pos: number): boolean => {
      const ed = editorRef.current;
      const image = file.type.startsWith("image/");
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
        current.chain().insertContentAt(at, content).run();
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
              land({
                type: "text",
                text: result.name,
                marks: [{ type: "link", attrs: { href: result.href } }],
              }),
            )
      )
        .catch(drop)
        .finally(() => {
          if (preview) URL.revokeObjectURL(preview);
          uploadsRef.current.delete(id);
        });
      uploadsRef.current.set(id, { controller, done });
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

  /** Upload each file at `pos`; true when at least one had somewhere to go. */
  const uploadFiles = React.useCallback(
    (files: readonly File[], pos: number) => {
      let started = false;
      for (const file of files) started = startUpload(file, pos) || started;
      return started;
    },
    [startUpload],
  );

  const editor = useEditor({
    extensions,
    content: value ?? defaultValue,
    ...(markdown ? { contentType: "markdown" as const } : {}),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: editorAttributes,
      handleKeyDown: (view, event) => {
        // The slash and mention menus own Enter, arrows and Escape while open.
        if (SLASH_KEY.getState(view.state)?.active) return false;
        if (MENTION_KEY.getState(view.state)?.active) return false;
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
          if (escapeRef.current === "blur") {
            // Keep what is typed: a document that saves as you type must never lose saved text.
            commit();
            editorRef.current?.commands.blur();
          } else revert();
          return true;
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
      transformPastedHTML: sanitizePastedHTML,
      // Markdown pasted as plain text is parsed, not inserted verbatim. A bare URL is left to the
      // link extension, which turns it into a link over the selection. Pasted files (a
      // screenshot) upload, when the host takes uploads.
      handlePaste: (view, event) => {
        const ed = editorRef.current;
        const files = Array.from(event.clipboardData?.files ?? []);
        const text = event.clipboardData?.getData("text/plain");
        if (ed && files.length > 0 && !text) {
          const { from, to } = view.state.selection;
          if (from !== to) view.dispatch(view.state.tr.deleteSelection());
          if (uploadFiles(files, view.state.selection.from)) return true;
        }
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
    },
    onUpdate: ({ editor: ed }) => {
      liveDocRef.current = ed.state.doc;
      callbacks.current.onValueChange?.(serialize(ed));
    },
  });

  editorRef.current = editor;

  // The document the host passed in is the committed one until something changes it.
  React.useEffect(() => {
    if (editor && committedRef.current === null)
      committedRef.current = serialize(editor);
  }, [editor, serialize]);

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
    if (previous && previous !== editor && live) {
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
    if (!editor || value === undefined) return;
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

  // Outline: every heading's id, level and text — after load, then 150ms after each change.
  React.useEffect(() => {
    if (!editor || !onOutlineChange) return;
    let last = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const emit = () => {
      if (editor.isDestroyed) return;
      const outline = headingsOf(editor.state.doc)
        .filter((entry) => entry.level <= 4)
        .map((entry) => ({
          id: entry.id,
          level: entry.level as 1 | 2 | 3 | 4,
          text: entry.text,
        }));
      const key = JSON.stringify(outline);
      if (key === last) return;
      last = key;
      callbacks.current.onOutlineChange?.(outline);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(emit, 150);
    };
    emit();
    editor.on("update", schedule);
    return () => {
      clearTimeout(timer);
      editor.off("update", schedule);
    };
  }, [editor, onOutlineChange]);

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
        return {
          id,
          top,
          anchor: anchorFromRange(anchorText(doc), offsets.start, offsets.end),
        };
      });
      const key = JSON.stringify(items);
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

  const getAnchorForSelection = React.useCallback((): TextAnchor | null => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) return null;
    const { from, to, empty } = ed.state.selection;
    if (empty) return null;
    const { doc } = ed.state;
    const offsets = rangeToOffsets(doc, from, to);
    if (offsets.start === offsets.end) return null;
    return anchorFromRange(anchorText(doc), offsets.start, offsets.end);
  }, []);

  // The imperative handle the shell's `handleRef` delegates to.
  const pulseTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(pulseTimerRef.current), []);
  React.useImperativeHandle(
    editorHandle,
    () => ({
      scrollToHeading: (id: string) => {
        const target = rootRef.current?.querySelector<HTMLElement>(
          `[id="${CSS.escape(id)}"]`,
        );
        target?.scrollIntoView({ block: "start", behavior: "smooth" });
      },
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
        if (range)
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
    [commitNow, getAnchorForSelection, markSaved, rootRef],
  );

  const canComment = Boolean(onCreateAnnotation);
  const comment = React.useCallback(() => {
    const anchor = getAnchorForSelection();
    if (anchor) callbacks.current.onCreateAnnotation?.(anchor);
  }, [getAnchorForSelection]);

  const themeScope = useInternalThemeScope();
  // Floating UI inside the bubble menus: fixed to the viewport, flipped and shifted into view.
  const bubbleOptions = React.useMemo(
    () => ({ ...FLOATING, placement: "top-start" as const }),
    [],
  );
  const showBubble = React.useCallback(
    ({ editor: ed, from, to, state }: MenuShowProps) =>
      panel !== null ||
      ((ed.isEditable || canComment) &&
        from !== to &&
        !(state.selection instanceof NodeSelection) &&
        !(state.selection instanceof CellSelection) &&
        !ed.isActive("codeBlock")),
    [panel, canComment],
  );
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
    editor.view.dispatch(
      state.tr.setMeta(menuKeys.bubble, showBubble(args) ? "show" : "hide"),
    );
  }, [editor, panel, menuKeys, showBubble]);

  return (
    <>
      {(editable || canComment) && editor ? (
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
            onUploadImage={
              onImageUpload && editable ? () => openPanel("file") : undefined
            }
            onComment={canComment ? comment : undefined}
          />
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
      {mentionMenu && editable ? (
        <FloatingLayer>
          <MentionMenu
            state={mentionMenu}
            onHover={(index) => setMention({ ...mentionMenu, index })}
          />
        </FloatingLayer>
      ) : null}
      {dragHandles && editable && editor ? (
        <>
          <BlockHandle editor={editor} />
          <TableControls editor={editor} markdown={markdown} />
        </>
      ) : null}
      {canUpload && editable ? (
        <>
          <input {...picker.inputProps} className="hidden" />
          <picker.Announcer />
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
        className={contentClassName}
        style={contentStyle}
        hidden={hidden}
      >
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
