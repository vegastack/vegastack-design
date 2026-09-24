import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { Switch } from "./switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "./field";

/** Upstream's two size tiers. */
const SIZES = ["sm", "default"] as const;

const rootClasses = (screen: { container: HTMLElement }) =>
  (screen.container.querySelector('[data-slot="switch"]') as HTMLElement)
    .className;

test("renders a switch carrying data-slot, data-size and aria-checked (Usage)", async () => {
  const screen = await render(<Switch aria-label="Airplane mode" />);
  const control = screen.getByRole("switch", { name: "Airplane mode" });
  await expect.element(control).toHaveAttribute("data-slot", "switch");
  await expect.element(control).toHaveAttribute("data-size", "default");
  await expect.element(control).toHaveAttribute("aria-checked", "false");
});

test("the thumb renders inside the track (Usage)", async () => {
  const screen = await render(<Switch aria-label="Airplane mode" />);
  expect(
    screen.container.querySelector('[data-slot="switch-thumb"]'),
  ).not.toBeNull();
});

/*
 * Base UI renders this control as a `<span role="…">`, and this lane compiles no Tailwind, so the
 * element has a zero-size box and Playwright refuses to click it ("element is not visible"). A
 * NATIVE `.click()` exercises the same handler without a hit test — the convention this repository
 * has used for every span-rendered control since the Base UI migration. The RENDERED pointer target
 * is proven separately, on compiled CSS, by `test/geometry.browser.test.tsx`.
 */
test("clicking flips the checked state (Usage)", async () => {
  const screen = await render(<Switch aria-label="Airplane mode" />);
  const control = screen.getByRole("switch", { name: "Airplane mode" });
  (control.element() as HTMLElement).click();
  await expect.element(control).toHaveAttribute("aria-checked", "true");
  await expect.element(control).toHaveAttribute("data-checked", "");
  (control.element() as HTMLElement).click();
  await expect.element(control).toHaveAttribute("data-unchecked", "");
});

/*
 * One render, every size. Repeated `render()` calls inside ONE test accumulate in the page, and
 * `screen.getByRole` is page-scoped, so a loop that re-renders leaves several matches behind and
 * Playwright fails on strict mode rather than on the component.
 */
test("every upstream size sets its own data-size (Size)", async () => {
  const screen = await render(
    <div>
      {SIZES.map((size) => (
        <Switch key={size} aria-label={size} size={size} />
      ))}
    </div>,
  );
  const controls = [
    ...screen.container.querySelectorAll('[data-slot="switch"]'),
  ];
  expect(controls.map((c) => c.getAttribute("data-size"))).toEqual([...SIZES]);
});

test("a horizontal Field pairs the switch with a label and description (Description)", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="focus-mode">Share across devices</FieldLabel>
        <FieldDescription>Focus is shared across devices.</FieldDescription>
      </FieldContent>
      <Switch id="focus-mode" />
    </Field>,
  );
  await expect
    .element(screen.getByRole("switch", { name: "Share across devices" }))
    .toBeInTheDocument();
});

test("a choice card wraps the whole Field in its label (Choice Card)", async () => {
  const screen = await render(
    <FieldGroup>
      <FieldLabel htmlFor="share">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Share across devices</FieldTitle>
            <FieldDescription>Off when you leave the app.</FieldDescription>
          </FieldContent>
          <Switch id="share" />
        </Field>
      </FieldLabel>
    </FieldGroup>,
  );
  const control = screen.container.querySelector('[role="switch"]');
  expect(control?.closest('[data-slot="field-label"]')).not.toBeNull();
});

test("disabled blocks activation (Disabled)", async () => {
  let changes = 0;
  const screen = await render(
    <Switch
      aria-label="Airplane mode"
      disabled
      onCheckedChange={() => (changes += 1)}
    />,
  );
  const control = screen.getByRole("switch", { name: "Airplane mode" });
  await expect.element(control).toHaveAttribute("data-disabled", "");
  (control.element() as HTMLElement).click();
  expect(changes).toBe(0);
});

test("aria-invalid reaches the element (Invalid)", async () => {
  const screen = await render(
    <Switch aria-label="Accept terms" aria-invalid />,
  );
  await expect
    .element(screen.getByRole("switch", { name: "Accept terms" }))
    .toHaveAttribute("aria-invalid", "true");
});

test("RTL: the thumb translation has a logical counterpart (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Switch aria-label="المشاركة" defaultChecked />
    </div>,
  );
  const thumb = screen.container.querySelector(
    '[data-slot="switch-thumb"]',
  ) as HTMLElement;
  expect(thumb.className).toContain("rtl:group-data-[size=default]/switch:");
  expect(getComputedStyle(thumb).direction).toBe("rtl");
});

test("A11Y-2: an invisible ::after extends the pointer target past 24px", async () => {
  const classes = rootClasses(await render(<Switch aria-label="Switch" />));
  expect(classes).toContain("after:absolute");
  expect(classes).toContain("after:-inset-x-3");
  expect(classes).toContain("after:-inset-y-2");
});

test("FOC-1/FOC-6: the recipe carries no focus glow and no outline suppression", async () => {
  const classes = rootClasses(await render(<Switch aria-label="Switch" />));
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-5: the invalid tint stands down while the control is focused", async () => {
  const classes = rootClasses(await render(<Switch aria-label="Switch" />));
  expect(classes).toContain("not-focus:aria-invalid:border-destructive");
});

test("FOC-12: the control never cancels its own ring for a choice card", async () => {
  const classes = rootClasses(await render(<Switch aria-label="Switch" />));
  expect(classes).not.toContain("group-has-[:focus-visible]/field-label:");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <Switch id="a11y-rest" />
      <FieldLabel htmlFor="a11y-rest">Airplane mode</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — checked", async () => {
  const screen = await render(
    <Field orientation="horizontal">
      <Switch id="a11y-checked" defaultChecked />
      <FieldLabel htmlFor="a11y-checked">Airplane mode</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field orientation="horizontal" data-invalid>
      <Switch id="a11y-invalid" aria-invalid />
      <FieldLabel htmlFor="a11y-invalid">Accept terms</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field orientation="horizontal" data-disabled>
      <Switch id="a11y-disabled" disabled />
      <FieldLabel htmlFor="a11y-disabled">Airplane mode</FieldLabel>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "Switch",
  render: (props) => <Switch {...props} />,
  find: (screen, name) => screen.getByRole("switch", { name }),
});
