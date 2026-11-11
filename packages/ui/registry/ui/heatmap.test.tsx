import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import primitives from "../../../design-tokens/tokens/primitives.tokens.json";
import lightTokens from "../../../design-tokens/tokens/semantic.tokens.json";
import darkTokens from "../../../design-tokens/tokens/semantic.dark.tokens.json";
import { columnLabelStep, HEATMAP_STEPS, Heatmap } from "./heatmap";

const DAYS = ["Mon", "Tue", "Wed"];
const HOURS = ["00", "01", "02", "03"];

function label(r: number, c: number, v: number) {
  return `${DAYS[r]} ${HOURS[c]}:00 — ${v} runs`;
}

function cell(r: number, c: number): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    `[data-slot="heatmap-cell"][data-row="${r}"][data-col="${c}"]`,
  );
  if (!el) throw new Error(`no cell ${r},${c}`);
  return el;
}

// The unit lane runs without compiled CSS, so axe's colour checks cannot evaluate here; real
// contrast is the token computation at the bottom of this file.
const NO_CSS = ["color-contrast"];

test("a named grid of rows, row headers, column headers and labelled cells", async () => {
  const screen = await render(
    <Heatmap
      label="Runs by weekday and hour"
      rows={DAYS}
      columns={HOURS}
      values={[
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 0],
      ]}
      cellLabel={label}
      legend={{ low: "Fewer", high: "More" }}
    />,
  );
  const grid = screen.getByRole("grid", { name: "Runs by weekday and hour" });
  await expect.element(grid).toBeInTheDocument();
  expect(grid.element().querySelectorAll('[role="row"]')).toHaveLength(4);
  expect(grid.element().querySelectorAll('[role="columnheader"]')).toHaveLength(
    4,
  );
  expect(grid.element().querySelectorAll('[role="rowheader"]')).toHaveLength(3);
  expect(grid.element().querySelectorAll('[role="gridcell"]')).toHaveLength(12);
  await expect
    .element(screen.getByRole("gridcell", { name: "Tue 01:00 — 5 runs" }))
    .toBeInTheDocument();
  await expect.element(screen.getByText("Fewer")).toBeInTheDocument();
  await expect.element(screen.getByText("More")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container, NO_CSS);
});

test("non-zero values bucket into five steps by quintile; zero is the muted well", async () => {
  // Ten non-zero values 1..10 → quintile bounds 2, 4, 6, 8.
  await render(
    <Heatmap
      label="Runs"
      rows={["a", "b", "c"]}
      columns={HOURS}
      values={[
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 0],
      ]}
      cellLabel={() => "cell"}
    />,
  );
  const step = (r: number, c: number) => cell(r, c).getAttribute("data-step");
  expect(step(0, 0)).toBe("0");
  expect(cell(0, 0).className).toContain("bg-muted");
  expect([step(0, 1), step(0, 2)]).toEqual(["1", "1"]); // 1, 2
  expect([step(0, 3), step(1, 0)]).toEqual(["2", "2"]); // 3, 4
  expect([step(1, 1), step(1, 2)]).toEqual(["3", "3"]); // 5, 6
  expect([step(1, 3), step(2, 0)]).toEqual(["4", "4"]); // 7, 8
  expect([step(2, 1), step(2, 2)]).toEqual(["5", "5"]); // 9, 10
  expect(step(2, 3)).toBe("0");
  // Every step's class carries its own mix percentage of the chart ink into the card.
  for (const [i, pct] of HEATMAP_STEPS.entries()) {
    const el = document.querySelector(`[data-step="${i + 1}"]`) as HTMLElement;
    expect(el.className).toContain(
      `bg-[color-mix(in_oklab,var(--color-chart-single)_${pct}%,var(--color-card))]`,
    );
  }
});

test("equal values share a step, and a lone repeated value takes the top step", async () => {
  await render(
    <Heatmap
      label="Runs"
      rows={["a"]}
      columns={HOURS}
      values={[[3, 0, 3, 3]]}
      cellLabel={() => "cell"}
    />,
  );
  expect(cell(0, 0).getAttribute("data-step")).toBe("5");
  expect(cell(0, 2).getAttribute("data-step")).toBe("5");
  expect(cell(0, 1).getAttribute("data-step")).toBe("0");
});

test("roving tabindex: one tabbable cell; arrows, Home and End move focus", async () => {
  await render(
    <Heatmap
      label="Runs"
      rows={DAYS}
      columns={HOURS}
      values={[
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ]}
      cellLabel={label}
    />,
  );
  const tabbable = () =>
    document.querySelectorAll('[data-slot="heatmap-cell"][tabindex="0"]');
  expect(tabbable()).toHaveLength(1);
  expect(cell(0, 0).tabIndex).toBe(0);

  await userEvent.tab();
  expect(document.activeElement).toBe(cell(0, 0));

  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(cell(0, 1));
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(cell(1, 1));
  await userEvent.keyboard("{End}");
  expect(document.activeElement).toBe(cell(1, 3));
  await userEvent.keyboard("{ArrowRight}"); // clamps at the row's end
  expect(document.activeElement).toBe(cell(1, 3));
  await userEvent.keyboard("{Home}");
  expect(document.activeElement).toBe(cell(1, 0));
  await userEvent.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(cell(0, 0));
  await userEvent.keyboard("{Control>}{End}{/Control}");
  expect(document.activeElement).toBe(cell(2, 3));

  expect(tabbable()).toHaveLength(1);
  expect(cell(2, 3).tabIndex).toBe(0);
  expect(cell(0, 0).tabIndex).toBe(-1);
});

test("right-to-left: the arrows follow the visual direction", async () => {
  await render(
    <div dir="rtl">
      <Heatmap
        label="Runs"
        rows={["a"]}
        columns={HOURS}
        values={[[1, 1, 1, 1]]}
        cellLabel={(_r, c) => `cell ${c}`}
      />
    </div>,
  );
  await userEvent.tab();
  expect(document.activeElement).toBe(cell(0, 0));
  await userEvent.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(cell(0, 1));
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(cell(0, 0));
});

test("cells never shrink below 12px wide and are 24px tall", async () => {
  await render(
    <Heatmap
      label="Runs"
      rows={["a"]}
      columns={HOURS}
      values={[[1, 2, 3, 4]]}
      cellLabel={() => "cell"}
    />,
  );
  expect(cell(0, 0).classList.contains("min-w-3")).toBe(true);
  expect(cell(0, 0).classList.contains("h-6")).toBe(true);
  expect(
    document.querySelector('[data-slot="heatmap-grid"]')?.className,
  ).toContain("minmax(0.75rem,1fr)");
  // No focus ring (FOC-13): the global focus tint is the cue.
  expect(cell(0, 0).className).not.toMatch(/ring/);
});

test("the focused cell shows its cellLabel in a tooltip", async () => {
  await render(
    <Heatmap
      label="Runs"
      rows={DAYS}
      columns={HOURS}
      values={[
        [1, 2, 3, 4],
        [1, 2, 3, 4],
        [1, 2, 3, 4],
      ]}
      cellLabel={label}
    />,
  );
  await userEvent.tab();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="heatmap-tooltip"]')?.textContent,
    )
    .toBe("Mon 01:00 — 2 runs");
  await expectNoA11yViolations(document.body, NO_CSS);
});

test("every value 0 renders `empty` instead of the grid", async () => {
  const screen = await render(
    <Heatmap
      label="Runs"
      rows={DAYS}
      columns={HOURS}
      values={[
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]}
      cellLabel={label}
      empty={<p>No runs yet</p>}
    />,
  );
  await expect.element(screen.getByText("No runs yet")).toBeInTheDocument();
  expect(document.querySelector('[role="grid"]')).toBeNull();
});

test("with no `empty`, an all-zero heatmap reads 'No data'", async () => {
  const screen = await render(
    <Heatmap
      label="Runs"
      rows={["a"]}
      columns={["x"]}
      values={[[0]]}
      cellLabel={() => "cell"}
    />,
  );
  await expect.element(screen.getByText("No data")).toBeInTheDocument();
});

test("column names thin out by measure when the columns are narrower than the names", async () => {
  const hours = Array.from({ length: 24 }, (_, h) =>
    String(h).padStart(2, "0"),
  );
  const shown = () =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-slot="heatmap-column-header"] > span',
      ),
    ].filter((s) => !s.classList.contains("sr-only"));
  const screen = await render(
    <div style={{ width: 280 }}>
      <Heatmap
        label="Runs"
        rows={["Mon"]}
        columns={hours}
        values={[hours.map((_, i) => i + 1)]}
        cellLabel={() => "cell"}
      />
    </div>,
  );
  // Narrow: some names hide, and the shown ones are whole and never touch each other.
  await expect.poll(() => shown().length).toBeLessThan(24);
  const rects = shown().map((name) => name.getBoundingClientRect());
  for (let i = 1; i < rects.length; i++)
    expect(rects[i]!.left).toBeGreaterThan(rects[i - 1]!.right);
  // No name runs past the last cell.
  const cells = document.querySelectorAll('[data-slot="heatmap-cell"]');
  const lastCell = cells[cells.length - 1]!.getBoundingClientRect();
  expect(rects[rects.length - 1]!.right).toBeLessThanOrEqual(
    lastCell.right + 0.5,
  );
  for (const name of shown()) expect(name.textContent).toMatch(/^\d\d$/);
  // Every name stays in the grid for assistive technology.
  expect(
    document.querySelectorAll('[data-slot="heatmap-column-header"] > span'),
  ).toHaveLength(24);
  await screen.rerender(
    <div style={{ width: 1200 }}>
      <Heatmap
        label="Runs"
        rows={["Mon"]}
        columns={hours}
        values={[hours.map((_, i) => i + 1)]}
        cellLabel={() => "cell"}
      />
    </div>,
  );
  await expect.poll(() => shown().length).toBe(24);
});

test("columnLabelStep picks the smallest step whose run fits the name", () => {
  expect(columnLabelStep(30, 2, 14)).toBe(1);
  expect(columnLabelStep(8, 2, 14)).toBe(3);
  expect(columnLabelStep(0, 2, 14)).toBe(1);
  // Thinned, the edge names sit inward, so the step leaves room for them too.
  expect(columnLabelStep(12, 2, 45)).toBe(6);
  // Two edge names alone, both shifted inward toward each other, still don't touch.
  expect(columnLabelStep(12, 2, 50)).toBe(8);
});

/* ------------------------------------------------------------------------------------------------
 * Contrast: the lowest non-zero step against the zero cell, from the token values themselves.
 * `color-mix(in oklab, chart-single P%, card)` → OKLab interpolation → relative luminance.
 * ----------------------------------------------------------------------------------------------*/

type TokenTree = Record<string, unknown>;
type Oklch = [number, number, number];

function lookup(tree: TokenTree, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, key) => (node as TokenTree | undefined)?.[key],
      tree,
    );
}

function resolve(name: string, theme: TokenTree): Oklch {
  let value: unknown = (lookup(theme, name) as TokenTree | undefined)?.$value;
  if (value === undefined)
    value = (lookup(lightTokens as TokenTree, name) as TokenTree).$value;
  for (let hops = 0; typeof value === "string"; hops++) {
    if (hops > 8) throw new Error(`alias loop at ${name}`);
    const ref = value.replace(/^\{|\}$/g, "");
    const node = (lookup(theme, ref) ??
      lookup(lightTokens as TokenTree, ref) ??
      lookup(primitives as TokenTree, ref)) as TokenTree | undefined;
    if (!node) throw new Error(`unresolved ${ref}`);
    value = node.$value;
  }
  const color = value as { colorSpace: string; components: number[] };
  expect(color.colorSpace).toBe("oklch");
  return color.components as Oklch;
}

function toOklab([l, c, h]: Oklch): [number, number, number] {
  const rad = ((Number.isFinite(h) ? h : 0) * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
}

function luminance([L, a, b]: [number, number, number]): number {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(y1: number, y2: number): number {
  const [hi, lo] = y1 > y2 ? [y1, y2] : [y2, y1];
  return (hi + 0.05) / (lo + 0.05);
}

for (const [theme, tokens] of [
  ["light", lightTokens],
  ["dark", darkTokens],
] as const) {
  test(`the lowest step clears 3:1 against the zero cell — ${theme}`, () => {
    const ink = toOklab(resolve("chart-single", tokens as TokenTree));
    const card = toOklab(resolve("card", tokens as TokenTree));
    const zero = luminance(toOklab(resolve("muted", tokens as TokenTree)));
    const mix = (pct: number) =>
      luminance(
        ink.map(
          (v, i) => (v * pct) / 100 + (card[i] as number) * (1 - pct / 100),
        ) as [number, number, number],
      );
    const lowest = HEATMAP_STEPS[0];
    expect(contrast(mix(lowest), zero)).toBeGreaterThanOrEqual(3);
    // The steps climb monotonically away from the card.
    const ratios = HEATMAP_STEPS.map((pct) =>
      contrast(mix(pct), luminance(card)),
    );
    for (let i = 1; i < ratios.length; i++)
      expect(ratios[i]).toBeGreaterThan(ratios[i - 1] as number);
  });
}
