// @vegastack markdown-view@0.25.103 sha256-bUgcgfRpDT2BeJc9unKpgc3zvydIL+34app6IAR4N3I=

import * as React from "react";
import { Lexer, Marked, Tokenizer, type Token, type Tokens } from "marked";
import {
  Info,
  Play,
  Lightbulb,
  MessageSquareWarning,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn, proseClassName, proseDocumentClassName } from "@vegastack/design";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
// `CodeBlock` owns the fenced-code surface (header + copy + sunken mono panel); shadcn rewrites
// this alias on `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { CodeBlock } from "@/components/ui/code-block";
import { InlineChip, type InlineChipProps } from "@/components/ui/inline-chip";
import type { TaskInlinePerson } from "@/components/ui/task-inline";
import {
  BOOKMARK_TITLE,
  RESTRICTED_MENTION_PREFIX,
  CALLOUT_MARKER,
  DEFAULT_LIVE_BLOCK_KINDS,
  MEDIA_BLOCK,
  TOGGLE_CLOSE,
  TOGGLE_OPEN,
  boundedTokenizers,
  DEFAULT_HIGHLIGHT_COLOR,
  headingIds,
  highlightTokenizer,
  isHighlightColor,
  lexFrame,
  parseCodeFenceInfo,
  parseImageAlt,
  parseMentionLink,
  isMentionKind,
  liveBlockNames,
  parseLiveBlockRows,
  readLiveBlock,
  trackedLexing,
  type CalloutTone,
  type LiveBlockKind,
  type MentionKind,
} from "@/lib/text-edit-grammar";
import { resolveAnchor } from "@/lib/text-anchor";
import { matchEmbed, type EmbedProviders } from "@/lib/embed-providers";
// The client leaves: a citation marker's popover, and the behaviour after render (table scroll
// cue, outline, find, print, highlight layout, heading links). Each renders only when asked for.
import {
  MarkdownCitationMarker,
  type MarkdownCitation,
} from "@/components/ui/markdown-citation";
import {
  MarkdownBookmark,
  MarkdownEmbed,
  MarkdownTaskInline,
  MarkdownBlockView,
  MarkdownHeadingLink,
  MarkdownSectionMarker,
  MarkdownTableScroll,
  MarkdownViewEffects,
  type MarkdownAnnotationLayout,
  type MarkdownOutlineItem,
  type MarkdownViewEffectsProps,
} from "@/components/ui/markdown-view-client";

export type { MarkdownCitation } from "@/components/ui/markdown-citation";
export {
  MarkdownBookmark,
  MarkdownEmbed,
  copyWithToast,
  headingLinkClassName,
} from "@/components/ui/markdown-view-client";
import type { BlockViews } from "@/components/ui/block-view";
export type {
  BlockView,
  BlockViewAction,
  BlockViewActionTarget,
  BlockViewRenderContext,
  BlockViews,
} from "@/components/ui/block-view";
export type {
  MarkdownBookmarkPreview,
  MarkdownBookmarkProps,
  MarkdownEmbedProps,
  MarkdownAnnotationLayout,
  MarkdownOutlineItem,
} from "@/components/ui/markdown-view-client";

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

/** An element's attributes without its title (a caption shown as a figure's, not as a tooltip). */
function withoutTitle(attrs: Record<string, string>): Record<string, string> {
  const { title: _title, ...rest } = attrs;
  return rest;
}

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
    /** The tone's icon colour (the tone menu, the editor's tone button). */
    iconClassName: string;
    /** The tone button's hover and open wash. */
    washClassName: string;
  }
> = {
  note: {
    variant: "info",
    icon: Info,
    label: "Note",
    iconClassName: "text-info-text",
    washClassName: "hover:bg-info/10 aria-expanded:bg-info/10",
  },
  tip: {
    variant: "success",
    icon: Lightbulb,
    label: "Tip",
    iconClassName: "text-success-text",
    washClassName: "hover:bg-success/10 aria-expanded:bg-success/10",
  },
  important: {
    variant: "default",
    icon: MessageSquareWarning,
    label: "Important",
    iconClassName: "text-foreground",
    washClassName: "hover:bg-muted aria-expanded:bg-muted",
  },
  warning: {
    variant: "warning",
    icon: TriangleAlert,
    label: "Warning",
    iconClassName: "text-warning-text",
    washClassName: "hover:bg-warning/10 aria-expanded:bg-warning/10",
  },
  caution: {
    variant: "destructive",
    icon: OctagonAlert,
    label: "Caution",
    iconClassName: "text-destructive-text",
    washClassName: "hover:bg-destructive/10 aria-expanded:bg-destructive/10",
  },
};

/** The callout's blocks: the Alert's description (its tone colour), first/last margins dropped. */
export const calloutContentClassName =
  "col-start-2 min-w-0 text-pretty [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_[data-node-view-content-react]>:first-child]:mt-0 [&_[data-node-view-content-react]>:last-child]:mb-0";

/** The Alert grid for a callout: icon (or the editor's tone button) in the gutter, blocks beside it. */
export const calloutClassName =
  "my-2 grid-cols-[auto_1fr] gap-x-2 *:[svg]:row-span-1";

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
  // A bookmark card and a task line's ↗ are `<a>`s with their own ink and no underline.
  "[&_[data-slot=markdown-bookmark]]:text-card-foreground [&_[data-slot=markdown-bookmark]]:no-underline [&_[data-slot=task-inline-open]]:text-muted-foreground [&_[data-slot=task-inline-open]]:no-underline",
  // An image block (`markdown-figure`): the editor's image box, 8 from its neighbours.
  "[&_[data-slot=markdown-figure]]:my-2",
  "[&_details]:my-2 [&_summary]:flex [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:items-center [&_summary]:gap-1 [&_summary]:py-0.5 [&_summary]:font-medium [&_summary::-webkit-details-marker]:hidden [&_details>:not(summary)]:ms-6",
  "[&_[data-slot=toggle-icon]]:size-5 [&_[data-slot=toggle-icon]]:shrink-0 [&_[data-slot=toggle-icon]]:rounded-sm [&_[data-slot=toggle-icon]]:p-1 [&_[data-slot=toggle-icon]]:fill-current [&_[data-slot=toggle-icon]]:text-muted-foreground [&_[data-slot=toggle-icon]]:transition-transform [&_[data-slot=toggle-icon]]:duration-150 [&_summary:hover_[data-slot=toggle-icon]]:bg-muted [&_summary:hover_[data-slot=toggle-icon]]:text-foreground [&_details[open]>summary>[data-slot=toggle-icon]]:rotate-90 rtl:[&_[data-slot=toggle-icon]]:-scale-x-100",
);

/** A video block: full width up to its natural size, rounded like an image. */
export const MEDIA_VIDEO_CLASS =
  "my-2 block aspect-video h-auto w-full max-w-full rounded-lg border border-border bg-muted";
/** An audio block: the native player, full width. */
export const MEDIA_AUDIO_CLASS = "my-2 block w-full max-w-full";

/**
 * What a host's `renderLiveBlock` (or, for a live task list, `renderTaskQuery`) draws a live block
 * from (`TextEdit`, `MarkdownView`).
 */
export interface TaskQueryRenderProps {
  /** The block's id — the directive's `id`, which the host keys the block by. */
  blockId: string;
  /** Its filter: the directive's other attributes (`v`, `space`, `assignee`, `status`, …), as written. */
  query: Record<string, string>;
  /** The rows last stored: `- [ ] [@Title](mention://task/<id>) — <status>` lines, or the kind's own (`parseLiveBlockRows`). */
  snapshot: string;
  /** Whether the reader can change the list's filter: an editable editor. */
  editable: boolean;
  /**
   * Replace the list's filter (an editable editor only; absent in read views): a local edit of
   * the node's `query` — one undo step, carried to collaborators like any other edit. Keys other
   * than `[a-z][a-z0-9-]*` are dropped and line breaks in values become spaces, so the filter
   * reads back as written. A call after the editor turns read-only does nothing.
   * @default undefined
   */
  setQuery?: (query: Record<string, string>) => void;
}

/** What a host's `renderLiveBlock` draws a live block from: the same props as a task list's. */
export type LiveBlockRenderProps = TaskQueryRenderProps;

/**
 * Draws a live block of `kind` (`:::<kind>{…}`), or returns `null`/`undefined` to leave its stored
 * snapshot.
 */
export type LiveBlockRender = (
  kind: string,
  props: LiveBlockRenderProps,
) => React.ReactNode;

/**
 * The one drawing a host's two hooks make: `renderLiveBlock` for every kind when given, else
 * `renderTaskQuery` for `tasks` alone. `undefined` when the host passed neither.
 */
export function liveBlockRenderer(
  renderLiveBlock: LiveBlockRender | undefined,
  renderTaskQuery:
    ((props: TaskQueryRenderProps) => React.ReactNode) | undefined,
): LiveBlockRender | undefined {
  if (renderLiveBlock) return renderLiveBlock;
  if (!renderTaskQuery) return undefined;
  return (kind, props) =>
    kind === "tasks" ? renderTaskQuery(props) : undefined;
}

/** A `tasks` element's `query` attribute (JSON) as its strings. */
function queryOf(json: string | undefined): Record<string, string> {
  try {
    const value: unknown = JSON.parse(json ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).map(([key, each]) => [key, String(each)]),
    );
  } catch {
    return {};
  }
}

/** Props accepted by `MarkdownLiveBlock`. */
export interface MarkdownLiveBlockProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The block's rows as stored: `- [x] [@Title](mention://task/<id>) — <status>` or `- [@Row](mention://row/<id>)` lines. */
  snapshot: string;
  /**
   * The block's kind: its heading (`label`), the mention kind of its rows (`rowKind`) and its
   * line with no rows (`empty`).
   * @default DEFAULT_LIVE_BLOCK_KINDS[0] — the live task list
   */
  kind?: LiveBlockKind;
  /**
   * A row chip's link, as `MarkdownView`'s prop of the same name; without it the nearest
   * `InlineChipProvider` links it.
   * @default undefined
   */
  mentionHref?: (kind: MentionKind, id: string) => string | null;
}

/**
 * `MarkdownLiveBlock` — a live block's stored snapshot as a quiet, read-only card: the kind's muted
 * heading ("Task list"), then each row — its box when it has one, the record's chip and its status
 * label — or the kind's empty line. Server-safe. `MarkdownView` renders every live block with it,
 * and `TextEdit` shows it where the host draws no live block (`renderLiveBlock`).
 *
 * @example
 * <MarkdownLiveBlock snapshot={"- [ ] [@Order glass](mention://task/t1) — To do"} />
 * <MarkdownLiveBlock
 *   kind={{ name: "table", rowKind: "row", label: "Table view" }}
 *   snapshot={"- [@Row](mention://row/r1)"}
 * />
 */
export function MarkdownLiveBlock({
  snapshot,
  kind = DEFAULT_LIVE_BLOCK_KINDS[0]!,
  mentionHref,
  className,
  ...props
}: MarkdownLiveBlockProps) {
  const rows = parseLiveBlockRows(snapshot, kind.rowKind);
  return (
    <div
      data-slot="markdown-live-block"
      data-kind={kind.name}
      role="group"
      aria-label={kind.label}
      className={cn(
        "my-2 rounded-lg border border-border px-3 py-2 text-sm",
        className,
      )}
      {...props}
    >
      <div aria-hidden className="text-xs font-medium text-muted-foreground">
        {kind.label}
      </div>
      {rows.length ? (
        <div role="list" className="mt-1.5 flex flex-col gap-1.5">
          {rows.map((row, index) => (
            <div
              key={index}
              role="listitem"
              data-slot="markdown-live-block-row"
              data-checked={row.checked ?? undefined}
              className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5"
            >
              {row.checked === null ? null : (
                <Checkbox
                  checked={row.checked}
                  aria-label={row.checked ? "Done" : "Not done"}
                  disabled
                  className="pointer-events-none inline-flex disabled:opacity-100"
                />
              )}
              {row.id ? (
                <InlineChip
                  kind={kind.rowKind}
                  targetId={row.id}
                  label={row.label}
                  href={
                    mentionHref ? mentionHref(kind.rowKind, row.id) : undefined
                  }
                  // The row is a snapshot: its box and status say its state, never the
                  // provider's live one.
                  done={false}
                  struck={false}
                />
              ) : (
                <span className="min-w-0">{row.label}</span>
              )}
              {row.status ? (
                <span className="text-muted-foreground">{row.status}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 text-muted-foreground">
          {kind.empty ?? "Nothing matches"}
        </div>
      )}
    </div>
  );
}

/* --- markdown → tree --------------------------------------------------------------------------*/

/** A `<br>` tag, in any of its spellings: the one raw HTML VegaStack Markdown reads (a line break). */
const BREAK_TAG = /^<br\s*\/?>$/i;

/** `cell`: inside a table cell, where `<br>` is GFM's only way to break a line. */
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
      case "highlight":
        out.push(
          el("mark", { "data-color": String(t.color) }, inline(t.tokens)),
        );
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
            inline(t.tokens),
          ),
        );
        break;
      }
      case "image": {
        // The width rides in the alt as written (`![Diagram|320](…)`, an escaped `\|` or `&#x7C;`
        // staying text): read it before entities are decoded.
        const sized = parseImageAlt(t.text);
        out.push(
          el("img", {
            src: decode(t.href),
            alt: decode(sized.alt),
            "data-alt-read": "",
            ...(sized.width ? { width: String(sized.width) } : {}),
            ...(sized.width && sized.height
              ? { height: String(sized.height) }
              : {}),
            ...(t.title ? { title: t.title } : {}),
          }),
        );
        break;
      }
      // Raw HTML is shown as the text it is, never parsed (react-markdown's behaviour without
      // `rehype-raw`) — except `<br>`, a line break (a table cell's or a heading's).
      case "html":
        out.push(BREAK_TAG.test(t.text.trim()) ? el("br") : t.text);
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
  // A list item's lone video link stays a link, as in `TextEdit` (an embed is a block of its own).
  const body = blocks(
    item.tokens.filter((t) => t.type !== "checkbox"),
    false,
  );
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

/** Per token list: each toggle opening's matching close (`toggleClose`), found in one pass. */
const TOGGLE_CLOSES = new WeakMap<Token[], Map<number, number>>();

/**
 * `<details><summary>Title</summary>` … `</details>`: marked reads the two tags as separate HTML
 * blocks around the body's own blocks. From the opening tag at `start`, the index of its matching
 * close (nested toggles counted), or -1. Every pair in `tokens` is matched once, with a stack, so
 * a page of unclosed toggles costs one pass rather than one per toggle.
 */
function toggleClose(tokens: Token[], start: number): number {
  let closes = TOGGLE_CLOSES.get(tokens);
  if (!closes) {
    closes = new Map();
    const open: number[] = [];
    tokens.forEach((token, at) => {
      const t = token as Tokens.Generic;
      if (t.type !== "html") return;
      const text = String(t.text).trim();
      if (TOGGLE_OPEN.test(text)) open.push(at);
      else if (TOGGLE_CLOSE.test(text) && open.length)
        closes!.set(open.pop()!, at);
    });
    TOGGLE_CLOSES.set(tokens, closes);
  }
  return closes.get(start) ?? -1;
}

/**
 * A paragraph that is only a link to its own URL (a bare URL, `<url>`, `[url](url)`; no title) on
 * an allowlisted video host: an embed — the rule `TextEdit`'s Markdown parse applies.
 */
function embedOf(paragraph: Tokens.Generic): El | null {
  const parts = (paragraph.tokens ?? []) as Tokens.Generic[];
  const link = parts.length === 1 ? parts[0]! : null;
  if (link?.type !== "link" || link.title) return null;
  const href = decode(String(link.href ?? ""));
  const text = inline(link.tokens);
  if (text.length !== 1 || text[0] !== href || !matchEmbed(href)) return null;
  return el("embed", { url: href });
}

/**
 * A paragraph that is only a link titled `bookmark` (`BOOKMARK_TITLE`) to an http(s) address: a
 * bookmark card — the rule `TextEdit`'s Markdown parse applies.
 */
function bookmarkOf(paragraph: Tokens.Generic): El | null {
  const parts = (paragraph.tokens ?? []) as Tokens.Generic[];
  const link = parts.length === 1 ? parts[0]! : null;
  if (link?.type !== "link" || link.title !== BOOKMARK_TITLE) return null;
  const href = decode(String(link.href ?? ""));
  // Its text is its own address (`bookmarkMarkdown`): a link with words of its own stays a link.
  const text = inline(link.tokens);
  // Escaped characters lex as text runs of their own: the plain text, joined, is the address.
  if (!text.every((part) => typeof part === "string") || text.join("") !== href)
    return null;
  return /^https?:\/\//i.test(href) ? el("bookmark", { url: href }) : null;
}

/**
 * A live block (`:::<name>{…}` … `:::`, `readLiveBlock`) of a name the view reads, as one block
 * token. Lines that do not make one stay text and a list.
 */
const TASKS_TOKEN = "markdownTasks";

/** All the places `needle` starts in `source`. */
function indexesOf(source: string, needle: string): number[] {
  const out: number[] = [];
  for (
    let at = source.indexOf(needle);
    at !== -1;
    at = source.indexOf(needle, at + 1)
  )
    out.push(at);
  return out;
}

/** The first of the sorted `positions` at or after `from`, or -1. */
function firstFrom(positions: number[], from: number): number {
  let low = 0;
  let high = positions.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (positions[mid]! < from) low = mid + 1;
    else high = mid;
  }
  return low < positions.length ? positions[low]! : -1;
}

/**
 * Where a live block of one of `names` may start inside the paragraph opening `src`: a line
 * opening with `:::<name>{` before the paragraph's first blank line. The lines are found once per
 * document (marked hands this every paragraph's rest of the document), so the look costs a binary
 * search.
 */
function liveBlockStart(names: readonly string[]) {
  const key = `liveLines:${names.join(",")}`;
  return function (this: unknown, src: string): number | undefined {
    // Indexed once per block source (`lexFrame`); an untracked lexer indexes this call's `src`.
    const frame = lexFrame(this, src);
    const source = frame?.source ?? src;
    let lines = frame?.memo[key] as
      { starts: number[]; blanks: number[] } | undefined;
    if (!lines) {
      lines = {
        starts: names
          .flatMap((name) => indexesOf(source, `\n:::${name}{`))
          .sort((a, b) => a - b),
        blanks: indexesOf(source, "\n\n"),
      };
      if (frame) frame.memo[key] = lines;
    }
    const offset = source.length - src.length;
    const at = firstFrom(lines.starts, offset);
    if (at === -1) return undefined;
    const blank = firstFrom(lines.blanks, offset);
    return blank === -1 || at <= blank ? at - offset + 1 : undefined;
  };
}

/**
 * How the view lexes Markdown: GFM with the bounded tokenizers `TextEdit`'s parse uses (emphasis,
 * links and empty task items read alike, in linear time), plus the live blocks of `names` — one
 * reader per set of names, made the first time it is asked for.
 */
const lexing = trackedLexing(Lexer);
const readers = new Map<string, Marked>();
function readerFor(liveBlockKinds: readonly LiveBlockKind[]): Marked {
  const names = liveBlockNames(liveBlockKinds);
  const key = names.join(",");
  let reader = readers.get(key);
  if (!reader) {
    reader = new Marked({
      gfm: true,
      tokenizer: boundedTokenizers(Tokenizer.prototype),
      extensions: [
        highlightTokenizer as never,
        ...(names.length
          ? [
              {
                name: TASKS_TOKEN,
                level: "block" as const,
                start: liveBlockStart(names),
                tokenizer(src: string) {
                  const block = readLiveBlock(src, { names });
                  return block
                    ? {
                        type: TASKS_TOKEN,
                        raw: block.raw,
                        kind: block.kind,
                        id: block.id ?? "",
                        query: block.query,
                        snapshot: block.snapshot,
                      }
                    : undefined;
                },
              },
            ]
          : []),
      ],
    });
    readers.set(key, reader);
  }
  return reader;
}

/** The reader of the document being lexed now (`fromMarkdown` sets it for its synchronous run). */
let reader = readerFor(DEFAULT_LIVE_BLOCK_KINDS);

/** `source` as block tokens. */
const lex = (source: string): Token[] =>
  new lexing.Lexer(reader.defaults).lex(source);

/** `source` as inline tokens, read as a paragraph's are. */
const lexInline = (source: string): Token[] =>
  new lexing.Lexer(reader.defaults).inlineTokens(source);

/**
 * `tokens[from, to)` as tree nodes. `embeds`: a lone video link here is an embed (the document, a
 * quote, a callout, a toggle).
 */
function blocks(
  tokens: Token[],
  embeds = true,
  from = 0,
  to = tokens.length,
): DocNode[] {
  const out: DocNode[] = [];
  for (let index = from; index < to; index++) {
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
        const embed = embeds ? (embedOf(t) ?? bookmarkOf(t)) : null;
        if (embed) {
          out.push(embed);
          break;
        }
        // Images are blocks (as in TextEdit): each one gets a paragraph of its own, the text
        // around it stays in paragraphs before and after.
        const parts = t.tokens ?? [];
        if (parts.some((part) => part.type === "image") && parts.length > 1) {
          let run: Token[] = [];
          const flush = () => {
            if (
              run
                .map((part) => part.raw ?? "")
                .join("")
                .trim()
            )
              out.push(el("p", {}, inline(run)));
            run = [];
          };
          for (const part of parts) {
            if (part.type !== "image") {
              run.push(part);
              continue;
            }
            flush();
            out.push(el("p", {}, inline([part])));
          }
          flush();
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
              blocks(lex(t.text.slice(marker[0].length))),
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
      case TASKS_TOKEN:
        out.push(
          el("tasks", {
            kind: String(t.kind ?? "tasks"),
            id: String(t.id ?? ""),
            query: JSON.stringify(t.query ?? {}),
            snapshot: String(t.snapshot ?? ""),
          }),
        );
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
              el("summary", {}, inline(lexInline(open[2]!))),
              ...blocks(tokens, true, index + 1, close),
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
  // Run adjacent text together first: the editor's Markdown escapes the brackets (`\[\[1\]\]`),
  // and each escape lexes as a text run of its own, so the marker would never match whole.
  const runs: DocNode[] = [];
  for (const node of nodes) {
    const last = runs[runs.length - 1];
    if (typeof node === "string" && typeof last === "string")
      runs[runs.length - 1] = last + node;
    else runs.push(node);
  }
  for (const node of runs) {
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

/* --- comment highlights ------------------------------------------------------------------------*/

/**
 * A comment's highlight: its id, the words it quotes with their context (a `TextEdit` anchor is
 * one — `TextEditAnnotation` passes as is), and how many comments its thread holds.
 */
export interface MarkdownAnnotation {
  /** The comment (thread) id — the highlight's `data-annotation`. */
  id: string;
  /**
   * Where it sits: the quoted words and up to 80 characters of context on each side; `start` /
   * `end` are offsets into the text when the host has them (they are checked against the quote).
   */
  anchor: {
    quote: string;
    prefix?: string;
    suffix?: string;
    start?: number;
    end?: number;
  };
  /** The thread's comment count — its pill's number and its accessible name. @default 1 */
  count?: number;
}

/** The highlight over a comment's words: a dashed warning underline, a wash on hover. */
export const annotationHighlightClassName =
  "cursor-pointer rounded-xs underline decoration-warning-text/60 decoration-dashed underline-offset-4 transition-colors duration-150 hover:bg-warning/15";
/** The active highlight (its thread is open): filled, the underline solid. */
export const annotationActiveClassName = "bg-warning/25 decoration-solid";
/**
 * The count pill after a highlight: a 16px warning-tinted pill (the highlight's own hue) with a
 * 24px invisible hit area. `annotationCountVisibilityClassName.auto` shows it only on a coarse
 * pointer or below the `lg` breakpoint, where a comment margin has no room — CSS alone.
 */
export const annotationCountClassName =
  "relative ms-0.5 h-4 min-w-4 select-none items-center justify-center rounded-full bg-warning/10 px-1 align-middle font-sans text-xs leading-none font-medium text-warning-text tabular-nums transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-warning/20 data-active:bg-warning/30";
/** Where a count pill shows: `auto` on a coarse pointer or below `lg`, `always` everywhere. */
export const annotationCountVisibilityClassName = {
  auto: "hidden pointer-coarse:inline-flex max-lg:inline-flex",
  always: "inline-flex",
} as const;

/** The text an image, a line break, a rule or a media block reads as in the anchor text. */
const LEAF_TEXT = "￼";

/** Inline elements of the tree: text runs inside a block. */
const INLINE_TAGS = new Set([
  "strong",
  "em",
  "del",
  "s",
  "u",
  "code",
  "a",
  "mention",
  "citation",
  "br",
  "img",
  "sup",
  "sub",
  "mark",
  "span",
  "label",
  "input",
]);
/** Blocks whose children are text — the editor's textblocks (a cell holds a paragraph there). */
const TEXT_BLOCKS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "summary",
  "th",
  "td",
]);

/** A run of the anchor text that came from one string (or one mention) of the tree. */
interface TextPiece {
  parent: El;
  index: number;
  start: number;
  end: number;
  /** A mention: highlighted whole or not at all. */
  atom: boolean;
  /**
   * The link it sits in (outermost), and the link's parent: its text is the link's name, so it is
   * never hidden or made a button, and a count pill goes after the link, never inside it.
   */
  linked: { link: El; parent: El } | null;
}

/**
 * The tree's text the way `TextEdit` builds a comment anchor's (`anchorText`): blocks joined by
 * `"\n"`, a mention as `@label`, an image, a line break, a rule or a media block as `"￼"`. Every
 * string (and mention) it came from is recorded, so a range in it maps back onto the tree.
 */
function anchorTextOf(holder: El): { text: string; pieces: TextPiece[] } {
  let text = "";
  let first = true;
  const pieces: TextPiece[] = [];
  const block = () => {
    if (first) first = false;
    else text += "\n";
  };
  const inline = (
    parent: El,
    index: number,
    linked: TextPiece["linked"] = null,
  ) => {
    const node = parent.children[index]!;
    if (typeof node === "string") {
      // A soft line break inside a paragraph renders, and is quoted, as a space.
      pieces.push({
        parent,
        index,
        start: text.length,
        end: text.length + node.length,
        atom: false,
        linked,
      });
      text += node.replace(/\n/g, " ");
      return;
    }
    if (node.tag === "mention") {
      const label = `@${node.attrs.label ?? ""}`;
      pieces.push({
        parent,
        index,
        start: text.length,
        end: text.length + label.length,
        atom: true,
        linked,
      });
      text += label;
      return;
    }
    if (node.tag === "img" || node.tag === "br") {
      text += LEAF_TEXT;
      return;
    }
    // A citation marker and the inside of inline code count, but are never cut into.
    if (node.tag === "citation") {
      text += textOf(node);
      return;
    }
    node.children.forEach((_, at) =>
      inline(
        node,
        at,
        linked ?? (node.tag === "a" ? { link: node, parent } : null),
      ),
    );
  };
  const blocks = (parent: El) => {
    let run = false;
    parent.children.forEach((child, index) => {
      if (typeof child === "string" || INLINE_TAGS.has(child.tag)) {
        // Whitespace between blocks (HTML source) is not text.
        if (!run && typeof child === "string" && !child.trim()) return;
        if (!run) block();
        run = true;
        inline(parent, index);
        return;
      }
      run = false;
      if (child.tag === "pre") {
        block();
        // A code block's text as written, a final newline included — as `TextEdit` reads it.
        text += textOf(child);
      } else if (
        ["hr", "video", "audio", "embed", "bookmark", "tasks"].includes(
          child.tag,
        )
      ) {
        block();
        text += LEAF_TEXT;
      } else if (TEXT_BLOCKS.has(child.tag)) {
        block();
        child.children.forEach((_, at) => inline(child, at));
      } else blocks(child);
    });
  };
  blocks(holder);
  return { text, pieces };
}

/**
 * Wrap the words each annotation quotes in `annotation` nodes, in place. An anchor that resolves
 * to no text, or to two places equally well, draws nothing — never a wrong highlight. Overlapping
 * highlights nest. Each annotation's first segment is marked `focus` (the one tab stop) and its
 * last `last` (the count pill follows it). Returns the ids that drew, in document order.
 */
function annotate(
  tree: DocNode[],
  annotations: readonly MarkdownAnnotation[],
): string[] {
  const holder = el("root", {}, tree);
  const { text, pieces } = anchorTextOf(holder);
  const ranges: { id: string; start: number; end: number }[] = [];
  for (const annotation of annotations) {
    const { quote, prefix = "", suffix = "", start, end } = annotation.anchor;
    const range = resolveAnchor(text, {
      quote,
      prefix,
      suffix,
      start: start ?? -1,
      end: end ?? -1,
    });
    if (range && range.end > range.start)
      ranges.push({ id: annotation.id, ...range });
  }
  if (!ranges.length) return [];

  // Each piece's replacement: its text cut at every highlight boundary inside it.
  const replaced = new Map<El, Map<number, DocNode[]>>();
  const focused = new Set<string>();
  const lastNode = new Map<string, El>();
  // A thread whose last segment sits in a link: its pill goes after that link.
  const lastLink = new Map<string, TextPiece["linked"]>();
  const drawn: string[] = [];
  for (const piece of pieces) {
    const covering = ranges.filter(
      (r) => r.start < piece.end && r.end > piece.start,
    );
    if (!covering.length) continue;
    const node = piece.parent.children[piece.index]!;
    const cuts = new Set([piece.start, piece.end]);
    if (!piece.atom)
      for (const r of covering) {
        if (r.start > piece.start) cuts.add(r.start);
        if (r.end < piece.end) cuts.add(r.end);
      }
    const points = [...cuts].sort((a, b) => a - b);
    const out: DocNode[] = [];
    for (let at = 0; at < points.length - 1; at++) {
      const from = points[at]!;
      const to = points[at + 1]!;
      const text: DocNode =
        typeof node === "string"
          ? node.slice(from - piece.start, to - piece.start)
          : node;
      const over = covering.filter((r) => r.start < to && r.end > from);
      if (!over.length) {
        out.push(text);
        continue;
      }
      // ONE span per segment, never nested: where highlights overlap, the segment belongs to the
      // innermost (latest-starting) one, and lists every thread it is part of.
      const owner = over.reduce((a, b) => (b.start >= a.start ? b : a));
      // Plain text only may be the thread's button or hidden from assistive technology: a
      // mention (its chip a link) or a link's text stays as it is, its own control and name.
      const plain = !piece.atom && !piece.linked;
      const wrapped = el(
        "annotation",
        {
          id: owner.id,
          ids: over.map((r) => r.id).join(" "),
          ...(plain ? { plain: "" } : {}),
        },
        [text],
      );
      for (const r of over) {
        if (!drawn.includes(r.id)) drawn.push(r.id);
        lastNode.set(r.id, wrapped);
        lastLink.set(r.id, piece.linked);
      }
      // A thread's one tab stop: the first plain segment it owns.
      if (plain && !focused.has(owner.id)) {
        focused.add(owner.id);
        wrapped.attrs.focus = "";
      }
      out.push(wrapped);
    }
    const parentMap = replaced.get(piece.parent) ?? new Map();
    parentMap.set(piece.index, out);
    replaced.set(piece.parent, parentMap);
  }
  for (const [parent, map] of replaced)
    parent.children = parent.children.flatMap(
      (child, index) => map.get(index) ?? [child],
    );
  // Each thread's count pill follows its last segment. A thread that owns no plain segment
  // (another covers exactly its words, or it quotes only a mention or link text) has no highlight
  // tab stop, so its pill is its keyboard path.
  const append = (attrs: Record<string, string>, key: string, id: string) => {
    attrs[key] = attrs[key] ? `${attrs[key]} ${id}` : id;
  };
  const afterLink = new Map<El, El>();
  for (const [id, node] of lastNode) {
    const linked = lastLink.get(id);
    // A pill (a button) never sits inside a link: it follows the link instead.
    let holder = node;
    if (linked) {
      holder = afterLink.get(linked.link) ?? el("annotation-pills");
      if (!afterLink.has(linked.link)) {
        afterLink.set(linked.link, holder);
        const at = linked.parent.children.indexOf(linked.link);
        linked.parent.children.splice(at + 1, 0, holder);
      }
    }
    append(holder.attrs, "last", id);
    if (!focused.has(id)) append(holder.attrs, "pillFocus", id);
  }
  tree.splice(0, tree.length, ...holder.children);
  return drawn;
}

function fromMarkdown(
  source: string,
  liveBlockKinds: readonly LiveBlockKind[],
): DocNode[] {
  const outer = reader;
  reader = readerFor(liveBlockKinds);
  try {
    return blocks(lex(source));
  } finally {
    reader = outer;
  }
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
  // `TextEdit`'s toggles and media blocks (`renderHTML`).
  "details",
  "summary",
  "video",
  "audio",
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
  "height",
  "start",
  "colspan",
  "rowspan",
  "align",
  "class",
  "type",
  "checked",
  "data-type",
  "data-checked",
  "data-snapshot",
  "data-query",
  // `TextEdit` writes a block id as `data-blockId` (read lowercased); `data-block-id` is read too.
  "data-blockid",
  "data-block-id",
  "width",
  // `TextEdit`'s HTML: a toggle's state, a mention's target, a callout's and a toggle's slots.
  "open",
  "data-kind",
  "data-id",
  "data-label",
  "data-slot",
  "data-tone",
  // A highlight's colour (`<mark data-color>`).
  "data-color",
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
  return withSchemaNodes(root.children);
}

/** The callout tones `TextEdit` writes (`data-tone`). */
const CALLOUT_TONES = new Set(Object.keys(CALLOUT_STYLE));

/**
 * `TextEdit`'s HTML (`renderHTML`) for the nodes the tree has its own elements for, rebuilt as
 * those: a mention span as a mention, a toggle's summary `div` as its summary, a callout's `div`s
 * as a callout, a live task list and a video embed (when its link is an allowlisted video URL; any
 * other embed `div` keeps its link). Everything else stays as read.
 */
function withSchemaNodes(nodes: DocNode[]): DocNode[] {
  return nodes.map((node) => {
    if (typeof node === "string") return node;
    const slot = node.attrs["data-slot"];
    if (node.tag === "span" && node.attrs["data-type"] === "mention") {
      const kind = node.attrs["data-kind"] ?? "";
      if (isMentionKind(kind))
        return el("mention", {
          kind,
          id: node.attrs["data-id"] ?? "",
          label: node.attrs["data-label"] ?? textOf(node).replace(/^@/, ""),
        });
    }
    if (node.tag === "div" && node.attrs["data-type"] === "task-query")
      return el("tasks", {
        kind: node.attrs["data-kind"] ?? "tasks",
        id: node.attrs["data-blockid"] ?? node.attrs["data-block-id"] ?? "",
        query: node.attrs["data-query"] ?? "{}",
        snapshot: node.attrs["data-snapshot"] ?? "",
      });
    if (node.tag === "div" && node.attrs["data-type"] === "embed") {
      const link = node.children.find(
        (child): child is El => typeof child !== "string" && child.tag === "a",
      );
      const url = link?.attrs.href ?? "";
      if (matchEmbed(url)) return el("embed", { url });
    }
    if (node.tag === "div" && node.attrs["data-type"] === "bookmark") {
      const link = node.children.find(
        (child): child is El => typeof child !== "string" && child.tag === "a",
      );
      const url = node.attrs["data-url"] ?? link?.attrs.href ?? "";
      if (/^https?:\/\//i.test(url)) return el("bookmark", { url });
    }
    const children = withSchemaNodes(node.children);
    if (node.tag === "div" && slot === "toggle-summary")
      return el("summary", {}, children);
    if (node.tag === "div" && slot === "toggle")
      return el("details", "open" in node.attrs ? { open: "" } : {}, children);
    if (node.tag === "div" && slot === "callout") {
      const tone = node.attrs["data-tone"] ?? "note";
      const content = children.find(
        (child): child is El =>
          typeof child !== "string" &&
          child.attrs["data-slot"] === "callout-content",
      );
      return el(
        "callout",
        { tone: CALLOUT_TONES.has(tone) ? tone : "note" },
        content ? content.children : children,
      );
    }
    node.children = children;
    return node;
  });
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

/**
 * The task mention a checklist line's body leads with — its first paragraph's first inline — or
 * null: a linked line's task (`TextEdit`'s `linkedTaskId`).
 */
function leadingTaskMention(body: DocNode[]): El | null {
  const first = body.find(
    (child) => typeof child !== "string" || child.trim() !== "",
  );
  if (!first || typeof first === "string") return null;
  // A loose item's text is a paragraph; a tight one's sits in the item itself.
  let inline = first.tag === "p" ? first.children[0] : first;
  // A comment on the mention wraps it in its highlight: the mention is inside.
  while (inline && typeof inline !== "string" && inline.tag === "annotation")
    inline = inline.children[0];
  return inline &&
    typeof inline !== "string" &&
    inline.tag === "mention" &&
    inline.attrs.kind === "task" &&
    inline.attrs.id
    ? inline
    : null;
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
    const base = new URL("https://relative-image.invalid/");
    const url = new URL(src, base);
    // A truly relative path inherits either base. Absolute/network-path URLs must not
    // gain local status by naming our fixed sentinel origin explicitly.
    const relative =
      url.origin === base.origin &&
      new URL(src, "https://other-relative-image.invalid/").origin ===
        "https://other-relative-image.invalid";
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      (relative || allowed.has(url.origin) || allowed.has("*"))
    );
  } catch {
    return false;
  }
}

interface RenderContext {
  /** Rendering inside a line of text (a paragraph, a heading, a cell): no figures there. */
  inText?: boolean;
  /** This image stands alone in its run (\`loneImages\`): titled, it is a figure. */
  figure?: boolean;
  images: ReadonlySet<string>;
  headingOffset: number;
  annotationCounts: Map<string, number>;
  activeAnnotationId?: string | null;
  onAnnotationClick?: (id: string) => void;
  showCounts: "never" | "auto" | "always";
  annotationLabel: (quote: string, count: number) => string;
  annotationCountLabel: (count: number) => string;
  /** The words each drawn annotation quotes, for its accessible name. */
  annotationQuotes: Map<string, string>;
  headingLinkHref?: (anchor: MarkdownHeadingAnchor) => string | null;
  toggleState?: MarkdownToggleState;
  tableLabel?: string;
  mentionHref?: (kind: MentionKind, id: string) => string | null;
  mentionImage?: (id: string) => string | null | undefined;
  mentionStatus?: MarkdownViewProps["mentionStatus"];
  /** `onTaskOpen`: a linked checklist line draws as a `TaskInline`. */
  onTaskOpen?: (taskId: string) => void;
  /** The task mention leading the task item being drawn (`onTaskOpen`): it draws as the line's title. */
  leadingTask?: El;
  fileLinkPrefix: string;
  embeds?: EmbedProviders;
  fileContentType?: (href: string) => string | null | undefined;
  citation?: (n: number) => MarkdownCitation | null | undefined;
  /** Fenced languages drawn by a block view (```mermaid → a diagram). */
  blockViews?: BlockViews;
  /** Draws a live block in place of its stored snapshot (`liveBlockRenderer`). */
  renderLiveBlock?: LiveBlockRender;
  /** The kinds the view reads: a block's snapshot card takes its kind's heading and row kind. */
  liveBlockKinds: readonly LiveBlockKind[];
  /**
   * Mark what the anchor text reads differently from the DOM (`data-anchor-text`): a mention or
   * file chip, a blocked image or media block — set while selections can be commented on.
   */
  anchorAttrs: boolean;
  /** Each top-level block a marked section reaches, with its section's mark (`sectionMarks`). */
  sections?: Map<El, { mark: MarkdownSectionMark; heading: boolean }>;
  onSectionMark?: (key: string) => void;
}

const TEXT_ALIGN = new Set(["left", "right", "center"]);

/* --- section marks ----------------------------------------------------------------------------*/

/**
 * A marked section (`sectionMarks`): a gutter marker on its heading and a bar along its blocks,
 * drawn beside the text — never moving it. `TextEdit` draws the same marks as decorations.
 */
export interface MarkdownSectionMark {
  /** The section heading's block id (its `data-anchor-id`); the section runs to the next `#`–`###` heading, whatever its level. */
  key: string;
  /** `warning` (may be out of date) or `info` (changed since you last read). */
  tone: "warning" | "info";
  /** The marker's accessible name and tooltip ("May be out of date"). */
  label: string;
}

/**
 * The section bar: a 2px rule in the block gutter, drawn by `::after` so nothing moves. A block's
 * rule reaches 24px up across the gap above it, so the bar runs unbroken from the heading to the
 * section's last block; the marker is a 24×24 target centred on it at the heading's first line.
 *
 * In the editor the bar clears the drag grip (which spans 20px→4px before the text; on touch
 * 28px→4px, its hit area reaching 38px): its centre is 32px before the text (50px on touch),
 * where the marker's box ends at the grip's left edge. A read view has no grip: 32px out, and 8px
 * on a phone, whose gutter is 16px.
 */
const SECTION_BAR =
  "relative after:pointer-events-none after:absolute after:bottom-0 after:w-0.5 after:rounded-full after:content-['']";
const SECTION_MARKER =
  "absolute top-[calc(0.5lh-12px)] z-[1] flex size-6 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 [&>span]:size-2 [&>span]:rounded-full [&>span]:ring-2 [&>span]:ring-background";

/** A marked section's classes — its heading's, its other blocks', the marker's and its dot's — with the bar `at` its gutter offset and the marker's `marker` offset. */
function sectionClasses(at: string, marker: string) {
  return {
    heading: {
      warning: cn(SECTION_BAR, at, "after:top-0 after:bg-warning"),
      info: cn(SECTION_BAR, at, "after:top-0 after:bg-info"),
    },
    block: {
      warning: cn(SECTION_BAR, at, "after:-top-6 after:bg-warning"),
      info: cn(SECTION_BAR, at, "after:-top-6 after:bg-info"),
    },
    marker: cn(SECTION_MARKER, marker),
    dot: { warning: "bg-warning", info: "bg-info" },
  } as const;
}

/** `TextEdit`'s section marks: the bar and marker clear of its drag grip. */
export const sectionMarkClassNames = sectionClasses(
  "after:-start-[33px] pointer-coarse:after:-start-[51px]",
  "-start-[44px] pointer-coarse:-start-[62px]",
);
/** `MarkdownView`'s: no grip to clear, and inside a phone's 16px gutter. */
const readSectionMarkClassNames = sectionClasses(
  "after:-start-[33px] max-sm:after:-start-[9px]",
  "-start-[44px] max-sm:-start-[16px] max-sm:w-4",
);

/**
 * Whether a heading at `level` starts a section: `#`–`###`. Sections are a flat partition — each
 * runs from its heading to the next such heading, whatever its level — so a page's marks never
 * nest; a `####` and deeper is a block of its section. Shared with `TextEdit`.
 */
export function sectionHeading(level: unknown): boolean {
  const n = Number(level) || 1;
  return n >= 1 && n <= 3;
}

/**
 * The top-level blocks each mark reaches: a marked heading (by block id) and every block up to the
 * next section heading (`sectionHeading`) — the same partition `TextEdit` decorates.
 */
function sectionsOf(
  tree: DocNode[],
  marks: readonly MarkdownSectionMark[],
): Map<El, { mark: MarkdownSectionMark; heading: boolean }> {
  const out = new Map<El, { mark: MarkdownSectionMark; heading: boolean }>();
  if (marks.length === 0) return out;
  const byKey = new Map(marks.map((mark) => [mark.key, mark]));
  let current: MarkdownSectionMark | null = null;
  for (const node of tree) {
    if (typeof node === "string") continue;
    const heading = /^h([1-6])$/.exec(node.tag);
    if (heading && sectionHeading(Number(heading[1]))) {
      const key = node.attrs["data-anchor-id"];
      current = (key ? byKey.get(key) : undefined) ?? null;
      if (current) out.set(node, { mark: current, heading: true });
      continue;
    }
    if (current) out.set(node, { mark: current, heading: false });
  }
  return out;
}

/**
 * The top-level blocks, each a marked section reaches wearing its bar (`sectionMarks`). A plain
 * element wears it itself; a component's block (a table's scroll box, a code block, a diagram) is
 * wrapped in a box that does, since its own overflow would clip the bar. The box has no padding
 * or border, so the block's margins pass through it unchanged.
 */
function renderTop(nodes: DocNode[], ctx: RenderContext): React.ReactNode[] {
  if (!ctx.sections?.size) return render(nodes, ctx);
  const lone = loneImages(nodes);
  return nodes.map((node, index) => {
    const out = renderNode(
      node,
      index,
      lone.has(node as El) ? { ...ctx, figure: true } : ctx,
    );
    const section =
      typeof node === "string" ? undefined : ctx.sections!.get(node);
    if (!section || !React.isValidElement<{ className?: string }>(out))
      return out;
    const { tone } = section.mark;
    const bar = section.heading
      ? readSectionMarkClassNames.heading[tone]
      : readSectionMarkClassNames.block[tone];
    if (typeof out.type !== "string")
      return (
        <div
          key={index}
          data-slot="markdown-section-block"
          data-section-mark={tone}
          className={bar}
        >
          {out}
        </div>
      );
    return React.cloneElement(out, {
      className: cn(out.props.className, bar),
      "data-section-mark": tone,
    } as { className: string });
  });
}

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
  const lone = ctx.inText ? null : loneImages(nodes);
  return nodes.map((node, index) =>
    renderNode(
      node,
      index,
      lone?.has(node as El) ? { ...ctx, figure: true } : ctx,
    ),
  );
}

/**
 * The images among `nodes` that stand alone in their run of inline content — no text, no other
 * inline element beside them before the next block — so a titled one shows as a figure. An image
 * inside a sentence (or inline markup, or a line of text: `inText`) stays an image.
 */
function loneImages(nodes: DocNode[]): Set<El> {
  const lone = new Set<El>();
  let run: DocNode[] = [];
  const close = () => {
    const significant = run.filter(
      (each) => typeof each !== "string" || each.trim(),
    );
    const only = significant.length === 1 ? significant[0] : null;
    if (only && typeof only !== "string" && only.tag === "img") lone.add(only);
    run = [];
  };
  for (const node of nodes) {
    if (typeof node === "string" || INLINE_TAGS.has(node.tag)) run.push(node);
    else close();
  }
  close();
  return lone;
}

function renderNode(
  node: DocNode,
  key: number,
  ctx: RenderContext,
): React.ReactNode {
  if (typeof node === "string") return node;
  const { tag, attrs } = node;
  // Inside a line of text or inline markup, an image is never a figure.
  const textual = TEXT_BLOCKS.has(tag) || INLINE_TAGS.has(tag);
  const children = () =>
    render(
      node.children,
      textual && !ctx.inText
        ? { ...ctx, inText: true, figure: false }
        : { ...ctx, figure: false },
    );

  const heading = /^h([1-6])$/.exec(tag);
  if (heading) {
    const level = Math.min(
      6,
      Math.max(1, Number(heading[1]) + ctx.headingOffset),
    );
    const anchorId = attrs["data-anchor-id"];
    const href =
      attrs.id && ctx.headingLinkHref
        ? ctx.headingLinkHref({ id: anchorId, slug: attrs.id })
        : null;
    const section = ctx.sections?.get(node);
    return React.createElement(
      `h${level}`,
      {
        key,
        id: attrs.id,
        "data-anchor-id": anchorId,
        // A tap on a heading focuses it (never a tab stop), which shows its link on touch.
        tabIndex: href ? -1 : undefined,
        className: href ? "group/heading relative outline-none" : undefined,
      },
      section?.heading ? (
        <MarkdownSectionMarker
          key="section-mark"
          markKey={section.mark.key}
          tone={section.mark.tone}
          label={section.mark.label}
          onMark={ctx.onSectionMark}
          className={readSectionMarkClassNames.marker}
          dotClassName={readSectionMarkClassNames.dot[section.mark.tone]}
        />
      ) : null,
      ...children(),
      href ? (
        <MarkdownHeadingLink
          key="heading-link"
          href={href}
          heading={headingText(node)}
        />
      ) : null,
    );
  }

  // An image on a line of its own is a block, as TextEdit has it: a figure (its title the caption,
  // under it at its start, not a tooltip), so the read view and the editor lay it out alike.
  if (tag === "p") {
    const only = node.children.filter(
      (child) => typeof child !== "string" || child.trim(),
    );
    const image = only.length === 1 ? only[0] : null;
    if (image && typeof image !== "string" && image.tag === "img")
      return renderNode(image, key, { ...ctx, figure: true });
  }

  switch (tag) {
    // A highlight segment and the count pills after it; `annotation-pills` holds only the pills
    // of threads whose last segment is a link's text (a pill never sits inside a link).
    case "annotation":
    case "annotation-pills": {
      const id = attrs.id ?? "";
      const ids = (attrs.ids ?? id).split(" ");
      const active =
        ctx.activeAnnotationId != null && ids.includes(ctx.activeAnnotationId);
      const open = ctx.onAnnotationClick;
      const focus = open !== undefined && attrs.focus !== undefined;
      const label = (thread: string) =>
        ctx.annotationLabel(
          ctx.annotationQuotes.get(thread) ?? "",
          Math.max(1, ctx.annotationCounts.get(thread) ?? 1),
        );
      // A click opens this segment's own thread and goes no further (no outer handler, no second
      // thread).
      const activate = (event: React.SyntheticEvent) => {
        event.stopPropagation();
        open?.(id);
      };
      const span =
        tag === "annotation-pills" ? null : (
          <span
            key={key}
            data-slot="text-edit-annotation"
            data-annotation={id}
            data-annotations={ids.length > 1 ? ids.join(" ") : undefined}
            data-active={active ? "" : undefined}
            data-annotation-focus={focus ? "" : undefined}
            className={cn(
              annotationHighlightClassName,
              active && annotationActiveClassName,
            )}
            // In view mode the first plain segment a thread owns is its one tab stop, a button named
            // for the whole quote; its other plain segments are hidden from assistive technology,
            // which heard them in that name. A mention or a link's text is never hidden or made a
            // button (it is a control of its own), and segments never nest — so nothing focusable
            // ever sits under aria-hidden or inside the button.
            {...(open
              ? focus
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": label(id),
                    onClick: activate,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      activate(event);
                    },
                  }
                : attrs.plain !== undefined
                  ? { "aria-hidden": true, onClick: activate }
                  : { onClick: activate }
              : {})}
          >
            {children()}
          </span>
        );
      const pillFocus = new Set((attrs.pillFocus ?? "").split(" "));
      const pills = (attrs.last ?? "")
        .split(" ")
        .filter(Boolean)
        // A thread with no tab stop of its own always shows its pill: it is the keyboard path.
        .filter(
          (thread) =>
            ctx.showCounts !== "never" || (open && pillFocus.has(thread)),
        )
        .map((thread) => {
          const count = Math.max(1, ctx.annotationCounts.get(thread) ?? 1);
          const tabStop = open !== undefined && pillFocus.has(thread);
          return (
            <span
              key={`pill:${thread}`}
              data-slot="text-edit-annotation-count"
              data-annotation-count={thread}
              data-active={ctx.activeAnnotationId === thread ? "" : undefined}
              className={cn(
                annotationCountClassName,
                annotationCountVisibilityClassName[
                  tabStop || ctx.showCounts === "never"
                    ? "always"
                    : ctx.showCounts
                ],
              )}
              {...(open
                ? {
                    role: "button",
                    // Not a tab stop when the highlight is one: the highlight is the keyboard path.
                    tabIndex: tabStop ? 0 : -1,
                    ...(tabStop ? { "aria-label": label(thread) } : {}),
                    onClick: (event: React.MouseEvent) => {
                      event.stopPropagation();
                      open(thread);
                    },
                    ...(tabStop
                      ? {
                          onKeyDown: (event: React.KeyboardEvent) => {
                            if (event.key !== "Enter" && event.key !== " ")
                              return;
                            event.preventDefault();
                            event.stopPropagation();
                            open(thread);
                          },
                        }
                      : {}),
                  }
                : {})}
            >
              <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
              {tabStop ? null : (
                <span className="sr-only">
                  {ctx.annotationCountLabel(count)}
                </span>
              )}
            </span>
          );
        });
      if (!pills.length) return span;
      if (!span) return <React.Fragment key={key}>{pills}</React.Fragment>;
      return (
        <React.Fragment key={key}>
          {span}
          {pills}
        </React.Fragment>
      );
    }
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
      const closed = ctx.mentionStatus?.(kind, attrs.id ?? "");
      if (
        ctx.leadingTask === node &&
        ctx.onTaskOpen &&
        !(attrs.id ?? "").startsWith(RESTRICTED_MENTION_PREFIX)
      ) {
        const open = ctx.onTaskOpen;
        const id = attrs.id ?? "";
        return (
          <MarkdownTaskInline
            key={key}
            id={id}
            label={attrs.label ?? ""}
            done={attrs["data-line-checked"] === "true"}
            state={closed ?? null}
            href={ctx.mentionHref ? ctx.mentionHref(kind, id) : undefined}
            onOpen={() => open(id)}
            {...(ctx.anchorAttrs
              ? { "data-anchor-text": `@${attrs.label ?? ""}` }
              : {})}
          />
        );
      }
      return (
        <InlineChip
          key={key}
          kind={kind}
          targetId={attrs.id ?? ""}
          label={attrs.label ?? ""}
          // No state of the surface's own: the chip asks the provider's (`InlineChipResolver.state`).
          struck={closed ? closed.struck === true : undefined}
          done={closed ? closed.done === true : undefined}
          status={closed ? closed.status : undefined}
          // The view's own props win over the provider's only when the host passed them.
          href={
            ctx.mentionHref ? ctx.mentionHref(kind, attrs.id ?? "") : undefined
          }
          image={
            kind === "user" ? ctx.mentionImage?.(attrs.id ?? "") : undefined
          }
          {...(ctx.anchorAttrs
            ? { "data-anchor-text": `@${attrs.label ?? ""}` }
            : {})}
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
            {...(ctx.anchorAttrs ? { "data-anchor-text": name } : {})}
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
      const sized: { alt: string; width?: number; height?: number } =
        attrs["data-alt-read"] !== undefined
          ? { alt: attrs.alt ?? "" }
          : parseImageAlt(attrs.alt ?? "");
      const alt = sized.alt;
      if (!imageSourceAllowed(src, ctx.images)) {
        return (
          <span
            key={key}
            data-slot="markdown-image-blocked"
            data-anchor-text={ctx.anchorAttrs ? LEAF_TEXT : undefined}
            className="my-2 block rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
          >
            {alt || "Remote image blocked"}
          </span>
        );
      }
      const remote =
        new URL(src, "https://relative-image.invalid/").origin ===
        new URL(src, "https://other-relative-image.invalid/").origin;
      const width =
        sized.width ?? (Number.parseInt(attrs.width ?? "", 10) || undefined);
      const height = width
        ? (sized.height ??
          (Number.parseInt(attrs.height ?? "", 10) || undefined))
        : undefined;
      const picture = (
        // Plain <img>: registry source is framework-agnostic (no next/image dependency). Frame and
        // rhythm come from `prose.img` on the root. A known size reserves its box before it loads.
        <img
          data-slot="markdown-image"
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={
            ctx.figure || height
              ? {
                  // In its figure the image has no margin of its own: the figure keeps the rhythm.
                  ...(ctx.figure ? { margin: 0 } : {}),
                  ...(height ? { aspectRatio: `${width} / ${height}` } : {}),
                }
              : undefined
          }
          title={ctx.figure ? undefined : attrs.title}
          loading="lazy"
          decoding="async"
          referrerPolicy={remote ? "no-referrer" : undefined}
        />
      );
      // An image standing as a block (a line of its own, TextEdit's HTML, a tight list item) is a
      // figure, its title the caption — the box TextEdit draws, so the swap moves nothing; inside a
      // line of text it stays an image with its title.
      const caption = attrs.title?.trim() ?? "";
      return ctx.figure ? (
        <figure key={key} data-slot="markdown-figure">
          {picture}
          {caption ? (
            <figcaption
              data-slot="markdown-figure-caption"
              className="mt-1.5 text-sm leading-snug text-muted-foreground wrap-break-word"
            >
              {caption}
            </figcaption>
          ) : null}
        </figure>
      ) : (
        <React.Fragment key={key}>{picture}</React.Fragment>
      );
    }
    case "pre": {
      const code = childElements(node).find((child) => child.tag === "code");
      const language = /language-([\w-]+)/.exec(code?.attrs.class ?? "")?.[1];
      // The code as written: an intentional final newline stays (shown, copied, anchored).
      const raw = textOf(code ?? node);
      // A language a block view draws (```mermaid): its preview, after hydration only.
      const view = language ? ctx.blockViews?.[language] : undefined;
      if (view && language)
        return (
          <MarkdownBlockView
            key={key}
            view={view}
            language={language}
            source={raw}
          />
        );
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
      // contract); the box fades at an edge with more beyond it and is a named region meanwhile.
      return (
        <MarkdownTableScroll key={key} label={ctx.tableLabel}>
          <table>{children()}</table>
        </MarkdownTableScroll>
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
      const leading = ctx.onTaskOpen ? leadingTaskMention(body) : null;
      if (leading) leading.attrs["data-line-checked"] = String(checked);
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
            shape={leading ? "circle" : undefined}
            aria-label={checked ? "Done" : "Not done"}
            disabled
            className="pointer-events-none inline-flex me-1.5 align-middle disabled:opacity-100"
          />
          <div data-slot="task-item-content">
            {render(body, leading ? { ...ctx, leadingTask: leading } : ctx)}
          </div>
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
    case "mark":
      // A highlight (`==text==`, TextEdit's `<mark data-color>`): its colour from the palette.
      return (
        <mark
          key={key}
          data-color={
            isHighlightColor(attrs["data-color"])
              ? attrs["data-color"]
              : DEFAULT_HIGHLIGHT_COLOR
          }
        >
          {children()}
        </mark>
      );
    case "details": {
      const fallback = attrs.open !== undefined;
      const state = ctx.toggleState;
      if (!state)
        return (
          <details key={key} open={fallback || undefined}>
            {children()}
          </details>
        );
      // Each reader's own open state, by the toggle's id (its block id, in document order).
      const id =
        state.ids?.[Number(attrs["data-toggle"])] ??
        `toggle-${attrs["data-toggle"]}`;
      const open = state.isOpen(id, fallback);
      return (
        <details
          key={key}
          data-toggle-id={id}
          open={open || undefined}
          onToggle={(event) => {
            const next = (event.currentTarget as HTMLDetailsElement).open;
            if (next !== state.isOpen(id, fallback)) state.onToggle(id, next);
          }}
        >
          {children()}
        </details>
      );
    }
    case "summary":
      // A real chevron (the native marker is hidden): right when closed, down when open.
      return (
        <summary key={key} data-slot="toggle-summary">
          <Play aria-hidden data-slot="toggle-icon" />
          {children()}
        </summary>
      );
    case "embed":
      return (
        <MarkdownEmbed key={key} url={attrs.url ?? ""} providers={ctx.embeds} />
      );
    case "bookmark":
      return <MarkdownBookmark key={key} url={attrs.url ?? ""} />;
    case "tasks": {
      const snapshot = attrs.snapshot ?? "";
      const drawn = ctx.renderLiveBlock?.(attrs.kind ?? "tasks", {
        blockId: attrs.id ?? "",
        query: queryOf(attrs.query),
        snapshot,
        editable: false,
      });
      // One atom in a comment anchor's text, as TextEdit counts the node, whoever draws it.
      return drawn != null ? (
        <div
          key={key}
          data-slot="markdown-task-query"
          data-anchor-text={ctx.anchorAttrs ? LEAF_TEXT : undefined}
          data-anchor-block={ctx.anchorAttrs ? "" : undefined}
        >
          {drawn}
        </div>
      ) : (
        <MarkdownLiveBlock
          key={key}
          snapshot={snapshot}
          kind={ctx.liveBlockKinds.find(
            (k) => k.name === (attrs.kind ?? "tasks"),
          )}
          mentionHref={ctx.mentionHref}
          data-anchor-text={ctx.anchorAttrs ? LEAF_TEXT : undefined}
          data-anchor-block={ctx.anchorAttrs ? "" : undefined}
        />
      );
    }
    case "video":
    case "audio": {
      const src = safeUrl(attrs.src ?? "");
      if (!imageSourceAllowed(src, ctx.images))
        return (
          <span
            key={key}
            data-slot="markdown-image-blocked"
            data-anchor-text={ctx.anchorAttrs ? LEAF_TEXT : undefined}
            data-anchor-block={ctx.anchorAttrs ? "" : undefined}
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
 * What a document prints with (`typeScale="document"`, on `MarkdownView` and `TextEdit` alike):
 * code wraps instead of clipping, a table box lets its table run its full width, comment
 * highlights and their pills and every on-screen control drop out, and an external link prints
 * its address after its text. `DocumentLayout` prints the page around it as one column.
 */
export const documentPrintClassName = cn(
  // Code wraps on paper: `CodeBlock`'s panel carries its own print rule (its white-space is an inline
  // style that a class here could not beat); its copy and wrap controls drop out.
  "print:[&_pre:not([data-slot=code-block-pre])]:whitespace-pre-wrap print:[&_[data-slot=code-block-actions]]:hidden",
  "print:[&_[data-slot=text-edit-annotation]]:bg-transparent print:[&_[data-slot=text-edit-annotation]]:no-underline print:[&_[data-slot=text-edit-annotation-count]]:hidden",
  "print:[&_[data-slot=markdown-table]]:overflow-visible print:[&_.tableWrapper]:overflow-visible print:[&_table]:break-inside-auto print:[&_tr]:break-inside-avoid print:[&_thead]:table-header-group",
  "print:[&_a[href^=http]]:after:content-['_('_attr(href)_')'] print:[&_a[href^=http]]:after:text-muted-foreground print:[&_a[href^=http]]:after:wrap-anywhere",
  "print:[&_[data-slot=callout]]:break-inside-avoid print:[&_img]:break-inside-avoid print:[&_h1]:break-after-avoid print:[&_h2]:break-after-avoid print:[&_h3]:break-after-avoid",
);

/** A heading's block id and slug — one entry of `MarkdownView`'s `headingAnchors`. */
export interface MarkdownHeadingAnchor {
  /** The heading's block id (`blockId`), stable across edits. Absent when the host has none. */
  id?: string;
  /** The heading's slug: its words, hyphenated, `-1`, `-2`… for a repeat (`headingIds`). */
  slug: string;
}

/** Each reader's own open or closed toggles (`MarkdownView`'s `toggleState`). */
export interface MarkdownToggleState {
  /** Whether the toggle with this id is open for this reader; `fallback` is the document's own state. */
  isOpen: (id: string, fallback: boolean) => boolean;
  /** The reader opened or closed a toggle. */
  onToggle: (id: string, open: boolean) => void;
  /** The toggles' ids (their block ids), in document order. Without it, `toggle-0`, `toggle-1`… */
  ids?: readonly string[];
}

/**
 * A mention target's state (`MarkdownViewProps.mentionStatus`): a task's done check, a closed
 * target struck through with a status tag, and — on a linked checklist line drawn as a
 * `TaskInline` (`onTaskOpen`) — its assignee and due date.
 */
export interface MarkdownMentionStatus {
  /** A finished task: its chip leads with a check. @default false */
  done?: boolean;
  /** Strike the label through (a canceled or duplicate task). @default false */
  struck?: boolean;
  /** A small tag after the label ("Canceled"). @default undefined */
  status?: string;
  /** A task's assignee, on a linked line. @default undefined */
  assignee?: TaskInlinePerson | null;
  /** A task's due date, as the host words it, on a linked line. @default undefined */
  due?: string | null;
  /** The due date has passed. @default false */
  overdue?: boolean;
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
  /**
   * Give every heading an `id` — its words, hyphenated, `-1`, `-2`… for a repeat (`headingIds`) —
   * the same ids `TextEdit`'s `onOutlineChange` reports, so an outline links into either.
   * @default false
   */
  headingIds?: boolean;
  /**
   * The type scale. `compact` is the app's own (14px text, a `#` stops at `text-lg`), right for a
   * comment, a message or a card. `document` is a page read as a document (TYP-20): 14/24 text
   * (16/26 on a coarse pointer or a narrow window, where editing is 16px too), 12px between
   * paragraphs, `#` 24 · `##` 20 · `###` 16 with more room above a heading than below, inline code
   * in the body's ink, and print rules (`documentPrintClassName`). `TextEdit`'s `typeScale` is the
   * same overlay, so a page reads and edits at identical metrics.
   * @default "compact"
   */
  typeScale?: "compact" | "document";
  /**
   * Comment highlights over the words each one quotes (resolved through its quote and context,
   * the way `TextEdit` re-anchors). One that matches no text, or two places equally well, draws
   * nothing. Rendered as spans at render time, never by touching the DOM after.
   * @default undefined
   */
  annotations?: readonly MarkdownAnnotation[];
  /**
   * The annotation shown as active: its highlight fills.
   * @default null
   */
  activeAnnotationId?: string | null;
  /**
   * Called with an annotation's id to open its thread: a click on its highlight or its count pill,
   * or Enter / Space on its highlight, which is then a tab stop (a button named by
   * `annotationLabel`). Without it, highlights are neither tab stops nor buttons.
   * @default undefined
   */
  onAnnotationClick?: (id: string) => void;
  /**
   * A count pill after each highlight: `auto` only on a coarse pointer or below the `lg` width
   * (where a comment margin has no room), `always` everywhere, `never` none.
   * @default "never"
   */
  annotationCounts?: "never" | "auto" | "always";
  /**
   * A highlight's accessible name, from its quoted words and count.
   * @default (quote, count) => count > 1 ? `${count} comments on “${quote}”` : `Comment on “${quote}”`
   */
  annotationLabel?: (quote: string, count: number) => string;
  /**
   * The count pill's accessible name (the visible number is `aria-hidden`).
   * @default (count) => count === 1 ? "1 comment" : `${count} comments`
   */
  annotationCountLabel?: (count: number) => string;
  /**
   * Each highlight's top edge (px from this view's top; null when it drew nothing), after render
   * and whenever the view resizes — for laying comments in a margin beside the text.
   * @default undefined
   */
  onAnnotationsLayout?: (items: MarkdownAnnotationLayout[]) => void;
  /**
   * Comment on a selection. Set, selecting words inside the view shows a small floating
   * "Comment" button — `TextEdit`'s read-only selection bubble — and pressing it calls this with
   * the selection's anchor, computed over the same text `annotations` resolve against: pass it
   * straight back as an annotation's `anchor` and exactly the selected words highlight. A mention
   * or an image counts whole; a selection of only whitespace, mentions, images or code shows
   * nothing. The button floats in a `<body>` portal above the selection (below it on a coarse
   * pointer, where the platform's own callout sits above), flips and shifts to stay in view, hides
   * while the selection is scrolled out, closes on Escape, and Tab moves to it from a selection
   * made with the keyboard.
   * @default undefined
   */
  onCreateAnnotation?: (anchor: MarkdownAnnotation["anchor"]) => void;
  /**
   * The selection button's label (`onCreateAnnotation`).
   * @default "Comment"
   */
  commentLabel?: string;
  /**
   * Px the selection button keeps clear at the viewport's top and bottom, beyond its 8px edge gap
   * — the height of a sticky app header or a bottom bar — so it never sits under one, and counts a
   * selection under one as scrolled out.
   * @default undefined
   */
  floatingSafeArea?: { top?: number; bottom?: number };
  /**
   * The headings `#`–`####` with their ids, after render and whenever they change — an outline
   * rail, computed from the Markdown with no editor. Turns `headingIds` on.
   * @default undefined
   */
  onOutlineChange?: (headings: MarkdownOutlineItem[]) => void;
  /**
   * The headings' slugs and block ids, in document order (a server-derived list). A heading whose
   * slug matches its entry takes the slug as its `id` and the block id as `data-anchor-id`, so a
   * `#slug~blockId` link keeps working after the heading moves. Turns `headingIds` on.
   * @default undefined
   */
  headingAnchors?: readonly MarkdownHeadingAnchor[];
  /**
   * Where a heading's link points (a path or an absolute URL). Set, each heading with an id gets a
   * `#` copy-link button in the gutter before its text (after it on a coarse pointer), shown while
   * the heading is hovered, focused or tapped; a press copies the absolute link and says so in a
   * toast. Return `null` for none.
   * @default undefined
   */
  headingLinkHref?: (anchor: MarkdownHeadingAnchor) => string | null;
  /**
   * Marked sections, by their heading's block id (`headingAnchors` sets it): each draws a small
   * marker in the gutter beside its heading (named `label`) and a `tone` bar along the section,
   * beside the text — never moving it. The same marks `TextEdit` draws. A key matching no heading
   * draws nothing.
   * @default undefined
   */
  sectionMarks?: readonly MarkdownSectionMark[];
  /**
   * A section mark's marker was clicked: its `key`. Without it the marker is a labelled dot.
   * @default undefined
   */
  onSectionMark?: (key: string) => void;
  /**
   * Each reader's own open or closed toggles: `isOpen` decides, `onToggle` hears every change.
   * Without it, a toggle opens as the document says and is forgotten on reload.
   * @default undefined
   */
  toggleState?: MarkdownToggleState;
  /**
   * Find in the rendered text: every match is highlighted (the CSS Custom Highlight API, so the
   * DOM is never changed), the first scrolls into view (any toggle around it opens), and a match
   * bar shows "1 of 12" with previous and next. Where the API is missing, it only scrolls.
   * @default undefined
   */
  findQuery?: string;
  /**
   * The match bar's close button (and Escape inside the bar).
   * @default undefined
   */
  onFindClose?: () => void;
  /**
   * The match bar's strings.
   * @default undefined
   */
  findLabels?: MarkdownViewEffectsProps["findLabels"];
  /**
   * A table box's accessible name while its table scrolls sideways.
   * @default "Table, scrolls sideways"
   */
  tableLabel?: string;
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
   * A target's state, by kind and id: `{ done: true }` gives a finished task's chip its check (a
   * task chip shows the task glyph otherwise); `{ struck: true, status: "Canceled" }` strikes the
   * chip's label through and adds a small status tag (a canceled or duplicate task). `null` leaves
   * the chip to the `InlineChipProvider`'s `state`; `{}` is a plain chip. Any state given here
   * replaces the provider's whole answer.
   * @default undefined
   */
  mentionStatus?: (
    kind: MentionKind,
    id: string,
  ) => MarkdownMentionStatus | null | undefined;
  /**
   * A linked checklist line — a task item whose first inline is a task mention — draws as a
   * `TaskInline`: one round box, the title (a click calls this: open the task's peek), the
   * assignee's avatar and the due date (`mentionStatus`'s `assignee`, `due`, `overdue`, else the
   * `InlineChipProvider`'s `state`) and ↗ to its page (`mentionHref`) on hover — as `TextEdit` does
   * with the same prop. Without it the line is a checkbox and a task chip.
   * @default undefined
   */
  onTaskOpen?: (taskId: string) => void;
  /**
   * A link whose href starts with this renders as a file chip — an icon for the file's type and
   * its name. `""` turns file chips off.
   * @default "/api/files/"
   */
  fileLinkPrefix?: string;
  /**
   * The video providers whose links alone on a line render as a player facade (`MarkdownEmbed`):
   * `EMBED_PROVIDERS` from `@/lib/embed-providers`, or a subset. Opt-in — without it such a line is
   * a plain link, so nothing is framed until the page allows `EMBED_FRAME_ORIGINS` in `frame-src`.
   * @default undefined
   */
  embeds?: EmbedProviders;
  /**
   * Draws a live task list (`:::tasks{…}` … `:::`) — a host component that fetches the list for
   * this reader — in place of its stored snapshot. Called with `editable: false`. Without it (and
   * where it returns `null`/`undefined`) the snapshot shows as a quiet list (`MarkdownLiveBlock`):
   * a public view never gets live data. The function runs during render; pass it from a client
   * component, or build the view on the server.
   * @default undefined
   */
  renderTaskQuery?: (props: TaskQueryRenderProps) => React.ReactNode;
  /**
   * Draws a live block of any kind (`:::<kind>{…}` … `:::`, a name in `liveBlockKinds`) in place
   * of its stored snapshot, called with the block's kind and `editable: false`. Given, it is asked
   * for every kind, `tasks` included, and `renderTaskQuery` is not used. Returning
   * `null`/`undefined` leaves the snapshot (`MarkdownLiveBlock`).
   * @default undefined
   */
  renderLiveBlock?: LiveBlockRender;
  /**
   * The live block kinds this view reads (`:::<name>{…}` … `:::`), each with the heading and row
   * kind its stored snapshot shows with (`MarkdownLiveBlock`); a block of any other name stays
   * text and a list. Markdown only.
   * @default DEFAULT_LIVE_BLOCK_KINDS — the live task list (`tasks`) alone
   */
  liveBlockKinds?: readonly LiveBlockKind[];
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
  /**
   * Fenced languages drawn by a block view instead of as code: `{ mermaid: mermaidBlockView }`
   * draws ```` ```mermaid ```` fences as diagrams. The block shows a header with the view's label,
   * Preview / Code, Expand and a ⋯ menu (Copy source and the view's own actions). The preview is
   * client-only: the server, and the first render before hydration, show the source in the same
   * frame with the preview's height reserved. The entries hold functions, so pass this from a
   * client component (or pass an entry exported by a client module, such as `mermaidBlockView`).
   * @default undefined
   */
  blockViews?: BlockViews;
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
  typeScale = "compact",
  annotations,
  activeAnnotationId = null,
  onAnnotationClick,
  annotationCounts = "never",
  annotationLabel = defaultAnnotationLabel,
  annotationCountLabel = defaultAnnotationCountLabel,
  onAnnotationsLayout,
  onCreateAnnotation,
  commentLabel = "Comment",
  floatingSafeArea,
  onOutlineChange,
  headingAnchors,
  headingLinkHref,
  sectionMarks,
  onSectionMark,
  toggleState,
  findQuery,
  onFindClose,
  findLabels,
  tableLabel,
  mentionHref,
  mentionImage,
  mentionStatus,
  onTaskOpen,
  fileLinkPrefix = "/api/files/",
  embeds,
  fileContentType,
  citation,
  blockViews,
  renderTaskQuery,
  renderLiveBlock,
  liveBlockKinds = DEFAULT_LIVE_BLOCK_KINDS,
  className,
  ...props
}: MarkdownViewProps) {
  // How the client effects find this view (server-safe: `useId` exists in a server render).
  const viewId = React.useId();
  const source = typeof children === "string" ? children : (content ?? "");

  if (!source.trim()) return null;

  const parsed =
    format === "html" ? fromHtml(source) : fromMarkdown(source, liveBlockKinds);
  const tree = citation && format !== "html" ? withCitations(parsed) : parsed;

  // Headings: ids (their words, or the host's slugs and block ids) and the outline.
  const headings: El[] = [];
  const details: El[] = [];
  const walk = (nodes: DocNode[]) => {
    for (const node of nodes) {
      if (typeof node === "string") continue;
      if (/^h[1-6]$/.test(node.tag)) headings.push(node);
      else {
        if (node.tag === "details") details.push(node);
        walk(node.children);
      }
    }
  };
  walk(tree);
  details.forEach((node, index) => {
    node.attrs["data-toggle"] = String(index);
  });
  const outline: MarkdownOutlineItem[] = [];
  if (withHeadingIds || headingAnchors || headingLinkHref || onOutlineChange) {
    const texts = headings.map(headingText);
    headingIds(texts).forEach((id, index) => {
      const node = headings[index]!;
      const anchor = headingAnchors?.[index];
      // The host's entry holds only while it is still this heading (same slug at the same place).
      node.attrs.id = id;
      if (anchor && anchor.slug === id && anchor.id)
        node.attrs["data-anchor-id"] = anchor.id;
      const level = Number(node.tag[1]);
      if (level <= 4)
        outline.push({
          id,
          level: level as MarkdownOutlineItem["level"],
          text: texts[index]!,
          ...(node.attrs["data-anchor-id"]
            ? { anchorId: node.attrs["data-anchor-id"] }
            : {}),
        });
    });
  }

  // The text comment anchors are offsets into, taken before highlights cut the tree: a selection's
  // anchor is computed over it, so it resolves back onto exactly the selected words.
  const anchorText = onCreateAnnotation
    ? anchorTextOf(el("root", {}, tree)).text
    : undefined;
  // Comment highlights, cut into the tree's text before it renders.
  if (annotations?.length) annotate(tree, annotations);
  const annotationQuotes = new Map<string, string>();
  for (const annotation of annotations ?? [])
    annotationQuotes.set(
      annotation.id,
      annotation.anchor.quote.replace(/\s+/g, " ").trim(),
    );

  const effects =
    onOutlineChange !== undefined ||
    onAnnotationsLayout !== undefined ||
    onCreateAnnotation !== undefined ||
    Boolean(findQuery?.trim()) ||
    details.length > 0;

  const view = (
    <div
      data-slot="markdown-view"
      data-type-scale={typeScale}
      data-view-id={effects ? viewId : undefined}
      data-finding={findQuery?.trim() ? "" : undefined}
      className={cn(
        typeScale === "document" ? documentProse : compactProse,
        className,
      )}
      {...props}
    >
      {findQuery?.trim() ? (
        <style href="markdown-view-find" precedence="default">
          {FIND_HIGHLIGHT_CSS}
        </style>
      ) : null}
      {renderTop(tree, {
        images: normalizeAllowedImageOrigins(allowedImageOrigins),
        headingOffset: Math.trunc(headingOffset),
        annotationCounts: new Map(
          (annotations ?? []).map((a) => [a.id, a.count ?? 1]),
        ),
        activeAnnotationId,
        onAnnotationClick,
        showCounts: annotationCounts,
        annotationLabel,
        annotationCountLabel,
        annotationQuotes,
        headingLinkHref,
        toggleState,
        tableLabel,
        mentionHref,
        mentionImage,
        mentionStatus,
        onTaskOpen,
        fileLinkPrefix,
        embeds,
        fileContentType,
        citation,
        blockViews,
        renderLiveBlock: liveBlockRenderer(renderLiveBlock, renderTaskQuery),
        liveBlockKinds,
        anchorAttrs: onCreateAnnotation !== undefined,
        sections: sectionMarks?.length
          ? sectionsOf(tree, sectionMarks)
          : undefined,
        onSectionMark,
      })}
    </div>
  );
  if (!effects) return view;
  // The effects render after the view, never inside it (the find bar is `fixed`, the live region
  // `sr-only`): the document's first and last blocks stay its own.
  return (
    <>
      {view}
      <MarkdownViewEffects
        viewId={viewId}
        outline={onOutlineChange ? outline : undefined}
        onOutlineChange={onOutlineChange}
        onAnnotationsLayout={onAnnotationsLayout}
        annotationIds={annotations?.map((annotation) => annotation.id)}
        findQuery={findQuery}
        content={source}
        onFindClose={onFindClose}
        findLabels={findLabels}
        printToggles={details.length > 0}
        onCreateAnnotation={onCreateAnnotation}
        anchorText={anchorText}
        commentLabel={commentLabel}
        floatingSafeArea={floatingSafeArea}
      />
    </>
  );
}

/**
 * The document type scale merged over the prose recipe with the chips' rules restated after it:
 * `markdownExtrasClassName` carries `[&_details]:my-2`, which the document overlay's `my-4` must
 * beat, so the overlay is merged last.
 */
const documentProse = cn(
  proseDocumentClassName,
  markdownExtrasClassName,
  proseDocumentClassName,
  // An image block and a block view (a diagram) sit 16 from their neighbours, as in the editor.
  "[&_[data-slot=markdown-figure]]:my-4 [&_[data-slot=block-view]]:my-4",
  documentPrintClassName,
);
/**
 * The find highlights (`::highlight()`, painted on a finding view's text only): every match on the
 * warning tint, the current one stronger. A plain hoisted style rather than Tailwind variants —
 * Tailwind's CSS parser does not know the `::highlight()` pseudo-element and warns on every build
 * that scans this file.
 */
const FIND_HIGHLIGHT_CSS = [
  ["vs-find", 20],
  ["vs-find-current", 50],
]
  .map(
    ([name, tint]) =>
      `[data-slot=markdown-view][data-finding]::highlight(${name}),[data-slot=markdown-view][data-finding] *::highlight(${name}){background-color:color-mix(in oklab,var(--warning) ${tint}%,transparent)}`,
  )
  .join("");

/** The app's own scale: the prose recipe and the chips' rules. */
const compactProse = cn(proseClassName, markdownExtrasClassName);

const defaultAnnotationLabel = (quote: string, count: number) =>
  count > 1 ? `${count} comments on “${quote}”` : `Comment on “${quote}”`;
const defaultAnnotationCountLabel = (count: number) =>
  count === 1 ? "1 comment" : `${count} comments`;
