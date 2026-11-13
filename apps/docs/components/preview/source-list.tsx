"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/source-list` (dogfoods the registry) → auto-scanned.
import {
  SourceCard,
  SourceList,
  sourceCitations,
  type WebSource,
} from "@/components/ui/source-list";
import { MarkdownView } from "@/components/ui/markdown-view";

const SOURCES: WebSource[] = [
  {
    href: "https://www.ies.org/standards/standards-TM-21",
    title:
      "TM-21-21: Projecting long-term luminous flux maintenance of LED packages",
    icon: "/preview/favicon-dark-mark.svg",
    snippet:
      "Extrapolates LM-80 data to estimate when an LED's output falls to 70% of its initial value.",
  },
  {
    href: "https://www.cibse.org/knowledge-research/knowledge-portal/lg7-lighting-for-offices",
    title: "LG7: Lighting for offices",
    icon: "/preview/favicon-blue.svg",
  },
  {
    href: "https://example.org/glare/ugr-explained",
    title: "Unified glare rating, explained",
  },
];

export function sourceList(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <MarkdownView citation={sourceCitations(SOURCES)}>
        {
          "LED drift needs about 6,000 hours of LM-80 data before TM-21 projects it [[1]], and an open office should keep its UGR at 19 or below [[2]][[3]]."
        }
      </MarkdownView>
      <SourceList sources={SOURCES} />
    </Wrapper>
  );
}

export function sourceListOpen(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <SourceList sources={SOURCES} defaultOpen />
    </Wrapper>
  );
}

export function sourceListCard(): ReactNode {
  return (
    <Wrapper className="bg-background">
      <div className="w-72 rounded-lg border border-border bg-popover p-2.5">
        <SourceCard source={SOURCES[0]!} />
      </div>
    </Wrapper>
  );
}
