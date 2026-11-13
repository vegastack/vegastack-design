import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ChatMenu,
  ChatMenuItem,
  ChatMenuSeparator,
  ChatMenuSub,
} from "./chat-menu";

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

function ModelMenu({
  onModel = () => {},
  onEffort = () => {},
}: {
  onModel?: (id: string) => void;
  onEffort?: (level: string) => void;
}) {
  return (
    <ChatMenu trigger="Sonnet 5.5">
      <ChatMenuItem selected shortcut="1" onSelect={() => onModel("sonnet")}>
        Sonnet 5.5
      </ChatMenuItem>
      <ChatMenuItem shortcut="2" onSelect={() => onModel("opus")}>
        Opus 5.5
      </ChatMenuItem>
      <ChatMenuItem
        shortcut="3"
        disabled
        muted
        hint="Off · ask an admin"
        onSelect={() => onModel("gemini")}
      >
        Gemini 3
      </ChatMenuItem>
      <ChatMenuSeparator />
      <ChatMenuSub label="Effort" value="Medium">
        <ChatMenuItem shortcut="1" onSelect={() => onEffort("low")}>
          Low
        </ChatMenuItem>
        <ChatMenuItem
          selected
          hint="Recommended"
          shortcut="2"
          onSelect={() => onEffort("medium")}
        >
          Medium
        </ChatMenuItem>
      </ChatMenuSub>
    </ChatMenu>
  );
}

test("a string trigger opens a menu of tight rows; the selected ✓ is primary", async () => {
  const screen = await render(<ModelMenu />);
  await userEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  await expect.poll(() => slot("chat-menu-content")).not.toBeNull();
  const selected = document.querySelector<HTMLElement>(
    '[data-slot="chat-menu-item"][data-selected]',
  )!;
  expect(selected.textContent).toContain("Sonnet 5.5");
  const check = selected.querySelector('[aria-label="Selected"]')!;
  expect(check.getAttribute("class")).toContain("text-primary");
  expect(check.getAttribute("class")).not.toMatch(/success|green/);
  expect(selected.getAttribute("aria-keyshortcuts")).toBe("1");
  // The ✓ takes the one right slot: no number beside it; the others show theirs.
  expect(
    selected.querySelector('[data-slot="chat-menu-item-end"]')!.textContent,
  ).toBe("");
  expect(
    document.querySelectorAll('[data-slot="chat-menu-item-end"]')[1]!
      .textContent,
  ).toBe("2");
});

test("a number key picks its item and closes the menu", async () => {
  const onModel = vi.fn();
  const screen = await render(<ModelMenu onModel={onModel} />);
  await userEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  await expect.poll(() => slot("chat-menu-content")).not.toBeNull();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("2");
  expect(onModel).toHaveBeenCalledWith("opus");
  await expect.poll(() => slot("chat-menu-content")).toBeNull();
});

test("a disabled item's shortcut does nothing", async () => {
  const onModel = vi.fn();
  const screen = await render(<ModelMenu onModel={onModel} />);
  await userEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  await expect.poll(() => slot("chat-menu-content")).not.toBeNull();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("3");
  expect(onModel).not.toHaveBeenCalled();
  expect(slot("chat-menu-content")).not.toBeNull();
});

test("→ opens the submenu, and its own number keys pick within it", async () => {
  const onModel = vi.fn();
  const onEffort = vi.fn();
  const screen = await render(
    <ModelMenu onModel={onModel} onEffort={onEffort} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  await expect.poll(() => slot("chat-menu-sub-trigger")).not.toBeNull();
  expect(slot("chat-menu-sub-value")?.textContent).toBe("Medium");
  slot("chat-menu-sub-trigger")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => slot("chat-menu-sub-content")).not.toBeNull();
  await expect
    .poll(() => slot("chat-menu-sub-content")!.contains(document.activeElement))
    .toBe(true);
  await userEvent.keyboard("1");
  expect(onEffort).toHaveBeenCalledWith("low");
  expect(onModel).not.toHaveBeenCalled();
  await expect.poll(() => slot("chat-menu-content")).toBeNull();
});

test("Enter on a focused item picks it", async () => {
  const onModel = vi.fn();
  const screen = await render(<ModelMenu onModel={onModel} />);
  await userEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  await expect.poll(() => slot("chat-menu-content")).not.toBeNull();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{Enter}");
  expect(onModel).toHaveBeenCalledOnce();
});

test("no a11y violations — open", async () => {
  const screen = await render(<ModelMenu />);
  await userEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  await expect.poll(() => slot("chat-menu-content")).not.toBeNull();
  await expectNoA11yViolations(document.body);
});

test("an item's description is its tooltip and its accessible description; a sub's note leads it", async () => {
  const screen = await render(
    <ChatMenu trigger="Model">
      <ChatMenuItem description="Everyday work" onSelect={() => {}}>
        Sonnet 5.5
      </ChatMenuItem>
      <ChatMenuSub label="Effort" note="Higher effort thinks longer.">
        <ChatMenuItem onSelect={() => {}}>Low</ChatMenuItem>
      </ChatMenuSub>
    </ChatMenu>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Model" }));
  const item = screen.getByRole("menuitem", { name: "Sonnet 5.5" });
  await expect
    .element(item)
    .toHaveAttribute("aria-description", "Everyday work");
  await userEvent.hover(item);
  await vi.waitFor(() =>
    expect(slot("tooltip-content")?.textContent).toBe("Everyday work"),
  );
  await userEvent.click(screen.getByRole("menuitem", { name: "Effort" }));
  await vi.waitFor(() =>
    expect(slot("chat-menu-sub-note")?.textContent).toBe(
      "Higher effort thinks longer.",
    ),
  );
});

test("a controlled sub opens with its menu", async () => {
  await render(
    <ChatMenu trigger="Model" open>
      <ChatMenuItem onSelect={() => {}}>Sonnet 5.5</ChatMenuItem>
      <ChatMenuSub label="Effort" open>
        <ChatMenuItem onSelect={() => {}}>Low</ChatMenuItem>
      </ChatMenuSub>
    </ChatMenu>,
  );
  await vi.waitFor(() => expect(slot("chat-menu-sub-content")).not.toBeNull());
});
