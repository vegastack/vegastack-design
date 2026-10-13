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
  checkCase,
  corpusCases,
  largeMarkdown,
  parseTime,
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

  test("parsing is linear: 1 MB in well under 1.5 s, and 10× the text costs under 15× the time", () => {
    parseTime(largeMarkdown(20_000), 1);
    const small = parseTime(largeMarkdown(100_000));
    const large = parseTime(largeMarkdown(1_000_000));
    expect(large).toBeLessThan(1_500);
    expect(large / small).toBeLessThan(15);
  }, 60_000);

  for (const [name, unit] of Object.entries(ADVERSARIAL))
    test(`parsing is linear on adversarial input: ${name}`, () => {
      const small = parseTime(repeatTo(unit, 30_000));
      const large = parseTime(repeatTo(unit, 300_000));
      expect(large).toBeLessThan(1_500);
      expect(large / small).toBeLessThan(15);
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
