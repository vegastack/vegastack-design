"use client";

import { type ReactNode, useState } from "react";
import {
  BookOpenCheck,
  CheckIcon,
  FileTextIcon,
  GitBranchIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/marker` (dogfoods the registry) → auto-scanned.
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";

/*
 * Upstream's own examples, adapted for our import paths and for one behaviour: upstream's "Links
 * and Buttons" demo calls `toast()` from sonner, which mounts a portalled toaster into a fixture
 * that the geometry lane also renders. The button below flips a line of its own text instead — the
 * same "a marker can be a real control" point, with nothing portalled and no timer.
 */

/** The column every upstream example lays its markers out in, minus upstream's page padding. */
const COLUMN = "flex w-full max-w-sm flex-col gap-8";

export function marker(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker>
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>Switched to a new branch</MarkerContent>
        </Marker>
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent className="shimmer">Thinking...</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Conversation compacted</MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <SearchIcon />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerComposition(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker>
          <MarkerIcon>
            <CheckIcon />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerFeatures(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        {/* The inline marker, with the decorative icon slot. */}
        <Marker>
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>Switched to release-candidate</MarkerContent>
        </Marker>
        {/* The bordered row. */}
        <Marker variant="border">
          <MarkerIcon>
            <FileTextIcon />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
        {/* The labelled separator. */}
        <Marker variant="separator">
          <MarkerContent>Conversation compacted</MarkerContent>
        </Marker>
        {/* The shimmer utility, on a status marker. */}
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
        </Marker>
        {/* Polymorphic through `render`: the root is a real link. */}
        <Marker render={<a href="#features" />}>
          <MarkerIcon>
            <SearchIcon />
          </MarkerIcon>
          <MarkerContent>View the pull request</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerVariants(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker>
          <MarkerContent>A default marker for inline notes.</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>A separator marker</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerContent>A border marker for row boundaries.</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerStatus(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent>Compacting conversation</MarkerContent>
        </Marker>
        <Marker variant="separator" role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent>Running tests</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerShimmer(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker role="status">
          <MarkerContent className="shimmer">Thinking...</MarkerContent>
        </Marker>
        <Marker variant="separator" role="status">
          <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerSeparator(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker variant="separator">
          <MarkerContent>Today</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Worked for 42s</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Conversation compacted</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerBorder(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Marker variant="border">
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>Switched to release-candidate</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <SearchIcon />
          </MarkerIcon>
          <MarkerContent>Reviewed 8 related files</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <FileTextIcon />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerWithIcon(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col gap-12">
        <Marker>
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>Switched to a new branch</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerIcon>
            <SearchIcon />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
        <Marker className="flex-col">
          <MarkerIcon>
            <BookOpenCheck />
          </MarkerIcon>
          <MarkerContent>Syncing completed</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerLinksAndButtons(): ReactNode {
  const [reverted, setReverted] = useState(false);
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Marker render={<a href="#links-and-buttons" />}>
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>View the pull request</MarkerContent>
        </Marker>
        <Marker
          render={
            <button
              type="button"
              className="transition-colors hover:text-foreground"
              onClick={() => setReverted(true)}
            />
          }
        >
          <MarkerIcon>
            <RotateCcwIcon />
          </MarkerIcon>
          <MarkerContent>
            {reverted ? "Change reverted" : "Revert this change"}
          </MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerAccessibility(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        {/* Streaming progress announces itself. */}
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent>Compacting conversation</MarkerContent>
        </Marker>
        {/* A labelled separator takes NO role — the text is ordinary content. */}
        <Marker variant="separator">
          <MarkerContent>Today</MarkerContent>
        </Marker>
        {/* A bordered marker keeps the default semantics; the border is decorative. */}
        <Marker variant="border">
          <MarkerIcon>
            <FileTextIcon />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
        {/*
         * MarkerIcon is aria-hidden, so an icon-only marker needs a name of its own. `aria-label`
         * on a bare `<div>` is prohibited (the element has no role to take it), so the name goes
         * on an element that can hold one — here `role="img"`, the honest role for a glyph that
         * carries meaning.
         */}
        <Marker role="img" aria-label="Synced">
          <MarkerIcon>
            <CheckIcon />
          </MarkerIcon>
        </Marker>
        {/* An interactive marker is a real element, so it is focusable and correctly announced. */}
        <Marker render={<a href="#accessibility" />}>
          <MarkerIcon>
            <FileTextIcon />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}
