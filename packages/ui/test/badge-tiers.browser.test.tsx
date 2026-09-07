import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Badge } from "../registry/ui/badge";

/**
 * Badge tier gate (audit 2026-09-07, Di1 / decision D8). The unit suite runs WITHOUT compiled CSS,
 * so a claim about geometry or a resolved colour can only be measured here — this file imports the
 * same compiled-theme entry the contrast and surface-ladder gates use.
 *
 * What it pins, and the defect each pin catches:
 *
 *  - `sm` / `md` / `lg` are three REAL heights (16 / 20 / 24px). The audit found one height with
 *    three padding values pretending to be a size ladder; asserting class names would not have
 *    caught that, because the class names were already there.
 *  - `minimal` is ink only: no fill, no border, no horizontal padding. It is the container-less
 *    treatment for dense tables, and a stray background would silently turn it back into a pill.
 */

test("the three size tiers are three real heights (16 / 20 / 24px)", async () => {
  for (const [size, px] of [
    ["sm", 16],
    ["md", 20],
    ["lg", 24],
  ] as const) {
    const screen = await render(
      <Badge size={size} data-testid={`b-${size}`}>
        Tier
      </Badge>,
    );
    const el = screen.getByTestId(`b-${size}`).element() as HTMLElement;
    expect(el.getBoundingClientRect().height).toBeCloseTo(px, 0);
  }
});

test("minimal is ink only — no fill, no border, no horizontal padding", async () => {
  const screen = await render(
    <Badge variant="minimal" intent="success" data-testid="m">
      Paid
    </Badge>,
  );
  const el = screen.getByTestId("m").element();
  const style = getComputedStyle(el);
  expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(style.borderTopColor).toBe("rgba(0, 0, 0, 0)");
  expect(style.paddingLeft).toBe("0px");
  expect(style.paddingRight).toBe("0px");
  // The ink still carries the intent — minimal is colour PLUS the leading dot,
  // never an unstyled span.
  expect(style.color).not.toBe(getComputedStyle(document.body).color);
});
