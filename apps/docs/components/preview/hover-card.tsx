"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/hover-card` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/*
 * Every fixture renders CLOSED. A hover card has no resting open state — it exists to be revealed
 * by pointer hover or keyboard focus on the trigger, and that trigger is what the reader looks at
 * first. The geometry lane mounts all of these, so an open portal would measure the card instead of
 * the link.
 */

export function hoverCard(): ReactNode {
  return (
    <Wrapper>
      <HoverCard>
        <HoverCardTrigger
          delay={10}
          closeDelay={100}
          render={<Button variant="link" />}
        >
          Hover Here
        </HoverCardTrigger>
        <HoverCardContent className="flex w-64 flex-col gap-0.5">
          <div className="font-semibold">@nextjs</div>
          <div>The React Framework – created and maintained by @vercel.</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Joined December 2021
          </div>
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardComposition(): ReactNode {
  return (
    <Wrapper>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="link" />}>
          Hover
        </HoverCardTrigger>
        <HoverCardContent>
          The React Framework – created and maintained by @vercel.
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardTriggerDelays(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <HoverCard>
        <HoverCardTrigger
          delay={0}
          closeDelay={0}
          render={<Button variant="link" />}
        >
          Immediate
        </HoverCardTrigger>
        <HoverCardContent>Opens and closes with no wait.</HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger
          delay={600}
          closeDelay={300}
          render={<Button variant="link" />}
        >
          Default
        </HoverCardTrigger>
        <HoverCardContent>
          Base UI&apos;s defaults: 600ms to open, 300ms to close.
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardPositioning(): ReactNode {
  return (
    <Wrapper className="min-h-40">
      <HoverCard>
        <HoverCardTrigger
          delay={100}
          closeDelay={100}
          render={<Button variant="link" />}
        >
          Top, aligned to start
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start">
          `side` picks the edge, `align` picks where along it the card sits.
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

export function hoverCardBasic(): ReactNode {
  return (
    <Wrapper>
      <HoverCard>
        <HoverCardTrigger
          delay={10}
          closeDelay={100}
          render={<Button variant="link" />}
        >
          Hover Here
        </HoverCardTrigger>
        <HoverCardContent className="flex w-64 flex-col gap-0.5">
          <div className="font-semibold">@nextjs</div>
          <div>The React Framework – created and maintained by @vercel.</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Joined December 2021
          </div>
        </HoverCardContent>
      </HoverCard>
    </Wrapper>
  );
}

const HOVER_CARD_SIDES = ["left", "top", "bottom", "right"] as const;

export function hoverCardSides(): ReactNode {
  return (
    <Wrapper className="min-h-52 gap-2">
      {HOVER_CARD_SIDES.map((side) => (
        <HoverCard key={side}>
          <HoverCardTrigger
            delay={100}
            closeDelay={100}
            render={<Button variant="outline" className="capitalize" />}
          >
            {side}
          </HoverCardTrigger>
          <HoverCardContent side={side}>
            <div className="flex flex-col gap-1">
              <h4 className="font-medium">Hover Card</h4>
              <p>This hover card appears on the {side} side of the trigger.</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </Wrapper>
  );
}

/** Physical sides stay put under RTL; the two logical sides swap with the reading direction. */
const physicalSides = ["left", "top", "bottom", "right"] as const;
const logicalSides = ["inline-start", "inline-end"] as const;

const arabic: Record<string, string> = {
  name: "سماعات لاسلكية",
  price: "٩٩.٩٩ $",
  left: "يسار",
  top: "أعلى",
  bottom: "أسفل",
  right: "يمين",
  "inline-start": "بداية السطر",
  "inline-end": "نهاية السطر",
};

export function hoverCardRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper className="min-h-52 flex-col gap-4" dir="rtl">
        <div className="flex flex-wrap justify-center gap-2">
          {physicalSides.map((side) => (
            <HoverCard key={side}>
              <HoverCardTrigger
                delay={10}
                closeDelay={100}
                render={<Button variant="outline" />}
              >
                {arabic[side]}
              </HoverCardTrigger>
              {/* `dir` on the content too: the card portals out of the `dir="rtl"` subtree, so the
                  attribute has to travel with it or the text renders left-to-right. */}
              <HoverCardContent
                side={side}
                dir="rtl"
                className="flex w-64 flex-col gap-1"
              >
                <div className="font-semibold">{arabic.name}</div>
                <div className="text-sm text-muted-foreground">
                  {arabic.price}
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {logicalSides.map((side) => (
            <HoverCard key={side}>
              <HoverCardTrigger
                delay={10}
                closeDelay={100}
                render={<Button variant="outline" />}
              >
                {arabic[side]}
              </HoverCardTrigger>
              <HoverCardContent
                side={side}
                dir="rtl"
                className="flex w-64 flex-col gap-1"
              >
                <div className="font-semibold">{arabic.name}</div>
                <div className="text-sm text-muted-foreground">
                  {arabic.price}
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </Wrapper>
    </DirectionProvider>
  );
}
