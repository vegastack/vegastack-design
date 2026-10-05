// @vegastack diff-view@0.23.124 sha256-1OccGEzwhtjcrFzju3wtle/mKs44s45zyDL361OBdEM=

"use client";

import * as React from "react";
import type { Change } from "diff";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Props for `DiffView`. */
export interface DiffViewProps {
  /** The older text (a version's Markdown). */
  before: string;
  /** The newer text. */
  after: string;
  /**
   * How changes show: inline, removed and added words in reading order.
   * @default "inline"
   */
  mode?: "inline";
  /**
   * Above this many characters (both texts together) nothing is compared.
   * @default 1000000
   */
  maxChars?: number;
  /**
   * Word-level changes only while both texts together stay under this many characters; above it
   * the view shows whole changed lines, with a note.
   * @default 200000
   */
  wordDiffLimit?: number;
  /** Classes for the view. @default undefined */
  className?: string;
}

/** Unchanged runs longer than this collapse behind "Show N unchanged lines". */
const COLLAPSE_AFTER = 6;

type DiffPart = { text: string; kind: "same" | "added" | "removed" };
type DiffBlock =
  { type: "same"; lines: string[] } | { type: "change"; parts: DiffPart[] };

/** `diff` hands back text with its final newline; a block shows lines. */
const linesOf = (value: string) => value.replace(/\n$/, "").split("\n");

function buildBlocks(
  lib: typeof import("diff"),
  before: string,
  after: string,
  words: boolean,
): DiffBlock[] {
  const changes: Change[] = lib.diffLines(before, after);
  const blocks: DiffBlock[] = [];
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]!;
    if (!change.added && !change.removed) {
      blocks.push({ type: "same", lines: linesOf(change.value) });
      continue;
    }
    const next = changes[i + 1];
    // A removed run followed by an added one is one edit: compare it word by word.
    if (change.removed && next?.added && words) {
      i++;
      blocks.push({
        type: "change",
        parts: lib.diffWordsWithSpace(change.value, next.value).map((part) => ({
          text: part.value,
          kind: part.added ? "added" : part.removed ? "removed" : "same",
        })),
      });
      continue;
    }
    blocks.push({
      type: "change",
      parts: [
        {
          text: change.value.replace(/\n$/, ""),
          kind: change.added ? "added" : "removed",
        },
      ],
    });
  }
  return blocks;
}

const MARK = {
  added:
    "rounded-xs bg-success/10 text-success-text no-underline dark:bg-success/20",
  removed:
    "rounded-xs bg-destructive/10 text-destructive-text line-through dark:bg-destructive/20",
} as const;

function Part({ part, block }: { part: DiffPart; block: boolean }) {
  if (part.kind === "same") return <>{part.text}</>;
  const Tag = part.kind === "added" ? "ins" : "del";
  return (
    <Tag
      data-diff={part.kind}
      className={cn(MARK[part.kind], block && "block px-1")}
    >
      {part.text}
    </Tag>
  );
}

function SameRun({ lines }: { lines: string[] }) {
  const [open, setOpen] = React.useState(false);
  if (lines.length <= COLLAPSE_AFTER || open)
    return <div data-slot="diff-view-same">{lines.join("\n")}</div>;
  return (
    <div data-slot="diff-view-collapsed" className="py-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 font-sans text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        Show {lines.length} unchanged lines
      </Button>
    </div>
  );
}

const ROOT =
  "min-w-0 font-mono text-sm wrap-anywhere whitespace-pre-wrap text-foreground";

/** The diff itself: `diff` is imported here and nowhere else, so it loads in this chunk only. */
const DiffBody = React.lazy(() =>
  import("diff").then((lib) => ({
    default: function DiffBody({
      before,
      after,
      maxChars = 1_000_000,
      wordDiffLimit = 200_000,
      className,
    }: DiffViewProps) {
      const size = before.length + after.length;
      const tooLarge = size > maxChars;
      const words = size <= wordDiffLimit;
      const blocks = React.useMemo(
        () => (tooLarge ? [] : buildBlocks(lib, before, after, words)),
        [before, after, tooLarge, words],
      );
      if (tooLarge)
        return (
          <p
            data-slot="diff-view"
            data-state="too-large"
            className={cn("text-sm text-muted-foreground", className)}
          >
            This page is too large to compare
          </p>
        );
      if (!blocks.some((block) => block.type === "change"))
        return (
          <p
            data-slot="diff-view"
            data-state="unchanged"
            className={cn("text-sm text-muted-foreground", className)}
          >
            No changes
          </p>
        );
      return (
        <div
          data-slot="diff-view"
          data-state="changed"
          data-granularity={words ? "word" : "line"}
          className={cn("flex min-w-0 flex-col gap-2", className)}
        >
          {words ? null : (
            <p
              data-slot="diff-view-note"
              className="text-xs text-muted-foreground"
            >
              Showing line changes for large pages
            </p>
          )}
          <div className={ROOT}>
            {blocks.map((block, index) =>
              block.type === "same" ? (
                <SameRun key={index} lines={block.lines} />
              ) : (
                <div key={index} data-slot="diff-view-change">
                  {block.parts.map((part, at) => (
                    <Part key={at} part={part} block={!words} />
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      );
    },
  })),
);

/** The "Comparing…" placeholder while the diff engine loads. */
function DiffViewSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="diff-view"
      data-state="loading"
      role="status"
      className={cn("flex flex-col gap-2", className)}
    >
      <span className="text-xs text-muted-foreground">Comparing…</span>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-5/6" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  );
}

/**
 * `DiffView` — what changed between two texts (two versions of a page's Markdown): whole lines
 * first, then the words inside each changed line — removed words struck through in the
 * destructive ink, added words in the success ink, as `del` and `ins`. Unchanged runs longer than
 * six lines fold behind "Show N unchanged lines"; identical texts say "No changes". Above
 * `wordDiffLimit` (200 KB together) it compares whole lines only and says so. The `diff` engine
 * loads in its own chunk the first time a `DiffView` renders, behind "Comparing…".
 *
 * @example
 * <DiffView before={selected.body} after={page.body} />
 */
export function DiffView(props: DiffViewProps) {
  return (
    <React.Suspense fallback={<DiffViewSkeleton className={props.className} />}>
      <DiffBody {...props} />
    </React.Suspense>
  );
}
