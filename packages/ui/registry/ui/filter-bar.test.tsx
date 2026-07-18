import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { Flag } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { FilterBar, FilterChip } from "./filter-bar";

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
  expect(onValueChange).toHaveBeenCalled();
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
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <FilterChip ref={ref} label="Status" value="Open" onRemove={() => {}} />,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
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
  const icon = label.previousElementSibling as HTMLElement;
  expect(icon.className).toContain("text-muted-foreground");
  const value = screen.getByText("In Progress").element() as HTMLElement;
  expect(value.className).not.toContain("text-muted-foreground");
  expect(value.className).toContain("font-medium");
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
 * Touch-target remediation (WCAG 2.5.8) — effective hit-area measurement (FilterChip remove `×`).
 *
 * Unlike checkbox/radio/slider/switch, this target does NOT use a `::before` pseudo-element — see
 * the comment on the button's className in filter-bar.tsx: native `<button>` elements clip
 * overflowing generated content to their own border box once nested a couple of levels deep (a
 * genuine Chromium behavior, verified by hand — identical CSS on a `<span>` at the same depth is
 * NOT clipped), so a pseudo would compute correctly via getComputedStyle but never actually be
 * hit-testable. Instead the button's REAL border-box grows from size-5 (20px) to size-6 (24px),
 * with compensating margins keeping its visual footprint and the × glyph's centered position
 * byte-for-byte unchanged. That means this suite doesn't need the getComputedStyle(el, '::before')
 * trick at all — the real box IS the hit area, so a plain mirror of `width`/`height`/margins is
 * enough for a REAL getBoundingClientRect() + elementFromPoint() measurement (this harness runs
 * without compiled Tailwind, same as every other file in this remediation, so `size-6` etc. still
 * need a literal mirror to resolve to real CSS here).
 * ------------------------------------------------------------------------------------------- */

function injectFilterChipRemoveHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="filter-chip"] { display: inline-flex; align-items: center; }
    [data-slot="filter-chip-remove"] { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; width: 24px; height: 24px; margin-right: -4px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("remove button's real border-box (grown from 20px to 24px) is >= 24x24", async () => {
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

test("a point 1px inside the grown box on every edge — beyond where the old 20px box ended — still hits and fires onRemove", async () => {
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
    // 1px inside the top-left corner of the real 24px box — 3px further in than the old 20px
    // box's edge would have reached (old box was inset 2px on every side within this same box).
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
