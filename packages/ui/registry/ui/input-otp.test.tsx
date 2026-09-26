import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";
import { Field, FieldError, FieldLabel } from "./field";

/**
 * `OTPInput`'s props are a union over `render` vs `children`, so a `Partial<...>` spread widens to
 * "either branch" and stops assigning. The fixture therefore takes the handful of props these tests
 * actually vary, each explicitly typed.
 */
function Six(props: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <InputOTP maxLength={6} aria-label="Code" {...props}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

const slots = (screen: { container: HTMLElement }) =>
  screen.container.querySelectorAll('[data-slot="input-otp-slot"]');

const slotClasses = (screen: { container: HTMLElement }) =>
  (slots(screen)[0] as HTMLElement).className;

test("renders one hidden input and one slot per character (Usage, About)", async () => {
  const screen = await render(<Six />);
  expect(screen.container.querySelectorAll("input").length).toBe(1);
  expect(slots(screen).length).toBe(6);
  expect(
    screen.container.querySelector('[data-slot="input-otp"]'),
  ).not.toBeNull();
});

test("groups and the separator render around the slots (Composition, Separator)", async () => {
  const screen = await render(<Six />);
  expect(
    screen.container.querySelectorAll('[data-slot="input-otp-group"]').length,
  ).toBe(2);
  const separator = screen.container.querySelector(
    '[data-slot="input-otp-separator"]',
  );
  expect(separator?.getAttribute("role")).toBe("separator");
});

test("typing fills the slots in order (Usage)", async () => {
  const screen = await render(<Six />);
  const input = screen.container.querySelector("input") as HTMLInputElement;
  await userEvent.fill(input, "123");
  expect(slots(screen)[0]?.textContent).toBe("1");
  expect(slots(screen)[2]?.textContent).toBe("3");
});

test("the active slot is marked so the caret has a visible home (Usage)", async () => {
  const screen = await render(<Six />);
  const input = screen.container.querySelector("input") as HTMLInputElement;
  input.focus();
  await userEvent.fill(input, "12");
  expect(slots(screen)[2]?.getAttribute("data-active")).toBe("true");
});

test("a pattern rejects characters it does not accept (Pattern, Four Digits)", async () => {
  const screen = await render(
    <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS} aria-label="PIN">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>,
  );
  const input = screen.container.querySelector("input") as HTMLInputElement;
  input.focus();
  // `fill` sets the whole value at once, which the pattern rejects wholesale; typing is what the
  // filter is written for, and what a person does.
  await userEvent.keyboard("12ab");
  expect(input.value).toBe("12");
});

test("an alphanumeric pattern accepts letters (Alphanumeric)", async () => {
  const screen = await render(
    <InputOTP
      maxLength={4}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
      aria-label="Code"
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>,
  );
  const input = screen.container.querySelector("input") as HTMLInputElement;
  input.focus();
  await userEvent.keyboard("a1b2");
  expect(input.value).toBe("a1b2");
});

test("a controlled field reports every change (Controlled)", async () => {
  let value = "";
  const screen = await render(
    <Six value={value} onChange={(next: string) => (value = next)} />,
  );
  const input = screen.container.querySelector("input") as HTMLInputElement;
  await userEvent.fill(input, "12");
  expect(value).toBe("12");
});

test("disabled reaches the hidden input (Disabled)", async () => {
  const screen = await render(<Six disabled value="123456" />);
  const input = screen.container.querySelector("input") as HTMLInputElement;
  expect(input.disabled).toBe(true);
});

test("aria-invalid on the slots and FieldError carry the error (Invalid)", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="otp-invalid">Code</FieldLabel>
      <InputOTP id="otp-invalid" maxLength={2} defaultValue="00">
        <InputOTPGroup>
          <InputOTPSlot index={0} aria-invalid />
          <InputOTPSlot index={1} aria-invalid />
        </InputOTPGroup>
      </InputOTP>
      <FieldError>That code has expired.</FieldError>
    </Field>,
  );
  expect(slots(screen)[0]?.getAttribute("aria-invalid")).toBe("true");
  await expect
    .element(screen.getByText("That code has expired."))
    .toBeInTheDocument();
});

test("it submits inside a form (Form)", async () => {
  let submitted = false;
  const screen = await render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitted = true;
      }}
    >
      <Six />
      <button type="submit">Verify</button>
    </form>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Verify" }));
  expect(submitted).toBe(true);
});

test("RTL: the slots inherit direction from their container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Six />
    </div>,
  );
  expect(getComputedStyle(slots(screen)[0] as HTMLElement).direction).toBe(
    "rtl",
  );
});

test("A11Y-2: a slot is 32px, past the 24px target floor", async () => {
  const screen = await render(<Six />);
  expect(slotClasses(screen)).toContain("size-8");
});

test("FOC-1/FOC-6: no slot carries a focus glow", async () => {
  const screen = await render(<Six />);
  for (const slot of slots(screen)) {
    const classes = (slot as HTMLElement).className;
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
  }
  const group = screen.container.querySelector(
    '[data-slot="input-otp-group"]',
  ) as HTMLElement;
  expect(group.className).not.toMatch(/ring-3|ring-destructive\/\d+/);
});

test("FOC-14: the active slot takes the background tint, never a border change", async () => {
  const screen = await render(<Six />);
  expect(slotClasses(screen)).toContain("data-[active=true]:bg-accent/50");
  expect(slotClasses(screen)).not.toMatch(/data-\[active=true\]:border-/);
});

test("FOC-14: the invalid border holds on the slot holding the caret", async () => {
  const screen = await render(<Six />);
  expect(slotClasses(screen)).toContain("aria-invalid:border-destructive");
  expect(slotClasses(screen)).not.toContain("not-data-[active=true]:");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="otp-a11y">Verification code</FieldLabel>
      <InputOTP id="otp-a11y" maxLength={2}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — filled", async () => {
  const screen = await render(<Six defaultValue="123456" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Six disabled value="123456" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="otp-a11y-invalid">Verification code</FieldLabel>
      <InputOTP id="otp-a11y-invalid" maxLength={2} defaultValue="00">
        <InputOTPGroup>
          <InputOTPSlot index={0} aria-invalid />
          <InputOTPSlot index={1} aria-invalid />
        </InputOTPGroup>
      </InputOTP>
      <FieldError>That code has expired.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
