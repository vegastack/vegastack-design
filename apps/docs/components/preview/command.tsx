"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  ClipboardPasteIcon,
  CodeIcon,
  CopyIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  ScissorsIcon,
  SettingsIcon,
  SmileIcon,
  TrashIcon,
  UserIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/command` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFilters,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Kbd } from "@/components/ui/kbd";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DirectionProvider } from "@/components/ui/direction";

export function command(): ReactNode {
  return (
    <Wrapper>
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <CalendarIcon />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem>
              <SmileIcon />
              <span>Search Emoji</span>
            </CommandItem>
            <CommandItem disabled>
              <CalculatorIcon />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <UserIcon />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CreditCardIcon />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <SettingsIcon />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </Wrapper>
  );
}

/** The cmdk engine on its own: type into the input and the list narrows as it scores. */
export function commandAbout(): ReactNode {
  return (
    <Wrapper>
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </Wrapper>
  );
}

export function commandComposition(): ReactNode {
  return (
    <Wrapper>
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
            <CommandItem>Billing</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </Wrapper>
  );
}

export function commandBasic(): ReactNode {
  const [open, setOpen] = React.useState(false);

  return (
    <Wrapper>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </Wrapper>
  );
}

export function commandShortcuts(): ReactNode {
  const [open, setOpen] = React.useState(false);

  return (
    <Wrapper>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Settings">
              <CommandItem>
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </Wrapper>
  );
}

export function commandGroups(): ReactNode {
  const [open, setOpen] = React.useState(false);

  return (
    <Wrapper>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <CalendarIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem>
                <SmileIcon />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem>
                <CalculatorIcon />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </Wrapper>
  );
}

export function commandScrollable(): ReactNode {
  const [open, setOpen] = React.useState(false);

  return (
    <Wrapper>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem>
                <HomeIcon />
                <span>Home</span>
                <CommandShortcut>⌘H</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <InboxIcon />
                <span>Inbox</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FileTextIcon />
                <span>Documents</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FolderIcon />
                <span>Folders</span>
                <CommandShortcut>⌘F</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem>
                <PlusIcon />
                <span>New File</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FolderPlusIcon />
                <span>New Folder</span>
                <CommandShortcut>⇧⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CopyIcon />
                <span>Copy</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ScissorsIcon />
                <span>Cut</span>
                <CommandShortcut>⌘X</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ClipboardPasteIcon />
                <span>Paste</span>
                <CommandShortcut>⌘V</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <TrashIcon />
                <span>Delete</span>
                <CommandShortcut>⌫</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="View">
              <CommandItem>
                <LayoutGridIcon />
                <span>Grid View</span>
              </CommandItem>
              <CommandItem>
                <ListIcon />
                <span>List View</span>
              </CommandItem>
              <CommandItem>
                <ZoomInIcon />
                <span>Zoom In</span>
                <CommandShortcut>⌘+</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ZoomOutIcon />
                <span>Zoom Out</span>
                <CommandShortcut>⌘-</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem>
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <BellIcon />
                <span>Notifications</span>
              </CommandItem>
              <CommandItem>
                <HelpCircleIcon />
                <span>Help &amp; Support</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Tools">
              <CommandItem>
                <CalculatorIcon />
                <span>Calculator</span>
              </CommandItem>
              <CommandItem>
                <CalendarIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem>
                <ImageIcon />
                <span>Image Editor</span>
              </CommandItem>
              <CommandItem>
                <CodeIcon />
                <span>Code Editor</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </Wrapper>
  );
}

export function commandRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <DirectionProvider direction="ltr">
        <Command className="w-full max-w-sm rounded-lg border" dir="ltr">
          <CommandInput placeholder="Type a command or search..." dir="ltr" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <CalendarIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem disabled>
                <CalculatorIcon />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <Command className="w-full max-w-sm rounded-lg border" dir="rtl">
          <CommandInput placeholder="اكتب أمرًا أو ابحث..." dir="rtl" />
          <CommandList>
            <CommandEmpty>لم يتم العثور على نتائج.</CommandEmpty>
            <CommandGroup heading="اقتراحات">
              <CommandItem>
                <CalendarIcon />
                <span>التقويم</span>
              </CommandItem>
              <CommandItem disabled>
                <CalculatorIcon />
                <span>الآلة الحاسبة</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="الإعدادات">
              <CommandItem>
                <UserIcon />
                <span>الملف الشخصي</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DirectionProvider>
    </Wrapper>
  );
}

const MEETINGS = [
  { id: "m1", title: "Depot review", meta: "Meeting · 3 Sep" },
  { id: "m2", title: "Fleet renewal", meta: "Call · 2 Sep" },
  { id: "m3", title: "Quarterly planning", meta: "Meeting · 29 Aug" },
  { id: "m4", title: "Driver onboarding", meta: "Document · 27 Aug" },
] as const;

/** OVL-16: the default wide palette — type chips under the search field and built-in key hints. */
export function commandLargePalette(): ReactNode {
  const [open, setOpen] = React.useState(false);
  const [scope, setScope] = React.useState("all");

  return (
    <Wrapper>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open palette
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search meetings, documents and people…" />
          <CommandFilters>
            <ToggleGroup
              size="sm"
              variant="outline"
              wrap
              deselectable={false}
              aria-label="Filter by type"
              value={[scope]}
              onValueChange={(value) => {
                if (value[0]) setScope(value[0]);
              }}
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="meetings">Meetings</ToggleGroupItem>
              <ToggleGroupItem value="documents">Documents</ToggleGroupItem>
              <ToggleGroupItem value="people">People</ToggleGroupItem>
            </ToggleGroup>
          </CommandFilters>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Recent">
              {MEETINGS.map((meeting) => (
                <CommandItem key={meeting.id} value={meeting.title}>
                  <ItemContent>
                    <ItemTitle>{meeting.title}</ItemTitle>
                    <ItemDescription>{meeting.meta}</ItemDescription>
                  </ItemContent>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandFooter />
        </Command>
      </CommandDialog>
    </Wrapper>
  );
}

/** API-18: results fetched per query, with cmdk's filter off and a loading status above the list. */
export function commandServerResults(): ReactNode {
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] =
    React.useState<readonly (typeof MEETINGS)[number][]>(MEETINGS);

  React.useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      const query = search.trim().toLowerCase();
      setResults(
        MEETINGS.filter((meeting) =>
          meeting.title.toLowerCase().includes(query),
        ),
      );
      setLoading(false);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <Wrapper>
      <Command shouldFilter={false} className="max-w-sm rounded-lg border">
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search meetings…"
        />
        {loading ? <CommandLoading>Searching meetings…</CommandLoading> : null}
        <CommandList>
          {loading ? null : <CommandEmpty>No meetings found.</CommandEmpty>}
          {results.map((meeting) => (
            <CommandItem key={meeting.id} value={meeting.id}>
              {meeting.title}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </Wrapper>
  );
}

/** API-19: the second line is the option's accessible description. */
export function commandTwoLineResults(): ReactNode {
  return (
    <Wrapper>
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Search meetings…" />
        <CommandList>
          <CommandEmpty>No meetings found.</CommandEmpty>
          {MEETINGS.map((meeting) => (
            <CommandItem key={meeting.id} value={meeting.title}>
              <ItemContent>
                <ItemTitle>{meeting.title}</ItemTitle>
                <ItemDescription>{meeting.meta}</ItemDescription>
              </ItemContent>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </Wrapper>
  );
}

/** API-18: key hints in a footer that sits outside the listbox. */
export function commandFooterHints(): ReactNode {
  return (
    <Wrapper>
      <Command className="max-w-sm rounded-lg border">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <CalendarIcon />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem>
              <SettingsIcon />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandFooter>
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> to select
          </span>
          <span className="ms-auto flex items-center gap-1">
            <Kbd>Esc</Kbd> to close
          </span>
        </CommandFooter>
      </Command>
    </Wrapper>
  );
}
