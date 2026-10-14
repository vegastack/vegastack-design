/**
 * `suggestion-menu.test.tsx` — the one caret-anchored suggestion list, tested once for the three
 * editor menus that open it (TextEdit's slash and mention menus, TemplateEditor's picker).
 */

import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { Plus } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import {
  SUGGESTION_MENU_ROW,
  SuggestionMenu,
  suggestionMenuKeyDown,
  suggestionMenuOptionId,
  type SuggestionMenuOption,
  type SuggestionMenuProps,
} from "./suggestion-menu";

const OPTIONS: SuggestionMenuOption[] = [
  { key: "power", label: "Power", description: "W", group: "Specs" },
  { key: "efficacy", label: "Efficacy", description: "lm/W", group: "Specs" },
  {
    key: "pi",
    label: "Pi",
    icon: <Plus />,
    shortcut: "⌘P",
    group: "Constants",
  },
];

const anchor = () => new DOMRect(40, 40, 0, 18);

function Menu(props: Partial<SuggestionMenuProps>) {
  const [index, setIndex] = React.useState(0);
  return (
    <SuggestionMenu
      id="menu"
      aria-label="Insert placeholder"
      anchor={anchor()}
      options={OPTIONS}
      activeIndex={index}
      onActiveIndexChange={setIndex}
      onSelect={() => {}}
      {...props}
    />
  );
}

const rows = () => [
  ...document.querySelectorAll<HTMLElement>(
    '[data-slot="suggestion-menu-option"]',
  ),
];

test("renders a named listbox in a body portal, with grouped options and option ids", async () => {
  const screen = await render(<Menu />);
  const list = document.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu"]',
  )!;
  expect(list.getAttribute("role")).toBe("listbox");
  expect(list.getAttribute("aria-label")).toBe("Insert placeholder");
  // Portaled to <body>, outside the render container, inside a `contents` theme-scope layer.
  expect(screen.container.contains(list)).toBe(false);
  expect(list.parentElement?.dataset.slot).toBe("suggestion-menu-layer");
  expect(list.parentElement?.className).toContain("contents");

  expect(rows().map((row) => row.id)).toEqual(
    [0, 1, 2].map((i) => suggestionMenuOptionId("menu", i)),
  );
  const groups = document.querySelectorAll(
    '[data-slot="suggestion-menu-group"]',
  );
  expect(groups).toHaveLength(2);
  expect(groups[0]!.getAttribute("role")).toBe("group");
  const label = document.getElementById(
    groups[0]!.getAttribute("aria-labelledby")!,
  );
  expect(label?.textContent).toBe("Specs");
  expect(rows()[0]!.getAttribute("aria-selected")).toBe("true");
  expect(rows()[0]!.hasAttribute("data-highlighted")).toBe(true);
  expect(rows()[1]!.getAttribute("aria-selected")).toBe("false");
  expect(
    rows()[0]!.querySelector('[data-slot="suggestion-menu-description"]')
      ?.textContent,
  ).toBe("W");
  expect(
    rows()[2]!.querySelector('[data-slot="suggestion-menu-shortcut"]')
      ?.textContent,
  ).toBe("⌘P");
  await expectNoA11yViolations(document.body);
});

test("rows read exactly like ComboboxItem's, apart from the check-indicator gutter", async () => {
  await render(
    <Combobox items={["a"]} defaultOpen>
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="combobox-item"]'),
    ).not.toBeNull(),
  );
  const combobox = document
    .querySelector('[data-slot="combobox-item"]')!
    .className.split(/\s+/)
    .filter((token) => token !== "pe-8")
    .sort();
  const ours = SUGGESTION_MENU_ROW.split(/\s+/)
    .filter((token) => token !== "pe-1.5")
    .sort();
  expect(ours).toEqual(combobox);
  // The highlight is ComboboxItem's accent pair, never the muted ground.
  expect(SUGGESTION_MENU_ROW).toContain("data-highlighted:bg-accent");
  expect(SUGGESTION_MENU_ROW).toContain(
    "data-highlighted:text-accent-foreground",
  );
});

test("pointer movement moves the active row; a click picks it; mousedown keeps focus", async () => {
  const onSelect = vi.fn();
  await render(
    <>
      <input aria-label="Editor" />
      <Menu onSelect={onSelect} />
    </>,
  );
  const editor = document.querySelector<HTMLInputElement>("input")!;
  editor.focus();
  await userEvent.hover(rows()[1]!);
  await vi.waitFor(() =>
    expect(rows()[1]!.getAttribute("aria-selected")).toBe("true"),
  );
  await userEvent.click(rows()[2]!);
  expect(onSelect).toHaveBeenCalledWith(2);
  // The menu never takes focus: the editor keeps it (and its caret).
  expect(document.activeElement).toBe(editor);
});

test("no rows: a message instead of an empty listbox, announced politely; busy only over rows", async () => {
  const screen = await render(<Menu options={[]} />);
  const list = () =>
    document.querySelector<HTMLElement>('[data-slot="suggestion-menu"]')!;
  const status = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="suggestion-menu-status"]',
    )!;
  // The message is spoken through a polite region mounted with the menu, outside the surface.
  const region = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="suggestion-menu-layer"] > [role="status"]',
    )!;
  expect(list().getAttribute("role")).toBeNull();
  expect(status().getAttribute("role")).toBeNull();
  expect(status().textContent).toBe("No results");
  await vi.waitFor(() => expect(region().textContent).toBe("No results"));
  await expectNoA11yViolations(document.body);

  await screen.rerender(<Menu options={OPTIONS} status="Searching…" loading />);
  expect(rows()).toHaveLength(0);
  expect(status().textContent).toBe("Searching…");
  await vi.waitFor(() => expect(region().textContent).toBe("Searching…"));
  expect(list().hasAttribute("aria-busy")).toBe(false);

  // Rows on show while the next search runs: the listbox is busy.
  await screen.rerender(<Menu options={OPTIONS} loading />);
  expect(list().getAttribute("aria-busy")).toBe("true");

  await screen.rerender(<Menu options={[]} emptyMessage="No matches" />);
  expect(status().textContent).toBe("No matches");
});

test("sits below the caret, and flips above it when below is short", async () => {
  const screen = await render(<Menu />);
  const list = () =>
    document.querySelector<HTMLElement>('[data-slot="suggestion-menu"]')!;
  expect(list().dataset.side).toBe("bottom");
  expect(list().getBoundingClientRect().top).toBeGreaterThanOrEqual(58);

  const low = new DOMRect(40, window.innerHeight - 30, 0, 18);
  await screen.rerender(<Menu anchor={low} />);
  expect(list().dataset.side).toBe("top");
  expect(list().getBoundingClientRect().bottom).toBeLessThanOrEqual(low.top);
});

test("floatingSafeArea: a bottom bar's height counts as no room below, so it flips above", async () => {
  const mid = new DOMRect(40, 300, 0, 18);
  await render(
    <Menu
      anchor={mid}
      floatingSafeArea={{ bottom: window.innerHeight - 400 }}
    />,
  );
  const list = document.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu"]',
  )!;
  expect(list.dataset.side).toBe("top");
  expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual(mid.top);
});

test("renders nothing without an anchor", async () => {
  await render(<Menu anchor={null} />);
  expect(document.querySelector('[data-slot="suggestion-menu"]')).toBeNull();
});

test("suggestionMenuKeyDown: arrows wrap, Enter and Tab pick, Escape closes and stops", () => {
  const target = {
    count: 3,
    activeIndex: 0,
    onActiveIndexChange: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };
  const key = (name: string) => new KeyboardEvent("keydown", { key: name });
  expect(suggestionMenuKeyDown(key("ArrowUp"), target)).toBe(true);
  expect(target.onActiveIndexChange).toHaveBeenLastCalledWith(2);
  expect(
    suggestionMenuKeyDown(key("ArrowDown"), { ...target, activeIndex: 2 }),
  ).toBe(true);
  expect(target.onActiveIndexChange).toHaveBeenLastCalledWith(0);
  expect(
    suggestionMenuKeyDown(key("Enter"), { ...target, activeIndex: 1 }),
  ).toBe(true);
  expect(target.onSelect).toHaveBeenLastCalledWith(1);
  expect(suggestionMenuKeyDown(key("Tab"), target)).toBe(true);
  expect(target.onSelect).toHaveBeenLastCalledWith(0);
  const escape = key("Escape");
  const stop = vi.spyOn(escape, "stopPropagation");
  expect(suggestionMenuKeyDown(escape, target)).toBe(true);
  expect(stop).toHaveBeenCalled();
  expect(target.onClose).toHaveBeenCalled();
  expect(suggestionMenuKeyDown(key("a"), target)).toBe(false);

  // Empty: the keys go back to the editor, unless a search in flight holds them.
  const empty = { ...target, count: 0 };
  expect(suggestionMenuKeyDown(key("ArrowDown"), empty)).toBe(false);
  expect(suggestionMenuKeyDown(key("Enter"), empty)).toBe(false);
  const held = { ...empty, holdWhenEmpty: true };
  expect(suggestionMenuKeyDown(key("ArrowDown"), held)).toBe(true);
  expect(suggestionMenuKeyDown(key("Enter"), held)).toBe(true);
  expect(suggestionMenuKeyDown(key("Tab"), held)).toBe(false);
});
