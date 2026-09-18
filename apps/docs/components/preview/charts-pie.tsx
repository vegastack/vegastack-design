"use client";

/**
 * `preview/charts-pie.tsx` — the 11 `pie` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartPieDonut } from "../../../../packages/ui/registry/blocks/chart-pie-donut/chart-pie-donut";
import { ChartPieDonutActive } from "../../../../packages/ui/registry/blocks/chart-pie-donut-active/chart-pie-donut-active";
import { ChartPieDonutText } from "../../../../packages/ui/registry/blocks/chart-pie-donut-text/chart-pie-donut-text";
import { ChartPieInteractive } from "../../../../packages/ui/registry/blocks/chart-pie-interactive/chart-pie-interactive";
import { ChartPieLabel } from "../../../../packages/ui/registry/blocks/chart-pie-label/chart-pie-label";
import { ChartPieLabelCustom } from "../../../../packages/ui/registry/blocks/chart-pie-label-custom/chart-pie-label-custom";
import { ChartPieLabelList } from "../../../../packages/ui/registry/blocks/chart-pie-label-list/chart-pie-label-list";
import { ChartPieLegend } from "../../../../packages/ui/registry/blocks/chart-pie-legend/chart-pie-legend";
import { ChartPieSeparatorNone } from "../../../../packages/ui/registry/blocks/chart-pie-separator-none/chart-pie-separator-none";
import { ChartPieSimple } from "../../../../packages/ui/registry/blocks/chart-pie-simple/chart-pie-simple";
import { ChartPieStacked } from "../../../../packages/ui/registry/blocks/chart-pie-stacked/chart-pie-stacked";
import { Wrapper } from "./wrapper";

/** A donut chart. */
export function chartPieDonut(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieDonut />
    </Wrapper>
  );
}

/** A donut chart with an active sector. */
export function chartPieDonutActive(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieDonutActive />
    </Wrapper>
  );
}

/** A donut chart with text. */
export function chartPieDonutText(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieDonutText />
    </Wrapper>
  );
}

/** An interactive pie chart. */
export function chartPieInteractive(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieInteractive />
    </Wrapper>
  );
}

/** A pie chart with a label. */
export function chartPieLabel(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieLabel />
    </Wrapper>
  );
}

/** A pie chart with a custom label. */
export function chartPieLabelCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieLabelCustom />
    </Wrapper>
  );
}

/** A pie chart with a label list. */
export function chartPieLabelList(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieLabelList />
    </Wrapper>
  );
}

/** A pie chart with a legend. */
export function chartPieLegend(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieLegend />
    </Wrapper>
  );
}

/** A pie chart with no separator. */
export function chartPieSeparatorNone(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieSeparatorNone />
    </Wrapper>
  );
}

/** A simple pie chart. */
export function chartPieSimple(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieSimple />
    </Wrapper>
  );
}

/** A pie chart with stacked sections. */
export function chartPieStacked(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartPieStacked />
    </Wrapper>
  );
}
