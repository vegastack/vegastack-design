// @vegastack text-edit-markdown@0.25.105 sha256-fli/vYvUd7i2pbTArdqTZMPhNdhMASxE5xxqWa6DXYE=

import { Mark, type AnyExtension, type JSONContent } from "@tiptap/core";
import { Markdown, MarkdownManager } from "@tiptap/markdown";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  Lexer,
  Marked,
  Tokenizer,
  type TokenizerObject,
  type marked,
} from "marked";
import { anchorText } from "@/lib/text-anchor-doc";
import {
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_COLORS,
  boundedTokenizers,
  highlightMarkdown,
  highlightTokenizer,
  isHighlightColor,
  trackedLexing,
  type LiveBlockKind,
  type MentionKind,
} from "@/lib/text-edit-grammar";
import {
  BLOCK_ID_TYPES,
  EMBED_CONTAINERS,
  TASK_MARKER,
  blockId,
  embedOfParagraph,
  bookmarkOfParagraph,
  textEditExtensions,
  resetParseCaches,
  textEditSchema,
  trimInline,
} from "@/lib/text-edit-schema";

/**
 * text-edit-markdown — VegaStack Markdown v1 in and out of a `TextEdit` document, the same in a
 * browser and on a server. `markdownToDoc` and `docToMarkdown` are what a collaboration server, an
 * import or an API uses; `VegaStackMarkdown` is the editor's Markdown extension, so paste and
 * "Copy as Markdown" write byte for byte what the server writes.
 *
 * What it changes against Tiptap's own Markdown manager (each pinned by the round-trip corpus):
 * - **its own `marked`** — never the global singleton, which every editor instance would otherwise
 *   grow by another copy of every tokenizer (tiptap#8316);
 * - **raw HTML is text** in every environment — Tiptap parses it with the DOM when a `window` exists
 *   and keeps it literal when not, so a server and a browser read the same page differently. `<br>`
 *   is the one tag read (a line break); toggles and media have their own syntax;
 * - **minimal escaping** — text is escaped only where Markdown would read it as syntax:
 *   `snake_case`, `R&D` and `a * b` stay as typed (tiptap#8471);
 * - **canonical output** — no `&nbsp;` lines, one blank line between blocks, deterministic.
 */

/** A `<br>` tag in any spelling: a line break. */
const BREAK_TAG = /^<br\s*\/?>$/i;

/**
 * The marked instance a manager parses with: GFM, and HTML read as text (a `<br>` as a break).
 * Overrides marked's own HTML rules, so the inline HTML of a sentence never reaches Tiptap's
 * DOM-based HTML parser.
 */
function createMarked(): typeof marked {
  const instance = new Marked({ gfm: true });
  const tokenizer: TokenizerObject = {
    // Emphasis, strikethrough and links read in bounded time; an empty task item is a task — the
    // rules `MarkdownView` reads with too.
    ...boundedTokenizers(Tokenizer.prototype),
    tag(src) {
      const tag = Tokenizer.prototype.tag.call(this, src);
      if (!tag) return undefined;
      if (BREAK_TAG.test(tag.raw)) return { type: "br", raw: tag.raw } as never;
      return { type: "text", raw: tag.raw, text: tag.raw } as never;
    },
    html(src) {
      // A line holding only a `<br>` breaks nothing — it is space, not the start of an HTML block
      // that would swallow the Markdown under it as text (`<br>` then `# h` stays a heading).
      const lone = /^ {0,3}<br\s*\/?>[ \t]*(?:\n|$)/i.exec(src);
      if (lone) return { type: "space", raw: lone[0] } as never;
      const block = Tokenizer.prototype.html.call(this, src);
      if (!block) return undefined;
      const text = block.raw.replace(/\s+$/, "");
      return {
        type: "paragraph",
        raw: block.raw,
        text,
        tokens: this.lexer.inline(text),
      } as never;
    },
  };
  // Every lexer the instance makes — Tiptap's manager news `instance.Lexer` and calls
  // `instance.lexer` — is tracked, so the bounded tokenizers index each source once.
  const lexing = trackedLexing(Lexer);
  instance.Lexer = lexing.Lexer;
  instance.lexer = ((src: string, options?: typeof instance.defaults) =>
    lexing.lex(
      src,
      (options ?? instance.defaults) as never,
    )) as typeof instance.lexer;
  instance.use({ tokenizer, extensions: [highlightTokenizer as never] });
  // `MarkdownManager` types its option as the global `marked` namespace; an instance has the same
  // `Lexer`, `defaults` and `use` it calls.
  return instance as unknown as typeof marked;
}

/** Characters CommonMark lets a backslash escape. */
const PUNCTUATION = /[!-/:-@[-`{-~]/;
const ALNUM = /[\p{L}\p{N}]/u;
const SPACE = /\s/;

/**
 * Text escaped only where Markdown would read it as syntax. `before`/`after` are the characters
 * either side of the text node (unknown at a node edge: treated as not a space and not a letter).
 */
function escapeText(
  text: string,
  edges: { start: boolean; end: boolean; marked: boolean } = {
    start: false,
    end: false,
    marked: false,
  },
): string {
  // A marked text's edge spaces are written outside its marks, against their delimiters.
  const lead = edges.marked ? text.length - text.trimStart().length : 0;
  const trail = edges.marked ? text.trimEnd().length : text.length;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const prev = i > 0 ? text[i - 1]! : "";
    const next = i + 1 < text.length ? text[i + 1]! : "";
    switch (ch) {
      case "\\":
        // A backslash escapes only punctuation; `C:\Users` stays as typed.
        out += next === "" || PUNCTUATION.test(next) ? "\\\\" : ch;
        break;
      case "`":
      case "[":
        out += `\\${ch}`;
        break;
      case "*":
        // Between spaces it can neither open nor close emphasis: `2 * 3`.
        out += SPACE.test(prev) && SPACE.test(next) ? ch : "\\*";
        break;
      case "_":
        // Inside a word it cannot open or close emphasis: `snake_case`.
        out += ALNUM.test(prev) && ALNUM.test(next) ? ch : "\\_";
        break;
      case "~":
        out += SPACE.test(next) ? ch : "\\~";
        break;
      case "=": {
        // A run of two or more opens or closes a highlight unless spaces surround it (`a == b`):
        // every `=` of such a run is escaped. A node's edges count as not a space.
        let end = i;
        while (text[end] === "=") end++;
        const run = end - i;
        // A block's own start or end is a space; another node's edge, or a mark's, is not.
        const before =
          i > lead
            ? text[i - 1]!
            : i === 0 && edges.start && !edges.marked
              ? " "
              : "";
        const after =
          end < trail
            ? text[end]!
            : end === text.length && edges.end && !edges.marked
              ? " "
              : "";
        const spaced =
          before !== "" &&
          SPACE.test(before) &&
          after !== "" &&
          SPACE.test(after);
        // Three or more can close one even between spaces (`a === b`: `==` after `=`) — unless
        // the run is its whole block's text, with nothing to open one (`===`, a setext look).
        const alone =
          i === 0 && end === text.length && edges.start && edges.end;
        out +=
          run >= 2 && (!spaced || (run >= 3 && !alone))
            ? "\\=".repeat(run)
            : "=".repeat(run);
        i = end - 1;
        break;
      }
      case "&":
        // Only where it would read as an entity: `R&D` stays, `&amp;` is written `&amp;amp;`.
        out +=
          /^&(?:#\d{1,7}|#[xX][\da-fA-F]{1,6}|[a-zA-Z][a-zA-Z\d]{1,31});/.test(
            text.slice(i),
          )
            ? "&amp;"
            : ch;
        break;
      case "<":
        // The tags VegaStack Markdown reads, and autolinks.
        out +=
          /^<(?:\/?(?:br|details|summary|video|audio)\b|[a-zA-Z][a-zA-Z\d+.-]{1,31}:|[^\s<>@]+@[^\s<>@]+>)/i.test(
            text.slice(i),
          )
            ? "\\<"
            : ch;
        break;
      default:
        out += ch;
    }
  }
  return out;
}

/** The two `MarkdownManager` internals VegaStack Markdown replaces (private upstream). */
interface ManagerInternals {
  encodeTextForMarkdown(
    text: string,
    node: JSONContent,
    parent?: JSONContent,
  ): string;
  parseHTMLToken(token: {
    text?: string;
    raw?: string;
    block?: boolean;
  }): JSONContent | null;
}

/** Each child's index in its parent's content, built once per parent (not an `indexOf` per text). */
const INDEXES = new WeakMap<JSONContent[], Map<JSONContent, number>>();

function indexIn(siblings: JSONContent[], node: JSONContent): number {
  let index = INDEXES.get(siblings);
  if (!index) {
    index = new Map(siblings.map((child, at) => [child, at]));
    INDEXES.set(siblings, index);
  }
  return index.get(node) ?? -1;
}

/**
 * Stands in for a code span's edge spaces while the span is written: Tiptap's writer moves a mark's
 * edge whitespace outside it (right for `**bold **`, wrong for code, whose spaces are content).
 * Written back as spaces once the document is serialized; a plain space when no stand-in is free.
 */
let CODE_SPACE = " ";

/** The private-use characters a stand-in is made of. */
const PRIVATE_USE_FROM = 0xe000;
const PRIVATE_USE_COUNT = 0x1900;

/**
 * The code-space stand-in for one write: a private-use character the document never holds, else a
 * pair of two different ones it never holds side by side (a pair can never straddle the document's
 * text and a stand-in: no prefix of it is also its suffix). Read in one pass over the document's
 * text — every text node's run back to back, as a writer may join them — and its attributes.
 */
function codeSpaceFor(doc: JSONContent): string {
  const parts: string[] = [];
  const attrs: string[] = [];
  const walk = (node: JSONContent) => {
    if (node.text) parts.push(node.text);
    if (node.attrs) attrs.push(JSON.stringify(node.attrs));
    for (const mark of node.marks ?? [])
      if (typeof mark !== "string" && mark.attrs)
        attrs.push(JSON.stringify(mark.attrs));
    node.content?.forEach(walk);
  };
  walk(doc);
  const text = `${parts.join("")}\n${attrs.join("\n")}`;
  const index = (at: number) => text.charCodeAt(at) - PRIVATE_USE_FROM;
  const inRange = (code: number) => code >= 0 && code < PRIVATE_USE_COUNT;
  const counts = new Uint32Array(PRIVATE_USE_COUNT);
  for (let at = 0; at < text.length; at++)
    if (inRange(index(at))) counts[index(at)]!++;
  let first = 0;
  for (let code = 1; code < PRIVATE_USE_COUNT; code++)
    if (counts[code]! < counts[first]!) first = code;
  const char = (code: number) => String.fromCharCode(PRIVATE_USE_FROM + code);
  if (counts[first] === 0) return char(first);
  const followers = new Uint8Array(PRIVATE_USE_COUNT);
  for (let at = 0; at + 1 < text.length; at++)
    if (index(at) === first && inRange(index(at + 1)))
      followers[index(at + 1)] = 1;
  for (let code = 0; code < PRIVATE_USE_COUNT; code++)
    if (code !== first && !followers[code]) return char(first) + char(code);
  // Only a document of tens of millions of private-use characters gets here: its code spans' edge
  // spaces are written as spaces (the writer may move them outside the span; nothing is replaced).
  return " ";
}

/**
 * A code span's text with its edge spaces held: CommonMark strips one space from each side of a
 * span that has spaces at both ends, so such a span gets one more on each side.
 */
function codeSpanText(text: string): string {
  if (!/^ | $/.test(text)) return text;
  // All spaces: CommonMark keeps such a span whole.
  if (text.trim() === "") return CODE_SPACE.repeat(text.length);
  const both = text.startsWith(" ") && text.endsWith(" ");
  const held = text.replace(/^ +| +$/g, (run) => CODE_SPACE.repeat(run.length));
  return both ? `${CODE_SPACE}${held}${CODE_SPACE}` : held;
}

/** Text in a document as VegaStack Markdown: escaped only where Markdown would read syntax. */
function encodeText(
  text: string,
  node: JSONContent,
  parent?: JSONContent,
): string {
  const marks = (node.marks ?? []).map((mark) =>
    typeof mark === "string" ? mark : mark.type,
  );
  if (parent?.type === "codeBlock") return text;
  if (marks.includes("code")) return codeSpanText(text);
  const siblings = parent?.content ?? [];
  const index = indexIn(siblings, node);
  let out = escapeText(text, {
    start: index === 0,
    end: index >= 0 && index === siblings.length - 1,
    marked: marks.length > 0,
  });
  // Inside link text a `]` would end the link.
  if (marks.includes("link")) out = out.replace(/\]/g, "\\]");
  const next = index >= 0 ? siblings[index + 1] : undefined;
  // `!` then a link opening reads as an image.
  if (
    out.endsWith("!") &&
    !marks.includes("link") &&
    next?.marks?.some(
      (mark) => (typeof mark === "string" ? mark : mark.type) === "link",
    )
  )
    out = `${out.slice(0, -1)}\\!`;
  // A highlight's edge: a `=` there would join its `==` (`==a===` closes after `a`), and a
  // colour in braces after one would read as its colour.
  const highlighted = (each?: JSONContent) =>
    each?.marks?.some((mark) =>
      (typeof mark === "string" ? mark : mark.type).startsWith("highlight"),
    ) ?? false;
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const mine = highlighted(node);
  if (
    out.startsWith("=") &&
    (mine || highlighted(prev) || prev?.text?.endsWith("="))
  )
    out = `\\${out}`;
  if (
    /(?:^|[^\\])=$/.test(out) &&
    (mine || highlighted(next) || next?.text?.startsWith("="))
  )
    out = `${out.slice(0, -1)}\\=`;
  if (highlighted(prev) && HIGHLIGHT_SUFFIX_TEXT.test(out)) out = `\\${out}`;
  // A highlight's `](` would read as a link destination its closing `==` cannot end in.
  if (mine) out = out.replace(/((?:^|[^\\])(?:\\\\)*)\](?=\()/g, "$1\\]");
  // A highlight's closing `==` never follows a backslash: a last `\` is written as its reference.
  if (mine) out = out.replace(/((?:^|[^\\])(?:\\\\)*)\\\\(\s*)$/, "$1&#92;$2");
  // A heading's trailing `#`s are its closing sequence.
  if (
    parent?.type === "heading" &&
    index === siblings.length - 1 &&
    /(?:^|[ \t])#+[ \t]*$/.test(out)
  )
    out = out.replace(/#([ \t]*)$/, "\\#$1");
  return out;
}

/** Text that would read as a highlight's colour right after its closing `==`. */
const HIGHLIGHT_SUFFIX_TEXT = new RegExp(
  `^\\{(?:${HIGHLIGHT_COLORS.join("|")})\\}`,
);

/** A coloured highlight's writer mark: `highlight:<colour>` (`withHighlightColors`). */
const highlightWriter = (color: string) => `highlight:${color}`;

/**
 * Writers for the coloured highlights, one mark type per colour. Tiptap's writer tells marks apart
 * by type alone: two highlights of different colours side by side would be written as one, in
 * the first one's colour. Each colour written as its own type closes one and opens the next.
 */
const HIGHLIGHT_WRITERS = HIGHLIGHT_COLORS.filter(
  (color) => color !== DEFAULT_HIGHLIGHT_COLOR,
).map((color) =>
  Mark.create({
    name: highlightWriter(color),
    // Outermost, as the highlight mark itself (`text-edit-schema`).
    priority: 1001,
    renderMarkdown: (node, h) =>
      highlightMarkdown(h.renderChildren(node), color),
  }),
);

/** A text node's highlight mark, if it has one. */
const highlightOf = (node: JSONContent) =>
  node.type === "text"
    ? node.marks?.find(
        (mark) => typeof mark !== "string" && mark.type === "highlight",
      )
    : undefined;

/** The same highlight: one run of the writer's (`==…==` once). */
const sameHighlight = (
  a: ReturnType<typeof highlightOf>,
  b: ReturnType<typeof highlightOf>,
) =>
  Boolean(a && b) &&
  (a!.attrs?.color ?? DEFAULT_HIGHLIGHT_COLOR) ===
    (b!.attrs?.color ?? DEFAULT_HIGHLIGHT_COLOR);

/** Whether a text node is inline code. */
const isCode = (node: JSONContent) =>
  node.type === "text" &&
  (node.marks?.some(
    (mark) => (typeof mark === "string" ? mark : mark.type) === "code",
  ) ??
    false);

/** `node` without its highlight (other marks kept). */
function unhighlighted(node: JSONContent, text = node.text): JSONContent {
  const { marks: all, ...rest } = node;
  const marks = (all ?? []).filter((mark) => mark !== highlightOf(node));
  return marks.length ? { ...rest, text, marks } : { ...rest, text };
}

/** `node` with `mark` as its highlight. */
function rehighlighted(
  node: JSONContent,
  mark: NonNullable<ReturnType<typeof highlightOf>>,
): JSONContent {
  const marks = (node.marks ?? []).filter((each) => each !== highlightOf(node));
  // Highlight first: the outermost mark, as the schema ranks it.
  return { ...node, marks: [mark, ...marks] };
}

/**
 * `content` as Markdown can hold its highlights:
 * - a code span is one piece of text a highlight is around or not (`==`a`==`): a run of inline
 *   code partly highlighted is highlighted whole, in its first highlight's colour;
 * - a highlight's edge spaces go outside it (`==a ==` cannot close, `== a==` cannot open),
 *   keeping their other marks — a code span's spaces are its text and stay.
 */
function highlightsWritable(content: JSONContent[]): JSONContent[] {
  const nodes = [...content];
  for (let i = 0; i < nodes.length;) {
    if (!isCode(nodes[i]!)) {
      i++;
      continue;
    }
    let end = i;
    while (end < nodes.length && isCode(nodes[end]!)) end++;
    let mark: ReturnType<typeof highlightOf>;
    for (let at = i; at < end && !mark; at++) mark = highlightOf(nodes[at]!);
    if (mark)
      for (let at = i; at < end; at++)
        if (!sameHighlight(highlightOf(nodes[at]!), mark))
          nodes[at] = rehighlighted(nodes[at]!, mark);
    i = end;
  }
  const out: JSONContent[] = [];
  for (let i = 0; i < nodes.length;) {
    const mark = highlightOf(nodes[i]!);
    if (!mark) {
      out.push(nodes[i++]!);
      continue;
    }
    let end = i + 1;
    while (end < nodes.length && sameHighlight(highlightOf(nodes[end]!), mark))
      end++;
    // The run is nodes[first, last); spaces split off its ends go before and after it.
    let first = i;
    let last = end;
    const before: JSONContent[] = [];
    const after: JSONContent[] = [];
    let head: JSONContent | null = null;
    let tail: JSONContent | null = null;
    while (first < last && !isCode(nodes[first]!)) {
      const text = nodes[first]!.text ?? "";
      const lead = text.length - text.trimStart().length;
      if (lead === 0) break;
      before.push(unhighlighted(nodes[first]!, text.slice(0, lead)));
      if (lead < text.length) {
        head = { ...nodes[first]!, text: text.slice(lead) };
        break;
      }
      first++;
    }
    while (last > first && !isCode(nodes[last - 1]!)) {
      const node = last - 1 === first && head ? head : nodes[last - 1]!;
      const text = node.text ?? "";
      const keep = text.trimEnd().length;
      if (keep === text.length) break;
      after.push(unhighlighted(node, text.slice(keep)));
      if (keep > 0) {
        tail = { ...node, text: text.slice(0, keep) };
        break;
      }
      if (last - 1 === first) head = null;
      last--;
    }
    out.push(...before);
    for (let at = first; at < last; at++)
      out.push(
        at === last - 1 && tail
          ? tail
          : at === first && head
            ? head
            : nodes[at]!,
      );
    out.push(...after.reverse());
    i = end;
  }
  // Text the passes above left side by side with the same marks is one node, as ProseMirror
  // keeps it: a code span split in two would pad each half's edge spaces on its own.
  const merged: JSONContent[] = [];
  for (const node of out) {
    const prev = merged[merged.length - 1];
    if (
      prev?.type === "text" &&
      node.type === "text" &&
      JSON.stringify(prev.marks ?? []) === JSON.stringify(node.marks ?? [])
    )
      merged[merged.length - 1] = { ...prev, text: `${prev.text}${node.text}` };
    else merged.push(node);
  }
  return merged;
}

/** `node` with each coloured highlight as its colour's writer mark (`HIGHLIGHT_WRITERS`). */
function withHighlightColors(node: JSONContent): JSONContent {
  let out = node;
  if (node.marks?.length) {
    let changed = false;
    const marks = node.marks.map((mark) => {
      if (typeof mark === "string" || mark.type !== "highlight") return mark;
      const color = mark.attrs?.color;
      if (!isHighlightColor(color) || color === DEFAULT_HIGHLIGHT_COLOR)
        return mark;
      changed = true;
      return { type: highlightWriter(color) };
    });
    if (changed) out = { ...node, marks };
  }
  return out.content
    ? {
        ...out,
        content: highlightsWritable(out.content).map(withHighlightColors),
      }
    : out;
}

/** Raw HTML as literal text in every environment; a `<br>` is a line break. Never the DOM. */
function htmlAsText(token: {
  text?: string;
  raw?: string;
  block?: boolean;
}): JSONContent | null {
  const html = String(token.text || token.raw || "").replace(/\s+$/, "");
  if (!html.trim()) return null;
  if (BREAK_TAG.test(html)) return { type: "hardBreak" };
  const text = { type: "text", text: html };
  return token.block ? { type: "paragraph", content: [text] } : text;
}

/**
 * A Markdown manager for `extensions` (default: the full `TextEdit` schema) with VegaStack
 * Markdown's rules and its own `marked` instance. Two private methods of Tiptap's manager are
 * replaced on the instance; the round-trip corpus fails the moment either stops being called.
 *
 * @example
 * const manager = createMarkdownManager();
 * manager.parse("# Title"); // JSONContent
 */
export function createMarkdownManager(
  extensions: AnyExtension[] = textEditExtensions(),
): MarkdownManager {
  const created = new MarkdownManager({
    extensions: [...extensions, ...HIGHLIGHT_WRITERS],
    marked: createMarked(),
  });
  const internals = created as unknown as ManagerInternals;
  internals.encodeTextForMarkdown = encodeText;
  internals.parseHTMLToken = htmlAsText;
  // Every parse — the editor's initial content, a paste, `setContent`, a server's `markdownToDoc`
  // — reads the same normalized source and returns a document the schema accepts.
  const parse = created.parse.bind(created);
  created.parse = (markdown: string) => {
    // Every per-document index serves only the parse that built it.
    resetParseCaches();
    return normalizeParsed(
      withoutRepeatedMarks(parse(normalizeSource(markdown))),
    );
  };
  const write = created.serialize.bind(created);
  created.serialize = (doc: JSONContent) => {
    CODE_SPACE = codeSpaceFor(doc);
    const written = write(withHighlightColors(doc));
    return CODE_SPACE === " " ? written : written.replaceAll(CODE_SPACE, " ");
  };
  return created;
}

/** Markdown as every parse reads it: no BOM, `\n` line endings, no NUL (Postgres rejects it). */
function normalizeSource(markdown: string): string {
  return markdown
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "");
}

/** Textblocks an image can land in when Markdown has it inline (`- ![x](/x)`, `# A ![x](/x)`). */
const TEXTBLOCKS = new Set(["paragraph", "heading", "toggleSummary"]);
/** Nodes whose children are blocks. */
const BLOCK_CONTAINERS = new Set([
  "doc",
  "blockquote",
  "callout",
  "toggle",
  "listItem",
  "taskItem",
  "tableCell",
  "tableHeader",
]);
/** Containers whose first child must be a paragraph (`paragraph block*`). */
const ITEMS = new Set(["listItem", "taskItem"]);

/**
 * An image Markdown placed inline, as a block. An image is a block and carries no marks, so a link
 * around it (`[![a](/x)](/y)`) follows it as a paragraph linking its alt text — the URL is never
 * dropped.
 */
function imageBlock(image: JSONContent): JSONContent[] {
  const link = image.marks?.find((mark) => mark.type === "link");
  const { marks: _marks, ...block } = image;
  if (!link) return [block];
  const href = String(link.attrs?.href ?? "");
  const text = String(image.attrs?.alt || href);
  return [
    block,
    { type: "paragraph", content: [{ type: "text", text, marks: [link] }] },
  ];
}

/** A textblock holding an image, split around it: text runs stay the textblock, images are blocks. */
function liftImages(block: JSONContent): JSONContent[] {
  const out: JSONContent[] = [];
  if (block.type === "toggleSummary") {
    // The summary keeps its text; its images follow it as the toggle's first blocks.
    const content = (block.content ?? []).filter((n) => n.type !== "image");
    out.push({ ...block, content: trimInline(content) });
    for (const image of block.content ?? [])
      if (image.type === "image") out.push(...imageBlock(image));
    return out;
  }
  let run: JSONContent[] = [];
  const flush = () => {
    const trimmed = trimInline(run);
    if (trimmed.length) out.push({ ...block, content: trimmed });
    run = [];
  };
  for (const child of block.content ?? []) {
    if (child.type !== "image") run.push(child);
    else {
      flush();
      out.push(...imageBlock(child));
    }
  }
  flush();
  return out;
}

/** A list item's task marker (`[x] `), taken out of the item: its checked state, or null. */
function takeMarker(
  item: JSONContent,
): { checked: boolean; item: JSONContent } | null {
  const content = item.content ?? [];
  const [first] = content;
  if (first?.type === TASK_MARKER)
    return {
      checked: Boolean(first.attrs?.checked),
      item: { ...item, content: content.slice(1) },
    };
  const inline = first?.type === "paragraph" ? first.content?.[0] : undefined;
  if (inline?.type !== TASK_MARKER) return null;
  return {
    checked: Boolean(inline.attrs?.checked),
    item: {
      ...item,
      content: [
        { ...first!, content: first!.content!.slice(1) },
        ...content.slice(1),
      ],
    },
  };
}

/** A task marker as the text it was (`[x] `), where no task list can hold it. */
function markerText(marker: JSONContent): JSONContent {
  return { type: "text", text: marker.attrs?.checked ? "[x] " : "[ ] " };
}

/**
 * A bullet list whose items carry task markers becomes task lists (runs of task items and of
 * plain items split apart, as GFM renders them); an ordered list keeps the marker as its text.
 */
function normalizeList(list: JSONContent): JSONContent {
  const items = (list.content ?? []).map((item) => {
    const taken = takeMarker(item);
    return {
      task: list.type === "bulletList" ? taken : null,
      item:
        taken && list.type !== "bulletList"
          ? textMarker(item, taken.checked)
          : (taken?.item ?? item),
    };
  });
  const normalized = (item: JSONContent, task: boolean | null): JSONContent => {
    const inner = normalizeParsed(
      task === null
        ? item
        : {
            ...item,
            type: "taskItem",
            attrs: { ...item.attrs, checked: task },
          },
    );
    return inner;
  };
  if (!items.some((each) => each.task)) {
    return {
      ...list,
      content: items.map((each) => normalized(each.item, null)),
    };
  }
  // One list per run: a task run is a task list, a plain run stays a bullet list.
  const runs: JSONContent[] = [];
  for (const each of items) {
    const type = each.task ? "taskList" : "bulletList";
    const last = runs[runs.length - 1];
    const child = normalized(each.item, each.task ? each.task.checked : null);
    if (last?.type === type) last.content!.push(child);
    else runs.push({ type, content: [child] });
  }
  return runs.length === 1 ? runs[0]! : { type: LIST_RUNS, content: runs };
}

/** An item whose marker is kept as text (an ordered list's `1. [ ] one`). */
function textMarker(item: JSONContent, checked: boolean): JSONContent {
  const content = takeMarker(item)!.item.content ?? [];
  const marker = markerText({ attrs: { checked } });
  const [first, ...rest] = content;
  return first?.type === "paragraph"
    ? {
        ...item,
        content: [
          { ...first, content: [marker, ...(first.content ?? [])] },
          ...rest,
        ],
      }
    : {
        ...item,
        content: [{ type: "paragraph", content: [marker] }, ...content],
      };
}

/** Several lists one bullet list became (task runs and plain runs), spliced into the parent. */
const LIST_RUNS = "textEditListRuns";

/**
 * A parse as the schema accepts it, whatever valid CommonMark came in: an image Markdown placed
 * inline becomes a block beside its text, and a list item that starts with a heading, a code
 * block or an image gets the empty first paragraph a list item needs (`- # Heading`).
 */
function normalizeParsed(node: JSONContent): JSONContent {
  if (!node.content) return node;
  if (node.type === "bulletList" || node.type === "orderedList")
    return normalizeList(node);
  const content: JSONContent[] = [];
  // Inline content parsed where a block belongs (a task checkbox in an ordered list's item):
  // it opens the next paragraph, or becomes one.
  let loose: JSONContent[] = [];
  const isBlockContainer = BLOCK_CONTAINERS.has(node.type ?? "");
  for (const raw of node.content) {
    if (isBlockContainer && raw.type === "text") {
      loose.push(raw);
      continue;
    }
    let child = raw;
    if (loose.length) {
      child =
        raw.type === "paragraph"
          ? { ...raw, content: [...loose, ...(raw.content ?? [])] }
          : raw;
      if (child === raw) content.push({ type: "paragraph", content: loose });
      loose = [];
    }
    if (
      child.type &&
      TEXTBLOCKS.has(child.type) &&
      child.content?.some((each) => each.type === "image")
    )
      content.push(...liftImages(child));
    else if (child.type === TASK_MARKER)
      // A checkbox outside a list item: its text.
      content.push(
        isBlockContainer
          ? { type: "paragraph", content: [markerText(child)] }
          : markerText(child),
      );
    else if (
      child.type === "paragraph" &&
      EMBED_CONTAINERS.has(node.type ?? "") &&
      embedOfParagraph(child)
    )
      content.push(embedOfParagraph(child)!);
    else if (
      child.type === "paragraph" &&
      EMBED_CONTAINERS.has(node.type ?? "") &&
      bookmarkOfParagraph(child)
    )
      content.push(bookmarkOfParagraph(child)!);
    else {
      const done = normalizeParsed(child);
      if (done.type === LIST_RUNS) content.push(...(done.content ?? []));
      else content.push(done);
    }
  }
  if (loose.length) content.push({ type: "paragraph", content: loose });
  if (node.type && ITEMS.has(node.type) && content[0]?.type !== "paragraph")
    content.unshift({ type: "paragraph" });
  return { ...node, content };
}

let sharedManager: MarkdownManager | undefined;
/**
 * The shared manager — or, for a host's live block names (`liveBlockKinds`), one per set of
 * names, made the first time it is asked for.
 */
const kindManagers = new Map<string, MarkdownManager>();
const manager = (liveBlockKinds?: readonly LiveBlockKind[]) => {
  if (!liveBlockKinds) return (sharedManager ??= createMarkdownManager());
  const key = JSON.stringify(liveBlockKinds);
  let found = kindManagers.get(key);
  if (!found) {
    found = createMarkdownManager(textEditExtensions({ liveBlockKinds }));
    kindManagers.set(key, found);
  }
  return found;
};

/**
 * `node` with no mark twice on one text: emphasis inside emphasis (`*a _b_ c*`) parses to the same
 * mark twice, which the schema refuses — the inner one adds nothing, so it goes. Run on the whole
 * parse before anything moves its nodes (images lifted out of a paragraph keep their marks).
 */
function withoutRepeatedMarks(node: JSONContent): JSONContent {
  let out = node;
  if (node.marks && node.marks.length > 1) {
    const seen = new Set<string>();
    const marks = node.marks.filter((mark) => {
      const type = typeof mark === "string" ? mark : mark.type;
      if (seen.has(type)) return false;
      seen.add(type);
      return true;
    });
    if (marks.length !== node.marks.length) out = { ...node, marks };
  }
  return out.content
    ? { ...out, content: out.content.map(withoutRepeatedMarks) }
    : out;
}

/**
 * Serialized Markdown, tidied: its ends trimmed — and an empty task item's marker keeps the space
 * after it (`- [x] `), or it reads as text. Nothing inside is rewritten: empty paragraphs are
 * dropped from the document before it is written (`withoutEmptyParagraphs`), so a code block's
 * blank lines are never mistaken for the gaps they leave.
 */
function canonical(md: string): string {
  const tidy = md.replace(/^\n+/, "").trimEnd();
  return /(?:^|\n)[ \t>]*(?:[-+*]|\d{1,9}[.)]) \[[ xX]\]$/.test(tidy)
    ? `${tidy} `
    : tidy;
}

/** Containers whose first child is their item's text line, kept even when empty. */
const LEADING_PARAGRAPH = new Set(["listItem", "taskItem"]);

/**
 * `node` without its empty paragraphs (Markdown has none) — except the one a list item needs for its
 * text line, and the last child a container would otherwise lose.
 */
function withoutEmptyParagraphs(node: JSONContent): JSONContent {
  if (!node.content) return node;
  const content = node.content
    .map(withoutEmptyParagraphs)
    .filter(
      (child, index) =>
        child.type !== "paragraph" ||
        (child.content?.length ?? 0) > 0 ||
        (index === 0 && LEADING_PARAGRAPH.has(node.type ?? "")),
    );
  return {
    ...node,
    content: content.length ? content : node.content.slice(0, 1),
  };
}

/** Serialize a document with `serializer`, then tidy it to VegaStack Markdown. */
function serialize(serializer: MarkdownManager, doc: JSONContent): string {
  return canonical(serializer.serialize(withoutEmptyParagraphs(doc)));
}

/** Give every id-carrying block without an id one. */
function assignBlockIds(node: JSONContent, next: () => string): JSONContent {
  const types: readonly string[] = BLOCK_ID_TYPES;
  const attrs =
    node.type && types.includes(node.type) && !node.attrs?.blockId
      ? { ...node.attrs, blockId: next() }
      : node.attrs;
  return {
    ...node,
    ...(attrs ? { attrs } : {}),
    ...(node.content
      ? { content: node.content.map((child) => assignBlockIds(child, next)) }
      : {}),
  };
}

/** What `markdownToDoc` takes. */
export interface MarkdownToDocOptions {
  /** Makes each new block id. Default: a random UUID (`blockId`). */
  blockId?: () => string;
  /**
   * The live block kinds to read (`:::<name>{…}` … `:::`), as the editor's `liveBlockKinds`; any
   * other name stays text.
   * @default DEFAULT_LIVE_BLOCK_KINDS — the live task list (`tasks`) alone
   */
  liveBlockKinds?: readonly LiveBlockKind[];
}

/**
 * Parse VegaStack Markdown into a checked `TextEdit` document — the same document in a browser and
 * on a server. A BOM, CR line endings and NUL characters are dropped; an empty source is one empty
 * paragraph; headings and toggles get block ids. Throws when the result breaks the schema.
 *
 * @example
 * markdownToDoc("# Plan\n\n- [ ] Ship").childCount; // 2
 */
export function markdownToDoc(
  markdown: string,
  options: MarkdownToDocOptions = {},
): PMNode {
  const json = manager(options.liveBlockKinds).parse(markdown);
  const content = json.content?.length ? json.content : [{ type: "paragraph" }];
  const doc = textEditSchema().nodeFromJSON(
    assignBlockIds({ type: "doc", content }, options.blockId ?? blockId),
  );
  doc.check();
  return doc;
}

/**
 * A `TextEdit` document as VegaStack Markdown v1: deterministic and idempotent
 * (`docToMarkdown(markdownToDoc(md))` is a fixed point).
 *
 * @example
 * docToMarkdown(markdownToDoc("Some  *text*")); // "Some *text*"
 */
export function docToMarkdown(
  doc: PMNode | JSONContent,
  options: DocToMarkdownOptions = {},
): string {
  const json =
    "toJSON" in doc && typeof doc.toJSON === "function"
      ? (doc as PMNode).toJSON()
      : (doc as JSONContent);
  const { labels } = options;
  return serialize(manager(), labels ? withLabels(json, labels) : json);
}

/** What `docToMarkdown` takes. */
export interface DocToMarkdownOptions {
  /**
   * A record mention's label (a page's, a task's title), for a mention stored without one — as a
   * shared document stores them. Unanswered, the mention is written with an empty label.
   */
  labels?: (kind: MentionKind, id: string) => string | null | undefined;
}

/** `node` with each label-less mention's label filled from `labels`. */
function withLabels(
  node: JSONContent,
  labels: NonNullable<DocToMarkdownOptions["labels"]>,
): JSONContent {
  if (node.type === "mention" && !node.attrs?.label) {
    const label = labels(
      node.attrs?.kind as MentionKind,
      String(node.attrs?.id ?? ""),
    );
    return label ? { ...node, attrs: { ...node.attrs, label } } : node;
  }
  return node.content
    ? {
        ...node,
        content: node.content.map((child) => withLabels(child, labels)),
      }
    : node;
}

/**
 * Markdown as it reads once stored: `docToMarkdown(markdownToDoc(markdown))`.
 *
 * @example
 * normalizeMarkdown("* one\n* two"); // "- one\n- two"
 */
export function normalizeMarkdown(
  markdown: string,
  options: Pick<MarkdownToDocOptions, "liveBlockKinds"> = {},
): string {
  return docToMarkdown(markdownToDoc(markdown, options));
}

/**
 * A document's plain text: blocks joined by a newline, a mention as `@label`, other leaves as `￼` —
 * exactly the text comment anchors are stored against (`anchorText`).
 *
 * @example
 * docToText(markdownToDoc("# A\n\nb")); // "A\nb"
 */
export function docToText(doc: PMNode): string {
  return anchorText(doc);
}

/**
 * The editor's Markdown extension: Tiptap's, with VegaStack Markdown's manager and rules, so
 * `editor.getMarkdown()` is `docToMarkdown(editor.state.doc)` byte for byte.
 *
 * @example
 * useEditor({ extensions: textEditExtensions({ plugins: [VegaStackMarkdown] }) });
 */
export const VegaStackMarkdown = Markdown.extend({
  onBeforeCreate() {
    const { editor } = this;
    const serializer = createMarkdownManager(
      editor.extensionManager.baseExtensions,
    );
    this.storage.manager = serializer;
    editor.markdown = serializer;
    editor.getMarkdown = () => serialize(serializer, editor.getJSON());
    // Markdown initial content (`contentType: "markdown"`) parses with this manager, as Tiptap's
    // own extension does with its own.
    const { content, contentType } = editor.options;
    if (contentType !== "markdown" || typeof content !== "string") return;
    const json = serializer.parse(content);
    // Nothing parsed: leave the empty string, so ProseMirror fills the required empty block.
    if (json.content?.length) editor.options.content = json;
  },
});
