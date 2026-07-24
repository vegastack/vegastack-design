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

test("error is announced via role=alert", async () => {
  const screen = await render(
    <Field label="Email" error="Email is required">
      <FieldControl />
    </Field>,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Email is required");
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
 * Phase M — error-shake. `FieldError` gets a mount-triggered `motion-enter-up` slide-in (Base UI
 * only renders it while invalid, so it naturally mounts fresh on every new error — no JS needed).
 * `Field` deliberately does NOT also drive its own `useShakeOnInvalid` shake: the composed control
 * (`Input`/`Checkbox`/`RadioGroupItem`/`OTPInput`) self-registers with Base UI's Field context and
 * receives `aria-invalid`/`data-invalid` directly, so it already shakes itself — see the block
 * comment on `FieldError` in `field.tsx` for the full double-shake rationale.
 * ------------------------------------------------------------------------------------------- */

test("FieldError stays still when an error is present at mount", async () => {
  const screen = await render(
    <Field label="Email" error="Email is required">
      <FieldControl />
    </Field>,
  );
  await expect
    .element(screen.getByRole("alert"))
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

test("a bare Input nested in Field auto-shakes once when Field becomes invalid", async () => {
  // Bare `<Input>` (the composition shown in Field's own JSDoc examples, not the lower-level
  // `FieldControl` primitive) self-registers with Base UI's Field context — Base UI's `Input` IS
  // `Field.Control` under the hood — so it receives `aria-invalid` directly and shakes itself.
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
  const input = screen.getByLabelText("Email");
  await expect.element(input).not.toHaveClass("motion-shake");
  await screen.getByRole("button", { name: "fail" }).click();
  await expect.element(input).toHaveClass("motion-shake");
});
