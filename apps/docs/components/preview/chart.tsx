'use client';

import type { ReactNode } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/chart` (dogfoods the registry) → auto-scanned.
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

// Static, deterministic data — these demos are screenshotted by VRT, so no Math.random()/Date.now().
// Also the seed data the Phase S dashboard's chart examples are expected to reuse.
const monthlyData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 173, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: { label: 'Desktop', color: 'chart-1' },
  mobile: { label: 'Mobile', color: 'chart-2' },
} satisfies ChartConfig;

const chartConfigWithIcons = {
  desktop: { label: 'Desktop', color: 'chart-1', icon: Monitor },
  mobile: { label: 'Mobile', color: 'chart-2', icon: Smartphone },
} satisfies ChartConfig;

export function chartDemoArea(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={chartConfig} className="h-56 w-full">
        {/* `margin.left` keeps the first X tick ("Jan") from clipping at the chart edge. */}
        <AreaChart accessibilityLayer data={monthlyData} margin={{ left: 12 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent />} />
          <Area
            dataKey="mobile"
            type="natural"
            stackId="a"
            fill="var(--color-mobile)"
            fillOpacity={0.4}
            stroke="var(--color-mobile)"
          />
          <Area
            dataKey="desktop"
            type="natural"
            stackId="a"
            fill="var(--color-desktop)"
            fillOpacity={0.4}
            stroke="var(--color-desktop)"
          />
        </AreaChart>
      </ChartContainer>
    </Wrapper>
  );
}

export function chartDemoBar(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart accessibilityLayer data={monthlyData}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </Wrapper>
  );
}

export function chartDemoLine(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <LineChart accessibilityLayer data={monthlyData}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent />} />
          <Line
            dataKey="desktop"
            type="natural"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-desktop)', r: 3 }}
          />
          <Line
            dataKey="mobile"
            type="natural"
            stroke="var(--color-mobile)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-mobile)', r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </Wrapper>
  );
}

// `defaultIndex` pins the tooltip open at a fixed data point with zero interaction (a real recharts
// 3 feature, not a hack) — deterministic for VRT, unlike a hover-triggered tooltip.
export function chartDemoTooltipVariants(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {(['dot', 'line', 'dashed'] as const).map((indicator) => (
          <div key={indicator} className="flex flex-col gap-2">
            <p className="text-center text-label-sm text-muted-foreground">{indicator}</p>
            <ChartContainer config={chartConfig} className="h-40 w-full">
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  defaultIndex={2}
                  cursor={{ fill: 'var(--muted)' }}
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

export function chartDemoLegend(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ChartContainer config={chartConfigWithIcons} className="h-56 w-full">
        {/* `margin.left` keeps the first X tick ("Jan") from clipping at the chart edge. */}
        <LineChart accessibilityLayer data={monthlyData} margin={{ left: 12 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
          <Line dataKey="mobile" type="natural" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </Wrapper>
  );
}
