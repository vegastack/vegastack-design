// @vegastack markdown-view@0.23.69 sha256-imUFKIcOlOtUgP+CMWv7K29Gq9LDLwnYwgZsqhwzuv8=

import * as React from "react";
import { Lexer, type Token, type Tokens } from "marked";
import { cn, proseClassName } from "@vegastack/design";
import { Checkbox } from "@/components/ui/checkbox";
// `CodeBlock` owns the fenced-code surface (header + copy + sunken mono panel); shadcn rewrites
// this alias on `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { CodeBlock } from "@/components/ui/code-block";

/* ------------------------------------------------------------------------------------------------
 * The document tree
 *
 * Both sources — a markdown string (tokenized by `marked`'s lexer, CommonMark + GFM) and an HTML
 * string (TextEdit's `format="html"` output) — become the same tiny element tree, and ONE renderer
 * turns that tree into React elements. Nothing is ever injected as HTML: every element is rebuilt
 * from an allowlisted tag and allowlisted attributes, raw HTML inside markdown renders as inert
 * text, and every URL passes the same protocol check.
 * ----------------------------------------------------------------------------------------------*/

interface El {
  tag: string;
  attrs: Record<string, string>;
  children: DocNode[];
}
type DocNode = string | El;

const el = (
  tag: string,
  attrs: Record<string, string> = {},
  children: DocNode[] = [],
): El => ({ tag, attrs, children });

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  middot: "·",
  bull: "•",
  times: "×",
  divide: "÷",
  deg: "°",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  sect: "§",
  para: "¶",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
};

/** Decode character references in source text (`&amp;`, `&#39;`, `&#x2014;`). */
function decode(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(
    /&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/gi,
    (match, ref: string) => {
      if (ref[0] !== "#") return NAMED_ENTITIES[ref.toLowerCase()] ?? match;
      const code =
        ref[1] === "x" || ref[1] === "X"
          ? parseInt(ref.slice(2), 16)
          : parseInt(ref.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
        ? String.fromCodePoint(code)
        : "�";
    },
  );
}

/* --- markdown → tree --------------------------------------------------------------------------*/

function inline(tokens: Token[] | undefined): DocNode[] {
  const out: DocNode[] = [];
  for (const token of tokens ?? []) {
    const t = token as Tokens.Generic;
    switch (t.type) {
      case "text":
        if (t.tokens?.length) out.push(...inline(t.tokens));
        else out.push(decode(t.text));
        break;
      case "escape":
        out.push(decode(t.text));
        break;
      case "strong":
      case "em":
      case "del":
        out.push(el(t.type, {}, inline(t.tokens)));
        break;
      case "codespan":
        out.push(el("code", {}, [t.text]));
        break;
      case "br":
        out.push(el("br"));
        break;
      case "link":
        out.push(
          el(
            "a",
            { href: decode(t.href), ...(t.title ? { title: t.title } : {}) },
            inline(t.tokens),
          ),
        );
        break;
      case "image":
        out.push(
          el("img", {
            src: decode(t.href),
            alt: decode(t.text),
            ...(t.title ? { title: t.title } : {}),
          }),
        );
        break;
      // Raw HTML is shown as the text it is, never parsed (react-markdown's behaviour without
      // `rehype-raw`).
      case "html":
        out.push(t.text);
        break;
      case "checkbox":
        break;
      default:
        if (t.tokens) out.push(...inline(t.tokens));
        else if (typeof t.text === "string") out.push(decode(t.text));
    }
  }
  return out;
}

function listItem(item: Tokens.ListItem): El {
  const body = blocks(item.tokens.filter((t) => t.type !== "checkbox"));
  if (!item.task) return el("li", {}, body);
  return el(
    "li",
    { "data-type": "taskItem", "data-checked": String(Boolean(item.checked)) },
    [el("div", { "data-slot": "task-item-content" }, body)],
  );
}

function cellAttrs(align: string | null): Record<string, string> {
  return align ? { align } : {};
}

function blocks(tokens: Token[]): DocNode[] {
  const out: DocNode[] = [];
  for (const token of tokens) {
    const t = token as Tokens.Generic;
    switch (t.type) {
      case "space":
      case "def":
        break;
      case "heading":
        out.push(el(`h${t.depth}`, {}, inline(t.tokens)));
        break;
      case "paragraph":
        out.push(el("p", {}, inline(t.tokens)));
        break;
      // A tight list item's text: inline content with no paragraph around it.
      case "text":
        out.push(...inline(t.tokens?.length ? t.tokens : [t as Token]));
        break;
      case "code":
        out.push(
          el("pre", {}, [
            el("code", t.lang ? { class: `language-${t.lang}` } : {}, [t.text]),
          ]),
        );
        break;
      case "blockquote":
        out.push(el("blockquote", {}, blocks(t.tokens ?? [])));
        break;
      case "hr":
        out.push(el("hr"));
        break;
      case "list": {
        const list = t as Tokens.List;
        const attrs: Record<string, string> = {};
        if (list.ordered && list.start !== "" && list.start !== 1)
          attrs.start = String(list.start);
        if (list.items.some((item) => item.task))
          attrs["data-type"] = "taskList";
        out.push(
          el(list.ordered ? "ol" : "ul", attrs, list.items.map(listItem)),
        );
        break;
      }
      case "table": {
        const table = t as Tokens.Table;
        const head = el("thead", {}, [
          el(
            "tr",
            {},
            table.header.map((cell) =>
              el("th", cellAttrs(cell.align), inline(cell.tokens)),
            ),
          ),
        ]);
        const rows = table.rows.map((row) =>
          el(
            "tr",
            {},
            row.map((cell) =>
              el("td", cellAttrs(cell.align), inline(cell.tokens)),
            ),
          ),
        );
        out.push(
          el("table", {}, rows.length ? [head, el("tbody", {}, rows)] : [head]),
        );
        break;
      }
      case "html":
        out.push(t.text.replace(/\n+$/, ""));
        break;
      default:
        if (t.tokens) out.push(...blocks(t.tokens));
        else if (typeof t.text === "string") out.push(decode(t.text));
    }
  }
  return out;
}

function fromMarkdown(source: string): DocNode[] {
  return blocks(Lexer.lex(source, { gfm: true }));
}

/* --- HTML → tree ------------------------------------------------------------------------------*/

/** Elements rebuilt from HTML; any other tag is unwrapped (its text and children stay). */
const HTML_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "strong",
  "em",
  "s",
  "del",
  "u",
  "a",
  "img",
  "hr",
  "br",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "div",
  "span",
  "label",
  "input",
  "sup",
  "sub",
  "mark",
]);
const HTML_ALIASES: Record<string, string> = {
  b: "strong",
  i: "em",
  strike: "s",
};
/** Elements dropped WITH their content. */
const HTML_DROPPED = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "textarea",
  "select",
  "svg",
  "math",
  "title",
  "head",
  "button",
]);
const VOID_TAGS = new Set(["br", "hr", "img", "input", "col", "wbr"]);
const HTML_ATTRS = new Set([
  "href",
  "title",
  "src",
  "alt",
  "start",
  "colspan",
  "rowspan",
  "align",
  "class",
  "type",
  "checked",
  "data-type",
  "data-checked",
]);

function htmlAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern =
    /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1]!.toLowerCase();
    if (!HTML_ATTRS.has(name)) continue;
    attrs[name] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

function fromHtml(source: string): DocNode[] {
  const root = el("root");
  const stack: El[] = [root];
  let dropped = 0;
  let cursor = 0;
  const text = (value: string) => {
    if (value && dropped === 0)
      stack[stack.length - 1]!.children.push(decode(value));
  };
  for (const match of source.matchAll(
    /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g,
  )) {
    text(source.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    if (!match[2]) continue;
    const name = match[2].toLowerCase();
    const tag = HTML_ALIASES[name] ?? name;
    const closing = match[1] === "/";
    if (HTML_DROPPED.has(tag)) {
      if (!VOID_TAGS.has(tag) && !match[3]?.trim().endsWith("/"))
        dropped = Math.max(0, dropped + (closing ? -1 : 1));
      continue;
    }
    if (dropped > 0 || !HTML_TAGS.has(tag)) continue;
    if (closing) {
      let at = stack.length - 1;
      while (at > 0 && stack[at]!.tag !== tag) at--;
      if (at > 0) stack.length = at;
      continue;
    }
    const node = el(tag, htmlAttrs(match[3] ?? ""));
    stack[stack.length - 1]!.children.push(node);
    if (!VOID_TAGS.has(tag)) stack.push(node);
  }
  text(source.slice(cursor));
  return root.children;
}

/* ------------------------------------------------------------------------------------------------
 * Rendering
 * ----------------------------------------------------------------------------------------------*/

/** The protocols a link or image may use; anything else (`javascript:`, `data:`) becomes `""`. */
const SAFE_PROTOCOL = /^(https?|ircs?|mailto|xmpp)$/i;

/** react-markdown's `defaultUrlTransform`: relative URLs and safe protocols pass, others go. */
function safeUrl(value: string): string {
  const colon = value.indexOf(":");
  const question = value.indexOf("?");
  const hash = value.indexOf("#");
  const slash = value.indexOf("/");
  if (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (question !== -1 && colon > question) ||
    (hash !== -1 && colon > hash) ||
    SAFE_PROTOCOL.test(value.slice(0, colon))
  )
    return value;
  return "";
}

function textOf(node: DocNode): string {
  return typeof node === "string" ? node : node.children.map(textOf).join("");
}

function childElements(node: El): El[] {
  return node.children.filter(
    (child): child is El => typeof child !== "string",
  );
}

function normalizeAllowedImageOrigins(origins: readonly string[]) {
  return new Set(
    origins.map((origin) => {
      if (origin === "*") return origin;
      const url = new URL(origin);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error(
          `allowedImageOrigins entries must be HTTP(S) origins without paths: ${origin}`,
        );
      }
      return url.origin;
    }),
  );
}

function imageSourceAllowed(src: string, allowed: ReadonlySet<string>) {
  if (!src) return false;
  try {
    const url = new URL(src);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      (allowed.has(url.origin) || allowed.has("*"))
    );
  } catch {
    // Relative paths stay on the embedding application's origin. Protocol-relative URLs are
    // external despite parsing as relative without a base, so keep them blocked.
    return !src.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(src);
  }
}

interface RenderContext {
  images: ReadonlySet<string>;
  headingOffset: number;
}

const TEXT_ALIGN = new Set(["left", "right", "center"]);

/**
 * The tree → React step. Every typographic rule lives in the shared `prose` recipe
 * (`@vegastack/design`), worn once by the root — the same string `TextEdit` puts on its editor
 * surface, so the two render identical computed styles (audit B4-09). What is handled here is only
 * the handful of nodes whose plain output is wrong for a reason no class can fix:
 *
 * - `a` — an external link needs `target`/`rel` and an SR-only "opens in new tab" hint.
 * - task items — the system `Checkbox` beside a body box, the shape `TextEdit`'s `TaskItem`
 *   renders, so `prose.taskList` lays both out identically.
 * - `pre` — fenced code delegates to `CodeBlock` (header + copy affordance).
 * - `table` — the horizontal scroll container the recipe deliberately does not own.
 * - `img` — the remote-origin policy and loading hints.
 *
 * None of them sets a typography class, and none should: an element-level class LOSES to the
 * root's descendant rules (specificity (0,1,0) against (0,1,1)).
 */
function render(nodes: DocNode[], ctx: RenderContext): React.ReactNode[] {
  return nodes.map((node, index) => renderNode(node, index, ctx));
}

function renderNode(
  node: DocNode,
  key: number,
  ctx: RenderContext,
): React.ReactNode {
  if (typeof node === "string") return node;
  const { tag, attrs } = node;
  const children = () => render(node.children, ctx);

  const heading = /^h([1-6])$/.exec(tag);
  if (heading) {
    const level = Math.min(
      6,
      Math.max(1, Number(heading[1]) + ctx.headingOffset),
    );
    return React.createElement(`h${level}`, { key }, children());
  }

  switch (tag) {
    case "a": {
      const href = safeUrl(attrs.href ?? "");
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={href}
          title={attrs.title}
          {...(external
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
        >
          {children()}
          {/* SR-only hint — external links open a new tab, which is otherwise silent to
              assistive tech (register P2-37). */}
          {external ? (
            <span className="sr-only"> (opens in new tab)</span>
          ) : null}
        </a>
      );
    }
    case "img": {
      const src = safeUrl(attrs.src ?? "");
      const alt = attrs.alt ?? "";
      if (!imageSourceAllowed(src, ctx.images)) {
        return (
          <span
            key={key}
            data-slot="markdown-image-blocked"
            className="my-2 block rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
          >
            {alt || "Remote image blocked"}
          </span>
        );
      }
      let remote = false;
      try {
        remote = Boolean(new URL(src));
      } catch {
        // Relative URL: the browser will load it from the embedding application's own origin.
      }
      return (
        // Plain <img>: registry source is framework-agnostic (no next/image dependency). Frame and
        // rhythm come from `prose.img` on the root.
        <img
          key={key}
          src={src}
          alt={alt}
          title={attrs.title}
          loading="lazy"
          decoding="async"
          referrerPolicy={remote ? "no-referrer" : undefined}
        />
      );
    }
    case "pre": {
      const code = childElements(node).find((child) => child.tag === "code");
      const language = /language-([\w-]+)/.exec(code?.attrs.class ?? "")?.[1];
      const raw = textOf(code ?? node).replace(/\n$/, "");
      return (
        <CodeBlock
          key={key}
          language={language}
          copyValue={raw || undefined}
          className="my-2"
        >
          {raw}
        </CodeBlock>
      );
    }
    case "table":
      // A wide table scrolls inside its own box rather than widening the page (the 320px reflow
      // contract).
      return (
        <div key={key} className="my-2 w-full overflow-x-auto">
          <table>{children()}</table>
        </div>
      );
    case "ul":
      return attrs["data-type"] === "taskList" ? (
        <ul key={key} className="contains-task-list" data-type="taskList">
          {children()}
        </ul>
      ) : (
        <ul key={key}>{children()}</ul>
      );
    case "ol":
      return (
        <ol
          key={key}
          start={attrs.start ? Number(attrs.start) || undefined : undefined}
        >
          {children()}
        </ol>
      );
    case "li": {
      if (attrs["data-type"] !== "taskItem")
        return <li key={key}>{children()}</li>;
      const checked = attrs["data-checked"] === "true";
      // Markdown builds the body box itself; TextEdit's HTML carries it as the item's `<div>`
      // after a `<label>` holding the native checkbox.
      const box = childElements(node).find((child) => child.tag === "div");
      const body = box
        ? box.children
        : node.children.filter(
            (child) => typeof child === "string" || child.tag !== "label",
          );
      return (
        <li
          key={key}
          className="task-list-item"
          data-type="taskItem"
          data-checked={checked}
        >
          {/* CONTENT, not a form control (GitHub parity): inert, but full-contrast — the
              interactive-disabled 50% dim would misread as a broken control. */}
          <Checkbox
            checked={checked}
            aria-label={checked ? "Done" : "Not done"}
            disabled
            className="pointer-events-none inline-flex me-1.5 align-middle disabled:opacity-100"
          />
          <div data-slot="task-item-content">{render(body, ctx)}</div>
        </li>
      );
    }
    case "input":
    case "label":
      // A native checkbox outside a task item carries nothing to show; a label keeps its text.
      return tag === "label" ? (
        <React.Fragment key={key}>{children()}</React.Fragment>
      ) : null;
    case "th":
    case "td": {
      const align =
        attrs.align && TEXT_ALIGN.has(attrs.align) ? attrs.align : undefined;
      return React.createElement(
        tag,
        {
          key,
          colSpan: attrs.colspan
            ? Number(attrs.colspan) || undefined
            : undefined,
          rowSpan: attrs.rowspan
            ? Number(attrs.rowspan) || undefined
            : undefined,
          style: align ? { textAlign: align } : undefined,
        },
        children(),
      );
    }
    case "code":
      return <code key={key}>{children()}</code>;
    default:
      return VOID_TAGS.has(tag)
        ? React.createElement(tag, { key })
        : React.createElement(tag, { key }, children());
  }
}

/** Props accepted by `MarkdownView`. */
export interface MarkdownViewProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The markdown string to render. Provided as `children` (preferred) or via the
   * `content` prop — when both are present, `children` wins.

   * @default undefined
   */
  children?: string;
  /**
   * The markdown string to render. Alternative to `children`; useful when the
   * source comes from a data field rather than JSX text.

   * @default undefined
   */
  content?: string;
  /**
   * What the source is: Markdown (CommonMark + GFM), or HTML — `TextEdit`'s `format="html"`
   * output. HTML is rebuilt through a tag and attribute allowlist (the elements rich text uses),
   * never injected: scripts, styles, event handlers and unsafe URLs are dropped.
   * @default 'markdown'
   */
  format?: "markdown" | "html";
  /**
   * Exact HTTP(S) origins allowed to load Markdown images. Relative/same-site paths are always
   * allowed. Absolute and protocol-relative remote images are blocked by default to prevent
   * untrusted Markdown from creating tracking requests. Allowed remote images use a no-referrer
   * policy. `["*"]` allows every HTTP(S) origin — for content whose author is trusted to embed
   * images (it is what `TextEdit`'s read view passes, matching the editor).

   * @default []
   */
  allowedImageOrigins?: readonly string[];
  /**
   * Move every heading this many levels down, capped at h6: `1` renders `#` as an `h2`, `2` as
   * an `h3`. Use it when the markdown sits under the page's own headings (a card titled with an
   * `h2`), so the document outline never skips back up.
   * @default 0
   */
  headingOffset?: number;
}

/**
 * `MarkdownView` — render a markdown string as safe, token-styled HTML.
 *
 * Tokenized by [`marked`](https://marked.js.org)'s lexer (CommonMark + GitHub-flavored markdown:
 * tables, strikethrough, task lists, autolinks — the same parser `TextEdit`'s Markdown format
 * uses), then rebuilt as React elements. **XSS-safe by construction** — never
 * `dangerouslySetInnerHTML`: raw HTML in the source renders as inert text, and link and image URLs
 * with an unsafe protocol (`javascript:`, `data:`) are emptied. `format="html"` renders
 * `TextEdit`'s HTML output through a tag and attribute allowlist instead.
 *
 * Prose styling is the shared `prose` recipe from `@vegastack/design`, worn as a
 * single class on the root — headings, paragraphs, marks, lists, blockquotes,
 * inline code, fenced code, rules, images and GFM tables, every value a semantic
 * token. `TextEdit` wears the same string (and renders its saved value with this component until
 * it is first edited), so rendered markdown and edited rich text are the same typography.
 *
 * Server-safe and light: no hooks, no `'use client'`, one small parser. Renders nothing for
 * empty/whitespace input.
 *
 * @example
 * <MarkdownView># Hello\n\nThis is **markdown**.</MarkdownView>
 *
 * @example
 * // From a data field
 * <MarkdownView content={task.description} />
 */
export function MarkdownView({
  children,
  content,
  format = "markdown",
  allowedImageOrigins = [],
  headingOffset = 0,
  className,
  ...props
}: MarkdownViewProps) {
  const source = typeof children === "string" ? children : (content ?? "");

  if (!source.trim()) return null;

  const tree = format === "html" ? fromHtml(source) : fromMarkdown(source);

  return (
    <div
      data-slot="markdown-view"
      className={cn(proseClassName, className)}
      {...props}
    >
      {render(tree, {
        images: normalizeAllowedImageOrigins(allowedImageOrigins),
        headingOffset: Math.trunc(headingOffset),
      })}
    </div>
  );
}
