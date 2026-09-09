import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./chart";

const CONFIG = {
  desktop: { label: "Desktop", color: "chart-1" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

const DATA = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
];

// A fixed-size wrapper — Recharts' `ResponsiveContainer` renders synchronously at `ChartContainer`'s
// `initialDimension` (320×200) on first paint, but a REAL `ResizeObserver` fires right after mount in
// this browser-mode suite (no compiled Tailwind ⇒ `aspect-video`/`flex` are inert), so a parent with
// no CSS-imposed height would settle on 0×0 and unmount the chart. An explicit pixel size keeps every
// test deterministic.
const FIXED_SIZE: React.CSSProperties = { width: 300, height: 200 };

// Minimal, but type-correct, synthetic Recharts tooltip payload — `graphicalItemId` is a required
// field on `recharts`' `Payload` type (not merely presentational).
function tooltipPayload(
  overrides: Partial<RechartsPrimitive.TooltipPayloadEntry> = {},
): RechartsPrimitive.TooltipPayloadEntry {
  return {
    dataKey: "desktop",
    name: "desktop",
    value: 186,
    color: "var(--chart-1)",
    payload: DATA[0],
    graphicalItemId: "desktop",
    ...overrides,
  };
}

test("ChartContainer resolves each config entry to a --color-<key> CSS var", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <RechartsPrimitive.LineChart data={DATA}>
        <RechartsPrimitive.Line
          dataKey="desktop"
          stroke="var(--color-desktop)"
        />
      </RechartsPrimitive.LineChart>
    </ChartContainer>,
  );
  const chart = screen.container.querySelector('[data-slot="chart"]');
  expect(chart).not.toBeNull();
  // Bare token name ('chart-1') and an already-literal var() reference ('var(--chart-2)') both
  // resolve to the same `var(--chart-N)` form — see ChartContainer's file-level JSDoc.
  expect((chart as HTMLElement).style.getPropertyValue("--color-desktop")).toBe(
    "var(--chart-1)",
  );
  expect((chart as HTMLElement).style.getPropertyValue("--color-mobile")).toBe(
    "var(--chart-2)",
  );
});

test("ChartContainer omits --color-<key> for config entries with no color (label/icon-only)", async () => {
  const config = { month: { label: "Month" } } satisfies ChartConfig;
  const screen = await render(
    <ChartContainer config={config} style={FIXED_SIZE}>
      <RechartsPrimitive.LineChart data={DATA}>
        <RechartsPrimitive.Line dataKey="desktop" />
      </RechartsPrimitive.LineChart>
    </ChartContainer>,
  );
  const chart = screen.container.querySelector(
    '[data-slot="chart"]',
  ) as HTMLElement;
  expect(chart.style.getPropertyValue("--color-month")).toBe("");
});

test("ChartTooltipContent renders the label and one row per series (default dot indicator)", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartTooltipContent
        active
        label="April"
        payload={[
          tooltipPayload(),
          tooltipPayload({
            dataKey: "mobile",
            name: "mobile",
            value: 80,
            color: "var(--chart-2)",
          }),
        ]}
      />
    </ChartContainer>,
  );
  await expect.element(screen.getByText("April")).toBeInTheDocument();
  await expect.element(screen.getByText("Desktop")).toBeInTheDocument();
  await expect.element(screen.getByText("Mobile")).toBeInTheDocument();
  await expect.element(screen.getByText("186")).toBeInTheDocument();
  await expect.element(screen.getByText("80")).toBeInTheDocument();
  const indicators = screen.container.querySelectorAll(
    '[data-slot="chart-tooltip-indicator"]',
  );
  expect(indicators.length).toBe(2);
  expect(indicators[0]?.className).toContain("size-2.5"); // default "dot" indicator shape
});

test("ChartTooltipContent indicator='line' and indicator='dashed' swap the swatch shape", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <div>
        <ChartTooltipContent
          className="line-variant"
          active
          indicator="line"
          payload={[tooltipPayload()]}
        />
        <ChartTooltipContent
          className="dashed-variant"
          active
          indicator="dashed"
          payload={[tooltipPayload()]}
        />
      </div>
    </ChartContainer>,
  );
  const line = screen.container.querySelector(
    ".line-variant [data-slot='chart-tooltip-indicator']",
  );
  const dashed = screen.container.querySelector(
    ".dashed-variant [data-slot='chart-tooltip-indicator']",
  );
  expect(line?.className).toContain("w-1");
  expect(dashed?.className).toContain("border-dashed");
});

test("ChartTooltipContent hideLabel / hideIndicator suppress their respective parts", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartTooltipContent
        active
        hideLabel
        hideIndicator
        label="April"
        payload={[tooltipPayload()]}
      />
    </ChartContainer>,
  );
  expect(
    screen.container.querySelector('[data-slot="chart-tooltip-indicator"]'),
  ).toBeNull();
  const text = screen.container.textContent ?? "";
  expect(text).not.toContain("April");
  expect(text).toContain("Desktop"); // the series row itself still renders
});

test("ChartTooltipContent renders nothing while inactive", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartTooltipContent active={false} payload={[tooltipPayload()]} />
    </ChartContainer>,
  );
  expect(
    screen.container.querySelector('[data-slot="chart-tooltip-content"]'),
  ).toBeNull();
});

test("ChartLegendContent renders one row per payload entry, keyed off config", async () => {
  const legendPayload: RechartsPrimitive.LegendPayload[] = [
    { value: "desktop", dataKey: "desktop", color: "var(--chart-1)" },
    { value: "mobile", dataKey: "mobile", color: "var(--chart-2)" },
  ];
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartLegendContent payload={legendPayload} />
    </ChartContainer>,
  );
  await expect.element(screen.getByText("Desktop")).toBeInTheDocument();
  await expect.element(screen.getByText("Mobile")).toBeInTheDocument();
  const swatches = screen.container.querySelectorAll(
    '[data-slot="chart-legend-indicator"]',
  );
  expect(swatches.length).toBe(2);
  expect(
    (swatches[0] as HTMLElement).style.getPropertyValue("--color-bg"),
  ).toBe("var(--chart-1)");
});

test("ChartLegendContent renders nothing with an empty payload", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartLegendContent payload={[]} />
    </ChartContainer>,
  );
  expect(
    screen.container.querySelector('[data-slot="chart-legend-content"]'),
  ).toBeNull();
});

test("ChartContainer mounts a real Recharts chart (grid, axes, tooltip, legend) without crashing", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <RechartsPrimitive.LineChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.CartesianGrid
          vertical={false}
          stroke="var(--border)"
        />
        <RechartsPrimitive.XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
        />
        <RechartsPrimitive.YAxis tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <RechartsPrimitive.Line
          dataKey="desktop"
          stroke="var(--color-desktop)"
          strokeWidth={2}
          dot={false}
        />
        <RechartsPrimitive.Line
          dataKey="mobile"
          stroke="var(--color-mobile)"
          strokeWidth={2}
          dot={false}
        />
      </RechartsPrimitive.LineChart>
    </ChartContainer>,
  );
  const svg = screen.container.querySelector("svg.recharts-surface");
  expect(svg).not.toBeNull();
  // Two <Line> series were drawn.
  expect(screen.container.querySelectorAll(".recharts-line")).toHaveLength(2);
});

test("token purity: no hex color literal leaks into a rendered chart's style/class attributes", async () => {
  // Guards the wrapper's OWN output — not Recharts' internal SVG presentation attributes, which are
  // plain `stroke="…"`/`fill="…"` attributes, never `style=`/`class=` (see chart.tsx's file-level
  // STYLING RECHARTS PRIMITIVES note on why those are intentionally left for the consumer to set).
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <RechartsPrimitive.BarChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.CartesianGrid
          vertical={false}
          stroke="var(--border)"
        />
        <RechartsPrimitive.Bar
          dataKey="desktop"
          fill="var(--color-desktop)"
          radius={4}
        />
      </RechartsPrimitive.BarChart>
    </ChartContainer>,
  );
  const hex = /#[0-9a-fA-F]{3,8}\b/;
  for (const el of screen.container.querySelectorAll("[style], [class]")) {
    expect(el.getAttribute("style") ?? "").not.toMatch(hex);
    expect(el.getAttribute("class") ?? "").not.toMatch(hex);
  }
});

test("no a11y violations on a rendered chart with accessibilityLayer", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <RechartsPrimitive.BarChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.CartesianGrid
          vertical={false}
          stroke="var(--border)"
        />
        <RechartsPrimitive.XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent />}
        />
        <RechartsPrimitive.Bar
          dataKey="desktop"
          fill="var(--color-desktop)"
          radius={4}
        />
      </RechartsPrimitive.BarChart>
    </ChartContainer>,
  );
  // color-contrast: semantic Tailwind tokens (fill-muted-foreground, bg-popover, …) aren't compiled
  // in this fast unit-test environment, so axe can't resolve real colors — same documented exemption
  // as text-edit.test.tsx / toast.test.tsx. Real contrast is proven by the compiled-CSS gate
  // test/contrast.browser.test.tsx.
  await expectNoA11yViolations(screen.container, ["color-contrast"]);
});

/* ---------------------------------------------------------------------------------------------
 * The focusable plot (SP-05) and the type tier (B5-13).
 * ------------------------------------------------------------------------------------------- */

test("the focusable plot surface has a visible, inset focus ring", async () => {
  // Recharts' `accessibilityLayer` makes the root <svg> a tab stop, and that svg
  // IS `.recharts-surface` — so an UNSCOPED `[&_.recharts-surface]:outline-hidden`
  // suppressed the indicator on the one element the component made focusable
  // (SP-05). Specificity does not rescue it: `outline-hidden` sets
  // `--tw-outline-style: none` ON that element, and every outline utility —
  // base.css's global `:focus-visible` included — resolves `outline-style`
  // through that property, so the winning rule still computes to `none`.
  //
  // Tailwind is not compiled in this environment, so this asserts the STRUCTURE
  // that the defect violated rather than a painted pixel: the reset must exclude
  // the focused state, and width/colour must stay centralized in base.css. The
  // empirical arbiter is the state probe (0 flags on this route, light and dark).
  await render(
    <ChartContainer config={CONFIG} className="h-40 w-80">
      <RechartsPrimitive.LineChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.Line dataKey="desktop" />
      </RechartsPrimitive.LineChart>
    </ChartContainer>,
  );
  const container = document.querySelector(
    '[data-slot="chart"]',
  ) as HTMLElement;
  // The reset is scoped away from the focused element…
  expect(container.className).toContain(
    "[&_.recharts-surface:not(:focus-visible)]:outline-hidden",
  );
  // …and never lands on it unscoped, which is exactly what hid the ring.
  expect(container.className).not.toMatch(
    /\[&_\.recharts-surface\]:outline-hidden/,
  );
  // Only the OFFSET inverts locally; width and colour belong to base.css's
  // global `:focus-visible`, so a component-local copy is a regression.
  expect(container.className).toContain(
    "[&_svg:focus-visible]:-outline-offset-2",
  );
  expect(container.className).not.toMatch(
    /\[&_svg:focus-visible\]:outline-(2|ring)/,
  );
});

test("axis labels sit on the 12px tier and their numerals on the mono 11px tier", async () => {
  await render(
    <ChartContainer config={CONFIG} className="h-40 w-80">
      <RechartsPrimitive.LineChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.Line dataKey="desktop" />
      </RechartsPrimitive.LineChart>
    </ChartContainer>,
  );
  const container = document.querySelector(
    '[data-slot="chart"]',
  ) as HTMLElement;
  // 11px is reserved for mono (TD-3): prose in a chart reads at 12.
  expect(container.className).toContain("text-sm");
  expect(container.className).not.toMatch(/(^|\s)text-xs(\s|$)/);
  expect(container.className).toContain(
    "[&_.recharts-cartesian-axis-tick_text]:text-code-sm",
  );
});
