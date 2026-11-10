// @vegastack heatmap@0.63.0 sha256-huLrcmXr5oGMYRvaSbOC8+1Rh07SIgmglqJr9glxAPA=

"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "@vegastack/design";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * Heatmap — a rows × columns grid of counts drawn as five steps of the single-series chart ink
 * (`--chart-single`) mixed into the card, bucketed by the quintiles of the NON-ZERO values; a zero
 * cell is the `muted` well, so "nothing happened" never reads as "a little happened".
 *
 * The lowest step is 45%, not 20%: measured from the token values, a 20% mix sits 1.1:1 from the
 * `muted` zero cell in light and 1.2:1 in dark. The 3:1 non-text floor (WCAG 1.4.11) needs ≥ 42%
 * in light (card white, ink 0.145) and ≥ 44% in dark (card 0.205, ink 0.985, muted 0.269); 45%
 * measures 3.40:1 light and 3.19:1 dark. The other steps are spaced evenly from there to full ink.
 * `heatmap.test.tsx` recomputes this from the token JSON, so a retuned token fails the suite.
 *
 * Keyboard: one cell is tabbable (roving tabindex); the arrows move, Home/End go to the row's ends
 * and Ctrl+Home/End to the grid's corners. The focused or hovered cell shows its `cellLabel` in a
 * Tooltip, and the same text names the cell for assistive technology.
 * ----------------------------------------------------------------------------------------------*/

/** The five fill steps, as the percentage of `--chart-single` mixed into `--card`. */
export const HEATMAP_STEPS = [45, 59, 73, 86, 100] as const;

// Literal class strings, one per step, so Tailwind's scanner generates every one of them.
const STEP_CLASSES = [
  "bg-[color-mix(in_oklab,var(--color-chart-single)_45%,var(--color-card))]",
  "bg-[color-mix(in_oklab,var(--color-chart-single)_59%,var(--color-card))]",
  "bg-[color-mix(in_oklab,var(--color-chart-single)_73%,var(--color-card))]",
  "bg-[color-mix(in_oklab,var(--color-chart-single)_86%,var(--color-card))]",
  "bg-[color-mix(in_oklab,var(--color-chart-single)_100%,var(--color-card))]",
] as const;

const ZERO_CLASS = "bg-muted";

/** Props for `Heatmap`. */
export interface HeatmapProps {
  /** Row names, top to bottom ("Mon" … "Sun"). Shown as row headers on the left. */
  rows: readonly string[];
  /** Column names, left to right ("00" … "23"). Shown on top; below 640px every third shows. */
  columns: readonly string[];
  /** One array per row, one number per column. Missing cells count as 0. */
  values: readonly (readonly number[])[];
  /** The grid's accessible name ("Runs by weekday and hour"). */
  label: string;
  /** A cell's full sentence, shown in its tooltip and read as its name ("Mon 09:00 — 14 runs"). */
  cellLabel: (row: number, col: number, value: number) => string;
  /**
   * Words for the two ends of the swatch ramp under the grid. No legend when omitted.
   * @default undefined
   */
  legend?: { low: string; high: string };
  /**
   * What to show when every value is 0.
   * @default "No data"
   */
  empty?: React.ReactNode;
  /**
   * Classes for the root.
   * @default undefined
   */
  className?: string;
}

/**
 * The step (0–4) of every non-zero value, bucketed by the quintiles of the non-zero values; `-1`
 * for a zero. Equal values always share a step; when every non-zero value is the same, it is the
 * top step.
 */
function bucketer(values: readonly number[]): (value: number) => number {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return () => -1;
  const top = sorted[n - 1] as number;
  if (sorted[0] === top) return (v) => (v > 0 ? 4 : -1);
  // The upper bound of each of the first four quintiles.
  const bounds = [1, 2, 3, 4].map(
    (k) => sorted[Math.max(0, Math.ceil((k * n) / 5) - 1)] as number,
  );
  return (v) => {
    if (!(v > 0)) return -1;
    let step = 0;
    for (const bound of bounds) if (v > bound) step++;
    return step;
  };
}

function cellValue(
  values: HeatmapProps["values"],
  row: number,
  col: number,
): number {
  const v = values[row]?.[col];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * `Heatmap` — counts over two dimensions (weekday × hour, agent × day) as a grid of shaded cells,
 * with row and column headers, a tooltip per cell, full keyboard navigation and an optional legend.
 *
 * @example
 * <Heatmap
 *   label="Runs by weekday and hour"
 *   rows={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
 *   columns={hours}
 *   values={runsByDayAndHour}
 *   cellLabel={(r, c, v) => `${days[r]} ${hours[c]}:00 — ${v} runs`}
 *   legend={{ low: "Fewer", high: "More" }}
 * />
 */
export function Heatmap({
  rows,
  columns,
  values,
  label,
  cellLabel,
  legend,
  empty,
  className,
}: HeatmapProps) {
  const handle = React.useMemo(
    () => TooltipPrimitive.createHandle<string>(),
    [],
  );
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState<[number, number]>([0, 0]);
  const pendingFocus = React.useRef(false);

  const flat = React.useMemo(() => {
    const out: number[] = [];
    for (let r = 0; r < rows.length; r++)
      for (let c = 0; c < columns.length; c++)
        out.push(cellValue(values, r, c));
    return out;
  }, [rows.length, columns.length, values]);
  const stepOf = React.useMemo(() => bucketer(flat), [flat]);

  const lastRow = rows.length - 1;
  const lastCol = columns.length - 1;
  // Clamp the remembered cell if the grid shrank.
  const activeRow = Math.min(active[0], Math.max(0, lastRow));
  const activeCol = Math.min(active[1], Math.max(0, lastCol));

  React.useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-row="${activeRow}"][data-col="${activeCol}"]`,
      )
      ?.focus();
  }, [activeRow, activeCol]);

  const allZero = flat.every((v) => v === 0);
  if (rows.length === 0 || columns.length === 0 || allZero) {
    return (
      <div data-slot="heatmap-empty" className={className}>
        {empty ?? <p className="text-sm text-muted-foreground">No data</p>}
      </div>
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    let r = activeRow;
    let c = activeCol;
    // In a right-to-left context the grid lays column 0 out on the right, so the arrows follow
    // what the reader sees rather than the column index.
    const rtl =
      gridRef.current !== null &&
      getComputedStyle(gridRef.current).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    switch (event.key) {
      case forward:
        c = Math.min(lastCol, c + 1);
        break;
      case backward:
        c = Math.max(0, c - 1);
        break;
      case "ArrowDown":
        r = Math.min(lastRow, r + 1);
        break;
      case "ArrowUp":
        r = Math.max(0, r - 1);
        break;
      case "Home":
        c = 0;
        if (event.ctrlKey || event.metaKey) r = 0;
        break;
      case "End":
        c = lastCol;
        if (event.ctrlKey || event.metaKey) r = lastRow;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (r === activeRow && c === activeCol) return;
    pendingFocus.current = true;
    setActive([r, c]);
  }

  return (
    <div
      data-slot="heatmap"
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      {/* Cells never shrink below 12px, so a wide grid scrolls inside its own box rather than
          pushing the page sideways on a phone. */}
      <div
        data-slot="heatmap-scroll"
        className="relative min-w-0 overflow-x-auto"
      >
        <div
          ref={gridRef}
          role="grid"
          aria-label={label}
          aria-rowcount={rows.length + 1}
          aria-colcount={columns.length + 1}
          data-slot="heatmap-grid"
          onKeyDown={onKeyDown}
          className="group/heatmap grid grid-cols-[auto_repeat(var(--heatmap-columns),minmax(0.75rem,1fr))] gap-0.5"
          style={
            {
              "--heatmap-columns": String(columns.length),
            } as React.CSSProperties
          }
        >
          <div
            role="row"
            aria-rowindex={1}
            data-slot="heatmap-header-row"
            className="col-span-full grid grid-cols-subgrid"
          >
            <div aria-hidden data-slot="heatmap-corner" />
            {columns.map((column, c) => (
              <div
                key={c}
                role="columnheader"
                aria-colindex={c + 2}
                data-slot="heatmap-column-header"
                className="min-w-0 text-center text-xs text-muted-foreground"
              >
                {/* Below 640px only every third header shows; the rest stay readable to assistive
                  technology. */}
                <span
                  className={cn(
                    "block truncate",
                    c % 3 !== 0 && "max-sm:sr-only",
                  )}
                >
                  {column}
                </span>
              </div>
            ))}
          </div>
          {rows.map((rowName, r) => (
            <div
              key={r}
              role="row"
              aria-rowindex={r + 2}
              data-slot="heatmap-row"
              className="col-span-full grid grid-cols-subgrid"
            >
              <div
                role="rowheader"
                aria-colindex={1}
                data-slot="heatmap-row-header"
                className="flex min-w-0 items-center pe-2 text-xs text-muted-foreground"
              >
                <span className="truncate">{rowName}</span>
              </div>
              {columns.map((_, c) => {
                const value = cellValue(values, r, c);
                const step = stepOf(value);
                const text = cellLabel(r, c, value);
                const current = r === activeRow && c === activeCol;
                return (
                  <TooltipTrigger
                    key={c}
                    handle={handle}
                    payload={text}
                    delay={0}
                    closeOnClick={false}
                    render={
                      <div
                        role="gridcell"
                        aria-colindex={c + 2}
                        aria-label={text}
                        tabIndex={current ? 0 : -1}
                        data-slot="heatmap-cell"
                        data-row={r}
                        data-col={c}
                        data-step={step + 1}
                        data-current={current ? "" : undefined}
                        onFocus={() => {
                          if (!current) setActive([r, c]);
                        }}
                        className={cn(
                          "h-6 min-w-3 rounded-sm",
                          step < 0 ? ZERO_CLASS : STEP_CLASSES[step],
                        )}
                      />
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => (
          <TooltipContent data-slot="heatmap-tooltip">
            {typeof payload === "string" ? payload : null}
          </TooltipContent>
        )}
      </Tooltip>
      {legend ? (
        <div
          data-slot="heatmap-legend"
          className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground"
        >
          <span>{legend.low}</span>
          <span aria-hidden className="flex gap-0.5">
            {STEP_CLASSES.map((stepClass) => (
              <span
                key={stepClass}
                className={cn("size-3 rounded-sm", stepClass)}
              />
            ))}
          </span>
          <span>{legend.high}</span>
        </div>
      ) : null}
    </div>
  );
}
