// @vegastack markdown-as-typed@0.66.0 sha256-jjo1fRvQV1RAV0PLrkJAH+0yA6D9G1LZuq3uiydeJzg=

/* ---
`markdown-as-typed.ts` — stored Markdown as the person typed it. Pure strings, no dependencies, so
server and worker code (an agent's turn input) can import it without the editor.
--- */

/**
 * Stored Markdown as the person typed it, for a reader that isn't a Markdown renderer — a model
 * reading a chat message, a bubble showing it. Real formatting stays as Markdown (`**bold**`, a
 * list, a link); what the writer escaped only so Markdown would not read it as syntax reads as
 * itself (`\_\_init\_\_` → `__init__`, `\*` → `*`), and a hard break (`\` at a line's end) is
 * the newline it stands for. Code is kept byte for byte: a fenced block's lines and a code span
 * keep every backslash. Never feed the result back to `text-edit-markdown`'s `markdownToDoc`: it is the reading form, and
 * `__init__` would then parse as bold.
 *
 * @example
 * markdownAsTyped("rename \\_\\_init\\_\\_ to **setup**"); // "rename __init__ to **setup**"
 */
export function markdownAsTyped(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  // A fenced block's lines are kept byte for byte; the text between fences is read as inline.
  let fence: { char: string; length: number } | null = null;
  let prose: string[] = [];
  const flush = () => {
    if (prose.length) out.push(inlineAsTyped(prose.join("\n")));
    prose = [];
  };
  for (const line of lines) {
    if (fence) {
      out.push(line);
      const close = FENCE_CLOSE.exec(line);
      if (
        close &&
        close[1]![0] === fence.char &&
        close[1]!.length >= fence.length
      )
        fence = null;
      continue;
    }
    const open = FENCE_OPEN.exec(line);
    if (open) {
      flush();
      out.push(line);
      fence = { char: open[1]![0]!, length: open[1]!.length };
      continue;
    }
    prose.push(line);
  }
  flush();
  return out.join("\n");
}

/** A fence's opening line, after any list or quote markers it sits in. */
const FENCE_OPEN =
  /^(?:[ \t]*(?:[-*+]|\d+[.)])[ \t]+|[ \t]*>[ \t]?)*[ \t]{0,3}(`{3,}|~{3,})/u;
/** A fence's closing line: only the fence run (after any container markers) and spaces. */
const FENCE_CLOSE = /^(?:[ \t]*>[ \t]?)*[ \t]*(`{3,}|~{3,})[ \t]*$/u;
/** Characters CommonMark lets a backslash escape. */
const ESCAPABLE = /[!-/:-@[-`{-~]/u;
/** The entities a writer emits for text: named basics and numeric ones. */
const ENTITY =
  /^&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|(amp|lt|gt|quot|apos|nbsp));/u;
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};
/** An autolink (`<https://…>`, `<a@b.co>`) or a `<br>` tag at a `<`. */
const AUTOLINK =
  /^<(?:[a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*|[^\s<>@]+@[^\s<>]+)>/u;
const BREAK = /^<br\s*\/?>/iu;

/**
 * One run of inline Markdown, read left to right: an escape is the character it escapes, an
 * entity the character it names, a hard break a newline; a code span, an autolink and a link's
 * destination are kept as written.
 */
function inlineAsTyped(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === "\\") {
      const next = text[i + 1];
      // `\` before a newline is a hard break.
      if (next === "\n") {
        out += "\n";
        i += 2;
        continue;
      }
      if (next !== undefined && ESCAPABLE.test(next)) {
        out += next;
        i += 2;
        continue;
      }
      out += ch;
      i++;
      continue;
    }
    if (ch === "`") {
      let run = 0;
      while (text[i + run] === "`") run++;
      const close = closingRun(text, i + run, run);
      if (close === -1) {
        // No closing run: the backticks are text.
        out += text.slice(i, i + run);
        i += run;
        continue;
      }
      out += text.slice(i, close + run);
      i = close + run;
      continue;
    }
    if (ch === "&") {
      const entity = ENTITY.exec(text.slice(i, i + 12));
      if (entity) {
        const [whole, dec, hex, named] = entity;
        const code = dec ? Number(dec) : hex ? parseInt(hex, 16) : null;
        out +=
          code !== null
            ? code > 0 && code <= 0x10ffff
              ? String.fromCodePoint(code)
              : "\ufffd"
            : NAMED[named!]!;
        i += whole.length;
        continue;
      }
    }
    if (ch === "<") {
      const rest = text.slice(i, i + 2048);
      const br = BREAK.exec(rest);
      if (br) {
        out += "\n";
        i += br[0].length;
        continue;
      }
      const link = AUTOLINK.exec(rest);
      if (link) {
        out += link[0];
        i += link[0].length;
        continue;
      }
    }
    if (ch === "]" && text[i + 1] === "(") {
      // A link's destination and title are kept as written, to the matching `)`.
      const end = destinationEnd(text, i + 2);
      if (end !== -1) {
        out += text.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

/** Where a run of exactly `length` backticks starts at or after `from`, or -1. */
function closingRun(text: string, from: number, length: number): number {
  let i = from;
  while (i < text.length) {
    if (text[i] !== "`") {
      i++;
      continue;
    }
    let run = 0;
    while (text[i + run] === "`") run++;
    if (run === length) return i;
    i += run;
  }
  return -1;
}

/** The index of the `)` closing a link destination that starts at `from`, or -1. */
function destinationEnd(text: string, from: number): number {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "\n") return -1;
    if (ch === "(") depth++;
    else if (ch === ")") {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}
