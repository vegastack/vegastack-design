import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { TextEdit } from "./text-edit";
import { Field as BaseField } from "@base-ui/react/field";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

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

function markdownEditor(
  props: Partial<React.ComponentProps<typeof TextEdit>> = {},
) {
  return render(
    <>
      <TextEdit format="markdown" aria-label="Notes" {...props} />
      <button type="button">Outside</button>
    </>,
  );
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
  await userEvent.keyboard(
    `${END}{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}`,
  );
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="text-edit-bubble-menu"]'),
    ).not.toBeNull(),
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
  await userEvent.keyboard(
    `${END}{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}`,
  );
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

test("table menu: insert, move and delete rows and columns", async () => {
  const onValueChange = vi.fn();
  const screen = await markdownEditor({ defaultValue: TABLE, onValueChange });
  const box = screen.getByRole("textbox", { name: "Notes" }).element();
  await userEvent.click(box.querySelectorAll("td")[0]!);
  const menu = () =>
    document.querySelector<HTMLElement>('[data-slot="text-edit-table-menu"]');
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  const press = (label: string) =>
    userEvent.click(
      menu()!.querySelector<HTMLElement>(`[aria-label="${label}"]`)!,
    );
  await press("Move column right");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "| B   | A   |\n| --- | --- |\n| 2   | 1   |\n| 4   | 3   |",
    ),
  );
  await press("Move row down");
  await vi.waitFor(() =>
    expect(lastValue(onValueChange)).toBe(
      "| B   | A   |\n| --- | --- |\n| 4   | 3   |\n| 2   | 1   |",
    ),
  );
  await press("Insert row below");
  await vi.waitFor(() => expect(box.querySelectorAll("tr").length).toBe(4));
  await press("Delete row");
  await vi.waitFor(() => expect(box.querySelectorAll("tr").length).toBe(3));
  await press("Delete column");
  await vi.waitFor(() =>
    expect(box.querySelectorAll("tr")[0]!.children.length).toBe(1),
  );
  expect(lastValue(onValueChange)).toMatch(/^\| [AB] +\|\n\| --- \|/);
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
