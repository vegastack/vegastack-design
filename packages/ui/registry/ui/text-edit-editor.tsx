// @vegastack text-edit@0.23.66 sha256-8dnqpfdtWqhi2Ocht3ZBkIJ6K7sSm/SWo3Hpo4+MGqg=

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
import {
  CellSelection,
  TableMap,
  addColumn,
  addRow,
  deleteCellSelection,
} from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";
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
  Copy,
  Eraser,
  ExternalLink,
  GripHorizontal,
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
import type {
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
  "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-image],[data-slot=text-edit-turn-into],[data-slot=text-edit-slash-menu],[data-slot=text-edit-table-grip],[data-slot=text-edit-table-add],[data-text-edit-menu]";

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
  saving = false,
  readOnly = false,
  disabled = false,
  "aria-label": ariaLabel,
  variant = "document",
  aria,
  surfaceClassName,
  hintClassName,
  contentClassName,
  contentStyle,
  rootRef,
  hidden = false,
  onReady,
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
  const {
    id: resolvedId,
    "aria-labelledby": resolvedLabelledBy,
    "aria-describedby": resolvedDescribedBy,
    "aria-invalid": ariaInvalidAttribute,
  } = aria;
  const hasSlash = slashCommands.length > 0;
  const editorAttributes = React.useMemo(
    () => ({
      class: cn(surfaceClassName, editable && hasSlash && hintClassName),
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

  const themeScope = useInternalThemeScope();
  // Floating UI inside the bubble menus: fixed to the viewport, flipped and shifted into view.
  const bubbleOptions = React.useMemo(
    () => ({ ...FLOATING, placement: "top-start" as const }),
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
          <TableControls editor={editor} markdown={markdown} />
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
