import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { PasswordInput } from "./password-input";

test("toggles between password and text with a named, pressed-state button", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="pw">Password</FieldLabel>
      <PasswordInput id="pw" name="password" autoComplete="current-password" />
    </Field>,
  );
  const input = screen.getByLabelText("Password").element() as HTMLInputElement;
  expect(input.type).toBe("password");
  expect(input.name).toBe("password");
  expect(input.autocomplete).toBe("current-password");

  const toggle = screen.getByRole("button", { name: "Show password" });
  expect(toggle.element().getAttribute("type")).toBe("button");
  expect(toggle.element().getAttribute("aria-pressed")).toBe("false");
  await expectNoA11yViolations(screen.container);

  await userEvent.click(toggle);
  expect(input.type).toBe("text");
  const hide = screen.getByRole("button", { name: "Hide password" });
  expect(hide.element().getAttribute("aria-pressed")).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("the toggle never submits its form, and ref and aria-invalid reach the input", async () => {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const ref = React.createRef<HTMLInputElement>();
  const screen = await render(
    <form onSubmit={onSubmit}>
      <PasswordInput ref={ref} aria-label="Password" aria-invalid="true" />
    </form>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.getAttribute("aria-invalid")).toBe("true");
});

test("disabled disables both the input and the toggle", async () => {
  const screen = await render(<PasswordInput aria-label="Password" disabled />);
  expect(
    (screen.getByLabelText("Password").element() as HTMLInputElement).disabled,
  ).toBe(true);
  // Button's disabled form is aria-disabled (FRM-4), not the native attribute.
  await expect
    .element(screen.getByRole("button", { name: "Show password" }))
    .toHaveAttribute("aria-disabled", "true");
});

/* DS-47 — no code of its own: the inner input is `InputGroupInput` → `Input` → Base UI Field.Control */

test("DS-47: inside a Field the password input is labelled, described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Password</FieldLabel>
      <PasswordInput />
      <FieldDescription>At least 8 characters.</FieldDescription>
      <FieldError>Too short.</FieldError>
    </Field>,
  );
  const input = screen.getByLabelText("Password", { exact: true });
  await expect.element(input).toHaveAttribute("type", "password");
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(input)
    .toHaveAccessibleDescription(/At least 8 characters/);
  await expect.element(input).toHaveAccessibleDescription(/Too short/);
});

test("no a11y violations — inside a Field, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Password</FieldLabel>
      <PasswordInput />
      <FieldDescription>At least 8 characters.</FieldDescription>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a Field, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Password</FieldLabel>
      <PasswordInput />
      <FieldError>Too short.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "PasswordInput",
  render: (props) => <PasswordInput {...props} />,
  find: (screen, name) => screen.getByLabelText(name, { exact: true }),
});
