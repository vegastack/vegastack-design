"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Wrapper } from "./wrapper";

// TextEdit pulls in Tiptap; keep it out of the all-preview barrel's initial module graph.
const TextEdit = dynamic(
  () => import("@/components/ui/text-edit").then((module) => module.TextEdit),
  { ssr: false },
);

/**
 * Editing state — the interactive editor with its formatting toolbar, seeded with
 * controlled HTML. Type or use the toolbar; links render in `info` (blue) and
 * inline code in a `rounded-sm` `bg-muted` chip.
 */
export function textEdit(): ReactNode {
  const [html, setHtml] = useState(
    '<h2>Release notes</h2><p>Type <strong>bold</strong>, <em>italic</em>, or a <code>code</code> snippet, and link to <a href="https://vegastack.com">the docs</a>. Markdown shortcuts work too — try <code>## </code>, <code>- </code>, or <code>&gt; </code>.</p>',
  );
  return (
    <Wrapper className="items-stretch">
      <TextEdit
        value={html}
        onValueChange={setHtml}
        placeholder="Write something…"
        aria-label="Release notes"
      />
    </Wrapper>
  );
}

/**
 * The non-editing states:
 * - **Empty** — an editable editor showing only its placeholder.
 * - **Display (read-only)** — `editable={false}` hides the toolbar and renders
 *   stored rich text for previews and comments.
 */
export function textEditStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        placeholder="Empty editor with a placeholder…"
        aria-label="Empty editor"
      />
      <TextEdit
        editable={false}
        value="<h2>Read-only</h2><ul><li>Renders rich text without a toolbar.</li><li>Useful for previews and comments.</li></ul>"
        aria-label="Read-only editor"
      />
    </Wrapper>
  );
}

/**
 * Invalid (error) state — `aria-invalid` forwards to the contenteditable textbox
 * and the container picks up `has-aria-invalid:border-destructive/(--alpha-tint-border)` (a
 * destructive border) plus `data-invalid`. Pair it with `aria-describedby` so the
 * error text is announced with the region.
 */
export function textEditInvalid(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="space-y-1.5">
        <TextEdit
          defaultValue="<p>This comment needs at least one sentence.</p>"
          aria-label="Comment"
          aria-invalid
          aria-describedby="text-edit-invalid-error"
        />
        <p
          id="text-edit-invalid-error"
          className="text-base text-destructive-text"
        >
          A comment is required before you can post.
        </p>
      </div>
    </Wrapper>
  );
}

/**
 * Submit affordance — pressing <kbd>Cmd/Ctrl</kbd>+<kbd>Enter</kbd> inside the
 * editor fires `onSubmit` with the current HTML (plain <kbd>Enter</kbd> still
 * inserts a newline). The host decides what submitting means; here it raises a
 * toast. Try it: click in, type, then press Cmd/Ctrl+Enter.
 */
export function textEditSubmit(): ReactNode {
  const [html, setHtml] = useState("<p>Press Cmd/Ctrl+Enter to submit…</p>");
  return (
    <Wrapper className="items-stretch">
      <TextEdit
        value={html}
        onValueChange={setHtml}
        onSubmit={() => toast.success("Submitted with Cmd/Ctrl+Enter")}
        placeholder="Write a reply…"
        aria-label="Reply"
      />
    </Wrapper>
  );
}

/**
 * Sized content area — `minHeight` sets a starting height and `maxHeight` caps it,
 * scrolling past the cap (`overflow-y-auto`). A number is treated as `px`; a
 * string (e.g. `'8rem'`) is used verbatim. Both feed `--te-min-h` / `--te-max-h`.
 */
export function textEditHeights(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <TextEdit
        minHeight={120}
        maxHeight={200}
        defaultValue="<h2>Sized editor</h2><p>This editor starts at a 120px minimum and caps at 200px — once the content grows past the cap, the area scrolls.</p><p>Add a few more paragraphs and the toolbar stays pinned while the body scrolls.</p><ul><li>Resize-free, height-bounded.</li><li>Great for inline reply boxes.</li><li>Keep typing to push past the cap…</li></ul><p>And here is one more line to make sure the scroll kicks in.</p>"
        placeholder="Write something…"
        aria-label="Sized editor"
      />
    </Wrapper>
  );
}
