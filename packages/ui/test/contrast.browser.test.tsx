import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import axe from "axe-core";
import { afterEach, expect, test } from "vitest";
import { Badge } from "../registry/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../registry/ui/alert";
import { Button } from "../registry/ui/button";
import { Toaster, toast } from "../registry/ui/sonner";
import { TextEdit } from "../registry/ui/text-edit";
import { ColorPicker } from "../registry/ui/color-picker";
import { LogoRow } from "../registry/ui/logo-row";

/**
 * Rendered color-contrast a11y gate (Codex R3 HIGH-2/HIGH-3). Unlike the per-component unit a11y
 * tests — which run WITHOUT compiled CSS and therefore suppress `color-contrast` (semantic tokens
 * don't resolve to colors there) — this test compiles the REAL Tailwind utilities + token theme and
 * runs axe's `color-contrast` rule against actually-rendered colors. It is the active compiled-CSS
 * compensating gate for the suppressed checks (Playwright VRT remains a separate visual gate).
 *
 * It exercises the contrast-critical surfaces in BOTH themes: solid status fills (bg-X /
 * text-X-foreground), soft status tints (text-X on bg-X-subtle), muted secondary text, and the core
 * foreground/background + button variants.
 *
 * It also covers every component whose unit a11y test SUPPRESSES `color-contrast` (those run
 * without compiled CSS, so semantic tokens don't resolve there). Each such component is rendered
 * here with REAL compiled token colors and audited in both themes — making the per-component
 * suppression's compensating coverage real and explicit:
 *   - Sonner `Toaster` — default/success/error/warning/info toast surfaces (bg-popover /
 *     text-popover-foreground + the per-status tints + muted description text).
 *   - `TextEdit` — its token-styled prose + muted placeholder/blockquote surfaces.
 *   - `ColorPicker` (opened) — the trigger + popover chrome. The swatch fills are DYNAMIC,
 *     user-supplied colors (`style={{ backgroundColor }}`), not design tokens, so they're
 *     inherently un-checkable by a token contrast rule and are EXCLUDED from the assertion (only
 *     the dynamic swatch nodes — `[data-slot="color-picker-swatch"]` — never the chrome).
 */

// Only REAL components are rendered — their CVA class strings are literal, so Tailwind's scanner
// (via `@source ../registry/ui/**`) actually generates the utilities. Dynamic `bg-${s}` strings
// would not compile, so they're avoided. These variants exercise the contrast-critical token pairs:
// solid status fills (bg-X / text-X-foreground), soft status tints (bg-X-subtle / text-X), muted text,
// and the core foreground/background + button surfaces.
function Surfaces() {
  return (
    <div className="flex flex-col gap-4 bg-background p-6 text-foreground">
      <p className="text-foreground">Foreground body text on background.</p>
      <p className="text-muted-foreground">
        Muted secondary text on background.
      </p>
      <div className="rounded-md bg-muted p-3 text-muted-foreground">
        Muted text on the muted surface.
      </div>

      {/* Badge: solid fills + soft tints across every status */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="solid" color="default">
          solid default
        </Badge>
        <Badge variant="solid" color="primary">
          solid primary
        </Badge>
        <Badge variant="solid" color="success">
          solid success
        </Badge>
        <Badge variant="solid" color="warning">
          solid warning
        </Badge>
        <Badge variant="solid" color="destructive">
          solid destructive
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="soft" color="success">
          soft success
        </Badge>
        <Badge variant="soft" color="warning">
          soft warning
        </Badge>
        <Badge variant="soft" color="destructive">
          soft destructive
        </Badge>
        <Badge variant="outline" color="default">
          outline
        </Badge>
      </div>

      {/* Button: tinted status variants exercise bg-X-subtle + text-X (the soft-pair contrast) */}
      <div className="flex flex-wrap gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="info">Info</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      {/* Real neutral mounting surfaces for the global focus-visible outline. The token gate proves
          ring contrast mathematically; `focusIndicatorFailures` below proves the compiled utility is
          actually applied to a keyboard-focused component on each surface. */}
      {[
        ["background", "bg-background"],
        ["card", "bg-card"],
        ["popover", "bg-popover"],
        ["muted", "bg-muted"],
        ["sidebar", "bg-sidebar"],
      ].map(([surface, className]) => (
        <div
          key={surface}
          className={`${className} rounded-md p-3`}
          data-focus-surface={surface}
        >
          <Button variant="outline">Focus on {surface}</Button>
        </div>
      ))}

      {/* Alpha-composited outline controls mounted on the non-page neutral surfaces they support. */}
      <div className="flex flex-wrap gap-2 rounded-md bg-card p-3">
        <Button variant="destructive">Card destructive</Button>
        <Button variant="success">Card success</Button>
        <Button variant="warning">Card warning</Button>
        <Button variant="info">Card info</Button>
      </div>
      <div className="flex flex-wrap gap-2 rounded-md bg-popover p-3">
        <Button variant="destructive">Popover destructive</Button>
        <Button variant="success">Popover success</Button>
        <Button variant="warning">Popover warning</Button>
        <Button variant="info">Popover info</Button>
      </div>

      {/* Categorical integration specimens: the token gate checks the ratios; these nodes prove all
          eight chart variables resolve through compiled Tailwind in a real browser. */}
      <div
        className="flex gap-2 rounded-md bg-card p-3"
        data-categorical-specimens
      >
        <span className="size-4 bg-chart-1" aria-hidden="true" />
        <span className="size-4 bg-chart-2" aria-hidden="true" />
        <span className="size-4 bg-chart-3" aria-hidden="true" />
        <span className="size-4 bg-chart-4" aria-hidden="true" />
        <span className="size-4 bg-chart-5" aria-hidden="true" />
        <span className="size-4 bg-chart-6" aria-hidden="true" />
        <span className="size-4 bg-chart-7" aria-hidden="true" />
        <span className="size-4 bg-chart-8" aria-hidden="true" />
      </div>

      <LogoRow
        label="Trusted by"
        items={[{ name: "Northstar" }, { name: "Kepler", href: "#kepler" }]}
      />

      <Alert variant="success">
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your changes have been saved.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Subscription expiring soon.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertTitle>FYI</AlertTitle>
        <AlertDescription>An informational note.</AlertDescription>
      </Alert>
    </div>
  );
}

async function integrationFailures(container: Element) {
  const failures: string[] = [];
  const focusSurfaces = container.querySelectorAll<HTMLElement>(
    "[data-focus-surface]",
  );
  const maximumTabs =
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ).length + 1;
  for (const surface of focusSurfaces) {
    const button = surface.querySelector<HTMLButtonElement>("button");
    if (!button) {
      failures.push(`${surface.dataset.focusSurface}: missing Button specimen`);
      continue;
    }
    // Use a real keyboard Tab path rather than HTMLElement.focus(): Chromium intentionally does not
    // expose `:focus-visible` for every programmatic focus, which would make this a false negative.
    for (
      let step = 0;
      step < maximumTabs && document.activeElement !== button;
      step++
    ) {
      await userEvent.tab();
    }
    const style = getComputedStyle(button);
    if (!button.matches(":focus-visible")) {
      failures.push(
        `${surface.dataset.focusSurface}: keyboard-path focus is not :focus-visible`,
      );
    }
    if (
      style.outlineStyle === "none" ||
      Number.parseFloat(style.outlineWidth) < 2
    ) {
      failures.push(
        `${surface.dataset.focusSurface}: expected a visible >=2px outline, got ${style.outline}`,
      );
    }
    if (Number.parseFloat(style.outlineOffset) < 1) {
      failures.push(
        `${surface.dataset.focusSurface}: expected >=1px outline offset, got ${style.outlineOffset}`,
      );
    }
  }

  const categorical = container.querySelectorAll<HTMLElement>(
    "[data-categorical-specimens] > span",
  );
  if (categorical.length !== 8)
    failures.push(
      `expected 8 categorical specimens, found ${categorical.length}`,
    );
  for (const [index, specimen] of [...categorical].entries()) {
    const color = getComputedStyle(specimen).backgroundColor;
    if (!color || color === "rgba(0, 0, 0, 0)" || color === "transparent") {
      failures.push(
        `chart-${index + 1}: compiled background token did not resolve`,
      );
    }
  }
  return failures;
}

async function contrastViolations(el: Element) {
  const results = await axe.run(el, {
    runOnly: { type: "rule", values: ["color-contrast"] },
  });
  return results.violations.flatMap((v) =>
    v.nodes.map(
      (n) =>
        `${n.target.join(" ")} — ${n.failureSummary?.split("\n").slice(-1)[0] ?? ""}`,
    ),
  );
}

/**
 * Like `contrastViolations`, but EXCLUDES the ColorPicker swatch nodes from the audit. A swatch
 * background is a dynamic, user-supplied color (`style={{ backgroundColor }}`) — there is no design
 * token to check it against, so axe's token-blind color-contrast result on it is not a design-system
 * defect. We exclude ONLY `[data-slot="color-picker-swatch"]` (and the lucide check icon nested
 * inside it, whose contrast is against the dynamic swatch, not chrome). Everything else — trigger
 * border/focus, popover surface, group chrome — is still asserted via the normal run on `context`.
 * The exclusion uses axe's native `exclude` selector, so the swatch subtree is never evaluated.
 */
async function chromeContrastViolations(context: Element) {
  const results = await axe.run(
    { include: [context], exclude: [['[data-slot="color-picker-swatch"]']] },
    { runOnly: { type: "rule", values: ["color-contrast"] } },
  );
  return results.violations.flatMap((v) =>
    v.nodes.map(
      (n) =>
        `${n.target.join(" ")} — ${n.failureSummary?.split("\n").slice(-1)[0] ?? ""}`,
    ),
  );
}

// Sonner + Popover PORTAL their DOM to `<body>`, which sits OUTSIDE any `.dark` wrapper element —
// so for those components the dark tokens (scoped under `.dark` in the compiled theme) only resolve
// when `.dark` is on a body ancestor. We therefore toggle `.dark` on `<html>` for the portaled dark
// tests, and always clear it afterwards so the next light audit isn't contaminated.
afterEach(() => {
  document.documentElement.classList.remove("dark");
});

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

/** Fire one toast of a given variant. */
function fireToast(variant: ToastVariant, message: string) {
  if (variant === "success") toast.success(message);
  else if (variant === "error") toast.error(message);
  else if (variant === "warning") toast.warning(message);
  else if (variant === "info") toast.info(message);
  else toast(message);
}

/**
 * Show ONE toast, wait for its enter-animation to fully settle (opacity → 1), audit color-contrast,
 * then dismiss it and wait for the portal to clear. We audit one variant at a time on purpose:
 * when toasts stack, Sonner intentionally scales + dims the toasts *behind* the front one (a visual
 * de-emphasis, not a token color), and axe would flag those blended/dimmed back toasts. Auditing a
 * single front toast at full opacity measures each variant's REAL token colors with no stacking
 * artifact. Returns the contrast-violation summaries (empty on pass).
 */
async function auditToast(variant: ToastVariant, message: string) {
  fireToast(variant, message);
  await expect
    .poll(
      () => {
        const t = document.querySelector(
          '[data-sonner-toast][data-mounted="true"]',
        ) as HTMLElement | null;
        if (!t || !t.textContent?.includes(message)) return false;
        // Only audit once the enter animation has finished (mid-animation opacity blends colors).
        return Number(getComputedStyle(t).opacity) >= 0.99;
      },
      { timeout: 3000 },
    )
    .toBe(true);
  const violations = await contrastViolations(document.body);
  toast.dismiss();
  await expect
    .poll(() => document.querySelectorAll("[data-sonner-toast]").length, {
      timeout: 2000,
    })
    .toBe(0);
  return violations;
}

/** Mount the Toaster (in the given theme) and audit every variant, one fully-settled toast at a time. */
async function auditAllToasts(dark: boolean) {
  if (dark) document.documentElement.classList.add("dark");
  // Pin the theme explicitly so the audited DOM is deterministic (next-themes resolves to a
  // concrete value); the `<html>.dark` toggle above drives the compiled tokens on the portal.
  await render(<Toaster theme={dark ? "dark" : "light"} />);
  const variants: Array<[ToastVariant, string]> = [
    ["default", "Plain notification"],
    ["success", "Saved successfully"],
    ["error", "Something failed"],
    ["warning", "Heads up — expiring soon"],
    ["info", "An informational note"],
  ];
  const failures: string[] = [];
  for (const [variant, message] of variants) {
    const violations = await auditToast(variant, message);
    if (violations.length)
      failures.push(`${variant}: ${violations.join("; ")}`);
  }
  return failures;
}

test("rendered color-contrast passes WCAG 2.2 AA — light theme", async () => {
  const screen = await render(<Surfaces />);
  // give the compiled stylesheet a tick to apply
  await expect.element(screen.getByText("solid warning")).toBeInTheDocument();
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `color-contrast failures (light):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
  expect(
    await integrationFailures(screen.container),
    "focus/categorical integration failures (light)",
  ).toEqual([]);
});

test("rendered color-contrast passes WCAG 2.2 AA — dark theme", async () => {
  const screen = await render(
    <div className="dark">
      <Surfaces />
    </div>,
  );
  await expect.element(screen.getByText("solid warning")).toBeInTheDocument();
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `color-contrast failures (dark):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
  expect(
    await integrationFailures(screen.container),
    "focus/categorical integration failures (dark)",
  ).toEqual([]);
});

// ── Sonner Toaster ─────────────────────────────────────────────────────────────────────────────
// Toasts portal to <body>, so audit the whole document. Each variant exercises a different token
// pair: the base toast (bg-popover / text-popover-foreground), the muted description, and the
// per-status tints (bg-success-subtle + text-success, etc.) plus their lucide status icons. Audited one
// fully-settled toast at a time (see `auditToast` — avoids Sonner's stacking-dim false positive).

test("Toaster color-contrast passes WCAG AA — light theme", async () => {
  const failures = await auditAllToasts(false);
  expect(
    failures,
    `toaster color-contrast failures (light):\n  ${failures.join("\n  ")}`,
  ).toEqual([]);
});

test("Toaster color-contrast passes WCAG AA — dark theme", async () => {
  const failures = await auditAllToasts(true);
  expect(
    failures,
    `toaster color-contrast failures (dark):\n  ${failures.join("\n  ")}`,
  ).toEqual([]);
});

// ── TextEdit ───────────────────────────────────────────────────────────────────────────────────
// The editor surface styles prose entirely with semantic tokens (text-foreground, the
// text-muted-foreground blockquote/placeholder, bg-muted code). Render mixed content so the
// muted/secondary surfaces are present, then audit the rendered container.

function TextEditSample() {
  return (
    <div className="bg-background p-6">
      <TextEdit
        defaultValue={
          "<p>Foreground prose sample.</p>" +
          "<blockquote>Muted blockquote text.</blockquote>" +
          "<p>Inline <code>muted code</code> sample.</p>"
        }
        placeholder="Muted placeholder sample"
        aria-label="Body"
      />
    </div>
  );
}

test("TextEdit color-contrast passes WCAG AA — light theme", async () => {
  const screen = await render(<TextEditSample />);
  await expect
    .element(screen.getByText("Foreground prose sample."))
    .toBeInTheDocument();
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `text-edit color-contrast failures (light):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
});

test("TextEdit color-contrast passes WCAG AA — dark theme", async () => {
  const screen = await render(
    <div className="dark">
      <TextEditSample />
    </div>,
  );
  await expect
    .element(screen.getByText("Foreground prose sample."))
    .toBeInTheDocument();
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `text-edit color-contrast failures (dark):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
});

// ── ColorPicker (opened) ─────────────────────────────────────────────────────────────────────────
// The popover portals to <body>, so audit the document. EXCLUDE only the dynamic swatch fills
// (`[data-slot="color-picker-swatch"]`) — they are user-supplied colors with no design token to
// check against — and assert every other surface (trigger chrome, popover, focus borders) passes.

test("ColorPicker chrome color-contrast passes WCAG AA — light theme", async () => {
  const screen = await render(<ColorPicker value="blue" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  await expect
    .poll(() => document.querySelector('[aria-label="Green"]'))
    .not.toBeNull();
  const violations = await chromeContrastViolations(document.body);
  expect(
    violations,
    `color-picker chrome color-contrast failures (light):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
});

test("ColorPicker chrome color-contrast passes WCAG AA — dark theme", async () => {
  // Popover portals to <body> (outside any wrapper), so drive dark tokens from `<html>.dark`.
  document.documentElement.classList.add("dark");
  const screen = await render(<ColorPicker value="blue" />);
  await screen.getByRole("button", { name: "Pick a color" }).click();
  await expect
    .poll(() => document.querySelector('[aria-label="Green"]'))
    .not.toBeNull();
  const violations = await chromeContrastViolations(document.body);
  expect(
    violations,
    `color-picker chrome color-contrast failures (dark):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
});
