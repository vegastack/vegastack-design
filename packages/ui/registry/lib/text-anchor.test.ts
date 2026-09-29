import { describe, expect, test } from "vitest";
import { anchorFromRange, resolveAnchor } from "./text-anchor";

describe("anchorFromRange", () => {
  test("keeps the quote and up to 80 characters of context on each side", () => {
    const text = `${"a".repeat(100)}QUOTE${"b".repeat(100)}`;
    const anchor = anchorFromRange(text, 100, 105);
    expect(anchor.quote).toBe("QUOTE");
    expect(anchor.prefix).toBe("a".repeat(80));
    expect(anchor.suffix).toBe("b".repeat(80));
  });
});

describe("resolveAnchor", () => {
  const text = "alpha beta gamma beta";
  const anchor = anchorFromRange(text, 17, 21);

  test.each([
    ["the text is unchanged: the stored offsets", text, { start: 17, end: 21 }],
    [
      "text was added before it: the context wins",
      "x alpha beta gamma beta",
      { start: 19, end: 23 },
    ],
    [
      "the quote moved and its context changed, but it is unique",
      "beta — rewritten",
      { start: 0, end: 4 },
    ],
    [
      "the quote is duplicated and the context is partly kept: the closest context wins",
      "zeta beta gamma beta!",
      { start: 16, end: 20 },
    ],
    ["the quoted words were deleted", "alpha gamma", null],
  ])("%s", (_name, next, expected) => {
    expect(resolveAnchor(next, anchor)).toEqual(expected);
  });

  test("the stored offsets match whitespace-insensitively", () => {
    const a = anchorFromRange("one two  three", 4, 9);
    expect(resolveAnchor("one two\n three", a)).toEqual({ start: 4, end: 9 });
  });

  test("an empty quote never resolves", () => {
    expect(resolveAnchor("abc", anchorFromRange("abc", 1, 1))).toBeNull();
  });
});
