import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ParticleField, PARTICLE_FIELD_MAX_COUNT } from "./particle-field";

function mockReducedMotion(matches: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? matches : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

let restoreMatchMedia: (() => void) | undefined;

beforeEach(() => {
  // Deterministic-frame tests want a single static draw, not an animating loop —
  // reduced motion is the mechanism this component already uses for exactly that.
  restoreMatchMedia = mockReducedMotion(true);
});

afterEach(() => {
  restoreMatchMedia?.();
  vi.restoreAllMocks();
});

function sized(children: React.ReactNode) {
  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      {children}
    </div>
  );
}

test("renders an aria-hidden container with a full-size canvas", async () => {
  const screen = await render(sized(<ParticleField data-testid="field" />));
  const el = screen.getByTestId("field").element() as HTMLElement;
  expect(el.getAttribute("aria-hidden")).toBe("true");
  expect(el.dataset.slot).toBe("particle-field");
  const canvas = el.querySelector('canvas[data-slot="particle-field-canvas"]');
  expect(canvas).not.toBeNull();
});

test("draws a static frame under reduced motion (deterministic per seed)", async () => {
  const screenA = await render(
    sized(<ParticleField seed={7} count={12} data-testid="a" />),
  );
  const screenB = await render(
    sized(<ParticleField seed={7} count={12} data-testid="b" />),
  );

  const canvasA = screenA
    .getByTestId("a")
    .element()
    .querySelector("canvas") as HTMLCanvasElement;
  const canvasB = screenB
    .getByTestId("b")
    .element()
    .querySelector("canvas") as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(screenA.getByTestId("a").element().hasAttribute("data-drawn")).toBe(
      true,
    );
    expect(screenB.getByTestId("b").element().hasAttribute("data-drawn")).toBe(
      true,
    );
  });

  expect(canvasA.toDataURL()).toBe(canvasB.toDataURL());
});

test("a different seed produces a different deterministic layout", async () => {
  const screenA = await render(
    sized(<ParticleField seed={1} count={12} data-testid="a" />),
  );
  const screenB = await render(
    sized(<ParticleField seed={2} count={12} data-testid="b" />),
  );

  const canvasA = screenA
    .getByTestId("a")
    .element()
    .querySelector("canvas") as HTMLCanvasElement;
  const canvasB = screenB
    .getByTestId("b")
    .element()
    .querySelector("canvas") as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(screenA.getByTestId("a").element().hasAttribute("data-drawn")).toBe(
      true,
    );
    expect(screenB.getByTestId("b").element().hasAttribute("data-drawn")).toBe(
      true,
    );
  });

  expect(canvasA.toDataURL()).not.toBe(canvasB.toDataURL());
});

test("count is clamped to PARTICLE_FIELD_MAX_COUNT — an oversized count draws the same frame as the cap", async () => {
  expect(PARTICLE_FIELD_MAX_COUNT).toBeGreaterThan(0);

  const screenA = await render(
    sized(
      <ParticleField
        seed={3}
        count={PARTICLE_FIELD_MAX_COUNT}
        data-testid="a"
      />,
    ),
  );
  const screenB = await render(
    sized(
      <ParticleField
        seed={3}
        count={PARTICLE_FIELD_MAX_COUNT + 500}
        data-testid="b"
      />,
    ),
  );
  const canvasA = screenA
    .getByTestId("a")
    .element()
    .querySelector("canvas") as HTMLCanvasElement;
  const canvasB = screenB
    .getByTestId("b")
    .element()
    .querySelector("canvas") as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(screenA.getByTestId("a").element().hasAttribute("data-drawn")).toBe(
      true,
    );
    expect(screenB.getByTestId("b").element().hasAttribute("data-drawn")).toBe(
      true,
    );
  });

  // Same seed + the cap wins for both → identical particle set → identical frame.
  expect(canvasA.toDataURL()).toBe(canvasB.toDataURL());
});

test("sets data-drawn once the first frame has painted", async () => {
  const screen = await render(
    sized(<ParticleField seed={1} count={4} data-testid="field" />),
  );
  const el = screen.getByTestId("field").element() as HTMLElement;
  // requestAnimationFrame may run before render() resolves (notably in WebKit),
  // so the pre-frame absence is not an observable cross-engine contract. The
  // meaningful contract is that the first completed draw eventually stamps it.
  await vi.waitFor(() => {
    expect(el.hasAttribute("data-drawn")).toBe(true);
  });
});

/* -------------------------------------------------------------------------------------------
 * Theme-following (B9-09). The ink used to be captured ONCE, at effect start, into a `const`.
 * The draw effect is keyed on ready/count/seed/reduced-motion — nothing it can observe changes
 * when the theme does — so a light-mounted field kept the light `--brand` (oklch(0.6 …)) after
 * a toggle to dark (oklch(0.86 …)) until something forced a remount.
 *
 * The fix reads the canvas's own RESOLVED `color` per frame. This harness compiles no Tailwind,
 * so `text-brand` resolves to nothing and the canvas simply INHERITS `color` from its ancestor
 * — which is what makes the mechanism testable here: change the inherited colour, and the ink
 * must follow, on the SAME element, with no remount.
 * ----------------------------------------------------------------------------------------- */

function themed(color: string, children: React.ReactNode) {
  return (
    <div style={{ position: "relative", width: 200, height: 200, color }}>
      {children}
    </div>
  );
}

test("animated field repaints in the new ink when the theme changes, without remounting", async () => {
  // The rAF loop is the path that re-reads per frame, so this test needs motion ON.
  restoreMatchMedia?.();
  restoreMatchMedia = mockReducedMotion(false);

  const screen = await render(
    themed(
      "rgb(255, 0, 0)",
      <ParticleField seed={5} count={16} data-testid="field" />,
    ),
  );
  const el = screen.getByTestId("field").element() as HTMLElement;
  const canvas = el.querySelector("canvas") as HTMLCanvasElement;
  await vi.waitFor(() => expect(el.hasAttribute("data-drawn")).toBe(true));

  let before = "";
  await vi.waitFor(() => {
    before = canvas.toDataURL();
    expect(before.length).toBeGreaterThan(64);
  });

  // A theme toggle, as the cascade delivers it: the resolved colour changes.
  (el.parentElement as HTMLElement).style.color = "rgb(0, 0, 255)";

  await vi.waitFor(() => {
    expect(canvas.toDataURL()).not.toBe(before);
  });

  // Same element throughout — the recolour is a repaint, not a remount.
  expect(el.querySelector("canvas")).toBe(canvas);
});

test("the static reduced-motion frame follows a theme change too", async () => {
  // This branch paints once by design, so it needs an explicit trigger — a theme change
  // lands as an attribute write on the document element.
  const screen = await render(
    themed(
      "rgb(255, 0, 0)",
      <ParticleField seed={6} count={16} data-testid="field" />,
    ),
  );
  const el = screen.getByTestId("field").element() as HTMLElement;
  const canvas = el.querySelector("canvas") as HTMLCanvasElement;
  await vi.waitFor(() => expect(el.hasAttribute("data-drawn")).toBe(true));
  const before = canvas.toDataURL();

  try {
    (el.parentElement as HTMLElement).style.color = "rgb(0, 0, 255)";
    document.documentElement.setAttribute("data-theme", "dark");
    await vi.waitFor(() => {
      expect(canvas.toDataURL()).not.toBe(before);
    });
    expect(el.querySelector("canvas")).toBe(canvas);
  } finally {
    document.documentElement.removeAttribute("data-theme");
  }
});

test("no a11y violations", async () => {
  const screen = await render(<ParticleField />);
  await expectNoA11yViolations(screen.container);
});
