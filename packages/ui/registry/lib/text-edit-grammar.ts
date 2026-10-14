// @vegastack text-edit-grammar@0.25.41 sha256-1sqr7d0M7yOwLyTcae2gg4HYkcBXDNiv3AykUBYQW8k=

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
 * (in a table cell or a heading). Any other raw HTML is literal text.
 */

/** The VegaStack Markdown version this grammar and `@/lib/text-edit-markdown` read and write. */
export const VEGASTACK_MARKDOWN_VERSION = 1 as const;

/* --- mentions ------------------------------------------------------------------------------------*/

/** Every mention kind, in menu order. */
export const MENTION_KINDS = [
  "user",
  "page",
  "file",
  "task",
  "meeting",
  "customer",
  "project",
  "product",
  "agent",
] as const;

/** What a mention points at. */
export type MentionKind = (typeof MENTION_KINDS)[number];

/**
 * A record mention (a page, a file, a task, …: anything but a person or a member's agent). Its
 * label is a record's title, which only readers who can open the record may see — so a shared
 * document stores it empty and each reader's chip resolves it. A person's or an agent's name is
 * visible to every member, so theirs is stored.
 */
export function isRecordMentionKind(
  kind: MentionKind,
): kind is Exclude<MentionKind, "user" | "agent"> {
  return kind !== "user" && kind !== "agent";
}

/** A target the reader may not open: the link carries the real id after this prefix. */
export const RESTRICTED_MENTION_PREFIX = "restricted:";

const KINDS = MENTION_KINDS.join("|");

/**
 * `[@<label>](mention://<kind>/<id>)`, unanchored — the source of `MENTION_LINK`. The label escapes
 * `\`, `[` and `]` with a backslash; the id has no whitespace or parentheses. Build a scanning
 * expression from it (`new RegExp(MENTION_LINK_SOURCE, "g")`) rather than sharing a global one.
 */
export const MENTION_LINK_SOURCE = String.raw`\[@((?:[^\\[\]\n]|\\[^\n])*)\]\(mention:\/\/(${KINDS})\/([^\s()]+)\)`;

/** A mention link at the start of a string. */
export const MENTION_LINK = new RegExp(`^${MENTION_LINK_SOURCE}`);

/** The same link as a PostgreSQL regular expression (`regexp_replace`, text search). */
export const MENTION_LINK_SQL = String.raw`\[@([^\\\[\]\n]|\\[^\n])*\]\(mention://(${KINDS})/[^\s()]+\)`;

/** A label as a mention link (or any bracketed text) carries it: `\`, `[` and `]` escaped. */
export function escapeMentionLabel(label: string): string {
  return label.replace(/[\\[\]]/g, "\\$&");
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

/* --- headings, images, code fences --------------------------------------------------------------*/

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

/**
 * Read an image's Markdown alt text for a width: `![Diagram|320](src)` is a 320px-wide image whose
 * alt is "Diagram" (Obsidian's convention, so other renderers still show the image). Takes the alt
 * as written — `\\`, `\[`, `\]` and `\|` are escapes, so an escaped `\|320` (or `&#x7C;320`) is
 * alt text, not a width. Character references stay as written: decode them after.
 *
 * @example
 * parseImageAlt("Diagram|320"); // { alt: "Diagram", width: 320 }
 * parseImageAlt("Size \\|320"); // { alt: "Size |320" }
 */
export function parseImageAlt(text: string): { alt: string; width?: number } {
  const unescape = (value: string) => value.replace(/\\([\\[\]|])/g, "$1");
  const match = /^(.*)\|(\d{1,5})$/s.exec(text);
  if (match) {
    // The `|` is the width's only when an even number of backslashes stands before it.
    const slashes = /\\*$/.exec(match[1]!)![0].length;
    const width = Number(match[2]);
    if (slashes % 2 === 0 && width > 0)
      return { alt: unescape(match[1]!), width };
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

/** A link or image title inside `"…"`: its quotes and its escaping backslashes escaped. */
export function markdownTitle(title: string): string {
  return title.replace(/\\(?=[!-/:-@[-`{-~]|$)/g, "\\\\").replace(/"/g, '\\"');
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
  // `&` that reads as an entity is written `&amp;`, and a `|` the alt merely ends with (`hello|123`,
  // no width) `&#x7C;` — an entity, not a backslash, so a table's own `\|` unescaping (an image in
  // a cell) never turns it into a width.
  let text = escapeMentionLabel(alt ?? "").replace(
    /&(?=#\d{1,7};|#[xX][\da-fA-F]{1,6};|[a-zA-Z][a-zA-Z\d]{1,31};)/g,
    "&amp;",
  );
  if (/\|\d{1,5}$/.test(text)) text = text.replace(/\|(\d{1,5})$/, "&#x7C;$1");
  if (width) text += `|${Math.round(width)}`;
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
