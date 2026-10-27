// @vegastack stat@0.25.95 sha256-7jdJloy8tUdP5lkGVRhoaV+snA3+mGB0LSjw2czu1NQ=

"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@vegastack/design";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------------------------------------
 * Stat — a labelled value block (Wave 2c, from the app-teardown record-highlights pattern):
 * `text-xs font-medium` muted label over a foreground value, with an HONEST empty treatment ("No
 * connection" in the faint register) instead of a dash. Server-safe, purely presentational.
 * Two scales: `default` (record-page highlights, 14px value) and `lg` (dashboard stat tiles,
 * 24px value on the type-scale cap).
 * ----------------------------------------------------------------------------------------------*/

export const statValueVariants = cva("font-medium text-foreground", {
  variants: {
    size: {
      md: "text-sm",
      lg: "text-2xl tabular-nums",
    },
  },
  defaultVariants: { size: "md" },
});

const StatSizeContext = React.createContext<"md" | "lg">("md");

/** Props for a labelled statistic group. */
export interface StatProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Scale — `default` for facts/highlights rows, `lg` for dashboard tiles.
   * @default 'md'
   */
  size?: "md" | "lg";
}

/**
 * `Stat` — compose `StatLabel` + `StatValue` (or `StatEmpty` when there is no
 * value) and optionally `StatDelta` for a change indicator.
 *
 * @example
 * <Stat>
 *   <StatLabel>Estimated ARR</StatLabel>
 *   <StatValue>$1M–$10M</StatValue>
 * </Stat>
 *
 * @example
 * <Stat size="lg">
 *   <StatLabel>Active companies</StatLabel>
 *   <StatValue>1,284</StatValue>
 *   <StatDelta intent="up">+12% this month</StatDelta>
 * </Stat>
 */
export function Stat({ className, size = "md", ref, ...props }: StatProps) {
  return (
    <StatSizeContext.Provider value={size}>
      <div
        ref={ref}
        data-slot="stat"
        data-size={size}
        className={cn("flex min-w-0 flex-col gap-1", className)}
        {...props}
      />
    </StatSizeContext.Provider>
  );
}

/** Native props for the statistic label. */
export type StatLabelProps = React.ComponentPropsWithRef<"div">;

/** `StatLabel` — the muted label above the value. @example <StatLabel>Revenue</StatLabel> */
export function StatLabel({ className, ...props }: StatLabelProps) {
  return (
    <div
      data-slot="stat-label"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Native props for the statistic value. */
export type StatValueProps = React.ComponentPropsWithRef<"div">;

/** `StatValue` — the value line. @example <StatValue>$1M</StatValue> */
export function StatValue({ className, ...props }: StatValueProps) {
  const size = React.useContext(StatSizeContext);
  return (
    <div
      data-slot="stat-value"
      className={cn(statValueVariants({ size }), className)}
      {...props}
    />
  );
}

/** Native props for an honest empty statistic value. */
export type StatEmptyProps = React.ComponentPropsWithRef<"div">;

/**
 * `StatEmpty` — the honest empty value ("No connection", "No team"): a muted,
 * contrast-safe phrase instead of a dash or a zero that would read as data.
 * @example <StatEmpty>No connection</StatEmpty>
 */
export function StatEmpty({ className, children, ...props }: StatEmptyProps) {
  return (
    <div
      data-slot="stat-empty"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children ?? "No data"}
    </div>
  );
}

/** Props for a directional change line beneath a statistic. */
export interface StatDeltaProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Direction of the change — `up` reads success, `down` reads destructive,
   * `flat` stays muted. Pair the copy with a sign/arrow; color is never the
   * only signal.
   * @default 'flat'
   */
  intent?: "up" | "down" | "flat";
}

const DELTA_CLASSES: Record<NonNullable<StatDeltaProps["intent"]>, string> = {
  up: "text-success-text",
  down: "text-destructive-text",
  flat: "text-muted-foreground",
};

/** `StatDelta` — a small change line. @example <StatDelta intent="up">+12%</StatDelta> */
export function StatDelta({
  className,
  intent = "flat",
  ...props
}: StatDeltaProps) {
  return (
    <div
      data-slot="stat-delta"
      data-intent={intent}
      className={cn("text-xs font-medium", DELTA_CLASSES[intent], className)}
      {...props}
    />
  );
}

/** Props for `StatSkeleton`. */
export interface StatSkeletonProps {
  /** The scale of the Stat it stands in for. @default "md" */
  size?: "md" | "lg";
  /** Classes for the block. @default undefined */
  className?: string;
}

/** `StatSkeleton` — a Stat while it loads: a label bar over a value bar at the Stat's own scale. @example <StatSkeleton size="lg" /> */
export function StatSkeleton({ size = "md", className }: StatSkeletonProps) {
  return (
    <div
      aria-hidden
      data-slot="stat-skeleton"
      data-size={size}
      className={cn("flex min-w-0 flex-col gap-1", className)}
    >
      {/* Each bar sits in the line box of the text it stands in for (the label's 16px, the
          value's 20px or 32px), so a stat is exactly as tall loading as loaded. */}
      <div data-slot="stat-skeleton-label" className="flex h-4 items-center">
        <Skeleton className="h-3 w-16" />
      </div>
      <div
        data-slot="stat-skeleton-value"
        className={cn("flex items-center", size === "lg" ? "h-8" : "h-5")}
      >
        <Skeleton className={size === "lg" ? "h-7 w-14" : "h-4 w-12"} />
      </div>
    </div>
  );
}

/** One stat in a `StatGroup`. */
export interface StatGroupItem {
  /**
   * Stable key; the label is used when omitted.
   * @default undefined
   */
  id?: string;
  /** The label, read before the value ("Overdue 3"). */
  label: string;
  /** The count: `undefined` while it loads, `null` when the read failed (never shown as 0). */
  value: number | null | undefined;
  /**
   * The list the stat counts — the cell becomes a link through `linkRender`.
   * @default undefined
   */
  href?: string;
}

/** Props accepted by `StatGroup`. */
export interface StatGroupProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The stats, in order — usually two to four. */
  items: readonly StatGroupItem[];
  /**
   * Render nothing when every value is exactly `0` (loading and failed values are not zero), so
   * an all-quiet row takes no space.
   * @default false
   */
  hideWhenAllZero?: boolean;
  /**
   * The element a linked cell renders as — your router's link (`<Link />`). The cell's `href`,
   * classes and children are merged into it.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * Scale of each stat's value.
   * @default "lg"
   */
  size?: "md" | "lg";
  /**
   * Formats a value.
   * @default (n) => n.toLocaleString()
   */
  formatValue?: (value: number) => string;
  /**
   * Shown under the dash when a value failed to load.
   * @default "Couldn't load"
   */
  errorLabel?: string;
}

/**
 * `StatGroup` — a row of inline stats ("Overdue 3 · Today 5 · Upcoming 12 · Done 40") in one
 * hairline-divided strip, each cell optionally a link to the list it counts. It follows its own
 * width: one row from 24rem, a 2×2 grid below it. A loading value holds its line with a skeleton,
 * a failed one reads "—" with `errorLabel`, and `hideWhenAllZero` drops a row with nothing to say.
 *
 * @example
 * <StatGroup
 *   hideWhenAllZero
 *   linkRender={<Link href="" />}
 *   items={[
 *     { label: "Overdue", value: 1, href: "/tasks?due=overdue" },
 *     { label: "Today", value: 3, href: "/tasks?due=today" },
 *     { label: "Upcoming", value: 12, href: "/tasks?due=upcoming" },
 *     { label: "Waiting on you", value: 2, href: "/inbox" },
 *   ]}
 * />
 */
export function StatGroup({
  items,
  hideWhenAllZero = false,
  linkRender,
  size = "lg",
  formatValue = (n) => n.toLocaleString(),
  errorLabel = "Couldn't load",
  className,
  ...props
}: StatGroupProps) {
  if (
    hideWhenAllZero &&
    items.length > 0 &&
    items.every((item) => item.value === 0)
  )
    return null;
  const cellClass =
    "flex min-w-0 flex-col justify-center bg-card px-3 py-2.5 text-start";
  return (
    <div
      data-slot="stat-group"
      className={cn("@container/stat-group min-w-0", className)}
      {...props}
    >
      <div
        data-slot="stat-group-grid"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border @sm/stat-group:auto-cols-fr @sm/stat-group:grid-flow-col @sm/stat-group:grid-cols-none"
      >
        {items.map((item) => {
          const stat = (
            <Stat size={size}>
              <StatLabel>{item.label}</StatLabel>
              {item.value === undefined ? (
                // Inside the value's own line box, so a cell is as tall loading as loaded.
                <StatValue aria-hidden>
                  <Skeleton className="inline-block h-[0.75em] w-10 align-middle" />
                </StatValue>
              ) : item.value === null ? (
                <>
                  <StatValue aria-hidden>—</StatValue>
                  <StatEmpty className="text-xs">{errorLabel}</StatEmpty>
                </>
              ) : (
                <StatValue>{formatValue(item.value)}</StatValue>
              )}
            </Stat>
          );
          const key = item.id ?? item.label;
          if (item.href === undefined)
            return (
              <div
                key={key}
                data-slot="stat-group-item"
                aria-busy={item.value === undefined ? true : undefined}
                className={cellClass}
              >
                {stat}
              </div>
            );
          const template = (linkRender ?? <a />) as React.ReactElement<{
            className?: string;
          }>;
          return React.cloneElement(
            template,
            {
              key,
              href: item.href,
              "data-slot": "stat-group-item",
              "aria-busy": item.value === undefined ? true : undefined,
              className: cn(
                cellClass,
                "transition-colors hover:bg-muted",
                template.props.className,
              ),
            } as object,
            stat,
          );
        })}
      </div>
    </div>
  );
}
