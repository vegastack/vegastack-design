import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { ItemContent, ItemDescription, ItemTitle } from "./item";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="context-menu-${name}"]`);
const slots = (name: string) => [
  ...document.querySelectorAll<HTMLElement>(
    `[data-slot="context-menu-${name}"]`,
  ),
];

/** Every class string in a subtree. SVG `className` is an SVGAnimatedString, so filter to strings. */
const classStrings = (root: ParentNode) =>
  [...root.querySelectorAll("*")]
    .map((element) => element.className)
    .filter((value): value is string => typeof value === "string");

/**
 * A real secondary-button click through Playwright, not a synthesised `contextmenu` event: the
 * whole point of this component is that the platform gesture opens it, and a dispatched event
 * would pass even if the trigger stopped listening for the real one.
 */
const rightClick = (element: Element) =>
  userEvent.click(element as HTMLElement, { button: "right" });

/** Padding keeps the pointer away from the viewport edges, so the positioner never has to flip. */
function Frame({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 160 }}>{children}</div>;
}

/** One of every part, in one popup. */
function Everything({
  contentProps,
}: {
  contentProps?: React.ComponentProps<typeof ContextMenuContent>;
} = {}) {
  const [checked, setChecked] = React.useState(false);
  const [theme, setTheme] = React.useState("light");

  return (
    <Frame>
      <ContextMenu>
        <ContextMenuTrigger>Right click here</ContextMenuTrigger>
        <ContextMenuContent {...contentProps}>
          <ContextMenuGroup>
            <ContextMenuLabel>Navigation</ContextMenuLabel>
            <ContextMenuItem>
              Back
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>Forward</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>View</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={checked}
              onCheckedChange={(next) => setChecked(next === true)}
            >
              Show Bookmarks Bar
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Theme</ContextMenuLabel>
            <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
              <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
              <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Frame>
  );
}

/** A menu whose ONLY row is the submenu trigger, so one ArrowDown always lands on it. */
function WithSubmenu() {
  return (
    <Frame>
      <ContextMenu>
        <ContextMenuTrigger>Right click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Save Page...</ContextMenuItem>
              <ContextMenuItem>Developer Tools</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </Frame>
  );
}

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

/** A11Y-13: the destructive row's focused ink is the `-text` ink, never the fill, on its own tint. */
function expectDestructiveTextInk(row: HTMLElement) {
  const tokens = row.className.split(/\s+/);
  expect(tokens).toContain(
    "data-[variant=destructive]:focus:bg-destructive/10",
  );
  expect(tokens).toContain(
    "data-[variant=destructive]:focus:text-destructive-text",
  );
  expect(tokens).not.toContain(
    "data-[variant=destructive]:focus:text-destructive",
  );
}

test("renders the trigger surface, closed (Usage)", async () => {
  const screen = await render(<Everything />);
  const trigger = screen.getByText("Right click here");
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "context-menu-trigger");
  expect(slot("content")).toBeNull();
});

test("a right-click on the trigger opens a role=menu popup (Usage, Composition)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());

  const popup = slot("content");
  expect(popup).not.toBeNull();
  expect(popup!.getAttribute("role")).toBe("menu");
  // Portaled: the popup is not inside the component's own container subtree.
  expect(screen.container.contains(popup)).toBe(false);

  expect(slots("group").length).toBe(3);
  expect(slots("label").length).toBe(3);
  expect(slots("item").length).toBe(3);
  expect(slots("separator").length).toBe(3);
  expect(slot("shortcut")).not.toBeNull();
  expect(slot("checkbox-item")).not.toBeNull();
  expect(slot("radio-group")).not.toBeNull();
  expect(slots("radio-item").length).toBe(2);
});

test("Escape closes the popup (Usage)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  expect(slot("content")).not.toBeNull();
  await userEvent.keyboard("{Escape}");
  // The trigger's own open flag, not the popup's presence: the popup plays an exit animation, so
  // the element outlives the state change by a frame or two.
  await expect
    .element(screen.getByText("Right click here"))
    .not.toHaveAttribute("data-popup-open");
});

test("a disabled row stays in the menu and reports itself disabled (Basic)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const disabled = slots("item").find((item) => item.textContent === "Forward");
  expect(disabled).toBeDefined();
  expect(disabled!.hasAttribute("data-disabled")).toBe(true);
  expect(disabled!.getAttribute("aria-disabled")).toBe("true");
});

test("ArrowRight on the sub trigger opens the submenu (Submenu)", async () => {
  const screen = await render(<WithSubmenu />);
  await rightClick(screen.getByText("Right click here").element());
  const subTrigger = slot("sub-trigger");
  expect(subTrigger).not.toBeNull();
  expect(subTrigger!.getAttribute("aria-haspopup")).toBe("menu");

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");

  await expect.element(screen.getByText("Developer Tools")).toBeInTheDocument();
  expect(slot("sub-content")).not.toBeNull();
});

test("a shortcut renders at the inline end of its row (Shortcuts)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const shortcut = slot("shortcut");
  expect(shortcut).not.toBeNull();
  expect(shortcut!.textContent).toBe("⌘[");
  expect(shortcut!.className).toContain("ms-auto");
  expect(shortcut!.closest('[data-slot="context-menu-item"]')).not.toBeNull();
});

test("groups, labels and separators divide the popup (Groups)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const labels = slots("label").map((label) => label.textContent);
  expect(labels).toEqual(["Navigation", "View", "Theme"]);
  for (const label of slots("label"))
    expect(label.closest('[data-slot="context-menu-group"]')).not.toBeNull();
  expect(slots("separator").length).toBe(3);
});

test("a leading icon renders inside the row (Icons)", async () => {
  const screen = await render(
    <Frame>
      <ContextMenu>
        <ContextMenuTrigger>Right click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <svg aria-hidden="true" data-testid="row-icon" />
            Copy
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Frame>,
  );
  await rightClick(screen.getByText("Right click here").element());
  const item = slot("item")!;
  expect(item.querySelector('[data-testid="row-icon"]')).not.toBeNull();
  // The row sizes its own icons, which is why a lucide component never takes a `size` prop here.
  expect(item.className).toContain("[&_svg:not([class*='size-'])]:size-4");
});

test("a checkbox item toggles aria-checked (Checkboxes)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const checkbox = screen.getByRole("menuitemcheckbox", {
    name: "Show Bookmarks Bar",
  });
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
  await userEvent.click(checkbox);
  await expect.element(checkbox).toHaveAttribute("aria-checked", "true");
});

test("a radio group selects exactly one value (Radio)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Light" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Dark" }))
    .toHaveAttribute("aria-checked", "false");

  // A radio row does not close the menu, so the selection is observed in place — reopening would
  // mean right-clicking through Base UI's own inert backdrop.
  await userEvent.click(screen.getByRole("menuitemradio", { name: "Dark" }));
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Dark" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Light" }))
    .toHaveAttribute("aria-checked", "false");
});

test("variant=destructive is recorded on the row (Destructive)", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const rows = slots("item");
  const destructive = rows.find((row) => row.textContent === "Delete")!;
  expect(destructive.getAttribute("data-variant")).toBe("destructive");
  expect(rows[0]!.getAttribute("data-variant")).toBe("default");
});

test("side=top places the popup above the pointer (Sides)", async () => {
  const screen = await render(<Everything contentProps={{ side: "top" }} />);
  await rightClick(screen.getByText("Right click here").element());
  expect(slot("content")!.getAttribute("data-side")).toBe("top");
});

test("side=bottom places the popup below the pointer (Sides)", async () => {
  const screen = await render(<Everything contentProps={{ side: "bottom" }} />);
  await rightClick(screen.getByText("Right click here").element());
  expect(slot("content")!.getAttribute("data-side")).toBe("bottom");
});

test("RTL: the popup mirrors when the direction is rtl (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Everything contentProps={{ dir: "rtl" }} />
    </div>,
  );
  const trigger = screen.getByText("Right click here");
  expect(getComputedStyle(trigger.element() as HTMLElement).direction).toBe(
    "rtl",
  );
  await rightClick(trigger.element());
  // The popup portals to <body>, so it does not inherit `dir` — it is set on the popup, which is
  // exactly what upstream's own RTL example does.
  expect(getComputedStyle(slot("content")!).direction).toBe("rtl");
  expect(slot("shortcut")!.className).toContain("ms-auto");
  expect(slot("checkbox-item")!.className).toContain("ps-1.5");
});

test("INT-1: no menu row forces the default cursor", async () => {
  const screen = await render(<WithSubmenu />);
  await rightClick(screen.getByText("Right click here").element());
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  const rows = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot^="context-menu-"][role]',
    ),
  ];
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) expect(row.className).not.toContain("cursor-default");
});

test("FRM-4: a disabled row keeps its pointer events", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const disabled = slots("item").find(
    (item) => item.textContent === "Forward",
  )!;
  expect(disabled.hasAttribute("data-disabled")).toBe(true);
  // `[&_svg]:pointer-events-none` is upstream's icon rule and stays; what FRM-4 removed is the
  // ROW's own disabled rule, so name it exactly.
  expect(disabled.className).not.toContain("data-disabled:pointer-events-none");
  // The computed result is what a Tooltip would need, so assert that rather than the class alone.
  expect(getComputedStyle(disabled).pointerEvents).not.toBe("none");
});

test("OVL-13: the content's positioner re-applies the theme scope inside the portal", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Everything />
    </InternalThemeScopeProvider>,
  );
  await rightClick(screen.getByText("Right click here").element());
  const positioner = slot("content")!.parentElement!;
  expect(positioner.className).toContain("vs-scope-under-test");
  expect(positioner.className).toContain("isolate");
});

test("OVL-13: the exported ContextMenuPortal scopes a display:contents wrapper", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Frame>
        <ContextMenu>
          <ContextMenuTrigger>Right click here</ContextMenuTrigger>
          <ContextMenuPortal>
            <span data-testid="escape-hatch">portaled</span>
          </ContextMenuPortal>
        </ContextMenu>
      </Frame>
    </InternalThemeScopeProvider>,
  );
  await rightClick(screen.getByText("Right click here").element());
  const child = document.querySelector<HTMLElement>(
    '[data-testid="escape-hatch"]',
  );
  expect(child).not.toBeNull();
  const wrapper = child!.parentElement!;
  expect(wrapper.className).toContain("contents");
  expect(wrapper.className).toContain("vs-scope-under-test");
});

test("OVL-13: with no scope in the tree the positioner keeps only its own classes", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const positioner = slot("content")!.parentElement!;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-scope-under-test");
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow", async () => {
  const screen = await render(<WithSubmenu />);
  await rightClick(screen.getByText("Right click here").element());
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  for (const classes of [
    ...classStrings(screen.container),
    ...classStrings(document.body),
  ]) {
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]/);
    expect(classes).not.toContain("focus-visible:ring-");
  }
});

test("BRD-1: the content and the sub-content draw a real border, not a ring outline", async () => {
  const screen = await render(<WithSubmenu />);
  await rightClick(screen.getByText("Right click here").element());
  expectBorderNotRing(slot("content")!);
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Developer Tools")).toBeInTheDocument();
  expectBorderNotRing(slot("sub-content")!);
});

test("A11Y-13: a focused destructive row reads through the -text ink on its tint", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  const destructive = slots("item").find(
    (row) => row.textContent === "Delete",
  )!;
  expectDestructiveTextInk(destructive);
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Everything />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Everything />);
  await rightClick(screen.getByText("Right click here").element());
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — submenu open", async () => {
  const screen = await render(<WithSubmenu />);
  await rightClick(screen.getByText("Right click here").element());
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Developer Tools")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});

// ── D3 (Regent #138, DS-10): a disabled row keeps focus and carries its reason ────────────────
// No source hunk and no FRM-4 extension: Base UI's `useMenuItem` builds every row with
// `focusableWhenDisabled: true` and the menu root passes no `disabledIndices`, so arrow keys
// already land on a disabled row. This pins that engine behaviour, plus API-19's description line.
test("D3: arrow keys reach a disabled item and Enter does nothing", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <Frame>
      <ContextMenu>
        <ContextMenuTrigger>Right click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Edit</ContextMenuItem>
          <ContextMenuItem disabled onClick={onClick}>
            <ItemContent>
              <ItemTitle>Download data sheet</ItemTitle>
              <ItemDescription>No specs yet</ItemDescription>
            </ItemContent>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Frame>,
  );
  await rightClick(screen.getByText("Right click here").element());
  // One key per settled focus: a second key sent while the first still moves focus into the
  // popup is dropped (macOS Chromium measured it).
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByRole("menuitem", { name: "Edit" }))
    .toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  const item = screen.getByRole("menuitem", { name: /Download data sheet/ });
  await expect.element(item).toHaveFocus();
  await expect.element(item).toHaveAccessibleDescription("No specs yet");
  await userEvent.keyboard("{Enter}");
  expect(onClick).not.toHaveBeenCalled();
});

/** API-19: every row kind — item, checkbox item, radio item — links a composed description. */
function DescriptionRows() {
  return (
    <Frame>
      <ContextMenu>
        <ContextMenuTrigger>Right click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Plain</ContextMenuItem>
          <ContextMenuItem>
            <ItemContent>
              <ItemTitle>Download CSV</ItemTitle>
              <ItemDescription>Every row, for a spreadsheet</ItemDescription>
            </ItemContent>
          </ContextMenuItem>
          <ContextMenuCheckboxItem checked>
            <ItemContent>
              <ItemTitle>Show ruler</ItemTitle>
              <ItemDescription>Guides snap to its ticks</ItemDescription>
            </ItemContent>
          </ContextMenuCheckboxItem>
          <ContextMenuRadioGroup value="compact">
            <ContextMenuRadioItem value="compact">
              <ItemContent>
                <ItemTitle>Compact</ItemTitle>
                <ItemDescription>Fits more rows</ItemDescription>
              </ItemContent>
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Frame>
  );
}

test("API-19: item, checkbox and radio rows each take their ItemDescription as the accessible description", async () => {
  const screen = await render(<DescriptionRows />);
  await rightClick(screen.getByText("Right click here").element());
  await expect
    .element(screen.getByRole("menuitem", { name: /Download CSV/ }))
    .toHaveAccessibleDescription("Every row, for a spreadsheet");
  await expect
    .element(screen.getByRole("menuitemcheckbox", { name: /Show ruler/ }))
    .toHaveAccessibleDescription("Guides snap to its ticks");
  await expect
    .element(screen.getByRole("menuitemradio", { name: /Compact/ }))
    .toHaveAccessibleDescription("Fits more rows");
  // A one-line row names no description: the row only points at one that registered.
  const plain = screen.getByRole("menuitem", { name: "Plain" }).element();
  expect(plain.hasAttribute("aria-describedby")).toBe(false);
});

test("no a11y violations — open, with description rows", async () => {
  const screen = await render(<DescriptionRows />);
  await rightClick(screen.getByText("Right click here").element());
  await expect
    .element(screen.getByRole("menuitem", { name: /Download CSV/ }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
