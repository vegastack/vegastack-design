import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { ItemContent, ItemDescription, ItemTitle } from "./item";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="dropdown-menu-${name}"]`);
const slots = (name: string) => [
  ...document.querySelectorAll<HTMLElement>(
    `[data-slot="dropdown-menu-${name}"]`,
  ),
];

/** Every class string in a subtree. SVG `className` is an SVGAnimatedString, so filter to strings. */
const classStrings = (root: ParentNode) =>
  [...root.querySelectorAll("*")]
    .map((element) => element.className)
    .filter((value): value is string => typeof value === "string");

/** Upstream's "Complex" menu in miniature: one of every part, in one popup. */
function Everything({
  defaultOpen,
  contentProps,
}: {
  defaultOpen?: boolean;
  contentProps?: React.ComponentProps<typeof DropdownMenuContent>;
} = {}) {
  const [checked, setChecked] = React.useState(false);
  const [position, setPosition] = React.useState("bottom");

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent {...contentProps}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={(next) => setChecked(next === true)}
          >
            Status Bar
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A menu whose ONLY row is the submenu trigger, so one ArrowDown always lands on it. */
function WithSubmenu({ defaultOpen }: { defaultOpen?: boolean } = {}) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
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

test("renders a menu-button trigger, closed (Usage)", async () => {
  const screen = await render(<Everything />);
  const trigger = screen.getByRole("button", { name: "Open" });
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "dropdown-menu-trigger");
  await expect.element(trigger).toHaveAttribute("aria-haspopup", "menu");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(slot("content")).toBeNull();
});

test("opening portals a role=menu popup carrying every part (Usage, Composition)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));

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

test("Escape closes the popup and returns focus to the trigger (Usage)", async () => {
  const screen = await render(<Everything />);
  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);
  expect(slot("content")).not.toBeNull();
  await userEvent.keyboard("{Escape}");
  // `aria-expanded`, not the popup's presence: the popup plays an exit animation, so the element
  // outlives the state change by a frame or two and "is it gone" would be a timing assertion.
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await expect.element(trigger).toHaveFocus();
});

test("a disabled item stays in the menu and reports itself disabled (Basic)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const disabled = slots("item").find((item) => item.textContent === "API");
  expect(disabled).toBeDefined();
  expect(disabled!.hasAttribute("data-disabled")).toBe(true);
  expect(disabled!.getAttribute("aria-disabled")).toBe("true");
});

test("ArrowRight on the sub trigger opens the submenu (Submenu)", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const subTrigger = slot("sub-trigger");
  expect(subTrigger).not.toBeNull();
  expect(subTrigger!.getAttribute("aria-haspopup")).toBe("menu");

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");

  await expect.element(screen.getByText("Email")).toBeInTheDocument();
  expect(slot("sub-content")).not.toBeNull();
});

test("a shortcut renders at the inline end of its row (Shortcuts)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const shortcut = slot("shortcut");
  expect(shortcut).not.toBeNull();
  expect(shortcut!.textContent).toBe("⇧⌘P");
  expect(shortcut!.className).toContain("ms-auto");
  expect(shortcut!.closest('[data-slot="dropdown-menu-item"]')).not.toBeNull();
});

test("a leading icon renders inside the row (Icons)", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <svg aria-hidden="true" data-testid="row-icon" />
          Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const item = slot("item");
  expect(item!.querySelector('[data-testid="row-icon"]')).not.toBeNull();
  // The row sizes its own icons, which is why a lucide component never takes a `size` prop here.
  expect(item!.className).toContain("[&_svg:not([class*='size-'])]:size-4");
});

test("a checkbox item toggles aria-checked (Checkboxes)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const checkbox = screen.getByRole("menuitemcheckbox", { name: "Status Bar" });
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
  await userEvent.click(checkbox);
  await expect.element(checkbox).toHaveAttribute("aria-checked", "true");
});

test("a checkbox item keeps its own indicator column beside a leading icon (Checkboxes Icons)", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked>
          <svg aria-hidden="true" data-testid="leading-icon" />
          Email notifications
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const row = slot("checkbox-item")!;
  expect(row.querySelector('[data-testid="leading-icon"]')).not.toBeNull();
  const indicator = slot("checkbox-item-indicator");
  expect(indicator).not.toBeNull();
  expect(row.contains(indicator)).toBe(true);
  expect(indicator!.className).toContain("end-2");
});

test("a radio group selects exactly one value (Radio Group)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const top = screen.getByRole("menuitemradio", { name: "Top" });
  const bottom = screen.getByRole("menuitemradio", { name: "Bottom" });
  await expect.element(bottom).toHaveAttribute("aria-checked", "true");
  await expect.element(top).toHaveAttribute("aria-checked", "false");

  await userEvent.click(top);
  // Base UI does NOT close the menu when a radio (or checkbox) item is activated — `closeOnClick`
  // is false for those parts, so several can be set in one visit. Pin that, then read the group
  // in place.
  //
  // This test used to click the trigger again "to reopen". The menu was never closed, so that
  // click CLOSED it; the two assertions below then passed only while the popup was still on
  // screen playing its exit animation, and once it unmounted they retried for the full locator
  // timeout — a 15s failure on a loaded CI runner, and a false pass everywhere else.
  await expect
    .element(screen.getByRole("button", { name: "Open" }))
    .toHaveAttribute("aria-expanded", "true");
  await expect.element(top).toHaveAttribute("aria-checked", "true");
  await expect.element(bottom).toHaveAttribute("aria-checked", "false");
});

test("a radio item renders its leading icon and its indicator (Radio Icons)", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value="card">
          <DropdownMenuRadioItem value="card">
            <svg aria-hidden="true" data-testid="card-icon" />
            Credit Card
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const row = slot("radio-item")!;
  expect(row.querySelector('[data-testid="card-icon"]')).not.toBeNull();
  expect(row.contains(slot("radio-item-indicator"))).toBe(true);
  expect(row.getAttribute("aria-checked")).toBe("true");
});

test("variant=destructive is recorded on the row (Destructive)", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const rows = slots("item");
  const destructive = rows.find((row) => row.textContent === "Delete")!;
  expect(destructive.getAttribute("data-variant")).toBe("destructive");
  // The default is explicit, so a row is never ambiguous about which tone it carries.
  expect(rows[0]!.getAttribute("data-variant")).toBe("default");
});

test("the trigger composes an arbitrary element through render (Avatar)", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" aria-label="Account" />}
      >
        <img src="data:," alt="" data-testid="avatar" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const trigger = screen.getByRole("button", { name: "Account" });
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "dropdown-menu-trigger");
  expect(
    (trigger.element() as HTMLElement).querySelector('[data-testid="avatar"]'),
  ).not.toBeNull();
  await userEvent.click(trigger);
  expect(slot("content")).not.toBeNull();
});

test("submenus nest to a second level (Complex)", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Open Recent</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More Projects</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Project Gamma</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("More Projects")).toBeInTheDocument();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Project Gamma")).toBeInTheDocument();
  expect(slots("sub-content").length).toBe(2);
});

test("RTL: the popup mirrors when the document direction is rtl (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Everything contentProps={{ dir: "rtl" }} />
    </div>,
  );
  const trigger = screen.getByRole("button", { name: "Open" });
  expect(getComputedStyle(trigger.element() as HTMLElement).direction).toBe(
    "rtl",
  );
  await userEvent.click(trigger);
  // The popup portals to <body>, so it does not inherit `dir` — it is set on the popup, which is
  // exactly what upstream's own RTL example does.
  expect(getComputedStyle(slot("content")!).direction).toBe("rtl");
  // Every logical class the mirroring depends on is written in logical properties.
  expect(slot("shortcut")!.className).toContain("ms-auto");
  expect(slot("checkbox-item")!.className).toContain("ps-1.5");
});

test("INT-1: no menu row forces the default cursor", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  const rows = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot^="dropdown-menu-"][role]',
    ),
  ];
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) expect(row.className).not.toContain("cursor-default");
});

test("FRM-4: a disabled row keeps its pointer events", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const disabled = slots("item").find((item) => item.textContent === "API")!;
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
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const positioner = slot("content")!.parentElement!;
  expect(positioner.className).toContain("vs-scope-under-test");
  expect(positioner.className).toContain("isolate");
});

test("OVL-13: the exported DropdownMenuPortal scopes a display:contents wrapper", async () => {
  await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuPortal>
          <span data-testid="escape-hatch">portaled</span>
        </DropdownMenuPortal>
      </DropdownMenu>
    </InternalThemeScopeProvider>,
  );
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
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const positioner = slot("content")!.parentElement!;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-scope-under-test");
});

test("OVL-14: a container sends the popup into that element instead of <body>", async () => {
  // Upstream forwards no container, so the portal lands under `<body>` — which the Fullscreen API
  // paints a fullscreen element OVER, hiding the menu. `container` is the one escape hatch, and
  // `DropdownMenuSubContent` inherits it by BEING a `DropdownMenuContent`.
  function Host() {
    const [host, setHost] = React.useState<HTMLElement | undefined>(undefined);
    return (
      <div>
        <div ref={(node) => setHost(node ?? undefined)} data-testid="host" />
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent container={host}>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent container={host}>
                <DropdownMenuItem>Archive</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  const screen = await render(<Host />);
  const host = screen.container.querySelector(
    '[data-testid="host"]',
  ) as HTMLElement;
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  expect(
    host.querySelector('[data-slot="dropdown-menu-content"]'),
  ).not.toBeNull();

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Archive")).toBeInTheDocument();
  expect(
    host.querySelector('[data-slot="dropdown-menu-sub-content"]'),
  ).not.toBeNull();
});

test("OVL-14: with no container the popup keeps upstream's <body> default", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const content = slot("content")!;
  expect(screen.container.contains(content)).toBe(false);
  expect(document.body.contains(content)).toBe(true);
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
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
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  expectBorderNotRing(slot("content")!);
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Email")).toBeInTheDocument();
  expectBorderNotRing(slot("sub-content")!);
});

test("A11Y-13: a focused destructive row reads through the -text ink on its tint", async () => {
  const screen = await render(<Everything />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
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
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — submenu open", async () => {
  const screen = await render(<WithSubmenu />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByText("Email")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});

// ── D3 (Regent #138, DS-10): a disabled row keeps focus and carries its reason ────────────────
// No source hunk and no FRM-4 extension: Base UI's `useMenuItem` builds every row with
// `focusableWhenDisabled: true` and the menu root passes no `disabledIndices`, so arrow keys
// already land on a disabled row. This pins that engine behaviour, plus API-19's description line.
test("D3: arrow keys reach a disabled item and Enter does nothing", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem disabled onClick={onClick}>
          <ItemContent>
            <ItemTitle>Download data sheet</ItemTitle>
            <ItemDescription>No specs yet</ItemDescription>
          </ItemContent>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await userEvent.keyboard("{ArrowDown}{ArrowDown}");
  const item = screen.getByRole("menuitem", { name: /Download data sheet/ });
  await expect.element(item).toHaveFocus();
  await expect.element(item).toHaveAccessibleDescription("No specs yet");
  await userEvent.keyboard("{Enter}");
  expect(onClick).not.toHaveBeenCalled();
});

/** API-19: every row kind — item, checkbox item, radio item — links a composed description. */
function DescriptionRows() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Plain</DropdownMenuItem>
        <DropdownMenuItem>
          <ItemContent>
            <ItemTitle>Download CSV</ItemTitle>
            <ItemDescription>Every row, for a spreadsheet</ItemDescription>
          </ItemContent>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem checked>
          <ItemContent>
            <ItemTitle>Show ruler</ItemTitle>
            <ItemDescription>Guides snap to its ticks</ItemDescription>
          </ItemContent>
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="compact">
          <DropdownMenuRadioItem value="compact">
            <ItemContent>
              <ItemTitle>Compact</ItemTitle>
              <ItemDescription>Fits more rows</ItemDescription>
            </ItemContent>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

test("API-19: item, checkbox and radio rows each take their ItemDescription as the accessible description", async () => {
  const screen = await render(<DescriptionRows />);
  // `defaultOpen`: the popup is already mounted.
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
  // `defaultOpen`: the popup is already mounted.
  await expect
    .element(screen.getByRole("menuitem", { name: /Download CSV/ }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
