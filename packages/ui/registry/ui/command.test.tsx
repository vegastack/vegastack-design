import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Spinner } from "./spinner";
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
} from "./command";

type ExampleItem = { value: string; label: string; disabled?: boolean; shortcut?: string };

const SUGGESTIONS: ExampleItem[] = [
  { value: "calendar", label: "Calendar" },
  { value: "search-emoji", label: "Search Emoji" },
];
const SETTINGS: ExampleItem[] = [
  { value: "profile", label: "Profile", shortcut: "⌘P" },
  { value: "billing", label: "Billing", disabled: true },
];
const EXAMPLE_GROUPS = [
  { heading: "Suggestions", items: SUGGESTIONS },
  { heading: "Settings", items: SETTINGS },
];

// The anatomy is data-driven (see command.tsx's DATA-DRIVEN note): `Command` takes `items`
// (here, groups), and grouped rendering reads the FILTERED result from `useCommandFilteredItems`
// (not the original static array) into each `CommandGroup`.
function ExampleGroups({ onSelect }: { onSelect?: (value: string) => void }) {
  const groups = useCommandFilteredItems<(typeof EXAMPLE_GROUPS)[number]>();
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
                {item.label}
                {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
              </CommandItem>
            )}
          </CommandGroup>
        </React.Fragment>
      ))}
    </>
  );
}

function Example({ onSelect }: { onSelect?: (value: string) => void } = {}) {
  return (
    <Command items={EXAMPLE_GROUPS}>
      <CommandInput placeholder="Search…" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <ExampleGroups onSelect={onSelect} />
      </CommandList>
    </Command>
  );
}

test("renders the search input and all items", async () => {
  const screen = await render(<Example />);
  await expect.element(screen.getByPlaceholder("Search…")).toBeInTheDocument();
  await expect.element(screen.getByText("Calendar")).toBeInTheDocument();
  await expect.element(screen.getByText("Search Emoji")).toBeInTheDocument();
  await expect.element(screen.getByText("Profile")).toBeInTheDocument();
});

test("renders group headings", async () => {
  const screen = await render(<Example />);
  await expect.element(screen.getByText("Suggestions")).toBeInTheDocument();
  await expect.element(screen.getByText("Settings")).toBeInTheDocument();
});

test("typing filters items down to matches", async () => {
  const screen = await render(<Example />);
  await screen.getByPlaceholder("Search…").fill("Cal");

  await expect.element(screen.getByText("Calendar")).toBeInTheDocument();
  // Non-matching items are removed from the DOM (Base UI only renders the query-filtered `items`).
  await expect.poll(() => document.body.textContent).not.toContain("Profile");
});

test("shows the empty state when nothing matches", async () => {
  const screen = await render(<Example />);
  await screen.getByPlaceholder("Search…").fill("zzzznope");
  await expect
    .element(screen.getByText("No results found."))
    .toBeInTheDocument();
});

test("selecting an item fires onSelect", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Example onSelect={onSelect} />);
  await screen.getByText("Calendar").click();
  expect(onSelect).toHaveBeenCalledTimes(1);
});

test("a disabled item carries data-disabled and does not fire onSelect", async () => {
  const onSelect = vi.fn();
  await render(<Example onSelect={onSelect} />);
  const billing = document.querySelector<HTMLElement>(
    '[data-slot="command-item"][data-disabled]',
  );
  expect(billing?.textContent).toContain("Billing");
  billing?.click();
  expect(onSelect).not.toHaveBeenCalled();
});

test("a custom filter can match against keywords beyond the visible label", async () => {
  // DEVIATION: the prior implementation's per-item `keywords` prop has no Base UI equivalent (filtering is data-driven
  // off `items`, not per-rendered-item metadata). Ported by folding `keywords` into the item data
  // and matching them from a custom `filter` on `Command` — same observable behavior.
  const items = [
    { value: "invoices", label: "Invoices", keywords: ["money", "payments"] },
    { value: "calendar", label: "Calendar", keywords: [] as string[] },
  ];
  const screen = await render(
    <Command
      items={items}
      filter={(item: (typeof items)[number], query) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }}
    >
      <CommandInput placeholder="Search…" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        {(item: (typeof items)[number]) => (
          <CommandItem key={item.value} value={item.value}>
            {item.label}
          </CommandItem>
        )}
      </CommandList>
    </Command>,
  );

  await screen.getByPlaceholder("Search…").fill("payments");
  await expect.element(screen.getByText("Invoices")).toBeInTheDocument();
  await expect.poll(() => document.body.textContent).not.toContain("Calendar");
});

test("a statically-composed item stays mounted while filtering (no forceMount equivalent)", async () => {
  // DEVIATION: the prior implementation's per-item `forceMount` prop has no Base UI equivalent — items only ever come
  // from the query-filtered `items` array. The same effect (an item that's immune to the query) is
  // achieved by composing it OUTSIDE the filtered `CommandGroup`/`useCommandFilteredItems` result,
  // as an ordinary static sibling.
  function AlwaysAndFiltered() {
    const filtered = useCommandFilteredItems<{ value: string; label: string }>();
    return (
      <>
        <CommandItem value="always">Always visible</CommandItem>
        <CommandGroup items={filtered}>
          {(item) => (
            <CommandItem key={item.value} value={item.value}>
              {item.label}
            </CommandItem>
          )}
        </CommandGroup>
      </>
    );
  }
  const screen = await render(
    <Command items={[{ value: "calendar", label: "Calendar" }]}>
      <CommandInput placeholder="Search…" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <AlwaysAndFiltered />
      </CommandList>
    </Command>,
  );

  await screen.getByPlaceholder("Search…").fill("zzzznope");
  await expect.element(screen.getByText("Always visible")).toBeInTheDocument();
  await expect.poll(() => document.body.textContent).not.toContain("Calendar");
});

test("renders an announced loading state for async results", async () => {
  await render(
    <Command items={[]}>
      <CommandInput placeholder="Search…" />
      <CommandLoading>
        <Spinner size="inherit" label="" />
        Loading commands…
      </CommandLoading>
      <CommandList />
    </Command>,
  );

  const loading = document.querySelector('[data-slot="command-loading"]');
  expect(loading).not.toBeNull();
  expect(loading).toHaveAttribute("role", "status");
  expect(loading).toHaveAttribute("aria-live", "polite");
  expect(loading?.textContent).toContain("Loading commands…");
});

test("Enter activates the highlighted item", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Example onSelect={onSelect} />);
  const input = screen.getByPlaceholder("Search…");
  await input.click();
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalled();
});

test("CommandDialog opens and renders its items", async () => {
  const screen = await render(
    <CommandDialog defaultOpen commandProps={{ items: [{ heading: "Navigation", items: [{ value: "dashboard", label: "Go to dashboard" }] }] }}>
      <CommandInput placeholder="Type a command…" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <ExampleGroups />
      </CommandList>
    </CommandDialog>,
  );
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  await expect.element(screen.getByText("Go to dashboard")).toBeInTheDocument();
});

test("CommandDialog forwards commandProps to the inner Command root", async () => {
  // DEVIATION: the prior implementation's `shouldFilter: false` (disable filtering entirely) is Base UI's `filter:
  // null` — its own documented escape hatch (see AriaCombobox's `filter` prop).
  const items = [
    { value: "calendar", label: "Calendar" },
    { value: "profile", label: "Profile" },
  ];
  const screen = await render(
    <CommandDialog defaultOpen commandProps={{ items, filter: null, loop: true }}>
      <CommandInput placeholder="Type a command…" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        {(item: (typeof items)[number]) => (
          <CommandItem key={item.value} value={item.value}>
            {item.label}
          </CommandItem>
        )}
      </CommandList>
    </CommandDialog>,
  );
  await screen.getByPlaceholder("Type a command…").fill("zzzznope");
  // `filter: null` keeps consumer-managed items mounted even when they do not match the query.
  await expect.element(screen.getByText("Calendar")).toBeInTheDocument();
  await expect.element(screen.getByText("Profile")).toBeInTheDocument();
});

test("no a11y violations — loading", async () => {
  // `CommandLoading` (Base UI `Combobox.Status`, role="status") now renders as a SIBLING of
  // `CommandList` (role="listbox"), not its child — see command.tsx's anatomy note. `listbox` only
  // permits `option`/`group` owned children, so nesting `status` inside it (the old build's
  // structure) tripped `aria-required-children`; moving it out fixes this for real, no suppression.
  await render(
    <Command items={[{ value: "calendar", label: "Calendar" }]}>
      <CommandInput placeholder="Search…" />
      <CommandLoading>
        <Spinner size="inherit" label="" />
        Loading commands…
      </CommandLoading>
      <CommandList>
        {(item: { value: string; label: string }) => (
          <CommandItem key={item.value} value={item.value}>
            {item.label}
          </CommandItem>
        )}
      </CommandList>
    </Command>,
  );
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — open", async () => {
  const screen = await render(
    <CommandDialog defaultOpen commandProps={{ items: [{ heading: "Navigation", items: [{ value: "dashboard", label: "Go to dashboard" }] }] }}>
      <CommandInput placeholder="Type a command…" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <ExampleGroups />
      </CommandList>
    </CommandDialog>,
  );
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // The dialog portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations", async () => {
  await render(<Example />);
  // No suppression: `CommandSeparator` marks itself `aria-hidden` (removing the decorative divider
  // from the a11y tree — a `role="separator"` is not a permitted owned child of `role="listbox"`),
  // and `CommandEmpty` lives outside `CommandList` entirely, so the listbox owns only valid
  // `group`/`option` children.
  await expectNoA11yViolations(document.body);
});

test("CommandSeparator is aria-hidden so the listbox owns only group/option children", async () => {
  await render(<Example />);
  const sep = document.querySelector('[data-slot="command-separator"]');
  expect(sep).not.toBeNull();
  expect(sep).toHaveAttribute("aria-hidden", "true");
  // Direct, non-hidden children of the listbox must each be a group or option (axe's rule).
  const listbox = document.querySelector('[role="listbox"]')!;
  const exposed = Array.from(listbox.querySelectorAll("[role]")).filter(
    (el) => el.closest('[aria-hidden="true"]') === null,
  );
  for (const el of exposed) {
    const role = el.getAttribute("role");
    expect(["group", "option", "presentation", "none"]).toContain(role);
  }
});

test("CommandInput forwards ref to its host input element", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(
    <Command items={[]}>
      <CommandInput ref={ref} placeholder="Search…" />
    </Command>,
  );
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe("command-input");
});
