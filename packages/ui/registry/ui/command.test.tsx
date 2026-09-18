import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

/*
 * The eleven SPEC behaviours that used to live in `command.characterization.test.tsx` are ported
 * into this file, each marked `SPEC:`. That file pinned the RETIRED Base UI Combobox build; the
 * reset put `command` back on upstream's cmdk, which is the engine the spec was originally captured
 * against, so every one of the eleven is expressible again — including the two the Combobox build
 * could not honour (disabled-skip in navigation, and `value` controlling the highlight).
 */

/** The palette every test drives, as static children — cmdk registers items from the DOM. */
function Palette({
  items = ["Calendar", "Calculator", "Settings"].map((label) => ({ label })),
  onSelect,
  ...rootProps
}: {
  items?: { label: string; disabled?: boolean }[];
  onSelect?: (value: string) => void;
} & React.ComponentProps<typeof Command>) {
  return (
    <Command {...rootProps}>
      <CommandInput
        placeholder="Type a command…"
        aria-label="Command palette"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tools">
          {items.map((item) => (
            <CommandItem
              key={item.label}
              disabled={item.disabled}
              onSelect={(value) => onSelect?.(value)}
            >
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/**
 * The rows cmdk currently renders, in DOM order. cmdk UNMOUNTS a row that scores zero rather than
 * hiding it, so "in the DOM" and "visible to the user" are the same set. Scoped to the render's own
 * container: several `render()` calls accumulate in the page across a file.
 */
const rows = (root: ParentNode): string[] =>
  [...root.querySelectorAll('[data-slot="command-item"]')].map(
    (el) => el.textContent?.trim() ?? "",
  );

/**
 * The row cmdk has under the keyboard cursor. `="true"` is load-bearing: cmdk writes
 * `data-selected="false"` on every OTHER row, so a bare `[data-selected]` matches all of them and
 * would silently report the first row as active forever.
 */
const activeRow = (root: ParentNode): string | null => {
  const el = root.querySelector(
    '[data-slot="command-item"][data-selected="true"]',
  );
  return el ? (el.textContent?.trim() ?? "") : null;
};

const announcer = (root: ParentNode) =>
  root.querySelector('[data-slot="announcer"]') as HTMLElement | null;

// --- Usage / Composition ----------------------------------------------------------------------

test("every exported part renders inside one palette (Usage, Composition)", async () => {
  const screen = await render(
    <Command>
      <CommandInput placeholder="Type…" aria-label="Command palette" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
  const root = screen.container;
  expect(root.querySelector('[data-slot="command"]')).not.toBeNull();
  expect(root.querySelector('[data-slot="command-input"]')).not.toBeNull();
  expect(root.querySelector('[data-slot="command-list"]')).not.toBeNull();
  expect(root.querySelectorAll('[data-slot="command-group"]').length).toBe(2);
  expect(root.querySelector('[data-slot="command-separator"]')).not.toBeNull();
  expect(root.querySelector('[data-slot="command-shortcut"]')).not.toBeNull();
  expect(rows(root)).toEqual(["Calendar", "Profile⌘P"]);
  // The input is the combobox; the list is the listbox it controls.
  const input = root.querySelector('[data-slot="command-input"]')!;
  expect(input.getAttribute("role")).toBe("combobox");
  expect(
    root.querySelector('[data-slot="command-list"]')!.getAttribute("role"),
  ).toBe("listbox");
  expect(input.getAttribute("aria-controls")).toBe(
    root.querySelector('[data-slot="command-list"]')!.id,
  );
});

test("CommandDialog puts the palette inside a dialog (Basic)", async () => {
  await render(
    <CommandDialog open title="Command Palette" description="Run a command.">
      <Palette />
    </CommandDialog>,
  );
  const content = document.querySelector(
    '[data-slot="dialog-content"]',
  ) as HTMLElement;
  expect(content).not.toBeNull();
  expect(content.querySelector('[data-slot="command"]')).not.toBeNull();
  expect(rows(content)).toEqual(["Calendar", "Calculator", "Settings"]);
});

// --- About: the cmdk engine -------------------------------------------------------------------

test("the engine unmounts a row that scores zero rather than hiding it (About)", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).fill("calc");
  expect(rows(screen.container)).toEqual(["Calculator"]);
  // Not merely `hidden`/`aria-hidden`: the element is gone.
  expect(
    screen.container.querySelectorAll('[data-slot="command-item"]').length,
  ).toBe(1);
});

// --- SPEC (ported from command.characterization.test.tsx) --------------------------------------

test("SPEC filtering: typing narrows to matches; clearing restores all", async () => {
  const screen = await render(<Palette />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.fill("calc");
  expect(rows(screen.container)).toEqual(["Calculator"]);
  await input.fill("");
  // Membership, not order: cmdk RE-ORDERS the list by score while a query is live and does not put
  // the source order back when the query clears, so the restored set is what "restores all" means.
  expect([...rows(screen.container)].sort()).toEqual([
    "Calculator",
    "Calendar",
    "Settings",
  ]);
});

test("SPEC filtering: the better match ranks first", async () => {
  const screen = await render(
    <Palette items={[{ label: "Profile" }, { label: "Preferences" }]} />,
  );
  await screen.getByRole("combobox", { name: "Command palette" }).fill("pre");
  // Both match, so this is ranking rather than filtering: "Preferences" is a prefix hit and
  // "Profile" only a scattered one, and cmdk sorts the DOM by score.
  expect(rows(screen.container)).toEqual(["Preferences", "Profile"]);
});

test("SPEC filtering: no match shows the Empty slot", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).fill("zzz");
  await expect
    .element(screen.getByText("No results found."))
    .toBeInTheDocument();
  expect(rows(screen.container)).toEqual([]);
});

test("SPEC arrows: ArrowDown/ArrowUp move the active row", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  expect(activeRow(screen.container)).toBe("Calendar");
  await userEvent.keyboard("{ArrowDown}");
  expect(activeRow(screen.container)).toBe("Calculator");
  await userEvent.keyboard("{ArrowUp}");
  expect(activeRow(screen.container)).toBe("Calendar");
});

test("SPEC Home/End: jump to the first and last row", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{End}");
  expect(activeRow(screen.container)).toBe("Settings");
  await userEvent.keyboard("{Home}");
  expect(activeRow(screen.container)).toBe("Calendar");
});

test("SPEC loop: with loop, ArrowUp from the first row wraps to the last", async () => {
  const screen = await render(<Palette loop />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowUp}");
  expect(activeRow(screen.container)).toBe("Settings");
});

test("SPEC no-loop: ArrowUp from the first row stays on the first", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowUp}");
  expect(activeRow(screen.container)).toBe("Calendar");
});

test("SPEC disabled-skip: arrow navigation steps over a disabled row", async () => {
  const screen = await render(
    <Palette
      items={[
        { label: "Alpha" },
        { label: "Beta", disabled: true },
        { label: "Gamma" },
      ]}
    />,
  );
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  expect(activeRow(screen.container)).toBe("Alpha");
  await userEvent.keyboard("{ArrowDown}");
  expect(activeRow(screen.container)).toBe("Gamma");
});

test("SPEC Enter activates the active row (onSelect fires with its value)", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Palette onSelect={onSelect} />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{Enter}");
  expect(activeRow(screen.container)).toBe("Calculator");
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("Calculator");
});

test("SPEC disabled: a disabled row never fires onSelect", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <Palette items={[{ label: "Beta", disabled: true }]} onSelect={onSelect} />,
  );
  const row = screen.container.querySelector(
    '[data-slot="command-item"]',
  ) as HTMLElement;
  expect(row.getAttribute("aria-disabled")).toBe("true");
  // `force`: Playwright refuses to click a control it considers unavailable, and forcing is what
  // proves the row is inert rather than merely unreachable.
  await userEvent.click(row, { force: true });
  expect(onSelect).not.toHaveBeenCalled();
});

test("SPEC controlled value: the controlled value is the active row", async () => {
  function Controlled() {
    const [value, setValue] = React.useState("Settings");
    return <Palette value={value} onValueChange={setValue} />;
  }
  const screen = await render(<Controlled />);
  expect(activeRow(screen.container)).toBe("Settings");
});

test("SPEC async: rows that appear later become filterable and navigable", async () => {
  function AsyncPalette() {
    const [items, setItems] = React.useState<{ label: string }[]>([]);
    React.useEffect(() => {
      const timer = setTimeout(() => setItems([{ label: "Late item" }]), 50);
      return () => clearTimeout(timer);
    }, []);
    return <Palette items={items} />;
  }
  const screen = await render(<AsyncPalette />);
  await expect.element(screen.getByText("Late item")).toBeInTheDocument();
  await screen.getByRole("combobox", { name: "Command palette" }).fill("late");
  expect(rows(screen.container)).toEqual(["Late item"]);
  expect(activeRow(screen.container)).toBe("Late item");
});

test("SPEC IME: an Enter mid-composition does not activate a row", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Palette onSelect={onSelect} />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.click();
  const el = input.element() as HTMLInputElement;
  el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
  el.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      keyCode: 229,
      isComposing: true,
      bubbles: true,
    }),
  );
  expect(onSelect).not.toHaveBeenCalled();
  el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
});

// --- Shortcuts / Groups / Scrollable / RTL -----------------------------------------------------

test("a shortcut hint rides at the end of its row (Shortcuts)", async () => {
  const screen = await render(
    <Command>
      <CommandInput placeholder="Type…" aria-label="Command palette" />
      <CommandList>
        <CommandGroup heading="Settings">
          <CommandItem>
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
  const shortcut = screen.container.querySelector(
    '[data-slot="command-shortcut"]',
  ) as HTMLElement;
  expect(shortcut.textContent).toBe("⌘P");
  expect(shortcut.closest('[data-slot="command-item"]')).not.toBeNull();
  // A row that carries a shortcut hides the trailing check, so the two never share the slot.
  expect(shortcut.className).toContain("ms-auto");
});

test("groups carry headings and a separator divides them (Groups)", async () => {
  const screen = await render(
    <Command>
      <CommandInput placeholder="Type…" aria-label="Command palette" />
      <CommandList>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
  const root = screen.container;
  expect(
    [...root.querySelectorAll("[cmdk-group-heading]")].map((el) =>
      el.textContent?.trim(),
    ),
  ).toEqual(["Suggestions", "Settings"]);
  expect(root.querySelector('[data-slot="command-separator"]')).not.toBeNull();
});

test("the list is bounded and scrolls (Scrollable)", async () => {
  const many = Array.from({ length: 40 }, (_, index) => ({
    label: `Command ${index}`,
  }));
  const screen = await render(<Palette items={many} />);
  const list = screen.container.querySelector(
    '[data-slot="command-list"]',
  ) as HTMLElement;
  expect(rows(screen.container).length).toBe(40);
  // The bound and the scroll are the list's own contract; `test/geometry.browser.test.tsx` measures
  // the rendered result, because this lane compiles no CSS.
  expect(list.className).toContain("max-h-72");
  expect(list.className).toContain("overflow-y-auto");
  expect(list.className).toContain("scroll-py-1");
});

test("RTL: the palette inherits direction from its container (RTL)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Palette />
    </div>,
  );
  const root = screen.container.querySelector(
    '[data-slot="command"]',
  ) as HTMLElement;
  expect(getComputedStyle(root).direction).toBe("rtl");
});

// --- Decision IDs from packages/ui/upstream/patches/command.patch -------------------------------

test("INT-1: no rendered row forces the default cursor", async () => {
  const screen = await render(<Palette />);
  const items = [
    ...screen.container.querySelectorAll('[data-slot="command-item"]'),
  ];
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    expect(item.className).not.toContain("cursor-default");
  }
});

test("A11Y-4: one polite region is mounted, and empty, from the first render", async () => {
  const screen = await render(<Palette />);
  const regions = [
    ...screen.container.querySelectorAll('[data-slot="announcer"]'),
  ];
  expect(regions.length).toBe(1);
  const region = regions[0] as HTMLElement;
  expect(region.getAttribute("role")).toBe("status");
  expect(region.getAttribute("aria-live")).toBe("polite");
  // Mounted EMPTY: a live region inserted at the moment it has content is frequently not spoken.
  expect(region.textContent).toBe("");
});

test("A11Y-3: narrowing the list announces the result count politely", async () => {
  const screen = await render(<Palette />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.fill("cal");
  await expect
    .poll(() => announcer(screen.container)?.textContent)
    .toBe("2 results");
  await input.fill("calc");
  await expect
    .poll(() => announcer(screen.container)?.textContent)
    .toBe("1 result");
  await input.fill("zzz");
  await expect
    .poll(() => announcer(screen.container)?.textContent)
    .toBe("0 results");
  // Polite, never assertive: the region is a `status`, and nothing here is a `role="alert"`.
  expect(
    screen.container.querySelector('[role="alert"], [aria-live="assertive"]'),
  ).toBeNull();
});

test("A11Y-7: the list is a listbox with results and roleless without them", async () => {
  const screen = await render(<Palette />);
  const list = screen.container.querySelector(
    '[data-slot="command-list"]',
  ) as HTMLElement;
  expect(list.getAttribute("role")).toBe("listbox");
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.fill("zzz");
  // Zero options, so it is not a listbox — which is what keeps the empty message from being an
  // invalid listbox child (axe `aria-required-children`, critical).
  await expect.poll(() => list.getAttribute("role")).toBe(null);
  await input.fill("cal");
  await expect.poll(() => list.getAttribute("role")).toBe("listbox");
});

test("A11Y-3: the empty message carries role=status, never inside a listbox", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).fill("zzz");
  const empty = screen.container.querySelector(
    '[data-slot="command-empty"]',
  ) as HTMLElement;
  const status = empty.querySelector('[role="status"]') as HTMLElement;
  expect(status).not.toBeNull();
  expect(status.textContent).toBe("No results found.");
  expect(status.closest('[role="listbox"]')).toBeNull();
});

// --- Accessibility ------------------------------------------------------------------------------

test("no a11y violations — rest", async () => {
  const screen = await render(<Palette />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — filtered", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).fill("cal");
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — empty", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).fill("zzz");
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside the dialog", async () => {
  await render(
    <CommandDialog open title="Command Palette" description="Run a command.">
      <Palette />
    </CommandDialog>,
  );
  // Portaled: audit the document rather than the render container.
  await expectNoA11yViolations(document.body);
});
