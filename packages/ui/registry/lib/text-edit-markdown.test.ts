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
