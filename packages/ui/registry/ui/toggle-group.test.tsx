import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

/** Upstream's two variants and three size tiers, inherited from `toggle`'s recipe. */
const VARIANTS = ["default", "outline"] as const;
const SIZES = ["default", "sm", "lg"] as const;

function Group({
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroup>) {
  return (
    <ToggleGroup aria-label="Text formatting" {...props}>
      {children}
    </ToggleGroup>
  );
}

test("renders a role=group root and its items, each carrying its data-slot", async () => {
  const screen = await render(
    <Group defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const group = screen.getByRole("group", { name: "Text formatting" });
  await expect.element(group).toBeInTheDocument();
  await expect.element(group).toHaveAttribute("data-slot", "toggle-group");

  for (const name of ["A", "B"]) {
    const item = screen.getByRole("button", { name });
    await expect.element(item).toBeInTheDocument();
    await expect
      .element(item)
      .toHaveAttribute("data-slot", "toggle-group-item");
  }
});

test("single selection replaces the pressed item (Composition)", async () => {
  const screen = await render(
    <Group defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const a = screen.getByRole("button", { name: "A" });
  const b = screen.getByRole("button", { name: "B" });
  await expect.element(a).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(b);
  await expect.element(b).toHaveAttribute("aria-pressed", "true");
  await expect.element(a).toHaveAttribute("aria-pressed", "false");
});

test("multiple selection keeps both items pressed (Usage)", async () => {
  const screen = await render(
    <Group multiple defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const a = screen.getByRole("button", { name: "A" });
  const b = screen.getByRole("button", { name: "B" });
  await userEvent.click(b);
  await expect.element(a).toHaveAttribute("aria-pressed", "true");
  await expect.element(b).toHaveAttribute("aria-pressed", "true");
});

test("the group's variant and size reach every item through context (Outline, Size)", async () => {
  const screen = await render(
    <div>
      {VARIANTS.flatMap((variant) =>
        SIZES.map((size) => (
          <ToggleGroup
            key={`${variant}-${size}`}
            aria-label={`${variant} ${size} group`}
            variant={variant}
            size={size}
            defaultValue={["a"]}
          >
            <ToggleGroupItem value="a">{`${variant} ${size}`}</ToggleGroupItem>
          </ToggleGroup>
        )),
      )}
    </div>,
  );
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const item = screen.getByRole("button", { name: `${variant} ${size}` });
      await expect.element(item).toHaveAttribute("data-variant", variant);
      await expect.element(item).toHaveAttribute("data-size", size);
    }
  }
});

test("each size tier gives the item a different control height (Size)", async () => {
  const heights = [
    ["sm", "h-7"],
    ["default", "h-8"],
    ["lg", "h-9"],
  ] as const;
  const screen = await render(
    <div>
      {heights.map(([size]) => (
        <ToggleGroup
          key={size}
          aria-label={`${size} group`}
          size={size}
          defaultValue={["a"]}
        >
          <ToggleGroupItem value="a">{size}</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>,
  );
  for (const [size, height] of heights) {
    await expect
      .element(screen.getByRole("button", { name: size }))
      .toHaveClass(height);
  }
});

test("spacing is a step on the root and reaches the items (Spacing)", async () => {
  const screen = await render(
    <Group spacing={0} variant="outline" defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const group = screen.getByRole("group", { name: "Text formatting" });
  await expect.element(group).toHaveAttribute("data-spacing", "0");
  expect((group.element() as HTMLElement).style.getPropertyValue("--gap")).toBe(
    "0",
  );
  const item = screen.getByRole("button", { name: "A" });
  await expect.element(item).toHaveAttribute("data-spacing", "0");
  // The joined seams are group-scoped variants, so the item always carries them and the root's
  // `data-spacing` is what switches them on.
  await expect
    .element(item)
    .toHaveClass("group-data-[spacing=0]/toggle-group:rounded-none");
});

test("the default spacing is 2, not the pre-2026-05 joined control (Spacing)", async () => {
  const screen = await render(
    <Group defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
    </Group>,
  );
  await expect
    .element(screen.getByRole("group", { name: "Text formatting" }))
    .toHaveAttribute("data-spacing", "2");
});

test("orientation=vertical is declared on the root and drives the column classes (Vertical)", async () => {
  const screen = await render(
    <Group orientation="vertical" multiple defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const group = screen.getByRole("group", { name: "Text formatting" });
  await expect.element(group).toHaveAttribute("data-orientation", "vertical");
  await expect.element(group).toHaveClass("data-vertical:flex-col");
});

test("a disabled group disables every item (Disabled)", async () => {
  const screen = await render(
    <Group disabled>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  for (const name of ["A", "B"]) {
    const item = screen.getByRole("button", { name });
    expect((item.element() as HTMLButtonElement).disabled).toBe(true);
  }
});

test("a controlled group reports the value it was given (Custom)", async () => {
  function Controlled() {
    const [value, setValue] = React.useState<string[]>(["normal"]);
    return (
      <ToggleGroup
        aria-label="Font weight"
        value={value}
        onValueChange={(next) => setValue(next.length ? next : value)}
      >
        <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
        <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
      </ToggleGroup>
    );
  }
  const screen = await render(<Controlled />);
  const medium = screen.getByRole("button", { name: "Medium" });
  await expect.element(medium).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(medium);
  await expect.element(medium).toHaveAttribute("aria-pressed", "true");
  await expect
    .element(screen.getByRole("button", { name: "Normal" }))
    .toHaveAttribute("aria-pressed", "false");
});

test("deselectable={false} keeps the pressed item pressed", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ToggleGroup
      defaultValue={["mine"]}
      deselectable={false}
      onValueChange={onValueChange}
    >
      <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
      <ToggleGroupItem value="team">Team</ToggleGroupItem>
    </ToggleGroup>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Mine" }));
  await expect
    .element(screen.getByRole("button", { name: "Mine" }))
    .toHaveAttribute("aria-pressed", "true");
  expect(onValueChange).not.toHaveBeenCalledWith([], expect.anything());
});

test("API-23: Space on the pressed item keeps it pressed when deselectable={false}", async () => {
  const screen = await render(
    <Group defaultValue={["list"]} deselectable={false}>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
    </Group>,
  );
  const list = screen.getByRole("button", { name: "List" });
  await userEvent.tab();
  expect(document.activeElement).toBe(list.element());
  await userEvent.keyboard(" ");
  await expect.element(list).toHaveAttribute("aria-pressed", "true");
  await userEvent.keyboard("{Enter}");
  await expect.element(list).toHaveAttribute("aria-pressed", "true");
  // Moving the selection still works: the group always has exactly one view.
  await userEvent.keyboard("{ArrowRight} ");
  await expect
    .element(screen.getByRole("button", { name: "Board" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect.element(list).toHaveAttribute("aria-pressed", "false");
});

test("API-23: a controlled deselectable={false} group never reports an empty value", async () => {
  const seen: string[][] = [];
  function Controlled() {
    const [value, setValue] = React.useState<string[]>(["mine"]);
    return (
      <Group
        value={value}
        deselectable={false}
        onValueChange={(next) => {
          seen.push(next);
          setValue(next);
        }}
      >
        <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
        <ToggleGroupItem value="team">Team</ToggleGroupItem>
      </Group>
    );
  }
  const screen = await render(<Controlled />);
  await userEvent.click(screen.getByRole("button", { name: "Mine" }));
  await userEvent.click(screen.getByRole("button", { name: "Team" }));
  await userEvent.click(screen.getByRole("button", { name: "Team" }));
  await expect
    .element(screen.getByRole("button", { name: "Team" }))
    .toHaveAttribute("aria-pressed", "true");
  expect(seen).toEqual([["team"]]);
});

test("API-23: deselectable defaults to true — upstream's single mode can still empty", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Group defaultValue={["a"]} onValueChange={onValueChange}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const a = screen.getByRole("button", { name: "A" });
  await userEvent.click(a);
  await expect.element(a).toHaveAttribute("aria-pressed", "false");
  expect(onValueChange).toHaveBeenCalledWith([], expect.anything());
});

test("API-23: deselectable={false} does not apply in multiple mode", async () => {
  const screen = await render(
    <Group multiple defaultValue={["a"]} deselectable={false}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  const a = screen.getByRole("button", { name: "A" });
  await userEvent.click(a);
  await expect.element(a).toHaveAttribute("aria-pressed", "false");
});

test("API-23: deselectable and wrap never reach the DOM as attributes of their own", async () => {
  const screen = await render(
    <Group defaultValue={["a"]} deselectable={false} wrap>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
    </Group>,
  );
  const group = screen.getByRole("group").element();
  expect(group.hasAttribute("deselectable")).toBe(false);
  expect(group.hasAttribute("wrap")).toBe(false);
  expect(group.getAttribute("data-wrap")).toBe("");
});

test("API-23: wrap lets the items wrap onto rows; without it they never do", async () => {
  const screen = await render(
    <>
      <Group wrap>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </Group>
      <Group aria-label="Unwrapped">
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </Group>
    </>,
  );
  const wrapped = screen.getByRole("group", { name: "Text formatting" });
  const plain = screen.getByRole("group", { name: "Unwrapped" });
  expect(wrapped.element().className).toContain("data-wrap:flex-wrap");
  expect(plain.element().hasAttribute("data-wrap")).toBe(false);
});

const WORDS = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliet",
] as const;

test("API-23: a wrapped joined group marks each row's first and last item", async () => {
  // This lane compiles no Tailwind, so the wrap and the item widths are given inline; what is
  // under test is the row marking, which reads real layout.
  const screen = await render(
    <div style={{ width: 240 }}>
      <Group spacing={0} wrap variant="outline" style={{ flexWrap: "wrap" }}>
        {WORDS.map((word) => (
          <ToggleGroupItem
            key={word}
            value={word.toLowerCase()}
            style={{ width: 70 }}
          >
            {word}
          </ToggleGroupItem>
        ))}
      </Group>
    </div>,
  );
  const items = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="toggle-group-item"]',
    ),
  ];
  // 240px holds three 70px items per row: rows start at 0, 3, 6 and 9.
  await expect
    .poll(() =>
      items.flatMap((item, index) =>
        item.hasAttribute("data-row-start") ? [index] : [],
      ),
    )
    .toEqual([0, 3, 6, 9]);
  expect(
    items.flatMap((item, index) =>
      item.hasAttribute("data-row-end") ? [index] : [],
    ),
  ).toEqual([2, 5, 8, 9]);
  // Resizing the host re-marks the rows.
  (screen.container.firstElementChild as HTMLElement).style.width = "300px";
  await expect
    .poll(() =>
      items.flatMap((item, index) =>
        item.hasAttribute("data-row-start") ? [index] : [],
      ),
    )
    .toEqual([0, 4, 8]);
  expect(items[0]!.className).toContain(
    "group-data-wrap/toggle-group:data-[spacing=0]:data-row-start:rounded-s-lg",
  );
});

test("API-23: row marks are only written for a joined horizontal wrapped group", async () => {
  const screen = await render(
    <Group wrap>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  for (const item of screen.container.querySelectorAll(
    '[data-slot="toggle-group-item"]',
  )) {
    expect(item.hasAttribute("data-row-start")).toBe(false);
    expect(item.hasAttribute("data-row-end")).toBe(false);
  }
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Group defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — pressed, icon-only items", async () => {
  const screen = await render(
    <Group multiple defaultValue={["bold"]}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <svg aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <svg aria-hidden="true" />
      </ToggleGroupItem>
    </Group>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Group disabled>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
    </Group>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical", async () => {
  const screen = await render(
    <Group orientation="vertical" multiple defaultValue={["a"]}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
    </Group>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — deselectable={false}, pressed", async () => {
  const screen = await render(
    <Group defaultValue={["list"]} deselectable={false}>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
    </Group>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — wrapped, joined", async () => {
  const screen = await render(
    <div style={{ width: 240 }}>
      <Group spacing={0} wrap variant="outline" defaultValue={["alpha"]}>
        {WORDS.map((word) => (
          <ToggleGroupItem key={word} value={word.toLowerCase()}>
            {word}
          </ToggleGroupItem>
        ))}
      </Group>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
