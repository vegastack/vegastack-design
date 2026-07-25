import { expect, test } from "@playwright/test";
import { COMPONENT_ROUTES } from "./contract-routes.generated";

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
 */
async function effectiveTargetProbe(
  control: import("@playwright/test").Locator,
) {
  return control.evaluate((element) => {
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
          if (style.content === "none" || style.position !== "absolute")
            continue;
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
        .map(({ x, y, hit }) => ({
          x,
          y,
          hit: hit instanceof HTMLElement ? hit.outerHTML.slice(0, 160) : null,
        })),
    };
  });
}

/** What one keyboard landing inside the fixture recorded. */
type FocusLanding = {
  probe: number;
  outlineStyle: string;
  outlineWidth: number;
  borderColor: string;
  boxShadow: string;
};

/**
 * Walk the fixture's tab order ONCE and record, for every control the keyboard reaches, the focus
 * indicator it showed at the moment it was focused.
 *
 * WHAT THIS REPLACED, AND WHY
 *   The previous helper tabbed from wherever focus happened to be, once PER CONTROL, and sized its
 *   loop with a page-wide `INTERACTIVE_SELECTOR` count — which on a docs page includes the entire
 *   Fumadocs sidebar, search, and table of contents. Each iteration cost a `keyboard.press` plus an
 *   `evaluate` round-trip, so the cost was O(controls × page-wide tabbables). On the four most
 *   control-dense routes (message-scroller, hover-card, sidebar, data-list) that already ran close to
 *   the 120s test timeout, and `docs/ledger/operator-review.md` named it the largest available
 *   speedup while deliberately deferring it.
 *
 *   This walks once — O(fixture) — and starts at the fixture container rather than the top of the
 *   document, so the docs chrome is not traversed at all. The chrome is not the component's contract.
 *
 * WHAT IT DELIBERATELY STILL PROVES
 *   Both original facts, and by the same mechanism:
 *
 *     reachability     the control became `document.activeElement` as a RESULT of pressing Tab.
 *                      Not `element.focus()` — a programmatic focus proves nothing about tab order,
 *                      and its `:focus-visible` behaviour is a UA heuristic rather than a guarantee.
 *     focus indicator  captured WHILE keyboard focus was on the element, so `:focus-visible` rules
 *                      are in effect exactly as they were before.
 *
 *   The identity link is a stamped `data-contract-probe` index rather than a Locator comparison,
 *   because a walk cannot hold a Locator per landing. No CSS in this system targets that attribute.
 */
async function walkKeyboardFocus(
  page: import("@playwright/test").Page,
  fixture: import("@playwright/test").Locator,
) {
  // Stamp every control the test will assert on, capture its UNFOCUSED indicator styles, and take
  // ownership of the container so the walk can start at the fixture boundary.
  const setup = await fixture.evaluate((root, selector) => {
    const controls = [...root.querySelectorAll(selector)];
    controls.forEach((element, index) =>
      element.setAttribute("data-contract-probe", String(index)),
    );
    const indicatorOwner = (element: Element) =>
      (element instanceof HTMLElement &&
        element.isContentEditable &&
        element.closest('[data-slot="text-edit"]')) ||
      element;
    const before = controls.map((element) => {
      const style = getComputedStyle(indicatorOwner(element));
      return { borderColor: style.borderColor, boxShadow: style.boxShadow };
    });
    // Focusing a container with tabindex=-1 puts the tab cursor immediately before its own subtree,
    // so the first Tab lands on the fixture's first tabbable and the docs chrome is skipped.
    const previousTabIndex = root.getAttribute("tabindex");
    root.setAttribute("tabindex", "-1");
    (root as HTMLElement).focus();
    return {
      count: controls.length,
      before,
      previousTabIndex,
      // Elements the keyboard can land on inside the fixture, including any that the assertion
      // selector does not cover. Sizes the loop without a page-wide count.
      tabbable: [...root.querySelectorAll("*")].filter(
        (element) => element instanceof HTMLElement && element.tabIndex >= 0,
      ).length,
    };
  }, INTERACTIVE_SELECTOR);

  const landings = new Map<number, FocusLanding>();
  // Slack above the tabbable count absorbs composite widgets that move focus internally (a combobox
  // popup, a roving-tabindex group) before releasing it forward.
  const maximumSteps = setup.tabbable + setup.count + 8;
  for (let step = 0; step < maximumSteps; step++) {
    if (landings.size === setup.count) break;
    await page.keyboard.press("Tab");
    const landing = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || active === document.body) return null;
      const owner = active.closest("[data-contract-probe]");
      if (!owner) return { probe: -1 };
      const indicatorOwner =
        (owner instanceof HTMLElement &&
          owner.isContentEditable &&
          owner.closest('[data-slot="text-edit"]')) ||
        owner;
      const style = getComputedStyle(indicatorOwner);
      return {
        probe: Number(owner.getAttribute("data-contract-probe")),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
      };
    });
    // Focus left the document entirely: the tab order has run past the fixture and nothing further
    // will be reached. Anything unseen is genuinely unreachable, which the assertions then report.
    if (landing === null) break;
    if (landing.probe >= 0 && !landings.has(landing.probe))
      landings.set(landing.probe, landing as FocusLanding);
  }

  await fixture.evaluate((root, previous) => {
    if (previous === null) root.removeAttribute("tabindex");
    else root.setAttribute("tabindex", previous);
    for (const element of root.querySelectorAll("[data-contract-probe]"))
      element.removeAttribute("data-contract-probe");
  }, setup.previousTabIndex);

  return { landings, before: setup.before };
}

async function establishLane(
  page: import("@playwright/test").Page,
  projectName: string,
) {
  const dark = projectName.endsWith("-dark");
  await page.emulateMedia({
    colorScheme: dark ? "dark" : "light",
    reducedMotion: "reduce",
  });
  return dark;
}

/**
 * Contract-driven non-pixel checks. These stay active even before Linux screenshots are refreshed,
 * so all 96 components continuously prove 320px reflow and RTL containment in every theme lane.
 */
test.describe("component contract — narrow reflow and RTL", () => {
  for (const route of COMPONENT_ROUTES) {
    test(`${route} contains its primary fixture at 320px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 320, height: 812 });
      const dark = await establishLane(page, testInfo.project.name);
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect
        .poll(() =>
          page
            .locator("html")
            .evaluate((element) => element.classList.contains("dark")),
        )
        .toBe(dark);

      const fixture = page.locator("[data-vrt-preview]").first();
      await expect(fixture).toBeVisible();
      await fixture.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          ),
        )
        .toBe(true);

      await page
        .locator("html")
        .evaluate((element) => element.setAttribute("dir", "rtl"));
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          ),
        )
        .toBe(true);
      await expect(fixture).toBeVisible();
    });
  }
});

/**
 * KNOWN FAIL-OPEN IN THE FOCUS HALF OF THIS TEST — measured 2026-07-25, not yet fixed.
 *
 * The focus-indicator assertion below CANNOT FAIL. It runs under `forcedColors: "active"`, and in that
 * mode Chromium paints its own focus ring: with the design system's `:focus-visible` rule deleted from
 * `apps/docs/app/global.css`, every one of 14 controls on `/docs/components/button` still reported
 * `outline: solid 3px` — 3px because it is the user agent's, not the system's 2px. The fallback branch
 * is no better; forced-colors also repaints borders on focus, so `hasTextEntryTint` was true for all 14
 * as well. Branch tally with the ring removed: outline only 0 · tint only 0 · both 14 · neither 0.
 *
 * Reproduced against the spec as it stood BEFORE the `walkKeyboardFocus` rewrite, so the rewrite
 * neither caused nor masks it. The 24px pointer-target half of this test is unaffected and still
 * catches real defects; narrow reflow and RTL containment are unaffected.
 *
 * Fixing it means asserting the indicator in NORMAL colours and keeping forced-colors for what it is
 * actually for — that the component survives the mode. That changes what 192 checks assert and needs
 * its own negative fixture, so it is scoped separately. Evidence and reproduction:
 * `docs/ledger/bugs.md`, 2026-07-25. **Do not cite forced-colors focus visibility as covered until
 * this is closed.**
 */
test.describe("component contract — forced colors and target floor", () => {
  for (const route of COMPONENT_ROUTES) {
    test(`${route} retains focus visibility and effective 24px pointer targets`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 320, height: 812 });
      await establishLane(page, testInfo.project.name);
      await page.emulateMedia({
        forcedColors: "active",
        reducedMotion: "reduce",
      });
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const fixture = page.locator("[data-vrt-preview]").first();
      await expect(fixture).toBeVisible();
      const controls = fixture.locator(INTERACTIVE_SELECTOR);
      const count = await controls.count();
      for (let index = 0; index < count; index++) {
        const control = controls.nth(index);
        if (!(await control.isVisible()) || (await control.isDisabled()))
          continue;
        if ((await control.getAttribute("aria-hidden")) === "true") continue;
        if ((await control.getAttribute("aria-disabled")) === "true") continue;

        const pointerState = await control.evaluate((element) => ({
          pointerEvents: getComputedStyle(element).pointerEvents,
          visuallyHidden: element.classList.contains("sr-only"),
          slot: element.getAttribute("data-slot"),
          active: element.getAttribute("data-active"),
          tabIndex: element instanceof HTMLElement ? element.tabIndex : -1,
        }));
        // State-driven controls such as MessageScroller's inactive jump button
        // remain mounted for stable transitions but are deliberately removed
        // from pointer and keyboard interaction. Skip only their pointer probe;
        // the keyboard branch below still catches any erroneously tabbable one.
        // Skip links are likewise keyboard-only until focus reveals them.
        const inactiveMountedControl =
          pointerState.slot === "message-scroller-button" &&
          pointerState.active === "false" &&
          pointerState.tabIndex < 0 &&
          pointerState.pointerEvents === "none";
        const hasPointerTarget =
          !pointerState.visuallyHidden && !inactiveMountedControl;

        if (hasPointerTarget) {
          // `scrollIntoViewIfNeeded` treats an element beneath a sticky header as
          // visible. Centre every pointer target so docs-shell overlays cannot
          // steal a valid component hit during the probe.
          await control.evaluate((element) =>
            element.scrollIntoView({ block: "center", inline: "center" }),
          );
        }

        const usesInlineTextException = await control.evaluate(
          (element) =>
            element instanceof HTMLAnchorElement &&
            getComputedStyle(element).display === "inline",
        );
        if (hasPointerTarget && !usesInlineTextException) {
          const probe = await effectiveTargetProbe(control);
          // (1) size — sub-pixel tolerance only, so a genuinely undersized control still fails.
          expect(
            {
              width: probe.effective.width >= 23.5,
              height: probe.effective.height >= 23.5,
            },
            `interactive control ${index} on ${route} must be at least 24×24 including any -inset-* hit area (measured ${probe.effective.width.toFixed(2)}×${probe.effective.height.toFixed(2)}px)`,
          ).toEqual({ width: true, height: true });
          // (2) obstruction — nothing else may own the interior of the centred 24px square.
          expect(
            probe.misses,
            `interactive control ${index} on ${route} must own a centred >=24px effective pointer target (visual ${probe.rect.width.toFixed(1)}×${probe.rect.height.toFixed(1)}px)`,
          ).toEqual([]);
        }
      }

      // ── keyboard pass ──────────────────────────────────────────────────────────────────────────
      //
      // One walk of the fixture's tab order, then a lookup per control. Splitting the passes is what
      // makes that possible: the pointer pass above needs each control in turn, the keyboard pass
      // needs the whole tab order at once.
      const { landings, before } = await walkKeyboardFocus(page, fixture);

      for (let index = 0; index < count; index++) {
        const control = controls.nth(index);
        if (!(await control.isVisible()) || (await control.isDisabled()))
          continue;
        if ((await control.getAttribute("aria-hidden")) === "true") continue;
        if ((await control.getAttribute("aria-disabled")) === "true") continue;

        const keyboardFocusable = await control.evaluate(
          (element) => element instanceof HTMLElement && element.tabIndex >= 0,
        );
        if (!keyboardFocusable) continue;

        const landing = landings.get(index);
        expect(
          landing !== undefined,
          `interactive control ${index} on ${route} must be reachable through the keyboard path ` +
            `(the fixture's tab order was walked from its container and never reached it)`,
        ).toBe(true);
        if (!landing) continue;

        const hasOutline =
          landing.outlineStyle !== "none" && landing.outlineWidth >= 2;
        const hasTextEntryTint =
          landing.borderColor !== before[index].borderColor ||
          landing.boxShadow !== before[index].boxShadow;
        expect(
          hasOutline || hasTextEntryTint,
          `interactive control ${index} on ${route} needs a visible focus outline or a changed text-entry border tint`,
        ).toBe(true);
      }
    });
  }
});
