import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, expect, test } from "vitest";
import { VideoPlayer } from "../registry/ui/video-player";

/**
 * Rendered media-chrome gate (audit 2026-09-07, B4-01 / D16). The TOKEN contract — the
 * `--media-*` trio is theme-invariant, dark-scrim + light-ink — is asserted in
 * `surface-ladder.browser.test.tsx`. This file asserts the other half, which no token test can
 * reach: that the video player actually PAINTS those tokens.
 *
 * The defect it pins is concrete. The overlay was built on `primary` /
 * `primary-foreground`, which flip with the theme: in dark the scrim measured oklab 0.92
 * (near-white) behind near-black icons — chrome inverted over the same video frame. A structural
 * unit test cannot see this, because semantic tokens do not resolve to colours without compiled
 * CSS; this file compiles the real theme and reads what the browser computed.
 *
 * `controlsVisible` is what makes the overlay observable at all — the auto hide/reveal never fires
 * without a pointer, so a static harness (this one, and the docs contract fixture) would otherwise
 * measure an overlay that is not in the DOM.
 */

const SOURCE = "data:video/mp4;base64,";

const relLum = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const gam2lin = (x: number) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

/**
 * One colour in a computed value, in source order. Chromium serialises the SAME token three ways
 * and the gate has to read all of them: authored in OKLCH it stays `oklch(L C H / a)`, inside a
 * gradient it is normalised to `oklab(L a b / a)`, and an sRGB value comes back as
 * `rgb()` / `color(srgb …)`. Matching only some of them is how a colour gate silently reads the
 * WRONG stop and passes on the very defect it exists to catch — the first draft of this file did
 * exactly that: it missed `oklab()`, matched the gradient's transparent `rgba(0, 0, 0, 0)` end
 * instead, measured L 0, and stayed green against the pre-fix `from-primary` scrim.
 */
const COLOUR_RE = /okl(?:ch|ab)\([^)]*\)|color\(srgb[^)]*\)|rgba?\([^)]*\)/;

/**
 * Lightness of a computed colour. In `oklch()` / `oklab()` the first component IS the lightness; an
 * sRGB fallback is reduced to a cube-root-of-luminance proxy, which orders the two cases the same
 * way. (Same reduction as the surface-ladder gate.)
 */
function lightness(color: string): number {
  const oklxx = color.match(/okl(?:ch|ab)\(\s*([\d.]+)[\s,]/);
  if (oklxx) return Number(oklxx[1]);
  const srgb = color.match(
    /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/,
  );
  const rgb =
    srgb ??
    color.match(/rgba?\(\s*(\d+),?\s+(\d+),?\s+(\d+)(?:[,/\s]+([\d.]+))?\s*\)/);
  if (!rgb) throw new Error(`unparseable computed colour: ${color}`);
  const scale = srgb ? 1 : 255;
  return Math.cbrt(
    relLum([rgb[1], rgb[2], rgb[3]].map((c) => Number(c) / scale).map(gam2lin)),
  );
}

/** The first colour stop of the scrim's gradient — the end laid over the video. */
function scrimStop(container: Element): string {
  const scrim = container.querySelector(
    '[data-slot="video-player-controls-scrim"]',
  );
  if (!scrim) throw new Error("scrim not found");
  const image = getComputedStyle(scrim).backgroundImage;
  const stop = image.match(COLOUR_RE);
  if (!stop) throw new Error(`no colour stop in gradient: ${image}`);
  return stop[0];
}

/** The ink every overlay icon and label inherits from the controls group. */
function overlayInk(container: Element): string {
  const controls = container.querySelector(
    '[data-slot="media-player-controls"][data-variant="overlay"]',
  );
  if (!controls) throw new Error("overlay controls not found");
  return getComputedStyle(controls).color;
}

async function renderOverlay(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  const screen = await render(
    <VideoPlayer src={SOURCE} label="Demo video" controlsVisible />,
  );
  await expect
    .poll(() =>
      screen.container.querySelector(
        '[data-slot="media-player-controls"][data-variant="overlay"]',
      ),
    )
    .not.toBeNull();
  return screen.container;
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
});

test.each([false, true])(
  "video overlay chrome is dark-scrim + light-ink (dark=%s)",
  async (dark) => {
    const container = await renderOverlay(dark);
    expect(lightness(scrimStop(container))).toBeLessThan(0.3);
    expect(lightness(overlayInk(container))).toBeGreaterThan(0.85);
  },
);

test("the rendered overlay chrome does not change with the theme", async () => {
  const light = await renderOverlay(false);
  const lightChrome = [scrimStop(light), overlayInk(light)];
  const dark = await renderOverlay(true);
  expect([scrimStop(dark), overlayInk(dark)]).toEqual(lightChrome);
});

/**
 * The overlay rail's RESTING thickness, in compiled CSS. This is a cascade gate, not a colour one:
 * `trackByVariant.overlay` asks for `h-1` (4px), and for as long as the shared Track ALSO carried
 * an unconditional `data-[orientation=horizontal]:h-1.5` the two tied on specificity and Tailwind's
 * utility sort order decided the winner — `h-1.5` — so the rail silently rendered at the default
 * 6px and the `group-hover`/`group-focus-within` thickening became a no-op. No structural unit test
 * can see that; it only exists once the theme is compiled and the browser has resolved the cascade.
 */
test("the overlay seek rail rests at its own thickness, not the default rail's", async () => {
  const container = await renderOverlay(false);
  const track = container.querySelector(
    '[data-slot="media-player-controls"][data-variant="overlay"] [data-slot="slider-track"][data-orientation="horizontal"]',
  );
  if (!track) throw new Error("overlay seek track not found");
  expect(getComputedStyle(track).height).toBe("4px");
});
