import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu";

test("opens the menu and renders items when the trigger is clicked", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  // Closed: the menu is not in the DOM.
  expect(document.querySelector('[role="menu"]')).toBeNull();

  await screen.getByRole("button", { name: "Open" }).click();

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
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onClick}>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  expect(onClick).toHaveBeenCalledOnce();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="menu"]')).toBeNull(),
  );
});

test("applies the destructive variant data attribute", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await expect
    .element(page.getByRole("menuitem", { name: "Delete" }))
    .toHaveAttribute("data-variant", "destructive");
});

test("renders label, separator and a shortcut hint", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await expect.element(page.getByText("Account")).toBeInTheDocument();
  await expect.element(page.getByText("⌘S")).toBeInTheDocument();
  await expect.element(page.getByRole("separator")).toBeInTheDocument();
});

test("checkbox item toggles via onCheckedChange", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={false}
          onCheckedChange={onCheckedChange}
        >
          Show grid
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Show grid" }).click();
  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
});

test("radio group selects via onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value="member" onValueChange={onValueChange}>
          <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await page.getByRole("menuitemradio", { name: "Admin" }).click();
  expect(onValueChange).toHaveBeenCalledWith("admin", expect.anything());
});

test("merges positioner className and forwards portal + viewport props", async () => {
  const screen = await render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent
        portalProps={{ className: "dropdown-menu-portal-prop" }}
        positionerProps={{ className: "consumer-positioner" }}
        viewportProps={{ className: "consumer-viewport" }}
      >
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await expect
    .element(page.getByRole("menuitem", { name: "Edit" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Open" }))
    .toBeInTheDocument();

  const positioner = document.querySelector(
    '[data-slot="dropdown-menu-positioner"]',
  )!;
  expect(positioner.className).toContain("z-(--z-overlay)");
  expect(positioner.className).toContain("outline-none");
  expect(positioner.className).toContain("consumer-positioner");
  expect(document.querySelector(".dropdown-menu-portal-prop")).not.toBeNull();
  expect(
    document.querySelector('[data-slot="dropdown-menu-viewport"]')?.className,
  ).toContain("consumer-viewport");
});

test("opens a submenu on pointer hover and activates a nested item", async () => {
  const onEmail = vi.fn();
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={onEmail}>Email</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
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
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Email</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  const subTrigger = page.getByRole("menuitem", { name: "Invite users" });
  await expect.element(subTrigger).toBeInTheDocument();
  subTrigger.element().focus();

  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () =>
        document.querySelectorAll('[data-slot="dropdown-menu-content"]').length,
    )
    .toBe(2);
  await expect
    .element(page.getByRole("menuitem", { name: "Email" }))
    .toBeInTheDocument();

  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .poll(
      () =>
        document.querySelectorAll('[data-slot="dropdown-menu-content"]').length,
    )
    .toBe(1);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — checked", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked>Show grid</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="member">
          <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Open" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations with the menu open", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Account menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            Delete account
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  await screen.getByRole("button", { name: "Account menu" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("DropdownMenuTrigger forwards ref to its host element", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <DropdownMenu>
      <DropdownMenuTrigger ref={ref}>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("dropdown-menu-trigger");
});
