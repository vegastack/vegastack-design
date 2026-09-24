import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { fieldWiringTests } from "../../test/field-wiring";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
// The scroll arrows only mount while the popup overflows, which needs compiled CSS this lane does
// not have. Their INT-1 exemption is asserted against the source instead.
import selectSource from "./select.tsx?raw";

/** Upstream's two trigger size tiers. */
const SIZES = ["sm", "default"] as const;

const items = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
];

function Fruit({
  triggerProps,
  contentProps,
  ...rootProps
}: {
  triggerProps?: React.ComponentProps<typeof SelectTrigger>;
  contentProps?: React.ComponentProps<typeof SelectContent>;
} & React.ComponentProps<typeof Select>) {
  return (
    <Select items={items} {...rootProps}>
      <SelectTrigger aria-label="Fruit" {...triggerProps}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent {...contentProps}>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={String(item.value)} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

const triggerClasses = (screen: { container: HTMLElement }) =>
  (
    screen.container.querySelector(
      '[data-slot="select-trigger"]',
    ) as HTMLElement
  ).className;

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders a combobox trigger carrying data-slot and data-size (Usage)", async () => {
  const screen = await render(<Fruit />);
  const trigger = screen.getByRole("combobox", { name: "Fruit" });
  await expect.element(trigger).toHaveAttribute("data-slot", "select-trigger");
  await expect.element(trigger).toHaveAttribute("data-size", "default");
});

test("opening shows a listbox of options (Usage, Composition)", async () => {
  const screen = await render(<Fruit />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  const listbox = document.querySelector('[data-slot="select-content"]');
  expect(listbox).not.toBeNull();
  expect(document.querySelectorAll('[role="option"]').length).toBe(3);
});

test("choosing an option closes the popup and reports the value (Usage)", async () => {
  let picked: unknown;
  const screen = await render(
    <Fruit onValueChange={(next: unknown) => (picked = next)} />,
  );
  const trigger = screen.getByRole("combobox", { name: "Fruit" });
  await userEvent.click(trigger);
  // Keyboard, not pointer: it is the path WCAG requires, it drives the same selection code Base UI
  // runs for a pointer, and it does not depend on a hit test this CSS-free lane cannot give.
  //
  // A FIXED NUMBER OF PRESSES CANNOT BE RIGHT HERE, and that is what this test used to do.
  // Base UI's list navigation keeps its own cursor (`useListNavigation`'s `indexRef`) beside the
  // `activeIndex` that paints `data-highlighted`, and settles it asynchronously after the popup
  // opens — it waits for the items to register over a microtask and up to two animation frames,
  // and the roving focus moves from the trigger into the list somewhere in there. An ArrowDown
  // delivered before that settles moves the highlight one row; one delivered after it can be
  // absorbed by the same cursor and move it none. Nothing in the DOM tells the two apart, so two
  // presses meant "Apple" on a quiet machine and "Banana" on a loaded CI runner — which is
  // exactly the 'banana' this test failed with.
  //
  // Drive to the option under test instead, bounded by the item count so a component that never
  // moves the highlight still fails, and assert the highlight before Enter commits it. Enter can
  // then only ever commit the option the assertion named.
  const apple = screen.getByRole("option", { name: "Apple" });
  for (let press = 0; press < items.length; press += 1) {
    if (apple.query()?.hasAttribute("data-highlighted")) break;
    await userEvent.keyboard("{ArrowDown}");
  }
  await expect.element(apple).toHaveAttribute("data-highlighted", "");
  await userEvent.keyboard("{Enter}");
  // `aria-expanded`, not the popup's presence: the popup plays an exit animation, so the element
  // outlives the state change by a frame or two and "is it gone" would be a timing assertion.
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(picked).toBe("apple");
  await expect
    .poll(
      () =>
        screen.container.querySelector('[data-slot="select-value"]')
          ?.textContent,
    )
    .toBe("Apple");
});

/*
 * One render, every size. Repeated `render()` calls inside ONE test accumulate in the page, and
 * `screen.getByRole` is page-scoped, so a loop that re-renders leaves several matches behind and
 * Playwright fails on strict mode rather than on the component.
 */
test("every upstream size sets its own data-size (Sizes)", async () => {
  const screen = await render(
    <div>
      {SIZES.map((size) => (
        <Fruit key={size} triggerProps={{ size }} />
      ))}
    </div>,
  );
  const triggers = [
    ...screen.container.querySelectorAll('[data-slot="select-trigger"]'),
  ];
  expect(triggers.map((t) => t.getAttribute("data-size"))).toEqual([...SIZES]);
});

test("alignItemWithTrigger is recorded on the popup (Align Item With Trigger)", async () => {
  const screen = await render(
    <Fruit contentProps={{ alignItemWithTrigger: false }} />,
  );
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  const popup = document.querySelector('[data-slot="select-content"]');
  expect(popup?.getAttribute("data-align-trigger")).toBe("false");
});

test("groups, labels and separators render inside the popup (Groups)", async () => {
  const screen = await render(
    <Select items={items}>
      <SelectTrigger aria-label="Produce">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>,
  );
  await userEvent.click(screen.getByRole("combobox", { name: "Produce" }));
  expect(document.querySelectorAll('[data-slot="select-label"]').length).toBe(
    2,
  );
  expect(
    document.querySelector('[data-slot="select-separator"]'),
  ).not.toBeNull();
});

test("the popup is bounded and scrolls (Scrollable)", async () => {
  const many = Array.from({ length: 40 }, (_, index) => ({
    label: `Zone ${index}`,
    value: `z${index}`,
  }));
  const screen = await render(
    <Select items={many}>
      <SelectTrigger aria-label="Timezone">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {many.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>,
  );
  await userEvent.click(screen.getByRole("combobox", { name: "Timezone" }));
  const popup = document.querySelector(
    '[data-slot="select-content"]',
  ) as HTMLElement;
  expect(document.querySelectorAll('[role="option"]').length).toBe(40);
  // Base UI mounts the scroll arrows only while the popup actually overflows, which needs compiled
  // CSS this lane does not have — so the bound and the scroll are asserted as the popup's own
  // contract, and `test/geometry.browser.test.tsx` measures the rendered result.
  expect(popup.className).toContain("overflow-y-auto");
  expect(popup.className).toContain("max-h-(--available-height)");
});

test("a disabled Select does not open (Disabled)", async () => {
  const screen = await render(<Fruit disabled />);
  const trigger = screen.getByRole("combobox", { name: "Fruit" });
  // `force` because Playwright refuses to click a control it considers unavailable; forcing is
  // what proves the trigger is inert rather than merely unreachable.
  await trigger.click({ force: true });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(document.querySelector('[data-slot="select-content"]')).toBeNull();
});

test("aria-invalid on the trigger and FieldError carry the error (Invalid)", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Fruit</FieldLabel>
      <Fruit triggerProps={{ "aria-invalid": true }} />
      <FieldError>Please select a fruit.</FieldError>
    </Field>,
  );
  await expect
    .element(screen.getByRole("combobox", { name: "Fruit" }))
    .toHaveAttribute("aria-invalid", "true");
  await expect
    .element(screen.getByText("Please select a fruit."))
    .toBeInTheDocument();
});

test("RTL: the trigger inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Fruit />
    </div>,
  );
  const trigger = screen
    .getByRole("combobox", { name: "Fruit" })
    .element() as HTMLElement;
  expect(getComputedStyle(trigger).direction).toBe("rtl");
});

test("FOC-1/FOC-6: the trigger carries no focus glow and does not suppress the outline", async () => {
  const classes = triggerClasses(await render(<Fruit />));
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(classes).not.toContain("aria-invalid:ring-destructive");
});

test("FOC-3/FOC-4: the trigger takes the border tint on :focus and keeps the outline", async () => {
  const classes = triggerClasses(await render(<Fruit />));
  expect(classes).toContain("focus:border-ring/70");
  expect(classes).not.toContain("outline-hidden");
});

test("FOC-5: the invalid tint stands down while the trigger is focused", async () => {
  const classes = triggerClasses(await render(<Fruit />));
  expect(classes).toContain("not-focus:aria-invalid:border-destructive");
});

test("INT-1: an item never forces the default cursor", async () => {
  const screen = await render(<Fruit />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  const item = document.querySelector(
    '[data-slot="select-item"]',
  ) as HTMLElement;
  expect(item.className).not.toContain("cursor-default");
});

test("INT-1: the scroll arrows KEEP the default cursor base.css sanctions for them", async () => {
  // Read off the source rather than the DOM: Base UI mounts an arrow only while the popup really
  // overflows, and this lane compiles no CSS, so nothing here can ever scroll. `base.css` names the
  // select scroll arrows as the one sanctioned non-pointer cursor, and this holds the exemption to
  // the two elements it was written for.
  const up = selectSource.slice(
    selectSource.indexOf("function SelectScrollUpButton"),
  );
  expect(up.slice(0, up.indexOf("</SelectPrimitive.ScrollUpArrow>"))).toContain(
    "cursor-default",
  );
  const down = selectSource.slice(
    selectSource.indexOf("function SelectScrollDownButton"),
  );
  expect(
    down.slice(0, down.indexOf("</SelectPrimitive.ScrollDownArrow>")),
  ).toContain("cursor-default");
});

test("FRM-4: an item never removes pointer events when disabled", async () => {
  const screen = await render(<Fruit />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  const item = document.querySelector(
    '[data-slot="select-item"]',
  ) as HTMLElement;
  expect(item.className).not.toContain("data-disabled:pointer-events-none");
});

test("OVL-13: the popup is portaled and the positioner re-applies the theme scope", async () => {
  const screen = await render(<Fruit />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  const popup = document.querySelector('[data-slot="select-content"]');
  expect(popup).not.toBeNull();
  // Portaled: the popup is not inside the component's own container subtree.
  expect(screen.container.contains(popup)).toBe(false);
});

test("BRD-1: the select popup draws a real border, not a ring outline", async () => {
  const screen = await render(<Fruit />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  expectBorderNotRing(
    document.querySelector<HTMLElement>('[data-slot="select-content"]')!,
  );
});

test("no a11y violations — closed", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Fruit</FieldLabel>
      <Fruit />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Fruit />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Fruit</FieldLabel>
      <Fruit triggerProps={{ "aria-invalid": true }} />
      <FieldError>Please select a fruit.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Field data-disabled>
      <FieldLabel>Fruit</FieldLabel>
      <Fruit disabled />
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

/* API-26 — no hunk: Base UI's Select reads the Field context itself */

function FieldFruit({ variant }: { variant?: "outline" | "ghost" }) {
  return (
    <Select items={items}>
      <SelectTrigger variant={variant}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.label} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

test("API-26 (engine): inside a Field the trigger is labelled, described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Fruit</FieldLabel>
      <FieldFruit />
      <FieldDescription>Pick one.</FieldDescription>
      <FieldError>Please select a fruit.</FieldError>
    </Field>,
  );
  const trigger = screen.getByRole("combobox", { name: "Fruit" });
  await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
  await expect.element(trigger).toHaveAccessibleDescription(/Pick one/);
  await expect
    .element(trigger)
    .toHaveAccessibleDescription(/Please select a fruit/);
});

test("no a11y violations — automatic Field wiring, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Fruit</FieldLabel>
      <FieldFruit />
      <FieldDescription>Pick one.</FieldDescription>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — automatic Field wiring, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Fruit</FieldLabel>
      <FieldFruit />
      <FieldError>Please select a fruit.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

/* API-24 — the default trigger is `w-full`; `variant="ghost"` is the inline, content-width tier */

test("API-24: the trigger reflects its variant, outline by default", async () => {
  const screen = await render(
    <>
      <Fruit />
      <Fruit
        triggerProps={{ variant: "ghost", "aria-label": "Inline fruit" }}
      />
    </>,
  );
  const outline = screen.getByRole("combobox", { name: "Fruit" }).element();
  const ghost = screen
    .getByRole("combobox", { name: "Inline fruit" })
    .element();
  expect(outline.getAttribute("data-variant")).toBe("outline");
  expect(ghost.getAttribute("data-variant")).toBe("ghost");
});

// API-24's geometry — the default trigger filling its parent, ghost sizing to content, a consumer
// width winning on either variant, the ghost border on hover, focus and open, and the trigger
// keeping content width inside upstream's ButtonGroup — needs compiled CSS, so it is measured in
// `test/geometry.browser.test.tsx` (`select-trigger-width`), not asserted as class strings here.

test("no a11y violations — ghost at rest", async () => {
  const screen = await render(<Fruit triggerProps={{ variant: "ghost" }} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — ghost open", async () => {
  const screen = await render(<Fruit triggerProps={{ variant: "ghost" }} />);
  await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — ghost invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Fruit</FieldLabel>
      <FieldFruit variant="ghost" />
      <FieldError>Please select a fruit.</FieldError>
    </Field>,
  );
  await expect
    .element(screen.getByRole("combobox", { name: "Fruit" }))
    .toHaveAttribute("aria-invalid", "true");
  await expectNoA11yViolations(screen.container);
});

fieldWiringTests({
  name: "SelectTrigger",
  render: (props) => (
    <Select items={items}>
      <SelectTrigger {...props}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
      </SelectContent>
    </Select>
  ),
  find: (screen, name) => screen.getByRole("combobox", { name }),
});
