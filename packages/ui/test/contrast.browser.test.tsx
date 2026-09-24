import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import axe from "axe-core";
import { afterEach, expect, test } from "vitest";
import { Badge } from "../registry/ui/badge";
import { DataGrid } from "../registry/ui/data-grid";
import { DataList } from "../registry/ui/data-list";
import { Alert, AlertTitle, AlertDescription } from "../registry/ui/alert";
import { Button } from "../registry/ui/button";
import { Toaster, toast } from "../registry/ui/toast";
import { TextEdit } from "../registry/ui/text-edit";
import { ColorPicker } from "../registry/ui/color-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../registry/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../registry/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../registry/ui/context-menu";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "../registry/ui/menubar";
import { FileWarningIcon } from "lucide-react";
import { isTransparent } from "./color";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "../registry/ui/attachment";
import Login01Page from "../registry/blocks/login-01/page";
import { LoginForm } from "../registry/blocks/login-01/components/login-form";

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
 *   - `Toaster` — default/success/error/warning/info toast surfaces (bg-popover /
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

      {/* Badge: the solid fills and, since Batch 2 of the shadcn reset, the four tinted status
          variants (COL-12). The tints are exactly the pairs A11Y-13 moved onto the `-text` ink. */}
      <div className="flex flex-wrap gap-2">
        <Badge>default</Badge>
        <Badge variant="secondary">secondary</Badge>
        <Badge variant="outline">outline</Badge>
        <Badge variant="ghost">ghost</Badge>
        <Badge variant="link">link</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">tinted info</Badge>
        <Badge variant="success">tinted success</Badge>
        <Badge variant="warning">tinted warning</Badge>
        <Badge variant="destructive">tinted destructive</Badge>
      </div>

      {/* Button: upstream's six variants verbatim. `destructive` is a TINT carrying the
          `-text` ink (A11Y-13), which is the one contrast-critical pair in the set. */}
      <div className="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
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

      {/* The alpha-composited status tints, on the two non-page neutral surfaces they sit on.
          `bg-<family>/10` over `card` and over `popover` are different composites, and both have to
          clear AA against the family's `-text` ink. */}
      <div className="flex flex-wrap gap-2 rounded-md bg-card p-3">
        <Badge variant="destructive">Card destructive</Badge>
        <Badge variant="success">Card success</Badge>
        <Badge variant="warning">Card warning</Badge>
        <Badge variant="info">Card info</Badge>
        <Button variant="destructive">Card destructive action</Button>
      </div>
      <div className="flex flex-wrap gap-2 rounded-md bg-popover p-3">
        <Badge variant="destructive">Popover destructive</Badge>
        <Badge variant="success">Popover success</Badge>
        <Badge variant="warning">Popover warning</Badge>
        <Badge variant="info">Popover info</Badge>
        <Button variant="destructive">Popover destructive action</Button>
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

      {/* Attachment's `error` card (Batch 6 of the shadcn reset). This subject exists because it
          did not: upstream's `AttachmentDescription` inked its failure line with the destructive
          FILL at 80% (`text-destructive/80`), which rasterises to 4.113:1 on `card` at 12px, and
          nothing in the repository measured it — attachment's own unit lane ran unstyled and this
          file had no attachment subject. A11Y-13 moved the ink onto `text-destructive-text`; this
          node is what holds it there, in BOTH themes, rather than only in the light-mode axe run
          inside `attachment.test.tsx`. The media slot is deliberately included too: its error icon
          ink is upstream's fill on the family's own `/10` tint, measured at 3.973:1 — over the 3:1
          non-text floor and therefore left verbatim, which is a number worth re-measuring on every
          token change. */}
      <div className="rounded-md bg-card p-3">
        <Attachment state="error" className="w-full max-w-sm">
          <AttachmentMedia>
            <FileWarningIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
            <AttachmentDescription>
              Upload failed — the file is larger than 25 MB.
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </div>
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
    // Upstream's Button carries `transition-all` (MOT-2 = shadcn), so the focus outline ANIMATES
    // in — measuring on the tick after the tab reads a half-drawn ring and reports a width and an
    // offset the user never sees. Wait for the control's own running animations instead of
    // sleeping: it is exact, and it is why this gate stopped being flaky when upstream's
    // transition vocabulary came back in Batch 2.
    await Promise.all(
      button
        .getAnimations()
        .map((animation) => animation.finished.catch(() => {})),
    );
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
    if (isTransparent(color)) {
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

// The toast viewport + Popover PORTAL their DOM to `<body>`, which sits OUTSIDE any `.dark`
// wrapper element —
// so for those components the dark tokens (scoped under `.dark` in the compiled theme) only resolve
// when `.dark` is on a body ancestor. We therefore toggle `.dark` on `<html>` for the portaled dark
// tests, and always clear it afterwards so the next light audit isn't contaminated.
afterEach(() => {
  document.documentElement.classList.remove("dark");
});

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

/**
 * Fire one toast of a given variant.
 *
 * `timeout: 0` is REQUIRED, not tidiness. This audit fires a toast, polls for its enter animation,
 * then runs a full axe pass over `document.body` — and the default lifetime is 5s. When the axe
 * pass pushes past that, the toast starts its EXIT transition while axe is still measuring, and axe
 * composites the near-black ink against a partly transparent surface: a 1.26:1 "failure" no token
 * could ever produce (that is the bug the sonner-era version of this test hit twice, release runs
 * 30143769219 and 30140043824). `timeout: 0` disables the auto-dismiss timer outright, so the audit
 * owns the toast's lifetime instead of racing it. `auditToast` already dismisses explicitly.
 */
function fireToast(variant: ToastVariant, message: string) {
  toast.add({
    title: message,
    description: "Supporting detail line",
    timeout: 0,
    ...(variant === "default" ? {} : { type: variant }),
  });
}

/**
 * Show ONE toast, wait for its enter-animation to fully settle (opacity → 1), audit color-contrast,
 * then dismiss it and wait for the portal to clear. We audit one variant at a time on purpose:
 * when toasts stack, the ones *behind* the front toast are deliberately scaled down and clipped (a
 * visual de-emphasis, not a token color), and axe would flag those blended back toasts. Auditing a
 * single front toast at full opacity measures each variant's REAL token colors with no stacking
 * artifact. Returns the contrast-violation summaries (empty on pass).
 */
async function auditToast(variant: ToastVariant, message: string) {
  fireToast(variant, message);
  await expect
    .poll(
      () => {
        const t = document.querySelector(
          '[data-slot="toast"]',
        ) as HTMLElement | null;
        if (!t || !t.textContent?.includes(message)) return false;
        // Only audit once the enter animation has finished (mid-animation opacity blends colors).
        return Number(getComputedStyle(t).opacity) >= 0.99;
      },
      { timeout: 3000 },
    )
    .toBe(true);
  const violations = await contrastViolations(document.body);
  toast.close();
  await expect
    .poll(() => document.querySelectorAll('[data-slot="toast"]').length, {
      timeout: 2000,
    })
    .toBe(0);
  return violations;
}

/** Mount the Toaster (in the given theme) and audit every variant, one fully-settled toast at a time. */
async function auditAllToasts(dark: boolean) {
  if (dark) document.documentElement.classList.add("dark");
  // The `<html>.dark` toggle above is what drives the compiled tokens on the portal — the toast
  // surface reads them straight from the cascade, with no theme prop of its own.
  await render(<Toaster />);
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
  await expect.element(screen.getByText("tinted warning")).toBeInTheDocument();
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `color-contrast failures (light):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
  const lightIntegration = await integrationFailures(screen.container);
  expect(
    lightIntegration,
    `focus/categorical integration failures (light):\n  ${lightIntegration.join("\n  ")}`,
  ).toEqual([]);
});

test("rendered color-contrast passes WCAG 2.2 AA — dark theme", async () => {
  const screen = await render(
    <div className="dark">
      <Surfaces />
    </div>,
  );
  await expect.element(screen.getByText("tinted warning")).toBeInTheDocument();
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

// ── Toaster ────────────────────────────────────────────────────────────────────────────────────
// Toasts portal to <body>, so audit the whole document. Each variant exercises a different token
// pair: the base toast (bg-popover / text-popover-foreground), the muted description, and the
// per-status tints (bg-success/10 + text-success, etc.) plus their lucide status icons.
// Audited one fully-settled toast at a time (see `auditToast` — avoids the stacking-dim false
// positive).

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

// ── COL-23: the first text line carries the default ink ────────────────────────────────────────
// Base UI renders `Toast.Title` as `null` when a toast has no title, so upstream's flat
// `text-muted-foreground` on the description paints a description-only toast's ONLY line — its
// primary message — in the SECONDARY ink. `first:text-popover-foreground` restores the default ink
// exactly when the description leads. This is the lane with compiled tokens, so it is the one that
// can measure the inks rather than the class names (the unit lane asserts those).

/** Mount the Toaster, fire one toast, and hand back its settled root. */
async function settledToast(
  options: Parameters<typeof toast.add>[0],
  message: string,
) {
  await render(<Toaster />);
  toast.add({ timeout: 0, ...options });
  await expect
    .poll(
      () => {
        const element = document.querySelector(
          '[data-slot="toast"]',
        ) as HTMLElement | null;
        if (!element || !element.textContent?.includes(message)) return false;
        return Number(getComputedStyle(element).opacity) >= 0.99;
      },
      { timeout: 3000 },
    )
    .toBe(true);
  return document.querySelector('[data-slot="toast"]') as HTMLElement;
}

const inkOf = (root: HTMLElement, slot: string) =>
  getComputedStyle(root.querySelector(`[data-slot="${slot}"]`) as HTMLElement)
    .color;

test("COL-23: a description-only toast renders in the DEFAULT ink", async () => {
  const element = await settledToast(
    { description: "Event has been created." },
    "Event has been created.",
  );
  expect(element.querySelector('[data-slot="toast-title"]')).toBeNull();
  // Compared against the surface's own ink rather than a literal colour, so it survives a retune.
  expect(inkOf(element, "toast-description")).toBe(
    getComputedStyle(element).color,
  );
  toast.close();
});

test("COL-23: a description BELOW a title renders in the muted ink", async () => {
  const element = await settledToast(
    { title: "Event created", description: "Sunday, December 3 at 9:00 AM" },
    "Sunday, December 3 at 9:00 AM",
  );
  const title = inkOf(element, "toast-title");
  const description = inkOf(element, "toast-description");
  // The hierarchy the row is about: two lines, two inks, the title at full strength.
  expect(title).toBe(getComputedStyle(element).color);
  expect(description).not.toBe(title);
  toast.close();
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

// ── A counted tab ──────────────────────────────────────────────────────────────────────────────
// The pre-reset Tabs had a `count` prop that painted its own translucent ink wash
// (`[data-slot="tabs-trigger-count"]`, `bg-foreground/7`) on top of whatever the trigger painted,
// and on a selected trigger that composited TWO washes over a rung — a stack
// `tooling/contrast-check.mjs` cannot see, because that gate checks TOKEN pairs. Measured dark,
// pre-fix: muted-foreground over that stack was 3.40:1 (needs 4.5:1), which is what the appearance
// probes reported as an axe `color-contrast` serious on `/docs/components/tabs`.
//
// Batch 5 of the shadcn reset put Tabs back on upstream's file, so the prop and its badge are gone
// and a consumer composes a `Badge` inside the trigger instead. The STACK is the same shape — a
// badge fill over a selected trigger's fill over the list track — so the guard stays, rendering
// both of upstream's list variants with the trigger selected and unselected.
function TabsCounts() {
  return (
    <div className="flex flex-col gap-6 bg-background p-6 text-foreground">
      {(["default", "line"] as const).map((variant) => (
        <Tabs key={variant} defaultValue="overview">
          <TabsList variant={variant}>
            <TabsTrigger value="overview">
              Overview
              <Badge variant="secondary">12</Badge>
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity
              <Badge variant="secondary">3</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel</TabsContent>
          <TabsContent value="activity">Activity panel</TabsContent>
        </Tabs>
      ))}
    </div>
  );
}

test("a counted tab's badge color-contrast passes WCAG AA — light theme", async () => {
  const screen = await render(<TabsCounts />);
  await expect.poll(() => screen.container.textContent).toContain("12");
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `counted-tab badge color-contrast failures (light):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
});

test("a counted tab's badge color-contrast passes WCAG AA — dark theme", async () => {
  const screen = await render(
    <div className="dark">
      <TabsCounts />
    </div>,
  );
  await expect.poll(() => screen.container.textContent).toContain("12");
  const violations = await contrastViolations(screen.container);
  expect(
    violations,
    `counted-tab badge color-contrast failures (dark):\n  ${violations.join("\n  ")}`,
  ).toEqual([]);
});

// ── A Badge on a selected DataList / DataGrid row ─────────────────────────────────────────────
// `--accent`, `--muted` and `--secondary` share ONE value (Colors, "The neutral surfaces"). A
// selected row painted with the full `bg-accent` was therefore exactly a `secondary` Badge's fill,
// and the badge vanished into its own row — measured 1.00:1 between the two fills, in both themes
// (review 2026-09-23, `shots/`). The row now takes `SELECTED_ROW_CLASS` (`bg-muted/50`), which sits
// BETWEEN the page and the badge fill. Two facts are asserted on real compiled colours: the badge
// fill stays separated from the selected row's composite, and every text in the row (including
// the muted email) still passes axe's AA contrast rule on it.

/** Paint `layers` bottom-to-top onto one canvas pixel and read back its sRGB channels (0-255). */
function composite(layers: string[]): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d")!;
  for (const layer of layers) {
    context.fillStyle = layer;
    context.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!];
}

/** WCAG 2.x contrast ratio between two opaque sRGB colours. */
function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
) {
  const luminance = ([r, g, b]: [number, number, number]) => {
    const channel = (value: number) => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

interface SelectedRowPerson {
  id: string;
  name: string;
  email: string;
  status: string;
}

const SELECTED_ROW_PEOPLE: SelectedRowPerson[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@vega.dev", status: "Active" },
  { id: "2", name: "Bea Arthur", email: "bea@vega.dev", status: "Invited" },
];

function SelectedRows({ grid }: { grid: boolean }) {
  const columns = [
    { key: "name", header: "Name" },
    {
      key: "email",
      header: "Email",
      render: (p: SelectedRowPerson) => (
        <span className="text-muted-foreground">{p.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p: SelectedRowPerson) => (
        <Badge variant="secondary">{p.status}</Badge>
      ),
    },
  ];
  return (
    <div className="bg-background p-6 text-foreground">
      {grid ? (
        <DataGrid
          aria-label="People"
          columns={columns}
          data={SELECTED_ROW_PEOPLE}
          getRowId={(p) => p.id}
          selectable
          selectedIds={new Set(["1"])}
          columnPicker={false}
        />
      ) : (
        <DataList
          aria-label="People"
          columns={columns}
          data={SELECTED_ROW_PEOPLE}
          getRowId={(p) => p.id}
          selectable
          selectedIds={new Set(["1"])}
        />
      )}
    </div>
  );
}

for (const theme of ["light", "dark"] as const) {
  for (const grid of [false, true]) {
    const name = grid ? "DataGrid" : "DataList";
    test(`a secondary Badge stays distinguishable on a selected ${name} row — ${theme} theme`, async () => {
      const screen = await render(
        <div className={theme === "dark" ? "dark" : undefined}>
          <SelectedRows grid={grid} />
        </div>,
      );
      await expect
        .poll(() => screen.container.querySelector("tr[data-selected]"))
        .not.toBeNull();
      const row =
        screen.container.querySelector<HTMLElement>("tr[data-selected]")!;
      const badge = row.querySelector<HTMLElement>('[data-slot="badge"]')!;
      const page = getComputedStyle(
        screen.container.querySelector<HTMLElement>(".bg-background")!,
      ).backgroundColor;
      const rowFill = getComputedStyle(row).backgroundColor;
      const badgeFill = getComputedStyle(badge).backgroundColor;
      const rowPixel = composite([page, rowFill]);
      const badgePixel = composite([page, rowFill, badgeFill]);
      // The row is visibly selected, and the badge is visibly a badge on it. The full-accent row
      // measured 1.00 here; the half wash measures ~1.05 light and ~1.17 dark.
      expect(contrastRatio(rowPixel, composite([page]))).toBeGreaterThan(1.03);
      expect(contrastRatio(badgePixel, rowPixel)).toBeGreaterThan(1.03);
      const violations = await contrastViolations(screen.container);
      expect(
        violations,
        `${name} selected-row color-contrast failures (${theme}):\n  ${violations.join("\n  ")}`,
      ).toEqual([]);
    });
  }
}

// ── menu-destructive-rest: a destructive menu row's RESTING ink on the popup ──────────────────────
// A11Y-13 moved the three menus' FOCUSED destructive ink onto `-text`; the resting ink
// `data-[variant=destructive]:text-destructive` on `bg-popover` stayed upstream's (Regent #138,
// DS-10 (a)). This measures that pair on real compiled colours — three menus × two themes — and pins
// it at the 4.5:1 AA floor, so a token move that drops it under the floor fails here by number.
// Measured 24-09-2026: 4.770:1 light and 6.207:1 dark in all three menus (menubar's item IS the
// dropdown item), so the resting ink stays upstream's and A11Y-13 is not extended to it.
const DESTRUCTIVE_MENUS = {
  "dropdown-menu": {
    open: async () => {},
    node: (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  "context-menu": {
    open: async () => {
      const trigger = document.querySelector<HTMLElement>(
        '[data-slot="context-menu-trigger"]',
      )!;
      await userEvent.click(trigger, { button: "right" });
    },
    node: (
      <div style={{ padding: 160 }}>
        <ContextMenu>
          <ContextMenuTrigger>Right click here</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Edit</ContextMenuItem>
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    ),
  },
  menubar: {
    open: async () => {
      const trigger = document.querySelector<HTMLElement>(
        '[data-slot="menubar-trigger"]',
      )!;
      await userEvent.click(trigger);
    },
    node: (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Edit</MenubarItem>
            <MenubarItem variant="destructive">Delete</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
  },
} as const;

for (const theme of ["light", "dark"] as const) {
  for (const [menu, fixture] of Object.entries(DESTRUCTIVE_MENUS)) {
    test(`menu-destructive-rest: ${menu} resting destructive ink clears 4.5:1 — ${theme} theme`, async () => {
      if (theme === "dark") document.documentElement.classList.add("dark");
      await render(fixture.node);
      await fixture.open();
      const destructive = () =>
        document.querySelector<HTMLElement>(
          '[role="menuitem"][data-variant="destructive"]',
        );
      await expect.poll(destructive).not.toBeNull();
      const item = destructive()!;
      const popup = item.closest<HTMLElement>('[role="menu"]')!;
      // Measure only once the enter transition has settled — mid-fade opacity blends colours.
      await expect
        .poll(() => Number(getComputedStyle(popup).opacity), { timeout: 3000 })
        .toBeGreaterThanOrEqual(0.99);
      // At REST: neither highlighted nor focused.
      expect(item.hasAttribute("data-highlighted")).toBe(false);
      expect(item).not.toBe(document.activeElement);
      const page = getComputedStyle(document.body).backgroundColor;
      const surface = [
        isTransparent(page) ? "white" : page,
        getComputedStyle(popup).backgroundColor,
        getComputedStyle(item).backgroundColor,
      ];
      const ratio = contrastRatio(
        composite([...surface, getComputedStyle(item).color]),
        composite(surface),
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
}

// login-01 (DS-79, decision D6). A block's unit test runs unstyled and so skips `color-contrast`
// (test/a11y.ts); this is its compiled compensating case, in both themes and in each state that
// changes ink: rest, the invalid fields (`text-destructive-text` FieldErrors and invalid borders),
// and the rejected sign-in's destructive `Alert` on the card. `contrast.css` scans
// `../registry/blocks/**` so a block's own utilities compile here. Measured 2026-09-24, every
// utility login-01 wears is also worn by some `registry/ui` component, so that `@source` adds no rule
// for it yet; it is there for the next block that does not. The page-root min-height probe is a
// compiled-CSS sentinel, so the audit never runs over an unstyled page. The loading probe measures,
// on compiled CSS, that the submit button keeps its width while it signs in (the unit lane cannot: without CSS the spinner
// overlay is not absolutely positioned).
for (const theme of ["light", "dark"] as const) {
  test(`login-01 color-contrast passes WCAG AA in every state — ${theme} theme`, async () => {
    const screen = await render(
      <div
        className={`${theme === "dark" ? "dark " : ""}bg-background text-foreground`}
      >
        <Login01Page />
      </div>,
    );
    // The block page's own root: wrapper div › page root.
    const root = screen.container.firstElementChild!
      .firstElementChild as HTMLElement;
    await expect
      .poll(() => Number.parseFloat(getComputedStyle(root).minHeight))
      .toBeGreaterThan(0);
    const failures: string[] = [];
    const audit = async (state: string) => {
      const violations = await contrastViolations(screen.container);
      if (violations.length)
        failures.push(`${state}: ${violations.join("; ")}`);
    };
    await audit("rest");

    await screen.getByRole("button", { name: "Sign in" }).click();
    await expect
      .element(screen.getByLabelText("Email"))
      .toHaveAttribute("aria-invalid", "true");
    await audit("invalid");
    expect(
      failures,
      `login-01 color-contrast failures (${theme}):\n  ${failures.join("\n  ")}`,
    ).toEqual([]);
  });

  test(`login-01 rejected sign-in alert passes WCAG AA and the submit keeps its width — ${theme} theme`, async () => {
    let reject: (error: Error) => void = () => {};
    const screen = await render(
      <div
        className={`${theme === "dark" ? "dark " : ""}bg-background p-6 text-foreground`}
      >
        <LoginForm
          signIn={() =>
            new Promise<void>((_, fail) => {
              reject = fail;
            })
          }
        />
      </div>,
    );
    const submit = screen.getByRole("button", { name: "Sign in" });
    const restWidth = submit.element().getBoundingClientRect().width;
    await screen.getByLabelText("Email").fill("ada@example.com");
    await screen.getByLabelText("Password").fill("correct horse");
    await submit.click();
    await expect.element(submit).toHaveAttribute("aria-busy", "true");
    expect(submit.element().getBoundingClientRect().width).toBe(restWidth);

    reject(
      new Error(
        "The email or password is incorrect. Check both and try again.",
      ),
    );
    await expect.element(screen.getByRole("alert")).toBeInTheDocument();
    const violations = await contrastViolations(screen.container);
    expect(
      violations,
      `login-01 alert color-contrast failures (${theme}):\n  ${violations.join("\n  ")}`,
    ).toEqual([]);
  });
}
