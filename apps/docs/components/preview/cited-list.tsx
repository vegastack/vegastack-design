"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { FileText, Play } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/cited-list` (dogfoods the registry) → auto-scanned.
import { Citation, CitedList, CitedListItem } from "@/components/ui/cited-list";

/**
 * An answer as numbered points, each followed by the sources it rests on. A point may hold its
 * own links; the chips follow after a space and wrap together.
 */
export function citedList(): ReactNode {
  return (
    <Wrapper>
      <div className="max-w-md">
        <CitedList>
          <CitedListItem
            citations={
              <>
                <Citation href="#kickoff" icon={<FileText />}>
                  Kickoff notes
                </Citation>
                <Citation href="#plan" icon={<FileText />}>
                  Q3 launch plan and supplier schedule (revised)
                </Citation>
              </>
            }
          >
            The launch moved to 14 May, after the supplier slipped by two weeks.
          </CitedListItem>
          <CitedListItem
            citations={
              <Citation href="#budget" icon={<FileText />}>
                Budget review
              </Citation>
            }
          >
            Marketing keeps its budget; the{" "}
            <a href="#print" className="underline underline-offset-2">
              print run
            </a>{" "}
            is cut by a third.
          </CitedListItem>
          <CitedListItem>Nobody owns the press kit yet.</CitedListItem>
        </CitedList>
      </div>
    </Wrapper>
  );
}

/** `render`: a citation as a button — here one that plays a recording from its timestamp. */
export function citedListButtons(): ReactNode {
  const [at, setAt] = React.useState<string | null>(null);
  return (
    <Wrapper>
      <div className="flex max-w-md flex-col gap-3">
        <CitedList>
          <CitedListItem
            citations={
              <>
                {["04:12", "18:40"].map((time) => (
                  <Citation
                    key={time}
                    icon={<Play />}
                    aria-label={`Play from ${time}`}
                    render={
                      <button type="button" onClick={() => setAt(time)} />
                    }
                  >
                    {time}
                  </Citation>
                ))}
              </>
            }
          >
            The team agreed to ship the beta to ten customers first.
          </CitedListItem>
        </CitedList>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {at ? `Playing from ${at}` : "Nothing playing"}
        </p>
      </div>
    </Wrapper>
  );
}
