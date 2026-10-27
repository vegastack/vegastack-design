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
  document.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu"][data-menu="template-editor"]',
  );
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
  singleLine?: boolean;
  replacements?: { from: string; to: string }[];
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

test("the picker is the shared SuggestionMenu: the active row is the textbox's aria-activedescendant", async () => {
  const screen = await render(<Controlled initial="" />);
  const box = screen.getByRole("textbox", { name: "Description" });
  await box.click();
  await userEvent.keyboard("@");
  await vi.waitFor(() => expect(menu()?.getAttribute("role")).toBe("listbox"));
  const active = () =>
    menu()!.querySelector<HTMLElement>('[role="option"][data-highlighted]')!;
  expect(box.element().getAttribute("aria-activedescendant")).toBe(active().id);
  expect(active().textContent).toContain("Power");
  // The unit is the row's muted trailing description.
  expect(
    active().querySelector('[data-slot="suggestion-menu-description"]')
      ?.textContent,
  ).toBe("W");
  await userEvent.keyboard("{ArrowDown}");
  await vi.waitFor(() => expect(active().textContent).toContain("Efficacy"));
  await vi.waitFor(() =>
    expect(box.element().getAttribute("aria-activedescendant")).toBe(
      active().id,
    ),
  );
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("Escape closes the picker without reaching the host (a dialog stays open)", async () => {
  const onHostKey = vi.fn();
  const screen = await render(
    <div onKeyDown={(event) => event.key === "Escape" && onHostKey()}>
      <Controlled initial="" />
    </div>,
  );
  await screen.getByRole("textbox", { name: "Description" }).click();
  await userEvent.keyboard("@");
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(menu()).toBeNull());
  expect(onHostKey).not.toHaveBeenCalled();
});

test("singleLine: carriage returns load as spaces, and a replacement can never insert a line break", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={"a\rb"}
      onChange={onChange}
      singleLine
      replacements={[{ from: ";", to: "\n" }]}
    />,
  );
  const box = screen.getByRole("textbox", { name: "Description" });
  await box.click();
  await userEvent.keyboard("{End};c");
  await vi.waitFor(() => expect(onChange.mock.calls.at(-1)?.[0]).toBe("a b c"));
});

test("replacements rewrite characters as you type; onChange stores the replaced text with {{id}} tokens", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial="{{power}}"
      onChange={onChange}
      replacements={[
        { from: "*", to: "×" },
        { from: "/", to: "÷" },
      ]}
    />,
  );
  const box = screen.getByRole("textbox", { name: "Description" });
  await box.click();
  await userEvent.keyboard("{End} * 2 / 3");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("{{power}} × 2 ÷ 3"),
  );
});

function paste(target: Element, text: string) {
  const data = new DataTransfer();
  data.setData("text/plain", text);
  target.dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }),
  );
}

test("singleLine: one paragraph, Enter inserts nothing, pasted line breaks become spaces, the picker still takes Enter", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Controlled
      initial={"Rated\n\n{{power}}"}
      onChange={onChange}
      singleLine
    />,
  );
  const box = screen.getByRole("textbox", { name: "Description" });
  await vi.waitFor(() => expect(chips(box.element())).toHaveLength(1));
  expect(box.element().querySelectorAll("p")).toHaveLength(1);
  expect(box.element().getAttribute("aria-multiline")).toBe("false");
  expect(
    screen.container
      .querySelector('[data-slot="template-editor"]')
      ?.hasAttribute("data-single-line"),
  ).toBe(true);

  await box.click();
  await userEvent.keyboard("{End}{Enter}{Shift>}{Enter}{/Shift}x");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("Rated {{power}}x"),
  );
  paste(box.element(), " a\nb\n\nc");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("Rated {{power}}x a b c"),
  );
  await userEvent.keyboard(" @");
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(
      "Rated {{power}}x a b c {{power}} ",
    ),
  );
  expect(box.element().querySelectorAll("p")).toHaveLength(1);
});

test('triggers={["{"]}: one brace opens the picker under pickerLabel, and @ stays text', async () => {
  const onChange = vi.fn();
  function Braces() {
    const [value, setValue] = React.useState("");
    return (
      <TemplateEditor
        aria-label="Formula"
        tokens={TOKENS}
        triggers={["{"]}
        pickerLabel="Insert field"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    );
  }
  const screen = await render(<Braces />);
  const box = screen.getByRole("textbox", { name: "Formula" });
  await box.click();
  await userEvent.keyboard("a @");
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(menu()).toBeNull();
  await userEvent.keyboard(" {{eff");
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  expect(menu()!.getAttribute("aria-label")).toBe("Insert field");
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("a @ {{efficacy}} "),
  );
});
