import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DropdownMenuItem } from "./dropdown-menu";
import { ViewTabs, type ViewTabsView } from "./view-tabs";

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

test("the + menu creates a grid or board, shared or personal; shared choices can be withheld", async () => {
  const onCreate = vi.fn();
  const screen = await render(<Harness onCreate={onCreate} />);
  await screen.getByRole("button", { name: "New view" }).click();
  await expectNoA11yViolations(document.body);
  const items = screen.getByRole("menuitem");
  await expect.poll(() => items.elements().length).toBe(4);
  await items.nth(1).click();
  expect(onCreate).toHaveBeenCalledWith("board", "shared");
  await screen.rerender(
    <Harness onCreate={onCreate} canCreateShared={false} />,
  );
  await screen.getByRole("button", { name: "New view" }).click();
  await expect
    .poll(() => screen.getByRole("menuitem").elements().length)
    .toBe(2);
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
