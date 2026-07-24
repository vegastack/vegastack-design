"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpenCheck,
  Check,
  FileText,
  GitBranch,
  GitMerge,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Wrapper } from "./wrapper";
import { Spinner } from "@/components/ui/spinner";
// Copied INTO apps/docs via `shadcn add @vegastack/marker` (dogfoods the registry) → auto-scanned.
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Button } from "@/components/ui/button";

export function marker(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-3">
        <Marker>
          <MarkerIcon>
            <GitMerge />
          </MarkerIcon>
          <MarkerContent>Pull request merged into main</MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <Check />
          </MarkerIcon>
          <MarkerContent>All checks passed</MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <BookOpenCheck />
          </MarkerIcon>
          <MarkerContent>Synced 12 documents to the workspace</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerVariants(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-4">
        <Marker variant="border">
          <MarkerIcon>
            <Check />
          </MarkerIcon>
          <MarkerContent>A bordered status row</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Today</MarkerContent>
        </Marker>
        <Marker>
          <MarkerContent>A plain inline marker</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerSeparator(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-4">
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
      <div className="flex w-72 flex-col gap-3">
        <Marker variant="border">
          <MarkerIcon>
            <GitBranch />
          </MarkerIcon>
          <MarkerContent>Switched to release-candidate</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <Search />
          </MarkerIcon>
          <MarkerContent>Reviewed 8 related files</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <FileText />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerStatus(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-4">
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

export function markerStreaming(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-4">
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent className="shimmer">
            Generating response…
          </MarkerContent>
        </Marker>
        <Marker variant="separator" role="status">
          <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerInlineLink(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-3">
        <Marker>
          <MarkerIcon>
            <GitMerge />
          </MarkerIcon>
          <MarkerContent>
            Merged <a href="#">PR 482</a> into main
          </MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <FileText />
          </MarkerIcon>
          <MarkerContent>
            Updated the <a href="#">release notes</a> for this change
          </MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function markerAnimateIn(): ReactNode {
  const [merged, setMerged] = useState(false);
  return (
    <Wrapper className="flex-col gap-4">
      <div className="flex h-6 w-72 items-center">
        {merged ? (
          <Marker key="merged" animateIn>
            <MarkerIcon>
              <GitMerge />
            </MarkerIcon>
            <MarkerContent>Pull request merged into main</MarkerContent>
          </Marker>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for the merge…
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => setMerged((v) => !v)}>
        {merged ? "Reset" : "Simulate merge event"}
      </Button>
    </Wrapper>
  );
}

export function markerLinkButton(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-3">
        <Marker render={<a href="#" />}>
          <MarkerIcon>
            <GitMerge />
          </MarkerIcon>
          <MarkerContent>View the pull request</MarkerContent>
        </Marker>
        <Marker
          render={
            <button
              type="button"
              onClick={() => toast("Reverted the last change")}
              className="hover:text-foreground"
            />
          }
        >
          <MarkerIcon>
            <RotateCcw />
          </MarkerIcon>
          <MarkerContent>Revert this change</MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}
