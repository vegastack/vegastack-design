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

async function focusViaKeyboard(
  page: import("@playwright/test").Page,
  control: import("@playwright/test").Locator,
) {
  const maximumTabs = (await page.locator(INTERACTIVE_SELECTOR).count()) + 1;
  for (let step = 0; step < maximumTabs; step++) {
    if (await control.evaluate((element) => document.activeElement === element))
      return true;
    await page.keyboard.press("Tab");
  }
  return control.evaluate((element) => document.activeElement === element);
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

        const keyboardFocusable = await control.evaluate(
          (element) => element instanceof HTMLElement && element.tabIndex >= 0,
        );
        if (!keyboardFocusable) continue;
        const isTextEditSurface = await control.evaluate(
          (element) =>
            element instanceof HTMLElement &&
            element.isContentEditable &&
            Boolean(element.closest('[data-slot="text-edit"]')),
        );
        const indicatorOwner = isTextEditSurface
          ? control.locator(
              "xpath=ancestor-or-self::*[@data-slot='text-edit'][1]",
            )
          : control;
        const before = await indicatorOwner.evaluate((element) => {
          const style = getComputedStyle(element);
          return { borderColor: style.borderColor, boxShadow: style.boxShadow };
        });
        expect(
          await focusViaKeyboard(page, control),
          `interactive control ${index} on ${route} must be reachable through the keyboard path`,
        ).toBe(true);
        await expect(control).toBeFocused();
        const focusIndicator = await indicatorOwner.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            outlineStyle: style.outlineStyle,
            outlineWidth: Number.parseFloat(style.outlineWidth),
            borderColor: style.borderColor,
            boxShadow: style.boxShadow,
          };
        });
        const hasOutline =
          focusIndicator.outlineStyle !== "none" &&
          focusIndicator.outlineWidth >= 2;
        const hasTextEntryTint =
          focusIndicator.borderColor !== before.borderColor ||
          focusIndicator.boxShadow !== before.boxShadow;
        expect(
          hasOutline || hasTextEntryTint,
          `interactive control ${index} on ${route} needs a visible focus outline or a changed text-entry border tint`,
        ).toBe(true);
      }
    });
  }
});
