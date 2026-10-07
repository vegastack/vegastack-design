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

test("placement=title is an outlined, rounded chip", async () => {
  const screen = await render(
    <SpacePicker spaces={SPACES} value="general" placement="title" />,
  );
  const chip = screen.getByRole("button", { name: "Space: General" });
  await expect.element(chip).toHaveAttribute("data-size", "title");
  await expect.element(chip).toHaveAttribute("data-variant", "outline");
  expect(chip.element().className).toContain("rounded-full");
});

test("each space is one line: no second line, even when `secondary` is given", async () => {
  const screen = await render(
    <SpacePicker
      spaces={SPACES.map((item) => ({
        ...item,
        secondary: "Everyone · 14 members",
      }))}
      value="general"
    />,
  );
  await screen.getByRole("button", { name: "Space: General" }).click();
  await expect
    .element(screen.getByText("You can view, not add, here"))
    .toBeVisible();
  expect(document.body.textContent).not.toContain("Everyone · 14 members");
  expect(
    document.querySelector(
      '[data-slot="space-picker"] [data-slot="item-description"]',
    ),
  ).toBeNull();
});

test("a read-only chip for a hidden space shows the hint's words and glyph", async () => {
  const screen = await render(
    <>
      <SpaceChip
        readOnly
        size="xs"
        space={null}
        hint={{ kind: "personal", ownerName: "Priya" }}
      />
      <SpaceChip readOnly size="xs" space={null} hint={{ kind: "private" }} />
    </>,
  );
  const chips = screen.container.querySelectorAll('[data-slot="space-chip"]');
  expect(chips[0]!.textContent).toBe("Priya's My space");
  expect(chips[0]!.querySelector("svg")?.getAttribute("class")).toContain(
    "lucide-user-lock",
  );
  expect(chips[1]!.textContent).toBe("Private space");
  await expectNoA11yViolations(screen.container);
});
