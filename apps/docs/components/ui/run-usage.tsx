// @vegastack run-usage@0.73.0 sha256-RMNyCTG/LHzc1NBi4/1zES/roECmg1S1/P39BmfVy0E=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/date-time";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { useOverflow } from "@/components/ui/use-overflow";

/* ------------------------------------------------------------------------------------------------
 * Run usage — what one agent run used: its steps, tokens, cache, time and (for people allowed to
 * see it) money. Three sizes over one data shape: a chip under an answer, a panel in a run drawer,
 * and a table with one row per model call.
 *
 * Every number is the host's. A number the provider did not report but the host worked out
 * (`basis: "estimated"`) reads "~". Money is optional everywhere: leave `cost` out and no money
 * shows, which is how a reader who may not see dollars gets the same parts.
 * ----------------------------------------------------------------------------------------------*/

/** Where a number came from: the provider reported it, the host estimated it, or counted it. */
export type RunUsageBasis = "reported" | "estimated" | "counted";

/** How one call used the prompt cache. `miss`: nothing read; `write`: it stored a prefix. */
export type RunUsageCacheResult = "hit" | "partial" | "miss" | "write" | "none";

/** Tokens, split the way providers bill them. */
export interface RunUsageTokens {
  /** Prompt tokens read fresh, not from the cache. */
  new: number;
  /** Prompt tokens read from the cache. @default 0 */
  cacheRead?: number;
  /** Prompt tokens written to the 5-minute cache. @default 0 */
  cacheWrite?: number;
  /** Prompt tokens written to the 1-hour cache. @default 0 */
  cacheWrite1h?: number;
  /** Output tokens, thinking included. @default 0 */
  output?: number;
  /** The part of `output` that was thinking. @default undefined */
  reasoning?: number;
}

/** The run's totals, for the chip and the panel's head. */
export interface RunUsageSummary {
  /** Model calls (steps) in the run. */
  steps: number;
  /** The largest prompt the run sent, in tokens. @default undefined */
  contextTokens?: number;
  /** The working window that prompt counts against, in tokens; with it, the chip shows a %. @default undefined */
  contextWindow?: number;
  /** Prompt tokens read from the cache ÷ all prompt tokens, 0–1. @default undefined */
  cachedRatio?: number;
  /** Money, in `currency`. Leave it out for readers who never see money. @default undefined */
  cost?: number | null;
  /** Where the totals came from. @default "reported" */
  basis?: RunUsageBasis;
  /** Web searches. @default undefined */
  searches?: number;
  /** Scripts run. @default undefined */
  scripts?: number;
  /** Subagents started. @default undefined */
  subagents?: number;
  /** Calls retried. @default undefined */
  retries?: number;
  /** Time spent in model calls, in ms. @default undefined */
  modelMs?: number;
  /** Time spent in tools, in ms. @default undefined */
  toolMs?: number;
  /** Wall time from start to end, in ms. @default undefined */
  wallMs?: number;
  /** The whole run including its Subagents' runs: money and tokens. @default undefined */
  tree?: { cost?: number | null; tokens?: number; basis?: RunUsageBasis };
}

/** One model's share of a run. */
export interface RunUsageModel {
  /** The model's display name: "Claude Haiku 5.5". */
  model: string;
  /** Calls to it. */
  steps: number;
  /** Its tokens. */
  tokens: RunUsageTokens;
  /** Its money. @default undefined */
  cost?: number | null;
  /** Time in its calls, in ms. @default undefined */
  ms?: number;
  /** Where its numbers came from. @default "reported" */
  basis?: RunUsageBasis;
}

/** One model call: a row of `RunUsageTable`, and a cache line in `RunUsagePanel`. */
export interface RunUsageCall {
  /** A stable key. */
  id: string;
  /** The model's display name. */
  model: string;
  /** Why it was called, in words: "Step", "Subagent", "Summary", "Title". */
  purpose: React.ReactNode;
  /** The Subagent that made the call, when one did. @default undefined */
  subagent?: React.ReactNode;
  /** Its tokens. */
  tokens: RunUsageTokens;
  /** How it used the cache. @default undefined */
  cache?: RunUsageCacheResult;
  /** Why the cache missed, in words: "The instructions changed". @default undefined */
  cacheReason?: React.ReactNode;
  /** How long it took, in ms. @default undefined */
  ms?: number;
  /** Its money. @default undefined */
  cost?: number | null;
  /** Where its numbers came from. @default "reported" */
  basis?: RunUsageBasis;
}

/** How each kind of number is written. Every function is optional. */
export interface RunUsageFormat {
  /** Tokens: 62000 → "62k". */
  tokens?: (value: number) => string;
  /** Money: 0.031 → "$0.03", 0.004 → "<$0.01". */
  money?: (value: number) => string;
  /** A share, 0–1: 0.62 → "62 %". */
  percent?: (value: number) => string;
  /** A duration in ms: 400 → "0.4s", 14000 → "14s". */
  duration?: (ms: number) => string;
  /** A plain count: 1200 → "1,200". */
  count?: (value: number) => string;
}

/** Every word the parts show. */
export interface RunUsageLabels {
  steps: (n: number) => string;
  stepsHeading: string;
  contextHeading: string;
  cachedHeading: string;
  context: string;
  cached: string;
  cost: string;
  time: string;
  modelTime: string;
  toolTime: string;
  byModel: string;
  model: string;
  purpose: string;
  newTokens: string;
  cacheRead: string;
  cacheWrite: string;
  cacheWrite1h: string;
  output: string;
  thinking: string;
  cache: string;
  duration: string;
  activity: string;
  searches: string;
  scripts: string;
  subagents: string;
  retries: string;
  tree: string;
  cacheHeading: string;
  cacheSummary: (read: number, total: number) => string;
  cacheResults: Record<RunUsageCacheResult, string>;
  estimated: string;
  empty: string;
  loading: string;
  error: string;
  retry: string;
  calls: string;
  total: string;
  usage: string;
}

const DEFAULT_LABELS: RunUsageLabels = {
  steps: (n) => (n === 1 ? "1 step" : `${n} steps`),
  stepsHeading: "Steps",
  contextHeading: "Peak context",
  cachedHeading: "Cached",
  context: "context",
  cached: "cached",
  cost: "Cost",
  time: "Time",
  modelTime: "Model time",
  toolTime: "Tool time",
  byModel: "By model",
  model: "Model",
  purpose: "Purpose",
  newTokens: "New",
  cacheRead: "Cache read",
  cacheWrite: "Cache write",
  cacheWrite1h: "Cache write (1 h)",
  output: "Output",
  thinking: "thinking",
  cache: "Cache",
  duration: "Time",
  activity: "Activity",
  searches: "Searches",
  scripts: "Scripts",
  subagents: "Subagents",
  retries: "Retries",
  tree: "With Subagents",
  cacheHeading: "Cache by step",
  cacheSummary: (read, total) =>
    `${read} of ${total} ${total === 1 ? "step" : "steps"} read from the cache`,
  cacheResults: {
    hit: "Hit",
    partial: "Partly",
    miss: "Missed",
    write: "Stored",
    none: "Not used",
  },
  estimated: "about",
  empty: "No usage for this run yet.",
  loading: "Loading usage",
  error: "Usage couldn't be loaded.",
  retry: "Try again",
  calls: "Model calls",
  total: "Total",
  usage: "Run usage",
};

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plain = new Intl.NumberFormat("en-US");
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DEFAULT_FORMAT: Required<RunUsageFormat> = {
  tokens: (value) => compact.format(value).toLowerCase(),
  money: (value) => (value > 0 && value < 0.005 ? "<$0.01" : usd.format(value)),
  percent: (value) => `${Math.round(value * 100)} %`,
  duration: (ms) =>
    ms < 1000
      ? `${(Math.max(0, ms) / 1000).toFixed(1)}s`
      : formatDuration(ms, { unit: "milliseconds" }),
  count: (value) => plain.format(value),
};

function words(
  labels: Partial<RunUsageLabels> | undefined,
  format: RunUsageFormat | undefined,
) {
  return {
    l: { ...DEFAULT_LABELS, ...labels } as RunUsageLabels,
    f: { ...DEFAULT_FORMAT, ...format } as Required<RunUsageFormat>,
  };
}

/** A number, with "~" before it when it was estimated (read as "about"). */
function Num({
  basis,
  estimatedLabel,
  children,
}: {
  basis?: RunUsageBasis;
  estimatedLabel: string;
  children: React.ReactNode;
}) {
  if (basis !== "estimated") return <>{children}</>;
  return (
    <span data-slot="run-usage-estimated" data-basis="estimated">
      <span aria-hidden>~</span>
      <span className="sr-only">{estimatedLabel} </span>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * RunUsageChip
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `RunUsageChip`. */
export interface RunUsageChipProps extends React.ComponentProps<"span"> {
  /** The run's totals. `cost` shows only when passed. */
  summary: RunUsageSummary;
  /** Words. @default English */
  labels?: Partial<RunUsageLabels>;
  /** Number formats. @default compact tokens, USD, "62 %", "14s" */
  format?: RunUsageFormat;
}

/**
 * `RunUsageChip` — one muted line under an answer: "3 steps · 62k context (62 %) · 92 % cached ·
 * $0.03". Each part shows only when its number is passed, so a reader who may not see money gets
 * the line without it. Not interactive: wrap it in the host's own trigger to open the panel.
 *
 * @example
 * <RunUsageChip summary={{ steps: 3, contextTokens: 62000, contextWindow: 100000, cachedRatio: 0.92, cost: 0.031 }} />
 */
export function RunUsageChip({
  summary,
  labels,
  format,
  className,
  ...props
}: RunUsageChipProps) {
  const { l, f } = words(labels, format);
  const est = l.estimated;
  const parts: React.ReactNode[] = [l.steps(summary.steps)];
  if (summary.contextTokens != null) {
    parts.push(
      <Num basis={summary.basis} estimatedLabel={est}>
        {`${f.tokens(summary.contextTokens)} ${l.context}`}
        {summary.contextWindow
          ? ` (${f.percent(summary.contextTokens / summary.contextWindow)})`
          : null}
      </Num>,
    );
  }
  if (summary.cachedRatio != null) {
    parts.push(`${f.percent(summary.cachedRatio)} ${l.cached}`);
  }
  if (summary.cost != null) {
    parts.push(
      <Num basis={summary.basis} estimatedLabel={est}>
        {f.money(summary.cost)}
      </Num>,
    );
  }
  return (
    <span
      data-slot="run-usage-chip"
      className={cn(
        "min-w-0 text-xs text-muted-foreground tabular-nums",
        className,
      )}
      {...props}
    >
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <>
              {" "}
              <span aria-hidden>·</span>{" "}
            </>
          ) : null}
          <span className="whitespace-nowrap">{part}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Announces the error line when the parts move into `error` after mounting (a load that failed
 * while the reader watched); an error present at first paint is part of the page and stays quiet.
 */
function useErrorAnnouncement(state: RunUsageState, message: string) {
  const { announce, Announcer } = useAnnouncer();
  const [previous, setPrevious] = React.useState(state);
  React.useEffect(() => {
    if (state === previous) return;
    setPrevious(state);
    if (state === "error") announce(message);
  }, [state, previous, message, announce]);
  return Announcer;
}

/* ------------------------------------------------------------------------------------------------
 * RunUsagePanel
 * ----------------------------------------------------------------------------------------------*/

/** What the panel or table is showing. */
export type RunUsageState = "ready" | "loading" | "error";

/** Props accepted by `RunUsagePanel`. */
export interface RunUsagePanelProps extends React.ComponentProps<"section"> {
  /** The run's totals. Leave it out while loading. @default undefined */
  summary?: RunUsageSummary;
  /** One entry per model the run used. @default [] */
  models?: readonly RunUsageModel[];
  /** The calls, for the cache-by-step lines. @default [] */
  calls?: readonly RunUsageCall[];
  /** `loading` shows placeholders; `error` the error line and Retry. @default "ready" */
  state?: RunUsageState;
  /** Why it failed, under the error line. @default undefined */
  error?: React.ReactNode;
  /** Shows Try again on an error. @default undefined */
  onRetry?: () => void;
  /** The watermark at the foot: "Data as of 14:02". @default undefined */
  asOf?: React.ReactNode;
  /** The panel's heading, which also names it. @default "Run usage" */
  heading?: React.ReactNode;
  /** Words. @default English */
  labels?: Partial<RunUsageLabels>;
  /** Number formats. @default compact tokens, USD, "62 %", "14s" */
  format?: RunUsageFormat;
}

function Stat({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="run-usage-stat" className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground tabular-nums">{children}</dd>
    </div>
  );
}

function Fallback({
  state,
  error,
  onRetry,
  l,
}: {
  state: RunUsageState;
  error?: React.ReactNode;
  onRetry?: () => void;
  l: RunUsageLabels;
}) {
  if (state === "loading") {
    return (
      <div data-slot="run-usage-loading" className="flex flex-col gap-3">
        <span role="status" className="sr-only">
          {l.loading}
        </span>
        <div
          aria-hidden
          className="grid grid-cols-2 gap-3 @md/run-usage:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9" />
          ))}
        </div>
        <Skeleton aria-hidden className="h-16" />
      </div>
    );
  }
  return (
    <div
      data-slot="run-usage-error"
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-destructive-text">{l.error}</span>
        {error ? (
          <span className="text-xs text-muted-foreground">{error}</span>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {l.retry}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * `RunUsagePanel` — a run's usage in full, for a run drawer: totals (steps, peak context, cache,
 * cost, model and tool time), each model's tokens (new · cache read · cache write · 1-hour cache
 * write · output, thinking within it), searches, scripts, Subagents and retries, the cache result
 * per step with why it missed, and the total including Subagents. Sections show only when their
 * numbers are passed. In a narrow column every grid stacks.
 *
 * @example
 * <RunUsagePanel
 *   summary={{ steps: 3, contextTokens: 62000, contextWindow: 100000, cachedRatio: 0.92, cost: 0.031 }}
 *   models={[{ model: "Claude Haiku 5.5", steps: 3, tokens: { new: 4100, cacheRead: 57000, output: 900 } }]}
 *   asOf="Data as of 14:02"
 * />
 */
export function RunUsagePanel({
  summary,
  models = [],
  calls = [],
  state = "ready",
  error,
  onRetry,
  asOf,
  heading,
  labels,
  format,
  className,
  ...props
}: RunUsagePanelProps) {
  const { l, f } = words(labels, format);
  const ErrorAnnouncer = useErrorAnnouncement(state, l.error);
  const headingId = React.useId();
  const est = l.estimated;
  const empty = state === "ready" && (!summary || summary.steps === 0);
  // Every step that reports a cache result counts, "Not used" included: "1 of 3 steps".
  const cacheCalls = calls.filter((call) => call.cache !== undefined);
  const read = cacheCalls.filter(
    (call) => call.cache === "hit" || call.cache === "partial",
  ).length;
  const misses = calls.filter((call) => call.cache === "miss");
  const activity = summary
    ? (
        [
          [l.searches, summary.searches],
          [l.scripts, summary.scripts],
          [l.subagents, summary.subagents],
          [l.retries, summary.retries],
        ] as const
      ).filter(([, value]) => value != null)
    : [];

  return (
    <section
      data-slot="run-usage-panel"
      data-state={empty ? "empty" : state}
      aria-labelledby={headingId}
      aria-busy={state === "loading" || undefined}
      className={cn(
        "@container/run-usage flex min-w-0 flex-col gap-4 text-sm",
        className,
      )}
      {...props}
    >
      <ErrorAnnouncer />
      <h3 id={headingId} className="text-sm font-medium text-foreground">
        {heading ?? l.usage}
      </h3>
      {state !== "ready" ? (
        <Fallback state={state} error={error} onRetry={onRetry} l={l} />
      ) : empty || !summary ? (
        <p
          data-slot="run-usage-empty"
          className="text-sm text-muted-foreground"
        >
          {l.empty}
        </p>
      ) : (
        <>
          <dl
            data-slot="run-usage-totals"
            className="grid grid-cols-2 gap-3 @md/run-usage:grid-cols-4"
          >
            <Stat label={l.stepsHeading}>{f.count(summary.steps)}</Stat>
            {summary.contextTokens != null ? (
              <Stat label={l.contextHeading}>
                <Num basis={summary.basis} estimatedLabel={est}>
                  {f.tokens(summary.contextTokens)}
                </Num>
                {summary.contextWindow ? (
                  <span className="text-muted-foreground">
                    {` (${f.percent(summary.contextTokens / summary.contextWindow)})`}
                  </span>
                ) : null}
              </Stat>
            ) : null}
            {summary.cachedRatio != null ? (
              <Stat label={l.cachedHeading}>
                {f.percent(summary.cachedRatio)}
              </Stat>
            ) : null}
            {summary.cost != null ? (
              <Stat label={l.cost}>
                <Num basis={summary.basis} estimatedLabel={est}>
                  {f.money(summary.cost)}
                </Num>
              </Stat>
            ) : null}
            {summary.wallMs != null ? (
              <Stat label={l.time}>{f.duration(summary.wallMs)}</Stat>
            ) : null}
            {summary.modelMs != null ? (
              <Stat label={l.modelTime}>{f.duration(summary.modelMs)}</Stat>
            ) : null}
            {summary.toolMs != null ? (
              <Stat label={l.toolTime}>{f.duration(summary.toolMs)}</Stat>
            ) : null}
          </dl>

          {models.length > 0 ? (
            <div
              data-slot="run-usage-models"
              className="flex min-w-0 flex-col gap-2"
            >
              <h4 className="text-xs text-muted-foreground">{l.byModel}</h4>
              <ul className="flex min-w-0 flex-col gap-2">
                {models.map((entry) => (
                  <li
                    key={entry.model}
                    data-slot="run-usage-model"
                    className="flex min-w-0 flex-col gap-2 rounded-md border border-border p-3"
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span className="min-w-0 truncate text-foreground">
                        {entry.model}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {l.steps(entry.steps)}
                        {entry.ms != null ? ` · ${f.duration(entry.ms)}` : null}
                      </span>
                      {entry.cost != null ? (
                        <span className="ms-auto text-foreground tabular-nums">
                          <Num basis={entry.basis} estimatedLabel={est}>
                            {f.money(entry.cost)}
                          </Num>
                        </span>
                      ) : null}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 @md/run-usage:grid-cols-5">
                      <Stat label={l.newTokens}>
                        <Num basis={entry.basis} estimatedLabel={est}>
                          {f.tokens(entry.tokens.new)}
                        </Num>
                      </Stat>
                      <Stat label={l.cacheRead}>
                        <Num basis={entry.basis} estimatedLabel={est}>
                          {f.tokens(entry.tokens.cacheRead ?? 0)}
                        </Num>
                      </Stat>
                      <Stat label={l.cacheWrite}>
                        <Num basis={entry.basis} estimatedLabel={est}>
                          {f.tokens(entry.tokens.cacheWrite ?? 0)}
                        </Num>
                      </Stat>
                      <Stat label={l.cacheWrite1h}>
                        <Num basis={entry.basis} estimatedLabel={est}>
                          {f.tokens(entry.tokens.cacheWrite1h ?? 0)}
                        </Num>
                      </Stat>
                      <Stat label={l.output}>
                        <Num basis={entry.basis} estimatedLabel={est}>
                          {f.tokens(entry.tokens.output ?? 0)}
                        </Num>
                        {entry.tokens.reasoning ? (
                          <span className="text-muted-foreground">
                            {` (${f.tokens(entry.tokens.reasoning)} ${l.thinking})`}
                          </span>
                        ) : null}
                      </Stat>
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {activity.length > 0 ? (
            <div data-slot="run-usage-activity" className="flex flex-col gap-2">
              <h4 className="text-xs text-muted-foreground">{l.activity}</h4>
              <dl className="grid grid-cols-2 gap-3 @md/run-usage:grid-cols-4">
                {activity.map(([label, value]) => (
                  <Stat key={label} label={label}>
                    {f.count(value ?? 0)}
                  </Stat>
                ))}
              </dl>
            </div>
          ) : null}

          {cacheCalls.some((call) => call.cache !== "none") ? (
            <div data-slot="run-usage-cache" className="flex flex-col gap-2">
              <h4 className="text-xs text-muted-foreground">
                {l.cacheHeading}
              </h4>
              <p className="text-sm text-foreground">
                {l.cacheSummary(read, cacheCalls.length)}
              </p>
              {misses.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {misses.map((call) => (
                    <li
                      key={call.id}
                      data-slot="run-usage-cache-miss"
                      className="flex min-w-0 flex-wrap gap-x-2 text-sm"
                    >
                      <span className="text-warning-text">
                        {l.cacheResults.miss}
                      </span>
                      <span className="text-foreground">
                        {call.purpose}
                        {call.subagent ? <> · {call.subagent}</> : null}
                      </span>
                      <span className="text-muted-foreground">
                        {call.model}
                      </span>
                      {call.cacheReason ? (
                        <span className="text-muted-foreground">
                          · {call.cacheReason}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {summary.tree ? (
            <div
              data-slot="run-usage-tree"
              className="flex flex-wrap items-baseline gap-x-2 border-t border-border pt-3"
            >
              <span className="text-muted-foreground">{l.tree}</span>
              {summary.tree.tokens != null ? (
                <span className="text-foreground tabular-nums">
                  <Num basis={summary.tree.basis} estimatedLabel={est}>
                    {f.tokens(summary.tree.tokens)}
                  </Num>
                </span>
              ) : null}
              {summary.tree.cost != null ? (
                <span className="text-foreground tabular-nums">
                  <Num basis={summary.tree.basis} estimatedLabel={est}>
                    {f.money(summary.tree.cost)}
                  </Num>
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      {asOf ? (
        <p
          data-slot="run-usage-as-of"
          className="text-xs text-muted-foreground"
        >
          {asOf}
        </p>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * RunUsageTable
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `RunUsageTable`. */
export interface RunUsageTableProps extends React.ComponentProps<"div"> {
  /** One row per model call, in order. */
  calls: readonly RunUsageCall[];
  /** Shows the cost column. Off for readers who never see money. @default true when any call has a cost */
  showCost?: boolean;
  /** `loading` shows placeholder rows; `error` the error line and Retry. @default "ready" */
  state?: RunUsageState;
  /** Why it failed. @default undefined */
  error?: React.ReactNode;
  /** Shows Try again on an error. @default undefined */
  onRetry?: () => void;
  /** Names the table (its caption) and its scroll region. @default "Model calls" */
  caption?: string;
  /** Words. @default English */
  labels?: Partial<RunUsageLabels>;
  /** Number formats. @default compact tokens, USD, "62 %", "14s" */
  format?: RunUsageFormat;
}

const NUM = "text-end tabular-nums";

/**
 * `RunUsageTable` — one row per model call: model, purpose (and the Subagent that made it), new,
 * cache read, cache write, output, cache result, time and cost, with a total row. Numbers are
 * right-aligned in tabular figures; estimated ones read "~". The table scrolls sideways inside its
 * own named region when the column is narrow, and the region takes focus only while it scrolls.
 *
 * @example
 * <RunUsageTable calls={[{ id: "1", model: "Claude Haiku 5.5", purpose: "Step", tokens: { new: 4100, cacheRead: 18000, output: 300 }, cache: "hit", ms: 1800, cost: 0.004 }]} />
 */
export function RunUsageTable({
  calls,
  showCost,
  state = "ready",
  error,
  onRetry,
  caption,
  labels,
  format,
  className,
  ...props
}: RunUsageTableProps) {
  const { l, f } = words(labels, format);
  const ErrorAnnouncer = useErrorAnnouncement(state, l.error);
  const [scroller, setScroller] = React.useState<HTMLDivElement | null>(null);
  const scrollable = useOverflow(scroller, { axis: "inline" });
  const est = l.estimated;
  const name = caption ?? l.calls;
  const money = showCost ?? calls.some((call) => call.cost != null);
  const sum = (pick: (t: RunUsageTokens) => number) =>
    calls.reduce((total, call) => total + pick(call.tokens), 0);
  const anyEstimated = calls.some((call) => call.basis === "estimated");
  // A total is shown only when every call reports the number; a partial sum would read as exact.
  const totalCost = calls.every((call) => call.cost != null)
    ? calls.reduce((total, call) => total + (call.cost ?? 0), 0)
    : null;
  const totalMs = calls.every((call) => call.ms != null)
    ? calls.reduce((total, call) => total + (call.ms ?? 0), 0)
    : null;

  if (state !== "ready" || calls.length === 0) {
    return (
      <div
        data-slot="run-usage-table"
        data-state={state === "ready" ? "empty" : state}
        aria-busy={state === "loading" || undefined}
        className={cn(
          "@container/run-usage flex min-w-0 flex-col gap-2",
          className,
        )}
        {...props}
      >
        <ErrorAnnouncer />
        {state === "ready" ? (
          <p
            data-slot="run-usage-empty"
            className="text-sm text-muted-foreground"
          >
            {l.empty}
          </p>
        ) : state === "loading" ? (
          <div data-slot="run-usage-loading" className="flex flex-col gap-2">
            <span role="status" className="sr-only">
              {l.loading}
            </span>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} aria-hidden className="h-8" />
            ))}
          </div>
        ) : (
          <Fallback state={state} error={error} onRetry={onRetry} l={l} />
        )}
      </div>
    );
  }

  return (
    <div
      data-slot="run-usage-table"
      data-state="ready"
      className={cn("min-w-0", className)}
      {...props}
    >
      <ErrorAnnouncer />
      <div
        ref={setScroller}
        data-slot="run-usage-scroll"
        data-scrollable={scrollable ? "" : undefined}
        role="region"
        aria-label={name}
        tabIndex={scrollable ? 0 : undefined}
        className="relative w-full overflow-x-auto focus-visible:-outline-offset-2"
      >
        <table className="w-full caption-top text-sm">
          <TableCaption className="mt-0 mb-2 text-start">{name}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{l.model}</TableHead>
              <TableHead scope="col">{l.purpose}</TableHead>
              <TableHead scope="col" className={NUM}>
                {l.newTokens}
              </TableHead>
              <TableHead scope="col" className={NUM}>
                {l.cacheRead}
              </TableHead>
              <TableHead scope="col" className={NUM}>
                {l.cacheWrite}
              </TableHead>
              <TableHead scope="col" className={NUM}>
                {l.output}
              </TableHead>
              <TableHead scope="col">{l.cache}</TableHead>
              <TableHead scope="col" className={NUM}>
                {l.duration}
              </TableHead>
              {money ? (
                <TableHead scope="col" className={NUM}>
                  {l.cost}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow
                key={call.id}
                data-slot="run-usage-row"
                data-basis={call.basis ?? "reported"}
              >
                <TableCell className="text-foreground">{call.model}</TableCell>
                <TableCell className="text-muted-foreground">
                  {call.purpose}
                  {call.subagent ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {call.subagent}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className={NUM}>
                  <Num basis={call.basis} estimatedLabel={est}>
                    {f.tokens(call.tokens.new)}
                  </Num>
                </TableCell>
                <TableCell className={NUM}>
                  <Num basis={call.basis} estimatedLabel={est}>
                    {f.tokens(call.tokens.cacheRead ?? 0)}
                  </Num>
                </TableCell>
                <TableCell className={NUM}>
                  <Num basis={call.basis} estimatedLabel={est}>
                    {f.tokens(
                      (call.tokens.cacheWrite ?? 0) +
                        (call.tokens.cacheWrite1h ?? 0),
                    )}
                  </Num>
                </TableCell>
                <TableCell className={NUM}>
                  <Num basis={call.basis} estimatedLabel={est}>
                    {f.tokens(call.tokens.output ?? 0)}
                  </Num>
                </TableCell>
                <TableCell
                  data-slot="run-usage-cache-result"
                  data-cache={call.cache}
                  className={cn(
                    "text-muted-foreground",
                    call.cache === "miss" && "text-warning-text",
                  )}
                  title={
                    typeof call.cacheReason === "string"
                      ? call.cacheReason
                      : undefined
                  }
                >
                  {call.cache ? l.cacheResults[call.cache] : null}
                </TableCell>
                <TableCell className={NUM}>
                  {call.ms != null ? f.duration(call.ms) : null}
                </TableCell>
                {money ? (
                  <TableCell className={NUM}>
                    {call.cost != null ? (
                      <Num basis={call.basis} estimatedLabel={est}>
                        {f.money(call.cost)}
                      </Num>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead scope="row" colSpan={2}>
                {l.total}
              </TableHead>
              <TableCell className={NUM}>
                <Num
                  basis={anyEstimated ? "estimated" : undefined}
                  estimatedLabel={est}
                >
                  {f.tokens(sum((t) => t.new))}
                </Num>
              </TableCell>
              <TableCell className={NUM}>
                <Num
                  basis={anyEstimated ? "estimated" : undefined}
                  estimatedLabel={est}
                >
                  {f.tokens(sum((t) => t.cacheRead ?? 0))}
                </Num>
              </TableCell>
              <TableCell className={NUM}>
                <Num
                  basis={anyEstimated ? "estimated" : undefined}
                  estimatedLabel={est}
                >
                  {f.tokens(
                    sum((t) => (t.cacheWrite ?? 0) + (t.cacheWrite1h ?? 0)),
                  )}
                </Num>
              </TableCell>
              <TableCell className={NUM}>
                <Num
                  basis={anyEstimated ? "estimated" : undefined}
                  estimatedLabel={est}
                >
                  {f.tokens(sum((t) => t.output ?? 0))}
                </Num>
              </TableCell>
              <TableCell />
              <TableCell className={NUM}>
                {totalMs != null ? f.duration(totalMs) : null}
              </TableCell>
              {money ? (
                <TableCell className={NUM}>
                  {totalCost != null ? (
                    <Num
                      basis={anyEstimated ? "estimated" : undefined}
                      estimatedLabel={est}
                    >
                      {f.money(totalCost)}
                    </Num>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          </TableFooter>
        </table>
      </div>
    </div>
  );
}
