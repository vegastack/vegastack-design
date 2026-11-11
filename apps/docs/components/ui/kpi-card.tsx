// @vegastack kpi-card@0.63.1 sha256-UzH8lDMXPUVirPmPjaf0QHIAQ3dVyHlIx21qnC924RM=

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

/** Props for `KpiCard`. */
export interface KpiCardProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** What the number counts ("Runs", "Cost", "p95 latency"). */
  label: string;
  /** The value, already formatted. `null` reads "No data" — never a dash or a zero. */
  value: React.ReactNode | null;
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
   * A trend for the sparkline under the value: 2 to 120 points (only the last 120 are drawn).
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

const SPARK_MAX_POINTS = 120;
const SPARK_HEIGHT = 24;

function sparkPoints(values: readonly number[]): string | null {
  const points = values
    .slice(-SPARK_MAX_POINTS)
    .filter((v) => Number.isFinite(v));
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  // One unit of headroom top and bottom so the stroke is never clipped at the extremes.
  const usable = SPARK_HEIGHT - 2;
  return points
    .map((v, i) => {
      const y =
        span === 0 ? SPARK_HEIGHT / 2 : 1 + usable * (1 - (v - min) / span);
      return `${i},${Math.round(y * 100) / 100}`;
    })
    .join(" ");
}

function KpiSpark({ values }: { values: readonly number[] }) {
  const points = sparkPoints(values);
  if (points === null) return null;
  const count = points.split(" ").length;
  return (
    <svg
      aria-hidden
      focusable="false"
      data-slot="kpi-card-spark"
      viewBox={`0 0 ${count - 1} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      className="block h-6 w-full overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-chart-single"
      />
    </svg>
  );
}

function valueText(value: React.ReactNode | null): string | null {
  if (value === null) return "No data";
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
            <StatEmpty id={`${id}-value`} className="flex h-8 items-center">
              No data
            </StatEmpty>
          ) : (
            // A value never truncates: a long text value wraps; a number stays on its one line.
            <StatValue id={`${id}-value`} className="min-w-0 wrap-break-word">
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
        {spark ? <KpiSpark values={spark} /> : null}
      </div>
    </Card>
  );
}

/** Props for `KpiGrid`. */
export type KpiGridProps = React.ComponentPropsWithRef<"div">;

/**
 * `KpiGrid` — the grid of `KpiCard`s, sized by its own width rather than the viewport: as many
 * tiles per row as fit at 10rem or wider (two on a phone, about five in a 960px settings column),
 * one per row when the container is narrower than a tile.
 *
 * @example
 * <KpiGrid>
 *   <KpiCard label="Runs" value="1,284" />
 *   <KpiCard label="Failures" value="12" />
 * </KpiGrid>
 */
export function KpiGrid({ className, ...props }: KpiGridProps) {
  return (
    <div
      data-slot="kpi-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(min(100%,--spacing(40)),1fr))] gap-3",
        className,
      )}
      {...props}
    />
  );
}
