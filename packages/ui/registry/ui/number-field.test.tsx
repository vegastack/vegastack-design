import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { NumberField } from "./number-field";

test("renders a named numeric input inside the group chrome", async () => {
  const screen = await render(
    <NumberField aria-label="Quantity" defaultValue={2} />,
  );
  const input = screen.getByRole("textbox", { name: "Quantity" });
  await expect.element(input).toBeInTheDocument();
  const root = document.querySelector('[data-slot="number-field"]')!;
  expect(root.getAttribute("data-size")).toBe("default");
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
    '[data-slot="number-field-input"]',
  ) as HTMLInputElement;
  expect(input.value).toBe("$1,234.50");
});

test("prefix and suffix addons render in Input's addon idiom", async () => {
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
    '[data-slot="number-field-input"]',
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
  expect(ref.current?.dataset.slot).toBe("number-field-input");
});

test("focus: the input carries the text-entry focus affordance on the group border", async () => {
  await render(<NumberField aria-label="Quantity" />);
  const root = document.querySelector(
    '[data-slot="number-field"]',
  ) as HTMLElement;
  // The group chrome carries the focus-within border tint (Input's addon idiom).
  expect(root.className).toContain("focus-within:border-ring");
  const input = document.querySelector(
    '[data-slot="number-field-input"]',
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

test("focus indicator: only text-entry controls strip the outline (steppers keep :focus-visible)", async () => {
  await render(<NumberField aria-label="Quantity" defaultValue={2} />);
  const offenders = Array.from(document.querySelectorAll("*")).filter(
    (el) =>
      (el.getAttribute("class") ?? "").includes("outline-none") &&
      !["INPUT", "TEXTAREA"].includes(el.tagName),
  );
  expect(offenders).toEqual([]);
  const inc = document.querySelector(
    '[data-slot="number-field-increment"]',
  ) as HTMLButtonElement;
  expect(inc.className).not.toContain("outline-none");
  expect(inc.className).toContain("focus-visible:-outline-offset-2");
});
