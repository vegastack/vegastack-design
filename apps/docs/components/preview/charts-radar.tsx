"use client";

/**
 * `preview/charts-radar.tsx` — the 12 `radar` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartRadarDefault } from "../../../../packages/ui/registry/blocks/chart-radar-default/chart-radar-default";
import { ChartRadarDots } from "../../../../packages/ui/registry/blocks/chart-radar-dots/chart-radar-dots";
import { ChartRadarGridCircle } from "../../../../packages/ui/registry/blocks/chart-radar-grid-circle/chart-radar-grid-circle";
import { ChartRadarGridCircleFill } from "../../../../packages/ui/registry/blocks/chart-radar-grid-circle-fill/chart-radar-grid-circle-fill";
import { ChartRadarGridCircleNoLines } from "../../../../packages/ui/registry/blocks/chart-radar-grid-circle-no-lines/chart-radar-grid-circle-no-lines";
import { ChartRadarGridCustom } from "../../../../packages/ui/registry/blocks/chart-radar-grid-custom/chart-radar-grid-custom";
import { ChartRadarGridFill } from "../../../../packages/ui/registry/blocks/chart-radar-grid-fill/chart-radar-grid-fill";
import { ChartRadarGridNone } from "../../../../packages/ui/registry/blocks/chart-radar-grid-none/chart-radar-grid-none";
import { ChartRadarLabelCustom } from "../../../../packages/ui/registry/blocks/chart-radar-label-custom/chart-radar-label-custom";
import { ChartRadarLegend } from "../../../../packages/ui/registry/blocks/chart-radar-legend/chart-radar-legend";
import { ChartRadarLinesOnly } from "../../../../packages/ui/registry/blocks/chart-radar-lines-only/chart-radar-lines-only";
import { ChartRadarMultiple } from "../../../../packages/ui/registry/blocks/chart-radar-multiple/chart-radar-multiple";
import { Wrapper } from "./wrapper";

/** A radar chart. */
export function chartRadarDefault(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarDefault />
    </Wrapper>
  );
}

/** A radar chart with dots. */
export function chartRadarDots(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarDots />
    </Wrapper>
  );
}

/** A radar chart with a grid and circle. */
export function chartRadarGridCircle(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarGridCircle />
    </Wrapper>
  );
}

/** A radar chart with a grid and circle fill. */
export function chartRadarGridCircleFill(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarGridCircleFill />
    </Wrapper>
  );
}

/** A radar chart with a grid and circle fill. */
export function chartRadarGridCircleNoLines(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarGridCircleNoLines />
    </Wrapper>
  );
}

/** A radar chart with a custom grid. */
export function chartRadarGridCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarGridCustom />
    </Wrapper>
  );
}

/** A radar chart with a grid filled. */
export function chartRadarGridFill(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarGridFill />
    </Wrapper>
  );
}

/** A radar chart with no grid. */
export function chartRadarGridNone(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarGridNone />
    </Wrapper>
  );
}

/** A radar chart with a custom label. */
export function chartRadarLabelCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarLabelCustom />
    </Wrapper>
  );
}

/** A radar chart with a legend. */
export function chartRadarLegend(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarLegend />
    </Wrapper>
  );
}

/** A radar chart with lines only. */
export function chartRadarLinesOnly(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarLinesOnly />
    </Wrapper>
  );
}

/** A radar chart with multiple data. */
export function chartRadarMultiple(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadarMultiple />
    </Wrapper>
  );
}
