import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
} from "./dropdown-menu";
import {
  DropdownMenuAtPoint,
  DropdownMenuIdentity,
  DropdownMenuInput,
  DropdownMenuNote,
  DropdownMenuSwitchItem,
  stopMenuTyping,
} from "./dropdown-menu-form";

function keyEvent(key: string) {
  const stopPropagation = vi.fn();
  stopMenuTyping({ key, stopPropagation } as unknown as React.KeyboardEvent);
  return stopPropagation;
}

test("stopMenuTyping keeps every key but Escape and Tab; passArrows also lets the vertical arrows through", () => {
  expect(keyEvent("a")).toHaveBeenCalledTimes(1);
  expect(keyEvent("ArrowDown")).toHaveBeenCalledTimes(1);
  expect(keyEvent("Escape")).not.toHaveBeenCalled();
  expect(keyEvent("Tab")).not.toHaveBeenCalled();
  const stopPropagation = vi.fn();
  stopMenuTyping(
    { key: "ArrowUp", stopPropagation } as unknown as React.KeyboardEvent,
    true,
  );
  expect(stopPropagation).not.toHaveBeenCalled();
});

test("DropdownMenuInput keeps typing off the menu, and its arrows too unless passArrows", async () => {
  const outer = vi.fn();
  const screen = await render(
    <div onKeyDown={(event) => outer(event.key)}>
      <DropdownMenuInput aria-label="Name" />
      <DropdownMenuInput aria-label="First" passArrows />
    </div>,
  );
  await screen.getByRole("textbox", { name: "Name" }).click();
  await userEvent.keyboard("ab{ArrowDown}{Tab}");
  expect(outer.mock.calls.map(([key]) => key)).toEqual(["Tab"]);
  outer.mockClear();
  await screen.getByRole("textbox", { name: "First" }).click();
  await userEvent.keyboard("a{ArrowDown}");
  expect(outer.mock.calls.map(([key]) => key)).toEqual(["ArrowDown"]);
});

test("DropdownMenuSwitchItem: the whole row toggles, with a hint, and the switch only draws it", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <DropdownMenu open>
      <DropdownMenuContent>
        <DropdownMenuSwitchItem
          label="Required"
          hint="A row can't be saved without it."
          checked={false}
          onCheckedChange={onCheckedChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const row = screen.getByRole("menuitemcheckbox", { name: /Required/ });
  await expect.element(row).toHaveAttribute("aria-checked", "false");
  expect(row.element().textContent).toContain("A row can't be saved");
  // The switch is decorative: inert, so neither focusable nor read.
  const decorative = row.element().querySelector('[data-slot="switch"]')!;
  expect(decorative.closest("[inert]")).not.toBeNull();
  expect(decorative.closest("[aria-hidden]")).not.toBeNull();
  await row.click();
  expect(onCheckedChange).toHaveBeenCalledTimes(1);
  expect(onCheckedChange.mock.calls[0]![0]).toBe(true);
  await expectNoA11yViolations(document.body);
});

test("DropdownMenuAtPoint opens at the point, stays there while closing, and reports a close", async () => {
  const onClose = vi.fn();
  const screen = await render(
    <DropdownMenuAtPoint point={{ x: 120, y: 80 }} onClose={onClose}>
      <DropdownMenuSwitchItem
        label="Notify"
        checked
        onCheckedChange={() => {}}
      />
    </DropdownMenuAtPoint>,
  );
  await expect
    .element(screen.getByRole("menuitemcheckbox", { name: "Notify" }))
    .toBeInTheDocument();
  const trigger = document.querySelector<HTMLElement>(
    '[data-slot="dropdown-menu-point"]',
  )!;
  expect(trigger.style.getPropertyValue("--anchor-x")).toBe("120px");
  expect(trigger.style.getPropertyValue("--anchor-y")).toBe("80px");
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
  // Closed by the host: the point it had is kept, not reset to the corner.
  await screen.rerender(
    <DropdownMenuAtPoint point={null} onClose={onClose}>
      <span>Notify</span>
    </DropdownMenuAtPoint>,
  );
  expect(
    document
      .querySelector<HTMLElement>('[data-slot="dropdown-menu-point"]')!
      .style.getPropertyValue("--anchor-x"),
  ).toBe("120px");
});

test("DropdownMenuIdentity and DropdownMenuNote: a header with name and line, a quiet foot", async () => {
  const screen = await render(
    <DropdownMenu open>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuIdentity
            media={<span data-testid="avatar">NK</span>}
            title="Neha Kapoor"
            description="neha@example.com"
          />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuNote>
            Made by <a href="https://example.com">VegaStack</a>
          </DropdownMenuNote>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const identity = document.querySelector(
    '[data-slot="dropdown-menu-identity"]',
  )!;
  expect(identity.textContent).toContain("Neha Kapoor");
  expect(identity.querySelector('[title="neha@example.com"]')).not.toBeNull();
  await expect.element(screen.getByTestId("avatar")).toBeInTheDocument();
  expect(
    document.querySelector('[data-slot="dropdown-menu-note"] a'),
  ).not.toBeNull();
  await expectNoA11yViolations(document.body);
});
