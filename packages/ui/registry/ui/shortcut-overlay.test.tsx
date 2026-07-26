import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ShortcutOverlay, type ShortcutDefinition } from "./shortcut-overlay";

const SHORTCUTS: ShortcutDefinition[] = [
  { keys: ["⌘", "K"], label: "Open command menu", category: "Navigation" },
  { keys: ["G", "D"], label: "Go to deals", category: "Navigation" },
  { keys: ["E"], label: "Edit selected record", category: "Editing" },
];

test("the ? key opens the overlay, grouped by category in declaration order", async () => {
  const screen = await render(<ShortcutOverlay shortcuts={SHORTCUTS} />);
  await userEvent.keyboard("?");
  await expect
    .element(screen.getByRole("dialog", { name: "Keyboard shortcuts" }))
    .toBeInTheDocument();
  const categories = Array.from(
    document.querySelectorAll('[data-slot="shortcut-overlay-category"] h3'),
  ).map((h) => h.textContent);
  expect(categories).toEqual(["Navigation", "Editing"]);
  const rows = document.querySelectorAll('[data-slot="shortcut-overlay-row"]');
  expect(rows).toHaveLength(3);
});

test("the trigger never fires from a text field", async () => {
  const screen = await render(
    <div>
      <input aria-label="Notes" />
      <ShortcutOverlay shortcuts={SHORTCUTS} />
    </div>,
  );
  const input = screen.getByRole("textbox", { name: "Notes" });
  (input.element() as HTMLInputElement).focus();
  await userEvent.keyboard("?");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  await expect.element(input).toHaveValue("?");
});

test("shouldHandle=false suppresses the trigger (overlay-open rule)", async () => {
  await render(
    <ShortcutOverlay shortcuts={SHORTCUTS} shouldHandle={() => false} />,
  );
  await userEvent.keyboard("?");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("triggerKey=false disables the built-in binding; controlled open still works", async () => {
  const screen = await render(
    <ShortcutOverlay shortcuts={SHORTCUTS} triggerKey={false} open={false} />,
  );
  await userEvent.keyboard("?");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  await screen.rerender(
    <ShortcutOverlay shortcuts={SHORTCUTS} triggerKey={false} open />,
  );
  await expect
    .element(screen.getByRole("dialog", { name: "Keyboard shortcuts" }))
    .toBeInTheDocument();
});

test("shortcuts render as description-list pairs with real <kbd> keys", async () => {
  await render(<ShortcutOverlay shortcuts={SHORTCUTS} open />);
  const row = document.querySelector(
    '[data-slot="shortcut-overlay-row"]',
  ) as HTMLElement;
  expect(row.querySelector("dt")?.textContent).toBe("Open command menu");
  const kbds = row.querySelectorAll("kbd");
  expect(kbds.length).toBeGreaterThan(0);
  expect(row.closest("dl")).not.toBeNull();
});

test("when: false omits a shortcut", async () => {
  await render(
    <ShortcutOverlay
      open
      shortcuts={[
        ...SHORTCUTS,
        { keys: ["A"], label: "Admin only", category: "Admin", when: false },
      ]}
    />,
  );
  expect(document.body.textContent).not.toContain("Admin only");
  expect(
    document.querySelectorAll('[data-slot="shortcut-overlay-row"]'),
  ).toHaveLength(3);
});

test("the filter narrows by label and shows the empty message when nothing matches", async () => {
  const many: ShortcutDefinition[] = Array.from({ length: 12 }, (_, i) => ({
    keys: [String(i)],
    label: `Shortcut ${i}`,
    category: i < 6 ? "First" : "Second",
  }));
  const screen = await render(<ShortcutOverlay shortcuts={many} open />);
  const filter = screen.getByRole("textbox", { name: "Filter shortcuts" });
  await expect.element(filter).toBeInTheDocument();
  await filter.fill("Shortcut 3");
  expect(
    document.querySelectorAll('[data-slot="shortcut-overlay-row"]'),
  ).toHaveLength(1);
  await filter.fill("zzz");
  expect(
    document.querySelector('[data-slot="shortcut-overlay-empty"]')?.textContent,
  ).toContain("No shortcuts match");
});

test("Escape closes and onOpenChange reports it", async () => {
  const onOpenChange = vi.fn();
  await render(
    <ShortcutOverlay shortcuts={SHORTCUTS} onOpenChange={onOpenChange} />,
  );
  await userEvent.keyboard("?");
  expect(onOpenChange).toHaveBeenLastCalledWith(true);
  await userEvent.keyboard("{Escape}");
  await expect
    .poll(
      () => onOpenChange.mock.calls[onOpenChange.mock.calls.length - 1]?.[0],
    )
    .toBe(false);
});

test("no a11y violations — open overlay with search", async () => {
  const many: ShortcutDefinition[] = Array.from({ length: 12 }, (_, i) => ({
    keys: ["⌘", String(i)],
    label: `Shortcut ${i}`,
    category: i % 2 ? "Odd" : "Even",
  }));
  await render(<ShortcutOverlay shortcuts={many} open />);
  // The dialog portals to body.
  await expectNoA11yViolations(document.body);
});
