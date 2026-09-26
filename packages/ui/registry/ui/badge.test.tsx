import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, expectTypeOf, test } from "vitest";
import type { VariantProps } from "class-variance-authority";
import { expectNoA11yViolations } from "../../test/a11y";
import { Badge, badgeVariants, type BadgeVariant } from "./badge";
import { Spinner } from "./spinner";

/**
 * Upstream's six variants plus the three COL-12 status families, in the order the recipe declares
 * them. Badge has no size dimension — upstream ships one height.
 */
const VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "success",
  "warning",
  "info",
  "outline",
  "ghost",
  "link",
] as const;

/** The tinted status variants: `bg-<family>/10` plus the family's ink (A11Y-13). */
const STATUS_VARIANTS = ["destructive", "success", "warning", "info"] as const;

test("renders a span carrying data-slot", async () => {
  const screen = await render(<Badge>Beta</Badge>);
  const badge = screen.getByText("Beta");
  await expect.element(badge).toBeInTheDocument();
  await expect.element(badge).toHaveAttribute("data-slot", "badge");
  expect(badge.element().tagName).toBe("SPAN");
});

test("every variant produces its own class string", async () => {
  const seen = new Set<string>();
  for (const variant of VARIANTS) {
    const classes = badgeVariants({ variant });
    expect(classes.length).toBeGreaterThan(0);
    seen.add(classes);
  }
  expect(seen.size).toBe(VARIANTS.length);
});

test("the rendered element carries the variant classes it was asked for (Variants)", async () => {
  const screen = await render(<Badge variant="secondary">Secondary</Badge>);
  const badge = screen.getByText("Secondary");
  await expect.element(badge).toHaveClass("bg-secondary");
  await expect.element(badge).toHaveAttribute("data-variant", "secondary");
});

test("COL-12: the four status families are all present and distinct", async () => {
  const seen = new Set<string>();
  for (const variant of STATUS_VARIANTS) {
    const classes = badgeVariants({ variant });
    expect(classes).toContain(`bg-${variant}/10`);
    seen.add(classes);
  }
  expect(seen.size).toBe(STATUS_VARIANTS.length);
});

test("A11Y-13: every tinted status variant takes the family's -text ink, never the fill as ink", async () => {
  for (const variant of STATUS_VARIANTS) {
    const classes = badgeVariants({ variant });
    expect(classes).toContain(`text-${variant}-text`);
    expect(classes).not.toMatch(
      new RegExp(`(?:^|\\s)text-${variant}(?![-\\w])`),
    );
  }
});

test("A11Y-8: a status badge carries a readable label, not a bare tint", async () => {
  const screen = await render(
    <div>
      {STATUS_VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>,
  );
  for (const variant of STATUS_VARIANTS) {
    await expect.element(screen.getByText(variant)).toBeInTheDocument();
  }
});

test("FOC-1/FOC-6: no focus glow and no outline suppression anywhere in the recipe", async () => {
  for (const variant of VARIANTS) {
    const classes = badgeVariants({ variant });
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("focus-visible:border-ring");
    expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
    expect(classes).not.toMatch(/aria-invalid:ring-/);
  }
});

test("FOC-14: the invalid border holds while the badge is focused", async () => {
  expect(badgeVariants({})).toContain("aria-invalid:border-destructive");
  expect(badgeVariants({})).not.toContain("not-focus:");
});

test("DOC-2: cn from @vegastack/design merges a caller's className onto the recipe", async () => {
  const screen = await render(
    <Badge variant="outline" className="rounded-sm">
      Square
    </Badge>,
  );
  const badge = screen.getByText("Square");
  await expect.element(badge).toHaveClass("rounded-sm");
  await expect.element(badge).toHaveClass("border-border");
  // `cn` is tailwind-merge aware: the caller's radius replaces the recipe's, never stacks on it.
  await expect.element(badge).not.toHaveClass("rounded-4xl");
});

test("an icon takes the inline-start/inline-end padding hooks (With Icon)", async () => {
  const screen = await render(
    <Badge variant="secondary">
      <svg data-icon="inline-start" aria-hidden="true" />
      Verified
    </Badge>,
  );
  const badge = screen.getByText("Verified");
  await expect
    .element(badge)
    .toHaveClass("has-data-[icon=inline-start]:ps-1.5");
  await expect.element(badge).toHaveClass("has-data-[icon=inline-end]:pe-1.5");
  expect(badge.element().querySelector("[data-icon=inline-start]")).not.toBe(
    null,
  );
});

test("a spinner renders inside the badge (With Spinner)", async () => {
  const screen = await render(
    <Badge variant="secondary">
      <Spinner data-icon="inline-end" />
      Generating
    </Badge>,
  );
  const badge = screen.getByText("Generating");
  expect(badge.element().querySelector("[data-slot=spinner]")).not.toBe(null);
});

test("render turns the badge into a real link (Link)", async () => {
  const screen = await render(
    <Badge render={<a href="#somewhere" />}>Open Link</Badge>,
  );
  const link = screen.getByRole("link", { name: "Open Link" });
  await expect.element(link).toBeInTheDocument();
  await expect.element(link).toHaveAttribute("data-slot", "badge");
});

test("a caller's semantic-token override reaches the element (Custom Colors)", async () => {
  const screen = await render(
    <Badge className="bg-success text-success-foreground">Solid success</Badge>,
  );
  const badge = screen.getByText("Solid success");
  await expect.element(badge).toHaveClass("bg-success");
  await expect.element(badge).toHaveClass("text-success-foreground");
});

test("RTL: spacing is written in logical properties only (RTL)", async () => {
  const classes = badgeVariants({});
  expect(classes).toMatch(/(?:^|\s)has-data-\[icon=inline-start\]:ps-/);
  expect(classes).toMatch(/(?:^|\s)has-data-\[icon=inline-end\]:pe-/);
  expect(classes).not.toMatch(/(?:^|\s)(?:pl|pr|ml|mr)-/);
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — as a link", async () => {
  const screen = await render(
    <Badge render={<a href="#somewhere" />}>Open Link</Badge>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — with a decorative icon", async () => {
  const screen = await render(
    <Badge variant="secondary">
      <svg data-icon="inline-start" aria-hidden="true" />
      Verified
    </Badge>,
  );
  await expectNoA11yViolations(screen.container);
});

test("API-25: BadgeVariant is the variant union", () => {
  expectTypeOf<BadgeVariant>().toEqualTypeOf<
    NonNullable<VariantProps<typeof badgeVariants>["variant"]>
  >();
  expectTypeOf<"info">().toMatchTypeOf<BadgeVariant>();
  expectTypeOf<"danger">().not.toMatchTypeOf<BadgeVariant>();
});

test("API-25: a typed status map renders through BadgeVariant (Mapping domain statuses)", async () => {
  type Status = "live" | "running" | "paused" | "failed" | "draft" | "archived";
  const STATUS = {
    live: { label: "Live", variant: "success" },
    running: { label: "Running", variant: "info" },
    paused: { label: "Paused", variant: "warning" },
    failed: { label: "Failed", variant: "destructive" },
    draft: { label: "Draft", variant: "secondary" },
    archived: { label: "Archived", variant: "outline" },
  } satisfies Record<Status, { label: string; variant: BadgeVariant }>;
  const screen = await render(
    <div>
      {(Object.keys(STATUS) as Status[]).map((status) => (
        <Badge key={status} variant={STATUS[status].variant}>
          {STATUS[status].label}
        </Badge>
      ))}
    </div>,
  );
  for (const status of Object.keys(STATUS) as Status[]) {
    await expect
      .element(screen.getByText(STATUS[status].label))
      .toHaveAttribute("data-variant", STATUS[status].variant);
  }
});
