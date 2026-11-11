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
