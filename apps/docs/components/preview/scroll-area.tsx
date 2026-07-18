"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/scroll-area` (dogfoods the registry) → auto-scanned.
import { ScrollArea } from "@/components/ui/scroll-area";

const TAGS = Array.from({ length: 40 }, (_, i) => `v1.${i}.0`);

export function scrollArea(): ReactNode {
  return (
    <Wrapper>
      <ScrollArea className="h-56 w-56 rounded-lg border border-border">
        <div className="p-4">
          <p className="mb-3 text-base font-medium text-foreground">Release tags</p>
          {TAGS.map((tag) => (
            <div
              key={tag}
              className="border-b border-border py-1.5 text-base text-muted-foreground last:border-0"
            >
              {tag}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Wrapper>
  );
}

export function scrollAreaHorizontal(): ReactNode {
  return (
    <Wrapper>
      <ScrollArea orientation="horizontal" className="w-72 rounded-lg border border-border">
        <div className="flex gap-3 p-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="flex size-28 shrink-0 items-center justify-center rounded-md bg-muted text-base font-medium text-muted-foreground"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Wrapper>
  );
}

export function scrollAreaBoth(): ReactNode {
  return (
    <Wrapper>
      <ScrollArea orientation="both" className="h-56 w-72 rounded-lg border border-border">
        <div className="grid w-160 grid-cols-8 gap-2 p-4">
          {Array.from({ length: 80 }, (_, i) => (
            <div
              key={i}
              className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-base font-medium text-muted-foreground"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Wrapper>
  );
}

export function scrollAreaOrientations(): ReactNode {
  return (
    <Wrapper className="items-start gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">vertical</span>
        <ScrollArea className="h-44 w-40 rounded-lg border border-border">
          <div className="p-3">
            {TAGS.slice(0, 24).map((tag) => (
              <div
                key={tag}
                className="border-b border-border py-1.5 text-base text-muted-foreground last:border-0"
              >
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">horizontal</span>
        <ScrollArea orientation="horizontal" className="w-52 rounded-lg border border-border">
          <div className="flex gap-2 p-3">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-base font-medium text-muted-foreground"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">both</span>
        <ScrollArea orientation="both" className="h-44 w-52 rounded-lg border border-border">
          <div className="grid w-112 grid-cols-6 gap-2 p-3">
            {Array.from({ length: 42 }, (_, i) => (
              <div
                key={i}
                className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted text-base font-medium text-muted-foreground"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Wrapper>
  );
}
