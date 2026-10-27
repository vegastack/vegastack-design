import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LayoutGrid, Plus } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { SidebarMenuFlyout } from "./sidebar-menu-flyout";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarProvider,
} from "./sidebar";
import { DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";

/* The harness viewport is phone-sized, so `useIsMobile` is mocked to a desktop by default (the
   same pattern as sidebar.test.tsx); `mobile` flips it for the drawer case. */
let mobile = false;
beforeEach(() => {
  mobile = false;
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: mobile && query === "(max-width: 767px)",
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});
afterEach(() => {
  vi.restoreAllMocks();
});

function Rail({
  open = false,
  railOnly = false,
  badge,
}: {
  open?: boolean;
  railOnly?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={open}>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuFlyout
                label="Spaces"
                icon={<LayoutGrid />}
                railOnly={railOnly}
                badge={badge}
                badgeLabel={badge ? `${badge} new` : undefined}
              >
                <DropdownMenuItem render={<a href="/spaces/general" />}>
                  General
                </DropdownMenuItem>
                <DropdownMenuItem render={<a href="/spaces/product" />}>
                  Product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<a href="/spaces/new" />}>
                  <Plus />
                  New space
                </DropdownMenuItem>
              </SidebarMenuFlyout>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

test("renders a sidebar row that opens a menu beside it, headed by its label", async () => {
  const screen = await render(<Rail />);
  const item = screen.container.querySelector<HTMLElement>(
    '[data-slot="sidebar-menu-flyout"]',
  )!;
  expect(item.tagName).toBe("LI");
  expect(item.getAttribute("data-sidebar")).toBe("menu-item");
  const trigger = screen.getByRole("button", { name: "Spaces" });
  await expect.element(trigger).toHaveAttribute("aria-haspopup", "menu");
  await expectNoA11yViolations(screen.container);
  await trigger.click();
  const menu = screen.getByRole("menu");
  await expect.element(menu).toBeInTheDocument();
  await expect
    .element(menu)
    .toHaveAttribute("data-slot", "sidebar-menu-flyout-content");
  await expect
    .element(screen.getByText("Spaces", { exact: true }).last())
    .toHaveAttribute("data-slot", "sidebar-menu-flyout-label");
  await expect
    .element(screen.getByRole("menuitem", { name: "General" }))
    .toHaveAttribute("href", "/spaces/general");
  await expectNoA11yViolations(document.body);
});

test("Escape closes the flyout and returns focus to the row", async () => {
  const screen = await render(<Rail />);
  const trigger = screen.getByRole("button", { name: "Spaces" });
  (trigger.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByRole("menu")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(trigger.element());
});

test("railOnly shows the row in the collapsed rail alone", async () => {
  const screen = await render(<Rail railOnly />);
  const item = screen.container.querySelector<HTMLElement>(
    '[data-slot="sidebar-menu-flyout"]',
  )!;
  expect(item.hasAttribute("data-rail-only")).toBe(true);
  expect(item.className).toContain("hidden");
  expect(item.className).toContain("group-data-[collapsible=icon]:block");
});

test("a count joins the row's name and shows in the rail", async () => {
  const screen = await render(<Rail badge={3} />);
  await expect
    .element(screen.getByRole("button", { name: "Spaces 3 new" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="sidebar-menu-badge-rail"]')!
      .textContent,
  ).toBe("3");
});

test("in the phone drawer the flyout opens on press only, under the row", async () => {
  mobile = true;
  const screen = await render(
    <SidebarProvider>
      <SidebarMenu>
        <SidebarMenuFlyout label="Spaces" icon={<LayoutGrid />}>
          <DropdownMenuItem>General</DropdownMenuItem>
        </SidebarMenuFlyout>
      </SidebarMenu>
    </SidebarProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Spaces" });
  await trigger.click();
  await expect
    .element(screen.getByRole("menu"))
    .toHaveAttribute("data-side", "bottom");
});
