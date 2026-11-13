// @vegastack context-ring@0.77.0 sha256-0NHzn5QbQxJwTfKrwz9ZTALZsNgse1fdSFRsAF7Mn/Q=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * ContextRing — how full a chat's working memory is, as a small ring in the composer's toolbar, left
 * of Send. Blue under 75%, amber from 75%, red from 90%; a grey outline before anything is measured.
 * Pressed, it opens what fills it (instructions and tools, the conversation, tool results) and,
 * for people who may send in the chat, Summarize now. Tokens and percentages only, never money.
 *
 * The ring is the same masked conic gradient `upload-panel`'s progress ring draws.
 * ----------------------------------------------------------------------------------------------*/

/** The ring's colour: `info` under 75%, `warning` from 75%, `danger` from 90%. */
export type ContextRingTone = "empty" | "info" | "warning" | "danger";

/** One part of what fills the window: "Conversation", 40,000 tokens. */
export interface ContextRingPart {
  /** A stable key; the part's position when omitted. @default undefined */
  id?: string;
  /** What it is: "Instructions & tools", "Conversation", "Tool results". */
  label: React.ReactNode;
  /** Its size, in tokens. */
  tokens: number;
}

/** The ring's words. */
export interface ContextRingLabels {
  /** What the ring measures, the breakdown's title. @default "Chat memory" */
  name?: string;
  /** The button's name once measured. @default (percent) => `Chat memory ${percent}% used` */
  used?: (percent: number) => string;
  /** The button's name before anything is measured. @default "Chat memory, not measured yet" */
  empty?: string;
  /** The breakdown's line under the title. @default (used, window, percent) => `${used} of ${window} tokens · ${percent}%` */
  of?: (used: string, window: string, percent: number) => string;
  /** The note under the parts. @default (percent) => `Older messages are summarized at ${percent}%.` */
  threshold?: (percent: number) => string;
  /** @default "Summarize now" */
  summarize?: string;
}

/** Props accepted by `ContextRing`. */
export interface ContextRingProps extends Omit<
  React.ComponentPropsWithRef<"button">,
  "children"
> {
  /** Tokens the last request carried; `null` before the chat's first answer. */
  used: number | null;
  /** The chat's working window, in tokens. */
  window: number;
  /** Where older messages get summarized, as a share of the window (0–1). @default 0.9 */
  threshold?: number;
  /** `sm` for a dense toolbar. @default "default" */
  size?: "default" | "sm";
  /** The button's accessible name, when the host words it itself. @default labels.used(percent) */
  label?: string;
  /** What fills the window, shown when the ring is pressed. @default undefined */
  parts?: readonly ContextRingPart[];
  /**
   * Summarize older messages now. Without it there is no button (a reader who can't send). A
   * returned promise keeps the button busy until it settles.
   * @default undefined
   */
  onSummarize?: () => void | Promise<unknown>;
  /**
   * A summary is under way: the host's own state, a live one included. Prefer it to a returned
   * promise inside `ChatComposer`, whose toolbar mounts afresh when a message sends.
   * @default false
   */
  summarizing?: boolean;
  /**
   * Pressing opens the host's own surface (a phone's sheet) instead of the breakdown popover.
   * @default undefined
   */
  onOpen?: () => void;
  /** Words for a token count. @default compact: 62k, 1.2M */
  formatTokens?: (tokens: number) => string;
  /** The ring's words. @default undefined */
  labels?: ContextRingLabels;
}

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const formatCompact = (tokens: number) =>
  compact.format(tokens).replace("K", "k");

/** The tone for a share of the window (0–1), or `empty` when nothing is measured. */
export function contextRingTone(share: number | null): ContextRingTone {
  if (share === null) return "empty";
  if (share >= 0.9) return "danger";
  if (share >= 0.75) return "warning";
  return "info";
}

const TONE_COLOR: Record<ContextRingTone, string> = {
  empty: "var(--color-border)",
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  danger: "var(--color-destructive)",
};

const TONE_BAR: Record<ContextRingTone, string> = {
  empty: "bg-border",
  info: "bg-info",
  // COL-25: a meter's bar reads the family's page ink, never the status fill.
  warning: "bg-warning-text",
  danger: "bg-destructive-text",
};

/** The masked conic ring; `value` 0–100. Hidden from assistive technology: its button speaks. */
function Ring({
  value,
  tone,
  size,
}: {
  value: number;
  tone: ContextRingTone;
  size: "default" | "sm";
}) {
  return (
    <span
      aria-hidden
      data-slot="context-ring-ring"
      className={cn(
        "block shrink-0 rounded-full [mask-image:radial-gradient(farthest-side,transparent_calc(100%-var(--spacing)*0.75),black_calc(100%-var(--spacing)*0.5))]",
        size === "sm" ? "size-3.5" : "size-4",
      )}
      style={{
        backgroundImage:
          tone === "empty"
            ? `conic-gradient(${TONE_COLOR.empty} 100%, ${TONE_COLOR.empty} 0)`
            : `conic-gradient(${TONE_COLOR[tone]} ${value}%, ${TONE_COLOR.empty} 0)`,
      }}
    />
  );
}

/**
 * `ContextRing` — how full a chat's working memory is: a ring for the composer's `toolbarEnd`,
 * blue under 75%, amber from 75%, red from 90%, a grey outline before the first answer. Pressed,
 * it shows what fills the window and, given `onSummarize`, Summarize now; with `onOpen` the host
 * opens its own surface instead. When the share drops (a summary ran) it says the new share once.
 *
 * @example
 * <ChatComposer
 *   toolbarEnd={
 *     <ContextRing
 *       used={62_000}
 *       window={100_000}
 *       parts={[
 *         { label: "Instructions & tools", tokens: 12_000 },
 *         { label: "Conversation", tokens: 40_000 },
 *         { label: "Tool results", tokens: 10_000 },
 *       ]}
 *       onSummarize={summarize}
 *       summarizing={summarizing}
 *     />
 *   }
 * />
 */
export function ContextRing({
  used,
  window: windowTokens,
  threshold = 0.9,
  size = "default",
  label,
  parts,
  onSummarize,
  summarizing = false,
  onOpen,
  formatTokens = formatCompact,
  labels,
  className,
  onClick,
  ...props
}: ContextRingProps) {
  const share =
    used === null || windowTokens <= 0
      ? null
      : Math.min(1, Math.max(0, used / windowTokens));
  const percent = share === null ? null : Math.round(share * 100);
  const tone = contextRingTone(share);
  const name =
    label ??
    (percent === null
      ? (labels?.empty ?? "Chat memory, not measured yet")
      : (labels?.used?.(percent) ?? `Chat memory ${percent}% used`));

  const { announce, Announcer } = useAnnouncer();
  // Say the new share once when it drops (a summary ran), never on mount or as it grows.
  const previous = React.useRef(used);
  React.useEffect(() => {
    const before = previous.current;
    previous.current = used;
    if (before !== null && used !== null && used < before) announce(name);
  }, [used, name, announce]);

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

  const trigger = (
    <Button
      variant="ghost"
      size="icon-xs"
      data-slot="context-ring"
      data-tone={tone}
      aria-label={name}
      className={cn("rounded-full", className)}
      onClick={(event) => {
        onClick?.(event);
        if (onOpen && !event.defaultPrevented) onOpen();
      }}
      {...props}
    >
      <Ring value={percent ?? 0} tone={tone} size={size} />
    </Button>
  );

  if (onOpen) {
    return (
      <>
        {trigger}
        <Announcer />
      </>
    );
  }

  const title = labels?.name ?? "Chat memory";
  const usedText = formatTokens(used ?? 0);
  const windowText = formatTokens(windowTokens);
  const thresholdPercent = Math.round(threshold * 100);

  return (
    <>
      <Popover>
        <PopoverTrigger render={trigger} />
        <PopoverContent
          side="top"
          align="end"
          data-slot="context-ring-breakdown"
          className="gap-3"
        >
          <PopoverHeader>
            <PopoverTitle>{title}</PopoverTitle>
            <PopoverDescription className="tabular-nums">
              {percent === null
                ? (labels?.empty ?? "Chat memory, not measured yet")
                : (labels?.of?.(usedText, windowText, percent) ??
                  `${usedText} of ${windowText} tokens · ${percent}%`)}
            </PopoverDescription>
          </PopoverHeader>
          <span
            aria-hidden
            data-slot="context-ring-bar"
            className="block h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <span
              className={cn("block h-full rounded-full", TONE_BAR[tone])}
              style={{ width: `${percent ?? 0}%` }}
            />
          </span>
          {parts?.length ? (
            <dl
              data-slot="context-ring-parts"
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm"
            >
              {parts.map((part, index) => (
                <React.Fragment key={part.id ?? index}>
                  <dt className="min-w-0 truncate text-muted-foreground">
                    {part.label}
                  </dt>
                  <dd className="text-end tabular-nums">
                    {formatTokens(part.tokens)}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          ) : null}
          <p
            data-slot="context-ring-threshold"
            className="text-xs text-muted-foreground"
          >
            {labels?.threshold?.(thresholdPercent) ??
              `Older messages are summarized at ${thresholdPercent}%.`}
          </p>
          {onSummarize ? (
            <Button
              variant="secondary"
              size="sm"
              data-slot="context-ring-summarize"
              loading={busy}
              disabled={busy || used === null}
              onClick={summarize}
              className="self-start"
            >
              {labels?.summarize ?? "Summarize now"}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
      <Announcer />
    </>
  );
}
