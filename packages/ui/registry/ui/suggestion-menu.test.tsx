/**
 * `suggestion-menu.test.tsx` — the one caret-anchored suggestion list, tested once for the three
 * editor menus that open it (TextEdit's slash and mention menus, TemplateEditor's picker).
 */

import "../../test/geometry.css"; // compiled Tailwind + @vegastack token theme
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
  // The highlight is ComboboxItem's, the shared hover step (COL-24).
  expect(SUGGESTION_MENU_ROW).toContain("data-highlighted:bg-state-hover");
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

test("loading with no rows shows placeholder rows as tall as the list grows; a search in flight never shrinks the menu", async () => {
  const many: SuggestionMenuOption[] = Array.from({ length: 10 }, (_, at) => ({
    key: `o${at}`,
    label: `Option ${at}`,
    description: "meta",
    group: at < 5 ? "People" : "Pages",
  }));
  const screen = await render(<Menu options={[]} loading />);
  const menu = () =>
    document.querySelector<HTMLElement>('[data-slot="suggestion-menu"]')!;
  const height = () => menu().getBoundingClientRect().height;
  expect(
    menu().querySelector('[data-slot="suggestion-menu-skeleton"]'),
  ).not.toBeNull();
  // Nothing to choose yet: no listbox, and nothing announced.
  expect(menu().getAttribute("role")).toBeNull();
  expect(menu().textContent).toBe("");
  const opened = height();
  expect(opened).toBeGreaterThan(200);

  // The first answer lands in the same box.
  await screen.rerender(<Menu options={many} />);
  expect(rows()).toHaveLength(10);
  expect(height()).toBe(opened);

  // The next search narrows the rows while it runs: the box holds until it answers.
  await screen.rerender(<Menu options={many.slice(0, 1)} loading />);
  expect(height()).toBe(opened);
  await screen.rerender(<Menu options={many.slice(0, 1)} />);
  const short = height();
  expect(short).toBeLessThan(opened);

  // Nothing left that matches while the next search runs: placeholder rows in the same box.
  await screen.rerender(<Menu options={[]} loading />);
  expect(
    menu().querySelector('[data-slot="suggestion-menu-skeleton"]'),
  ).not.toBeNull();
  expect(height()).toBe(short);
  const region = document.querySelector(
    '[data-slot="suggestion-menu-layer"] > [role="status"]',
  )!;
  await vi.waitFor(() => expect(region.textContent).toBe("Searching…"));
  await expectNoA11yViolations(document.body);
});

/** Answer every media query as `matches(query)` until restored. */
function stubMediaQueries(matches: (query: string) => boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matches(query),
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

test('size="lg": 320px wide, two-line rows with an icon box, capped at min(60vh, 440px)', async () => {
  const many: SuggestionMenuOption[] = Array.from({ length: 20 }, (_, at) => ({
    key: `o${at}`,
    label: `Block ${at}`,
    description: "What the block is",
    icon: <Plus />,
    group: at < 10 ? "Basic" : "Media",
  }));
  const screen = await render(<Menu size="lg" options={many} />);
  const menu = document.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu"]',
  )!;
  expect(menu.dataset.size).toBe("lg");
  expect(menu.getBoundingClientRect().width).toBe(320);
  expect(menu.getBoundingClientRect().height).toBeLessThanOrEqual(
    Math.min(window.innerHeight * 0.6, 440) + 0.5,
  );
  const first = rows()[0]!;
  // The description is a second line under the label, not trailing text.
  const text = first.querySelector('[data-slot="suggestion-menu-text"]')!;
  expect(
    text.querySelector('[data-slot="suggestion-menu-description"]')
      ?.textContent,
  ).toBe("What the block is");
  const icon = first.querySelector<HTMLElement>(
    '[data-slot="suggestion-menu-icon"]',
  )!;
  expect(icon.getBoundingClientRect().width).toBe(28);
  // (A list that scrolls is reached through the editor's textbox, which this test has none of.)
  await screen.rerender(<Menu size="lg" options={many.slice(0, 4)} />);
  await expectNoA11yViolations(document.body);
});

test('descriptionShown="active": the description shows on the highlighted row only', async () => {
  const people: SuggestionMenuOption[] = [
    {
      key: "a",
      label: "Asha Rao",
      description: "asha@x.co",
      descriptionShown: "active",
    },
    {
      key: "b",
      label: "Ben Ito",
      description: "ben@x.co",
      descriptionShown: "active",
    },
  ];
  await render(<Menu options={people} />);
  const description = (row: HTMLElement) =>
    row.querySelector('[data-slot="suggestion-menu-description"]')
      ?.textContent ?? null;
  expect(description(rows()[0]!)).toBe("asha@x.co");
  expect(description(rows()[1]!)).toBeNull();
  await userEvent.hover(rows()[1]!);
  await vi.waitFor(() => expect(description(rows()[1]!)).toBe("ben@x.co"));
  expect(description(rows()[0]!)).toBeNull();
});

test('presentation="auto": a bottom sheet with a search field on a phone, which drives the keys', async () => {
  const restore = stubMediaQueries((query) =>
    query.includes("pointer: coarse"),
  );
  const onQueryChange = vi.fn();
  const onSelect = vi.fn();
  const onClose = vi.fn();
  function Sheeted() {
    const [index, setIndex] = React.useState(0);
    const [query, setQuery] = React.useState("");
    return (
      <SuggestionMenu
        id="menu"
        aria-label="Insert block"
        anchor={anchor()}
        options={OPTIONS}
        presentation="auto"
        query={query}
        onQueryChange={(next) => {
          setQuery(next);
          onQueryChange(next);
        }}
        onClose={onClose}
        activeIndex={index}
        onActiveIndexChange={setIndex}
        onSelect={onSelect}
      />
    );
  }
  try {
    await render(<Sheeted />);
    const sheet = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>(
        '[data-slot="suggestion-menu-sheet"]',
      );
      expect(found).not.toBeNull();
      return found!;
    });
    const list = sheet.querySelector<HTMLElement>(
      '[data-slot="suggestion-menu"]',
    )!;
    expect(list.dataset.presentation).toBe("sheet");
    const search = sheet.querySelector<HTMLInputElement>(
      '[data-slot="suggestion-menu-search"]',
    )!;
    await vi.waitFor(() => expect(document.activeElement).toBe(search));
    expect(search.getAttribute("aria-controls")).toBe("menu");
    expect(search.getAttribute("aria-activedescendant")).toBe(
      suggestionMenuOptionId("menu", 0),
    );
    // 44px rows on touch.
    expect(rows()[0]!.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      44,
    );
    await userEvent.keyboard("po");
    expect(onQueryChange).toHaveBeenLastCalledWith("po");
    await userEvent.keyboard("{ArrowDown}");
    expect(search.getAttribute("aria-activedescendant")).toBe(
      suggestionMenuOptionId("menu", 1),
    );
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(1);
    await expectNoA11yViolations(document.body);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  } finally {
    restore.mockRestore();
  }
});

test('presentation="auto" on a fine pointer and a wide window stays a popover', async () => {
  const restore = stubMediaQueries(() => false);
  try {
    await render(<Menu presentation="auto" />);
    expect(
      document.querySelector('[data-slot="suggestion-menu-sheet"]'),
    ).toBeNull();
    expect(
      document.querySelector<HTMLElement>('[data-slot="suggestion-menu"]')
        ?.dataset.presentation,
    ).toBe("popover");
  } finally {
    restore.mockRestore();
  }
});

test("the sheet announces inside itself (the page behind it is inert), and an IME's Enter picks nothing", async () => {
  const restore = stubMediaQueries((query) =>
    query.includes("pointer: coarse"),
  );
  const onSelect = vi.fn();
  try {
    await render(<Menu presentation="auto" options={[]} onSelect={onSelect} />);
    const sheet = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>(
        '[data-slot="suggestion-menu-sheet"]',
      );
      expect(found).not.toBeNull();
      return found!;
    });
    await vi.waitFor(() =>
      expect(sheet.querySelector('[role="status"]')?.textContent).toBe(
        "No results",
      ),
    );
  } finally {
    restore.mockRestore();
  }
  const restoreAgain = stubMediaQueries((query) =>
    query.includes("pointer: coarse"),
  );
  try {
    document.body.innerHTML = "";
    await render(<Menu presentation="auto" onSelect={onSelect} />);
    const search = await vi.waitFor(() => {
      const found = document.querySelector<HTMLInputElement>(
        '[data-slot="suggestion-menu-search"]',
      );
      expect(found).not.toBeNull();
      return found!;
    });
    search.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        isComposing: true,
      }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  } finally {
    restoreAgain.mockRestore();
  }
});
