import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css"; // compiled Tailwind + token theme: real sizes and colours
import { RatingBars } from "./rating-bars";

const rootOf = (c: HTMLElement) =>
  c.querySelector<HTMLDivElement>('[data-slot="rating-bars"]')!;
const segmentsOf = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLSpanElement>('[data-slot="rating-bars-segment"]'),
];
const litOf = (c: HTMLElement) =>
  segmentsOf(c).filter((s) => s.dataset.lit === "true");

test("renders max segments and lights value of them, primary on muted", async () => {
  const screen = await render(
    <RatingBars label="Speed" value={4} valueText="Fast" />,
  );
  const segments = segmentsOf(screen.container);
  expect(segments).toHaveLength(5);
  expect(litOf(screen.container)).toHaveLength(4);
  for (const [i, s] of segments.entries()) {
    expect(s.getAttribute("aria-hidden")).toBe("true");
    expect(s.className).toContain(i < 4 ? "bg-primary" : "bg-muted");
  }
  // Lit and unlit read differently in the real theme.
  expect(getComputedStyle(segments[0]!).backgroundColor).not.toBe(
    getComputedStyle(segments[4]!).backgroundColor,
  );
  await expect
    .element(screen.getByText("Speed", { exact: true }))
    .toBeVisible();
  await expect.element(screen.getByText("Fast", { exact: true })).toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("the root is a meter named by label and read as valueText", async () => {
  const screen = await render(
    <RatingBars label="Quality" value={5} valueText="Strongest" />,
  );
  const meter = screen.getByRole("meter", { name: "Quality" });
  await expect.element(meter).toHaveAttribute("aria-valuetext", "Strongest");
  await expect.element(meter).toHaveAttribute("aria-valuemin", "0");
  await expect.element(meter).toHaveAttribute("aria-valuemax", "5");
  await expect.element(meter).toHaveAttribute("aria-valuenow", "5");
});

test("null lights none and reports zero", async () => {
  const screen = await render(
    <RatingBars label="Cost" value={null} valueText="Not listed" />,
  );
  expect(segmentsOf(screen.container)).toHaveLength(5);
  expect(litOf(screen.container)).toHaveLength(0);
  const root = rootOf(screen.container);
  expect(root.getAttribute("aria-valuenow")).toBe("0");
  expect(root.getAttribute("aria-valuetext")).toBe("Not listed");
  await expectNoA11yViolations(screen.container);
});

test("max sets the segment count and a value above it is clamped to max", async () => {
  const over = await render(
    <RatingBars label="Speed" value={9} max={3} valueText="Fast" />,
  );
  expect(segmentsOf(over.container)).toHaveLength(3);
  expect(litOf(over.container)).toHaveLength(3);
  expect(rootOf(over.container).getAttribute("aria-valuenow")).toBe("3");
  expect(rootOf(over.container).getAttribute("aria-valuemax")).toBe("3");
});

test("a value below zero lights none", async () => {
  const under = await render(
    <RatingBars label="Speed" value={-2} valueText="Slow" />,
  );
  expect(litOf(under.container)).toHaveLength(0);
  expect(rootOf(under.container).getAttribute("aria-valuenow")).toBe("0");
});

test('size="sm" draws 10×6 segments; default draws 12×8', async () => {
  const screen = await render(
    <div>
      <RatingBars label="Speed" value={2} valueText="Slow" />
      <RatingBars label="Cost" value={2} valueText="Low" size="sm" />
    </div>,
  );
  const [def, sm] = [
    ...screen.container.querySelectorAll<HTMLDivElement>(
      '[data-slot="rating-bars"]',
    ),
  ] as [HTMLDivElement, HTMLDivElement];
  expect(def.dataset.size).toBe("default");
  expect(sm.dataset.size).toBe("sm");
  const d = segmentsOf(def)[0]!.getBoundingClientRect();
  const s = segmentsOf(sm)[0]!.getBoundingClientRect();
  expect([d.width, d.height]).toEqual([12, 8]);
  expect([s.width, s.height]).toEqual([10, 6]);
});

test("forwards ref and merges className onto the root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <RatingBars
      ref={ref}
      className="w-60"
      label="Speed"
      value={3}
      valueText="Medium"
    />,
  );
  const root = rootOf(screen.container);
  expect(ref.current).toBe(root);
  expect(root.className).toContain("w-60");
  expect(root.className).toContain("grid-cols-[4rem_auto_1fr]");
});

test("a fraction lights the nearest whole segment and is reported as given", async () => {
  const screen = await render(
    <RatingBars label="Speed" value={2.4} valueText="Medium" />,
  );
  expect(litOf(screen.container)).toHaveLength(2);
  expect(rootOf(screen.container).getAttribute("aria-valuenow")).toBe("2.4");
});

test("max below 1 still draws one segment, so the meter's maximum stays above its minimum", async () => {
  const screen = await render(
    <RatingBars label="Speed" value={1} max={0} valueText="Fast" />,
  );
  expect(segmentsOf(screen.container)).toHaveLength(1);
  expect(rootOf(screen.container).getAttribute("aria-valuemax")).toBe("1");
  expect(rootOf(screen.container).getAttribute("aria-valuenow")).toBe("1");
});
