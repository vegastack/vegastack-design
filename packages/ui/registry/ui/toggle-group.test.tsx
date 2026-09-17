import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
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
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const screen = await render(
        <Group variant={variant} size={size} defaultValue={["a"]}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </Group>,
      );
      const item = screen.getByRole("button", { name: "A" });
      await expect.element(item).toHaveAttribute("data-variant", variant);
      await expect.element(item).toHaveAttribute("data-size", size);
      screen.unmount();
    }
  }
});

test("each size tier gives the item a different control height (Size)", async () => {
  const heights = new Map([
    ["sm", "h-7"],
    ["default", "h-8"],
    ["lg", "h-9"],
  ] as const);
  for (const [size, height] of heights) {
    const screen = await render(
      <Group size={size} defaultValue={["a"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </Group>,
    );
    await expect
      .element(screen.getByRole("button", { name: "A" }))
      .toHaveClass(height);
    screen.unmount();
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
