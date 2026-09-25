"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { toast } from "@/components/ui/toast";
import { MarkdownView } from "@/components/ui/markdown-view";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Wrapper } from "./wrapper";

// TextEdit pulls in Tiptap; keep it out of the all-preview barrel's initial module graph.
const TextEdit = dynamic(
  () => import("@/components/ui/text-edit").then((module) => module.TextEdit),
  { ssr: false },
);

/**
 * Editing state — the interactive editor, seeded with controlled HTML. Type `/` for blocks or
 * select text to format it; links render in `info` (blue) and inline code in a `bg-muted` chip.
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
 * - **Display (read-only)** — `readOnly` renders stored rich text for previews.
 */
export function textEditStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        placeholder="Empty editor with a placeholder…"
        aria-label="Empty editor"
      />
      <TextEdit
        readOnly
        value="<h2>Read-only</h2><ul><li>Renders rich text without editing.</li><li>Useful for previews and comments.</li></ul>"
        aria-label="Read-only editor"
      />
      <TextEdit
        disabled
        value="<p>Disabled: dimmed and announced as unavailable.</p>"
        aria-label="Disabled editor"
      />
    </Wrapper>
  );
}

export function textEditMarkdown(): ReactNode {
  const [markdown, setMarkdown] = useState(
    "## Release notes\n\n- **Faster** search\n- A new [changelog](https://design.vegastack.com/docs/changelog)",
  );
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        aria-label="Release notes"
      />
      <pre className="min-w-0 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
        {markdown}
      </pre>
    </Wrapper>
  );
}

/**
 * Invalid (error) state — `aria-invalid` forwards to the contenteditable textbox
 * and the root carries `data-invalid`. The editor draws no border, so the error
 * text is the cue: pair it with `aria-describedby` so it is announced with the region.
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
          className="text-sm text-destructive-text"
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
        onSubmit={() =>
          toast.add({ type: "success", title: "Submitted with Cmd/Ctrl+Enter" })
        }
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
        defaultValue="<h2>Sized editor</h2><p>This editor starts at a 120px minimum and caps at 200px — once the content grows past the cap, the area scrolls.</p><p>Add a few more paragraphs and the body scrolls inside the cap.</p><ul><li>Resize-free, height-bounded.</li><li>Great for inline reply boxes.</li><li>Keep typing to push past the cap…</li></ul><p>And here is one more line to make sure the scroll kicks in.</p>"
        placeholder="Write something…"
        aria-label="Sized editor"
      />
    </Wrapper>
  );
}

/**
 * DS-47: inside a `Field` the contenteditable is labelled by `FieldLabel`, described by the
 * rendered description and error, and marked invalid — no ids to wire.
 */
export function textEditInsideField(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Field data-invalid>
        <FieldLabel>Meeting summary</FieldLabel>
        <TextEdit placeholder="What was decided?" />
        <FieldDescription>
          Shown at the top of the meeting page.
        </FieldDescription>
        <FieldError>Write a summary before you publish.</FieldError>
      </Field>
    </Wrapper>
  );
}

/** Every element the shared `prose` recipe covers, in one document. */
const MARKDOWN_SAMPLE = `# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

A paragraph with **bold**, _italic_, ~~strikethrough~~, \`inline code\` and a [link](https://vegastack.com).
A hard line break follows,\\
then https://example.com autolinks in view mode.

- Bullet item
- Another item
  - Nested item

1. First
2. Second
   1. Nested ordered

- [x] Done task
- [ ] Open task
  - [ ] Nested task

> A blockquote carries a quoted thought.

\`\`\`ts
const answer = 42;
\`\`\`

---

| Name | Role |
| --- | --- |
| Ada | Engineer |
| Grace | Admiral |

![VegaStack mark](/brand/vegastack-mark.svg)`;

const SHORT_SAMPLE = `## Weekly sync

Decided to **ship the beta** on Friday. Owners:

- [x] Draft release notes
- [ ] Update the _pricing_ page

> Follow up with legal about the terms.`;

/**
 * Visual parity — the same markdown rendered by `MarkdownView` (top) and edited by a
 * `TextEdit` (bottom). The shared `prose` recipe and the ProseMirror resets make every element sit
 * at the same position in both.
 */
export function markdownParity(): ReactNode {
  const [markdown, setMarkdown] = useState(MARKDOWN_SAMPLE);
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <section className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">View</span>
        <MarkdownView allowedImageOrigins={[]}>{markdown}</MarkdownView>
      </section>
      <section className="flex flex-col gap-2 border-t border-border pt-6">
        <span className="text-xs font-medium text-muted-foreground">Edit</span>
        <TextEdit
          format="markdown"
          value={markdown}
          onValueChange={setMarkdown}
          aria-label="Markdown document"
        />
      </section>
    </Wrapper>
  );
}

/**
 * The slash menu — type `/` anywhere to insert a block: text, headings, lists, a checklist, a
 * quote, a code block, a divider or a link. Type to filter; ↑↓ move, Enter picks, Esc closes.
 */
export function markdownSlashMenu(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <TextEdit
        format="markdown"
        defaultValue={SHORT_SAMPLE}
        placeholder="Write something…"
        aria-label="Notes"
      />
    </Wrapper>
  );
}

/** `slashCommands` limits the menu — a comment composer offers a smaller set. */
export function markdownSlashCommandsLimited(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <TextEdit
        format="markdown"
        slashCommands={[
          "bulletList",
          "orderedList",
          "taskList",
          "codeBlock",
          "link",
        ]}
        placeholder="Leave a comment…"
        aria-label="Comment"
      />
    </Wrapper>
  );
}

/** Select text to see the bubble menu: bold, italic, strikethrough, inline code and link. */
export function markdownBubbleMenu(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <TextEdit
        format="markdown"
        defaultValue="Select any **part of this sentence** to format it from the floating bubble menu."
        aria-label="Bubble menu demo"
      />
    </Wrapper>
  );
}

/**
 * Notion-style editing — there is no view mode to swap out of. The editor rests looking exactly like
 * `MarkdownView`; click anywhere and type. Leaving commits through `onCommit` (only when the text
 * changed), Esc reverts to what it was when you clicked in.
 */
export function markdownInPlace(): ReactNode {
  const [saved, setSaved] = useState(SHORT_SAMPLE);
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        defaultValue={saved}
        onCommit={(next) => {
          setSaved(next);
          toast.add({ type: "success", title: "Saved" });
        }}
        aria-label="Summary"
      />
    </Wrapper>
  );
}

/** `autosave` — `onCommit` also fires after an idle gap (1000ms for `true`). Off by default. */
export function markdownAutosave(): ReactNode {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        autosave
        defaultValue="Type here — it saves itself a second after you stop."
        onCommit={() => setSavedAt(new Date().toLocaleTimeString())}
        aria-label="Autosaving note"
      />
      <span className="text-xs text-muted-foreground">
        {savedAt ? `Saved at ${savedAt}` : "Not saved yet"}
      </span>
    </Wrapper>
  );
}
