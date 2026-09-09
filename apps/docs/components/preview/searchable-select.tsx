"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { GitBranch } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/searchable-select` (dogfoods the registry).
import { SearchableSelect } from "@/components/ui/searchable-select";

interface Repo {
  id: string;
  name: string;
  owner: string;
}

const REPOS: Repo[] = [
  { id: "design", name: "vegastack-design", owner: "vegastack" },
  { id: "platform", name: "engg-vegastack-platform", owner: "vegastack" },
  { id: "factory", name: "vegafactory", owner: "vegastack" },
  { id: "starter", name: "vegastack-design-starter", owner: "vegastack" },
  { id: "docs", name: "vegastack-docs", owner: "vegastack" },
];

/*
 * The control is `w-full` like every other form field — these examples constrain it with a
 * `max-w-*` PARENT, which is how a consumer sizes it inside a form column.
 */

/**
 * Default example — a Select-shaped trigger over a filtered list. The search field lives inside
 * the panel (not on the trigger), and the selected row carries a check.
 */
export function searchableSelect(): ReactNode {
  const [value, setValue] = React.useState<Repo | null>(REPOS[0]!);
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-md)">
        <SearchableSelect<Repo>
          items={REPOS}
          value={value}
          onValueChange={setValue}
          isItemEqualToValue={(a, b) => a.id === b.id}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => repo.name}
          renderItem={(repo) => repo.name}
          placeholder="Select repository"
          searchLabel="Search repositories"
          searchPlaceholder="Search repositories…"
          emptyMessage="No repository found."
        />
      </div>
    </Wrapper>
  );
}

/** Empty state — nothing selected yet, so the trigger reads as a muted placeholder. */
export function searchableSelectEmpty(): ReactNode {
  const [value, setValue] = React.useState<Repo | null>(null);
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-md)">
        <SearchableSelect<Repo>
          items={REPOS}
          value={value}
          onValueChange={setValue}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => repo.name}
          renderItem={(repo) => repo.name}
          placeholder="Select repository"
          searchLabel="Search repositories"
        />
      </div>
    </Wrapper>
  );
}

/**
 * `clearable` — while a value is set the trigger's trailing slot swaps the chevron for a clear
 * control that reports `null`. It is a SIBLING of the trigger, never a child: an interactive
 * control may not contain another. The two share one trailing reserve, so the label's box does
 * not move between the states.
 */
export function searchableSelectClearable(): ReactNode {
  const [value, setValue] = React.useState<Repo | null>(REPOS[1]!);
  return (
    <Wrapper>
      <div className="flex w-full max-w-(--panel-width-md) flex-col gap-2">
        <SearchableSelect<Repo>
          items={REPOS}
          value={value}
          onValueChange={setValue}
          isItemEqualToValue={(a, b) => a.id === b.id}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => repo.name}
          renderItem={(repo) => repo.name}
          placeholder="Select repository"
          searchLabel="Search repositories"
          clearable
          clearLabel="Clear repository"
        />
        <p className="text-sm text-muted-foreground">
          value:{" "}
          <code className="font-mono text-foreground">
            {value ? `"${value.name}"` : "null (cleared)"}
          </code>
        </p>
      </div>
    </Wrapper>
  );
}

/**
 * `renderItem` vs. `renderValue` — a row can be richer than the trigger face. Here every row shows
 * the owner beneath the name while the trigger stays a single line with a leading glyph.
 */
export function searchableSelectRich(): ReactNode {
  const [value, setValue] = React.useState<Repo | null>(REPOS[2]!);
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-md)">
        <SearchableSelect<Repo>
          items={REPOS}
          value={value}
          onValueChange={setValue}
          isItemEqualToValue={(a, b) => a.id === b.id}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => `${repo.owner}/${repo.name}`}
          renderItem={(repo) => (
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{repo.name}</span>
              <span className="truncate text-label-sm text-muted-foreground">
                {repo.owner}
              </span>
            </span>
          )}
          renderValue={(repo) => (
            <>
              <GitBranch
                aria-hidden
                className="size-(--icon-default) shrink-0 text-muted-foreground"
              />
              <span className="truncate">{repo.name}</span>
            </>
          )}
          placeholder="Select repository"
          searchLabel="Search repositories"
        />
      </div>
    </Wrapper>
  );
}

/** Disabled — the whole control is inert and the trigger never opens. */
export function searchableSelectDisabled(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-md)">
        <SearchableSelect<Repo>
          items={REPOS}
          value={REPOS[0]}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => repo.name}
          renderItem={(repo) => repo.name}
          searchLabel="Search repositories"
          disabled
        />
      </div>
    </Wrapper>
  );
}
