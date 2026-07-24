import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ColorPicker, DEFAULT_COLORS } from "./color-picker";

test("renders a trigger with an accessible name", async () => {
  const screen = await render(
    <ColorPicker value="blue" aria-label="Brand color" />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Brand color" }))
    .toBeInTheDocument();
});

test("opens the swatch grid on trigger click", async () => {
  const screen = await render(<ColorPicker value="blue" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  // Each preset swatch is a button labelled by its color name.
  await expect
    .element(screen.getByRole("button", { name: "Blue" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Green" }))
    .toBeInTheDocument();
});

test("selecting a color fires onValueChange with the color name", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ColorPicker value="blue" onValueChange={onValueChange} />,
  );
  await screen.getByRole("button", { name: "Pick a color" }).click();
  await screen.getByRole("button", { name: "Green" }).click();
  expect(onValueChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledWith("green");
});

test("marks the selected swatch via aria-pressed", async () => {
  const screen = await render(<ColorPicker value="green" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Green" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(screen.getByRole("button", { name: "Blue" }))
    .toHaveAttribute("aria-pressed", "false");
});

test("renders the full palette of swatches", async () => {
  const screen = await render(<ColorPicker value="blue" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  for (const c of DEFAULT_COLORS) {
    await expect
      .element(screen.getByRole("button", { name: c.label }))
      .toBeInTheDocument();
  }
});

test("default palette uses semantic token variables, not raw Tailwind palette variables", () => {
  const rawPaletteVar =
    /--color-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d/;
  for (const color of DEFAULT_COLORS) {
    expect(color.color).toMatch(/^var\(--color-[a-z0-9-]+\)$/);
    expect(color.color).not.toMatch(rawPaletteVar);
  }
});

test("selected swatch uses a semantic-surface check disc", async () => {
  const screen = await render(<ColorPicker value="blue" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  const selected = screen.getByRole("button", { name: "Blue" }).element();
  const check = selected.querySelector('[data-slot="color-picker-check"]');
  expect(check).not.toBeNull();
  expect(check?.tagName.toLowerCase()).toBe("span");
  expect(check?.getAttribute("class")).toContain("bg-background");
  expect(check?.querySelector("svg")).not.toBeNull();
});

test("yellow maps to the chart-7 token (the one genuinely-yellow token) and has no duplicate", () => {
  const yellow = DEFAULT_COLORS.find((c) => c.name === "yellow");
  expect(yellow?.color).toBe("var(--color-chart-7)");
  // Exactly one palette entry may own a given token — a second entry on the same
  // token would render two identical swatches.
  const tokens = DEFAULT_COLORS.map((c) => c.color);
  expect(new Set(tokens).size).toBe(tokens.length);
});

test("disabled prevents selection", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ColorPicker value="blue" disabled onValueChange={onValueChange} />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Pick a color" }))
    .toBeDisabled();
  expect(onValueChange).not.toHaveBeenCalled();
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <ColorPicker value="blue" disabled aria-label="Pick a color" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (trigger)", async () => {
  const screen = await render(
    <ColorPicker value="blue" aria-label="Pick a color" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (open grid)", async () => {
  const screen = await render(<ColorPicker value="blue" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  // Popover portals to document.body — audit the whole body so the grid is included.
  // color-contrast is disabled HERE for TWO reasons: (1) the swatches are DYNAMIC user-supplied
  // colors (style={{backgroundColor}}), not design tokens, so they're inherently un-checkable by a
  // token contrast rule; (2) Tailwind utilities aren't compiled in this fast unit run, so semantic
  // tokens don't resolve. The REAL surface contrast is now proven by the compiled-CSS gate
  // test/contrast.browser.test.tsx, which opens this ColorPicker and runs axe `color-contrast` on
  // the trigger + popover chrome (EXCLUDING only the dynamic [data-slot=color-picker-swatch] fills,
  // which have no token to check) in BOTH light and dark themes (+ the Playwright VRT visual layer).
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("roving tabindex starts on the selected swatch", async () => {
  const screen = await render(<ColorPicker value="green" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Green" }))
    .toHaveAttribute("tabindex", "0");
  await expect
    .element(screen.getByRole("button", { name: "Blue" }))
    .toHaveAttribute("tabindex", "-1");
});

test("ArrowRight moves the roving tabindex (and focus) to the next swatch", async () => {
  const screen = await render(<ColorPicker value="gray" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();

  const gray = screen.getByRole("button", { name: "Gray" });
  const red = screen.getByRole("button", { name: "Red" });
  gray.element().focus();
  await userEvent.keyboard("{ArrowRight}");

  await expect.element(red).toHaveFocus();
  await expect.element(red).toHaveAttribute("tabindex", "0");
  await expect.element(gray).toHaveAttribute("tabindex", "-1");
});

test("ArrowLeft moves to the next visual swatch in RTL", async () => {
  const previousDir = document.documentElement.dir;
  document.documentElement.dir = "rtl";
  try {
    const screen = await render(<ColorPicker value="gray" />);
    await screen.getByRole("button", { name: "Pick a color" }).click();
    const gray = screen.getByRole("button", { name: "Gray" });
    const red = screen.getByRole("button", { name: "Red" });
    gray.element().focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(red).toHaveFocus();
  } finally {
    document.documentElement.dir = previousDir;
  }
});

test("normalizes invalid column counts", async () => {
  const screen = await render(<ColorPicker value="gray" columns={0} />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  const group = screen
    .getByRole("group", { name: "Colors" })
    .element() as HTMLElement;
  expect(group.style.getPropertyValue("--swatch-cols")).toBe("1");
});

test("forwards ref to the trigger button", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(<ColorPicker ref={ref} value="blue" />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});
