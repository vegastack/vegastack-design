// @vegastack context-panel@0.77.0 sha256-0aaKj66T0dpenCA543siykY66R88RpJSIiq+zazm9NE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------------------------------------
 * ContextPanel — what fills a chat's working memory, adding up to its window: "26% used  25.9k /
 * 200k", one segmented bar, and a legend (swatch, label, tokens, share) in tabular columns that ends
 * with what's free. Then where older messages get summarised, and Summarize now for whoever may send.
 * It is the body of `ContextRing`'s hover panel and of a phone's or a side panel's Context section.
 * Tokens and shares only, never money.
 * ----------------------------------------------------------------------------------------------*/

/** One part of what fills the window: "Conversation", 6,900 tokens. */
export interface ContextPart {
  /** A stable key. */
  id: string;
  /** What it is: "Instructions and tools", "Memory", "Conversation", "Tool results". */
  label: React.ReactNode;
  /** Its size, in tokens. */
  tokens: number;
}

/** The panel's words. */
export interface ContextPanelLabels {
  /** The title. @default "Chat memory" */
  title?: string;
  /** The share line. @default (percent) => `${percent}% used` */
  used?: (percent: number) => string;
  /** Measured tokens the parts don't name. @default "Other" */
  other?: string;
  /** What's left of the window. @default "Free" */
  free?: string;
  /** The note under the legend. @default (percent) => `Older messages are summarised at ${percent}%.` */
  threshold?: (percent: number) => string;
  /** @default "Summarize now" */
  summarize?: string;
  /** Before the chat's first answer. @default "Measured after the first answer." */
  empty?: string;
}

/** Props accepted by `ContextPanel`. */
export interface ContextPanelProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** Tokens the last request carried; `null` before the chat's first answer. */
  used: number | null;
  /** The chat's working window, in tokens (the model it runs on decides it). */
  window: number;
  /** Where older messages get summarised, as a share of the window (0–1). @default 0.9 */
  threshold?: number;
  /** What fills the window, in order; any measured remainder lists as Other. @default [] */
  parts?: readonly ContextPart[];
  /**
   * Summarize older messages now. Without it there is no button (a reader who can't send). A
   * returned promise keeps the button busy until it settles.
   * @default undefined
   */
  onSummarize?: () => void | Promise<unknown>;
  /** A summary is under way (the host's state, a live one included). @default false */
  summarizing?: boolean;
  /** Words for a token count. @default compact: 25.9k, 1.2M */
  formatTokens?: (tokens: number) => string;
  /** The panel's words. @default undefined */
  labels?: ContextPanelLabels;
}

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
/** Tokens as the panel says them: 25.9k, 200k, 1M. */
export const formatContextTokens = (tokens: number) =>
  compact.format(tokens).replace("K", "k");

/** One swatch per part, in order, from the chart set; free is a hollow swatch. */
const SWATCHES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
] as const;

const share = (tokens: number, of: number) =>
  of > 0 ? `${((tokens / of) * 100).toFixed(1)}%` : "0.0%";

/**
 * `ContextPanel` — a chat's memory, adding up to its window: the share used, one segmented bar, the
 * parts with tokens and shares, what's free, the summary note and Summarize now.
 *
 * @example
 * <ContextPanel
 *   used={25_900}
 *   window={200_000}
 *   parts={[
 *     { id: "instructions", label: "Instructions and tools", tokens: 15_700 },
 *     { id: "memory", label: "Memory", tokens: 2_100 },
 *     { id: "conversation", label: "Conversation", tokens: 6_900 },
 *     { id: "tools", label: "Tool results", tokens: 1_200 },
 *   ]}
 *   onSummarize={summarize}
 * />
 */
export function ContextPanel({
  used,
  window: windowTokens,
  threshold = 0.9,
  parts = [],
  onSummarize,
  summarizing = false,
  formatTokens = formatContextTokens,
  labels,
  className,
  ...props
}: ContextPanelProps) {
  const [pending, setPending] = React.useState(false);
  const busy = summarizing || pending;
  const summarize = () => {
    const result = onSummarize?.();
    if (!result || typeof result.then !== "function") return;
    setPending(true);
    void Promise.resolve(result)
      .catch(() => undefined)
      .finally(() => setPending(false));
  };

  const measured = used !== null && windowTokens > 0;
  const total = measured ? Math.min(used, windowTokens) : 0;
  const percent = measured ? Math.round((total / windowTokens) * 100) : null;
  const named = parts.reduce((sum, part) => sum + part.tokens, 0);
  // The legend always adds up to the window: whatever the parts don't name is Other.
  const rows: { id: string; label: React.ReactNode; tokens: number }[] =
    measured
      ? [
          ...parts,
          ...(total > named
            ? [
                {
                  id: "other",
                  label: labels?.other ?? "Other",
                  tokens: total - named,
                },
              ]
            : []),
        ]
      : [];
  const free = measured
    ? Math.max(0, windowTokens - Math.max(total, named))
    : 0;
  const thresholdPercent = Math.round(threshold * 100);

  return (
    <div
      data-slot="context-panel"
      className={cn("flex min-w-0 flex-col gap-2.5 text-sm", className)}
      {...props}
    >
      <p data-slot="context-panel-title" className="font-medium">
        {labels?.title ?? "Chat memory"}
      </p>
      {measured ? (
        <>
          <p
            data-slot="context-panel-used"
            className="flex items-baseline justify-between gap-3 tabular-nums"
          >
            <span>{labels?.used?.(percent!) ?? `${percent}% used`}</span>
            <span className="text-muted-foreground">
              {formatTokens(total)} / {formatTokens(windowTokens)}
            </span>
          </p>
          <span
            aria-hidden
            data-slot="context-panel-bar"
            className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-muted"
          >
            {rows.map((row, index) =>
              row.tokens > 0 ? (
                <span
                  key={row.id}
                  className={cn(
                    "block h-full shrink-0",
                    SWATCHES[index % SWATCHES.length],
                  )}
                  style={{ width: `${(row.tokens / windowTokens) * 100}%` }}
                />
              ) : null,
            )}
          </span>
          <dl
            data-slot="context-panel-parts"
            className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2.5 gap-y-1 text-xs"
          >
            {rows.map((row, index) => (
              <React.Fragment key={row.id}>
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-xs",
                    SWATCHES[index % SWATCHES.length],
                  )}
                />
                <dt className="min-w-0 truncate text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="text-end tabular-nums">
                  {formatTokens(row.tokens)}
                </dd>
                <dd className="min-w-10 text-end text-muted-foreground tabular-nums">
                  {share(row.tokens, windowTokens)}
                </dd>
              </React.Fragment>
            ))}
            <span
              aria-hidden
              className="size-1.5 rounded-xs border border-muted-foreground/50"
            />
            <dt className="min-w-0 truncate text-muted-foreground">
              {labels?.free ?? "Free"}
            </dt>
            <dd className="text-end tabular-nums">{formatTokens(free)}</dd>
            <dd className="min-w-10 text-end text-muted-foreground tabular-nums">
              {share(free, windowTokens)}
            </dd>
          </dl>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          {labels?.empty ?? "Measured after the first answer."}
        </p>
      )}
      <p
        data-slot="context-panel-threshold"
        className="text-xs text-muted-foreground"
      >
        {labels?.threshold?.(thresholdPercent) ??
          `Older messages are summarised at ${thresholdPercent}%.`}
      </p>
      {onSummarize ? (
        <Button
          variant="secondary"
          size="sm"
          data-slot="context-panel-summarize"
          loading={busy}
          disabled={busy || !measured}
          onClick={summarize}
          className="self-end"
        >
          {labels?.summarize ?? "Summarize now"}
        </Button>
      ) : null}
    </div>
  );
}
