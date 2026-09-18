"use client";

/**
 * `preview/charts-tooltip.tsx` — the 9 `tooltip` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartTooltipAdvanced } from "../../../../packages/ui/registry/blocks/chart-tooltip-advanced/chart-tooltip-advanced";
import { ChartTooltipDefault } from "../../../../packages/ui/registry/blocks/chart-tooltip-default/chart-tooltip-default";
import { ChartTooltipFormatter } from "../../../../packages/ui/registry/blocks/chart-tooltip-formatter/chart-tooltip-formatter";
import { ChartTooltipIcons } from "../../../../packages/ui/registry/blocks/chart-tooltip-icons/chart-tooltip-icons";
import { ChartTooltipIndicatorLine } from "../../../../packages/ui/registry/blocks/chart-tooltip-indicator-line/chart-tooltip-indicator-line";
import { ChartTooltipIndicatorNone } from "../../../../packages/ui/registry/blocks/chart-tooltip-indicator-none/chart-tooltip-indicator-none";
import { ChartTooltipLabelCustom } from "../../../../packages/ui/registry/blocks/chart-tooltip-label-custom/chart-tooltip-label-custom";
import { ChartTooltipLabelFormatter } from "../../../../packages/ui/registry/blocks/chart-tooltip-label-formatter/chart-tooltip-label-formatter";
import { ChartTooltipLabelNone } from "../../../../packages/ui/registry/blocks/chart-tooltip-label-none/chart-tooltip-label-none";
import { Wrapper } from "./wrapper";

/** A stacked bar chart with a legend. */
export function chartTooltipAdvanced(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipAdvanced />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipDefault(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipDefault />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipFormatter(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipFormatter />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipIcons(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipIcons />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipIndicatorLine(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipIndicatorLine />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipIndicatorNone(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipIndicatorNone />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipLabelCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipLabelCustom />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipLabelFormatter(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipLabelFormatter />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartTooltipLabelNone(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartTooltipLabelNone />
    </Wrapper>
  );
}
