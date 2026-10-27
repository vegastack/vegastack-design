// @vegastack version-list@0.25.89 sha256-F6nTUb0sjzg4o9+XwL3n0YU0eXwn3l5soV87SZVDxI4=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { LoadMore } from "@/components/ui/load-more";
import {
  PersonAgentLabel,
  PersonAvatar,
  PersonName,
  type Person,
} from "@/components/ui/person-avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { PersonBadge } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useListNav } from "@/components/ui/use-list-nav";

/**
 * How a version came to be. `auto` — a checkpoint while people edit; `safety` — the text just
 * before a large deletion; `restore` — the text just before a restore (what Undo returns to);
 * `import` — the text before an import or replace (and a page's original text when it moved to
 * live editing); `agent_checkpoint` — the text before an agent's first edit; `named` — a version
 * someone named; `approved` — a signed-off copy.
 */
export type VersionKind =
  | "auto"
  | "safety"
  | "restore"
  | "import"
  | "agent_checkpoint"
  | "named"
  | "approved";

/**
 * Each kind's badge. `auto` and `named` have none (a checkpoint shows its time, a named version
 * leads with its name). A row's own `label` replaces it ("Before Claude's edits").
 */
export const VERSION_KIND_LABELS: Record<VersionKind, string | null> = {
  auto: null,
  safety: "Before a large deletion",
  restore: "Before a restore",
  import: "Before an import",
  agent_checkpoint: "Before an agent's edits",
  named: null,
  approved: "Approved",
};

/** One saved state of a document, as `VersionList` shows it. */
export interface VersionItem {
  /** Stable id. */
  id: string;
  /**
   * Who wrote the text this version holds; a `badge` on the person ("Inactive") follows the name.
   * An agent (`kind: "agent"`, `via` its owner) reads as everywhere else: the purple bot, "Claude
   * via Manoj" and the "Agent" label.
   * `null` for a version the system kept with no person behind it (a page's text from before it
   * moved to live editing): the row names no one — never a placeholder person.
   */
  author: Person | null;
  /** When that text was last saved. */
  at: Date | string | number;
  /**
   * A name the author gave it, or a title the host writes ("Before Claude (via Manoj)'s edits");
   * the row leads with it. @default undefined
   */
  name?: string | null;
  /** How it came to be (`VersionKind`): its badge (`VERSION_KIND_LABELS`). */
  kind: VersionKind;
  /**
   * The badge, in place of the kind's — the agent's name in "Before Claude's edits". A row with a
   * `name` shows no kind badge (the name says it: "Before live editing", "Before restoring
   * 12 Oct"), except an approved copy, which always says so. @default undefined
   */
  label?: string;
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
  /** More versions exist: the next page loads as the list's end scrolls into view (keyset lists have no totals). @default undefined */
  loadMore?: { hasMore: boolean; onLoadMore: () => void; loading?: boolean };
  /** Show the skeleton instead of the list. @default false */
  loading?: boolean;
  /** Shown when there are no versions. @default "No versions yet" */
  emptyState?: React.ReactNode;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
  /**
   * The list's heading is for assistive technology only — where the host
   * already shows that title (a sheet's). @default false
   */
  headingHidden?: boolean;
  /** The list's heading ("History" where the host calls it that). @default "Version history" */
  heading?: string;
  /** Classes for the list. @default undefined */
  className?: string;
}

/** A row's badge: its own `label`, else its kind's — unless its name already says it. */
function badgeOf(version: VersionItem): string | null {
  if (version.label) return version.label;
  if (version.name && version.kind !== "approved") return null;
  return VERSION_KIND_LABELS[version.kind];
}

/**
 * `VersionList` — a document's version history: each row the time it was saved, who wrote it, its
 * name when it has one, a badge for how it came to be ("Before a large deletion", "Before an
 * agent's edits", "Approved" — `VersionKind`) and one for the document's current text ("Current"). A listbox with one tab stop: ↑/↓, Home and End move
 * the selection. A "Named only" switch in the header, and the next page loads on scroll.
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
  headingHidden = false,
  heading = "Version history",
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
        <h2
          id={headingId}
          className={cn("text-base font-medium", headingHidden && "sr-only")}
        >
          {heading}
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
            const badge = badgeOf(version);
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
                        version.kind === "approved" ? "success" : "outline"
                      }
                    >
                      {badge}
                    </Badge>
                  ) : null}
                </span>
                {version.author || version.name ? (
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {version.author ? (
                      <>
                        <PersonAvatar
                          person={version.author}
                          className="size-4"
                        />
                        <span className="min-w-0 truncate">
                          <PersonName
                            person={version.author}
                            agentLabel={false}
                          />
                        </span>
                        {version.author.kind === "agent" ? (
                          // Outside the truncation, so the label stays whole; the name already
                          // says "agent" to a screen reader.
                          <PersonAgentLabel aria-hidden />
                        ) : null}
                        {/* An agent already carries its label; a host's own "Agent" badge would repeat it. */}
                        {version.author.kind === "agent" &&
                        version.author.badge === "Agent" ? null : (
                          <PersonBadge badge={version.author.badge} />
                        )}
                      </>
                    ) : null}
                    {version.name ? (
                      <>
                        {version.author ? <span aria-hidden>·</span> : null}
                        <RelativeTime
                          date={version.at}
                          mode="day"
                          withTime
                          // Alone on its line (no author before it): it starts the line.
                          capitalize={!version.author}
                          now={now}
                          className="shrink-0 tabular-nums"
                        />
                      </>
                    ) : null}
                  </span>
                ) : null}
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
      {!loading && versions.length > 0 && loadMore ? (
        <LoadMore
          {...loadMore}
          rootMargin="0px 0px 160px 0px"
          skeleton={
            <div className="flex flex-col gap-0.5">
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-1.5 px-2 py-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          }
        />
      ) : null}
    </section>
  );
}
