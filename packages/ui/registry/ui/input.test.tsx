import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Input } from "./input";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

/** The chrome string the component renders, read off a mounted element. */
async function classesOf(element: HTMLElement) {
  return element.className;
}

test("renders a native input carrying data-slot", async () => {
  const screen = await render(<Input aria-label="Email" />);
  const input = screen.getByRole("textbox", { name: "Email" });
  await expect.element(input).toBeInTheDocument();
  await expect.element(input).toHaveAttribute("data-slot", "input");
  expect((input.element() as HTMLInputElement).tagName).toBe("INPUT");
});

test("the type prop reaches the element (Usage, File)", async () => {
  const screen = await render(
    <div>
      <Input aria-label="Email" type="email" />
      <Input aria-label="Picture" type="file" />
    </div>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Email" }))
    .toHaveAttribute("type", "email");
  const file =
    screen.container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(file).not.toBeNull();
  expect(file?.getAttribute("data-slot")).toBe("input");
});

test("typing updates the value (Basic)", async () => {
  const screen = await render(<Input aria-label="Username" />);
  const input = screen.getByRole("textbox", { name: "Username" });
  await userEvent.fill(input, "max");
  expect((input.element() as HTMLInputElement).value).toBe("max");
});

test("Field wires the label, description and error (Field, Field Group)", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" aria-invalid />
      <FieldDescription>We never share it.</FieldDescription>
      <FieldError>Enter a valid email address.</FieldError>
    </Field>,
  );
  const input = screen.getByRole("textbox", { name: "Email" });
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(screen.getByText("Enter a valid email address."))
    .toBeInTheDocument();
});

test("required and disabled reach the element (Required, Disabled)", async () => {
  const screen = await render(
    <div>
      <Input aria-label="Required" required />
      <Input aria-label="Disabled" disabled />
    </div>,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Required" }))
    .toBeRequired();
  await expect
    .element(screen.getByRole("textbox", { name: "Disabled" }))
    .toBeDisabled();
});

test("FOC-1/FOC-6: the recipe carries no focus glow", async () => {
  const screen = await render(<Input aria-label="Email" />);
  const classes = await classesOf(
    screen.getByRole("textbox", { name: "Email" }).element() as HTMLElement,
  );
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-3/FOC-8: focus is a border tint on :focus, with outline-hidden not outline-none", async () => {
  const screen = await render(<Input aria-label="Email" />);
  const classes = await classesOf(
    screen.getByRole("textbox", { name: "Email" }).element() as HTMLElement,
  );
  expect(classes).toContain("focus:border-ring/70");
  expect(classes).toContain("outline-hidden");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
});

test("FOC-5: the invalid tint stands down while the control is focused", async () => {
  const screen = await render(<Input aria-label="Email" aria-invalid />);
  const classes = await classesOf(
    screen.getByRole("textbox", { name: "Email" }).element() as HTMLElement,
  );
  expect(classes).toContain("not-focus:aria-invalid:border-destructive");
});

test("FRM-4: the recipe never removes pointer events from a disabled input", async () => {
  const screen = await render(<Input aria-label="Email" disabled />);
  const classes = await classesOf(
    screen.getByRole("textbox", { name: "Email" }).element() as HTMLElement,
  );
  expect(classes).not.toContain("disabled:pointer-events-none");
  // Base UI's Input has no `focusableWhenDisabled`, so the NATIVE attribute stays: this is the
  // pointer half of FRM-4 only, and the docs page says so.
  expect(
    (
      screen
        .getByRole("textbox", { name: "Email" })
        .element() as HTMLInputElement
    ).disabled,
  ).toBe(true);
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="a11y-rest">Email</FieldLabel>
      <Input id="a11y-rest" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="a11y-invalid">Email</FieldLabel>
      <Input id="a11y-invalid" aria-invalid />
      <FieldError>Enter a valid email address.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field data-disabled>
      <FieldLabel htmlFor="a11y-disabled">Email</FieldLabel>
      <Input id="a11y-disabled" disabled />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — filled", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="a11y-filled">Email</FieldLabel>
      <Input id="a11y-filled" defaultValue="name@example.com" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
