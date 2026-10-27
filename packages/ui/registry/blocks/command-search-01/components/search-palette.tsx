// @vegastack command-search-01@0.25.94 sha256-8hDZudLonefWvbh/rvN9sXpnyglOIJe0QqGdDxTjJKM=

"use client";

import * as React from "react";
import { TIMINGS } from "@vegastack/design";
import {
  Box,
  CalendarDays,
  FileText,
  FolderKanban,
  Layers,
  ListChecks,
  Puzzle,
  SlidersHorizontal,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandItem,
  CommandLoading,
} from "@/components/ui/command";
import {
  CommandSearch,
  CommandSearchInput,
  CommandSearchResults,
  CommandSearchScopes,
  CommandSearchSections,
} from "@/components/ui/command-search";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { useAnnouncer } from "@/components/ui/use-announcer";

/** One search result. */
export interface SearchResult {
  id: string;
  type:
    | "meeting"
    | "task"
    | "product"
    | "family"
    | "accessory"
    | "customer"
    | "project"
    | "attribute"
    | "page";
  title: string;
  /** One line of context, e.g. "Meeting · Skyline · 3 Sep". */
  description: string;
  href: string;
}

/** The host's search call: resolve the results, or reject; honour `signal` to cancel. */
export type SearchFn = (
  query: string,
  scope: string,
  signal: AbortSignal,
  options: { includeArchived: boolean },
) => Promise<SearchResult[]>;

/** The scopes, in chip order; "all" searches everything. */
export const SCOPES = [
  { value: "all", label: "All" },
  { value: "meetings", label: "Meetings" },
  { value: "tasks", label: "Tasks" },
  { value: "products", label: "Products" },
  { value: "families", label: "Families" },
  { value: "accessories", label: "Accessories" },
  { value: "customers", label: "Customers" },
  { value: "projects", label: "Projects" },
  { value: "attributes", label: "Attributes" },
  { value: "pages", label: "Pages" },
] as const;

const GROUPS: { type: SearchResult["type"]; heading: string }[] = [
  { type: "meeting", heading: "Meetings" },
  { type: "task", heading: "Tasks" },
  { type: "product", heading: "Products" },
  { type: "family", heading: "Families" },
  { type: "accessory", heading: "Accessories" },
  { type: "customer", heading: "Customers" },
  { type: "project", heading: "Projects" },
  { type: "attribute", heading: "Attributes" },
  { type: "page", heading: "Pages" },
];

const ICONS: Record<SearchResult["type"], React.ElementType> = {
  meeting: CalendarDays,
  task: ListChecks,
  product: Box,
  family: Layers,
  accessory: Puzzle,
  customer: UsersRound,
  project: FolderKanban,
  attribute: SlidersHorizontal,
  page: FileText,
};

/**
 * The settled count, spoken once per answer. `Command`'s own result announcer counts cmdk's items,
 * which with `shouldFilter={false}` is 0 while the host call is in flight, so it would say
 * "0 results" on every keystroke; the block silences it and speaks the answer itself.
 */
function resultsLabel(count: number): string {
  if (count === 0) return "No results";
  return count === 1 ? "1 result" : `${count} results`;
}
const silentResultsLabel = () => "";

/** Only http(s) and same-origin relative links are followed; `javascript:` and the rest are not. */
function isSafeHref(href: string): boolean {
  try {
    const { protocol } = new URL(href, window.location.href);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Keeps the keys cmdk's root claims (Enter selects, Home/End move) on a control inside it. */
function keepKeys(event: React.KeyboardEvent) {
  if (event.key === "Enter" || event.key === "Home" || event.key === "End")
    event.stopPropagation();
}

/** Props for `SearchPalette`. */
export interface SearchPaletteProps {
  /** Your search call. */
  search: SearchFn;
  /**
   * Shown while the query is empty, most recent first.
   * @default []
   */
  recents?: SearchResult[];
  /**
   * Controlled open state.
   * @default undefined
   */
  open?: boolean;
  /**
   * Called when the palette asks to open or close.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Open on first render, when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
}

function ResultItem({
  result,
  onOpen,
}: {
  result: SearchResult;
  onOpen: (result: SearchResult) => void;
}) {
  const Icon = ICONS[result.type];
  return (
    <CommandItem value={result.id} onSelect={() => onOpen(result)}>
      <Icon aria-hidden />
      <ItemContent>
        <ItemTitle>{result.title}</ItemTitle>
        <ItemDescription>{result.description}</ItemDescription>
      </ItemContent>
    </CommandItem>
  );
}

/**
 * The search palette, on the design system's `CommandSearch`: it asks the host's
 * `search(query, scope, signal, { includeArchived })` and shows the answer grouped by type. Scope
 * chips sit on one line after the input as their own Tab stop — what does not fit is in More, with
 * Include archived — and Alt+← / Alt+→ switches scope without leaving the input; changing scope
 * re-asks and keeps the query. An empty query shows recents; typing waits
 * `TIMINGS.searchDebounceMs` before asking, and while it asks the last answer stays, dimmed, under
 * the input's progress bar (an answer to an older query is dropped). ↵ opens the selected result,
 * ⌘↵ / Ctrl+↵ opens it in a new tab, and only http(s) links are followed. The footer shows
 * `CommandFooter`'s built-in key hints.
 *
 * @example
 * <SearchPalette search={(q, scope, signal) => api.search(q, scope, { signal })} recents={recent} />
 */
export function SearchPalette({
  search,
  recents = [],
  open: openProp,
  onOpenChange,
  defaultOpen = false,
}: SearchPaletteProps) {
  const { announce, Announcer } = useAnnouncer();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<string>("all");
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [selected, setSelected] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);

  // The latest search call, so an inline arrow never re-asks.
  const searchRef = React.useRef(search);
  React.useLayoutEffect(() => {
    searchRef.current = search;
  });

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setStatus("idle");
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    const timer = setTimeout(() => {
      searchRef.current(q, scope, controller.signal, { includeArchived }).then(
        (next) => {
          if (controller.signal.aborted) return;
          setResults(next);
          setStatus("ready");
          announce(resultsLabel(next.length));
        },
        () => {
          if (!controller.signal.aborted) setStatus("error");
        },
      );
    }, TIMINGS.searchDebounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [announce, query, scope, includeArchived, attempt]);

  const shown = query.trim() ? results : recents;
  const byId = new Map(shown.map((r) => [r.id, r]));

  function openResult(result: SearchResult, newTab = false) {
    if (!isSafeHref(result.href)) return;
    if (newTab) {
      window.open(result.href, "_blank", "noopener");
      return;
    }
    setOpen(false);
    window.location.assign(result.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      event.altKey &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      const index = SCOPES.findIndex((s) => s.value === scope);
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = SCOPES[(index + step + SCOPES.length) % SCOPES.length];
      if (next) {
        setScope(next.value);
        announce(`Searching ${next.label}`);
      }
    }
  }

  function onCommandKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // cmdk's onSelect receives no event, so the new-tab path reads the selection here.
    if (
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey) &&
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229
    ) {
      const result = byId.get(selected);
      if (result) {
        event.preventDefault();
        openResult(result, true);
      }
    }
  }

  const typed = query.trim() !== "";
  return (
    <CommandSearch
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search meetings, tasks, products, families, accessories, customers, projects, attributes and pages"
      pending={status === "loading"}
      resultsLabel={silentResultsLabel}
      value={selected}
      onValueChange={setSelected}
      onKeyDown={onCommandKeyDown}
    >
      <CommandSearchInput
        placeholder="Search…"
        value={query}
        onValueChange={setQuery}
        onKeyDown={onInputKeyDown}
        aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      />
      <Announcer />
      <CommandSearchScopes
        scopes={SCOPES}
        value={scope}
        onValueChange={setScope}
        includeArchived={includeArchived}
        onIncludeArchivedChange={setIncludeArchived}
      />
      <CommandSearchResults>
        {status === "loading" && results.length === 0 ? (
          <CommandLoading label="Searching…" />
        ) : null}
        {status === "error" ? (
          <div
            role="alert"
            className="flex items-center justify-center gap-2 py-6 text-sm"
            onKeyDown={keepKeys}
          >
            <TriangleAlert
              aria-hidden
              className="size-4 text-destructive-text"
            />
            <span className="text-destructive-text">Couldn’t search</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </Button>
          </div>
        ) : null}
        {status === "ready" ? <CommandEmpty>No results</CommandEmpty> : null}
        {!typed ? (
          <CommandSearchSections
            recent={recents.map((r) => (
              <ResultItem key={r.id} result={r} onOpen={openResult} />
            ))}
          />
        ) : null}
        {typed && status !== "error"
          ? GROUPS.map((group) => {
              const items = results.filter((r) => r.type === group.type);
              return items.length ? (
                <CommandGroup key={group.type} heading={group.heading}>
                  {items.map((r) => (
                    <ResultItem key={r.id} result={r} onOpen={openResult} />
                  ))}
                </CommandGroup>
              ) : null;
            })
          : null}
      </CommandSearchResults>
      <CommandFooter className="hidden sm:flex" aria-hidden />
    </CommandSearch>
  );
}
