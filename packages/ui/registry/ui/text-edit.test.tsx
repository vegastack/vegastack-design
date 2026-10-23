import * as React from "react";
import type { Editor } from "@tiptap/core";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { beforeAll, expect, onTestFinished, test, vi } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { InlineChipProvider } from "./inline-chip";
import icon from "../../../../apps/docs/public/preview/avatar-1.svg?no-inline";
import {
  linkedTaskId,
  preloadTextEdit,
  TEXT_EDIT_UPLOAD_ABORT,
  TextEdit,
  type MentionKindConfig,
  type MentionOption,
  type TextEditAnchor,
  type TextEditHandle,
} from "./text-edit";
import { anchorFromRange } from "../lib/text-anchor";
import { markdownToDoc } from "../lib/text-edit-markdown";
import { EMBED_PROVIDERS } from "../lib/embed-providers";
import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import {
  prosemirrorToYXmlFragment,
  yXmlFragmentToProseMirrorRootNode,
} from "@tiptap/y-tiptap";
import { textEditSchema } from "../lib/text-edit-schema";
import { Field as BaseField } from "@base-ui/react/field";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

/** The `@` menu kinds a host names (`TextEditMentions.kinds`), in this order. */
const TEST_KINDS: Record<string, { noun: string; plural: string }> = {
  user: { noun: "Person", plural: "People" },
  page: { noun: "Page", plural: "Pages" },
  file: { noun: "File", plural: "Files" },
  task: { noun: "Task", plural: "Tasks" },
  family: { noun: "Family", plural: "Families" },
  agent: { noun: "Agent", plural: "Your agents" },
};
const mentionKinds = (...ids: string[]): MentionKindConfig[] =>
  ids.map((id, order) => ({ id, ...TEST_KINDS[id]!, order }));

// TextEdit renders a light read view and loads its editor on intent; these tests exercise the
// editor itself, so load it up front — every TextEdit then swaps it in right after mounting.
beforeAll(() => preloadTextEdit());

// Tiptap mounts a real ProseMirror contenteditable, so these tests require the
// browser DOM that vitest browser-mode provides (jsdom is insufficient).

test("renders the editable surface with initial HTML content", async () => {
  const screen = await render(
    <TextEdit defaultValue="<p>Hello world</p>" aria-label="Body" />,
  );
  await expect.element(screen.getByText("Hello world")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("textbox", { name: "Body" }))
    .toHaveAttribute("contenteditable", "true");
});

test("exposes the text-edit slot and is editable by default", async () => {
  const screen = await render(<TextEdit aria-label="Body" />);
  const root = screen.container.querySelector('[data-slot="text-edit"]');
  expect(root).not.toBeNull();
  expect(root).toHaveAttribute("data-editable", "");
});

test("the editor surface and MarkdownView wear the same prose recipe", async () => {
  const screen = await render(<TextEdit aria-label="Body" />);
  const editable = screen
    .getByRole("textbox", { name: "Body" })
    .element() as HTMLElement;
  // The shared recipe is the single source of the typography — if TextEdit ever grows its own
  // `[&_…]` rules again, this is what notices (audit B4-09).
  expect(editable.className).toContain("[&_h1]:text-lg [&_h1]:font-semibold");
  expect(editable.className).toContain("[&_p]:my-2");
  expect(editable.className).toContain("[&_code]:font-mono");
});

test('typeScale="document" lays the document scale over the editor surface (TYP-20)', async () => {
  const screen = await render(
    <TextEdit aria-label="Body" typeScale="document" />,
  );
  const editable = screen
    .getByRole("textbox", { name: "Body" })
    .element() as HTMLElement;
  expect(editable.className).toContain("[&_h1]:text-2xl/8");
  expect(editable.className).toContain("[&_h2]:text-xl/7");
  expect(editable.className).toContain("pointer-coarse:text-base/6.5");
  expect(editable.className).not.toContain("[&_h1]:text-lg");
});

test("an outline alone never loads the editor: the read view reports the headings", async () => {
  const onOutlineChange = vi.fn();
  const screen = await render(
    <TextEdit
      aria-label="Body"
      readOnly
      format="markdown"
      defaultValue={"# Intro\n\nText\n\n## Pricing\n\n## Pricing"}
      onOutlineChange={onOutlineChange}
    />,
  );
  await vi.waitFor(() =>
    expect(onOutlineChange).toHaveBeenLastCalledWith([
      { id: "intro", level: 1, text: "Intro" },
      { id: "pricing", level: 2, text: "Pricing" },
      { id: "pricing-1", level: 2, text: "Pricing" },
    ]),
  );
  // Still the read view: no ProseMirror root was mounted for an outline.
  expect(screen.container.querySelector(".ProseMirror")).toBeNull();
  expect(screen.container.querySelector("#pricing-1")?.textContent).toBe(
    "Pricing",
  );
});

test("typing into the editor emits HTML via onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <TextEdit onValueChange={onValueChange} aria-label="Body" />,
  );
  const editable = screen.getByRole("textbox", { name: "Body" });
  await editable.click();
  await editable.fill("typed text");
  await vi.waitFor(() => {
    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toContain("typed text");
  });
});

test("a focused-time controlled value change is deferred, then reconciled on blur", async () => {
  // Regression: a controlled `value` change while the editor is FOCUSED (form reset,
  // server refresh, collab update) must NOT clobber the live caret mid-edit, but must
  // also not be silently dropped — it has to apply once focus leaves, so the rendered
  // editor never goes permanently stale relative to the prop.
  const onValueChange = vi.fn();
  function Harness() {
    const [value, setValue] = React.useState("<p>initial</p>");
    return (
      <>
        <button
          type="button"
          onClick={() => setValue("<p>external update</p>")}
        >
          push external
        </button>
        <TextEdit
          value={value}
          onValueChange={onValueChange}
          aria-label="Body"
        />
      </>
    );
  }
  const screen = await render(<Harness />);
  const editable = screen.getByRole("textbox", { name: "Body" });
  await expect.element(screen.getByText("initial")).toBeInTheDocument();
  const el = editable.element() as HTMLElement;

  // Focus the editor (simulating an active edit session).
  await editable.click();
  await vi.waitFor(() => expect(el).toHaveFocus());

  // Push a new external value while focused. Dispatch the state change WITHOUT a
  // real pointer click (which would itself blur the editor); a synthetic element
  // click flips React state but keeps the editor focused — the exact desync case.
  (
    screen
      .getByRole("button", { name: "push external" })
      .element() as HTMLElement
  ).click();

  // While focused, the document is NOT force-replaced mid-edit — the old content is
  // still on screen (caret-safe) and no programmatic setContent leaked through onValueChange.
  await expect.element(screen.getByText("initial")).toBeInTheDocument();
  expect(el).toHaveFocus();
  expect(screen.container.textContent).not.toContain("external update");
  expect(onValueChange).not.toHaveBeenCalled();

  // Blur the editor (focus moves to <body>) → the deferred external value reconciles.
  el.blur();
  await userEvent.click(document.body);
  await vi.waitFor(() => {
    expect(screen.container.textContent).toContain("external update");
    expect(screen.container.textContent).not.toContain("initial");
  });
  // The blur-time reconcile uses emitUpdate:false, so it never re-fires onValueChange.
  expect(onValueChange).not.toHaveBeenCalled();
});

test("a controlled value change while not focused applies immediately", async () => {
  function Harness() {
    const [value, setValue] = React.useState("<p>one</p>");
    return (
      <>
        <button type="button" onClick={() => setValue("<p>two</p>")}>
          swap
        </button>
        <TextEdit value={value} aria-label="Body" />
      </>
    );
  }
  const screen = await render(<Harness />);
  await expect.element(screen.getByText("one")).toBeInTheDocument();
  // No focus on the editor → the external change applies right away.
  await screen.getByRole("button", { name: "swap" }).click();
  await vi.waitFor(() => {
    expect(screen.container.textContent).toContain("two");
    expect(screen.container.textContent).not.toContain("one");
  });
});

test("forwards validation ARIA to the contenteditable textbox", async () => {
  const screen = await render(
    <>
      <p id="body-error">Body is required.</p>
      <TextEdit aria-label="Body" aria-invalid aria-describedby="body-error" />
    </>,
  );
  const textbox = screen.getByRole("textbox", { name: "Body" });
  await expect.element(textbox).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(textbox)
    .toHaveAttribute("aria-describedby", "body-error");
  expect(
    screen.container.querySelector('[data-slot="text-edit"]'),
  ).toHaveAttribute("data-invalid", "");
});

test("forwards id and aria-labelledby to the contenteditable textbox", async () => {
  const screen = await render(
    <>
      <span id="body-label">Body</span>
      <TextEdit id="body-editor" aria-labelledby="body-label" />
    </>,
  );
  const textbox = screen.getByRole("textbox", { name: "Body" });
  await expect.element(textbox).toHaveAttribute("id", "body-editor");
  await expect
    .element(textbox)
    .toHaveAttribute("aria-labelledby", "body-label");
});

test("shows the placeholder only while empty", async () => {
  const screen = await render(
    <TextEdit placeholder="Write something…" aria-label="Body" />,
  );
  // The editor initializes after mount (immediatelyRender:false), then isEmpty flips true.
  await vi.waitFor(
    () => {
      expect(
        screen.container.querySelector(
          'p.is-editor-empty[data-placeholder="Write something…"]',
        ),
      ).not.toBeNull();
    },
    { timeout: 3000 },
  );

  const editable = screen.getByRole("textbox", { name: "Body" });
  await editable.click();
  await editable.fill("not empty");
  await vi.waitFor(() => {
    expect(screen.container.querySelector("p.is-editor-empty")).toBeNull();
  });
});

test("no a11y violations", async () => {
  const screen = await render(
    <TextEdit
      defaultValue="<p>Accessible content</p>"
      aria-label="Description"
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Description" }))
    .toBeInTheDocument();
  // color-contrast: semantic Tailwind tokens (text-muted-foreground, bg-muted) aren't compiled in
  // this fast unit run, so contrast can't be evaluated here (would false-positive). The REAL
  // contrast is now proven by the compiled-CSS gate test/contrast.browser.test.tsx, which renders a
  // TextEdit with mixed prose (foreground body, muted blockquote, bg-muted inline code, muted
  // placeholder) and runs axe `color-contrast` against the real token colors in BOTH light and dark
  // themes (+ the VRT visual layer).
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("no a11y violations — non-editable", async () => {
  const screen = await render(
    <TextEdit value="<p>read only</p>" readOnly aria-label="Body" />,
  );
  await expect
    .element(screen.getByRole("document", { name: "Body" }))
    .toBeInTheDocument();
  // color-contrast: see the note on the default-state a11y test above.
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <>
      <p id="body-error">Body is required.</p>
      <TextEdit aria-label="Body" aria-invalid aria-describedby="body-error" />
    </>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Body" }))
    .toHaveAttribute("aria-invalid", "true");
  // color-contrast: see the note on the default-state a11y test above.
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("onSubmit fires on Cmd/Ctrl+Enter with the current HTML", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <TextEdit
      defaultValue="<p>ship it</p>"
      onSubmit={onSubmit}
      aria-label="Body"
    />,
  );
  const editable = screen.getByRole("textbox", { name: "Body" });
  await editable.click();
  const el = editable.element() as HTMLElement;

  // Ctrl+Enter (Windows/Linux) submits.
  el.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  await vi.waitFor(() => {
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls.at(-1)?.[0]).toContain("ship it");
  });

  // Cmd+Enter (macOS) submits too.
  el.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
});

test("plain Enter does not fire onSubmit (newline is preserved)", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <TextEdit onSubmit={onSubmit} aria-label="Body" />,
  );
  const editable = screen.getByRole("textbox", { name: "Body" });
  await editable.click();
  (editable.element() as HTMLElement).dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    }),
  );
  expect(onSubmit).not.toHaveBeenCalled();
});

test("minHeight and maxHeight feed the content area via CSS custom properties", async () => {
  const screen = await render(
    <TextEdit
      defaultValue="<p>sized</p>"
      minHeight={120}
      maxHeight="20rem"
      aria-label="Body"
    />,
  );
  const content = screen.container.querySelector<HTMLElement>(
    '[data-slot="text-edit-content"]',
  )!;
  // The inline style sets ONLY CSS variables (contract-clean) — number → px, string verbatim,
  // both from the prop, no token. The arbitrary-value classes consume those vars for the box size.
  expect(content.style.getPropertyValue("--te-min-h")).toBe("120px");
  expect(content.style.getPropertyValue("--te-max-h")).toBe("20rem");
  // No direct visual property is set inline (the swatch-fill exception aside, that is banned).
  expect(content.style.minHeight).toBe("");
  expect(content.style.maxHeight).toBe("");
  expect(content.className).toContain("min-h-[var(--te-min-h)]");
  // maxHeight makes the area scroll and applies the max-height class.
  expect(content.className).toContain("max-h-[var(--te-max-h)]");
  expect(content.className).toContain("overflow-y-auto");
});

test("forwards ref to the root container", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<TextEdit ref={ref} aria-label="Body" />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("text-edit");
});

/* DS-47 — the contenteditable reads the enclosing Field through Base UI Field.Control */

test("DS-47: inside a Field the editor is labelled, described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Summary</FieldLabel>
      <TextEdit />
      <FieldDescription>Shown on the meeting page.</FieldDescription>
      <FieldError>Write a summary.</FieldError>
    </Field>,
  );
  const box = screen.getByRole("textbox", { name: "Summary" });
  await expect.element(box).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(box)
    .toHaveAccessibleDescription(/Shown on the meeting page/);
  await expect.element(box).toHaveAccessibleDescription(/Write a summary/);
  await expect
    .poll(() =>
      screen.container
        .querySelector('[data-slot="text-edit"]')
        ?.hasAttribute("data-invalid"),
    )
    .toBe(true);
});

test("DS-47: a disabled Base UI Field disables the editor", async () => {
  const screen = await render(
    <BaseField.Root disabled>
      <TextEdit aria-label="Summary" />
    </BaseField.Root>,
  );
  const box = screen.getByRole("textbox", { name: "Summary" });
  await expect.element(box).toHaveAttribute("aria-disabled", "true");
  await expect.element(box).toHaveAttribute("contenteditable", "false");
  expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
});

test("DS-47: an explicit aria-labelledby wins over the FieldLabel", async () => {
  const screen = await render(
    <>
      <span id="te-own-name">Own name</span>
      <Field>
        <FieldLabel>Field name</FieldLabel>
        <TextEdit aria-labelledby="te-own-name" />
      </Field>
    </>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Own name" }))
    .toBeInTheDocument();
});

test("no a11y violations — inside a Field, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Summary</FieldLabel>
      <TextEdit />
      <FieldDescription>Shown on the meeting page.</FieldDescription>
    </Field>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Summary" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a Field, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Summary</FieldLabel>
      <TextEdit />
      <FieldError>Write a summary.</FieldError>
    </Field>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Summary" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "TextEdit",
  render: (props) => <TextEdit {...props} />,
  find: (screen, name) => screen.getByRole("textbox", { name }),
});

// Chromium on macOS moves to the document end with Cmd+ArrowDown; Ctrl+End does nothing there.
const MAC = navigator.platform.startsWith("Mac");
const END = MAC ? "{Meta>}{ArrowDown}{/Meta}" : "{Control>}{End}{/Control}";
const MOD = MAC ? "Meta" : "Control";

/** Select the last `count` characters of `block`'s text through the DOM (platform-independent). */
function selectTail(block: Element, count: number) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  while (walker.nextNode()) last = walker.currentNode as Text;
  const range = document.createRange();
  range.setStart(last!, last!.length - count);
  range.setEnd(last!, last!.length);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  // ProseMirror reads the DOM selection on the async `selectionchange`; fire it now so a view
  // update in between cannot write the old caret back over this range.
  document.dispatchEvent(new Event("selectionchange"));
}

// ---- DS-48: Markdown format, readOnly, disabled ---------------------------------------------

const markdownFixtures: [string, string][] = [
  ["a paragraph", "Plain words in a paragraph."],
  ["two paragraphs", "First paragraph.\n\nSecond paragraph."],
  ["a heading", "## Summary\n\nBody text."],
  ["bold and italic", "Some **bold** and *italic* text."],
  ["a bullet list", "- Apples\n- Pears\n- Plums"],
  ["an ordered list", "1. One\n2. Two\n3. Three"],
  ["a link", "See [the spec](https://example.com/spec) for details."],
  ["headings h1–h3", "# One\n\n## Two\n\n### Three"],
  ["strike and inline code", "Some ~~old~~ and `code` text."],
  ["a code block", "```ts\nconst a = 1;\n```"],
  ["a quote", "> Quoted words."],
  ["a divider", "Above\n\n---\n\nBelow"],
  ["a task list", "- [ ] Open\n- [x] Done"],
  ["nested lists", "- One\n  - Nested\n    1. Deeper"],
  ["paragraphs around a list", "a\n\nb\n\n- x\n\nc"],
];

test.each(markdownFixtures)(
  "Markdown: %s loads without an update and round-trips unchanged after an edit",
  async (_name, md) => {
    const onValueChange = vi.fn();
    const screen = await render(
      <TextEdit
        format="markdown"
        defaultValue={md}
        onValueChange={onValueChange}
        aria-label="Summary"
      />,
    );
    const box = screen.getByRole("textbox", { name: "Summary" });
    await expect.element(box).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    // Click the last text block, not the box's centre: a click on a divider or a code block's
    // header selects that node, and typing would replace it.
    const blocks = box.element().querySelectorAll("p, h1, h2, h3, li, code");
    await userEvent.click(blocks[blocks.length - 1]!);
    await userEvent.keyboard(`${END}x`);
    await userEvent.keyboard("{Backspace}");
    await vi.waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
      expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(md);
    });
  },
);

test("Markdown: the document renders as rich text, not as source", async () => {
  const screen = await render(
    <TextEdit
      format="markdown"
      defaultValue={"## Summary\n\nSome **bold** text."}
      aria-label="Summary"
    />,
  );
  const box = screen.getByRole("textbox", { name: "Summary" }).element();
  await vi.waitFor(() => {
    expect(box.querySelector("h2")?.textContent).toBe("Summary");
    expect(box.querySelector("strong")?.textContent).toBe("bold");
  });
  expect(box.textContent).not.toContain("**");
});

test("Markdown: typing emits Markdown via onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <TextEdit
      format="markdown"
      defaultValue="Hello"
      onValueChange={onValueChange}
      aria-label="Summary"
    />,
  );
  const box = screen.getByRole("textbox", { name: "Summary" });
  await box.click();
  await userEvent.keyboard("{Control>}{End}{/Control} there");
  await vi.waitFor(() => {
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("Hello there");
  });
});

test("Markdown: a controlled value is applied as Markdown", async () => {
  const screen = await render(
    <TextEdit format="markdown" value="First" aria-label="Summary" />,
  );
  await screen.rerender(
    <TextEdit format="markdown" value="*Second*" aria-label="Summary" />,
  );
  const box = screen.getByRole("textbox", { name: "Summary" }).element();
  await vi.waitFor(() => {
    expect(box.querySelector("em")?.textContent).toBe("Second");
  });
});

test("readOnly renders a document, not a field: no textbox role, nothing editable (B8)", async () => {
  const screen = await render(
    <TextEdit defaultValue="<p>Fixed</p>" readOnly aria-label="Body" />,
  );
  const box = screen.getByRole("document", { name: "Body" });
  await expect.element(box).toHaveAttribute("contenteditable", "false");
  await expect.element(box).not.toHaveAttribute("aria-readonly");
  await expect.element(box).not.toHaveAttribute("aria-multiline");
  expect(screen.container.querySelector('[role="textbox"]')).toBeNull();
  expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("disabled marks the editor disabled", async () => {
  const screen = await render(
    <TextEdit defaultValue="<p>Locked</p>" disabled aria-label="Body" />,
  );
  const box = screen.getByRole("textbox", { name: "Body" });
  await expect.element(box).toHaveAttribute("contenteditable", "false");
  await expect.element(box).toHaveAttribute("aria-disabled", "true");
  const root = screen.container.querySelector('[data-slot="text-edit"]');
  expect(root).toHaveAttribute("data-disabled", "");
  expect(root).not.toHaveAttribute("data-editable");
  expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — Markdown, editable", async () => {
  const screen = await render(
    <TextEdit
      format="markdown"
      defaultValue={"## Notes\n\n- One\n- Two"}
      aria-label="Notes"
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Notes" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

// ---- One behaviour everywhere: commit, revert, autosave, slash-menu keys ----------------------

const slashMenu = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu"][data-menu="text-edit-slash"]',
  );

async function markdownEditor(
  props: Partial<React.ComponentProps<typeof TextEdit>> = {},
) {
  const screen = await render(
    <>
      <TextEdit format="markdown" aria-label="Notes" {...props} />
      <button type="button">Outside</button>
    </>,
  );
  // The preloaded editor swaps in for the read view right after mounting; wait for it.
  if (!props.readOnly && !props.disabled)
    await vi.waitFor(() => {
      expect(screen.container.querySelector(".ProseMirror")).not.toBeNull();
      expect(
        screen.container.querySelector('[data-slot="text-edit-read"]'),
      ).toBeNull();
    });
  // Let Tiptap finish its first-frame setup (its create event and view sync) before a test
  // drives the selection.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return screen;
}

test("leaving with a change commits once; leaving unchanged commits nothing", async () => {
  const onCommit = vi.fn();
  const screen = await markdownEditor({ defaultValue: "Hello", onCommit });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await screen.getByRole("button", { name: "Outside" }).click();
  expect(onCommit).not.toHaveBeenCalled();
  await box.click();
  await userEvent.keyboard(`${END} world`);
  await screen.getByRole("button", { name: "Outside" }).click();
  await vi.waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
  expect(onCommit.mock.calls[0]?.[0]).toBe("Hello world");
});

test('escapeBehavior="revert": Escape reverts to the value focus arrived with and commits nothing', async () => {
  const onCommit = vi.fn();
  const onRevert = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Keep",
    onCommit,
    onRevert,
    escapeBehavior: "revert",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END} this`);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(onRevert).toHaveBeenCalled());
  expect(box.element().textContent).toBe("Keep");
  expect(onCommit).not.toHaveBeenCalled();
});

test("Escape in a document keeps its text, commits and blurs (A2) — never erases typed text", async () => {
  const onCommit = vi.fn();
  const onRevert = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Kept",
    onCommit,
    onRevert,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END} too`);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(onCommit).toHaveBeenCalledWith("Kept too"));
  expect(onRevert).not.toHaveBeenCalled();
  expect(box.element().contains(document.activeElement)).toBe(false);
});

test("escapeBehavior: an autosaving document keeps its text on Escape, commits and blurs", async () => {
  const onCommit = vi.fn();
  const onRevert = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Saved",
    onCommit,
    onRevert,
    autosave: 5000,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END} and more`);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(onCommit).toHaveBeenCalledWith("Saved and more"),
  );
  expect(box.element().textContent).toBe("Saved and more");
  expect(onRevert).not.toHaveBeenCalled();
  expect(box.element().contains(document.activeElement)).toBe(false);
  // Explicit "revert" still wins over the autosave default.
  await screen.unmount();
  const onRevert2 = vi.fn();
  const again = await markdownEditor({
    defaultValue: "Keep",
    autosave: 5000,
    escapeBehavior: "revert",
    onRevert: onRevert2,
  });
  const box2 = again.getByRole("textbox", { name: "Notes" });
  await box2.click();
  await userEvent.keyboard(`${END} this`);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(onRevert2).toHaveBeenCalled());
  expect(box2.element().textContent).toBe("Keep");
});

test("markSaved advances the baseline, so Escape reverts only what came after the save", async () => {
  const handleRef = React.createRef<TextEditHandle>();
  const onCommit = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "A",
    handleRef,
    onCommit,
    escapeBehavior: "revert",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END} B`);
  // The host saved "A B" (an acknowledged save of its own).
  handleRef.current!.markSaved();
  await userEvent.keyboard(" C");
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(box.element().textContent).toBe("A B"));
  // Leaving without changes after the save commits nothing new.
  expect(onCommit).not.toHaveBeenCalled();
});

test("autosave commits after the idle gap while still focused", async () => {
  const onCommit = vi.fn();
  const screen = await markdownEditor({ onCommit, autosave: 200 });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("Draft");
  await vi.waitFor(() => expect(onCommit).toHaveBeenCalledWith("Draft"), {
    timeout: 2000,
  });
});

test("unmounting mid-edit commits the change", async () => {
  const onCommit = vi.fn();
  const screen = await markdownEditor({ onCommit });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("Unsaved");
  await screen.unmount();
  expect(onCommit).toHaveBeenCalledWith("Unsaved");
});

test("slash menu: Enter picks a block and Escape closes it, without submitting or reverting", async () => {
  const onSubmit = vi.fn();
  const onRevert = vi.fn();
  const onCommit = vi.fn();
  const screen = await markdownEditor({ onSubmit, onRevert, onCommit });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard("/bullet");
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(box.element().querySelector("ul")).not.toBeNull(),
  );
  await userEvent.keyboard("Item /");
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(slashMenu()).toBeNull());
  expect(onRevert).not.toHaveBeenCalled();
  expect(onSubmit).not.toHaveBeenCalled();
  expect(box.element().querySelector("li")?.textContent).toBe("Item /");
});

test("undo and redo", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("abc");
  await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
  await vi.waitFor(() => expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(""));
  await userEvent.keyboard(`{${MOD}>}{Shift>}z{/Shift}{/${MOD}}`);
  await vi.waitFor(() =>
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("abc"),
  );
});

test("pasted markdown becomes rich text", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  const data = new DataTransfer();
  data.setData("text/plain", "- one\n- two");
  box.element().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }),
  );
  await vi.waitFor(() =>
    expect(box.element().querySelectorAll("li").length).toBe(2),
  );
  expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("- one\n- two");
});

test("bubble menu: a selection gets a link from the link input", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Read the spec",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await userEvent.click(box.element().querySelector("p")!);
  selectTail(box.element().querySelector("p")!, 4);
  await vi.waitFor(
    () =>
      expect(
        document.querySelector('[data-slot="text-edit-bubble-menu"]'),
      ).not.toBeNull(),
    { timeout: 3000 },
  );
  await userEvent.click(
    document.querySelector<HTMLElement>('[aria-label="Link"]')!,
  );
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-label="Link URL"]')).not.toBeNull(),
  );
  await userEvent.keyboard("example.com/spec{Enter}");
  await vi.waitFor(() =>
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(
      "Read the [spec](https://example.com/spec)",
    ),
  );
});

test("Markdown: blank lines typed with Enter collapse — no &nbsp;, and the output reloads to itself", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("a{Enter}{Enter}{Enter}b{Enter}{Enter}");
  await vi.waitFor(() =>
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("a\n\nb"),
  );
  const reload = vi.fn();
  const again = await render(
    <TextEdit
      format="markdown"
      defaultValue={"a\n\nb"}
      onValueChange={reload}
      aria-label="Again"
    />,
  );
  const box = again.getByRole("textbox", { name: "Again" });
  await userEvent.click(box.element().querySelectorAll("p")[1]!);
  await userEvent.keyboard(`${END}x{Backspace}`);
  await vi.waitFor(() => expect(reload.mock.calls.at(-1)?.[0]).toBe("a\n\nb"));
});

test("Markdown: blank lines inside a code block are kept", async () => {
  const onValueChange = vi.fn();
  const md = "```\none\n\n\ntwo\n```";
  const screen = await markdownEditor({ defaultValue: md, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  const code = box.element().querySelectorAll("code");
  await userEvent.click(code[code.length - 1]!);
  await userEvent.keyboard(`${END}x{Backspace}`);
  await vi.waitFor(() => expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(md));
});

// ---- Notion-grade coverage: every element round-trips, menus float, nothing overflows --------

const lastValue = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.at(-1)?.[0] as string | undefined;

const moreMarkdownFixtures: [string, string][] = [
  ["a heading 4", "#### Four\n\nBody"],
  ["a nested checklist", "- [ ] Open\n  - [x] Sub done\n- [x] Done"],
  [
    "a GFM table",
    "| Name | Role |\n| ---- | ---- |\n| Ada  | Eng  |\n| Bo   | PM   |",
  ],
  [
    "an image with alt text",
    "Intro\n\n![A chart](https://example.com/chart.png)\n\nAfter",
  ],
  [
    "a resized image",
    "Intro\n\n![A chart|320](https://example.com/chart.png)\n\nAfter",
  ],
  ["a code block with a language", "```python\nprint(1)\n```"],
  [
    "a link and marks together",
    "**Bold [link](https://example.com)** and ~~gone~~",
  ],
  [
    "mentions of a person and a page",
    "Ask [@Asha Rao](mention://user/u1) about [@Q3 plan](mention://page/p1) today",
  ],
  [
    "mentions of a file and a task",
    "See [@spec.pdf](mention://file/f1) and [@Wire the panel](mention://task/t1) now",
  ],
  [
    "a mention whose label holds brackets",
    "Read [@Plan \\[draft\\] v2](mention://page/p2) first",
  ],
  [
    "a restricted mention",
    "Linked [@Private page](mention://page/restricted:p9) here",
  ],
  ["a note callout", "> [!NOTE]\n> Check the load first."],
  ["a tip callout", "> [!TIP]\n> Use a 25 A breaker"],
  ["a warning callout", "> [!WARNING]\n> Isolate the supply.\n>\n> Then test."],
  [
    "a toggle holding a nested list",
    "<details><summary>Wiring</summary>\n\n- red\n- black\n  - earth\n\n</details>",
  ],
  ["an uploaded image", "Intro\n\n![](/api/files/f1)\n\nAfter"],
  ["a file link", "Attached [report.pdf](/api/files/f2/download)"],
];

test.each(moreMarkdownFixtures)(
  "Markdown: %s round-trips unchanged after an edit",
  async (_name, md) => {
    const onValueChange = vi.fn();
    const screen = await render(
      <TextEdit
        format="markdown"
        defaultValue={md}
        onValueChange={onValueChange}
        aria-label="Doc"
      />,
    );
    const box = screen.getByRole("textbox", { name: "Doc" });
    await expect.element(box).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    // Put the caret at the end of the last text block directly: a click can land on an image
    // (selecting it) or a table cell's padding, and Cmd+ArrowDown does not leave a table cell.
    const blocks = box.element().querySelectorAll("p, h4, li p, td p, code");
    const last = blocks[blocks.length - 1]!;
    // Click the text block itself: the box's centre can be an image, which a click selects.
    await userEvent.click(last);
    const range = document.createRange();
    range.selectNodeContents(last);
    range.collapse(false);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    await userEvent.keyboard("x{Backspace}");
    await vi.waitFor(() => expect(lastValue(onValueChange)).toBe(md));
  },
);

test("slash menu offers every block, and Table inserts a GFM table", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/");
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  const labels = [
    ...slashMenu()!.querySelectorAll('[data-slot="suggestion-menu-option"]'),
  ].map((item) => item.textContent);
  for (const label of [
    "Text",
    "Heading 1",
    "Heading 4",
    "Checklist",
    "Code block",
    "Table",
    "Image",
    "Divider",
    "Link",
  ])
    expect(labels.some((text) => text?.startsWith(label))).toBe(true);
  await userEvent.keyboard("table{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain("| --- | --- | --- |"),
  );
});

test("slash menu groups the full list under headings, and drops them once filtered", async () => {
  const screen = await markdownEditor();
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/");
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  const headings = () =>
    [
      ...slashMenu()!.querySelectorAll(
        '[data-slot="suggestion-menu-group-label"]',
      ),
    ].map((each) => each.textContent);
  expect(headings()).toEqual(["Text", "Lists", "Blocks", "Media", "Insert"]);
  await userEvent.keyboard("ima");
  await vi.waitFor(() => expect(headings()).toEqual([]));
});

test("slash menu is the shared SuggestionMenu: arrows move the textbox's aria-activedescendant", async () => {
  const screen = await markdownEditor();
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard("/");
  await vi.waitFor(() =>
    expect(slashMenu()?.getAttribute("role")).toBe("listbox"),
  );
  const active = () =>
    slashMenu()!.querySelector<HTMLElement>(
      '[role="option"][data-highlighted]',
    )!;
  await vi.waitFor(() => {
    expect(box.element().getAttribute("aria-controls")).toBe(slashMenu()!.id);
    expect(box.element().getAttribute("aria-activedescendant")).toBe(
      active().id,
    );
  });
  const first = active().id;
  await userEvent.keyboard("{ArrowDown}");
  await vi.waitFor(() => expect(active().id).not.toBe(first));
  await vi.waitFor(() =>
    expect(box.element().getAttribute("aria-activedescendant")).toBe(
      active().id,
    ),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(slashMenu()).toBeNull());
  expect(box.element().hasAttribute("aria-activedescendant")).toBe(false);
  expect(box.element().hasAttribute("aria-controls")).toBe(false);
});

test("slash menu Image, Video and Audio insert from a link", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/image{Enter}");
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-label="Image URL"]')).not.toBeNull(),
  );
  await userEvent.keyboard("example.com/cat.png{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("![](https://example.com/cat.png)"),
  );
  await userEvent.keyboard("{Enter}/video{Enter}");
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-label="Video URL"]')).not.toBeNull(),
  );
  await userEvent.keyboard("/files/clip.mp4{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain(
      '<video src="/files/clip.mp4"></video>',
    ),
  );
});

test("video and audio blocks round-trip and render native players", async () => {
  const source =
    '<video src="/files/clip.mp4"></video>\n\n<audio src="/files/note.mp3"></audio>';
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange, defaultValue: source });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await vi.waitFor(() =>
    expect(document.querySelector(".tiptap video")).not.toBeNull(),
  );
  expect(document.querySelector(".tiptap audio")?.getAttribute("src")).toBe(
    "/files/note.mp3",
  );
});

test("markdown shortcuts: ⇧⌘X strike, ⌘E code, ⌘⇧7 numbered list, Tab nests", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard(`{${MOD}>}{Shift>}x{/Shift}{/${MOD}}gone`);
  await vi.waitFor(() => expect(lastValue(onValueChange)).toBe("~~gone~~"));
  await userEvent.keyboard(`{${MOD}>}{Shift>}x{/Shift}{/${MOD}} `);
  await userEvent.keyboard(`{${MOD}>}e{/${MOD}}x{${MOD}>}e{/${MOD}}`);
  await vi.waitFor(() => expect(lastValue(onValueChange)).toBe("~~gone~~ `x`"));
  await userEvent.keyboard(
    `{Enter}{${MOD}>}{Shift>}7{/Shift}{/${MOD}}one{Enter}two`,
  );
  await userEvent.keyboard("{Tab}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("~~gone~~ `x`\n\n1. one\n   1. two"),
  );
});

test("input rules: ####, [ ], ``` with a language and ---", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("#### Four{Enter}[[ ] task{Enter}{Enter}");
  await userEvent.keyboard("```ts ");
  await userEvent.keyboard("const a = 1");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "#### Four\n\n- [ ] task\n\n```ts\nconst a = 1\n```",
    ),
  );
});

test("the code block's language picker writes the fence's info string", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "```\nx = 1\n```",
    onValueChange,
  });
  await userEvent.click(
    screen.getByRole("button", { name: "Code language: Plain text" }),
  );
  await userEvent.click(screen.getByRole("option", { name: "Python" }));
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("```python\nx = 1\n```"),
  );
});

async function selectAllOf(box: Element) {
  await userEvent.click(box.querySelector("p, li, h1, h2")!);
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-bubble-menu"]'),
    ).not.toBeNull(),
  );
}

test("bubble menu: Turn into converts the block, Clear formatting drops the marks", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Some **bold** words",
    onValueChange,
  });
  await selectAllOf(screen.getByRole("textbox", { name: "Notes" }).element());
  await userEvent.click(
    document.querySelector<HTMLElement>('[aria-label^="Turn into"]')!,
  );
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-turn-into"]'),
    ).not.toBeNull(),
  );
  await userEvent.click(
    [...document.querySelectorAll<HTMLElement>("[role=menuitemradio]")].find(
      (item) => item.textContent === "Heading 2",
    )!,
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("## Some **bold** words"),
  );
  await selectAllOf(screen.getByRole("textbox", { name: "Notes" }).element());
  await userEvent.click(
    document.querySelector<HTMLElement>('[aria-label="Clear formatting"]')!,
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("## Some bold words"),
  );
});

test("pasting a URL over a selection links it; pasted HTML is sanitized", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Read the spec",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await userEvent.click(box.element().querySelector("p")!);
  selectTail(box.element().querySelector("p")!, 4);
  await new Promise((resolve) => setTimeout(resolve, 50));
  const url = new DataTransfer();
  url.setData("text/plain", "https://example.com/spec");
  box.element().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: url,
      bubbles: true,
      cancelable: true,
    }),
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "Read the [spec](https://example.com/spec)",
    ),
  );
  await userEvent.keyboard(`${END}{Enter}`);
  const html = new DataTransfer();
  html.setData(
    "text/html",
    '<p onclick="alert(1)">Safe <b>text</b><script>alert(2)</script></p>',
  );
  html.setData("text/plain", "Safe text");
  box.element().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: html,
      bubbles: true,
      cancelable: true,
    }),
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain("Safe **text**"),
  );
  expect(box.element().querySelector("script,[onclick]")).toBeNull();
});

const TABLE = "| A   | B   |\n| --- | --- |\n| 1   | 2   |\n| 3   | 4   |";

const tableMenu = () =>
  document.querySelector<HTMLElement>("[data-text-edit-menu]");

/** Hover `cell`, then press (no travel) its row or column grip: the line's menu opens. */
async function openTableMenu(axis: "row" | "col" | "table", cell: Element) {
  await userEvent.unhover(cell);
  await userEvent.hover(cell);
  const grip = () =>
    document.querySelector<HTMLElement>(
      `[data-slot="text-edit-table-grip"][data-axis="${axis}"]`,
    );
  await vi.waitFor(() => expect(grip()).not.toBeNull());
  const box = grip()!.getBoundingClientRect();
  pointer("pointerdown", grip()!, box.left + 2, box.top + 2);
  pointer("pointerup", window, box.left + 2, box.top + 2);
  await vi.waitFor(() => expect(tableMenu()).not.toBeNull());
}

async function chooseTableItem(label: string) {
  const item = [
    ...tableMenu()!.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
  ].find((element) => element.textContent === label);
  expect(item, label).toBeDefined();
  await userEvent.click(item!);
  await vi.waitFor(() => expect(tableMenu()).toBeNull());
}

test("table grips open row and column menus: move, duplicate and delete", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ defaultValue: TABLE, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const td = (index: number) => box.querySelectorAll("td")[index]!;
  await openTableMenu("col", td(0));
  await chooseTableItem("Move right");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "| B   | A   |\n| --- | --- |\n| 2   | 1   |\n| 4   | 3   |",
    ),
  );
  await openTableMenu("row", td(0));
  await chooseTableItem("Move down");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "| B   | A   |\n| --- | --- |\n| 4   | 3   |\n| 2   | 1   |",
    ),
  );
  await openTableMenu("row", td(0));
  await chooseTableItem("Duplicate");
  await vi.waitFor(() => expect(box.querySelectorAll("tr").length).toBe(4));
  await openTableMenu("row", td(0));
  await chooseTableItem("Delete row");
  await vi.waitFor(() => expect(box.querySelectorAll("tr").length).toBe(3));
  await openTableMenu("col", td(0));
  await chooseTableItem("Delete column");
  await vi.waitFor(() =>
    expect(box.querySelectorAll("tr")[0]!.children.length).toBe(1),
  );
  expect(lastValue(onValueChange)).toMatch(/^\| [AB] +\|\n\| --- \|/);
});

test("the corner grip deletes the table; the + bars add a row and a column", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ defaultValue: TABLE, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const add = (axis: "row" | "col") =>
    document.querySelector<HTMLElement>(
      `[data-slot="text-edit-table-add"][data-axis="${axis}"]`,
    );
  await userEvent.hover(box.querySelectorAll("td")[0]!);
  await vi.waitFor(() => expect(add("row")).not.toBeNull());
  await userEvent.click(add("row")!);
  await vi.waitFor(() => expect(box.querySelectorAll("tr").length).toBe(4));
  await userEvent.unhover(box);
  await userEvent.hover(box.querySelectorAll("td")[0]!);
  await vi.waitFor(() => expect(add("col")).not.toBeNull());
  await userEvent.click(add("col")!);
  await vi.waitFor(() =>
    expect(box.querySelectorAll("tr")[3]!.children.length).toBe(3),
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)?.split("\n")).toHaveLength(5),
  );
  // No block handle over a table: the corner grip stands in its place.
  expect(
    document.querySelector('[data-slot="text-edit-block-handle"]'),
  ).toBeNull();
  await openTableMenu("table", box.querySelectorAll("td")[0]!);
  await chooseTableItem("Delete table");
  await vi.waitFor(() => expect(box.querySelector("table")).toBeNull());
});

test("a composer hides the mention chip's hit area, which would overflow its scroll box after the last line", async () => {
  const screen = await render(
    <TextEdit variant="composer" format="markdown" aria-label="Comment" />,
  );
  const content = screen.container.querySelector<HTMLElement>(
    '[data-slot="text-edit-content"]',
  )!;
  expect(content.className).toContain("overflow-y-auto");
  expect(content.className).toContain(
    "[&_[data-slot=inline-chip]]:before:hidden",
  );
});

/** The app's table classes (`w-full`, `table-fixed`, a scrolling wrapper), which the suite's CSS lacks. */
function styleTables() {
  const sheet = document.createElement("style");
  sheet.textContent =
    ".tableWrapper{max-width:100%;overflow-x:auto}.tableWrapper table{width:100%;table-layout:fixed;border-collapse:collapse}";
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

/** The widths (px) the table's columns are laid out at, from its first row. */
const columnWidths = (box: Element) =>
  [...box.querySelector("tr")!.children].map(
    (cell) => cell.getBoundingClientRect().width,
  );

test("adding a column keeps the others as wide as they were; the new one is 160px", async () => {
  styleTables();
  const screen = await markdownEditor({ defaultValue: TABLE });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const before = columnWidths(box);
  await userEvent.click(box.querySelectorAll("td")[0]!);
  await userEvent.hover(box.querySelectorAll("td")[0]!);
  await vi.waitFor(() =>
    expect(
      document.querySelector(
        '[data-slot="text-edit-table-add"][data-axis="col"]',
      ),
    ).not.toBeNull(),
  );
  await userEvent.click(
    document.querySelector(
      '[data-slot="text-edit-table-add"][data-axis="col"]',
    )!,
  );
  await vi.waitFor(() =>
    expect(box.querySelector("tr")!.children.length).toBe(3),
  );
  const after = columnWidths(box);
  expect(Math.abs(after[0]! - before[0]!)).toBeLessThanOrEqual(1);
  expect(Math.abs(after[1]! - before[1]!)).toBeLessThanOrEqual(1);
  // 160px of column, less the table's border and cell padding.
  expect(after[2]!).toBeGreaterThan(145);
  expect(after[2]!).toBeLessThanOrEqual(160);
});

test("dragging a column border changes that column only", async () => {
  styleTables();
  const screen = await markdownEditor({ defaultValue: TABLE });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const before = columnWidths(box);
  const cell = box.querySelector("th")!;
  const edge = cell.getBoundingClientRect();
  const y = edge.top + edge.height / 2;
  const fire = (type: string, target: EventTarget, x: number) =>
    target.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
      }),
    );
  fire("mousemove", cell, edge.right - 1);
  await vi.waitFor(() => expect(box).toHaveClass("resize-cursor"));
  fire("mousedown", cell, edge.right - 1);
  fire("mousemove", window, edge.right + 59);
  fire("mouseup", window, edge.right + 59);
  await vi.waitFor(() =>
    expect(columnWidths(box)[0]!).toBeGreaterThan(before[0]! + 50),
  );
  const after = columnWidths(box);
  expect(Math.abs(after[1]! - before[1]!)).toBeLessThanOrEqual(1);
});

test("a document ending in a table: clicking below it, or ↓ from its last row, gives a paragraph to type in", async () => {
  const screen = await markdownEditor({ defaultValue: TABLE });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  expect(box.lastElementChild!.matches(".tableWrapper")).toBe(true);
  const table = box.querySelector(".tableWrapper")!.getBoundingClientRect();
  box.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: table.left + 10,
      clientY: table.bottom + 8,
      button: 0,
    }),
  );
  await vi.waitFor(() => expect(box.lastElementChild!.tagName).toBe("P"));
  // Type only once the caret sits in that paragraph (the click's selection lands a frame later).
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(box);
    expect(
      box.lastElementChild!.contains(
        document.getSelection()?.anchorNode ?? null,
      ),
    ).toBe(true);
  });
  await userEvent.keyboard("after");
  await vi.waitFor(() =>
    expect(box.lastElementChild!.textContent).toBe("after"),
  );
});

test("↓ from the last row of a last table adds a paragraph", async () => {
  const screen = await markdownEditor({ defaultValue: TABLE });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.click(box.querySelectorAll("td")[3]!);
  await userEvent.keyboard("{ArrowDown}");
  await vi.waitFor(() => expect(box.lastElementChild!.tagName).toBe("P"));
});

test("a document ending in an audio block: clicking below it gives a paragraph to type in", async () => {
  const audio = await markdownEditor({
    defaultValue: 'x\n\n<audio src="https://example.com/a.mp3"></audio>',
  });
  const audioBox = audio.getByRole("textbox", { name: "Notes" }).element();
  expect(
    audioBox.lastElementChild!.querySelector("audio, [data-type=audio]"),
  ).not.toBeNull();
  const media = audioBox.lastElementChild!.getBoundingClientRect();
  audioBox.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: media.left + 10,
      clientY: media.bottom + 8,
      button: 0,
    }),
  );
  await vi.waitFor(() => expect(audioBox.lastElementChild!.tagName).toBe("P"));
});

test("Tab and Shift+Tab move between table cells", async () => {
  const screen = await markdownEditor({ defaultValue: TABLE });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.click(box.querySelectorAll("td")[0]!);
  // Tab selects the next cell's text, so typing replaces it; Shift+Tab goes back.
  await userEvent.keyboard("{Tab}x");
  await vi.waitFor(() =>
    expect(box.querySelectorAll("td")[1]!.textContent).toBe("x"),
  );
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}y");
  await vi.waitFor(() =>
    expect(box.querySelectorAll("td")[0]!.textContent).toBe("y"),
  );
});

function pointer(type: string, target: EventTarget, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      bubbles: true,
      cancelable: true,
      pointerId: 1,
    }),
  );
}

async function drag(handle: HTMLElement, x: number, y: number) {
  const box = handle.getBoundingClientRect();
  pointer("pointerdown", handle, box.left + 4, box.top + 4);
  pointer("pointermove", window, box.left + 20, box.top + 20);
  pointer("pointermove", window, x, y);
  pointer("pointerup", window, x, y);
}

test("dragging a column grip reorders the columns", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ defaultValue: TABLE, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const first = box.querySelectorAll("td")[0]!;
  await userEvent.hover(first);
  const grip = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="text-edit-table-grip"][data-axis="col"]',
    );
  await vi.waitFor(() => expect(grip()).not.toBeNull());
  const last = box.querySelectorAll("th")[1]!.getBoundingClientRect();
  await drag(grip()!, last.right - 2, last.top + 4);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "| B   | A   |\n| --- | --- |\n| 2   | 1   |\n| 4   | 3   |",
    ),
  );
});

test("dragging a row grip reorders the body rows", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ defaultValue: TABLE, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.hover(box.querySelectorAll("td")[0]!);
  const grip = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="text-edit-table-grip"][data-axis="row"]',
    );
  await vi.waitFor(() => expect(grip()).not.toBeNull());
  const lastRow = box.querySelectorAll("tr")[2]!.getBoundingClientRect();
  await drag(grip()!, lastRow.left + 4, lastRow.bottom - 2);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "| A   | B   |\n| --- | --- |\n| 3   | 4   |\n| 1   | 2   |",
    ),
  );
});

test("the block handle drags a block to a new place, and ⌘⇧↑ moves it back", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "One\n\nTwo\n\nThree",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const paragraphs = box.querySelectorAll("p");
  await userEvent.hover(paragraphs[0]!);
  const handle = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-block-handle"]');
  await vi.waitFor(() => expect(handle()).not.toBeNull());
  const end = paragraphs[2]!.getBoundingClientRect();
  await drag(handle()!, end.left + 4, end.bottom - 1);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("Two\n\nThree\n\nOne"),
  );
  await userEvent.keyboard(`{${MOD}>}{Shift>}{ArrowUp}{/Shift}{/${MOD}}`);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("Two\n\nOne\n\nThree"),
  );
});

test("the block handle moves a list item among its siblings", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "- a\n- b\n- c",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const items = box.querySelectorAll("li");
  await userEvent.hover(items[2]!.querySelector("p")!);
  const handle = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-block-handle"]');
  await vi.waitFor(() => expect(handle()).not.toBeNull());
  const top = items[0]!.getBoundingClientRect();
  await drag(handle()!, top.left + 4, top.top + 1);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("- c\n- a\n- b"),
  );
});

test("dragHandles={false} shows no handle or grips", async () => {
  const screen = await markdownEditor({
    defaultValue: TABLE,
    dragHandles: false,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.hover(box.querySelectorAll("td")[0]!);
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(
    document.querySelector(
      '[data-slot="text-edit-block-handle"],[data-slot="text-edit-table-grip"]',
    ),
  ).toBeNull();
});

test("the link popover floats above a clipping container instead of being cut off", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await render(
    <div
      style={{ overflow: "hidden", height: 40, marginTop: 120 }}
      data-testid="clip"
    >
      <TextEdit
        format="markdown"
        defaultValue="Read the spec"
        aria-label="Clipped"
      />
    </div>,
  );
  const box = screen.getByRole("textbox", { name: "Clipped" }).element();
  await userEvent.click(box.querySelector("p")!);
  await userEvent.keyboard(`${END}{${MOD}>}k{/${MOD}}`);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-link"]'),
    ).not.toBeNull(),
  );
  const form = document.querySelector<HTMLElement>(
    '[data-slot="text-edit-link"]',
  )!;
  const clip = screen.getByTestId("clip").element();
  expect(clip.contains(form)).toBe(false);
  const rect = form.getBoundingClientRect();
  expect(rect.height).toBeGreaterThan(20);
  const hit = document.elementFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  );
  expect(form.contains(hit)).toBe(true);
});

test("the slash menu flips above the caret near the bottom of the viewport", async () => {
  const screen = await render(
    <div style={{ position: "fixed", bottom: 8, left: 8, width: 300 }}>
      <TextEdit format="markdown" aria-label="Low" />
    </div>,
  );
  await screen.getByRole("textbox", { name: "Low" }).click();
  await userEvent.keyboard("/");
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  expect(slashMenu()!.getAttribute("data-side")).toBe("top");
  const rect = slashMenu()!.getBoundingClientRect();
  expect(rect.top).toBeGreaterThanOrEqual(0);
  expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
});

test("nothing overflows horizontally: long words, URLs, code and tables stay in their box", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const long = "x".repeat(300);
  const md = [
    `A long word ${long} and https://example.com/${long}`,
    `Inline \`${long}\``,
    "```\n" + long + "\n```",
    `| ${long} | b |\n| --- | --- |\n| 1 | 2 |`,
  ].join("\n\n");
  const screen = await render(
    <div style={{ width: 320 }} data-testid="narrow">
      <TextEdit format="markdown" defaultValue={md} aria-label="Narrow" />
    </div>,
  );
  const box = screen.getByRole("textbox", { name: "Narrow" }).element();
  await vi.waitFor(() => expect(box.querySelector("table")).not.toBeNull());
  const narrow = screen.getByTestId("narrow").element();
  expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
  // The wide pieces scroll inside their own block.
  const wrapper = box.querySelector<HTMLElement>(".tableWrapper")!;
  expect(getComputedStyle(wrapper).overflowX).toBe("auto");
  expect(wrapper.getBoundingClientRect().width).toBeLessThanOrEqual(320);
});

test("no fill in any state: the caret is the focus cue", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await markdownEditor({ defaultValue: "Hello" });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="text-edit"]',
  )!;
  const fills = () =>
    [box, root].map((el) => [
      getComputedStyle(el).backgroundColor,
      getComputedStyle(el).backgroundImage,
    ]);
  const rest = fills();
  await userEvent.hover(box);
  await userEvent.click(box);
  expect(fills()).toEqual(rest);
  expect(
    rest.every(
      ([color, image]) => color === "rgba(0, 0, 0, 0)" && image === "none",
    ),
  ).toBe(true);
  expect(box.getAttribute("data-focus-cue")).toBe("caret");
});

test("the slash hint shows only while focused and empty", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await markdownEditor({ placeholder: "Add a description…" });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const hint = () =>
    getComputedStyle(box.querySelector("p")!, "::before").content;
  await vi.waitFor(() => expect(hint()).toContain("Add a description…"));
  await userEvent.click(box);
  await vi.waitFor(() => expect(hint()).toContain("Type / for commands"));
  await userEvent.keyboard("a");
  await vi.waitFor(() => expect(hint()).not.toContain("Type / for commands"));
});

// ---- Library: mentions, uploads, outline, comment highlights, ⌘K -----------------------------

const mentionMenu = () =>
  document.querySelector(
    '[data-slot="suggestion-menu"][data-menu="text-edit-mention"]',
  );

/** Put the caret at `offset` in the first text node under `block`, through the DOM. */
function caretAt(block: Element, offset: number) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const text = walker.nextNode() as Text;
  const range = document.createRange();
  range.setStart(text, offset);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

/** Select `text` inside `block` through the DOM. */
function selectText(block: Element, text: string) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const at = node.data.indexOf(text);
    if (at === -1) continue;
    const range = document.createRange();
    range.setStart(node, at);
    range.setEnd(node, at + text.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    return;
  }
  throw new Error(`"${text}" not found`);
}

function pasteFiles(target: Element, files: File[]) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  target.dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }),
  );
}

const png = () =>
  new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "shot.png", {
    type: "image/png",
  });

test("mentions: the menu asks at once, then once after the debounce; Enter inserts a chip, Backspace removes it whole, Escape closes", async () => {
  const search = vi.fn(async (_query: string): Promise<MentionOption[]> => [
    { kind: "user", id: "u1", label: "Asha Rao" },
    { kind: "page", id: "p1", label: "Assembly notes" },
    { kind: "task", id: "t1", label: "Not offered" },
  ]);
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: { kinds: mentionKinds("user", "page"), search },
    onValueChange,
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("@as");
  await vi.waitFor(() =>
    expect(search).toHaveBeenLastCalledWith("as", {
      signal: expect.any(AbortSignal),
    }),
  );
  await vi.waitFor(() =>
    expect(mentionMenu()?.textContent).toContain("Asha Rao"),
  );
  // The opening query goes out at once; the keystrokes after it collapse into one search.
  expect(
    search.mock.calls.map(([query]) => query).filter((query) => query !== ""),
  ).toEqual(["as"]);
  // Grouped People · Pages; a kind the prop does not enable is never offered.
  const groups = [...mentionMenu()!.querySelectorAll('[role="group"]')];
  expect(groups.map((group) => group.firstElementChild?.textContent)).toEqual([
    "People",
    "Pages",
  ]);
  expect(mentionMenu()!.textContent).not.toContain("Not offered");
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("[@Asha Rao](mention://user/u1)"),
  );
  expect(mentionMenu()).toBeNull();
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  // The chip: the person's avatar (initials on their colour), then their name.
  const chip = box.querySelector('[data-slot="inline-chip"]')!;
  expect(chip.querySelector('[data-slot="inline-chip-avatar"]')).not.toBeNull();
  expect(chip.textContent).toMatch(/Asha Rao$/);

  // The trailing space, then the whole chip.
  await userEvent.keyboard("{Backspace}{Backspace}");
  await vi.waitFor(() => expect(lastValue(onValueChange)).toBe(""));

  await userEvent.keyboard("@");
  await vi.waitFor(() => expect(mentionMenu()).not.toBeNull());
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(mentionMenu()).toBeNull());
});

test("uploads: a pasted image shows the uploading overlay, then its final src — committed after blur", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const onCommit = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Before",
    onImageUpload,
    onCommit,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(END);
  const file = png();
  pasteFiles(box.element(), [file]);
  await vi.waitFor(() =>
    expect(
      box
        .element()
        .querySelector('[data-slot="text-edit-upload"][data-uploading]'),
    ).not.toBeNull(),
  );
  expect(onImageUpload).toHaveBeenCalledWith(file, {
    signal: expect.any(AbortSignal),
  });

  // Focus leaves before the upload lands: nothing changed yet, so nothing is committed.
  await screen.getByRole("button", { name: "Outside" }).click();
  expect(onCommit).not.toHaveBeenCalled();

  land({ src: "/api/files/f1" });
  await vi.waitFor(() =>
    expect(onCommit).toHaveBeenLastCalledWith("Before\n\n![](/api/files/f1)"),
  );
  expect(box.element().querySelector("[data-uploading]")).toBeNull();
  expect(box.element().querySelector("img")?.getAttribute("src")).toBe(
    "/api/files/f1",
  );
});

test("uploads: a rejected upload stays as a failed placeholder with Retry and Remove", async () => {
  const error = new Error("Too large");
  const onImageUpload = vi.fn().mockRejectedValue(error);
  const onUploadError = vi.fn();
  const onFailedUploadsChange = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Text",
    onImageUpload,
    onUploadError,
    onFailedUploadsChange,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  const file = png();
  pasteFiles(box.element(), [file]);
  await vi.waitFor(() =>
    expect(onUploadError).toHaveBeenCalledWith(file, error),
  );
  // It says so where it was, never vanishing: Retry uploads it again, Remove lets it go.
  const failed = screen.getByRole("group", {
    name: `Couldn't upload ${file.name}`,
  });
  await expect.element(failed).toBeVisible();
  expect(box.element().querySelector("[data-uploading]")).toBeNull();
  expect(onFailedUploadsChange).toHaveBeenLastCalledWith(1);
  await screen.getByRole("button", { name: `Retry ${file.name}` }).click();
  await vi.waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(2));
  await vi.waitFor(() => expect(onUploadError).toHaveBeenCalledTimes(2));
  await screen.getByRole("button", { name: `Remove ${file.name}` }).click();
  await vi.waitFor(() =>
    expect(
      box.element().querySelector("[data-slot=text-edit-upload]"),
    ).toBeNull(),
  );
  expect(onFailedUploadsChange).toHaveBeenLastCalledWith(0);
  expect(onValueChange).not.toHaveBeenCalled();
});

test("outline: headings are emitted with stable ids, and scrollToHeading scrolls to a repeat", async () => {
  const onOutlineChange = vi.fn();
  const handleRef = React.createRef<TextEditHandle>();
  await render(
    <TextEdit
      format="markdown"
      aria-label="Doc"
      value={"## Setup\n\ntext\n\n## Setup"}
      onOutlineChange={onOutlineChange}
      handleRef={handleRef}
    />,
  );
  await vi.waitFor(() =>
    expect(onOutlineChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: "setup", level: 2, text: "Setup" }),
      expect.objectContaining({ id: "setup-1", level: 2, text: "Setup" }),
    ]),
  );
  await vi.waitFor(() =>
    expect(document.querySelector(".ProseMirror #setup-1")).not.toBeNull(),
  );
  const scrollIntoView = vi.fn();
  document.getElementById("setup-1")!.scrollIntoView = scrollIntoView;
  handleRef.current!.scrollToHeading("setup-1");
  expect(scrollIntoView).toHaveBeenCalled();
});

test("annotations: a highlight stays on its words as text is typed before it, and the layout reports the moved anchor", async () => {
  const anchor = anchorFromRange("Use a 25 A breaker", 6, 10);
  const onAnnotationsLayout = vi.fn();
  const annotations = [{ id: "c1", anchor }];
  const screen = await markdownEditor({
    defaultValue: "Use a 25 A breaker",
    annotations,
    onAnnotationsLayout,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(box.querySelector('[data-annotation="c1"]')?.textContent).toBe(
      "25 A",
    ),
  );
  await vi.waitFor(() =>
    expect(onAnnotationsLayout).toHaveBeenCalledWith([
      { id: "c1", top: expect.any(Number), anchor },
    ]),
  );
  await userEvent.click(box.querySelector("p")!);
  caretAt(box.querySelector("p")!, 0);
  await userEvent.keyboard("Note: ");
  await vi.waitFor(() =>
    expect(box.querySelector('[data-annotation="c1"]')?.textContent).toBe(
      "25 A",
    ),
  );
  await vi.waitFor(() =>
    expect(onAnnotationsLayout).toHaveBeenLastCalledWith([
      {
        id: "c1",
        top: expect.any(Number),
        anchor: expect.objectContaining({ start: 12, end: 16, quote: "25 A" }),
      },
    ]),
  );
  // Nothing about the highlight reaches the document.
  expect(box.textContent).toBe("Note: Use a 25 A breaker");
});

test("annotations: read-only still draws highlights, and an orphan reports a null top", async () => {
  const onAnnotationsLayout = vi.fn();
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Doc"
      readOnly
      defaultValue="Use a 25 A breaker"
      annotations={[
        { id: "c1", anchor: anchorFromRange("Use a 25 A breaker", 6, 10) },
        { id: "gone", anchor: anchorFromRange("An old sentence", 3, 6) },
      ]}
      onAnnotationsLayout={onAnnotationsLayout}
    />,
  );
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector('.ProseMirror [data-annotation="c1"]')
        ?.textContent,
    ).toBe("25 A"),
  );
  expect(
    screen.container
      .querySelector(".ProseMirror")
      ?.getAttribute("contenteditable"),
  ).toBe("false");
  await vi.waitFor(() =>
    expect(onAnnotationsLayout).toHaveBeenCalledWith([
      expect.objectContaining({ id: "c1", top: expect.any(Number) }),
      { id: "gone", top: null, anchor: null },
    ]),
  );
});

test("Comment: the selection bubble offers it and hands over the anchor; never inside a code block", async () => {
  const onCreateAnnotation = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Use a 25 A breaker\n\n```\ncode here\n```",
    onCreateAnnotation,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.click(box.querySelector("p")!);
  selectText(box.querySelector("p")!, "25 A");
  const comment = () =>
    [
      ...document.querySelectorAll(
        '[data-slot="text-edit-bubble-menu"] button',
      ),
    ].find(
      (button) =>
        button.textContent === "Comment" &&
        // A hidden bubble menu stays in the DOM, invisible.
        !button.closest('[style*="visibility: hidden"]'),
    ) as HTMLElement | undefined;
  await vi.waitFor(() => expect(comment()).toBeDefined());
  comment()!.click();
  expect(onCreateAnnotation).toHaveBeenCalledWith(
    expect.objectContaining({ start: 6, end: 10, quote: "25 A" }),
  );

  selectText(box.querySelector("pre code")!, "code");
  // The bubble follows the selection after its own short update delay.
  await vi.waitFor(() => expect(comment()).toBeUndefined());
});

test("⌘K inside the editor opens the link panel and never reaches a document-level listener", async () => {
  const screen = await markdownEditor({ defaultValue: "Text" });
  const documentKeydown = vi.fn();
  document.addEventListener("keydown", documentKeydown);
  onTestFinished(() =>
    document.removeEventListener("keydown", documentKeydown),
  );
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-link"]'),
    ).not.toBeNull(),
  );
  expect(
    documentKeydown.mock.calls.some(
      ([event]) => (event as KeyboardEvent).key.toLowerCase() === "k",
    ),
  ).toBe(false);
});

// ---- Comment highlights: keyboard path and count pills ----------------------------------------

const DOC = "Use a 25 A breaker";
const at = (start: number, end: number) => anchorFromRange(DOC, start, end);

/** A read-only TextEdit over `DOC` with a button before it, once its highlights have drawn. */
async function viewWithHighlights(
  props: Partial<React.ComponentProps<typeof TextEdit>> = {},
) {
  const screen = await render(
    <>
      <button type="button">Before</button>
      <TextEdit
        format="markdown"
        aria-label="Doc"
        readOnly
        defaultValue={DOC}
        annotations={[{ id: "c1", anchor: at(6, 10), count: 2 }]}
        {...props}
      />
    </>,
  );
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector(".ProseMirror [data-annotation]"),
    ).not.toBeNull(),
  );
  // The options land in their own transaction, right after the highlights.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return screen;
}

test("annotations, view mode: a highlight is a tab stop named for its comment; Enter and Space open it", async () => {
  const onAnnotationClick = vi.fn();
  const screen = await viewWithHighlights({ onAnnotationClick });
  const highlight = screen.getByRole("button", {
    name: "2 comments on “25 A”",
  });
  await expect.element(highlight).toHaveAttribute("tabindex", "0");
  await expect.element(highlight).toHaveAttribute("data-annotation", "c1");

  await screen.getByRole("button", { name: "Before" }).click();
  await userEvent.tab();
  expect(document.activeElement).toBe(highlight.element());
  await userEvent.keyboard("{Enter}");
  expect(onAnnotationClick).toHaveBeenLastCalledWith("c1");
  await userEvent.keyboard(" ");
  expect(onAnnotationClick).toHaveBeenCalledTimes(2);
  // The document is still read-only: nothing was typed into it.
  expect(screen.container.querySelector(".ProseMirror")?.textContent).toBe(DOC);
  await expectNoA11yViolations(screen.container);
});

test("annotations, view mode: opening a thread (the host marks it active) keeps focus on the highlight", async () => {
  function Host() {
    const [active, setActive] = React.useState<string | null>(null);
    return (
      <>
        <button type="button">Before</button>
        <TextEdit
          format="markdown"
          aria-label="Doc"
          readOnly
          defaultValue={DOC}
          annotations={[{ id: "c1", anchor: at(6, 10), count: 2 }]}
          annotationCounts="always"
          activeAnnotationId={active}
          onAnnotationClick={setActive}
          annotationLabel={(quote) => `Thread on ${quote}`}
        />
        <output>{active ?? "none"}</output>
      </>
    );
  }
  const screen = await render(<Host />);
  const highlight = screen.getByRole("button", { name: "Thread on 25 A" });
  await expect.element(highlight).toBeInTheDocument();
  await screen.getByRole("button", { name: "Before" }).click();
  await userEvent.tab();
  expect(document.activeElement).toBe(highlight.element());
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByText("c1")).toBeInTheDocument();
  await vi.waitFor(() =>
    expect(highlight.element().hasAttribute("data-active")).toBe(true),
  );
  expect(document.activeElement).toBe(highlight.element());
});

test("annotations, view mode: the keyboard focus cue is base.css's accent tint, never a ring", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await viewWithHighlights({ onAnnotationClick: vi.fn() });
  await screen.getByRole("button", { name: "Before" }).click();
  await userEvent.tab();
  const focused = document.activeElement as HTMLElement;
  expect(focused.getAttribute("data-annotation")).toBe("c1");
  const style = getComputedStyle(focused);
  expect(style.backgroundImage).toContain("gradient");
  expect(style.outlineStyle).toBe("none");
});

test("annotations, view mode: a highlight across marks is ONE tab stop, and its other spans are not read twice", async () => {
  const source = "Use a **25 A** breaker";
  const onAnnotationClick = vi.fn();
  const screen = await viewWithHighlights({
    defaultValue: source,
    annotations: [{ id: "c1", anchor: anchorFromRange(DOC, 4, 12) }],
    onAnnotationClick,
  });
  const spans = [
    ...screen.container.querySelectorAll('.ProseMirror [data-annotation="c1"]'),
  ];
  expect(spans.map((span) => span.textContent)).toEqual(["a ", "25 A", " b"]);
  const stops = spans.filter((span) => span.getAttribute("tabindex") === "0");
  expect(stops).toHaveLength(1);
  expect(stops[0]!.getAttribute("aria-label")).toBe("Comment on “a 25 A b”");
  expect(spans.slice(1).every((span) => span.getAttribute("aria-hidden"))).toBe(
    true,
  );
  await expectNoA11yViolations(screen.container);
});

test("annotations, view mode: without onAnnotationClick a highlight is not a button or a tab stop", async () => {
  const screen = await viewWithHighlights();
  const span = screen.container.querySelector(
    '.ProseMirror [data-annotation="c1"]',
  )!;
  expect(span.hasAttribute("tabindex")).toBe(false);
  expect(span.hasAttribute("role")).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("annotations, view mode: the active highlight keeps its fill and stays a named tab stop", async () => {
  const screen = await viewWithHighlights({
    onAnnotationClick: vi.fn(),
    activeAnnotationId: "c1",
    annotationCounts: "always",
  });
  const highlight = screen.getByRole("button", {
    name: "2 comments on “25 A”",
  });
  await expect.element(highlight).toHaveAttribute("data-active", "");
  await vi.waitFor(() =>
    expect(
      screen.container
        .querySelector('[data-slot="text-edit-annotation-count"]')
        ?.hasAttribute("data-active"),
    ).toBe(true),
  );
  await expectNoA11yViolations(screen.container);
});

test("annotations, editing: a highlight is never a tab stop; typing inside it keeps the caret in the text", async () => {
  const onAnnotationClick = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: DOC,
    annotations: [{ id: "c1", anchor: at(6, 10) }],
    onAnnotationClick,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(box.querySelector('[data-annotation="c1"]')?.textContent).toBe(
      "25 A",
    ),
  );
  const highlight = box.querySelector('[data-annotation="c1"]')!;
  expect(highlight.hasAttribute("tabindex")).toBe(false);
  expect(highlight.hasAttribute("role")).toBe(false);

  // A click on the highlight places the caret (and opens the thread, as before).
  await userEvent.click(highlight);
  expect(onAnnotationClick).toHaveBeenLastCalledWith("c1");
  caretAt(highlight, 2);
  await userEvent.keyboard("0");
  await vi.waitFor(() =>
    expect(onValueChange).toHaveBeenLastCalledWith("Use a 250 A breaker"),
  );
  expect(document.activeElement).toBe(box);
  const selection = window.getSelection()!;
  expect(box.contains(selection.anchorNode)).toBe(true);
  expect(box.querySelector('[data-annotation="c1"]')?.textContent).toBe(
    "250 A",
  );
  await expectNoA11yViolations(screen.container);
});

test("annotations, editing: Alt+Enter in a highlight opens its thread; elsewhere, and plain Enter, edit as before", async () => {
  const onAnnotationClick = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: DOC,
    annotations: [{ id: "c1", anchor: at(6, 10) }],
    onAnnotationClick,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(box.querySelector('[data-annotation="c1"]')).not.toBeNull(),
  );
  await userEvent.click(box.querySelector("p")!);
  onAnnotationClick.mockClear();

  caretAt(box.querySelector('[data-annotation="c1"]')!, 1);
  await userEvent.keyboard("{Alt>}{Enter}{/Alt}");
  expect(onAnnotationClick).toHaveBeenCalledWith("c1");
  expect(onValueChange).not.toHaveBeenCalled();

  // Outside a highlight Alt+Enter is not the thread's.
  onAnnotationClick.mockClear();
  caretAt(box.querySelector("p")!, 1);
  await userEvent.keyboard("{Alt>}{Enter}{/Alt}");
  expect(onAnnotationClick).not.toHaveBeenCalled();

  // Enter inside a highlight still splits the paragraph (after undoing whatever the browser's
  // own Alt+Enter did outside it).
  await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
  await vi.waitFor(() => expect(box.querySelectorAll("p")).toHaveLength(1));
  caretAt(box.querySelector('[data-annotation="c1"]')!, 2);
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(box.querySelectorAll("p")).toHaveLength(2));
});

test("annotation counts: `never` (the default) renders no pill", async () => {
  const screen = await viewWithHighlights({ onAnnotationClick: vi.fn() });
  expect(
    screen.container.querySelector('[data-slot="text-edit-annotation-count"]'),
  ).toBeNull();
});

test("annotation counts: `always` renders one pill per drawn highlight, named by annotationCountLabel", async () => {
  const onAnnotationClick = vi.fn();
  const screen = await viewWithHighlights({
    annotations: [
      { id: "c1", anchor: at(6, 10), count: 3 },
      { id: "c2", anchor: at(11, 18) },
      { id: "gone", anchor: anchorFromRange("An old sentence", 3, 6) },
    ],
    annotationCounts: "always",
    onAnnotationClick,
  });
  const pills = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="text-edit-annotation-count"]',
    ),
  ];
  // The orphan draws no highlight, so it gets no pill.
  expect(
    pills.map((pill) => pill.getAttribute("data-annotation-count")),
  ).toEqual(["c1", "c2"]);
  await expect
    .element(screen.getByRole("button", { name: "3 comments" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "1 comment" }))
    .toBeInTheDocument();
  const [first] = pills;
  expect(first!.getAttribute("contenteditable")).toBe("false");
  expect(first!.getAttribute("tabindex")).toBe("-1");
  expect(first!.querySelector('[aria-hidden="true"]')?.textContent).toBe("3");
  expect(first!.className).toContain("inline-flex");
  // It sits after its highlight's text.
  expect(first!.previousSibling?.textContent).toContain("25 A");
  first!.click();
  expect(onAnnotationClick).toHaveBeenCalledWith("c1");
  await expectNoA11yViolations(screen.container);

  // A custom label.
  screen.rerender(
    <>
      <button type="button">Before</button>
      <TextEdit
        format="markdown"
        aria-label="Doc"
        readOnly
        defaultValue={DOC}
        annotations={[{ id: "c1", anchor: at(6, 10), count: 3 }]}
        annotationCounts="always"
        annotationCountLabel={(n) => `${n} notes`}
        onAnnotationClick={onAnnotationClick}
      />
    </>,
  );
  await expect
    .element(screen.getByRole("button", { name: "3 notes" }))
    .toBeInTheDocument();
});

test("annotation counts: `auto` shows the pill only on a coarse pointer or below lg, in CSS", async () => {
  const screen = await viewWithHighlights({ annotationCounts: "auto" });
  const pill = screen.container.querySelector<HTMLElement>(
    '[data-slot="text-edit-annotation-count"]',
  )!;
  expect(pill.className).toContain("hidden");
  expect(pill.className).toContain("pointer-coarse:inline-flex");
  expect(pill.className).toContain("max-lg:inline-flex");
  // No click handler: a count, not a button.
  expect(pill.hasAttribute("role")).toBe(false);
  expect(pill.textContent).toBe("22 comments");
});

test("annotation counts: the pill's hit area is at least 24px (real compiled CSS)", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await viewWithHighlights({
    annotationCounts: "always",
    onAnnotationClick: vi.fn(),
  });
  const pill = screen.container.querySelector<HTMLElement>(
    '[data-slot="text-edit-annotation-count"]',
  )!;
  const box = pill.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  // 11px from the centre is inside a 24px target in every direction; 14px is outside it.
  for (const [dx, dy] of [
    [0, -11],
    [0, 11],
    [-11, 0],
    [11, 0],
  ] as const)
    expect(pill.contains(document.elementFromPoint(x + dx, y + dy))).toBe(true);
  expect(pill.contains(document.elementFromPoint(x, y - 14))).toBe(false);
});

test("annotation counts: the pill never reaches the document, its Markdown, the clipboard, or the caret", async () => {
  const onAnnotationClick = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: DOC,
    annotations: [{ id: "c1", anchor: at(6, 10), count: 2 }],
    annotationCounts: "always",
    onAnnotationClick,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(
      box.querySelector('[data-slot="text-edit-annotation-count"]'),
    ).not.toBeNull(),
  );
  const pill = box.querySelector<HTMLElement>(
    '[data-slot="text-edit-annotation-count"]',
  )!;

  // Clicking the pill opens the thread and leaves the caret where it was.
  await userEvent.click(box.querySelector("p")!);
  caretAt(box.querySelector("p")!, 2);
  const before = window.getSelection()!.getRangeAt(0).cloneRange();
  pill.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
  );
  pill.click();
  expect(onAnnotationClick).toHaveBeenCalledWith("c1");
  expect(document.activeElement).toBe(box);
  const after = window.getSelection()!.getRangeAt(0);
  expect(after.startContainer).toBe(before.startContainer);
  expect(after.startOffset).toBe(before.startOffset);

  // Typing at the highlight's end lands after the pill, outside the highlight, in the text.
  const textNodes = () => {
    const walker = document.createTreeWalker(
      box.querySelector("p")!,
      NodeFilter.SHOW_TEXT,
    );
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    return nodes;
  };
  const tail = textNodes().find((node) => node.data === " breaker")!;
  const caret = document.createRange();
  caret.setStart(tail, 0);
  caret.collapse(true);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(caret);
  document.dispatchEvent(new Event("selectionchange"));
  await userEvent.keyboard("!");
  await vi.waitFor(() =>
    expect(onValueChange).toHaveBeenLastCalledWith("Use a 25 A! breaker"),
  );
  expect(box.querySelector('[data-annotation="c1"]')?.textContent).toBe("25 A");
  expect(
    box.querySelector("[data-annotation-count]")?.previousSibling?.textContent,
  ).toBe("25 A");

  // Copying across the highlight copies the text only.
  const nodes = textNodes();
  const all = document.createRange();
  all.setStart(nodes[0]!, 0);
  const last = nodes.at(-1)!;
  all.setEnd(last, last.data.length);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(all);
  document.dispatchEvent(new Event("selectionchange"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  const data = new DataTransfer();
  box.dispatchEvent(
    new ClipboardEvent("copy", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }),
  );
  expect(data.getData("text/plain")).toBe("Use a 25 A! breaker");
  expect(data.getData("text/html")).not.toContain("comment");
  await expectNoA11yViolations(screen.container);
});

// ---- Hidden and shown again; table cells take no block commands ------------------------------

test("hidden and shown again (React Activity): the live document survives, and an upload still lands", async () => {
  const onImageUpload = vi.fn(async () => ({ src: "/api/files/f2" }));
  const onCommit = vi.fn();
  function Harness() {
    const [shown, setShown] = React.useState(true);
    return (
      <>
        <button type="button" onClick={() => setShown((next) => !next)}>
          Switch
        </button>
        <React.Activity mode={shown ? "visible" : "hidden"}>
          <TextEdit
            format="markdown"
            aria-label="Notes"
            defaultValue="Start"
            onImageUpload={onImageUpload}
            onCommit={onCommit}
          />
        </React.Activity>
      </>
    );
  }
  const screen = await render(<Harness />);
  const editorOf = () =>
    screen.container.querySelector<HTMLElement>(".ProseMirror");
  await vi.waitFor(() => expect(editorOf()).not.toBeNull());
  await new Promise((resolve) => setTimeout(resolve, 50));
  await userEvent.click(editorOf()!);
  await userEvent.keyboard(`${END} typed`);
  await vi.waitFor(() => expect(editorOf()!.textContent).toBe("Start typed"));

  // Hidden long enough for Tiptap to destroy the editor, then shown: it is rebuilt.
  const first = editorOf();
  await screen.getByRole("button", { name: "Switch" }).click();
  await new Promise((resolve) => setTimeout(resolve, 100));
  await screen.getByRole("button", { name: "Switch" }).click();
  await vi.waitFor(() => {
    expect(editorOf()).not.toBeNull();
    expect(editorOf()).not.toBe(first);
  });
  await vi.waitFor(() => expect(editorOf()!.textContent).toBe("Start typed"));

  await userEvent.click(editorOf()!);
  await userEvent.keyboard(END);
  pasteFiles(editorOf()!, [png()]);
  await vi.waitFor(() =>
    expect(editorOf()!.querySelector("img")?.getAttribute("src")).toBe(
      "/api/files/f2",
    ),
  );
  await vi.waitFor(() =>
    expect(onCommit).toHaveBeenLastCalledWith(
      "Start typed\n\n![](/api/files/f2)",
    ),
  );
});

test("inside a table cell the slash menu and Turn into offer no block commands", async () => {
  const screen = await markdownEditor({ defaultValue: TABLE });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.click(box.querySelectorAll("td")[0]!);
  await userEvent.keyboard(`{End} /`);
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  const labels = [
    ...slashMenu()!.querySelectorAll('[data-slot="suggestion-menu-option"]'),
  ].map((item) => item.textContent ?? "");
  for (const label of ["Text", "Image", "Link"])
    expect(labels.some((text) => text.startsWith(label))).toBe(true);
  for (const label of [
    "Heading",
    "Bullet list",
    "Numbered list",
    "Checklist",
    "Quote",
    "Callout",
    "Toggle",
    "Code block",
    "Table",
    "Divider",
  ])
    expect(labels.some((text) => text.startsWith(label))).toBe(false);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(slashMenu()).toBeNull());

  // A selection in a cell: the bubble menu keeps its marks but has no Turn into.
  selectText(box.querySelectorAll("td")[1]!, "2");
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-bubble-menu"]'),
    ).not.toBeNull(),
  );
  expect(document.querySelector('[aria-label^="Turn into"]')).toBeNull();
  expect(document.querySelector('[aria-label="Bold"]')).not.toBeNull();
});

// ---- Images: resize, the ⋯ menu, the viewer --------------------------------------------------

const PIXEL =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22400%22%20height=%22200%22/%3E";

test("image: dragging a side handle resizes it and stores the width in the Markdown", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: `![Chart|200](${PIXEL})`,
    onValueChange,
  });
  const node = screen.container.querySelector<HTMLElement>(
    "[data-slot=text-edit-image-node]",
  )!;
  const handle = node.querySelector<HTMLElement>("[data-resize-handle=right]")!;
  const start = handle.getBoundingClientRect();
  handle.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: start.x,
      clientY: start.y,
    }),
  );
  expect(
    screen.container.querySelectorAll("[data-slot=text-edit-image-guide]"),
  ).toHaveLength(4);
  document.dispatchEvent(
    new MouseEvent("mousemove", { clientX: start.x + 61, clientY: start.y }),
  );
  document.dispatchEvent(new MouseEvent("mouseup"));
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`![Chart|261](${PIXEL})`),
  );
  expect(
    screen.container.querySelectorAll("[data-slot=text-edit-image-guide]"),
  ).toHaveLength(0);
});

test("image: the toolbar has Replace and Alt text and no ⋯ menu; Alt text saves on Enter", async () => {
  const onValueChange = vi.fn();
  const md = `Before\n\n![Chart](${PIXEL})`;
  const screen = await markdownEditor({
    defaultValue: md,
    onValueChange,
    onImageUpload: async () => ({ src: PIXEL }),
  });
  expect(
    document.querySelector('[aria-label="More image actions"]'),
  ).toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Replace" }))
    .toBeInTheDocument();
  // Alt text: edited in place, saved on Enter.
  await screen.getByRole("button", { name: "Alt text" }).click();
  const field = await vi.waitFor(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="Describe the image for screen readers"]',
    );
    expect(input).not.toBeNull();
    return input!;
  });
  await userEvent.clear(field);
  await userEvent.type(field, "Sales chart{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`Before\n\n![Sales chart](${PIXEL})`),
  );
});

test("image: Backspace on the selected image removes it, and undo brings it back", async () => {
  const onValueChange = vi.fn();
  const md = `Before\n\n![Chart](${PIXEL})`;
  const screen = await markdownEditor({ defaultValue: md, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await userEvent.click(box.element().querySelector("img")!);
  await userEvent.keyboard("{Backspace}");
  await vi.waitFor(() => expect(lastValue(onValueChange)).toBe("Before"));
  await userEvent.keyboard("{ControlOrMeta>}z{/ControlOrMeta}");
  await vi.waitFor(() => expect(lastValue(onValueChange)).toBe(md));
});

test("image: Open shows it in the file viewer", async () => {
  const screen = await markdownEditor({
    defaultValue: `![Chart](${PIXEL})`,
  });
  await screen.getByRole("button", { name: "Open" }).click();
  await vi.waitFor(() =>
    expect(document.querySelector("[role=dialog]")?.textContent).toContain(
      "Chart",
    ),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector("[role=dialog]")).toBeNull(),
  );
});

test("image: a read-only document opens its images on a click", async () => {
  const view = await render(
    <TextEdit
      format="markdown"
      readOnly
      defaultValue="![Diagram|120](/diagram.png)"
      aria-label="Doc"
    />,
  );
  const image = view.getByRole("button", { name: "Open image: Diagram" });
  expect(image.element().getAttribute("width")).toBe("120");
  await image.click();
  await vi.waitFor(() =>
    expect(document.querySelector("[role=dialog]")?.textContent).toContain(
      "Diagram",
    ),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector("[role=dialog]")).toBeNull(),
  );
});

test("image: its corner radius is the same at rest, selected and while resizing", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await markdownEditor({
    defaultValue: `![Chart|200](${PIXEL})`,
  });
  const node = screen.container.querySelector<HTMLElement>(
    "[data-slot=text-edit-image-node]",
  )!;
  const image = node.querySelector("img")!;
  const wrapper = node.querySelector<HTMLElement>("[data-resize-wrapper]")!;
  const rest = getComputedStyle(image).borderRadius;
  expect(rest).not.toBe("0px");
  expect(getComputedStyle(wrapper).borderRadius).toBe(rest);
  await userEvent.click(image);
  await vi.waitFor(() =>
    expect(node.classList.contains("ProseMirror-selectednode")).toBe(true),
  );
  expect(getComputedStyle(image).borderRadius).toBe(rest);
  expect(getComputedStyle(node).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  const handle = node.querySelector<HTMLElement>("[data-resize-handle=right]")!;
  handle.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
  );
  expect(getComputedStyle(image).borderRadius).toBe(rest);
  document.dispatchEvent(new MouseEvent("mouseup"));
});

test("code wrap, open toggles and every callout tone round-trip through markdown", async () => {
  const source = [
    "```ts wrap\nconst a = 1;\n```",
    "```text wrap\nplain\n```",
    "<details open><summary>Open</summary>\n\nBody\n\n</details>",
    "> [!IMPORTANT]\n> Read this.",
    "> [!CAUTION]\n> Careful.",
  ].join("\n\n");
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange, defaultValue: source });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(box.querySelectorAll("pre[data-wrap]")).toHaveLength(2),
  );
  expect(
    box.querySelector('[data-slot="toggle"]')?.hasAttribute("data-open"),
  ).toBe(true);
  // The wrap icon turns wrapping off: the fence loses its flag.
  await userEvent.click(
    box.querySelector<HTMLElement>('[data-slot="code-block-wrap"]')!,
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      source.replace("```ts wrap", "```ts"),
    ),
  );
  // The chevron closes the toggle: `<details>` without `open`.
  await userEvent.click(
    box.querySelector<HTMLElement>('[data-slot="toggle-chevron"]')!,
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain(
      "<details><summary>Open</summary>",
    ),
  );
});

test("file chip: a double-click opens the file in the viewer", async () => {
  const screen = await markdownEditor({
    defaultValue: "See [data.csv](/api/files/abc/download)",
  });
  const chip = await vi.waitFor(() => {
    const found = screen.container.querySelector<HTMLElement>(
      ".tiptap a[data-slot=file-chip]",
    );
    expect(found).not.toBeNull();
    return found!;
  });
  await userEvent.dblClick(chip);
  await vi.waitFor(() =>
    expect(document.querySelector("[role=dialog]")?.textContent).toContain(
      "data.csv",
    ),
  );
});

test("images are blocks: an inline image is lifted out of its paragraph", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Before ![Chart](/api/files/f1) after",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(box.querySelector("p [data-slot=text-edit-image-node]")).toBeNull(),
  );
  expect(box.querySelectorAll("p")).toHaveLength(2);
  expect(box.querySelector("[data-slot=text-edit-image-node]")).not.toBeNull();
});

test("unsupported file paste preserves the selected document text", async () => {
  const onCommit = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Keep this text",
    onCommit,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await selectAllOf(box);
  pasteFiles(box, [png()]);
  expect(box.textContent).toBe("Keep this text");
  expect(window.getSelection()?.toString()).toBe("Keep this text");
  expect(onCommit).not.toHaveBeenCalled();
});

// ---- Regent new-task review (2026-10-07): bubble menu and block grip ------------------------

const bubble = () =>
  document.querySelector<HTMLElement>('[data-slot="text-edit-bubble-menu"]');

test("bubble menu: select all with no text shows no menu; with text it does", async () => {
  const screen = await markdownEditor();
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(bubble()).toBeNull();
  await userEvent.keyboard("{Enter}{Enter}");
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  // Empty lines are still no text.
  expect(bubble()).toBeNull();
  await userEvent.keyboard("Hello");
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  await vi.waitFor(() => expect(bubble()).not.toBeNull(), { timeout: 3000 });
});

test("bubble menu: follows its selection when an inner scroller scrolls, and hides once it leaves", async () => {
  const lines = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join(
    "\n\n",
  );
  const screen = await render(
    <div data-testid="scroller" style={{ height: 200, overflow: "auto" }}>
      <TextEdit format="markdown" aria-label="Notes" defaultValue={lines} />
    </div>,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  const first = box.querySelector("p")!;
  await userEvent.click(first);
  selectTail(first, 4);
  await vi.waitFor(() => expect(bubble()).not.toBeNull(), { timeout: 3000 });
  const menu = () => bubble()!.parentElement!;
  await vi.waitFor(() => expect(menu().style.visibility).toBe("visible"));
  const before = menu().getBoundingClientRect().top;
  const scroller = screen.getByTestId("scroller").element();
  scroller.scrollTop = 20;
  await vi.waitFor(() =>
    expect(menu().getBoundingClientRect().top).toBeCloseTo(before - 20, 0),
  );
  scroller.scrollTop = 600;
  await vi.waitFor(() => expect(menu().style.visibility).toBe("hidden"));
  scroller.scrollTop = 0;
  await vi.waitFor(() => expect(menu().style.visibility).toBe("visible"));
});

test("the block grip sits clear of the text inside a narrow frame", async () => {
  const screen = await render(
    <div data-slot="dialog-content" style={{ padding: 16, width: 480 }}>
      <TextEdit format="markdown" aria-label="Notes" defaultValue="One" />
    </div>,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  const frame = screen.container.querySelector<HTMLElement>(
    '[data-slot="dialog-content"]',
  )!;
  const paragraph = screen.container.querySelector(".ProseMirror p")!;
  await userEvent.hover(paragraph);
  const handle = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-block-handle"]');
  await vi.waitFor(() => expect(handle()).not.toBeNull());
  // The grip is `position: fixed` at its inline `left` (this lane loads no utility CSS, so read
  // the coordinates it was given rather than where it happens to render).
  const gripLeft = parseFloat(handle()!.style.left);
  const gripRight = gripLeft + parseFloat(handle()!.style.width);
  const text = paragraph.getBoundingClientRect();
  // A gap between the grip and the first character (the caret's spot)…
  expect(text.left - gripRight).toBeGreaterThanOrEqual(4);
  // The room comes from the content box's start padding, which the shell sets — the read view
  // the editor replaces carries the same box, so the swap never moves the text.
  expect(
    parseFloat(
      screen.container.querySelector<HTMLElement>(
        '[data-slot="text-edit-content"]',
      )!.style.paddingInlineStart,
    ),
  ).toBeGreaterThan(0);
  // …and the grip still inside the frame's edge.
  expect(gripLeft - frame.getBoundingClientRect().left).toBeGreaterThanOrEqual(
    6,
  );
});

// ---- Citations: the read view stands in whenever the document is not being edited ------------

const cite = (n: number) => ({ label: `Source ${n}` });
const readView = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.container.querySelector<HTMLElement>('[data-slot="text-edit-read"]');
const visibleEditor = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.container.querySelector<HTMLElement>(
    '[data-slot="text-edit-content"]:not([hidden]) .ProseMirror',
  );

test("citations: a loaded editor waits for a click; leaving commits, then the read view returns", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <>
      <TextEdit
        format="markdown"
        aria-label="Summary"
        defaultValue="Ship it [[1]]"
        citation={cite}
        onCommit={onCommit}
      />
      <button type="button">Outside</button>
    </>,
  );
  // Preloaded, the editor mounts hidden — the read view and its citation stay.
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(readView(screen)).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="markdown-citation"]'),
  ).not.toBeNull();
  expect(visibleEditor(screen)).toBeNull();

  // A click swaps the editor in with focus, and the markers read as raw text there.
  await userEvent.click(readView(screen)!.querySelector("p")!);
  await vi.waitFor(() => expect(visibleEditor(screen)).not.toBeNull());
  const editor = visibleEditor(screen)!;
  await vi.waitFor(() => expect(editor).toHaveFocus());
  expect(editor.textContent).toContain("[[1]]");

  await userEvent.keyboard(`${END} now`);
  await screen.getByRole("button", { name: "Outside" }).click();
  await vi.waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
  // The Markdown serializer escapes the brackets; the read view still reads them as a citation.
  expect(onCommit.mock.calls[0]?.[0]).toMatch(
    /^Ship it \\?\[\\?\[1\\?\]\\?\] now$/,
  );
  // The read view is back, showing the edit with its citation rendered.
  await vi.waitFor(() => expect(readView(screen)).not.toBeNull());
  expect(visibleEditor(screen)).toBeNull();
  expect(readView(screen)!.textContent).toContain("now");
  expect(
    screen.container.querySelector('[data-slot="markdown-citation"]'),
  ).not.toBeNull();
});

test("citations: focus moving into the editor's link panel keeps the editor", async () => {
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Summary"
      defaultValue="Text [[1]]"
      citation={cite}
    />,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  await userEvent.click(readView(screen)!.querySelector("p")!);
  await vi.waitFor(() => expect(visibleEditor(screen)).toHaveFocus());
  await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
  const panel = await vi.waitFor(() => {
    const node = document.querySelector<HTMLElement>(
      '[data-slot="text-edit-link"]',
    );
    expect(node).not.toBeNull();
    return node!;
  });
  await vi.waitFor(() =>
    expect(panel.contains(document.activeElement)).toBe(true),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(visibleEditor(screen)).not.toBeNull();
  expect(readView(screen)).toBeNull();
});

test("citations: an upload still in flight keeps the editor until it lands", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const onCommit = vi.fn();
  const screen = await render(
    <>
      <TextEdit
        format="markdown"
        aria-label="Summary"
        defaultValue="Before [[1]]"
        citation={cite}
        onImageUpload={onImageUpload}
        onCommit={onCommit}
      />
      <button type="button">Outside</button>
    </>,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  await userEvent.click(readView(screen)!.querySelector("p")!);
  await vi.waitFor(() => expect(visibleEditor(screen)).toHaveFocus());
  await userEvent.keyboard(END);
  pasteFiles(visibleEditor(screen)!, [png()]);
  await vi.waitFor(() =>
    expect(screen.container.querySelector("[data-uploading]")).not.toBeNull(),
  );
  await screen.getByRole("button", { name: "Outside" }).click();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(visibleEditor(screen)).not.toBeNull();

  land({ src: "/api/files/f1" });
  await vi.waitFor(() =>
    expect(onCommit.mock.lastCall?.[0]).toMatch(/!\[\]\(\/api\/files\/f1\)$/),
  );
  await vi.waitFor(() => expect(readView(screen)).not.toBeNull());
  expect(readView(screen)!.querySelector("img")?.getAttribute("src")).toBe(
    "/api/files/f1",
  );
});

/* --- B1: menus that take spaces and digits ---------------------------------------------------*/

test("slash menu: `/heading 2` and `/head2` both find Heading 2; a sentence past a space closes it (B1)", async () => {
  const screen = await markdownEditor();
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard("/heading 2");
  await vi.waitFor(() =>
    expect(slashMenu()?.textContent).toContain("Heading 2"),
  );
  expect(slashMenu()!.textContent).not.toContain("Heading 1");
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(box.element().querySelector("h2")).not.toBeNull(),
  );
  await userEvent.keyboard("{Enter}/head2");
  await vi.waitFor(() =>
    expect(slashMenu()?.textContent).toContain("Heading 2"),
  );
  await userEvent.keyboard("{Escape}");
  // and/or never opens a menu; a phrase that matches nothing closes at its next space.
  await userEvent.keyboard(" and/or");
  expect(slashMenu()).toBeNull();
  await userEvent.keyboard(" /nothing like this ");
  await vi.waitFor(() => expect(slashMenu()).toBeNull());
});

test("mentions: `@Asha Rao` searches the whole name; two spaces close the menu (B1)", async () => {
  const search = vi.fn(async (query: string): Promise<MentionOption[]> =>
    "asha rao".startsWith(query.toLowerCase())
      ? [{ kind: "user", id: "u1", label: "Asha Rao" }]
      : [],
  );
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: { kinds: mentionKinds("user"), search },
    onValueChange,
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("@Asha Ra");
  await vi.waitFor(() =>
    expect(search).toHaveBeenLastCalledWith("Asha Ra", {
      signal: expect.any(AbortSignal),
    }),
  );
  await vi.waitFor(() =>
    expect(mentionMenu()?.textContent).toContain("Asha Rao"),
  );
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("[@Asha Rao](mention://user/u1)"),
  );
  await userEvent.keyboard("@a  ");
  await vi.waitFor(() => expect(mentionMenu()).toBeNull());
});

test("mentions: placeholder rows until the first answer; a query asked before shows at once", async () => {
  let answer!: (options: MentionOption[]) => void;
  const search = vi.fn((query: string): Promise<MentionOption[]> =>
    query === ""
      ? new Promise((resolve) => {
          answer = resolve;
        })
      : Promise.resolve([{ kind: "family", id: "f1", label: "Linear" }]),
  );
  const screen = await markdownEditor({
    mentions: { kinds: mentionKinds("user", "family"), search },
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("@");
  await vi.waitFor(() =>
    expect(
      mentionMenu()?.querySelector('[data-slot="suggestion-menu-skeleton"]'),
    ).not.toBeNull(),
  );
  // No listbox until there are options: only the rows' shape.
  expect(mentionMenu()!.getAttribute("role")).toBeNull();
  answer(
    Array.from({ length: 10 }, (_, at) => ({
      kind: at < 5 ? ("user" as const) : ("family" as const),
      id: `id${at}`,
      label: `Option ${at}`,
    })),
  );
  await vi.waitFor(() =>
    expect(mentionMenu()?.getAttribute("role")).toBe("listbox"),
  );
  expect(
    [...mentionMenu()!.querySelectorAll('[role="group"]')].map(
      (group) => group.firstElementChild?.textContent,
    ),
  ).toEqual(["People", "Families"]);

  await userEvent.keyboard("lin");
  await vi.waitFor(() =>
    expect(mentionMenu()?.textContent).toContain("Linear"),
  );
  const asked = search.mock.calls.length;
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(mentionMenu()).toBeNull());
  await userEvent.keyboard(" @lin");
  // Shown from this editor's answers before any search could answer.
  await vi.waitFor(() =>
    expect(mentionMenu()?.textContent).toContain("Linear"),
  );
  expect(search.mock.calls.slice(asked).map(([query]) => query)).not.toContain(
    "lin",
  );
});

test("mentions: groups follow the kinds' order under their plural; an option's own group (Recent) comes first", async () => {
  const search = vi.fn(async (): Promise<MentionOption[]> => [
    { kind: "page", id: "p1", label: "Q3 plan" },
    { kind: "user", id: "u1", label: "Asha Rao" },
    { kind: "subfamily", id: "s1", label: "Linear 2", group: "Recent" },
    { kind: "family", id: "f1", label: "Linear" },
    { kind: "page", id: "p2", label: "Spec", group: "Recent" },
    // A kind the menu does not offer is not shown, in its group or another.
    { kind: "meeting", id: "m1", label: "Kick-off", group: "Recent" },
  ]);
  const screen = await markdownEditor({
    mentions: {
      kinds: [
        { id: "user", noun: "Person", plural: "People", order: 0 },
        { id: "family", noun: "Family", plural: "Families", order: 2 },
        { id: "page", noun: "Page", plural: "Pages", order: 1 },
        {
          id: "subfamily",
          noun: "Sub-family",
          plural: "Sub-families",
          order: 2,
        },
      ],
      search,
    },
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("@");
  await vi.waitFor(() =>
    expect(mentionMenu()?.getAttribute("role")).toBe("listbox"),
  );
  const groups = [...mentionMenu()!.querySelectorAll('[role="group"]')];
  expect(groups.map((group) => group.firstElementChild?.textContent)).toEqual([
    "Recent",
    "People",
    "Pages",
    "Families",
  ]);
  expect(groups[0]!.textContent).toContain("Linear 2");
  expect(groups[0]!.textContent).toContain("Spec");
  expect(mentionMenu()!.textContent).not.toContain("Kick-off");
  // A host kind without its own icon shows the link glyph.
  expect(
    groups[0]!
      .querySelector('[data-slot="text-edit-mention-icon"] svg')
      ?.getAttribute("class"),
  ).toContain("lucide-link-2");
  await expectNoA11yViolations(mentionMenu()!);
});

test("mentions: a remembered empty answer for a phrase past a space closes the menu again, pasted or typed", async () => {
  const search = vi.fn(async (_query: string): Promise<MentionOption[]> => []);
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: { kinds: mentionKinds("user"), search },
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard("@nobody ");
  await vi.waitFor(() =>
    expect(search).toHaveBeenLastCalledWith("nobody ", {
      signal: expect.any(AbortSignal),
    }),
  );
  await vi.waitFor(() => expect(mentionMenu()).toBeNull());
  const asked = search.mock.calls.length;
  // The same phrase again, all at once: answered from memory, and the menu closes cleanly.
  pasteData(box.element(), { "text/plain": "@nobody " });
  await vi.waitFor(() => expect(mentionMenu()).toBeNull());
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(mentionMenu()).toBeNull();
  expect(search.mock.calls.slice(asked).map(([query]) => query)).not.toContain(
    undefined,
  );
  await userEvent.keyboard("{Enter}x");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(/^@nobody @nobody\s*\n\nx$/),
  );
});

/* --- uploads pending (A7) ---------------------------------------------------------------------*/

test("pendingUploads counts uploads still landing, and onPendingUploadsChange reports each change (A7)", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const onPendingUploadsChange = vi.fn();
  const handleRef = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    onImageUpload,
    onPendingUploadsChange,
    handleRef,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteFiles(box.element(), [png()]);
  await vi.waitFor(() =>
    expect(onPendingUploadsChange).toHaveBeenLastCalledWith(1),
  );
  expect(handleRef.current!.pendingUploads()).toBe(1);
  land({ src: "/files/shot.png" });
  await vi.waitFor(() =>
    expect(onPendingUploadsChange).toHaveBeenLastCalledWith(0),
  );
  expect(handleRef.current!.pendingUploads()).toBe(0);
});

/* --- linked task items and section marks (release C) -------------------------------------------*/

test("linkedTaskId: a task item whose first inline is a task mention, else null", () => {
  const list = markdownToDoc(
    [
      "- [x] [@Order glass](mention://task/t1) — by Friday",
      "- [ ] Order hinges",
      "- [ ] Ask [@Order glass](mention://task/t2)",
      "- [ ] [@Q3 plan](mention://page/p1)",
    ].join("\n"),
  ).firstChild!;
  expect(list.type.name).toBe("taskList");
  expect(linkedTaskId(list.child(0))).toBe("t1");
  expect(linkedTaskId(list.child(1))).toBeNull();
  // Only the FIRST inline links the line; a page mention never does.
  expect(linkedTaskId(list.child(2))).toBeNull();
  expect(linkedTaskId(list.child(3))).toBeNull();
  // Anything but a task item is never linked, even when it starts with a task mention.
  const paragraph = markdownToDoc(
    "[@Order glass](mention://task/t1)",
  ).firstChild!;
  expect(linkedTaskId(paragraph)).toBeNull();
  expect(linkedTaskId(null)).toBeNull();
});

test("onTaskItemToggle: a person's tick on a linked line reaches the host; setTaskItemChecked never echoes", async () => {
  const onTaskItemToggle = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue: "- [ ] [@Order glass](mention://task/t1)\n- [ ] Plain line",
    onTaskItemToggle,
    handleRef: handle,
  });
  const boxes = () =>
    screen.container.querySelectorAll<HTMLElement>(
      '.ProseMirror [data-slot="checkbox"]',
    );
  boxes()[0]!.click();
  await vi.waitFor(() =>
    expect(onTaskItemToggle).toHaveBeenCalledWith("t1", true),
  );
  // An unlinked line is the document's own business.
  boxes()[1]!.click();
  await vi.waitFor(() =>
    expect(boxes()[1]).toHaveAttribute("aria-checked", "true"),
  );
  expect(onTaskItemToggle).toHaveBeenCalledTimes(1);
  // The task changed elsewhere: the host sets the box, and is not told about its own change.
  expect(handle.current!.setTaskItemChecked("t1", false)).toBe(1);
  await vi.waitFor(() =>
    expect(boxes()[0]).toHaveAttribute("aria-checked", "false"),
  );
  expect(handle.current!.setTaskItemChecked("t1", false)).toBe(0);
  expect(onTaskItemToggle).toHaveBeenCalledTimes(1);
});

test("onTaskItemToggle: a collaborator's tick is never reported to this viewer", async () => {
  const toggledA = vi.fn();
  const toggledB = vi.fn();
  const { screen } = await twoEditors(
    "- [ ] [@Order glass](mention://task/t1)",
    { a: { onTaskItemToggle: toggledA }, b: { onTaskItemToggle: toggledB } },
  );
  const box = (name: string) =>
    screen
      .getByRole("textbox", { name })
      .element()
      .querySelector<HTMLElement>('[data-slot="checkbox"]');
  await vi.waitFor(() => expect(box("B")).not.toBeNull());
  box("B")!.click();
  await vi.waitFor(() =>
    expect(box("A")).toHaveAttribute("aria-checked", "true"),
  );
  expect(toggledB).toHaveBeenCalledExactlyOnceWith("t1", true);
  expect(toggledA).not.toHaveBeenCalled();
});

test("Make N tasks: the block menu offers the selected unlinked lines; linkTaskItems writes linked lines", async () => {
  const onMakeTask = vi.fn();
  const onTaskItemToggle = vi.fn();
  const onValueChange = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue: "- [ ] Order glass — by Friday\n- [x] Fix scaffolding",
    onMakeTask,
    onTaskItemToggle,
    onValueChange,
    handleRef: handle,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  const lines = box.element().querySelectorAll("li p");
  await userEvent.click(lines[0]!);
  // From inside the first line's text into the second's.
  editorOf(box.element()).commands.setTextSelection({ from: 3, to: 31 });
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await screen.getByRole("menuitem", { name: "Make 2 tasks" }).click();
  await vi.waitFor(() => expect(onMakeTask).toHaveBeenCalledTimes(1));
  const items = onMakeTask.mock.calls[0]![0] as { key: string; text: string }[];
  expect(items.map((item) => item.text)).toEqual([
    "Order glass — by Friday",
    "Fix scaffolding",
  ]);
  // The host created T-1 ("Order glass") and T-2: the title becomes the chip, the rest stays.
  expect(
    handle.current!.linkTaskItems([
      { key: items[0]!.key, id: "t1", label: "Order glass" },
      { key: items[1]!.key, id: "t2", label: "Fix scaffolding" },
    ]),
  ).toBe(2);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [ ] [@Order glass](mention://task/t1) — by Friday\n- [x] [@Fix scaffolding](mention://task/t2)",
    ),
  );
  // The written Markdown reads back as linked lines.
  const list = markdownToDoc(lastValue(onValueChange)!).firstChild!;
  expect([linkedTaskId(list.child(0)), linkedTaskId(list.child(1))]).toEqual([
    "t1",
    "t2",
  ]);
  expect(onTaskItemToggle).not.toHaveBeenCalled();
  // A linked line no longer offers Make task, and linking it again does nothing.
  await userEvent.click(lines[0]!);
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await expect
    .element(screen.getByRole("menuitem", { name: /Duplicate/ }))
    .toBeInTheDocument();
  expect(
    [...document.querySelectorAll('[role="menuitem"]')].some((item) =>
      /Make/.test(item.textContent ?? ""),
    ),
  ).toBe(false);
  expect(
    handle.current!.linkTaskItems([
      { key: items[0]!.key, id: "t9", label: "Order glass" },
    ]),
  ).toBe(0);
});

/** Make task on the `index`th checklist line through the block menu: the line it offered. */
async function makeTaskOn(
  screen: Awaited<ReturnType<typeof markdownEditor>>,
  onMakeTask: ReturnType<typeof vi.fn>,
  index: number,
) {
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  onMakeTask.mockClear();
  await userEvent.click(box.querySelectorAll("li p")[index]!);
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await screen.getByRole("menuitem", { name: "Make task" }).click();
  await vi.waitFor(() => expect(onMakeTask).toHaveBeenCalledTimes(1));
  return (onMakeTask.mock.lastCall![0] as { key: string; text: string }[])[0]!;
}

/** The position of the `index`th checklist line (its task item) in `editor`'s document. */
function itemPos(editor: Editor, index: number) {
  const line = editor.view.dom.querySelectorAll("li p")[index]!;
  return editor.view.posAtDOM(line, 0) - 2;
}

test("linkTaskItems follows the offered line through edits made meanwhile, and never links a changed one", async () => {
  const onMakeTask = vi.fn();
  const onValueChange = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue: "- [ ] Order glass — by Friday\n- [ ] Fix scaffolding",
    onMakeTask,
    onValueChange,
    handleRef: handle,
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  const offered = await makeTaskOn(screen, onMakeTask, 0);
  // While the host's dialog is open, a new unlinked line lands where the offered one was.
  editor.commands.insertContentAt(itemPos(editor, 0), {
    type: "taskItem",
    attrs: { checked: false },
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Call Bob" }] },
    ],
  });
  expect(
    handle.current!.linkTaskItems([
      { key: offered.key, id: "t1", label: "Order glass" },
    ]),
  ).toBe(1);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [ ] Call Bob\n- [ ] [@Order glass](mention://task/t1) — by Friday\n- [ ] Fix scaffolding",
    ),
  );
  // A line edited after it was offered is left as it is.
  const second = await makeTaskOn(screen, onMakeTask, 2);
  expect(second.text).toBe("Fix scaffolding");
  editor.commands.insertContentAt(itemPos(editor, 2) + 2, "Not ");
  expect(
    handle.current!.linkTaskItems([
      { key: second.key, id: "t2", label: "Fix scaffolding" },
    ]),
  ).toBe(0);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain("- [ ] Not Fix scaffolding"),
  );
  expect(lastValue(onValueChange)).not.toContain("t2");
});

test("linkTaskItems never drops a mention on the line or the text after it", async () => {
  const onMakeTask = vi.fn();
  const onValueChange = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue:
      "- [ ] Ask [@Asha Rao](mention://user/u1) — Friday\n- [ ] Ship [@Q3 plan](mention://page/p1) soon",
    onMakeTask,
    onValueChange,
    handleRef: handle,
  });
  // The title runs into a mention: the whole line stays after the chip.
  const ask = await makeTaskOn(screen, onMakeTask, 0);
  expect(
    handle.current!.linkTaskItems([
      { key: ask.key, id: "t1", label: "Ask Asha Rao" },
    ]),
  ).toBe(1);
  // A plain-text title before a mention: only the title goes.
  const ship = await makeTaskOn(screen, onMakeTask, 1);
  expect(
    handle.current!.linkTaskItems([{ key: ship.key, id: "t2", label: "Ship" }]),
  ).toBe(1);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [ ] [@Ask Asha Rao](mention://task/t1) Ask [@Asha Rao](mention://user/u1) — Friday\n- [ ] [@Ship](mention://task/t2) [@Q3 plan](mention://page/p1) soon",
    ),
  );
});

test("onTaskItemToggle: typing inside nested lines of one task whose boxes differ is not a toggle", async () => {
  const onTaskItemToggle = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue:
      "- [ ] [@Order glass](mention://task/t1)\n  - [x] [@Order glass](mention://task/t1) again",
    onTaskItemToggle,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() =>
    expect(box.querySelectorAll("li li p")).toHaveLength(1),
  );
  await userEvent.click(box.querySelector("li li p")!);
  await userEvent.keyboard("{End}!");
  await vi.waitFor(() => expect(lastValue(onValueChange)).toContain("again!"));
  expect(onTaskItemToggle).not.toHaveBeenCalled();
  // The outer line's own tick still is one.
  box.querySelector<HTMLElement>('[data-slot="checkbox"]')!.click();
  await vi.waitFor(() =>
    expect(onTaskItemToggle).toHaveBeenCalledExactlyOnceWith("t1", true),
  );
});

test("linkTaskItems: an offered line deleted meanwhile is skipped, never a line with the same text", async () => {
  const onMakeTask = vi.fn();
  const onValueChange = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue: "- [ ] Order glass\n- [ ] Order glass",
    onMakeTask,
    onValueChange,
    handleRef: handle,
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  const first = await makeTaskOn(screen, onMakeTask, 0);
  const at = itemPos(editor, 0);
  editor.commands.deleteRange({
    from: at,
    to: at + editor.state.doc.nodeAt(at)!.nodeSize,
  });
  await vi.waitFor(() =>
    expect(editor.view.dom.querySelectorAll("li p")).toHaveLength(1),
  );
  expect(
    handle.current!.linkTaskItems([
      { key: first.key, id: "t1", label: "Order glass" },
    ]),
  ).toBe(0);
  expect(editor.view.dom.querySelector('[data-slot="inline-chip"]')).toBeNull();
});

test("linkTaskItems: two offers never take each other's task, whatever moved between them", async () => {
  const onMakeTask = vi.fn();
  const onValueChange = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue: "- [ ] Order glass",
    onMakeTask,
    onValueChange,
    handleRef: handle,
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  const glass = await makeTaskOn(screen, onMakeTask, 0);
  // A new line lands where the offered one was, and is offered too.
  editor.commands.insertContentAt(itemPos(editor, 0), {
    type: "taskItem",
    attrs: { checked: false },
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Call Bob" }] },
    ],
  });
  const bob = await makeTaskOn(screen, onMakeTask, 0);
  expect(bob.text).toBe("Call Bob");
  expect(bob.key).not.toBe(glass.key);
  expect(
    handle.current!.linkTaskItems([
      { key: glass.key, id: "t1", label: "Order glass" },
    ]),
  ).toBe(1);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [ ] Call Bob\n- [ ] [@Order glass](mention://task/t1)",
    ),
  );
  expect(
    handle.current!.linkTaskItems([
      { key: bob.key, id: "t2", label: "Call Bob" },
    ]),
  ).toBe(1);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [ ] [@Call Bob](mention://task/t2)\n- [ ] [@Order glass](mention://task/t1)",
    ),
  );
});

test("onTaskItemToggle: a checked line of the same task pasted over an unchecked one is not a toggle", async () => {
  const onTaskItemToggle = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue:
      "- [ ] [@Order glass](mention://task/t1)\n- [x] [@Order glass](mention://task/t1) copy",
    onTaskItemToggle,
    onValueChange,
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  await vi.waitFor(() =>
    expect(editor.view.dom.querySelectorAll("li p")).toHaveLength(2),
  );
  editor.commands.setNodeSelection(itemPos(editor, 1));
  const { dom } = editor.view.serializeForClipboard(
    editor.state.selection.content(),
  );
  editor.commands.setNodeSelection(itemPos(editor, 0));
  editor.view.pasteHTML(dom.innerHTML);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).not.toContain("- [ ]"),
  );
  expect(onTaskItemToggle).not.toHaveBeenCalled();
});

/** The clipboard HTML of the `index`th checklist line, as copying it writes it. */
function copyLine(editor: Editor, index: number) {
  editor.commands.setNodeSelection(itemPos(editor, index));
  return editor.view.serializeForClipboard(editor.state.selection.content()).dom
    .innerHTML;
}

test("onTaskItemToggle: a copy of the line pasted back over it after a tick is a new line, not a toggle", async () => {
  const onTaskItemToggle = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "- [x] [@Order glass](mention://task/t1)",
    onTaskItemToggle,
    onValueChange,
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  await vi.waitFor(() =>
    expect(editor.view.dom.querySelectorAll("li p")).toHaveLength(1),
  );
  // The line has an id, as one linked through Make task does.
  editor.view.dispatch(
    editor.state.tr.setNodeAttribute(itemPos(editor, 0), "blockId", "line1"),
  );
  const copy = copyLine(editor, 0);
  expect(copy).toContain('data-blockid="line1"');
  editor.view.dom.querySelector<HTMLElement>('[data-slot="checkbox"]')!.click();
  await vi.waitFor(() =>
    expect(onTaskItemToggle).toHaveBeenCalledExactlyOnceWith("t1", false),
  );
  editor.commands.setNodeSelection(itemPos(editor, 0));
  editor.view.pasteHTML(copy);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [x] [@Order glass](mention://task/t1)",
    ),
  );
  expect(onTaskItemToggle).toHaveBeenCalledTimes(1);
});

test("linkTaskItems: a pasted copy of an offered line is never linked through the offer", async () => {
  const onMakeTask = vi.fn();
  const onValueChange = vi.fn();
  const handle = React.createRef<TextEditHandle>();
  const screen = await markdownEditor({
    defaultValue: "- [ ] Order glass\n- [ ] Fix scaffolding",
    onMakeTask,
    onValueChange,
    handleRef: handle,
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  const offered = await makeTaskOn(screen, onMakeTask, 0);
  const copy = copyLine(editor, 0);
  const at = itemPos(editor, 0);
  editor.commands.deleteRange({
    from: at,
    to: at + editor.state.doc.nodeAt(at)!.nodeSize,
  });
  editor.commands.setNodeSelection(itemPos(editor, 0));
  editor.view.pasteHTML(copy);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("- [ ] Order glass"),
  );
  expect(
    handle.current!.linkTaskItems([
      { key: offered.key, id: "t1", label: "Order glass" },
    ]),
  ).toBe(0);
  expect(editor.view.dom.querySelector('[data-slot="inline-chip"]')).toBeNull();
});

test("Make task is absent without onMakeTask", async () => {
  const screen = await markdownEditor({ defaultValue: "- [ ] Order glass" });
  await userEvent.click(
    screen
      .getByRole("textbox", { name: "Notes" })
      .element()
      .querySelector("p")!,
  );
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await expect
    .element(screen.getByRole("menuitem", { name: /Duplicate/ }))
    .toBeInTheDocument();
  expect(
    [...document.querySelectorAll('[role="menuitem"]')].some((item) =>
      /Make/.test(item.textContent ?? ""),
    ),
  ).toBe(false);
});

test("mentionStatus strikes a closed task's chip and tags its status; product chips use the Package kind", async () => {
  const screen = await markdownEditor({
    defaultValue:
      "- [x] [@Old supplier](mention://task/t1)\n\n[@Glazing kit](mention://product/v1)",
    mentionStatus: (kind, id) =>
      kind === "task" && id === "t1"
        ? { struck: true, status: "Canceled" }
        : null,
  });
  const chips = () =>
    screen.container.querySelectorAll<HTMLElement>(
      '.ProseMirror [data-slot="inline-chip"]',
    );
  await vi.waitFor(() => expect(chips()).toHaveLength(2));
  expect(chips()[0]).toHaveAttribute("data-struck", "");
  expect(
    chips()[0]!.querySelector('[data-slot="inline-chip-struck"]')?.textContent,
  ).toBe("Old supplier");
  expect(
    chips()[0]!.querySelector('[data-slot="inline-chip-status"]')?.textContent,
  ).toBe("Canceled");
  expect(chips()[1]).toHaveAttribute("data-kind", "product");
  expect(chips()[1]).not.toHaveAttribute("data-struck");
});

test("sectionMarks: the marked heading's section to the next # to ### heading of any level wears the bar; the marker calls onSectionMark", async () => {
  const onSectionMark = vi.fn();
  const onValueChange = vi.fn();
  const marks = [
    { key: "s1", tone: "warning" as const, label: "May be out of date" },
  ];
  const html =
    '<p>Intro</p><h2 data-blockid="s1">Pricing</h2><p>Glass</p><h4>Note</h4><p>Ink</p><h3>Detail</h3><p>Frames</p><h2 data-blockid="s2">Scope</h2><p>Later</p>';
  const screen = await render(
    <TextEdit
      aria-label="Doc"
      defaultValue={html}
      sectionMarks={marks}
      onSectionMark={onSectionMark}
      onValueChange={onValueChange}
    />,
  );
  const box = () =>
    screen.getByRole("textbox", { name: "Doc" }).element() as HTMLElement;
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  const marked = () =>
    [...box().querySelectorAll<HTMLElement>(":scope > *")]
      .filter((block) => block.hasAttribute("data-section-mark"))
      .map((block) => block.textContent);
  // Flat sections: a #### is a block of its section; the ### under it starts the next one.
  await vi.waitFor(() =>
    expect(marked()).toEqual(["Pricing", "Glass", "Note", "Ink"]),
  );
  const marker = box().querySelector<HTMLElement>(
    '[data-slot="text-edit-section-mark"]',
  )!;
  expect(marker).toHaveAttribute("aria-label", "May be out of date");
  expect(marker.closest("h2")?.textContent).toBe("Pricing");
  // A decoration: the heading's text starts where an unmarked heading's does.
  const pricing = box().querySelector("h2")!;
  const scope = box().querySelectorAll("h2")[1]!;
  expect(
    pricing.getBoundingClientRect().left - scope.getBoundingClientRect().left,
  ).toBe(0);
  await userEvent.click(marker);
  expect(onSectionMark).toHaveBeenCalledExactlyOnceWith("s1");
  // A new block typed inside the section joins it; nothing reaches the document.
  // The end of "Ink", the section's last block.
  const ink = box().querySelectorAll("p")[2]!;
  await userEvent.click(ink);
  await userEvent.keyboard("{End}");
  await userEvent.keyboard("{Enter}More");
  await vi.waitFor(() =>
    expect(marked()).toEqual(["Pricing", "Glass", "Note", "Ink", "More"]),
  );
  expect(lastValue(onValueChange)).not.toContain("section");
  // No marks: no decorations.
  await screen.rerender(
    <TextEdit
      aria-label="Doc"
      defaultValue={html}
      sectionMarks={[]}
      onSectionMark={onSectionMark}
      onValueChange={onValueChange}
    />,
  );
  await vi.waitFor(() => expect(marked()).toEqual([]));
  expect(
    box().querySelector('[data-slot="text-edit-section-mark"]'),
  ).toBeNull();
});

test("headingLinkHref: the hovered heading's # sits in the gutter before its text, the grip beyond it; a press copies the absolute link", async () => {
  const writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
  onTestFinished(() => writeText.mockRestore());
  const screen = await render(
    <TextEdit
      aria-label="Doc"
      defaultValue="<h2>Pricing</h2><p>Text</p>"
      headingLinkHref={(anchor) => `#${anchor.slug}`}
    />,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror h2")).not.toBeNull(),
  );
  const heading =
    screen.container.querySelector<HTMLElement>(".ProseMirror h2")!;
  // Move onto the paragraph first: a pointer already resting where the heading lands sends no
  // move of its own.
  await userEvent.hover(
    screen.container.querySelector<HTMLElement>(".ProseMirror p")!,
  );
  await userEvent.hover(heading);
  const link = screen.getByRole("button", { name: "Copy link to “Pricing”" });
  await expect.element(link).toBeVisible();
  // The harness compiles no Tailwind: read the placement the editor writes (a 24px box, 2px clear).
  const text = heading.getBoundingClientRect();
  const left = Number.parseFloat((link.element() as HTMLElement).style.left);
  expect(left).toBe(text.left - 26);
  const grip = document.querySelector<HTMLElement>(
    '[data-slot="text-edit-block-handle"]',
  );
  if (grip)
    expect(
      Number.parseFloat(grip.style.left) + Number.parseFloat(grip.style.width),
    ).toBeLessThanOrEqual(left);
  await link.click();
  expect(writeText).toHaveBeenCalledWith(
    new URL("#pricing", window.location.href).href,
  );
});

test("headingLinkHref: the # follows its heading when the page moves above it, and hides while the page scrolls", async () => {
  function Page({ banner }: { banner: boolean }) {
    return (
      <div>
        {banner ? <div style={{ height: 120 }}>Banner</div> : null}
        <TextEdit
          aria-label="Doc"
          defaultValue="<p>Date: today</p><h2>Pricing</h2><p>Text</p>"
          headingLinkHref={(anchor) => `#${anchor.slug}`}
        />
      </div>
    );
  }
  const screen = await render(<Page banner={false} />);
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror h2")).not.toBeNull(),
  );
  const heading = () =>
    screen.container.querySelector<HTMLElement>(".ProseMirror h2")!;
  await userEvent.hover(
    screen.container.querySelector<HTMLElement>(".ProseMirror p")!,
  );
  await userEvent.hover(heading());
  const link = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-heading-link"]');
  await vi.waitFor(() => expect(link()).not.toBeNull());
  const middle = () => {
    const box = heading().getBoundingClientRect();
    return box.top + box.height / 2;
  };
  const linkMiddle = () => {
    const box = link()!.getBoundingClientRect();
    return box.top + box.height / 2;
  };
  // The link sits on the heading's first line (the harness compiles no Tailwind, so the offset
  // from the box's middle is whatever the line box makes it).
  const offset = linkMiddle() - middle();
  expect(Math.abs(offset)).toBeLessThan(12);
  const before = heading().getBoundingClientRect().top;
  // Content arrives above the editor: no scroll, no edit — the link still moves with its heading
  // rather than staying beside the paragraph that now sits where the heading was.
  await screen.rerender(<Page banner />);
  expect(heading().getBoundingClientRect().top - before).toBe(120);
  await vi.waitFor(() =>
    expect(Math.abs(linkMiddle() - middle() - offset)).toBeLessThanOrEqual(1),
  );
  // A scroll hides it until the page settles.
  window.dispatchEvent(new Event("scroll"));
  await vi.waitFor(() => expect(link()).toBeNull());
});

test("headingLinkHref: the caret's heading keeps its # through scrolls and edits — hidden while scrolling, renamed as it changes", async () => {
  const screen = await render(
    <TextEdit
      aria-label="Doc"
      defaultValue="<h2>Pricing</h2><p>Text</p>"
      headingLinkHref={(anchor) => `#${anchor.slug}`}
    />,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror h2")).not.toBeNull(),
  );
  const link = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-heading-link"]');
  // The caret in the heading shows its link (no pointer involved).
  await userEvent.click(
    screen.container.querySelector<HTMLElement>(".ProseMirror h2")!,
  );
  await vi.waitFor(() => expect(link()).not.toBeNull());
  // Scrolling hides it, each scroll restarting the wait; it comes back once the page settles.
  window.dispatchEvent(new Event("scroll"));
  await vi.waitFor(() => expect(link()).toBeNull());
  await new Promise((resolve) => setTimeout(resolve, 100));
  window.dispatchEvent(new Event("scroll"));
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(link()).toBeNull();
  await vi.waitFor(() => expect(link()).not.toBeNull());
  // Typing in the heading renames the link's label at once.
  await userEvent.keyboard("{End} plan");
  await vi.waitFor(() =>
    expect(link()!.getAttribute("aria-label")).toBe(
      "Copy link to “Pricing plan”",
    ),
  );
});

test("a modal over the editor hides its floating layer; an editor inside the modal keeps its own live, in the modal's portal", async () => {
  function Page({ open }: { open: boolean }) {
    return (
      <>
        <TextEdit aria-label="Behind" defaultValue="<p>One</p>" />
        <Dialog open={open}>
          <DialogContent>
            <DialogTitle>Note</DialogTitle>
            <TextEdit aria-label="Inside" defaultValue="<p>Two</p>" />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  const screen = await render(<Page open={false} />);
  // The editor behind the modal portals its layer to <body>; the one inside, into the modal's
  // portal.
  const layerOf = (name: "Behind" | "Inside") =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-slot="text-edit-layer"]',
      ),
    ].find(
      (layer) =>
        (layer.closest("[data-base-ui-portal]") !== null) ===
        (name === "Inside"),
    );
  await vi.waitFor(() => expect(layerOf("Behind")).toBeDefined());
  expect(layerOf("Behind")!.hidden).toBe(false);
  await screen.rerender(<Page open />);
  await vi.waitFor(() => expect(layerOf("Inside")).toBeDefined());
  // The editor behind the modal: its layer hides.
  await vi.waitFor(() => expect(layerOf("Behind")!.hidden).toBe(true));
  // The editor in the modal: its layer sits in the modal's portal, shown and never inert.
  const inside = layerOf("Inside")!;
  expect(inside.hidden).toBe(false);
  expect(inside.closest("[inert]")).toBeNull();
  expect(inside.closest('[aria-hidden="true"]')).toBeNull();
  await screen.rerender(<Page open={false} />);
  await vi.waitFor(() => expect(layerOf("Behind")!.hidden).toBe(false));
});

test("sectionMarks: a block turned into another kind keeps its section's bar", async () => {
  const screen = await render(
    <TextEdit
      aria-label="Doc"
      defaultValue='<h2 data-blockid="s1">Pricing</h2><p>Glass</p><p>Frames</p>'
      sectionMarks={[{ key: "s1", tone: "info", label: "Changed" }]}
    />,
  );
  const box = () =>
    screen.getByRole("textbox", { name: "Doc" }).element() as HTMLElement;
  const marked = () =>
    [...box().querySelectorAll<HTMLElement>(":scope > *")]
      .filter((block) => block.hasAttribute("data-section-mark"))
      .map((block) => block.tagName);
  await vi.waitFor(() => expect(marked()).toEqual(["H2", "P", "P"]));
  const editor = editorOf(box()) as unknown as Editor;
  // Inside "Glass": the same number of top-level blocks, one of them a new node.
  editor.chain().setTextSelection(11).setCodeBlock().run();
  await vi.waitFor(() => expect(marked()).toEqual(["H2", "DIV", "P"]));
});

/* --- collaboration ----------------------------------------------------------------------------*/

/** Two Yjs documents kept in sync in memory, as a server would, each with its own awareness. */
function sharedDocument(markdown = "") {
  const a = new Y.Doc();
  const b = new Y.Doc();
  // Updates relay at once, or — while `hold` is on — wait for `flush`, as on a slow network.
  let hold = false;
  const queued: [Y.Doc, Uint8Array][] = [];
  const send = (to: Y.Doc, update: Uint8Array) => {
    if (hold) queued.push([to, update]);
    else Y.applyUpdate(to, update, "peer");
  };
  a.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "peer") send(b, update);
  });
  b.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "peer") send(a, update);
  });
  const network = {
    hold: (on: boolean) => {
      hold = on;
    },
    flush: () => {
      for (const [to, update] of queued.splice(0))
        Y.applyUpdate(to, update, "peer");
    },
  };
  if (markdown)
    prosemirrorToYXmlFragment(
      markdownToDoc(markdown),
      a.getXmlFragment("default"),
    );
  // Each side's awareness (carets, names) relayed to the other, as a server relays it.
  const awareness = { a: new Awareness(a), b: new Awareness(b) };
  const relay = (from: Awareness, to: Awareness) =>
    from.on(
      "update",
      (
        {
          added,
          updated,
          removed,
        }: Record<"added" | "updated" | "removed", number[]>,
        origin: unknown,
      ) => {
        if (origin === "peer") return;
        const changed = [...added, ...updated, ...removed];
        applyAwarenessUpdate(to, encodeAwarenessUpdate(from, changed), "peer");
      },
    );
  relay(awareness.a, awareness.b);
  relay(awareness.b, awareness.a);
  onTestFinished(() => {
    awareness.a.destroy();
    awareness.b.destroy();
  });
  const asha = { id: "u1", name: "Asha Rao", hue: "green" as const };
  const ben = { id: "u2", name: "Ben Ito", hue: "orange" as const };
  return {
    a,
    b,
    network,
    awareness,
    collaboration: (side: "a" | "b") => ({
      document: side === "a" ? a : b,
      provider: {
        awareness: awareness[side],
        on: () => undefined,
        off: () => undefined,
      },
      user: side === "a" ? asha : ben,
      // The server's word on who each connection is (by awareness client id).
      peer: (clientId: number) =>
        clientId === a.clientID ? asha : clientId === b.clientID ? ben : null,
    }),
  };
}

/** An editor's text without collaborators' caret labels (they sit in the editor's DOM). */
function visibleText(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const caret of copy.querySelectorAll('[data-slot="text-edit-caret"]'))
    caret.remove();
  return copy.textContent ?? "";
}

/** The shared document's text, read from Yjs. */
const sharedText = (doc: Y.Doc) =>
  yXmlFragmentToProseMirrorRootNode(
    doc.getXmlFragment("default"),
    textEditSchema(),
  ).textContent;

async function twoEditors(
  markdown: string,
  props: {
    a?: Partial<React.ComponentProps<typeof TextEdit>>;
    b?: Partial<React.ComponentProps<typeof TextEdit>>;
  } = {},
) {
  const shared = sharedDocument(markdown);
  const screen = await render(
    <>
      <TextEdit
        format="markdown"
        aria-label="A"
        collaboration={shared.collaboration("a")}
        {...props.a}
      />
      <TextEdit
        format="markdown"
        aria-label="B"
        collaboration={shared.collaboration("b")}
        {...props.b}
      />
      <button type="button">Outside</button>
    </>,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelectorAll(".ProseMirror")).toHaveLength(2),
  );
  return { screen, shared };
}

test("collaboration: two editors share one document live; ⌘Z undoes only this viewer's own typing", async () => {
  const { screen, shared } = await twoEditors("Hello");
  const a = screen.getByRole("textbox", { name: "A" });
  const b = screen.getByRole("textbox", { name: "B" });
  await vi.waitFor(() => expect(visibleText(b.element())).toBe("Hello"));
  await a.click();
  await userEvent.keyboard(`${END} from A`);
  await vi.waitFor(() => expect(visibleText(b.element())).toBe("Hello from A"));
  await b.click();
  await userEvent.keyboard(`${END} and B`);
  await vi.waitFor(() =>
    expect(visibleText(a.element())).toBe("Hello from A and B"),
  );
  // A collaborator's caret shows in their hue, named — never a colour string.
  await vi.waitFor(() =>
    expect(
      a.element().querySelector('[data-slot="text-edit-caret"]')?.className,
    ).toContain("border-tag-orange"),
  );
  await a.click();
  await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
  await vi.waitFor(() => expect(sharedText(shared.a)).toBe("Hello and B"));
  expect(sharedText(shared.b)).toBe("Hello and B");
});

/** An editor's top-level blocks' text, collaborators' caret labels left out. */
const blockTexts = (element: Element) =>
  [...element.children].map((block) => visibleText(block));

test("collaboration: a key pressed before the editor read a click's caret acts at that caret, not at the document's start", async () => {
  const { screen } = await twoEditors("First\n\nSecond\n\nThird");
  const a = screen.getByRole("textbox", { name: "A" });
  await vi.waitFor(() =>
    expect(blockTexts(a.element())).toEqual(["First", "Second", "Third"]),
  );
  // As a click leaves it: focus in the editor and the browser's caret at the end of "Second",
  // its `selectionchange` still queued — Enter arrives in the same task, before it runs.
  const second = a.element().children[1]!.firstChild!;
  (a.element() as HTMLElement).focus();
  window.getSelection()!.collapse(second, second.textContent!.length);
  a.element().dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    }),
  );
  await userEvent.keyboard("Fourth");
  await vi.waitFor(() =>
    expect(blockTexts(a.element())).toEqual([
      "First",
      "Second",
      "Fourth",
      "Third",
    ]),
  );
});

test("a shortcut pressed before the editor read a moved caret acts where the caret is now (⌘A out of a code block)", async () => {
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Doc"
      defaultValue={"```\ncode\n```\n\nPara"}
    />,
  );
  await screen.getByRole("textbox", { name: "Doc" }).click();
  const root = await vi.waitFor(() => {
    const pm = screen.container.querySelector<HTMLElement>(".ProseMirror");
    expect(pm?.querySelector("pre")).toBeTruthy();
    return pm!;
  });
  const editor = editorOf(root) as unknown as Editor;
  // The editor's caret in the code block…
  editor.commands.setTextSelection(2);
  // …then the browser's caret moved into "Para", its `selectionchange` still queued.
  const para = [...root.querySelectorAll("p")].at(-1)!.firstChild!;
  window.getSelection()!.collapse(para, 2);
  root.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "a",
      code: "KeyA",
      keyCode: 65,
      metaKey: MAC,
      ctrlKey: !MAC,
      bubbles: true,
      cancelable: true,
    }),
  );
  // ⌘A from "Para" selects the whole document, not the code block the caret had left.
  const { from, to } = editor.state.selection;
  expect([from, to]).toEqual([0, editor.state.doc.content.size]);
});

test("collaboration: clearHistory leaves ⌘Z nothing to undo once the text was replaced underneath", async () => {
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("v1 alpha", { a: { handleRef } });
  const a = screen.getByRole("textbox", { name: "A" });
  await vi.waitFor(() => expect(visibleText(a.element())).toBe("v1 alpha"));
  // A's own edits: "v1 alpha" becomes "v2 one".
  await a.click();
  await userEvent.keyboard(
    `${END}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}one`,
  );
  await userEvent.keyboard("{Home}{ArrowRight}{Delete}2");
  await vi.waitFor(() => expect(sharedText(shared.b)).toBe("v2 one"));
  // B puts the old text back, changing only what differs — as a version restore does.
  shared.b.transact(() =>
    prosemirrorToYXmlFragment(
      markdownToDoc("v1 alpha"),
      shared.b.getXmlFragment("default"),
    ),
  );
  await vi.waitFor(() => expect(sharedText(shared.a)).toBe("v1 alpha"));
  handleRef.current!.clearHistory();
  await a.click();
  await userEvent.keyboard(`{${MOD}>}z{/${MOD}}{${MOD}>}z{/${MOD}}`);
  // Undoing A's edits onto the restored text would splice "v2"/"one" into "v1 alpha".
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(sharedText(shared.a)).toBe("v1 alpha");
  expect(sharedText(shared.b)).toBe("v1 alpha");
});

test("collaboration: Escape blurs, and a read-only viewer sees live text in a document, not a field", async () => {
  const { screen } = await twoEditors("Shared", { b: { readOnly: true } });
  const a = screen.getByRole("textbox", { name: "A" });
  const viewer = screen.getByRole("document", { name: "B" });
  await a.click();
  await userEvent.keyboard(`${END} text`);
  await userEvent.keyboard("{Escape}");
  expect(a.element().contains(document.activeElement)).toBe(false);
  expect(visibleText(a.element())).toBe("Shared text");
  await vi.waitFor(() =>
    expect(visibleText(viewer.element())).toBe("Shared text"),
  );
  expect(screen.container.querySelectorAll('[role="textbox"]')).toHaveLength(1);
});

test("collaboration: a viewer folds a toggle for themselves only — no change reaches the document (B7)", async () => {
  const { screen, shared } = await twoEditors(
    "<details open><summary>Title</summary>\n\nBody\n\n</details>",
    { b: { readOnly: true } },
  );
  await vi.waitFor(() =>
    expect(
      screen.container.querySelectorAll('[data-slot="toggle"][data-open]'),
    ).toHaveLength(2),
  );
  const updates = vi.fn();
  shared.b.on("update", updates);
  const [, viewerToggle] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="toggle"]',
  );
  await userEvent.click(
    viewerToggle!.querySelector<HTMLElement>('[data-slot="toggle-chevron"]')!,
  );
  await vi.waitFor(() => expect(viewerToggle).not.toHaveAttribute("data-open"));
  const [editorToggle] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="toggle"]',
  );
  expect(editorToggle).toHaveAttribute("data-open");
  expect(updates).not.toHaveBeenCalled();
  // "Open by default" is the author's choice for everyone: a document change, from the block menu
  // (the toggle has no menu of its own).
  expect(
    editorToggle!.querySelector('[data-slot="toggle-options"]'),
  ).toBeNull();
  await screen.getByRole("textbox", { name: "A" }).click();
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await userEvent.click(
    await vi.waitFor(() => {
      const item = [
        ...document.querySelectorAll('[role="menuitemcheckbox"]'),
      ].find((each) => each.textContent?.includes("Open by default"));
      expect(item).toBeDefined();
      return item as HTMLElement;
    }),
  );
  await vi.waitFor(() => expect(updates).toHaveBeenCalled());
  await vi.waitFor(() => expect(editorToggle).not.toHaveAttribute("data-open"));
});

test("collaboration: a record mention is stored without its title, and each reader's chip labels it", async () => {
  const search = async (): Promise<MentionOption[]> => [
    { kind: "page", id: "p1", label: "Q3 plan" },
  ];
  const { screen, shared } = await twoEditors("", {
    a: {
      mentions: { kinds: mentionKinds("page"), search },
      mentionLabel: () => "Q3 plan",
    },
    b: { mentionLabel: () => null },
  });
  await screen.getByRole("textbox", { name: "A" }).click();
  await userEvent.keyboard("@Q3");
  await vi.waitFor(() =>
    expect(mentionMenu()?.textContent).toContain("Q3 plan"),
  );
  await userEvent.keyboard("{Enter}");
  const mention = () =>
    yXmlFragmentToProseMirrorRootNode(
      shared.b.getXmlFragment("default"),
      textEditSchema(),
    ).firstChild?.firstChild;
  await vi.waitFor(() => expect(mention()?.type.name).toBe("mention"));
  expect(mention()!.attrs).toMatchObject({ kind: "page", id: "p1", label: "" });
  const chips = screen.container.querySelectorAll('[data-slot="inline-chip"]');
  await vi.waitFor(() => expect(chips[0]?.textContent).toContain("Q3 plan"));
  // A reader the host gives no label sees a placeholder, never someone else's title.
  await vi.waitFor(() =>
    expect(
      screen.container.querySelectorAll('[data-slot="inline-chip"]')[1]
        ?.textContent,
    ).toContain("…"),
  );
});

test("collaboration: a highlight placed by Yjs positions follows a collaborator's edit before it", async () => {
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("alpha beta gamma", {
    a: { handleRef },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  // Select "beta" (offsets 6–10 in the paragraph).
  const anchor = await anchorOf(a.element(), handleRef, 6, 10, "beta");
  expect(anchor.y?.start).toBeInstanceOf(Uint8Array);
  // A third viewer of the same document draws the highlight from its Yjs positions.
  const viewer = await render(
    <TextEdit
      format="markdown"
      aria-label="C"
      readOnly
      collaboration={{
        document: shared.b,
        provider: {
          awareness: new Awareness(shared.b),
          on: () => undefined,
          off: () => undefined,
        },
        user: { id: "u3", name: "Cal", hue: "blue" },
      }}
      annotations={[{ id: "c1", anchor }]}
    />,
  );
  const highlight = () =>
    viewer.container.querySelector('[data-annotation="c1"]')?.textContent;
  await vi.waitFor(() => expect(highlight()).toBe("beta"));
  // A collaborator types before it: the highlight stays on its words.
  await a.click();
  await userEvent.keyboard(`{${MOD}>}{ArrowUp}{/${MOD}}`);
  await userEvent.keyboard("{Home}new ");
  await vi.waitFor(() =>
    expect(viewer.container.querySelector(".ProseMirror")?.textContent).toBe(
      "new alpha beta gamma",
    ),
  );
  await vi.waitFor(() => expect(highlight()).toBe("beta"));
});

/** The shared document's first paragraph's text, as Yjs holds it. */
const sharedParagraph = (doc: Y.Doc) =>
  (doc.getXmlFragment("default").get(0) as Y.XmlElement).get(0) as Y.XmlText;

test("collaboration: a Yjs highlight takes text typed inside it, and is orphaned once its quote is deleted", async () => {
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("alpha beta gamma", {
    a: { handleRef },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  const anchor = await anchorOf(a.element(), handleRef, 6, 10, "beta");
  const onAnnotationsLayout = vi.fn();
  const viewer = await render(
    <TextEdit
      format="markdown"
      aria-label="C"
      readOnly
      collaboration={{
        document: shared.b,
        provider: {
          awareness: new Awareness(shared.b),
          on: () => undefined,
          off: () => undefined,
        },
        user: { id: "u3", name: "Cal", hue: "blue" },
      }}
      annotations={[{ id: "c1", anchor }]}
      onAnnotationsLayout={onAnnotationsLayout}
    />,
  );
  const highlight = () =>
    viewer.container.querySelector('[data-annotation="c1"]')?.textContent;
  await vi.waitFor(() => expect(highlight()).toBe("beta"));
  // The layout's anchor keeps its Yjs positions: persisting it never drops them.
  await vi.waitFor(() =>
    expect(
      onAnnotationsLayout.mock.calls.at(-1)?.[0]?.[0]?.anchor?.y?.end,
    ).toBeInstanceOf(Uint8Array),
  );
  // A collaborator types before the quote's last character: it is inside the highlight.
  sharedParagraph(shared.a).insert(9, "XYZ");
  await vi.waitFor(() => expect(highlight()).toBe("betXYZa"));
  // The whole quote deleted: the highlight is orphaned, never moved onto the next word.
  sharedParagraph(shared.a).delete(6, 7);
  await vi.waitFor(() =>
    expect(viewer.container.querySelector(".ProseMirror")?.textContent).toBe(
      "alpha  gamma",
    ),
  );
  await vi.waitFor(() => expect(highlight()).toBeUndefined());
});

test("collaboration: a pasted record mention keeps no title in the shared document", async () => {
  const { screen, shared } = await twoEditors("", {
    a: { mentionLabel: () => null },
    b: { mentionLabel: () => null },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  const data = new DataTransfer();
  data.setData("text/plain", "See [@Secret acquisition](mention://page/p1)");
  a.element().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }),
  );
  const mention = () => {
    let found: { attrs: Record<string, unknown> } | null = null;
    yXmlFragmentToProseMirrorRootNode(
      shared.b.getXmlFragment("default"),
      textEditSchema(),
    ).descendants((node) => {
      if (node.type.name === "mention") found = node;
    });
    return found as { attrs: Record<string, unknown> } | null;
  };
  await vi.waitFor(() => expect(mention()).not.toBeNull());
  expect(mention()!.attrs).toMatchObject({ kind: "page", id: "p1", label: "" });
  expect(screen.container.textContent).not.toContain("Secret");
});

test("collaboration: an upload lands even when a collaborator changes its paragraph meanwhile", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("alpha beta", {
    a: { onImageUpload, handleRef },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  await userEvent.keyboard(END);
  pasteFiles(a.element(), [png()]);
  await vi.waitFor(() =>
    expect(a.element().querySelector("[data-uploading]")).not.toBeNull(),
  );
  // A collaborator edits the same paragraph: Yjs replaces it in this editor.
  sharedParagraph(shared.b).insert(0, "new ");
  await vi.waitFor(() =>
    expect(visibleText(a.element())).toContain("new alpha beta"),
  );
  expect(a.element().querySelector("[data-uploading]")).not.toBeNull();
  expect(handleRef.current!.pendingUploads()).toBe(1);
  land({ src: "/api/files/f1" });
  await vi.waitFor(() => {
    let image = false;
    yXmlFragmentToProseMirrorRootNode(
      shared.b.getXmlFragment("default"),
      textEditSchema(),
    ).descendants((node) => {
      if (node.type.name === "image") image = true;
    });
    expect(image).toBe(true);
  });
  expect(handleRef.current!.pendingUploads()).toBe(0);
});

test("collaboration: a caret's name comes from the server's identity, never from what a client claims", async () => {
  const { screen, shared } = await twoEditors("Hello");
  await screen.getByRole("textbox", { name: "B" }).click();
  // B claims to be Asha, and an agent.
  shared.awareness.b.setLocalStateField("user", {
    id: "u1",
    name: "Asha Rao",
    hue: "green",
    kind: "agent",
  });
  const a = screen.getByRole("textbox", { name: "A" }).element();
  await vi.waitFor(() =>
    expect(
      a.querySelector('[data-slot="text-edit-caret-label"]')?.textContent,
    ).toBe("Ben Ito"),
  );
  expect(a.querySelector('[data-slot="text-edit-caret"]')?.className).toContain(
    "border-tag-orange",
  );
});

test("collaboration: a read-only viewer never assigns block ids — the server owns them", async () => {
  const shared = sharedDocument();
  prosemirrorToYXmlFragment(
    textEditSchema().nodeFromJSON({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "No id" }] },
      ],
    }),
    shared.a.getXmlFragment("default"),
  );
  const updates = vi.fn();
  shared.b.on("update", updates);
  const collaboration = {
    ...shared.collaboration("b"),
    provider: {
      awareness: new Awareness(shared.b),
      on: (_event: "synced", listener: () => void) => setTimeout(listener, 0),
      off: () => undefined,
    },
  };
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="C"
      readOnly
      collaboration={collaboration}
    />,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")?.textContent).toBe(
      "No id",
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(updates).not.toHaveBeenCalled();
});

test("collaboration: a collaborator's edit leaves an open slash menu open", async () => {
  const { screen, shared } = await twoEditors("First\n\nSecond");
  await screen.getByRole("textbox", { name: "A" }).click();
  await userEvent.keyboard(`${END}{Enter}/hea`);
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  sharedParagraph(shared.b).insert(0, "B ");
  await vi.waitFor(() =>
    expect(
      visibleText(screen.getByRole("textbox", { name: "A" }).element()),
    ).toContain("B First"),
  );
  expect(slashMenu()).not.toBeNull();
  expect(slashMenu()!.textContent).toMatch(/Heading/);
});

/** The Tiptap editor behind an editor surface (Tiptap keeps it on its contenteditable). */
function editorOf(box: Element) {
  return (
    (box.closest(".ProseMirror") ??
      box.querySelector(".ProseMirror")) as unknown as {
      editor: {
        commands: {
          setTextSelection: (
            at: number | { from: number; to: number },
          ) => boolean;
          insertContent: (text: string) => boolean;
        };
        chain: () => {
          setTextSelection: (pos: number) => {
            setNode: (
              type: string,
              attrs: Record<string, unknown>,
            ) => { run: () => boolean };
          };
        };
      };
    }
  ).editor;
}

/**
 * Select `from`–`to` of an editor's first paragraph text and read its anchor from `handleRef`.
 * The selection is set through the editor's commands: a DOM selection reaches it asynchronously.
 */
async function anchorOf(
  box: Element,
  handleRef: React.RefObject<TextEditHandle | null>,
  from: number,
  to: number,
  quote: string,
) {
  editorOf(box).commands.setTextSelection({ from: from + 1, to: to + 1 });
  return vi.waitFor(() => {
    const found = handleRef.current!.getAnchorForSelection();
    expect(found?.quote).toBe(quote);
    return found!;
  });
}

/** A read-only third viewer of `doc` drawing one highlight (`c1`) from `anchor`. */
async function highlightViewer(doc: Y.Doc, anchor: TextEditAnchor) {
  const viewer = await render(
    <TextEdit
      format="markdown"
      aria-label="C"
      readOnly
      collaboration={{
        document: doc,
        provider: {
          awareness: new Awareness(doc),
          on: () => undefined,
          off: () => undefined,
        },
        user: { id: "u3", name: "Cal", hue: "blue" },
      }}
      annotations={[{ id: "c1", anchor }]}
    />,
  );
  return {
    text: () => viewer.container.querySelector(".ProseMirror")?.textContent,
    highlight: () =>
      viewer.container.querySelector('[data-annotation="c1"]')?.textContent,
  };
}

test("collaboration: a highlight on the document's first word survives a collaborator's edit", async () => {
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("beta gamma", {
    a: { handleRef },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  const anchor = await anchorOf(a.element(), handleRef, 0, 4, "beta");
  const viewer = await highlightViewer(shared.b, anchor);
  await vi.waitFor(() => expect(viewer.highlight()).toBe("beta"));
  sharedParagraph(shared.a).insert(10, " delta");
  await vi.waitFor(() => expect(viewer.text()).toBe("beta gamma delta"));
  await vi.waitFor(() => expect(viewer.highlight()).toBe("beta"));
});

test("collaboration: a reopened highlight whose quote was deleted stays orphaned — never moved to another occurrence", async () => {
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("one beta two beta", {
    a: { handleRef },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  const anchor = await anchorOf(a.element(), handleRef, 4, 8, "beta");
  sharedParagraph(shared.a).delete(4, 4);
  const viewer = await highlightViewer(shared.b, anchor);
  await vi.waitFor(() => expect(viewer.text()).toBe("one  two beta"));
  await vi.waitFor(() => expect(viewer.highlight()).toBeUndefined());
});

test("collaboration: an upload survives its paragraph turned heading here, then a collaborator's edit", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const { screen, shared } = await twoEditors("intro\n\nalpha beta", {
    a: { onImageUpload },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await a.click();
  // The editor's own commands place the caret and change the block: keyboard shortcuts for
  // "end of line" differ by platform, and a DOM selection reaches the editor asynchronously.
  const editor = editorOf(a.element());
  editor.commands.setTextSelection(18); // the end of "alpha beta"
  pasteFiles(a.element(), [png()]);
  await vi.waitFor(() =>
    expect(
      a.element().querySelectorAll("p")[1]?.querySelector("[data-uploading]"),
    ).not.toBeNull(),
  );
  // This person turns the paragraph into a heading: Yjs rebuilds the block.
  editor.chain().setTextSelection(9).setNode("heading", { level: 1 }).run();
  await vi.waitFor(() =>
    expect(a.element().querySelector("h1")).not.toBeNull(),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  (
    (shared.b.getXmlFragment("default").get(1) as Y.XmlElement).get(
      0,
    ) as Y.XmlText
  ).insert(0, "new ");
  await vi.waitFor(() =>
    expect(visibleText(a.element())).toContain("new alpha beta"),
  );
  // Still where it was put: at the end of the heading's text, not pushed out of the block.
  await vi.waitFor(() =>
    expect(a.element().querySelector("h1 [data-uploading]")).not.toBeNull(),
  );
  land({ src: "/api/files/f1" });
  await vi.waitFor(() => {
    let image = false;
    yXmlFragmentToProseMirrorRootNode(
      shared.b.getXmlFragment("default"),
      textEditSchema(),
    ).descendants((node) => {
      if (node.type.name === "image") image = true;
    });
    expect(image).toBe(true);
  });
});

for (const [block, markdown] of [
  ["paragraph", "Go"],
  ["heading", "# Go"],
] as const)
  test(`collaboration: two people typing at the same place in a ${block} each keep their own characters in order`, async () => {
    const { screen, shared } = await twoEditors(markdown);
    const a = editorOf(screen.getByRole("textbox", { name: "A" }).element());
    const b = editorOf(screen.getByRole("textbox", { name: "B" }).element());
    // Both carets at the end of the paragraph.
    a.commands.setTextSelection(3);
    b.commands.setTextSelection(3);
    // Each types a character before seeing the other's, eight times over.
    shared.network.hold(true);
    for (const [mine, theirs] of [..."abcdefgh"].map((ch, i) => [
      ch,
      String(i + 1),
    ])) {
      a.commands.insertContent(mine!);
      b.commands.insertContent(theirs!);
      shared.network.flush();
    }
    shared.network.hold(false);
    const text = sharedText(shared.a);
    expect(sharedText(shared.b)).toBe(text);
    // Interleaved however Yjs orders them, but each person's own characters in typing order.
    expect(text.replace(/[^a-h]/g, "")).toBe("abcdefgh");
    expect(text.replace(/[^1-8]/g, "")).toBe("12345678");
  });

/* --- version diff -----------------------------------------------------------------------------*/

const diffDoc = (word: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Kept " },
        {
          type: "text",
          text: word,
          marks: [{ type: "ychange", attrs: { type: "added", user: null } }],
        },
        {
          type: "text",
          text: " old",
          marks: [{ type: "ychange", attrs: { type: "removed", user: null } }],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2, ychange: { type: "removed", user: null } },
      content: [{ type: "text", text: "Gone heading" }],
    },
    {
      type: "bulletList",
      attrs: { ychange: { type: "added", user: null } },
      content: [
        {
          type: "listItem",
          attrs: { ychange: { type: "added", user: null } },
          content: [
            {
              type: "paragraph",
              attrs: { ychange: { type: "added", user: null } },
              content: [{ type: "text", text: "New item" }],
            },
          ],
        },
      ],
    },
  ],
});

test("diff: a version diff shows read-only, its added and removed text and blocks marked, under its baseline", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await render(
    <TextEdit
      aria-label="Changes"
      diff={{ doc: diffDoc("new"), baseline: "the previous version" }}
    />,
  );
  const view = screen.getByRole("document", { name: "Changes" });
  await vi.waitFor(() =>
    expect(
      view.element().querySelector("ins[data-ychange=added]")?.textContent,
    ).toBe("new"),
  );
  const root = screen.container;
  expect(root.querySelector("del[data-ychange=removed]")?.textContent).toBe(
    " old",
  );
  expect(root.querySelector("h2")?.getAttribute("data-ychange")).toBe(
    "removed",
  );
  expect(root.querySelector("ul")?.getAttribute("data-ychange")).toBe("added");
  // Read-only: nothing to type into, whatever `readOnly` says.
  expect(root.querySelector('[contenteditable="true"]')).toBeNull();
  expect(
    root.querySelector('[data-slot="text-edit-diff-legend"]')?.textContent,
  ).toContain("Compared with the previous version");
  // Each change is announced: a visually hidden "Added:"/"Removed:" before it.
  const before = (element: Element | null) =>
    getComputedStyle(element!, "::before").content;
  expect(before(root.querySelector("ins[data-ychange]"))).toContain("Added:");
  expect(before(root.querySelector("h2"))).toContain("Removed:");
  // A changed block is tinted once: the list, not again for its item and paragraph.
  expect(before(root.querySelector("ul li"))).toBe("none");
  await expectNoA11yViolations(root);

  // Another pair of versions replaces the document.
  await screen.rerender(
    <TextEdit
      aria-label="Changes"
      diff={{ doc: diffDoc("fresh"), baseline: "the current text" }}
    />,
  );
  await vi.waitFor(() =>
    expect(root.querySelector("ins[data-ychange=added]")?.textContent).toBe(
      "fresh",
    ),
  );
  expect(
    root.querySelector('[data-slot="text-edit-diff-legend"]')?.textContent,
  ).toContain("Compared with the current text");
});

test("diff: node views carry their change, nothing is ever saved, `value` never replaces it, Copy code skips removed lines", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
  onTestFinished(() => writeText.mockRestore());
  const toggle = markdownToDoc(
    "<details open><summary>Steps</summary>\n\nBody\n\n</details>",
  ).toJSON().content![0]!;
  const doc = {
    type: "doc",
    content: [
      {
        type: "codeBlock",
        attrs: { language: null },
        content: [
          { type: "text", text: "kept();\n" },
          {
            type: "text",
            text: "removed();",
            marks: [
              { type: "ychange", attrs: { type: "removed", user: null } },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Ask " },
          {
            type: "mention",
            attrs: {
              kind: "user",
              id: "u1",
              label: "Asha Rao",
              ychange: { type: "removed", user: null },
            },
          },
        ],
      },
      {
        ...toggle,
        attrs: { ...toggle.attrs, ychange: { type: "added", user: null } },
      },
    ],
  };
  const onValueChange = vi.fn();
  const onCommit = vi.fn();
  const screen = await render(
    <>
      <TextEdit
        format="markdown"
        aria-label="Changes"
        value="Some other text"
        onValueChange={onValueChange}
        onCommit={onCommit}
        diff={{ doc }}
      />
      <button type="button">Outside</button>
    </>,
  );
  const root = screen.container;
  await vi.waitFor(() =>
    expect(root.querySelector('[data-slot="code-block"]')).not.toBeNull(),
  );
  // A node view's own element carries the change, as `renderHTML` would.
  expect(
    root.querySelector('[data-ychange="removed"] [data-slot="inline-chip"]'),
  ).not.toBeNull();
  expect(
    root.querySelector(
      '[data-ychange="added"] [data-slot="toggle"], [data-slot="toggle"][data-ychange="added"]',
    ),
  ).not.toBeNull();
  expect(root.textContent).not.toContain("Some other text");
  // Copy code: the code as it is now, without the removed line.
  await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("kept();\n"));
  // Folding a toggle is the viewer's own; leaving, and another `value`, change nothing.
  const chevron = root.querySelector<HTMLElement>(
    '[data-slot="toggle-chevron"]',
  );
  if (chevron) await userEvent.click(chevron);
  await screen.getByRole("button", { name: "Outside" }).click();
  await screen.rerender(
    <>
      <TextEdit
        format="markdown"
        aria-label="Changes"
        value="Yet another text"
        onValueChange={onValueChange}
        onCommit={onCommit}
        diff={{ doc }}
      />
      <button type="button">Outside</button>
    </>,
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(root.textContent).not.toContain("Yet another text");
  expect(onValueChange).not.toHaveBeenCalled();
  expect(onCommit).not.toHaveBeenCalled();
});

/** The bubble menu's positioned wrapper. */
const bubbleWrapper = () => bubble()!.parentElement!;

/** A selection of "25 A" in the editor, once its bubble menu shows; returns the selection's rect. */
async function selectWithBubble() {
  await vi.waitFor(() =>
    expect(document.querySelector(".ProseMirror p")).not.toBeNull(),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  const paragraph = document.querySelector(".ProseMirror p")!;
  await userEvent.click(paragraph);
  selectText(paragraph, "25 A");
  await vi.waitFor(() => expect(bubble()).not.toBeNull(), { timeout: 3000 });
  await vi.waitFor(() =>
    expect(bubbleWrapper().style.visibility).toBe("visible"),
  );
  return window.getSelection()!.getRangeAt(0).getBoundingClientRect();
}

test("floatingSafeArea: the selection bubble flips below rather than sit under a sticky header", async () => {
  await render(
    <div style={{ paddingTop: 120 }}>
      <TextEdit
        format="markdown"
        aria-label="Notes"
        defaultValue="Use a 25 A breaker"
        floatingSafeArea={{ top: 100 }}
      />
    </div>,
  );
  const selected = await selectWithBubble();
  await vi.waitFor(() =>
    expect(bubbleWrapper().getBoundingClientRect().top).toBeGreaterThanOrEqual(
      selected.bottom,
    ),
  );
});

test("floatingSafeArea: the slash menu flips above when a bottom bar leaves too little room below", async () => {
  const screen = await render(
    <div style={{ position: "fixed", top: 150, left: 8, width: 300 }}>
      <TextEdit
        format="markdown"
        aria-label="Low"
        floatingSafeArea={{ bottom: window.innerHeight - 260 }}
      />
    </div>,
  );
  await screen.getByRole("textbox", { name: "Low" }).click();
  await userEvent.keyboard("/");
  await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
  expect(slashMenu()!.getAttribute("data-side")).toBe("top");
});

test("on a coarse pointer the selection bubble opens below the selection", async () => {
  const matchMedia = window.matchMedia.bind(window);
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    query === "(pointer: coarse)"
      ? Object.defineProperty(matchMedia(query), "matches", { value: true })
      : matchMedia(query),
  );
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
  await render(
    <div style={{ paddingTop: 200 }}>
      <TextEdit
        format="markdown"
        aria-label="Touch"
        defaultValue="Use a 25 A breaker"
      />
    </div>,
  );
  const selected = await selectWithBubble();
  await vi.waitFor(() =>
    expect(bubbleWrapper().getBoundingClientRect().top).toBeGreaterThanOrEqual(
      selected.bottom,
    ),
  );
});

// ---- Embeds (YouTube, Loom) and external images (B.2) ------------------------------------------

const YOUTUBE = "https://youtu.be/dQw4w9WgXcQ?si=tracking";

function pasteData(target: Element, data: Record<string, string>) {
  const transfer = new DataTransfer();
  for (const [type, value] of Object.entries(data))
    transfer.setData(type, value);
  target.dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: transfer,
      bubbles: true,
      cancelable: true,
    }),
  );
}

test("mentions: a click on a chip leaves the caret beside it — Escape closes its card and typing goes on there; End and Enter start the next line", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "First line\n\nOwner [@Asha Rao](mention://user/u1)",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  const chip = () =>
    box.element().querySelector<HTMLElement>('[data-slot="inline-chip"]')!;
  await userEvent.click(chip());
  const card = () => document.querySelector('[data-slot="hover-card-content"]');
  // The person's card opens on the click (after its delay); Escape closes only it.
  await vi.waitFor(() => expect(card()).not.toBeNull());
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(card()).toBeNull());
  expect(document.activeElement).toBe(box.element());
  await userEvent.keyboard("x");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "First line\n\nOwner [@Asha Rao](mention://user/u1)x",
    ),
  );
  // Q-page-26: the click opens the person's card; the line's end, Enter and typing go on below.
  await userEvent.click(chip());
  await new Promise((resolve) => setTimeout(resolve, 600));
  await userEvent.keyboard(`${MAC ? "{Meta>}{ArrowRight}{/Meta}" : "{End}"}`);
  await userEvent.keyboard("{Enter}y");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "First line\n\nOwner [@Asha Rao](mention://user/u1)x\n\ny",
    ),
  );
});

const pastePopover = () =>
  document.querySelector<HTMLElement>('[data-slot="text-edit-paste"]');
const pasteChoice = (name: string) =>
  [...(pastePopover()?.querySelectorAll("button") ?? [])].find(
    (button) => button.textContent === name,
  );

test("embeds: a lone YouTube link pasted into an empty paragraph is a facade; the paste popover makes it a link", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Intro",
    embeds: EMBED_PROVIDERS,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END}{Enter}`);
  pasteData(box.element(), { "text/plain": YOUTUBE });
  // The URL as written is the Markdown; the facade loads nothing from YouTube until Play.
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`Intro\n\n${YOUTUBE}`),
  );
  const play = screen.getByRole("button", { name: "Play YouTube video" });
  await expect.element(play).toBeInTheDocument();
  expect(box.element().querySelector("iframe")).toBeNull();
  // Embed · Link, Embed in effect.
  await vi.waitFor(() => expect(pastePopover()).not.toBeNull());
  expect(
    [...pastePopover()!.querySelectorAll("button")].map((b) => [
      b.textContent,
      b.getAttribute("aria-pressed"),
    ]),
  ).toEqual([
    ["Embed", "true"],
    ["Link", "false"],
  ]);
  pasteChoice("Link")!.click();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`Intro\n\n[${YOUTUBE}](${YOUTUBE})`),
  );
  expect(pastePopover()).toBeNull();
  // Pasted beside text, the same link stays a link — and Embed puts the player after the line.
  const LOOM = "https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184";
  await userEvent.keyboard(`${END}{Enter}See `);
  pasteData(box.element(), { "text/plain": LOOM });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain(`See [${LOOM}](${LOOM})`),
  );
  expect(
    box.element().querySelector('[data-slot="markdown-embed"]'),
  ).toBeNull();
  await vi.waitFor(() => expect(pasteChoice("Embed")).toBeDefined());
  expect(pasteChoice("Link")!.getAttribute("aria-pressed")).toBe("true");
  pasteChoice("Embed")!.click();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(
      /See\s*\n\nhttps:\/\/www\.loom\.com\/share\/\w+$/,
    ),
  );
});

test("paste: an app link becomes its mention, Link turns it back, ⌘Z right after a paste leaves the URL as text", async () => {
  const APP = "https://app.test/products/families/f1";
  const fromUrl = vi.fn((url: string) =>
    url.startsWith("https://app.test/")
      ? Promise.resolve<MentionOption>({
          kind: "family",
          id: "f1",
          label: "Linear",
        })
      : null,
  );
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: {
      kinds: mentionKinds("user", "family"),
      search: async () => [],
      fromUrl,
    },
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), { "text/plain": APP });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("[@Linear](mention://family/f1)"),
  );
  expect(fromUrl).toHaveBeenCalledWith(APP, {
    signal: expect.any(AbortSignal),
  });
  await vi.waitFor(() => expect(pasteChoice("Mention")).toBeDefined());
  expect(pasteChoice("Mention")!.getAttribute("aria-pressed")).toBe("true");
  // From the keyboard: Tab moves onto the choice in effect, the arrows to the other, Enter picks.
  await userEvent.keyboard("{Tab}");
  expect(document.activeElement).toBe(pasteChoice("Mention"));
  await userEvent.keyboard("{ArrowRight}{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`[${APP}](${APP})`),
  );
  expect(pastePopover()).toBeNull();

  // A fresh paste: ⌘Z right after takes back the mention, not the paste — the URL stays as text.
  await userEvent.keyboard(" ");
  pasteData(box.element(), { "text/plain": APP });
  await vi.waitFor(() =>
    expect(
      box.element().querySelectorAll('[data-slot="inline-chip"]'),
    ).toHaveLength(1),
  );
  // Any keystroke closes the popover; Escape only that.
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(pastePopover()).toBeNull());
  await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
  await vi.waitFor(() =>
    expect(box.element().querySelector('[data-slot="inline-chip"]')).toBeNull(),
  );
  const paragraph = box.element().querySelector("p")!;
  expect(paragraph.textContent).toBe(`${APP} ${APP}`);
  expect(paragraph.querySelectorAll("a")).toHaveLength(1);
});

test("paste: plain-text paste (⌘⇧V), a link to another target and rich content are never converted", async () => {
  const APP = "https://app.test/tasks/t1";
  const fromUrl = vi.fn(() =>
    Promise.resolve<MentionOption>({
      kind: "task",
      id: "t1",
      label: "Order glass",
    }),
  );
  const screen = await markdownEditor({
    mentions: {
      kinds: mentionKinds("user", "task"),
      search: async () => [],
      fromUrl,
    },
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  // The shortcut alone: a real one would also paste the system clipboard, which differs by OS.
  box.element().dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "V",
      shiftKey: true,
      metaKey: MAC,
      ctrlKey: !MAC,
      bubbles: true,
      cancelable: true,
    }),
  );
  // Shift released (the editor pastes plain text while it is held).
  await userEvent.keyboard("{Shift}");
  pasteData(box.element(), { "text/plain": APP });
  await vi.waitFor(() => expect(box.element().textContent).toContain(APP));
  // A link whose text is the URL but whose target is another pastes as that link.
  pasteData(box.element(), {
    "text/plain": APP,
    "text/html": `<a href="https://app.test/tasks/other">${APP}</a>`,
  });
  // A URL inside richer content (a table cell) pastes as that content.
  pasteData(box.element(), {
    "text/plain": APP,
    "text/html": `<table><tr><td>${APP}</td></tr></table>`,
  });
  await vi.waitFor(() =>
    expect(box.element().querySelector("table")).not.toBeNull(),
  );
  expect(fromUrl).not.toHaveBeenCalled();
  expect(box.element().querySelector('[data-slot="inline-chip"]')).toBeNull();
  expect(pastePopover()).toBeNull();
});

test("paste: typing on while the answer is on its way keeps the conversion (a space may autolink the URL to itself)", async () => {
  const APP = "https://app.test/tasks/t1";
  let answer!: (option: MentionOption | null) => void;
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: {
      kinds: mentionKinds("user", "task"),
      search: async () => [],
      fromUrl: () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    },
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), { "text/plain": APP });
  await userEvent.keyboard(" next");
  answer({ kind: "task", id: "t1", label: "Order glass" });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "[@Order glass](mention://task/t1) next",
    ),
  );

  // Made inline code before the answer: it stays code.
  await userEvent.keyboard(" ");
  pasteData(box.element(), { "text/plain": APP });
  // Select exactly the pasted URL (the last copy of it), then make it code.
  const walker = document.createTreeWalker(box.element(), NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    if (n.textContent?.includes(APP)) last = n as Text;
  const at = last!.textContent!.lastIndexOf(APP);
  const range = document.createRange();
  range.setStart(last!, at);
  range.setEnd(last!, at + APP.length);
  document.getSelection()!.removeAllRanges();
  document.getSelection()!.addRange(range);
  await new Promise((resolve) => setTimeout(resolve, 50));
  await userEvent.keyboard(`{${MOD}>}e{/${MOD}}{ArrowRight}`);
  answer({ kind: "task", id: "t1", label: "Order glass" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(
    box.element().querySelectorAll('[data-slot="inline-chip"]'),
  ).toHaveLength(1);
  expect(box.element().querySelector("code")?.textContent).toBe(APP);

  // Typed straight onto the URL's end, it is another address: no mention of the first.
  await userEvent.keyboard(" ");
  pasteData(box.element(), { "text/plain": APP });
  await userEvent.keyboard("2");
  answer({ kind: "task", id: "t1", label: "Order glass" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(
    box.element().querySelectorAll('[data-slot="inline-chip"]'),
  ).toHaveLength(1);
  expect(box.element().textContent).toContain(`${APP}2`);
});

test("paste: submitting before the answer submits a link, and a late answer changes nothing", async () => {
  const APP = "https://app.test/tasks/t1";
  let answer!: (option: MentionOption | null) => void;
  const onSubmit = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: {
      kinds: mentionKinds("user", "task"),
      search: async () => [],
      fromUrl: () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    },
    onSubmit,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), { "text/plain": APP });
  await userEvent.keyboard(`{${MOD}>}{Enter}{/${MOD}}`);
  expect(onSubmit).toHaveBeenLastCalledWith(`[${APP}](${APP})`);
  answer({ kind: "task", id: "t1", label: "Order glass" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(lastValue(onValueChange)).toBe(`[${APP}](${APP})`);
});

test("paste: leaving before the answer commits a link, and a late answer changes nothing", async () => {
  const APP = "https://app.test/tasks/t1";
  let answer!: (option: MentionOption | null) => void;
  const onCommit = vi.fn();
  const screen = await markdownEditor({
    mentions: {
      kinds: mentionKinds("user", "task"),
      search: async () => [],
      fromUrl: () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    },
    onCommit,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), { "text/plain": APP });
  // Focus moves on (the popover under the paste covers the button a click would hit).
  (
    screen.getByRole("button", { name: "Outside" }).element() as HTMLElement
  ).focus();
  await vi.waitFor(() =>
    expect(onCommit).toHaveBeenLastCalledWith(`[${APP}](${APP})`),
  );
  const commits = onCommit.mock.calls.length;
  answer({ kind: "task", id: "t1", label: "Order glass" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(onCommit.mock.calls.length).toBe(commits);
  expect(box.element().querySelector('[data-slot="inline-chip"]')).toBeNull();
});

test("paste: another site's link takes its page's title and the link card shows its icon; an edited link keeps its text", async () => {
  let answer!: (preview: { title: string; icon: string }) => void;
  const linkPreview = vi.fn(
    (url: string) =>
      new Promise<{ title: string; icon: string } | null>((resolve) => {
        if (url.includes("later")) answer = resolve;
        else resolve({ title: "Example  Domain", icon });
      }),
  );
  const onValueChange = vi.fn();
  const screen = await render(
    <InlineChipProvider value={{ linkPreview }}>
      <TextEdit
        format="markdown"
        aria-label="Notes"
        onValueChange={onValueChange}
      />
    </InlineChipProvider>,
  );
  const box = screen.getByRole("textbox", { name: "Notes" });
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  await box.click();
  pasteData(box.element(), { "text/plain": "https://example.com/" });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "[Example Domain](https://example.com/)",
    ),
  );
  // A link has nothing else to be: no popover.
  expect(pastePopover()).toBeNull();
  await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-link-card"]')?.textContent,
    ).toContain("Example Domain"),
  );
  expect(
    document
      .querySelector('[data-slot="text-edit-link-icon"]')
      ?.getAttribute("src"),
  ).toBe(icon);

  // The URL waits as text for its title (link and title are one undo step); edited meanwhile,
  // the reader's text stays as typed.
  await userEvent.keyboard(`${END} `);
  pasteData(box.element(), { "text/plain": "https://example.com/later" });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(/ https:\/\/example\.com\/later$/),
  );
  await userEvent.keyboard("{ArrowLeft}{ArrowLeft}x");
  answer({ title: "Later", icon });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(lastValue(onValueChange)).toMatch(/ https:\/\/example\.com\/latxer$/);
});

test("embeds: Play builds the player from the video id, sandboxed, with its own referrer policy", async () => {
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Notes"
      defaultValue={
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m2s&utm_source=x"
      }
      embeds={EMBED_PROVIDERS}
      readOnly
    />,
  );
  const play = screen.getByRole("button", { name: "Play YouTube video" });
  await play.click();
  const frame = screen.container.querySelector("iframe")!;
  expect(frame.getAttribute("src")).toBe(
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=62",
  );
  expect(frame.getAttribute("title")).toBe("YouTube video");
  expect(frame.getAttribute("loading")).toBe("lazy");
  expect(frame.getAttribute("referrerpolicy")).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(frame.getAttribute("sandbox")).toBe(
    "allow-scripts allow-same-origin allow-popups allow-presentation",
  );
  expect(frame.getAttribute("allow")).toBe(
    "fullscreen; picture-in-picture; encrypted-media",
  );
});

test("embeds: the Video slash item embeds a YouTube or Loom link, and refuses a page link", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    embeds: EMBED_PROVIDERS,
    onValueChange,
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/youtube{Enter}");
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-label="Video URL"]')).not.toBeNull(),
  );
  await userEvent.keyboard("https://example.com/page{Enter}");
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-media"] [role="alert"]')
        ?.textContent,
    ).toBe("Paste a YouTube or Loom link"),
  );
  await userEvent.clear(
    document.querySelector<HTMLInputElement>('[aria-label="Video URL"]')!,
  );
  await userEvent.keyboard(
    "https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184{Enter}",
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184",
    ),
  );
  await expect
    .element(screen.getByRole("button", { name: "Play Loom video" }))
    .toBeInTheDocument();
});

test("external images: another site's image imports through onExternalImage; a failed one lands as a link", async () => {
  const { toast } = await import("./toast");
  const add = vi.spyOn(toast, "add");
  onTestFinished(() => add.mockRestore());
  const resolvers = new Map<string, (value: { src: string }) => void>();
  const onExternalImage = vi.fn(
    (url: string) =>
      new Promise<{ src: string }>((resolve, reject) => {
        if (url.includes("dog")) reject(new Error("blocked"));
        else resolvers.set(url, resolve);
      }),
  );
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Intro",
    onExternalImage,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END}{Enter}`);
  pasteData(box.element(), {
    "text/html":
      '<p>Look</p><img src="https://cdn.example.com/cat.png" alt="Cat"><img src="https://cdn.example.com/dog.png" alt="Dog">',
    "text/plain": "Look",
  });
  await vi.waitFor(() =>
    expect(onExternalImage).toHaveBeenCalledWith(
      "https://cdn.example.com/cat.png",
      { signal: expect.any(AbortSignal) },
    ),
  );
  // The other site's address never enters the document as an image.
  expect(box.element().querySelector('img[src^="https://cdn"]')).toBeNull();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain(
      "[https://cdn.example.com/dog.png](https://cdn.example.com/dog.png)",
    ),
  );
  expect(add).toHaveBeenCalledWith({
    title: "Couldn't import that image. A link was added instead.",
  });
  expect(
    box.element().querySelector('[data-slot="text-edit-upload"]'),
  ).not.toBeNull();
  resolvers.get("https://cdn.example.com/cat.png")!({ src: "/api/files/cat" });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain("![Cat](/api/files/cat)"),
  );
  expect(lastValue(onValueChange)).not.toContain("cat.png");
  expect(
    box.element().querySelector('[data-slot="text-edit-upload"]'),
  ).toBeNull();
});

test("external images: the image panel's Link imports another site's image through onExternalImage", async () => {
  const onExternalImage = vi.fn(async () => ({ src: "/api/files/linked" }));
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onExternalImage, onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/image{Enter}");
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-label="Image URL"]')).not.toBeNull(),
  );
  await userEvent.keyboard("cdn.example.com/cat.png{Enter}");
  await vi.waitFor(() =>
    expect(onExternalImage).toHaveBeenCalledWith(
      "https://cdn.example.com/cat.png",
      { signal: expect.any(AbortSignal) },
    ),
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("![](/api/files/linked)"),
  );
});

test("external images: Replace with another site's link swaps the image in place once imported; a failed import keeps it", async () => {
  let fail = false;
  const onExternalImage = vi.fn(async () => {
    if (fail) throw new Error("blocked");
    return { src: "/api/files/new" };
  });
  const onValueChange = vi.fn();
  const md = `![Old](${PIXEL})\n\nAfter`;
  const screen = await markdownEditor({
    defaultValue: md,
    onExternalImage,
    onValueChange,
  });
  const replace = async (url: string) => {
    await screen.getByRole("button", { name: "Replace" }).click();
    const field = await vi.waitFor(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[aria-label="Image URL"]',
      );
      expect(input).not.toBeNull();
      return input!;
    });
    await userEvent.type(field, `${url}{Enter}`);
  };
  fail = true;
  await replace("https://cdn.example.com/broken.png");
  await vi.waitFor(() => expect(onExternalImage).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(lastValue(onValueChange) ?? md).toBe(md);
  fail = false;
  await replace("https://cdn.example.com/new.png");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("![Old](/api/files/new)\n\nAfter"),
  );
});

test("external images: a replacement whose image is deleted while it imports lands nowhere", async () => {
  let resolve: (value: { src: string }) => void = () => {};
  const onExternalImage = vi.fn(
    () => new Promise<{ src: string }>((done) => (resolve = done)),
  );
  const onValueChange = vi.fn();
  const md = `Before\n\n![Old](${PIXEL})\n\n![Old](${PIXEL})`;
  const screen = await markdownEditor({
    defaultValue: md,
    onExternalImage,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  const editor = editorOf(box.element()) as unknown as Editor;
  const second = () => {
    let at = -1;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === "image") at = offset;
    });
    return at;
  };
  editor.chain().focus().setNodeSelection(second()).run();
  const replace = [
    ...document.querySelectorAll<HTMLElement>('[aria-label="Replace"]'),
  ].at(-1)!;
  await userEvent.click(replace);
  const field = await vi.waitFor(() => {
    const input = document.querySelector<HTMLInputElement>(
      '[aria-label="Image URL"]',
    );
    expect(input).not.toBeNull();
    return input!;
  });
  await userEvent.type(field, "https://cdn.example.com/new.png{Enter}");
  await vi.waitFor(() => expect(onExternalImage).toHaveBeenCalled());
  editor.chain().setNodeSelection(second()).deleteSelection().run();
  resolve({ src: "/api/files/new" });
  await new Promise((done) => setTimeout(done, 100));
  expect(editor.getHTML()).not.toContain("/api/files/new");
  expect(editor.getHTML().match(/<img/g)?.length).toBe(1);
});

test("inserting a callout or a code block logs no React error (stable editor props)", async () => {
  const errors: string[] = [];
  const spy = vi
    .spyOn(console, "error")
    .mockImplementation((...args) => void errors.push(String(args[0])));
  onTestFinished(() => spy.mockRestore());
  const screen = await markdownEditor();
  await screen.getByRole("textbox", { name: "Notes" }).click();
  for (const name of ["callout", "code"]) {
    await userEvent.keyboard(`/${name}`);
    await vi.waitFor(() => expect(slashMenu()).not.toBeNull());
    await userEvent.keyboard("{Enter}");
    await new Promise((resolve) => setTimeout(resolve, 50));
    await userEvent.keyboard(`${END}{Enter}{Enter}{Enter}`);
  }
  expect(errors.filter((each) => /flushSync/.test(each))).toEqual([]);
});

test("image caption: Markdown's title shows under the image and is edited from the toolbar", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: `![Chart](${PIXEL} "Q3 sales")`,
    onValueChange,
  });
  const caption = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="text-edit-image-caption"]',
    )!;
  await vi.waitFor(() => expect(caption().textContent).toBe("Q3 sales"));
  expect(caption().hidden).toBe(false);
  expect(document.querySelector("img[title]")).toBeNull();
  await screen.getByRole("button", { name: "Caption" }).click();
  const field = await vi.waitFor(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="Add a caption"]',
    );
    expect(input).not.toBeNull();
    return input!;
  });
  await userEvent.clear(field);
  await userEvent.type(field, "Q4 sales{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`![Chart](${PIXEL} "Q4 sales")`),
  );
  await vi.waitFor(() => expect(caption().textContent).toBe("Q4 sales"));
});

test("paste from Notion: its to-do list is a checklist and its callout a callout", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html":
      '<ul class="to-do-list"><li><div class="checkbox checkbox-on"></div> <span class="to-do-children-checked">Ship it</span></li><li><div class="checkbox checkbox-off"></div> <span class="to-do-children-unchecked">Tell the team</span></li></ul><figure class="callout"><div style="font-size:1.5em"><span class="icon">💡</span></div><div style="width:100%">Remember the deadline</div></figure>',
    "text/plain": "Ship it\nTell the team\nRemember the deadline",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [x] Ship it\n- [ ] Tell the team\n\n> [!TIP]\n> Remember the deadline",
    ),
  );
});

test("paste from Notion: a callout alone is a callout, keeps its image, and a nested checked item leaves its parent unchecked", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html":
      '<figure class="callout"><div><span class="icon">📝</span></div><div>Plain note</div></figure>',
    "text/plain": "Plain note",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("> [!NOTE]\n> Plain note"),
  );
  await userEvent.keyboard(`${END}{Enter}{Enter}{Enter}`);
  pasteData(box.element(), {
    "text/html":
      '<aside><p>Evidence:</p><img src="/a.png" alt="A"></aside><ul class="to-do-list"><li><div class="checkbox checkbox-off"></div> <span class="to-do-children-unchecked">Parent</span><ul class="to-do-list"><li><div class="checkbox checkbox-on"></div> <span class="to-do-children-checked">Child</span></li></ul></li></ul>',
    "text/plain": "Evidence:\nParent\nChild",
  });
  await vi.waitFor(() => {
    const value = lastValue(onValueChange) as string;
    expect(value).toContain("> Evidence:");
    expect(value).toContain("![A](/a.png)");
    expect(value).toContain("- [ ] Parent");
    expect(value).toContain("- [x] Child");
  });
});

test("paste from Notion: a callout inside a callout stays a callout", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html":
      "<aside><p>Outer</p><aside><p>Inner</p></aside><p>After</p></aside>",
    "text/plain": "Outer\nInner\nAfter",
  });
  await vi.waitFor(() =>
    expect(
      box
        .element()
        .querySelectorAll('[data-slot="callout"] [data-slot="callout"]'),
    ).toHaveLength(1),
  );
});

test("paste as Markdown: a callout inside a callout, and a closing tag in its code, stay where they belong", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/plain":
      "<aside>\nOuter\n<aside>\nInner\n</aside>\n```\n</aside>\n```\nStill outer\n</aside>",
  });
  await vi.waitFor(() => {
    const value = lastValue(onValueChange) as string;
    expect(value).toContain("> Outer");
    expect(value).toContain("> Still outer");
    expect(value).not.toMatch(/^Still outer/m);
  });
});

test("paste as Markdown: an <aside> inside a code fence stays code", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/plain":
      "Example:\n\n```md\n```html\n<aside>\nhi\n</aside>\n```\n\n<aside>First</aside>\n<aside>Second</aside>",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      // The serializer fences code that holds a ``` run with four backticks.
      "Example:\n\n````md\n```html\n<aside>\nhi\n</aside>\n````\n\n> [!NOTE]\n> First\n\n> [!NOTE]\n> Second",
    ),
  );
});

test("paste from Notion as Markdown: an <aside> callout becomes a callout", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/plain": "- [ ] Draft\n\n<aside>\n💡 Keep it short\n</aside>",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "- [ ] Draft\n\n> [!NOTE]\n> Keep it short",
    ),
  );
});

test("code block: ⌘A selects the code first, a second ⌘A the whole document", async () => {
  const screen = await markdownEditor({
    defaultValue: "Before\n\n```\nline one\nline two\n```",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await userEvent.click(box.element().querySelector("pre")!);
  const editor = editorOf(box.element()) as unknown as Editor;
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  const text = () => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, "\n");
  };
  expect(text()).toBe("line one\nline two");
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  expect(text()).toContain("Before");
});

test("link card: the caret in a link shows where it goes, Edit and Remove", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Visit [the site](https://example.com/docs) today",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await userEvent.click(box.element().querySelector("a")!);
  const card = await vi.waitFor(() => {
    const found = document.querySelector('[data-slot="text-edit-link-card"]');
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  expect(card.textContent).toContain("example.com/docs");
  await userEvent.click(
    card.querySelector<HTMLElement>('[aria-label="Remove link"]')!,
  );
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("Visit the site today"),
  );
});

test("external images: without onExternalImage a pasted image is kept as it is", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html": '<img src="https://cdn.example.com/cat.png" alt="Cat">',
    "text/plain": "",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "![Cat](https://cdn.example.com/cat.png)",
    ),
  );
});

test("embeds: without the embeds prop an embed is a link and a pasted video link stays a link", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: YOUTUBE,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await vi.waitFor(() =>
    expect(
      box.element().querySelector('[data-slot="markdown-embed-link"] a'),
    ).not.toBeNull(),
  );
  expect(box.element().querySelector("button")).toBeNull();
  await box.click();
  await userEvent.keyboard(`${END}{Enter}`);
  pasteData(box.element(), {
    "text/plain": "https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      `${YOUTUBE}\n\n[https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184](https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184)`,
    ),
  );
});

/* --- B.2: host slash items, emoji, find & replace, block menu, stats --------------------------- */

const suggestionMenu = (name: string) =>
  document.querySelector(
    `[data-slot="suggestion-menu"][data-menu="text-edit-${name}"]`,
  );

test("slashActions: a host item follows the built-in ones, inserts a mention chip; a disabled one says why and does nothing", async () => {
  const onSelect = vi.fn(
    (ctx: {
      insertMention: (m: { kind: string; id: string; label: string }) => void;
    }) => ctx.insertMention({ kind: "page", id: "p9", label: "Launch plan" }),
  );
  const blocked = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    onValueChange,
    slashActions: [
      {
        id: "page",
        label: "Page",
        keywords: ["subpage", "child"],
        icon: <span data-testid="page-glyph" />,
        onSelect,
      },
      {
        id: "locked",
        label: "Locked page",
        icon: <span />,
        disabled: true,
        disabledReason: "Archived pages can't hold pages",
        onSelect: blocked,
      },
    ],
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/");
  await vi.waitFor(() => expect(suggestionMenu("slash")).not.toBeNull());
  const labels = [
    ...suggestionMenu("slash")!.querySelectorAll(
      '[data-slot="suggestion-menu-label"]',
    ),
  ].map((label) => label.textContent);
  // After every built-in item.
  expect(labels.slice(-2)).toEqual(["Page", "Locked page"]);
  expect(
    suggestionMenu("slash")!.querySelector('[data-testid="page-glyph"]'),
  ).not.toBeNull();

  // The disabled one: muted, its reason shown, Enter does nothing.
  await userEvent.keyboard("locked");
  await vi.waitFor(() =>
    expect(suggestionMenu("slash")?.textContent).toContain(
      "Archived pages can't hold pages",
    ),
  );
  expect(
    suggestionMenu("slash")!.querySelector('[aria-disabled="true"]'),
  ).not.toBeNull();
  await userEvent.keyboard("{Enter}");
  expect(blocked).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  await userEvent.keyboard(
    "{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}",
  );

  // A keyword finds it; choosing it drops the typed query and inserts the chip.
  await userEvent.keyboard("/subpage");
  await vi.waitFor(() =>
    expect(suggestionMenu("slash")?.textContent).toContain("Page"),
  );
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("[@Launch plan](mention://page/p9)"),
  );
});

test("emoji: `:` and two letters after a space opens the menu and inserts the character; 10:30 and Note: never do", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ emoji: true, onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("10:30 Note:x ");
  // No menu: the colon follows a digit or a letter.
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(suggestionMenu("emoji")).toBeNull();
  await userEvent.keyboard(":smi");
  await vi.waitFor(() =>
    expect(suggestionMenu("emoji")?.textContent).toContain("grinning face"),
  );
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("10:30 Note:x 😀"),
  );
  expect(suggestionMenu("emoji")).toBeNull();
});

test("find & replace: ⌘F opens the bar, Enter steps the matches, Replace all is one undo step, Esc closes", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "alpha beta\n\nalpha gamma",
    onValueChange,
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  const bar = screen.getByRole("search", { name: "Find in page" });
  await expect.element(bar).toBeInTheDocument();
  await userEvent.keyboard("alpha");
  await vi.waitFor(() => expect(bar.element().textContent).toMatch(/of 2/));
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(bar.element().textContent).toMatch(/\d of 2/));
  await expectNoA11yViolations(bar.element() as HTMLElement, [
    "color-contrast",
  ]);

  // DOM clicks: the bar re-renders on every transaction, which a pointer click's stability wait
  // can read as movement on a slow runner.
  (
    screen
      .getByRole("button", { name: "Replace", exact: true })
      .element() as HTMLElement
  ).click();
  await screen.getByRole("textbox", { name: "Replace with" }).fill("omega");
  await vi.waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Replace all" }).element(),
    ).not.toBeDisabled(),
  );
  (
    screen.getByRole("button", { name: "Replace all" }).element() as HTMLElement
  ).click();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("omega beta\n\nomega gamma"),
  );

  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector('[data-slot="text-edit-find"]')).toBeNull(),
  );
  // Esc gives the caret back to the editor: undo only once it is there.
  const editor = screen.getByRole("textbox", { name: "Notes" }).element();
  await vi.waitFor(() => expect(document.activeElement).toBe(editor));
  // One undo step brings both back.
  await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("alpha beta\n\nalpha gamma"),
  );
});

test("block menu: ⇧F10 opens it for the caret's block; Duplicate copies the block below", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "# Plan\n\nBody",
    onValueChange,
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard(END);
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  // Named by its trigger, the handle.
  const menu = screen.getByRole("menu", { name: "Block options" });
  await expect.element(menu).toBeInTheDocument();
  await expect
    .element(screen.getByRole("menuitem", { name: /Move down/ }))
    .toHaveAttribute("aria-disabled", "true");
  await screen.getByRole("menuitem", { name: /Duplicate/ }).click();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("# Plan\n\nBody\n\nBody"),
  );
});

test("getStats: words, characters, reading time and the selection's words", async () => {
  const handle = React.createRef<TextEditHandle>();
  const onStatsChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "One two three\n\nfour five",
    handleRef: handle,
    onStatsChange,
  });
  await vi.waitFor(() =>
    expect(onStatsChange).toHaveBeenCalledWith({
      words: 5,
      characters: 22,
      readingMinutes: 1,
      selectedWords: 0,
    }),
  );
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
  expect(handle.current?.getStats()?.selectedWords).toBe(5);
});

test("collaboration: toggleState keeps a viewer's folded toggles (read on load, told on a chevron click)", async () => {
  const closed = new Set<string>();
  const onToggle = vi.fn((id: string, open: boolean) => {
    if (open) closed.delete(id);
    else closed.add(id);
  });
  const isOpen = vi.fn((id: string, fallback: boolean) =>
    closed.has(id) ? false : fallback,
  );
  const { screen } = await twoEditors(
    "<details open><summary>Title</summary>\n\nBody\n\n</details>",
    { b: { readOnly: true, toggleState: { isOpen, onToggle } } },
  );
  const viewerToggle = () =>
    screen.container.querySelectorAll<HTMLElement>('[data-slot="toggle"]')[1]!;
  await vi.waitFor(() => expect(viewerToggle()).toHaveAttribute("data-open"));
  expect(isOpen).toHaveBeenCalled();
  await userEvent.click(
    viewerToggle().querySelector<HTMLElement>('[data-slot="toggle-chevron"]')!,
  );
  await vi.waitFor(() =>
    expect(onToggle).toHaveBeenCalledWith(expect.any(String), false),
  );
  expect(viewerToggle()).not.toHaveAttribute("data-open");
});

test("find: ⌘F with words selected searches for them, and typing replaces the term", async () => {
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "alpha beta gamma",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  selectTail(box.element().querySelector("p")!, 5);
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  const field = screen.getByRole("textbox", { name: "Find" });
  await expect.element(field).toHaveValue("gamma");
  // The term is selected a frame after the bar opens.
  await vi.waitFor(() => {
    const input = field.element() as HTMLInputElement;
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 5]);
  });
  await userEvent.keyboard("beta");
  await expect.element(field).toHaveValue("beta");
});

test("slashActions: insertContent puts a block at the caret", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    onValueChange,
    slashActions: [
      {
        id: "quote",
        label: "Saved quote",
        icon: <span />,
        onSelect: ({ insertContent }) =>
          insertContent({
            type: "blockquote",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Hi" }] },
            ],
          }),
      },
    ],
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/saved");
  await vi.waitFor(() =>
    expect(suggestionMenu("slash")?.textContent).toContain("Saved quote"),
  );
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(lastValue(onValueChange)).toBe("> Hi"));
});

const TASK_ROWS =
  "- [ ] [@Order glass](mention://task/t1) — To do\n- [x] [@Fix scaffolding](mention://task/t2) — Done";
const TASK_LIST = `:::tasks{id="lb_9f2c" v="1" status="open" x-new="kept"}\n${TASK_ROWS}\n:::`;

test("taskQuery: renderTaskQuery draws the live list; it is an atom and its Markdown round-trips byte for byte", async () => {
  const draw = vi.fn(() => <p>Live list</p>);
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: `Intro\n\n${TASK_LIST}`,
    renderTaskQuery: draw,
    onValueChange,
  });
  await expect.element(screen.getByText("Live list")).toBeInTheDocument();
  expect(draw).toHaveBeenLastCalledWith({
    blockId: "lb_9f2c",
    query: { v: "1", status: "open", "x-new": "kept" },
    snapshot: TASK_ROWS,
    editable: true,
    setQuery: expect.any(Function),
  });
  const view = screen.container.querySelector(
    '[data-slot="text-edit-task-query"]',
  );
  expect(view).toHaveAttribute("contenteditable", "false");
  expect(view).toHaveAttribute("data-drag-handle", "");
  const spec = textEditSchema().nodes.taskQuery!.spec;
  expect([spec.atom, spec.selectable, spec.draggable]).toEqual([
    true,
    true,
    true,
  ]);
  const box = screen.getByRole("textbox", { name: "Notes" });
  const editor = editorOf(box.element());
  editor.commands.setTextSelection(6);
  editor.commands.insertContent("!");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`Intro!\n\n${TASK_LIST}`),
  );
});

test("taskQuery: a host's live block kind reads with its kind, renderLiveBlock draws it, and both kinds round-trip byte for byte", async () => {
  const TABLE = ':::table{id="b1" view="v1"}\n:::';
  const draw = vi.fn((kind: string) => <p>Live {kind}</p>);
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: `Intro\n\n${TABLE}\n\n${TASK_LIST}`,
    liveBlockKinds: ["tasks", "table"],
    renderLiveBlock: draw,
    onValueChange,
  });
  await expect.element(screen.getByText("Live table")).toBeInTheDocument();
  await expect.element(screen.getByText("Live tasks")).toBeInTheDocument();
  expect(draw).toHaveBeenCalledWith(
    "table",
    expect.objectContaining({ blockId: "b1", query: { view: "v1" } }),
  );
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  const kinds: unknown[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "taskQuery") kinds.push(node.attrs.kind);
  });
  // A task list stores no kind (`null`), so its shared state is what it always was.
  expect(kinds).toEqual(["table", null]);
  // A task list's HTML is unchanged: only another kind writes `data-kind`.
  expect(editor.getHTML()).toContain('data-kind="table"');
  expect(editor.getHTML().match(/data-kind="tasks"/g)).toBeNull();
  editor.commands.setTextSelection(6);
  editor.commands.insertContent("!");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`Intro!\n\n${TABLE}\n\n${TASK_LIST}`),
  );
});

test("taskQuery: a task list's shared state carries no kind; another kind's does", async () => {
  const attrsOf = (markdown: string, kinds?: string[]) => {
    const doc = markdownToDoc(markdown, kinds ? { liveBlockKinds: kinds } : {});
    const y = new Y.Doc();
    const fragment = y.getXmlFragment("default");
    prosemirrorToYXmlFragment(doc, fragment);
    const element = fragment
      .toArray()
      .find(
        (node): node is Y.XmlElement =>
          node instanceof Y.XmlElement && node.nodeName === "taskQuery",
      )!;
    return element.getAttributes();
  };
  expect(attrsOf(TASK_LIST)).not.toHaveProperty("kind");
  expect(attrsOf(':::table{id="b1"}\n:::', ["tasks", "table"])).toMatchObject({
    kind: "table",
  });
});

test("taskQuery: a name the host does not read stays text, and a paragraph opening like one is escaped", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: ':::table{id="b1"}',
    onValueChange,
  });
  expect(
    screen.container.querySelector('[data-slot="text-edit-task-query"]'),
  ).toBeNull();
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as Editor;
  editor.commands.setTextSelection(editor.state.doc.content.size - 1);
  editor.commands.insertContent("!");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe('\\:::table{id="b1"}!'),
  );
});

test("taskQuery: setQuery rewrites the list's filter as one local edit; read views get none", async () => {
  let set: ((query: Record<string, string>) => void) | undefined;
  const onValueChange = vi.fn();
  await markdownEditor({
    defaultValue: TASK_LIST,
    onValueChange,
    renderTaskQuery: (props) => {
      set = props.setQuery;
      return <p>Live list</p>;
    },
  });
  expect(set).toBeTypeOf("function");
  set!({ v: "1", status: "done", assignee: "me", Bad: "x", "x-note": "a\nb" });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      `:::tasks{id="lb_9f2c" v="1" status="done" assignee="me" x-note="a b"}\n${TASK_ROWS}\n:::`,
    ),
  );
  const read = vi.fn((_props: { setQuery?: unknown }) => <p>Read</p>);
  const view = await render(
    <TextEdit
      format="markdown"
      aria-label="Read"
      readOnly
      defaultValue={TASK_LIST}
      renderTaskQuery={read}
    />,
  );
  await expect.element(view.getByText("Read")).toBeInTheDocument();
  expect(read.mock.calls.every(([props]) => props.setQuery === undefined)).toBe(
    true,
  );
});

test("node views follow the editor's editability: checkboxes and live task lists redraw when it changes", async () => {
  const seen: boolean[] = [];
  const screen = await markdownEditor({
    defaultValue: `- [ ] One\n\n${TASK_LIST}`,
    renderTaskQuery: ({ editable }) => {
      seen.push(editable);
      return <p>Live list</p>;
    },
  });
  const editor = editorOf(
    screen.getByRole("textbox", { name: "Notes" }).element(),
  ) as unknown as { setEditable: (on: boolean, emitUpdate?: boolean) => void };
  const box = () => screen.container.querySelector('[role="checkbox"]')!;
  await vi.waitFor(() => expect(box()).not.toHaveAttribute("data-disabled"));
  editor.setEditable(false);
  await vi.waitFor(() => expect(box()).toHaveAttribute("data-disabled"));
  expect(seen.at(-1)).toBe(false);
  editor.setEditable(true);
  await vi.waitFor(() => expect(box()).not.toHaveAttribute("data-disabled"));
  expect(seen.at(-1)).toBe(true);
  // Silent changes (no `update` event, no transaction) are followed too.
  editor.setEditable(false, false);
  await vi.waitFor(() => expect(box()).toHaveAttribute("data-disabled"));
  expect(seen.at(-1)).toBe(false);
  editor.setEditable(true, false);
  await vi.waitFor(() => expect(box()).not.toHaveAttribute("data-disabled"));
  expect(seen.at(-1)).toBe(true);
});

test("taskQuery: a new renderTaskQuery redraws the list (no stale rows after a data or access change)", async () => {
  const screen = await markdownEditor({
    defaultValue: TASK_LIST,
    renderTaskQuery: () => <p>Old rows</p>,
  });
  await expect.element(screen.getByText("Old rows")).toBeInTheDocument();
  await screen.rerender(
    <>
      <TextEdit
        format="markdown"
        aria-label="Notes"
        defaultValue={TASK_LIST}
        renderTaskQuery={() => <p>New rows</p>}
      />
      <button type="button">Outside</button>
    </>,
  );
  await expect.element(screen.getByText("New rows")).toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("Old rows");
});

test("taskQuery: without renderTaskQuery the snapshot shows as a quiet list; the read view draws it too", async () => {
  const screen = await markdownEditor({ defaultValue: TASK_LIST });
  const card = screen.container.querySelector(
    '[data-slot="text-edit-task-query"] [data-slot="markdown-task-list"]',
  );
  expect(card?.textContent).toContain("Task list");
  expect(card?.textContent).toContain("Order glass");
  expect(card?.textContent).toContain("Done");
  const draw = vi.fn(() => <p>Live read</p>);
  const read = await render(
    <TextEdit
      format="markdown"
      aria-label="Read"
      readOnly
      defaultValue={TASK_LIST}
      renderTaskQuery={draw}
    />,
  );
  await expect.element(read.getByText("Live read")).toBeInTheDocument();
  expect(draw).toHaveBeenCalledWith(
    expect.objectContaining({ blockId: "lb_9f2c", editable: false }),
  );
});

test("taskQuery: a JSON insert without a blockId lands; Markdown writes it without an id", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ defaultValue: "Intro", onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  const editor = editorOf(box.element()) as unknown as {
    commands: {
      setTextSelection: (at: number) => boolean;
      insertContent: (content: unknown) => boolean;
    };
  };
  editor.commands.setTextSelection(6);
  editor.commands.insertContent({
    type: "taskQuery",
    attrs: { query: { v: "1", status: "open" }, snapshot: "" },
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      'Intro\n\n:::tasks{v="1" status="open"}\n:::',
    ),
  );
  await expect
    .element(screen.getByText("No matching tasks"))
    .toBeInTheDocument();
});

/* --- adversarial review fixes (20-10-2026) ----------------------------------------------------*/

/** A Yjs paragraph holding `text`, as a collaborator's client would add it. */
function yParagraph(text: string) {
  const paragraph = new Y.XmlElement("paragraph");
  paragraph.insert(0, [new Y.XmlText(text)]);
  return paragraph;
}

/** The shared document's top-level blocks, as text. */
const sharedBlocks = (doc: Y.Doc) => {
  const blocks: string[] = [];
  yXmlFragmentToProseMirrorRootNode(
    doc.getXmlFragment("default"),
    textEditSchema(),
  ).forEach((node) =>
    blocks.push(node.type.name === "image" ? "[image]" : node.textContent),
  );
  return blocks;
};

test("collaboration: a block menu left open acts on its own block after a collaborator adds one before it", async () => {
  const { screen, shared } = await twoEditors("AAA\n\nBBB\n\nCCC");
  const a = screen.getByRole("textbox", { name: "A" });
  await vi.waitFor(() => expect(visibleText(a.element())).toContain("CCC"));
  await userEvent.click(a.element().querySelectorAll("p")[1]!);
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  const remove = screen.getByRole("menuitem", { name: /Delete/ });
  await expect.element(remove).toBeInTheDocument();
  shared.b.getXmlFragment("default").insert(0, [yParagraph("ZZZ")]);
  await vi.waitFor(() => expect(visibleText(a.element())).toContain("ZZZ"));
  (remove.element() as HTMLElement).click();
  await vi.waitFor(() =>
    expect(sharedBlocks(shared.b)).toEqual(["ZZZ", "AAA", "CCC"]),
  );
});

test("collaboration: the block grip acts on the hovered block after a collaborator adds one before it", async () => {
  const { screen, shared } = await twoEditors("AAA\n\nBBB\n\nCCC");
  const a = screen.getByRole("textbox", { name: "A" });
  await vi.waitFor(() => expect(visibleText(a.element())).toContain("CCC"));
  await userEvent.hover(a.element().querySelectorAll("p")[1]!);
  const grip = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-block-handle"]');
  await vi.waitFor(() => expect(grip()).not.toBeNull());
  shared.b.getXmlFragment("default").insert(0, [yParagraph("ZZZ")]);
  await vi.waitFor(() => expect(visibleText(a.element())).toContain("ZZZ"));
  const box = grip()!.getBoundingClientRect();
  pointer("pointerdown", grip()!, box.left + 2, box.top + 2);
  pointer("pointerup", window, box.left + 2, box.top + 2);
  const remove = screen.getByRole("menuitem", { name: /Delete/ });
  await expect.element(remove).toBeInTheDocument();
  (remove.element() as HTMLElement).click();
  await vi.waitFor(() =>
    expect(sharedBlocks(shared.b)).toEqual(["ZZZ", "AAA", "CCC"]),
  );
});

test("collaboration: a row drag across a collaborator's new row moves nothing — never another row", async () => {
  const { toast } = await import("./toast");
  const add = vi.spyOn(toast, "add");
  onTestFinished(() => add.mockRestore());
  const { screen, shared } = await twoEditors(TABLE);
  const a = screen.getByRole("textbox", { name: "A" }).element();
  await vi.waitFor(() => expect(a.querySelectorAll("td")).toHaveLength(4));
  await userEvent.hover(a.querySelectorAll("td")[0]!);
  const grip = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="text-edit-table-grip"][data-axis="row"]',
    );
  await vi.waitFor(() => expect(grip()).not.toBeNull());
  const handle = grip()!;
  const box = handle.getBoundingClientRect();
  pointer("pointerdown", handle, box.left + 4, box.top + 4);
  pointer("pointermove", window, box.left + 20, box.top + 20);
  // A collaborator adds a row "N1" above the dragged row "1".
  const table = shared.b.getXmlFragment("default").get(0) as Y.XmlElement;
  const copy = (table.get(1) as Y.XmlElement).clone();
  shared.b.transact(() => {
    table.insert(1, [copy]);
    const cell = copy.get(0) as Y.XmlElement;
    ((cell.get(0) as Y.XmlElement).get(0) as Y.XmlText).insert(0, "N");
  });
  await vi.waitFor(() => expect(a.textContent).toContain("N1"));
  const lastRow = a.querySelectorAll("tr")[3]!.getBoundingClientRect();
  pointer("pointermove", window, lastRow.left + 4, lastRow.bottom - 2);
  pointer("pointerup", window, lastRow.left + 4, lastRow.bottom - 2);
  await vi.waitFor(() =>
    expect(add).toHaveBeenCalledWith({
      title: "That table changed while you moved it. Try again.",
    }),
  );
  const rows = () =>
    [...a.querySelectorAll("tr")].map((row) => row.cells[0]!.textContent);
  expect(rows()).toEqual(["A", "N1", "1", "3"]);
});

test("image: Replace by Upload keeps the image until the upload lands; a failed upload leaves it", async () => {
  let fail = true;
  const onImageUpload = vi.fn(async () => {
    if (fail) throw new Error("offline");
    return { src: "/api/files/new" };
  });
  const onValueChange = vi.fn();
  const md = `![Old](${PIXEL})\n\nAfter`;
  const screen = await markdownEditor({
    defaultValue: md,
    onImageUpload,
    onValueChange,
  });
  const upload = async () => {
    await screen.getByRole("button", { name: "Replace" }).click();
    const input = await vi.waitFor(() => {
      const found = document.querySelector<HTMLInputElement>(
        '[data-slot="tabs-content"] input[type="file"]',
      );
      expect(found).not.toBeNull();
      return found!;
    });
    await userEvent.upload(input, png());
  };
  await upload();
  await vi.waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 50));
  // The original is still there; the failed upload only shows its own Retry.
  expect(lastValue(onValueChange) ?? md).toBe(md);
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  expect(box.querySelector(`img[src="${PIXEL}"]`)).not.toBeNull();
  fail = false;
  await userEvent.click(box.querySelector(`img[src="${PIXEL}"]`)!);
  await upload();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(
      /^!\[Old\]\(\/api\/files\/new.*\n\nAfter$/,
    ),
  );
  // The picture changed; its alt text stayed.
  expect(lastValue(onValueChange)).not.toContain(PIXEL);
});

test("external images: a pasted image imports in its own place among the pasted blocks", async () => {
  const onExternalImage = vi.fn(async (url: string) => ({
    src: url.endsWith("y.png") ? "/api/files/y" : "/api/files/x",
  }));
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onExternalImage, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html":
      '<p>Alpha</p><img src="https://cdn.example.com/100%.png" alt="X"><img src="https://cdn.example.com/y.png" alt="Y"><p>Beta</p>',
    "text/plain": "Alpha Beta",
  });
  // A name that is not valid percent-encoding still imports.
  await vi.waitFor(() => expect(onExternalImage).toHaveBeenCalledTimes(2));
  // Side by side, they keep their order.
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(
      /^Alpha\n\n!\[X\]\(\/api\/files\/x[^)]*\)\n\n!\[Y\]\(\/api\/files\/y[^)]*\)\n\nBeta$/,
    ),
  );
});

test("external images: every pasted data: image uploads — past the import limit too", async () => {
  const onImageUpload = vi.fn(async () => ({ src: "/api/files/p" }));
  const onExternalImage = vi.fn(async () => ({ src: "/api/files/x" }));
  const screen = await markdownEditor({ onExternalImage, onImageUpload });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  const image = '<img src="data:image/png;base64,iVBORw0KGgo=">';
  pasteData(box.element(), {
    "text/html": `<p>Shots</p>${image.repeat(21)}`,
    "text/plain": "Shots",
  });
  await vi.waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(21));
});

test("find: reopened, the Replace field shows what Replace all would insert (nothing left over)", async () => {
  const { FindAndReplacePluginKey } =
    await import("@tiptap/extension-find-and-replace");
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "alpha beta",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  await expect
    .element(screen.getByRole("search", { name: "Find in page" }))
    .toBeInTheDocument();
  await userEvent.keyboard("alpha");
  (
    screen
      .getByRole("button", { name: "Replace", exact: true })
      .element() as HTMLElement
  ).click();
  await screen.getByRole("textbox", { name: "Replace with" }).fill("omega");
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector('[data-slot="text-edit-find"]')).toBeNull(),
  );
  const editor = editorOf(box.element()) as unknown as Editor;
  expect(FindAndReplacePluginKey.getState(editor.state)?.replaceTerm).toBe("");
  // Esc gives the caret back to the editor: reopen only once it is there.
  await vi.waitFor(() => expect(document.activeElement).toBe(box.element()));
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  const toggle = screen.getByRole("button", { name: "Replace", exact: true });
  await expect.element(toggle).toBeInTheDocument();
  (toggle.element() as HTMLElement).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Replace with" }))
    .toHaveValue("");
});

test("find: Escape closes the bar when focus is back in the text", async () => {
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "alpha beta",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  await userEvent.keyboard("alpha");
  await expect
    .element(screen.getByRole("search", { name: "Find in page" }))
    .toBeInTheDocument();
  await userEvent.click(box.element().querySelector("p")!);
  await vi.waitFor(() => expect(document.activeElement).toBe(box.element()));
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector('[data-slot="text-edit-find"]')).toBeNull(),
  );
});

test("a read-only editor folds a toggle for its reader only — the document never changes", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Read"
      readOnly
      annotations={[]}
      defaultValue={
        "<details open><summary>Title</summary>\n\nBody\n\n</details>"
      }
      onValueChange={onValueChange}
    />,
  );
  const toggle = () =>
    screen.container.querySelector<HTMLElement>(
      '.ProseMirror [data-slot="toggle"]',
    );
  await vi.waitFor(() => expect(toggle()).toHaveAttribute("data-open"));
  const editor = editorOf(toggle()!) as unknown as Editor;
  const before = editor.state.doc;
  await userEvent.click(
    toggle()!.querySelector<HTMLElement>('[data-slot="toggle-chevron"]')!,
  );
  await vi.waitFor(() => expect(toggle()).not.toHaveAttribute("data-open"));
  expect(editor.state.doc).toBe(before);
  expect(onValueChange).not.toHaveBeenCalled();
});

test("collaboration: files picked while a collaborator adds a block before the caret land after the caret's block", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const handleRef = React.createRef<TextEditHandle>();
  const { screen, shared } = await twoEditors("alpha\n\nbeta", {
    a: { onImageUpload, handleRef },
  });
  const a = screen.getByRole("textbox", { name: "A" });
  await vi.waitFor(() => expect(visibleText(a.element())).toContain("beta"));
  await userEvent.click(a.element().querySelector("p")!);
  await userEvent.keyboard("{End}");
  const root = a.element().closest('[data-slot="text-edit"]')!;
  const input = root.querySelector<HTMLInputElement>('input[type="file"]')!;
  // The dialog never opens in a test: the input is what accepts the files.
  const open = vi.spyOn(input, "click").mockImplementation(() => {});
  onTestFinished(() => open.mockRestore());
  handleRef.current!.pickFiles();
  shared.b
    .getXmlFragment("default")
    .insert(0, [yParagraph("a much longer first block")]);
  await vi.waitFor(() =>
    expect(visibleText(a.element())).toContain("a much longer"),
  );
  await userEvent.upload(input, png());
  await vi.waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
  land({ src: "/api/files/f1" });
  await vi.waitFor(() =>
    expect(sharedBlocks(shared.b)).toEqual([
      "a much longer first block",
      "alpha",
      "[image]",
      "beta",
    ]),
  );
});

test("flush() waits for files handed to uploadFiles before the editor was in", async () => {
  let land!: (result: { src: string }) => void;
  const onImageUpload = vi.fn(
    () =>
      new Promise<{ src: string }>((resolve) => {
        land = resolve;
      }),
  );
  const onValueChange = vi.fn();
  let flushed = false;
  let flushing: Promise<void> | undefined;
  function Harness() {
    const handle = React.useRef<TextEditHandle>(null);
    // Runs right after the handle is attached, before the editor has mounted.
    React.useLayoutEffect(() => {
      handle.current!.uploadFiles([png()]);
      flushing = handle.current!.flush().then(() => {
        flushed = true;
      });
    }, []);
    return (
      <TextEdit
        format="markdown"
        aria-label="Notes"
        handleRef={handle}
        onImageUpload={onImageUpload}
        onValueChange={onValueChange}
      />
    );
  }
  await render(<Harness />);
  await vi.waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(flushed).toBe(false);
  land({ src: "/api/files/f1" });
  await flushing;
  expect(lastValue(onValueChange)).toContain("/api/files/f1");
});

test("typing, Enter, Backspace and a paste on the read view while the editor loads all reach the editor", async () => {
  const onValueChange = vi.fn();
  const onImageUpload = vi.fn(() => new Promise<{ src: string }>(() => {}));
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Summary"
      defaultValue="Ship it [[1]]"
      citation={cite}
      onValueChange={onValueChange}
      onImageUpload={onImageUpload}
    />,
  );
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  const view = readView(screen)!;
  const input = (inputType: string, data?: string) =>
    view.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType,
        data: data ?? null,
        bubbles: true,
        cancelable: true,
      }),
    );
  input("insertText", "ab");
  input("insertParagraph");
  input("insertText", "c");
  input("deleteContentBackward");
  pasteData(view, { "text/plain": "d " });
  // A copied image: its HTML and its file — the file uploads, as a paste into the editor does.
  const image = new DataTransfer();
  image.setData("text/html", '<img src="https://cdn.example.com/shot.png">');
  image.items.add(png());
  view.dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: image,
      bubbles: true,
      cancelable: true,
    }),
  );
  view.focus();
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(/^ab\n\nd Ship it/),
  );
  await vi.waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
});

test("a read-only document opens Find from the handle — without Replace", async () => {
  const handle = React.createRef<TextEditHandle>();
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Summary"
      defaultValue="Ship it [[1]]"
      citation={cite}
      readOnly
      findReplace
      handleRef={handle}
    />,
  );
  handle.current!.openFind();
  await expect
    .element(screen.getByRole("search", { name: "Find in page" }))
    .toBeInTheDocument();
  expect(
    document.querySelector(
      '[data-slot="text-edit-find"] [aria-label="Replace"]',
    ),
  ).toBeNull();
});

test("the handle's focus() follows editability turned on after mounting", async () => {
  const handle = React.createRef<TextEditHandle>();
  function Harness({ readOnly }: { readOnly: boolean }) {
    return (
      <TextEdit
        format="markdown"
        aria-label="Summary"
        defaultValue="Ship it [[1]]"
        citation={cite}
        readOnly={readOnly}
        handleRef={handle}
      />
    );
  }
  const screen = await render(<Harness readOnly />);
  await screen.rerender(<Harness readOnly={false} />);
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(visibleEditor(screen)).toBeNull();
  handle.current!.focus();
  await vi.waitFor(() => expect(visibleEditor(screen)).not.toBeNull());
});

test("read-only: comments, heading links and task lists show without the editor", async () => {
  onTestFinished(() => window.getSelection()?.removeAllRanges());
  const onCreateAnnotation = vi.fn();
  const screen = await render(
    <TextEdit
      format="markdown"
      aria-label="Read"
      readOnly
      defaultValue={"# Plan\n\nShip the glass order"}
      onCreateAnnotation={onCreateAnnotation}
      headingLinkHref={(anchor) => `#${anchor.slug}`}
    />,
  );
  await expect
    .element(screen.getByText("Ship the glass order"))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="markdown-heading-link"]'),
  ).not.toBeNull();
  selectText(screen.getByText("Ship the glass order").element(), "glass");
  const comment = await vi.waitFor(() => {
    const button = document.querySelector<HTMLButtonElement>(
      '[data-slot="markdown-selection-menu"] button',
    );
    expect(button).not.toBeNull();
    return button!;
  });
  comment.click();
  expect(onCreateAnnotation).toHaveBeenCalledWith(
    expect.objectContaining({ quote: "glass" }),
  );

  // An HTML document holding only a live task list is not empty.
  const { DOMSerializer } = await import("@tiptap/pm/model");
  const holder = document.createElement("div");
  holder.append(
    DOMSerializer.fromSchema(textEditSchema()).serializeFragment(
      markdownToDoc(TASK_LIST).content,
    ),
  );
  const draw = vi.fn(() => <p>Live list</p>);
  const html = await render(
    <TextEdit
      aria-label="Html"
      readOnly
      defaultValue={holder.innerHTML}
      renderTaskQuery={draw}
    />,
  );
  await expect.element(html.getByText("Live list")).toBeInTheDocument();
});

test("ImageViewerScope: turned off, its images are plain pictures again", async () => {
  const { ImageViewerScope } = await import("./text-edit");
  const { MarkdownView } = await import("./markdown-view");
  function Harness({ disabled }: { disabled: boolean }) {
    return (
      <ImageViewerScope disabled={disabled}>
        <MarkdownView>{"![Chart](/chart.png)"}</MarkdownView>
      </ImageViewerScope>
    );
  }
  const screen = await render(<Harness disabled={false} />);
  const image = () => screen.container.querySelector("img")!;
  await vi.waitFor(() => expect(image()).toHaveAttribute("role", "button"));
  await screen.rerender(<Harness disabled />);
  await vi.waitFor(() => expect(image()).not.toHaveAttribute("role"));
  expect(image()).not.toHaveAttribute("tabindex");
  expect(image()).not.toHaveAttribute("aria-label");
});

test("uploads: the signal says why it aborted — placeholder deleted, or editor unmounted", async () => {
  const signals: AbortSignal[] = [];
  let land: ((result: { src: string }) => void) | undefined;
  const onImageUpload = vi.fn(
    (_file: File, { signal }: { signal: AbortSignal }) => {
      signals.push(signal);
      return new Promise<{ src: string }>((resolve) => {
        land = resolve;
      });
    },
  );
  const screen = await markdownEditor({
    defaultValue: "Intro",
    onImageUpload,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(END);
  pasteFiles(box.element(), [png()]);
  await vi.waitFor(() => expect(signals).toHaveLength(1));
  await vi.waitFor(() =>
    expect(box.element().querySelector("[data-uploading]")).not.toBeNull(),
  );
  // The person deletes the text the placeholder sat in.
  await userEvent.keyboard(`{${MOD}>}a{/${MOD}}{Backspace}`);
  await vi.waitFor(() => expect(signals[0]!.aborted).toBe(true));
  expect(signals[0]!.reason).toBe(TEXT_EDIT_UPLOAD_ABORT.removed);

  await userEvent.keyboard("Again");
  // One that lands is never aborted: its placeholder giving way is not a removal.
  pasteFiles(box.element(), [png()]);
  await vi.waitFor(() => expect(signals).toHaveLength(2));
  land!({ src: "/api/files/landed" });
  await vi.waitFor(() =>
    expect(
      box.element().querySelector('img[src="/api/files/landed"]'),
    ).not.toBeNull(),
  );
  expect(signals[1]!.aborted).toBe(false);

  pasteFiles(box.element(), [png()]);
  await vi.waitFor(() => expect(signals).toHaveLength(3));
  expect(signals[2]!.aborted).toBe(false);
  await screen.unmount();
  expect(signals[2]!.aborted).toBe(true);
  expect(signals[2]!.reason).toBe(TEXT_EDIT_UPLOAD_ABORT.unmounted);
});

/* --- page QA (21-10-2026) ---------------------------------------------------------------------*/

test("block menu: after Turn into, the grip still shows on the next hovered block", async () => {
  const screen = await markdownEditor({ defaultValue: "One\n\nTwo\n\nThree" });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await screen.getByRole("menuitem", { name: /Turn into/ }).click();
  await screen.getByRole("menuitemcheckbox", { name: "Heading 1" }).click();
  await vi.waitFor(() =>
    expect(box.element().querySelector("h1")?.textContent).toBe("One"),
  );
  await vi.waitFor(() =>
    expect(document.querySelector("[data-text-edit-menu]")).toBeNull(),
  );
  await userEvent.hover(box.element().querySelectorAll("p")[1]!);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-block-handle"]'),
    ).not.toBeNull(),
  );
  // And the keyboard opens the menu again (⌘/ as ⇧F10).
  await userEvent.click(box.element().querySelectorAll("p")[1]!);
  await userEvent.keyboard(`{${MOD}>}/{/${MOD}}`);
  await expect
    .element(screen.getByRole("menu", { name: "Block options" }))
    .toBeInTheDocument();
});

test("block menu: Copy as Markdown confirms with a toast", async () => {
  const { toast } = await import("./toast");
  const add = vi.spyOn(toast, "add");
  onTestFinished(() => add.mockRestore());
  const write = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
  onTestFinished(() => write.mockRestore());
  const screen = await markdownEditor({ defaultValue: "**Bold** words" });
  await userEvent.click(
    screen
      .getByRole("textbox", { name: "Notes" })
      .element()
      .querySelector("p")!,
  );
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await screen.getByRole("menuitem", { name: /Copy as Markdown/ }).click();
  await vi.waitFor(() =>
    expect(add).toHaveBeenCalledWith({ title: "Copied as Markdown" }),
  );
  expect(write).toHaveBeenCalledWith("**Bold** words");
});

test("⌘K refuses text that is not a link, inline, and keeps the panel open", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Visit",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  selectText(box.element(), "Visit");
  await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
  const field = screen.getByRole("textbox", { name: "Link URL" });
  await field.fill("not a url at all");
  await userEvent.keyboard("{Enter}");
  const alert = await vi.waitFor(() => {
    const found = document.querySelector(
      '[data-slot="text-edit-link"] [role="alert"]',
    );
    expect(found).not.toBeNull();
    return found!;
  });
  expect(alert.textContent).toMatch(/isn't a link/);
  // Another site dressed as a path is refused too.
  for (const sneaky of [
    "/\\evil.example/x",
    "//evil.example",
    "javascript:alert(1)",
  ]) {
    await field.fill(sneaky);
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-slot="text-edit-link"] [role="alert"]'),
      ).not.toBeNull(),
    );
  }
  await expect.element(field).toHaveAttribute("aria-invalid", "true");
  expect(lastValue(onValueChange) ?? "Visit").toBe("Visit");
  // A bare domain, an email and a path are links.
  await field.fill("example.com/docs");
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe("[Visit](https://example.com/docs)"),
  );
});

test("image: Replace by Link keeps the alt text and caption", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: `![A mountain](${PIXEL} "Sunrise over the ridge")\n\nAfter`,
    onValueChange,
    onImageUpload: async () => ({ src: "/api/files/unused" }),
  });
  await screen.getByRole("button", { name: "Replace" }).click();
  // Choosing the Link tab puts the caret in its field.
  const tab = await vi.waitFor(() => {
    const found = [
      ...document.querySelectorAll<HTMLElement>('[role="tab"]'),
    ].find((each) => each.textContent === "Link");
    expect(found).toBeDefined();
    return found!;
  });
  await userEvent.click(tab);
  await vi.waitFor(() =>
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Image URL",
    ),
  );
  await userEvent.keyboard("/files/new.png{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toMatch(
      /^!\[A mountain\]\(\/files\/new\.png "Sunrise over the ridge"\)\n\nAfter$/,
    ),
  );
});

test("collaboration: a block menu whose block a collaborator deletes closes, and the grip comes back", async () => {
  const { screen, shared } = await twoEditors("AAA\n\nBBB\n\nCCC");
  const a = screen.getByRole("textbox", { name: "A" });
  await vi.waitFor(() => expect(visibleText(a.element())).toContain("CCC"));
  await userEvent.click(a.element().querySelectorAll("p")[1]!);
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await expect
    .element(screen.getByRole("menu", { name: "Block options" }))
    .toBeInTheDocument();
  shared.b.getXmlFragment("default").delete(1, 1);
  await vi.waitFor(() => expect(visibleText(a.element())).not.toContain("BBB"));
  await vi.waitFor(() =>
    expect(document.querySelector("[data-text-edit-menu]")).toBeNull(),
  );
  await userEvent.hover(a.element().querySelectorAll("p")[1]!);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-block-handle"]'),
    ).not.toBeNull(),
  );
});

/* --- page QA, round 2 (21-10-2026) -------------------------------------------------------------*/

test("paste from Notion: a callout whose icon is a lone emoji element keeps no stray emoji line, and 💡 reads as a tip", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html":
      '<figure class="callout"><div>💡</div><div>Notion callout text</div></figure><figure class="callout"><div>⚠️</div><div>Mind the gap</div></figure>',
    "text/plain": "Notion callout text\nMind the gap",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "> [!TIP]\n> Notion callout text\n\n> [!WARNING]\n> Mind the gap",
    ),
  );
});

test("find: stepping onto a match shows no selection toolbar over the find bar", async () => {
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "alpha beta alpha",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  await expect
    .element(screen.getByRole("search", { name: "Find in page" }))
    .toBeInTheDocument();
  await userEvent.keyboard("alpha");
  // With Replace open, step with the bar's own Next button (focus leaves the field).
  (
    screen
      .getByRole("button", { name: "Replace", exact: true })
      .element() as HTMLElement
  ).click();
  await userEvent.click(screen.getByRole("button", { name: "Next match" }));
  await userEvent.click(screen.getByRole("button", { name: "Next match" }));
  await vi.waitFor(() =>
    expect(
      screen.getByRole("search", { name: "Find in page" }).element()
        .textContent,
    ).toMatch(/\d of 2/),
  );
  // ⌘G from the text steps too, the editor focused.
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(`{${MOD}>}g{/${MOD}}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(bubble()).toBeNull();
});

test('find: a regular expression that doesn\'t compile says so, not "No results"', async () => {
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "apple pie",
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  const bar = screen.getByRole("search", { name: "Find in page" });
  await expect.element(bar).toBeInTheDocument();
  (
    screen
      .getByRole("button", { name: "Regular expression" })
      .element() as HTMLElement
  ).click();
  await userEvent.keyboard("app(le");
  await vi.waitFor(() =>
    expect(bar.element().textContent).toMatch(/Invalid pattern/),
  );
  expect(
    bar.element().querySelector("input")?.getAttribute("aria-invalid"),
  ).toBe("true");
});

test("embeds: inserting a video link puts the caret on a line after the embed — typing never replaces it", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Intro",
    embeds: EMBED_PROVIDERS,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END}{Enter}/youtube{Enter}`);
  const videoField = await vi.waitFor(() => {
    const field = document.querySelector<HTMLInputElement>(
      '[aria-label="Video URL"]',
    );
    expect(field).not.toBeNull();
    return field!;
  });
  // Typed into the field itself: its focus arrives a frame after it shows.
  await userEvent.type(videoField, `${YOUTUBE}{Enter}`);
  await vi.waitFor(() =>
    expect(
      box.element().querySelector('[data-slot="markdown-embed"]'),
    ).not.toBeNull(),
  );
  // The panel hands focus back to the text before anything is typed.
  await vi.waitFor(() => expect(document.activeElement).toBe(box.element()));
  await userEvent.keyboard("typed after");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(`Intro\n\n${YOUTUBE}\n\ntyped after`),
  );
});

test("paste from Notion: an emoji beside an image in a callout's first line is content, never removed as its icon", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  pasteData(box.element(), {
    "text/html":
      '<aside><p>💡<img src="/evidence.png" alt="Evidence"></p><p>Details</p></aside><aside><a href="/reference">💡</a><p>More</p></aside>',
    "text/plain": "Details",
  });
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toContain("/evidence.png"),
  );
  expect(lastValue(onValueChange)).toContain("Details");
  // A linked emoji is a link, kept.
  expect(lastValue(onValueChange)).toContain("/reference");
});

test("find: on a match, ⌘K still opens the link panel", async () => {
  const screen = await markdownEditor({
    findReplace: true,
    defaultValue: "alpha beta",
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
  await expect
    .element(screen.getByRole("search", { name: "Find in page" }))
    .toBeInTheDocument();
  await userEvent.keyboard("alpha");
  await userEvent.click(box.element().querySelector("p")!);
  await userEvent.keyboard(`{${MOD}>}g{/${MOD}}`);
  await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
  await expect
    .element(screen.getByRole("textbox", { name: "Link URL" }))
    .toBeInTheDocument();
});

test("image: inserted by link into an empty list item, the caret moves past it — typing never replaces it", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "- one",
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END}{Enter}/image{Enter}`);
  const imageField = await vi.waitFor(() => {
    const field = document.querySelector<HTMLInputElement>(
      '[aria-label="Image URL"]',
    );
    expect(field).not.toBeNull();
    return field!;
  });
  await userEvent.type(imageField, "/files/pic.png{Enter}");
  await vi.waitFor(() =>
    expect(
      box.element().querySelector('img[src="/files/pic.png"]'),
    ).not.toBeNull(),
  );
  await vi.waitFor(() => expect(document.activeElement).toBe(box.element()));
  await userEvent.keyboard("after");
  await vi.waitFor(() => expect(lastValue(onValueChange)).toContain("after"));
  expect(lastValue(onValueChange)).toContain("/files/pic.png");
});
