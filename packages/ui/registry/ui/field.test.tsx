import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Field,
  FieldRoot,
  FieldLabel,
  FieldControl,
  FieldError,
  FieldSuccess,
} from "./field";
import { Textarea } from "./textarea";

test("renders the label associated with the control", async () => {
  const screen = await render(
    <Field label="Email">
      <FieldControl />
    </Field>,
  );
  // The label resolves the control by accessible name → association is wired.
  await expect.element(screen.getByLabelText("Email")).toBeInTheDocument();
});

test("renders the description as helper text", async () => {
  const screen = await render(
    <Field label="Email" description="We never share it.">
      <FieldControl />
    </Field>,
  );
  await expect
    .element(screen.getByText("We never share it."))
    .toBeInTheDocument();
});

test("error message shows and marks the control aria-invalid", async () => {
  const screen = await render(
    <Field label="Email" error="Email is required">
      <FieldControl />
    </Field>,
  );
  await expect
    .element(screen.getByText("Email is required"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByLabelText("Email"))
    .toHaveAttribute("aria-invalid", "true");
});

test("error is announced as a polite status, not an alert (audit D23)", async () => {
  // Inline validation is a user-initiated RESULT — the person just typed or submitted and is
  // looking at the field. `alert` interrupts whatever the screen reader was saying; it stays
  // reserved for something that arrives without being asked for.
  const screen = await render(
    <Field label="Email" error="Email is required">
      <FieldControl />
    </Field>,
  );
  const status = screen.getByRole("status");
  await expect.element(status).toHaveTextContent("Email is required");
  await expect.element(status).toHaveAttribute("aria-live", "polite");
  await expect.element(status).toHaveAttribute("aria-atomic", "true");
  expect(screen.container.querySelector('[role="alert"]')).toBeNull();
});

test("helper text renders BELOW the control, error below that (audit D4)", async () => {
  const screen = await render(
    <Field label="Email" description="We never share it." error="Required">
      <FieldControl />
    </Field>,
  );
  const nodes = Array.from(
    screen.container.querySelectorAll(
      '[data-slot="field-label"],[data-slot="field-control"],[data-slot="field-description"],[data-slot="field-error"]',
    ),
  ).map((node) => (node as HTMLElement).dataset.slot);
  expect(nodes).toEqual([
    "field-label",
    "field-control",
    "field-description",
    "field-error",
  ]);
});

test("success message renders when there is no error", async () => {
  const screen = await render(
    <Field label="Username" success="Looks good!">
      <FieldControl />
    </Field>,
  );
  await expect.element(screen.getByText("Looks good!")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Looks good!");
  await expect
    .element(screen.getByRole("status"))
    .toHaveAttribute("aria-live", "polite");
  await expect
    .element(screen.getByLabelText("Username"))
    .not.toHaveAttribute("aria-invalid");
});

test("applies the orientation data attribute", async () => {
  const screen = await render(
    <Field label="Notify me" orientation="horizontal">
      <FieldControl type="checkbox" />
    </Field>,
  );
  const root = screen.container.querySelector('[data-slot="field"]');
  expect(root).not.toBeNull();
  expect(root).toHaveAttribute("data-orientation", "horizontal");
});

test("renders an inline label action", async () => {
  const screen = await render(
    <Field label="Password" labelAction={<a href="/forgot">Forgot?</a>}>
      <FieldControl type="password" />
    </Field>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Forgot?" }))
    .toHaveAttribute("href", "/forgot");
});

test("primitives compose with auto-wired accessibility", async () => {
  const screen = await render(
    <FieldRoot>
      <FieldLabel>City</FieldLabel>
      <FieldControl />
      <FieldError match>City is required</FieldError>
    </FieldRoot>,
  );
  await expect.element(screen.getByLabelText("City")).toBeInTheDocument();
  await expect
    .element(screen.getByText("City is required"))
    .toBeInTheDocument();
});

test("FieldRoot forwards ref to the underlying root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <FieldRoot ref={ref}>
      <FieldLabel>City</FieldLabel>
      <FieldControl />
    </FieldRoot>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("field");
});

test("FieldControl forwards ref to the underlying input element", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(
    <FieldRoot>
      <FieldLabel>City</FieldLabel>
      <FieldControl ref={ref} />
    </FieldRoot>,
  );
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe("field-control");
});

test("no a11y violations", async () => {
  const screen = await render(
    <Field label="Email" description="We never share it.">
      <FieldControl type="email" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — error", async () => {
  const screen = await render(
    <Field label="Email" error="Email is required">
      <FieldControl type="email" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("horizontal orientation renders the description (register P0-05)", async () => {
  const screen = await render(
    <Field
      label="Set as default"
      description="Applies to every new project."
      orientation="horizontal"
    >
      <FieldControl type="checkbox" />
    </Field>,
  );
  await expect
    .element(screen.getByText("Applies to every new project."))
    .toBeInTheDocument();
});

/* ---------------------------------------------------------------------------------------------
 * The invalid SHAKE lives HERE (audit D5, 2026-09-07). It used to be wired into five controls
 * individually — Input, Checkbox, RadioGroupItem, OTPInput and NumberField each carried the same
 * `useShakeOnInvalid` + `mergeRefs` + `onAnimationEnd` plumbing — while `Textarea`, the sibling
 * of the first one, silently had none. One observer on the field root replaces all of it, so
 * every control a `Field` wraps reacts identically. The whole field shakes as one block, label
 * and message included. `FieldError` itself stays still: Base UI only renders it while invalid,
 * so it mounts fresh on every new error and needs no motion of its own.
 * ------------------------------------------------------------------------------------------- */

test("FieldError stays still when an error is present at mount", async () => {
  const screen = await render(
    <Field label="Email" error="Email is required">
      <FieldControl />
    </Field>,
  );
  await expect
    .element(screen.getByRole("status"))
    .not.toHaveClass("motion-enter-up");
});

test("FieldSuccess announces a polite atomic status by default", async () => {
  const screen = await render(<FieldSuccess>Saved</FieldSuccess>);
  const status = screen.getByRole("status");
  await expect.element(status).toHaveAttribute("aria-live", "polite");
  await expect.element(status).toHaveAttribute("aria-atomic", "true");
});

test("borderless fields keep a transparent border for the text-entry focus tint", async () => {
  const screen = await render(
    <Field label="Title" borderless>
      <FieldControl />
    </Field>,
  );
  const root = screen.container.querySelector(
    '[data-slot="field"]',
  ) as HTMLElement;
  expect(root.className).toContain(
    "[&_[data-slot=field-control]]:border-transparent",
  );
  expect(root.className).not.toContain(
    "[&_[data-slot=field-control]]:border-none",
  );
});

test("the FIELD shakes once when it transitions into invalid", async () => {
  function Harness() {
    const [error, setError] = React.useState<string | undefined>(undefined);
    return (
      <div>
        <button type="button" onClick={() => setError("Required")}>
          fail
        </button>
        <Field label="Email" error={error}>
          <FieldControl />
        </Field>
      </div>
    );
  }
  const screen = await render(<Harness />);
  const root = screen.container.querySelector(
    '[data-slot="field"]',
  ) as HTMLElement;
  expect(root.className).not.toContain("motion-shake");
  await screen.getByRole("button", { name: "fail" }).click();
  await expect.element(root).toHaveClass("motion-shake");
  // The control inside does NOT shake independently — one block, not two.
  expect(
    (screen.getByLabelText("Email").element() as HTMLElement).className,
  ).not.toContain("motion-shake");
});

test("a field rendered invalid at mount does not shake", async () => {
  // A form re-rendered with server-side errors must not twitch on first paint.
  const screen = await render(
    <Field label="Email" error="Required">
      <FieldControl />
    </Field>,
  );
  const root = screen.container.querySelector(
    '[data-slot="field"]',
  ) as HTMLElement;
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(root.className).not.toContain("motion-shake");
});

test("shakeSignal re-shakes a field that never stopped being invalid", async () => {
  function Harness() {
    const [signal, setSignal] = React.useState(0);
    return (
      <div>
        <button type="button" onClick={() => setSignal((s) => s + 1)}>
          retry
        </button>
        <Field label="Email" error="Required" shakeSignal={signal}>
          <FieldControl />
        </Field>
      </div>
    );
  }
  const screen = await render(<Harness />);
  const root = screen.container.querySelector(
    '[data-slot="field"]',
  ) as HTMLElement;
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(root.className).not.toContain("motion-shake");
  await screen.getByRole("button", { name: "retry" }).click();
  await expect.element(root).toHaveClass("motion-shake");
});

test("shaking a focused, mid-typed field steals neither focus nor the caret", async () => {
  // The realistic trigger: the user is actively typing and the field fails live validation.
  // The animated element is never remounted, which is what rules out a key-remount here.
  function Harness() {
    const [value, setValue] = React.useState("");
    const invalid = value.length > 0 && !value.includes("@");
    return (
      <Field label="Email" error={invalid ? "Enter an email" : undefined}>
        <FieldControl
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
    );
  }
  const screen = await render(<Harness />);
  const input = screen.getByLabelText("Email").element() as HTMLInputElement;
  input.focus();
  await screen.getByLabelText("Email").fill("not-an-email");

  const root = screen.container.querySelector(
    '[data-slot="field"]',
  ) as HTMLElement;
  await expect
    .poll(() => root.className, { timeout: 2000 })
    .toContain("motion-shake");
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe("not-an-email");
});

test("Textarea inside a Field shakes too — the behaviour it never had of its own", async () => {
  function Harness() {
    const [error, setError] = React.useState<string | undefined>(undefined);
    return (
      <div>
        <button type="button" onClick={() => setError("Required")}>
          fail
        </button>
        <Field label="Notes" error={error}>
          <Textarea aria-label="Notes body" />
        </Field>
      </div>
    );
  }
  const screen = await render(<Harness />);
  const root = screen.container.querySelector(
    '[data-slot="field"]',
  ) as HTMLElement;
  expect(root.className).not.toContain("motion-shake");
  await screen.getByRole("button", { name: "fail" }).click();
  await expect.element(root).toHaveClass("motion-shake");
});

test("no a11y violations — error and helper text together", async () => {
  const screen = await render(
    <Field label="Email" description="We never share it." error="Required">
      <FieldControl type="email" />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
