// @vitest-environment node
/**
 * The VegaStack Markdown round-trip corpus in Node — no DOM, exactly what a collaboration server or
 * an import sees. `packages/ui/registry/lib/text-edit-markdown.test.ts` runs the same cases in
 * Chromium against the same expected output, so the two environments cannot drift apart.
 * The cases and the invariant: `packages/ui/test/vegastack-markdown-corpus.ts`.
 */
import { describe, expect, test } from "vitest";
import {
  ADVERSARIAL,
  ADVERSARIAL_PARAGRAPH,
  caseDoc,
  checkCase,
  corpusCases,
  largeMarkdown,
  roundTripTime,
  repeatTo,
} from "../../packages/ui/test/vegastack-markdown-corpus.ts";
import {
  docToMarkdown,
  markdownToDoc,
} from "../../packages/ui/registry/lib/text-edit-markdown.ts";
import { highlightText } from "../../packages/ui/registry/lib/text-edit-grammar.ts";
import {
  textEditDiffSchema,
  textEditSchema,
  ychangeType,
} from "../../packages/ui/registry/lib/text-edit-schema.ts";

describe("VegaStack Markdown round trip (Node, no DOM)", () => {
  test("runs without a DOM", () => {
    expect(typeof globalThis.window).toBe("undefined");
  });

  for (const each of corpusCases())
    test(each.name, () => {
      expect(checkCase(each)).toEqual([]);
    });

  // The ratios are the guard (quadratic work costs 100× for 10× the text); the absolute ceiling
  // only catches a hang, set for a loaded CI runner (a 1 MB round trip is ~0.5 s on a laptop).
  const CEILING_MS = 6_000;

  test("a round trip is linear: 10× the text costs under 25× the time (quadratic would be 100×)", () => {
    roundTripTime(largeMarkdown(20_000), 1);
    const small = roundTripTime(largeMarkdown(100_000));
    const large = roundTripTime(largeMarkdown(1_000_000));
    expect(large).toBeLessThan(CEILING_MS);
    expect(large / small).toBeLessThan(25);
  }, 60_000);

  for (const [name, unit] of Object.entries(ADVERSARIAL))
    test(`a round trip is linear on adversarial input: ${name}`, () => {
      const small = roundTripTime(repeatTo(unit, 30_000));
      const large = roundTripTime(repeatTo(unit, 300_000));
      expect(large).toBeLessThan(CEILING_MS);
      expect(large / small).toBeLessThan(25);
    }, 60_000);

  for (const [name, unit] of Object.entries(ADVERSARIAL_PARAGRAPH))
    test(`one 100 KB paragraph round-trips within the ceiling: ${name}`, () => {
      expect(roundTripTime(repeatTo(unit, 100_000))).toBeLessThan(CEILING_MS);
    }, 60_000);

  test("a table cell opening with 20,000 line breaks reads and writes within the ceiling", () => {
    const cell = (n) => `| A |\n| --- |\n| ${"<br>".repeat(n)}a |`;
    // The cell's own work (trimming its edge breaks) is linear; marked's tag masking bounds the size.
    expect(roundTripTime(cell(20_000))).toBeLessThan(CEILING_MS);
  }, 60_000);

  test("a version diff's schema reads a Yjs snapshot diff's markings; a live document's never does", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "kept " },
            {
              type: "text",
              text: "new",
              marks: [
                { type: "bold" },
                { type: "ychange", attrs: { type: "added", user: null } },
              ],
            },
            {
              type: "text",
              text: "old",
              marks: [{ type: "ychange", attrs: { type: "removed" } }],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2, ychange: { type: "removed", user: "u1" } },
          content: [{ type: "text", text: "Gone" }],
        },
      ],
    };
    const doc = textEditDiffSchema().nodeFromJSON(json);
    doc.check();
    expect(ychangeType(doc.child(1).attrs.ychange)).toBe("removed");
    expect(
      doc
        .child(0)
        .child(1)
        .marks.map((mark) => mark.type.name),
    ).toEqual(["bold", "ychange"]);
    // The live schema refuses `ychange` — a change mark, and a block marking alone (unknown
    // attributes are otherwise dropped silently, keeping the removed text as live text).
    expect(() => textEditSchema().nodeFromJSON(json)).toThrow(/ychange/);
    const blocksOnly = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { ychange: { type: "removed", user: null } },
          content: [{ type: "text", text: "Deleted passage" }],
        },
      ],
    };
    expect(() => textEditSchema().nodeFromJSON(blocksOnly)).toThrow(/ychange/);
    expect(() =>
      textEditSchema()
        .node("doc", null, [
          textEditSchema().node("paragraph", { ychange: "added" }),
        ])
        .check(),
    ).toThrow(/ychange/);
    // An unchanged document reads as before.
    expect(
      textEditSchema().nodeFromJSON(markdownToDoc("Kept").toJSON()).textContent,
    ).toBe("Kept");
    // A code block's changed lines carry the change mark in a diff.
    const code = textEditDiffSchema().nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "codeBlock",
          content: [
            { type: "text", text: "let a = 1;\n" },
            {
              type: "text",
              text: "let b = 2;",
              marks: [{ type: "ychange", attrs: { type: "removed" } }],
            },
          ],
        },
      ],
    });
    code.check();
    expect(code.child(0).childCount).toBe(2);
    expect(ychangeType("added")).toBe("added");
    expect(ychangeType({ type: "nope" })).toBeNull();
  });

  test("a parse never reuses another document's index: text that looks alike stays whole", () => {
    const filler = "word ".repeat(2_000);
    const a = `<details><summary>T</summary>\n\n${filler}\n\n</details>\n\n${filler}`;
    // The same length and the same head, middle and tail — the closing line made text.
    const b = a.replace("\n</details>\n", "\nclosing text\n");
    markdownToDoc(a);
    const doc = markdownToDoc(b);
    expect(doc.textContent).toContain("closing text");
    expect(docToMarkdown(doc)).toContain("closing text");
  });

  test("a code block of 300 KB of backticks serializes and reads back", () => {
    const code = "` ".repeat(150_000);
    const doc = textEditSchema().nodeFromJSON({
      type: "doc",
      content: [{ type: "codeBlock", content: [{ type: "text", text: code }] }],
    });
    const back = markdownToDoc(docToMarkdown(doc));
    expect(back.firstChild?.textContent).toBe(code);
  });
});

test("a highlight of any length round-trips, and two parses never share state", () => {
  const long = "a".repeat(100_000);
  const doc = markdownToDoc(`==${long}==`);
  expect(doc.firstChild.firstChild.marks.map((mark) => mark.type.name)).toEqual(
    ["highlight"],
  );
  expect(docToMarkdown(markdownToDoc(docToMarkdown(doc)))).toBe(`==${long}==`);
  const a = `==${"a".repeat(298)}`;
  const b = `${a.slice(0, 80)}==${a.slice(82)}`;
  docToMarkdown(markdownToDoc(a));
  expect(docToMarkdown(markdownToDoc(b))).toBe(docToMarkdown(markdownToDoc(b)));
  expect(markdownToDoc(b).firstChild.firstChild.marks.length).toBe(1);
});

test("highlights read in linear time: a rescan has no cutoff, plain text has no per-opener scan", () => {
  const inner = `==a [x](x ==b${"c".repeat(70_000)}==)`;
  expect(JSON.stringify(markdownToDoc(inner).toJSON())).toContain(
    '"highlight"',
  );
  const time = (text) => {
    const start = performance.now();
    highlightText(text);
    return performance.now() - start;
  };
  const small = time("==a ".repeat(20_000));
  const large = time("==a ".repeat(200_000));
  expect(large).toBeLessThan(Math.max(small, 5) * 40);
  // Highlights do not nest: a highlight's text is read without the highlight reader.
  const nested = (n) => `${"==a](".repeat(n)}x${")z==".repeat(n)}`;
  expect(() => highlightText(nested(20_000))).not.toThrow();
  expect(() => markdownToDoc(nested(20_000))).not.toThrow();
  // A run of many highlighted space nodes is written in linear time.
  const spaces = (n) => ({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          ...Array.from({ length: n }, (_, i) => ({
            type: "text",
            text: " ",
            marks: [{ type: "highlight" }, { type: i % 2 ? "bold" : "italic" }],
          })),
          { type: "text", text: "x", marks: [{ type: "highlight" }] },
        ],
      },
    ],
  });
  const write = (n) => {
    const doc = textEditSchema().nodeFromJSON(spaces(n));
    const start = performance.now();
    docToMarkdown(doc);
    return performance.now() - start;
  };
  const fewNodes = write(4_000);
  expect(write(40_000)).toBeLessThan(Math.max(fewNodes, 5) * 40);
  const spans = (n) => `==a ${"`x` ".repeat(n)}${"==a ".repeat(n)}\`x==\``;
  const few = time(spans(4_000));
  expect(time(spans(40_000))).toBeLessThan(Math.max(few, 5) * 40);
});

test("every highlighted character stays highlighted through Markdown and back", () => {
  // Each non-space character of a document, in order, and whether it is highlighted.
  const flags = (doc) => {
    const out = [];
    doc.descendants((node) => {
      if (node.isText) {
        const on = node.marks.some((mark) => mark.type.name === "highlight");
        for (const ch of node.text) if (!/\s/.test(ch)) out.push([ch, on]);
      } else if (node.isLeaf) out.push(["\uFFFC", false]);
      return true;
    });
    return out;
  };
  for (const each of corpusCases().filter((c) =>
    c.name.includes("highlight"),
  )) {
    const before = flags(caseDoc(each));
    const after = flags(markdownToDoc(docToMarkdown(caseDoc(each))));
    expect(after.map(([ch]) => ch).join(""), each.name).toBe(
      before.map(([ch]) => ch).join(""),
    );
    before.forEach(([ch, on], at) => {
      if (on) expect(after[at][1], `${each.name}: ${ch} at ${at}`).toBe(true);
    });
  }
});
