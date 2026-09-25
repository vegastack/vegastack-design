"use client";

import type { ReactNode } from "react";
import { Lamp, TriangleAlert } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/ui/media-card";
import { RowActionsMenu } from "@/components/ui/data-table-parts";

const IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23d6d3d1'/><circle cx='8' cy='4.5' r='2.5' fill='%23a8a29e'/></svg>";

const actions = [
  { label: "Copy link", onSelect: () => {} },
  {
    label: "Delete",
    destructive: true,
    separatorBefore: true,
    onSelect: () => {},
  },
];

const pill = (
  <Badge variant="warning">
    <TriangleAlert aria-hidden />3 missing specs
  </Badge>
);

export function mediaCard(): ReactNode {
  return (
    <Wrapper className="block max-w-sm">
      <MediaCard
        href="#aurora"
        image={IMG}
        fallback={<Lamp aria-hidden />}
        title="Aurora Downlight"
        meta="8 products · 3 sub-families"
        badge={pill}
        timestamp="2h ago"
        actions={<RowActionsMenu label="Aurora Downlight" actions={actions} />}
      />
    </Wrapper>
  );
}

export function mediaCardFallback(): ReactNode {
  return (
    <Wrapper className="block max-w-sm">
      <MediaCard
        href="#beacon"
        image={null}
        fallback={<Lamp aria-hidden />}
        title="Beacon Track"
        meta="5 products"
        timestamp="3d ago"
      />
    </Wrapper>
  );
}

export function mediaCardLarge(): ReactNode {
  return (
    <Wrapper className="block max-w-xs">
      <MediaCard
        size="lg"
        href="#cove"
        image={IMG}
        fallback={<Lamp aria-hidden />}
        title="Cove Linear"
        meta="12 products · 4 sub-families"
        badge={pill}
        actions={<RowActionsMenu label="Cove Linear" actions={actions} />}
      />
    </Wrapper>
  );
}

export function mediaCardPlain(): ReactNode {
  return (
    <Wrapper className="block max-w-sm">
      <MediaCard title="Send quote to Arora Builders" meta="Due today · High" />
    </Wrapper>
  );
}
