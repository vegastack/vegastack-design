import * as React from "react";
// The compiled lane stylesheet as a STRING, mounted only for the containment test below: every
// other test here measures against its own style mirror and must not see real CSS.
import geometryCss from "../../test/geometry.css?inline";
import { render } from "vitest-browser-react";
import { expect, onTestFinished, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Flag } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  FilterBar,
  FilterBarFacet,
  FilterChip,
  type FilterBarProps,
} from "./filter-bar";

test("searchInputProps cannot take ownership of the search value event", () => {
  const acceptSearchInputProps = (
    _props: NonNullable<FilterBarProps["searchInputProps"]>,
  ) => {};

  // @ts-expect-error FilterBarSearch.onValueChange is the sole value-event owner.
  acceptSearchInputProps({ onChange: () => {} });
});

test("renders a chip per active filter", async () => {
  const screen = await render(
    <FilterBar
      filters={[
        {
          id: "status",
          label: "Status",
          value: "In Progress",
          onRemove: () => {},
        },
        {
          id: "priority",
          label: "Priority",
          value: "High",
          onRemove: () => {},
        },
      ]}
    />,
  );
  await expect.element(screen.getByText("Status")).toBeInTheDocument();
  await expect.element(screen.getByText("In Progress")).toBeInTheDocument();
  await expect.element(screen.getByText("Priority")).toBeInTheDocument();
  await expect.element(screen.getByText("High")).toBeInTheDocument();
});

test("tags the container and exposes the filter id", async () => {
  const screen = await render(
    <FilterBar
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
    />,
  );
  await expect
    .element(screen.getByRole("group", { name: "Filters" }))
    .toHaveAttribute("data-slot", "filter-bar");
  expect(document.querySelector('[data-filter-id="status"]')).not.toBeNull();
});

test("allows the filter group label to be customized", async () => {
  const screen = await render(
    <FilterBar filters={[]} aria-label="Issue filters" />,
  );
  await expect
    .element(screen.getByRole("group", { name: "Issue filters" }))
    .toHaveAttribute("data-slot", "filter-bar");
});

test("removing a chip fires its onRemove", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <FilterBar
      filters={[{ id: "status", label: "Status", value: "Open", onRemove }]}
    />,
  );
  await screen.getByRole("button", { name: "Remove Status filter" }).click();
  expect(onRemove).toHaveBeenCalledOnce();
});

test("add-filter opens the menu and fires onAddFilter with the option id", async () => {
  const onAddFilter = vi.fn();
  const screen = await render(
    <FilterBar
      filters={[]}
      addFilters={[
        { id: "priority", label: "Priority", icon: <Flag /> },
        { id: "assignee", label: "Assignee" },
      ]}
      onAddFilter={onAddFilter}
    />,
  );

  // Closed: the menu is not in the DOM.
  expect(document.querySelector('[role="menu"]')).toBeNull();

  await screen.getByRole("button", { name: "Add filter" }).click();

  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Priority" }))
    .toBeInTheDocument();

  await page.getByRole("menuitem", { name: "Priority" }).click();
  expect(onAddFilter).toHaveBeenCalledWith("priority");
});

test("custom addFilterMenu takes precedence over declarative addFilters", async () => {
  const screen = await render(
    <FilterBar
      filters={[]}
      addFilters={[{ id: "priority", label: "Priority" }]}
      addFilterMenu={<button type="button">Custom add</button>}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Custom add" }))
    .toBeInTheDocument();
  // The declarative trigger is not rendered when a custom menu is provided.
  expect(document.querySelector('[data-slot="filter-bar-add"]')).toBeNull();
});

test("search field is controlled — typing fires onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <FilterBar
      filters={[]}
      search={{ value: "", onValueChange, placeholder: "Search tasks…" }}
    />,
  );
  const input = screen.getByPlaceholder("Search tasks…");
  await expect.element(input).toBeInTheDocument();
  await input.fill("bug");
  expect(onValueChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledWith("bug");
});

test("search clear reports one empty value and keeps input focus", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <FilterBar
      filters={[]}
      search={{
        value: "regent",
        onValueChange,
        placeholder: "Search tasks…",
      }}
    />,
  );
  const input = screen.getByRole("searchbox", { name: "Search tasks…" });
  await screen.getByRole("button", { name: "Clear search" }).click();
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenLastCalledWith("");
  expect(document.activeElement).toBe(input.element());
});

test("Escape clears FilterBar search exactly once", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <FilterBar
      filters={[]}
      search={{ value: "regent", onValueChange, "aria-label": "Query" }}
    />,
  );
  await screen.getByRole("searchbox", { name: "Query" }).click();
  await userEvent.keyboard("{Escape}");
  expect(onValueChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledWith("");
});

test.each(["empty", "disabled", "readOnly"])(
  "search exposes no clear action when %s",
  async (state) => {
    const value = state === "empty" ? "" : "regent";
    await render(
      <FilterBar
        filters={[]}
        search={{ value, onValueChange: () => {} }}
        searchInputProps={
          state === "disabled"
            ? { disabled: true }
            : state === "readOnly"
              ? { readOnly: true }
              : {}
        }
      />,
    );
    expect(
      document.querySelector('[data-slot="search-input-clear"]'),
    ).toBeNull();
  },
);

test("forwards searchInputProps to SearchInput and preserves placement", async () => {
  const screen = await render(
    <FilterBar
      filters={[]}
      search={{ value: "regent", onValueChange: () => {} }}
      searchInputProps={{ className: "max-w-sm", name: "query" }}
    />,
  );
  const group = document.querySelector(
    '[data-slot="filter-bar-search"]',
  ) as HTMLElement;
  expect(group.className).toContain("max-w-sm");
  // RTL: pushed to the logical inline end, so it mirrors under a DirectionProvider.
  expect(group.className.split(/\s+/)).toContain("ms-auto");
  expect(group.className).not.toMatch(/(^|\s)ml-auto(\s|$)/);
  await expect
    .element(screen.getByRole("searchbox", { name: "Search" }))
    .toHaveAttribute("name", "query");
});

test("omits the search field when search is not provided", async () => {
  await render(
    <FilterBar
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
    />,
  );
  expect(document.querySelector('[data-slot="filter-bar-search"]')).toBeNull();
});

test("renders trailing content", async () => {
  const screen = await render(
    <FilterBar
      filters={[]}
      trailing={<button type="button">Clear all</button>}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Clear all" }))
    .toBeInTheDocument();
  // With no search to push it, the trailing slot takes the logical inline-end push itself.
  const trailing = document.querySelector(
    '[data-slot="filter-bar-trailing"]',
  ) as HTMLElement;
  expect(trailing.className.split(/\s+/)).toContain("ms-auto");
  expect(trailing.className).not.toMatch(/(^|\s)ml-auto(\s|$)/);
});

test("FilterChip computes a remove label from a string label", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <FilterChip label="Status" value="Open" onRemove={onRemove} />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Remove Status filter" }))
    .toBeInTheDocument();
  await screen.getByRole("button", { name: "Remove Status filter" }).click();
  expect(onRemove).toHaveBeenCalledOnce();
});

test("FilterBar forwards ref to the root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<FilterBar ref={ref} filters={[]} />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("filter-bar");
});

test("FilterChip forwards ref to the root element", async () => {
  // The root is the Chip primitive's <span>, not a <div>: a chip is an inline object that sits
  // in a wrapping row of chips, and Chip renders a span.
  const ref = React.createRef<HTMLSpanElement>();
  await render(
    <FilterChip ref={ref} label="Status" value="Open" onRemove={() => {}} />,
  );
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("filter-chip");
});

test("no a11y violations", async () => {
  const screen = await render(
    <FilterBar
      filters={[
        {
          id: "status",
          label: "Status",
          value: "In Progress",
          onRemove: () => {},
        },
      ]}
      addFilters={[{ id: "priority", label: "Priority" }]}
      onAddFilter={() => {}}
      search={{ value: "", onValueChange: () => {}, placeholder: "Search…" }}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inactive chip", async () => {
  const screen = await render(
    <FilterBar
      filters={[
        {
          id: "status",
          label: "Status",
          value: "In Progress",
          onRemove: () => {},
          active: false,
        },
      ]}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — add filter menu open", async () => {
  await render(
    <FilterBar
      filters={[]}
      addFilters={[
        { id: "priority", label: "Priority" },
        { id: "assignee", label: "Assignee" },
      ]}
      onAddFilter={() => {}}
    />,
  );
  await page.getByRole("button", { name: "Add filter" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The menu portals to document.body, so the audit target must cover the whole document.
  await expectNoA11yViolations(document.body);
});

test("active chip keeps the muted label / emphasized value hierarchy", async () => {
  // Regression: the active state used to paint BOTH label and value `text-foreground`,
  // erasing the label/value hierarchy inactive chips have. The label (and icon) stay
  // muted in both states; only the value carries the emphasis.
  const screen = await render(
    <FilterChip
      label="Status"
      value="In Progress"
      icon={<Flag aria-hidden />}
      active
      onRemove={() => {}}
    />,
  );
  const label = screen.getByText("Status").element() as HTMLElement;
  expect(label.className).toContain("text-muted-foreground");
  const icon = screen.container.querySelector('[data-slot="filter-chip"] svg')!
    .parentElement as HTMLElement;
  expect(icon.className).toContain("text-muted-foreground");
  const value = screen.getByText("In Progress").element() as HTMLElement;
  expect(value.className).not.toContain("text-muted-foreground");
  // The 500 weight comes from the chip's own `text-sm font-medium`, not from a second
  // `font-medium` on the value: the hierarchy is carried by INK — muted key, foreground value —
  // so restating the weight here would flatten exactly what the muted key is for.
  expect(value.className).not.toContain("font-medium");
  const chip = value.closest('[data-slot="filter-chip"]') as HTMLElement;
  expect(chip.className).toContain("text-sm font-medium");
});

test("chip value truncates within max-w-xs — the value span carries min-w-0 alongside its shrink-0 label sibling", async () => {
  // Regression for audit 12 §b3: a flex child with `truncate` but no `min-w-0` keeps its
  // content-based intrinsic min-width, so a long value pushes the chip past its own `max-w-xs`
  // cap instead of truncating inside it. `min-w-0` lets it actually shrink to the cap.
  const screen = await render(
    <FilterChip
      label="Status"
      value="A very long filter value that should truncate instead of overflowing the chip"
      onRemove={() => {}}
    />,
  );
  const valueEl = screen.getByText(
    "A very long filter value that should truncate instead of overflowing the chip",
  );
  expect((valueEl.element() as HTMLElement).className).toContain("min-w-0");
  expect((valueEl.element() as HTMLElement).className).toContain("truncate");
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target remediation (WCAG 2.5.8) — effective hit-area measurement (the chip's remove `×`).
 *
 * Unlike checkbox/radio/slider/switch, this target does NOT use a `::before` pseudo-element — see
 * the comment on `ChipRemove` in chip.tsx: native `<button>` elements clip overflowing generated
 * content to their own border box once nested a couple of levels deep (a genuine Chromium
 * behavior, verified by hand — identical CSS on a `<span>` at the same depth is NOT clipped), so a
 * pseudo would compute correctly via getComputedStyle but never actually be hit-testable. The
 * shared `ChipRemove` is instead a real 24x24 `Button size="icon-xs"`. That means this suite doesn't
 * need the getComputedStyle(el, '::before') trick at all — the real box IS the hit area, so a plain
 * mirror of `width`/`height` is enough for a REAL getBoundingClientRect() + elementFromPoint()
 * measurement (this harness runs without compiled Tailwind, same as every other file in this
 * remediation, so `h-6` still needs a literal mirror to resolve to real CSS here).
 * ------------------------------------------------------------------------------------------- */

function injectFilterChipRemoveHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="filter-chip"] { display: inline-flex; align-items: center; }
    [data-slot="chip-remove"] { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; width: 24px; height: 24px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("the shared remove control's real border-box is >= 24x24", async () => {
  const cleanup = injectFilterChipRemoveHitAreaMirror();
  try {
    const screen = await render(
      <FilterChip label="Status" value="Open" onRemove={() => {}} />,
    );
    const el = screen
      .getByRole("button", { name: "Remove Status filter" })
      .element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(24);
    expect(rect.height).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a point 1px inside the real 24px box still hits and fires onRemove", async () => {
  const cleanup = injectFilterChipRemoveHitAreaMirror();
  try {
    const onRemove = vi.fn();
    const screen = await render(
      <FilterChip label="Status" value="Open" onRemove={onRemove} />,
    );
    const el = screen
      .getByRole("button", { name: "Remove Status filter" })
      .element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 1px inside the top-left corner of the real 24px box.
    const x = rect.left + 1;
    const y = rect.top + 1;
    const hit = document.elementFromPoint(x, y);
    expect(hit).toBe(el);
    (hit as HTMLElement).click();
    expect(onRemove).toHaveBeenCalledOnce();
  } finally {
    cleanup();
  }
});

// The bar never overflows its container. At 320px the search wraps onto its own row and fills it,
// and the SearchInput's clear-button addon used to end ~4px outside the group (upstream's
// inline-end `me-[-0.3rem]`), so the bar's scrollWidth ran 4px past its box. Measured on the
// compiled CSS: every descendant stays inside the container at every narrow width.
test.each([160, 200, 254, 288, 320])(
  "the bar and its search stay inside a %dpx container (Search)",
  async (width) => {
    const sheet = document.createElement("style");
    sheet.textContent = geometryCss;
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const screen = await render(
      <div style={{ width }} data-testid="box">
        <FilterBar
          filters={[
            { id: "label", label: "Label", value: "bug", onRemove: () => {} },
          ]}
          addFilters={[{ id: "priority", label: "Priority" }]}
          search={{ value: "Regent", onValueChange: () => {} }}
        />
      </div>,
    );
    const box = screen.container
      .querySelector('[data-testid="box"]')!
      .getBoundingClientRect();
    const bar = screen.container.querySelector<HTMLElement>(
      '[data-slot="filter-bar"]',
    )!;
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
    for (const element of bar.querySelectorAll("*")) {
      const rect = element.getBoundingClientRect();
      expect(
        rect.right,
        `${element.getAttribute("data-slot") ?? element.tagName} ends past the container`,
      ).toBeLessThanOrEqual(box.right + 0.5);
    }
  },
);

test("a chip reads label: value, with the colon (DS-36)", async () => {
  const screen = await render(
    <FilterBar
      filters={[
        {
          id: "status",
          label: "Status",
          value: "In Progress",
          onRemove: () => {},
        },
        { id: "archived", label: "Archived", onRemove: () => {} },
      ]}
    />,
  );
  const chips = screen.container.querySelectorAll('[data-slot="filter-chip"]');
  expect(chips[0]!.textContent).toContain("Status: In Progress");
  // A presence chip has no value, so no colon.
  expect(chips[1]!.textContent).not.toContain(":");
  await expectNoA11yViolations(screen.container);
});

test("searchPlacement start puts the search first, without the end push (DS-37)", async () => {
  const screen = await render(
    <FilterBar
      searchPlacement="start"
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
      search={{ value: "", onValueChange: () => {} }}
      trailing={<button type="button">Clear all</button>}
    />,
  );
  const bar = screen.container.querySelector('[data-slot="filter-bar"]')!;
  const first = bar.firstElementChild as HTMLElement;
  expect(first.getAttribute("data-slot")).toBe("filter-bar-search");
  expect(first.className.split(/\s+/)).not.toContain("ms-auto");
  const trailing = bar.querySelector(
    '[data-slot="filter-bar-trailing"]',
  ) as HTMLElement;
  expect(trailing.className.split(/\s+/)).toContain("ms-auto");
  await expectNoA11yViolations(screen.container);
});

test("search.onValueCommitted receives the settled query (DS-37)", async () => {
  vi.useFakeTimers();
  try {
    const committed = vi.fn();
    function Host() {
      const [value, setValue] = React.useState("");
      return (
        <FilterBar
          filters={[]}
          search={{
            value,
            onValueChange: setValue,
            onValueCommitted: committed,
            debounceMs: 200,
          }}
        />
      );
    }
    const screen = await render(<Host />);
    await screen.getByRole("searchbox", { name: "Search" }).fill("acme");
    expect(committed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(committed).toHaveBeenCalledWith("acme");
  } finally {
    vi.useRealTimers();
  }
});

test("FilterBar takes no children (D5)", () => {
  const accept = (_props: FilterBarProps) => {};
  // @ts-expect-error children were silently dropped; the type now says so.
  accept({ children: "ignored" });
});

// ---- DS-35: facets ---------------------------------------------------------------------------

interface Status {
  id: string;
  name: string;
}
const STATUSES: Status[] = [
  { id: "open", name: "Open" },
  { id: "prog", name: "In progress" },
  { id: "done", name: "Done" },
];

test.each([
  [[], "Status: Any"],
  [[STATUSES[0]!], "Status: Open"],
  [[STATUSES[0]!, STATUSES[1]!], "Status: Open, In progress"],
  [STATUSES, "Status: 3 selected"],
])("a facet trigger reads the selection (DS-35) %#", async (value, text) => {
  const screen = await render(
    <FilterBarFacet<Status, true>
      label="Status"
      multiple
      items={STATUSES}
      value={value}
      onValueChange={() => {}}
      itemToKey={(s) => s.id}
      itemToStringLabel={(s) => s.name}
      searchLabel="Search statuses"
    />,
  );
  await expect
    .element(screen.getByRole("combobox", { name: text }))
    .toHaveTextContent(text);
});

test("a facet toggles values, pins the selected ones and can be removed (DS-35)", async () => {
  const onRemove = vi.fn();
  function Host() {
    const [value, setValue] = React.useState<Status[]>([STATUSES[2]!]);
    return (
      <FilterBarFacet<Status, true>
        label="Status"
        multiple
        pinSelected
        removable
        onRemove={onRemove}
        items={STATUSES}
        value={value}
        onValueChange={setValue}
        itemToKey={(s) => s.id}
        itemToStringLabel={(s) => s.name}
        isItemEqualToValue={(a, b) => a.id === b.id}
        searchLabel="Search statuses"
      />
    );
  }
  const screen = await render(<Host />);
  await screen.getByRole("combobox", { name: "Status: Done" }).click();
  const options = [...document.querySelectorAll('[role="option"]')].map(
    (o) => o.textContent,
  );
  expect(options[0]).toBe("Done");
  await expect
    .element(screen.getByRole("group", { name: "Selected" }))
    .toBeInTheDocument();
  await screen.getByRole("option", { name: "Open" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Open" }))
    .toHaveAttribute("aria-selected", "true");
  await userEvent.keyboard("{Escape}");
  (
    screen
      .getByRole("button", { name: "Remove Status filter" })
      .element() as HTMLElement
  ).click();
  expect(onRemove).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

// ---- DS-36: editing a filter -----------------------------------------------------------------

test("a chip with an editor opens it in place and returns focus on Escape (DS-36)", async () => {
  const onEditorOpenChange = vi.fn();
  const screen = await render(
    <FilterBar
      onEditorOpenChange={onEditorOpenChange}
      filters={[
        {
          id: "status",
          label: "Status",
          value: "Open",
          onRemove: () => {},
          editor: <p>Status editor</p>,
        },
      ]}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Status: Open" });
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "filter-chip-trigger");
  // The remove control stays its own target.
  await expect
    .element(screen.getByRole("button", { name: "Remove Status filter" }))
    .toBeInTheDocument();
  await trigger.click();
  await expect.element(screen.getByText("Status editor")).toBeInTheDocument();
  expect(onEditorOpenChange).toHaveBeenLastCalledWith("status", true);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(trigger.element());
  expect(onEditorOpenChange).toHaveBeenLastCalledWith("status", false);
  await expectNoA11yViolations(screen.container);
});

test("a chip without an editor stays non-interactive (DS-36)", async () => {
  const screen = await render(
    <FilterBar
      filters={[
        { id: "status", label: "Status", value: "Open", onRemove: () => {} },
      ]}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="filter-chip-trigger"]'),
  ).toBeNull();
});
