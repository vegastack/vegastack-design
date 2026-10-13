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
import { textEditSchema } from "../../packages/ui/registry/lib/text-edit-schema.ts";

describe("VegaStack Markdown round trip (Node, no DOM)", () => {
  test("runs without a DOM", () => {
    expect(typeof globalThis.window).toBe("undefined");
  });

  for (const each of corpusCases())
    test(each.name, () => {
      expect(checkCase(each)).toEqual([]);
    });

  test("a round trip is linear: 1 MB in well under 1.5 s, and 10× the text costs under 15× the time", () => {
    roundTripTime(largeMarkdown(20_000), 1);
    const small = roundTripTime(largeMarkdown(100_000));
    const large = roundTripTime(largeMarkdown(1_000_000));
    expect(large).toBeLessThan(1_500);
    expect(large / small).toBeLessThan(15);
  }, 60_000);

  for (const [name, unit] of Object.entries(ADVERSARIAL))
    test(`a round trip is linear on adversarial input: ${name}`, () => {
      const small = roundTripTime(repeatTo(unit, 30_000));
      const large = roundTripTime(repeatTo(unit, 300_000));
      expect(large).toBeLessThan(1_500);
      expect(large / small).toBeLessThan(15);
    }, 60_000);

  for (const [name, unit] of Object.entries(ADVERSARIAL_PARAGRAPH))
    test(`one 100 KB paragraph round-trips well under 1.5 s: ${name}`, () => {
      expect(roundTripTime(repeatTo(unit, 100_000))).toBeLessThan(1_500);
    }, 60_000);

  test("a table cell opening with 20,000 line breaks reads and writes well under 1.5 s", () => {
    const cell = (n) => `| A |\n| --- |\n| ${"<br>".repeat(n)}a |`;
    // The cell's own work (trimming its edge breaks) is linear; marked's tag masking bounds the size.
    expect(roundTripTime(cell(20_000))).toBeLessThan(1_500);
  }, 60_000);

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
