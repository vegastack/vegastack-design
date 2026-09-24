import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import { Slider } from "./slider";
import { Label } from "./label";

/*
 * Base UI keeps the real control in a visually hidden `<input type="range">` inside the thumb, so
 * `role="slider"` resolves to THAT input, not to the thumb span. The reset forwards the root's
 * `aria-label` to it through `getAriaLabel` (A11Y-16) — these helpers read the input directly so a
 * naming regression fails on the assertion rather than on a locator timeout.
 */
const inputs = (screen: { container: HTMLElement }) => [
  ...screen.container.querySelectorAll<HTMLInputElement>('input[type="range"]'),
];

const firstInput = (screen: { container: HTMLElement }) => {
  const [input] = inputs(screen);
  if (!input) throw new Error("slider rendered no range input");
  return input;
};

const thumbClasses = (screen: { container: HTMLElement }) =>
  (screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement)
    .className;

const thumbs = (screen: { container: HTMLElement }) =>
  screen.container.querySelectorAll('[data-slot="slider-thumb"]');

test("renders the root, track, indicator and one thumb (Usage)", async () => {
  const screen = await render(
    <Slider defaultValue={[33]} aria-label="Value" />,
  );
  expect(screen.container.querySelector('[data-slot="slider"]')).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="slider-track"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="slider-range"]'),
  ).not.toBeNull();
  expect(thumbs(screen).length).toBe(1);
});

test("the thumb reports its value to assistive tech (Usage)", async () => {
  const screen = await render(
    <Slider defaultValue={[33]} max={100} step={1} aria-label="Value" />,
  );
  const input = firstInput(screen);
  expect(input.getAttribute("aria-valuenow")).toBe("33");
  expect(input.min).toBe("0");
  expect(input.max).toBe("100");
});

test("A11Y-16: the root's aria-label names the control that holds the role", async () => {
  const screen = await render(
    <Slider defaultValue={[33]} aria-label="Value" />,
  );
  expect(firstInput(screen).getAttribute("aria-label")).toBe("Value");
});

test("A11Y-16: every thumb of a range slider is named", async () => {
  const screen = await render(
    <Slider defaultValue={[25, 50]} aria-label="Price range" />,
  );
  expect(inputs(screen).map((i) => i.getAttribute("aria-label"))).toEqual([
    "Price range",
    "Price range",
  ]);
});

test("two values render two thumbs (Range)", async () => {
  const screen = await render(
    <Slider defaultValue={[25, 50]} max={100} step={5} aria-label="Range" />,
  );
  expect(thumbs(screen).length).toBe(2);
});

test("three values render three thumbs (Multiple Thumbs)", async () => {
  const screen = await render(
    <Slider defaultValue={[10, 20, 70]} max={100} aria-label="Breakpoints" />,
  );
  expect(thumbs(screen).length).toBe(3);
});

test("orientation=vertical sets the data attribute the layout keys off (Vertical)", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} orientation="vertical" aria-label="Level" />,
  );
  const root = screen.container.querySelector(
    '[data-slot="slider"]',
  ) as HTMLElement;
  expect(root.getAttribute("data-orientation")).toBe("vertical");
});

test("a controlled slider reports its change (Controlled)", async () => {
  let value: number[] = [30];
  const screen = await render(
    <div>
      <Label htmlFor="temp">Temperature</Label>
      <Slider
        id="temp"
        value={value}
        onValueChange={(next) => (value = next as number[])}
        min={0}
        max={100}
        step={10}
      />
    </div>,
  );
  firstInput(screen).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(value[0]).toBe(40);
});

test("keyboard moves the value (Usage, Accessibility)", async () => {
  const screen = await render(
    <Slider
      defaultValue={[50]}
      min={0}
      max={100}
      step={1}
      aria-label="Value"
    />,
  );
  const input = firstInput(screen);
  input.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(input.getAttribute("aria-valuenow")).toBe("51");
  await userEvent.keyboard("{Home}");
  expect(input.getAttribute("aria-valuenow")).toBe("0");
});

test("disabled marks the control and blocks keyboard changes (Disabled)", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} disabled aria-label="Value" />,
  );
  const root = screen.container.querySelector(
    '[data-slot="slider"]',
  ) as HTMLElement;
  expect(root.hasAttribute("data-disabled")).toBe(true);
  const input = firstInput(screen);
  input.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(input.getAttribute("aria-valuenow")).toBe("50");
});

test("RTL: the control inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Slider defaultValue={[75]} aria-label="القيمة" />
    </div>,
  );
  const root = screen.container.querySelector(
    '[data-slot="slider"]',
  ) as HTMLElement;
  expect(getComputedStyle(root).direction).toBe("rtl");
});

test("A11Y-2: an invisible ::after extends the thumb's pointer target past 24px", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} aria-label="Value" />,
  );
  const classes = thumbClasses(screen);
  expect(classes).toContain("after:absolute");
  expect(classes).toContain("after:-inset-2");
});

test("FOC-1/FOC-6: the thumb carries no ring glow and no outline suppression", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} aria-label="Value" />,
  );
  const classes = thumbClasses(screen);
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("hover:ring-");
  expect(classes).not.toContain("active:ring-");
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:outline-hidden");
});

test("FRM-4: the thumb never removes pointer events when disabled", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} disabled aria-label="Value" />,
  );
  expect(thumbClasses(screen)).not.toContain("disabled:pointer-events-none");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Slider defaultValue={[33]} aria-label="Value" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — range", async () => {
  const screen = await render(
    <Slider defaultValue={[25, 50]} aria-label="Price range" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} orientation="vertical" aria-label="Level" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Slider defaultValue={[50]} disabled aria-label="Value" />,
  );
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "Slider",
  render: (props) => <Slider defaultValue={[50]} {...props} />,
  find: (screen, name) => screen.getByRole("slider", { name }),
  supportsId: false,
  forwardsDescribedBy: false,
});
