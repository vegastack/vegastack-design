import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Slider } from "./slider";

test("renders a slider with role slider", async () => {
  const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
  const slider = screen.getByRole("slider", { name: "Volume" });
  await expect.element(slider).toBeInTheDocument();
});

test("reflects the value via aria-valuenow", async () => {
  const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
  const slider = screen.getByRole("slider", { name: "Volume" });
  await expect.element(slider).toHaveAttribute("aria-valuenow", "40");
});

test("renders the root with its data-slot", async () => {
  const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
  expect(screen.container.querySelector('[data-slot="slider"]')).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="slider-track"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="slider-indicator"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="slider-thumb"]'),
  ).not.toBeNull();
});

test("honors min, max, and step", async () => {
  const screen = await render(
    <Slider
      defaultValue={50}
      min={0}
      max={1000}
      step={10}
      aria-label="Budget"
    />,
  );
  const slider = screen.getByRole("slider", { name: "Budget" });
  // The thumb's native <input type="range"> carries the bounds; role=slider
  // derives aria-valuemin/max from them, while aria-valuenow is set explicitly.
  await expect.element(slider).toHaveAttribute("min", "0");
  await expect.element(slider).toHaveAttribute("max", "1000");
  await expect.element(slider).toHaveAttribute("step", "10");
  await expect.element(slider).toHaveAttribute("aria-valuenow", "50");
});

test("renders one thumb per value for a range", async () => {
  const screen = await render(
    <Slider
      defaultValue={[20, 80]}
      thumbAriaLabels={["Minimum price", "Maximum price"]}
    />,
  );
  const sliders = screen.getByRole("slider");
  expect(sliders.all()).toHaveLength(2);
  await expect
    .element(screen.getByRole("slider", { name: "Minimum price" }))
    .toHaveAttribute("aria-valuenow", "20");
  await expect
    .element(screen.getByRole("slider", { name: "Maximum price" }))
    .toHaveAttribute("aria-valuenow", "80");
});

test("generates distinct range thumb labels from the slider aria-label fallback", async () => {
  const screen = await render(
    <Slider defaultValue={[20, 80]} aria-label="Price range" />,
  );
  await expect
    .element(screen.getByRole("slider", { name: "Minimum Price range" }))
    .toHaveAttribute("aria-valuenow", "20");
  await expect
    .element(screen.getByRole("slider", { name: "Maximum Price range" }))
    .toHaveAttribute("aria-valuenow", "80");
});

test("disabled removes the thumb from interaction", async () => {
  const screen = await render(
    <Slider defaultValue={40} disabled aria-label="Volume" />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  await expect.element(slider).toBeDisabled();
});

test("ArrowRight increments the value by step", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider defaultValue={40} onValueChange={onValueChange} aria-label="Volume" />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  slider.element().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(onValueChange).toHaveBeenLastCalledWith(41, expect.anything());
  await expect.element(slider).toHaveAttribute("aria-valuenow", "41");
});

test("ArrowUp increments the value by step", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider defaultValue={40} onValueChange={onValueChange} aria-label="Volume" />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  slider.element().focus();
  await userEvent.keyboard("{ArrowUp}");
  expect(onValueChange).toHaveBeenLastCalledWith(41, expect.anything());
  await expect.element(slider).toHaveAttribute("aria-valuenow", "41");
});

test("ArrowLeft decrements the value by step", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider defaultValue={40} onValueChange={onValueChange} aria-label="Volume" />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  slider.element().focus();
  await userEvent.keyboard("{ArrowLeft}");
  expect(onValueChange).toHaveBeenLastCalledWith(39, expect.anything());
  await expect.element(slider).toHaveAttribute("aria-valuenow", "39");
});

test("ArrowDown decrements the value by step", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider defaultValue={40} onValueChange={onValueChange} aria-label="Volume" />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  slider.element().focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(onValueChange).toHaveBeenLastCalledWith(39, expect.anything());
  await expect.element(slider).toHaveAttribute("aria-valuenow", "39");
});

test("arrow keys step by the custom step size", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider
      defaultValue={50}
      min={0}
      max={1000}
      step={10}
      onValueChange={onValueChange}
      aria-label="Budget"
    />,
  );
  const slider = screen.getByRole("slider", { name: "Budget" });
  slider.element().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(onValueChange).toHaveBeenLastCalledWith(60, expect.anything());
  await userEvent.keyboard("{ArrowLeft}");
  expect(onValueChange).toHaveBeenLastCalledWith(50, expect.anything());
});

test("Home jumps to the minimum value", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider
      defaultValue={40}
      min={0}
      max={100}
      onValueChange={onValueChange}
      aria-label="Volume"
    />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  slider.element().focus();
  await userEvent.keyboard("{Home}");
  expect(onValueChange).toHaveBeenLastCalledWith(0, expect.anything());
  await expect.element(slider).toHaveAttribute("aria-valuenow", "0");
});

test("End jumps to the maximum value", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider
      defaultValue={40}
      min={0}
      max={100}
      onValueChange={onValueChange}
      aria-label="Volume"
    />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  slider.element().focus();
  await userEvent.keyboard("{End}");
  expect(onValueChange).toHaveBeenLastCalledWith(100, expect.anything());
  await expect.element(slider).toHaveAttribute("aria-valuenow", "100");
});

test("disabled removes the thumb from the tab order so arrow keys have no effect", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Slider defaultValue={40} disabled onValueChange={onValueChange} aria-label="Volume" />,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  // Disabled native range inputs cannot receive focus; the value must stay put.
  slider.element().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(onValueChange).not.toHaveBeenCalled();
  await expect.element(slider).toHaveAttribute("aria-valuenow", "40");
});

test("no a11y violations when labelled", async () => {
  const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Slider defaultValue={40} disabled aria-label="Volume" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("render composes a custom root element while keeping slot + classes", async () => {
  // Base UI's `render` replaces the Slider.Root host
  // but merges our data-slot + className and keeps the slider internals as
  // children (the role=slider thumb still works).
  const screen = await render(
    <Slider
      defaultValue={40}
      aria-label="Volume"
      className="sentinel-slider"
      render={<section data-testid="custom-slider-root" />}
    />,
  );
  const root = screen.container.querySelector(
    '[data-slot="slider"]',
  ) as HTMLElement;
  expect(root).not.toBeNull();
  expect(root.tagName).toBe("SECTION");
  expect(root.getAttribute("data-testid")).toBe("custom-slider-root");
  expect(root.classList.contains("sentinel-slider")).toBe(true);
  // Internals survive the composition — the thumb still exposes role=slider.
  await expect
    .element(screen.getByRole("slider", { name: "Volume" }))
    .toHaveAttribute("aria-valuenow", "40");
});

test("forwards ref to the underlying slider root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Slider ref={ref} defaultValue={40} aria-label="Volume" />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("slider");
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target remediation (WCAG 2.5.8) — effective hit-area measurement.
 *
 * Same rationale/technique as checkbox.test.tsx: this harness runs without compiled Tailwind, so
 * `before:-inset-1` never resolves to real CSS here. Each test injects a literal <style> tag that
 * is a 1:1 mirror of what these EXACT Tailwind utility values compile to (the "-inset-1 = 4px"
 * scale this remediation's house rule documents), keyed to the real `data-slot` attributes the
 * component renders (real regardless of compiled CSS), then measures the REAL, browser-computed
 * layout against it.
 *
 * The pointer target is `[data-slot="slider-thumb"]` — the visible, draggable DIV — NOT the
 * `role="slider"` element (that's the nested, visually-hidden `<input type="range">`; Base UI
 * positions the visible thumb DIV with an inline `position: absolute`, confirmed by inspection,
 * so no `relative` class is needed on it, matching the component's own inline comment).
 * ------------------------------------------------------------------------------------------- */

function injectSliderThumbHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="slider"] { position: relative; display: flex; width: 300px; align-items: center; box-sizing: border-box; }
    [data-slot="slider-control"] { position: relative; display: flex; width: 100%; align-items: center; box-sizing: border-box; }
    [data-slot="slider-track"] { position: relative; height: 6px; width: 100%; box-sizing: border-box; }
    [data-slot="slider-thumb"] { width: 16px; height: 16px; box-sizing: border-box; }
    [data-slot="slider-thumb"]::before { content: ""; position: absolute; inset: -4px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("thumb (16px) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectSliderThumbHitAreaMirror();
  try {
    const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
    const thumb = screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement;
    thumb.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(thumb, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a point just outside the visual thumb, inside the expanded hit area, still hits the thumb", async () => {
  const cleanup = injectSliderThumbHitAreaMirror();
  try {
    const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
    const thumb = screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement;
    const rect = thumb.getBoundingClientRect();
    // 3px above the visual top edge — inside the 4px `before:-inset-1` expansion, outside the 16px dot.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 3;
    const hit = document.elementFromPoint(x, y);
    expect(hit).toBe(thumb);

    // A real (trusted, Playwright-driven) click at that resolved element focuses the thumb's
    // underlying range input — the meaningful "did my click reach the drag handle" signal for a
    // slider (unlike checkbox/radio, a bare click doesn't "toggle" a slider; it activates it for
    // drag/keyboard interaction, which IS gated on focus reaching the input).
    await userEvent.click(hit as HTMLElement);
    const input = screen.container.querySelector('input[type="range"]');
    expect(document.activeElement).toBe(input);
  } finally {
    cleanup();
  }
});

test("a point beyond the expanded hit area does not resolve to the thumb", async () => {
  const cleanup = injectSliderThumbHitAreaMirror();
  try {
    const screen = await render(<Slider defaultValue={40} aria-label="Volume" />);
    const thumb = screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement;
    const rect = thumb.getBoundingClientRect();
    // 8px above the visual top edge — 4px beyond the 4px `before:-inset-1` expansion boundary.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8;
    const hit = document.elementFromPoint(x, y);
    expect(hit).not.toBe(thumb);
  } finally {
    cleanup();
  }
});
