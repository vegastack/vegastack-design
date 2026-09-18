"use client";

/**
 * `preview/charts-bar.tsx` — the 10 `bar` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartBarActive } from "../../../../packages/ui/registry/blocks/chart-bar-active/chart-bar-active";
import { ChartBarDefault } from "../../../../packages/ui/registry/blocks/chart-bar-default/chart-bar-default";
import { ChartBarHorizontal } from "../../../../packages/ui/registry/blocks/chart-bar-horizontal/chart-bar-horizontal";
import { ChartBarInteractive } from "../../../../packages/ui/registry/blocks/chart-bar-interactive/chart-bar-interactive";
import { ChartBarLabel } from "../../../../packages/ui/registry/blocks/chart-bar-label/chart-bar-label";
import { ChartBarLabelCustom } from "../../../../packages/ui/registry/blocks/chart-bar-label-custom/chart-bar-label-custom";
import { ChartBarMixed } from "../../../../packages/ui/registry/blocks/chart-bar-mixed/chart-bar-mixed";
import { ChartBarMultiple } from "../../../../packages/ui/registry/blocks/chart-bar-multiple/chart-bar-multiple";
import { ChartBarNegative } from "../../../../packages/ui/registry/blocks/chart-bar-negative/chart-bar-negative";
import { ChartBarStacked } from "../../../../packages/ui/registry/blocks/chart-bar-stacked/chart-bar-stacked";
import { Wrapper } from "./wrapper";

/** A bar chart with an active bar. */
export function chartBarActive(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarActive />
    </Wrapper>
  );
}

/** A bar chart. */
export function chartBarDefault(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarDefault />
    </Wrapper>
  );
}

/** A horizontal bar chart. */
export function chartBarHorizontal(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarHorizontal />
    </Wrapper>
  );
}

/** An interactive bar chart. */
export function chartBarInteractive(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarInteractive />
    </Wrapper>
  );
}

/** A bar chart with a label. */
export function chartBarLabel(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarLabel />
    </Wrapper>
  );
}

/** A bar chart with a custom label. */
export function chartBarLabelCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarLabelCustom />
    </Wrapper>
  );
}

/** A mixed bar chart. */
export function chartBarMixed(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarMixed />
    </Wrapper>
  );
}

/** A multiple bar chart. */
export function chartBarMultiple(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarMultiple />
    </Wrapper>
  );
}

/** A bar chart with negative values. */
export function chartBarNegative(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarNegative />
    </Wrapper>
  );
}

/** A stacked bar chart with a legend. */
export function chartBarStacked(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartBarStacked />
    </Wrapper>
  );
}
