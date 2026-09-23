import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Field, FieldLabel } from "./field";
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
  expect(
    (
      screen
        .getByRole("button", { name: "Show password" })
        .element() as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
