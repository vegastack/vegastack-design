"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { ListTree } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/table-of-contents` (dogfoods the registry) → auto-scanned.
import {
  TableOfContents,
  type TableOfContentsItem,
  type TableOfContentsProps,
} from "@/components/ui/table-of-contents";
import { Button } from "@/components/ui/button";

/** The sample page: headings with a level and a body long enough to scroll through. */
const SECTIONS = [
  { slug: "overview", level: 1, text: "Kitchen circuit", lines: 3 },
  { slug: "supply", level: 2, text: "Supply and isolation", lines: 5 },
  { slug: "wiring", level: 2, text: "Wiring", lines: 4 },
  { slug: "cable-sizes", level: 3, text: "Cable sizes", lines: 4 },
  { slug: "earthing", level: 3, text: "Earthing", lines: 3 },
  { slug: "labels", level: 4, text: "Panel labels", lines: 2 },
  { slug: "sign-off", level: 2, text: "Sign-off", lines: 1 },
];

const LINE =
  "Keep the cooker on its own radial circuit, test the RCD before the inspection and note the readings on the schedule.";

/** Heading ids are global: each example prefixes its own so two previews on one page never collide. */
function outline(prefix: string): TableOfContentsItem[] {
  return SECTIONS.map((section) => ({
    id: `${prefix}-${section.slug}`,
    level: section.level,
    text: section.text,
  }));
}

/** Scroll the heading to the top of the example's own scroller only — never the docs page. */
function scrollWithin(scroller: HTMLElement | null, id: string) {
  const heading = document.getElementById(id);
  if (!scroller || !heading) return;
  scroller.scrollTo({
    top:
      heading.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}

/** A scrolling article beside its outline, the outline's spy reading the article's scroller. */
function Article({
  prefix,
  toc,
}: {
  prefix: string;
  toc: Omit<TableOfContentsProps, "items">;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  return (
    <div className="flex w-full gap-6">
      <TableOfContents
        {...toc}
        items={outline(prefix)}
        scrollContainer={scroller}
        sticky={false}
        onNavigate={(id) => scrollWithin(scroller.current, id)}
        className={toc.variant === "rail" ? undefined : "w-48 shrink-0"}
      />
      <div
        ref={scroller}
        className="h-72 min-w-0 flex-1 overflow-y-auto rounded-md border border-border bg-background p-4 text-sm"
      >
        {SECTIONS.map((section) => {
          const Heading = `h${Math.min(section.level + 1, 6)}` as "h2";
          return (
            <section key={section.slug} className="pb-4">
              <Heading
                id={`${prefix}-${section.slug}`}
                className="pb-1 font-heading text-base font-medium"
              >
                {section.text}
              </Heading>
              {Array.from({ length: section.lines }, (_, index) => (
                <p key={index} className="pb-2 text-muted-foreground">
                  {LINE}
                </p>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The `list` variant beside a scrolling article: scroll it and the outline follows (the scroll
 * spy); choose a heading to jump to it.
 */
export function tableOfContents(): ReactNode {
  return (
    <Wrapper className="block">
      <Article prefix="toc-list" toc={{}} />
    </Wrapper>
  );
}

/**
 * The `rail` variant: short ticks whose width follows the level, the reached one thicker. Rest the
 * pointer on it, or Tab into it, and it opens into the labelled list over the article; Esc closes
 * it again.
 */
export function tableOfContentsRail(): ReactNode {
  return (
    <Wrapper className="block">
      <Article prefix="toc-rail" toc={{ variant: "rail" }} />
    </Wrapper>
  );
}

/** A controlled active item: `activeId` marks it (`aria-current="location"`, a bar and weight). */
export function tableOfContentsActive(): ReactNode {
  const items = outline("toc-active");
  const [activeId, setActiveId] = React.useState(items[2]!.id);
  return (
    <Wrapper className="block">
      <TableOfContents
        className="w-56"
        sticky={false}
        items={items}
        activeId={activeId}
        onNavigate={setActiveId}
      />
    </Wrapper>
  );
}

/** Levels: `maxLevel={4}` lets the level-4 heading in; indentation is relative to the shallowest level shown. */
export function tableOfContentsLevels(): ReactNode {
  const items = outline("toc-levels");
  return (
    <Wrapper className="grid gap-6 sm:grid-cols-2">
      <TableOfContents
        sticky={false}
        items={items}
        maxLevel={4}
        label="Levels 1 to 4"
        activeId={null}
        onNavigate={() => {}}
      />
      <TableOfContents
        sticky={false}
        items={items}
        minLevel={2}
        maxLevel={2}
        label="Level 2 only"
        activeId={null}
        onNavigate={() => {}}
      />
    </Wrapper>
  );
}

/**
 * Narrow screens: with `trigger`, the outline opens in a left `Sheet` from a header button, and
 * choosing a heading closes it, then navigates.
 */
export function tableOfContentsSheet(): ReactNode {
  const items = outline("toc-sheet");
  const [chosen, setChosen] = React.useState<string | null>(null);
  return (
    <Wrapper>
      <TableOfContents
        items={items}
        activeId={items[1]!.id}
        onNavigate={setChosen}
        trigger={
          <Button variant="outline" size="sm">
            <ListTree aria-hidden />
            Outline
          </Button>
        }
      />
      <span className="text-sm text-muted-foreground">
        {chosen
          ? `Chose “${items.find((item) => item.id === chosen)?.text}”`
          : "Nothing chosen yet"}
      </span>
    </Wrapper>
  );
}

/** No headings in range: the outline renders nothing, so the column it sits in stays empty. */
export function tableOfContentsEmpty(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <TableOfContents items={[]} />
      <span className="text-sm text-muted-foreground">
        A page with no headings shows no outline.
      </span>
    </Wrapper>
  );
}
