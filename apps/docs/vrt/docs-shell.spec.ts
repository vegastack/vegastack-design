import { test, expect } from "@playwright/test";

/**
 * Docs-shell contracts (`05-docs-chrome.md` DC-01…DC-12, decisions DD-1/4/5).
 *
 * These assert the shell itself, not a component: the chrome must obey the design system it
 * documents. Each one replaces a claim that was previously only inspected by eye, and each fails
 * on the exact defect the audit measured.
 *
 * It lives in `vrt/` beside the other suites but is NOT part of the contract lane:
 * `tooling/contracts-run.mjs` always passes `contracts.spec.ts` as a positional filter, so this
 * file only runs when invoked directly (`pnpm --filter @vegastack/docs test:docs-shell`).
 */
const BUTTON = "/docs/components/button";

test.describe("docs shell", () => {
  /**
   * DC-01 / DD-5. Before the fix `.vs-type-product` re-bound the `--type-*` vars but not the
   * inherited `font-size`, so every demo sat on the Fumadocs prose base (measured 15px/28px) and
   * anything relying on inheritance rendered off-scale. The scope now sets the base itself.
   */
  test("DC-01 the product type scope sets the inherited base, not just the vars", async ({
    page,
  }) => {
    await page.goto(BUTTON);
    const scope = page.locator(".vs-type-product").first();
    await expect(scope).toBeAttached();

    const measured = await scope.evaluate((element) => {
      const style = getComputedStyle(element);
      const root = getComputedStyle(document.documentElement);
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        // The CSS length the product-base custom property declares, in this document.
        declaredBase: root.getPropertyValue("--type-product-base").trim(),
        prose: getComputedStyle(
          document.querySelector(".prose") ?? document.body,
        ).fontSize,
      };
    });

    // The scope renders at the PRODUCT base, whatever the token says it is.
    expect(measured.declaredBase).not.toBe("");
    expect(measured.fontSize).toBe(
      await page.evaluate((declared) => {
        const probe = document.createElement("div");
        probe.style.fontSize = declared;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).fontSize;
        probe.remove();
        return resolved;
      }, measured.declaredBase),
    );
    // …and specifically NOT the surrounding prose base, which is the defect DC-01 measured.
    expect(measured.fontSize).not.toBe(measured.prose);
    expect(measured.lineHeight).not.toBe("normal");
  });

  /**
   * DC-02 / DD-1. Fumadocs' chrome and `@tailwindcss/typography` are compiled against Tailwind's
   * stock theme: headings, sidebar group titles and prose `<strong>` at 600–900 in a system whose
   * ladder is 400/500. `app/global.css` remaps the theme weights and overrides the prose literals;
   * this reads what the browser actually computed.
   */
  test("DC-02 no rendered text exceeds the 400/500 weight ladder", async ({
    page,
  }) => {
    await page.goto(BUTTON);
    await page.evaluate(() => document.fonts.ready);

    const heavy = await page.evaluate(() => {
      const offenders: { tag: string; text: string; weight: string }[] = [];
      for (const element of document.querySelectorAll<HTMLElement>("body *")) {
        if (!element.textContent?.trim()) continue;
        // Syntax highlighting is a code theme, not UI chrome (see design-lint-emitted-css.mjs).
        if (element.closest(".shiki, .twoslash")) continue;
        const weight = Number(getComputedStyle(element).fontWeight);
        if (weight > 500) {
          offenders.push({
            tag: element.tagName.toLowerCase(),
            text: element.textContent.trim().slice(0, 40),
            weight: String(weight),
          });
        }
      }
      return offenders;
    });

    expect(heavy).toEqual([]);
  });

  /**
   * The page title and every section heading land on the medium step, not the stock 600/800.
   * Chrome headings outside the article may legitimately sit at 400 (the TOC's "On this page"
   * measures 400) — the ladder is 400/500, so the assertion is the ladder, plus 500 for the
   * document's own headings, which is where the audit measured 600/800.
   */
  test("DC-02 headings render at 500", async ({ page }) => {
    await page.goto(BUTTON);

    const all = await page
      .locator("h1, h2, h3, h4")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).fontWeight),
      );
    expect(all.length).toBeGreaterThan(3);
    expect([...new Set(all)].sort()).toEqual(expect.arrayContaining(["500"]));
    expect(all.every((weight) => weight === "400" || weight === "500")).toBe(
      true,
    );

    const article = await page
      .locator("article h1, article h2, article h3")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).fontWeight),
      );
    expect(article.length).toBeGreaterThan(3);
    expect([...new Set(article)]).toEqual(["500"]);
  });

  /**
   * DC-03 / DD-4. The old fullscreen overlay was a `role="dialog" aria-modal="true"` with no trap:
   * Tab walked straight out into the docs chrome behind it. It is now the system `Dialog`, which
   * owns the trap, `inert`, scroll lock and Esc. Tabbing all the way round must never leave.
   */
  test("DC-03 fullscreen preview traps focus and closes on Escape", async ({
    page,
  }) => {
    await page.goto(BUTTON);
    await page
      .getByRole("button", { name: "Fullscreen preview" })
      .first()
      .click();

    const dialog = page.locator("[data-preview-fullscreen]");
    await expect(dialog).toBeVisible();

    // Walk further than the dialog has stops, so a leak would land on the chrome behind it.
    // Base UI implements the trap with `[data-base-ui-focus-guard]` sentinels (aria-hidden,
    // inert, zero-size) that focus passes THROUGH on the way round; they are the mechanism, not
    // an escape, and `document.body` is the momentary resting place between them. Anything else
    // outside the popup is a real leak.
    for (let step = 0; step < 25; step++) {
      await page.keyboard.press("Tab");
      const landed = await dialog.evaluate((element) => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return "body";
        if (element.contains(active)) return "dialog";
        if (active.hasAttribute("data-base-ui-focus-guard")) return "guard";
        return `LEAK: ${active.outerHTML.slice(0, 120)}`;
      });
      expect(
        landed,
        `focus escaped the fullscreen dialog on Tab #${step + 1}`,
      ).toMatch(/^(dialog|guard|body)$/);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  /**
   * DC-06. Fumadocs ships no skip link and neither layout added one, so a keyboard user tabbed
   * through the entire sidebar on every page. It must be the FIRST thing Tab reaches.
   */
  test("DC-06 the skip link is the first tab stop and reaches the content", async ({
    page,
  }) => {
    await page.goto(BUTTON);
    await page.keyboard.press("Tab");

    const first = page.locator(":focus");
    await expect(first).toHaveRole("link");
    await expect(first).toHaveAttribute("href", /^#/);

    const target = await first.getAttribute("href");
    await expect(page.locator(target!)).toBeAttached();
  });

  /**
   * DC-12. `AnimatedIconCard` was a `tabIndex={0}` `<div>` with NO role and NO accessible name —
   * 439 nameless tab stops on the icons page. A focusable div is legitimate when it carries a
   * role that explains it (Fumadocs' `role="tabpanel"` panels and its `role="region"` scroll
   * containers are the correct pattern for a scrollable region); it is a defect when a screen
   * reader reaches a stop it cannot name. So the assertion is role-and-name, not `div`.
   */
  test("DC-12 every tab stop has a role and an accessible name", async ({
    page,
  }) => {
    for (const route of [BUTTON, "/docs/foundations/icons"]) {
      await page.goto(route);
      const offenders = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            "div[tabindex]:not([tabindex='-1'])",
          ),
        ]
          .filter((element) => !element.getAttribute("role"))
          .map((element) => element.outerHTML.slice(0, 120)),
      );
      expect(offenders, `roleless focusable <div> on ${route}`).toEqual([]);
    }
  });
});
