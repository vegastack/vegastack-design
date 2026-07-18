'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/hover-card` (dogfoods the registry) → auto-scanned.
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// HoverCard is PRESENTATIONAL: these demos pass already-resolved preview content as children.
// In a real app, an app-side wrapper fetches the user/agent/team and renders this content (with its
// own loading / empty / error states) — the component itself never knows about the entity.

export function hoverCard(): ReactNode {
  return (
    <Wrapper>
      <HoverCard>
        <HoverCardTrigger
          render={
            <Button variant="ghost" className="px-1.5 font-medium">
              @ada
            </Button>
          }
        />
        <HoverCardContent>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Avatar fallback="AL" />
              <div className="flex flex-col gap-1">
                <p className="text-base leading-none font-medium text-foreground">Ada Lovelace</p>
                <p className="text-sm text-muted-foreground">Owner · Platform team</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Joined the workspace in 2021. 142 contributions this quarter.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="self-start">
              View profile
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardSides(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">Top</Button>} />
        <HoverCardContent side="top">On top</HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">Right</Button>} />
        <HoverCardContent side="right">On the right</HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">Bottom</Button>} />
        <HoverCardContent side="bottom">On the bottom</HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">Left</Button>} />
        <HoverCardContent side="left">On the left</HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardAlign(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">Start</Button>} />
        <HoverCardContent side="bottom" align="start">
          Aligned to the start edge.
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">Center</Button>} />
        <HoverCardContent side="bottom" align="center">
          Centered on the trigger.
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">End</Button>} />
        <HoverCardContent side="bottom" align="end">
          Aligned to the end edge.
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardDelay(): ReactNode {
  return (
    <Wrapper>
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger
          render={
            <Button variant="ghost" className="px-1.5 font-medium">
              @grace
            </Button>
          }
        />
        <HoverCardContent>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Avatar fallback="GH" />
              <div className="flex flex-col gap-1">
                <p className="text-base leading-none font-medium text-foreground">Grace Hopper</p>
                <p className="text-sm text-muted-foreground">Admin · Compiler team</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Opens and closes instantly — zero open and close delay.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="self-start">
              View profile
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardArrow(): ReactNode {
  return (
    <Wrapper>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline">2 Teams</Button>} />
        <HoverCardContent arrow>
          <div className="flex flex-col gap-2">
            <p className="text-base leading-none font-medium text-foreground">Teams</p>
            <p className="text-sm text-muted-foreground">Platform · Growth</p>
            <Button size="sm" variant="outline" className="mt-1 self-start">
              View teams
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}
