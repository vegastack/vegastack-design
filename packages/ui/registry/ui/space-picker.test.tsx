import "../../test/geometry.css";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { SpaceChip, SpacePicker, type SpacePickerItem } from "./space-picker";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "./property-list";

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
  expect(chip.element().className).toContain("rounded-chip");
});

test("each space is one line: no second line", async () => {
  const screen = await render(<SpacePicker spaces={SPACES} value="general" />);
  await screen.getByRole("button", { name: "Space: General" }).click();
  await expect
    .element(screen.getByText("You can view, not add, here"))
    .toBeVisible();
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

test("a read-only title chip keeps the outlined shape without a chevron, and takes trigger props", async () => {
  const onFocus = vi.fn();
  const screen = await render(
    <SpaceChip
      readOnly
      size="title"
      space={SPACES[0]!.space}
      tabIndex={0}
      aria-describedby="why"
      onFocus={onFocus}
    />,
  );
  const chip = screen.container.querySelector<HTMLElement>(
    '[data-slot="space-chip"]',
  )!;
  expect(chip.tagName).toBe("SPAN");
  expect(chip.className).toContain("rounded-chip");
  expect(chip.className).toContain("border");
  expect(chip.querySelector('[data-slot="space-chip-chevron"]')).toBeNull();
  expect(chip.getAttribute("aria-describedby")).toBe("why");
  chip.focus();
  expect(onFocus).toHaveBeenCalled();
});

test("a ghost SpaceChip in a panel row starts where other values do, a capsule, its ▾ shown only on hover; read-only it is a link in the text colour", async () => {
  const screen = await render(
    <PropertyList variant="panel" style={{ width: 320 }}>
      <PropertyRow>
        <PropertyLabel>Status</PropertyLabel>
        <PropertyValue>Open</PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Space</PropertyLabel>
        <PropertyValue>
          <SpaceChip variant="ghost" space={SPACES[0]!.space} />
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>In</PropertyLabel>
        <PropertyValue>
          <SpaceChip
            variant="ghost"
            readOnly
            href="/spaces/general"
            space={SPACES[0]!.space}
          />
        </PropertyValue>
      </PropertyRow>
    </PropertyList>,
  );
  const values = screen.container.querySelectorAll(
    '[data-slot="property-value"]',
  );
  const column = values[0]!.getBoundingClientRect().left;
  const [chip, link] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="space-chip"]',
  );
  // 6px of padding hung outside the value: the tile starts on the value column.
  const tile = chip!.firstElementChild!.getBoundingClientRect().left;
  expect(Math.round(tile - column)).toBe(0);
  // The ghost chips' capsule, not a button's 8px corner.
  expect(
    parseFloat(getComputedStyle(chip!).borderTopLeftRadius),
  ).toBeGreaterThanOrEqual(12);
  expect(Math.round(chip!.getBoundingClientRect().height)).toBe(24);
  const chevron = chip!.querySelector('[data-slot="space-chip-chevron"]')!;
  expect(getComputedStyle(chevron).opacity).toBe("0");
  await userEvent.hover(chip!);
  await expect.poll(() => getComputedStyle(chevron).opacity).toBe("1");
  expect(link!.tagName).toBe("A");
  expect(link!.getAttribute("href")).toBe("/spaces/general");
  expect(getComputedStyle(link!).color).toBe(
    getComputedStyle(values[0]!).color,
  );
  await expectNoA11yViolations(screen.container);
});

test('placement="property" is the ghost chip, a dashed pill while empty, and onClear offers "No space"', async () => {
  const onClear = vi.fn();
  const screen = await render(
    <PropertyList variant="panel" style={{ width: 320 }}>
      <PropertyRow>
        <PropertyLabel>Status</PropertyLabel>
        <PropertyValue>Open</PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Space</PropertyLabel>
        <PropertyValue>
          <SpacePicker
            spaces={SPACES}
            value={null}
            placement="property"
            placeholder="Add space"
            onClear={onClear}
          />
        </PropertyValue>
      </PropertyRow>
    </PropertyList>,
  );
  // The popover trigger takes the chip's slot name; find it by its name.
  const chip = screen
    .getByRole("button", { name: "Space: none chosen" })
    .element() as HTMLElement;
  expect(chip.getAttribute("data-chip")).toBe("ghost");
  expect(getComputedStyle(chip).borderTopStyle).toBe("dashed");
  expect(chip.querySelector('[data-slot="space-chip-icon"]')).toBeNull();
  // Hung like every ghost value: the prompt starts on the value column (5px + 1px border = 6px).
  const column = screen.container
    .querySelector('[data-slot="property-value"]')!
    .getBoundingClientRect().left;
  const prompt = chip.querySelector("span")!.getBoundingClientRect().left;
  expect(Math.round(prompt - column)).toBe(0);
  await userEvent.click(chip);
  await userEvent.click(screen.getByRole("option", { name: "No space" }));
  expect(onClear).toHaveBeenCalledOnce();
});
