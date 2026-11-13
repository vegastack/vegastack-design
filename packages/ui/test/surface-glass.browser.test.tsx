import "./contrast.css"; // compiled Tailwind + the @vegastack token theme and @utility layer
import * as React from "react";
import { render } from "vitest-browser-react";
import { cdp } from "vitest/browser";
import { afterEach, expect, test } from "vitest";
import { isTransparent } from "./color";

/**
 * `surface-glass` (desktop glass, operator 2026-11-14) is transparent only over a native OS glass
 * backing, and must turn opaque again whenever the person has asked the system for less
 * transparency or more contrast. That fallback is the accessibility contract: if it silently
 * stopped matching, text would sit on raw native glass for exactly the people who turned it off.
 * Token values cannot show it; this file compiles the real utility and reads what Chromium paints
 * under each emulated preference.
 */

function Fixture() {
  return (
    <>
      <div data-testid="glass" className="surface-glass">
        Recording
      </div>
      {/* References resolved by the same theme, so the test compares meaning, not a spelling. */}
      <div
        data-testid="popover"
        style={{ backgroundColor: "var(--popover)", color: "var(--glass-ink)" }}
      />
      <div
        data-testid="edge"
        style={{ border: "1px solid var(--glass-edge)" }}
      />
    </>
  );
}

const el = (id: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

async function emulate(features: { name: string; value: string }[]) {
  await cdp().send("Emulation.setEmulatedMedia", { features });
}

afterEach(async () => {
  document.documentElement.removeAttribute("data-native-glass");
  await emulate([]);
});

test("surface-glass is an opaque popover fill without a native glass backing", async () => {
  await render(<Fixture />);
  const glass = getComputedStyle(el("glass"));
  const popover = getComputedStyle(el("popover"));
  expect(isTransparent(glass.backgroundColor)).toBe(false);
  expect(glass.backgroundColor).toBe(popover.backgroundColor);
  expect(glass.color).toBe(popover.color);
  expect(glass.borderTopWidth).toBe("0px");
});

test("surface-glass is transparent over native glass", async () => {
  document.documentElement.setAttribute("data-native-glass", "");
  await render(<Fixture />);
  expect(isTransparent(getComputedStyle(el("glass")).backgroundColor)).toBe(
    true,
  );
});

test("Reduce Transparency turns surface-glass opaque over native glass", async () => {
  document.documentElement.setAttribute("data-native-glass", "");
  await emulate([{ name: "prefers-reduced-transparency", value: "reduce" }]);
  await render(<Fixture />);
  expect(matchMedia("(prefers-reduced-transparency: reduce)").matches).toBe(
    true,
  );
  expect(getComputedStyle(el("glass")).backgroundColor).toBe(
    getComputedStyle(el("popover")).backgroundColor,
  );
});

test("Increase Contrast turns surface-glass opaque with a glass-edge border", async () => {
  document.documentElement.setAttribute("data-native-glass", "");
  await emulate([{ name: "prefers-contrast", value: "more" }]);
  await render(<Fixture />);
  expect(matchMedia("(prefers-contrast: more)").matches).toBe(true);
  const glass = getComputedStyle(el("glass"));
  expect(glass.backgroundColor).toBe(
    getComputedStyle(el("popover")).backgroundColor,
  );
  expect(glass.borderTopWidth).toBe("1px");
  expect(glass.borderTopStyle).toBe("solid");
  expect(glass.borderTopColor).toBe(
    getComputedStyle(el("edge")).borderTopColor,
  );
});
