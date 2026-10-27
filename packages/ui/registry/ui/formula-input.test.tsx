import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Field, FieldLabel } from "./field";
import { FormulaInput, type FormulaInputField } from "./formula-input";

const FIELDS: FormulaInputField[] = [
  { key: "qty", label: "Qty", type: "Number" },
  { key: "price", label: "Unit price", type: "Currency" },
];

const menu = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu"][data-menu="template-editor"]',
  );

function Controlled({
  initial = "",
  onChange,
  ...props
}: {
  initial?: string;
  onChange?: (value: string) => void;
} & Partial<React.ComponentProps<typeof FormulaInput>>) {
  const [value, setValue] = React.useState(initial);
  return (
    <Field>
      <FieldLabel>Formula</FieldLabel>
      <FormulaInput
        fields={FIELDS}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        {...props}
      />
    </Field>
  );
}

test("{ opens the field picker; a pick inserts a chip stored as {{key}}; * reads as ×", async () => {
  const onChange = vi.fn();
  const screen = await render(<Controlled onChange={onChange} />);
  const box = screen.getByRole("textbox", { name: "Formula" });
  await box.click();
  await userEvent.keyboard("{{");
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  expect(menu()!.getAttribute("aria-label")).toBe("Insert field");
  expect(menu()!.textContent).toContain("Unit price");
  expect(menu()!.textContent).toContain("Currency");
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(menu()).toBeNull());
  expect(onChange.mock.calls.at(-1)?.[0]).toBe("{{qty}} ");
  await userEvent.keyboard("* 2");
  await vi.waitFor(() =>
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("{{qty}} × 2"),
  );
  // `{{` (the template editor's default) is not a second trigger here: `{` already is.
  await expectNoA11yViolations(screen.container);
});

test("the first row's result shows under the input; an error replaces it and marks the input invalid", async () => {
  const screen = await render(
    <Controlled initial="{{qty}} × {{price}}" preview="1,240" />,
  );
  const status = screen.container.querySelector<HTMLElement>(
    '[data-slot="formula-input-status"]',
  )!;
  expect(status.getAttribute("aria-live")).toBe("polite");
  expect(status.textContent).toBe("First row = 1,240");
  const box = screen.getByRole("textbox", { name: "Formula" });
  expect(box.element().getAttribute("aria-describedby")).toContain(status.id);
  expect(box.element().getAttribute("aria-invalid")).toBeNull();
  await expectNoA11yViolations(screen.container);

  await screen.rerender(
    <Controlled
      initial="{{qty}} × {{qyt}}"
      preview="1,240"
      error="Unknown field {Qyt}"
      invalidFields={["qyt"]}
    />,
  );
  await vi.waitFor(() =>
    expect(status.textContent).toBe("Unknown field {Qyt}"),
  );
  expect(
    status.querySelector('[data-slot="formula-input-error"]')!.className,
  ).toContain("text-destructive-text");
  await vi.waitFor(() =>
    expect(box.element().getAttribute("aria-invalid")).toBe("true"),
  );
  expect(
    screen.container
      .querySelector('[data-slot="formula-input"]')!
      .hasAttribute("data-invalid"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("nothing to say: the status line is empty and takes no room", async () => {
  const screen = await render(<Controlled />);
  const status = screen.container.querySelector<HTMLElement>(
    '[data-slot="formula-input-status"]',
  )!;
  expect(status.textContent).toBe("");
  expect(status.className).toContain("empty:hidden");
});

test("forwards a ref to the root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <FormulaInput
      ref={ref}
      aria-label="Formula"
      fields={FIELDS}
      value=""
      onChange={() => {}}
    />,
  );
  expect(ref.current?.getAttribute("data-slot")).toBe("formula-input");
});
