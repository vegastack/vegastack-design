"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Search,
  Settings,
  Smile,
  User,
  type LucideIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/command` (dogfoods the registry) → auto-scanned.
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandLoading,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  CommandDialog,
  useCommandFilteredItems,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Item = {
  value: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
  keywords?: string[];
};

const SUGGESTIONS: Item[] = [
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "search-emoji", label: "Search Emoji", icon: Smile },
];
const SETTINGS: Item[] = [
  { value: "profile", label: "Profile", icon: User, shortcut: "⌘P" },
  {
    value: "billing",
    label: "Billing",
    icon: CreditCard,
    shortcut: "⌘B",
    disabled: true,
  },
  { value: "settings", label: "Settings", icon: Settings, shortcut: "⌘S" },
];
const COMMAND_GROUPS = [
  { heading: "Suggestions", items: SUGGESTIONS },
  { heading: "Settings", items: SETTINGS },
];

/** Reads Command's query-filtered groups and renders one `CommandGroup` per group, separated. */
function CommandGroups({ onSelect }: { onSelect?: (value: string) => void }) {
  const groups = useCommandFilteredItems<(typeof COMMAND_GROUPS)[number]>();
  return (
    <>
      {groups.map((group, i) => (
        <React.Fragment key={group.heading}>
          {i > 0 ? <CommandSeparator /> : null}
          <CommandGroup heading={group.heading} items={group.items}>
            {(item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                onSelect={() => onSelect?.(item.value)}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.shortcut ? (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                ) : null}
              </CommandItem>
            )}
          </CommandGroup>
        </React.Fragment>
      ))}
    </>
  );
}

export function command(): ReactNode {
  return (
    <Wrapper>
      <Command
        items={COMMAND_GROUPS}
        className="w-full max-w-sm border border-border shadow-overlay"
      >
        <CommandInput placeholder="Type a command or search…" />
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandList>
          <CommandGroups />
        </CommandList>
      </Command>
    </Wrapper>
  );
}

export function commandStates(): ReactNode {
  const emptyItems: Item[] = [
    { value: "profile", label: "Profile", icon: User },
    { value: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <Wrapper className="flex-col gap-6 sm:flex-row sm:items-start">
      <div className="flex w-full max-w-sm flex-col gap-2">
        <span className="text-label-sm text-muted-foreground">Item states</span>
        <Command
          items={SETTINGS}
          className="w-full border border-border shadow-overlay"
        >
          <CommandInput placeholder="Type a command or search…" />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            {(item: Item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.shortcut ? (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                ) : null}
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <span className="text-label-sm text-muted-foreground">Empty state</span>
        <Command
          items={emptyItems}
          defaultInputValue="no-such-command"
          className="w-full border border-border shadow-overlay"
        >
          <CommandInput placeholder="Search…" />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            {(item: Item) => (
              <CommandItem key={item.value} value={item.value}>
                <item.icon />
                <span>{item.label}</span>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </div>
    </Wrapper>
  );
}

export function commandDialog(): ReactNode {
  return (
    <Wrapper>
      <CommandDialogDemo />
    </Wrapper>
  );
}

export function commandAsync(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <CommandAsyncDemo />
    </Wrapper>
  );
}

const ADVANCED_ITEMS: Item[] = [
  {
    value: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "overview"],
  },
  {
    value: "invoices",
    label: "Invoices",
    icon: CreditCard,
    shortcut: "⌘I",
    keywords: ["billing", "payments"],
  },
  {
    value: "docs",
    label: "Docs",
    icon: FileText,
    keywords: ["files", "knowledge"],
  },
];

/**
 * Matching by label OR `keywords` — the prior library's per-item `keywords` prop has no Base UI equivalent
 * (filtering is data-driven off `items`, not per-rendered-item metadata), so it's folded into the
 * item data and matched from a custom `filter` on `Command` instead.
 */
export function commandAdvanced(): ReactNode {
  const [search, setSearch] = React.useState("");
  return (
    <Wrapper>
      <Command
        items={ADVANCED_ITEMS}
        className="w-full max-w-sm border border-border shadow-overlay"
        inputValue={search}
        onInputValueChange={setSearch}
        filter={(item: Item, query) => {
          const haystack = [item.label, ...(item.keywords ?? [])]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query.toLowerCase());
        }}
        loop
      >
        <CommandInput placeholder="Search by label or alias…" />
        <CommandEmpty>No commands found for "{search}".</CommandEmpty>
        <CommandList>
          {(item: Item) => (
            <CommandItem key={item.value} value={item.value}>
              <item.icon />
              <span>{item.label}</span>
              {item.shortcut ? (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              ) : null}
            </CommandItem>
          )}
        </CommandList>
      </Command>
    </Wrapper>
  );
}

function CommandAsyncDemo() {
  const [loaded, setLoaded] = React.useState(false);
  const items: Item[] = loaded
    ? [
        {
          value: "quarterly-report",
          label: "Quarterly report",
          icon: FileText,
        },
        {
          value: "billing-dashboard",
          label: "Billing dashboard",
          icon: CreditCard,
        },
        { value: "team-calendar", label: "Team calendar", icon: Calendar },
      ]
    : [];

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => setLoaded((value) => !value)}
      >
        <RefreshCw />
        {loaded ? "Reset results" : "Load results"}
      </Button>
      <Command
        items={items}
        className="w-full border border-border shadow-overlay"
      >
        <CommandInput placeholder="Search remote commands…" />
        <CommandLoading>
          {!loaded ? (
            <>
              <Spinner size="inherit" label="" />
              Fetching commands…
            </>
          ) : null}
        </CommandLoading>
        <CommandList>
          {loaded ? (
            <CommandGroup heading="Remote results" items={items}>
              {(item: Item) => (
                <CommandItem key={item.value} value={item.value}>
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              )}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </div>
  );
}

function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false);

  // Toggle on ⌘K / Ctrl+K — the app owns this binding (the component is presentational).
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Search />
        Open command menu
        <CommandShortcut>⌘K</CommandShortcut>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        commandProps={{ items: COMMAND_GROUPS }}
      >
        <CommandInput placeholder="Type a command or search…" />
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandList>
          <CommandGroups onSelect={() => setOpen(false)} />
        </CommandList>
      </CommandDialog>
    </>
  );
}
