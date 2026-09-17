import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Kbd, KbdGroup } from "./kbd";
import { Button } from "./button";

/** Every exported part, with the `data-slot` each one stamps. Kbd has no variant or size axis. */
const SLOTS = ["kbd", "kbd-group"] as const;

test("renders a native kbd carrying data-slot", async () => {
  const screen = await render(<Kbd>Esc</Kbd>);
  const key = screen.getByText("Esc");
  await expect.element(key).toBeInTheDocument();
  await expect.element(key).toHaveAttribute("data-slot", "kbd");
  expect(key.element().tagName).toBe("KBD");
});

test("every exported part renders and carries its own data-slot (Composition)", async () => {
  const screen = await render(
    <div>
      <Kbd>Esc</Kbd>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </div>,
  );
  for (const slot of SLOTS) {
    expect(screen.container.querySelector(`[data-slot=${slot}]`)).not.toBe(
      null,
    );
  }
  const group = screen.container.querySelector("[data-slot=kbd-group]")!;
  // The group is a `kbd` too, so a whole chord reads as one piece of keyboard input.
  expect(group.tagName).toBe("KBD");
  expect(group.querySelectorAll("[data-slot=kbd]").length).toBe(2);
});

test("the group lays its keys out in one inline row (Group)", async () => {
  const screen = await render(
    <KbdGroup>
      <Kbd>Ctrl + B</Kbd>
      <Kbd>Ctrl + K</Kbd>
    </KbdGroup>,
  );
  const group = screen.container.querySelector("[data-slot=kbd-group]")!;
  expect(group.className).toContain("inline-flex");
  expect(group.className).toContain("items-center");
  expect(group.className).toContain("gap-1");
});

test("the chip is a label, never the control (Button)", async () => {
  let clicks = 0;
  const screen = await render(
    <Button variant="outline" onClick={() => (clicks += 1)}>
      Accept
      <Kbd data-icon="inline-end">⏎</Kbd>
    </Button>,
  );
  const key = screen.getByText("⏎");
  await expect.element(key).toHaveAttribute("data-icon", "inline-end");
  // `pointer-events-none` is why a click over the chip still reaches the button underneath.
  await expect.element(key).toHaveClass("pointer-events-none");
  await expect.element(key).toHaveClass("select-none");
  (
    screen
      .getByRole("button", { name: /Accept/ })
      .element() as HTMLButtonElement
  ).click();
  expect(clicks).toBe(1);
});

test("the chip inverts from the tooltip surface rather than from a variant (Tooltip)", async () => {
  const screen = await render(
    <div data-slot="tooltip-content">
      Save Changes <Kbd>S</Kbd>
    </div>,
  );
  const key = screen.getByText("S");
  await expect
    .element(key)
    .toHaveClass("in-data-[slot=tooltip-content]:bg-background/20");
  await expect
    .element(key)
    .toHaveClass("in-data-[slot=tooltip-content]:text-background");
});

test("the chip sits inside a field addon without claiming its clicks (Input Group)", async () => {
  const screen = await render(
    <div data-slot="input-group">
      <input aria-label="Search" />
      <span data-slot="input-suffix">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </span>
    </div>,
  );
  const suffix = screen.container.querySelector("[data-slot=input-suffix]")!;
  expect(suffix.querySelectorAll("[data-slot=kbd]").length).toBe(2);
  for (const key of suffix.querySelectorAll("[data-slot=kbd]")) {
    expect(key.className).toContain("pointer-events-none");
  }
});

test("RTL: the chip is symmetric and reaches for no physical direction (RTL)", async () => {
  const screen = await render(
    <KbdGroup dir="rtl">
      <Kbd>Ctrl</Kbd>
      <Kbd>B</Kbd>
    </KbdGroup>,
  );
  const group = screen.container.querySelector("[data-slot=kbd-group]")!;
  const key = screen.container.querySelector("[data-slot=kbd]")!;
  for (const element of [group, key]) {
    expect(element.className).not.toMatch(/(?:^|\s)(?:pl|pr|ml|mr)-/);
    expect(element.className).not.toMatch(/(?:^|\s)(?:left|right)-/);
  }
  expect(key.className).toContain("px-1");
});

test("DOC-2: cn from @vegastack/design merges a caller's className onto both parts", async () => {
  const screen = await render(
    <KbdGroup className="gap-2">
      <Kbd className="min-w-8">⌘</Kbd>
    </KbdGroup>,
  );
  const group = screen.container.querySelector("[data-slot=kbd-group]")!;
  const key = screen.container.querySelector("[data-slot=kbd]")!;
  expect(group.className).toContain("gap-2");
  // tailwind-merge aware: the caller's value replaces the recipe's, never stacks on it.
  expect(group.className).not.toContain("gap-1");
  expect(key.className).toContain("min-w-8");
  expect(key.className).not.toContain("min-w-5");
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Kbd>Esc</Kbd>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a grouped chord", async () => {
  const screen = await render(
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <span>+</span>
      <Kbd>B</Kbd>
    </KbdGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a button", async () => {
  const screen = await render(
    <Button variant="outline">
      Accept
      <Kbd data-icon="inline-end">⏎</Kbd>
    </Button>,
  );
  await expectNoA11yViolations(screen.container);
});
