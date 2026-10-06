import "../../test/geometry.css";
import * as React from "react";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent, page } from "vitest/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { IconPicker } from "./icon-picker";
import { IconGlyph } from "./icon-glyph";
import { ICON_CATALOGUE } from "@/lib/icon-data";
import { expectNoA11yViolations } from "../../test/a11y";

test("generic glyph preserves emoji and fallback without an avatar tile", async () => {
  const screen = await render(
    <>
      <IconGlyph value={{ kind: "emoji", char: "🚀" }} aria-label="Rocket" />
      <IconGlyph fallback="S" aria-label="Sales" />
    </>,
  );
  await expect
    .element(screen.getByRole("img", { name: "Rocket" }))
    .toHaveTextContent("🚀");
  await expect
    .element(screen.getByRole("img", { name: "Sales" }))
    .toHaveTextContent("S");
  expect(document.querySelector('[data-slot="avatar"]')).toBeNull();
});
test("single-mode picker hides tabs and emits a canonical icon", async () => {
  const picked = vi.fn();
  const screen = await render(
    <IconPicker modes={["icon"]} onValueChange={picked} />,
  );
  await screen.getByRole("button", { name: "Choose an icon" }).click();
  await screen
    .getByRole("searchbox", { name: "Search icons…" })
    .fill("briefcase");
  await screen.getByRole("button", { name: "Briefcase Business" }).click();
  expect(picked).toHaveBeenCalledWith({
    kind: "icon",
    name: "briefcase-business",
  });
  expect(document.querySelector('[role="tab"]')).toBeNull();
});
test("nested colour Escape restores its trigger without dismissing the parent", async () => {
  const screen = await render(
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Identity</DialogTitle>
        </DialogHeader>
        <IconPicker onValueChange={() => {}} closeOnSelect={false} />
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole("button", { name: "Choose an icon" }).click();
  await screen.getByRole("button", { name: "Icon colour" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Blue", exact: true }))
    .toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(screen.getByRole("button", { name: "Icon colour" }))
    .toHaveFocus();
  await expect.element(screen.getByRole("searchbox")).toBeInTheDocument();
});
test("explicit Default wins over a remembered hue and opening emits no changes", async () => {
  localStorage.setItem("picker-test:hue", JSON.stringify("blue"));
  const changed = vi.fn();
  const screen = await render(
    <IconPicker
      preferenceKey="picker-test"
      hue={null}
      onHueChange={changed}
      onValueChange={() => {}}
    />,
  );
  await screen.getByRole("button", { name: "Choose an icon" }).click();
  expect(changed).not.toHaveBeenCalled();
  await screen.getByRole("button", { name: "Icon colour" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Default", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("picker fits a short viewport with visible search and removal in both themes", async () => {
  await page.viewport(390, 420);
  try {
    localStorage.setItem(
      "viewport-picker:icon-recents",
      JSON.stringify(ICON_CATALOGUE.slice(0, 20).map((entry) => entry.name)),
    );
    const screen = await render(
      <IconPicker
        preferenceKey="viewport-picker"
        value={{ kind: "icon", name: "target" }}
        onValueChange={() => {}}
        onRemove={() => {}}
        closeOnSelect={false}
      />,
    );
    await screen.getByRole("button", { name: "Choose an icon" }).click();
    await expect
      .element(
        screen
          .getByRole("group", { name: "Work", exact: true })
          .getByRole("button", { name: "Target", exact: true }),
      )
      .toBeInTheDocument();
    expect(
      screen
        .getByRole("group", { name: "Recent", exact: true })
        .element()
        .querySelectorAll("button"),
    ).toHaveLength(16);
    for (const dark of [false, true]) {
      document.documentElement.classList.toggle("dark", dark);
      const panel = document.querySelector<HTMLElement>(
        '[data-slot="icon-picker"]',
      )!;
      const box = panel.getBoundingClientRect();
      const glyph = panel.querySelector<HTMLElement>(
        '[data-slot="picker-panel-item"] [data-slot="icon-glyph"]',
      )!;
      expect(getComputedStyle(glyph).color).toBe(getComputedStyle(panel).color);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
      await expect.element(screen.getByRole("searchbox")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Remove icon" }))
        .toBeVisible();
    }
  } finally {
    document.documentElement.classList.remove("dark");
    await page.viewport(1280, 900);
  }
});
