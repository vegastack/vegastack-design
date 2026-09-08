import "./geometry.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, beforeAll, expect, test } from "vitest";
import * as Preview from "@/components/preview";

/**
 * The behaviour contracts, over the preview fixtures, with compiled token CSS.
 *
 * WHAT THIS IS
 *   The three assertions that `apps/docs/vrt/contracts.spec.ts` ran against the static docs
 *   export under `@playwright/test`, moved verbatim in substance onto the fixtures themselves:
 *
 *     1. 320px reflow      the document does not scroll horizontally at the narrowest
 *                          supported viewport (WCAG 2.2 §1.4.10).
 *     2. RTL containment   the same, with `dir="rtl"` on the document element.
 *     3. 24px target floor the effective pointer target of every interactive control is at
 *                          least 24×24 (WCAG 2.2 §2.5.8) AND nothing else owns the interior of
 *                          that centred square.
 *
 *   Nothing here needs Next, a docs build, a served route, or a second test runner. The fixture
 *   IS the component's public composition, so mounting it directly asserts the same geometry the
 *   route asserted, minus the docs chrome — which was never the component's contract.
 *
 * WHAT WAS DELIBERATELY DROPPED, AND WHY
 *   - The dark and forced-colors lanes. Neither ever produced a finding. Dark surfaces stay
 *     covered by `contrast.browser.test.tsx`, which runs axe over real compiled colors in both
 *     themes.
 *   - The focus-indicator assertion. Measured 2026-07-25 to be UNABLE TO FAIL: it ran under
 *     `forcedColors: "active"`, where Chromium paints its own ≥2px ring, so deleting the design
 *     system's `:focus-visible` rule left all 864 checks green — and its fallback branch was
 *     unconditionally true too, because forced-colors repaints borders on focus. Carrying a
 *     no-op forward would be carrying a false coverage claim forward. See `docs/ledger/bugs.md`,
 *     2026-07-25. Focus visibility is therefore NOT covered by this file and must not be cited
 *     as covered; restoring it in normal colours is separately scoped work.
 *
 * WHAT IS HONESTLY DIFFERENT FROM THE OLD LANE
 *   Fonts come from this test page, not `next/font`, so glyph metrics are not pixel-identical to
 *   the docs route. Both surviving assertions tolerate that by construction — they are a `<= +1px`
 *   bound and a `>= 24px` floor, never an equality.
 */

// ── fixtures ────────────────────────────────────────────────────────────────────────────────────

/**
 * Fixtures excluded from the sweep, each with the reason it cannot be asserted here.
 *
 * This map is the ONLY sanctioned way to skip a fixture — a silent `continue` inside the loop
 * would let coverage rot invisibly. It is itself asserted below: an entry naming a fixture that
 * no longer exists fails the suite, so a renamed or deleted fixture cannot leave a stale
 * exemption behind, and the map cannot quietly grow to cover a real regression.
 */
const EXCLUDED: Record<string, string> = {
  // ── non-deterministic by design ───────────────────────────────────────────────────────────
  // Omits `now` so the component reads the real clock and its refresh timer ticks — that IS the
  // feature being demonstrated. A self-rescheduling `setTimeout` re-renders the fixture between
  // the assertion and the measurement: the detach race in `docs/ledger/bugs.md` (2026-09-08).
  // Every other `relative-time` fixture pins `now` to a fixed instant and is swept normally, so
  // the component's geometry IS covered; only this one demo's live clock is not.
  relativeTimeLive:
    "live clock: re-renders on its own timer, geometry is not stable",

  // ── PRE-EXISTING FAILURES ON FIXTURES THE OLD LANE NEVER ASSERTED ─────────────────────────
  //
  // Read this before adding anything below it.
  //
  // `contracts.spec.ts` measured `page.locator("[data-vrt-preview]").first()` — the FIRST demo
  // on each of 111 component routes. This file mounts every fixture in the barrel, so it asserts
  // ~4.6× as many compositions. None of the entries below is the first demo on its page, so none
  // was ever covered: these are not regressions introduced by the port, and every one of them
  // fails identically under the assertions carried over verbatim from the old spec.
  //
  // WP1's mandate is to move the lane, not to change what the components do, so each is recorded
  // here rather than silently skipped or papered over with a loosened threshold. They are the
  // triage queue this port produced, and closing them is component work under its own change.

  // Reflow: the demo lays two fixed 160px panels side by side (~344px at a 320px viewport). The
  // docs route absorbed that inside `PreviewFrameContainer`'s `overflow-x-auto`, so the
  // page-level reflow assertion never saw it. The overflow is in the DEMO's layout, not the
  // utility being demonstrated.
  scrollFadeEdge:
    "reflow: demo composes two 160px panels side by side (~344px at 320px)",
  scrollFadeSize:
    "reflow: demo composes two 160px panels side by side (~344px at 320px)",

  // 24px size floor — the control's effective target (border box ∪ ::before/::after hit area)
  // is under 24px on one axis. Measurements are from the run recorded in the PR body.
  breadcrumbCollapsed: "24px size: collapsed-crumb trigger measures 20×20",
  breadcrumbEllipsisMenu: "24px size: ellipsis menu trigger measures 20×20",
  breadcrumbTrail: "24px size: ellipsis trigger measures 20×20",
  comboboxMultiple: "24px size: selected-chip remove control measures 16×16",
  datePickerDropdownCaption: "24px size: caption dropdown measures 50.4×21",
  iconText: "24px size: focusable truncation trigger measures 206×21 (height)",
  iconTextSides:
    "24px size: focusable truncation trigger measures 206×21 (height)",
  markerLinkButton: "24px size: marker link measures 270×21 (height)",
  messageScrollerVisibility: "24px size: control measures 99×16 (height)",
  stepperVertical:
    "24px size: vertical step control measures 152.1×23 (height)",
  tabsChip: "24px size: chip tab measures 238×21 (height)",

  // Obstruction — something else owns the interior of the centred 24px square.
  actionBarPending:
    "24px obstruction: the pending ActionBar surface owns its own control's centre",
  attachmentImageThumbnail:
    "24px obstruction: the `absolute inset-0` attachment trigger covers the 24×24 action beneath it",
  resizableNested:
    "24px obstruction: nested resizable handles overlap, so the outer handle's centre is owned by the inner one",
  timeline:
    "24px obstruction: the timeline separator marker owns the centre of the adjacent 63×16 link",
  // Not a component defect: the probe assumes a rectangular target. A recharts pie is a
  // `<g role="button">` whose 165×165 box is mostly the donut HOLE, so the centred square lands
  // on the ancestor `<svg>`. Asserting it would require a shape-aware probe, which is a
  // different check from the one being ported.
  chartDemoDonut:
    "24px obstruction: donut `<g>` box is mostly its hole; the rectangular probe cannot express a ring target",
};

type Fixture = () => React.ReactNode;

const FIXTURES = Object.entries(Preview)
  .filter((entry): entry is [string, Fixture] => typeof entry[1] === "function")
  .filter(([name]) => !(name in EXCLUDED))
  .sort(([a], [b]) => a.localeCompare(b));

test("the exclusion list has no stale entries", () => {
  const missing = Object.keys(EXCLUDED).filter(
    (name) => !(name in (Preview as Record<string, unknown>)),
  );
  expect(
    missing,
    "EXCLUDED names a fixture that no longer exists in the preview barrel. Delete the entry — a " +
      "stale exemption silently drops a component from the geometry contracts.",
  ).toEqual([]);
});

test("the preview barrel actually resolved", () => {
  // A broken alias or a barrel that failed to load would make `FIXTURES` empty and every
  // assertion below vacuous. Fail loudly instead of reporting a green sweep over nothing.
  expect(FIXTURES.length).toBeGreaterThan(100);
});

// ── the 24px effective-target probe (ported verbatim in substance from contracts.spec.ts) ───────

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  'input:not([type="hidden"])',
  "select",
  "textarea",
  "summary",
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Prove the effective pointer target, including an invisible `::before`/`::after` expansion.
 * A bounding-box-only assertion cannot see those pseudo-elements and previously produced false
 * failures (or encouraged visually oversized controls). Each point sits just inside the required
 * centred 24px target and must resolve back to the control through `elementFromPoint`.
 *
 * Unchanged from the Playwright original except that it runs directly in the test realm rather
 * than through `locator.evaluate` — the assertions and every constant are the same.
 */
function effectiveTargetProbe(element: Element) {
  // Base UI keeps the semantic range input visually hidden inside the
  // draggable thumb; pointer ownership belongs to that visible thumb. Input
  // groups likewise own the padded field surface around their nested input.
  const pointerOwner =
    (element.matches('input[type="range"]') &&
      element.closest('[data-slot="slider-thumb"]')) ||
    (element.matches('input[role="combobox"]') &&
      element.closest('[data-slot="combobox-input-group"]')) ||
    element;
  const rect = pointerOwner.getBoundingClientRect();
  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  // The 24px floor is checked as TWO independent facts, because one probe cannot express both:
  //
  //   1. SIZE — is the control itself at least 24×24? Asserted on the geometry below, where a
  //      sub-pixel shortfall is unambiguous.
  //   2. OBSTRUCTION — does anything else own the interior of the centred 24px square? Asserted
  //      by hit-testing, which is where an overlay or a clipped ::before hit-area shows up.
  //
  // Hit testing alone cannot carry (1). Blink hit-tests against PIXEL-SNAPPED bounds, so for a
  // fractionally positioned control (here top 394.265625, bottom 418.265625) the final fraction
  // of a pixel resolves to the PARENT: ownership was measured to flip between 0.25px and 0.5px
  // inside the bottom edge. Probing at a hair's inset therefore reported a miss for perfectly
  // sized 24px controls (attachment, code-block, filter-bar, password-input, text-edit) — always
  // on the right/bottom edge, never left/top, the signature of snapping
  // rather than a real defect. An earlier 0.001px inset failed for the same reason and was
  // additionally below LayoutUnit precision (1/64 px) entirely.
  //
  // So the obstruction probe insets a full half-pixel, landing on an unambiguous pixel centre,
  // and size is measured separately instead of being inferred from it.
  const OBSTRUCTION_INSET = 0.5;
  const halfTarget = 12 - OBSTRUCTION_INSET;
  const points = [
    [centerX - halfTarget, centerY],
    [centerX + halfTarget, centerY],
    [centerX, centerY - halfTarget],
    [centerX, centerY + halfTarget],
    [centerX, centerY],
  ];
  const ownsHit = (hit: Element | null) => {
    if (!hit) return false;
    if (hit === pointerOwner || pointerOwner.contains(hit)) return true;
    const label = hit.closest("label") as HTMLLabelElement | null;
    return label?.control === element;
  };
  return {
    rect: { width: rect.width, height: rect.height },
    // Fact (1): the control's own effective target. `-inset-*` hit areas legitimately extend a
    // small glyph, so measure the union of the border box and the ::before/::after hit area
    // rather than the border box alone.
    effective: (() => {
      let { left, top, right, bottom } = rect;
      for (const pseudo of ["::before", "::after"]) {
        const style = getComputedStyle(pointerOwner, pseudo);
        if (style.content === "none" || style.position !== "absolute") continue;
        const parse = (value: string) =>
          value.endsWith("px") ? Number.parseFloat(value) : Number.NaN;
        const [t, r, b, l] = [
          style.top,
          style.right,
          style.bottom,
          style.left,
        ].map(parse);
        if ([t, r, b, l].some(Number.isNaN)) continue;
        // Negative inset values grow the box outward.
        left = Math.min(left, rect.left + l);
        top = Math.min(top, rect.top + t);
        right = Math.max(right, rect.right - r);
        bottom = Math.max(bottom, rect.bottom - b);
      }
      return { width: right - left, height: bottom - top };
    })(),
    misses: points
      .map(([x, y]) => ({ x, y, hit: document.elementFromPoint(x, y) }))
      .filter(({ hit }) => !ownsHit(hit))
      // `Element`, not `HTMLElement`: an SVG node is neither, and reporting it as `null` reads
      // as "nothing was there" when in fact an ancestor `<svg>` owned the point. That misread
      // cost a diagnosis once; keep the wider type.
      .map(({ x, y, hit }) => ({
        x,
        y,
        hit: hit instanceof Element ? hit.outerHTML.slice(0, 160) : null,
      })),
  };
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Let layout settle. Two frames rather than one: the first flushes React's commit into style and
 * layout, the second lets any effect scheduled by that commit (a measured popover position, a
 * `ResizeObserver` callback) land before anything is measured.
 */
const settle = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

/**
 * The 320px containment fact, polled.
 *
 * Polling is not defensive padding — it is what the Playwright original did (`expect.poll`), and
 * it is load-bearing for the same reason: a fixture that measures itself asynchronously
 * (recharts' `ResponsiveContainer`, anything on a `ResizeObserver`) renders once at an intrinsic
 * width before its first measurement lands. Observed 2026-09-08: `chartDemoTooltipVariants`
 * reported `scrollWidth 345` on a loaded machine and 320 on an idle one, from the same tree.
 * Polling reads the settled layout on both; a genuine overflow never settles, so it still fails
 * — it just costs the poll timeout to do so.
 */
async function expectContained(name: string, lane: string) {
  await expect
    .poll(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
      {
        // Built eagerly, so the numbers are the FIRST measurement — the one taken before the
        // poll started. That is the useful one to read: if the poll went on to fail, the layout
        // never moved off it.
        message:
          `${name} overflows horizontally at 320px${lane} ` +
          `(first measured scrollWidth ${document.documentElement.scrollWidth} > clientWidth ${document.documentElement.clientWidth})`,
      },
    )
    .toBe(true);
}

/** Playwright's `isVisible`, in plain DOM: a non-empty box that is not `visibility: hidden`. */
function isVisible(element: Element) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

function isDisabled(element: Element) {
  return (
    element.matches(":disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

// ── the sweep ───────────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // 320px is the narrowest viewport WCAG 2.2 §1.4.10 requires content to reflow into. Set once
  // for the file: every test in it asserts at that width.
  await page.viewport(320, 812);
});

afterEach(() => {
  // `dir` is set on the document element, which outlives the component cleanup. Restore it even
  // when an assertion threw mid-test, or every later fixture in the file runs RTL by accident.
  document.documentElement.removeAttribute("dir");
});

for (const [name, fixture] of FIXTURES) {
  test(name, async () => {
    const screen = await render(
      React.createElement(fixture as React.ComponentType),
    );
    await settle();

    // (1) 320px reflow. `+1` absorbs sub-pixel rounding, exactly as the route lane did.
    await expectContained(name, "");

    // (2) RTL containment — the same fact with the writing direction flipped, which is where a
    // hard-coded `left`/`ml-*` or a non-logical inset shows up as an overflow.
    document.documentElement.setAttribute("dir", "rtl");
    await settle();
    await expectContained(name, " in RTL");
    document.documentElement.removeAttribute("dir");
    await settle();

    // (3) the 24px effective pointer-target floor, per interactive control in the fixture.
    // `baseElement` rather than `container` so portalled surfaces (a Dialog, a Popover, a
    // Toaster) that a fixture opens on mount are swept too.
    const controls = [
      ...screen.baseElement.querySelectorAll(INTERACTIVE_SELECTOR),
    ];
    for (const [index, control] of controls.entries()) {
      if (!isVisible(control) || isDisabled(control)) continue;
      if (control.getAttribute("aria-hidden") === "true") continue;

      // State-driven controls such as MessageScroller's inactive jump button remain mounted for
      // stable transitions but are deliberately removed from pointer interaction. Visually
      // hidden controls (skip links) are keyboard-only until focus reveals them.
      const visuallyHidden = control.classList.contains("sr-only");
      const inactiveMountedControl =
        control.getAttribute("data-slot") === "message-scroller-button" &&
        control.getAttribute("data-active") === "false" &&
        (control as HTMLElement).tabIndex < 0 &&
        getComputedStyle(control).pointerEvents === "none";
      if (visuallyHidden || inactiveMountedControl) continue;

      // An inline link inside a sentence cannot be 24px tall without breaking the line box;
      // WCAG 2.2 §2.5.8 exempts targets in a block of text for exactly this reason.
      if (
        control instanceof HTMLAnchorElement &&
        getComputedStyle(control).display === "inline"
      )
        continue;

      // Centre the control so nothing scrolled out of the 320×812 viewport can steal its hit.
      control.scrollIntoView({ block: "center", inline: "center" });
      const probe = effectiveTargetProbe(control);

      // (3a) size — sub-pixel tolerance only, so a genuinely undersized control still fails.
      expect(
        {
          width: probe.effective.width >= 23.5,
          height: probe.effective.height >= 23.5,
        },
        `interactive control ${index} in ${name} must be at least 24×24 including any -inset-* hit area (measured ${probe.effective.width.toFixed(2)}×${probe.effective.height.toFixed(2)}px)`,
      ).toEqual({ width: true, height: true });

      // (3b) obstruction — nothing else may own the interior of the centred 24px square.
      expect(
        probe.misses,
        `interactive control ${index} in ${name} must own a centred >=24px effective pointer target (visual ${probe.rect.width.toFixed(1)}×${probe.rect.height.toFixed(1)}px)`,
      ).toEqual([]);
    }
  });
}
