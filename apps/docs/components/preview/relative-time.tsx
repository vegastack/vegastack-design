"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/relative-time` (dogfoods the registry) → auto-scanned.
import { RelativeTime } from "@/components/ui/relative-time";

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
      <div className="flex items-center gap-2 text-base">
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
    <Wrapper className="gap-4 text-base text-muted-foreground">
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
    <Wrapper className="gap-4 text-base text-muted-foreground">
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
    <Wrapper className="gap-4 text-base text-muted-foreground">
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
    <Wrapper className="gap-6 text-base">
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
    <Wrapper className="gap-6 text-base">
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
    <Wrapper className="gap-2 text-base">
      <span className="text-muted-foreground">Updated</span>
      <RelativeTime date={Date.now() - 30_000} className="text-foreground" />
    </Wrapper>
  );
}
