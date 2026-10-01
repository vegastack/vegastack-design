// @vegastack markdown-view@0.23.103 sha256-PDfdgTQsIVxerT/B+OpP6p+MKlt6n125Q0jVpeAnqEw=

import * as React from "react";
import { Lexer, type Token, type Tokens } from "marked";
import {
  Info,
  ChevronRight,
  Lightbulb,
  MessageSquareWarning,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn, proseClassName } from "@vegastack/design";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
// `CodeBlock` owns the fenced-code surface (header + copy + sunken mono panel); shadcn rewrites
// this alias on `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { CodeBlock, parseCodeFenceInfo } from "@/components/ui/code-block";
import {
  InlineChip,
  type InlineChipKind,
  type InlineChipProps,
} from "@/components/ui/inline-chip";
// The one client leaf: a citation marker's popover. Imported only when `citation` answers.
import {
  MarkdownCitationMarker,
  type MarkdownCitation,
} from "@/components/ui/markdown-citation";

export type { MarkdownCitation } from "@/components/ui/markdown-citation";

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

/* ------------------------------------------------------------------------------------------------
 * Mentions, file links, callouts, toggles — the constructs TextEdit's Markdown carries beyond GFM
 * ----------------------------------------------------------------------------------------------*/

/** What a mention points at. */
export type MentionKind = InlineChipKind;

/** The tones a callout takes — GitHub's alert set (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, …). */
export type CalloutTone = "note" | "tip" | "important" | "warning" | "caution";

/** Every callout tone, in GitHub's order. */
export const CALLOUT_TONES: readonly CalloutTone[] = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
];

/**
 * A callout is an `Alert`: the tone picks the alert variant (note → info, tip → success,
 * important → default, warning → warning, caution → destructive), the icon and the label.
 */
export const CALLOUT_STYLE: Record<
  CalloutTone,
  {
    variant: "default" | "info" | "success" | "warning" | "destructive";
    icon: LucideIcon;
    label: string;
  }
> = {
  note: { variant: "info", icon: Info, label: "Note" },
  tip: { variant: "success", icon: Lightbulb, label: "Tip" },
  important: {
    variant: "default",
    icon: MessageSquareWarning,
    label: "Important",
  },
  warning: { variant: "warning", icon: TriangleAlert, label: "Warning" },
  caution: { variant: "destructive", icon: OctagonAlert, label: "Caution" },
};

/** The callout's blocks: the Alert's description (its tone colour), first/last margins dropped. */
export const calloutContentClassName =
  "col-start-2 min-w-0 text-pretty [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_[data-node-view-content-react]>:first-child]:mt-0 [&_[data-node-view-content-react]>:last-child]:mb-0";

/** The Alert grid for a callout: icon (or the editor's tone button) in the gutter, blocks beside it. */
export const calloutClassName = "my-2 grid-cols-[auto_1fr] gap-x-2";

/**
 * `[@<label>](mention://<kind>/<id>)` at the start of a string. The label escapes `\`, `[` and `]`
 * with a backslash; the id has no whitespace or parentheses.
 */
const MENTION_LINK =
  /^\[@((?:[^\\[\]\n]|\\[^\n])*)\]\(mention:\/\/(user|page|file|task|meeting|customer|project)\/([^\s()]+)\)/;

/**
 * Read a mention link — `[@<label>](mention://<kind>/<id>)` — at the start of `source`, the shape
 * `TextEdit` writes for an `@` mention. `null` when `source` does not start with one.
 *
 * @example
 * parseMentionLink("[@Asha Rao](mention://user/u1) said…");
 * // { raw: "[@Asha Rao](mention://user/u1)", kind: "user", id: "u1", label: "Asha Rao" }
 */
export function parseMentionLink(
  source: string,
): { raw: string; kind: MentionKind; id: string; label: string } | null {
  const match = MENTION_LINK.exec(source);
  if (!match) return null;
  return {
    raw: match[0],
    kind: match[2] as MentionKind,
    id: match[3]!,
    label: match[1]!.replace(/\\([^\n])/g, "$1"),
  };
}

/**
 * The Markdown for a mention, exactly as `TextEdit` writes it: the label on one line with `\`, `[`
 * and `]` escaped.
 *
 * @example
 * mentionMarkdown("page", "p1", "Q3 [draft]"); // "[@Q3 \\[draft\\]](mention://page/p1)"
 */
export function mentionMarkdown(
  kind: MentionKind,
  id: string,
  label: string,
): string {
  const text = label.replace(/\s*\n\s*/g, " ").replace(/[\\[\]]/g, "\\$&");
  return `[@${text}](mention://${kind}/${id})`;
}

/** Props accepted by `MentionChip`. */
export interface MentionChipProps extends Omit<InlineChipProps, "targetId"> {
  /** The target's id. An id starting with `restricted:` renders a muted chip that is never a link. */
  id: string;
}

/**
 * `MentionChip` — the chip a `@` mention renders as, in `MarkdownView` and inside `TextEdit`: an
 * `InlineChip` keyed by the mention's id (the nearest `InlineChipProvider` links, opens and
 * previews it). An id starting with `restricted:` is a target the reader may not open: a muted
 * chip, never a link.
 *
 * @example
 * <MentionChip kind="page" id="p1" label="Q3 plan" href="/library/p1" />
 */
export function MentionChip({ id, ...props }: MentionChipProps) {
  return <InlineChip targetId={id} {...props} />;
}

/**
 * The root rules the chips, callouts and toggles need on a prose surface: a chip is an `<a>` and
 * the recipe's link rules are descendant rules, which an element class cannot beat, so the root
 * restates them at higher specificity. `MarkdownView` and `TextEdit`'s editor both wear it.
 */
export const markdownExtrasClassName = cn(
  // A chip that is an `<a>` keeps its own ink and no underline (`inlineChipProseClassName`, restated
  // here because a constant imported from a client module is a reference on the server).
  "[&_[data-slot=inline-chip]]:no-underline [&_[data-slot=inline-chip][data-interactive]:hover]:underline",
  // TextEdit's file links are link marks, not chips: the same ground, ink, padding and radius.
  "[&_[data-slot=file-chip]]:box-decoration-clone [&_[data-slot=file-chip]]:rounded-sm [&_[data-slot=file-chip]]:bg-muted [&_[data-slot=file-chip]]:px-1 [&_[data-slot=file-chip]]:py-px [&_[data-slot=file-chip]]:font-medium [&_[data-slot=file-chip]]:no-underline [&_[data-slot=file-chip]]:text-foreground",
  "[&_details]:my-2 [&_summary]:flex [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:items-center [&_summary]:gap-1 [&_summary]:py-0.5 [&_summary]:font-medium [&_summary::-webkit-details-marker]:hidden [&_details>:not(summary)]:ms-6",
  "[&_[data-slot=toggle-icon]]:size-5 [&_[data-slot=toggle-icon]]:shrink-0 [&_[data-slot=toggle-icon]]:rounded-sm [&_[data-slot=toggle-icon]]:p-0.5 [&_[data-slot=toggle-icon]]:text-muted-foreground [&_[data-slot=toggle-icon]]:transition-transform [&_summary:hover_[data-slot=toggle-icon]]:bg-muted [&_summary:hover_[data-slot=toggle-icon]]:text-foreground [&_details[open]>summary>[data-slot=toggle-icon]]:rotate-90 rtl:[&_[data-slot=toggle-icon]]:-scale-x-100",
);

/** `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` — a callout's first line. */
/** A video block: full width up to its natural size, rounded like an image. */
export const MEDIA_VIDEO_CLASS =
  "my-2 block aspect-video h-auto w-full max-w-full rounded-lg border border-border bg-muted";
/** An audio block: the native player, full width. */
export const MEDIA_AUDIO_CLASS = "my-2 block w-full max-w-full";

const CALLOUT_MARKER =
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i;

/** `<details><summary>Title</summary>` — the opening line of a toggle. */
const TOGGLE_OPEN =
  /^<details( open)?>[ \t]*<summary>([^\n]*?)<\/summary>[ \t]*$/;

/**
 * `<video src="…"></video>` / `<audio src="…"></audio>` on a line of its own — TextEdit's video and
 * audio blocks. Only the `src` is read; any other attribute is ignored.
 */
export const MEDIA_BLOCK =
  /^<(video|audio)\b[^>\n]*?\ssrc="([^"\n]+)"[^>\n]*>[ \t]*<\/\1>[ \t]*$/;
const TOGGLE_CLOSE = /^<\/details>[ \t]*$/;

/**
 * Stable ids for a document's headings, in order: the heading's words, lower-cased and joined with
 * hyphens, then `-1`, `-2`… for a repeat — so identical text always gets the same id.
 *
 * @example
 * headingIds(["Setup", "Wiring plan", "Setup"]); // ["setup", "wiring-plan", "setup-1"]
 */
export function headingIds(texts: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return texts.map((text) => {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-") || "heading";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  });
}

/* --- markdown → tree --------------------------------------------------------------------------*/

/** A `<br>` tag, in any of its spellings: the one raw HTML a table cell renders (its line break). */
const CELL_BREAK = /^<br\s*\/?>$/i;

/** `cell`: inside a table cell, where `<br>` is GFM's only way to break a line. */
function inline(tokens: Token[] | undefined, cell = false): DocNode[] {
  const out: DocNode[] = [];
  for (const token of tokens ?? []) {
    const t = token as Tokens.Generic;
    switch (t.type) {
      case "text":
        if (t.tokens?.length) out.push(...inline(t.tokens, cell));
        else out.push(decode(t.text));
        break;
      case "escape":
        out.push(decode(t.text));
        break;
      case "strong":
      case "em":
      case "del":
        out.push(el(t.type, {}, inline(t.tokens, cell)));
        break;
      case "codespan":
        out.push(el("code", {}, [t.text]));
        break;
      case "br":
        out.push(el("br"));
        break;
      case "link": {
        // `[@label](mention://kind/id)` — a mention, read from the raw source so the label is
        // exactly what was written (the link's own tokens would parse emphasis inside it).
        const mention = t.href?.startsWith("mention://")
          ? parseMentionLink(t.raw)
          : null;
        if (mention) {
          out.push(
            el("mention", {
              kind: mention.kind,
              id: mention.id,
              label: mention.label,
            }),
          );
          break;
        }
        out.push(
          el(
            "a",
            { href: decode(t.href), ...(t.title ? { title: t.title } : {}) },
            inline(t.tokens, cell),
          ),
        );
        break;
      }
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
      // `rehype-raw`) — except a table cell's `<br>`, its line break.
      case "html":
        out.push(cell && CELL_BREAK.test(t.text.trim()) ? el("br") : t.text);
        break;
      case "checkbox":
        break;
      default:
        if (t.tokens) out.push(...inline(t.tokens, cell));
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

/**
 * `<details><summary>Title</summary>` … `</details>`: marked reads the two tags as separate HTML
 * blocks around the body's own blocks. From the opening tag at `start`, the index of its matching
 * close (nested toggles counted), or -1.
 */
function toggleClose(tokens: Token[], start: number): number {
  let depth = 0;
  for (let at = start; at < tokens.length; at++) {
    const t = tokens[at] as Tokens.Generic;
    if (t.type !== "html") continue;
    const text = String(t.text).trim();
    if (TOGGLE_OPEN.test(text)) depth++;
    else if (TOGGLE_CLOSE.test(text) && --depth === 0) return at;
  }
  return -1;
}

function blocks(tokens: Token[]): DocNode[] {
  const out: DocNode[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const t = tokens[index] as Tokens.Generic;
    switch (t.type) {
      case "space":
      case "def":
        break;
      case "heading":
        out.push(el(`h${t.depth}`, {}, inline(t.tokens)));
        break;
      case "paragraph": {
        // A media line marked reads as an inline-HTML paragraph: a video or audio block.
        const media = MEDIA_BLOCK.exec(String(t.raw ?? "").trim());
        if (media) {
          out.push(el(media[1]!, { src: decode(media[2]!) }));
          break;
        }
        out.push(el("p", {}, inline(t.tokens)));
        break;
      }
      // A tight list item's text: inline content with no paragraph around it.
      case "text":
        out.push(...inline(t.tokens?.length ? t.tokens : [t as Token]));
        break;
      case "code": {
        // The info string is the language, then TextEdit's `wrap` flag (```` ```ts wrap ````).
        const info = parseCodeFenceInfo(t.lang);
        out.push(
          el("pre", info.wrap ? { "data-wrap": "" } : {}, [
            el(
              "code",
              info.language ? { class: `language-${info.language}` } : {},
              [t.text],
            ),
          ]),
        );
        break;
      }
      case "blockquote": {
        // GitHub's alert syntax: `> [!TIP]` on the first line makes the quote a callout.
        const marker = CALLOUT_MARKER.exec(t.text ?? "");
        if (marker) {
          out.push(
            el(
              "callout",
              { tone: marker[1]!.toLowerCase() },
              blocks(Lexer.lex(t.text.slice(marker[0].length), { gfm: true })),
            ),
          );
          break;
        }
        out.push(el("blockquote", {}, blocks(t.tokens ?? [])));
        break;
      }
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
              el("th", cellAttrs(cell.align), inline(cell.tokens, true)),
            ),
          ),
        ]);
        const rows = table.rows.map((row) =>
          el(
            "tr",
            {},
            row.map((cell) =>
              el("td", cellAttrs(cell.align), inline(cell.tokens, true)),
            ),
          ),
        );
        out.push(
          el("table", {}, rows.length ? [head, el("tbody", {}, rows)] : [head]),
        );
        break;
      }
      case "html": {
        const media = MEDIA_BLOCK.exec(String(t.text).trim());
        if (media) {
          out.push(el(media[1]!, { src: decode(media[2]!) }));
          break;
        }
        const open = TOGGLE_OPEN.exec(String(t.text).trim());
        const close = open ? toggleClose(tokens, index) : -1;
        if (open && close !== -1) {
          out.push(
            el("details", open[1] ? { open: "" } : {}, [
              el(
                "summary",
                {},
                inline(Lexer.lexInline(open[2]!, { gfm: true })),
              ),
              ...blocks(tokens.slice(index + 1, close)),
            ]),
          );
          index = close;
          break;
        }
        out.push(t.text.replace(/\n+$/, ""));
        break;
      }
      default:
        if (t.tokens) out.push(...blocks(t.tokens));
        else if (typeof t.text === "string") out.push(decode(t.text));
    }
  }
  return out;
}

/** `[[n]]`, n = 1–999: a summary's citation marker. */
const CITATION_MARKER = /\[\[([1-9]\d{0,2})\]\]/g;

/** Elements whose text never carries a citation: code, link text, chips. */
const CITATION_OPAQUE = new Set(["code", "pre", "a", "mention"]);

/**
 * Split every `[[n]]` in the tree's running text into a `citation` node. The node keeps the literal
 * marker as its text, so `textOf` and heading ids read exactly what was written.
 */
function withCitations(nodes: DocNode[]): DocNode[] {
  const out: DocNode[] = [];
  for (const node of nodes) {
    if (typeof node !== "string") {
      if (!CITATION_OPAQUE.has(node.tag))
        node.children = withCitations(node.children);
      out.push(node);
      continue;
    }
    let cursor = 0;
    for (const match of node.matchAll(CITATION_MARKER)) {
      if (match.index > cursor) out.push(node.slice(cursor, match.index));
      // A marker straight after another (`[[2]][[3]]`) keeps its distance, so neither 24px hit
      // area covers its neighbour's (WCAG 2.5.8).
      const previous = out[out.length - 1];
      const adjacent =
        match.index === cursor &&
        typeof previous !== "string" &&
        previous?.tag === "citation";
      out.push(
        el(
          "citation",
          { n: match[1]!, ...(adjacent ? { adjacent: "" } : {}) },
          [match[0]],
        ),
      );
      cursor = match.index + match[0].length;
    }
    if (cursor === 0) out.push(node);
    else if (cursor < node.length) out.push(node.slice(cursor));
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
  "width",
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

/** A heading's words as the outline shows them: a mention reads as `@label`. */
function headingText(node: DocNode): string {
  if (typeof node === "string") return node;
  if (node.tag === "mention") return `@${node.attrs.label ?? ""}`;
  return node.children.map(headingText).join("");
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
  mentionHref?: (kind: MentionKind, id: string) => string | null;
  mentionImage?: (id: string) => string | null | undefined;
  fileLinkPrefix: string;
  fileContentType?: (href: string) => string | null | undefined;
  citation?: (n: number) => MarkdownCitation | null | undefined;
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
    return React.createElement(`h${level}`, { key, id: attrs.id }, children());
  }

  switch (tag) {
    case "citation": {
      const n = Number(attrs.n);
      const source = ctx.citation?.(n);
      if (!source) return textOf(node);
      return (
        <MarkdownCitationMarker
          key={key}
          n={n}
          className={attrs.adjacent !== undefined ? "ms-2.5" : undefined}
          label={source.label}
          content={source.content}
          onSelect={source.onSelect}
        />
      );
    }
    case "mention": {
      const kind = attrs.kind as MentionKind;
      return (
        <InlineChip
          key={key}
          kind={kind}
          targetId={attrs.id ?? ""}
          label={attrs.label ?? ""}
          // The view's own props win over the provider's only when the host passed them.
          href={
            ctx.mentionHref ? ctx.mentionHref(kind, attrs.id ?? "") : undefined
          }
          image={
            kind === "user" ? ctx.mentionImage?.(attrs.id ?? "") : undefined
          }
        />
      );
    }
    case "callout": {
      const tone = (attrs.tone ?? "note") as CalloutTone;
      const style = CALLOUT_STYLE[tone] ?? CALLOUT_STYLE.note;
      const Icon = style.icon;
      return (
        <Alert
          key={key}
          variant={style.variant}
          role="note"
          aria-label={style.label}
          data-slot="callout"
          data-tone={tone}
          className={calloutClassName}
        >
          <Icon aria-hidden />
          <AlertDescription className={calloutContentClassName}>
            {children()}
          </AlertDescription>
        </Alert>
      );
    }
    case "a": {
      const href = safeUrl(attrs.href ?? "");
      if (ctx.fileLinkPrefix && href.startsWith(ctx.fileLinkPrefix)) {
        const name = textOf(node);

        return (
          <InlineChip
            key={key}
            kind="file"
            targetId={href}
            href={href}
            label={name}
            title={attrs.title}
            contentType={ctx.fileContentType?.(href)}
          />
        );
      }
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
      // A width set by resizing in `TextEdit`: `![alt|320](src)` in markdown, `width` in HTML.
      const sized = parseImageAlt(attrs.alt ?? "");
      const alt = sized.alt;
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
      const width =
        sized.width ?? (Number.parseInt(attrs.width ?? "", 10) || undefined);
      return (
        // Plain <img>: registry source is framework-agnostic (no next/image dependency). Frame and
        // rhythm come from `prose.img` on the root.
        <img
          key={key}
          data-slot="markdown-image"
          src={src}
          alt={alt}
          width={width}
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
          wrap={attrs["data-wrap"] !== undefined}
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
    case "details":
      return (
        <details key={key} open={attrs.open !== undefined || undefined}>
          {children()}
        </details>
      );
    case "summary":
      // A real chevron (the native marker is hidden): right when closed, down when open.
      return (
        <summary key={key} data-slot="toggle-summary">
          <ChevronRight aria-hidden data-slot="toggle-icon" />
          {children()}
        </summary>
      );
    case "video":
    case "audio": {
      const src = safeUrl(attrs.src ?? "");
      if (!imageSourceAllowed(src, ctx.images))
        return (
          <span
            key={key}
            data-slot="markdown-image-blocked"
            className="my-2 block rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
          >
            {tag === "video" ? "Remote video blocked" : "Remote audio blocked"}
          </span>
        );
      return tag === "video" ? (
        <video
          key={key}
          src={src}
          controls
          preload="metadata"
          playsInline
          data-slot="markdown-video"
          className={MEDIA_VIDEO_CLASS}
        />
      ) : (
        <audio
          key={key}
          src={src}
          controls
          preload="metadata"
          data-slot="markdown-audio"
          className={MEDIA_AUDIO_CLASS}
        />
      );
    }
    default:
      return VOID_TAGS.has(tag)
        ? React.createElement(tag, { key })
        : React.createElement(tag, { key }, children());
  }
}

/**
 * The `document` heading scale, laid over the shared prose recipe (`headingScale="document"` on
 * `MarkdownView` and `TextEdit`): a page's headings are clearly bigger than its body, with more
 * room above than below, the way a document reads (Notion: 1.875 / 1.5 / 1.25em).
 *
 * @example
 * <div className={cn(proseClassName, proseDocumentHeadingsClassName)} />
 */
export const proseDocumentHeadingsClassName =
  "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-3xl [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:mb-1 [&_h3]:text-xl [&_h4]:mt-5 [&_h4]:mb-1 [&_h4]:text-base [&_h4]:font-semibold";

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
  /**
   * Give every heading an `id` — its words, hyphenated, `-1`, `-2`… for a repeat (`headingIds`) —
   * the same ids `TextEdit`'s `onOutlineChange` reports, so an outline links into either.
   * @default false
   */
  headingIds?: boolean;
  /**
   * The heading sizes. `compact` is the app's type scale (a `#` stops at `text-lg`), right for a
   * comment, a message or a card. `document` is a page's scale — `#` `text-3xl`, `##` `text-2xl`,
   * `###` `text-xl`, with more room above a heading than below — for a page read as a document.
   * @default "compact"
   */
  headingScale?: "compact" | "document";
  /**
   * Where a mention chip links, by kind and id (`[@Q3 plan](mention://page/p1)`). Return `null`
   * for no link. People are never links, and neither is a `restricted:` id.
   * @default undefined
   */
  mentionHref?: (kind: MentionKind, id: string) => string | null;
  /**
   * A person mention's avatar URL, by id: the chip shows it (16px) in place of the person icon.
   * @default undefined
   */
  mentionImage?: (id: string) => string | null | undefined;
  /**
   * A link whose href starts with this renders as a file chip — an icon for the file's type and
   * its name. `""` turns file chips off.
   * @default "/api/files/"
   */
  fileLinkPrefix?: string;
  /**
   * A file chip's content type, by its href, when the host knows it (a comment's own files): the
   * chip's icon then follows the type, not only the name's extension.
   * @default undefined
   */
  fileContentType?: (href: string) => string | null | undefined;
  /**
   * When set, a `[[n]]` marker (n = 1–999) in text renders as a small superscript citation `n`
   * built from what this returns; `null`/`undefined` for an n leaves the literal text. Without the
   * prop markers stay literal text. Never inside code spans, fenced code or link text. Markdown
   * only. The marker is a client component, so pass this from a client component.
   * @default undefined
   */
  citation?: (n: number) => MarkdownCitation | null | undefined;
}

/**
 * `parseImageAlt` — split an image's markdown alt text into the text and the width `TextEdit`
 * stores after a resize: `![Diagram|320](src)` is alt "Diagram", width 320 (the Obsidian
 * convention, so other renderers still show the image).
 *
 * @example
 * parseImageAlt("Diagram|320"); // { alt: "Diagram", width: 320 }
 */
export function parseImageAlt(text: string): { alt: string; width?: number } {
  const match = /^(.*)\|(\d{1,5})$/s.exec(text);
  if (!match) return { alt: text };
  const width = Number(match[2]);
  return width > 0 ? { alt: match[1]!, width } : { alt: match[1]! };
}

/**
 * `imageMarkdown` — an image as markdown, its width (when set) kept in the alt text as
 * `parseImageAlt` reads it.
 *
 * @example
 * imageMarkdown({ src: "/a.png", alt: "Diagram", width: 320 }); // "![Diagram|320](/a.png)"
 */
export function imageMarkdown({
  src,
  alt,
  title,
  width,
}: {
  src: string;
  alt?: string | null;
  title?: string | null;
  width?: number | null;
}): string {
  // As Tiptap's own image serializer, plus the width.
  const text = `${alt ?? ""}${width ? `|${Math.round(width)}` : ""}`;
  return title ? `![${text}](${src} "${title}")` : `![${text}](${src})`;
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
 *
 * @example
 * // Citation markers: `[[2]]` becomes a superscript 2 that seeks the recording
 * <MarkdownView citation={(n) => sources[n] && { label: `Source ${n}`, content: sources[n].quote, onSelect: () => seek(sources[n].at) }}>
 *   {summary}
 * </MarkdownView>
 */
export function MarkdownView({
  children,
  content,
  format = "markdown",
  allowedImageOrigins = [],
  headingOffset = 0,
  headingIds: withHeadingIds = false,
  headingScale = "compact",
  mentionHref,
  mentionImage,
  fileLinkPrefix = "/api/files/",
  fileContentType,
  citation,
  className,
  ...props
}: MarkdownViewProps) {
  const source = typeof children === "string" ? children : (content ?? "");

  if (!source.trim()) return null;

  const parsed = format === "html" ? fromHtml(source) : fromMarkdown(source);
  const tree = citation && format !== "html" ? withCitations(parsed) : parsed;
  if (withHeadingIds) {
    const headings: El[] = [];
    const walk = (nodes: DocNode[]) => {
      for (const node of nodes) {
        if (typeof node === "string") continue;
        if (/^h[1-6]$/.test(node.tag)) headings.push(node);
        else walk(node.children);
      }
    };
    walk(tree);
    headingIds(headings.map(headingText)).forEach((id, index) => {
      headings[index]!.attrs.id = id;
    });
  }

  return (
    <div
      data-slot="markdown-view"
      className={cn(
        proseClassName,
        markdownExtrasClassName,
        headingScale === "document" && proseDocumentHeadingsClassName,
        className,
      )}
      {...props}
    >
      {render(tree, {
        images: normalizeAllowedImageOrigins(allowedImageOrigins),
        headingOffset: Math.trunc(headingOffset),
        mentionHref,
        mentionImage,
        fileLinkPrefix,
        fileContentType,
        citation,
      })}
    </div>
  );
}
