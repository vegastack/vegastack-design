import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Field, FieldLabel } from "./field";
import { TemplateEditor, type TemplateEditorToken } from "./template-editor";

// Tiptap mounts a real ProseMirror contenteditable, so these run in browser mode.

const TOKENS: TemplateEditorToken[] = [
  { id: "power", label: "Power", hint: "W" },
  { id: "efficacy", label: "Efficacy", hint: "lm/W" },
  { id: "cct", label: "Colour temperature", hint: "K" },
];

const menu = () =>
  document.querySelector('[role="listbox"][data-slot="template-editor-menu"]');
const chips = (root: Element) => [
  ...root.querySelectorAll('[data-slot="template-editor-token"]'),
];

function Controlled({
  initial,
  onChange,
  ...props
}: {
  initial: string;
  onChange?: (value: string) => void;
  invalidTokenIds?: string[];
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <TemplateEditor
      aria-label="Description"
      tokens={TOKENS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
}

test("renders tokens as chips, unknown ids raw and destructive, and never emits an unchanged value", async () => {
  const onChange = vi.fn();
  const value =
    "Recessed {{power}} downlight\nwith {{efficacy}}.\n\n{{gone}} {{cct}}";
  const screen = await render(
    <Controlled
      initial={value}
      onChange={onChange}
      invalidTokenIds={["cct"]}
    />,
  );
  const box = screen.getByRole("textbox", { name: "Description" });
  await vi.waitFor(() => expect(chips(box.element())).toHaveLength(4));
  const [power, efficacy, gone, cct] = chips(box.element());
  expect(power!.textContent).toBe("Power");
  expect(efficacy!.textContent).toBe("Efficacy");
  expect(gone!.textContent).toBe("gone");
  expect(gone!.hasAttribute("data-invalid")).toBe(true);
  expect(power!.hasAttribute("data-invalid")).toBe(false);
  expect(cct!.hasAttribute("data-invalid")).toBe(true);
  expect(box.element().querySelectorAll("p")).toHaveLength(2);
  expect(onChange).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

test("@ opens the picker; arrows and Enter insert a chip stored as {{id}}; Backspace removes it whole", async () => {
  const onChange = vi.fn();
  const screen = await render(<Controlled initial="" onChange={onChange} />);
  const box = screen.getByRole("textbox", { name: "Description" });
  await box.click();
  await userEvent.keyboard("Rated @");
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  expect(box.element().getAttribute("aria-controls")).toBe(menu()!.id);
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await vi.waitFor(() => expect(menu()).toBeNull());
  expect(onChange.mock.calls.at(-1)?.[0]).toBe("Rated {{efficacy}} ");
  await userEvent.keyboard("{Backspace}{Backspace}");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("Rated "),
  );
});

test("{{ filters the picker, Escape closes it, and Enter makes a paragraph", async () => {
  const onChange = vi.fn();
  const screen = await render(<Controlled initial="" onChange={onChange} />);
  const box = screen.getByRole("textbox", { name: "Description" });
  await box.click();
  await userEvent.keyboard("A{{{{col");
  await vi.waitFor(() =>
    expect(menu()?.textContent).toContain("Colour temperature"),
  );
  expect(menu()!.querySelectorAll('[role="option"]')).toHaveLength(1);
  await userEvent.keyboard("{Tab}");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("A{{cct}} "),
  );
  await userEvent.keyboard("@");
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(menu()).toBeNull());
  await userEvent.keyboard("{Enter}B");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("A{{cct}} @\n\nB"),
  );
});

test("takes its label from a Field and dims when disabled", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Marketing text</FieldLabel>
      <TemplateEditor value="" onChange={() => {}} tokens={TOKENS} disabled />
    </Field>,
  );
  const box = screen.getByRole("textbox", { name: "Marketing text" });
  await vi.waitFor(() =>
    expect(box.element().getAttribute("contenteditable")).toBe("false"),
  );
  expect(
    screen.container
      .querySelector('[data-slot="template-editor"]')
      ?.hasAttribute("data-disabled"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});
