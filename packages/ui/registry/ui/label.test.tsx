import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Label } from "./label";

test("renders its text inside a label with data-slot", async () => {
  const screen = await render(<Label>Email</Label>);
  const label = screen.getByText("Email");
  await expect.element(label).toBeInTheDocument();
  await expect.element(label).toHaveAttribute("data-slot", "label");
});

test("associates with a control via htmlFor", async () => {
  const screen = await render(
    <>
      <Label htmlFor="email">Email</Label>
      <input id="email" type="email" />
    </>,
  );
  await expect
    .element(screen.getByText("Email"))
    .toHaveAttribute("for", "email");
  // Clicking the label focuses the associated input (proves the association).
  const input = screen.getByLabelText("Email");
  await expect.element(input).toBeInTheDocument();
});

test("required sets the data-required hook with no visual asterisk", async () => {
  const screen = await render(<Label required>Name</Label>);
  const label = screen.getByText("Name");
  await expect.element(label).toHaveAttribute("data-required", "");
  // No decorative asterisk — requiredness is enforced on the control + inline FieldError.
  expect(
    label.element().querySelector('[data-slot="label-required"]'),
  ).toBeNull();
});

test("omits the asterisk by default", async () => {
  const screen = await render(<Label>Name</Label>);
  const label = screen.getByText("Name");
  await expect.element(label).not.toHaveAttribute("data-required");
  expect(
    label.element().querySelector('[data-slot="label-required"]'),
  ).toBeNull();
});

test("forwards ref to the underlying label element", async () => {
  const ref = React.createRef<HTMLLabelElement>();
  await render(<Label ref={ref}>Ref</Label>);
  expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  expect(ref.current?.dataset.slot).toBe("label");
});

test("no a11y violations", async () => {
  const screen = await render(
    <>
      <Label htmlFor="field" required>
        Full name
      </Label>
      <input id="field" type="text" required />
    </>,
  );
  await expectNoA11yViolations(screen.container);
});
