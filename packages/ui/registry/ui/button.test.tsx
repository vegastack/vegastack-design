import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button, buttonVariants } from "./button";

/** Upstream's six variants, in the order its docs page documents them. */
const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;

/** Upstream's eight size tiers. */
const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

test("renders a native button carrying data-slot", async () => {
  const screen = await render(<Button>Save</Button>);
  const button = screen.getByRole("button", { name: "Save" });
  await expect.element(button).toBeInTheDocument();
  await expect.element(button).toHaveAttribute("data-slot", "button");
});

test("every upstream variant produces its own class string", async () => {
  const seen = new Set<string>();
  for (const variant of VARIANTS) {
    const classes = buttonVariants({ variant });
    expect(classes.length).toBeGreaterThan(0);
    seen.add(classes);
  }
  expect(seen.size).toBe(VARIANTS.length);
});

test("every upstream size produces its own class string", async () => {
  const seen = new Set<string>();
  for (const size of SIZES) seen.add(buttonVariants({ size }));
  expect(seen.size).toBe(SIZES.length);
});

test("the rendered element carries the variant and size classes it was asked for", async () => {
  const screen = await render(
    <Button variant="destructive" size="icon-sm" aria-label="Delete" />,
  );
  const button = screen.getByRole("button", { name: "Delete" });
  await expect.element(button).toHaveClass("bg-destructive/10");
  await expect.element(button).toHaveClass("size-7");
});

test("A11Y-13: the destructive tint carries the -text ink, never the fill as ink", async () => {
  const classes = buttonVariants({ variant: "destructive" });
  expect(classes).toContain("text-destructive-text");
  expect(classes).not.toMatch(/text-destructive(?![-\w])/);
});

test("FOC-1/FOC-6: no focus glow and no outline suppression anywhere in the recipe", async () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const classes = buttonVariants({ variant, size });
      expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
      expect(classes).not.toContain("focus-visible:ring-");
      expect(classes).not.toContain("focus-visible:border-ring");
      expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
    }
  }
});

test("FOC-5: the invalid tint stands down while the control is focused", async () => {
  expect(buttonVariants({})).toContain(
    "not-focus:aria-invalid:border-destructive",
  );
});

test("FRM-4: disabled is the aria-disabled form, not the native attribute", async () => {
  const screen = await render(<Button disabled>Delete</Button>);
  const button = screen.getByRole("button", { name: "Delete" });
  await expect.element(button).toHaveAttribute("aria-disabled", "true");
  await expect.element(button).toHaveAttribute("data-disabled", "");
  expect((button.element() as HTMLButtonElement).disabled).toBe(false);
});

test("FRM-4: the recipe never removes pointer events from a disabled control", async () => {
  // Only the icon children are made click-through; the control itself never is.
  expect(buttonVariants({})).not.toContain("disabled:pointer-events-none");
  expect(buttonVariants({})).not.toContain("data-disabled:pointer-events-none");
});

test("API-5: loading announces busy, marks the control, and blocks activation", async () => {
  let clicks = 0;
  const screen = await render(
    <Button loading onClick={() => (clicks += 1)}>
      Save changes
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Save changes" });
  await expect.element(button).toHaveAttribute("aria-busy", "true");
  await expect.element(button).toHaveAttribute("data-loading", "");
  (button.element() as HTMLButtonElement).click();
  expect(clicks).toBe(0);
});

test("a composed loading root keeps its name and blocks pointer and keyboard activation", async () => {
  let clicks = 0;
  const screen = await render(
    <Button
      loading
      render={<div />}
      nativeButton={false}
      onClick={() => (clicks += 1)}
    >
      <span>Regenerate</span>
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Regenerate" });
  await expect.element(button).toHaveAttribute("aria-busy", "true");
  await expect.element(button).toHaveAttribute("aria-disabled", "true");
  const element = button.element() as HTMLElement;
  element.click();
  element.focus();
  await userEvent.keyboard("{Enter}{Space}");
  expect(clicks).toBe(0);
  await expectNoA11yViolations(screen.container);
});

test("loading respects an explicit non-focusable disabled policy", async () => {
  const screen = await render(
    <Button loading focusableWhenDisabled={false}>
      Save changes
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Save changes" });
  await expect.element(button).toHaveAttribute("disabled");
});

test("A11Y-12: the loading label keeps its box rather than being removed", async () => {
  const screen = await render(<Button loading>Save changes</Button>);
  // `opacity-0`, never `invisible`: `visibility: hidden` would drop the label out of the
  // accessibility tree and leave a loading button with no discernible name. The RENDERED
  // proof (real width, real computed opacity) is in test/button-states.browser.test.tsx,
  // which compiles the CSS this lane deliberately does not load.
  const label = screen.getByText("Save changes");
  await expect.element(label).toHaveClass("opacity-0");
  await expect
    .element(screen.getByRole("button", { name: "Save changes" }))
    .toBeInTheDocument();
});

test("buttonVariants styles a plain anchor, which keeps the link role (As Link)", async () => {
  const screen = await render(
    <a href="#somewhere" className={buttonVariants({ variant: "secondary" })}>
      Login
    </a>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Login" }))
    .toHaveClass("bg-secondary");
});

test("an icon-only button is named by aria-label (Icon)", async () => {
  const screen = await render(
    <Button size="icon" aria-label="Submit">
      <svg aria-hidden="true" />
    </Button>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Submit" }))
    .toBeInTheDocument();
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Button disabled>Unavailable</Button>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(<Button loading>Saving</Button>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — icon only", async () => {
  const screen = await render(
    <Button size="icon" aria-label="Submit">
      <svg aria-hidden="true" />
    </Button>,
  );
  await expectNoA11yViolations(screen.container);
});

test("a link styled with buttonVariants keeps the link role", async () => {
  const screen = await render(
    <a href="/docs" className={buttonVariants({ size: "lg" })}>
      Docs
    </a>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Docs" }))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[role="button"]')).toBeNull();
});

test("a Button rendered as a link announces as a button — why the link recipe exists", async () => {
  const screen = await render(
    <Button nativeButton={false} render={<a href="/docs" />}>
      Docs
    </Button>,
  );
  // Base UI gives a non-native element role="button", so navigation reads as an
  // action. The recipe is a link styled with buttonVariants() instead.
  await expect
    .element(screen.getByRole("button", { name: "Docs" }))
    .toBeInTheDocument();
});
