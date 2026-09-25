import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

/** Upstream's two variants plus the three COL-12 status families. Alert has no size dimension. */
const VARIANTS = [
  "default",
  "destructive",
  "success",
  "warning",
  "info",
] as const;

/** The variants that carry a chromatic ink — the A11Y-13 scope. */
const STATUS_VARIANTS = ["destructive", "success", "warning", "info"] as const;

/** The class string the recipe produces for one variant, read off a rendered root. */
async function classesFor(variant: (typeof VARIANTS)[number]) {
  const screen = await render(
    <Alert variant={variant}>
      <AlertTitle>{variant}</AlertTitle>
    </Alert>,
  );
  return screen.container.querySelector("[data-slot=alert]")!.className;
}

test("renders a polite status region carrying data-slot (A11Y-3)", async () => {
  const screen = await render(
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
    </Alert>,
  );
  const alert = screen.getByRole("status");
  await expect.element(alert).toBeInTheDocument();
  await expect.element(alert).toHaveAttribute("data-slot", "alert");
});

test("A11Y-3: an alert present at load is not assertive", async () => {
  const screen = await render(
    <Alert variant="destructive">
      <AlertTitle>Sync failed</AlertTitle>
    </Alert>,
  );
  expect(screen.container.querySelector('[role="alert"]')).toBeNull();
});

test("every exported part renders and carries its own data-slot (Composition)", async () => {
  const screen = await render(
    <Alert>
      <svg aria-hidden="true" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components using the CLI.</AlertDescription>
      <AlertAction>
        <Button size="xs">Enable</Button>
      </AlertAction>
    </Alert>,
  );
  const root = screen.container.querySelector("[data-slot=alert]")!;
  for (const slot of [
    "alert-title",
    "alert-description",
    "alert-action",
  ] as const) {
    expect(root.querySelector(`[data-slot=${slot}]`)).not.toBe(null);
  }
  await expect.element(screen.getByText("Heads up!")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Enable" }))
    .toBeInTheDocument();
});

test("every variant produces its own class string", async () => {
  const seen = new Set<string>();
  for (const variant of VARIANTS) {
    const classes = await classesFor(variant);
    expect(classes.length).toBeGreaterThan(0);
    seen.add(classes);
  }
  expect(seen.size).toBe(VARIANTS.length);
});

test("an icon child claims the reserved first column (Basic, A11Y-8)", async () => {
  const screen = await render(
    <Alert>
      <svg aria-hidden="true" data-testid="alert-icon" />
      <AlertTitle>Account updated successfully</AlertTitle>
      <AlertDescription>
        Your profile information has been saved.
      </AlertDescription>
    </Alert>,
  );
  const root = screen.container.querySelector("[data-slot=alert]")!;
  // The icon is a DIRECT child — the recipe switches to two columns only for `> svg`.
  expect(root.querySelector(":scope > [data-testid=alert-icon]")).not.toBe(
    null,
  );
  expect(root.className).toContain("has-[>svg]:grid-cols-[auto_1fr]");
  const title = root.querySelector("[data-slot=alert-title]")!;
  expect(title.className).toContain("group-has-[>svg]/alert:col-start-2");
});

test("destructive tints the whole banner from one ink (Destructive)", async () => {
  const classes = await classesFor("destructive");
  expect(classes).toContain("text-destructive-text");
  expect(classes).toContain("bg-card");
});

test("COL-12: success, warning and info exist beside destructive", async () => {
  for (const variant of STATUS_VARIANTS) {
    const classes = await classesFor(variant);
    expect(classes).toContain(`text-${variant}-text`);
    expect(classes).toContain(
      `*:data-[slot=alert-description]:text-${variant}-text/90`,
    );
  }
});

test("A11Y-13: every status variant takes the family's -text ink, never the fill as ink", async () => {
  for (const variant of STATUS_VARIANTS) {
    const classes = await classesFor(variant);
    expect(classes).not.toMatch(
      new RegExp(`(?:^|\\s|:)text-${variant}(?![-\\w])`),
    );
  }
});

test("LAY-15: the action takes its own grid column, never an absolute overlay (Action)", async () => {
  const screen = await render(
    <Alert>
      <AlertTitle>Dark mode is now available</AlertTitle>
      <AlertAction>
        <Button size="xs">Enable</Button>
      </AlertAction>
    </Alert>,
  );
  const root = screen.container.querySelector("[data-slot=alert]")!;
  expect(root.className).toContain("@container/alert");
  expect(root.className).toContain(
    "@md/alert:has-data-[slot=alert-action]:grid-cols-[1fr_auto]",
  );
  expect(root.className).not.toContain("pe-18");
  const action = root.querySelector("[data-slot=alert-action]")!;
  expect(action.className).not.toContain("absolute");
  expect(action.className).toContain("@md/alert:row-span-2");
});

test("DOC-2: cn from @vegastack/design merges a caller's className onto the recipe (Custom Colors)", async () => {
  const screen = await render(
    <Alert variant="warning" className="border-warning/40 bg-warning/10">
      <AlertTitle>Expiring soon</AlertTitle>
    </Alert>,
  );
  const root = screen.container.querySelector("[data-slot=alert]")!;
  expect(root.className).toContain("bg-warning/10");
  expect(root.className).toContain("border-warning/40");
  // tailwind-merge aware: the caller's surface replaces the recipe's, never stacks on it.
  expect(root.className).not.toContain("bg-card");
});

test("RTL: the root and the action are written in logical properties only (RTL)", async () => {
  const screen = await render(
    <Alert dir="rtl">
      <AlertTitle>تم الدفع بنجاح</AlertTitle>
      <AlertAction>
        <Button size="xs">عرض</Button>
      </AlertAction>
    </Alert>,
  );
  const root = screen.container.querySelector("[data-slot=alert]")!;
  expect(root.className).toContain("text-start");
  expect(root.className).not.toMatch(/(?:^|\s)text-(?:left|right)(?:\s|$)/);
  expect(root.className).not.toMatch(/(?:^|\s)(?:pl|pr|ml|mr)-/);
  const action = root.querySelector("[data-slot=alert-action]")!;
  expect(action.className).not.toMatch(/(?:^|\s)(?:left|right)-/);
});

test("no a11y violations — rest, every variant", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) => (
        <Alert key={variant} variant={variant}>
          <svg aria-hidden="true" />
          <AlertTitle>{variant}</AlertTitle>
          <AlertDescription>A short explanation of the state.</AlertDescription>
        </Alert>
      ))}
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — with an action", async () => {
  const screen = await render(
    <Alert>
      <AlertTitle>Dark mode is now available</AlertTitle>
      <AlertDescription>
        Enable it under your profile settings.
      </AlertDescription>
      <AlertAction>
        <Button size="xs">Enable</Button>
      </AlertAction>
    </Alert>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — title only, no icon", async () => {
  const screen = await render(
    <Alert variant="info">
      <AlertTitle>Maintenance window on Sunday</AlertTitle>
    </Alert>,
  );
  await expectNoA11yViolations(screen.container);
});

for (const variant of ["destructive", "warning"] as const) {
  test(`A11Y-3: live + ${variant} is assertive (role="alert")`, async () => {
    const screen = await render(
      <Alert variant={variant} live>
        <AlertTitle>Payment failed</AlertTitle>
      </Alert>,
    );
    await expect
      .element(screen.getByRole("alert"))
      .toHaveAttribute("data-slot", "alert");
  });
}

for (const variant of ["default", "success", "info"] as const) {
  test(`A11Y-3: live + ${variant} stays a polite status`, async () => {
    const screen = await render(
      <Alert variant={variant} live>
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );
    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
    await expect
      .element(screen.getByRole("status"))
      .toHaveAttribute("data-slot", "alert");
  });
}

test("A11Y-3: every variant at rest is a polite status, never assertive", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) => (
        <Alert key={variant} variant={variant}>
          <AlertTitle>{variant}</AlertTitle>
        </Alert>
      ))}
    </div>,
  );
  const roots = [
    ...screen.container.querySelectorAll<HTMLElement>("[data-slot=alert]"),
  ];
  expect(roots.map((root) => root.getAttribute("role"))).toEqual(
    VARIANTS.map(() => "status"),
  );
});

test("A11Y-3: live is not forwarded to the DOM", async () => {
  const screen = await render(
    <Alert variant="warning" live>
      <AlertTitle>Quota nearly used</AlertTitle>
    </Alert>,
  );
  const root = screen.container.querySelector("[data-slot=alert]")!;
  expect(root.hasAttribute("live")).toBe(false);
});

test("A11Y-3: a caller's explicit role still wins", async () => {
  const screen = await render(
    <Alert variant="info" role="note">
      <AlertTitle>Read-only workspace</AlertTitle>
    </Alert>,
  );
  expect(
    screen.container.querySelector("[data-slot=alert]")!.getAttribute("role"),
  ).toBe("note");
});

test("no a11y violations — live destructive and live warning", async () => {
  const screen = await render(
    <div>
      <Alert variant="destructive" live>
        <svg aria-hidden="true" />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Your card was declined.</AlertDescription>
      </Alert>
      <Alert variant="warning" live>
        <AlertTitle>Quota nearly used</AlertTitle>
      </Alert>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("a button inside a status alert hovers in the family's own tint and ink (API-29)", async () => {
  // The neutral hover (`bg-muted text-foreground`) read white in dark mode on a destructive alert.
  // `contrast-check.mjs` gates this exact pair — `<family>-text` on `<family>/10` over `card` — in
  // both themes.
  for (const variant of STATUS_VARIANTS) {
    const classes = await classesFor(variant);
    const hover = "[&_[data-slot=button]:not([data-variant=default]):hover]";
    expect(classes).toContain(`${hover}:bg-${variant}/10`);
    expect(classes).toContain(`${hover}:text-${variant}-text`);
  }
});
