"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/scroll-area` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Chip } from "@/components/ui/chip";

/*
 * Upstream's own examples. Two adaptations: the Horizontal figures use plain blocks rather than
 * `next/image` (the geometry lane mounts these fixtures and must never reach the network), and the
 * RTL fixture inlines the Arabic string upstream pulls from its `language-selector`.
 */

const TAG_COUNT = 50;
const tags = Array.from(
  { length: TAG_COUNT },
  (_, index) => `v1.2.0-beta.${TAG_COUNT - index}`,
);

export function scrollArea(): ReactNode {
  return (
    <Wrapper>
      <ScrollArea className="h-72 w-48 rounded-card border">
        <div className="p-4">
          <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
          {tags.map((tag) => (
            <Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              <Separator className="my-2" />
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </Wrapper>
  );
}

export function scrollAreaComposition(): ReactNode {
  return (
    <Wrapper>
      <ScrollArea className="h-[200px] w-full max-w-[350px] rounded-card border p-4 text-sm">
        <p className="mb-2">
          A `ScrollArea` is a viewport plus its scrollbars. The component
          renders the vertical bar and the corner for you; the only part you
          compose is `ScrollBar`, and only when you need the other axis.
        </p>
        <p className="mb-2">
          Everything you pass as a child lands inside the viewport, so a
          horizontal `ScrollBar` is written beside the content rather than
          outside the component.
        </p>
        <p className="mb-2">
          Give the area a bounded height or width — a scroll container that can
          grow never scrolls.
        </p>
        <p>
          The viewport is a tab stop whenever it can actually scroll, so a
          keyboard-only reader can reach this text with arrow keys.
        </p>
      </ScrollArea>
    </Wrapper>
  );
}

const works = [
  { artist: "Ornella Binni", tone: "bg-muted" },
  { artist: "Tom Byrom", tone: "bg-accent" },
  { artist: "Vladimir Malyavko", tone: "bg-secondary" },
  { artist: "Mika Baumeister", tone: "bg-muted" },
  { artist: "Annie Spratt", tone: "bg-accent" },
];

export function scrollAreaHorizontal(): ReactNode {
  return (
    <Wrapper>
      <ScrollArea className="w-full max-w-96 rounded-card border whitespace-nowrap">
        <div className="flex w-max space-x-4 p-4">
          {works.map((artwork) => (
            <figure key={artwork.artist} className="shrink-0">
              {/* A flat block stands in for upstream's `next/image` — the fixture must not
                  reach the network when the geometry lane mounts it. */}
              <div
                aria-hidden="true"
                className={`aspect-[3/4] w-[150px] overflow-hidden rounded-block ${artwork.tone}`}
              />
              <figcaption className="pt-2 text-xs text-muted-foreground">
                Photo by{" "}
                <span className="font-semibold text-foreground">
                  {artwork.artist}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Wrapper>
  );
}

export function scrollAreaRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <ScrollArea className="h-72 w-48 rounded-card border">
          <div className="p-4">
            <h4 className="mb-4 text-sm leading-none font-medium">العلامات</h4>
            {tags.map((tag) => (
              <Fragment key={tag}>
                <div className="text-sm">{tag}</div>
                <Separator className="my-2" />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
      </Wrapper>
    </DirectionProvider>
  );
}

export function scrollAreaNamedRegion(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-48 flex-col gap-2">
        <h4 id="scroll-area-release-tags" className="text-sm font-medium">
          Release tags
        </h4>
        <ScrollArea
          aria-labelledby="scroll-area-release-tags"
          className="h-48 rounded-card border"
        >
          <div className="p-4">
            {tags.map((tag) => (
              <Fragment key={tag}>
                <div className="text-sm">{tag}</div>
                <Separator className="my-2" />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Wrapper>
  );
}

export function scrollAreaProgrammatic(): ReactNode {
  const viewportRef = useRef<HTMLDivElement>(null);
  // An explicit `behavior` beats the reduced-motion CSS reset, so ask for smooth only when allowed.
  const reducedMotion = usePrefersReducedMotion();
  const scrollTo = (edge: "top" | "bottom") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      top: edge === "top" ? 0 : viewport.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };
  return (
    <Wrapper>
      <div className="flex w-48 flex-col gap-2">
        <ScrollArea
          aria-label="Release tags"
          viewportRef={viewportRef}
          className="h-48 rounded-card border"
        >
          <div className="p-4">
            {tags.map((tag) => (
              <Fragment key={tag}>
                <div className="text-sm">{tag}</div>
                <Separator className="my-2" />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => scrollTo("top")}>
            Oldest
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollTo("bottom")}
          >
            Newest
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

const ROWS = Array.from({ length: 24 }, (_, i) => `Task ${i + 1}`);

/**
 * One scroller per region: a fixed header and a list that scrolls in a `ScrollArea` — an overlay
 * bar that shows while the pointer is over it and takes no width.
 */
export function scrollRegion(): ReactNode {
  return (
    <Wrapper className="block p-0">
      <div className="flex h-64 flex-col">
        <div className="flex h-11 flex-none items-center border-b border-border px-4 text-sm font-medium">
          Tasks
        </div>
        <ScrollArea
          aria-label="Tasks"
          className="min-h-0 flex-1"
          viewportClassName="px-2 py-1"
        >
          {ROWS.map((row) => (
            <div
              key={row}
              className="flex h-8 items-center rounded-item px-2 text-sm"
            >
              {row}
            </div>
          ))}
        </ScrollArea>
      </div>
    </Wrapper>
  );
}

/** A native scroller: the global thin bar, and `relative` so what it holds stays inside it. */
export function scrollNative(): ReactNode {
  return (
    <Wrapper className="block p-0">
      <div
        role="region"
        aria-label="Activity"
        tabIndex={0}
        className="relative h-48 overflow-y-auto overscroll-contain p-4 text-sm"
      >
        {ROWS.map((row) => (
          <p key={row} className="py-1">
            {row} was updated
            <span className="sr-only"> by Manoj Kumar</span>
          </p>
        ))}
      </div>
    </Wrapper>
  );
}

/** A sideways strip shows an edge fade where there is more, never a hidden bar with no cue. */
export function scrollStrip(): ReactNode {
  return (
    <Wrapper className="block">
      <div
        role="region"
        aria-label="Recent"
        tabIndex={0}
        className="relative flex gap-2 overflow-x-auto overscroll-x-contain scroll-fade-x scrollbar-none"
      >
        {ROWS.map((row) => (
          <Chip key={row} className="shrink-0">
            {row}
          </Chip>
        ))}
      </div>
    </Wrapper>
  );
}
