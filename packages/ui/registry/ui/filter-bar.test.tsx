import * as React from "react";
// The compiled lane stylesheet as a STRING, mounted only for the containment test below: every
// other test here measures against its own style mirror and must not see real CSS.
import geometryCss from "../../test/geometry.css?inline";
import { render } from "vitest-browser-react";
import { beforeEach, expect, onTestFinished, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Flag } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  FilterBar,
  FilterBarFacet,
  FilterChip,
  type FilterBarFilter,
  type FilterBarProps,
} from "./filter-bar";

// The filter row is hidden until the Filters toggle opens it; most tests here open it up front
// (`defaultFiltersOpen`). Test at a desktop width unless a test sizes its own box.
beforeEach(async () => {
  await page.viewport(1280, 800);
});

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
      defaultFiltersOpen
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
      defaultFiltersOpen
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
    />,
  );
  await expect
    .element(screen.getByRole("toolbar", { name: "List controls" }))
    .toHaveAttribute("data-slot", "filter-bar");
  await expect
    .element(screen.getByRole("group", { name: "Filters" }))
    .toHaveAttribute("data-slot", "filter-bar-filters");
  expect(document.querySelector('[data-filter-id="status"]')).not.toBeNull();
});

test("allows the filter group label to be customized", async () => {
  const screen = await render(
    <FilterBar filters={[]} aria-label="Issue filters" />,
  );
  await expect
    .element(screen.getByRole("toolbar", { name: "Issue filters" }))
    .toHaveAttribute("data-slot", "filter-bar");
});

test("removing a chip fires its onRemove", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
      filters={[{ id: "status", label: "Status", value: "Open", onRemove }]}
    />,
  );
  await screen.getByRole("button", { name: "Clear Status" }).click();
  expect(onRemove).toHaveBeenCalledOnce();
});

test("add-filter opens the menu and fires onAddFilter with the option id", async () => {
  const onAddFilter = vi.fn();
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
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

  await screen.getByRole("button", { name: "More" }).click();

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
      defaultFiltersOpen
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
      defaultFiltersOpen
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
      defaultFiltersOpen
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
      defaultFiltersOpen
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
        defaultFiltersOpen
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
      defaultFiltersOpen
      filters={[]}
      search={{ value: "regent", onValueChange: () => {} }}
      searchInputProps={{ className: "max-w-sm", name: "query" }}
    />,
  );
  const group = document.querySelector(
    '[data-slot="filter-bar-search"]',
  ) as HTMLElement;
  expect(group.className).toContain("max-w-sm");
  // The search leads the first row at ~320px (its own full-width row on a phone).
  expect(group.className.split(/\s+/)).toContain("@lg/filter-bar:w-80");
  expect(group.className.split(/\s+/)).not.toContain("ms-auto");
  await expect
    .element(screen.getByRole("searchbox", { name: "Search" }))
    .toHaveAttribute("name", "query");
});

test("omits the search field when search is not provided", async () => {
  await render(
    <FilterBar
      defaultFiltersOpen
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
    />,
  );
  expect(document.querySelector('[data-slot="filter-bar-search"]')).toBeNull();
});

test("renders trailing content", async () => {
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
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
    .element(screen.getByRole("button", { name: "Clear Status" }))
    .toBeInTheDocument();
  await screen.getByRole("button", { name: "Clear Status" }).click();
  expect(onRemove).toHaveBeenCalledOnce();
});

test("FilterBar forwards ref to the root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<FilterBar ref={ref} defaultFiltersOpen filters={[]} />);
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
      defaultFiltersOpen
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
      defaultFiltersOpen
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
      defaultFiltersOpen
      filters={[]}
      addFilters={[
        { id: "priority", label: "Priority" },
        { id: "assignee", label: "Assignee" },
      ]}
      onAddFilter={() => {}}
    />,
  );
  await page.getByRole("button", { name: "More" }).click();
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
  // The hierarchy is carried by INK — muted key, foreground value — on the compact chip's quiet
  // regular weight.
  expect(value.className).not.toContain("font-medium");
  const chip = value.closest('[data-slot="filter-chip"]') as HTMLElement;
  expect(chip.className).toContain("text-sm font-normal");
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
      .getByRole("button", { name: "Clear Status" })
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
      .getByRole("button", { name: "Clear Status" })
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
          defaultFiltersOpen
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
    // The filter row scrolls sideways on a narrow bar, so its chips may run past the edge inside
    // their own scroll box; the row itself must not.
    for (const element of bar.querySelectorAll(
      "*:not([data-slot=filter-bar-filters] *)",
    )) {
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
      defaultFiltersOpen
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

test("the search leads the first row; trailing and Clear end the filter row", async () => {
  const onClear = vi.fn();
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
      searchPlacement="end"
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
      search={{ value: "", onValueChange: () => {} }}
      trailing={<button type="button">Save view</button>}
      onClear={onClear}
    />,
  );
  const bar = screen.container.querySelector('[data-slot="filter-bar"]')!;
  const primary = bar.querySelector('[data-slot="filter-bar-primary"]')!;
  // `searchPlacement` is deprecated and ignored: the search is always first.
  expect(primary.firstElementChild!.getAttribute("data-slot")).toBe(
    "filter-bar-search",
  );
  const trailing = bar.querySelector(
    '[data-slot="filter-bar-trailing"]',
  ) as HTMLElement;
  expect(trailing.className.split(/\s+/)).toContain("ms-auto");
  await screen.getByRole("button", { name: "Clear", exact: true }).click();
  expect(onClear).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("Clear shows only while a filter is applied", async () => {
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
      facets={
        <FilterBarFacet<Status>
          label="Owner"
          items={STATUSES}
          value={null}
          onValueChange={() => {}}
          itemToKey={(s) => s.id}
          itemToStringLabel={(s) => s.name}
        />
      }
      onClear={() => {}}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="filter-bar-clear"]'),
  ).toBeNull();
  await screen.rerender(
    <FilterBar
      defaultFiltersOpen
      facets={
        <FilterBarFacet<Status>
          label="Owner"
          items={STATUSES}
          value={STATUSES[0]!}
          onValueChange={() => {}}
          itemToKey={(s) => s.id}
          itemToStringLabel={(s) => s.name}
        />
      }
      onClear={() => {}}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Clear", exact: true }))
    .toBeInTheDocument();
});

test("scope sits beside the search and view is pinned to the end", async () => {
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
      search={{ value: "", onValueChange: () => {} }}
      scope={<button type="button">My tasks</button>}
      view={<button type="button">List</button>}
      actions={<button type="button">Select</button>}
    />,
  );
  const primary = screen.container.querySelector(
    '[data-slot="filter-bar-primary"]',
  )!;
  expect(
    [...primary.children].map((el) => el.getAttribute("data-slot")),
  ).toEqual(["filter-bar-search", "filter-bar-controls"]);
  const controls = primary.querySelector('[data-slot="filter-bar-controls"]')!;
  // [Filters toggle] [scope] [actions] [view] — the view furthest right.
  expect(
    [...controls.children].map((el) => el.getAttribute("data-slot")),
  ).toEqual(["filter-bar-scope", "filter-bar-actions", "filter-bar-view"]);
  const view = primary.querySelector('[data-slot="filter-bar-view"]')!;
  expect(view.className.split(/\s+/)).toContain("ms-auto");
  // No filters: no filter row.
  expect(
    screen.container.querySelector('[data-slot="filter-bar-filters"]'),
  ).toBeNull();
});

test("the filter row stays hidden until the toggle opens it; the icon-only toggle keeps the count", async () => {
  const onClear = vi.fn();
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const screen = await render(
    <div style={{ width: 360 }}>
      <FilterBar
        search={{ value: "", onValueChange: () => {} }}
        view={<button type="button">List</button>}
        filters={[
          { id: "status", label: "Status", value: "Open", onRemove: () => {} },
        ]}
        onClear={onClear}
      />
    </div>,
  );
  const toggle = screen.getByRole("button", { name: "Filters (1)" });
  // A filter is set, but the row never opens by itself.
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  const row = screen.container.querySelector<HTMLElement>(
    '[data-slot="filter-bar-filters"]',
  )!;
  expect(row.checkVisibility()).toBe(false);
  // Narrow bar: the toggle is icon-only, with the count as a badge.
  await expect
    .element(
      screen.getByRole("button", { name: "Filters (1)" }).getByText("Filters"),
    )
    .not.toBeVisible();
  await expect
    .element(
      toggle
        .element()
        .querySelector<HTMLElement>('[data-slot="filter-bar-filters-count"]')!,
    )
    .toHaveTextContent("1");
  // Phone width: the search takes the full row; the toggle and the view share the next one.
  const search = screen.container.querySelector(
    '[data-slot="filter-bar-search"]',
  )!;
  const view = screen.container.querySelector('[data-slot="filter-bar-view"]')!;
  expect(search.getBoundingClientRect().width).toBeGreaterThan(300);
  expect(toggle.element().getBoundingClientRect().top).toBeGreaterThan(
    search.getBoundingClientRect().bottom - 1,
  );
  expect(
    Math.abs(
      view.getBoundingClientRect().top -
        toggle.element().getBoundingClientRect().top,
    ),
  ).toBeLessThan(8);
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  expect(onClear).toHaveBeenCalledOnce();
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
});

test("autoOpenFilters opts back in to opening the row when a filter becomes set", async () => {
  const filter: FilterBarFilter = {
    id: "status",
    label: "Status",
    value: "Open",
    onRemove: () => {},
  };
  const screen = await render(<FilterBar autoOpenFilters filters={[]} />);
  await screen.rerender(<FilterBar autoOpenFilters filters={[filter]} />);
  await expect
    .element(screen.getByRole("button", { name: "Filters (1)" }))
    .toHaveAttribute("aria-expanded", "true");
});

test("filtersOpenStorageKey remembers the toggle for the session", async () => {
  const key = "filter-bar-test:open";
  window.sessionStorage.removeItem(key);
  onTestFinished(() => window.sessionStorage.removeItem(key));
  const bar = (
    <FilterBar
      filtersOpenStorageKey={key}
      filters={[{ id: "status", label: "Status", onRemove: () => {} }]}
    />
  );
  const first = await render(bar);
  await first.getByRole("button", { name: "Filters (1)" }).click();
  expect(window.sessionStorage.getItem(key)).toBe("1");
  await first.unmount();
  const second = await render(bar);
  await expect
    .element(second.getByRole("button", { name: "Filters (1)" }))
    .toHaveAttribute("aria-expanded", "true");
});

test("search.onValueCommitted receives the settled query (DS-37)", async () => {
  vi.useFakeTimers();
  try {
    const committed = vi.fn();
    function Host() {
      const [value, setValue] = React.useState("");
      return (
        <FilterBar
          defaultFiltersOpen
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
  [[], "Status"],
  [[STATUSES[0]!], "Status: Open"],
  [[STATUSES[0]!, STATUSES[1]!], "Status: 2"],
  [STATUSES, "Status: 3"],
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
  // Toggling does not move rows under the pointer; the split is re-taken on the next open.
  expect(
    [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent),
  ).toEqual(options);
  await userEvent.keyboard("{Escape}");
  // A set, removable facet: its × clears the value and removes the facet.
  await screen.getByRole("button", { name: "Clear Status" }).click();
  expect(onRemove).toHaveBeenCalledOnce();
  await expect
    .element(screen.getByRole("combobox", { name: "Status" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

// ---- DS-36: editing a filter -----------------------------------------------------------------

test("a chip with an editor opens it in place and returns focus on Escape (DS-36)", async () => {
  const onEditorOpenChange = vi.fn();
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
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
    .element(screen.getByRole("button", { name: "Clear Status" }))
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
      defaultFiltersOpen
      filters={[
        { id: "status", label: "Status", value: "Open", onRemove: () => {} },
      ]}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="filter-chip-trigger"]'),
  ).toBeNull();
});

test("facets sit on the filter row before the chips (DS-35)", async () => {
  const screen = await render(
    <FilterBar
      defaultFiltersOpen
      search={{ value: "", onValueChange: () => {}, "aria-label": "Search" }}
      facets={
        <FilterBarFacet<Status>
          label="Owner"
          items={STATUSES}
          value={null}
          onValueChange={() => {}}
          itemToKey={(s) => s.id}
          itemToStringLabel={(s) => s.name}
          searchLabel="Search owners"
        />
      }
      filters={[
        { id: "status", label: "Status", value: "Open", onRemove: () => {} },
      ]}
    />,
  );
  const bar = screen.container.querySelector('[data-slot="filter-bar"]')!;
  expect(
    bar
      .querySelector('[data-slot="filter-bar-primary"]')!
      .firstElementChild!.getAttribute("data-slot"),
  ).toBe("filter-bar-search");
  const row = bar.querySelector('[data-slot="filter-bar-filters"]')!;
  expect(
    [
      ...row.querySelectorAll(
        '[data-slot="filter-bar-facet"], [data-slot="filter-chip"]',
      ),
    ].map((el) => el.getAttribute("data-slot")),
  ).toEqual(["filter-bar-facet", "filter-chip"]);
});

test("a leading item outside the selection keeps the pinned group first (DS-35)", async () => {
  const screen = await render(
    <FilterBarFacet<Status, true>
      label="Status"
      multiple
      pinSelected
      leadingItems={[STATUSES[0]!]}
      items={STATUSES}
      value={[STATUSES[2]!]}
      onValueChange={() => {}}
      itemToKey={(s) => s.id}
      itemToStringLabel={(s) => s.name}
      searchLabel="Search statuses"
    />,
  );
  await screen.getByRole("combobox").click();
  await expect
    .poll(() =>
      [...document.querySelectorAll('[role="group"][aria-labelledby]')].map(
        (g) =>
          document.getElementById(g.getAttribute("aria-labelledby")!)
            ?.textContent,
      ),
    )
    .toEqual(["Selected", "More"]);
});

test("an add option with an editor opens it on the new chip (DS-36)", async () => {
  function Host() {
    const [filters, setFilters] = React.useState<FilterBarFilter[]>([]);
    return (
      <FilterBar
        defaultFiltersOpen
        filters={filters}
        addFilters={[
          { id: "status", label: "Status", editor: <p>Status editor</p> },
        ]}
        onAddFilter={(id) =>
          setFilters([
            {
              id,
              label: "Status",
              value: "Open",
              onRemove: () => setFilters([]),
            },
          ])
        }
      />
    );
  }
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "More" }).click();
  await screen.getByRole("menuitem", { name: "Status" }).click();
  await expect.element(screen.getByText("Status editor")).toBeVisible();
  const trigger = screen.getByRole("button", { name: "Status: Open" });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await userEvent.keyboard("{Escape}");
  await expect
    .element(screen.getByText("Status editor"))
    .not.toBeInTheDocument();
});
