import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ProgressIndicator } from "./progress-indicator";

test("renders a progressbar with the slot + default attributes", async () => {
  const screen = await render(<ProgressIndicator value={40} />);
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toBeInTheDocument();
  await expect.element(bar).toHaveAttribute("data-slot", "progress-indicator");
  await expect.element(bar).toHaveAttribute("data-variant", "default");
  await expect.element(bar).toHaveAttribute("data-size", "default");
  await expect.element(bar).toHaveAttribute("data-shape", "circle");
});

test("aria-valuenow reflects the value against the default 0–100 scale", async () => {
  const screen = await render(<ProgressIndicator value={60} />);
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("aria-valuenow", "60");
  await expect.element(bar).toHaveAttribute("aria-valuemin", "0");
  await expect.element(bar).toHaveAttribute("aria-valuemax", "100");
  await expect.element(bar).toHaveAttribute("data-value", "60");
});

test("derives a default percentage label", async () => {
  const screen = await render(<ProgressIndicator value={75} />);
  await expect
    .element(screen.getByRole("progressbar"))
    .toHaveAttribute("aria-label", "75% complete");
});

test("reports value relative to a custom max", async () => {
  const screen = await render(
    <ProgressIndicator value={3} max={5} aria-label="Step 3 of 5" />,
  );
  const bar = screen.getByRole("progressbar", { name: "Step 3 of 5" });
  // 3 / 5 => 60% on the announced 0–100 scale.
  await expect.element(bar).toHaveAttribute("aria-valuenow", "60");
  await expect.element(bar).toHaveAttribute("aria-valuemax", "100");
});

test("clamps values above max down to 100", async () => {
  const screen = await render(
    <ProgressIndicator value={150} aria-label="Over" />,
  );
  await expect
    .element(screen.getByRole("progressbar", { name: "Over" }))
    .toHaveAttribute("aria-valuenow", "100");
});

test("clamps negative values up to 0", async () => {
  const screen = await render(
    <ProgressIndicator value={-20} aria-label="Under" />,
  );
  await expect
    .element(screen.getByRole("progressbar", { name: "Under" }))
    .toHaveAttribute("aria-valuenow", "0");
});

test("reflects the size + shape variants on data attributes", async () => {
  const screen = await render(
    <ProgressIndicator value={50} size="lg" shape="squircle" />,
  );
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("data-size", "lg");
  await expect.element(bar).toHaveAttribute("data-shape", "squircle");
});

test("inline-value variant renders the visible percentage beside the glyph", async () => {
  const screen = await render(
    <ProgressIndicator value={88} variant="inline-value" data-testid="pi" />,
  );
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("data-variant", "inline-value");
  await expect.element(bar).toHaveAttribute("aria-label", "88% complete");

  const root = screen.getByTestId("pi").element() as HTMLElement;
  const label = root.querySelector("span[aria-hidden='true']");
  expect(label?.textContent).toBe("88%");
  expect(label?.className).toContain("tabular-nums");
  expect(root.querySelector("svg")?.className.baseVal).toContain("size-5");
});

test("contained-value variant renders a large bordered circle with the percentage centered inside", async () => {
  const screen = await render(
    <ProgressIndicator value={44} variant="contained-value" data-testid="pi" />,
  );
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("data-variant", "contained-value");

  const root = screen.getByTestId("pi").element() as HTMLElement;
  expect(root.className).toContain("relative");
  expect(root.className).toContain("size-16");
  const progress = root.querySelector("circle[stroke-dasharray]");
  expect(progress?.getAttribute("r")).toBe("11");
  expect(progress?.getAttribute("stroke-width")).toBe("2");
  expect(progress?.getAttribute("stroke-linecap")).toBe("round");
  const label = root.querySelector("span[aria-hidden='true']");
  expect(label?.textContent).toBe("44%");
  expect(label?.className).toContain("absolute");
  expect(label?.className).toContain("inset-0");
});

test("no a11y violations", async () => {
  const screen = await render(
    <ProgressIndicator value={60} aria-label="Sync progress" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying span element", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<ProgressIndicator ref={ref} value={40} />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("progress-indicator");
});

/* ---------------------------------------------------------------------------------------------
 * Value-sweep transition (audit 09 §b6/d3) — bring the circular indicator in line with the
 * linear `Progress` bar's `transition-[width] duration-base ease-standard`. The arc is driven by
 * `stroke-dasharray` (not `stroke-dashoffset` — verified by reading the component: `dash` grows
 * with `percent` against a constant `circumference`), so the fill wedge transitions that property.
 * The fill circle is the only `circle` carrying a `stroke-dasharray` attribute (the track outline
 * never has one, for either shape), which gives a stable, non-invasive selector for it.
 * ------------------------------------------------------------------------------------------- */

test("the fill arc carries the stroke-dasharray sweep transition utility classes", async () => {
  const screen = await render(
    <ProgressIndicator value={40} data-testid="pi" />,
  );
  const root = screen.getByTestId("pi").element() as HTMLElement;
  const fill = root.querySelector("circle[stroke-dasharray]");
  expect(fill).not.toBeNull();
  const className = fill?.getAttribute("class") ?? "";
  expect(className).toContain("transition-[stroke-dasharray]");
  expect(className).toContain("duration-base");
  expect(className).toContain("ease-standard");
  expect(className).toContain("motion-reduce:transition-none");
});

test("the track outline never carries a stroke-dasharray attribute (selector stays unambiguous)", async () => {
  const screen = await render(
    <ProgressIndicator value={40} shape="squircle" data-testid="pi" />,
  );
  const root = screen.getByTestId("pi").element() as HTMLElement;
  expect(root.querySelectorAll("circle[stroke-dasharray]")).toHaveLength(1);
});

test("the fill arc is absent (no sweep target) at value 0", async () => {
  const screen = await render(<ProgressIndicator value={0} data-testid="pi" />);
  const root = screen.getByTestId("pi").element() as HTMLElement;
  expect(root.querySelector("circle[stroke-dasharray]")).toBeNull();
});

/**
 * This suite runs WITHOUT compiled Tailwind, so `transition-[stroke-dasharray]` /
 * `duration-base` / `ease-standard` never resolve to real CSS here (see checkbox.test.tsx's
 * "Touch-target remediation" note for the same constraint). To pin the REAL, browser-computed
 * transition (not just the class-name string above), this injects a literal <style> that is a
 * 1:1 mirror of what those exact utilities compile to — `--duration-base: 200ms` and
 * `--motion-ease-standard: cubic-bezier(0.2, 0, 0, 1)` per `packages/design-tokens/dist/theme.css` —
 * keyed to the fill arc's own stable selector, then reads the real computed style.
 */
function injectProgressFillTransitionMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    [data-slot="progress-indicator"] circle[stroke-dasharray] {
      transition-property: stroke-dasharray;
      transition-duration: 200ms;
      transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
    }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("the fill arc computed-style transition resolves to stroke-dasharray / duration-base / ease-standard", async () => {
  const cleanup = injectProgressFillTransitionMirror();
  try {
    const screen = await render(
      <ProgressIndicator value={40} data-testid="pi" />,
    );
    const root = screen.getByTestId("pi").element() as HTMLElement;
    const fill = root.querySelector(
      "circle[stroke-dasharray]",
    ) as SVGCircleElement;
    expect(fill).not.toBeNull();
    const computed = getComputedStyle(fill);
    expect(computed.transitionProperty).toBe("stroke-dasharray");
    expect(computed.transitionDuration).toBe("0.2s");
    expect(computed.transitionTimingFunction).toBe(
      "cubic-bezier(0.2, 0, 0, 1)",
    );
  } finally {
    cleanup();
  }
});

test("segments mode renders the dash row with the filled count from value/max", async () => {
  const screen = await render(
    <ProgressIndicator segments={6} value={2} max={6} />,
  );
  const root = screen.getByRole("progressbar");
  await expect.element(root).toHaveAttribute("data-shape", "segments");
  await expect.element(root).toHaveAttribute("aria-valuenow", "33");
  const bars = (root.element() as HTMLElement).querySelectorAll(
    "span[aria-hidden]",
  );
  expect(bars.length).toBe(6);
  const filled = [...bars].filter(
    (b) => !b.className.includes("opacity-(--opacity-track)"),
  );
  expect(filled.length).toBe(2);
});
