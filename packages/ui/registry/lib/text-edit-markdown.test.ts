import { describe, expect, test } from "vitest";
import { Editor } from "@tiptap/core";
import { checkCase, corpusCases } from "../../test/vegastack-markdown-corpus";
import {
  VegaStackMarkdown,
  createMarkdownManager,
  docToMarkdown,
  docToText,
  markdownToDoc,
  normalizeMarkdown,
} from "./text-edit-markdown";
import {
  blockId,
  textEditExtensions,
  textEditSchema,
} from "./text-edit-schema";

// The corpus in a browser — a `window` and a `DOMParser` present, which is exactly where Tiptap's
// own Markdown manager reads HTML differently from a server. `tooling/test/vegastack-markdown.test.mjs`
// runs the same cases in Node against the same expected output.
describe("VegaStack Markdown round trip (browser, DOM present)", () => {
  test("runs with a DOM", () => {
    expect(typeof window.DOMParser).toBe("function");
  });

  for (const each of corpusCases())
    test(each.name, () => {
      expect(checkCase(each)).toEqual([]);
    });
});

test("markdownToDoc: an empty source is one empty paragraph, and blocks get ids Markdown never carries", () => {
  const empty = markdownToDoc("", { blockId: () => "p1" });
  expect(empty.toJSON()).toEqual({
    type: "doc",
    // `ychange` is always null in a document (its schema refuses a version diff's markings).
    content: [{ type: "paragraph", attrs: { blockId: "p1", ychange: null } }],
  });
  let next = 0;
  const doc = markdownToDoc(
    "# A\n\n<details><summary>T</summary>\n\nb\n\n</details>",
    {
      blockId: () => `id-${++next}`,
    },
  );
  // Document order: the heading, the toggle, then the toggle's paragraph.
  expect(doc.child(0).attrs.blockId).toBe("id-1");
  expect(doc.child(1).attrs.blockId).toBe("id-2");
  expect(doc.child(1).child(1).attrs.blockId).toBe("id-3");
  expect(blockId()).toMatch(/^[a-z2-7]{8}$/);
  // Ids live in the document only: Markdown never carries them.
  expect(docToMarkdown(doc)).not.toContain("id-");
});

test("docToText reads the anchor text: blocks on lines, a mention as @label", () => {
  expect(docToText(markdownToDoc("# A\n\nHi [@Asha](mention://user/u1)"))).toBe(
    "A\nHi @Asha",
  );
});

test("normalizeMarkdown is what any writer's Markdown becomes once stored", () => {
  expect(normalizeMarkdown("* one\n* two\n\n\n\nText  ")).toBe(
    "- one\n- two\n\nText",
  );
});

test("each manager has its own marked: building one leaves the global instance untouched", async () => {
  const { marked } = await import("marked");
  const before = marked.defaults.extensions;
  createMarkdownManager();
  createMarkdownManager();
  expect(marked.defaults.extensions).toBe(before);
});

test("the editor reads Markdown exactly as markdownToDoc does: initial content, a paste, setContent", () => {
  // A BOM, CR line endings and a NUL: one normalization for every path.
  const source =
    "\uFEFF# Heading\r\n\r\n- # In a list\r\n- ![x](/x.png)\u0000\r\n";
  const expected = docToMarkdown(markdownToDoc(source));
  const editor = new Editor({
    extensions: textEditExtensions({ plugins: [VegaStackMarkdown] }),
    content: source,
    contentType: "markdown",
  });
  try {
    expect(editor.getMarkdown()).toBe(expected);
    editor.commands.setContent(source, { contentType: "markdown" });
    expect(editor.getMarkdown()).toBe(expected);
    editor.commands.setContent("");
    editor.commands.insertContent(source, { contentType: "markdown" });
    expect(editor.getMarkdown()).toBe(expected);
  } finally {
    editor.destroy();
  }
});

test("the editor's Markdown is docToMarkdown, byte for byte", () => {
  const source =
    "# Plan\n\nsnake_case & R&D\\\nnext line\n\n| A |\n| --- |\n| a<br>b |";
  const editor = new Editor({
    extensions: textEditExtensions({ plugins: [VegaStackMarkdown] }),
    content: source,
    contentType: "markdown",
  });
  try {
    expect(editor.getMarkdown()).toBe(docToMarkdown(markdownToDoc(source)));
    expect(editor.schema.spec.nodes.size).toBe(
      textEditSchema().spec.nodes.size,
    );
  } finally {
    editor.destroy();
  }
});

test("docToMarkdown fills a shared document's empty record labels from `labels`, and only those", () => {
  const doc = markdownToDoc(
    "[@](mention://page/p1) and [@Asha](mention://user/u1) and [@](mention://task/t9)",
  );
  expect(
    docToMarkdown(doc, {
      labels: (kind, id) => (kind === "page" && id === "p1" ? "Q3 plan" : null),
    }),
  ).toBe(
    "[@Q3 plan](mention://page/p1) and [@Asha](mention://user/u1) and [@](mention://task/t9)",
  );
});

test("a table's Markdown grows with its content: one long cell never pads every row", () => {
  // 1,000 short rows and one 10,000-character cell: padding each row to the widest cell wrote
  // ~10 MB for a 16 KB table.
  const rows = Array.from({ length: 1_000 }, (_, index) => `| ${index} |`);
  const source = [
    "| A |",
    "| --- |",
    `| ${"x".repeat(10_000)} |`,
    ...rows,
  ].join("\n");
  const out = normalizeMarkdown(source);
  expect(out.length).toBeLessThan(source.length * 2);
  expect(normalizeMarkdown(out)).toBe(out);
});

test("a table whose widest cell is within the cap pads exactly as it always has", () => {
  // The cap is 200 characters: stored pages keep their Markdown, and their section hashes.
  const wide = "w".repeat(150);
  expect(
    normalizeMarkdown(
      `| Name | Role | Note |\n|-|:-:|--:|\n| Ada | Eng | ${wide} |\n| Bo | PM |  |`,
    ),
  ).toBe(
    [
      `| Name | Role | ${"Note".padEnd(150)} |`,
      `| ---- | :----: | ${"-".repeat(150)}: |`,
      `| Ada  | Eng  | ${wide} |`,
      `| Bo   | PM   | ${"".padEnd(150)} |`,
    ].join("\n"),
  );
});

test("writing a code span's edge spaces never changes a character the document holds", () => {
  // Every private-use character (the stand-in's alphabet), and a run of the first one.
  let all = "";
  for (let code = 0xe000; code <= 0xf8ff; code++)
    all += String.fromCharCode(code);
  const first = String.fromCharCode(0xe000);
  const tail = `${all.slice(0, 2)}${first}${first}`;
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: all },
          { type: "text", text: " a ", marks: [{ type: "code" }] },
          { type: "text", text: tail },
        ],
      },
    ],
  };
  // The code span's spaces held (one more each side), every other character as it was.
  expect(docToMarkdown(doc)).toBe(`${all}\`  a  \`${tail}`);
});

test("nested emphasis and link text never cost the paragraph's indexes: parsing stays linear", () => {
  // Best of two runs: a parse holds tens of thousands of marks, so GC noise is real; quadratic
  // work costs 100× for 10× the text, linear ~10×.
  const time = (source: string) => {
    let best = Infinity;
    for (let run = 0; run < 2; run++) {
      const started = performance.now();
      markdownToDoc(source);
      best = Math.min(best, performance.now() - started);
    }
    return best;
  };
  for (const unit of ["**a _b_ c** ", "[a](b) "]) {
    time(unit.repeat(1_000));
    const small = time(unit.repeat(3_000));
    const large = time(unit.repeat(30_000));
    expect(large, unit).toBeLessThan(6_000);
    expect(large / Math.max(small, 5), unit).toBeLessThan(50);
  }
}, 120_000);

test("emphasis inside emphasis parses: the inner mark is dropped, never the text", () => {
  const doc = markdownToDoc("*a _b_ c* and **x __y__ z**");
  expect(docToText(doc)).toBe("a b c and x y z");
  expect(docToMarkdown(doc)).toBe("*a b c* and **x y z**"); // An image lifted out of such a paragraph too.
  expect(() => markdownToDoc("*a _b_ ![x](/x) c*")).not.toThrow();
});

test("a paragraph's indexes never answer for another that looks alike", () => {
  // Two paragraphs differing in one place the old sampled cache never looked at.
  const a = `*a ${"x".repeat(397)}`;
  const b = `${a.slice(0, 100)}*${a.slice(101)}`;
  const alone = docToMarkdown(markdownToDoc(b));
  expect(docToMarkdown(markdownToDoc(`${a}\n\n${b}`)).split("\n\n")[1]).toBe(
    alone,
  );
  expect(
    markdownToDoc(b)
      .toJSON()
      .content[0].content.some(
        (node: { marks?: unknown[] }) => node.marks?.length,
      ),
  ).toBe(true);
});

test("a host's live block names survive the server's read and write; others stay text", () => {
  const table = ':::table{id="b1" view="v1"}\n:::';
  expect(normalizeMarkdown(table, { liveBlockKinds: ["tasks", "table"] })).toBe(
    table,
  );
  expect(
    markdownToDoc(table, { liveBlockKinds: ["tasks", "table"] }).firstChild
      ?.attrs.kind,
  ).toBe("table");
  expect(normalizeMarkdown(table)).toBe(`\\${table.split("\n")[0]}\n:::`);
  const tasks =
    ':::tasks{id="a" v="1"}\n- [ ] [@A](mention://task/t1) — To do\n:::';
  expect(normalizeMarkdown(tasks)).toBe(tasks);
  expect(markdownToDoc(tasks).firstChild?.attrs.kind).toBeNull();
});
