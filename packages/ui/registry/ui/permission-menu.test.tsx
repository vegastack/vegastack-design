import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { PermissionMenu } from "./permission-menu";

const LEVELS = [
  {
    value: "full",
    label: "Full access",
    description: "Edit, share and delete",
  },
  { value: "edit", label: "Can edit", description: "Edit and comment" },
  { value: "view", label: "Can view", description: "View and comment" },
];

test("the trigger reads the current level; the menu checks it and describes each level", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <PermissionMenu
      value="edit"
      options={LEVELS}
      onValueChange={onValueChange}
      aria-label="Priya's access: Can edit"
    />,
  );
  const trigger = screen.getByRole("button", {
    name: "Priya's access: Can edit",
  });
  await expect.element(trigger).toHaveTextContent("Can edit");
  await trigger.click();
  const edit = screen.getByRole("menuitemradio", { name: "Can edit" });
  await expect.element(edit).toHaveAttribute("aria-checked", "true");
  await expect.element(edit).toHaveAccessibleDescription("Edit and comment");
  await expectNoA11yViolations(document.body);
  await screen.getByRole("menuitemradio", { name: "Can view" }).click();
  expect(onValueChange).toHaveBeenCalledWith("view");
});

test("Remove access is the last, destructive item — only with onRemove", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <PermissionMenu value="view" options={LEVELS} onRemove={onRemove} />,
  );
  await screen.getByRole("button", { name: "Can view" }).click();
  const items = screen
    .getByRole("menu")
    .element()
    .querySelectorAll('[role^="menuitem"]');
  const remove = items[items.length - 1]!;
  expect(remove.textContent).toBe("Remove access");
  expect(remove.getAttribute("data-variant")).toBe("destructive");
  (remove as HTMLElement).click();
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test("no onRemove, no Remove access item", async () => {
  const screen = await render(<PermissionMenu value="view" options={LEVELS} />);
  await screen.getByRole("button", { name: "Can view" }).click();
  await expect.element(screen.getByRole("menu")).toBeVisible();
  expect(document.querySelector("[data-permission-menu-remove]")).toBeNull();
});

test("keyboard: Enter opens on the first level, ArrowDown moves, Enter picks", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <PermissionMenu
      value="full"
      options={LEVELS}
      onValueChange={onValueChange}
    />,
  );
  (
    screen.getByRole("button", { name: "Full access" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByRole("menu")).toBeVisible();
  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(onValueChange).toHaveBeenCalledWith("edit");
});

test("readOnly is plain muted text with no menu", async () => {
  const screen = await render(
    <PermissionMenu value="full" options={LEVELS} readOnly />,
  );
  const text = screen.getByText("Full access");
  await expect.element(text).toHaveAttribute("data-readonly", "");
  expect(text.element().className).toContain("text-muted-foreground");
  await expect.element(screen.getByRole("button")).not.toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

const LEVEL_OPTIONS = [
  {
    value: "full",
    label: "Full access",
    description: "Edit, share and delete, and change who else has access to it",
  },
  { value: "edit", label: "Can edit", description: "Edit and comment" },
];

test("variants: chip is a 28px ghost chip with a chevron, outline is a bordered 32px control", async () => {
  const screen = await render(
    <>
      <PermissionMenu
        variant="chip"
        value="edit"
        options={LEVEL_OPTIONS}
        aria-label="Chip"
      />
      <PermissionMenu
        variant="outline"
        value="edit"
        options={LEVEL_OPTIONS}
        aria-label="Outline"
      />
    </>,
  );
  const chip = screen.getByRole("button", { name: "Chip" }).element();
  const outline = screen.getByRole("button", { name: "Outline" }).element();
  expect(chip.getAttribute("data-variant")).toBe("chip");
  expect(chip.className).toContain("h-7");
  expect(
    chip.querySelector('[data-slot="permission-menu-chevron"]'),
  ).not.toBeNull();
  expect(outline.className).toContain("h-8");
  expect(outline.className).toContain("border-border");
  await (outline as HTMLElement).click();
  const description = await vi.waitUntil(() =>
    document.querySelector('[data-slot="item-description"]'),
  );
  expect(description.className).toContain("line-clamp-2");
  await expectNoA11yViolations(document.body);
});

test("locked shows a lock and the level, stays a tab stop, names the reason and opens no menu", async () => {
  const screen = await render(
    <PermissionMenu
      variant="chip"
      value="full"
      options={LEVEL_OPTIONS}
      locked
      lockedReason="Set by role: Creator"
      aria-label="Asha's access: Full access"
    />,
  );
  const locked = screen.getByRole("button", {
    name: "Asha's access: Full access, Set by role: Creator",
  });
  await expect.element(locked).toBeVisible();
  expect(
    locked.element().querySelector('[data-slot="permission-menu-lock"]'),
  ).not.toBeNull();
  await userEvent.tab();
  expect(document.activeElement).toBe(locked.element());
  await expect.element(screen.getByText("Set by role: Creator")).toBeVisible();
  await userEvent.keyboard("{Enter}");
  expect(document.querySelector('[role="menu"]')).toBeNull();
  await expectNoA11yViolations(document.body);
});
