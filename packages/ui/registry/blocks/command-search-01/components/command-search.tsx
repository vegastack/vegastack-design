// @vegastack command-search-01@0.23.1 sha256-1hw2ZVwuiwCH0BgpkL7O9qzQ6/wCNde9eiY/x5kISq4=

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
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  formatShortcut,
  formatShortcutKey,
  usePlatform,
} from "@/components/ui/use-platform";

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

/** Props for {@link CommandSearch}. */
export interface CommandSearchProps {
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
 * The search palette: a `CommandDialog` that asks the host's `search(query, scope, signal)` and
 * shows the answer grouped by type. Scope chips sit after the input as their own Tab stop, and
 * Alt+← / Alt+→ switches scope without leaving the input; changing scope re-asks and keeps the
 * query. An empty query shows recents; typing waits `TIMINGS.searchDebounceMs` before asking. ↵
 * opens the selected result, ⌘↵ / Ctrl+↵ opens it in a new tab, and only http(s) links are followed.
 * The footer's hints are built with `formatShortcut`.
 *
 * @example
 * <CommandSearch search={(q, scope, signal) => api.search(q, scope, { signal })} recents={recent} />
 */
export function CommandSearch({
  search,
  recents = [],
  open: openProp,
  onOpenChange,
  defaultOpen = false,
}: CommandSearchProps) {
  const { os } = usePlatform();
  const { announce, Announcer } = useAnnouncer();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<string>("all");
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
      searchRef.current(q, scope, controller.signal).then(
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
  }, [announce, query, scope, attempt]);

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
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      const result = byId.get(selected);
      if (result) {
        event.preventDefault();
        openResult(result, true);
      }
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      size="lg"
      title="Search"
      description="Search meetings, tasks, products, families, accessories, customers, projects, attributes and pages"
    >
      <Command
        shouldFilter={false}
        resultsLabel={silentResultsLabel}
        value={selected}
        onValueChange={setSelected}
        onKeyDown={onCommandKeyDown}
      >
        <CommandInput
          placeholder="Search…"
          value={query}
          onValueChange={setQuery}
          onKeyDown={onInputKeyDown}
          aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
        />
        <Announcer />
        <div className="px-2 pt-2" onKeyDown={keepKeys}>
          <ToggleGroup
            size="sm"
            variant="outline"
            wrap
            deselectable={false}
            aria-label="Search in"
            value={[scope]}
            onValueChange={(value) => {
              if (value[0]) setScope(value[0]);
            }}
          >
            {SCOPES.map((s) => (
              <ToggleGroupItem key={s.value} value={s.value}>
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <CommandList>
          {status === "loading" ? <CommandLoading label="Searching…" /> : null}
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
          {query.trim() === "" && recents.length ? (
            <CommandGroup heading="Recent">
              {recents.map((r) => (
                <ResultItem key={r.id} result={r} onOpen={openResult} />
              ))}
            </CommandGroup>
          ) : null}
          {status === "ready"
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
        </CommandList>
        <CommandFooter className="hidden sm:flex" aria-hidden>
          <KbdGroup>
            <Kbd>{formatShortcutKey("enter", os)}</Kbd> Open
          </KbdGroup>
          <KbdGroup>
            <Kbd>{formatShortcut(["mod", "enter"], os)}</Kbd> New tab
          </KbdGroup>
          <KbdGroup>
            <Kbd>Esc</Kbd> Close
          </KbdGroup>
        </CommandFooter>
      </Command>
    </CommandDialog>
  );
}
