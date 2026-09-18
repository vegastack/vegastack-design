"use client";

/**
 * `preview/charts-line.tsx` — the 10 `line` chart blocks, one fixture each.
 *
 * Chart blocks are single-card compositions over `card` + `chart`, so they share one gallery page
 * per family rather than a page each; the fixtures stay granular so the geometry lane still sweeps
 * every one of them.
 */

import type { ReactNode } from "react";
import { ChartLineDefault } from "../../../../packages/ui/registry/blocks/chart-line-default/chart-line-default";
import { ChartLineDots } from "../../../../packages/ui/registry/blocks/chart-line-dots/chart-line-dots";
import { ChartLineDotsColors } from "../../../../packages/ui/registry/blocks/chart-line-dots-colors/chart-line-dots-colors";
import { ChartLineDotsCustom } from "../../../../packages/ui/registry/blocks/chart-line-dots-custom/chart-line-dots-custom";
import { ChartLineInteractive } from "../../../../packages/ui/registry/blocks/chart-line-interactive/chart-line-interactive";
import { ChartLineLabel } from "../../../../packages/ui/registry/blocks/chart-line-label/chart-line-label";
import { ChartLineLabelCustom } from "../../../../packages/ui/registry/blocks/chart-line-label-custom/chart-line-label-custom";
import { ChartLineLinear } from "../../../../packages/ui/registry/blocks/chart-line-linear/chart-line-linear";
import { ChartLineMultiple } from "../../../../packages/ui/registry/blocks/chart-line-multiple/chart-line-multiple";
import { ChartLineStep } from "../../../../packages/ui/registry/blocks/chart-line-step/chart-line-step";
import { Wrapper } from "./wrapper";

/** A line chart. */
export function chartLineDefault(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineDefault />
    </Wrapper>
  );
}

/** A line chart with dots. */
export function chartLineDots(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineDots />
    </Wrapper>
  );
}

/** A line chart with dots and colors. */
export function chartLineDotsColors(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineDotsColors />
    </Wrapper>
  );
}

/** A line chart with custom dots. */
export function chartLineDotsCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineDotsCustom />
    </Wrapper>
  );
}

/** An interactive line chart. */
export function chartLineInteractive(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineInteractive />
    </Wrapper>
  );
}

/** A line chart with a label. */
export function chartLineLabel(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineLabel />
    </Wrapper>
  );
}

/** A line chart with a custom label. */
export function chartLineLabelCustom(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineLabelCustom />
    </Wrapper>
  );
}

/** A linear line chart. */
export function chartLineLinear(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineLinear />
    </Wrapper>
  );
}

/** A multiple line chart. */
export function chartLineMultiple(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineMultiple />
    </Wrapper>
  );
}

/** A line chart with step. */
export function chartLineStep(): ReactNode {
  return (
    <Wrapper className="block">
      <ChartLineStep />
    </Wrapper>
  );
}
