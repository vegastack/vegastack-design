"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { GitBranch } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/searchable-select` (dogfoods the registry).
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAsyncSearch } from "@/components/ui/use-async-search";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface Repo {
  id: string;
  name: string;
  owner: string;
}

const REPOS: Repo[] = [
  { id: "design", name: "vegastack-design", owner: "vegastack" },
  { id: "platform", name: "engg-vegastack-platform", owner: "vegastack" },
  { id: "factory", name: "vegafactory", owner: "vegastack" },
  { id: "tokens", name: "vegastack-design-tokens", owner: "vegastack" },
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
      <div className="w-full max-w-72">
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
      <div className="w-full max-w-72">
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
      <div className="flex w-full max-w-72 flex-col gap-2">
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
        <p className="text-xs text-muted-foreground">
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
      <div className="w-full max-w-72">
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
              <span className="truncate text-xs font-medium text-muted-foreground">
                {repo.owner}
              </span>
            </span>
          )}
          renderValue={(repo) => (
            <>
              <GitBranch
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
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
      <div className="w-full max-w-72">
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

/**
 * DS-22: inside a `Field` the trigger is named by `FieldLabel`, described by the rendered
 * description and error, and marked invalid — and it posts the repo's key under `name`.
 */
export function searchableSelectInsideField(): ReactNode {
  const [value, setValue] = React.useState<Repo | null>(null);
  return (
    <Wrapper>
      <Field data-invalid={value === null} className="w-full max-w-72">
        <FieldLabel>Repository</FieldLabel>
        <SearchableSelect<Repo>
          items={REPOS}
          value={value}
          onValueChange={setValue}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => repo.name}
          renderItem={(repo) => repo.name}
          searchLabel="Search repositories"
          placeholder="Select repository"
          name="repository"
          required
        />
        <FieldDescription>Where the release is cut from.</FieldDescription>
        <FieldError>
          {value === null ? "Choose a repository." : null}
        </FieldError>
      </Field>
    </Wrapper>
  );
}

/**
 * DS-17: the inline tier in a row — `size="sm"` and `variant="ghost"` sit at the row's height with
 * no border at rest; `contentClassName` widens the panel past the narrow trigger.
 */
export function searchableSelectInline(): ReactNode {
  const [value, setValue] = React.useState<Repo | null>(REPOS[1]!);
  return (
    <Wrapper className="items-stretch">
      <div className="flex w-full max-w-md min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <span className="min-w-0 truncate text-sm">Release 2026.09</span>
        <SearchableSelect<Repo>
          items={REPOS}
          value={value}
          onValueChange={setValue}
          itemToKey={(repo) => repo.id}
          itemToStringLabel={(repo) => repo.name}
          renderItem={(repo) => repo.name}
          searchLabel="Search repositories"
          aria-label="Repository"
          size="sm"
          variant="ghost"
          contentClassName="min-w-64"
          clearable
        />
      </div>
    </Wrapper>
  );
}

const OWNERS = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Edsger Dijkstra",
  "Barbara Liskov",
  "Donald Knuth",
  "Margaret Hamilton",
].map((name, index) => ({ id: String(index + 1), name }));

/** Server search: a fake endpoint pages four at a time behind `useAsyncSearch`. */
export function searchableSelectServerSearch(): ReactNode {
  const [value, setValue] = React.useState<{ id: string; name: string } | null>(
    null,
  );
  const search = useAsyncSearch<{ id: string; name: string }>(
    (query, { cursor, signal }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const matches = OWNERS.filter((o) =>
            o.name.toLowerCase().includes(query.trim().toLowerCase()),
          );
          const start = Number(cursor ?? 0);
          resolve({
            items: matches.slice(start, start + 4),
            nextCursor: start + 4 < matches.length ? String(start + 4) : null,
          });
        }, 400);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
  );
  return (
    <Wrapper>
      <div className="w-full max-w-xs">
        <SearchableSelect
          remote
          items={search.items}
          onSearchChange={search.onSearchChange}
          loading={search.loading}
          error={search.error}
          loadMore={search.loadMore}
          leadingItems={[{ id: "me", name: "Me" }]}
          value={value}
          onValueChange={setValue}
          itemToKey={(o) => o.id}
          itemToStringLabel={(o) => o.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
          renderItem={(o) => o.name}
          searchLabel="Search people"
          placeholder="Assign to"
          aria-label="Owner"
        />
      </div>
    </Wrapper>
  );
}

/** Several values, a description line, and a disabled option that says why. */
export function searchableSelectMultiple(): ReactNode {
  const [value, setValue] = React.useState<Repo[]>([REPOS[0]!]);
  return (
    <Wrapper>
      <div className="w-full max-w-xs">
        <SearchableSelect<Repo, true>
          multiple
          items={REPOS}
          value={value}
          onValueChange={setValue}
          itemToKey={(r) => r.id}
          itemToStringLabel={(r) => r.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
          itemToDescription={(r) => r.owner}
          itemToDisabledReason={(r) =>
            r.id === "docs" ? "Archived — read only" : undefined
          }
          renderItem={(r) => r.name}
          searchLabel="Search repositories"
          placeholder="Select repositories"
          aria-label="Repositories"
        />
      </div>
    </Wrapper>
  );
}
