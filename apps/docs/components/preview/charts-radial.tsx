"use client";

/**
 * `preview/charts-radial.tsx` — the 6 `radial` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartRadialGrid } from "../../../../packages/ui/registry/blocks/chart-radial-grid/chart-radial-grid";
import { ChartRadialLabel } from "../../../../packages/ui/registry/blocks/chart-radial-label/chart-radial-label";
import { ChartRadialShape } from "../../../../packages/ui/registry/blocks/chart-radial-shape/chart-radial-shape";
import { ChartRadialSimple } from "../../../../packages/ui/registry/blocks/chart-radial-simple/chart-radial-simple";
import { ChartRadialStacked } from "../../../../packages/ui/registry/blocks/chart-radial-stacked/chart-radial-stacked";
import { ChartRadialText } from "../../../../packages/ui/registry/blocks/chart-radial-text/chart-radial-text";
import { Wrapper } from "./wrapper";

/** A radial chart with a grid. */
export function chartRadialGrid(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadialGrid />
    </Wrapper>
  );
}

/** A radial chart with a label. */
export function chartRadialLabel(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadialLabel />
    </Wrapper>
  );
}

/** A radial chart with a custom shape. */
export function chartRadialShape(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadialShape />
    </Wrapper>
  );
}

/** A radial chart. */
export function chartRadialSimple(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadialSimple />
    </Wrapper>
  );
}

/** A radial chart with stacked sections. */
export function chartRadialStacked(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadialStacked />
    </Wrapper>
  );
}

/** A radial chart with text. */
export function chartRadialText(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartRadialText />
    </Wrapper>
  );
}
