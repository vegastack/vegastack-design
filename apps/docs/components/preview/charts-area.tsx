"use client";

/**
 * `preview/charts-area.tsx` — the 10 `area` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartAreaAxes } from "../../../../packages/ui/registry/blocks/chart-area-axes/chart-area-axes";
import { ChartAreaDefault } from "../../../../packages/ui/registry/blocks/chart-area-default/chart-area-default";
import { ChartAreaGradient } from "../../../../packages/ui/registry/blocks/chart-area-gradient/chart-area-gradient";
import { ChartAreaIcons } from "../../../../packages/ui/registry/blocks/chart-area-icons/chart-area-icons";
import { ChartAreaInteractive } from "../../../../packages/ui/registry/blocks/chart-area-interactive/chart-area-interactive";
import { ChartAreaLegend } from "../../../../packages/ui/registry/blocks/chart-area-legend/chart-area-legend";
import { ChartAreaLinear } from "../../../../packages/ui/registry/blocks/chart-area-linear/chart-area-linear";
import { ChartAreaStacked } from "../../../../packages/ui/registry/blocks/chart-area-stacked/chart-area-stacked";
import { ChartAreaStackedExpand } from "../../../../packages/ui/registry/blocks/chart-area-stacked-expand/chart-area-stacked-expand";
import { ChartAreaStep } from "../../../../packages/ui/registry/blocks/chart-area-step/chart-area-step";
import { Wrapper } from "./wrapper";

/** An area chart with axes. */
export function chartAreaAxes(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaAxes />
    </Wrapper>
  );
}

/** A simple area chart. */
export function chartAreaDefault(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaDefault />
    </Wrapper>
  );
}

/** An area chart with gradient fill. */
export function chartAreaGradient(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaGradient />
    </Wrapper>
  );
}

/** An area chart with icons. */
export function chartAreaIcons(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaIcons />
    </Wrapper>
  );
}

/** An interactive area chart. */
export function chartAreaInteractive(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaInteractive />
    </Wrapper>
  );
}

/** An area chart with a legend. */
export function chartAreaLegend(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaLegend />
    </Wrapper>
  );
}

/** A linear area chart. */
export function chartAreaLinear(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaLinear />
    </Wrapper>
  );
}

/** A stacked area chart. */
export function chartAreaStacked(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaStacked />
    </Wrapper>
  );
}

/** A stacked area chart with expand stacking. */
export function chartAreaStackedExpand(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaStackedExpand />
    </Wrapper>
  );
}

/** A step area chart. */
export function chartAreaStep(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartAreaStep />
    </Wrapper>
  );
}
