import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { beforeAll, expect, onTestFinished, test, vi } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import {
  preloadTextEdit,
  TextEdit,
  type MentionOption,
  type TextEditHandle,
} from "./text-edit";
import { anchorFromRange } from "../lib/text-anchor";
import { Field as BaseField } from "@base-ui/react/field";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

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
    .element(screen.getByRole("textbox", { name: "Body" }))
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

test("readOnly marks the surface read-only", async () => {
  const screen = await render(
    <TextEdit defaultValue="<p>Fixed</p>" readOnly aria-label="Body" />,
  );
  const box = screen.getByRole("textbox", { name: "Body" });
  await expect.element(box).toHaveAttribute("contenteditable", "false");
  await expect.element(box).toHaveAttribute("aria-readonly", "true");
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
  document.querySelector('[role="listbox"][data-slot="text-edit-slash-menu"]');

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

test("Escape reverts to the value focus arrived with and commits nothing", async () => {
  const onCommit = vi.fn();
  const onRevert = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Keep",
    onCommit,
    onRevert,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  await userEvent.keyboard(`${END} this`);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(onRevert).toHaveBeenCalled());
  expect(box.element().textContent).toBe("Keep");
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
  ["an image with alt text", "![A chart](https://example.com/chart.png)"],
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
  ["an uploaded image", "![](/api/files/f1)"],
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
    await userEvent.click(box);
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
    ...slashMenu()!.querySelectorAll('[data-slot="text-edit-slash-item"]'),
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

test("slash menu Image inserts an image with its alt text", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ onValueChange });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("/image{Enter}");
  await vi.waitFor(() =>
    expect(document.querySelector('[aria-label="Image URL"]')).not.toBeNull(),
  );
  await userEvent.keyboard("example.com/cat.png");
  await userEvent.click(document.querySelector('[aria-label="Alt text"]')!);
  await userEvent.keyboard("A cat{Enter}");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "![A cat](https://example.com/cat.png)",
    ),
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

test("the code block's language selector writes the fence's info string", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "```\nx = 1\n```",
    onValueChange,
  });
  const select = screen.getByRole("combobox", { name: "Code language" });
  await select.selectOptions("python");
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
    '[role="listbox"][data-slot="text-edit-mention-menu"]',
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

test("mentions: @as searches once after the debounce, Enter inserts a chip, Backspace removes it whole, Escape closes", async () => {
  const search = vi.fn(async (): Promise<MentionOption[]> => [
    { kind: "user", id: "u1", label: "Asha Rao" },
    { kind: "page", id: "p1", label: "Assembly notes" },
    { kind: "task", id: "t1", label: "Not offered" },
  ]);
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    mentions: { kinds: ["user", "page"], search },
    onValueChange,
  });
  await screen.getByRole("textbox", { name: "Notes" }).click();
  await userEvent.keyboard("@as");
  await vi.waitFor(() =>
    expect(mentionMenu()?.textContent).toContain("Asha Rao"),
  );
  expect(search).toHaveBeenCalledTimes(1);
  expect(search).toHaveBeenCalledWith("as", {
    signal: expect.any(AbortSignal),
  });
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
  expect(box.querySelector('[data-slot="mention-chip"]')?.textContent).toBe(
    "Asha Rao",
  );

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
    expect(onCommit).toHaveBeenLastCalledWith("Before![](/api/files/f1)"),
  );
  expect(box.element().querySelector("[data-uploading]")).toBeNull();
  expect(box.element().querySelector("img")?.getAttribute("src")).toBe(
    "/api/files/f1",
  );
});

test("uploads: a rejected upload removes its placeholder and calls onUploadError", async () => {
  const error = new Error("Too large");
  const onImageUpload = vi.fn().mockRejectedValue(error);
  const onUploadError = vi.fn();
  const onValueChange = vi.fn();
  const screen = await markdownEditor({
    defaultValue: "Text",
    onImageUpload,
    onUploadError,
    onValueChange,
  });
  const box = screen.getByRole("textbox", { name: "Notes" });
  await box.click();
  const file = png();
  pasteFiles(box.element(), [file]);
  await vi.waitFor(() =>
    expect(onUploadError).toHaveBeenCalledWith(file, error),
  );
  expect(box.element().querySelector("[data-uploading]")).toBeNull();
  expect(box.element().querySelector("img")).toBeNull();
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
