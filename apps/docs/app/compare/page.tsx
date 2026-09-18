"use client";

/* Batch 8 review harness — NOT COMMITTED. `?block=<name>` renders one block full-bleed. */

import * as React from "react";
import AppShell01Page from "../../../../packages/ui/registry/blocks/app-shell-01/page";
import Board01Page from "../../../../packages/ui/registry/blocks/board-01/page";
import Dashboard01Page from "../../../../packages/ui/registry/blocks/dashboard-01/page";
import Login01Page from "../../../../packages/ui/registry/blocks/login-01/page";
import Login02Page from "../../../../packages/ui/registry/blocks/login-02/page";
import Login03Page from "../../../../packages/ui/registry/blocks/login-03/page";
import Login04Page from "../../../../packages/ui/registry/blocks/login-04/page";
import Login05Page from "../../../../packages/ui/registry/blocks/login-05/page";
import Onboarding01Page from "../../../../packages/ui/registry/blocks/onboarding-01/page";
import Preview03Page from "../../../../packages/ui/registry/blocks/preview-03/index";
import Settings01Page from "../../../../packages/ui/registry/blocks/settings-01/page";
import Sidebar01Page from "../../../../packages/ui/registry/blocks/sidebar-01/page";
import Sidebar02Page from "../../../../packages/ui/registry/blocks/sidebar-02/page";
import Sidebar03Page from "../../../../packages/ui/registry/blocks/sidebar-03/page";
import Sidebar04Page from "../../../../packages/ui/registry/blocks/sidebar-04/page";
import Sidebar05Page from "../../../../packages/ui/registry/blocks/sidebar-05/page";
import Sidebar06Page from "../../../../packages/ui/registry/blocks/sidebar-06/page";
import Sidebar07Page from "../../../../packages/ui/registry/blocks/sidebar-07/page";
import Sidebar08Page from "../../../../packages/ui/registry/blocks/sidebar-08/page";
import Sidebar09Page from "../../../../packages/ui/registry/blocks/sidebar-09/page";
import Sidebar10Page from "../../../../packages/ui/registry/blocks/sidebar-10/page";
import Sidebar11Page from "../../../../packages/ui/registry/blocks/sidebar-11/page";
import Sidebar12Page from "../../../../packages/ui/registry/blocks/sidebar-12/page";
import Sidebar13Page from "../../../../packages/ui/registry/blocks/sidebar-13/page";
import Sidebar14Page from "../../../../packages/ui/registry/blocks/sidebar-14/page";
import Sidebar15Page from "../../../../packages/ui/registry/blocks/sidebar-15/page";
import Sidebar16Page from "../../../../packages/ui/registry/blocks/sidebar-16/page";
import Signup01Page from "../../../../packages/ui/registry/blocks/signup-01/page";
import Signup02Page from "../../../../packages/ui/registry/blocks/signup-02/page";
import Signup03Page from "../../../../packages/ui/registry/blocks/signup-03/page";
import Signup04Page from "../../../../packages/ui/registry/blocks/signup-04/page";
import Signup05Page from "../../../../packages/ui/registry/blocks/signup-05/page";
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
import { ChartRadialGrid } from "../../../../packages/ui/registry/blocks/chart-radial-grid/chart-radial-grid";
import { ChartRadialLabel } from "../../../../packages/ui/registry/blocks/chart-radial-label/chart-radial-label";
import { ChartRadialShape } from "../../../../packages/ui/registry/blocks/chart-radial-shape/chart-radial-shape";
import { ChartRadialSimple } from "../../../../packages/ui/registry/blocks/chart-radial-simple/chart-radial-simple";
import { ChartRadialStacked } from "../../../../packages/ui/registry/blocks/chart-radial-stacked/chart-radial-stacked";
import { ChartRadialText } from "../../../../packages/ui/registry/blocks/chart-radial-text/chart-radial-text";
import { ChartTooltipAdvanced } from "../../../../packages/ui/registry/blocks/chart-tooltip-advanced/chart-tooltip-advanced";
import { ChartTooltipDefault } from "../../../../packages/ui/registry/blocks/chart-tooltip-default/chart-tooltip-default";
import { ChartTooltipFormatter } from "../../../../packages/ui/registry/blocks/chart-tooltip-formatter/chart-tooltip-formatter";
import { ChartTooltipIcons } from "../../../../packages/ui/registry/blocks/chart-tooltip-icons/chart-tooltip-icons";
import { ChartTooltipIndicatorLine } from "../../../../packages/ui/registry/blocks/chart-tooltip-indicator-line/chart-tooltip-indicator-line";
import { ChartTooltipIndicatorNone } from "../../../../packages/ui/registry/blocks/chart-tooltip-indicator-none/chart-tooltip-indicator-none";
import { ChartTooltipLabelCustom } from "../../../../packages/ui/registry/blocks/chart-tooltip-label-custom/chart-tooltip-label-custom";
import { ChartTooltipLabelFormatter } from "../../../../packages/ui/registry/blocks/chart-tooltip-label-formatter/chart-tooltip-label-formatter";
import { ChartTooltipLabelNone } from "../../../../packages/ui/registry/blocks/chart-tooltip-label-none/chart-tooltip-label-none";

const BLOCKS: Record<string, React.ComponentType> = {
  "app-shell-01": AppShell01Page,
  "board-01": Board01Page,
  "dashboard-01": Dashboard01Page,
  "login-01": Login01Page,
  "login-02": Login02Page,
  "login-03": Login03Page,
  "login-04": Login04Page,
  "login-05": Login05Page,
  "onboarding-01": Onboarding01Page,
  "preview-03": Preview03Page,
  "settings-01": Settings01Page,
  "sidebar-01": Sidebar01Page,
  "sidebar-02": Sidebar02Page,
  "sidebar-03": Sidebar03Page,
  "sidebar-04": Sidebar04Page,
  "sidebar-05": Sidebar05Page,
  "sidebar-06": Sidebar06Page,
  "sidebar-07": Sidebar07Page,
  "sidebar-08": Sidebar08Page,
  "sidebar-09": Sidebar09Page,
  "sidebar-10": Sidebar10Page,
  "sidebar-11": Sidebar11Page,
  "sidebar-12": Sidebar12Page,
  "sidebar-13": Sidebar13Page,
  "sidebar-14": Sidebar14Page,
  "sidebar-15": Sidebar15Page,
  "sidebar-16": Sidebar16Page,
  "signup-01": Signup01Page,
  "signup-02": Signup02Page,
  "signup-03": Signup03Page,
  "signup-04": Signup04Page,
  "signup-05": Signup05Page,
};

const GALLERIES: Record<string, React.ReactNode> = {
  "charts-area": (
    <>
      <ChartAreaAxes key="chart-area-axes" />
      <ChartAreaDefault key="chart-area-default" />
      <ChartAreaGradient key="chart-area-gradient" />
      <ChartAreaIcons key="chart-area-icons" />
      <ChartAreaInteractive key="chart-area-interactive" />
      <ChartAreaLegend key="chart-area-legend" />
      <ChartAreaLinear key="chart-area-linear" />
      <ChartAreaStacked key="chart-area-stacked" />
      <ChartAreaStackedExpand key="chart-area-stacked-expand" />
      <ChartAreaStep key="chart-area-step" />
    </>
  ),
  "charts-bar": (
    <>
      <ChartBarActive key="chart-bar-active" />
      <ChartBarDefault key="chart-bar-default" />
      <ChartBarHorizontal key="chart-bar-horizontal" />
      <ChartBarInteractive key="chart-bar-interactive" />
      <ChartBarLabel key="chart-bar-label" />
      <ChartBarLabelCustom key="chart-bar-label-custom" />
      <ChartBarMixed key="chart-bar-mixed" />
      <ChartBarMultiple key="chart-bar-multiple" />
      <ChartBarNegative key="chart-bar-negative" />
      <ChartBarStacked key="chart-bar-stacked" />
    </>
  ),
  "charts-line": (
    <>
      <ChartLineDefault key="chart-line-default" />
      <ChartLineDots key="chart-line-dots" />
      <ChartLineDotsColors key="chart-line-dots-colors" />
      <ChartLineDotsCustom key="chart-line-dots-custom" />
      <ChartLineInteractive key="chart-line-interactive" />
      <ChartLineLabel key="chart-line-label" />
      <ChartLineLabelCustom key="chart-line-label-custom" />
      <ChartLineLinear key="chart-line-linear" />
      <ChartLineMultiple key="chart-line-multiple" />
      <ChartLineStep key="chart-line-step" />
    </>
  ),
  "charts-pie": (
    <>
      <ChartPieDonut key="chart-pie-donut" />
      <ChartPieDonutActive key="chart-pie-donut-active" />
      <ChartPieDonutText key="chart-pie-donut-text" />
      <ChartPieInteractive key="chart-pie-interactive" />
      <ChartPieLabel key="chart-pie-label" />
      <ChartPieLabelCustom key="chart-pie-label-custom" />
      <ChartPieLabelList key="chart-pie-label-list" />
      <ChartPieLegend key="chart-pie-legend" />
      <ChartPieSeparatorNone key="chart-pie-separator-none" />
      <ChartPieSimple key="chart-pie-simple" />
      <ChartPieStacked key="chart-pie-stacked" />
    </>
  ),
  "charts-radar": (
    <>
      <ChartRadarDefault key="chart-radar-default" />
      <ChartRadarDots key="chart-radar-dots" />
      <ChartRadarGridCircle key="chart-radar-grid-circle" />
      <ChartRadarGridCircleFill key="chart-radar-grid-circle-fill" />
      <ChartRadarGridCircleNoLines key="chart-radar-grid-circle-no-lines" />
      <ChartRadarGridCustom key="chart-radar-grid-custom" />
      <ChartRadarGridFill key="chart-radar-grid-fill" />
      <ChartRadarGridNone key="chart-radar-grid-none" />
      <ChartRadarLabelCustom key="chart-radar-label-custom" />
      <ChartRadarLegend key="chart-radar-legend" />
      <ChartRadarLinesOnly key="chart-radar-lines-only" />
      <ChartRadarMultiple key="chart-radar-multiple" />
    </>
  ),
  "charts-radial": (
    <>
      <ChartRadialGrid key="chart-radial-grid" />
      <ChartRadialLabel key="chart-radial-label" />
      <ChartRadialShape key="chart-radial-shape" />
      <ChartRadialSimple key="chart-radial-simple" />
      <ChartRadialStacked key="chart-radial-stacked" />
      <ChartRadialText key="chart-radial-text" />
    </>
  ),
  "charts-tooltip": (
    <>
      <ChartTooltipAdvanced key="chart-tooltip-advanced" />
      <ChartTooltipDefault key="chart-tooltip-default" />
      <ChartTooltipFormatter key="chart-tooltip-formatter" />
      <ChartTooltipIcons key="chart-tooltip-icons" />
      <ChartTooltipIndicatorLine key="chart-tooltip-indicator-line" />
      <ChartTooltipIndicatorNone key="chart-tooltip-indicator-none" />
      <ChartTooltipLabelCustom key="chart-tooltip-label-custom" />
      <ChartTooltipLabelFormatter key="chart-tooltip-label-formatter" />
      <ChartTooltipLabelNone key="chart-tooltip-label-none" />
    </>
  ),
};

const NAMES = [
  "app-shell-01",
  "board-01",
  "dashboard-01",
  "login-01",
  "login-02",
  "login-03",
  "login-04",
  "login-05",
  "onboarding-01",
  "preview-03",
  "settings-01",
  "sidebar-01",
  "sidebar-02",
  "sidebar-03",
  "sidebar-04",
  "sidebar-05",
  "sidebar-06",
  "sidebar-07",
  "sidebar-08",
  "sidebar-09",
  "sidebar-10",
  "sidebar-11",
  "sidebar-12",
  "sidebar-13",
  "sidebar-14",
  "sidebar-15",
  "sidebar-16",
  "signup-01",
  "signup-02",
  "signup-03",
  "signup-04",
  "signup-05",
  "charts-area",
  "charts-bar",
  "charts-line",
  "charts-pie",
  "charts-radar",
  "charts-radial",
  "charts-tooltip",
];

export default function Compare() {
  const [name, setName] = React.useState<string | null>(null);
  React.useEffect(() => {
    setName(new URLSearchParams(window.location.search).get("block") ?? "");
  }, []);
  if (name === null) return null;
  const Block = BLOCKS[name];
  const gallery = GALLERIES[name];
  if (Block) {
    return (
      <div data-capture={name} data-block={name}>
        <Block />
      </div>
    );
  }
  if (gallery) {
    return (
      <div
        data-capture={name}
        data-block={name}
        className="grid gap-6 p-6 lg:grid-cols-2"
      >
        {gallery}
      </div>
    );
  }
  return (
    <ul data-index="" className="p-6">
      {NAMES.map((n) => (
        <li key={n}>
          <a href={`/compare?block=${n}`}>{n}</a>
        </li>
      ))}
    </ul>
  );
}
