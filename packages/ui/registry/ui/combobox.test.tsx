import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxValue,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxCollection,
  useComboboxFilteredItems,
} from "./combobox";

const FONTS = ["Sans-serif", "Serif", "Monospace"];

// The recommended (and only reliably filterable) rendering: a function child on
// ComboboxList, implicitly wrapped in Combobox.Collection — see combobox.tsx's own
// JSDoc. Static ComboboxItem children do NOT get filtered against `items`.
function Fixture({
  onValueChange,
  value,
}: {
  onValueChange?: (value: string | null) => void;
  value?: string | null;
}) {
  return (
    <Combobox items={FONTS} value={value} onValueChange={onValueChange}>
      <ComboboxInputGroup>
        <ComboboxInput aria-label="Font" placeholder="Search fonts…" />
        <ComboboxTrigger aria-label="Toggle fonts" />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxEmpty>No fonts found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const LABELS = ["Bug", "Feature", "Docs"];

function MultipleFixture({
  onValueChange,
}: {
  onValueChange?: (value: string[]) => void;
}) {
  return (
    <Combobox multiple items={LABELS} defaultValue={["Bug"]} onValueChange={onValueChange}>
      <ComboboxInputGroup>
        <ComboboxChips>
          <ComboboxValue>
            {(value: string[]) =>
              value.map((v) => (
                <ComboboxChip key={v}>
                  {v}
                  <ComboboxChipRemove aria-label={`Remove ${v}`} />
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxInput aria-label="Labels" placeholder="Add labels…" />
        </ComboboxChips>
        <ComboboxClear aria-label="Clear all" />
        <ComboboxTrigger aria-label="Toggle labels" />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxEmpty>No labels found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

test("renders the input with the placeholder and combobox role", async () => {
  const screen = await render(<Fixture />);
  const input = screen.getByRole("combobox", { name: "Font" });
  await expect.element(input).toBeInTheDocument();
  await expect.element(input).toHaveAttribute("data-slot", "combobox-input");
  await expect.element(input).toHaveAttribute("placeholder", "Search fonts…");
});

test("opens the popup on trigger click and lists the items", async () => {
  const screen = await render(<Fixture />);
  await screen.getByRole("button", { name: "Toggle fonts" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Sans-serif" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("option", { name: "Serif", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("option", { name: "Monospace" }))
    .toBeInTheDocument();
});

test("typing narrows the list to matching items", async () => {
  const screen = await render(<Fixture />);
  const input = screen.getByRole("combobox", { name: "Font" });
  await input.click();
  await userEvent.type(input.element() as HTMLInputElement, "Mono");
  const doc = screen.container.ownerDocument;
  await expect.poll(() => doc.querySelectorAll('[role="option"]').length).toBe(1);
  expect(doc.querySelector('[role="option"]')?.textContent).toBe("Monospace");
});

test("ComboboxEmpty shows when no item matches the query", async () => {
  const screen = await render(<Fixture />);
  const input = screen.getByRole("combobox", { name: "Font" });
  await input.click();
  await userEvent.type(input.element() as HTMLInputElement, "zzz");
  await expect
    .element(screen.getByText("No fonts found."))
    .toBeInTheDocument();
  const doc = screen.container.ownerDocument;
  await expect.poll(() => doc.querySelectorAll('[role="option"]').length).toBe(0);
});

const TIMEZONE_GROUPS = [
  { label: "North America", items: ["Eastern", "Central", "Pacific"] },
  { label: "Europe", items: ["Greenwich", "Central European"] },
];

function GroupedItems() {
  // See useComboboxFilteredItems's JSDoc — required so grouped items narrow with the query too.
  const groups = useComboboxFilteredItems<(typeof TIMEZONE_GROUPS)[number]>();
  return (
    <>
      {groups.map((group) => (
        <ComboboxGroup key={group.label} items={group.items}>
          <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
          <ComboboxCollection>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxGroup>
      ))}
    </>
  );
}

function GroupedFixture() {
  return (
    <Combobox items={TIMEZONE_GROUPS}>
      <ComboboxInputGroup>
        <ComboboxInput aria-label="Timezone" placeholder="Search timezones…" />
        <ComboboxTrigger aria-label="Toggle timezones" />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        <ComboboxList>
          <GroupedItems />
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

test("grouped rendering: useComboboxFilteredItems narrows groups with the query", async () => {
  const screen = await render(<GroupedFixture />);
  const doc = screen.container.ownerDocument;
  const input = screen.getByRole("combobox", { name: "Timezone" });
  await input.click();
  await expect.poll(() => doc.querySelectorAll('[role="option"]').length).toBe(5);
  await expect
    .element(screen.getByRole("group", { name: "North America" }))
    .toBeInTheDocument();

  await userEvent.type(input.element() as HTMLInputElement, "Cent");
  await expect
    .poll(() =>
      Array.from(doc.querySelectorAll('[role="option"]')).map((o) => o.textContent),
    )
    .toEqual(["Central", "Central European"]);
});

test("ArrowDown/ArrowUp move the highlight", async () => {
  const screen = await render(<Fixture />);
  const input = screen.getByRole("combobox", { name: "Font" });
  await input.click();
  const doc = screen.container.ownerDocument;

  await userEvent.keyboard("{ArrowDown}");
  await expect
    .poll(() => doc.querySelector("[data-highlighted]")?.textContent)
    .toBe("Sans-serif");

  await userEvent.keyboard("{ArrowDown}");
  await expect
    .poll(() => doc.querySelector("[data-highlighted]")?.textContent)
    .toBe("Serif");

  await userEvent.keyboard("{ArrowUp}");
  await expect
    .poll(() => doc.querySelector("[data-highlighted]")?.textContent)
    .toBe("Sans-serif");
});

test("Enter selects the highlighted item and closes the popup", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Fixture onValueChange={onValueChange} />);
  const input = screen.getByRole("combobox", { name: "Font" });
  await input.click();
  const doc = screen.container.ownerDocument;

  await userEvent.keyboard("{ArrowDown}");
  await expect
    .poll(() => doc.querySelector("[data-highlighted]")?.textContent)
    .toBe("Sans-serif");

  await userEvent.keyboard("{Enter}");
  await expect
    .poll(() => onValueChange.mock.calls.at(-1)?.[0])
    .toBe("Sans-serif");
  await expect.poll(() => doc.querySelector('[role="listbox"]')).toBeNull();
});

test("Escape closes the popup and returns focus to the input", async () => {
  const screen = await render(<Fixture />);
  const input = screen.getByRole("combobox", { name: "Font" });
  await input.click();
  const doc = screen.container.ownerDocument;
  await expect.poll(() => doc.querySelector('[role="listbox"]')).not.toBeNull();

  await userEvent.keyboard("{Escape}");
  await expect.poll(() => doc.querySelector('[role="listbox"]')).toBeNull();
  expect(doc.activeElement?.getAttribute("data-slot")).toBe("combobox-input");
});

test("a controlled value is reflected as the selected option", async () => {
  const screen = await render(<Fixture value="Serif" />);
  await screen.getByRole("button", { name: "Toggle fonts" }).click();
  const serif = screen.getByRole("option", { name: "Serif", exact: true });
  await expect.element(serif).toHaveAttribute("aria-selected", "true");
  const sans = screen.getByRole("option", { name: "Sans-serif" });
  await expect.element(sans).toHaveAttribute("aria-selected", "false");
});

test("a disabled trigger does not open the popup", async () => {
  const screen = await render(
    <Combobox items={FONTS} disabled>
      <ComboboxInputGroup>
        <ComboboxInput aria-label="Disabled font" />
        <ComboboxTrigger aria-label="Toggle" />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  const input = screen.getByRole("combobox", { name: "Disabled font" });
  await expect.element(input).toBeDisabled();
  const doc = screen.container.ownerDocument;
  expect(doc.querySelector('[role="listbox"]')).toBeNull();
});

test("multiple mode: selecting an item adds a chip and fires onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<MultipleFixture onValueChange={onValueChange} />);
  const doc = screen.container.ownerDocument;
  expect(
    Array.from(doc.querySelectorAll('[data-slot="combobox-chip"]')).map((c) => c.textContent),
  ).toEqual(["Bug"]);

  await screen.getByRole("combobox", { name: "Labels" }).click();
  await screen.getByRole("option", { name: "Feature" }).click();
  await expect
    .poll(() =>
      Array.from(doc.querySelectorAll('[data-slot="combobox-chip"]')).map((c) => c.textContent),
    )
    .toEqual(["Bug", "Feature"]);
  expect(onValueChange).toHaveBeenCalledWith(["Bug", "Feature"], expect.anything());
});

test("multiple mode: ComboboxChipRemove removes one chip, ComboboxClear removes the rest", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<MultipleFixture onValueChange={onValueChange} />);
  const doc = screen.container.ownerDocument;
  const chipText = () =>
    Array.from(doc.querySelectorAll('[data-slot="combobox-chip"]')).map((c) => c.textContent);

  // Add a second chip so removal (below) leaves one behind — Clear removing the LAST chip is
  // covered by the a11y test's fixture instead, since ComboboxClear unmounts once there's
  // nothing to clear (`keepMounted` defaults to `false`).
  await screen.getByRole("combobox", { name: "Labels" }).click();
  await screen.getByRole("option", { name: "Feature" }).click();
  await expect.poll(chipText).toEqual(["Bug", "Feature"]);

  // The chip row is marked `aria-hidden` by Base UI while the popup is open (so a screen
  // reader mid-selection isn't pulled away from the listbox) — close it first, matching how
  // an assistive-tech user would actually reach the remove control.
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => doc.querySelector('[role="listbox"]')).toBeNull();

  await screen.getByRole("button", { name: "Remove Bug" }).click();
  await expect.poll(chipText).toEqual(["Feature"]);
  expect(onValueChange).toHaveBeenCalledWith(["Feature"], expect.anything());

  await screen.getByRole("button", { name: "Clear all" }).click();
  await expect.poll(chipText).toEqual([]);
  expect(onValueChange).toHaveBeenCalledWith([], expect.anything());
});

test("ComboboxContent's positioner carries the z-(--z-overlay) token class", async () => {
  const screen = await render(<Fixture />);
  await screen.getByRole("button", { name: "Toggle fonts" }).click();
  const doc = screen.container.ownerDocument;
  const positioner = doc.querySelector('[data-slot="combobox-positioner"]');
  expect(positioner).not.toBeNull();
  expect(positioner).toHaveClass("z-(--z-overlay)");
  const content = doc.querySelector('[data-slot="combobox-content"]');
  expect(content).toHaveClass("z-(--z-overlay)");
});

test("no a11y violations — default (closed)", async () => {
  const screen = await render(<Fixture />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Fixture />);
  await screen.getByRole("button", { name: "Toggle fonts" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Sans-serif" }))
    .toBeInTheDocument();
  // Audit the whole document so the portalled popup is included.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("no a11y violations — multiple mode with chips", async () => {
  const screen = await render(<MultipleFixture />);
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("ComboboxInputGroup forwards ref to its host element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Combobox items={FONTS}>
      <ComboboxInputGroup ref={ref}>
        <ComboboxInput aria-label="Font" />
        <ComboboxTrigger aria-label="Toggle" />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("combobox-input-group");
});
