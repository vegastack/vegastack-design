/**
 * `login-01.test.tsx` — the block's browser contract: it renders, it shows its own content, and
 * each state the sign-in form reaches (rest, invalid, signing in, rejected) is axe-clean. A block is
 * a copy-once composition, so what is worth pinning is the composition: one `h1`, bound labels, the
 * right `autoComplete` tokens, a real "Forgot password?" link, and an alert that appears only after
 * a failed submit. The behaviour of each part it composes is owned by that part's own suite.
 *
 * Every axe run passes `["color-contrast"]`: the fast browser suite mounts without the compiled
 * token theme, so axe's contrast maths would read unresolved custom properties (see test/a11y.ts).
 * Compiled contrast, in both themes, is proven by the login-01 case in
 * `test/contrast.browser.test.tsx` (D6).
 */

import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { LoginForm } from "./components/login-form";
import Login01Page from "./page";

const REJECTION =
  "The email or password is incorrect. Check both and try again, or reset your password.";

test("login-01 renders its composition", async () => {
  const screen = await render(<Login01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Sign in" }))
    .toBeInTheDocument();
});

test("login-01 has one h1 and announces the form error only after submit", async () => {
  const screen = await render(
    <LoginForm
      signIn={async () => {
        throw new Error(REJECTION);
      }}
    />,
  );
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  expect(document.querySelector('[role="alert"]')).toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  await screen.getByLabelText("Email").fill("ada@example.com");
  await screen.getByLabelText("Password").fill("correct horse");
  await screen.getByRole("button", { name: "Sign in" }).click();

  const alert = screen.getByRole("alert");
  await expect.element(alert).toBeInTheDocument();
  await expect.element(alert.getByText(REJECTION)).toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("login-01 binds its labels and asks for the right autofill", async () => {
  const screen = await render(<Login01Page />);
  const email = screen.getByLabelText("Email");
  const passwordField = screen.getByLabelText("Password");
  await expect.element(email).toHaveAttribute("type", "email");
  await expect.element(email).toHaveAttribute("autocomplete", "email");
  await expect.element(email).toHaveAttribute("name", "email");
  await expect.element(passwordField).toHaveAttribute("type", "password");
  await expect
    .element(passwordField)
    .toHaveAttribute("autocomplete", "current-password");
  await expect.element(passwordField).toHaveAttribute("name", "password");
  // The show/hide toggle is PasswordInput's own; the block only has to mount it.
  await expect
    .element(screen.getByRole("button", { name: "Show password" }))
    .toBeInTheDocument();
});

test("login-01 links to real routes, never href='#'", async () => {
  const screen = await render(<Login01Page />);
  await expect
    .element(screen.getByRole("link", { name: "Forgot password?" }))
    .toHaveAttribute("href", "/forgot-password");
  await expect
    .element(screen.getByRole("link", { name: "Sign up" }))
    .toHaveAttribute("href", "/sign-up");
  expect(document.querySelector('a[href="#"]')).toBeNull();
});

test("login-01 shows a FieldError per empty field and focuses the first", async () => {
  let calls = 0;
  const screen = await render(
    <LoginForm
      signIn={async () => {
        calls++;
      }}
    />,
  );
  await screen.getByRole("button", { name: "Sign in" }).click();

  const email = screen.getByLabelText("Email");
  const passwordField = screen.getByLabelText("Password");
  await expect.element(email).toHaveAttribute("aria-invalid", "true");
  await expect.element(passwordField).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(email)
    .toHaveAccessibleDescription("Enter your email address");
  await expect
    .element(passwordField)
    .toHaveAccessibleDescription("Enter your password");
  await expect.element(email).toHaveFocus();
  // A field problem is not a failed sign-in: no request, and no form-level alert.
  expect(calls).toBe(0);
  expect(document.querySelector('[data-slot="alert"]')).toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  await email.fill("ada");
  await screen.getByRole("button", { name: "Sign in" }).click();
  await expect
    .element(email)
    .toHaveAccessibleDescription(
      "Enter an email address like name@example.com",
    );
});

test("login-01 keeps the submit button's name while it signs in", async () => {
  let settle: () => void = () => {};
  const screen = await render(
    <LoginForm
      signIn={() =>
        new Promise<void>((resolve) => {
          settle = resolve;
        })
      }
    />,
  );
  await screen.getByLabelText("Email").fill("ada@example.com");
  await screen.getByLabelText("Password").fill("correct horse");
  await userEvent.keyboard("{Enter}");

  const submit = screen.getByRole("button", { name: "Sign in" });
  await expect.element(submit).toHaveAttribute("aria-busy", "true");
  await expect.element(submit).toHaveAttribute("type", "submit");
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  settle();
  await expect.element(submit).not.toHaveAttribute("aria-busy");
  expect(document.querySelector('[role="alert"]')).toBeNull();
});
