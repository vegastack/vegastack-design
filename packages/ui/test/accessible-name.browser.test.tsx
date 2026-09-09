import "./accessible-name.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeAll, expect, test } from "vitest";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  OnboardingChecklist,
  OnboardingChecklistItem,
} from "@/components/ui/onboarding-checklist";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { Board, type BoardColumn } from "@/components/ui/board";
import { DataGrid } from "@/components/ui/data-grid";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  useCommandFilteredItems,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { ToolCallChip } from "@/components/ui/tool-call-chip";

/**
 * The accessible-name contracts, with compiled token CSS.
 *
 * WHY THIS LANE EXISTS — the finding that created it
 *   Accessible-name computation is CSS-dependent. Accname step 2F walks an element's
 *   children and, for each child whose COMPUTED `display` is not `inline`, wraps that
 *   child's contribution in spaces. CSS blockifies the children of a flex container, so
 *
 *       <button class="inline-flex gap-1"><span>Activity</span><span>12</span></button>
 *
 *   names "Activity 12" in a browser and "Activity12" in a realm that loaded no CSS.
 *
 *   Every other test file in `packages/ui` imports no stylesheet. Five accessible-name
 *   assertions were written there against the unstyled reading, "proving" names — Activity3,
 *   Settings⌘S, Getting started1/3Expand checklist — that no screen-reader user has ever
 *   heard. Issue 103 then "fixed" that phantom by inserting `sr-only` ", " separators at nine
 *   call sites, which made the real names WORSE ("Activity , 12" — spoken "Activity comma
 *   12"). The separators were reverted; this file is where the assertions live now, so the
 *   class of mistake cannot recur.
 *
 * WHY IT CANNOT SILENTLY GO VACUOUS
 *   Every name asserted here is the SPACE-SEPARATED one, which is only produced when the
 *   stylesheet actually reached the page. If `accessible-name.css` stopped compiling, or its
 *   `@source` globs stopped covering a component, the fixtures would render unstyled, the
 *   names would concatenate flush, and every test below would go red. The lane fails closed by
 *   construction rather than by a sentinel — and `separators are unnecessary BECAUSE the
 *   layout blockifies` below asserts the mechanism directly, both directions, in one test.
 *
 * SCOPE
 *   The nine call sites where a control takes its accessible name from composed contents:
 *   the ones issue 103 touched. A component whose name comes from `aria-label` has no CSS
 *   dependency and does not belong here.
 */

/** The container the fixtures mount into, so a name query is scoped to one fixture. */
function names(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map(
    (el) => (el as HTMLElement).textContent ?? "",
  );
}

beforeAll(() => {
  // The stylesheet reached the page: a flex container's child is blockified. This is the
  // single fact every assertion in this file rests on, asserted once so a stylesheet
  // regression reports as one clear failure rather than nine confusing ones.
  const probe = document.createElement("div");
  probe.className = "flex";
  probe.innerHTML = "<span>x</span>";
  document.body.append(probe);
  const child = probe.firstElementChild as HTMLElement;
  expect(getComputedStyle(probe).display).toBe("flex");
  expect(getComputedStyle(child).display).toBe("block");
  probe.remove();
});

test("separators are unnecessary BECAUSE the layout blockifies (both directions)", async () => {
  // The proof that this lane's assertions are CSS-sensitive, and the proof that issue 103's
  // premise was an artifact of the CSS-less unit realm — one fixture, two cascades.
  const screen = await render(
    <>
      <Tabs defaultValue="styled">
        <TabsList>
          <TabsTrigger value="styled" count={12}>
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="styled">Panel</TabsContent>
      </Tabs>
      {/* The same markup with the trigger and its children forced back to `inline` — what an
          unstyled realm renders, and the only condition under which the parts concatenate
          flush. The TRIGGER has to be de-flexed too: blockification is not a cascade
          decision, so a flex item stays `block` however loudly its own rule shouts
          `display: inline !important`. That is precisely why no author-level class can
          reintroduce the run-together name — and why the unit realm's reading was an
          artifact of loading no stylesheet at all, not of anything the component does. */}
      <div data-inline-realm>
        <style>
          {`[data-inline-realm] [role="tab"], [data-inline-realm] [role="tab"] > * { display: inline !important }`}
        </style>
        <Tabs defaultValue="inline">
          <TabsList>
            <TabsTrigger value="inline" count={12}>
              Activity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inline">Panel</TabsContent>
        </Tabs>
      </div>
    </>,
  );
  const [styled, inlined] = Array.from(
    screen.container.querySelectorAll('[role="tab"]'),
  ) as HTMLElement[];
  expect(getComputedStyle(styled!.lastElementChild!).display).not.toBe(
    "inline",
  );
  expect(getComputedStyle(inlined!.lastElementChild!).display).toBe("inline");
  await expect
    .element(page.getByRole("tab", { name: "Activity 12" }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole("tab", { name: "Activity12" }))
    .toBeInTheDocument();
});

test("tabs: a counted trigger names its label and its count as separate words", async () => {
  await render(
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity" count={12}>
          Activity
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
    </Tabs>,
  );
  await expect
    .element(page.getByRole("tab", { name: "Activity 12" }))
    .toBeInTheDocument();
  // …and no visible node carries punctuation the design never put there.
  expect(names(document, '[data-slot="tabs-trigger-count"]')).toEqual(["12"]);
});

test("onboarding-checklist: the collapsed pill names title, progress and action", async () => {
  await render(
    <OnboardingChecklist title="Getting started" done={1} total={3}>
      <OnboardingChecklistItem>Step</OnboardingChecklistItem>
    </OnboardingChecklist>,
  );
  await userEvent.click(
    page.getByRole("button", { name: "Collapse checklist" }),
  );
  const pill = page.getByRole("button", {
    name: "Getting started 1/3 Expand checklist",
  });
  await expect.element(pill).toBeInTheDocument();
  // WCAG 2.2 SC 2.5.3 (Label in Name): the VISIBLE strings are verbatim substrings of the
  // name, so a speech-input user saying what they see still activates the control.
  const el = pill.element() as HTMLElement;
  expect(el).not.toHaveAttribute("aria-label");
  expect(el.textContent).toContain("Getting started");
  expect(el.textContent).toContain("1/3");
});

test("stepper: a navigable step names its label and its state", async () => {
  const steps: StepperStep[] = [
    { id: "upload", label: "Upload file", state: "complete" },
    { id: "map", label: "Map columns", state: "current" },
    { id: "review", label: "Review", state: "upcoming" },
  ];
  await render(<Stepper aria-label="Import" steps={steps} navigable />);
  await expect
    .element(page.getByRole("button", { name: "Upload file Completed" }))
    .toBeInTheDocument();
});

test("board: the collapsed column strip names count, title and action", async () => {
  const columns: BoardColumn<{ id: string; name: string }>[] = [
    { id: "lead", title: "Lead", items: [{ id: "d1", name: "Acme" }] },
    {
      id: "won",
      title: "Won",
      items: [{ id: "d3", name: "Initech" }],
      collapsed: true,
    },
  ];
  await render(
    <Board
      aria-label="Deals"
      columns={columns}
      getItemId={(deal) => deal.id}
      renderCard={(deal) => <span>{deal.name}</span>}
      onMove={() => {}}
    />,
  );
  await expect
    .element(
      page.getByRole("button", { name: "1 Won Expand column, read-only" }),
    )
    .toBeInTheDocument();
});

test("data-grid: a merged primary cell names each revealed value separately", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataGrid
        aria-label="Deals"
        columns={[
          { key: "name", header: "Name", minWidth: 10, mobile: "visible" },
          { key: "stage", header: "Stage", minWidth: 10_000, mobile: "merge" },
          { key: "amount", header: "Amount", minWidth: 10_000 },
        ]}
        data={[{ id: "d1", name: "Acme", stage: "Open", amount: 300 }]}
        getRowId={(deal) => deal.id}
      />
    </div>,
  );
  await expect
    .poll(() => document.querySelectorAll('[role="columnheader"]').length)
    .toBe(1);
  await expect
    .element(page.getByRole("gridcell", { name: "Acme Open 300" }))
    .toBeInTheDocument();
});

test("command: an item names its label and its shortcut hint separately", async () => {
  const GROUPS = [
    {
      heading: "Settings",
      items: [{ value: "profile", label: "Profile", shortcut: "⌘P" }],
    },
  ];
  function Groups() {
    const groups = useCommandFilteredItems<(typeof GROUPS)[number]>();
    return (
      <>
        {groups.map((group) => (
          <CommandGroup
            key={group.heading}
            heading={group.heading}
            items={group.items}
          >
            {(item) => (
              <CommandItem key={item.value} value={item.value}>
                {item.label}
                {item.shortcut ? (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                ) : null}
              </CommandItem>
            )}
          </CommandGroup>
        ))}
      </>
    );
  }
  await render(
    <Command items={GROUPS}>
      <CommandInput placeholder="Search…" />
      <CommandList>
        <Groups />
      </CommandList>
    </Command>,
  );
  await expect
    .element(page.getByRole("option", { name: "Profile ⌘P" }))
    .toBeInTheDocument();
});

test("floating-surface: a menu row names its label and its shortcut hint separately", async () => {
  await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          Settings
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await userEvent.click(page.getByRole("button", { name: "Open" }));
  await expect
    .element(page.getByRole("menuitem", { name: "Settings ⌘S" }))
    .toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
});

test("kbd: multi-key chips are separate words inside a naming control", async () => {
  // `kbdVariants` makes every chip `inline-flex`, so the chips separate on their own —
  // this holds whatever wraps them, and it is why `Kbd` needs no separator of its own.
  await render(
    <button type="button">
      <Kbd keys={["⌘", "S"]} os="mac" />
    </button>,
  );
  await expect
    .element(page.getByRole("button", { name: "Command S" }))
    .toBeInTheDocument();
});

test("tool-call-chip: composed as a control, label and meta are separate words", async () => {
  await render(
    <ToolCallChip
      render={<button type="button" />}
      label="Search files"
      meta="1.2s"
    />,
  );
  await expect
    .element(page.getByRole("button", { name: "Search files 1.2s" }))
    .toBeInTheDocument();
});
