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
 * Motion (Phase M) — Eye↔EyeOff keyed-presence swap.
 *
 * Same style-mirror technique as copy-button.test.tsx / auto-save-input.test.tsx
 * (see checkbox.test.tsx's "Touch-target remediation" section for the original
 * pattern) — this harness has no compiled Tailwind, so `motion-pop-in` /
 * `vs-pop-in` are mirrored locally.
 *
 * `motion-pop-in` (not a bespoke transition) was the deliberate choice here even
 * though this is a toggle, not a success state — see the deviation comment on
 * the icon swap in password-input.tsx for the reasoning (tiny spring overshoot,
 * and the sanctioned vocabulary has no plain-fade alternative that can animate a
 * freshly keyed-remounted element).
 * ------------------------------------------------------------------------------*/

function injectMotionPopInMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --duration-fast: 150ms;
      --motion-ease-spring: linear(0, 0.5 60%, 1.05 80%, 0.98 90%, 1);
    }
    @keyframes vs-pop-in {
      from { opacity: 0; scale: 0.9; }
      to { opacity: 1; scale: 1; }
    }
    .motion-pop-in {
      animation: vs-pop-in var(--duration-fast) var(--motion-ease-spring);
    }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("the Eye icon carries motion-pop-in with the vs-pop-in animation resolved", async () => {
  const cleanup = injectMotionPopInMirror();
  try {
    const screen = await render(<PasswordInput aria-label="Password" />);
    const toggle = screen
      .getByRole("button", { name: "Toggle password visibility" })
      .element() as HTMLElement;
    const icon = toggle.querySelector("svg") as SVGElement;
    expect(icon.classList.contains("motion-pop-in")).toBe(true);
    const computed = getComputedStyle(icon);
    expect(computed.animationName).toBe("vs-pop-in");
    expect(computed.animationDuration).toBe("0.15s");
  } finally {
    cleanup();
  }
});

test("the EyeOff icon carries motion-pop-in after toggling visibility on", async () => {
  const cleanup = injectMotionPopInMirror();
  try {
    const screen = await render(<PasswordInput aria-label="Password" />);
    const toggle = screen.getByRole("button", {
      name: "Toggle password visibility",
    });
    await toggle.click();
    const icon = toggle.element().querySelector("svg") as SVGElement;
    expect(icon.classList.contains("motion-pop-in")).toBe(true);
    expect(getComputedStyle(icon).animationName).toBe("vs-pop-in");
  } finally {
    cleanup();
  }
});

test("the icon remounts (new node identity) across the Eye/EyeOff swap", async () => {
  const screen = await render(<PasswordInput aria-label="Password" />);
  const toggle = screen.getByRole("button", {
    name: "Toggle password visibility",
  });
  const before = toggle.element().querySelector("svg");
  expect(before).not.toBeNull();

  await toggle.click();
  const after = toggle.element().querySelector("svg");
  expect(after).not.toBeNull();
  expect(after).not.toBe(before);
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
