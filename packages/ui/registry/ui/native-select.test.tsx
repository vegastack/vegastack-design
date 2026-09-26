import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "./native-select";
import { Field, FieldError, FieldLabel } from "./field";

/** Upstream's two size tiers. */
const SIZES = ["sm", "default"] as const;

const controlClasses = (screen: { container: HTMLElement }) =>
  (screen.container.querySelector('[data-slot="native-select"]') as HTMLElement)
    .className;

function Fruit(props: React.ComponentProps<typeof NativeSelect>) {
  return (
    <NativeSelect aria-label="Fruit" {...props}>
      <NativeSelectOption value="">Select a fruit</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
    </NativeSelect>
  );
}

test("renders a native select inside its wrapper, both carrying data-slot (Usage)", async () => {
  const screen = await render(<Fruit />);
  const wrapper = screen.container.querySelector(
    '[data-slot="native-select-wrapper"]',
  );
  expect(wrapper).not.toBeNull();
  const control = screen.getByRole("combobox", { name: "Fruit" });
  await expect.element(control).toHaveAttribute("data-slot", "native-select");
  expect((control.element() as HTMLElement).tagName).toBe("SELECT");
});

test("options render as native option elements (Usage, Composition)", async () => {
  const screen = await render(<Fruit />);
  const options = screen.container.querySelectorAll("option");
  expect(options.length).toBe(3);
  expect(options[1]?.getAttribute("data-slot")).toBe("native-select-option");
});

test("selecting a value updates the control (Usage)", async () => {
  const screen = await render(<Fruit defaultValue="banana" />);
  const control = screen
    .getByRole("combobox", { name: "Fruit" })
    .element() as HTMLSelectElement;
  expect(control.value).toBe("banana");
});

test("optgroups render as native optgroup elements (Groups, Composition)", async () => {
  const screen = await render(
    <NativeSelect aria-label="Department">
      <NativeSelectOption value="">Select department</NativeSelectOption>
      <NativeSelectOptGroup label="Engineering">
        <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
        <NativeSelectOption value="backend">Backend</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>,
  );
  const group = screen.container.querySelector("optgroup");
  expect(group).not.toBeNull();
  expect(group?.getAttribute("label")).toBe("Engineering");
  expect(group?.getAttribute("data-slot")).toBe("native-select-optgroup");
});

/*
 * One render, every size. Repeated `render()` calls inside ONE test accumulate in the page, and
 * `screen.getByRole` is page-scoped, so a loop that re-renders leaves several matches behind and
 * Playwright fails on strict mode rather than on the component.
 */
test("every upstream size sets its own data-size (Native Select vs Select)", async () => {
  const screen = await render(
    <div>
      {SIZES.map((size) => (
        <Fruit key={size} size={size} />
      ))}
    </div>,
  );
  const controls = [
    ...screen.container.querySelectorAll('[data-slot="native-select"]'),
  ];
  expect(controls.map((c) => c.getAttribute("data-size"))).toEqual([...SIZES]);
  // The wrapper mirrors the tier, so a caller can target either.
  const wrappers = [
    ...screen.container.querySelectorAll('[data-slot="native-select-wrapper"]'),
  ];
  expect(wrappers.map((c) => c.getAttribute("data-size"))).toEqual([...SIZES]);
});

test("disabled reaches the element (Disabled)", async () => {
  const screen = await render(<Fruit disabled />);
  await expect
    .element(screen.getByRole("combobox", { name: "Fruit" }))
    .toBeDisabled();
});

test("aria-invalid reaches the element and FieldError carries the message (Invalid)", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="ns-invalid">Fruit</FieldLabel>
      <NativeSelect id="ns-invalid" aria-invalid="true">
        <NativeSelectOption value="">Error state</NativeSelectOption>
      </NativeSelect>
      <FieldError>Pick a fruit to continue.</FieldError>
    </Field>,
  );
  await expect
    .element(screen.getByRole("combobox", { name: "Fruit" }))
    .toHaveAttribute("aria-invalid", "true");
  await expect
    .element(screen.getByText("Pick a fruit to continue."))
    .toBeInTheDocument();
});

test("the chevron is decorative and never takes the pointer (Usage)", async () => {
  const screen = await render(<Fruit />);
  const icon = screen.container.querySelector(
    '[data-slot="native-select-icon"]',
  ) as SVGElement;
  expect(icon.getAttribute("aria-hidden")).toBe("true");
  // An `<svg>`'s `className` is an `SVGAnimatedString`, not a string.
  expect(icon.getAttribute("class")).toContain("pointer-events-none");
});

test("RTL: the control inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Fruit />
    </div>,
  );
  const control = screen
    .getByRole("combobox", { name: "Fruit" })
    .element() as HTMLElement;
  expect(getComputedStyle(control).direction).toBe("rtl");
});

test("FOC-1/FOC-6: the recipe carries no focus glow and does not suppress the outline", async () => {
  const classes = controlClasses(await render(<Fruit />));
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-14: a button-style trigger never changes its border on focus", async () => {
  const classes = controlClasses(await render(<Fruit />));
  expect(classes).not.toMatch(/focus[\w-]*:border-/);
  expect(classes).not.toContain("outline-hidden");
});

test("FOC-14: the invalid border holds while the control is focused", async () => {
  const classes = controlClasses(await render(<Fruit />));
  expect(classes).toContain("aria-invalid:border-destructive");
  expect(classes).not.toContain("not-focus:");
});

test("FRM-4: the recipe never removes pointer events from a disabled select", async () => {
  const classes = controlClasses(await render(<Fruit disabled />));
  expect(classes).not.toContain("disabled:pointer-events-none");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="ns-rest">Fruit</FieldLabel>
      <NativeSelect id="ns-rest">
        <NativeSelectOption value="">Select a fruit</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
      </NativeSelect>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — grouped", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="ns-groups">Department</FieldLabel>
      <NativeSelect id="ns-groups">
        <NativeSelectOption value="">Select department</NativeSelectOption>
        <NativeSelectOptGroup label="Engineering">
          <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="ns-a11y-invalid">Fruit</FieldLabel>
      <NativeSelect id="ns-a11y-invalid" aria-invalid="true">
        <NativeSelectOption value="">Select a fruit</NativeSelectOption>
      </NativeSelect>
      <FieldError>Pick a fruit.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field data-disabled>
      <FieldLabel htmlFor="ns-a11y-disabled">Fruit</FieldLabel>
      <NativeSelect id="ns-a11y-disabled" disabled>
        <NativeSelectOption value="">Select a fruit</NativeSelectOption>
      </NativeSelect>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});
