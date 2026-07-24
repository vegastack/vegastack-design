import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TextEdit } from "./text-edit";

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

test("renders the formatting toolbar with all command buttons", async () => {
  const screen = await render(<TextEdit aria-label="Body" />);
  await expect
    .element(screen.getByRole("toolbar", { name: "Formatting" }))
    .toBeInTheDocument();
  for (const name of [
    "Bold",
    "Italic",
    "Strikethrough",
    "Heading",
    "Bullet list",
    "Ordered list",
    "Blockquote",
    "Inline code",
  ]) {
    await expect
      .element(screen.getByRole("button", { name }))
      .toBeInTheDocument();
  }
});

test("clicking Bold toggles its active state", async () => {
  // Collapsed cursor: toggling Bold sets ProseMirror's stored mark, so editor.isActive('bold') (which
  // drives aria-pressed) flips true — no text selection required. Avoids the prior flake where a
  // manual DOM Range didn't sync to ProseMirror's internal selection under full-suite load.
  const screen = await render(
    <TextEdit defaultValue="<p>format me</p>" aria-label="Body" />,
  );
  const editable = screen.getByRole("textbox", { name: "Body" });
  await editable.click();
  const bold = screen.getByRole("button", { name: "Bold" });
  await bold.click();
  await expect.element(bold).toHaveAttribute("aria-pressed", "true");
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

test("non-editable mode hides the toolbar and marks the surface read-only", async () => {
  const screen = await render(
    <TextEdit value="<p>read only</p>" editable={false} aria-label="Body" />,
  );
  await expect.element(screen.getByText("read only")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("textbox", { name: "Body" }))
    .toHaveAttribute("contenteditable", "false");
  expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
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
      expect(screen.container.textContent).toContain("Write something…");
    },
    { timeout: 3000 },
  );

  const editable = screen.getByRole("textbox", { name: "Body" });
  await editable.click();
  await editable.fill("not empty");
  await vi.waitFor(() => {
    expect(screen.container.textContent).not.toContain("Write something…");
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
    <TextEdit value="<p>read only</p>" editable={false} aria-label="Body" />,
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
