// @vegastack command-search-01@0.20.0 sha256-wlflkcS11d3GdasYSIv7MdSu8gd1YkSlV2AfhGS51zs=

"use client";

import * as React from "react";
import {
  Box,
  CalendarDays,
  FileText,
  ListChecks,
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
import { formatShortcut, usePlatform } from "@/components/ui/use-platform";

/** One search result. */
export interface SearchResult {
  id: string;
  type: "meeting" | "task" | "product" | "customer" | "page";
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
  { value: "customers", label: "Customers" },
  { value: "pages", label: "Pages" },
] as const;

const GROUPS: { type: SearchResult["type"]; heading: string }[] = [
  { type: "meeting", heading: "Meetings" },
  { type: "task", heading: "Tasks" },
  { type: "product", heading: "Products" },
  { type: "customer", heading: "Customers" },
  { type: "page", heading: "Pages" },
];

const ICONS: Record<SearchResult["type"], React.ElementType> = {
  meeting: CalendarDays,
  task: ListChecks,
  product: Box,
  customer: UsersRound,
  page: FileText,
};

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
 * query. An empty query shows recents. ↵ opens the selected result, ⌘↵ / Ctrl+↵ opens it in a new
 * tab, and the footer's hints are built with `formatShortcut`.
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

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setStatus("idle");
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    search(q, scope, controller.signal).then(
      (next) => {
        if (controller.signal.aborted) return;
        setResults(next);
        setStatus("ready");
      },
      () => {
        if (!controller.signal.aborted) setStatus("error");
      },
    );
    return () => controller.abort();
  }, [query, scope, search, attempt]);

  const shown = query.trim() ? results : recents;
  const byId = new Map(shown.map((r) => [r.id, r]));

  function openResult(result: SearchResult, newTab = false) {
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
      if (next) setScope(next.value);
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
      description="Search meetings, tasks, products, customers and pages"
    >
      <Command
        shouldFilter={false}
        value={selected}
        onValueChange={setSelected}
        onKeyDown={onCommandKeyDown}
      >
        <CommandInput
          placeholder="Search…"
          value={query}
          onValueChange={setQuery}
          onKeyDown={onInputKeyDown}
        />
        <div className="px-2 pt-2">
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
            >
              <TriangleAlert
                aria-hidden
                className="size-4 text-destructive-text"
              />
              <span>Couldn’t search.</span>
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
            <Kbd>↵</Kbd> Open
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
