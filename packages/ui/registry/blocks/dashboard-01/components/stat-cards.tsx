// @vegastack dashboard-01@0.7.2 sha256-mi9oBFPR3gKuXm2aaVIf2AyR05VjjKmMBC7QGr6lmCU=

"use client";

/**
 * `stat-cards.tsx` — the dashboard-01 block's four-up metrics row (audit §e item 2): "Active
 * agents" / "Tasks completed today" / "API calls (24h)" / "Avg. response time", each a `Card`
 * with a full-width wrapping label above a `font-mono` `AnimatedNumber` value and its delta
 * `Badge`.
 *
 * 'use client' — `AnimatedNumber` is a client leaf (tween + `prefers-reduced-motion` hook).
 */

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardDatum {
  /** Stable identifier — used as the React key. */
  key: string;
  /** Human-readable metric label. */
  label: string;
  /** Numeric metric value. */
  value: number;
  /** Percentage change vs. the prior period. Positive = up (`success`), negative = down (`destructive`), 0 = flat. */
  delta: number;
  /** Formatting hint for `value` — omit for a plain grouped integer, or `'ms'` for a millisecond duration. */
  unit?: "ms";
}

/** Props accepted by `StatCards`. */
export interface StatCardsProps {
  /** Metrics rendered in the responsive card grid. */
  stats: StatCardDatum[];
  /** Shows 4 skeleton placeholder cards instead of `stats` — the region's own loading state. @default false */
  loading?: boolean;
}

function formatDelta(delta: number): string {
  return `${Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

/**
 * `StatCards` — renders directly inside `AppShellContent`'s `@container/app-shell-content`
 * (audit §e item 2): `grid-cols-1` on narrow content, `@sm/app-shell-content:grid-cols-2`,
 * `@lg/app-shell-content:grid-cols-4` — driven by the CONTENT region's own width (sidebar
 * collapse-aware via a Tailwind v4 native container query), not the viewport, since collapsing
 * the sidebar changes available width independent of viewport size (`app-shell.tsx`'s own doc).
 *
 * @example <StatCards stats={stats} />
 */
export function StatCards({ stats, loading = false }: StatCardsProps) {
  return (
    <div
      data-slot="dashboard-stat-cards"
      className="grid grid-cols-1 gap-4 @sm/app-shell-content:grid-cols-2 @lg/app-shell-content:grid-cols-4"
    >
      {loading
        ? Array.from({ length: 4 }, (_, i) => (
            <Card key={i} aria-hidden="true">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))
        : stats.map((stat) => {
            const trend =
              stat.delta > 0 ? "up" : stat.delta < 0 ? "down" : "flat";
            return (
              <Card key={stat.key} data-slot="dashboard-stat-card">
                <CardHeader>
                  {/* The label owns the whole header row and WRAPS to at most two lines.
                      It used to `truncate` next to a fixed-width trend badge, which at the
                      2-column width cut every label in the sample data ("Active agen…",
                      "Tasks compl…", "API calls (24…", "Avg. respons…"). A KPI label is the
                      one thing on a stat card that must never be clipped — the number is
                      meaningless without it — so the badge moved down to the value row,
                      where it sits beside a short, mono, predictable-width figure. */}
                  <CardTitle className="line-clamp-2 text-label-sm font-normal text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* min-w-0 on the value+badge row (audit §d footgun): a fixed-width
                      trailing badge would otherwise force the row to overflow. */}
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <AnimatedNumber
                      value={stat.value}
                      format={
                        stat.unit === "ms"
                          ? {
                              style: "unit",
                              unit: "millisecond",
                              unitDisplay: "short",
                            }
                          : { maximumFractionDigits: 0 }
                      }
                      className="min-w-0 font-mono text-2xl text-foreground"
                    />
                    <Badge
                      variant="soft"
                      intent={
                        trend === "up"
                          ? "success"
                          : trend === "down"
                            ? "destructive"
                            : "default"
                      }
                      className="shrink-0"
                    >
                      {trend === "up" ? (
                        <ArrowUp />
                      ) : trend === "down" ? (
                        <ArrowDown />
                      ) : (
                        <Minus />
                      )}
                      {formatDelta(stat.delta)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}
