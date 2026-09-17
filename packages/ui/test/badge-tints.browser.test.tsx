import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Badge } from "../registry/ui/badge";

/**
 * Badge tint gate. The unit suite runs WITHOUT compiled CSS, so a claim about a resolved colour can
 * only be measured here — this file imports the same compiled-theme entry the contrast gate uses.
 *
 * REPLACED the badge TIER gate (audit 2026-09-07, D8) in Batch 2 of the shadcn reset. That gate
 * pinned three real heights (16 / 20 / 24px) and a container-less `minimal` variant; upstream's
 * Badge has ONE height and no `minimal`, and D8's size ladder resolved to **shadcn** in the
 * decision register, so those two claims no longer describe anything. What replaced them is the
 * claim the reset actually introduced, and the one most likely to rot silently:
 *
 *  - the four status variants (COL-12) are TINTS — a translucent family fill, not the solid one;
 *  - their ink is the family's `-text` token, never the fill used as ink (A11Y-13). A regression to
 *    `text-destructive` compiles, renders, and reads at 3.98:1; only a resolved-colour check sees
 *    it, and the axe `color-contrast` pass in contrast.browser.test.tsx sees it as a failure
 *    without saying which token was wrong. This names the token.
 *  - Badge is one height, so a size prop reappearing upstream is caught rather than absorbed.
 */

const STATUS = ["destructive", "success", "warning", "info"] as const;

/** The computed value of a custom property on `:root`, as the browser resolves it. */
function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Paint one colour through the browser so two different notations compare as equal. */
function resolved(color: string) {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

test("every status variant paints a tint, not the solid family fill", async () => {
  for (const variant of STATUS) {
    const screen = await render(
      <Badge variant={variant} data-testid={`t-${variant}`}>
        Status
      </Badge>,
    );
    const style = getComputedStyle(
      screen.getByTestId(`t-${variant}`).element(),
    );
    expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.backgroundColor).not.toBe(resolved(token(`--${variant}`)));
  }
});

test("A11Y-13: a status variant's ink is the family's -text token, never its fill", async () => {
  for (const variant of STATUS) {
    const screen = await render(
      <Badge variant={variant} data-testid={`i-${variant}`}>
        Status
      </Badge>,
    );
    const color = getComputedStyle(
      screen.getByTestId(`i-${variant}`).element(),
    ).color;
    expect(color).toBe(resolved(token(`--${variant}-text`)));
    expect(color).not.toBe(resolved(token(`--${variant}`)));
  }
});

test("ghost carries no fill at rest", async () => {
  const screen = await render(
    <Badge variant="ghost" data-testid="g">
      Ghost
    </Badge>,
  );
  expect(getComputedStyle(screen.getByTestId("g").element()).backgroundColor).toBe(
    "rgba(0, 0, 0, 0)",
  );
});

test("Badge is one height across every variant (upstream ships no size ladder)", async () => {
  const heights = new Set<number>();
  for (const variant of [
    "default",
    "secondary",
    "outline",
    "ghost",
    "link",
    ...STATUS,
  ] as const) {
    const screen = await render(
      <Badge variant={variant} data-testid={`h-${variant}`}>
        Tier
      </Badge>,
    );
    heights.add(
      Math.round(
        screen
          .getByTestId(`h-${variant}`)
          .element()
          .getBoundingClientRect().height,
      ),
    );
  }
  expect([...heights]).toEqual([20]);
});
