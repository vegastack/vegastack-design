// @vegastack chart@0.81.0 sha256-DxVZYqeypjVYPoNNxtDwagI+eGd3VgfKZJ+5kRqCRgU=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import * as RechartsPrimitive from "recharts";
import type { TooltipValueType } from "recharts";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

/**
 * API-43: what a series means, as a typed tone rather than a colour string. `series-1`…`series-8`
 * are the categorical palette (identity), `single` the one-series ink, and the status tones carry
 * meaning (`success` done, `warning` attention, `danger` failed, `info`, `neutral` nothing
 * happened). Each resolves to its token, so light and dark both hold.
 */
export type ChartTone =
  | "series-1"
  | "series-2"
  | "series-3"
  | "series-4"
  | "series-5"
  | "series-6"
  | "series-7"
  | "series-8"
  | "single"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

/** API-43: each tone's token. */
export const CHART_TONE_COLORS: Record<ChartTone, string> = {
  "series-1": "var(--chart-1)",
  "series-2": "var(--chart-2)",
  "series-3": "var(--chart-3)",
  "series-4": "var(--chart-4)",
  "series-5": "var(--chart-5)",
  "series-6": "var(--chart-6)",
  "series-7": "var(--chart-7)",
  "series-8": "var(--chart-8)",
  single: "var(--chart-single)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  info: "var(--info)",
  neutral: "var(--muted-foreground)",
};

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { tone: ChartTone; color?: never; theme?: never }
    | { tone?: never; color?: string; theme?: never }
    | {
        tone?: never;
        color?: never;
        theme: Record<keyof typeof THEMES, string>;
      }
  )
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          // FOC-1: upstream's last reset is `[&_.recharts-surface]:outline-hidden`, and
          // `.recharts-surface` IS the element recharts makes focusable — with
          // `accessibilityLayer` (default `true` since 3.9.2) `RootSurface` renders the root
          // `<svg>` with `role="application"` and `tabIndex={0}`. `outline-hidden` compiles to
          // `--tw-outline-style: none` on the element itself, and every outline utility —
          // `base.css`'s global `:focus-visible` included — resolves
          // `outline-style: var(--tw-outline-style)`, so left unscoped it silently defeats the
          // one focus affordance on the one element the component made keyboard-reachable.
          // Scoping it to `:not(:focus-visible)` keeps upstream's reset everywhere it was meant
          // (the resting surface) and gives the focused chart its outline back.
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface:not(:focus-visible)]:outline-hidden",
          // FOC-9: the plot area fills the surface edge to edge, so an outward offset would be
          // drawn over the chart's own frame. Width, colour and token stay in `base.css`; only
          // the offset inverts, which is FOC-9's one permitted local deviation.
          "[&_svg:focus-visible]:-outline-offset-2",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={initialDimension}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme ?? config.color ?? config.tone,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color ??
      (itemConfig.tone ? CHART_TONE_COLORS[itemConfig.tone] : undefined);
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  valueFormatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    /**
     * API-43: formats one row's VALUE cell only ("$1.20", "14.4K · 2 failed"); the row keeps its
     * indicator, its label and the gap between them. Prefer it to upstream's `formatter`, which
     * replaces the whole row.
     */
    valueFormatter?: (
      value: TooltipValueType,
      name: TooltipNameType,
      item: unknown,
    ) => React.ReactNode;
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >,
    "accessibilityLayer"
  >) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        // API-43: a tooltip never grows past 20rem; a long series name truncates in its cell.
        "grid max-w-80 min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color ?? item.payload?.fill ?? item.color;

            return (
              <div
                key={index}
                data-slot="chart-tooltip-row"
                className={cn(
                  // API-43: the row is a grid — indicator · label · value — with a built-in gap,
                  // so a long label can never run into its number ("Claude Haiku 5.514,392").
                  "grid w-full items-stretch gap-x-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  formatter
                    ? "flex flex-wrap"
                    : itemConfig?.icon || !hideIndicator
                      ? "grid-cols-[auto_minmax(0,1fr)]"
                      : "grid-cols-[minmax(0,1fr)]",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-4 leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid min-w-0 gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span
                          data-slot="chart-tooltip-label"
                          className="truncate text-muted-foreground"
                        >
                          {itemConfig?.label ?? item.name}
                        </span>
                      </div>
                      {item.value != null && (
                        <span
                          data-slot="chart-tooltip-value"
                          className="text-end font-mono font-medium whitespace-nowrap text-foreground tabular-nums"
                        >
                          {valueFormatter
                            ? valueFormatter(item.value, item.name ?? key, item)
                            : typeof item.value === "number"
                              ? item.value.toLocaleString()
                              : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        // API-43: legend items wrap onto more lines instead of overflowing the chart.
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={index}
              className={cn(
                "flex min-w-0 items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              <span className="max-w-40 truncate">{itemConfig?.label}</span>
            </div>
          );
        })}
    </div>
  );
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
