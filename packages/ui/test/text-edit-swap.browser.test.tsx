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
