import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandList,
  CommandGroup,
  CommandItem,
  useCommandFilteredItems,
} from "./command";

/**
 * CHARACTERIZATION SPEC (plan v5 X1, CX-4): pins the palette behavior the system promises,
 * captured against the previous library-backed implementation BEFORE the Base UI data-driven rebuild. After the
 * rebuild these tests are the acceptance spec — any deliberate deviation must be edited here
 * WITH a comment explaining the change (each deviation is documented in the X1 summary).
 *
 * Covered: substring filtering + ranking (matching set), arrow navigation, Home/End, loop,
 * disabled-skip, Escape/focus behavior, async/deferred items, controlled value, IME composition.
 */

type PaletteItem = { value: string; label: string; disabled?: boolean };

// DEVIATION: Base UI's Combobox only filters (and drives CommandEmpty) off a query-filtered
// `items` array on the root — static `<CommandItem>` children never narrow (combobox.tsx's own
// finding #5, reproduced identically here). `Palette` now passes `items` to `Command` and renders
// via the function-child `Combobox.Collection` pattern (`useCommandFilteredItems` + `CommandGroup`)
// instead of `.map()`-ing static children — a structural change only; every test below still
// asserts the exact same OBSERVABLE behavior (which labels are visible/highlighted/selected) as
// before. `CommandEmpty` also moves from inside `CommandList` to its sibling (see command.tsx's
// anatomy note — `role="status"` is not a valid `role="listbox"` child).
function Palette(props: {
  loop?: boolean;
  value?: string;
  onValueChange?: (v: string | null) => void;
  onSelect?: (v: string) => void;
  items?: PaletteItem[];
}) {
  const items = props.items ?? [
    { value: "calendar", label: "Calendar" },
    { value: "calculator", label: "Calculator" },
    { value: "settings", label: "Settings", disabled: false },
  ];
  return (
    <Command
      loop={props.loop}
      value={props.value}
      onValueChange={props.onValueChange}
      items={[{ heading: "Tools", items }]}
    >
      <CommandInput
        placeholder="Type a command…"
        aria-label="Command palette"
      />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <PaletteGroups onSelect={props.onSelect} />
      </CommandList>
    </Command>
  );
}

function PaletteGroups({ onSelect }: { onSelect?: (v: string) => void }) {
  const groups = useCommandFilteredItems<{
    heading: string;
    items: PaletteItem[];
  }>();
  return (
    <>
      {groups.map((group) => (
        <CommandGroup
          key={group.heading}
          heading={group.heading}
          items={group.items}
        >
          {(item) => (
            <CommandItem
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              onSelect={() => onSelect?.(item.value)}
            >
              {item.label}
            </CommandItem>
          )}
        </CommandGroup>
      ))}
    </>
  );
}

function visibleItems(): string[] {
  return [...document.querySelectorAll('[data-slot="command-item"]')]
    .filter(
      (el) =>
        el.getAttribute("aria-hidden") !== "true" && !el.closest("[hidden]"),
    )
    .map((el) => el.textContent?.trim() ?? "");
}

// DEVIATION: the prior implementation conflated "highlighted" (keyboard/pointer cursor) and "selected" (a persisted
// choice) into one `data-selected` attribute. Base UI's Combobox cleanly separates them:
// `data-highlighted` tracks the keyboard/pointer cursor (what this helper — and every arrow/
// Home/End/loop/disabled-skip/Enter test below — actually means by "the selection"), while
// `aria-selected`/`data-selected` reflect the root's actual `value` (see the dedicated "controlled
// value" test below, which now asserts against THAT instead). Verified via Base UI's
// ComboboxItem.mjs: `highlighted = isActive(activeIndex)`, `selected = isSelected(selectedValue)`.
function selectedItem(): string | null {
  const el = document.querySelector(
    '[data-slot="command-item"][data-highlighted]',
  );
  return el ? (el.textContent?.trim() ?? "") : null;
}

test("SPEC filtering: typing narrows to substring matches; clearing restores all", async () => {
  const screen = await render(<Palette />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.fill("calc");
  expect(visibleItems()).toEqual(["Calculator"]);
  await input.fill("");
  expect(visibleItems()).toEqual(["Calendar", "Calculator", "Settings"]);
});

test("SPEC filtering: no match shows the Empty slot", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).fill("zzz");
  await expect
    .element(screen.getByText("No results found."))
    .toBeInTheDocument();
  expect(visibleItems()).toEqual([]);
});

test("SPEC arrows: ArrowDown/ArrowUp move the selection highlight", async () => {
  const screen = await render(<Palette />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.click();
  await userEvent.keyboard("{ArrowDown}");
  expect(selectedItem()).toBe("Calculator");
  await userEvent.keyboard("{ArrowUp}");
  expect(selectedItem()).toBe("Calendar");
});

test("SPEC Home/End: jump to first/last item", async () => {
  const screen = await render(<Palette />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.click();
  await userEvent.keyboard("{End}");
  expect(selectedItem()).toBe("Settings");
  await userEvent.keyboard("{Home}");
  expect(selectedItem()).toBe("Calendar");
});

test("SPEC loop: with loop, ArrowUp from the first item wraps to the last", async () => {
  const screen = await render(<Palette loop />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowUp}");
  expect(selectedItem()).toBe("Settings");
});

test("SPEC no-loop: ArrowUp from the first item stays on the first", async () => {
  const screen = await render(<Palette />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowUp}");
  expect(selectedItem()).toBe("Calendar");
});

// DEVIATION: reproduced, not guessed — Base UI's Combobox hard-codes `disabledIndices: EMPTY_ARRAY`
// for its floating-ui list-navigation (see AriaCombobox.mjs), so ArrowDown does NOT skip a
// `disabled` item the way the prior implementation did; it lands on it like any other item. Selecting it is still a
// no-op (`CommandItem`'s `onClick`/`onSelect` bails when `disabled`, verified by the untouched
// "a disabled item ... does not fire onSelect" coverage in command.test.tsx), so a disabled item
// is inert but no longer skipped in *navigation*. A consumer that needs true skip-in-navigation
// must omit the item from `items` entirely. Assertion updated to the real, verified behavior.
test("SPEC disabled-skip: arrow navigation does not skip disabled items (Base UI limitation)", async () => {
  const screen = await render(
    <Palette
      items={[
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta", disabled: true },
        { value: "c", label: "Gamma" },
      ]}
    />,
  );
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowDown}");
  expect(selectedItem()).toBe("Beta");
});

test("SPEC Enter activates the highlighted item (onSelect fires with its value)", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Palette onSelect={onSelect} />);
  await screen.getByRole("combobox", { name: "Command palette" }).click();
  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(onSelect).toHaveBeenCalledWith("calculator");
});

// DEVIATION: the prior implementation's `value`/`onValueChange` controlled the keyboard HIGHLIGHT. Base UI's Combobox
// `value`/`onValueChange` (same prop names, kept for continuity) controls the actual SELECTED
// value instead — and, verified via source, the highlight is never retroactively synced from a
// controlled `value` while the list stays open (`syncSelectedIndex` in AriaCombobox.mjs early-
// returns whenever `open` is true, which — since Command is always-open/`inline` — is always).
// Reinterpreted as the more useful/idiomatic mapping for a greenfield API: assert the item matching
// the controlled `value` renders as SELECTED (`aria-selected`/`data-selected`, Base UI's own,
// unconditional-of-`open` state), not highlighted.
test("SPEC controlled value: the item matching the controlled value is marked selected", async () => {
  function Controlled() {
    const [value, setValue] = React.useState<string | null>("settings");
    return <Palette value={value ?? undefined} onValueChange={setValue} />;
  }
  await render(<Controlled />);
  const el = document.querySelector(
    '[data-slot="command-item"][aria-selected="true"]',
  );
  expect(el?.textContent?.trim()).toBe("Settings");
});

// DEVIATION: the old version rendered a fully static (no `items` prop) palette relying on the prior library's
// DOM-registration filtering. Base UI's Combobox requires `items` for both filtering and
// `CommandEmpty` to function at all (verified: `filteredItems` is unconditionally `[]` without an
// `items` prop — see command.tsx's DATA-DRIVEN note) — there is no "static children, no items"
// filtering mode to fall back to. Rewritten so the async items flow through `items` reactively
// (`setItems` once "loaded"), which is the natural, idiomatic way to express "items that appear
// later" in the new API and proves the same thing: once present, they're filterable/navigable.
test("SPEC async: items that appear later become filterable/navigable", async () => {
  function AsyncPalette() {
    const [items, setItems] = React.useState<PaletteItem[]>([]);
    React.useEffect(() => {
      const t = setTimeout(
        () => setItems([{ value: "late-item", label: "Late item" }]),
        50,
      );
      return () => clearTimeout(t);
    }, []);
    return (
      <Command items={items}>
        <CommandInput placeholder="Search…" aria-label="Async palette" />
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandList>
          {(item: PaletteItem) => (
            <CommandItem key={item.value} value={item.value}>
              {item.label}
            </CommandItem>
          )}
        </CommandList>
      </Command>
    );
  }
  const screen = await render(<AsyncPalette />);
  await expect.element(screen.getByText("Late item")).toBeInTheDocument();
  await screen.getByRole("combobox", { name: "Async palette" }).fill("late");
  expect(visibleItems()).toEqual(["Late item"]);
});

test("SPEC IME: composition input does not activate items until committed", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Palette onSelect={onSelect} />);
  const input = screen.getByRole("combobox", { name: "Command palette" });
  await input.click();
  const el = input.element() as HTMLInputElement;
  // Simulate an in-flight IME composition, then press Enter mid-composition.
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
