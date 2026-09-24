import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { ItemContent, ItemDescription, ItemTitle } from "./item";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="menubar-${name}"]`);
const slots = (name: string) => [
  ...document.querySelectorAll<HTMLElement>(`[data-slot="menubar-${name}"]`),
];

/** Every class string in a subtree. SVG `className` is an SVGAnimatedString, so filter to strings. */
const classStrings = (root: ParentNode) =>
  [...root.querySelectorAll("*")]
    .map((element) => element.className)
    .filter((value): value is string => typeof value === "string");

/** Padding keeps the bar away from the viewport edges, so the positioner never has to flip. */
function Frame({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 80 }}>{children}</div>;
}

/** One of every part, across two menus on one bar. */
function Everything({
  contentProps,
}: {
  contentProps?: React.ComponentProps<typeof MenubarContent>;
} = {}) {
  const [checked, setChecked] = React.useState(false);
  const [profile, setProfile] = React.useState("benoit");

  return (
    <Frame>
      <Menubar {...(contentProps?.dir ? { dir: contentProps.dir } : {})}>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent {...contentProps}>
            <MenubarGroup>
              <MenubarLabel>Document</MenubarLabel>
              <MenubarItem>
                New Tab <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>New Incognito Window</MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>View</MenubarLabel>
              <MenubarCheckboxItem
                checked={checked}
                onCheckedChange={(next) => setChecked(next === true)}
              >
                Full URLs
              </MenubarCheckboxItem>
              <MenubarCheckboxItem disabled>Bookmarks Bar</MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Profile</MenubarLabel>
              <MenubarRadioGroup value={profile} onValueChange={setProfile}>
                <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Delete</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent {...contentProps}>
            <MenubarItem>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Frame>
  );
}

/** A menu whose ONLY row is the submenu trigger, so one ArrowDown always lands on it. */
function WithSubmenu() {
  return (
    <Frame>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email link</MenubarItem>
                <MenubarItem>Messages</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
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

test("renders a role=menubar bar of triggers, all menus closed (Usage)", async () => {
  const screen = await render(<Everything />);
  const bar = screen.container.querySelector('[data-slot="menubar"]')!;
  expect(bar.getAttribute("role")).toBe("menubar");
  expect(slots("trigger").map((trigger) => trigger.textContent)).toEqual([
    "File",
    "Edit",
  ]);
  expect(slot("content")).toBeNull();
});

test("clicking a trigger opens its role=menu popup with every part (Usage, Composition)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));

  const popup = slot("content");
  expect(popup).not.toBeNull();
  expect(popup!.getAttribute("role")).toBe("menu");
  // Portaled: the popup is not inside the bar's own container subtree.
  expect(screen.container.contains(popup)).toBe(false);

  expect(slots("group").length).toBe(3);
  expect(slots("label").length).toBe(3);
  expect(slots("item").length).toBe(3);
  expect(slots("separator").length).toBe(3);
  expect(slot("shortcut")).not.toBeNull();
  expect(slots("checkbox-item").length).toBe(2);
  expect(slot("radio-group")).not.toBeNull();
  expect(slots("radio-item").length).toBe(2);
});

test("with one menu open, ArrowRight moves along the bar and opens the next (Usage)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  await expect.element(screen.getByText("Document")).toBeInTheDocument();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Undo")).toBeInTheDocument();
  // The File menu's own rows are gone: a menubar shows one menu at a time.
  expect(slot("radio-group")).toBeNull();
});

test("a checkbox item toggles aria-checked (Checkbox)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  const checkbox = screen.getByRole("menuitemcheckbox", { name: "Full URLs" });
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
  await userEvent.click(checkbox);
  await expect.element(checkbox).toHaveAttribute("aria-checked", "true");
});

test("a radio group selects exactly one value (Radio)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Benoit" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Andy" }))
    .toHaveAttribute("aria-checked", "false");

  // A radio row does not close the menu, so the selection is observed in place.
  await userEvent.click(screen.getByRole("menuitemradio", { name: "Andy" }));
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Andy" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Benoit" }))
    .toHaveAttribute("aria-checked", "false");
});

test("ArrowRight on the sub trigger opens the submenu (Submenu)", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByText("File"));
  const subTrigger = slot("sub-trigger");
  expect(subTrigger).not.toBeNull();
  expect(subTrigger!.getAttribute("aria-haspopup")).toBe("menu");

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");

  await expect.element(screen.getByText("Messages")).toBeInTheDocument();
  expect(slot("sub-content")).not.toBeNull();
});

test("a leading icon renders inside the row, and destructive is recorded (With Icons)", async () => {
  const screen = await render(
    <Frame>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <svg aria-hidden="true" data-testid="row-icon" />
              New File
            </MenubarItem>
            <MenubarItem variant="destructive">
              <svg aria-hidden="true" data-testid="delete-icon" />
              Delete
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Frame>,
  );
  await userEvent.click(screen.getByText("File"));
  const [first, second] = slots("item") as [HTMLElement, HTMLElement];
  expect(first.querySelector('[data-testid="row-icon"]')).not.toBeNull();
  expect(first.getAttribute("data-variant")).toBe("default");
  expect(second.getAttribute("data-variant")).toBe("destructive");
  // The row sizes its own icons, which is why a lucide component never takes a `size` prop here.
  expect(first.className).toContain("[&_svg:not([class*='size-'])]:size-4");
});

test("a shortcut renders at the inline end of its row (Usage)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  const shortcut = slot("shortcut")!;
  expect(shortcut.textContent).toBe("⌘T");
  expect(shortcut.className).toContain("ms-auto");
  expect(shortcut.closest('[data-slot="menubar-item"]')).not.toBeNull();
});

test("a disabled row stays in the menu and reports itself disabled (Usage)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  const disabled = slots("item").find(
    (item) => item.textContent === "New Incognito Window",
  );
  expect(disabled).toBeDefined();
  expect(disabled!.hasAttribute("data-disabled")).toBe(true);
  expect(disabled!.getAttribute("aria-disabled")).toBe("true");
});

test("RTL: the bar and the popup mirror when the direction is rtl (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Everything contentProps={{ dir: "rtl" }} />
    </div>,
  );
  const bar = screen.container.querySelector('[data-slot="menubar"]')!;
  expect(getComputedStyle(bar as HTMLElement).direction).toBe("rtl");
  await userEvent.click(screen.getByText("File"));
  // The popup portals to <body>, so it does not inherit `dir` — it is set on the popup, which is
  // exactly what upstream's own RTL example does.
  expect(getComputedStyle(slot("content")!).direction).toBe("rtl");
  // The indicator column and the shortcut are written in logical properties.
  expect(slot("checkbox-item")!.className).toContain("ps-7");
  expect(slot("shortcut")!.className).toContain("ms-auto");
});

test("INT-1: no menu row forces the default cursor — including menubar's own two", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  const rows = [
    ...document.querySelectorAll<HTMLElement>('[data-slot^="menubar-"][role]'),
  ];
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) expect(row.className).not.toContain("cursor-default");
  // The two parts menubar renders from `Menu` itself, named so the patch's scope stays honest.
  for (const row of [...slots("checkbox-item"), ...slots("radio-item")])
    expect(row.className).not.toContain("cursor-default");
});

test("FRM-4: a disabled row keeps its pointer events — including menubar's own two", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  const disabledItem = slots("item").find(
    (item) => item.textContent === "New Incognito Window",
  )!;
  const disabledCheckbox = slots("checkbox-item").find(
    (item) => item.textContent === "Bookmarks Bar",
  )!;
  for (const row of [disabledItem, disabledCheckbox]) {
    expect(row.hasAttribute("data-disabled")).toBe(true);
    // `[&_svg]:pointer-events-none` is upstream's icon rule and stays; what FRM-4 removed is the
    // ROW's own disabled rule, so name it exactly.
    expect(row.className).not.toContain("data-disabled:pointer-events-none");
    // The computed result is what a Tooltip would need, so assert that rather than the class.
    expect(getComputedStyle(row).pointerEvents).not.toBe("none");
  }
});

test("OVL-13: menubar's popup carries the theme scope although its patch has NO hunk", async () => {
  // Menubar opens no portal of its own — `MenubarContent` wraps `DropdownMenuContent`, which does.
  // This is the assertion that keeps the patch's "no hunk" claim honest: the day that composition
  // changes, this fails rather than the scope going quiet.
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Everything />
    </InternalThemeScopeProvider>,
  );
  await userEvent.click(screen.getByText("File"));
  const popup = slot("content")!;
  expect(screen.container.contains(popup)).toBe(false);
  const positioner = popup.parentElement!;
  expect(positioner.className).toContain("vs-scope-under-test");
  expect(positioner.className).toContain("isolate");
});

test("OVL-13: a menubar submenu's popup carries the theme scope too", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <WithSubmenu />
    </InternalThemeScopeProvider>,
  );
  await userEvent.click(screen.getByText("File"));
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Messages")).toBeInTheDocument();
  expect(slot("sub-content")!.parentElement!.className).toContain(
    "vs-scope-under-test",
  );
});

test("OVL-13: the exported MenubarPortal scopes a display:contents wrapper", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Frame>
        <Menubar>
          <MenubarMenu defaultOpen>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarPortal>
              <span data-testid="escape-hatch">portaled</span>
            </MenubarPortal>
          </MenubarMenu>
        </Menubar>
      </Frame>
    </InternalThemeScopeProvider>,
  );
  expect(
    screen.container.querySelector('[data-slot="menubar"]'),
  ).not.toBeNull();
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
  await userEvent.click(screen.getByText("File"));
  const positioner = slot("content")!.parentElement!;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-scope-under-test");
});

test("FOC-1: the trigger does not suppress the outline base.css owns", async () => {
  const screen = await render(<Everything />);
  const trigger = slots("trigger")[0]!;
  expect(trigger.className).not.toContain("outline-hidden");
  expect(trigger.className).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  // A trigger is a real focusable control — `role="menuitem"` in the bar's roving tab order — so
  // the one 2px `:focus-visible` outline has to reach it. `test/geometry.browser.test.tsx`
  // measures the rendered result; this holds the class contract that lets it.
  expect(trigger.getAttribute("role")).toBe("menuitem");
  await userEvent.click(screen.getByText("File"));
  // The two item parts KEEP `outline-hidden`: they replace the outline with `focus:bg-accent`,
  // which is the sanctioned substitute affordance. This holds that exemption to the parts it was
  // written for rather than letting it spread back to the trigger.
  for (const row of [...slots("checkbox-item"), ...slots("radio-item")]) {
    expect(row.className).toContain("outline-hidden");
    expect(row.className).toContain("focus:bg-accent");
  }
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByText("File"));
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
  await userEvent.click(screen.getByText("File"));
  expectBorderNotRing(slot("content")!);
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Messages")).toBeInTheDocument();
  expectBorderNotRing(slot("sub-content")!);
});

test("A11Y-13: a focused destructive row reads through the -text ink on its tint", async () => {
  const screen = await render(
    <Frame>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem variant="destructive">Delete</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Frame>,
  );
  await userEvent.click(screen.getByText("File"));
  expectDestructiveTextInk(slots("item")[0]!);
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Everything />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByText("File"));
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — submenu open", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByText("File"));
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Messages")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});

// ── D3 (Regent #138, DS-10): a disabled row keeps focus and carries its reason ────────────────
// No source hunk and no FRM-4 extension: Base UI's `useMenuItem` builds every row — the item,
// menubar's own checkbox item and radio item alike — with `focusableWhenDisabled: true`, and the
// menu root passes no `disabledIndices`, so arrow keys already land on a disabled row. This pins
// that engine behaviour for all three row kinds, plus API-19's description line on each.
function DisabledRows({
  onClick,
  onCheckedChange,
  onValueChange,
}: {
  onClick: () => void;
  onCheckedChange: () => void;
  onValueChange: () => void;
}) {
  return (
    <Frame>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Edit</MenubarItem>
            <MenubarItem disabled onClick={onClick}>
              <ItemContent>
                <ItemTitle>Download data sheet</ItemTitle>
                <ItemDescription>No specs yet</ItemDescription>
              </ItemContent>
            </MenubarItem>
            <MenubarCheckboxItem
              disabled
              checked={false}
              onCheckedChange={onCheckedChange}
            >
              <ItemContent>
                <ItemTitle>Show ruler</ItemTitle>
                <ItemDescription>Only in page view</ItemDescription>
              </ItemContent>
            </MenubarCheckboxItem>
            <MenubarRadioGroup value="light" onValueChange={onValueChange}>
              <MenubarRadioItem value="dark" disabled>
                <ItemContent>
                  <ItemTitle>Dark</ItemTitle>
                  <ItemDescription>Managed by your admin</ItemDescription>
                </ItemContent>
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Frame>
  );
}

test("D3: arrow keys reach disabled item, checkbox and radio rows, and Enter does nothing", async () => {
  const onClick = vi.fn();
  const onCheckedChange = vi.fn();
  const onValueChange = vi.fn();
  const screen = await render(
    <DisabledRows
      onClick={onClick}
      onCheckedChange={onCheckedChange}
      onValueChange={onValueChange}
    />,
  );
  await userEvent.click(screen.getByText("File"));
  await expect.element(screen.getByText("Edit")).toBeInTheDocument();

  // One key per settled focus: a second key sent while the first is still moving focus into the
  // popup is dropped (macOS Chromium measured it every run).
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByRole("menuitem", { name: "Edit" }))
    .toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  const item = screen.getByRole("menuitem", { name: /Download data sheet/ });
  await expect.element(item).toHaveFocus();
  await expect.element(item).toHaveAccessibleDescription("No specs yet");
  await userEvent.keyboard("{Enter}");

  await userEvent.keyboard("{ArrowDown}");
  const checkbox = screen.getByRole("menuitemcheckbox", { name: /Show ruler/ });
  await expect.element(checkbox).toHaveFocus();
  await expect
    .element(checkbox)
    .toHaveAccessibleDescription("Only in page view");
  await userEvent.keyboard("{Enter}");

  await userEvent.keyboard("{ArrowDown}");
  const radio = screen.getByRole("menuitemradio", { name: /Dark/ });
  await expect.element(radio).toHaveFocus();
  await expect
    .element(radio)
    .toHaveAccessibleDescription("Managed by your admin");
  await userEvent.keyboard("{Enter}");

  expect(onClick).not.toHaveBeenCalled();
  expect(onCheckedChange).not.toHaveBeenCalled();
  expect(onValueChange).not.toHaveBeenCalled();
});

/** API-19: every row kind — item, checkbox item, radio item — links a composed description. */
function DescriptionRows() {
  return (
    <Frame>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Plain</MenubarItem>
            <MenubarItem>
              <ItemContent>
                <ItemTitle>Download CSV</ItemTitle>
                <ItemDescription>Every row, for a spreadsheet</ItemDescription>
              </ItemContent>
            </MenubarItem>
            <MenubarCheckboxItem checked>
              <ItemContent>
                <ItemTitle>Show ruler</ItemTitle>
                <ItemDescription>Guides snap to its ticks</ItemDescription>
              </ItemContent>
            </MenubarCheckboxItem>
            <MenubarRadioGroup value="compact">
              <MenubarRadioItem value="compact">
                <ItemContent>
                  <ItemTitle>Compact</ItemTitle>
                  <ItemDescription>Fits more rows</ItemDescription>
                </ItemContent>
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Frame>
  );
}

test("API-19: item, checkbox and radio rows each take their ItemDescription as the accessible description", async () => {
  const screen = await render(<DescriptionRows />);
  await userEvent.click(screen.getByText("File"));
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
  await userEvent.click(screen.getByText("File"));
  await expect
    .element(screen.getByRole("menuitem", { name: /Download CSV/ }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
