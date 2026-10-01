"use client";

import { useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MarkdownView } from "@/components/ui/markdown-view";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type {
  MentionOption,
  TextEditAnnotation,
  TextEditAnnotationLayout,
  TextEditHandle,
  TextEditOutlineItem,
} from "@/components/ui/text-edit";
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
      <TextEdit placeholder="Add a description…" aria-label="Empty editor" />
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
 * `variant="boxed"` — the editor framed as a bordered field, for a composer or a form field. The
 * border darkens subtly while the editor holds focus; `children` render inside the box after the
 * document (here, the composer's actions row).
 */
export function textEditBoxed(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        variant="boxed"
        format="markdown"
        placeholder="Add a comment…"
        aria-label="Comment"
      >
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Comment</Button>
        </div>
      </TextEdit>
    </Wrapper>
  );
}

/** A boxed editor marked `aria-invalid` keeps its destructive border, focused or not. */
export function textEditBoxedInvalid(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="space-y-1.5">
        <TextEdit
          variant="boxed"
          placeholder="Add a comment…"
          aria-label="Comment"
          aria-invalid
          aria-describedby="text-edit-boxed-invalid-error"
        />
        <p
          id="text-edit-boxed-invalid-error"
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
 * The slash menu — type `/` anywhere to insert a block: text, headings 1–4, lists, a checklist, a
 * quote, a code block, a table, an image, a divider or a link. Type to filter; ↑↓ move, Enter
 * picks, Esc closes.
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
        placeholder="Add a comment…"
        aria-label="Comment"
      />
    </Wrapper>
  );
}

/**
 * Select text to see the bubble menu: Turn into, bold, italic, strikethrough, inline code, link
 * (edit, open, remove) and clear formatting. It floats in a portal, so no container clips it.
 */
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

/**
 * The recommended placeholder copy: "Add a description…" on a record, "Add a summary…" on a
 * meeting, "Add a comment…" in a composer. Focused and still empty, each becomes the "Type / for
 * commands" hint.
 */
export function textEditPlaceholders(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <TextEdit
        format="markdown"
        placeholder="Add a description…"
        aria-label="Description"
      />
      <TextEdit
        format="markdown"
        placeholder="Add a summary…"
        aria-label="Summary"
      />
      <TextEdit
        format="markdown"
        slashCommands={[
          "bulletList",
          "orderedList",
          "taskList",
          "blockquote",
          "codeBlock",
          "link",
        ]}
        dragHandles={false}
        placeholder="Add a comment…"
        aria-label="Comment"
      />
    </Wrapper>
  );
}

const TABLE_SAMPLE = `| Owner | Task           | Due    |
| ----- | -------------- | ------ |
| Ada   | Release notes  | Friday |
| Grace | Pricing page   | Monday |
| Linus | Legal review   | Today  |`;

/**
 * GFM tables, Notion's simple table. Hover a cell for its row and column grips — click one for its
 * menu, drag it to reorder; the corner grip beside the table opens the table menu; the "+" bars add
 * a row or a column at the end; drag a column border to resize. Tab and Shift+Tab move between
 * cells (Tab in the last cell adds a row). The markdown below updates as you edit.
 */
export function markdownTables(): ReactNode {
  const [markdown, setMarkdown] = useState(TABLE_SAMPLE);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        aria-label="Table"
      />
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs">
        {markdown}
      </pre>
    </Wrapper>
  );
}

const HTML_TABLE_SAMPLE =
  "<table><tbody><tr><th><p>Plan</p></th><th><p>Seats</p></th><th><p>Price</p></th></tr><tr><th><p>Starter</p></th><td><p>5</p></td><td><p>Free</p></td></tr><tr><th><p>Team</p></th><td><p>25</p></td><td><p>$12</p></td></tr></tbody></table>";

/**
 * An HTML-format table, where the corner, first-row and first-column menus also toggle the header
 * row and the header column (markdown always has exactly one header row, so those toggles appear
 * only here). Beside it, the same table in `MarkdownView` — the read view — in identical styles.
 */
export function htmlTables(): ReactNode {
  const [html, setHtml] = useState(HTML_TABLE_SAMPLE);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <TextEdit value={html} onValueChange={setHtml} aria-label="Plans" />
      <MarkdownView format="html">{html}</MarkdownView>
    </Wrapper>
  );
}

/**
 * Block handles — hover any block (or list item) for the ⋮⋮ handle at its left and drag it to a new
 * place; click it to select the block. ⌘⇧↑ and ⌘⇧↓ move the block the caret is in.
 * `dragHandles=false` turns the handle and the table grips off (comments do).
 */
export function markdownBlockHandles(): ReactNode {
  const [markdown, setMarkdown] = useState(
    "## Agenda\n\nDrag a block by its handle.\n\n- First item\n- Second item\n- Third item\n\n> A quote moves as one block.",
  );
  return (
    <Wrapper className="flex-col items-stretch gap-4 ps-8">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        aria-label="Agenda"
      />
    </Wrapper>
  );
}

/* ---- Library: mentions, uploads, callouts and toggles, outline, comment highlights ------------ */

const PEOPLE: MentionOption[] = [
  { kind: "user", id: "u1", label: "Asha Rao", description: "Electrical" },
  { kind: "user", id: "u2", label: "Bo Lindqvist", description: "Site lead" },
  { kind: "page", id: "p1", label: "Q3 install plan", icon: "📋" },
  { kind: "page", id: "p2", label: "Breaker sizing", icon: "⚡" },
  { kind: "file", id: "f1", label: "panel-layout.pdf" },
  { kind: "task", id: "t1", label: "Wire the east panel" },
];

/** A stand-in for the host's search: filters the list above, after a short wait. */
const searchPeople = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<MentionOption[]>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        resolve(
          PEOPLE.filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase()),
          ),
        ),
      200,
    );
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/**
 * Mentions — type `@` for people, pages, files and tasks. A pick becomes a chip stored as
 * `[@Label](mention://kind/id)`; ⌘-click a page chip to open it.
 */
export function textEditMentions(): ReactNode {
  const [markdown, setMarkdown] = useState(
    "Ask [@Asha Rao](mention://user/u1) to check [@Breaker sizing](mention://page/p2) before [@Wire the east panel](mention://task/t1). Type @ to mention someone.",
  );
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        mentions={{
          kinds: ["user", "page", "file", "task"],
          search: searchPeople,
        }}
        mentionHref={(kind, id) => `#${kind}-${id}`}
        aria-label="Notes with mentions"
      />
      <pre className="min-w-0 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
        {markdown}
      </pre>
    </Wrapper>
  );
}

/**
 * Uploads — paste or drop an image (or pick one from the slash menu's Image), or drop any file.
 * The placeholder stays until the host's upload resolves; this demo "uploads" in a second.
 */
export function textEditUploads(): ReactNode {
  const [markdown, setMarkdown] = useState(
    "Paste a screenshot here, or type / and pick Image or File.",
  );
  const later = <T,>(value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), 1200));
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        onImageUpload={(file) => later({ src: URL.createObjectURL(file) })}
        onFileUpload={(file) =>
          later({
            href: `/api/files/demo/${encodeURIComponent(file.name)}`,
            name: file.name,
          })
        }
        onUploadError={(file) =>
          toast.add({ title: `Couldn't upload ${file.name}` })
        }
        aria-label="Notes with uploads"
      />
    </Wrapper>
  );
}

/**
 * Images — hover one for its ⋯ menu (Open, Download, Copy link, Remove image); drag a corner or a
 * side to resize it (the width snaps to a quarter, half, three quarters or the full width, and is
 * kept in the Markdown as `![alt|width](src)`); double-click to open it in the file viewer.
 */
export function textEditImages(): ReactNode {
  const [markdown, setMarkdown] = useState(
    "A site photo, resized:\n\n![Ridge at dusk|240](/preview/landscape.svg)\n\nAnd the full-size one: ![Valley](/preview/landscape.svg)",
  );
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        aria-label="Notes with images"
      />
    </Wrapper>
  );
}

/**
 * Callouts and toggles — GitHub's alerts (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`,
 * `[!CAUTION]`) as `Alert`s, and `<details>`, from the slash menu. Click a callout's icon to change
 * its tone.
 */
export function textEditCallouts(): ReactNode {
  const [markdown, setMarkdown] = useState(
    "> [!NOTE]\n> The survey is booked for `09:30` on Monday.\n\n> [!TIP]\n> Use a 25 A breaker for the kitchen circuit.\n\n> [!IMPORTANT]\n> The client signs off each room before tiling.\n\n> [!WARNING]\n> Isolate the supply before opening the panel.\n\n> [!CAUTION]\n> Never work on a live circuit.\n\n<details><summary>Wiring colours</summary>\n\n- Brown: live\n- Blue: neutral\n\n</details>",
  );
  return (
    <Wrapper className="flex-col items-stretch">
      <TextEdit
        format="markdown"
        value={markdown}
        onValueChange={setMarkdown}
        aria-label="Notes with callouts"
      />
      <pre className="min-w-0 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
        {markdown}
      </pre>
    </Wrapper>
  );
}

/** Outline — `onOutlineChange` feeds a rail; `handleRef.scrollToHeading` jumps to a heading. */
export function textEditOutline(): ReactNode {
  const handle = useRef<TextEditHandle>(null);
  const [outline, setOutline] = useState<TextEditOutlineItem[]>([]);
  return (
    <Wrapper className="flex-row items-start gap-6">
      <nav
        aria-label="On this page"
        className="flex w-40 shrink-0 flex-col gap-1 text-sm"
      >
        {outline.map((heading) => (
          <Button
            key={heading.id}
            variant="ghost"
            size="sm"
            className="justify-start"
            style={{ paddingInlineStart: `${heading.level * 0.5}rem` }}
            onClick={() => handle.current?.scrollToHeading(heading.id)}
          >
            {heading.text}
          </Button>
        ))}
      </nav>
      <TextEdit
        format="markdown"
        defaultValue={
          "## Setup\n\nCheck the panel.\n\n### Tools\n\nA tester and a screwdriver.\n\n## Wiring\n\nBrown to L, blue to N."
        }
        onOutlineChange={setOutline}
        handleRef={handle}
        aria-label="Page with an outline"
        className="min-w-0 flex-1"
      />
    </Wrapper>
  );
}

/**
 * Comment highlights — select text and choose Comment. Highlights stay on their words while you
 * type; the list beside the editor comes from `onAnnotationsLayout`.
 */
export function textEditAnnotations(): ReactNode {
  const handle = useRef<TextEditHandle>(null);
  const [annotations, setAnnotations] = useState<TextEditAnnotation[]>([
    {
      id: "c1",
      anchor: {
        start: 6,
        end: 18,
        quote: "25 A breaker",
        prefix: "Use a ",
        suffix: " for the kitchen circuit.",
      },
    },
  ]);
  const [active, setActive] = useState<string | null>(null);
  const [layout, setLayout] = useState<TextEditAnnotationLayout[]>([]);
  return (
    <Wrapper className="flex-row items-start gap-6">
      <TextEdit
        format="markdown"
        defaultValue="Use a 25 A breaker for the kitchen circuit. Keep the panel labelled."
        annotations={annotations}
        activeAnnotationId={active}
        onAnnotationClick={setActive}
        onCreateAnnotation={(anchor) =>
          setAnnotations((current) => [
            ...current,
            { id: `c${current.length + 1}`, anchor },
          ])
        }
        onAnnotationsLayout={setLayout}
        handleRef={handle}
        aria-label="Commented text"
        className="min-w-0 flex-1"
      />
      <ul className="flex w-48 shrink-0 flex-col gap-1 text-sm">
        {layout.map((item) => (
          <li key={item.id}>
            <Button
              variant={item.id === active ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setActive(item.id);
                handle.current?.pulseAnnotation(item.id);
              }}
            >
              <span className="truncate">
                {item.anchor ? `“${item.anchor.quote}”` : "Text removed"}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

const COUNTS_SAMPLE =
  "Use a 25 A breaker for the kitchen circuit. Keep the panel labelled, and test every socket.";

const COUNTS_ANNOTATIONS: TextEditAnnotation[] = [
  {
    id: "breaker",
    count: 3,
    anchor: {
      start: 6,
      end: 18,
      quote: "25 A breaker",
      prefix: "Use a ",
      suffix: " for the kitchen circuit.",
    },
  },
  {
    id: "label",
    anchor: {
      start: 53,
      end: 67,
      quote: "panel labelled",
      prefix: "Keep the ",
      suffix: ", and test every socket.",
    },
  },
];

/**
 * Comment count pills and the keyboard path. `annotationCounts="always"` puts a count after each
 * highlight (`auto` shows it only on touch or below `lg`); the pill follows the active thread.
 * Read-only, Tab reaches each highlight and Enter opens it; while editing, put the caret in a
 * highlight and press Alt+Enter. Both call `onAnnotationClick`, like a click on the text or pill.
 */
export function textEditAnnotationCounts(): ReactNode {
  const [active, setActive] = useState<string | null>("breaker");
  const opened = active
    ? `Open thread: ${COUNTS_ANNOTATIONS.find((a) => a.id === active)?.anchor.quote}`
    : "No thread open";
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">
          Read-only — Tab to a highlight, Enter opens it
        </p>
        <TextEdit
          format="markdown"
          readOnly
          defaultValue={COUNTS_SAMPLE}
          annotations={COUNTS_ANNOTATIONS}
          annotationCounts="always"
          activeAnnotationId={active}
          onAnnotationClick={setActive}
          aria-label="Read-only commented text"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">
          Editing — caret in a highlight, Alt+Enter opens it
        </p>
        <TextEdit
          format="markdown"
          defaultValue={COUNTS_SAMPLE}
          annotations={COUNTS_ANNOTATIONS}
          annotationCounts="always"
          activeAnnotationId={active}
          onAnnotationClick={setActive}
          aria-label="Editable commented text"
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground" aria-live="polite">
          {opened}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!active}
          onClick={() => setActive(null)}
        >
          Close thread
        </Button>
      </div>
    </Wrapper>
  );
}
