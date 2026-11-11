// @vegastack kpi-card@0.63.1 sha256-ZsqnB+/g0UnEljtFVRdfF4t8BzIT6EQpwatutQNFcSM=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Card } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/info-hint";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stat,
  StatDelta,
  StatEmpty,
  StatLabel,
  StatSkeleton,
  StatValue,
} from "@/components/ui/stat";

/* ------------------------------------------------------------------------------------------------
 * KpiCard — one dashboard KPI tile: a `Stat size="lg"` inside the `Card` chrome, with an optional
 * delta line, an optional sparkline and an optional whole-tile link. `StatGroup` is the borderless
 * strip with one value per cell; a KPI tile needs card chrome, a spark and a delta per tile, so it
 * composes the Stat parts rather than stretching StatGroup.
 *
 * The link is a STRETCHED link: an empty, labelled `<a>` laid behind the content and covering the
 * whole tile, so the tile reads as one link while an `InfoHint` button stays a sibling of it rather
 * than a button nested inside a link. The content above it takes no pointer events, so a click
 * anywhere on the tile lands on the link; the hint takes them back.
 *
 * Server-safe: no hooks here. The InfoHint and the Stat parts own their client boundaries.
 * ----------------------------------------------------------------------------------------------*/

/** A KPI's change line. */
export interface KpiCardDelta {
  /** The change in words or with a sign ("+12% vs last week"); colour is never the only signal. */
  text: string;
  /** Which way the number moved. Sets `data-intent` on the delta line. */
  direction: "up" | "down" | "flat";
  /** Whether the move is good, bad or neither — up is not always good (errors, cost, latency). */
  tone: "positive" | "negative" | "neutral";
}

/**
 * What a KPI's number means, by a threshold the caller states once: `success` healthy, `warning`
 * attention, `danger` failing, `neutral` (the default) just a number. It inks the value and the
 * sparkline; it is never the only signal — the delta and the hint carry the words.
 */
export type KpiCardTone = "neutral" | "success" | "warning" | "danger";

/** A categorical palette slot (`--chart-1`…`8`): one measure keeps one hue across tiles and charts. */
export type KpiCardSeries = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Props for `KpiCard`. */
export interface KpiCardProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** What the number counts ("Runs", "Cost", "p95 latency"). */
  label: string;
  /**
   * The value, already formatted — a number or a short figure ("1,284", "92%", "$4.10", "3 min").
   * `null` when there is none yet: the tile shows a muted "—" and the `empty` line, never prose in
   * the value's place.
   */
  value: React.ReactNode | null;
  /**
   * Why there is no value, or what it needs, under the "—" ("Needs 5 ratings", "No runs yet").
   * Only read when `value` is `null`.
   * @default undefined
   */
  empty?: string;
  /**
   * What the number means: inks the value and the sparkline with the status family.
   * @default "neutral"
   */
  tone?: KpiCardTone;
  /**
   * The palette hue of a measure's sparkline (tokens, cost), so it matches that measure's charts.
   * A `tone` other than `neutral` wins.
   * @default undefined
   */
  series?: KpiCardSeries;
  /**
   * One sentence explaining the KPI, opened from an (i) beside the label.
   * @default undefined
   */
  hint?: React.ReactNode;
  /**
   * The change line under the value.
   * @default undefined
   */
  delta?: KpiCardDelta;
  /**
   * A trend for the sparkline under the value, one point per period (only the last 120 are drawn).
   * It draws only when at least 3 points hold data (non-zero) — fewer reads as a flat line and a
   * cliff, not a trend — as a line over a soft area, from zero, in the tile's tone or series.
   * Decorative; the value and delta carry the meaning.
   * @default undefined
   */
  spark?: readonly number[];
  /**
   * Makes the whole tile a link: your router's link with its `href` (`<Link href="/runs" />`).
   * @default undefined
   */
  linkRender?: React.ReactElement;
  /**
   * Shows the tile's skeleton while the value loads.
   * @default false
   */
  loading?: boolean;
}

const TONE_CLASSES: Record<KpiCardDelta["tone"], string> = {
  positive: "text-success-text",
  negative: "text-destructive-text",
  neutral: "text-muted-foreground",
};

/** The value's ink per tone: the family's `-text` ink, which holds AA on the card (A11Y-13). */
const VALUE_TONE: Record<KpiCardTone, string | undefined> = {
  neutral: undefined,
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-destructive-text",
};

/** The sparkline's ink (`currentColor`): the tone's fill, else the series hue, else one ink. */
const SPARK_TONE: Record<Exclude<KpiCardTone, "neutral">, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};
const SPARK_SERIES: Record<KpiCardSeries, string> = {
  1: "text-chart-1",
  2: "text-chart-2",
  3: "text-chart-3",
  4: "text-chart-4",
  5: "text-chart-5",
  6: "text-chart-6",
  7: "text-chart-7",
  8: "text-chart-8",
};

const SPARK_MAX_POINTS = 120;
const SPARK_HEIGHT = 24;
/** Fewer points with data than this is not a trend: no sparkline. */
export const KPI_SPARK_MIN_POINTS = 3;

/** The sparkline's line and area paths, or `null` when there is no trend to draw. */
export function sparkPaths(
  values: readonly number[],
): { line: string; area: string; count: number } | null {
  const points = values
    .slice(-SPARK_MAX_POINTS)
    .map((v) => (Number.isFinite(v) ? v : 0));
  if (points.filter((v) => v !== 0).length < KPI_SPARK_MIN_POINTS) return null;
  // From zero, so a small change never reads as a cliff.
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const span = max - min || 1;
  // One unit of headroom top and bottom so the stroke is never clipped at the extremes.
  const usable = SPARK_HEIGHT - 2;
  const y = (v: number) =>
    Math.round((1 + usable * (1 - (v - min) / span)) * 100) / 100;
  const line = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${i},${y(v)}`)
    .join(" ");
  const base = y(Math.max(min, 0));
  return {
    line,
    area: `${line} L${points.length - 1},${base} L0,${base} Z`,
    count: points.length,
  };
}

function KpiSpark({ values, ink }: { values: readonly number[]; ink: string }) {
  const paths = sparkPaths(values);
  if (paths === null) return null;
  return (
    <svg
      aria-hidden
      focusable="false"
      data-slot="kpi-card-spark"
      viewBox={`0 0 ${paths.count - 1} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("block h-6 w-full overflow-visible", ink)}
    >
      <path d={paths.area} className="fill-current opacity-15" stroke="none" />
      <path
        d={paths.line}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-current"
      />
    </svg>
  );
}

function valueText(value: React.ReactNode | null): string | null {
  if (value === null) return "No value";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return null;
}

/**
 * `KpiCard` — one KPI tile: label (with an optional hint), a large value, an optional delta line
 * and sparkline, and an optional whole-tile link. The tile is named "label: value, delta"; a value
 * that is an element rather than text is named from the rendered label, value and delta.
 *
 * @example
 * <KpiCard
 *   label="Runs"
 *   value="1,284"
 *   hint="Every agent run that started in the period."
 *   delta={{ text: "+12% vs last week", direction: "up", tone: "positive" }}
 *   spark={[3, 5, 4, 8, 6, 9, 12]}
 *   linkRender={<Link href="/agents/runs" />}
 * />
 */
export function KpiCard({
  label,
  value,
  hint,
  empty,
  tone = "neutral",
  series,
  delta,
  spark,
  linkRender,
  loading = false,
  className,
  ref,
  ...props
}: KpiCardProps) {
  const id = React.useId();
  if (loading) {
    return (
      <Card
        ref={ref}
        size="sm"
        data-slot="kpi-card"
        data-loading=""
        role="group"
        aria-label={label}
        aria-busy
        className={cn("gap-2 px-3", className)}
        {...props}
      >
        <StatSkeleton size="lg" />
        <Skeleton aria-hidden className="h-6 w-full" />
      </Card>
    );
  }

  const text = valueText(value);
  const name = [
    text === null ? label : `${label}: ${text}`,
    value === null && empty ? empty : null,
    delta ? delta.text : null,
  ]
    .filter(Boolean)
    .join(", ");

  // A value that is not plain text (a formatted element) cannot be spelled into a string, so the
  // name is then assembled from the rendered label, value and delta instead.
  const naming =
    text === null
      ? {
          "aria-labelledby": [
            `${id}-label`,
            `${id}-value`,
            delta ? `${id}-delta` : null,
          ]
            .filter(Boolean)
            .join(" "),
        }
      : { "aria-label": name };

  const template = linkRender as
    React.ReactElement<{ className?: string }> | undefined;
  const link = template
    ? React.cloneElement(template, {
        "data-slot": "kpi-card-link",
        ...naming,
        className: cn(
          "absolute inset-0 rounded-xl transition-colors state-layer",
          template.props.className,
        ),
      } as object)
    : null;

  return (
    <Card
      ref={ref}
      size="sm"
      data-slot="kpi-card"
      data-linked={link ? "" : undefined}
      // A plain tile is a named group; a linked tile is named by its link, so the group role
      // would only announce the same name twice.
      role={link ? undefined : "group"}
      {...(link ? {} : naming)}
      className={cn("relative gap-2 px-3", className)}
      {...props}
    >
      {link}
      <div
        data-slot="kpi-card-content"
        className={cn(
          "flex min-w-0 flex-col gap-2",
          link && "pointer-events-none relative",
        )}
      >
        <Stat size="lg">
          {/* The label wraps rather than truncating; the hint stays on its first line. */}
          <div className="flex min-w-0 items-start gap-1">
            <StatLabel id={`${id}-label`} className="min-w-0 wrap-break-word">
              {label}
            </StatLabel>
            {hint ? (
              <InfoHint
                label={`About ${label}`}
                className="pointer-events-auto -my-1"
              >
                {hint}
              </InfoHint>
            ) : null}
          </div>
          {value === null ? (
            // No value: a muted dash at the value's own size, and the reason under it — one rule
            // for every tile, so no tile puts a sentence where its number goes.
            <>
              <StatValue
                id={`${id}-value`}
                data-empty=""
                className="text-muted-foreground"
              >
                <span aria-hidden>—</span>
                <span className="sr-only">No value</span>
              </StatValue>
              {empty ? (
                <StatEmpty className="text-xs">{empty}</StatEmpty>
              ) : null}
            </>
          ) : (
            // A value never truncates: a long text value wraps; a number stays on its one line.
            <StatValue
              id={`${id}-value`}
              data-tone={tone}
              className={cn(
                "min-w-0 tabular-nums wrap-break-word",
                VALUE_TONE[tone],
              )}
            >
              {value}
            </StatValue>
          )}
          {delta ? (
            <StatDelta
              id={`${id}-delta`}
              intent={delta.direction}
              data-tone={delta.tone}
              className={TONE_CLASSES[delta.tone]}
            >
              {delta.text}
            </StatDelta>
          ) : null}
        </Stat>
        {spark && value !== null ? (
          <KpiSpark
            values={spark}
            ink={
              tone !== "neutral"
                ? SPARK_TONE[tone]
                : series
                  ? SPARK_SERIES[series]
                  : "text-chart-single"
            }
          />
        ) : null}
      </div>
    </Card>
  );
}

/** Props for `KpiGrid`. */
export type KpiGridProps = React.ComponentPropsWithRef<"div">;

/**
 * Columns a grid of `n` tiles may take, as container-query classes: only counts that fill every
 * row (the divisors of `n`), so a row never ends in a gap. Literal strings, so Tailwind generates each. A tile is at least 10rem; the gap 0.75rem.
 */
const KPI_COLUMNS: Record<number, string> = {
  2: "@min-[20.75rem]/kpi-grid:grid-cols-2",
  3: "@min-[31.5rem]/kpi-grid:grid-cols-3",
  4: "@min-[42.25rem]/kpi-grid:grid-cols-4",
  5: "@min-[53rem]/kpi-grid:grid-cols-5",
  6: "@min-[63.75rem]/kpi-grid:grid-cols-6",
};

/** The balanced column classes for `n` tiles, or `null` past six (then the grid auto-fills). */
export function kpiGridColumns(n: number): string[] | null {
  if (n > 6) return null;
  return (
    [2, 3, 4, 5, 6]
      // Divisors fill every row; five tiles also take two a row before they stack, since one
      // column of five is worse than a short last row.
      .filter((c) => c <= n && (n % c === 0 || (c === 2 && n === 5)))
      .map((c) => KPI_COLUMNS[c] as string)
  );
}

/**
 * `KpiGrid` — a row of `KpiCard`s, sized by its own width rather than the viewport, and balanced:
 * up to six tiles take only column counts that fill every row (four tiles: 4, then 2 × 2, then
 * one per row; three: 3, then 1), so a row never ends in an empty slot. Past six it fits as many
 * 10rem tiles as there is room for. Group tiles into rows of related numbers — key numbers in one
 * grid, secondary ones in another — rather than one long grid.
 *
 * @example
 * <KpiGrid>
 *   <KpiCard label="Runs" value="1,284" />
 *   <KpiCard label="Failures" value="12" />
 * </KpiGrid>
 */
export function KpiGrid({ className, children, ...props }: KpiGridProps) {
  const n = React.Children.toArray(children).filter(
    React.isValidElement,
  ).length;
  const columns = kpiGridColumns(n);
  return (
    <div
      data-slot="kpi-grid"
      className={cn("@container/kpi-grid min-w-0", className)}
      {...props}
    >
      <div
        data-slot="kpi-grid-tiles"
        className={cn(
          "grid gap-3",
          columns
            ? ["grid-cols-1", ...columns]
            : "grid-cols-[repeat(auto-fill,minmax(min(100%,--spacing(40)),1fr))]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
