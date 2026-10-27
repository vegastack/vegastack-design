"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Copy, History, RotateCcw } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MarkdownView } from "@/components/ui/markdown-view";
import { VersionCompare } from "@/components/ui/version-compare";
import type { VersionItem } from "@/components/ui/version-list";

const NOW = Date.parse("2026-09-29T11:30:00Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const MK = { name: "Manoj Kumar", hue: "blue" as const };
const CLAUDE = { name: "Claude", kind: "agent" as const, via: "Manoj Kumar" };

const VERSIONS: VersionItem[] = [
  { id: "now", author: MK, at: NOW - 8 * MINUTE, kind: "auto" },
  {
    id: "cp",
    author: MK,
    at: NOW - 10 * MINUTE,
    kind: "auto",
    label: "30-min checkpoint",
  },
  {
    id: "agent",
    author: CLAUDE,
    at: NOW - 1.5 * HOUR,
    kind: "agent_checkpoint",
    summary: "Claude edited 3 blocks",
  },
  {
    id: "named",
    author: MK,
    at: NOW - 26 * HOUR,
    kind: "named",
    name: "Before review",
  },
];

const TEXTS: Record<string, string> = {
  now: `# Kitchen circuit

Use a 25 A breaker for the cooker and keep the panel labelled.

## Wiring

Brown to L, blue to N, green-yellow to earth.

## Sign-off

Ask Bo to check the RCD.`,
  cp: `# Kitchen circuit

Use a 25 A breaker for the cooker.

## Wiring

Brown to L, blue to N, green-yellow to earth.`,
  agent: `# Kitchen circuit

Use a 20 A breaker for the cooker.

## Wiring

Brown to L, blue to N, green-yellow to earth.`,
  named: `# Kitchen circuit

Use a 20 A breaker for the cooker.

## Wiring

Brown to L, blue to N.`,
};

const ORDER = VERSIONS.map((version) => version.id);

function Compare({ className }: { className?: string }) {
  const [selected, setSelected] = React.useState("cp");
  const [showChanges, setShowChanges] = React.useState(true);
  const previous = ORDER[ORDER.indexOf(selected) + 1];
  return (
    <VersionCompare
      className={className}
      versions={VERSIONS}
      currentId="now"
      selectedId={selected}
      onSelect={setSelected}
      now={NOW}
      showChanges={showChanges}
      onShowChangesChange={setShowChanges}
      preview={
        <MarkdownView typeScale="document">
          {TEXTS[selected] ?? ""}
        </MarkdownView>
      }
      diff={
        previous
          ? { before: TEXTS[previous] ?? "", after: TEXTS[selected] ?? "" }
          : null
      }
      actions={
        <>
          <Button variant="outline">
            <Copy aria-hidden />
            Copy
          </Button>
          <Button disabled={selected === "now"}>
            <RotateCcw aria-hidden />
            Restore this version
          </Button>
        </>
      }
    />
  );
}

/**
 * A page's history at full size: the selected version (its changes, with Show changes on) beside
 * the versions grouped by day — an agent's under the agent avatar — and Restore and Copy pinned at
 * the foot. Drag the handle to give the list more room; below 640px the list comes first and a
 * picked version pushes in.
 */
export function versionCompare(): ReactNode {
  return (
    <Wrapper className="flex h-[36rem] flex-col p-4">
      <Compare />
    </Wrapper>
  );
}

/** In its home: a `DialogContent size="fullscreen"`, opened from the page's History button. */
export function versionCompareDialog(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          <History aria-hidden />
          History
        </DialogTrigger>
        <DialogContent size="fullscreen">
          <DialogHeader>
            <DialogTitle>History · Kitchen circuit</DialogTitle>
          </DialogHeader>
          <Compare />
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
