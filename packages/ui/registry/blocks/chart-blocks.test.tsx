/**
 * `chart-blocks.test.tsx` — the 68 chart blocks' shared browser contract.
 *
 * They are one shape: a `Card` wrapping a `ChartContainer` over recharts, with inline sample
 * data and no interaction of their own beyond the three that carry a `Select` or a header
 * toggle. One suite over every member is the same call `animated-icons.browser.test.tsx` makes
 * for the 467 generated mirrors — exact membership stays fail-closed in the contract, and each
 * member is still rendered and audited here rather than sampled.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../test/a11y";
import { ChartAreaAxes } from "./chart-area-axes/chart-area-axes";
import { ChartAreaDefault } from "./chart-area-default/chart-area-default";
import { ChartAreaGradient } from "./chart-area-gradient/chart-area-gradient";
import { ChartAreaIcons } from "./chart-area-icons/chart-area-icons";
import { ChartAreaInteractive } from "./chart-area-interactive/chart-area-interactive";
import { ChartAreaLegend } from "./chart-area-legend/chart-area-legend";
import { ChartAreaLinear } from "./chart-area-linear/chart-area-linear";
import { ChartAreaStacked } from "./chart-area-stacked/chart-area-stacked";
import { ChartAreaStackedExpand } from "./chart-area-stacked-expand/chart-area-stacked-expand";
import { ChartAreaStep } from "./chart-area-step/chart-area-step";
import { ChartBarActive } from "./chart-bar-active/chart-bar-active";
import { ChartBarDefault } from "./chart-bar-default/chart-bar-default";
import { ChartBarHorizontal } from "./chart-bar-horizontal/chart-bar-horizontal";
import { ChartBarInteractive } from "./chart-bar-interactive/chart-bar-interactive";
import { ChartBarLabel } from "./chart-bar-label/chart-bar-label";
import { ChartBarLabelCustom } from "./chart-bar-label-custom/chart-bar-label-custom";
import { ChartBarMixed } from "./chart-bar-mixed/chart-bar-mixed";
import { ChartBarMultiple } from "./chart-bar-multiple/chart-bar-multiple";
import { ChartBarNegative } from "./chart-bar-negative/chart-bar-negative";
import { ChartBarStacked } from "./chart-bar-stacked/chart-bar-stacked";
import { ChartLineDefault } from "./chart-line-default/chart-line-default";
import { ChartLineDots } from "./chart-line-dots/chart-line-dots";
import { ChartLineDotsColors } from "./chart-line-dots-colors/chart-line-dots-colors";
import { ChartLineDotsCustom } from "./chart-line-dots-custom/chart-line-dots-custom";
import { ChartLineInteractive } from "./chart-line-interactive/chart-line-interactive";
import { ChartLineLabel } from "./chart-line-label/chart-line-label";
import { ChartLineLabelCustom } from "./chart-line-label-custom/chart-line-label-custom";
import { ChartLineLinear } from "./chart-line-linear/chart-line-linear";
import { ChartLineMultiple } from "./chart-line-multiple/chart-line-multiple";
import { ChartLineStep } from "./chart-line-step/chart-line-step";
import { ChartPieDonut } from "./chart-pie-donut/chart-pie-donut";
import { ChartPieDonutActive } from "./chart-pie-donut-active/chart-pie-donut-active";
import { ChartPieDonutText } from "./chart-pie-donut-text/chart-pie-donut-text";
import { ChartPieInteractive } from "./chart-pie-interactive/chart-pie-interactive";
import { ChartPieLabel } from "./chart-pie-label/chart-pie-label";
import { ChartPieLabelCustom } from "./chart-pie-label-custom/chart-pie-label-custom";
import { ChartPieLabelList } from "./chart-pie-label-list/chart-pie-label-list";
import { ChartPieLegend } from "./chart-pie-legend/chart-pie-legend";
import { ChartPieSeparatorNone } from "./chart-pie-separator-none/chart-pie-separator-none";
import { ChartPieSimple } from "./chart-pie-simple/chart-pie-simple";
import { ChartPieStacked } from "./chart-pie-stacked/chart-pie-stacked";
import { ChartRadarDefault } from "./chart-radar-default/chart-radar-default";
import { ChartRadarDots } from "./chart-radar-dots/chart-radar-dots";
import { ChartRadarGridCircle } from "./chart-radar-grid-circle/chart-radar-grid-circle";
import { ChartRadarGridCircleFill } from "./chart-radar-grid-circle-fill/chart-radar-grid-circle-fill";
import { ChartRadarGridCircleNoLines } from "./chart-radar-grid-circle-no-lines/chart-radar-grid-circle-no-lines";
import { ChartRadarGridCustom } from "./chart-radar-grid-custom/chart-radar-grid-custom";
import { ChartRadarGridFill } from "./chart-radar-grid-fill/chart-radar-grid-fill";
import { ChartRadarGridNone } from "./chart-radar-grid-none/chart-radar-grid-none";
import { ChartRadarLabelCustom } from "./chart-radar-label-custom/chart-radar-label-custom";
import { ChartRadarLegend } from "./chart-radar-legend/chart-radar-legend";
import { ChartRadarLinesOnly } from "./chart-radar-lines-only/chart-radar-lines-only";
import { ChartRadarMultiple } from "./chart-radar-multiple/chart-radar-multiple";
import { ChartRadialGrid } from "./chart-radial-grid/chart-radial-grid";
import { ChartRadialLabel } from "./chart-radial-label/chart-radial-label";
import { ChartRadialShape } from "./chart-radial-shape/chart-radial-shape";
import { ChartRadialSimple } from "./chart-radial-simple/chart-radial-simple";
import { ChartRadialStacked } from "./chart-radial-stacked/chart-radial-stacked";
import { ChartRadialText } from "./chart-radial-text/chart-radial-text";
import { ChartTooltipAdvanced } from "./chart-tooltip-advanced/chart-tooltip-advanced";
import { ChartTooltipDefault } from "./chart-tooltip-default/chart-tooltip-default";
import { ChartTooltipFormatter } from "./chart-tooltip-formatter/chart-tooltip-formatter";
import { ChartTooltipIcons } from "./chart-tooltip-icons/chart-tooltip-icons";
import { ChartTooltipIndicatorLine } from "./chart-tooltip-indicator-line/chart-tooltip-indicator-line";
import { ChartTooltipIndicatorNone } from "./chart-tooltip-indicator-none/chart-tooltip-indicator-none";
import { ChartTooltipLabelCustom } from "./chart-tooltip-label-custom/chart-tooltip-label-custom";
import { ChartTooltipLabelFormatter } from "./chart-tooltip-label-formatter/chart-tooltip-label-formatter";
import { ChartTooltipLabelNone } from "./chart-tooltip-label-none/chart-tooltip-label-none";

const CHARTS = {
  "chart-area-axes": ChartAreaAxes,
  "chart-area-default": ChartAreaDefault,
  "chart-area-gradient": ChartAreaGradient,
  "chart-area-icons": ChartAreaIcons,
  "chart-area-interactive": ChartAreaInteractive,
  "chart-area-legend": ChartAreaLegend,
  "chart-area-linear": ChartAreaLinear,
  "chart-area-stacked": ChartAreaStacked,
  "chart-area-stacked-expand": ChartAreaStackedExpand,
  "chart-area-step": ChartAreaStep,
  "chart-bar-active": ChartBarActive,
  "chart-bar-default": ChartBarDefault,
  "chart-bar-horizontal": ChartBarHorizontal,
  "chart-bar-interactive": ChartBarInteractive,
  "chart-bar-label": ChartBarLabel,
  "chart-bar-label-custom": ChartBarLabelCustom,
  "chart-bar-mixed": ChartBarMixed,
  "chart-bar-multiple": ChartBarMultiple,
  "chart-bar-negative": ChartBarNegative,
  "chart-bar-stacked": ChartBarStacked,
  "chart-line-default": ChartLineDefault,
  "chart-line-dots": ChartLineDots,
  "chart-line-dots-colors": ChartLineDotsColors,
  "chart-line-dots-custom": ChartLineDotsCustom,
  "chart-line-interactive": ChartLineInteractive,
  "chart-line-label": ChartLineLabel,
  "chart-line-label-custom": ChartLineLabelCustom,
  "chart-line-linear": ChartLineLinear,
  "chart-line-multiple": ChartLineMultiple,
  "chart-line-step": ChartLineStep,
  "chart-pie-donut": ChartPieDonut,
  "chart-pie-donut-active": ChartPieDonutActive,
  "chart-pie-donut-text": ChartPieDonutText,
  "chart-pie-interactive": ChartPieInteractive,
  "chart-pie-label": ChartPieLabel,
  "chart-pie-label-custom": ChartPieLabelCustom,
  "chart-pie-label-list": ChartPieLabelList,
  "chart-pie-legend": ChartPieLegend,
  "chart-pie-separator-none": ChartPieSeparatorNone,
  "chart-pie-simple": ChartPieSimple,
  "chart-pie-stacked": ChartPieStacked,
  "chart-radar-default": ChartRadarDefault,
  "chart-radar-dots": ChartRadarDots,
  "chart-radar-grid-circle": ChartRadarGridCircle,
  "chart-radar-grid-circle-fill": ChartRadarGridCircleFill,
  "chart-radar-grid-circle-no-lines": ChartRadarGridCircleNoLines,
  "chart-radar-grid-custom": ChartRadarGridCustom,
  "chart-radar-grid-fill": ChartRadarGridFill,
  "chart-radar-grid-none": ChartRadarGridNone,
  "chart-radar-label-custom": ChartRadarLabelCustom,
  "chart-radar-legend": ChartRadarLegend,
  "chart-radar-lines-only": ChartRadarLinesOnly,
  "chart-radar-multiple": ChartRadarMultiple,
  "chart-radial-grid": ChartRadialGrid,
  "chart-radial-label": ChartRadialLabel,
  "chart-radial-shape": ChartRadialShape,
  "chart-radial-simple": ChartRadialSimple,
  "chart-radial-stacked": ChartRadialStacked,
  "chart-radial-text": ChartRadialText,
  "chart-tooltip-advanced": ChartTooltipAdvanced,
  "chart-tooltip-default": ChartTooltipDefault,
  "chart-tooltip-formatter": ChartTooltipFormatter,
  "chart-tooltip-icons": ChartTooltipIcons,
  "chart-tooltip-indicator-line": ChartTooltipIndicatorLine,
  "chart-tooltip-indicator-none": ChartTooltipIndicatorNone,
  "chart-tooltip-label-custom": ChartTooltipLabelCustom,
  "chart-tooltip-label-formatter": ChartTooltipLabelFormatter,
  "chart-tooltip-label-none": ChartTooltipLabelNone,
} as const;

test("every chart block is a named export", () => {
  expect(Object.keys(CHARTS)).toHaveLength(68);
  for (const [name, Chart] of Object.entries(CHARTS)) {
    expect(typeof Chart, name).toBe("function");
  }
});

for (const [name, Chart] of Object.entries(CHARTS)) {
  test(`${name} renders and is axe-clean`, async () => {
    const screen = await render(<Chart />);
    // Every chart block is a Card, and the Card is what proves the composition mounted rather
    // than a recharts internal that may legitimately defer until the container is measured.
    await expect
      .element(
        screen.container.querySelector<HTMLElement>('[data-slot="card"]'),
      )
      .toBeInTheDocument();
    // Unstyled: no compiled token theme in this suite, so axe's contrast maths cannot resolve the
    // custom properties (see test/a11y.ts).
    await expectNoA11yViolations(document.body, ["color-contrast"]);
  });
}
