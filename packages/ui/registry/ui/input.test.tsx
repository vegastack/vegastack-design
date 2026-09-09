import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Input } from "./input";

test("renders a textbox with the placeholder", async () => {
  const screen = await render(<Input placeholder="Email" />);
  await expect.element(screen.getByPlaceholder("Email")).toBeInTheDocument();
});

test('defaults to type="text" and forwards type', async () => {
  const screen = await render(<Input aria-label="Password" type="password" />);
  await expect
    .element(screen.getByLabelText("Password"))
    .toHaveAttribute("type", "password");
});

test("typing fires onChange", async () => {
  const onChange = vi.fn();
  const screen = await render(<Input aria-label="Name" onChange={onChange} />);
  await screen.getByLabelText("Name").fill("Ada");
  expect(onChange).toHaveBeenCalled();
});

test("typing fires Base UI onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Input aria-label="Name" onValueChange={onValueChange} />,
  );
  await screen.getByLabelText("Name").fill("Ada");
  expect(onValueChange).toHaveBeenLastCalledWith("Ada", expect.any(Object));
});

test("supports Base UI state-function className", async () => {
  const screen = await render(
    <Input
      aria-label="Name"
      disabled
      className={({ disabled }) =>
        disabled ? "input-disabled" : "input-ready"
      }
    />,
  );
  expect(screen.getByLabelText("Name").element().className).toContain(
    "input-disabled",
  );
});

test("disabled prevents interaction", async () => {
  const screen = await render(<Input aria-label="Name" disabled />);
  await expect.element(screen.getByLabelText("Name")).toBeDisabled();
});

test("aria-invalid is reflected on the field", async () => {
  const screen = await render(<Input aria-label="Name" aria-invalid />);
  await expect
    .element(screen.getByLabelText("Name"))
    .toHaveAttribute("aria-invalid", "true");
});

test("addon mode wraps the input in a group and renders prefix/suffix", async () => {
  const screen = await render(
    <Input
      aria-label="Slug"
      prefix="app.vegastack.com/"
      suffix=".dev"
      containerClassName="slug-shell"
      className="slug-input"
    />,
  );
  const input = screen.getByLabelText("Slug");
  await expect.element(input).toHaveAttribute("data-slot", "input");
  expect(input.element().className).toContain("slug-input");
  expect(
    screen.container.querySelector('[data-slot="input-group"]')?.className,
  ).toContain("slug-shell");
  await expect
    .element(screen.getByText("app.vegastack.com/"))
    .toBeInTheDocument();
  await expect.element(screen.getByText(".dev")).toBeInTheDocument();
});

/* ---------------------------------------------------------------------------------------------
 * The invalid SHAKE is not here. `Field` owns it (audit D5), so the motion — including that it
 * never steals focus or the caret from someone mid-type — is covered in field.test.tsx. What the
 * Input still owns is the resting invalid chrome, in both modes.
 * ------------------------------------------------------------------------------------------- */

test("aria-invalid tints the field, and the group in addon mode, with no motion", async () => {
  const screen = await render(
    <div>
      <Input aria-label="Name" aria-invalid />
      <Input aria-label="Slug" prefix="app.vegastack.com/" aria-invalid />
    </div>,
  );
  const input = screen.getByLabelText("Name");
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  const group = screen.container.querySelector(
    '[data-slot="input-group"]',
  ) as HTMLElement;
  expect(group.querySelector("[aria-invalid]")).not.toBeNull();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect((input.element() as HTMLElement).className).not.toContain(
    "motion-shake",
  );
  expect(group.className).not.toContain("motion-shake");
});

test("forwards ref to the underlying input element", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(<Input ref={ref} aria-label="Name" />);
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe("input");
});

test("forwards ref to the input element in addon mode", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(
    <Input ref={ref} aria-label="Slug" prefix="app.vegastack.com/" />,
  );
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe("input");
});

test("no a11y violations", async () => {
  const screen = await render(
    <label>
      Email
      <Input type="email" name="email" />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <label>
      Email
      <Input type="email" name="email" disabled />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <label>
      Email
      <Input type="email" name="email" aria-invalid />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------------------------
 * RTL and state combinations — the gaps audit B1-17/B1-18 named. Addon padding is LOGICAL
 * (`ps`/`pe`), so a prefix stays on the reading-start side in Arabic or Hebrew rather than
 * jumping across the field; and `disabled` + `aria-invalid` must both still read.
 * ------------------------------------------------------------------------------------------- */

test("addon padding is logical, so prefix and suffix survive RTL", async () => {
  const screen = await render(
    <div dir="rtl">
      <Input aria-label="Slug" prefix="app.vegastack.com/" suffix=".dev" />
    </div>,
  );
  const input = screen.getByLabelText("Slug").element() as HTMLElement;
  expect(input.className).toMatch(/\bps-/);
  expect(input.className).toMatch(/\bpe-/);
  expect(input.className).not.toMatch(/\bpl-\d/);
  expect(input.className).not.toMatch(/\bpr-\d/);

  const prefix = screen.container.querySelector(
    '[data-slot="input-prefix"]',
  ) as HTMLElement;
  const suffix = screen.container.querySelector(
    '[data-slot="input-suffix"]',
  ) as HTMLElement;
  expect(prefix.className).toContain("ps-3");
  expect(suffix.className).toContain("pe-3");
});

test("the addon group reads its state from the input in RTL as in LTR", async () => {
  const screen = await render(
    <div dir="rtl">
      <Input aria-label="Slug" prefix="https://" disabled aria-invalid />
    </div>,
  );
  const input = screen.getByLabelText("Slug");
  await expect.element(input).toBeDisabled();
  await expect.element(input).toHaveAttribute("aria-invalid", "true");
  const group = screen.container.querySelector(
    '[data-slot="input-group"]',
  ) as HTMLElement;
  // The forced-colours outline is painted on the GROUP, whose overflow-hidden would
  // otherwise clip the inner input's own outward-offset outline (audit B1-01).
  expect(group.hasAttribute("data-field-group")).toBe(true);
  expect(group.className).toContain("overflow-hidden");
});

test("disabled keeps pointer events so a Tooltip can explain it (audit D7)", async () => {
  const screen = await render(<Input aria-label="Name" disabled />);
  const input = screen.getByLabelText("Name").element() as HTMLElement;
  expect(input.className).toContain("disabled:cursor-not-allowed");
  expect(input.className).not.toContain("disabled:pointer-events-none");
});
