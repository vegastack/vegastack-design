// @vegastack text-edit-markdown@0.25.29 sha256-3px6wbk7dyrFEfS8FBc+2VMhEFS3OYyArBp/PWF8Tf8=

import type { AnyExtension, JSONContent } from "@tiptap/core";
import { Markdown, MarkdownManager } from "@tiptap/markdown";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Marked, Tokenizer, type TokenizerObject, type marked } from "marked";
import { anchorText } from "@/lib/text-anchor-doc";
import {
  BLOCK_ID_TYPES,
  blockId,
  textEditExtensions,
  isTailOf,
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

/** Text in a document as VegaStack Markdown: escaped only where Markdown would read syntax. */
function encodeText(
  text: string,
  node: JSONContent,
  parent?: JSONContent,
): string {
  const marks = (node.marks ?? []).map((mark) =>
    typeof mark === "string" ? mark : mark.type,
  );
  if (parent?.type === "codeBlock" || marks.includes("code")) return text;
  let out = escapeText(text);
  // Inside link text a `]` would end the link.
  if (marks.includes("link")) out = out.replace(/\]/g, "\\]");
  const siblings = parent?.content ?? [];
  const index = siblings.indexOf(node);
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
  created.parse = (markdown: string) =>
    normalizeParsed(parse(normalizeSource(markdown)));
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

/** A textblock holding an image, split around it: text runs stay the textblock, images are blocks. */
function liftImages(block: JSONContent): JSONContent[] {
  const out: JSONContent[] = [];
  if (block.type === "toggleSummary") {
    // The summary keeps its text; its images follow it as the toggle's first blocks.
    const content = (block.content ?? []).filter((n) => n.type !== "image");
    out.push({ ...block, content: trimInline(content) });
    out.push(...(block.content ?? []).filter((n) => n.type === "image"));
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
      out.push(child);
    }
  }
  flush();
  return out;
}

/**
 * A parse as the schema accepts it, whatever valid CommonMark came in: an image Markdown placed
 * inline becomes a block beside its text, and a list item that starts with a heading, a code
 * block or an image gets the empty first paragraph a list item needs (`- # Heading`).
 */
function normalizeParsed(node: JSONContent): JSONContent {
  if (!node.content) return node;
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
    else content.push(normalizeParsed(child));
  }
  if (loose.length) content.push({ type: "paragraph", content: loose });
  if (node.type && ITEMS.has(node.type) && content[0]?.type !== "paragraph")
    content.unshift({ type: "paragraph" });
  return { ...node, content };
}

let sharedManager: MarkdownManager | undefined;
const manager = () => (sharedManager ??= createMarkdownManager());

/**
 * Tidy serialized Markdown: an empty paragraph (`&nbsp;`) leaves no line, runs of blank lines
 * become one, fenced code is left exactly as written. The result parses back to itself.
 */
function canonical(md: string): string {
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

/** Serialize a document with `serializer`, then tidy it to VegaStack Markdown. */
function serialize(serializer: MarkdownManager, doc: JSONContent): string {
  return canonical(serializer.serialize(doc));
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
export function docToMarkdown(doc: PMNode | JSONContent): string {
  const json =
    "toJSON" in doc && typeof doc.toJSON === "function"
      ? (doc as PMNode).toJSON()
      : (doc as JSONContent);
  return serialize(manager(), json);
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
