/**
 * The VegaStack Markdown round-trip corpus — the data-loss invariant behind `text-edit-markdown`.
 * Every case runs twice: in Node (`tooling/test/vegastack-markdown.test.mjs`, no DOM — what a
 * collaboration server sees) and in Chromium (`registry/lib/text-edit-markdown.test.ts`). Both
 * compare against the same expected output, so a server and a browser read every case the same.
 *
 * A case is `fixtures/vegastack-markdown/<group>/<name>.md` (Markdown in), or
 * `editor-json/<name>.json` (a document the editor can hold). `<name>.out.md` is the canonical
 * output when it differs from the input; `<name>.loss` lists an accepted VegaStack Markdown v1
 * loss — one reason per line, and `words: …` for input words the document may not keep. See
 * `fixtures/vegastack-markdown/README.md`.
 */
import type { JSONContent } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { prosemirrorToYDoc, yDocToProsemirror } from "@tiptap/y-tiptap";
import {
  docToMarkdown,
  docToText,
  markdownToDoc,
  normalizeMarkdown,
} from "../registry/lib/text-edit-markdown";
import { textEditSchema } from "../registry/lib/text-edit-schema";

// Every fixture as its raw text. (The suite's `ImportMeta.glob` typing — declared in
// `animated-icons.test.tsx` — knows only `eager`; Vite reads `query` and `import` too.)
const files = import.meta.glob<string>(
  "./fixtures/vegastack-markdown/**/*.{md,json,loss}",
  { query: "?raw", import: "default", eager: true } as { eager: true },
);

/** One corpus case. */
export interface CorpusCase {
  name: string;
  /** Markdown in (a `.md` case). */
  input?: string;
  /** A document in (an `editor-json` case). */
  json?: JSONContent;
  /** The canonical Markdown the case must serialize to. */
  expected: string;
  /** An accepted v1 loss: the structure may change; `words` may be dropped. */
  loss?: { reasons: string[]; words: Set<string> };
}

const PREFIX = "./fixtures/vegastack-markdown/";

/** A fixture file without the single newline a text file ends with. */
const body = (text: string) => text.replace(/\r?\n$/, "");

/** Every case in the corpus, sorted by name. */
export function corpusCases(): CorpusCase[] {
  const out: CorpusCase[] = [];
  for (const [path, text] of Object.entries(files)) {
    const name = path.slice(PREFIX.length).replace(/\.(md|json)$/, "");
    if (
      path.endsWith(".out.md") ||
      path.endsWith(".loss") ||
      path.endsWith("README.md")
    )
      continue;
    const out_ = files[`${PREFIX}${name}.out.md`];
    const lossFile = files[`${PREFIX}${name}.loss`];
    const loss = lossFile
      ? {
          reasons: body(lossFile)
            .split("\n")
            .filter((line) => line && !line.startsWith("words:")),
          words: new Set(
            (/^words:(.*)$/m.exec(lossFile)?.[1] ?? "")
              .trim()
              .split(/\s+/)
              .filter(Boolean),
          ),
        }
      : undefined;
    if (path.endsWith(".json")) {
      if (out_ === undefined)
        throw new Error(`${name}: an editor-json case needs ${name}.out.md`);
      out.push({
        name,
        json: JSON.parse(text) as JSONContent,
        expected: body(out_),
        loss,
      });
    } else {
      const input = body(text);
      out.push({
        name,
        input,
        expected: out_ === undefined ? input : body(out_),
        loss,
      });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Words that are VegaStack Markdown syntax, never content. */
const SYNTAX = new Set([
  "details",
  "summary",
  "open",
  "mention",
  "video",
  "audio",
  "src",
  "br",
  "note",
  "tip",
  "important",
  "warning",
  "caution",
  "nbsp",
  "amp",
  "lt",
  "gt",
  "quot",
  "wrap",
  "32",
  "9",
]);

const wordsOf = (text: string) =>
  (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (word) => !SYNTAX.has(word),
  );

/** The words of Markdown source, without list numbers, task boxes and character references. */
const sourceWords = (markdown: string) =>
  wordsOf(
    markdown
      .replace(/^[ \t>]*\d{1,9}[.)](?=[ \t]|$)/gm, "")
      .replace(/^([ \t>]*[-+*][ \t]+)\[[ xX]\]/gm, "$1")
      .replace(/&(?:#\d+|#[xX][\da-fA-F]+|[a-zA-Z]\w*);/g, " "),
  );

/** Every word a document holds: its text and every attribute value. */
function docWords(doc: PMNode): Set<string> {
  const words = new Set(wordsOf(docToText(doc)));
  doc.descendants((node) => {
    // A live task list's directive name and its `id` key are syntax; its `query` is an object.
    if (node.type.name === "taskQuery") words.add("tasks").add("id");
    for (const value of Object.values(node.attrs))
      if (value !== null && value !== undefined)
        for (const word of wordsOf(
          typeof value === "object" ? JSON.stringify(value) : String(value),
        ))
          words.add(word);
    for (const mark of node.marks)
      for (const value of Object.values(mark.attrs))
        if (value !== null && value !== undefined)
          for (const word of wordsOf(String(value))) words.add(word);
    return true;
  });
  return words;
}

/** Parse with block ids numbered from 1, so two parses of equal Markdown are equal documents. */
function parse(markdown: string): PMNode {
  let next = 0;
  return markdownToDoc(markdown, { blockId: () => `b${++next}` });
}

/** The document a case starts from. */
export function caseDoc(each: CorpusCase): PMNode {
  if (each.json) {
    const doc = textEditSchema().nodeFromJSON(each.json);
    doc.check();
    return doc;
  }
  return parse(each.input!);
}

/** Every way `each` breaks the invariant; empty when it holds. */
export function checkCase(each: CorpusCase): string[] {
  const problems: string[] = [];
  let doc: PMNode;
  try {
    doc = caseDoc(each);
  } catch (error) {
    return [`does not parse to a valid document: ${String(error)}`];
  }
  // 1. No deletion: every word of the input survives into the document.
  if (each.input !== undefined) {
    const kept = docWords(doc);
    const lost = [...new Set(sourceWords(each.input))].filter(
      (word) => !kept.has(word) && !each.loss?.words.has(word),
    );
    if (lost.length)
      problems.push(`input words lost on parse: ${lost.join(" ")}`);
  }
  // 2. Canonical output.
  const markdown = docToMarkdown(doc);
  if (markdown !== each.expected)
    problems.push(
      `output\n  expected ${JSON.stringify(each.expected)}\n  received ${JSON.stringify(markdown)}`,
    );
  // 3. Idempotent: the output is a fixed point (after a declared loss has happened once).
  const settled = each.loss ? normalizeMarkdown(markdown) : markdown;
  const again = normalizeMarkdown(settled);
  if (again !== settled)
    problems.push(
      `not idempotent\n  first  ${JSON.stringify(settled)}\n  second ${JSON.stringify(again)}`,
    );
  // 4. Structural: the output parses back to the same document (unless a v1 loss is declared).
  const back = parse(markdown);
  const same = each.json ? back.eq(stripIds(doc)) : back.eq(doc);
  if (!same && !each.loss)
    problems.push(
      `structure changed\n  before ${JSON.stringify(doc.toJSON())}\n  after  ${JSON.stringify(back.toJSON())}`,
    );
  // A loss that drops words happens at the first parse: the round trip after it is exact.
  if (same && each.loss && each.loss.words.size === 0)
    problems.push(
      "declares a loss (.loss) but round-trips exactly: delete the .loss file",
    );
  // 5. Yjs: the document survives a Y.Doc unchanged.
  const viaY = yDocToProsemirror(textEditSchema(), prosemirrorToYDoc(doc));
  if (!viaY.eq(doc)) problems.push("changed through a Y.Doc");
  return problems;
}

/** An editor-json document with the ids a parse would give it (`b1`, `b2`, … in order). */
function stripIds(doc: PMNode): PMNode {
  let next = 0;
  const walk = (node: JSONContent): JSONContent => ({
    ...node,
    ...(node.attrs && "blockId" in node.attrs
      ? { attrs: { ...node.attrs, blockId: `b${++next}` } }
      : {}),
    ...(node.content ? { content: node.content.map(walk) } : {}),
  });
  return textEditSchema().nodeFromJSON(walk(doc.toJSON()));
}

/** A document of `size` characters built from every construct, repeated. */
export function largeMarkdown(size: number): string {
  const unit = [
    "## Section heading",
    "A paragraph with **bold**, *em*, a [link](https://ex.com/?a=1&b=2), `code` and [@Asha Rao](mention://user/u1) mention.",
    "- item one\n- item two\n  - nested",
    "- [ ] task\n  - [x] sub",
    "1. first\n2. second",
    "| A | B |\n| --- | --- |\n| one<br>two | x |",
    "> [!NOTE]\n> callout text",
    "<details><summary>More</summary>\n\nhidden\n\n</details>",
    "```ts\nconst x = 1;\n```",
    "",
  ].join("\n\n");
  let out = "";
  while (out.length < size) out += unit;
  return out;
}

/**
 * Inputs built to defeat a tokenizer's bounds — each must parse in linear time too: paragraphs split
 * by whitespace-only lines, unclosed toggles, table-like rows without a delimiter, task lines,
 * backtick and emphasis runs, callouts, media lines and nested quotes.
 */
export const ADVERSARIAL: Record<string, string> = {
  "blank lines with spaces": "paragraph\n \n",
  "unclosed toggles": "<details><summary>x</summary>\n\nbody\n\n",
  "toggle closers only": "</details>\n\ntext\n\n",
  "pipes without a delimiter": "a | b | c\n",
  "task lines": "- [ ] task\n",
  "backtick runs": "``` `` ` text ",
  "emphasis runs": "*a _b **c __d ",
  "strikethrough runs": "~a ~~b ",
  "link openers": "[a](",
  "highlight openers": "==a ==b ",
  highlights: "==a== ",
  "highlight link openers": "==a [b ](x ",
  "highlight brackets": "==a [ ",
  "highlight destinations in brackets": "==a [ ](x ",
  "highlight destinations": "==a [x](<b< ",
  callouts: "> [!NOTE]\n> x\n",
  "media lines": '<video src="/v.mp4"></video>\n',
  "nested quotes": "> > > quote\n",
  "headings between lines": "p\n# h\n",
  "unclosed task lists":
    ':::tasks{id="a" v="1"}\n- [ ] [@T](mention://task/t1) — To do\n',
  "task lists":
    ':::tasks{id="a" v="1"}\n- [ ] [@T](mention://task/t1) — To do\n:::\n\n',
};

/**
 * ONE paragraph of code spans and tags. marked (17.0.6) masks each code span, link and tag of a
 * paragraph by rebuilding the paragraph's string, so a single paragraph of tens of thousands of
 * them costs quadratic time inside marked itself — a known upstream limit that only a fork of its
 * inline lexer would lift. Bounded here at 100 KB paragraphs, far past any real one.
 */
export const ADVERSARIAL_PARAGRAPH: Record<string, string> = {
  "marks and code spans": "a **b** _c_ `d` ",
  "inline tags": "x <kbd>k</kbd> ",
};

/** `unit` repeated to `size` characters. */
export function repeatTo(unit: string, size: number): string {
  return unit.repeat(Math.ceil(size / unit.length)).slice(0, size);
}

/** Milliseconds to parse `markdown` and write it back, best of `runs`. */
export function roundTripTime(markdown: string, runs = 3): number {
  let best = Infinity;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    docToMarkdown(markdownToDoc(markdown));
    best = Math.min(best, performance.now() - start);
  }
  return best;
}
