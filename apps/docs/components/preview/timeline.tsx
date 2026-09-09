"use client";

import { type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/timeline` (dogfoods the registry) → auto-scanned.
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { StatusIcon } from "@/components/ui/status-icon";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";

const NOW = new Date("2026-07-27T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000);

export function timeline(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-md">
        <Timeline aria-label="Deal activity">
          <TimelineSeparator>Today</TimelineSeparator>
          <TimelineItem node={<StatusIcon status="done" size="sm" label="" />}>
            <Item size="sm">
              <ItemContent>
                <ItemTitle>Deal moved to Won</ItemTitle>
                <ItemDescription>Acme renewal · $12,400</ItemDescription>
              </ItemContent>
              <ItemContent className="text-muted-foreground">
                <RelativeTime
                  date={hoursAgo(2)}
                  now={NOW.getTime()}
                  refresh={false}
                />
              </ItemContent>
            </Item>
          </TimelineItem>
          <TimelineItem node={<Avatar size="xs" fallback="PS" />}>
            <Item size="sm">
              <ItemContent>
                <ItemTitle>Priya logged a call</ItemTitle>
                <ItemDescription>
                  Pricing review with procurement
                </ItemDescription>
              </ItemContent>
              <ItemContent className="text-muted-foreground">
                <RelativeTime
                  date={hoursAgo(5)}
                  now={NOW.getTime()}
                  refresh={false}
                />
              </ItemContent>
            </Item>
          </TimelineItem>
          <TimelineSeparator>Yesterday</TimelineSeparator>
          <TimelineItem>
            <Item size="sm">
              <ItemContent>
                <ItemTitle>Proposal sent</ItemTitle>
              </ItemContent>
              <ItemContent className="text-muted-foreground">
                <RelativeTime
                  date={hoursAgo(30)}
                  now={NOW.getTime()}
                  refresh={false}
                />
              </ItemContent>
            </Item>
          </TimelineItem>
        </Timeline>
      </div>
    </Wrapper>
  );
}

export function timelineLinked(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-md">
        <Timeline aria-label="Delivery log">
          <TimelineItem node={<StatusIcon status="done" size="sm" label="" />}>
            {/* The interactive surface is Item's own render polymorphism. */}
            <Item size="sm" render={<a href="#delivered" />}>
              <ItemContent>
                <ItemTitle>Delivered</ItemTitle>
                <ItemDescription>203 recipients</ItemDescription>
              </ItemContent>
            </Item>
          </TimelineItem>
          <TimelineItem
            node={<StatusIcon status="progress" size="sm" label="" />}
          >
            <Item size="sm">
              <ItemContent>
                <ItemTitle>Sending…</ItemTitle>
              </ItemContent>
            </Item>
          </TimelineItem>
          <TimelineItem
            node={<StatusIcon status="blocked" size="sm" label="" />}
          >
            <Item size="sm">
              <ItemContent>
                <ItemTitle>4 bounced</ItemTitle>
                <ItemDescription>Marked as failed, not hidden</ItemDescription>
              </ItemContent>
            </Item>
          </TimelineItem>
        </Timeline>
      </div>
    </Wrapper>
  );
}

export function timelineGrouped(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-md">
        <Timeline aria-label="Deployment history">
          <TimelineSeparator>This week</TimelineSeparator>
          <TimelineItem node={<StatusIcon status="done" size="sm" label="" />}>
            <Item size="sm">
              <ItemContent>
                <ItemTitle>main@a1f7c2 deployed</ItemTitle>
                <ItemDescription>
                  Production · 42s · triggered by Priya Sharma
                </ItemDescription>
              </ItemContent>
            </Item>
          </TimelineItem>
          <TimelineItem
            node={<StatusIcon status="blocked" size="sm" label="" />}
          >
            <Item size="sm">
              <ItemContent>
                <ItemTitle>main@9c0e11 failed</ItemTitle>
                <ItemDescription>
                  Build step exceeded the 10-minute limit
                </ItemDescription>
              </ItemContent>
            </Item>
          </TimelineItem>
          <TimelineSeparator>Last week</TimelineSeparator>
          <TimelineItem node={<Avatar size="xs" fallback="AL" />}>
            <Item size="sm">
              <ItemContent>
                <ItemTitle>Ada rolled back to main@77b4de</ItemTitle>
                <ItemDescription>
                  Reason: checkout regression on Safari
                </ItemDescription>
              </ItemContent>
            </Item>
          </TimelineItem>
        </Timeline>
      </div>
    </Wrapper>
  );
}
