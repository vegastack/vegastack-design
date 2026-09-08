import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { LogoRow } from "./logo-row";

const items = [
  { name: "ACME" },
  { name: "NIMBUS", href: "https://example.com" },
];

test("renders every item as a list entry", async () => {
  const screen = await render(<LogoRow items={items} />);
  await expect.element(screen.getByText("ACME")).toBeInTheDocument();
  await expect.element(screen.getByText("NIMBUS")).toBeInTheDocument();
  expect(
    screen.container.querySelectorAll('[data-slot="logo-row-item"]').length,
  ).toBe(2);
});

test("renders a plain span for items without href, and a link for items with one", async () => {
  const screen = await render(<LogoRow items={items} />);
  const acme = screen.getByText("ACME").element();
  expect(acme.tagName).toBe("SPAN");
  const nimbus = screen.getByText("NIMBUS").element();
  expect(nimbus.tagName).toBe("A");
  expect(nimbus.getAttribute("href")).toBe("https://example.com");
  // A wall of underlined text reads as a paragraph of links, not as marks: the mark rests
  // muted and LIFTS to full ink on hover, which is the affordance.
  expect(nimbus.classList).toContain("no-underline");
  expect(nimbus.classList).not.toContain("underline-offset-4");
  expect(nimbus.classList).toContain("text-muted-foreground");
  expect(nimbus.classList).toContain("hover:text-foreground");
});

test("wall cells draw LOGICAL seams so RTL does not double the outer edge", async () => {
  const screen = await render(<LogoRow items={items} variant="wall" />);
  const cell = screen.container.querySelector(
    '[data-slot="logo-row-item"]',
  ) as HTMLElement;
  // Physical `-ml-px`/`border-l` put every cell's seam on the left in BOTH directions,
  // which in RTL doubles the outer edge and erases the inner seams.
  expect(cell.classList).toContain("-ms-px");
  expect(cell.classList).toContain("border-s");
  expect(cell.classList).not.toContain("-ml-px");
  expect(cell.classList).not.toContain("border-l");
});

test("the wall caps at wallColumns but drops columns when the row is narrow", async () => {
  const screen = await render(
    <LogoRow items={items} variant="wall" wallColumns={4} />,
  );
  const list = screen.container.querySelector(
    '[data-slot="logo-row-list"]',
  ) as HTMLElement;
  // `max(floor, 100%/N)`: wide -> exactly N columns; narrow -> the 8rem floor wins and
  // auto-fill simply fits fewer. A fixed `grid-cols-4` gave 80px cells at 320px.
  expect(list.className).toContain(
    "grid-cols-[repeat(auto-fill,minmax(max(calc(var(--spacing)*32),100%/4),1fr))]",
  );
  expect(list.classList).not.toContain("grid-cols-4");
});

test("omits the label when not provided", async () => {
  const screen = await render(<LogoRow items={items} />);
  expect(
    screen.container.querySelector('[data-slot="logo-row-label"]'),
  ).toBeNull();
});

test("renders the label when provided", async () => {
  const screen = await render(<LogoRow items={items} label="Trusted by" />);
  await expect.element(screen.getByText("Trusted by")).toBeInTheDocument();
});

test("no a11y violations", async () => {
  const screen = await render(<LogoRow items={items} label="Trusted by" />);
  await expectNoA11yViolations(screen.container);
});
