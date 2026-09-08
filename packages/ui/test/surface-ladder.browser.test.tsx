import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, describe, expect, test } from "vitest";
import {
  cn,
  fillInteractive,
  selectedChipVariants,
  surfaceInteractive,
} from "@vegastack/design";

/**
 * Surface-ladder token gate (audit 2026-09-07, F1). Runs against the COMPILED theme so it measures
 * what the browser paints, not what a JSON file says:
 *
 *  - the ladder is monotonic in both themes (light: darker = higher, dark: lighter = higher) and
 *    every rung is a distinct colour — the defect it pins is `secondary` = `muted` = `accent`
 *    collapsing to one value again, which made every hover invisible;
 *  - the media chrome tokens are THEME-INVARIANT and the scrim is dark in BOTH themes (B4-01: the
 *    old `primary`-based scrim measured L 0.92 in dark). M1 consumes these tokens; the token
 *    contract lives here;
 *  - the exported hover/pressed recipe strings are the exact literals the doctrine names, and
 *    `cn()` (tailwind-merge) resolves a component's legacy `hover:bg-*` against them so the LAST
 *    recipe wins rather than both classes surviving.
 */

const relLum = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Parse a computed colour. Chromium keeps an OKLCH-authored token in `oklch(L C H / a)` form
 * (the L component IS the lightness we want); an sRGB fallback (`rgb()`/`rgba()`/`color(srgb)`)
 * is reduced to a cube-root-of-luminance proxy, which orders rungs the same way.
 */
function parseComputed(color: string): { L: number; alpha: number } {
  const oklch = color.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/,
  );
  if (oklch) return { L: Number(oklch[1]), alpha: Number(oklch[4] ?? "1") };
  const srgb = color.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/,
  );
  const rgb =
    srgb ??
    color.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/);
  if (!rgb) throw new Error(`unparseable computed colour: ${color}`);
  const scale = srgb ? 1 : 255;
  const triple = [rgb[1], rgb[2], rgb[3]].map((c) => Number(c) / scale);
  return {
    L: Math.cbrt(relLum(triple.map(gam2lin))),
    alpha: Number(rgb[4] ?? "1"),
  };
}

const gam2lin = (x: number) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

const lightness = (color: string) => parseComputed(color).L;

function readToken(name: string, dark: boolean): string {
  document.documentElement.classList.toggle("dark", dark);
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(--${name})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
});

describe("surface ladder", () => {
  test.each([false, true])("is monotonic and distinct (dark=%s)", (dark) => {
    const rungs = ["background", "surface-1", "surface-2", "surface-3"].map(
      (name) => lightness(readToken(name, dark)),
    );
    for (let i = 1; i < rungs.length; i++) {
      const step = dark ? rungs[i] - rungs[i - 1] : rungs[i - 1] - rungs[i];
      // A rung that cannot be told from its neighbour is the collapsed-token defect.
      expect(step, `rung ${i} vs ${i - 1}`).toBeGreaterThan(0.005);
    }
  });

  test.each([false, true])(
    "shadcn names are aliases of ladder rungs (dark=%s)",
    (dark) => {
      expect(readToken("secondary", dark)).toBe(readToken("surface-1", dark));
      expect(readToken("muted", dark)).toBe(readToken("surface-1", dark));
      expect(readToken("accent", dark)).toBe(readToken("surface-2", dark));
      expect(readToken("sidebar-accent", dark)).toBe(
        readToken("surface-2", dark),
      );
      expect(readToken("sidebar", dark)).toBe(readToken("card", dark));
      expect(readToken("popover", dark)).toBe(readToken("card", dark));
    },
  );

  test("light card is the page colour; dark card is lifted", () => {
    expect(readToken("card", false)).toBe(readToken("background", false));
    expect(lightness(readToken("card", true))).toBeGreaterThan(
      lightness(readToken("background", true)),
    );
  });

  test.each([false, true])(
    "the hairline is a translucent foreground tint (dark=%s)",
    (dark) => {
      const { alpha } = parseComputed(readToken("border", dark));
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThan(0.25);
      expect(readToken("input", dark)).toBe(readToken("border", dark));
    },
  );
});

describe("media chrome tokens", () => {
  test.each([false, true])(
    "the scrim is dark and the ink is light in both themes (dark=%s)",
    (dark) => {
      const scrim = readToken("media-scrim", dark);
      const strong = readToken("media-scrim-strong", dark);
      const ink = readToken("media-foreground", dark);
      for (const value of [scrim, strong]) {
        const { alpha } = parseComputed(value);
        expect(alpha).toBeGreaterThan(0);
        expect(alpha).toBeLessThan(1);
        expect(lightness(value)).toBeLessThan(0.3);
      }
      expect(lightness(ink)).toBeGreaterThan(0.9);
    },
  );

  test("the media tokens do not change with the theme", () => {
    for (const name of [
      "media-scrim",
      "media-scrim-strong",
      "media-foreground",
    ])
      expect(readToken(name, true)).toBe(readToken(name, false));
  });
});

describe("hover/pressed recipe", () => {
  test("the exported literals are the doctrine's two recipes", () => {
    expect(surfaceInteractive).toBe("hover:bg-surface-2 active:bg-surface-3");
    expect(fillInteractive.foreground).toBe(
      "hover:bg-foreground/(--alpha-hover) active:bg-foreground/(--alpha-pressed)",
    );
    for (const [tone, classes] of Object.entries(fillInteractive)) {
      expect(classes).toBe(
        `hover:bg-${tone}/(--alpha-hover) active:bg-${tone}/(--alpha-pressed)`,
      );
    }
  });

  test("cn() lets the recipe replace a legacy hover literal, last one wins", () => {
    expect(cn("hover:bg-muted hover:text-foreground", surfaceInteractive)).toBe(
      `hover:text-foreground ${surfaceInteractive}`,
    );
    expect(cn(surfaceInteractive, fillInteractive.foreground)).toBe(
      fillInteractive.foreground,
    );
    expect(cn(fillInteractive.destructive, surfaceInteractive)).toBe(
      surfaceInteractive,
    );
    // An explicit state fill (selected row) survives beside the recipe — different variant.
    expect(cn("data-selected:bg-surface-3", surfaceInteractive)).toBe(
      `data-selected:bg-surface-3 ${surfaceInteractive}`,
    );
  });

  test("the recipe classes compile: hover and active paint distinct rungs", async () => {
    const screen = await render(
      <button
        type="button"
        className={cn("rounded-md p-2", surfaceInteractive)}
      >
        hover me
      </button>,
    );
    const button = screen.getByRole("button").element() as HTMLButtonElement;
    const sheet = [...document.styleSheets].flatMap((s) => {
      try {
        return [...s.cssRules].map((r) => r.cssText);
      } catch {
        return [];
      }
    });
    // Both utilities exist in the compiled stylesheet (the scanner saw the recipe literal).
    expect(sheet.some((r) => r.includes("hover\\:bg-surface-2"))).toBe(true);
    expect(sheet.some((r) => r.includes("active\\:bg-surface-3"))).toBe(true);
    expect(button.className).toContain("hover:bg-surface-2");
  });
});

/**
 * The selected-chip recipe (audit B6-02/D20, N1). Tabs `pill`/`chip`, `Segmented` and pressed
 * `Toggle`/`ToggleGroup` had drifted into four different selected looks; this is the guard that
 * they cannot drift again, and that the SELECTED chip keeps both of its steps.
 */
describe("selected-chip recipe", () => {
  test("the chip is the ladder's PRESSED rung in alpha form, on a rung-1 track", () => {
    expect(selectedChipVariants.track).toBe("bg-surface-1");
    // `--alpha-ink-tint` (10%) is the same alpha as `--alpha-pressed`; the ink-tint names are what
    // the chip's own hover step (`-strong`) hangs off, which the ladder twins do not have.
    expect(selectedChipVariants.pressed).toContain(
      "data-pressed:bg-foreground/(--alpha-ink-tint)",
    );
    expect(selectedChipVariants.active).toContain(
      "data-[active]:bg-foreground/(--alpha-ink-tint)",
    );
  });

  test("a SELECTED chip still hovers and still presses", () => {
    for (const [state, rules] of [
      ["data-pressed", selectedChipVariants.pressed],
      ["data-[active]", selectedChipVariants.active],
    ] as const) {
      // Rest, then hover strengthens the tint, then press drops back to preview the release.
      // Without all three the probe's `active-same-as-hover` fires on the chip users click most.
      expect(rules).toContain(
        `${state}:hover:bg-foreground/(--alpha-ink-tint-strong)`,
      );
      expect(rules).toContain(
        `${state}:active:bg-foreground/(--alpha-ink-tint)`,
      );
      // The UNselected steps are guarded to the complementary selector, so the two sets are
      // mutually exclusive rather than racing on specificity.
      expect(rules).toContain(
        `not-${state}:hover:bg-foreground/(--alpha-hover)`,
      );
      expect(rules).toContain(
        `not-${state}:active:bg-foreground/(--alpha-pressed)`,
      );
    }
  });

  test("cn() keeps every rule — no variant chain collapses into another", () => {
    const merged = cn(
      "rounded-sm",
      selectedChipVariants.item,
      selectedChipVariants.pressed,
    );
    for (const rule of selectedChipVariants.pressed.split(" ")) {
      expect(merged).toContain(rule);
    }
  });

  test("the recipe compiles and the chip paints against its track", async () => {
    const screen = await render(
      <div className={cn("rounded-md p-0.5", selectedChipVariants.track)}>
        <button
          type="button"
          data-pressed=""
          className={cn(
            "rounded-sm",
            selectedChipVariants.item,
            selectedChipVariants.pressed,
          )}
        >
          selected
        </button>
      </div>,
    );
    const chip = screen.getByRole("button").element() as HTMLButtonElement;
    const sheet = [...document.styleSheets].flatMap((s) => {
      try {
        return [...s.cssRules].map((r) => r.cssText);
      } catch {
        return [];
      }
    });
    // The scanner saw the literal, so the selected fill exists as a real compiled utility.
    expect(sheet.some((r) => r.includes("alpha-ink-tint"))).toBe(true);
    // …and the chip actually paints, rather than staying transparent on its track.
    expect(getComputedStyle(chip).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});
