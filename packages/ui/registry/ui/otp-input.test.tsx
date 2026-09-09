import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { OTPInput } from "./otp-input";

test("renders the requested number of slots", async () => {
  const screen = await render(<OTPInput aria-label="Code" length={4} />);
  const slots = screen.container.querySelectorAll(
    '[data-slot="otp-input-slot"]',
  );
  expect(slots.length).toBe(4);
});

test("defaults to 6 slots and sets data-slot on the root", async () => {
  const screen = await render(<OTPInput aria-label="Code" />);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="otp-input"]',
  );
  expect(root).not.toBeNull();
  await expect.element(root!).toBeInTheDocument();
  expect(
    screen.container.querySelectorAll('[data-slot="otp-input-slot"]').length,
  ).toBe(6);
});

test("normalizes invalid lengths and group values", async () => {
  const invalidLength = await render(
    <OTPInput aria-label="Code" length={Number.POSITIVE_INFINITY} />,
  );
  expect(
    invalidLength.container.querySelectorAll('[data-slot="otp-input-slot"]')
      .length,
  ).toBe(6);

  const invalidGroups = await render(
    <OTPInput aria-label="Grouped code" groups={[2, Number.NaN, 2]} />,
  );
  expect(
    invalidGroups.container.querySelectorAll('[data-slot="otp-input-slot"]')
      .length,
  ).toBe(4);
});

test("associates a standalone visible-name fallback with only the first slot", async () => {
  const screen = await render(
    <OTPInput aria-label="Verification code" length={4} />,
  );
  const first = screen
    .getByRole("textbox", { name: "Verification code" })
    .element() as HTMLInputElement;
  const label = screen.container.querySelector(`label[for="${first.id}"]`);
  expect(label?.textContent).toBe("Verification code");
  expect(label?.querySelectorAll("input").length).toBe(0);
});

test("renders grouped slots with Base UI separators", async () => {
  const screen = await render(<OTPInput aria-label="Code" groups={[3, 3]} />);
  expect(
    screen.container.querySelectorAll('[data-slot="otp-input-slot"]').length,
  ).toBe(6);
  const separators = screen.container.querySelectorAll(
    '[data-slot="otp-input-separator"]',
  );
  expect(separators.length).toBe(1);
  expect(separators[0]?.textContent).toBe("-");
  await expect
    .element(screen.getByRole("textbox", { name: "Character 4 of 6" }))
    .toBeInTheDocument();
});

test("focused slot darkens its border as the sole focus cue (no ring)", async () => {
  const screen = await render(<OTPInput aria-label="Code" length={3} />);
  const firstSlot = screen.container.querySelector(
    '[data-slot="otp-input-slot"]',
  );
  expect(firstSlot?.className).toContain(
    "focus:border-ring/(--alpha-tint-border)",
  );
  expect(firstSlot?.className).not.toContain("focus-visible:ring-2");
});

test("typing fills slots and fires onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <OTPInput
      aria-label="Verification code"
      length={4}
      onValueChange={onValueChange}
    />,
  );
  // The first slot inherits the field's accessible name ("Verification code").
  await screen.getByRole("textbox", { name: "Verification code" }).click();
  await userEvent.keyboard("12");
  expect(onValueChange).toHaveBeenCalled();
  expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("12");
});

test("disabled disables every slot", async () => {
  const screen = await render(
    <OTPInput aria-label="Code" length={3} disabled />,
  );
  const slots = screen.container.querySelectorAll<HTMLInputElement>(
    '[data-slot="otp-input-slot"]',
  );
  for (const slot of slots) {
    expect(slot).toBeDisabled();
  }
});

test("renders the controlled value into its slots", async () => {
  const screen = await render(
    <OTPInput
      aria-label="Code"
      length={4}
      value="42"
      onValueChange={() => {}}
    />,
  );
  const slots = screen.container.querySelectorAll<HTMLInputElement>(
    '[data-slot="otp-input-slot"]',
  );
  expect(slots[0]?.value).toBe("4");
  expect(slots[1]?.value).toBe("2");
});

/* ---------------------------------------------------------------------------------------------
 * The invalid SHAKE is not here. `Field` owns it (audit D5), so the motion lives in
 * field.test.tsx; the slot's resting invalid chrome is what this file still asserts.
 * ------------------------------------------------------------------------------------------- */

test("aria-invalid marks the field without any motion of its own", async () => {
  const screen = await render(
    <OTPInput aria-label="Code" length={4} aria-invalid />,
  );
  const root = screen.container.querySelector(
    '[data-slot="otp-input"]',
  ) as HTMLElement;
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(root.className).not.toContain("motion-shake");
});

test("forwards ref to the underlying otp root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<OTPInput ref={ref} aria-label="Code" length={4} />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("otp-input");
});

test("no a11y violations", async () => {
  const screen = await render(
    <OTPInput aria-label="One-time passcode" length={6} />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <OTPInput aria-label="One-time passcode" length={6} disabled />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — filled (complete)", async () => {
  const screen = await render(
    <OTPInput
      aria-label="One-time passcode"
      length={6}
      value="123456"
      onValueChange={() => {}}
    />,
  );
  await expectNoA11yViolations(screen.container);
});
