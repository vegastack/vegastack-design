import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGridLink,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "./navigation-menu";

function Example() {
  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-96 grid-cols-2 gap-1">
              <NavigationMenuGridLink
                href="#ai"
                title="Ask AI"
                description="Search and create with AI"
              />
              <NavigationMenuGridLink
                href="#data"
                title="Data model"
                description="Sync and enrich your data"
              />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuPanel />
    </NavigationMenu>
  );
}

test("renders triggers and plain links in the list", async () => {
  const screen = await render(<Example />);
  await expect
    .element(screen.getByRole("button", { name: "Platform" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("link", { name: "Pricing" }))
    .toBeInTheDocument();
});

test("activating a trigger opens the shared panel with grid links", async () => {
  const screen = await render(<Example />);
  const trigger = screen.getByRole("button", { name: "Platform" });
  await userEvent.click(trigger);
  await expect
    .element(screen.getByRole("link", { name: /Ask AI/ }))
    .toBeInTheDocument();
  const popup = document.querySelector(
    '[data-slot="navigation-menu-popup"]',
  ) as HTMLElement;
  expect(popup).not.toBeNull();
  await expect.element(trigger).toHaveAttribute("data-popup-open");
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations (closed)", async () => {
  const screen = await render(<Example />);
  await expectNoA11yViolations(screen.container);
});
