import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
// The compiled lane stylesheet, mounted only for the truncation test: the rest run without CSS.
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { DropdownMenuItem } from "./dropdown-menu";
import { ViewTabs, type ViewTabsView } from "./view-tabs";

// The tabs collapse to a select by MEASURING the tab row against the room it has, which needs real
// layout: every test here mounts the compiled lane stylesheet.
const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

const VIEWS: ViewTabsView[] = [
  { id: "mine", name: "My follow-ups", kind: "grid", scope: "personal" },
  { id: "all", name: "All requests", kind: "grid", scope: "shared" },
  { id: "board", name: "By status", kind: "board", scope: "locked" },
];

/** Give the root a width (container queries need a real box; the harness has no CSS). */
function Harness(
  props: Partial<React.ComponentProps<typeof ViewTabs>> & { width?: number },
) {
  const [value, setValue] = React.useState("all");
  return (
    <div style={{ width: props.width ?? 900 }}>
      <ViewTabs
        views={VIEWS}
        value={value}
        onValueChange={setValue}
        {...props}
      />
    </div>
  );
}

test("shared views first, then Mine; a lock on the locked view; arrows rove the tabs", async () => {
  const screen = await render(<Harness />);
  const tabs = [
    ...document.querySelectorAll<HTMLElement>('[data-slot="view-tabs-tab"]'),
  ];
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    "All requests",
    "By status, locked",
    "My follow-ups",
  ]);
  expect(tabs[1]!.querySelector('[data-slot="view-tabs-lock"]')).not.toBeNull();
  expect(
    document.querySelector('[data-slot="view-tabs-divider"]'),
  ).not.toBeNull();
  tabs[0]!.focus();
  await userEvent.keyboard("{ArrowRight}{Enter}");
  await expect.poll(() => tabs[1]!.getAttribute("aria-selected")).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("the + menu offers a grid or a board, and reports only the kind", async () => {
  const onCreate = vi.fn();
  const screen = await render(<Harness onCreate={onCreate} />);
  await screen.getByRole("button", { name: "New view" }).click();
  await expectNoA11yViolations(document.body);
  const items = screen.getByRole("menuitem");
  await expect.poll(() => items.elements().length).toBe(2);
  expect(items.elements().map((item) => item.textContent?.trim())).toEqual([
    "Grid view",
    "Board view",
  ]);
  await items.nth(1).click();
  expect(onCreate).toHaveBeenCalledWith("board");
});

test("the open view's actions sit in a ⋯ menu named for it", async () => {
  const onRename = vi.fn();
  const screen = await render(
    <Harness
      getViewActions={(view) => (
        <DropdownMenuItem onClick={() => onRename(view.id)}>
          Rename
        </DropdownMenuItem>
      )}
    />,
  );
  await screen.getByRole("button", { name: "All requests options" }).click();
  await screen.getByRole("menuitem", { name: "Rename" }).click();
  expect(onRename).toHaveBeenCalledWith("all");
});

test("the narrow row is one select with the same groups", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <div style={{ width: 320 }}>
      <ViewTabs views={VIEWS} value="all" onValueChange={onValueChange} />
    </div>,
  );
  const select = screen.getByRole("combobox", { name: "Views" });
  await select.click();
  await expectNoA11yViolations(document.body);
  await screen.getByRole("option", { name: "My follow-ups" }).click();
  expect(onValueChange).toHaveBeenCalledWith("mine");
});

test("a cut view name shows in full in a tooltip, and the tab and the select read the whole name", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const long =
    "Every open request from the regional operations team awaiting a supplier quote this quarter";
  const views: ViewTabsView[] = [
    { id: "long", name: long, kind: "grid", scope: "locked" },
    { id: "all", name: "All requests", kind: "grid", scope: "shared" },
  ];
  const screen = await render(
    <div style={{ width: 900 }}>
      <ViewTabs views={views} value="long" onValueChange={() => {}} />
    </div>,
  );
  // The accessible name is the whole name (CSS truncation never shortens it), then "locked".
  const tab = screen.getByRole("tab").first();
  await expect
    .element(tab)
    .toHaveAccessibleName(new RegExp(`^${long}\\s*, locked$`));
  await expect.element(tab).toHaveAttribute("data-truncated", "");
  // A name that fits gets no tooltip.
  await expect
    .element(screen.getByRole("tab", { name: "All requests" }))
    .not.toHaveAttribute("data-truncated");
  // Base UI's tooltip popup has no role (visual-only, upstream); find it by slot.
  const tooltip = () =>
    document.querySelector('[data-slot="tooltip-content"]')?.textContent;
  await userEvent.hover(tab);
  await expect.poll(tooltip).toBe(long);
  await expectNoA11yViolations(document.body);
  await userEvent.unhover(tab);

  // Narrow: the trigger cuts the name too, and the list wraps it in full.
  await screen.rerender(
    <div style={{ width: 320 }}>
      <ViewTabs views={views} value="long" onValueChange={() => {}} />
    </div>,
  );
  const trigger = screen.getByRole("combobox", { name: "Views" });
  await expect.element(trigger).toHaveAttribute("data-truncated", "");
  expect(
    trigger.element().querySelector("[data-slot=select-value]")?.textContent,
  ).toBe(long);
  await userEvent.hover(trigger);
  await expect.poll(tooltip).toBe(long);
  await trigger.click();
  await expect
    .element(screen.getByRole("option").first())
    .toHaveAccessibleName(new RegExp(`^${long}\\s*, locked$`));
  // The list wraps the whole name inside the popup instead of running past it.
  const option = screen.getByRole("option").first().element();
  const popup = option.closest<HTMLElement>('[data-slot="select-content"]')!;
  expect(option.scrollWidth).toBeLessThanOrEqual(popup.clientWidth);
  const name = option.querySelector<HTMLElement>(
    '[data-slot="view-tabs-name"]',
  )!;
  expect(name.offsetHeight).toBeGreaterThan(
    parseFloat(getComputedStyle(name).lineHeight) * 1.5,
  );
  await expectNoA11yViolations(document.body);
});

test("tabs stay inline while they fit and collapse to the select only when they don't — and come back", async () => {
  function Sized() {
    const [width, setWidth] = React.useState(420);
    const [value, setValue] = React.useState("g");
    return (
      <>
        <button
          type="button"
          onClick={() => setWidth((w) => (w === 420 ? 120 : 420))}
        >
          Resize
        </button>
        <div style={{ width }}>
          <ViewTabs
            views={[
              { id: "g", name: "Grid", kind: "grid", scope: "shared" },
              { id: "b", name: "Board", kind: "board", scope: "shared" },
            ]}
            value={value}
            onValueChange={setValue}
            onCreate={() => {}}
          />
        </div>
      </>
    );
  }
  const screen = await render(<Sized />);
  const root = () =>
    screen.container.querySelector<HTMLElement>('[data-slot="view-tabs"]')!;
  await vi.waitFor(() =>
    expect(root().hasAttribute("data-narrow")).toBe(false),
  );
  expect(screen.container.querySelector('[role="combobox"]')).toBeNull();
  await screen.getByRole("button", { name: "Resize" }).click();
  await vi.waitFor(() => expect(root().hasAttribute("data-narrow")).toBe(true));
  // Collapsed: the tab row stays mounted (to be measured) but is hidden and inert.
  const tabs = root().querySelector('[role="tablist"]')!.closest("[inert]");
  expect(tabs).not.toBeNull();
  await screen.getByRole("button", { name: "Resize" }).click();
  await vi.waitFor(() =>
    expect(root().hasAttribute("data-narrow")).toBe(false),
  );
});
