"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { FileText, House, ListChecks, Plus, Table2 } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/command-search` (dogfoods the registry) → auto-scanned.
import {
  CommandSearch,
  CommandSearchInput,
  CommandSearchResults,
  CommandSearchScopes,
  CommandSearchSections,
  type CommandSearchScope,
} from "@/components/ui/command-search";
import {
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { useAsyncSearch } from "@/components/ui/use-async-search";

const SCOPES: CommandSearchScope[] = [
  { value: "all", label: "All" },
  { value: "pages", label: "Pages" },
  { value: "tables", label: "Tables" },
  { value: "rows", label: "Rows" },
  { value: "files", label: "Files" },
  { value: "tasks", label: "Tasks" },
  { value: "meetings", label: "Meetings" },
  { value: "customers", label: "Customers" },
  { value: "projects", label: "Projects" },
  { value: "products", label: "Products" },
];

type Result = {
  id: string;
  type: "pages" | "tables" | "tasks";
  title: string;
  meta: string;
  archived?: boolean;
};

const INDEX: Result[] = [
  {
    id: "p1",
    type: "pages",
    title: "Spec v2",
    meta: "General › Library · edited 2d",
  },
  {
    id: "p2",
    type: "pages",
    title: "Chrome walk notes",
    meta: "General › Library · 5m",
  },
  {
    id: "p3",
    type: "pages",
    title: "Old launch plan",
    meta: "Archive · 1y",
    archived: true,
  },
  {
    id: "t1",
    type: "tables",
    title: "Fixtures",
    meta: "General · 17 rows · 1h",
  },
  {
    id: "k1",
    type: "tasks",
    title: "#70 Review the spec",
    meta: "Todo · due Fri · MK",
  },
  {
    id: "k2",
    type: "tasks",
    title: "#72 Ship the fixtures table",
    meta: "In progress · MK",
  },
];

const ICONS = { pages: FileText, tables: Table2, tasks: ListChecks } as const;
const HEADINGS = { pages: "Pages", tables: "Tables", tasks: "Tasks" } as const;

/** A slow search: 700ms per answer, so the in-flight state is visible. */
function useDemoSearch(open: boolean, scope: string, archived: boolean) {
  return useAsyncSearch<Result>(
    (query, { signal }) =>
      new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          const q = query.trim().toLowerCase();
          resolve({
            items: q
              ? INDEX.filter(
                  (r) =>
                    r.title.toLowerCase().includes(q) &&
                    (scope === "all" || r.type === scope) &&
                    (archived || !r.archived),
                )
              : [],
          });
        }, 700);
        signal.addEventListener("abort", () => {
          window.clearTimeout(timer);
          reject(signal.reason);
        });
      }),
    { enabled: open, deps: [scope, archived] },
  );
}

function Palette({
  defaultQuery = "",
  preview = false,
}: {
  defaultQuery?: string;
  preview?: boolean;
}): ReactNode {
  const [open, setOpen] = React.useState(false);
  const [scope, setScope] = React.useState("all");
  const [archived, setArchived] = React.useState(false);
  const [selected, setSelected] = React.useState("");
  const search = useDemoSearch(open, scope, archived);
  const { onSearchChange } = search;
  React.useEffect(() => {
    if (open && defaultQuery) onSearchChange(defaultQuery);
  }, [open, defaultQuery, onSearchChange]);
  const typed = search.query.trim() !== "";
  const highlighted = search.items.find((r) => r.id === selected);
  return (
    <Wrapper className="block">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Open search
      </Button>
      <CommandSearch
        open={open}
        onOpenChange={setOpen}
        pending={typed && search.loading}
        value={selected}
        onValueChange={setSelected}
        preview={
          preview && highlighted ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium">{highlighted.title}</p>
              <p className="text-muted-foreground">{highlighted.meta}</p>
            </div>
          ) : undefined
        }
      >
        <CommandSearchInput
          value={search.query}
          onValueChange={search.onSearchChange}
        />
        <CommandSearchScopes
          scopes={SCOPES}
          value={scope}
          onValueChange={setScope}
          includeArchived={archived}
          onIncludeArchivedChange={setArchived}
        />
        <CommandSearchResults>
          {typed ? (
            <>
              {!search.loading && search.items.length === 0 ? (
                <CommandEmpty>
                  No results for “{search.query.trim()}”
                </CommandEmpty>
              ) : null}
              {(["pages", "tables", "tasks"] as const).map((type) => {
                const items = search.items.filter((r) => r.type === type);
                const Icon = ICONS[type];
                return items.length ? (
                  <CommandGroup key={type} heading={HEADINGS[type]}>
                    {items.map((r) => (
                      <CommandItem key={r.id} value={r.id}>
                        <Icon aria-hidden />
                        <ItemContent>
                          <ItemTitle>{r.title}</ItemTitle>
                          <ItemDescription>{r.meta}</ItemDescription>
                        </ItemContent>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null;
              })}
            </>
          ) : (
            <CommandSearchSections
              recent={INDEX.slice(0, 2).map((r) => (
                <CommandItem key={r.id} value={`recent-${r.id}`}>
                  <FileText aria-hidden />
                  {r.title}
                </CommandItem>
              ))}
              create={
                <>
                  <CommandItem value="new-page">
                    <Plus aria-hidden />
                    New page
                  </CommandItem>
                  <CommandItem value="new-task">
                    <Plus aria-hidden />
                    New task
                  </CommandItem>
                </>
              }
              places={
                <>
                  <CommandItem value="home">
                    <House aria-hidden />
                    Home
                  </CommandItem>
                  <CommandItem value="tasks">
                    <ListChecks aria-hidden />
                    Tasks
                  </CommandItem>
                </>
              }
            />
          )}
        </CommandSearchResults>
        <CommandFooter className="hidden sm:flex" aria-hidden />
      </CommandSearch>
    </Wrapper>
  );
}

/** The palette, results first: type to search (700ms), switch scope, or pick from More. */
export function commandSearch(): ReactNode {
  return <Palette />;
}

/** With a query already typed and a preview pane beside the results from 1280px. */
export function commandSearchPreview(): ReactNode {
  return <Palette defaultQuery="s" preview />;
}
