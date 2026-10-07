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
test("footer swatches set the hue inline and Remove sits beside them", async () => {
  const hue = vi.fn();
  const removed = vi.fn();
  const screen = await render(
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Identity</DialogTitle>
        </DialogHeader>
        <IconPicker
          onValueChange={() => {}}
          onHueChange={hue}
          onRemove={removed}
          closeOnSelect={false}
        />
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole("button", { name: "Choose an icon" }).click();
  const group = screen.getByRole("radiogroup", { name: "Icon colour" });
  const radios = group.element().querySelectorAll('[role="radio"]');
  expect(radios[0]?.getAttribute("aria-label")).toBe("No colour");
  await group.getByRole("radio", { name: "Blue", exact: true }).click();
  expect(hue).toHaveBeenLastCalledWith("blue");
  await expect
    .element(group.getByRole("radio", { name: "Blue", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .element(group.getByRole("radio", { name: "No colour" }))
    .toHaveFocus();
  expect(hue).toHaveBeenLastCalledWith(null);
  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .element(group.getByRole("radio", { name: "Purple" }))
    .toHaveAttribute("aria-checked", "true");
  expect(hue).toHaveBeenLastCalledWith("purple");
  await expect
    .element(screen.getByRole("button", { name: "Icon colour" }))
    .not.toBeInTheDocument();
  await screen.getByRole("tab", { name: "Emoji" }).click();
  await expect
    .element(screen.getByRole("radiogroup", { name: "Icon colour" }))
    .not.toBeInTheDocument();
  await screen.getByRole("button", { name: "Remove icon" }).click();
  expect(removed).toHaveBeenCalled();
});
test("a remembered hue owns the swatch tab stop", async () => {
  localStorage.setItem("tabstop-test:hue", JSON.stringify("purple"));
  const screen = await render(
    <IconPicker preferenceKey="tabstop-test" onValueChange={() => {}} />,
  );
  await screen.getByRole("button", { name: "Choose an icon" }).click();
  const purple = screen.getByRole("radio", { name: "Purple" });
  await expect.element(purple).toHaveAttribute("aria-checked", "true");
  await expect.element(purple).toHaveAttribute("tabindex", "0");
  await expect
    .element(screen.getByRole("radio", { name: "No colour" }))
    .toHaveAttribute("tabindex", "-1");
});
test("footer is omitted when there is nothing to show", async () => {
  const screen = await render(
    <IconPicker modes={["emoji"]} onValueChange={() => {}} />,
  );
  await screen.getByRole("button", { name: "Choose an icon" }).click();
  await expect.element(screen.getByRole("searchbox")).toBeInTheDocument();
  expect(document.querySelector('[data-slot="icon-picker-footer"]')).toBeNull();
});
test("explicit No colour wins over a remembered hue and opening emits no changes", async () => {
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
  await expect
    .element(screen.getByRole("radio", { name: "No colour" }))
    .toHaveAttribute("aria-checked", "true");
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
