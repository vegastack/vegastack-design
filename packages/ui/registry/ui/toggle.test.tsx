import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Toggle, toggleVariants } from "./toggle";

/** Upstream's two variants, in the order its docs page documents them. */
const VARIANTS = ["default", "outline"] as const;

/** Upstream's three size tiers. */
const SIZES = ["default", "sm", "lg"] as const;

test("renders a native button carrying data-slot and aria-pressed", async () => {
  const screen = await render(<Toggle>Italic</Toggle>);
  const toggle = screen.getByRole("button", { name: "Italic" });
  await expect.element(toggle).toBeInTheDocument();
  await expect.element(toggle).toHaveAttribute("data-slot", "toggle");
  await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
});

test("every upstream variant produces its own class string", async () => {
  const seen = new Set<string>();
  for (const variant of VARIANTS) {
    const classes = toggleVariants({ variant });
    expect(classes.length).toBeGreaterThan(0);
    seen.add(classes);
  }
  expect(seen.size).toBe(VARIANTS.length);
});

test("every upstream size produces its own class string", async () => {
  const seen = new Set<string>();
  for (const size of SIZES) seen.add(toggleVariants({ size }));
  expect(seen.size).toBe(SIZES.length);
});

test("the rendered element carries the variant and size classes it was asked for", async () => {
  const screen = await render(
    <Toggle variant="outline" size="sm">
      Bold
    </Toggle>,
  );
  const toggle = screen.getByRole("button", { name: "Bold" });
  await expect.element(toggle).toHaveClass("border-input");
  await expect.element(toggle).toHaveClass("h-7");
});

test("pressing flips the pressed state and aria-pressed with it (Usage)", async () => {
  const screen = await render(<Toggle>Italic</Toggle>);
  const toggle = screen.getByRole("button", { name: "Italic" });
  await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(toggle);
  await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.element(toggle).toHaveAttribute("data-pressed", "");
  await userEvent.click(toggle);
  await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
});

test("a controlled pressed toggle reports the on state (With Text)", async () => {
  const screen = await render(
    <Toggle pressed aria-label="Toggle italic">
      <svg aria-hidden="true" />
      Italic
    </Toggle>,
  );
  const toggle = screen.getByRole("button", { name: "Toggle italic" });
  await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
});

test("FOC-1/FOC-6: no focus glow and no outline suppression anywhere in the recipe", async () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const classes = toggleVariants({ variant, size });
      expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
      expect(classes).not.toContain("focus-visible:ring-");
      expect(classes).not.toContain("focus-visible:border-ring");
      expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
      expect(classes).not.toContain("aria-invalid:ring-destructive");
    }
  }
});

test("FOC-5: the invalid tint stands down while the control is focused", async () => {
  expect(toggleVariants({})).toContain(
    "not-focus:aria-invalid:border-destructive",
  );
});

test("FRM-4: the recipe never removes pointer events from a disabled control", async () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const classes = toggleVariants({ variant, size });
      expect(classes).not.toContain("disabled:pointer-events-none");
      expect(classes).not.toContain("data-disabled:pointer-events-none");
    }
  }
});

test("FRM-4: Base UI keeps the native disabled attribute (the pointer half only)", async () => {
  const screen = await render(<Toggle disabled>Italic</Toggle>);
  const toggle = screen.getByRole("button", { name: "Italic" });
  expect((toggle.element() as HTMLButtonElement).disabled).toBe(true);
  await expect.element(toggle).toHaveAttribute("data-disabled", "");
});

test("API-5: loading announces busy, marks the control, and blocks activation", async () => {
  let clicks = 0;
  const screen = await render(
    <Toggle loading onClick={() => (clicks += 1)}>
      Bookmark
    </Toggle>,
  );
  const toggle = screen.getByRole("button", { name: "Bookmark" });
  await expect.element(toggle).toHaveAttribute("aria-busy", "true");
  await expect.element(toggle).toHaveAttribute("data-loading", "");
  (toggle.element() as HTMLButtonElement).click();
  expect(clicks).toBe(0);
});

test("A11Y-12: the loading label keeps its box rather than being removed", async () => {
  const screen = await render(<Toggle loading>Bookmark</Toggle>);
  // `opacity-0`, never `invisible`: `visibility: hidden` would drop the label out of the
  // accessibility tree and leave a loading toggle with no discernible name. This lane asserts the
  // class; the RENDERED width and computed opacity belong to a compiled-CSS lane.
  const label = screen.getByText("Bookmark");
  await expect.element(label).toHaveClass("opacity-0");
  await expect
    .element(screen.getByRole("button", { name: "Bookmark" }))
    .toBeInTheDocument();
});

test("API-5: the loading dim is scoped so a loading toggle is not dimmed twice", async () => {
  expect(toggleVariants({})).toContain("disabled:not-data-loading:opacity-50");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) => (
        <Toggle key={variant} variant={variant}>
          {variant}
        </Toggle>
      ))}
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — pressed", async () => {
  const screen = await render(<Toggle pressed>Bold</Toggle>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Toggle disabled>Bold</Toggle>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(<Toggle loading>Bookmark</Toggle>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — icon only, named by aria-label", async () => {
  const screen = await render(
    <Toggle aria-label="Toggle bookmark">
      <svg aria-hidden="true" />
    </Toggle>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Toggle bookmark" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});
