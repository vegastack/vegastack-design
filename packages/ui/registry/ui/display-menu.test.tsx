import * as React from "react";
import { render } from "vitest-browser-react";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DisplayMenu, type DisplayMenuColumn } from "./display-menu";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

function Harness({ onReset = () => {} }: { onReset?: () => void }) {
  const [closed, setClosed] = React.useState(false);
  const [height, setHeight] = React.useState("comfortable");
  const [columns, setColumns] = React.useState<DisplayMenuColumn[]>([
    { id: "name", label: "Name", visible: true, locked: true },
    { id: "due", label: "Due", visible: true },
    { id: "owner", label: "Owner", visible: false },
  ]);
  return (
    <DisplayMenu
      rowHeight={{
        value: height,
        options: [
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfortable" },
        ],
        onValueChange: setHeight,
      }}
      columns={{
        items: columns,
        onToggle: (id, visible) =>
          setColumns((all) =>
            all.map((c) => (c.id === id ? { ...c, visible } : c)),
          ),
        onShowAll: () =>
          setColumns((all) => all.map((c) => ({ ...c, visible: true }))),
      }}
      toggles={[
        {
          id: "closed",
          label: "Show closed",
          checked: closed,
          onCheckedChange: setClosed,
        },
      ]}
      isDefault={!closed && height === "comfortable"}
      onReset={() => {
        setClosed(false);
        setHeight("comfortable");
        onReset();
      }}
    />
  );
}

test("sections in order, one surface with no fills; a dot and Reset once changed", async () => {
  const onReset = vi.fn();
  const screen = await render(<Harness onReset={onReset} />);
  await screen.getByRole("button", { name: "Display" }).click();
  const surface = document.querySelector<HTMLElement>(
    '[data-slot="display-menu-content"]',
  )!;
  for (const row of surface.querySelectorAll<HTMLElement>(
    '[data-slot="display-menu-row"]',
  ))
    expect(getComputedStyle(row).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(document.querySelector('[data-slot="display-menu-reset"]')).toBeNull();
  await screen.getByRole("switch", { name: "Show closed" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Reset to default" }))
    .toBeVisible();
  await expectNoA11yViolations(surface);
  await screen.getByRole("button", { name: "Reset to default" }).click();
  expect(onReset).toHaveBeenCalled();
});

test("Columns drills in within the same surface: eye toggles, Show all, back", async () => {
  const screen = await render(<Harness />);
  await screen.getByRole("button", { name: "Display" }).click();
  await expect.element(screen.getByText("2 of 3")).toBeVisible();
  await screen.getByRole("button", { name: /Columns/ }).click();
  await screen.getByRole("button", { name: "Show Owner" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Hide Owner" }))
    .toBeVisible();
  // The locked column has no toggle.
  expect(document.querySelector('[aria-label="Hide Name"]')).toBeNull();
  await screen.getByRole("button", { name: "Back" }).click();
  await expect.element(screen.getByText("3 of 3")).toBeVisible();
});

test("row height is a text-labelled choice", async () => {
  const screen = await render(<Harness />);
  await screen.getByRole("button", { name: "Display" }).click();
  await screen.getByRole("button", { name: "Compact" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Compact" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("nothing to show: no tool", async () => {
  await render(<DisplayMenu />);
  expect(
    document.querySelector('[data-slot="display-menu-trigger"]'),
  ).toBeNull();
});
