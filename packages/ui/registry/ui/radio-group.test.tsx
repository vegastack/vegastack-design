import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, onTestFinished, test } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "./field";
import { Label } from "./label";

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

const itemClasses = (screen: { container: HTMLElement }) =>
  (
    screen.container.querySelector(
      '[data-slot="radio-group-item"]',
    ) as HTMLElement
  ).className;

function Basic({ defaultValue = "one" }: { defaultValue?: string }) {
  return (
    <RadioGroup defaultValue={defaultValue} aria-label="Options">
      <div className="flex items-center gap-3">
        <RadioGroupItem value="one" id="one" />
        <Label htmlFor="one">Option One</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="two" id="two" />
        <Label htmlFor="two">Option Two</Label>
      </div>
    </RadioGroup>
  );
}

test("renders a radiogroup of radios carrying data-slot (Usage, Composition)", async () => {
  const screen = await render(<Basic />);
  const group = screen.getByRole("radiogroup", { name: "Options" });
  await expect.element(group).toHaveAttribute("data-slot", "radio-group");
  const radios = screen.container.querySelectorAll('[role="radio"]');
  expect(radios.length).toBe(2);
  expect(radios[0]?.getAttribute("data-slot")).toBe("radio-group-item");
});

test("the default value is the checked option (Usage)", async () => {
  const screen = await render(<Basic />);
  await expect
    .element(screen.getByRole("radio", { name: "Option One" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("radio", { name: "Option Two" }))
    .toHaveAttribute("aria-checked", "false");
});

/*
 * Base UI renders this control as a `<span role="…">`, and this lane compiles no Tailwind, so the
 * element has a zero-size box and Playwright refuses to click it ("element is not visible"). A
 * NATIVE `.click()` exercises the same handler without a hit test — the convention this repository
 * has used for every span-rendered control since the Base UI migration. The RENDERED pointer target
 * is proven separately, on compiled CSS, by `test/geometry.browser.test.tsx`.
 */
test("clicking moves the selection (Usage)", async () => {
  const screen = await render(<Basic />);
  (
    screen.getByRole("radio", { name: "Option Two" }).element() as HTMLElement
  ).click();
  await expect
    .element(screen.getByRole("radio", { name: "Option Two" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("radio", { name: "Option One" }))
    .toHaveAttribute("aria-checked", "false");
});

test("the indicator renders only on the selected item (Usage)", async () => {
  const screen = await render(<Basic />);
  expect(
    screen.container.querySelectorAll('[data-slot="radio-group-indicator"]')
      .length,
  ).toBe(1);
});

test("FieldContent gives an option a description (Description)", async () => {
  const screen = await render(
    <RadioGroup defaultValue="comfortable" aria-label="Density">
      <Field orientation="horizontal">
        <RadioGroupItem value="comfortable" id="comfortable" />
        <FieldContent>
          <FieldLabel htmlFor="comfortable">Comfortable</FieldLabel>
          <FieldDescription>More space between elements.</FieldDescription>
        </FieldContent>
      </Field>
    </RadioGroup>,
  );
  await expect
    .element(screen.getByRole("radio", { name: "Comfortable" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByText("More space between elements."))
    .toBeInTheDocument();
});

test("a choice card wraps the whole Field in its label (Choice Card)", async () => {
  const screen = await render(
    <RadioGroup defaultValue="plus" aria-label="Plan">
      <FieldLabel htmlFor="plus-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Plus</FieldTitle>
            <FieldDescription>For small teams.</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="plus" id="plus-plan" />
        </Field>
      </FieldLabel>
    </RadioGroup>,
  );
  const radio = screen.container.querySelector('[role="radio"]');
  expect(radio?.getAttribute("aria-checked")).toBe("true");
  expect(radio?.closest('[data-slot="field-label"]')).not.toBeNull();
});

test("a FieldSet gives the group a legend (Fieldset)", async () => {
  const screen = await render(
    <FieldSet>
      <FieldLegend variant="label">Subscription Plan</FieldLegend>
      <RadioGroup defaultValue="monthly">
        <Field orientation="horizontal">
          <RadioGroupItem value="monthly" id="monthly" />
          <FieldLabel htmlFor="monthly">Monthly</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>,
  );
  await expect
    .element(screen.getByRole("group", { name: "Subscription Plan" }))
    .toBeInTheDocument();
});

test("a disabled item blocks activation (Disabled)", async () => {
  const screen = await render(
    <RadioGroup defaultValue="two" aria-label="Options">
      <RadioGroupItem value="one" id="d1" disabled aria-label="One" />
      <RadioGroupItem value="two" id="d2" aria-label="Two" />
    </RadioGroup>,
  );
  const disabled = screen.getByRole("radio", { name: "One" });
  await expect.element(disabled).toBeDisabled();
  (disabled.element() as HTMLElement).click();
  await expect
    .element(screen.getByRole("radio", { name: "Two" }))
    .toHaveAttribute("aria-checked", "true");
});

test("aria-invalid reaches the items and FieldError carries the message (Invalid)", async () => {
  const screen = await render(
    <FieldSet data-invalid>
      <FieldLegend variant="label">Delivery window</FieldLegend>
      <RadioGroup>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="morning" id="morning" aria-invalid />
          <FieldLabel htmlFor="morning">Morning</FieldLabel>
        </Field>
      </RadioGroup>
      <FieldError>Choose a delivery window.</FieldError>
    </FieldSet>,
  );
  await expect
    .element(screen.getByRole("radio", { name: "Morning" }))
    .toHaveAttribute("aria-invalid", "true");
  await expect
    .element(screen.getByText("Choose a delivery window."))
    .toBeInTheDocument();
});

test("RTL: the group inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Basic />
    </div>,
  );
  const group = screen
    .getByRole("radiogroup", { name: "Options" })
    .element() as HTMLElement;
  expect(getComputedStyle(group).direction).toBe("rtl");
});

test("A11Y-2: an invisible ::after extends the pointer target past 24px", async () => {
  const classes = itemClasses(await render(<Basic />));
  expect(classes).toContain("after:absolute");
  expect(classes).toContain("after:-inset-x-3");
  expect(classes).toContain("after:-inset-y-2");
});

test("FOC-1/FOC-6: the recipe carries no focus glow and no outline suppression", async () => {
  const classes = itemClasses(await render(<Basic />));
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-14: the invalid border holds while the control is focused", async () => {
  const classes = itemClasses(await render(<Basic />));
  expect(classes).toContain("aria-invalid:border-destructive");
  expect(classes).not.toContain("not-focus:");
  expect(classes).toContain("aria-invalid:aria-checked:border-primary");
});

test("FOC-12: the control never cancels its own ring for a choice card", async () => {
  const classes = itemClasses(await render(<Basic />));
  expect(classes).not.toContain("group-has-[:focus-visible]/field-label:");
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Basic />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <FieldSet data-invalid>
      <FieldLegend variant="label">Window</FieldLegend>
      <RadioGroup>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="morning" id="a11y-morning" aria-invalid />
          <FieldLabel htmlFor="a11y-morning">Morning</FieldLabel>
        </Field>
      </RadioGroup>
      <FieldError>Choose a window.</FieldError>
    </FieldSet>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <RadioGroup defaultValue="two" aria-label="Options">
      <Field orientation="horizontal" data-disabled>
        <RadioGroupItem value="one" id="a11y-d1" disabled />
        <FieldLabel htmlFor="a11y-d1">One</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="two" id="a11y-d2" />
        <FieldLabel htmlFor="a11y-d2">Two</FieldLabel>
      </Field>
    </RadioGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("FRM-15: a disabled radio outside a Field is dimmed (Disabled)", async () => {
  withCompiledCss();
  const screen = await render(
    <RadioGroup aria-label="Status">
      <RadioGroupItem value="a" disabled aria-label="Draft" />
    </RadioGroup>,
  );
  const radio = screen.getByRole("radio", { name: "Draft" }).element();
  expect(radio.hasAttribute("data-disabled")).toBe(true);
  expect(getComputedStyle(radio).opacity).toBe("0.5");
  expect(getComputedStyle(radio).cursor).toBe("not-allowed");
});

test("FRM-15: an enabled radio beside it is not dimmed", async () => {
  withCompiledCss();
  const screen = await render(
    <RadioGroup aria-label="Status">
      <RadioGroupItem value="a" disabled aria-label="Draft" />
      <RadioGroupItem value="b" aria-label="Live" />
    </RadioGroup>,
  );
  const radio = screen.getByRole("radio", { name: "Live" }).element();
  expect(getComputedStyle(radio).opacity).toBe("1");
});

test("FRM-15: the recipe keys disabled styles on data-disabled", async () => {
  const screen = await render(<Basic />);
  const classes = itemClasses(screen);
  expect(classes).toContain("data-disabled:opacity-50");
  expect(classes).toContain("data-disabled:cursor-not-allowed");
  expect(classes).not.toMatch(/(?:^|\s)disabled:/);
});

test("no a11y violations — disabled outside a Field", async () => {
  const screen = await render(
    <RadioGroup aria-label="Status">
      <RadioGroupItem value="a" disabled aria-label="Draft" />
      <RadioGroupItem value="b" aria-label="Live" />
    </RadioGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "RadioGroup",
  render: (props) => (
    <RadioGroup defaultValue="a" {...props}>
      <RadioGroupItem value="a" aria-label="Option A" />
      <RadioGroupItem value="b" aria-label="Option B" />
    </RadioGroup>
  ),
  find: (screen, name) => screen.getByRole("radiogroup", { name }),
  idCheck: "control",
});

test("API-26: a RadioGroup in a Field is named by the Field; each item keeps its own name", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Plan</FieldLabel>
      <RadioGroup defaultValue="free">
        <RadioGroupItem value="free" aria-label="Free" />
        <RadioGroupItem value="pro" aria-label="Pro" />
      </RadioGroup>
    </Field>,
  );
  await expect
    .element(screen.getByRole("radiogroup", { name: "Plan" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("radio", { name: "Free" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("radio", { name: "Pro" }))
    .toBeInTheDocument();
  for (const radio of screen.container.querySelectorAll('[role="radio"]')) {
    expect(radio.hasAttribute("aria-labelledby")).toBe(false);
  }
});

test("API-26: an item in its own Field still takes that Field's label", async () => {
  const screen = await render(
    <RadioGroup defaultValue="k8s" aria-label="Environment">
      <Field orientation="horizontal">
        <RadioGroupItem value="k8s" />
        <FieldLabel>Kubernetes</FieldLabel>
      </Field>
    </RadioGroup>,
  );
  await expect
    .element(screen.getByRole("radio", { name: "Kubernetes" }))
    .toBeInTheDocument();
});
