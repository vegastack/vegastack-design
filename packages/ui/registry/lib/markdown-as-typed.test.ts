import { expect, test } from "vitest";
import { docToMarkdown } from "./text-edit-markdown";
import { markdownAsTyped } from "./markdown-as-typed";

test("markdownAsTyped: what was typed reads as typed; formatting and code stay", () => {
  const typed = (text: string) =>
    docToMarkdown({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    });
  for (const text of [
    "rename __init__ and _private_ in snake_case",
    "a *b* c and 2 * 3",
    "[1] and [a](b) as text",
    "C:\\Users\\me and a\\_b",
    "~~not struck~~ and ==not marked==",
  ])
    expect(markdownAsTyped(typed(text))).toBe(text);
  expect(markdownAsTyped("**bold** and \\_x\\_")).toBe("**bold** and _x_");
  expect(markdownAsTyped("one\\\ntwo")).toBe("one\ntwo");
  expect(markdownAsTyped("`a\\_b` and\n```\nkeep \\_ here\n```")).toBe(
    "`a\\_b` and\n```\nkeep \\_ here\n```",
  );
});

test("markdownAsTyped: code spans, fences, links, autolinks, entities and breaks", () => {
  // An escaped backtick is text; a real span keeps its backslashes, across lines too.
  expect(markdownAsTyped("\\`a\\` and ``a`b\\_c``")).toBe(
    "`a` and ``a`b\\_c``",
  );
  // A span never runs over a line: the writer ends a code mark at a break.
  expect(markdownAsTyped("`x\\_\ny\\_`")).toBe("`x_\ny_`");
  expect(markdownAsTyped("> one ` \\*a\\*\n>\n> two `")).toBe(
    "> one ` *a*\n>\n> two `",
  );
  expect(markdownAsTyped("one ` \\*a\\*\n# two `")).toBe("one ` *a*\n# two `");
  // A ~~~ fence closes only on a line that is just the fence.
  expect(markdownAsTyped("~~~\n~~~oops \\_\nkeep \\_\n~~~\nafter \\_")).toBe(
    "~~~\n~~~oops \\_\nkeep \\_\n~~~\nafter _",
  );
  // In a list item the fence still holds.
  expect(markdownAsTyped("- a\n  ```\n  \\_\n  ```")).toBe(
    "- a\n  ```\n  \\_\n  ```",
  );
  // Destinations and autolinks stay; link text reads as typed.
  expect(
    markdownAsTyped("[a\\_b](https://x.test/a\\_b) <https://x.test/a\\_b>"),
  ).toBe("[a_b](https://x.test/a\\_b) <https://x.test/a\\_b>");
  // Entities decode once: a typed "&amp;" stays "&amp;".
  expect(markdownAsTyped("R&amp;amp;D &#32;x&#92;")).toBe("R&amp;D  x\\");
  // A <br> (headings, table cells) and a hard break are newlines.
  expect(markdownAsTyped("# a<br>b")).toBe("# a\nb");
});

test("markdownAsTyped: only a real link keeps its destination; spans stay in their paragraph", () => {
  expect(markdownAsTyped("\\[a](b \\*c\\*)")).toBe("[a](b *c*)");
  expect(markdownAsTyped('[x](<https://x.test/a(b> "&amp;")')).toBe(
    '[x](<https://x.test/a(b> "&amp;")',
  );
  expect(markdownAsTyped("one \\` \\*a\\*\n\ntwo \\`")).toBe(
    "one ` *a*\n\ntwo `",
  );
  expect(markdownAsTyped("one ` \\*a\\*\n\ntwo `")).toBe("one ` *a*\n\ntwo `");
  expect(markdownAsTyped('> one [\n>\n> two ](a "\\*b\\*")')).toBe(
    '> one [\n>\n> two ](a "*b*")',
  );
});
