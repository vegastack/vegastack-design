import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { SpaceChip, SpacePicker, type SpacePickerItem } from "./space-picker";

const SPACES: SpacePickerItem[] = [
  { id: "general", space: { name: "General", access: "open", hue: "blue" } },
  { id: "mine", space: { name: "My space", access: "personal" } },
  {
    id: "sales",
    space: { name: "Sales", access: "private", hue: "green" },
    disabled: "You can view, not add, here",
  },
];

test("SpaceChip shows the tile, the name and a chevron; readOnly is plain text", async () => {
  const screen = await render(
    <>
      <SpaceChip space={SPACES[0]!.space} />
      <SpaceChip size="xs" readOnly space={SPACES[0]!.space} />
      <SpaceChip />
    </>,
  );
  const chips = screen.container.querySelectorAll('[data-slot="space-chip"]');
  expect(chips[0]!.tagName).toBe("BUTTON");
  expect(
    chips[0]!.querySelector('[data-slot="space-chip-chevron"]'),
  ).not.toBeNull();
  expect(chips[1]!.tagName).toBe("SPAN");
  expect(chips[1]!.hasAttribute("data-readonly")).toBe(true);
  expect(chips[2]!.textContent).toContain("Choose a space");
  await expectNoA11yViolations(screen.container);
});

test("SpacePicker lists My space first, checks the current one, explains a disabled row, and picks", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <SpacePicker
      spaces={SPACES}
      value="general"
      onValueChange={onValueChange}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Space: General" });
  await trigger.click();
  const options = document.querySelectorAll('[data-slot="space-picker-item"]');
  expect(options[0]!.textContent).toContain("My space");
  expect(
    document.querySelector(
      '[data-slot="space-picker-item"][data-checked="true"]',
    )?.textContent,
  ).toContain("General");
  await expect
    .element(screen.getByText("You can view, not add, here"))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await userEvent.keyboard("My");
  await userEvent.keyboard("{Enter}");
  expect(onValueChange).toHaveBeenCalledWith("mine");
});

test("placement=title sizes the chip for a dialog title", async () => {
  const screen = await render(
    <SpacePicker spaces={SPACES} value="general" placement="title" />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Space: General" }))
    .toHaveAttribute("data-size", "title");
});
