// @vegastack version-list@0.23.116 sha256-7s7a4B+mkuI2lzVfrMjKnqpQgF65fAhUEmWTc0q1eQc=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useListNav } from "@/components/ui/use-list-nav";

/** One saved state of a document, as `VersionList` shows it. */
export interface VersionItem {
  /** Stable id. */
  id: string;
  /** Who wrote the text this version holds. */
  author: Person;
  /** When that text was last saved. */
  at: Date | string | number;
  /** A name the author gave it; named versions lead with it. @default undefined */
  name?: string | null;
  /**
   * How it came to be: `auto` (an editing session), `named`, `restore` (a restore of an older
   * version — "Restored") or `conflict` (a save that lost a race, kept — "Unsaved copy").
   */
  kind: "auto" | "named" | "restore" | "conflict";
  /** A muted second line — "12 words added". @default undefined */
  summary?: string;
}

/** Props for `VersionList`. */
export interface VersionListProps {
  /** The versions, newest first. */
  versions: readonly VersionItem[];
  /** The selected version (shown in the diff beside the list). @default null */
  selectedId?: string | null;
  /** Called when a version is picked — by click, or as the arrow keys move. @default undefined */
  onSelect?: (id: string) => void;
  /** The version that is the document's current text: a "Current" badge. @default null */
  currentId?: string | null;
  /** Show named versions only (controlled). @default false */
  namedOnly?: boolean;
  /** Called from the header's "Named only" switch; the switch shows when set. @default undefined */
  onNamedOnlyChange?: (namedOnly: boolean) => void;
  /** More versions exist: a "Load more" footer (keyset lists have no totals). @default undefined */
  loadMore?: { hasMore: boolean; onLoadMore: () => void; loading?: boolean };
  /** Show the skeleton instead of the list. @default false */
  loading?: boolean;
  /** Shown when there are no versions. @default "No versions yet" */
  emptyState?: React.ReactNode;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the list. @default undefined */
  className?: string;
}

const KIND_BADGE: Partial<Record<VersionItem["kind"], string>> = {
  restore: "Restored",
  conflict: "Unsaved copy",
};

/**
 * `VersionList` — a document's version history: each row the time it was saved, who wrote it, its
 * name when it has one, and a badge for a restore ("Restored"), a lost save ("Unsaved copy") and
 * the document's current text ("Current"). A listbox with one tab stop: ↑/↓, Home and End move
 * the selection. A "Named only" switch in the header, and "Load more" at the end.
 *
 * @example
 * <VersionList versions={versions} selectedId={selected} onSelect={setSelected}
 *   currentId={versions[0]?.id} namedOnly={namedOnly} onNamedOnlyChange={setNamedOnly}
 *   loadMore={{ hasMore, onLoadMore: fetchMore, loading: fetching }} />
 */
export function VersionList({
  versions,
  selectedId = null,
  onSelect,
  currentId = null,
  namedOnly = false,
  onNamedOnlyChange,
  loadMore,
  loading = false,
  emptyState = "No versions yet",
  now,
  className,
}: VersionListProps) {
  const headingId = React.useId();
  const switchId = React.useId();
  const selectedIndex = versions.findIndex((v) => v.id === selectedId);
  const nav = useListNav({
    count: versions.length,
    defaultActiveIndex: Math.max(0, selectedIndex),
  });
  const { setActiveIndex } = nav;
  React.useEffect(() => {
    if (selectedIndex >= 0) setActiveIndex(selectedIndex);
  }, [selectedIndex, setActiveIndex]);

  return (
    <section
      data-slot="version-list"
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      <div
        data-slot="version-list-header"
        className="flex min-h-8 items-center justify-between gap-2"
      >
        <h2 id={headingId} className="text-base font-medium">
          Version history
        </h2>
        {onNamedOnlyChange ? (
          <label
            htmlFor={switchId}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Switch
              id={switchId}
              size="sm"
              checked={namedOnly}
              onCheckedChange={(checked) => onNamedOnlyChange(checked)}
            />
            Named only
          </label>
        ) : null}
      </div>
      {loading ? (
        <div
          aria-hidden
          data-slot="version-list-skeleton"
          className="flex flex-col gap-3 py-1"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5 px-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : versions.length === 0 ? (
        <p
          data-slot="version-list-empty"
          className="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          {emptyState}
        </p>
      ) : (
        <div
          role="listbox"
          aria-labelledby={headingId}
          data-slot="version-list-items"
          onKeyDown={nav.handleKeyDown}
          className="flex flex-col gap-0.5"
        >
          {versions.map((version, index) => {
            const selected = version.id === selectedId;
            const badge = KIND_BADGE[version.kind];
            const item = nav.getItemProps(index);
            return (
              <div
                key={version.id}
                role="option"
                aria-selected={selected}
                data-slot="version-list-item"
                data-selected={selected ? "true" : undefined}
                data-kind={version.kind}
                tabIndex={item.tabIndex}
                ref={item.ref}
                onFocus={() => {
                  item.onFocus();
                  if (!selected) onSelect?.(version.id);
                }}
                onClick={() => {
                  if (!selected) onSelect?.(version.id);
                }}
                className="flex min-w-0 cursor-default flex-col gap-1 rounded-md px-2 py-1.5 text-sm select-none hover:bg-accent data-selected:bg-muted"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  {version.name ? (
                    <span className="min-w-0 font-medium wrap-anywhere">
                      {version.name}
                    </span>
                  ) : (
                    <RelativeTime
                      date={version.at}
                      mode="day"
                      withTime
                      capitalize
                      now={now}
                      className="tabular-nums"
                    />
                  )}
                  {version.id === currentId ? (
                    <Badge variant="secondary">Current</Badge>
                  ) : null}
                  {badge ? (
                    <Badge
                      variant={
                        version.kind === "conflict" ? "warning" : "outline"
                      }
                    >
                      {badge}
                    </Badge>
                  ) : null}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <PersonAvatar person={version.author} className="size-4" />
                  <span className="min-w-0 truncate">
                    {version.author.name}
                  </span>
                  {version.name ? (
                    <>
                      <span aria-hidden>·</span>
                      <RelativeTime
                        date={version.at}
                        mode="day"
                        withTime
                        now={now}
                        className="shrink-0 tabular-nums"
                      />
                    </>
                  ) : null}
                </span>
                {version.summary ? (
                  <span className="text-xs text-muted-foreground">
                    {version.summary}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {!loading && loadMore?.hasMore ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={loadMore.onLoadMore}
          loading={loadMore.loading}
          disabled={loadMore.loading}
        >
          {loadMore.loading ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </section>
  );
}
