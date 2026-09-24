import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { NumberField } from "./number-field";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

test("renders a named numeric input inside upstream's InputGroup chrome", async () => {
  const screen = await render(
    <NumberField aria-label="Quantity" defaultValue={2} />,
  );
  const input = screen.getByRole("textbox", { name: "Quantity" });
  await expect.element(input).toBeInTheDocument();
  const root = document.querySelector('[data-slot="number-field"]')!;
  // The root IS upstream's InputGroup: its role and its group slot are the proof that the
  // bordered box is imported, not restated.
  expect(root.getAttribute("role")).toBe("group");
  expect(root.className).toContain("group/input-group");
  // The inner control is upstream's Input, flattened by InputGroupInput, and it KEEPS upstream's
  // slot name: `InputGroup` selects on `[data-slot=input-group-control]` for both its focus border
  // and its invalid hairline, so renaming it would silently unpaint the box.
  expect((input.element() as HTMLElement).getAttribute("data-slot")).toBe(
    "input-group-control",
  );
});

test("FRM-13: the steppers flank the field, and each is upstream's Button", async () => {
  await render(<NumberField aria-label="Quantity" defaultValue={2} />);
  const root = document.querySelector(
    '[data-slot="number-field"]',
  ) as HTMLElement;
  const dec = document.querySelector(
    '[data-slot="number-field-decrement"]',
  ) as HTMLButtonElement;
  const inc = document.querySelector(
    '[data-slot="number-field-increment"]',
  ) as HTMLButtonElement;
  // Flanking, not stacked: one inside the inline-start addon, one inside the inline-end addon.
  expect(root.firstElementChild?.contains(dec)).toBe(true);
  expect(root.lastElementChild?.contains(inc)).toBe(true);
  expect(
    (root.firstElementChild as HTMLElement).getAttribute("data-align"),
  ).toBe("inline-start");
  expect(
    (root.lastElementChild as HTMLElement).getAttribute("data-align"),
  ).toBe("inline-end");
  // Each stepper IS upstream's Button in its ghost variant — the wash and the ink step are its
  // own, never restated here. The PAINTED geometry is measured against real CSS in
  // `test/control-paint.browser.test.tsx`; this lane has no stylesheet.
  for (const stepper of [dec, inc]) {
    expect(stepper.tagName).toBe("BUTTON");
    // The ghost recipe is upstream Button's, reaching this element through `InputGroupButton`.
    expect(stepper.className).toContain("hover:bg-muted");
    expect(stepper.className).toContain("group/button");
  }
});

test("stepper buttons increment and decrement the value", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <NumberField
      aria-label="Quantity"
      defaultValue={2}
      onValueChange={onValueChange}
    />,
  );
  await screen.getByRole("button", { name: "Increase" }).click();
  expect(onValueChange).toHaveBeenLastCalledWith(3, expect.anything());
  await screen.getByRole("button", { name: "Decrease" }).click();
  expect(onValueChange).toHaveBeenLastCalledWith(2, expect.anything());
});

test("keyboard arrows step the focused input; min/max clamp", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <NumberField
      aria-label="Quantity"
      defaultValue={9}
      min={0}
      max={10}
      onValueChange={onValueChange}
    />,
  );
  const input = screen
    .getByRole("textbox", { name: "Quantity" })
    .element() as HTMLInputElement;
  input.focus();
  await userEvent.keyboard("{ArrowUp}");
  expect(onValueChange).toHaveBeenLastCalledWith(10, expect.anything());
  await userEvent.keyboard("{ArrowUp}");
  // Clamped at max.
  expect(onValueChange).toHaveBeenLastCalledWith(10, expect.anything());
});

test("currency format renders through Intl — money is a format prop", async () => {
  await render(
    <NumberField
      aria-label="Amount"
      defaultValue={1234.5}
      locale="en-US"
      format={{ style: "currency", currency: "USD" }}
    />,
  );
  const input = document.querySelector(
    '[data-slot="input-group-control"]',
  ) as HTMLInputElement;
  expect(input.value).toBe("$1,234.50");
});

test("prefix and suffix render in upstream InputGroupAddon slots", async () => {
  await render(
    <NumberField aria-label="Weight" prefix="kg" suffix="per box" />,
  );
  expect(
    document.querySelector('[data-slot="number-field-prefix"]')?.textContent,
  ).toBe("kg");
  expect(
    document.querySelector('[data-slot="number-field-suffix"]')?.textContent,
  ).toBe("per box");
});

test("hideControls removes the steppers but keeps keyboard stepping", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <NumberField
      aria-label="Quantity"
      defaultValue={5}
      hideControls
      onValueChange={onValueChange}
    />,
  );
  expect(
    document.querySelector('[data-slot="number-field-increment"]'),
  ).toBeNull();
  expect(
    document.querySelector('[data-slot="number-field-decrement"]'),
  ).toBeNull();
  const input = screen
    .getByRole("textbox", { name: "Quantity" })
    .element() as HTMLInputElement;
  input.focus();
  await userEvent.keyboard("{ArrowUp}");
  expect(onValueChange).toHaveBeenLastCalledWith(6, expect.anything());
});

test("disabled dims the whole group and blocks the steppers", async () => {
  const onValueChange = vi.fn();
  await render(
    <NumberField
      aria-label="Quantity"
      defaultValue={2}
      disabled
      onValueChange={onValueChange}
    />,
  );
  const input = document.querySelector(
    '[data-slot="input-group-control"]',
  ) as HTMLInputElement;
  expect(input.disabled).toBe(true);
  const inc = document.querySelector(
    '[data-slot="number-field-increment"]',
  ) as HTMLButtonElement;
  expect(inc.hasAttribute("data-disabled") || inc.disabled).toBe(true);
});

test("inputRef forwards to the inner input element", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(<NumberField aria-label="Quantity" inputRef={ref} />);
  expect(ref.current?.tagName).toBe("INPUT");
  expect(ref.current?.dataset.slot).toBe("input-group-control");
});

test("focus: the input carries the text-entry focus affordance on the group border", async () => {
  await render(<NumberField aria-label="Quantity" />);
  const root = document.querySelector(
    '[data-slot="number-field"]',
  ) as HTMLElement;
  // The focus affordance is upstream InputGroup's own: the box borders `ring/70` when the
  // control inside it takes focus. This file adds no focus class of its own.
  expect(root.className).toContain(
    "has-[[data-slot=input-group-control]:focus]:border-ring/70",
  );
  const input = document.querySelector(
    '[data-slot="input-group-control"]',
  ) as HTMLInputElement;
  input.focus();
  expect(document.activeElement).toBe(input);
});

test("no a11y violations — default, addons, disabled", async () => {
  const screen = await render(
    <div>
      <NumberField aria-label="Quantity" defaultValue={2} />
      <NumberField aria-label="Weight" prefix="kg" />
      <NumberField aria-label="Limit" disabled defaultValue={1} />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("focus indicator: the steppers keep :focus-visible, pulled inside the clipping group", async () => {
  await render(<NumberField aria-label="Quantity" defaultValue={2} />);
  // `outline-none` on the GROUP is upstream `InputGroup`'s own (FOC-11 resolves as shadcn); what
  // must never happen is a stepper suppressing the one focus outline FOC-1 gives it.
  const inc = document.querySelector(
    '[data-slot="number-field-increment"]',
  ) as HTMLButtonElement;
  expect(inc.className).not.toContain("outline-none");
  expect(inc.className).toContain("focus-visible:-outline-offset-2");
});

/* DS-67 — the ARIA wiring lands on the input a screen reader announces, not the group */

test("DS-67: aria-describedby lands on the input, not the group", async () => {
  const screen = await render(
    <>
      <NumberField aria-label="Qty" aria-describedby="qty-err" />
      <p id="qty-err">Too many</p>
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Qty" });
  await expect.element(input).toHaveAttribute("aria-describedby", "qty-err");
  await expect.element(input).toHaveAccessibleDescription("Too many");
  const group = screen.container.querySelector('[data-slot="number-field"]')!;
  expect(group.hasAttribute("aria-describedby")).toBe(false);
});

test("DS-67: aria-labelledby and id land on the input", async () => {
  const screen = await render(
    <>
      <span id="qty-name">Quantity</span>
      <NumberField id="qty" aria-labelledby="qty-name" />
    </>,
  );
  const input = screen.getByRole("textbox", { name: "Quantity" });
  await expect.element(input).toHaveAttribute("id", "qty");
  const group = screen.container.querySelector('[data-slot="number-field"]')!;
  expect(group.hasAttribute("aria-labelledby")).toBe(false);
  expect(group.getAttribute("id")).not.toBe("qty");
});

test("DS-47: inside a Field the input is labelled, described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Quantity</FieldLabel>
      <NumberField />
      <FieldDescription>Whole units.</FieldDescription>
      <FieldError>At most 99.</FieldError>
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Quantity" });
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expect.element(input).toHaveAccessibleDescription(/Whole units/);
  await expect.element(input).toHaveAccessibleDescription(/At most 99/);
});

test("no a11y violations — inside a Field, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Quantity</FieldLabel>
      <NumberField />
      <FieldDescription>Whole units.</FieldDescription>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a Field, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Quantity</FieldLabel>
      <NumberField />
      <FieldError>At most 99.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
