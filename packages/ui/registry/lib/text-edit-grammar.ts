// @vegastack text-edit-grammar@0.26.2 sha256-Hx4UJw26tAGGGiP8qY8oCXaNUT2fkxmEMokRCdUz5zY=

/**
 * text-edit-grammar — the constructs VegaStack Markdown v1 carries beyond CommonMark + GFM, as
 * plain strings and regular expressions: mention links, callout markers, toggles, media blocks,
 * image widths and code-fence info. No dependencies, no React, no DOM — `MarkdownView` (the light
 * read renderer), `TextEdit`'s schema (`@/lib/text-edit-schema`) and server code (search, mention
 * indexing) all read and write the same grammar from here.
 *
 * VegaStack Markdown v1, in one paragraph: CommonMark 0.31 with GFM tables, task lists,
 * strikethrough and autolinks; plus `[@label](mention://<kind>/<id>)` mentions, GitHub's
 * `> [!NOTE]` callouts, `<details><summary>…</summary>` toggles, `<video>`/`<audio>` blocks on a
 * line of their own, `![alt|320](src)` image widths, `lang wrap` fence info and `<br>` line breaks
 * (in a table cell or a heading), `[<url>](<url> "bookmark")` bookmark lines, and
 * `==text==` highlights (`==text=={green}` for a colour), and
 * `:::<name>{…}` … `:::` live blocks — `:::tasks` live task
 * lists and any other block name the host reads (a container directive whose rows are list item
 * lines, with or without a task box). Any other raw HTML is literal text.
 */

/** The VegaStack Markdown version this grammar and `@/lib/text-edit-markdown` read and write. */
export const VEGASTACK_MARKDOWN_VERSION = 1 as const;

/* --- mentions ------------------------------------------------------------------------------------*/

/**
 * The mention kinds the design system knows itself: a person and a member's agent. Every other
 * kind (a page, a task, a customer, …) is the host's: any id matching `MENTION_KIND_PATTERN`
 * reads and writes, and the host names and draws it (`TextEditMentions.kinds`,
 * `InlineChipResolver.kinds`).
 */
export const BUILT_IN_MENTION_KINDS = ["user", "agent"] as const;

/** What a mention points at: a built-in kind, or any host kind matching `MENTION_KIND_PATTERN`. */
export type MentionKind =
  (typeof BUILT_IN_MENTION_KINDS)[number] | (string & {});

/**
 * A mention kind's id, as a regular-expression source (no anchors, no groups): a lowercase letter,
 * then 1–31 lowercase letters, digits or `_`. The same text is a valid PostgreSQL pattern.
 */
export const MENTION_KIND_PATTERN = "[a-z][a-z0-9_]{1,31}";

const MENTION_KIND_ID = new RegExp(`^${MENTION_KIND_PATTERN}$`);

/**
 * Whether `kind` is a well-formed mention kind (`MENTION_KIND_PATTERN`) — a built-in or a host's.
 *
 * @example
 * isMentionKind("family"); // true
 * isMentionKind("Family"); // false
 */
export function isMentionKind(kind: string): kind is MentionKind {
  return MENTION_KIND_ID.test(kind);
}

/**
 * A record mention (anything but a person or a member's agent). Its label is a record's title,
 * which only readers who can open the record may see — so a shared document stores it empty and
 * each reader's chip resolves it. A person's or an agent's name is visible to every member, so
 * theirs is stored.
 */
export function isRecordMentionKind(kind: MentionKind): boolean {
  return kind !== "user" && kind !== "agent";
}

/** A target the reader may not open: the link carries the real id after this prefix. */
export const RESTRICTED_MENTION_PREFIX = "restricted:";

/**
 * `[@<label>](mention://<kind>/<id>)`, unanchored — the source of `MENTION_LINK`. Groups: 1 the
 * label, 2 the kind, 3 the id. The label escapes `\`, `[`, `]` and `` ` `` with a backslash; the kind
 * matches `MENTION_KIND_PATTERN`; the id has no whitespace or parentheses. Build a scanning
 * expression from it (`new RegExp(MENTION_LINK_SOURCE, "g")`) rather than sharing a global one.
 */
export const MENTION_LINK_SOURCE = String.raw`\[@((?:[^\\[\]\n]|\\[^\n])*)\]\(mention:\/\/(${MENTION_KIND_PATTERN})\/([^\s()]+)\)`;

/** A mention link at the start of a string. */
export const MENTION_LINK = new RegExp(`^${MENTION_LINK_SOURCE}`);

/**
 * The same link as a PostgreSQL regular expression (`regexp_replace`, text search), with the same
 * groups as `MENTION_LINK_SOURCE`: 1 the label (escapes kept), 2 the kind, 3 the id.
 */
export const MENTION_LINK_SQL = String.raw`\[@((?:[^\\\[\]\n]|\\[^\n])*)\]\(mention://(${MENTION_KIND_PATTERN})/([^\s()]+)\)`;

/**
 * A label as a mention link carries it: `\`, `[`, `]` and `` ` `` escaped. A bare backtick in one
 * label could pair with one in another (or in the text) into a code span, which Markdown reads
 * before links — the links it crosses would read as code, not mentions.
 */
export function escapeMentionLabel(label: string): string {
  return label.replace(/[\\[\]`]/g, "\\$&");
}

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
  return `[@${escapeMentionLabel(label.replace(/\s*\n\s*/g, " "))}](mention://${kind}/${id})`;
}

/* --- callouts, toggles, media ------------------------------------------------------------------*/

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

/** `[!NOTE]` … `[!CAUTION]` — a callout's first line, inside its blockquote. */
export const CALLOUT_MARKER =
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i;

/** `> [!NOTE]` … — a callout's quote lines, from the start of a Markdown source. */
export const CALLOUT_BLOCK =
  /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)((?:>[^\n]*(?:\n|$))*)/i;

/** `<details><summary>Title</summary>` — the opening line of a toggle (`open` when it starts open). */
export const TOGGLE_OPEN =
  /^<details( open)?>[ \t]*<summary>([^\n]*?)<\/summary>[ \t]*$/;

/** `</details>` — the line that closes a toggle. */
export const TOGGLE_CLOSE = /^<\/details>[ \t]*$/;

/**
 * `<video src="…"></video>` / `<audio src="…"></audio>` on a line of its own — TextEdit's video and
 * audio blocks. Only the `src` is read; any other attribute is ignored.
 */
export const MEDIA_BLOCK =
  /^<(video|audio)\b[^>\n]*?\ssrc="([^"\n]+)"[^>\n]*>[ \t]*<\/\1>[ \t]*$/;

/** A video or audio block's Markdown line; a `"` in the source is percent-encoded. */
export function mediaMarkdown(kind: "video" | "audio", src: string): string {
  return `<${kind} src="${src.replace(/"/g, "%22")}"></${kind}>`;
}

/* --- highlights --------------------------------------------------------------------------------*/

/**
 * The colours a highlight takes, the default first. `==text==` is a highlight in the default
 * colour; `==text=={green}` (the colour in braces right after the closing `==`) is any other. Each
 * colour is drawn on its `tag-<colour>-subtle` token, the text keeping its own ink.
 */
export const HIGHLIGHT_COLORS = [
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
] as const;

/** A highlight's colour (`HIGHLIGHT_COLORS`). */
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/** The colour `==text==` (no suffix) is drawn in. */
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = "yellow";

/** Whether `value` is a highlight colour. */
export function isHighlightColor(value: unknown): value is HighlightColor {
  return (HIGHLIGHT_COLORS as readonly unknown[]).includes(value);
}

/** `{green}` after a highlight's closing `==`: group 1 the colour. */
const HIGHLIGHT_SUFFIX = new RegExp(`^\\{(${HIGHLIGHT_COLORS.join("|")})\\}`);

/**
 * A highlight's colour suffix right after its closing `==`, as a PostgreSQL regular expression:
 * `regexp_replace(text, HIGHLIGHT_SUFFIX_SQL, '==', 'g')` leaves a text's words without the colour
 * names (a search index never matches "green" for a green highlight).
 */
export const HIGHLIGHT_SUFFIX_SQL = `==\\{(?:${HIGHLIGHT_COLORS.join("|")})\\}`;

const SPACE_CHAR = /\s/;

/** How long a link destination may be — marked's bounded link reader reads no further. */
const DESTINATION_WINDOW = 65_536;

/**
 * What a scan of one source knows once: each backtick run's start, by its length (a code span
 * closes on the next run of its own length). Kept on a lexer's frame, so a source is indexed
 * once however many highlights it holds.
 */
interface HighlightIndex {
  source: string;
  runs?: Map<number, number[]>;
  /** `==` that could close a highlight: after neither a space nor a `\`. */
  closers?: number[];
  /** The last scan (`readHighlightAt`). */
  scan?: HighlightScan;
}

/** The index of `frame`'s source (or a fresh one of `source`). */
function highlightIndex(
  frame: LexFrame | null,
  source: string,
): HighlightIndex {
  if (!frame) return { source };
  let index = frame.memo.highlight as HighlightIndex | undefined;
  if (!index) frame.memo.highlight = index = { source: frame.source };
  return index;
}

/** The first of the sorted `positions` at or after `from`; -1 when none. */
function nextAt(positions: readonly number[], from: number): number {
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
 * Where the code span opening at `at` (a backtick run) ends — just past its closing run of exactly
 * the same length — or -1 when nothing closes it (the run is then literal backticks).
 */
function codeSpanEnd(index: HighlightIndex, at: number): number {
  const { source } = index;
  if (!index.runs) {
    index.runs = new Map();
    for (let i = source.indexOf("`"); i !== -1;) {
      let run = 1;
      while (source[i + run] === "`") run++;
      const list = index.runs.get(run);
      if (list) list.push(i);
      else index.runs.set(run, [i]);
      i = source.indexOf("`", i + run);
    }
  }
  let run = 1;
  while (source[at + run] === "`") run++;
  const close = nextAt(index.runs.get(run) ?? [], at + run);
  return close === -1 ? -1 : close + run;
}

/**
 * Where the link destination opening at `at` (the `(` after a link's `]`) ends — just past its
 * `)` — or -1 when it does not close within `DESTINATION_WINDOW`. A `<…>` destination ends at its
 * `>`; a plain one at the `)` that balances its parentheses, past a quoted title. Escapes are
 * skipped; a blank line ends the search.
 */
function destinationEnd(source: string, at: number): number {
  const stop = Math.min(source.length, at + DESTINATION_WINDOW);
  let i = at + 1;
  while (source[i] === " " || source[i] === "\t" || source[i] === "\n") i++;
  if (source[i] === "<") {
    for (i++; i < stop; i++) {
      const ch = source[i]!;
      if (ch === "\\") i++;
      else if (ch === "\n" || ch === "<") return -1;
      else if (ch === ">") break;
    }
    if (i >= stop) return -1;
  }
  let depth = 1;
  for (; i < stop; i++) {
    const ch = source[i]!;
    if (ch === "\\") i++;
    else if (ch === "\n" && source[i + 1] === "\n") return -1;
    else if ((ch === '"' || ch === "'") && /\s/.test(source[i - 1]!)) {
      // A title (`"…"`, `'…'`) after a space: a `)` inside it is its text.
      let close = i + 1;
      while (close < stop && source[close] !== ch && source[close] !== "\n")
        close += source[close] === "\\" ? 2 : 1;
      if (source[close] === ch) i = close;
    } else if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) return i + 1;
  }
  return -1;
}

/** One scan's result (`readHighlightAt`). */
interface HighlightScan {
  /** Where the scan started (an opener's offset). */
  from: number;
  /** The closing `==` it found (an offset), or -1: none before the paragraph's end. */
  closer: number;
  /** Where it stopped. */
  end: number;
  /**
   * The stretches it stepped over, `[start, end)` offsets in order: code spans and link
   * destinations. An opener anywhere else reads exactly as this scan did from there on.
   */
  skipped: [number, number][];
}

/** The first `==` from `from` that can close a highlight: the scan both readers share. */
function scanHighlight(index: HighlightIndex, from: number): HighlightScan {
  const { source } = index;
  const skipped: [number, number][] = [];
  let i = from + 2;
  while (i < source.length) {
    const ch = source[i]!;
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "\n" && source[i + 1] === "\n") break;
    if (ch === "`") {
      const end = codeSpanEnd(index, i);
      if (end === -1) {
        while (source[i] === "`") i++;
        continue;
      }
      skipped.push([i, end]);
      i = end;
      continue;
    }
    // A link's destination: `](` then its `(…)` (a lone one is text to marked, but never closes
    // a highlight either; the writer escapes the `]` of a highlight's `](` text).
    if (ch === "]" && source[i + 1] === "(") {
      const end = destinationEnd(source, i + 1);
      if (end !== -1) {
        skipped.push([i, end]);
        i = end;
        continue;
      }
    }
    if (
      ch === "=" &&
      source[i + 1] === "=" &&
      i > from + 2 &&
      !SPACE_CHAR.test(source[i - 1]!) &&
      source[i - 1] !== "\\"
    )
      return { from, closer: i, end: i, skipped };
    i++;
  }
  return { from, closer: -1, end: i, skipped };
}

/**
 * The highlight opening at `offset` in the index's source: its closing `==` (an offset), or -1. A
 * later opener the last scan passed in its starting state closes where that scan did, so a
 * paragraph of openers costs one scan, not one per opener.
 */
function closerAt(index: HighlightIndex, offset: number): number {
  const { source } = index;
  if (!source.startsWith("==", offset)) return -1;
  const first = source[offset + 2];
  if (first === undefined || first === "=" || SPACE_CHAR.test(first)) return -1;
  if (!index.closers) {
    index.closers = [];
    for (
      let i = source.indexOf("==");
      i !== -1;
      i = source.indexOf("==", i + 1)
    )
      if (i > 0 && !SPACE_CHAR.test(source[i - 1]!) && source[i - 1] !== "\\")
        index.closers.push(i);
  }
  // No `==` after it could close it: nothing to scan.
  if (nextAt(index.closers, offset + 3) === -1) return -1;
  const last = index.scan;
  const reuse =
    last !== undefined &&
    offset > last.from &&
    offset < last.end &&
    (last.closer === -1 || last.closer >= offset + 3) &&
    !inside(last.skipped, offset);
  const scan = reuse ? last : scanHighlight(index, offset);
  index.scan = scan;
  return scan.closer;
}

/** Whether `offset` falls in one of `spans` (sorted, disjoint `[start, end)`). */
function inside(spans: readonly [number, number][], offset: number): boolean {
  let low = 0;
  let high = spans.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (spans[mid]![0] <= offset) low = mid + 1;
    else high = mid;
  }
  return low > 0 && offset < spans[low - 1]![1];
}

/** The highlight opening at `offset` of the index's source, read whole. */
function highlightAt(
  index: HighlightIndex,
  offset: number,
): { raw: string; text: string; color: HighlightColor } | null {
  const closer = closerAt(index, offset);
  if (closer === -1) return null;
  const { source } = index;
  const suffix = HIGHLIGHT_SUFFIX.exec(source.slice(closer + 2, closer + 10));
  return {
    raw: source.slice(offset, closer + 2 + (suffix ? suffix[0].length : 0)),
    text: source.slice(offset + 2, closer),
    color:
      (suffix?.[1] as HighlightColor | undefined) ?? DEFAULT_HIGHLIGHT_COLOR,
  };
}

/**
 * Read a highlight — `==text==`, or `==text=={<colour>}` — at the start of `source`; `null` when
 * `source` does not start with one. The opening `==` is followed by a character that is not a
 * space or `=`; the closing `==` follows one that is not a space or a backslash, and the first
 * such `==` closes it (highlights do not nest). A `==` inside a code span or a link's destination
 * never closes it, a `\` escapes the next character, and a blank line ends the search. `text` is
 * the highlight's inline Markdown, as written. `frame` (a tracked lexer's, `lexFrame`) keeps the
 * source's indexes, so a paragraph is read in linear time.
 *
 * @example
 * readHighlight("==Ship **Friday**=={red} please");
 * // { raw: "==Ship **Friday**=={red}", text: "Ship **Friday**", color: "red" }
 */
export function readHighlight(
  source: string,
  frame: LexFrame | null = null,
): { raw: string; text: string; color: HighlightColor } | null {
  if (!source.startsWith("==")) return null;
  return highlightAt(
    highlightIndex(frame, source),
    frame ? frame.source.length - source.length : 0,
  );
}

/** The Markdown for a highlight around `markdown` (inline Markdown): `==…==`, then its colour. */
export function highlightMarkdown(
  markdown: string,
  color: HighlightColor = DEFAULT_HIGHLIGHT_COLOR,
): string {
  return `==${markdown}==${color === DEFAULT_HIGHLIGHT_COLOR ? "" : `{${color}}`}`;
}

/**
 * A text with every highlight read as its text: the `==` around it and its `{colour}` dropped —
 * what a one-line display, a snippet or a search index reads. A `==` that opens no highlight, an
 * escaped one and one inside a code span stay as written. Linear in the text's length.
 *
 * @example
 * highlightText("Ship ==Friday=={red}, a == b"); // "Ship Friday, a == b"
 */
export function highlightText(text: string): string {
  if (!text.includes("==")) return text;
  const index: HighlightIndex = { source: text };
  let out = "";
  let i = 0;
  let copied = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "`") {
      const end = codeSpanEnd(index, i);
      if (end !== -1) i = end;
      else while (text[i] === "`") i++;
      continue;
    }
    if (ch === "=" && text[i + 1] === "=") {
      const found = text[i - 1] === "=" ? null : highlightAt(index, i);
      if (found) {
        // Highlights do not nest: a `==` inside one is its text.
        out += text.slice(copied, i) + found.text;
        i += found.raw.length;
        copied = i;
        continue;
      }
    }
    i++;
  }
  return out + text.slice(copied);
}

/** Highlights being read now: their text is lexed without the highlight reader. */
let inHighlight = 0;

/**
 * The highlight reader both VegaStack Markdown readers lex with — `MarkdownView` and the editor's
 * parse (`@/lib/text-edit-markdown`): a marked inline extension making `highlight` tokens
 * (`color`, and the inline `tokens` of its text). Make the instance's lexers tracked
 * (`trackedLexing`), so a long paragraph is scanned once.
 */
export const highlightTokenizer = {
  name: "highlight",
  level: "inline" as const,
  start(this: unknown, src: string): number {
    if (inHighlight > 0) return -1;
    const frame = lexFrame(this, src);
    if (!frame) return src.indexOf("==");
    let at = frame.memo.highlights as number[] | undefined;
    if (!at) {
      at = [];
      const source = frame.source;
      for (
        let i = source.indexOf("==");
        i !== -1;
        i = source.indexOf("==", i + 1)
      )
        at.push(i);
      frame.memo.highlights = at;
    }
    const offset = frame.source.length - src.length;
    let low = 0;
    let high = at.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (at[mid]! < offset) low = mid + 1;
      else high = mid;
    }
    return low < at.length ? at[low]! - offset : -1;
  },
  tokenizer(
    this: { lexer: { inlineTokens(src: string): unknown[] } },
    src: string,
  ) {
    if (inHighlight > 0) return undefined;
    const found = readHighlight(src, lexFrame(this, src));
    if (!found) return undefined;
    // Highlights do not nest: a `==` inside one is its text.
    inHighlight++;
    try {
      return {
        type: "highlight",
        raw: found.raw,
        text: found.text,
        color: found.color,
        tokens: this.lexer.inlineTokens(found.text),
      };
    } finally {
      inHighlight--;
    }
  },
};

/* --- headings, images, code fences --------------------------------------------------------------*/

/**
 * Stable ids for a document's headings, in order: the heading's words, lower-cased and joined with
 * hyphens, then `-1`, `-2`… for a repeat — so identical text always gets the same id, and no two
 * headings ever share one.
 *
 * @example
 * headingIds(["Setup", "Wiring plan", "Setup"]); // ["setup", "wiring-plan", "setup-1"]
 */
export function headingIds(texts: readonly string[]): string[] {
  const seen = new Map<string, number>();
  const used = new Set<string>();
  return texts.map((text) => {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-") || "heading";
    // A suffix never lands on an id already given (`A`, `A`, `A-1` → `a`, `a-1`, `a-1-1`).
    let count = seen.get(base) ?? 0;
    let id = count === 0 ? base : `${base}-${count}`;
    while (used.has(id)) id = `${base}-${++count}`;
    seen.set(base, count + 1);
    used.add(id);
    return id;
  });
}

/**
 * Read an image's Markdown alt text for its size: `![Diagram|320](src)` is a 320px-wide image whose
 * alt is "Diagram", and `![Diagram|320x180](src)` also gives its height — so a page reserves the
 * image's box before it loads (Obsidian's convention, so other renderers still show the image).
 * Takes the alt as written — `\\`, `\[`, `\]` and `\|` are escapes, so an escaped `\|320` (or
 * `&#x7C;320`) is alt text, not a width. Character references stay as written: decode them after.
 *
 * @example
 * parseImageAlt("Diagram|320"); // { alt: "Diagram", width: 320 }
 * parseImageAlt("Diagram|320x180"); // { alt: "Diagram", width: 320, height: 180 }
 * parseImageAlt("Size \\|320"); // { alt: "Size |320" }
 */
export function parseImageAlt(text: string): {
  alt: string;
  width?: number;
  height?: number;
} {
  const unescape = (value: string) => value.replace(/\\([\\[\]|])/g, "$1");
  const match = /^(.*)\|(\d{1,5})(?:x(\d{1,5}))?$/s.exec(text);
  if (match) {
    // The `|` is the size's only when an even number of backslashes stands before it.
    const slashes = /\\*$/.exec(match[1]!)![0].length;
    const width = Number(match[2]);
    const height = match[3] ? Number(match[3]) : 0;
    if (slashes % 2 === 0 && width > 0)
      return {
        alt: unescape(match[1]!),
        width,
        ...(height > 0 ? { height } : {}),
      };
  }
  return { alt: unescape(text) };
}

/**
 * A link or image destination as Markdown: `<…>` when it holds a space, a parenthesis or a `<`/`>`,
 * so it parses back whole, and an entity-shaped `&` written `&amp;`, so it decodes back to itself.
 *
 * @example
 * markdownDestination("/files/a b.png"); // "</files/a b.png>"
 */
export function markdownDestination(href: string): string {
  // An `&` that reads as a character reference is written `&amp;`: the parser decodes once, so
  // `?a=&amp;` stays `?a=&amp;` through every save.
  const safe = href
    // A backslash before punctuation (or at the end) is an escape to the parser: doubled, it reads
    // back as itself (`/a\_b` stays `/a\_b`).
    .replace(/\\(?=[!-/:-@[-`{-~]|$)/g, "\\\\")
    .replace(
      /&(?=#\d{1,7};|#[xX][\da-fA-F]{1,6};|[a-zA-Z][a-zA-Z\d]{1,31};)/g,
      "&amp;",
    );
  if (!/[\s()<>]/.test(safe)) return safe;
  return `<${safe.replace(/[<>\n]/g, (ch) => encodeURIComponent(ch))}>`;
}

/* --- bookmarks ----------------------------------------------------------------------------------*/

/**
 * The title that makes a lone link a bookmark card: `[<url>](<url> "bookmark")` alone on its line.
 * Any other reader shows a link; `MarkdownView` and `TextEdit` show a card (title, icon and site
 * from the host's link preview).
 */
export const BOOKMARK_TITLE = "bookmark";

/**
 * A bookmark as Markdown: the URL as a link to itself, titled `bookmark`, on a line of its own.
 *
 * @example
 * bookmarkMarkdown("https://example.com/a"); // '[https://example.com/a](https://example.com/a "bookmark")'
 */
export function bookmarkMarkdown(url: string): string {
  // The address as its own text, every character Markdown reads inline escaped — so the text
  // parses back to exactly the address (`bookmarkOfParagraph` holds them equal).
  const text = url.replace(/[\\`*_~[\]<>!|&]/g, (ch) => `\\${ch}`);
  return `[${text}](${markdownDestination(url)} "${BOOKMARK_TITLE}")`;
}

/** A link or image title inside `"…"`: its quotes and its escaping backslashes escaped. */
export function markdownTitle(title: string): string {
  return title.replace(/\\(?=[!-/:-@[-`{-~]|$)/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * `imageMarkdown` — an image as markdown, its width (when set) — and its height with it, when known
 * — kept in the alt text as `parseImageAlt` reads it.
 *
 * @example
 * imageMarkdown({ src: "/a.png", alt: "Diagram", width: 320 }); // "![Diagram|320](/a.png)"
 * imageMarkdown({ src: "/a.png", alt: "Diagram", width: 320, height: 180 }); // "![Diagram|320x180](/a.png)"
 */
export function imageMarkdown({
  src,
  alt,
  title,
  width,
  height,
}: {
  src: string;
  alt?: string | null;
  title?: string | null;
  width?: number | null;
  height?: number | null;
}): string {
  // `&` that reads as an entity is written `&amp;`, and a `|` the alt merely ends with (`hello|123`,
  // no width) `&#x7C;` — an entity, not a backslash, so a table's own `\|` unescaping (an image in
  // a cell) never turns it into a width.
  let text = (alt ?? "")
    .replace(/[\\[\]]/g, "\\$&")
    .replace(
      /&(?=#\d{1,7};|#[xX][\da-fA-F]{1,6};|[a-zA-Z][a-zA-Z\d]{1,31};)/g,
      "&amp;",
    );
  if (/\|\d{1,5}(?:x\d{1,5})?$/.test(text))
    text = text.replace(/\|(\d{1,5}(?:x\d{1,5})?)$/, "&#x7C;$1");
  // A size the parser reads back (1–5 digits each): out of range, the width (or height) is left out.
  const fits = (n: number | null | undefined): n is number =>
    !!n && Math.round(n) > 0 && Math.round(n) <= 99_999;
  if (fits(width)) {
    text += `|${Math.round(width)}`;
    if (fits(height)) text += `x${Math.round(height)}`;
  }
  const target = markdownDestination(src);
  return title
    ? `![${text}](${target} "${markdownTitle(title)}")`
    : `![${text}](${target})`;
}

/**
 * The language and wrap flag in a code fence's info string (` ```ts wrap `).
 *
 * @example
 * parseCodeFenceInfo("ts wrap"); // { language: "ts", wrap: true }
 */
export function parseCodeFenceInfo(info?: string | null): {
  language: string | undefined;
  wrap: boolean;
} {
  const words = (info ?? "").trim().split(/\s+/).filter(Boolean);
  const wrap = words.slice(1).includes("wrap");
  return { language: words[0] || undefined, wrap };
}

/**
 * The fence info string for a language and wrap flag — the inverse of `parseCodeFenceInfo`.
 *
 * @example
 * codeFenceInfo("ts", true); // "ts wrap"
 */
export function codeFenceInfo(
  language: string | null | undefined,
  wrap: boolean,
): string {
  const lang = (language ?? "").trim();
  if (!wrap) return lang;
  return `${lang || "text"} wrap`;
}

/* --- directives: live task lists ---------------------------------------------------------------*/

/** A directive attribute's key: `[a-z][a-z0-9-]*`. */
const DIRECTIVE_KEY = /^[a-z][a-z0-9-]*$/;

/** One `key="value"` pair (sticky): `\"` and `\\` are its escapes. */
const DIRECTIVE_PAIR = /[ \t]*([a-z][a-z0-9-]*)="((?:[^"\\\n]|\\[^\n])*)"/y;

/**
 * Read a container directive's attributes — the text between `{` and `}`: space-separated
 * `key="value"` pairs, keys `[a-z][a-z0-9-]*`, values double-quoted with `\"` and `\\` escapes (any
 * other backslash is itself). Unknown keys are kept, in order. `null` when the text is not a list
 * of such pairs or names a key twice — the line is then text, never a directive.
 *
 * @example
 * parseDirectiveAttrs('id="lb_1" status="open"'); // { id: "lb_1", status: "open" }
 */
export function parseDirectiveAttrs(
  source: string,
): Record<string, string> | null {
  const out: Record<string, string> = {};
  const seen = new Set<string>();
  let at = 0;
  while (at < source.length) {
    if (/^[ \t]*$/.test(source.slice(at))) break;
    DIRECTIVE_PAIR.lastIndex = at;
    const pair = DIRECTIVE_PAIR.exec(source);
    if (!pair) return null;
    // Each pair after the first follows a space.
    if (at > 0 && !/^[ \t]/.test(source.slice(at))) return null;
    const key = pair[1]!;
    if (seen.has(key)) return null;
    seen.add(key);
    out[key] = pair[2]!.replace(/\\(["\\])/g, "$1");
    at = DIRECTIVE_PAIR.lastIndex;
  }
  return out;
}

/** A directive attribute's value as written: `\` and `"` escaped, on one line. */
function directiveValue(value: string): string {
  return value.replace(/\n/g, " ").replace(/["\\]/g, "\\$&");
}

/**
 * A live block's name — the word after `:::` — as a regular-expression source: a lowercase
 * letter, then lowercase letters, digits or `_`. Which names a document reads is the host's list
 * (`liveBlockKinds`); any other name stays text.
 */
export const LIVE_BLOCK_NAME = "[a-z][a-z0-9_]*";

/** A line `TextEdit` kept as paragraph text with a leading backslash (`escapeLineStart`'s tests). */
const ESCAPED_LINE_START = new RegExp(
  String.raw`^\\(?=#{1,6}(?:[ \t]|$)|:::${LIVE_BLOCK_NAME}\{|>|<[a-zA-Z/!?]|=+[ \t]*$|[-+](?:[ \t]|$)|(?:-[ \t]*){3,}$)`,
  "u",
);

/**
 * A long text's first line as the reader typed it — what a one-line cell or property shows. The
 * one escape `TextEdit` writes to keep a paragraph line from reading as block Markdown is undone
 * (a leading `&#32;` / `&#9;`, a backslash before a heading, quote, list, rule, setext, HTML or
 * live-block marker, `1\.` for a numbered line), a hard break's marker at the line's end goes, a
 * highlight reads as its text, and each mention link reads as its label.
 *
 * @example
 * typedFirstLine("\\# 1 [@Asha Rao](mention://user/u1)\nmore"); // "# 1 Asha Rao"
 */
export function typedFirstLine(markdown: string): string {
  const end = markdown.indexOf("\n");
  let line = end === -1 ? markdown : markdown.slice(0, end);
  // A line that ends in a hard break (Shift+Enter: `\` before the newline, or two or more trailing
  // spaces) loses the marker; an escaped backslash (`\\`) is text and stays.
  if (end !== -1) {
    const slashes = /\\*$/.exec(line)![0].length;
    if (slashes % 2 === 1) line = line.slice(0, -1);
    // Spaces before a blank line end a paragraph, not a line: they are text.
    else if (markdown[end + 1] !== "\n") line = line.replace(/ {2,}$/, "");
  }
  const typed = line.startsWith("&#32;")
    ? ` ${line.slice(5)}`
    : line.startsWith("&#9;")
      ? `\t${line.slice(4)}`
      : ESCAPED_LINE_START.test(line)
        ? line.slice(1)
        : line.replace(/^(\d{1,9})\\([.)])(?=[ \t]|$)/u, "$1$2");
  return mentionLabels(highlightText(typed));
}

/**
 * A text's mention links as their labels (`[@Asha Rao](mention://user/u1)` → `Asha Rao`; an empty
 * label reads "Untitled"). Text inside a code span and a link whose `[` is escaped (literal text
 * the reader typed) stay as they are.
 */
export function mentionLabels(text: string): string {
  if (!text.includes("mention://")) return text;
  const link = new RegExp(MENTION_LINK_SOURCE, "g");
  // Code spans (a backtick run to the next run of the same length) are left alone.
  return text
    .split(/(?<!\\)(`+)([\s\S]*?)\1/)
    .map((part, index, parts) => {
      // `split` with two groups yields [text, ticks, code, text, ticks, code, …].
      if (index % 3 === 1) return part + parts[index + 1] + part;
      if (index % 3 === 2) return "";
      return part.replace(link, (match: string, label: string, ...rest) => {
        const offset = rest[rest.length - 2] as number;
        let slashes = 0;
        while (part[offset - 1 - slashes] === "\\") slashes++;
        if (slashes % 2 === 1) return match;
        return label.replace(/\\([^\n])/g, "$1") || "Untitled";
      });
    })
    .join("");
}

/**
 * A live block kind as the host reads and shows it: its `name` (after `:::`), the mention kind of
 * its snapshot rows (`rowKind`: `[@Label](mention://<rowKind>/<id>)`), the heading its stored
 * snapshot shows under (`label`) and the line it shows with no rows (`empty`). The host passes
 * its kinds (`liveBlockKinds`); the design system names none but the default.
 */
export interface LiveBlockKind {
  /** The block's name, after `:::` (`LIVE_BLOCK_NAME`). */
  name: string;
  /** The mention kind of its rows; a row mentioning any other kind reads as text. */
  rowKind: string;
  /** The snapshot's heading, and its group's accessible name ("Task list"). */
  label: string;
  /**
   * The snapshot's line when it holds no rows.
   * @default "Nothing matches"
   */
  empty?: string;
}

/** The live blocks read when the host names none: the live task list alone. */
export const DEFAULT_LIVE_BLOCK_KINDS: readonly LiveBlockKind[] = [
  {
    name: "tasks",
    rowKind: "task",
    label: "Task list",
    empty: "No matching tasks",
  },
];

/** The well-formed names of `kinds`, as the readers take them. */
export function liveBlockNames(kinds: readonly LiveBlockKind[]): string[] {
  return kinds
    .map((kind) => kind.name)
    .filter((name) => LIVE_BLOCK_NAME_ID.test(name));
}

const LIVE_BLOCK_NAME_ID = new RegExp(`^${LIVE_BLOCK_NAME}$`);

/** `:::<name>{…}` — a live block's opening line, at column 0: the name is group 1, attributes 2. */
const LIVE_BLOCK_OPEN = new RegExp(
  `^:::(${LIVE_BLOCK_NAME})\\{([^\\n]*)\\}[ \\t]*(?:\\n|$)`,
);

/** `:::` — the line that closes a container directive. */
const DIRECTIVE_CLOSE = /^:::[ \t]*(?:\n|$)/;

/**
 * A live block's row: a task item's line (`- [ ] `/`- [x] ` and its text) or a list item's (`- `
 * and its text, which can't start with a box: `- [ ] ` with nothing after it is no row).
 */
const LIVE_BLOCK_ROW =
  /^- (?:\[[ xX]\] [^\n]*\S[^\n]*|(?!\[[ xX]\](?: |$))[^\n]*\S[^\n]*)$/;

const DEFAULT_LIVE_BLOCK_NAMES = liveBlockNames(DEFAULT_LIVE_BLOCK_KINDS);

/** A live block read from Markdown (`readLiveBlock`). */
export interface LiveBlockDirective {
  /** Everything the block spans: its opening line, rows and closing line (and that line's newline). */
  raw: string;
  /** The block's name, after `:::` — `"tasks"` for a live task list. */
  kind: string;
  /** The `id` attribute — the block's `blockId`. `null` when the directive has none. */
  id: string | null;
  /** Every other attribute, in order, unknown keys included. */
  query: Record<string, string>;
  /** The rows between the opening and closing lines, as written; `""` for none. */
  snapshot: string;
}

/** Options for `readLiveBlock`. */
export interface ReadLiveBlockOptions {
  /**
   * The block names the host reads (`liveBlockNames(liveBlockKinds)`); a block of any other name
   * stays text.
   * @default ["tasks"]
   */
  names?: readonly string[];
}

/**
 * Read a live block at the start of `source` — `:::<name>{<attrs>}`, its rows, `:::` — where
 * `<name>` is one of `names` (a live task list, `tasks`, when none are given):
 *
 * ```md
 * :::tasks{id="lb_9f2c" v="1" status="open"}
 * - [ ] [@Order glass](mention://task/t1) — To do
 * :::
 * ```
 *
 * Each row is a list item line (`- …`), a task item's (`- [ ] …`, `- [x] …`) or not. `null` when `source` does not start with one
 * — another name, no closing line, a line that is not a row, attributes that do not parse — so
 * the lines stay text and a list, as a renderer without directives shows them. Reads only the
 * block's own lines.
 *
 * @example
 * readLiveBlock(':::tasks{id="a" v="1"}\n:::');
 * // { raw: ':::tasks{id="a" v="1"}\n:::', kind: "tasks", id: "a", query: { v: "1" }, snapshot: "" }
 */
export function readLiveBlock(
  source: string,
  { names = DEFAULT_LIVE_BLOCK_NAMES }: ReadLiveBlockOptions = {},
): LiveBlockDirective | null {
  const open = LIVE_BLOCK_OPEN.exec(source);
  if (!open || !names.includes(open[1]!)) return null;
  const attrs = parseDirectiveAttrs(open[2]!);
  if (!attrs) return null;
  const rows: string[] = [];
  for (let at = open[0].length; at <= source.length;) {
    const newline = source.indexOf("\n", at);
    const end = newline === -1 ? source.length : newline;
    const line = source.slice(at, end);
    if (DIRECTIVE_CLOSE.test(line)) {
      const { id = null, ...query } = attrs;
      return {
        raw: source.slice(0, Math.min(end + 1, source.length)),
        kind: open[1]!,
        id,
        query,
        snapshot: rows.join("\n"),
      };
    }
    if (!LIVE_BLOCK_ROW.test(line) || newline === -1) return null;
    rows.push(line);
    at = newline + 1;
  }
  return null;
}

/**
 * A live block as Markdown — the opening line (`:::<kind>`, `id` first, then `query` in its
 * order), the snapshot's rows, `:::`. A snapshot line that is not a row is left out, so the block
 * always reads back as one. A `kind` that is not a well-formed name (`LIVE_BLOCK_NAME`) writes
 * `tasks`.
 *
 * @example
 * liveBlockMarkdown({ kind: "tasks", id: "a", query: { v: "1" }, snapshot: "" }); // ':::tasks{id="a" v="1"}\n:::'
 */
export function liveBlockMarkdown({
  kind,
  id,
  query,
  snapshot,
}: {
  kind?: string | null;
  id?: string | null;
  query?: Record<string, unknown> | null;
  snapshot?: string | null;
}): string {
  const name = kind && LIVE_BLOCK_NAME_ID.test(kind) ? kind : "tasks";
  const pairs: string[] = [];
  if (id) pairs.push(`id="${directiveValue(String(id))}"`);
  for (const [key, value] of Object.entries(query ?? {}))
    if (key !== "id" && DIRECTIVE_KEY.test(key) && value != null)
      pairs.push(`${key}="${directiveValue(String(value))}"`);
  const rows = (snapshot ?? "")
    .split("\n")
    .filter((line) => LIVE_BLOCK_ROW.test(line));
  return [`:::${name}{${pairs.join(" ")}}`, ...rows, ":::"].join("\n");
}

/** One row of a live block's snapshot (`parseLiveBlockRows`). */
export interface LiveBlockRow {
  /** The row's task box — `[x]` is `true`, `[ ]` `false` — or `null` for a row with none. */
  checked: boolean | null;
  /** The record's id when the row is a mention of the block's row kind (`restricted:…` included), else `null`. */
  id: string | null;
  /** The mention's label, or the row's text when it is not one. */
  label: string;
  /** The status label after ` — `; `""` when the row has none. */
  status: string;
}

/**
 * A snapshot's rows — `- [x] [@Fix scaffolding](mention://task/t2) — Done`, or a row with no box
 * (`- [@Row](mention://row/r1)`) — as data, for a renderer. A row that is not a mention of
 * `rowKind` keeps its text as `label`.
 *
 * @example
 * parseLiveBlockRows("- [ ] [@Order glass](mention://task/t1) — To do", "task");
 * // [{ checked: false, id: "t1", label: "Order glass", status: "To do" }]
 */
export function parseLiveBlockRows(
  snapshot: string,
  rowKind: string,
): LiveBlockRow[] {
  const rows: LiveBlockRow[] = [];
  for (const line of snapshot.split("\n")) {
    // Exactly the rows the reader and the writer keep (`readLiveBlock`, `liveBlockMarkdown`).
    if (!LIVE_BLOCK_ROW.test(line)) continue;
    const item = /^- (?:\[([ xX])\] (?=[^\n]*\S))?([^\n]*)$/.exec(line)!;
    const checked = item[1] === undefined ? null : item[1] !== " ";
    const rest = item[2]!;
    const mention = parseMentionLink(rest);
    const after = mention ? rest.slice(mention.raw.length) : "";
    const status = /^ — (.*)$/.exec(after);
    // A mention alone, or with ` — <status>`; anything else after it is not a row's shape, so the
    // whole line reads as text rather than losing its tail.
    if (mention?.kind === rowKind && (status || !after.trim()))
      rows.push({
        checked,
        id: mention.id,
        label: mention.label,
        status: status ? status[1]!.trim() : "",
      });
    else rows.push({ checked, id: null, label: rest.trim(), status: "" });
  }
  return rows;
}

/* --- bounded lexing: what both readers hand marked ---------------------------------------------*/

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

/** How far an emphasis or strikethrough span may reach for its closer. */
const SPAN_WINDOW = 16_384;
/** How long a link or image (its text and destination) may be. */
const LINK_WINDOW = 65_536;

/**
 * One `blockTokens` or `inlineTokens` call of a tracked lexer (`trackLexer`): the whole source it
 * reads, and what a tokenizer learned about that source once (`memo`). Every `src` marked hands a
 * tokenizer during the call is a tail of `source`, so one pass over `source` answers them all.
 */
export interface LexFrame {
  source: string;
  memo: Record<string, unknown>;
}

/** A marked lexer, as far as tracking reads it. */
export interface LexerLike {
  lex(src: string): unknown;
  blockTokens(...args: never[]): unknown;
  inlineTokens(...args: never[]): unknown;
}

/** Each tracked lexer's open calls, innermost last. */
const FRAMES = new WeakMap<object, LexFrame[]>();

/**
 * `lexer`, with every `blockTokens` and `inlineTokens` call recorded while it runs (nested calls —
 * a quote's blocks, a link's or an emphasis's text — each get their own frame and leave the
 * enclosing one intact), so the bounded tokenizers index each source exactly once.
 */
export function trackLexer<L extends LexerLike>(lexer: L): L {
  const frames: LexFrame[] = [];
  FRAMES.set(lexer, frames);
  for (const name of ["blockTokens", "inlineTokens"] as const) {
    const run = lexer[name].bind(lexer) as (
      src: string,
      ...rest: unknown[]
    ) => unknown;
    (lexer as unknown as Record<string, unknown>)[name] = (
      src: string,
      ...rest: unknown[]
    ) => {
      frames.push({ source: src, memo: {} });
      try {
        return run(src, ...rest);
      } finally {
        frames.pop();
      }
    };
  }
  return lexer;
}

/**
 * The open frame of the lexer a tokenizer runs for (`this`: a tokenizer, or an extension's
 * `{ lexer }`), when `src` is a tail of its source; else null (an untracked lexer).
 */
export function lexFrame(context: unknown, src: string): LexFrame | null {
  const lexer = (context as { lexer?: object } | null | undefined)?.lexer;
  const frame = lexer ? FRAMES.get(lexer)?.at(-1) : undefined;
  return frame && isTailOf(frame.source, src) ? frame : null;
}

/**
 * marked's `Lexer`, tracked (`trackLexer`): `Lexer` news a tracked lexer and its statics lex with
 * one, and `lex` is a tracked `instance.lexer`. Set both on a `Marked` instance — Tiptap's manager
 * news `instance.Lexer` and calls `instance.lexer` — so every lexer it makes is tracked.
 */
export function trackedLexing<C extends new (options?: never) => LexerLike>(
  Lexer: C,
) {
  type Options = ConstructorParameters<C>[0];
  const create = (options?: Options) =>
    trackLexer(
      new (Lexer as unknown as new (options?: Options) => InstanceType<C>)(
        options,
      ),
    );
  const lex = (src: string, options?: Options) => create(options).lex(src);
  const lexInline = (src: string, options?: Options) =>
    create(options).inlineTokens(src as never);
  // A constructor `new` returns the tracked lexer from; marked's statics read through it too.
  const Tracked = Object.assign(
    function TrackedLexer(options?: Options) {
      return create(options);
    },
    { rules: (Lexer as unknown as { rules?: unknown }).rules, lex, lexInline },
  );
  return { Lexer: Tracked as unknown as C, lex };
}

/**
 * Whether the `*`, `_` or `~` opening `src` has any delimiter run of its kind after it that could
 * close it — a closing run never follows a space. Computed once per inline source (marked hands
 * every call of one `inlineTokens` the same masked text), so a paragraph of unmatched delimiters
 * costs one pass, not one per delimiter. Anything else is let through.
 */
function closerAhead(
  src: string,
  masked: string,
  frame: LexFrame | null,
): boolean {
  const char = src[0];
  if (char !== "*" && char !== "_" && char !== "~") return true;
  let last = frame?.memo.masked === masked ? frame.memo.closers : undefined;
  if (!last) {
    const found: Record<string, number> = { "*": -1, _: -1, "~": -1 };
    for (let i = 1; i < masked.length; i++) {
      const each = masked[i]!;
      // A run of the delimiter can close only when the character before the RUN is not a space.
      if (!(each in found) || masked[i - 1] === each) continue;
      if (!/\s/.test(masked[i - 1]!)) found[each] = i;
    }
    last = found;
    if (frame) Object.assign(frame.memo, { masked, closers: found });
  }
  return (last as Record<string, number>)[char]! > masked.length - src.length;
}

/**
 * Whether an inline link could close in `src`: a `)` must follow within the link's window. marked
 * hands the link reader the rest of the source at every `[`; a source of `[a](` without a `)`
 * would be read to its end each time. The last `)` is found once per source.
 */
function parenAhead(src: string, frame: LexFrame | null): boolean {
  if (!frame) return src.slice(0, LINK_WINDOW).includes(")");
  if (frame.memo.paren === undefined) {
    const last = frame.source.lastIndexOf(")");
    frame.memo.paren = last === -1 ? -1 : frame.source.length - last;
  }
  const fromEnd = frame.memo.paren as number;
  return fromEnd > 0 && fromEnd <= src.length;
}

/** `src` and its masked twin (aligned at their ends, as marked keeps them) cut to the window. */
function windowed(src: string, masked: string): [string, string] {
  if (src.length <= SPAN_WINDOW) return [src, masked];
  const start = masked.length - src.length;
  return [src.slice(0, SPAN_WINDOW), masked.slice(start, start + SPAN_WINDOW)];
}

/** A list token, as far as the empty-task rule reads it (marked's `Tokens.List`). */
interface ListLike {
  items: {
    task: boolean;
    checked?: boolean;
    tokens: { type: string; raw?: string }[];
  }[];
}

/** The marked tokenizer methods the bounded ones wrap — marked's `Tokenizer.prototype`. */
export interface BoundedBase {
  emStrong(src: string, maskedSrc: string, prevChar?: string): unknown;
  del(src: string, maskedSrc: string, prevChar?: string): unknown;
  link(src: string): unknown;
  list(src: string): unknown;
}

/**
 * The tokenizers every VegaStack Markdown reader lexes with — the editor's parse
 * (`@/lib/text-edit-markdown`) and `MarkdownView` — so both read a page alike and in linear time:
 * - marked looks for the closer of every `*`, `_` and `~` delimiter across the rest of the
 *   paragraph (quadratic on a paragraph of unmatched ones): emphasis and strikethrough are looked
 *   for only when a closer exists, within a window far longer than any real span;
 * - a link or image is read only when a `)` follows, and within a window;
 * - an empty task item (`- [ ]`, `- [x]`: nothing after the box) is still a task — GFM wants text
 *   after the box, but an editor writes empty ones and a person types them.
 *
 * Pass marked's `Tokenizer.prototype` (this file depends on nothing), and make the instance's lexers
 * tracked (`trackedLexing`) so each source is indexed once — an untracked lexer still reads
 * correctly, only without the per-source indexes:
 * `marked.use({ tokenizer: boundedTokenizers(Tokenizer.prototype) })`.
 */
export function boundedTokenizers<T extends BoundedBase>(
  base: T,
): Pick<T, keyof BoundedBase> {
  const tokenizers: BoundedBase = {
    emStrong(src, maskedSrc, prevChar) {
      if (!closerAhead(src, maskedSrc, lexFrame(this, src))) return undefined;
      return base.emStrong.call(this, ...windowed(src, maskedSrc), prevChar);
    },
    del(src, maskedSrc, prevChar) {
      if (!closerAhead(src, maskedSrc, lexFrame(this, src))) return undefined;
      return base.del.call(this, ...windowed(src, maskedSrc), prevChar);
    },
    link(src) {
      if (
        (src[0] === "[" || src[0] === "!") &&
        !parenAhead(src, lexFrame(this, src))
      )
        return undefined;
      return base.link.call(this, src.slice(0, LINK_WINDOW));
    },
    list(src) {
      const list = base.list.call(this, src) as ListLike | undefined;
      if (!list) return undefined;
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
        } as ListLike["items"][number]["tokens"][number];
      }
      return list;
    },
  };
  return tokenizers as unknown as Pick<T, keyof BoundedBase>;
}
