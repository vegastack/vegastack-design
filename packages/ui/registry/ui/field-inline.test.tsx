import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { FieldInline } from "./field-inline";

/** Stateful host that applies commits to `value`, mirroring real controlled use. */
function Controlled({
  initial,
  onCommit,
  placeholder,
}: {
  initial: string;
  onCommit?: (v: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <FieldInline
      value={value}
      placeholder={placeholder}
      onCommit={(next) => {
        onCommit?.(next);
        setValue(next);
      }}
    />
  );
}

test("renders the value as text in display mode", async () => {
  const screen = await render(
    <FieldInline value="Ada Lovelace" onCommit={() => {}} />,
  );
  await expect.element(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  // No input is rendered until the user enters edit mode.
  expect(screen.container.querySelector("input")).toBeNull();
});

test("renders the placeholder when the value is empty", async () => {
  const screen = await render(
    <FieldInline value="" onCommit={() => {}} placeholder="Add a name…" />,
  );
  await expect.element(screen.getByText("Add a name…")).toBeInTheDocument();
});

test("renders a named fallback button when value and placeholder are empty", async () => {
  const screen = await render(<FieldInline value="" onCommit={() => {}} />);
  const button = screen.getByRole("button", { name: "Edit value" });
  await expect.element(button).toBeInTheDocument();
  await expect.element(screen.getByText("Edit value")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("clicking the value enters edit mode (input appears, focused)", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} placeholder="Name" />,
  );
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  const input = screen.getByRole("textbox");
  await expect.element(input).toBeInTheDocument();
  await expect.element(input).toHaveValue("Ada");
  await expect.element(input).toHaveFocus();
});

test("display and edit modes reserve the same control geometry", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} placeholder="Name" />,
  );
  const display = screen.getByRole("button", { name: "Ada" });
  const displayElement = display.element();
  expect(displayElement.classList.contains("h-(--size-md)")).toBe(true);
  expect(displayElement.classList.contains("border")).toBe(true);
  expect(displayElement.classList.contains("border-transparent")).toBe(true);
  expect(displayElement.classList.contains("px-3")).toBe(true);

  await display.click();
  const textbox = screen.getByRole("textbox");
  await expect.element(textbox).toBeInTheDocument();
  const input = textbox.element();
  expect(input.classList.contains("h-(--size-md)")).toBe(true);
  expect(input.classList.contains("border")).toBe(true);
  expect(input.classList.contains("px-3")).toBe(true);
});

test("borderless display and edit modes both remove control height and padding", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} borderless />,
  );
  const display = screen.getByRole("button", { name: "Ada" });
  const displayElement = display.element();
  expect(displayElement.classList.contains("h-auto")).toBe(true);
  expect(displayElement.classList.contains("px-0")).toBe(true);
  expect(displayElement.classList.contains("py-0")).toBe(true);

  await display.click();
  const textbox = screen.getByRole("textbox");
  await expect.element(textbox).toBeInTheDocument();
  const input = textbox.element();
  expect(input.classList.contains("h-auto")).toBe(true);
  expect(input.classList.contains("px-0")).toBe(true);
  expect(input.classList.contains("py-0")).toBe(true);
});

test("Enter on the focused display control enters edit mode", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} placeholder="Name" />,
  );
  const display = screen.getByRole("button", { name: "Ada" });
  display.element().focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByRole("textbox")).toHaveFocus();
});

test("Enter commits the edited value and fires onCommit once", async () => {
  const onCommit = vi.fn();
  const screen = await render(<Controlled initial="Ada" onCommit={onCommit} />);
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  const input = screen.getByRole("textbox");
  await input.fill("Grace");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenCalledWith("Grace");
  // Back to display mode showing the committed value.
  await expect.element(screen.getByText("Grace")).toBeInTheDocument();
});

test("committing an unchanged value does not fire onCommit", async () => {
  const onCommit = vi.fn();
  const screen = await render(<FieldInline value="Ada" onCommit={onCommit} />);
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  await userEvent.keyboard("{Enter}");
  expect(onCommit).not.toHaveBeenCalled();
});

test("Escape cancels — restores the value and skips onCommit", async () => {
  const onCommit = vi.fn();
  const screen = await render(<FieldInline value="Ada" onCommit={onCommit} />);
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  const input = screen.getByRole("textbox");
  await input.fill("Grace");
  await userEvent.keyboard("{Escape}");
  expect(onCommit).not.toHaveBeenCalled();
  // Reverted to the original value in display mode.
  await expect.element(screen.getByText("Ada")).toBeInTheDocument();
});

test("no a11y violations", async () => {
  const screen = await render(
    <FieldInline value="Ada Lovelace" onCommit={() => {}} placeholder="Name" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("edit mode has an accessible name even with no placeholder or label", async () => {
  // Minimal valid props: no placeholder, no label. Entering edit mode must
  // still produce a named textbox (regression: aria-label used to be the
  // optional placeholder, leaving the input unnamed when omitted).
  const screen = await render(<FieldInline value="Ada" onCommit={() => {}} />);
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  // A non-empty accessible name must exist — querying by role with a name
  // succeeds only when the textbox is actually named.
  const input = screen.getByRole("textbox", { name: "Edit value" });
  await expect.element(input).toBeInTheDocument();
  // And the edit-mode container passes axe (would flag an unnamed control).
  await expectNoA11yViolations(screen.container);
});

test("label is used as the accessible name (over a differing placeholder)", async () => {
  const screen = await render(
    <FieldInline
      value="Ada"
      onCommit={() => {}}
      label="Task title"
      placeholder="Type a title…"
    />,
  );
  (
    screen
      .getByRole("button", { name: "Task title" })
      .element() as HTMLSpanElement
  ).click();
  // `label` wins over `placeholder` for the accessible name.
  await expect
    .element(screen.getByRole("textbox", { name: "Task title" }))
    .toBeInTheDocument();
});

test("an explicit aria-label wins over both label and placeholder", async () => {
  const screen = await render(
    <FieldInline
      value="Ada"
      onCommit={() => {}}
      aria-label="Full name"
      label="Task title"
      placeholder="Type a title…"
    />,
  );
  (
    screen
      .getByRole("button", { name: "Full name" })
      .element() as HTMLSpanElement
  ).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Full name" }))
    .toBeInTheDocument();
});

test("placeholder is the accessible name when no label is given", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} placeholder="Name" />,
  );
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Name" }))
    .toBeInTheDocument();
});

test("disabled blocks entering edit mode and dims the display value", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldInline value="Ada" onCommit={onCommit} disabled />,
  );
  const display = screen.container.querySelector('[data-slot="field-inline"]')!;
  expect(display).toHaveAttribute("aria-disabled", "true");
  expect(display).toHaveAttribute("tabindex", "-1");

  // Native click bypasses Playwright's actionability gate, which treats
  // `aria-disabled="true"` as "not enabled" and would otherwise time out waiting for it.
  (display as HTMLElement).click();
  // Still display mode — no input was mounted, `startEdit`'s own guard no-opped the click.
  expect(screen.container.querySelector("input")).toBeNull();
  expect(onCommit).not.toHaveBeenCalled();
});

test("readOnly renders plain text with no button role or edit affordance", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} readOnly />,
  );
  const display = screen.container.querySelector('[data-slot="field-inline"]')!;
  expect(display.getAttribute("role")).toBeNull();
  expect(display.getAttribute("tabindex")).toBeNull();
  expect(display.getAttribute("aria-disabled")).toBeNull();

  await screen.getByText("Ada").click();
  expect(screen.container.querySelector("input")).toBeNull();
});

test("error marks the edit-mode input invalid and renders an associated error message", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} error="Name is required." />,
  );
  // Shown in display mode too.
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Name is required.");

  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  const input = screen.getByRole("textbox");
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  const describedBy = input.element().getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    "Name is required.",
  );
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} disabled />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — error", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} error="Name is required." />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — edit mode (open)", async () => {
  const screen = await render(
    <FieldInline value="Ada" onCommit={() => {}} placeholder="Name" />,
  );
  (
    screen.getByRole("button", { name: "Ada" }).element() as HTMLSpanElement
  ).click();
  await expect.element(screen.getByRole("textbox")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the display root (span)", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<FieldInline ref={ref} value="Title" onCommit={() => {}} />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("field-inline");
});

test("a keyboard commit returns focus to the display element; a blur-commit does not steal it", async () => {
  const { userEvent } = await import("vitest/browser");
  const { vi: vitestVi } = await import("vitest");
  void vitestVi;
  const screen = await render(
    <div>
      <FieldInline value="Alpha" label="Name" onCommit={() => {}} />
      <button type="button">Elsewhere</button>
    </div>,
  );
  // Keyboard path: Enter to open, type, Enter to commit → display refocused.
  const display = () =>
    document.querySelector('[data-slot="field-inline"]') as HTMLElement;
  display().focus();
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("Beta{Enter}");
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.dataset.slot)
    .toBe("field-inline");
  // Escape path refocuses too.
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("{Escape}");
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.dataset.slot)
    .toBe("field-inline");
  // Blur path: clicking elsewhere commits WITHOUT stealing focus back.
  await userEvent.keyboard("{Enter}");
  const elsewhere = screen
    .getByRole("button", { name: "Elsewhere" })
    .element() as HTMLElement;
  elsewhere.focus();
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.textContent)
    .toBe("Elsewhere");
});
