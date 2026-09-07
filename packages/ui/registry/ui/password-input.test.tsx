import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { PasswordInput } from "./password-input";

test('renders a masked field (type="password") by default', async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  await expect
    .element(screen.getByLabelText("Password", { exact: true }))
    .toHaveAttribute("type", "password");
});

test('toggle reveals the value (type="text") and hides it again', async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const field = screen.getByLabelText("Password", { exact: true });
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });

  await expect.element(field).toHaveAttribute("type", "password");
  await toggle.click();
  await expect.element(field).toHaveAttribute("type", "text");
  await toggle.click();
  await expect.element(field).toHaveAttribute("type", "password");
});

test("toggle reflects state via aria-pressed", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });
  await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
});

test("toggle aria-label is customizable", async () => {
  const screen = await render(
    <PasswordInput aria-label="Password" toggleAriaLabel="Show password" />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Show password" }))
    .toBeInTheDocument();
});

test("renders the requirements checklist with met/unmet rows", async () => {
  const screen = await render(
    <PasswordInput
      aria-label="Password"
      requirements={[
        { label: "At least 8 characters", met: true },
        { label: "Contains a number", met: false },
      ]}
    />,
  );
  await expect
    .element(screen.getByText("At least 8 characters"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Contains a number"))
    .toBeInTheDocument();
});

test("associates requirements with the field and exposes met/unmet state text", async () => {
  const screen = await render(
    <PasswordInput
      aria-label="Password"
      aria-describedby="password-help"
      requirements={[
        { label: "At least 8 characters", met: true },
        { label: "Contains a number", met: false },
      ]}
    />,
  );

  const field = screen.getByLabelText("Password", { exact: true });
  const list = screen.container.querySelector(
    '[data-slot="password-input-requirements"]',
  );
  expect(list?.id).toBeTruthy();
  const describedBy = field.element().getAttribute("aria-describedby") ?? "";
  expect(describedBy).toContain("password-help");
  expect(describedBy).toContain(list!.id);
  expect(describedBy.trim().split(/\s+/)).toHaveLength(2);
  expect(screen.container.textContent).toContain("Met: At least 8 characters");
  expect(screen.container.textContent).toContain("Not met: Contains a number");
  expect(screen.container.textContent).toContain(
    "1 of 2 password requirements met",
  );
});

test("toggle is keyboard reachable and activates via keyboard (WCAG 2.1.1)", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const field = screen.getByLabelText("Password", { exact: true });
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });

  // Regression guard: the reveal control must NOT be forced out of the tab order.
  await expect.element(toggle).not.toHaveAttribute("tabindex", "-1");

  // Keyboard activation flips visibility both ways (Enter and Space) — a pointer is never
  // required. Focus is set programmatically rather than via simulated Tab: whether Tab reaches
  // a <button> is a browser/OS convention (WebKit skips buttons per macOS Full-Keyboard-Access
  // semantics), not a component property — the cross-browser smoke lane (Phase M) caught the
  // Tab-simulation variant failing on webkit/firefox while activation itself works everywhere.
  (toggle.element() as HTMLElement).focus();
  await expect.element(toggle).toHaveFocus();
  await expect.element(field).toHaveAttribute("type", "password");
  await userEvent.keyboard("{Enter}");
  await expect.element(field).toHaveAttribute("type", "text");
  await userEvent.keyboard(" ");
  await expect.element(field).toHaveAttribute("type", "password");
});

test("disabled disables both the field and the toggle", async () => {
  const screen = await render(<PasswordInput aria-label="Password" disabled />);
  await expect
    .element(screen.getByLabelText("Password", { exact: true }))
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Toggle password visibility" }))
    .toBeDisabled();
});

test("forwards ref to the underlying input element", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(<PasswordInput ref={ref} aria-label="Password" />);
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe("input");
});

test("no a11y violations", async () => {
  const screen = await render(
    <PasswordInput
      aria-label="Password"
      requirements={[
        { label: "At least 8 characters", met: true },
        { label: "Contains a number", met: false },
      ]}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<PasswordInput aria-label="Password" disabled />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — visibility toggled", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });
  await toggle.click();
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------
 * Motion — there is NONE, and that is the assertion (audit B8-08, 2026-09-07).
 *
 * The eye swap used to replay `motion-pop-in` on every toggle behind a
 * `hasToggledRef` guard whose only job was to stop the animation firing on first
 * paint — a tell that the animation did not belong there. A visibility toggle is
 * not an arrival and not a success; Geist and Linear both swap the glyph
 * instantly. These tests fail if any motion utility comes back.
 * ------------------------------------------------------------------------------*/

test("neither glyph carries a motion utility, at mount or after a toggle", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });
  const initial = toggle.element().querySelector("svg") as SVGElement;
  expect(initial.className.baseVal).not.toMatch(/motion-/);

  await toggle.click();
  const swapped = toggle.element().querySelector("svg") as SVGElement;
  expect(swapped.className.baseVal).not.toMatch(/motion-/);
});

test("the toggle is an IconButton with the ghost recipe and an accessible name", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });
  await expect.element(toggle).toHaveAttribute("data-slot", "icon-button");
  await expect.element(toggle).toHaveAttribute("data-variant", "ghost");
  await expect.element(toggle).toHaveAttribute("data-size", "xs");
});

test("rapid double-toggle settles on the correct icon and type without crashing", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const field = screen.getByLabelText("Password", { exact: true });
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });

  await toggle.click();
  await toggle.click();
  await expect.element(field).toHaveAttribute("type", "password");
  await expect.element(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await expect.element(field).toHaveAttribute("type", "text");
  await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
});

// Reduced-motion note: the global `prefers-reduced-motion: reduce` reset in
// packages/design-tokens/src/base.css forces `animation-duration: 0.01ms !important` on
// every element, and `vs-pop-in`'s `to` state (opacity: 1, scale: 1) already
// equals the icon's natural resting style. No per-component `motion-reduce:`
// variant is needed here by design.
