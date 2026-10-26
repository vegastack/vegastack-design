import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataGrid } from "./data-grid";
import { InlineChipProvider } from "./inline-chip";
import { TimeZoneProvider } from "./relative-time";
import {
  FieldCellDisplay,
  FieldCellEditor,
  FieldInput,
  isValidFieldText,
  type FieldConfig,
  type FieldType,
  type FieldValue,
} from "./field-cell";

const OPTIONS: FieldConfig["options"] = [
  { id: "req", label: "Requested", hue: "blue" },
  { id: "sent", label: "Sent", hue: "green" },
  { id: "recv", label: "Received", hue: "orange" },
  { id: "closed", label: "Closed" },
];

const CASES: [FieldType, FieldValue, FieldConfig?][] = [
  [
    "text",
    "ARC-120 sample with a very long name that keeps going past the cell",
  ],
  ["long_text", "First line\nSecond line"],
  ["number", 1234.5],
  ["currency", 9876.5, { currency: "EUR" }],
  ["percent", 0.125],
  ["date", "2026-10-24"],
  ["datetime", "2026-10-24T09:30:00.000Z"],
  ["single_choice", "sent", { options: OPTIONS }],
  ["multi_choice", ["req", "sent", "recv", "closed"], { options: OPTIONS }],
  ["checkbox", true],
  ["person", { id: "u1", name: "Asha Rao" }],
  [
    "link",
    [
      { id: "c1", label: "Acme Lighting", kind: "customer", href: "/c/1" },
      { id: "c2", label: "Hidden", kind: "customer", state: "restricted" },
      { id: "c3", label: "Gone", kind: "customer", state: "deleted" },
      { id: "c4", label: "Fourth", kind: "customer" },
    ],
  ],
  ["file", [{ id: "f1", name: "spec.pdf", contentType: "application/pdf" }]],
  ["url", "example.com/catalogue"],
  ["email", "asha@example.com"],
  ["phone", "+44 20 7946 0958"],
  ["calculated", null, { missingInputs: ["Qty", "Price"] }],
  ["autonumber", 12, { prefix: "SR-" }],
  ["created_at", "2026-10-24T09:30:00.000Z"],
  ["created_by", { id: "u2", name: "Ben Kim" }],
];

test("every type displays its value and is axe-clean", async () => {
  const screen = await render(
    <ul>
      {CASES.map(([type, value, config]) => (
        <li key={type} data-type={type}>
          <FieldCellDisplay type={type} value={value} config={config} />
        </li>
      ))}
    </ul>,
  );
  const text = (type: string) =>
    document.querySelector(`li[data-type="${type}"]`)!.textContent ?? "";
  expect(text("long_text")).toBe("First line");
  expect(text("currency")).toContain("9,876.50");
  expect(text("percent")).toContain("12.5%");
  expect(text("date")).not.toBe("");
  expect(text("multi_choice")).toContain("+2");
  expect(text("link")).toContain("+1");
  expect(text("autonumber")).toBe("SR-12");
  expect(text("calculated")).toBe("—");
  expect(
    document.querySelector('li[data-type="email"] a')?.getAttribute("href"),
  ).toBe("mailto:asha@example.com");
  expect(
    document.querySelector('li[data-type="url"] a')?.getAttribute("href"),
  ).toBe("https://example.com/catalogue");
  await expectNoA11yViolations(screen.container);
});

test("a calendar day never shifts with the reader's zone; filling and recalculating states show", async () => {
  const screen = await render(
    <>
      <FieldCellDisplay type="date" value="2026-01-01" />
      <FieldCellDisplay type="text" value="x" state="filling" />
      <FieldCellDisplay type="calculated" value={3} state="recalculating" />
    </>,
  );
  expect(screen.container.textContent).toContain("2026");
  expect(screen.container.textContent).toContain("Jan");
  expect(
    screen.container.querySelector('[data-slot="field-cell-filling"]'),
  ).not.toBeNull();
  expect(screen.container.textContent).toContain("Recalculating…");
});

test("a checkbox toggles where it is shown, with no edit mode", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <FieldCellDisplay type="checkbox" value={false} onToggle={onToggle} />,
  );
  (screen.getByRole("checkbox").element() as HTMLElement).click();
  expect(onToggle).toHaveBeenCalledWith(true);
});

test("URL, email and phone are checked as typed", () => {
  expect(isValidFieldText("url", "example.com")).toBe(true);
  expect(isValidFieldText("url", "javascript:alert(1)")).toBe(false);
  expect(isValidFieldText("email", "a@b.co")).toBe(true);
  expect(isValidFieldText("email", "nope")).toBe(false);
  expect(isValidFieldText("phone", "+1 (555) 010-0000")).toBe(true);
  expect(isValidFieldText("phone", "call me")).toBe(false);
});

test("FieldInput: each editable type renders a named control, axe-clean, invalid when asked", async () => {
  const editable: FieldType[] = [
    "text",
    "number",
    "currency",
    "percent",
    "date",
    "datetime",
    "single_choice",
    "multi_choice",
    "checkbox",
    "person",
    "link",
    "url",
    "email",
    "phone",
  ];
  const screen = await render(
    <div>
      {editable.map((type) => (
        <FieldInput
          key={type}
          type={type}
          aria-label={`Field ${type}`}
          value={type === "checkbox" ? false : null}
          config={{
            options: OPTIONS,
            people: [{ id: "u1", name: "Asha Rao" }],
          }}
          invalid={type === "text"}
          onChange={() => {}}
        />
      ))}
    </div>,
  );
  for (const type of editable)
    expect(
      screen.container.querySelector(`[aria-label="Field ${type}"]`),
      type,
    ).not.toBeNull();
  expect(
    screen.container
      .querySelector('[aria-label="Field text"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("FieldInput: a number reads the reader's locale; an invalid email is marked as typed", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <>
      <FieldInput
        type="number"
        aria-label="Qty"
        value={null}
        onChange={onChange}
      />
      <FieldInput
        type="email"
        aria-label="Email"
        value="nope"
        onChange={() => {}}
      />
    </>,
  );
  const qty = screen.getByRole("textbox", { name: "Qty" });
  await qty.click();
  await userEvent.keyboard("1.5{Tab}");
  expect(onChange).toHaveBeenLastCalledWith(1.5);
  expect(
    screen.container
      .querySelector('[aria-label="Email"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
});

test("FieldCellEditor: text commits on Enter, Escape cancels, a choice commits on choosing", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="text"
      label="Name"
      value="Acme"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  const field = screen.getByRole("textbox", { name: "Name" });
  await expect.element(field).toHaveFocus();
  await userEvent.keyboard(" Ltd{Enter}");
  expect(onCommit).toHaveBeenCalledWith("Acme Ltd", "down");
  await screen.rerender(<span />);
  await screen.rerender(
    <FieldCellEditor
      type="text"
      label="Name"
      value="Acme"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await userEvent.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(1);

  const choose = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="choice"
      type="single_choice"
      label="Status"
      value={null}
      config={{ options: OPTIONS }}
      onCommit={choose}
      onCancel={() => {}}
    />,
  );
  // The list opens with the editor.
  await screen.getByRole("option", { name: "Sent" }).click();
  expect(choose).toHaveBeenCalledWith("sent", undefined);
  await expectNoA11yViolations(screen.container);
});

test("FieldCellEditor: an invalid URL never commits; a read-only type cancels at once", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="url"
      label="Site"
      value=""
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await userEvent.keyboard("javascript:x{Enter}");
  expect(onCommit).not.toHaveBeenCalled();
  expect(
    screen.container
      .querySelector('[aria-label="Site"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
  const cancelled = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="auto"
      type="autonumber"
      label="Ref"
      value={3}
      onCommit={onCommit}
      onCancel={cancelled}
    />,
  );
  await expect.poll(() => cancelled.mock.calls.length).toBe(1);
});

test("a choice editor adds the typed option through onCreateOption", async () => {
  const onCreateOption = vi.fn(async (label: string) => ({ id: "new", label }));
  const onChange = vi.fn();
  const screen = await render(
    <FieldInput
      type="single_choice"
      aria-label="Status"
      value={null}
      config={{ options: OPTIONS, onCreateOption }}
      onChange={onChange}
    />,
  );
  await screen.getByRole("combobox", { name: "Status" }).click();
  await screen.getByLabelText("Search options").fill("Lost");
  await expect
    .element(screen.getByRole("option", { name: "Add “Lost”" }))
    .toBeVisible();
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => onChange.mock.calls.at(-1)?.[0]).toBe("new");
});

test("a restricted, unavailable or deleted link shows only that word — never the record's name", async () => {
  const screen = await render(
    <FieldCellDisplay
      type="link"
      value={[
        {
          id: "c1",
          label: "Confidential acquisition",
          kind: "customer",
          state: "restricted",
        },
        {
          id: "c2",
          label: "Secret module record",
          kind: "customer",
          state: "unavailable",
        },
        { id: "c3", label: "Removed deal", kind: "customer", state: "deleted" },
      ]}
    />,
  );
  const html = screen.container.innerHTML;
  expect(html).not.toContain("Confidential");
  expect(html).not.toContain("Secret");
  expect(html).not.toContain("Removed deal");
  expect(screen.container.textContent).toContain("Restricted");
});

test("date-time edits in the reader's zone, not the browser's", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <TimeZoneProvider timeZone="America/New_York">
      <FieldInput
        type="datetime"
        aria-label="Visit"
        value="2026-10-24T13:30:00.000Z"
        onChange={onChange}
      />
    </TimeZoneProvider>,
  );
  const time = screen.getByLabelText("Time").element() as HTMLInputElement;
  // 13:30Z is 09:30 in New York (EDT).
  expect(time.value).toBe("09:30");
  await screen.getByLabelText("Time").fill("10:00");
  expect(onChange).toHaveBeenLastCalledWith("2026-10-24T14:00:00.000Z");
});

test("FieldCellEditor: a picker opens its list or calendar with the editor; long text takes the caret", async () => {
  const choose = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="single_choice"
      label="Status"
      value={null}
      config={{ options: OPTIONS }}
      onCommit={choose}
      onCancel={() => {}}
    />,
  );
  await expect.element(screen.getByRole("listbox")).toBeVisible();
  // Focus is on a control the reader can use — never a picker's hidden form input.
  expect(document.activeElement?.getAttribute("aria-hidden")).not.toBe("true");
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await expect.poll(() => choose.mock.calls.length).toBe(1);

  await screen.rerender(
    <FieldCellEditor
      key="date"
      type="date"
      label="Due"
      value={null}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  await screen.rerender(
    <FieldCellEditor
      key="notes"
      type="long_text"
      label="Notes"
      value="First"
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );
  await expect
    .poll(() =>
      document.activeElement?.closest('[data-slot="popover-content"]'),
    )
    .not.toBeNull();
});

test("long text opens in a popover from a cell; Escape cancels, closing saves", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="long_text"
      label="Notes"
      value="First\nSecond"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="popover-content"]'))
    .not.toBeNull();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => onCancel.mock.calls.length).toBe(1);
  expect(onCommit).not.toHaveBeenCalled();
  void screen;
});

test("date-time across the clock changes: a skipped hour moves forward, a repeated hour keeps its occurrence", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <TimeZoneProvider timeZone="America/New_York">
      {/* 2026-03-08 is the spring change in New York: 02:00–02:59 does not exist. */}
      <FieldInput
        type="datetime"
        aria-label="A"
        value="2026-03-08T06:00:00.000Z"
        onChange={onChange}
      />
    </TimeZoneProvider>,
  );
  await screen.getByLabelText("Time").fill("02:30");
  expect(onChange).toHaveBeenLastCalledWith("2026-03-08T07:30:00.000Z"); // 03:30 EDT
  const fold = vi.fn();
  await screen.rerender(
    <TimeZoneProvider timeZone="America/New_York">
      {/* 2026-11-01 01:30 happens twice; the value is the second (EST, 06:30Z). */}
      <FieldInput
        type="datetime"
        aria-label="A"
        value="2026-11-01T06:30:00.000Z"
        onChange={fold}
      />
    </TimeZoneProvider>,
  );
  await screen.getByLabelText("Time").fill("01:45");
  expect(fold).toHaveBeenLastCalledWith("2026-11-01T06:45:00.000Z");
  // Auckland (UTC+12/+13): the changes fall where a half-day sample misses them.
  const gap = vi.fn();
  await screen.rerender(
    <TimeZoneProvider timeZone="Pacific/Auckland">
      <FieldInput
        type="datetime"
        aria-label="A"
        value="2026-09-26T13:00:00.000Z"
        onChange={gap}
      />
    </TimeZoneProvider>,
  );
  await screen.getByLabelText("Time").fill("02:30");
  expect(gap).toHaveBeenLastCalledWith("2026-09-26T14:30:00.000Z"); // 03:30 NZDT
  const first = vi.fn();
  await screen.rerender(
    <TimeZoneProvider timeZone="Pacific/Auckland">
      {/* 2026-04-05 02:30 happens twice; the value is the first (NZDT, 13:30Z). */}
      <FieldInput
        type="datetime"
        aria-label="A"
        value="2026-04-04T13:30:00.000Z"
        onChange={first}
      />
    </TimeZoneProvider>,
  );
  await screen.getByLabelText("Time").fill("02:45");
  expect(first).toHaveBeenLastCalledWith("2026-04-04T13:45:00.000Z");
});

test("an empty date-time editor focuses its day picker; a link list names what +N hides", async () => {
  const screen = await render(
    <FieldCellEditor
      type="datetime"
      label="Visit"
      value={null}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );
  await expect.poll(() => document.activeElement?.tagName).toBe("BUTTON");
  await screen.rerender(
    <FieldCellDisplay
      type="link"
      value={["A", "B", "C", "D"]
        .map((name) => ({
          id: name,
          label: `Record ${name}`,
          kind: "customer",
        }))
        .concat([
          { id: "x", label: "Secret", kind: "customer", state: "restricted" },
        ] as never)}
    />,
  );
  const more = document.querySelector('[data-slot="field-cell-more"]')!;
  expect(more.textContent).toContain("2 more: Record D, Restricted");
  expect(document.body.innerHTML).not.toContain("Secret");
  // A chip that opens nothing is not a tab stop itself, so its wrapper is (outside a grid).
  const first = screen
    .getByText("Record A")
    .element()
    .closest("[data-slot=inline-chip]")!;
  expect(first.parentElement!.getAttribute("tabindex")).toBe("0");
  // A link chip is the tab stop itself; a filtered URL renders a plain chip, so its wrapper is.
  await screen.rerender(
    <FieldCellDisplay
      type="link"
      value={[
        { id: "l", label: "Linked", kind: "customer", href: "/c/l" },
        {
          id: "j",
          label: "Unsafe",
          kind: "customer",
          href: "javascript:void(0)",
        },
      ]}
    />,
  );
  const linked = screen
    .getByText("Linked")
    .element()
    .closest("[data-slot=inline-chip]")!;
  await expect
    .poll(() => linked.parentElement!.hasAttribute("tabindex"))
    .toBe(false);
  const unsafe = screen
    .getByText("Unsafe")
    .element()
    .closest("[data-slot=inline-chip]")!;
  await expect
    .poll(() => unsafe.parentElement!.getAttribute("tabindex"))
    .toBe("0");
  await expectNoA11yViolations(screen.container);
  // The host's provider changes what the chip renders; the wrapper follows both ways. One element
  // instance keeps the display itself from re-rendering: only the provider's readers update.
  const stable = (
    <FieldCellDisplay
      type="link"
      value={[{ id: "p", label: "Provided", kind: "customer" }]}
    />
  );
  const wrapper = () =>
    screen.getByText("Provided").element().closest("[data-slot=inline-chip]")!
      .parentElement!;
  await screen.rerender(
    <InlineChipProvider value={{}}>{stable}</InlineChipProvider>,
  );
  await expect.poll(() => wrapper().getAttribute("tabindex")).toBe("0");
  await screen.rerender(
    <InlineChipProvider value={{ href: () => "/c/p" }}>
      {stable}
    </InlineChipProvider>,
  );
  await expect.poll(() => wrapper().hasAttribute("tabindex")).toBe(false);
  await screen.rerender(
    <InlineChipProvider value={{}}>{stable}</InlineChipProvider>,
  );
  await expect.poll(() => wrapper().getAttribute("tabindex")).toBe("0");
});

test("a link editor never names an unreachable target; a numeric editor focuses its field", async () => {
  const screen = await render(
    <FieldInput
      type="link"
      aria-label="Customer"
      value={[
        {
          id: "c1",
          label: "Confidential acquisition",
          kind: "customer",
          state: "restricted",
        },
      ]}
      onChange={() => {}}
    />,
  );
  expect(document.body.innerHTML).not.toContain("Confidential");
  await screen.rerender(
    <FieldCellEditor
      key="n"
      type="number"
      label="Qty"
      value={2}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );
  await expect
    .poll(() => (document.activeElement as HTMLElement | null)?.tagName)
    .toBe("INPUT");
});

test("FieldCellEditor: the spreadsheet keys commit and move; Escape cancels; IME never commits", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const editor = (key: string) => (
    <FieldCellEditor
      key={key}
      type="text"
      label="Name"
      value="Acme"
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
  const screen = await render(editor("enter"));
  await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
  expect(onCommit).toHaveBeenLastCalledWith("Acme", "up");
  await screen.rerender(editor("tab"));
  await userEvent.keyboard("!{Tab}");
  expect(onCommit).toHaveBeenLastCalledWith("Acme!", "right");
  await screen.rerender(editor("shift-tab"));
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
  expect(onCommit).toHaveBeenLastCalledWith("Acme", "left");
  expect(onCommit).toHaveBeenCalledTimes(3);

  // A composing Enter (an IME candidate being chosen) neither commits nor moves.
  await screen.rerender(editor("ime"));
  const field = screen.getByRole("textbox", { name: "Name" }).element();
  field.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      isComposing: true,
    }),
  );
  field.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Tab", bubbles: true, keyCode: 229 }),
  );
  expect(onCommit).toHaveBeenCalledTimes(3);
  await userEvent.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenCalledTimes(3);
});

test("FieldCellEditor: a typed seed replaces a text or number value and opens a picker searching for it", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="text"
      label="Name"
      value="Acme"
      seed="Z"
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("ed{Enter}");
  expect(onCommit).toHaveBeenLastCalledWith("Zed", "down");

  // A number's own parser reads the seed, so a leading minus is kept.
  await screen.rerender(
    <FieldCellEditor
      key="number"
      type="number"
      label="Qty"
      value={12}
      seed="-"
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("5{Enter}");
  expect(onCommit).toHaveBeenLastCalledWith(-5, "down");

  await screen.rerender(
    <FieldCellEditor
      key="choice"
      type="single_choice"
      label="Status"
      value={null}
      seed="r"
      config={{ options: OPTIONS }}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  const search = screen.getByRole("combobox", { name: "Search options" });
  await expect.element(search).toHaveValue("r");
  await expect
    .element(screen.getByRole("option", { name: "Requested" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("option", { name: "Sent" }))
    .not.toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("FieldCellEditor: Tab steps through a date-time's own controls before it commits and moves", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <TimeZoneProvider timeZone="UTC">
      <FieldCellEditor
        type="datetime"
        label="Due"
        value="2026-10-24T09:30:00.000Z"
        onCommit={onCommit}
        onCancel={() => {}}
      />
    </TimeZoneProvider>,
  );
  const stops = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="field-cell-editor"] button, [data-slot="field-cell-editor"] input',
    ),
  ].filter((node) => node.tabIndex >= 0);
  stops[0]!.focus();
  await userEvent.keyboard("{Tab}");
  expect(onCommit).not.toHaveBeenCalled();
  await userEvent.keyboard("{Tab}");
  expect(onCommit).toHaveBeenCalledWith("2026-10-24T09:30:00.000Z", "right");
});

test("FieldCellEditor: a picker chosen with Enter moves down; IME never chooses; a number's Tab moves right", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="single_choice"
      label="Status"
      value={null}
      seed="se"
      config={{ options: OPTIONS }}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  const search = screen.getByRole("combobox", { name: "Search options" });
  await expect.element(search).toHaveValue("se");
  await expect
    .element(screen.getByRole("option", { name: "Sent" }))
    .toBeVisible();
  // Typing goes on in the search field.
  await expect.element(search).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByRole("option", { name: "Sent" }))
    .toHaveAttribute("data-highlighted");
  // A composing Enter over the highlighted option chooses nothing.
  search.element().dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      isComposing: true,
    }),
  );
  expect(onCommit).not.toHaveBeenCalled();
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledWith("sent", "down");

  await screen.rerender(
    <FieldCellEditor
      key="percent"
      type="percent"
      label="Share"
      value={null}
      seed="5"
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("0{Tab}");
  expect(onCommit).toHaveBeenLastCalledWith(0.5, "right");
});

test("in a grid: a typed key opens a picker searching for it, and one Escape leaves the cell", async () => {
  const rows = [{ id: "r1", status: "req" as string | null }];
  await render(
    <DataGrid
      aria-label="Requests"
      columns={[
        {
          key: "status",
          header: "Status",
          minWidth: 10,
          editable: {
            type: "custom",
            render: ({ row, value, seed, commit, cancel }) => (
              <FieldCellEditor
                type="single_choice"
                label="Status"
                value={row.status}
                seed={seed}
                config={{ options: OPTIONS }}
                onCommit={(_, move) => commit(value, move)}
                onCancel={cancel}
              />
            ),
          },
        },
      ]}
      data={rows}
      getRowId={(row) => row.id}
    />,
  );
  const cell = document.querySelector<HTMLElement>(
    '[data-grid-row="r1"][data-grid-key="status"]',
  )!;
  cell.focus();
  await userEvent.keyboard("c");
  const editor = () =>
    document.querySelector('[data-slot="field-cell-editor"]');
  const search = () =>
    document.querySelector<HTMLInputElement>(
      'input[aria-label="Search options"]',
    );
  await vi.waitFor(() => expect(search()?.value).toBe("c"));
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(editor()).toBeNull());
  expect(search()).toBeNull();
  await vi.waitFor(() =>
    expect(document.activeElement?.closest("[data-grid-row]")).toBe(cell),
  );
});

test("in a grid: Enter and F2 open every picker with its list, and long text with the caret in it", async () => {
  const rows = [{ id: "r1", status: "req" as string | null, notes: "First" }];
  const editor = (type: FieldType, key: "status" | "notes") => ({
    key,
    header: key,
    minWidth: 10,
    editable: {
      type: "custom" as const,
      render: ({
        row,
        value,
        seed,
        commit,
        cancel,
      }: {
        row: (typeof rows)[number];
        value: string;
        seed?: string;
        commit: (
          value: string,
          move?: "down" | "up" | "left" | "right",
        ) => void;
        cancel: () => void;
      }) => (
        <FieldCellEditor
          type={type}
          label={key}
          value={row[key]}
          seed={seed}
          config={{ options: OPTIONS }}
          onCommit={(_, move) => commit(value, move)}
          onCancel={cancel}
        />
      ),
    },
  });
  await render(
    <DataGrid
      aria-label="Requests"
      columns={[
        editor("single_choice", "status"),
        editor("long_text", "notes"),
      ]}
      selectionMode="cells"
      data={rows}
      getRowId={(row) => row.id}
    />,
  );
  const cell = (key: string) =>
    document.querySelector<HTMLElement>(
      `[data-grid-row="r1"][data-grid-key="${key}"]`,
    )!;
  const editing = () =>
    document.querySelector('[data-slot="field-cell-editor"]');
  for (const key of ["{Enter}", "{F2}"]) {
    cell("status").focus();
    await userEvent.keyboard(key);
    await vi.waitFor(() =>
      expect(document.querySelector('[role="listbox"]')).not.toBeNull(),
    );
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(editing()).toBeNull());

    cell("notes").focus();
    await userEvent.keyboard(key);
    await vi.waitFor(() =>
      expect(
        document.activeElement?.closest(
          '[data-slot="popover-content"] [data-slot="text-edit"]',
        ),
      ).not.toBeNull(),
    );
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(editing()).toBeNull());
  }
});

test("in a grid: typing on a cell of any type opens its editor holding every typed key, in place of the value", async () => {
  const commits: [string, FieldValue][] = [];
  const rows = [
    { id: "r1", name: "Acme", notes: "note 30", due: "2026-10-24" as string },
  ];
  const column = (type: FieldType, key: "name" | "notes" | "due") => ({
    key,
    header: key,
    minWidth: 10,
    editable: {
      type: "custom" as const,
      render: ({
        row,
        seed,
        cancel,
      }: {
        row: (typeof rows)[number];
        seed?: string;
        cancel: () => void;
      }) => (
        <FieldCellEditor
          type={type}
          label={key}
          value={row[key]}
          seed={seed}
          onCommit={(next) => {
            commits.push([key, next]);
            cancel();
          }}
          onCancel={cancel}
        />
      ),
    },
  });
  await render(
    <DataGrid
      aria-label="Requests"
      columns={[
        column("text", "name"),
        column("long_text", "notes"),
        column("date", "due"),
      ]}
      data={rows}
      getRowId={(row) => row.id}
    />,
  );
  const cell = (key: string) =>
    document.querySelector<HTMLElement>(
      `[data-grid-row="r1"][data-grid-key="${key}"]`,
    )!;
  const editing = () =>
    document.querySelector('[data-slot="field-cell-editor"]');

  cell("name").focus();
  await userEvent.keyboard("xyz{Enter}");
  await vi.waitFor(() => expect(commits.at(-1)).toEqual(["name", "xyz"]));

  // Long text: the first key is the document, and the next keys follow it (not before it).
  cell("notes").focus();
  await userEvent.keyboard("xyz");
  const text = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="popover-content"] [contenteditable="true"]',
    )?.textContent;
  await vi.waitFor(() => expect(text()).toBe("xyz"));
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await vi.waitFor(() => expect(commits.at(-1)).toEqual(["notes", "xyz"]));
  await vi.waitFor(() => expect(editing()).toBeNull());

  // A date opens a field that takes the typed date, starting from the key.
  cell("due").focus();
  await userEvent.keyboard("1");
  const dateField = () =>
    document.querySelector<HTMLInputElement>(
      '[data-slot="field-cell-editor"] input[aria-label="due"]',
    );
  await vi.waitFor(() => expect(dateField()?.value).toBe("1"));
  await expect.element(dateField()!).toHaveFocus();
  // The test browser's locale (en-US) writes the month first.
  await userEvent.keyboard("2/5/2026{Enter}");
  await vi.waitFor(() => expect(commits.at(-1)).toEqual(["due", "2026-12-05"]));

  // A date that isn't one stays open, marked invalid; Escape leaves the value as it was.
  cell("due").focus();
  await userEvent.keyboard("q{Enter}");
  await vi.waitFor(() =>
    expect(dateField()?.getAttribute("aria-invalid")).toBe("true"),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(editing()).toBeNull());
  expect(commits).toHaveLength(3);

  // Words and month names: "today" and "Mar 12".
  cell("due").focus();
  await userEvent.keyboard("mar 12, 2027{Enter}");
  await vi.waitFor(() => expect(commits.at(-1)).toEqual(["due", "2027-03-12"]));
});

test("in a grid: Tab leaves from a cell holding link chips, and the chips are reached from the cell", async () => {
  const targets = [
    {
      id: "c1",
      kind: "customer",
      label: "Greenfield Campus Authority",
      href: "/c/1",
    },
    { id: "c2", kind: "customer", label: "Lumen Build", href: "/c/2" },
  ];
  const rows = [
    { id: "r1", links: targets },
    { id: "r2", links: targets },
  ];
  const screen = await render(
    <>
      <DataGrid
        aria-label="Requests"
        columns={[
          {
            key: "links",
            header: "Customer",
            minWidth: 10,
            render: (row) => <FieldCellDisplay type="link" value={row.links} />,
          },
        ]}
        data={rows}
        getRowId={(row) => row.id}
      />
      <button type="button">After the grid</button>
    </>,
  );
  const cell = document.querySelector<HTMLElement>(
    '[data-grid-row="r1"][data-grid-key="links"]',
  )!;
  // Every chip is out of the tab order: the grid is one tab stop.
  await vi.waitFor(() => {
    const chips = document.querySelectorAll<HTMLElement>(
      '[data-slot="data-grid-cell"] a[href]',
    );
    expect(chips.length).toBe(4);
    for (const chip of chips) expect(chip.tabIndex).toBe(-1);
  });
  cell.focus();
  await userEvent.keyboard("{Tab}");
  await expect
    .element(screen.getByRole("button", { name: "After the grid" }))
    .toHaveFocus();
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
  await vi.waitFor(() => expect(document.activeElement).toBe(cell));

  // Enter moves into the cell's first chip (its name shows as it takes focus), arrows step
  // through the chips, Escape returns to the cell.
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toContain(
      "Greenfield Campus Authority",
    ),
  );
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement?.textContent).toContain("Lumen Build");
  await userEvent.keyboard("{Escape}");
  expect(document.activeElement).toBe(cell);
});
