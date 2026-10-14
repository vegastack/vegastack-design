// @vegastack text-edit-markdown@0.25.41 sha256-uopIgV4sZHBfm1f2ODZ9pSVWa2c1FIlf9Solp8v+Fdg=

import type { AnyExtension, JSONContent } from "@tiptap/core";
import { Markdown, MarkdownManager } from "@tiptap/markdown";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Marked, Tokenizer, type TokenizerObject, type marked } from "marked";
import { anchorText } from "@/lib/text-anchor-doc";
import type { MentionKind } from "@/lib/text-edit-grammar";
import {
  BLOCK_ID_TYPES,
  EMBED_CONTAINERS,
  TASK_MARKER,
  blockId,
  embedOfParagraph,
  textEditExtensions,
  isTailOf,
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

/** How far an emphasis or strikethrough span may reach for its closer. */
const SPAN_WINDOW = 16_384;
/** How long a link or image (its text and destination) may be. */
const LINK_WINDOW = 65_536;

/** Per paragraph: the last place each delimiter could close (it follows a non-space). */
let closers: { masked: string; last: Record<string, number> } | null = null;

/**
 * Whether the `*`, `_` or `~` opening `src` has any delimiter run of its kind after it that could
 * close it — a closing run never follows a space. Computed once per paragraph (marked hands every call the
 * same masked paragraph), so a paragraph of unmatched delimiters costs one pass, not one per
 * delimiter. Anything else is let through to marked.
 */
function closerAhead(src: string, masked: string): boolean {
  const char = src[0];
  if (char !== "*" && char !== "_" && char !== "~") return true;
  if (closers?.masked !== masked) {
    const last: Record<string, number> = { "*": -1, _: -1, "~": -1 };
    for (let i = 1; i < masked.length; i++) {
      const each = masked[i]!;
      // A run of the delimiter can close only when the character before the RUN is not a space.
      if (!(each in last) || masked[i - 1] === each) continue;
      if (!/\s/.test(masked[i - 1]!)) last[each] = i;
    }
    closers = { masked, last };
  }
  return closers.last[char]! > masked.length - src.length;
}

/** Per paragraph: where its last `)` is, counted from its end. */
let parens: { source: string; lastFromEnd: number } | null = null;

/**
 * Whether an inline link could close in `src`: a `)` must follow. marked hands the link reader the
 * rest of the paragraph at every `[`; a paragraph of `[a](` without a `)` would be read to its end
 * each time. The last `)` is found once per paragraph. (A false "no" could only leave a link as its
 * text, never drop text; the sampled tail check makes it practically impossible.)
 */
function parenAhead(src: string): boolean {
  if (!parens || !isTailOf(parens.source, src)) {
    const last = src.lastIndexOf(")");
    parens = { source: src, lastFromEnd: last === -1 ? -1 : src.length - last };
  }
  return parens.lastFromEnd > 0 && parens.lastFromEnd <= src.length;
}

/** `src` and its masked twin (aligned at their ends, as marked keeps them) cut to the window. */
function windowed(src: string, masked: string): [string, string] {
  if (src.length <= SPAN_WINDOW) return [src, masked];
  const start = masked.length - src.length;
  return [src.slice(0, SPAN_WINDOW), masked.slice(start, start + SPAN_WINDOW)];
}

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
    // marked looks for the closer of every `*`, `_` and `~` delimiter across the rest of the
    // paragraph — quadratic on a long paragraph of unmatched ones. Emphasis and strikethrough are
    // looked for within a window (far longer than any real span); past it the delimiter is text.
    emStrong(src, maskedSrc, prevChar) {
      if (!closerAhead(src, maskedSrc)) return undefined;
      return Tokenizer.prototype.emStrong.call(
        this,
        ...windowed(src, maskedSrc),
        prevChar,
      );
    },
    del(src, maskedSrc, prevChar) {
      if (!closerAhead(src, maskedSrc)) return undefined;
      return Tokenizer.prototype.del.call(
        this,
        ...windowed(src, maskedSrc),
        prevChar,
      );
    },
    list(src) {
      const list = Tokenizer.prototype.list.call(this, src);
      if (!list) return undefined;
      // An empty task item (`- [ ]`, `- [x]` — nothing after the box) is still a task: GFM wants
      // text after the box, but an editor writes empty ones and a person types them.
      for (const item of list.items) {
        const first = item.tokens[0];
        const box = /^\[([ xX])\]$/.exec(String(first?.raw ?? "").trim());
        if (item.task || !box) continue;
        if (first?.type !== "text" && first?.type !== "paragraph") continue;
        item.task = true;
        item.checked = box[1] !== " ";
        item.tokens[0] = {
          type: "checkbox",
          raw: `[${box[1]}] `,
          checked: item.checked,
        } as never;
      }
      return list;
    },
    link(src) {
      if (src[0] === "[" || src[0] === "!") {
        if (!parenAhead(src)) return undefined;
      }
      return Tokenizer.prototype.link.call(this, src.slice(0, LINK_WINDOW));
    },
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
  instance.use({ tokenizer });
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
function escapeText(text: string): string {
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
 * Written back as spaces once the document is serialized.
 */
let CODE_SPACE = "\uE000";

/** A private-use character the document does not hold — the code-space stand-in for one write. */
function unusedPrivateUse(doc: JSONContent): string {
  const text = JSON.stringify(doc);
  for (let code = 0xe000; code <= 0xf8ff; code++) {
    const char = String.fromCharCode(code);
    if (!text.includes(char)) return char;
  }
  return "\uE000";
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
  let out = escapeText(text);
  // Inside link text a `]` would end the link.
  if (marks.includes("link")) out = out.replace(/\]/g, "\\]");
  const siblings = parent?.content ?? [];
  const index = indexIn(siblings, node);
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
  // A heading's trailing `#`s are its closing sequence.
  if (
    parent?.type === "heading" &&
    index === siblings.length - 1 &&
    /(?:^|[ \t])#+[ \t]*$/.test(out)
  )
    out = out.replace(/#([ \t]*)$/, "\\#$1");
  return out;
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
  const created = new MarkdownManager({ extensions, marked: createMarked() });
  const internals = created as unknown as ManagerInternals;
  internals.encodeTextForMarkdown = encodeText;
  internals.parseHTMLToken = htmlAsText;
  // Every parse — the editor's initial content, a paste, `setContent`, a server's `markdownToDoc`
  // — reads the same normalized source and returns a document the schema accepts.
  const parse = created.parse.bind(created);
  created.parse = (markdown: string) => {
    // Every per-document index serves only the parse that built it.
    resetParseCaches();
    closers = null;
    parens = null;
    return normalizeParsed(parse(normalizeSource(markdown)));
  };
  const write = created.serialize.bind(created);
  created.serialize = (doc: JSONContent) => {
    CODE_SPACE = unusedPrivateUse(doc);
    return write(doc).replaceAll(CODE_SPACE, " ");
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
const manager = () => (sharedManager ??= createMarkdownManager());

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
  const json = manager().parse(markdown);
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
export function normalizeMarkdown(markdown: string): string {
  return docToMarkdown(markdownToDoc(markdown));
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
