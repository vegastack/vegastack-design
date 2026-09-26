import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, onTestFinished, test } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { Checkbox } from "./checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "./field";

/*
 * This lane compiles no Tailwind by default. The FRM-15 dimming assertions read a COMPUTED
 * opacity, so they inject the compiled token CSS for the one test that needs it.
 */
function withCompiledCss() {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

const glyphOf = (screen: { container: HTMLElement }) =>
  screen.container.querySelector('[data-slot="checkbox-indicator"] svg');

const classesOf = (screen: { container: HTMLElement }) =>
  (screen.container.querySelector('[data-slot="checkbox"]') as HTMLElement)
    .className;

test("renders a checkbox carrying data-slot and aria-checked (Usage)", async () => {
  const screen = await render(<Checkbox aria-label="Accept" />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept" });
  await expect.element(checkbox).toBeInTheDocument();
  await expect.element(checkbox).toHaveAttribute("data-slot", "checkbox");
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
});

/*
 * Base UI renders this control as a `<span role="…">`, and this lane compiles no Tailwind, so the
 * element has a zero-size box and Playwright refuses to click it ("element is not visible"). A
 * NATIVE `.click()` exercises the same handler without a hit test — the convention this repository
 * has used for every span-rendered control since the Base UI migration. The RENDERED pointer target
 * is proven separately, on compiled CSS, by `test/geometry.browser.test.tsx`.
 */
test("clicking toggles the checked state (Checked State)", async () => {
  const screen = await render(<Checkbox aria-label="Accept" />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept" });
  (checkbox.element() as HTMLElement).click();
  await expect.element(checkbox).toHaveAttribute("aria-checked", "true");
  await expect.element(checkbox).toHaveAttribute("data-checked", "");
  (checkbox.element() as HTMLElement).click();
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
});

test("a controlled checkbox follows its prop (Checked State)", async () => {
  let checked = false;
  const screen = await render(
    <Checkbox
      aria-label="Accept"
      checked={checked}
      onCheckedChange={(next) => (checked = next)}
    />,
  );
  (
    screen.getByRole("checkbox", { name: "Accept" }).element() as HTMLElement
  ).click();
  expect(checked).toBe(true);
});

test("indeterminate reports the mixed state (Checked State, Table)", async () => {
  const screen = await render(
    <Checkbox aria-label="Select all" indeterminate />,
  );
  await expect
    .element(screen.getByRole("checkbox", { name: "Select all" }))
    .toHaveAttribute("aria-checked", "mixed");
});

test("the indicator renders inside the control (Usage)", async () => {
  const screen = await render(<Checkbox aria-label="Accept" defaultChecked />);
  const indicator = screen.container.querySelector(
    '[data-slot="checkbox-indicator"]',
  );
  expect(indicator).not.toBeNull();
});

test("aria-invalid reaches the element (Invalid State)", async () => {
  const screen = await render(<Checkbox aria-label="Accept" aria-invalid />);
  await expect
    .element(screen.getByRole("checkbox", { name: "Accept" }))
    .toHaveAttribute("aria-invalid", "true");
});

test("a FieldLabel bound with htmlFor names the control (Basic, Description)", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <Checkbox id="terms" />
      <FieldLabel htmlFor="terms">Accept terms and conditions</FieldLabel>
    </Field>,
  );
  await expect
    .element(
      screen.getByRole("checkbox", { name: "Accept terms and conditions" }),
    )
    .toBeInTheDocument();
});

test("disabled blocks activation (Disabled)", async () => {
  let changes = 0;
  const screen = await render(
    <Checkbox
      aria-label="Accept"
      disabled
      onCheckedChange={() => (changes += 1)}
    />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Accept" });
  await expect.element(checkbox).toBeDisabled();
  (checkbox.element() as HTMLElement).click();
  expect(changes).toBe(0);
});

test("a FieldSet groups a checkbox list under one legend (Group)", async () => {
  const screen = await render(
    <FieldSet>
      <FieldLegend variant="label">Show on the desktop</FieldLegend>
      <FieldDescription>Pick the items to show.</FieldDescription>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox id="disks" defaultChecked />
          <FieldLabel htmlFor="disks">Hard disks</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="servers" />
          <FieldLabel htmlFor="servers">Connected servers</FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>,
  );
  expect(screen.container.querySelectorAll('[role="checkbox"]').length).toBe(2);
  await expect
    .element(screen.getByRole("checkbox", { name: "Hard disks" }))
    .toHaveAttribute("aria-checked", "true");
});

test("RTL: the control inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Checkbox aria-label="قبول" />
    </div>,
  );
  const checkbox = screen
    .getByRole("checkbox", { name: "قبول" })
    .element() as HTMLElement;
  expect(getComputedStyle(checkbox).direction).toBe("rtl");
});

test("A11Y-2: an invisible ::after extends the pointer target past 24px", async () => {
  const screen = await render(<Checkbox aria-label="Accept" />);
  const classes = classesOf(screen);
  expect(classes).toContain("after:absolute");
  expect(classes).toContain("after:-inset-x-3");
  expect(classes).toContain("after:-inset-y-2");
});

test("FOC-1/FOC-6: the recipe carries no focus glow and no outline suppression", async () => {
  const classes = classesOf(await render(<Checkbox aria-label="Accept" />));
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-14: the invalid border holds while the control is focused", async () => {
  const classes = classesOf(await render(<Checkbox aria-label="Accept" />));
  expect(classes).toContain("aria-invalid:border-destructive");
  expect(classes).not.toContain("not-focus:");
  expect(classes).toContain("aria-invalid:aria-checked:border-primary");
});

test("FOC-12: the control never cancels its own ring for a choice card", async () => {
  const classes = classesOf(await render(<Checkbox aria-label="Accept" />));
  expect(classes).not.toContain("group-has-[:focus-visible]/field-label:");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <Checkbox id="a11y-rest" />
      <FieldLabel htmlFor="a11y-rest">Accept</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — checked", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <Checkbox id="a11y-checked" defaultChecked />
      <FieldLabel htmlFor="a11y-checked">Accept</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — indeterminate", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <Checkbox id="a11y-mixed" indeterminate />
      <FieldLabel htmlFor="a11y-mixed">Select all</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field orientation="horizontal" data-invalid>
      <Checkbox id="a11y-invalid" aria-invalid />
      <FieldLabel htmlFor="a11y-invalid">Accept</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field orientation="horizontal" data-disabled>
      <Checkbox id="a11y-disabled" disabled />
      <FieldLabel htmlFor="a11y-disabled">Accept</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("A11Y-19: the mixed state draws a minus, not a check (Checked State, Table)", async () => {
  const screen = await render(
    <Checkbox aria-label="Select all" indeterminate />,
  );
  await expect
    .element(screen.getByRole("checkbox", { name: "Select all" }))
    .toHaveAttribute("aria-checked", "mixed");
  const glyph = glyphOf(screen);
  expect(glyph?.classList.contains("lucide-minus")).toBe(true);
  expect(
    screen.container.querySelectorAll('[data-slot="checkbox-indicator"] svg'),
  ).toHaveLength(1);
});

test("A11Y-19: the glyph swaps to a check when the mixed state resolves", async () => {
  function Parent() {
    const [state, setState] = React.useState<"mixed" | "checked">("mixed");
    return (
      <Checkbox
        aria-label="Select all"
        checked={state === "checked"}
        indeterminate={state === "mixed"}
        onCheckedChange={() => setState("checked")}
      />
    );
  }
  const screen = await render(<Parent />);
  expect(glyphOf(screen)?.classList.contains("lucide-minus")).toBe(true);
  (
    screen
      .getByRole("checkbox", { name: "Select all" })
      .element() as HTMLElement
  ).click();
  await expect
    .element(screen.getByRole("checkbox", { name: "Select all" }))
    .toHaveAttribute("aria-checked", "true");
  expect(glyphOf(screen)?.classList.contains("lucide-check")).toBe(true);
  expect(glyphOf(screen)?.classList.contains("lucide-minus")).toBe(false);
});

test("A11Y-19: a plain checked box keeps upstream's check", async () => {
  const screen = await render(<Checkbox aria-label="Accept" defaultChecked />);
  expect(glyphOf(screen)?.classList.contains("lucide-check")).toBe(true);
});

test("FRM-15: a disabled checkbox outside a Field is dimmed (Disabled)", async () => {
  withCompiledCss();
  const screen = await render(<Checkbox aria-label="Accept" disabled />);
  const checkbox = screen
    .getByRole("checkbox", { name: "Accept" })
    .element() as HTMLElement;
  expect(checkbox.hasAttribute("data-disabled")).toBe(true);
  expect(getComputedStyle(checkbox).opacity).toBe("0.5");
  expect(getComputedStyle(checkbox).cursor).toBe("not-allowed");
});

test("FRM-15: an enabled checkbox is not dimmed", async () => {
  withCompiledCss();
  const screen = await render(<Checkbox aria-label="Accept" />);
  const checkbox = screen
    .getByRole("checkbox", { name: "Accept" })
    .element() as HTMLElement;
  expect(getComputedStyle(checkbox).opacity).toBe("1");
});

test("FRM-15: the label dims with the control inside a disabled Field", async () => {
  withCompiledCss();
  const screen = await render(
    <Field orientation="horizontal" data-disabled="true">
      <Checkbox id="dim" disabled />
      <FieldLabel htmlFor="dim">Accept</FieldLabel>
    </Field>,
  );
  const checkbox = screen
    .getByRole("checkbox", { name: "Accept" })
    .element() as HTMLElement;
  const label = screen.container.querySelector(
    '[data-slot="field-label"]',
  ) as HTMLElement;
  expect(getComputedStyle(checkbox).opacity).toBe("0.5");
  expect(getComputedStyle(label).opacity).toBe("0.5");
});

test("FRM-15: the recipe keys disabled styles on data-disabled", async () => {
  const classes = classesOf(await render(<Checkbox aria-label="Accept" />));
  expect(classes).toContain("data-disabled:opacity-50");
  expect(classes).toContain("data-disabled:cursor-not-allowed");
  expect(classes).not.toMatch(/(?:^|\s)disabled:/);
});

test("no a11y violations — disabled outside a Field", async () => {
  const screen = await render(<Checkbox aria-label="Accept" disabled />);
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "Checkbox",
  render: (props) => <Checkbox {...props} />,
  find: (screen, name) => screen.getByRole("checkbox", { name }),
});
