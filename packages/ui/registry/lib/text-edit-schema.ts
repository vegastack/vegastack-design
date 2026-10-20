// @vegastack text-edit-schema@0.25.51 sha256-BuURpIKcNhRsh7i/Rgkpfa70zpNeIAF0/r2umBm6TJ4=

import {
  Extension,
  Mark,
  Node,
  decodeHtmlEntities,
  getSchema,
  mergeAttributes,
  textblockTypeInputRule,
  type AnyExtension,
  type JSONContent,
  type MarkdownParseHelpers,
  type MarkdownRendererHelpers,
  type MarkdownToken,
  type NodeViewRenderer,
} from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { Code } from "@tiptap/extension-code";
import { CodeBlock } from "@tiptap/extension-code-block";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import {
  ListItem,
  OrderedList,
  TaskItem,
  TaskList,
} from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Table, TableKit } from "@tiptap/extension-table";
import { UniqueID } from "@tiptap/extension-unique-id";
import {
  CALLOUT_BLOCK,
  MEDIA_BLOCK,
  readTasksDirective,
  tasksDirectiveMarkdown,
  codeFenceInfo,
  imageMarkdown,
  markdownDestination,
  markdownTitle,
  mediaMarkdown,
  mentionMarkdown,
  parseCodeFenceInfo,
  parseImageAlt,
  parseMentionLink,
} from "@/lib/text-edit-grammar";
import { matchEmbed, type EmbedProviderId } from "@/lib/embed-providers";

/**
 * text-edit-schema — `TextEdit`'s document schema as plain Tiptap extensions: every node, mark and
 * attribute the editor stores, each with its VegaStack Markdown parse and render rules. No React,
 * no DOM, no `"use client"`: the editor composes it with its node views and plugins, and a server
 * (a collaboration server, an import, an API that writes pages) builds the identical schema from
 * it. One list, so a document written anywhere opens everywhere with the same nodes and attributes.
 *
 * The Markdown rules here carry fixes the upstream Tiptap release does not have yet (each is pinned
 * by a fixture in the round-trip corpus; drop the override once upstream ships the fix):
 * - an indented fence (` ```` ` after 1–3 spaces) is a code block, not deleted text (tiptap#8460);
 * - ordered lists are CommonMark's (`Hi. there` is a sentence; a less-indented item stays) — marked's
 *   own list tokenizer, not Tiptap's (tiptap#8395, #8445, #8472);
 * - a hard break is `\` + newline (`<br>` in a heading or a table cell), never two trailing spaces;
 * - link destinations decode `&amp;` and are written as `<…>` when they hold a space (tiptap#8468);
 * - every block tokenizer's `start` looks at the current paragraph only, and the task-list tokenizer
 *   checks its first line before scanning — parsing is linear, not quadratic (tiptap#8458).
 */

/** Nodes whose client rendering the editor supplies; the schema itself never changes. */
export type TextEditNodeView =
  | "taskItem"
  | "codeBlock"
  | "image"
  | "mention"
  | "callout"
  | "toggle"
  | "video"
  | "audio"
  | "embed"
  | "taskQuery";

/** What `textEditExtensions` takes. Every option is client-only: none changes the schema. */
export interface TextEditSchemaOptions {
  /** Node views by node, injected so this module stays server-safe. */
  nodeViews?: Partial<Record<TextEditNodeView, () => NodeViewRenderer>>;
  /** Behaviour-only extensions appended after the schema (placeholder, menus, decorations). */
  plugins?: AnyExtension[];
  /** The href prefix that marks a link as a file chip (`data-slot="file-chip"` when rendered). */
  fileLinkPrefix?: () => string;
  /** A lowlight instance: code blocks highlight with it. Omit on a server. */
  lowlight?: object;
  /**
   * A collaborative editor. Tiptap's own undo history is off (the collaboration undo replaces it),
   * and new blocks get ids as they appear — in this viewer's own transactions only (`isRemote`
   * tells a collaborator's change apart), so two viewers never race on one block.
   */
  collaboration?: { isRemote: (transaction: Transaction) => boolean };
  /**
   * A version diff's schema: `TextEditDiff`'s `ychange` mark and attribute, and code blocks that
   * take the change mark (their text takes no other). Never for a live document.
   */
  diff?: boolean;
}

/**
 * The blocks that carry a stable `blockId` (`data-blockId` in HTML, read back as `data-blockid`):
 * heading links, per-viewer toggle state, anchors and section keys all point at it. Markdown never carries one — except a
 * live task list's (`taskQuery`), whose `:::tasks{id="…"}` is its `blockId`: its snapshots and
 * the host's records of it are keyed by that id.
 */
export const BLOCK_ID_TYPES = [
  "heading",
  "paragraph",
  "listItem",
  "taskItem",
  "toggle",
  "callout",
  "table",
  "codeBlock",
  "embed",
  "taskQuery",
] as const;

const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * A new block id: 8 random base32 characters (40 bits — unique within any one document). Ids live
 * in the document only; a heading's `#slug` link still comes from its text.
 */
export function blockId(): string {
  const bytes = new Uint8Array(8);
  const crypto = globalThis.crypto;
  if (typeof crypto?.getRandomValues === "function")
    crypto.getRandomValues(bytes);
  else
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = Math.floor(Math.random() * 256);
  let id = "";
  for (const byte of bytes) id += BASE32[byte & 31];
  return id;
}

/* --- Markdown helpers ----------------------------------------------------------------------------*/

/**
 * A block tokenizer's `start`: where in a paragraph's `src` a line opening with `marker` begins.
 * marked asks every block extension where it could interrupt a paragraph, passing the rest of the
 * document from the paragraph's second character — so only a match right after a newline is a line
 * start (a match at 0 is mid-line), and nothing past the paragraph's first blank line can matter:
 * scanning further, once per paragraph, is what made parsing quadratic.
 */
function lineStart(marker: RegExp) {
  const key = `${marker.source}/${marker.flags}`;
  const find = new RegExp(
    `\n(?=${marker.source})`,
    `${marker.flags.replace("g", "")}g`,
  );
  return (src: string) => {
    const { index, offset } = lineIndex(src);
    let starts = index.markers.get(key);
    if (!starts) {
      starts = positions(index.source, find).map((at) => at + 1);
      index.markers.set(key, starts);
    }
    const next = starts[firstAtOrAfter(starts, offset)];
    if (next === undefined) return -1;
    const blank = index.blanks[firstAtOrAfter(index.blanks, offset)];
    return blank === undefined || next <= blank ? next - offset : -1;
  };
}

/** A blank line — empty, or only spaces and tabs (CommonMark): the `\n` that opens one. */
const BLANK_LINE = /\n[ \t]*\n/;
const BLANK_LINE_STARTS = /\n(?=[ \t]*\n)/g;

/**
 * Where the blank lines and each marker's lines are in a document, found once: marked asks every
 * block extension, once per paragraph, where it could interrupt that paragraph — handing it the
 * whole rest of the document. Answering from one pass over the document (a binary search per
 * question) keeps parsing linear however the paragraphs are separated.
 */
interface LineIndex {
  source: string;
  blanks: number[];
  markers: Map<string, number[]>;
}

const LINE_INDEXES: LineIndex[] = [];

function lineIndex(src: string): { index: LineIndex; offset: number } {
  const index = cached(LINE_INDEXES, src, () => ({
    source: src,
    blanks: positions(src, BLANK_LINE_STARTS),
    markers: new Map(),
  }));
  return { index, offset: index.source.length - src.length };
}

/**
 * Forget the per-document indexes: called as each parse starts (`text-edit-markdown`), so a cache
 * only ever serves the parse that built it.
 */
export function resetParseCaches(): void {
  LINE_INDEXES.length = 0;
  TOGGLE_CACHE.length = 0;
}

/** Sources shorter than this are indexed per call (cheap), and never evict a document's index. */
const CACHE_FROM = 4096;

/**
 * The cached per-document entry `src` is a tail of, else a new one — kept most recently used
 * first, so the document being lexed stays while its nested parts (list items, callout bodies)
 * come and go. A short source is answered from a fresh entry and not cached.
 */
function cached<T extends { source: string }>(
  cache: T[],
  src: string,
  create: () => T,
): T {
  const at = cache.findIndex((each) => isTailOf(each.source, src));
  if (at !== -1) {
    const entry = cache[at]!;
    if (at > 0) {
      cache.splice(at, 1);
      cache.unshift(entry);
    }
    return entry;
  }
  const entry = create();
  if (src.length >= CACHE_FROM) {
    cache.unshift(entry);
    cache.length = Math.min(cache.length, 8);
  }
  return entry;
}

/** Every index `pattern` (global) matches at in `text`. */
function positions(text: string, pattern: RegExp): number[] {
  const found: number[] = [];
  const each = new RegExp(pattern.source, pattern.flags);
  for (let match = each.exec(text); match; match = each.exec(text)) {
    found.push(match.index);
    if (match[0] === "") each.lastIndex++;
  }
  return found;
}

/** The first index of sorted `values` holding a value at or after `value` (its length if none). */
function firstAtOrAfter(values: readonly number[], value: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (values[mid]! < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** `src` up to its first blank line: all a paragraph (or a table) can span. */
function firstParagraph(src: string): string {
  const blank = BLANK_LINE.exec(src);
  return blank ? src.slice(0, blank.index + 1) : src;
}

/** `src`'s first two lines: all a table's `start` reads (its header and delimiter rows). */
function firstTwoLines(src: string): string {
  const first = src.indexOf("\n");
  if (first === -1) return src;
  const second = src.indexOf("\n", first + 1);
  return second === -1 ? src : src.slice(0, second + 1);
}

/** The longest run of `char` in `text` — counted, never spread into `Math.max` (huge code blocks). */
function longestRun(text: string, char: string): number {
  let longest = 0;
  let run = 0;
  for (let i = 0; i < text.length; i++) {
    run = text[i] === char ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  return longest;
}

/**
 * How deep the serializer is inside a place a line cannot end — a table cell, a toggle's summary —
 * where a hard break is written `<br>`.
 */
let singleLineDepth = 0;

/** Plain inline text of a JSON node: what a cell keeps of a block a cell line cannot hold. */
function inlineOf(node: JSONContent, h: MarkdownRendererHelpers): string {
  return node.content ? h.renderChildren(node.content) : "";
}

/** The `<br>`-separated lines a block becomes inside a table cell (a GFM cell holds one line). */
function cellLines(
  node: JSONContent,
  h: MarkdownRendererHelpers,
  prefix = "",
): string[] {
  const children = (node.content ?? []) as JSONContent[];
  switch (node.type) {
    case "paragraph":
    case "heading":
    case "toggleSummary": {
      const text = inlineOf(node, h).trim();
      return text ? [`${prefix}${text}`] : [];
    }
    case "bulletList":
    case "orderedList":
    case "taskList": {
      const start = Number(node.attrs?.start ?? 1) || 1;
      return children.flatMap((item, index) => {
        const marker =
          node.type === "orderedList"
            ? `${start + index}. `
            : node.type === "taskList"
              ? item.attrs?.checked
                ? "☑ "
                : "☐ "
              : "• ";
        return ((item.content ?? []) as JSONContent[]).flatMap(
          (block, blockIndex) =>
            cellLines(
              block,
              h,
              blockIndex === 0 ? `${prefix}${marker}` : `${prefix}  `,
            ),
        );
      });
    }
    case "codeBlock": {
      const text = children.map((child) => child.text ?? "").join("");
      return text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const fence = "`".repeat(longestRun(line, "`") + 1);
          const pad = line.startsWith("`") || line.endsWith("`") ? " " : "";
          return `${prefix}${fence}${pad}${line}${pad}${fence}`;
        });
    }
    case "image":
      return [
        `${prefix}${imageMarkdown({
          src: String(node.attrs?.src ?? ""),
          alt: node.attrs?.alt,
          title: node.attrs?.title,
          width: node.attrs?.width,
        })}`,
      ];
    case "video":
    case "audio":
      return [`${prefix}${String(node.attrs?.src ?? "")}`];
    case "embed":
      return [`${prefix}${String(node.attrs?.url ?? "")}`];
    default:
      return children.flatMap((child) => cellLines(child, h, prefix));
  }
}

/** A table as GFM: padded columns, the alignment row, every cell on one line. */
function renderTable(node: JSONContent, h: MarkdownRendererHelpers): string {
  const rows = ((node.content ?? []) as JSONContent[]).map((row) =>
    ((row.content ?? []) as JSONContent[]).map((cell) => {
      singleLineDepth++;
      try {
        const lines = ((cell.content ?? []) as JSONContent[]).flatMap((block) =>
          cellLines(block, h),
        );
        // A cell is one line: a line break left in its text becomes `<br>` (as the parser reads
        // it); every other space is content — a code span's, a mention label's — and stays.
        const text = lines
          .join("<br>")
          .replace(/[ \t]*\r?\n[ \t]*/g, "<br>")
          .replace(/^(?:\s*<br>)+|(?:<br>\s*)+$/g, "")
          .trim()
          // A `|` is the cell edge: escape every one not already escaped.
          .replace(/\\.|\|/g, (match) => (match === "|" ? "\\|" : match));
        return {
          text,
          header: cell.type === "tableHeader",
          align: (cell.attrs?.align as string | null | undefined) ?? null,
        };
      } finally {
        singleLineDepth--;
      }
    }),
  );
  const columns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (columns === 0) return "";
  const widths = Array.from({ length: columns }, (_, index) =>
    rows.reduce(
      (width, row) => Math.max(width, row[index]?.text.length ?? 0),
      3,
    ),
  );
  const aligns = Array.from(
    { length: columns },
    (_, index) => rows.find((row) => row[index]?.align)?.[index]?.align ?? null,
  );
  const pad = (text: string, width: number) =>
    text + " ".repeat(Math.max(0, width - text.length));
  const line = (cells: string[]) =>
    `| ${cells.map((text, index) => pad(text, widths[index]!)).join(" | ")} |`;
  const hasHeader = rows[0]!.some((cell) => cell.header);
  const header = Array.from({ length: columns }, (_, index) =>
    hasHeader ? (rows[0]![index]?.text ?? "") : "",
  );
  const rule = widths.map((width, index) => {
    const dashes = "-".repeat(width);
    const align = aligns[index];
    if (align === "left") return `:${dashes}`;
    if (align === "right") return `${dashes}:`;
    if (align === "center") return `:${dashes}:`;
    return dashes;
  });
  const body = (hasHeader ? rows.slice(1) : rows).map((row) =>
    line(Array.from({ length: columns }, (_, index) => row[index]?.text ?? "")),
  );
  return [line(header), `| ${rule.join(" | ")} |`, ...body].join("\n");
}

/**
 * A cell's paragraphs without the `<br>`s at their edges (each breaks to nothing — left by an empty
 * line, never typed), and never an empty cell. Images a cell's inline Markdown holds are lifted
 * out by the parse's normalization (`text-edit-markdown`), like everywhere else.
 */
function trimCell(cell: JSONContent): JSONContent {
  const out = ((cell.content ?? []) as JSONContent[]).map((block) => {
    if (block.type !== "paragraph" || !block.content) return block;
    const trimmed = trimInline(block.content);
    return trimmed.length
      ? { ...block, content: trimmed }
      : { type: "paragraph" };
  });
  return { ...cell, content: out.length ? out : [{ type: "paragraph" }] };
}

/**
 * A run of inline nodes without the whitespace and line breaks at its edges — what is left of a
 * paragraph around a block lifted out of it, or of a table cell's line.
 */
export function trimInline(run: JSONContent[]): JSONContent[] {
  let start = 0;
  let end = run.length;
  while (start < end && run[start]!.type === "hardBreak") start++;
  while (end > start && run[end - 1]!.type === "hardBreak") end--;
  const nodes = run.slice(start, end).map((node) => ({ ...node }));
  // A code span's spaces are content: only plain text is trimmed.
  const plain = (node: JSONContent | undefined) =>
    node?.type === "text" && !node.marks?.some((mark) => mark.type === "code");
  const first = nodes[0];
  if (plain(first)) first!.text = first!.text?.trimStart();
  const last = nodes[nodes.length - 1];
  if (plain(last)) last!.text = last!.text?.trimEnd();
  return nodes.filter((node) => node.type !== "text" || node.text);
}

/**
 * Text at the start of a line that Markdown would read as block syntax — a heading, a quote, a list
 * item, a rule, a setext underline, an HTML block, or leading spaces (indented code). Each line of
 * a paragraph's Markdown gets the one escape that keeps it text.
 */
function escapeLineStart(line: string): string {
  if (/^[ \t]/.test(line))
    return `${line[0] === "\t" ? "&#9;" : "&#32;"}${line.slice(1)}`;
  if (/^#{1,6}(?:[ \t]|$)/.test(line)) return `\\${line}`;
  // A live task list's opening line (`:::tasks{…}`).
  if (line.startsWith(":::tasks{")) return `\\${line}`;
  if (
    /^(?:>|<[a-zA-Z/!?]|=+[ \t]*$|[-+](?:[ \t]|$)|(?:-[ \t]*){3,}$)/.test(line)
  )
    return `\\${line}`;
  return line.replace(/^(\d{1,9})([.)])(?=[ \t]|$)/, "$1\\$2");
}

/* --- Nodes and marks -----------------------------------------------------------------------------*/

const LINK_ATTRIBUTES = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

/** A hard break: `\` + newline, or `<br>` where a line cannot end (a heading, a table cell). */
const HardBreakMd = HardBreak.extend({
  renderMarkdown: (_node, _h, ctx) =>
    singleLineDepth > 0 || ctx.parentType === "heading" ? "<br>" : "\\\n",
});

/** Links: `&amp;` in a destination is `&`, and a destination with a space is written `<…>`. */
const LinkMd = Link.extend({
  parseMarkdown: (token, helpers) => {
    const attrs = {
      href: decodeHtmlEntities(String(token.href ?? "")),
      title: token.title || null,
    };
    const content = helpers.parseInline(token.tokens || []);
    // A link around a mention is a link inside a link — CommonMark makes the outer one text. Keep
    // it as its text, the destination included, rather than drop the URL.
    if (content.some((node) => node.type === "mention")) {
      const title = attrs.title
        ? ` "${markdownTitle(String(attrs.title))}"`
        : "";
      return [
        helpers.createTextNode("["),
        ...content,
        helpers.createTextNode(`](${markdownDestination(attrs.href)}${title})`),
      ];
    }
    if (!content.some((node) => node.type === "image"))
      return helpers.applyMark("link", content, attrs);
    // A linked image: the link is put on the image too (Tiptap's mark helper skips non-text
    // nodes), so lifting the image out as a block keeps the URL (`text-edit-markdown`).
    return content.map((node) => ({
      ...node,
      marks: [...(node.marks ?? []), { type: "link", attrs }],
    }));
  },
  renderMarkdown: (node, h) => {
    const href = markdownDestination(String(node.attrs?.href ?? ""));
    const title = node.attrs?.title
      ? ` "${markdownTitle(String(node.attrs.title))}"`
      : "";
    return `[${h.renderChildren(node)}](${href}${title})`;
  },
});

/**
 * Inline code that other marks may wrap: a linked, bold or struck-through code span
 * (`` [`code`](/x) ``, `` **`code`** ``) is everyday Markdown, and Tiptap's code mark excludes every
 * other mark — the parse threw, and an edit would have dropped the link. The marks keep their
 * Markdown order: code innermost.
 */
const CodeMd = Code.extend({ excludes: "" });

/**
 * The node a GFM task checkbox parses to: never in a document — the parse's normalization makes
 * its list item a task item, or (in an ordered list, or anywhere else) writes it back as its text.
 */
export const TASK_MARKER = "textEditTaskMarker";

/**
 * A GFM task checkbox where the document has no task list (`1. [ ] one` — an ordered list): kept as
 * its text, `[ ] ` or `[x] `, instead of dropped with its state.
 */
const CheckboxText = Extension.create({
  name: "textEditCheckboxText",
  markdownTokenName: "checkbox",
  parseMarkdown: (token, helpers) =>
    helpers.createNode(TASK_MARKER, {
      checked: Boolean(token.checked ?? /x/i.test(String(token.raw ?? ""))),
    }),
});

/**
 * A block-level `text` token — marked's form of a paragraph inside a list item, a callout or a
 * toggle nested in one — read as a paragraph of inline Markdown (Tiptap's fallback kept its raw
 * source: `**hello**` stayed asterisks, and each save escaped them again).
 */
const BlockText = Extension.create({
  name: "textEditBlockText",
  // Ahead of Tiptap's text node, which reads the same token name as plain text.
  priority: 1001,
  markdownTokenName: "text",
  parseMarkdown: (token, helpers) =>
    token.tokens
      ? helpers.createNode(
          "paragraph",
          undefined,
          helpers.parseInline(token.tokens as MarkdownToken[]),
        )
      : [],
});

/**
 * A list item whose first line is empty but that goes on with a block (`- # Heading`, `- ```js`,
 * `- ![x](/x)` — the parse gives such an item the empty paragraph its schema needs) is written with
 * that block on the marker line, so it reads back as the same item.
 */
const ListItemMd = ListItem.extend({
  renderMarkdown: (node, h, ctx) => {
    const upstream = ListItem.config.renderMarkdown as (
      node: JSONContent,
      h: MarkdownRendererHelpers,
      ctx: unknown,
    ) => string;
    const [first, second] = (node.content ?? []) as JSONContent[];
    const output = upstream(node, h, ctx);
    const emptyLead =
      first?.type === "paragraph" &&
      !first.content?.length &&
      second !== undefined &&
      second.type !== "paragraph";
    if (!emptyLead) return output;
    // `- ` + newline + the block indented → `- ` + the block (its later lines stay indented).
    const lead = /^([^\n]*)\n([ \t]+)/.exec(output);
    return lead ? `${lead[1]}${output.slice(lead[0].length)}` : output;
  },
});

/** Ordered lists are CommonMark's: marked's own list tokenizer reads them, never Tiptap's. */
const OrderedListMd = OrderedList.extend({
  // A tight item's text is inline Markdown: read it as a paragraph, never as raw text (Tiptap's
  // ordered-list reader keeps a marked `text` token's raw source — `**bold**` stayed asterisks).
  parseMarkdown: (token, helpers) => {
    const upstream = OrderedList.config.parseMarkdown as (
      token: MarkdownToken,
      helpers: MarkdownParseHelpers,
    ) => JSONContent | JSONContent[];
    const items = (token.items ?? []) as MarkdownToken[];
    return upstream(
      {
        ...token,
        items: items.map((item) => ({
          ...item,
          tokens: ((item.tokens ?? []) as MarkdownToken[]).map((each) =>
            each.type === "text" && each.tokens
              ? { ...each, type: "paragraph" }
              : each,
          ),
        })),
      },
      helpers,
    );
  },
  markdownTokenizer: {
    name: "orderedList",
    level: "block",
    start: () => -1,
    tokenize: () => undefined,
  },
});

/**
 * Images are blocks — one image per block, on its own line in markdown (`![alt|w](src)`). GFM
 * puts an image inside a paragraph (mid-sentence or alone), so loading lifts each one out: the
 * paragraph splits around it, its text stays paragraphs, the image becomes a block between them.
 * Written out, a paragraph's lines are escaped where Markdown would read them as block syntax.
 */
const ParagraphMd = Paragraph.extend({
  parseMarkdown: (token, helpers) => {
    const tokens = (token.tokens ?? []) as MarkdownToken[];
    // No image: a plain paragraph (a lone `&nbsp;` is an empty paragraph).
    if (!tokens.some((each) => each.type === "image")) {
      const content = helpers.parseInline(tokens);
      const only = content.length === 1 ? content[0] : null;
      if (
        only?.type === "text" &&
        !only.marks?.length &&
        (only.text === "\u00A0" || only.text === "&nbsp;")
      )
        return helpers.createNode("paragraph", undefined, []);
      return helpers.createNode("paragraph", undefined, content);
    }
    const out: JSONContent[] = [];
    let run: MarkdownToken[] = [];
    // The space next to a lifted image belonged to the sentence it sat in, not to the paragraph.
    const trim = (each: MarkdownToken, end: boolean): MarkdownToken =>
      each.type === "text"
        ? {
            ...each,
            raw: end ? each.raw?.trimEnd() : each.raw?.trimStart(),
            text: end ? each.text?.trimEnd() : each.text?.trimStart(),
          }
        : each;
    const flush = () => {
      if (run.length) {
        run[0] = trim(run[0]!, false);
        run[run.length - 1] = trim(run[run.length - 1]!, true);
        // The space between a link (or any other span) and the image beside it trims to nothing:
        // no empty text node (`[docs](/d) ![shot](/s.png)` threw).
        run = run.filter((each) => each.type !== "text" || each.text);
      }
      // A run of only whitespace or line breaks between images leaves no paragraph behind.
      const text = run.map((each) => each.raw ?? "").join("");
      if (text.trim())
        out.push(
          helpers.createNode("paragraph", undefined, helpers.parseInline(run)),
        );
      run = [];
    };
    for (const each of tokens) {
      if (each.type !== "image") {
        run.push(each);
        continue;
      }
      flush();
      out.push(...helpers.parseInline([each]));
    }
    flush();
    return out;
  },
  renderMarkdown: (node, h, ctx) => {
    const content = (node.content ?? []) as JSONContent[];
    // An empty paragraph has no Markdown (the serializer drops those it can).
    if (content.length === 0) return "";
    // A hard break that ends the paragraph has no line to break to.
    const text = h.renderChildren(content).replace(/(?:\\\n)+$/, "");
    if (singleLineDepth > 0) return text;
    return text.split("\n").map(escapeLineStart).join("\n");
  },
});

/**
 * Code blocks: ```` ```lang ```` (or `~~~lang`) fences, the language and the wrap flag in the info
 * string (` ```ts wrap `), the fence one longer than any backtick run inside the code. A fence
 * indented by up to three spaces is a code block too.
 */
const codeBlockMarkdown = {
  addAttributes(this: { parent?: () => Record<string, unknown> }) {
    return {
      ...this.parent?.(),
      // Long lines wrap instead of scrolling: saved as ```` ```ts wrap ```` (default: no wrap).
      wrap: {
        default: false,
        parseHTML: (element: HTMLElement) => element.hasAttribute("data-wrap"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.wrap ? { "data-wrap": "" } : {},
      },
    };
  },
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const raw = (token.raw ?? "").trimStart();
    if (
      !raw.startsWith("```") &&
      !raw.startsWith("~~~") &&
      token.codeBlockStyle !== "indented"
    )
      return [];
    const { language, wrap } = parseCodeFenceInfo(token.lang as string);
    return helpers.createNode(
      "codeBlock",
      { language: language ?? null, wrap },
      token.text ? [helpers.createTextNode(token.text as string)] : [],
    );
  },
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const info = codeFenceInfo(
      node.attrs?.language as string | null,
      Boolean(node.attrs?.wrap),
    );
    const body = node.content ? helpers.renderChildren(node.content) : "";
    // A fence longer than any backtick run inside the code, so the block cannot close early.
    const fence = "`".repeat(Math.max(2, longestRun(body, "`")) + 1);
    return `${fence}${info}\n${body}\n${fence}`;
  },
};

function codeBlockNode(
  lowlight: object | undefined,
  view: (() => NodeViewRenderer) | undefined,
  diff = false,
) {
  const config = {
    ...codeBlockMarkdown,
    // In a version diff a code block's changed lines carry the change mark.
    ...(diff ? { marks: "ychange" } : {}),
    addInputRules(this: {
      type: Parameters<typeof textblockTypeInputRule>[0]["type"];
    }) {
      return [/^```([\w+#.-]+)?[\s\n]$/, /^~~~([\w+#.-]+)?[\s\n]$/].map(
        (find) =>
          textblockTypeInputRule({
            find,
            type: this.type,
            getAttributes: (match) => ({ language: match[1] ?? null }),
          }),
      );
    },
    ...(view ? { addNodeView: view } : {}),
  };
  const options = { enableTabIndentation: true, tabSize: 2 };
  // Highlighting is a plugin, not schema: a server builds the same node without it.
  return lowlight
    ? CodeBlockLowlight.extend(config as never).configure({
        ...options,
        lowlight,
      } as never)
    : CodeBlock.extend(config as never).configure(options);
}

/**
 * Task lists are read by marked's own CommonMark list tokenizer (lazy continuation lines, nesting,
 * hard breaks — all as any list), never Tiptap's: its checkbox tokens become task markers that
 * the parse's normalization turns into task items (`text-edit-markdown`). The token name is moved
 * off `taskList` so Tiptap's mixed-list splitter never re-lexes items with its own rules.
 */
const TaskListMd = TaskList.extend({
  markdownTokenName: "textEditTaskList",
  markdownTokenizer: {
    name: "textEditTaskList",
    level: "block",
    start: () => -1,
    tokenize: () => undefined,
  },
});

/**
 * GFM tables: a header row, then body rows; a cell's blocks on one line joined by `<br>`. A cell
 * holding a list or code keeps their text (`• item`, `` `code` ``) — Markdown has no blocks in a
 * cell; the document keeps the blocks themselves.
 */
const TableMd = Table.extend({
  parseMarkdown: (token, helpers) => {
    const upstream = Table.config.parseMarkdown as (
      token: MarkdownToken,
      helpers: unknown,
    ) => JSONContent;
    const table = upstream(token, helpers);
    return {
      ...table,
      content: (table.content ?? []).map((row) => ({
        ...row,
        content: (row.content ?? []).map(trimCell),
      })),
    };
  },
  renderMarkdown: (node, h) => renderTable(node, h),
  markdownTokenizer: (() => {
    const upstream = Table.config.markdownTokenizer!;
    const start = upstream.start as (src: string) => number;
    const delimiter = /^[ \t|:]*-[ \t|:-]*$/;
    return {
      ...upstream,
      start: (src: string) => start(firstTwoLines(src)),
      // Only a header line and a delimiter row start a table — checked on two lines, then the
      // table is read from its own paragraph (a table ends at a blank line), never the whole rest.
      tokenize: (src, tokens, lexer) => {
        const first = src.indexOf("\n");
        if (first === -1) return undefined;
        const second = src.indexOf("\n", first + 1);
        const row = src.slice(first + 1, second === -1 ? src.length : second);
        if (!row.includes("|") || !delimiter.test(row)) return undefined;
        return upstream.tokenize(firstParagraph(src), tokens, lexer);
      },
    };
  })(),
});

function imageNode(view: (() => NodeViewRenderer) | undefined) {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          parseHTML: (element) => {
            const width = Number.parseInt(
              element.getAttribute("width") ?? element.style.width ?? "",
              10,
            );
            return width > 0 ? width : null;
          },
          renderHTML: (attributes) =>
            attributes.width ? { width: attributes.width } : {},
        },
        // The width alone sizes an image; its height follows the aspect ratio.
        height: { default: null, rendered: false },
      };
    },
    parseMarkdown: (token, helpers) => {
      const read = parseImageAlt(String(token.text ?? ""));
      const alt = decodeHtmlEntities(read.alt);
      const width = read.width;
      return helpers.createNode("image", {
        src: decodeHtmlEntities(String(token.href ?? "")),
        title: token.title ?? null,
        alt,
        width: width ?? null,
      });
    },
    renderMarkdown: (node) =>
      imageMarkdown({
        src: node.attrs?.src ?? "",
        alt: node.attrs?.alt,
        title: node.attrs?.title,
        width: node.attrs?.width,
      }),
    ...(view ? { addNodeView: view } : {}),
  }).configure({ inline: false });
}

/**
 * `@` mention — an inline atom `{ kind, id, label }`. Markdown: `[@<label>](mention://<kind>/<id>)`,
 * read by a tokenizer that runs before marked's own link rule, so it never becomes a link.
 */
function mentionNode(view: (() => NodeViewRenderer) | undefined) {
  return Node.create({
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
        ? {
            leafText: (node: { attrs: Record<string, unknown> }) =>
              `@${String(node.attrs.label ?? "")}`,
          }
        : {};
    },
    markdownTokenName: "mention",
    markdownTokenizer: {
      name: "mention",
      level: "inline",
      // marked already stops text at every `[`, so this only needs to find a nearby one: a
      // bounded look, never a scan of the rest of the paragraph per text run.
      start: (src: string) => {
        const at = src.slice(0, 256).indexOf("[@");
        return at;
      },
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
    ...(view ? { addNodeView: view } : {}),
  });
}

/** Callout — GitHub's alert syntax (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) around its blocks. */
function calloutNode(view: (() => NodeViewRenderer) | undefined) {
  return Node.create({
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
        mergeAttributes(
          { "data-slot": "callout", role: "note" },
          HTMLAttributes,
        ),
        ["div", { "data-slot": "callout-content" }, 0],
      ];
    },
    markdownTokenName: "callout",
    markdownTokenizer: {
      name: "callout",
      level: "block",
      start: lineStart(/> \[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i),
      tokenize: (src, _tokens, lexer) => {
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
      const lines = [
        `> [!${String(node.attrs?.tone ?? "note").toUpperCase()}]`,
      ];
      (node.content ?? []).forEach((child: JSONContent, index: number) => {
        if (index > 0) lines.push(">");
        const text =
          helpers.renderChild?.(child, index) ??
          helpers.renderChildren([child]);
        for (const line of text.split("\n"))
          lines.push(line.trim() === "" ? ">" : `> ${line}`);
      });
      return lines.join("\n");
    },
    ...(view ? { addNodeView: view } : {}),
  });
}

/** Each toggle opening's close in one source: `bodyEnd` (the close line's start) and `end`. */
type ToggleCloses = Map<number, { bodyEnd: number; end: number }>;

/**
 * Pair every toggle opening in `source` with its closing line in ONE pass — nesting counted, and
 * `<details>` or `</details>` inside fenced code ignored (it is code). A tokenizer asks for the
 * close of the toggle its `src` starts with, and `src` is a suffix of the source being lexed: the
 * pairs of the last few sources are kept, so a document with many toggles (or many unclosed ones)
 * is scanned once, not once per toggle.
 */
function toggleCloses(source: string): ToggleCloses {
  const closes: ToggleCloses = new Map();
  const open: number[] = [];
  // An open code fence: its character and length, and — for one opened on a list item's line —
  // the item's content column (a line indented less ends the item, and the fence with it).
  let fence: { char: string; length: number; column: number } | null = null;
  for (let start = 0; start <= source.length;) {
    const newline = source.indexOf("\n", start);
    const end = newline === -1 ? source.length : newline;
    const line = source.slice(start, end);
    const next = newline === -1 ? source.length + 1 : newline + 1;
    const indent = /^ */.exec(line)![0].length;
    if (
      fence &&
      fence.column > 0 &&
      line.trim() !== "" &&
      indent < fence.column
    )
      fence = null;
    if (fence) {
      // A closing fence: the same character, at least as long, nothing else on the line.
      const close = /^ *(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (
        close &&
        close[1]![0] === fence.char &&
        close[1]!.length >= fence.length &&
        indent - fence.column <= 3
      )
        fence = null;
      start = next;
      continue;
    }
    const opener = FENCE_OPEN.exec(line);
    // A backtick fence's info string holds no backtick (CommonMark): "```a`b" is text.
    if (opener && (opener[3]![0] !== "`" || !opener[4]!.includes("`"))) {
      fence = {
        char: opener[3]![0]!,
        length: opener[3]!.length,
        column: opener[2] ? opener[1]!.length + opener[2].length : 0,
      };
    } else if (/^<details(?: open)?>/.test(line)) open.push(start);
    else if (/^<\/details>[ \t]*$/.test(line)) {
      const from = open.pop();
      if (from !== undefined)
        closes.set(from, {
          bodyEnd: start,
          end: Math.min(next, source.length),
        });
    }
    start = next;
  }
  return closes;
}

/**
 * A code fence's opening line: up to three spaces, any list markers (`- `, `1. `) the fence sits
 * after, the fence, and its info string.
 */
const FENCE_OPEN =
  /^( {0,3})((?:(?:[-+*]|\d{1,9}[.)])[ \t]+)*)(`{3,}|~{3,})(.*)$/;

const TOGGLE_CACHE: { source: string; closes: ToggleCloses }[] = [];

/**
 * Whether `src` is the tail of `source` — sampled at its start, middle and end, so the check costs
 * the same however long the document is. Tokenizers use it to reuse a per-document pass across the
 * suffixes marked hands them. A false match could only regroup text differently (a toggle's text,
 * a link's), never drop any: what a tokenizer consumes is always sliced from `src` itself.
 */
export function isTailOf(source: string, src: string): boolean {
  const offset = source.length - src.length;
  if (offset < 0) return false;
  const sample = 64;
  const same = (at: number) =>
    source.startsWith(src.slice(at, at + sample), offset + at);
  return (
    same(0) &&
    same(Math.max(0, (src.length >> 1) - (sample >> 1))) &&
    same(Math.max(0, src.length - sample))
  );
}

/** The close of the toggle opening at the start of `src`, or null when it never closes. */
function toggleClose(src: string): { bodyEnd: number; end: number } | null {
  const entry = cached(TOGGLE_CACHE, src, () => ({
    source: src,
    closes: toggleCloses(src),
  }));
  const offset = entry.source.length - src.length;
  const close = entry.closes.get(offset);
  if (!close) return null;
  const found = { bodyEnd: close.bodyEnd - offset, end: close.end - offset };
  // What the toggle drops is its closing line: it must BE `</details>` here, in `src` itself —
  // never trust a cached offset with text.
  return /^<\/details>[ \t]*\n?$/.test(src.slice(found.bodyEnd, found.end))
    ? found
    : (toggleCloses(src).get(0) ?? null);
}

/**
 * Toggle — `<details><summary>Title</summary>` + blank line + its blocks + blank line +
 * `</details>`. `open` is the author's default (`<details open>`); `MarkdownView` renders a native
 * disclosure.
 */
function toggleNode(view: (() => NodeViewRenderer) | undefined) {
  return Node.create({
    name: "toggle",
    group: "block",
    content: "toggleSummary block+",
    defining: true,
    addAttributes() {
      return {
        open: {
          default: true,
          parseHTML: (element) =>
            element.hasAttribute("open") || element.hasAttribute("data-open"),
          renderHTML: (attrs) => (attrs.open ? { open: "" } : {}),
        },
      };
    },
    parseHTML() {
      return [{ tag: "details" }, { tag: "div[data-slot=toggle]" }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["details", HTMLAttributes, 0];
    },
    markdownTokenName: "toggle",
    markdownTokenizer: {
      name: "toggle",
      level: "block",
      start: lineStart(/<details(?: open)?>/),
      tokenize: (src, _tokens, lexer) => {
        const open =
          /^<details( open)?>[ \t]*<summary>([^\n]*?)<\/summary>[ \t]*(?:\n|$)/.exec(
            src,
          );
        if (!open) return undefined;
        const close = toggleClose(src);
        if (!close) return undefined;
        const { bodyEnd, end } = close;
        // Only the blank lines around the body go: its first line may be indented code.
        const body = src
          .slice(open[0].length, bodyEnd)
          .replace(/^\s*\n/, "")
          .replace(/\n\s*$/, "");
        return {
          type: "toggle",
          raw: src.slice(0, end),
          open: Boolean(open[1]),
          summary: lexer.inlineTokens(open[2]!),
          tokens: body ? lexer.blockTokens(body) : [],
        };
      },
    },
    parseMarkdown: (token, helpers) => {
      const body = helpers.parseChildren(token.tokens ?? []);
      return helpers.createNode("toggle", { open: Boolean(token.open) }, [
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
      // The summary is one line: a hard break in it is `<br>`.
      singleLineDepth++;
      let title: string;
      try {
        title = summary?.content?.length
          ? helpers.renderChildren(summary.content)
          : "";
      } finally {
        singleLineDepth--;
      }
      const blocks = body
        .map(
          (child, index) =>
            helpers.renderChild?.(child, index + 1) ??
            helpers.renderChildren([child]),
        )
        .join("\n\n");
      const tag = node.attrs?.open ? "<details open>" : "<details>";
      return `${tag}<summary>${title}</summary>\n\n${blocks}\n\n</details>`;
    },
    ...(view ? { addNodeView: view } : {}),
  });
}

/** A toggle's title line. */
const ToggleSummary = Node.create({
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

/**
 * Video and audio blocks — `<video src="…"></video>` / `<audio src="…"></audio>` on a line of their
 * own, the HTML GitHub renders too. `MarkdownView` renders the same native player.
 */
function mediaNode(
  name: "video" | "audio",
  view: (() => NodeViewRenderer) | undefined,
) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return {
        src: {
          default: null,
          parseHTML: (element) => element.getAttribute("src"),
        },
      };
    },
    parseHTML() {
      return [{ tag: `${name}[src]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        name,
        mergeAttributes({ controls: "", preload: "metadata" }, HTMLAttributes),
      ];
    },
    markdownTokenName: name,
    markdownTokenizer: {
      name,
      level: "block",
      start: lineStart(new RegExp(`<${name}\\b`)),
      tokenize: (src: string) => {
        const line = /^[^\n]*(?:\n|$)/.exec(src)![0];
        const match = MEDIA_BLOCK.exec(line.replace(/\n$/, ""));
        if (!match || match[1] !== name) return undefined;
        return { type: name, raw: line, src: match[2] };
      },
    },
    parseMarkdown: (token, helpers) =>
      helpers.createNode(name, { src: token.src ?? null }),
    renderMarkdown: (node) =>
      mediaMarkdown(name, String(node.attrs?.src ?? "")),
    ...(view ? { addNodeView: view } : {}),
  });
}

/**
 * A URL written alone on its line reads back as a link to itself (a GFM autolink): plain, or — when
 * its last character would be read as trailing punctuation, or it holds one GFM would not keep —
 * between `<` and `>`. Either way the parse gets the same `href`, and the same text.
 */
function autolinkMarkdown(url: string): string {
  return /^https:\/\/[^\s<>()[\]{}|\\^`"'*~;]*[A-Za-z0-9/=-]$/.test(url)
    ? url
    : `<${url}>`;
}

/**
 * Where a lone video URL is a block of its own — an embed: the document, a quote, a callout, a
 * toggle. In a list item or a table cell it stays a link (a line of an item, a cell's text).
 */
export const EMBED_CONTAINERS: ReadonlySet<string> = new Set([
  "doc",
  "blockquote",
  "callout",
  "toggle",
]);

/**
 * The embed a lone link is, when it is one: a paragraph holding only a link whose text is its own
 * URL (a bare URL, `<url>` or `[url](url)`, with no title) to an allowlisted video host
 * (`embed-providers`). Any other lone URL stays a link.
 */
export function embedOfParagraph(
  paragraph: JSONContent,
): { type: "embed"; attrs: { provider: EmbedProviderId; url: string } } | null {
  const [only, ...rest] = paragraph.content ?? [];
  if (paragraph.type !== "paragraph" || !only || rest.length) return null;
  if (only.type !== "text" || only.marks?.length !== 1) return null;
  const link = only.marks[0]!;
  const href = link.attrs?.href;
  if (link.type !== "link" || link.attrs?.title || href !== only.text)
    return null;
  const match = matchEmbed(String(href));
  return match
    ? { type: "embed", attrs: { provider: match.provider, url: String(href) } }
    : null;
}

/**
 * A YouTube or Loom video — an atom block `{ provider, url }`, `url` as written (the player's
 * address is always rebuilt from the id `embed-providers` reads out of it, never taken from `url`).
 * Its Markdown is the URL alone on its line, which any other reader shows as a link; the parse
 * makes such a line an embed again (`text-edit-markdown`). In HTML it is a link inside a
 * `div[data-type=embed]`, so a reader without the facade still has the address.
 */
function embedNode(view: (() => NodeViewRenderer) | undefined) {
  return Node.create({
    name: "embed",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return {
        provider: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-provider"),
          renderHTML: (attrs) =>
            attrs.provider ? { "data-provider": attrs.provider } : {},
        },
        url: {
          default: null,
          parseHTML: (element) =>
            element.getAttribute("data-url") ??
            element.querySelector("a")?.getAttribute("href") ??
            null,
          renderHTML: (attrs) => (attrs.url ? { "data-url": attrs.url } : {}),
        },
      };
    },
    parseHTML() {
      return [
        {
          tag: "div[data-type=embed]",
          // Only an allowlisted URL is an embed; anything else is read as its contents (a link).
          getAttrs: (element) => {
            const url =
              element.getAttribute("data-url") ??
              element.querySelector("a")?.getAttribute("href") ??
              "";
            const match = matchEmbed(url);
            return match ? { provider: match.provider, url } : false;
          },
        },
      ];
    },
    renderHTML({ node, HTMLAttributes }) {
      const url = String(node.attrs.url ?? "");
      return [
        "div",
        mergeAttributes({ "data-type": "embed" }, HTMLAttributes),
        ["a", { href: url, ...LINK_ATTRIBUTES }, url],
      ];
    },
    renderText: ({ node }) => String(node.attrs.url ?? ""),
    renderMarkdown: (node) => autolinkMarkdown(String(node.attrs?.url ?? "")),
    ...(view ? { addNodeView: view } : {}),
  });
}

/** A `taskQuery` node's `query` attribute: an object of strings (anything else reads as none). */
function queryAttr(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, each] of Object.entries(value))
    if (each !== null && each !== undefined) out[key] = String(each);
  return out;
}

/**
 * A live task list — an atom block `{ blockId, query, snapshot }`: `query` is its filter (the
 * directive's attributes other than `id`, unknown keys kept), `snapshot` the rows last stored
 * (`- [ ] [@Title](mention://task/<id>) — <status>` lines). Markdown: `:::tasks{id="…" …}`, the
 * rows, `:::` (`readTasksDirective`) — the one block whose `blockId` is written. The host draws it
 * live (`TextEdit`'s `renderTaskQuery`); without one, and in `MarkdownView`, the snapshot shows as
 * a quiet read-only list.
 */
function taskQueryNode(view: (() => NodeViewRenderer) | undefined) {
  return Node.create({
    name: "taskQuery",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return {
        query: {
          default: {},
          parseHTML: (element) => {
            try {
              return queryAttr(
                JSON.parse(element.getAttribute("data-query") ?? "{}"),
              );
            } catch {
              return {};
            }
          },
          renderHTML: (attrs) => ({
            "data-query": JSON.stringify(queryAttr(attrs.query)),
          }),
        },
        snapshot: {
          default: "",
          parseHTML: (element) => element.getAttribute("data-snapshot") ?? "",
          renderHTML: (attrs) => ({
            "data-snapshot": String(attrs.snapshot ?? ""),
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: "div[data-type=task-query]" }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes({ "data-type": "task-query" }, HTMLAttributes),
      ];
    },
    renderText: ({ node }) => String(node.attrs.snapshot ?? ""),
    markdownTokenName: "taskQuery",
    markdownTokenizer: {
      name: "taskQuery",
      level: "block",
      start: lineStart(/:::tasks\{/),
      tokenize: (src: string) => {
        const block = readTasksDirective(src);
        if (!block) return undefined;
        return {
          type: "taskQuery",
          raw: block.raw,
          blockId: block.id,
          query: block.query,
          snapshot: block.snapshot,
        };
      },
    },
    parseMarkdown: (token, helpers) =>
      helpers.createNode("taskQuery", {
        ...(token.blockId ? { blockId: token.blockId } : {}),
        query: token.query ?? {},
        snapshot: token.snapshot ?? "",
      }),
    renderMarkdown: (node) =>
      tasksDirectiveMarkdown({
        id: node.attrs?.blockId,
        query: queryAttr(node.attrs?.query),
        snapshot: node.attrs?.snapshot,
      }),
    ...(view ? { addNodeView: view } : {}),
  });
}

/**
 * A link whose href starts with the file prefix is a file (`[report.pdf](/api/files/…)`): it
 * renders with `data-slot="file-chip"`. The Markdown is an ordinary link.
 */
function fileChipAttribute(prefix: () => string) {
  return Extension.create({
    name: "textEditFileChip",
    addGlobalAttributes() {
      return [
        {
          types: ["link"],
          attributes: {
            fileChip: {
              default: null,
              parseHTML: () => null,
              renderHTML: (attrs) => {
                const start = prefix();
                return start !== "" &&
                  typeof attrs.href === "string" &&
                  attrs.href.startsWith(start)
                  ? { "data-slot": "file-chip" }
                  : {};
              },
            },
          },
        },
      ];
    },
  });
}

/**
 * Every extension of `TextEdit`'s document, configured exactly as the editor uses it, then the
 * caller's `plugins`. The schema is the same whatever the options: node views, highlighting and
 * plugins change how a document renders and behaves, never what it holds.
 *
 * @example
 * // A server: the schema and Markdown rules only.
 * const schema = getSchema(textEditExtensions());
 */
export function textEditExtensions(
  options: TextEditSchemaOptions = {},
): AnyExtension[] {
  const view = options.nodeViews ?? {};
  const taskItem = view.taskItem
    ? TaskItem.extend({ addNodeView: view.taskItem })
    : TaskItem;
  return [
    StarterKit.configure({
      code: false,
      codeBlock: false,
      paragraph: false,
      underline: false,
      hardBreak: false,
      link: false,
      listItem: false,
      orderedList: false,
      // A trailing empty paragraph would add a line edit mode has and view mode does not.
      trailingNode: false,
      ...(options.collaboration ? { undoRedo: false } : {}),
      // Dragging an image (or any block) shows the block handle's drop line: 2px, info blue.
      dropcursor: { color: false, width: 2, class: "rounded-full bg-info" },
    }),
    HardBreakMd,
    CodeMd,
    LinkMd.configure({
      openOnClick: false,
      autolink: true,
      // Pasting a URL over a selection links the selection.
      linkOnPaste: true,
      defaultProtocol: "https",
      HTMLAttributes: LINK_ATTRIBUTES,
    }),
    ListItemMd,
    OrderedListMd,
    CheckboxText,
    BlockText,
    ParagraphMd,
    codeBlockNode(options.lowlight, view.codeBlock, options.diff),
    TaskListMd,
    taskItem.configure({ nested: true }),
    // Columns resize by dragging their border: `colwidth` is kept in the document, not in Markdown.
    TableMd.configure({
      resizable: true,
      renderWrapper: true,
      cellMinWidth: 100,
    }),
    TableKit.configure({ table: false }),
    imageNode(view.image),
    mentionNode(view.mention),
    calloutNode(view.callout),
    toggleNode(view.toggle),
    ToggleSummary,
    mediaNode("video", view.video),
    mediaNode("audio", view.audio),
    embedNode(view.embed),
    taskQueryNode(view.taskQuery),
    fileChipAttribute(options.fileLinkPrefix ?? (() => "")),
    // Stable block ids: the attribute is always in the schema; only a collaborative editor assigns
    // ids as blocks appear (a server assigns them when it converts Markdown: `markdownToDoc`).
    BlockIds.configure({
      attributeName: "blockId",
      types: [...BLOCK_ID_TYPES],
      generateID: blockId,
      updateDocument: Boolean(options.collaboration),
      ...(options.collaboration
        ? {
            filterTransaction: (transaction: Transaction) =>
              !options.collaboration!.isRemote(transaction),
          }
        : {}),
    }),
    options.diff ? TextEditDiff : NoChanges,
    ...(options.plugins ?? []),
  ];
}

/**
 * Stable block ids (`blockId`): a block created here gets one as it is made. A document's initial
 * ids are never assigned by a client — `markdownToDoc` and the collaboration server own them —
 * so a reader (read-only) never edits a shared document, and two viewers never race to give one
 * block different ids. Upstream assigns the whole document's missing ids on create or on the
 * first sync; both are switched off, and only this person's own edits are given ids.
 */
const BlockIds = UniqueID.extend({
  onCreate() {},
  addProseMirrorPlugins() {
    const upstream = UniqueID.config.addProseMirrorPlugins as
      | ((
          this: unknown,
        ) => ReturnType<
          NonNullable<typeof UniqueID.config.addProseMirrorPlugins>
        >)
      | undefined;
    const plugins = upstream?.call(this) ?? [];
    (
      this.storage as { needsInitialIdGeneration?: boolean }
    ).needsInitialIdGeneration = false;
    return plugins;
  },
});

let cachedSchema: Schema | undefined;

/**
 * The ProseMirror schema of a `TextEdit` document, built once from `textEditExtensions()`.
 *
 * @example
 * const doc = textEditSchema().nodeFromJSON(json);
 */
export function textEditSchema(): Schema {
  cachedSchema ??= getSchema(textEditExtensions());
  return cachedSchema;
}

/** What a version diff marks: text and blocks the newer version `added` or `removed`. */
export type TextEditChange = "added" | "removed";

/**
 * The change a `ychange` value records — y-prosemirror's `{ type, user }` object (what a Yjs
 * snapshot diff writes) or the bare word; null for unchanged.
 */
export function ychangeType(value: unknown): TextEditChange | null {
  const type =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? (value as { type?: unknown }).type
        : null;
  return type === "added" || type === "removed" ? type : null;
}

/**
 * A version diff's markings, never part of a live document: a `ychange` mark on changed text
 * (`<ins>`/`<del>`, `data-ychange`) and a `ychange` attribute on every other node (a whole block
 * or atom added or removed: `data-ychange` on its element). The shape is y-prosemirror's — the
 * one a Yjs snapshot diff (two version states in a `gc: false` history doc) produces — so a
 * server walker's ProseMirror JSON renders as is. Not in `textEditSchema()`: a diff's schema is
 * `textEditDiffSchema()` — `textEditExtensions({ diff: true })`.
 *
 * @example
 * const doc = textEditDiffSchema().nodeFromJSON(diffJson);
 */
export const TextEditDiff = Extension.create({
  name: "textEditDiff",
  addExtensions() {
    return [
      Mark.create({
        name: "ychange",
        // Changed text keeps its other marks (bold, a link): the change is one more layer.
        excludes: "",
        inclusive: false,
        addAttributes() {
          return {
            user: { default: null, rendered: false },
            type: { default: null, rendered: false },
            color: { default: null, rendered: false },
          };
        },
        parseHTML() {
          return [
            { tag: "ins[data-ychange]", attrs: { type: "added" } },
            { tag: "del[data-ychange]", attrs: { type: "removed" } },
          ];
        },
        renderHTML({ mark }) {
          const type = ychangeType(mark.attrs.type);
          return [
            type === "removed" ? "del" : "ins",
            { "data-ychange": type ?? "added" },
            0,
          ];
        },
        // A diff is read, never saved: its Markdown is the newer text's, changes unmarked.
        renderMarkdown: (node, h) => h.renderChildren(node),
      }),
    ];
  },
  addGlobalAttributes() {
    const types = this.extensions
      .filter(
        (extension) =>
          extension.type === "node" &&
          extension.name !== "text" &&
          extension.name !== "doc",
      )
      .map((extension) => extension.name);
    return [
      {
        types,
        attributes: {
          ychange: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element: HTMLElement) =>
              ychangeType(element.getAttribute("data-ychange")),
            renderHTML: (attributes: Record<string, unknown>) => {
              const type = ychangeType(attributes.ychange);
              return type ? { "data-ychange": type } : {};
            },
          },
        },
      },
    ];
  },
});

/**
 * A live document's guard against a version diff: every node knows `ychange` only to refuse it
 * (`nodeFromJSON`, `check()` throw), so a diff's JSON — removed passages included — can never be
 * read as a document. Unknown attributes are otherwise dropped silently, keeping the removed text.
 */
const NoChanges = Extension.create({
  name: "textEditNoChanges",
  addGlobalAttributes() {
    const types = this.extensions
      .filter(
        (extension) =>
          extension.type === "node" &&
          extension.name !== "text" &&
          extension.name !== "doc",
      )
      .map((extension) => extension.name);
    return [
      {
        types,
        attributes: {
          ychange: {
            default: null,
            rendered: false,
            keepOnSplit: false,
            parseHTML: () => null,
            validate: (value: unknown) => {
              if (value !== null && value !== undefined)
                throw new RangeError(
                  "A version diff's change marking (ychange) is never part of a document: read a diff with textEditDiffSchema()",
                );
            },
          },
        },
      },
    ];
  },
});

let cachedDiffSchema: Schema | undefined;

/**
 * The schema of a version diff: `textEditSchema()` plus `TextEditDiff`'s `ychange` mark and
 * attribute. A server walker checks its ProseMirror JSON against it before sending it.
 *
 * @example
 * textEditDiffSchema().nodeFromJSON(json).check();
 */
export function textEditDiffSchema(): Schema {
  cachedDiffSchema ??= getSchema(textEditExtensions({ diff: true }));
  return cachedDiffSchema;
}
