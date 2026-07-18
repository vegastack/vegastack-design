import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuShortcut,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "./context-menu";

/**
 * Base UI's `ContextMenu.Trigger` opens on the native `contextmenu` event
 * (right-click / long-press). `userEvent.click` can't issue a right-click in a
 * provider-agnostic way, so we dispatch a bubbling `contextmenu` MouseEvent —
 * React's synthetic event system listens for it at the root and runs the
 * trigger's `onContextMenu` handler exactly as a real right-click would.
 */
function rightClick(el: Element): void {
  el.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
  );
}

test("right-clicking the trigger opens the menu and renders items", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  // Closed: the menu is not in the DOM.
  expect(document.querySelector('[role="menu"]')).toBeNull();

  const trigger = screen.container.querySelector(
    '[data-slot="context-menu-trigger"]',
  ) as Element;
  rightClick(trigger);

  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Edit" }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Duplicate" }))
    .toBeInTheDocument();
});

test("clicking an item fires onClick and closes the menu", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onClick}>Edit</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await page.getByRole("menuitem", { name: "Edit" }).click();

  expect(onClick).toHaveBeenCalledOnce();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="menu"]')).toBeNull(),
  );
});

test("applies the destructive variant data attribute", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await expect
    .element(page.getByRole("menuitem", { name: "Delete" }))
    .toHaveAttribute("data-variant", "destructive");
});

test("renders label, separator and a shortcut hint", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Account</ContextMenuLabel>
          <ContextMenuItem>
            Settings
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem>Log out</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await expect.element(page.getByText("Account")).toBeInTheDocument();
  await expect.element(page.getByText("⌘S")).toBeInTheDocument();
  await expect.element(page.getByRole("separator")).toBeInTheDocument();
});

test("checkbox item toggles via onCheckedChange", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuCheckboxItem
          checked={false}
          onCheckedChange={onCheckedChange}
        >
          Show grid
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await page.getByRole("menuitemcheckbox", { name: "Show grid" }).click();
  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});

test("radio group selects via onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuRadioGroup value="member" onValueChange={onValueChange}>
          <ContextMenuRadioItem value="admin">Admin</ContextMenuRadioItem>
          <ContextMenuRadioItem value="member">Member</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await page.getByRole("menuitemradio", { name: "Admin" }).click();
  expect(onValueChange).toHaveBeenCalledWith("admin", expect.anything());
});

test("opens from Shift+F10 when the trigger is focused", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger tabIndex={0}>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  const trigger = screen.container.querySelector(
    '[data-slot="context-menu-trigger"]',
  ) as HTMLElement;
  trigger.focus();
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");

  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Edit" }))
    .toBeInTheDocument();
});

test("opens from the Menu key when the trigger is focused", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger tabIndex={0}>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  const trigger = screen.container.querySelector(
    '[data-slot="context-menu-trigger"]',
  ) as HTMLElement;
  trigger.focus();
  await userEvent.keyboard("{ContextMenu}");

  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Edit" }))
    .toBeInTheDocument();
});

test("merges positioner className and forwards portal props", async () => {
  await render(
    <ContextMenu open>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent
        portalProps={{ className: "context-menu-portal-prop" }}
        positionerProps={{ className: "consumer-positioner" }}
      >
        <ContextMenuItem>Edit</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  await expect
    .element(page.getByRole("menuitem", { name: "Edit" }))
    .toBeInTheDocument();

  const positioner = document.querySelector(
    '[data-slot="context-menu-positioner"]',
  )!;
  expect(positioner.className).toContain("z-(--z-overlay)");
  expect(positioner.className).toContain("outline-none");
  expect(positioner.className).toContain("consumer-positioner");
  expect(document.querySelector(".context-menu-portal-prop")).not.toBeNull();
});

test("opens a submenu on pointer hover and activates a nested item", async () => {
  const onEmail = vi.fn();
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Invite users</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={onEmail}>Email</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await userEvent.hover(page.getByRole("menuitem", { name: "Invite users" }));
  await expect
    .element(page.getByRole("menuitem", { name: "Email" }))
    .toBeInTheDocument();

  await page.getByRole("menuitem", { name: "Email" }).click();
  expect(onEmail).toHaveBeenCalledOnce();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="menu"]')).toBeNull(),
  );
});

test("opens and closes a submenu with ArrowRight and ArrowLeft", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Invite users</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  const subTrigger = page.getByRole("menuitem", { name: "Invite users" });
  await expect.element(subTrigger).toBeInTheDocument();
  subTrigger.element().focus();

  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () =>
        document.querySelectorAll('[data-slot="context-menu-content"]').length,
    )
    .toBe(2);
  await expect
    .element(page.getByRole("menuitem", { name: "Email" }))
    .toBeInTheDocument();

  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .poll(
      () =>
        document.querySelectorAll('[data-slot="context-menu-content"]').length,
    )
    .toBe(1);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
        <ContextMenuItem disabled>Duplicate</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — checked", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuCheckboxItem checked>Show grid</ContextMenuCheckboxItem>
        <ContextMenuRadioGroup value="member">
          <ContextMenuRadioItem value="admin">Admin</ContextMenuRadioItem>
          <ContextMenuRadioItem value="member">Member</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations with the menu open", async () => {
  const screen = await render(
    <ContextMenu>
      <ContextMenuTrigger>Right-click region</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Account</ContextMenuLabel>
          <ContextMenuItem>Settings</ContextMenuItem>
          <ContextMenuItem variant="destructive">
            Delete account
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>,
  );

  rightClick(
    screen.container.querySelector(
      '[data-slot="context-menu-trigger"]',
    ) as Element,
  );
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("ContextMenuTrigger forwards ref to its host element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <ContextMenu>
      <ContextMenuTrigger ref={ref}>Right-click me</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("context-menu-trigger");
});
