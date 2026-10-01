import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { preloadTextEdit, TextEdit } from "../registry/ui/text-edit";

/*
 * The read view a `TextEdit` paints first and the Tiptap editor that replaces it must be the same
 * pixels: the first line's text box and the caret may not move by more than half a pixel across the
 * swap (the jitter and the caret nudge a reader sees on the first click). The editor module is
 * shared by the page, so the read view is measured on a twin (`readOnly`, which never mounts the
 * editor) laid out in an identical box, offsets taken from each root.
 */

/** The first line's box relative to the root: the first character's rect, else the first block's. */
function firstLine(root: HTMLElement) {
  const origin = root.getBoundingClientRect();
  const surface = root.querySelector(
    ".ProseMirror, [data-slot=text-edit-read]",
  )!;
  const block = surface.querySelector("p")!;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const text = walker.nextNode();
  let rect: DOMRect;
  if (text) {
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 1);
    rect = range.getBoundingClientRect();
  } else rect = block.getBoundingClientRect();
  return {
    x: rect.x - origin.x,
    y: rect.y - origin.y,
    h: rect.height,
    root: origin.height,
  };
}

const CASES = [
  ["document, empty", "document", ""],
  ["document, with text", "document", "Hello world, a first line."],
  ["composer, empty", "composer", ""],
  ["composer, with text", "composer", "Hello world, a first line."],
] as const;

test.each(CASES)(
  "%s: the editor lays out its first line exactly where the read view did",
  async (_name, variant, value) => {
    const shared = {
      variant,
      format: "markdown" as const,
      defaultValue: value,
      placeholder: "Add a comment…",
    };
    // Loaded, an editable TextEdit mounts its editor at once.
    await preloadTextEdit();
    const screen = await render(
      <div style={{ width: 480 }}>
        <div data-twin="read">
          <TextEdit {...shared} readOnly aria-label="Read" />
        </div>
        <div data-twin="edit">
          <TextEdit {...shared} aria-label="Edit" />
        </div>
      </div>,
    );
    const read = screen.container.querySelector<HTMLElement>(
      "[data-twin=read] [data-slot=text-edit]",
    )!;
    const edit = screen.container.querySelector<HTMLElement>(
      "[data-twin=edit] [data-slot=text-edit]",
    )!;
    await vi.waitFor(() => {
      expect(edit.querySelector(".ProseMirror")).not.toBeNull();
      expect(edit.querySelector("[data-slot=text-edit-read]")).toBeNull();
    });
    const before = firstLine(read);
    const after = firstLine(edit);
    for (const key of ["x", "y", "h", "root"] as const)
      expect(
        Math.abs(before[key] - after[key]),
        `${key}: ${before[key]} → ${after[key]}`,
      ).toBeLessThanOrEqual(0.5);
    // The caret at the start of the first line sits where the read view's first line starts.
    const editor = edit.querySelector<HTMLElement>(".ProseMirror")!;
    editor.focus();
    const first = editor.querySelector("p")!;
    const range = document.createRange();
    range.setStart(first, 0);
    range.collapse(true);
    const caret = range.getClientRects()[0];
    if (caret)
      expect(
        Math.abs(caret.x - edit.getBoundingClientRect().x - before.x),
      ).toBeLessThanOrEqual(0.5);
  },
);

const RICH = [
  "# Heading one",
  "",
  "A paragraph with `inline code`, **bold** and a [link](https://example.com).",
  "",
  "- first item",
  "- second item",
  "",
  "1. one",
  "2. two",
  "",
  "- [ ] a task",
  "- [x] done task",
  "",
  "> A quote line.",
  "",
  "> [!WARNING]",
  "> A warning callout.",
  "",
  "```ts",
  "const a = 1;",
  "```",
  "",
  "| A | B |",
  "| --- | --- |",
  "| one | two |",
  "",
  "<details open><summary>Toggle title</summary>",
  "",
  "Toggle body",
  "",
  "</details>",
  "",
  "See [data.csv](/api/files/f1/download) here.",
  "",
  "---",
  "",
  "End paragraph.",
].join("\n");

test("a rich document: every block sits where the read view put it", async () => {
  await preloadTextEdit();
  const shared = { format: "markdown" as const, defaultValue: RICH };
  const screen = await render(
    <div style={{ width: 640 }}>
      <div data-twin="read">
        <TextEdit {...shared} readOnly aria-label="Read" />
      </div>
      <div data-twin="edit">
        <TextEdit {...shared} aria-label="Edit" />
      </div>
    </div>,
  );
  const read = screen.container.querySelector<HTMLElement>(
    "[data-twin=read] [data-slot=text-edit]",
  )!;
  const edit = screen.container.querySelector<HTMLElement>(
    "[data-twin=edit] [data-slot=text-edit]",
  )!;
  await vi.waitFor(() =>
    expect(edit.querySelector(".ProseMirror")).not.toBeNull(),
  );
  // Let the code highlighting and the node views settle.
  await new Promise((resolve) => setTimeout(resolve, 300));
  const blocks = (root: HTMLElement) => {
    const surface = root.querySelector(
      ".ProseMirror, [data-slot=text-edit-read]",
    )!;
    const origin = root.getBoundingClientRect();
    return [...surface.children]
      .filter((child) => child.getBoundingClientRect().height > 0)
      .map((child) => {
        const rect = child.getBoundingClientRect();
        // The first character's left edge: text inside a block lines up too, not only the box.
        const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
        let text = walker.nextNode();
        while (text && !text.textContent?.trim()) text = walker.nextNode();
        let tx = -1;
        if (text) {
          const range = document.createRange();
          const at = text.textContent!.search(/\S/);
          range.setStart(text, at);
          range.setEnd(text, at + 1);
          tx = Math.round((range.getBoundingClientRect().x - origin.x) * 2) / 2;
        }
        return {
          tx,
          tag: child.tagName.toLowerCase(),
          slot: child.getAttribute("data-slot") ?? "",
          y: Math.round((rect.y - origin.y) * 2) / 2,
          h: Math.round(rect.height * 2) / 2,
          x: Math.round((rect.x - origin.x) * 2) / 2,
        };
      });
  };
  const a = blocks(read);
  const b = blocks(edit);
  const lines = (list: typeof a) =>
    list.map((each) => `${each.y} +${each.h} @${each.x} t${each.tx}`);
  expect(lines(b)).toEqual(lines(a));
});

test("composer: 32px at rest, like Input, with an empty footer taking no room", async () => {
  await preloadTextEdit();
  const screen = await render(
    <div style={{ width: 480 }}>
      <TextEdit
        variant="composer"
        format="markdown"
        placeholder="Add a comment…"
        aria-label="Comment"
        actions={<button type="button" style={{ width: 28, height: 28 }} />}
        footer={<div />}
      />
    </div>,
  );
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=text-edit]",
  )!;
  await vi.waitFor(() =>
    expect(root.querySelector(".ProseMirror")).not.toBeNull(),
  );
  expect(root.getBoundingClientRect().height).toBe(32);
});
