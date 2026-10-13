// @vegastack text-edit-schema@0.25.29 sha256-bAgWYdbPPiWX71L+B/kgtVcbVI3q2QhenhMNqFunIuw=

import {
  Extension,
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
import StarterKit from "@tiptap/starter-kit";
import { CodeBlock } from "@tiptap/extension-code-block";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { OrderedList, TaskItem, TaskList } from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Table, TableKit } from "@tiptap/extension-table";
import { UniqueID } from "@tiptap/extension-unique-id";
import {
  CALLOUT_BLOCK,
  MEDIA_BLOCK,
  codeFenceInfo,
  imageMarkdown,
  markdownDestination,
  mediaMarkdown,
  mentionMarkdown,
  parseCodeFenceInfo,
  parseImageAlt,
  parseMentionLink,
} from "@/lib/text-edit-grammar";

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
  | "audio";

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
  /** A collaborative editor: Tiptap's own undo history is off (the collaboration undo replaces it). */
  collaboration?: boolean;
}

/**
 * The blocks that carry a stable `blockId` (`data-block-id` in HTML; never in Markdown): heading
 * links, per-viewer toggle state, anchors and section keys all point at it.
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
  const find = new RegExp(
    `\n(?=${marker.source})`,
    marker.flags.replace("g", ""),
  );
  return (src: string) => {
    const stop = src.indexOf("\n\n");
    const match = find.exec(stop === -1 ? src : src.slice(0, stop + 1));
    return match ? match.index + 1 : -1;
  };
}

/** A tokenizer `start` limited to the paragraph `src` begins with (see `lineStart`). */
function paragraphStart(find: (src: string) => number) {
  return (src: string) => {
    const stop = src.indexOf("\n\n");
    return find(stop === -1 ? src : src.slice(0, stop + 1));
  };
}

/** How deep the serializer is inside table cells, where a line break must stay on the row. */
let cellDepth = 0;

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
          const longest = Math.max(
            0,
            ...[...line.matchAll(/`+/g)].map((match) => match[0].length),
          );
          const fence = "`".repeat(longest + 1);
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
    default:
      return children.flatMap((child) => cellLines(child, h, prefix));
  }
}

/** A table as GFM: padded columns, the alignment row, every cell on one line. */
function renderTable(node: JSONContent, h: MarkdownRendererHelpers): string {
  const rows = ((node.content ?? []) as JSONContent[]).map((row) =>
    ((row.content ?? []) as JSONContent[]).map((cell) => {
      cellDepth++;
      try {
        const lines = ((cell.content ?? []) as JSONContent[]).flatMap((block) =>
          cellLines(block, h),
        );
        const text = lines
          .join("<br>")
          .replace(/\s+/g, " ")
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
        cellDepth--;
      }
    }),
  );
  const columns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (columns === 0) return "";
  const widths = Array.from({ length: columns }, (_, index) =>
    Math.max(3, ...rows.map((row) => row[index]?.text.length ?? 0)),
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
  return ["", line(header), `| ${rule.join(" | ")} |`, ...body, ""].join("\n");
}

/**
 * A cell holds blocks, but a GFM cell is inline Markdown: an image in it parses inside the cell's
 * paragraph, where a block cannot sit. Lift each image out between the paragraph's text runs.
 */
function liftCellBlocks(cell: JSONContent): JSONContent {
  const out: JSONContent[] = [];
  for (const block of (cell.content ?? []) as JSONContent[]) {
    if (block.type !== "paragraph") {
      out.push(block);
      continue;
    }
    // A `<br>` at a cell's edge breaks to nothing: it is left by an empty line, never typed.
    if (!block.content?.some((n) => n.type === "image")) {
      const trimmed = trimRun(block.content ?? []);
      out.push(
        trimmed.length ? { ...block, content: trimmed } : { type: "paragraph" },
      );
      continue;
    }
    let run: JSONContent[] = [];
    const flush = () => {
      const trimmed = trimRun(run);
      if (trimmed.length) out.push({ type: "paragraph", content: trimmed });
      run = [];
    };
    for (const child of block.content) {
      if (child.type !== "image") {
        run.push(child);
        continue;
      }
      flush();
      out.push(child);
    }
    flush();
  }
  return { ...cell, content: out.length ? out : [{ type: "paragraph" }] };
}

/** A run of inline nodes without the whitespace and breaks a lifted block leaves at its edges. */
function trimRun(run: JSONContent[]): JSONContent[] {
  const nodes = run.map((node) => ({ ...node }));
  while (nodes[0]?.type === "hardBreak") nodes.shift();
  while (nodes[nodes.length - 1]?.type === "hardBreak") nodes.pop();
  const first = nodes[0];
  if (first?.type === "text") first.text = first.text?.trimStart();
  const last = nodes[nodes.length - 1];
  if (last?.type === "text") last.text = last.text?.trimEnd();
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
    cellDepth > 0 || ctx.parentType === "heading" ? "<br>" : "\\\n",
});

/** Links: `&amp;` in a destination is `&`, and a destination with a space is written `<…>`. */
const LinkMd = Link.extend({
  parseMarkdown: (token, helpers) =>
    helpers.applyMark("link", helpers.parseInline(token.tokens || []), {
      href: decodeHtmlEntities(String(token.href ?? "")),
      title: token.title || null,
    }),
  renderMarkdown: (node, h) => {
    const href = markdownDestination(String(node.attrs?.href ?? ""));
    const title = node.attrs?.title
      ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"`
      : "";
    return `[${h.renderChildren(node)}](${href}${title})`;
  },
});

/** Ordered lists are CommonMark's: marked's own list tokenizer reads them, never Tiptap's. */
const OrderedListMd = OrderedList.extend({
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
        (only.text === " " || only.text === "&nbsp;")
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
    if (content.length === 0)
      return ctx.previousNode?.type === "paragraph" &&
        !ctx.previousNode.content?.length
        ? "&nbsp;"
        : "";
    // A hard break that ends the paragraph has no line to break to.
    const text = h.renderChildren(content).replace(/(?:\\\n)+$/, "");
    if (cellDepth > 0) return text;
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
    const longest = Math.max(
      2,
      ...[...body.matchAll(/`+/g)].map((match) => match[0].length),
    );
    const fence = "`".repeat(longest + 1);
    return `${fence}${info}\n${body}\n${fence}`;
  },
};

function codeBlockNode(
  lowlight: object | undefined,
  view: (() => NodeViewRenderer) | undefined,
) {
  const config = {
    ...codeBlockMarkdown,
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

/** A task list: its tokenizer checks the first line before scanning the rest (linear parsing). */
const TaskListMd = TaskList.extend({
  markdownTokenizer: (() => {
    const upstream = TaskList.config.markdownTokenizer!;
    return {
      ...upstream,
      tokenize: (src, tokens, lexer) => {
        const end = src.indexOf("\n");
        const first = end === -1 ? src : src.slice(0, end);
        if (!/^\s*[-+*]\s+\[[ xX]\]\s+/.test(first)) return undefined;
        return upstream.tokenize(src, tokens, lexer);
      },
    };
  })(),
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
        content: (row.content ?? []).map(liftCellBlocks),
      })),
    };
  },
  renderMarkdown: (node, h) => renderTable(node, h),
  markdownTokenizer: (() => {
    const upstream = Table.config.markdownTokenizer!;
    const start = upstream.start as (src: string) => number;
    return { ...upstream, start: paragraphStart(start) };
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
      const { alt, width } = parseImageAlt(
        String(token.text ?? "").replace(/\\([\\[\]])/g, "$1"),
      );
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
        // The matching `</details>` line, nested toggles counted.
        let depth = 1;
        let at = open[0].length;
        let bodyEnd = -1;
        let end = -1;
        while (at < src.length) {
          const next = src.indexOf("\n", at);
          const lineEnd = next === -1 ? src.length : next;
          const line = src.slice(at, lineEnd);
          if (/^<details(?: open)?>/.test(line)) depth++;
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
      codeBlock: false,
      paragraph: false,
      underline: false,
      hardBreak: false,
      link: false,
      orderedList: false,
      // A trailing empty paragraph would add a line edit mode has and view mode does not.
      trailingNode: false,
      ...(options.collaboration ? { undoRedo: false } : {}),
      // Dragging an image (or any block) shows the block handle's drop line: 2px, info blue.
      dropcursor: { color: false, width: 2, class: "rounded-full bg-info" },
    }),
    HardBreakMd,
    LinkMd.configure({
      openOnClick: false,
      autolink: true,
      // Pasting a URL over a selection links the selection.
      linkOnPaste: true,
      defaultProtocol: "https",
      HTMLAttributes: LINK_ATTRIBUTES,
    }),
    OrderedListMd,
    ParagraphMd,
    codeBlockNode(options.lowlight, view.codeBlock),
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
    fileChipAttribute(options.fileLinkPrefix ?? (() => "")),
    // Stable block ids: the attribute is always in the schema; only a collaborative editor assigns
    // ids as blocks appear (a server assigns them when it converts Markdown: `markdownToDoc`).
    UniqueID.configure({
      attributeName: "blockId",
      types: [...BLOCK_ID_TYPES],
      generateID: blockId,
      updateDocument: Boolean(options.collaboration),
    }),
    ...(options.plugins ?? []),
  ];
}

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
