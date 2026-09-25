"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/relative-time` (dogfoods the registry) → auto-scanned.
import {
  DateTime,
  DueLabel,
  Duration,
  RelativeTime,
} from "@/components/ui/relative-time";
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatDueLabel,
  formatDuration,
  formatRelative,
  formatTimeOfDay,
  groupByDay,
} from "@/lib/date-time";

// A fixed reference instant so the showcase renders stable, predictable strings
// (no live clock drift in docs/screenshots). `offset()` builds dates around it.
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0); // 2026-01-15T12:00:00Z
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const offset = (ms: number) => new Date(NOW + ms);

export function relativeTime(): ReactNode {
  return (
    <Wrapper>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Last deployed</span>
        <RelativeTime
          date={offset(-2 * HOUR)}
          now={NOW}
          className="text-foreground"
        />
      </div>
    </Wrapper>
  );
}

export function relativeTimeExamples(): ReactNode {
  return (
    <Wrapper className="gap-4 text-sm text-muted-foreground">
      <RelativeTime date={offset(-30_000)} now={NOW} />
      <RelativeTime date={offset(-5 * MIN)} now={NOW} />
      <RelativeTime date={offset(-2 * HOUR)} now={NOW} />
      <RelativeTime date={offset(-3 * DAY)} now={NOW} />
      <RelativeTime date={offset(2 * HOUR)} now={NOW} />
      <RelativeTime date={offset(3 * DAY)} now={NOW} />
    </Wrapper>
  );
}

export function relativeTimeModes(): ReactNode {
  return (
    <Wrapper className="gap-4 text-sm text-muted-foreground">
      {/* ago: duration-relative — a −2h instant so it reads "2 hours ago", visibly
          different from the calendar-relative "yesterday" items next to it */}
      <RelativeTime date={offset(-2 * HOUR)} now={NOW} mode="ago" />
      {/* day: calendar-relative */}
      <RelativeTime date={offset(-1 * DAY)} now={NOW} mode="day" />
      <RelativeTime date={offset(0)} now={NOW} mode="day" />
      <RelativeTime date={offset(1 * DAY)} now={NOW} mode="day" />
      <RelativeTime
        date={new Date(Date.UTC(2026, 2, 15, 12))}
        now={NOW}
        mode="day"
      />
    </Wrapper>
  );
}

export function relativeTimeStates(): ReactNode {
  return (
    <Wrapper className="gap-4 text-sm text-muted-foreground">
      {/* Hover or focus to reveal the absolute date-time tooltip (default) */}
      <RelativeTime date={offset(-2 * HOUR)} now={NOW} />
      {/* Tooltip disabled */}
      <RelativeTime date={offset(-2 * HOUR)} now={NOW} title={false} />
      {/* Custom tooltip label */}
      <RelativeTime
        date={offset(-2 * HOUR)}
        now={NOW}
        title="Created at launch"
      />
    </Wrapper>
  );
}

export function relativeTimeLocale(): ReactNode {
  return (
    <Wrapper className="gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">en-US</span>
        <RelativeTime
          date={offset(-2 * HOUR)}
          now={NOW}
          locale="en-US"
          className="text-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">de-DE</span>
        <RelativeTime
          date={offset(-2 * HOUR)}
          now={NOW}
          locale="de-DE"
          className="text-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">fr-FR</span>
        <RelativeTime
          date={offset(3 * DAY)}
          now={NOW}
          locale="fr-FR"
          className="text-foreground"
        />
      </div>
    </Wrapper>
  );
}

export function relativeTimeTooltipDelay(): ReactNode {
  return (
    <Wrapper className="gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Instant (delay 0)</span>
        <RelativeTime
          date={offset(-2 * HOUR)}
          now={NOW}
          tooltipDelay={0}
          className="text-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Delayed 700ms</span>
        <RelativeTime
          date={offset(-2 * HOUR)}
          now={NOW}
          tooltipDelay={700}
          className="text-foreground"
        />
      </div>
    </Wrapper>
  );
}

// LIVE example — intentionally omits `now`, so the component reads the real clock
// and its refresh timer ticks. Non-deterministic by design (the headline feature
// can't be shown with a frozen clock). Seeded 30s in the past so it starts at "now"
// and climbs through "1 minute ago", "2 minutes ago", … as you watch.
export function relativeTimeLive(): ReactNode {
  return (
    <Wrapper className="gap-2 text-sm">
      <span className="text-muted-foreground">Updated</span>
      <RelativeTime date={Date.now() - 30_000} className="text-foreground" />
    </Wrapper>
  );
}

/** DS-11: a label that stands alone — capitalized, no tooltip, inline text at the line's height. */
export function relativeTimeStandalone(): ReactNode {
  return (
    <Wrapper className="gap-4 text-sm">
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">Due</span>
        <RelativeTime
          date={offset(0)}
          now={NOW}
          mode="day"
          capitalize
          title={false}
          timeZone="UTC"
          locale="en-US"
        />
      </span>
    </Wrapper>
  );
}

/**
 * DS-11: `timeZone` decides which calendar day an instant falls on. 23:30 UTC on 14 January is
 * already 15 January in Kolkata, so the same instant reads "yesterday" in UTC and "today" in IST.
 */
export function relativeTimeTimeZone(): ReactNode {
  const lateEvening = new Date(Date.UTC(2026, 0, 14, 23, 30));
  return (
    <Wrapper className="gap-6 text-sm">
      {(["UTC", "Asia/Kolkata"] as const).map((timeZone) => (
        <span key={timeZone} className="flex items-center gap-2">
          <span className="text-muted-foreground">{timeZone}</span>
          <RelativeTime
            date={lateEvening}
            now={NOW}
            mode="day"
            capitalize
            timeZone={timeZone}
            locale="en-US"
          />
        </span>
      ))}
    </Wrapper>
  );
}

/** DS-11: `withTime` appends the time of day; `formatOptions` shapes a distant date. */
export function relativeTimeWithTime(): ReactNode {
  return (
    <Wrapper className="gap-6 text-sm text-muted-foreground">
      <RelativeTime
        date={offset(-2 * HOUR)}
        now={NOW}
        mode="day"
        withTime
        capitalize
        timeZone="UTC"
        locale="en-US"
      />
      <RelativeTime
        date={offset(-9 * DAY)}
        now={NOW}
        mode="day"
        withTime
        timeZone="UTC"
        locale="en-IN"
        formatOptions={{ day: "numeric", month: "short" }}
      />
    </Wrapper>
  );
}

// ---------------------------------------------------------------------------
// Dates & times — the function outputs, pinned to NOW in IST.
// ---------------------------------------------------------------------------

const TZ = "Asia/Kolkata";
const O = { now: NOW, timeZone: TZ };

function Rows({ rows }: { rows: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="grid w-full max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
      {rows.map(([code, out]) => (
        <div key={code} className="contents">
          <code className="text-muted-foreground">{code}</code>
          <span className="text-right tabular-nums">{out}</span>
        </div>
      ))}
    </div>
  );
}

export function dateTimeRelative(): ReactNode {
  return (
    <Wrapper>
      <Rows
        rows={[
          ["30s ago", formatRelative(offset(-30_000), O)],
          ["2 min ago", formatRelative(offset(-2 * MIN), O)],
          ["3 h ago", formatRelative(offset(-3 * HOUR), O)],
          ["5 days ago", formatRelative(offset(-5 * DAY), O)],
          ["9 days ago", formatRelative(offset(-9 * DAY), O)],
          ["70 days ago", formatRelative(offset(-70 * DAY), O)],
          ["400 days ago", formatRelative(offset(-400 * DAY), O)],
          ["in 2 days", formatRelative(offset(2 * DAY), O)],
          [
            "suffix",
            formatRelative(offset(-2 * MIN), { ...O, style: "suffix" }),
          ],
          ["long", formatRelative(offset(-2 * MIN), { ...O, style: "long" })],
        ]}
      />
    </Wrapper>
  );
}

export function dateTimeDuration(): ReactNode {
  return (
    <Wrapper>
      <Rows
        rows={[
          ["42", formatDuration(42)],
          ["150", formatDuration(150)],
          ["4500", formatDuration(4500)],
          ["3600", formatDuration(3600)],
          ["183600", formatDuration(183_600)],
          ["4504, clock", formatDuration(4504, { clock: true })],
        ]}
      />
    </Wrapper>
  );
}

export function dateTimeDates(): ReactNode {
  return (
    <Wrapper>
      <Rows
        rows={[
          ["today", formatDate(offset(0), O)],
          ["+1 day", formatDate(offset(DAY), O)],
          ["-1 day", formatDate(offset(-DAY), O)],
          ["+3 days", formatDate(offset(3 * DAY), O)],
          ["-4 days", formatDate(offset(-4 * DAY), O)],
          ["+20 days", formatDate(offset(20 * DAY), O)],
          ["last year", formatDate(offset(-40 * DAY), O)],
          [
            "+20 days, looseFuture",
            formatDate(offset(20 * DAY), { ...O, looseFuture: true }),
          ],
          ["formatTimeOfDay", formatTimeOfDay(offset(0), O)],
        ]}
      />
    </Wrapper>
  );
}

export function dateTimeDateTimes(): ReactNode {
  return (
    <Wrapper>
      <Rows
        rows={[
          ["today", formatDateTime(offset(0), O)],
          ["-10 days", formatDateTime(offset(-10 * DAY), O)],
          ["last year", formatDateTime(offset(-40 * DAY), O)],
          [
            "comma",
            formatDateTime(offset(-10 * DAY), { ...O, separator: "comma" }),
          ],
          ["range, same day", formatDateRange(offset(0), offset(90 * MIN), O)],
          [
            "range, same month",
            formatDateRange(offset(2 * DAY), offset(5 * DAY), O),
          ],
          [
            "range, two months",
            formatDateRange(offset(10 * DAY), offset(20 * DAY), O),
          ],
          [
            "range, two years",
            formatDateRange(offset(-20 * DAY), offset(-10 * DAY), O),
          ],
        ]}
      />
    </Wrapper>
  );
}

export function dateTimeDue(): ReactNode {
  const rows = [-2, 0, 1, 3, 9].map((d) => {
    const { label, tone } = formatDueLabel(offset(d * DAY), O);
    return [`${d > 0 ? "+" : ""}${d} days`, `${label} (${tone})`] as const;
  });
  return (
    <Wrapper className="flex-col items-start gap-4">
      <Rows rows={rows} />
      <div className="flex flex-wrap gap-4 text-sm">
        {[-2, 0, 3].map((d) => (
          <DueLabel key={d} date={new Date(Date.now() + d * DAY)} />
        ))}
      </div>
    </Wrapper>
  );
}

export function dateTimeGroups(): ReactNode {
  const items = [0, -1, -2, -9, -40].map((d) => ({
    id: d,
    at: offset(d * DAY),
  }));
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col gap-3 text-sm">
        {groupByDay(items, (i) => i.at, O).map((g) => (
          <div key={g.key}>
            <div className="text-xs font-medium text-muted-foreground">
              {g.label}
            </div>
            {g.items.map((i) => (
              <div key={i.id}>{formatDateTime(i.at, O)}</div>
            ))}
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function dateTimeComponents(): ReactNode {
  const now = Date.now();
  return (
    <Wrapper className="flex-wrap gap-6 text-sm">
      <RelativeTime date={new Date(now - 2 * MIN)} format="minimal" />
      <DateTime date={new Date(now - 3 * DAY)} />
      <DateTime date={new Date(now)} variant="datetime" />
      <Duration value={4500} />
      <Duration value={4504} clock />
      <DueLabel date={new Date(now + DAY)} />
    </Wrapper>
  );
}
