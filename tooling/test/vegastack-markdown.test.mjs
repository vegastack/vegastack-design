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
    // The live schema has no `ychange`: a diff never reaches a document.
    expect(() => textEditSchema().nodeFromJSON(json)).toThrow(/ychange/);
    expect(textEditSchema().nodes.heading.spec.attrs?.ychange).toBeUndefined();
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
