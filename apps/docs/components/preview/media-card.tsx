"use client";

import type { ReactNode } from "react";
import { Lamp, PlayIcon, TriangleAlert } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/ui/media-card";
import {
  RowActionsMenu,
  type RowAction,
} from "@/components/ui/data-table-parts";

const IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23d6d3d1'/><circle cx='8' cy='4.5' r='2.5' fill='%23a8a29e'/></svg>";

const actions: RowAction[] = [
  { label: "Copy link", onSelect: () => {} },
  { type: "separator" },
  { label: "Delete", destructive: true, onSelect: () => {} },
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

const BLUR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23a8a29e'/></svg>";

/** `imagePlaceholder` blurs under the image until it loads; `imageSrcSet`/`imageSizes` pass through. */
export function mediaCardPlaceholder(): ReactNode {
  return (
    <Wrapper className="block max-w-sm">
      <MediaCard
        size="lg"
        href="#aurora"
        image={IMG}
        imageSrcSet={`${IMG} 480w`}
        imageSizes="384px"
        imagePlaceholder={BLUR}
        title="Aurora Downlight"
        meta="8 products · 3 sub-families"
      />
    </Wrapper>
  );
}

/**
 * The `badge` beside the title: with and without one, and a long title that truncates before the
 * badge, which never shrinks.
 */
export function mediaCardTitleBadge(): ReactNode {
  return (
    <Wrapper className="grid max-w-sm grid-cols-1 gap-3">
      <MediaCard
        href="#aurora"
        image={IMG}
        fallback={<Lamp aria-hidden />}
        title="Aurora Downlight"
        meta="8 products · 3 sub-families"
        badge={pill}
        timestamp="2h ago"
      />
      <MediaCard
        href="#beacon"
        image={IMG}
        fallback={<Lamp aria-hidden />}
        title="Beacon Track"
        meta="5 products"
        timestamp="3d ago"
      />
      <MediaCard
        href="#harbor"
        image={IMG}
        fallback={<Lamp aria-hidden />}
        title="Harbor Architectural Bollard with Integrated Emergency Driver"
        meta="6 products · 2 sub-families"
        badge={pill}
        timestamp="5h ago"
      />
    </Wrapper>
  );
}

/**
 * `imageBadge`: a chip over the image's bottom end — a video's play mark and duration — that
 * reads over any picture and never takes the click.
 */
export function mediaCardImageBadge(): ReactNode {
  return (
    <Wrapper className="grid max-w-lg grid-cols-2 gap-3">
      <MediaCard
        size="lg"
        href="#walkthrough"
        image={IMG}
        fallback={<Lamp aria-hidden />}
        title="Site walk-through.mp4"
        meta="Video · 24 MB"
        imageBadge={
          <>
            <PlayIcon aria-hidden />
            1:24
          </>
        }
        actions={
          <RowActionsMenu label="Site walk-through.mp4" actions={actions} />
        }
      />
      <MediaCard
        size="lg"
        href="#install"
        image={null}
        fallback={<Lamp aria-hidden />}
        title="Install briefing.mp4"
        meta="Video · 8 MB"
        imageBadge={
          <>
            <PlayIcon aria-hidden />
            0:42
          </>
        }
      />
    </Wrapper>
  );
}
