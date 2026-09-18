"use client";

import type { ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chart` (dogfoods the registry) → auto-scanned.
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Upstream's own examples (vendor/shadcn/4.21.0/docs/chart.md), adapted only for:
 *
 *   - import paths (`@/components/ui/chart`);
 *   - SERIES COLOUR. Upstream's walkthrough hard-codes `#2563eb` / `#60a5fa` in the config, which
 *     `design-lint`'s `hex-color` rule rejects in this repository (COL-20). Upstream's OWN theming
 *     section names `var(--chart-1)` … `var(--chart-5)` as the recommended form, and MK kept our
 *     8-hue palette on 2026-09-18 precisely so those names keep meaning something, so every
 *     example here uses them. A single-series chart is drawn in `var(--chart-single)` (D29).
 *   - RTL. Upstream's `ChartRtl` imports a `useTranslation` / `language-selector` pair that does
 *     not exist here, so the Arabic strings are inlined and `dir` is fixed to `rtl`.
 *
 * Nothing is redesigned. Every preview is deterministic — fixed data, no timers, no randomness —
 * because these fixtures are also mounted by the geometry browser lane. Where upstream's example
 * depends on a hover, `ChartTooltip`'s own `defaultIndex` pins the tooltip open instead; that is a
 * real recharts 3 prop (and the one upstream's "Updating to Recharts v3" note points at), not a
 * test hook.
 */

const monthlyData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const seriesConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

// Upstream's Chart Config section: label + icon + colour, all three decoupled from the data.
const iconConfig = {
  desktop: { label: "Desktop", icon: Monitor, color: "var(--chart-1)" },
  mobile: { label: "Mobile", icon: Smartphone, color: "var(--chart-2)" },
} satisfies ChartConfig;

// D29 (COL-19): one series carries no categorical distinction, so it is drawn in the single-series
// ink rather than in hue 1 of 8.
const singleSeriesConfig = {
  desktop: { label: "Desktop", color: "var(--chart-single)" },
} satisfies ChartConfig;

// Upstream's `labelKey` / `nameKey` example — the config key comes from the DATA (`browser`), not
// from the series key, which is what those two props exist to express.
const browserData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
];

const browserConfig = {
  visitors: { label: "Total Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig;

const shortMonth = (value: string) => value.slice(0, 3);

/** The hero: upstream's "Build your chart" step — a container, a chart, two series. */
export function chart(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={seriesConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={monthlyData}>
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}

/**
 * Component — composition, not a wrapper: recharts' own `BarChart`/`Bar` do the drawing, and the
 * only thing brought in from `chart` is the tooltip.
 */
export function chartComponent(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={seriesConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={monthlyData}>
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <ChartTooltip defaultIndex={2} content={<ChartTooltipContent />} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}

/**
 * Updating to Recharts v3 — all four of upstream's migration rules in one chart: `var(--chart-N)`
 * rather than `hsl(var(--chart-N))`, `ChartTooltip.defaultIndex` for the initial tooltip only, no
 * `layout` on `<Bar>` when `<BarChart>` already declares it, and a `min-h-*` on the container so
 * `ResponsiveContainer` can measure on first render.
 */
export function chartUpdatingToRechartsV3(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={seriesConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer layout="vertical" data={monthlyData}>
          <XAxis type="number" dataKey="desktop" hide />
          <YAxis
            type="category"
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={64}
            tickFormatter={shortMonth}
          />
          <ChartTooltip defaultIndex={1} content={<ChartTooltipContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}

/** Your First Chart — the finished walkthrough: grid, axis, tooltip and legend. */
export function chartYourFirstChart(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={seriesConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={monthlyData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={shortMonth}
          />
          <ChartTooltip defaultIndex={3} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}

/**
 * Chart Config — labels, icons and colours live in the config, decoupled from the data, and both
 * the tooltip and the legend read them from there.
 */
export function chartChartConfig(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={iconConfig} className="min-h-[200px] w-full">
        <LineChart
          accessibilityLayer
          data={monthlyData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={shortMonth}
          />
          <ChartTooltip defaultIndex={2} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey="desktop"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="mobile"
            stroke="var(--color-mobile)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Wrapper>
  );
}

/**
 * Theming — the categorical ramp on the left (five of the eight hues, named exactly as upstream's
 * own examples name them), the single-series ink on the right.
 */
export function chartTheming(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Five series — <code>var(--chart-1)</code> …{" "}
            <code>var(--chart-5)</code>
          </p>
          <ChartContainer
            config={browserConfig}
            className="min-h-[180px] w-full"
          >
            <BarChart accessibilityLayer data={browserData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="browser"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                defaultIndex={0}
                content={<ChartTooltipContent nameKey="browser" hideLabel />}
              />
              <Bar dataKey="visitors" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            One series — <code>var(--chart-single)</code>
          </p>
          <ChartContainer
            config={singleSeriesConfig}
            className="min-h-[180px] w-full"
          >
            <BarChart accessibilityLayer data={monthlyData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={shortMonth}
              />
              <ChartTooltip
                defaultIndex={2}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </Wrapper>
  );
}

/**
 * Tooltip — the three indicator shapes upstream documents, each pinned open with `defaultIndex` so
 * the difference is readable without a hover.
 */
export function chartTooltip(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {(["dot", "line", "dashed"] as const).map((indicator) => (
          <div key={indicator} className="flex flex-col gap-2">
            <p className="text-center text-xs text-muted-foreground">
              indicator=&quot;{indicator}&quot;
            </p>
            <ChartContainer
              config={singleSeriesConfig}
              className="min-h-[160px] w-full"
            >
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={shortMonth}
                />
                <ChartTooltip
                  defaultIndex={2}
                  content={<ChartTooltipContent indicator={indicator} />}
                />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/**
 * Legend — `nameKey="browser"` takes the legend names from the data key rather than the series
 * key, which is upstream's Legend → Custom example.
 */
export function chartLegend(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={browserConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={browserData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="browser"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            defaultIndex={1}
            content={
              <ChartTooltipContent labelKey="visitors" nameKey="browser" />
            }
          />
          <ChartLegend content={<ChartLegendContent nameKey="browser" />} />
          <Bar dataKey="visitors" radius={4} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}

/**
 * Accessibility — `accessibilityLayer` makes the plot a tab stop (`role="application"`,
 * `tabIndex={0}`) with arrow-key traversal and a live description of the focused point. Tab into
 * the chart below: the global 2px `:focus-visible` outline draws on the plot itself, inset so it
 * is not clipped by the container edge (FOC-1, FOC-9).
 */
export function chartAccessibility(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={seriesConfig} className="min-h-[200px] w-full">
        <LineChart
          accessibilityLayer
          data={monthlyData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={shortMonth}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="desktop"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="mobile"
            stroke="var(--color-mobile)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Wrapper>
  );
}

const arabic = {
  january: "يناير",
  february: "فبراير",
  march: "مارس",
  april: "أبريل",
  may: "مايو",
  june: "يونيو",
  desktop: "سطح المكتب",
  mobile: "الجوال",
} as const;

const rtlConfig = {
  desktop: { label: arabic.desktop, color: "var(--chart-2)" },
  mobile: { label: arabic.mobile, color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * RTL — the chart itself has no direction-aware styling; what flips is the axis. `XAxis reversed`
 * runs the categories right-to-left and the grid hangs off the right-hand axis, exactly as
 * upstream's own RTL example does.
 */
export function chartRtl(): ReactNode {
  return (
    <Wrapper dir="rtl" className="flex-col items-stretch">
      <ChartContainer config={rtlConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={monthlyData}>
          <CartesianGrid vertical={false} orientation="right" />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) =>
              arabic[value.toLowerCase() as keyof typeof arabic]
            }
            reversed
          />
          <ChartTooltip
            defaultIndex={2}
            labelClassName="w-32"
            content={
              <ChartTooltipContent
                labelFormatter={(value) =>
                  arabic[String(value).toLowerCase() as keyof typeof arabic]
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}
