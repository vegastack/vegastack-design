/*
 * `chart` — upstream's file plus `packages/ui/upstream/patches/chart.patch` (DOC-1, DOC-2, FOC-1,
 * FOC-9).
 *
 * WHY THIS FILE COMPILES CSS, WHEN ALMOST NO OTHER COMPONENT TEST DOES
 *   FOC-1 is a claim about what PAINTS. Upstream's `[&_.recharts-surface]:outline-hidden` compiles
 *   to `--tw-outline-style: none` on the very element recharts makes focusable (`role="application"`
 *   `tabIndex={0}`, since `accessibilityLayer` defaults to `true` in 3.9.2+), and every outline
 *   utility — `base.css`'s global `:focus-visible` included — resolves `outline-style` through that
 *   custom property. So the defect is invisible to any assertion that reads class strings: the
 *   classes are all present and correct, and the ring still does not draw.
 *
 *   Importing `test/geometry.css` (the same lane stylesheet `sidebar.test.tsx` uses) compiles the
 *   REAL token theme, `base.css` and this file's own utilities, so the FOC-1 and FOC-9 assertions
 *   below are `getComputedStyle` MEASUREMENTS of a focused surface rather than a restatement of the
 *   patch. `@source '../registry/ui/**\/*.tsx'` in that stylesheet covers both `chart.tsx` and this
 *   test file, so every class either of them writes is generated.
 */
import "../../test/geometry.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { isTransparent } from "../../test/color";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./chart";

const CONFIG = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

const DATA = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
];

// Upstream's `labelKey`/`nameKey` example: the config key lives in the DATA row, not in the series
// key, which is the whole point of those two props.
const BROWSER_CONFIG = {
  visitors: { label: "Total Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
} satisfies ChartConfig;

/**
 * `ResponsiveContainer` measures its parent. `ChartContainer`'s `initialDimension` (320×200) covers
 * the first synchronous paint, but a REAL `ResizeObserver` fires straight after mount here, so a
 * parent with no resolved height settles on 0×0 and unmounts the plot. An explicit pixel box keeps
 * every assertion deterministic — and, for the focus measurements, keeps the surface on screen.
 */
const FIXED_SIZE: React.CSSProperties = { width: 320, height: 200 };

/** A type-correct synthetic tooltip payload row (`graphicalItemId` is required, not decorative). */
function payloadRow(
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

/** The tooltip's indicator swatch — the only node carrying the `--color-bg` custom property. */
const indicators = (root: ParentNode) => [
  ...root.querySelectorAll<HTMLElement>('[style*="--color-bg"]'),
];

/** Every `class` attribute in a tree, SVG nodes included (their `className` is not a string). */
const classAttributes = (root: Element) =>
  [root, ...root.querySelectorAll("*")].map(
    (element) => element.getAttribute("class") ?? "",
  );

/** A real chart, mounted at a fixed size, with everything upstream's walkthrough builds up. */
function FullChart(
  props: Partial<React.ComponentProps<typeof ChartContainer>> = {},
) {
  return (
    <ChartContainer config={CONFIG} style={FIXED_SIZE} {...props}>
      <RechartsPrimitive.BarChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.CartesianGrid vertical={false} />
        <RechartsPrimitive.XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <RechartsPrimitive.Bar
          dataKey="desktop"
          fill="var(--color-desktop)"
          radius={4}
        />
        <RechartsPrimitive.Bar
          dataKey="mobile"
          fill="var(--color-mobile)"
          radius={4}
        />
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  );
}

/** The plot surface, once `ResponsiveContainer` has measured. */
async function surfaceOf(container: Element): Promise<SVGSVGElement> {
  await expect
    .poll(() => container.querySelector("svg.recharts-surface"))
    .not.toBeNull();
  return container.querySelector("svg.recharts-surface") as SVGSVGElement;
}

/* ---------------------------------------------------------------------------------------------
 * Parts, and the pieces every example is built from.
 * ------------------------------------------------------------------------------------------- */

test("renders, and every exported part renders (Usage)", async () => {
  const screen = await render(
    <>
      <FullChart />
      <div data-testid="tooltip">
        <ChartContainer config={CONFIG} style={FIXED_SIZE}>
          <ChartTooltipContent
            active
            label="January"
            payload={[payloadRow()]}
          />
        </ChartContainer>
      </div>
      <div data-testid="legend">
        <ChartContainer config={CONFIG} style={FIXED_SIZE}>
          <ChartLegendContent
            payload={[{ value: "desktop", dataKey: "desktop", color: "red" }]}
          />
        </ChartContainer>
      </div>
    </>,
  );
  const chart = screen.container.querySelector('[data-slot="chart"]');
  expect(chart).not.toBeNull();
  await surfaceOf(screen.container);
  // ChartStyle is mounted by ChartContainer and emits a real <style> element.
  expect(screen.container.querySelector("style")).not.toBeNull();
  expect(screen.getByTestId("tooltip").element().textContent).toContain(
    "Desktop",
  );
  expect(screen.getByTestId("legend").element().textContent).toContain(
    "Desktop",
  );
});

test("Component: ChartTooltip and ChartLegend ARE recharts' own parts — nothing is wrapped", () => {
  expect(ChartTooltip).toBe(RechartsPrimitive.Tooltip);
  expect(ChartLegend).toBe(RechartsPrimitive.Legend);
});

test("Component: a container stamps data-slot and a unique data-chart id per instance", async () => {
  const screen = await render(
    <>
      <FullChart />
      <FullChart />
    </>,
  );
  const charts = [
    ...screen.container.querySelectorAll<HTMLElement>('[data-slot="chart"]'),
  ];
  expect(charts).toHaveLength(2);
  for (const chart of charts)
    expect(chart.dataset.chart).toMatch(/^chart-[^:]+$/);
  expect(charts[0]?.dataset.chart).not.toBe(charts[1]?.dataset.chart);
});

/* ---------------------------------------------------------------------------------------------
 * Chart Config, and Theming — ChartStyle is the whole mechanism.
 * ------------------------------------------------------------------------------------------- */

test("Theming: ChartStyle emits --color-<key> for BOTH themes, scoped to the chart id", async () => {
  const screen = await render(<ChartStyle id="chart-theme" config={CONFIG} />);
  const css = screen.container.querySelector("style")?.textContent ?? "";
  // Light: the bare `[data-chart=…]` selector. Dark: the same, prefixed with `.dark`.
  expect(css).toMatch(/(^|\n)\s*\[data-chart=chart-theme\] \{/);
  expect(css).toMatch(/\.dark \[data-chart=chart-theme\] \{/);
  // One declaration per config entry, in each theme.
  expect(css.match(/--color-desktop: var\(--chart-1\);/g) ?? []).toHaveLength(
    2,
  );
  expect(css.match(/--color-mobile: var\(--chart-2\);/g) ?? []).toHaveLength(2);
});

test("Theming: a { light, dark } theme pair writes a DIFFERENT value per theme", async () => {
  const themed = {
    desktop: {
      label: "Desktop",
      theme: { light: "var(--chart-1)", dark: "var(--chart-3)" },
    },
  } satisfies ChartConfig;
  const screen = await render(<ChartStyle id="chart-pair" config={themed} />);
  const css = screen.container.querySelector("style")?.textContent ?? "";
  const [light, dark] = css.split(".dark [data-chart=chart-pair]");
  expect(light).toContain("--color-desktop: var(--chart-1);");
  expect(dark).toContain("--color-desktop: var(--chart-3);");
});

test("Theming: a single-series chart is drawn in var(--chart-single), not hue 1 of 8 (D29)", async () => {
  const single = {
    desktop: { label: "Desktop", color: "var(--chart-single)" },
  } satisfies ChartConfig;
  const screen = await render(<ChartStyle id="chart-one" config={single} />);
  const css = screen.container.querySelector("style")?.textContent ?? "";
  expect(css).toContain("--color-desktop: var(--chart-single);");
  expect(css).not.toContain("--chart-1");
});

test("Chart Config: an entry with no colour emits no custom property, and a colourless config emits no <style>", async () => {
  const screen = await render(
    <>
      <ChartStyle
        id="chart-partial"
        config={{
          desktop: { label: "Desktop", color: "var(--chart-1)" },
          month: { label: "Month" },
        }}
      />
      <div data-testid="empty">
        <ChartStyle id="chart-empty" config={{ month: { label: "Month" } }} />
      </div>
    </>,
  );
  const css = screen.container.querySelector("style")?.textContent ?? "";
  expect(css).toContain("--color-desktop");
  expect(css).not.toContain("--color-month");
  expect(
    screen.getByTestId("empty").element().querySelector("style"),
  ).toBeNull();
});

test("Chart Config: `icon` replaces the swatch in both the tooltip and the legend", async () => {
  function Dot() {
    return <svg data-testid="config-icon" />;
  }
  const config = {
    desktop: { label: "Desktop", color: "var(--chart-1)", icon: Dot },
  } satisfies ChartConfig;
  const screen = await render(
    <ChartContainer config={config} style={FIXED_SIZE}>
      <div>
        <ChartTooltipContent active label="January" payload={[payloadRow()]} />
        <ChartLegendContent
          payload={[{ value: "desktop", dataKey: "desktop", color: "red" }]}
        />
      </div>
    </ChartContainer>,
  );
  expect(
    screen.container.querySelectorAll('[data-testid="config-icon"]'),
  ).toHaveLength(2);
  // The icon takes the swatch's place rather than sitting beside it.
  expect(indicators(screen.container)).toHaveLength(0);
});

/* ---------------------------------------------------------------------------------------------
 * Your First Chart, and Updating to Recharts v3.
 * ------------------------------------------------------------------------------------------- */

test("Your First Chart: grid, axis, tooltip cursor and legend all render on one chart", async () => {
  const screen = await render(<FullChart />);
  await surfaceOf(screen.container);
  expect(
    screen.container.querySelector(".recharts-cartesian-grid"),
  ).not.toBeNull();
  expect(screen.container.querySelector(".recharts-xAxis")).not.toBeNull();
  // Two <Bar> series were drawn, one per config entry.
  expect(
    screen.container.querySelectorAll(".recharts-bar").length,
  ).toBeGreaterThanOrEqual(2);
  // The legend reads its labels from the config, not from the dataKey.
  await expect.poll(() => screen.container.textContent).toContain("Desktop");
});

test("Updating to Recharts v3: `defaultIndex` opens the tooltip with no interaction at all", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <RechartsPrimitive.BarChart accessibilityLayer data={DATA}>
        <RechartsPrimitive.XAxis dataKey="month" />
        <ChartTooltip defaultIndex={1} content={<ChartTooltipContent />} />
        <RechartsPrimitive.Bar
          dataKey="desktop"
          fill="var(--color-desktop)"
          radius={4}
        />
      </RechartsPrimitive.BarChart>
    </ChartContainer>,
  );
  await surfaceOf(screen.container);
  await expect
    .poll(() => screen.container.querySelector(".recharts-tooltip-wrapper"))
    .not.toBeNull();
  await expect.poll(() => screen.container.textContent).toContain("February");
});

/* ---------------------------------------------------------------------------------------------
 * Tooltip.
 * ------------------------------------------------------------------------------------------- */

test("Tooltip: the label sits above one row per series, with a value from the payload", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartTooltipContent
        active
        label="January"
        payload={[
          payloadRow(),
          payloadRow({
            dataKey: "mobile",
            name: "mobile",
            value: 80,
            color: "var(--chart-2)",
            graphicalItemId: "mobile",
          }),
        ]}
      />
    </ChartContainer>,
  );
  // Scoped to the rendered container on purpose: recharts keeps ONE global
  // `#recharts_measurement_span` on `document.body` holding whatever text it last measured, so a
  // page-wide text query can match an axis tick from an earlier render instead of the tooltip.
  const text = screen.container.textContent ?? "";
  for (const expected of ["January", "Desktop", "Mobile", "186", "80"])
    expect(text).toContain(expected);
  expect(indicators(screen.container)).toHaveLength(2);
});

test("Tooltip: `indicator` swaps the swatch between dot, line and dashed", async () => {
  for (const [indicator, expected] of [
    ["dot", "h-2.5"],
    ["line", "w-1"],
    ["dashed", "border-dashed"],
  ] as const) {
    const screen = await render(
      <ChartContainer config={CONFIG} style={FIXED_SIZE}>
        <ChartTooltipContent
          active
          indicator={indicator}
          label="January"
          payload={[payloadRow()]}
        />
      </ChartContainer>,
    );
    const swatch = indicators(screen.container).at(0);
    expect(swatch, `indicator="${indicator}" rendered no swatch`).toBeTruthy();
    expect(swatch!.className).toContain(expected);
    expect(swatch!.style.getPropertyValue("--color-bg")).toBe("var(--chart-1)");
  }
});

test("Tooltip: `hideLabel` drops the label and `hideIndicator` drops the swatch", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartTooltipContent
        active
        hideLabel
        hideIndicator
        label="January"
        payload={[payloadRow()]}
      />
    </ChartContainer>,
  );
  expect(screen.container.textContent).not.toContain("January");
  expect(screen.container.textContent).toContain("Desktop");
  expect(indicators(screen.container)).toHaveLength(0);
});

test("Tooltip: `labelKey` and `nameKey` read the config through the data row", async () => {
  const screen = await render(
    <ChartContainer config={BROWSER_CONFIG} style={FIXED_SIZE}>
      <ChartTooltipContent
        active
        labelKey="visitors"
        nameKey="browser"
        payload={[
          payloadRow({
            dataKey: "visitors",
            name: "visitors",
            value: 275,
            payload: { browser: "chrome", visitors: 275 },
            graphicalItemId: "visitors",
          }),
        ]}
      />
    </ChartContainer>,
  );
  const text = screen.container.textContent ?? "";
  expect(text).toContain("Total Visitors");
  expect(text).toContain("Chrome");
});

test("Tooltip: nothing renders while inactive or while the payload is empty", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <div data-testid="states">
        <ChartTooltipContent label="January" payload={[payloadRow()]} />
        <ChartTooltipContent active label="January" payload={[]} />
      </div>
    </ChartContainer>,
  );
  expect(screen.getByTestId("states").element().textContent).toBe("");
});

/* ---------------------------------------------------------------------------------------------
 * Legend.
 * ------------------------------------------------------------------------------------------- */

test("Legend: one entry per payload item, labelled from the config", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <ChartLegendContent
        payload={[
          { value: "desktop", dataKey: "desktop", color: "var(--chart-1)" },
          { value: "mobile", dataKey: "mobile", color: "var(--chart-2)" },
        ]}
      />
    </ChartContainer>,
  );
  const text = screen.container.textContent ?? "";
  expect(text).toContain("Desktop");
  expect(text).toContain("Mobile");
});

test("Legend: `nameKey` takes the name from the data key instead of the series key", async () => {
  const screen = await render(
    <ChartContainer config={BROWSER_CONFIG} style={FIXED_SIZE}>
      <ChartLegendContent
        nameKey="browser"
        payload={[
          {
            value: "chrome",
            dataKey: "visitors",
            color: "var(--chart-1)",
            payload: { browser: "chrome", visitors: 275 },
          },
        ]}
      />
    </ChartContainer>,
  );
  expect(screen.container.textContent).toContain("Chrome");
});

test("Legend: `verticalAlign` moves the padding, and an empty payload renders nothing", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <div data-testid="top">
        <ChartLegendContent
          verticalAlign="top"
          payload={[
            { value: "desktop", dataKey: "desktop", color: "var(--chart-1)" },
          ]}
        />
      </div>
      <div data-testid="empty">
        <ChartLegendContent payload={[]} />
      </div>
    </ChartContainer>,
  );
  const top = screen.getByTestId("top").element().firstElementChild;
  expect(top?.className).toContain("pb-3");
  expect(top?.className).not.toContain("pt-3");
  expect(screen.getByTestId("empty").element().textContent).toBe("");
});

/* ---------------------------------------------------------------------------------------------
 * RTL.
 * ------------------------------------------------------------------------------------------- */

test("RTL: `reversed` runs the category axis right-to-left", async () => {
  function Axis({ reversed }: { reversed: boolean }) {
    return (
      <ChartContainer config={CONFIG} style={FIXED_SIZE}>
        <RechartsPrimitive.BarChart accessibilityLayer data={DATA}>
          <RechartsPrimitive.XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            reversed={reversed}
          />
          <RechartsPrimitive.Bar
            dataKey="desktop"
            fill="var(--color-desktop)"
          />
        </RechartsPrimitive.BarChart>
      </ChartContainer>
    );
  }
  // Both axes are mounted in ONE render, at the same fixed size, so the two tick geometries are
  // read from the same layout pass and compare directly.
  const screen = await render(
    <>
      <div data-testid="ltr">
        <Axis reversed={false} />
      </div>
      <div dir="rtl" data-testid="rtl">
        <Axis reversed />
      </div>
    </>,
  );

  const tickX = async (testid: string, label: string) => {
    const root = screen.getByTestId(testid).element();
    await expect
      .poll(
        () =>
          root.querySelectorAll(".recharts-cartesian-axis-tick-value").length,
      )
      .toBeGreaterThan(0);
    const tick = [
      ...root.querySelectorAll<SVGTextElement>(
        ".recharts-cartesian-axis-tick-value",
      ),
    ].find((node) => node.textContent === label);
    expect(tick, `no "${label}" tick in the ${testid} axis`).toBeTruthy();
    return Number.parseFloat(tick!.getAttribute("x") ?? "0");
  };

  // The first category starts on the left in LTR and on the right in RTL.
  expect(await tickX("rtl", "January")).toBeGreaterThan(
    await tickX("ltr", "January"),
  );
});

/* ---------------------------------------------------------------------------------------------
 * Accessibility — and the two exceptions the patch implements.
 * ------------------------------------------------------------------------------------------- */

test("Accessibility: `accessibilityLayer` makes the plot surface a keyboard-reachable control", async () => {
  const screen = await render(<FullChart />);
  const surface = await surfaceOf(screen.container);
  expect(surface.getAttribute("role")).toBe("application");
  expect(surface.getAttribute("tabindex")).toBe("0");
});

test("FOC-1: the KEYBOARD-FOCUSED plot surface actually PAINTS the global outline", async () => {
  // The measurement the patch header promises. `outline-hidden` compiles to
  // `--tw-outline-style: none` ON the focused element, so an unscoped reset leaves every class
  // string looking right while the ring resolves to `outline-style: none`. Only a computed style
  // can tell the two apart — which is why this test compiles CSS.
  const screen = await render(<FullChart />);
  const surface = await surfaceOf(screen.container);

  // At rest, upstream's reset still applies — that is all it was ever for.
  await expect.poll(() => getComputedStyle(surface).outlineStyle).toBe("none");

  await userEvent.tab();
  expect(document.activeElement).toBe(surface);

  // Polled, not read once: Chromium resolves the winning `outline-*` declarations on the next
  // style recalc, so the first synchronous read after the Tab can still report the initial value
  // (measured 2026-09-18 — `outline-offset` reads `0px` immediately and `-2px` one frame later).
  await expect
    .poll(() => {
      const style = getComputedStyle(surface);
      return {
        outlineStyle: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
        transparent: isTransparent(style.outlineColor),
      };
    })
    // An AUTHORED outline: the user agent's own ring (`auto`) is not an affordance this system
    // ships, and `none` is the defect FOC-1 fixes.
    .toEqual({ outlineStyle: "solid", width: 2, transparent: false });
});

test("FOC-9: the focused surface's outline is INSET, so it is not clipped by the plot edge", async () => {
  const screen = await render(<FullChart />);
  const surface = await surfaceOf(screen.container);
  await userEvent.tab();
  expect(document.activeElement).toBe(surface);
  // `base.css` ships `outline-offset: 1px`; FOC-9 is the one permitted local deviation and it
  // moves the OFFSET only — width and colour stay global.
  await expect
    .poll(() => Number.parseFloat(getComputedStyle(surface).outlineOffset))
    .toBeLessThan(0);
  const focused = getComputedStyle(surface);
  expect(Number.parseFloat(focused.outlineWidth)).toBe(2);
});

test("FOC-1/FOC-6: no focus-ring glow survives anywhere in a rendered chart", async () => {
  const screen = await render(
    <>
      <FullChart />
      <ChartContainer config={CONFIG} style={FIXED_SIZE}>
        <div>
          <ChartTooltipContent
            active
            label="January"
            payload={[payloadRow()]}
          />
          <ChartLegendContent
            payload={[
              { value: "desktop", dataKey: "desktop", color: "var(--chart-1)" },
            ]}
          />
        </div>
      </ChartContainer>
    </>,
  );
  await surfaceOf(screen.container);
  for (const className of classAttributes(screen.container)) {
    expect(className).not.toMatch(/\bring-3\b/);
    expect(className).not.toMatch(/\bring-ring\//);
    expect(className).not.toMatch(/focus-visible:ring-/);
  }
});

test("no a11y violations: a rendered chart at rest", async () => {
  const screen = await render(<FullChart />);
  await surfaceOf(screen.container);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations: the tooltip content, in every indicator shape", async () => {
  const screen = await render(
    <ChartContainer config={CONFIG} style={FIXED_SIZE}>
      <div>
        {(["dot", "line", "dashed"] as const).map((indicator) => (
          <ChartTooltipContent
            key={indicator}
            active
            indicator={indicator}
            label="January"
            payload={[
              payloadRow(),
              payloadRow({
                dataKey: "mobile",
                name: "mobile",
                value: 80,
                color: "var(--chart-2)",
                graphicalItemId: "mobile",
              }),
            ]}
          />
        ))}
      </div>
    </ChartContainer>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations: the legend content, with and without icons", async () => {
  function Dot() {
    return <svg aria-hidden="true" />;
  }
  const screen = await render(
    <ChartContainer
      config={{
        desktop: { label: "Desktop", color: "var(--chart-1)", icon: Dot },
        mobile: { label: "Mobile", color: "var(--chart-2)" },
      }}
      style={FIXED_SIZE}
    >
      <div>
        <ChartLegendContent
          payload={[
            { value: "desktop", dataKey: "desktop", color: "var(--chart-1)" },
            { value: "mobile", dataKey: "mobile", color: "var(--chart-2)" },
          ]}
        />
        <ChartLegendContent
          hideIcon
          payload={[
            { value: "desktop", dataKey: "desktop", color: "var(--chart-1)" },
          ]}
        />
      </div>
    </ChartContainer>,
  );
  await expectNoA11yViolations(screen.container);
});
