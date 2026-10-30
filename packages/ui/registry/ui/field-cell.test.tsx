import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataGrid } from "./data-grid";
import { InlineChipProvider } from "./inline-chip";
import { TimeZoneProvider } from "./relative-time";
import { PropertyList } from "./property-list";
import {
  FieldCellDisplay,
  FieldCellEditor,
  FieldInput,
  FieldProperty,
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

test("a choice shows as a badge in its hue, in the cell and in the editor's list", async () => {
  const screen = await render(
    <FieldCellDisplay
      type="single_choice"
      value="sent"
      config={{ options: OPTIONS }}
    />,
  );
  const badge = screen.container.querySelector('[data-slot="badge"]');
  expect(badge?.getAttribute("data-hue")).toBe("green");
  expect(badge?.textContent).toBe("Sent");
  await screen.rerender(
    <FieldCellEditor
      type="single_choice"
      label="Status"
      value="sent"
      config={{ options: OPTIONS }}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );
  // The cell is the trigger: its badge, no field chrome and no chevron around it.
  const editor = screen.container.querySelector(
    '[data-slot="field-cell-editor"]',
  )!;
  expect(
    editor.querySelector('[data-slot="field-cell-choice-trigger"] [data-hue]'),
  ).not.toBeNull();
  expect(editor.querySelector("svg")).toBeNull();
  // The list is open with its search field, each option a badge, the chosen one checked.
  await expect.element(screen.getByLabelText("Search options")).toBeVisible();
  const sent = screen.getByRole("option", { name: "Sent" });
  await expect.element(sent).toHaveAttribute("aria-selected", "true");
  expect(sent.element().querySelector('[data-hue="green"]')).not.toBeNull();
  await expectNoA11yViolations(document.body);
});

test("a multiple choice toggles with its list open and commits on Tab; Escape cancels", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const editor = (key: string) => (
    <FieldCellEditor
      key={key}
      type="multi_choice"
      label="Stages"
      value={["req"]}
      config={{ options: OPTIONS }}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
  const screen = await render(editor("a"));
  await screen.getByRole("option", { name: "Sent" }).click();
  await screen.getByRole("option", { name: "Requested" }).click();
  // Still open: each pick toggled, nothing committed yet.
  await expect.element(screen.getByRole("listbox")).toBeVisible();
  expect(onCommit).not.toHaveBeenCalled();
  await userEvent.keyboard("{Tab}");
  expect(onCommit).toHaveBeenCalledWith(["sent"], "right");

  await screen.rerender(editor("b"));
  await screen.getByRole("option", { name: "Closed" }).click();
  await userEvent.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenCalledTimes(1);

  // An added option stays chosen while the host's options catch up.
  await screen.rerender(
    <FieldCellEditor
      key="add"
      type="multi_choice"
      label="Stages"
      value={["req"]}
      config={{
        options: OPTIONS,
        onCreateOption: async (label) => ({ id: "lost", label }),
      }}
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await screen.getByLabelText("Search options").fill("Lost");
  await screen.getByRole("option", { name: "Add “Lost”" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Lost" }))
    .toHaveAttribute("aria-selected", "true");
  await screen.getByLabelText("Search options").fill("");
  await screen.getByRole("option", { name: "Sent" }).click();
  await userEvent.keyboard("{Tab}");
  expect(onCommit.mock.calls.at(-1)).toEqual([
    ["req", "lost", "sent"],
    "right",
  ]);

  // A click away commits what is ticked.
  await screen.rerender(editor("c"));
  await screen.getByRole("option", { name: "Closed" }).click();
  await userEvent.click(document.body, { position: { x: 1, y: 1 } });
  await expect
    .poll(() => onCommit.mock.calls.at(-1))
    .toEqual([["req", "closed"], undefined]);
});

test("a single-choice cell waits for an option still being added, then commits it", async () => {
  let resolve: (option: { id: string; label: string }) => void = () => {};
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="single_choice"
      label="Status"
      value={null}
      config={{
        options: OPTIONS,
        onCreateOption: () => new Promise((done) => (resolve = done)),
      }}
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await screen.getByLabelText("Search options").fill("Lost");
  await screen.getByRole("option", { name: "Add “Lost”" }).click();
  await new Promise((done) => setTimeout(done, 50));
  expect(onCancel).not.toHaveBeenCalled();
  resolve({ id: "lost", label: "Lost" });
  await expect.poll(() => onCommit.mock.calls.length).toBe(1);
  expect(onCommit.mock.calls[0]![0]).toBe("lost");
  expect(onCancel).not.toHaveBeenCalled();
});

test("a tap on a choice cell's +N shows the hidden names", async () => {
  const screen = await render(
    <FieldCellDisplay
      type="multi_choice"
      value={["req", "sent", "recv", "closed"]}
      config={{ options: OPTIONS }}
    />,
  );
  (
    screen.container.querySelector(
      '[data-slot="field-cell-more"]',
    ) as HTMLElement
  ).click();
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="tooltip-content"]')?.textContent,
    )
    .toBe("Received, Closed");
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
  // Focus goes to the list's search field — never a picker's hidden form input.
  await expect.element(screen.getByLabelText("Search options")).toHaveFocus();
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

test("in a grid: Enter and F2 open every picker with its list, and long text with the caret at the end of its value", async () => {
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
    // The caret sits at the end of the value, nothing selected: typing goes on from it.
    await userEvent.keyboard(" more");
    await vi.waitFor(() =>
      expect(
        document.querySelector<HTMLElement>(
          '[data-slot="popover-content"] [contenteditable="true"]',
        )?.textContent,
      ).toBe("First more"),
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

  // A key Markdown reads as structure is the character typed: "#" is not a heading.
  cell("notes").focus();
  await userEvent.keyboard("#");
  await vi.waitFor(() => expect(text()).toBe("#"));
  expect(
    document.querySelector(
      '[data-slot="popover-content"] [contenteditable="true"] h1',
    ),
  ).toBeNull();
  await userEvent.keyboard("{Escape}");
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

  // Month names, with or without a year.
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

test("in a grid: Alt+Enter reaches an editable cell's link chips, and Enter on one follows it", async () => {
  const targets = [
    { id: "c1", kind: "customer", label: "Greenfield", href: "/c/1" },
    { id: "c2", kind: "customer", label: "Lumen", href: "/c/2" },
  ];
  const followed: string[] = [];
  const follow = (event: MouseEvent) => {
    const link = (event.target as Element).closest("a[href]");
    if (!link) return;
    event.preventDefault();
    followed.push(link.getAttribute("href")!);
  };
  document.addEventListener("click", follow, true);
  try {
    await render(
      <DataGrid
        aria-label="Requests"
        columns={[
          { key: "name", header: "Name", minWidth: 10 },
          {
            key: "links",
            header: "Customer",
            minWidth: 10,
            render: (row) => <FieldCellDisplay type="link" value={row.links} />,
            editable: {
              type: "custom",
              render: ({ cancel }) => (
                <input aria-label="Customer editor" onBlur={cancel} />
              ),
            },
          },
        ]}
        data={[{ id: "r1", name: "One", links: targets }]}
        getRowId={(row) => row.id}
      />,
    );
    const cell = document.querySelector<HTMLElement>(
      '[data-grid-row="r1"][data-grid-key="links"]',
    )!;
    await vi.waitFor(() =>
      expect(cell.querySelector<HTMLElement>("a[href]")?.tabIndex).toBe(-1),
    );
    cell.focus();
    await userEvent.keyboard("{Alt>}{Enter}{/Alt}");
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toContain("Greenfield"),
    );
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toContain("Lumen");
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(followed).toEqual(["/c/2"]));
    expect(
      document.querySelector('input[aria-label="Customer editor"]'),
    ).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(cell);
  } finally {
    document.removeEventListener("click", follow, true);
  }
});

test('FieldCellEditor: a typed "today" is the day in the reader\'s time zone', async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-26T01:00:00Z") });
  try {
    const onCommit = vi.fn();
    await render(
      <TimeZoneProvider timeZone="America/Los_Angeles">
        <FieldCellEditor
          type="date"
          label="Due"
          value={null}
          seed="t"
          onCommit={onCommit}
          onCancel={() => {}}
        />
      </TimeZoneProvider>,
    );
    await userEvent.keyboard("oday{Enter}");
    expect(onCommit).toHaveBeenLastCalledWith("2026-10-25", "down");
  } finally {
    vi.useRealTimers();
  }
});

test("in a grid: @ in a long-text cell opens the mention menu, and choosing a person inserts the chip with the popover still open", async () => {
  const commits: FieldValue[] = [];
  const config: FieldConfig = {
    mentions: {
      kinds: [{ id: "user", noun: "Person", plural: "People", order: 0 }],
      search: async () => [{ kind: "user", id: "u1", label: "Asha Rao" }],
    },
  };
  await render(
    <DataGrid
      aria-label="Requests"
      columns={[
        {
          key: "notes",
          header: "Notes",
          minWidth: 10,
          editable: {
            type: "custom",
            render: ({ row, seed, cancel }) => (
              <FieldCellEditor
                type="long_text"
                label="Notes"
                value={row.notes}
                seed={seed}
                config={config}
                onCommit={(next) => {
                  commits.push(next);
                  cancel();
                }}
                onCancel={cancel}
              />
            ),
          },
        },
      ]}
      data={[{ id: "r1", notes: "" }]}
      getRowId={(row) => row.id}
    />,
  );
  const cell = document.querySelector<HTMLElement>(
    '[data-grid-row="r1"][data-grid-key="notes"]',
  )!;
  cell.focus();
  await userEvent.keyboard("{Enter}");
  const editor = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="popover-content"] [contenteditable="true"]',
    );
  await vi.waitFor(() =>
    expect(
      document.activeElement?.closest('[data-slot="popover-content"]'),
    ).not.toBeNull(),
  );
  await userEvent.keyboard("Hi @");
  const menu = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="suggestion-menu"][data-menu="text-edit-mention"]',
    );
  await vi.waitFor(() => expect(menu()?.textContent).toContain("Asha Rao"));
  // The menu is portalled outside the cell's popover: choosing in it is not an outside press.
  await userEvent.click(
    [...menu()!.querySelectorAll<HTMLElement>('[role="option"]')].find((o) =>
      o.textContent?.includes("Asha Rao"),
    )!,
  );
  await vi.waitFor(() =>
    expect(
      editor()?.querySelector('[data-slot="inline-chip"]')?.textContent,
    ).toContain("Asha Rao"),
  );
  expect(commits).toHaveLength(0);
  expect(editor()).not.toBeNull();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await vi.waitFor(() => expect(commits).toHaveLength(1));
  expect(String(commits[0])).toContain("mention://user/u1");
});

/* ---- FieldProperty (Regent POL-30) ---------------------------------------------------------- */

function Property(props: Partial<React.ComponentProps<typeof FieldProperty>>) {
  return (
    <PropertyList variant="inline" aria-label="Fields">
      <FieldProperty label="Stage" type="text" value="Open" {...props} />
    </PropertyList>
  );
}

test("FieldProperty: the grid's value in a property row; a click opens the cell editor, Enter saves", async () => {
  const onSave = vi.fn(() => Promise.resolve());
  const screen = await render(<Property onSave={onSave} />);
  const row = screen.container.querySelector('[data-slot="field-property"]')!;
  expect(row.querySelector('[data-slot="property-label"]')?.textContent).toBe(
    "Stage",
  );
  await userEvent.click(screen.getByText("Open"));
  const field = screen.getByRole("textbox", { name: "Stage" });
  await expect.element(field).toHaveFocus();
  await userEvent.keyboard("{End} won{Enter}");
  expect(onSave).toHaveBeenCalledWith("Open won");
  await expectNoA11yViolations(screen.container);
});

test("FieldProperty: a typed character opens the editor from it (type-to-edit)", async () => {
  const onSave = vi.fn(() => Promise.resolve());
  const screen = await render(<Property onSave={onSave} />);
  const display = screen.container.querySelector<HTMLElement>(
    '[data-slot="editable-cell-display"]',
  )!;
  display.focus();
  await userEvent.keyboard("W");
  const field = screen.getByRole("textbox", { name: "Stage" });
  await expect.element(field).toHaveValue("W");
});

test("FieldProperty: a rejected save rolls back the value", async () => {
  const onSave = vi.fn(() => Promise.reject(new Error("no")));
  const screen = await render(
    <Property onSave={onSave} saveErrorToast={false} />,
  );
  await userEvent.click(screen.getByText("Open"));
  await userEvent.keyboard("{End}!{Enter}");
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector('[data-slot="field-property"] dd')
        ?.textContent,
    ).toContain("Open"),
  );
  expect(
    screen.container.querySelector('[data-slot="field-property"] dd')
      ?.textContent,
  ).not.toContain("Open!");
});

test("FieldProperty: read-only types and readOnly never edit; empty reads Empty; conflict says so", async () => {
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Created"
        type="created_at"
        value="2026-10-01T10:00:00Z"
        onSave={() => {}}
      />
      <FieldProperty label="Notes" type="text" value={null} readOnly />
      <FieldProperty
        label="Site"
        type="url"
        value="https://example.com"
        onSave={() => {}}
        conflict
      />
    </PropertyList>,
  );
  const rows = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="field-property"]',
  );
  expect(rows[0]!.hasAttribute("data-read-only")).toBe(true);
  expect(rows[0]!.querySelector('[data-slot="editable-cell"]')).toBeNull();
  expect(rows[1]!.textContent).toContain("Empty");
  expect(rows[1]!.querySelector('[data-slot="editable-cell"]')).toBeNull();
  expect(
    rows[2]!.querySelector('[data-slot="field-property-conflict"]')
      ?.textContent,
  ).toBe("Someone changed this field.");
  await expectNoA11yViolations(screen.container);
});

test("FieldProperty: a checkbox toggles in place, named by its field, and rolls back on a failed save", async () => {
  let fail = false;
  const onSave = vi.fn(() =>
    fail ? Promise.reject(new Error("no")) : Promise.resolve(),
  );
  function Box() {
    const [value, setValue] = React.useState<FieldValue>(false);
    return (
      <PropertyList aria-label="Fields">
        <FieldProperty
          label="Paid"
          type="checkbox"
          value={value}
          saveErrorToast={false}
          onSave={async (next) => {
            await onSave();
            setValue(next);
          }}
        />
      </PropertyList>
    );
  }
  const screen = await render(<Box />);
  const box = screen.getByRole("checkbox", { name: "Paid" });
  // This lane compiles no CSS (the 16px box has no size here): click the element itself.
  (box.element() as HTMLElement).click();
  await expect.element(box).toHaveAttribute("aria-checked", "true");
  expect(
    screen.container.querySelector('[data-slot="editable-cell"]'),
  ).toBeNull();
  fail = true;
  (box.element() as HTMLElement).click();
  await vi.waitFor(() =>
    expect(box.element().getAttribute("aria-checked")).toBe("true"),
  );
});

test("FieldProperty: a linked value (a URL) stays a link; the Edit pencil beside it opens the editor", async () => {
  const onSave = vi.fn(() => Promise.resolve());
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Site"
        type="url"
        value="https://example.com"
        onSave={onSave}
      />
    </PropertyList>,
  );
  const link = screen.getByRole("link", { name: "https://example.com" });
  await expect.element(link).toBeInTheDocument();
  expect(link.element().closest('[role="button"]')).toBeNull();
  (
    screen.getByRole("button", { name: "Edit Site" }).element() as HTMLElement
  ).click();
  const field = screen.getByRole("textbox", { name: "Site" });
  await expect.element(field).toHaveFocus();
  await userEvent.fill(field, "https://vegastack.com");
  await userEvent.keyboard("{Enter}");
  expect(onSave).toHaveBeenCalledWith("https://vegastack.com");
  await expectNoA11yViolations(screen.container);
});

test("FieldProperty: the same person picked again (keys in another order) saves nothing", async () => {
  const onSave = vi.fn(() => Promise.resolve());
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Owner"
        type="person"
        value={{ name: "Asha", id: "u1" } as unknown as FieldValue}
        config={{ people: [{ id: "u1", name: "Asha" }] }}
        onSave={onSave}
      />
    </PropertyList>,
  );
  await userEvent.click(screen.getByText("Asha"));
  const option = await vi.waitFor(() => {
    const el = document.querySelector<HTMLElement>('[role="option"]');
    if (!el) throw new Error("no option");
    return el;
  });
  option.click();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(onSave).not.toHaveBeenCalled();
});

test("FieldProperty: a file field shows its files and never edits", async () => {
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Drawings"
        type="file"
        value={[{ id: "f1", name: "plan.pdf" }]}
        onSave={() => {}}
      />
    </PropertyList>,
  );
  const row = screen.container.querySelector('[data-slot="field-property"]')!;
  expect(row.hasAttribute("data-read-only")).toBe(true);
  expect(row.querySelector('[data-slot="field-property-edit"]')).toBeNull();
});

test("FieldProperty: managed focus — no tab stops of its own; a host opens the editor through `editing`", async () => {
  function Host() {
    const [editing, setEditing] = React.useState(false);
    return (
      <>
        <button type="button" onClick={() => setEditing(true)}>
          Open
        </button>
        <PropertyList aria-label="Fields">
          <FieldProperty
            label="Site"
            type="url"
            value="https://example.com"
            onSave={() => {}}
            focusMode="managed"
            editing={editing}
            onEditingChange={setEditing}
          />
          <FieldProperty
            label="Paid"
            type="checkbox"
            value={false}
            onSave={() => {}}
            focusMode="managed"
          />
        </PropertyList>
      </>
    );
  }
  const screen = await render(<Host />);
  const link = screen.getByRole("link", { name: "https://example.com" });
  expect(link.element().getAttribute("tabindex")).toBe("-1");
  expect(
    screen
      .getByRole("button", { name: "Edit Site" })
      .element()
      .getAttribute("tabindex"),
  ).toBe("-1");
  expect(
    screen
      .getByRole("checkbox", { name: "Paid" })
      .element()
      .getAttribute("tabindex"),
  ).toBe("-1");
  (
    screen.getByRole("button", { name: "Open" }).element() as HTMLElement
  ).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Site" }))
    .toHaveFocus();
  await expectNoA11yViolations(screen.container);
});

test("FieldProperty: long text edits in place (no popover) and commits when focus leaves", async () => {
  const onSave = vi.fn((_next: FieldValue) => Promise.resolve());
  const screen = await render(
    <>
      <PropertyList aria-label="Fields">
        <FieldProperty
          label="Notes"
          type="long_text"
          value="First line"
          onSave={onSave}
        />
      </PropertyList>
      <button type="button">Elsewhere</button>
    </>,
  );
  await userEvent.click(screen.getByText("First line"));
  const editor = await vi.waitFor(() => {
    const el = screen.container.querySelector<HTMLElement>(
      '[data-slot="field-property-long-text"] .ProseMirror',
    );
    if (!el) throw new Error("no editor");
    return el;
  });
  expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  editor.focus();
  await userEvent.keyboard("{Control>}{End}{/Control} more");
  await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
  await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(onSave.mock.calls[0]![0]).toContain("more");
});

test("FieldProperty: Enter commits and keeps focus on the value; Tab commits and moves to the next row", async () => {
  const onSave = vi.fn((_next: FieldValue) => Promise.resolve());
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty label="Name" type="text" value="Alpha" onSave={onSave} />
      <FieldProperty label="Code" type="text" value="B-2" onSave={onSave} />
    </PropertyList>,
  );
  const displays = () =>
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="editable-cell-display"]',
    );
  await userEvent.click(screen.getByText("Alpha"));
  await userEvent.keyboard("{End}!{Enter}");
  await vi.waitFor(() => expect(document.activeElement).toBe(displays()[0]));
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByRole("textbox", { name: "Name" }))
    .toHaveFocus();
  await userEvent.keyboard("{Tab}");
  await vi.waitFor(() => expect(document.activeElement).toBe(displays()[1]));
});

test("FieldProperty: long text — Escape reverts; a typed character's edit is saved when focus leaves", async () => {
  const onSave = vi.fn((_next: FieldValue) => Promise.resolve());
  const screen = await render(
    <>
      <PropertyList aria-label="Fields">
        <FieldProperty
          label="Notes"
          type="long_text"
          value="First line"
          onSave={onSave}
        />
      </PropertyList>
      <button type="button">Elsewhere</button>
    </>,
  );
  const editor = async () =>
    vi.waitFor(() => {
      const el = screen.container.querySelector<HTMLElement>(
        '[data-slot="field-property-long-text"] .ProseMirror',
      );
      if (!el) throw new Error("no editor");
      return el;
    });
  await userEvent.click(screen.getByText("First line"));
  (await editor()).focus();
  await userEvent.keyboard(" changed{Escape}");
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector('[data-slot="field-property-long-text"]'),
    ).toBeNull(),
  );
  expect(onSave).not.toHaveBeenCalled();
  // Type-to-edit: "W" replaces the value, and leaving saves it.
  const display = screen.container.querySelector<HTMLElement>(
    '[data-slot="editable-cell-display"]',
  )!;
  display.focus();
  await userEvent.keyboard("W");
  await editor();
  await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
  await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(String(onSave.mock.calls[0]![0])).toContain("W");
});

test("FieldProperty: Tab out of a linked value's editor goes on to the next control", async () => {
  const screen = await render(
    <>
      <PropertyList aria-label="Fields">
        <FieldProperty
          label="Site"
          type="url"
          value="https://example.com"
          onSave={() => Promise.resolve()}
        />
      </PropertyList>
      <button type="button">After</button>
    </>,
  );
  (
    screen.getByRole("button", { name: "Edit Site" }).element() as HTMLElement
  ).click();
  await expect
    .element(screen.getByRole("textbox", { name: "Site" }))
    .toHaveFocus();
  await userEvent.keyboard("{Tab}");
  await expect
    .element(screen.getByRole("button", { name: "After" }))
    .toHaveFocus();
});

test("FieldProperty: an older save settling late never overrides a newer one", async () => {
  const resolvers: (() => void)[] = [];
  const onSave = vi.fn(
    () => new Promise<void>((resolve) => resolvers.push(resolve)),
  );
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Paid"
        type="checkbox"
        value={false}
        onSave={onSave}
      />
    </PropertyList>,
  );
  const box = screen.getByRole("checkbox", { name: "Paid" });
  (box.element() as HTMLElement).click(); // → true (pending)
  await expect.element(box).toHaveAttribute("aria-checked", "true");
  (box.element() as HTMLElement).click(); // → false (pending, newer)
  await expect.element(box).toHaveAttribute("aria-checked", "false");
  resolvers[0]!(); // the older save settles: the newer pending value stays shown
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(box.element().getAttribute("aria-checked")).toBe("false");
  expect(onSave).toHaveBeenCalledTimes(2);
});

test("FieldProperty: a synchronous save after a pending one supersedes it", async () => {
  let rejectFirst!: (error: unknown) => void;
  let calls = 0;
  const onSave = vi.fn(() => {
    calls++;
    if (calls === 1)
      return new Promise<void>((_resolve, reject) => {
        rejectFirst = reject;
      });
    return undefined;
  });
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Paid"
        type="checkbox"
        value={false}
        onSave={onSave}
        saveErrorToast={false}
      />
    </PropertyList>,
  );
  const box = screen.getByRole("checkbox", { name: "Paid" });
  (box.element() as HTMLElement).click(); // async → true (pending)
  await expect.element(box).toHaveAttribute("aria-checked", "true");
  (box.element() as HTMLElement).click(); // sync: no pending value; shows the persisted value
  await expect.element(box).toHaveAttribute("aria-checked", "false");
  rejectFirst(new Error("late"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(box.element().getAttribute("aria-checked")).toBe("false");
  expect(document.body.textContent).not.toContain("Couldn't save Paid");
});

test("FieldProperty: a number sits at the start of its property row; a grid's number stays at the end", async () => {
  const screen = await render(
    <>
      <PropertyList aria-label="Fields">
        <FieldProperty
          label="Budget"
          type="currency"
          value={5000}
          config={{ currency: "EUR" }}
          readOnly
        />
        <FieldProperty label="Total" type="calculated" value={2480} />
        <FieldProperty label="Qty" type="number" value={2} onSave={() => {}} />
      </PropertyList>
      <div data-testid="cell">
        <FieldCellDisplay type="number" value={7} />
      </div>
    </>,
  );
  const rows = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="field-property"]',
  );
  expect(rows).toHaveLength(3);
  // The harness compiles no CSS: the classes are the claim.
  for (const row of rows) {
    const display = row.querySelector<HTMLElement>(
      '[data-slot="field-cell-display"]',
    )!;
    expect(display.classList.contains("justify-end")).toBe(false);
    expect(display.classList.contains("justify-start")).toBe(true);
  }
  const cell = screen.getByTestId("cell").element();
  expect(
    cell
      .querySelector('[data-slot="field-cell-display"]')!
      .classList.contains("justify-end"),
  ).toBe(true);
});

test("FieldProperty: an editable long text at rest reads as the grid's display — escapes undone, mentions by name", async () => {
  const markdown = "\\# 2 for [@Asha Rao](mention://user/u1)\nCall first.";
  const screen = await render(
    <PropertyList aria-label="Fields">
      <FieldProperty
        label="Notes"
        type="long_text"
        value={markdown}
        onSave={() => {}}
      />
      <FieldProperty label="Brief" type="long_text" value={markdown} readOnly />
    </PropertyList>,
  );
  const grid = await render(
    <FieldCellDisplay type="long_text" value={markdown} />,
  );
  const shown = grid.container.textContent;
  expect(shown).toBe("# 2 for Asha Rao");
  const values = screen.container.querySelectorAll(
    '[data-slot="property-value"]',
  );
  for (const value of values) {
    expect(value.textContent).toBe(shown);
    expect(value.textContent).not.toContain("mention://");
  }
  // Only the editor shows the source.
  await userEvent.click(screen.getByText("# 2 for Asha Rao").first());
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector('[data-slot="field-property-long-text"]'),
    ).not.toBeNull(),
  );
});

test('FieldCellDisplay variant="cell": plain numbers, bare links, clipped dates, every person named', async () => {
  const screen = await render(
    <FieldCellDisplay type="number" value={12345.5} variant="cell" />,
  );
  const text = () => screen.container.textContent ?? "";
  expect(text()).not.toContain(",");
  expect(text()).toContain("12345.5");
  await screen.rerender(
    <FieldCellDisplay
      type="currency"
      value={12345.5}
      config={{ currency: "USD" }}
      variant="cell"
    />,
  );
  // Only a currency groups its digits.
  expect(text()).toContain(",");
  await screen.rerender(
    <FieldCellDisplay type="percent" value={0.125} variant="cell" />,
  );
  expect(text()).toContain("12.5%");
  await screen.rerender(
    <FieldCellDisplay type="url" value="https://example.com/" variant="cell" />,
  );
  expect(text()).toBe("example.com");
  expect(screen.container.querySelector("a")?.getAttribute("href")).toBe(
    "https://example.com/",
  );
  await screen.rerender(
    <FieldCellDisplay
      type="person"
      value={[
        { id: "u1", name: "Ada Lovelace" },
        { id: "u2", name: "Grace Hopper" },
        { id: "u3", name: "Edsger Dijkstra" },
        { id: "u4", name: "Alan Turing" },
      ]}
      variant="cell"
    />,
  );
  for (const name of ["Ada", "Grace", "Edsger", "Alan"])
    expect(text()).toContain(name);
  expect(
    screen.container
      .querySelector('[data-slot="field-cell-display"]')
      ?.getAttribute("data-variant"),
  ).toBe("cell");
  // The default variant is untouched: a number groups, a link keeps its scheme.
  await screen.rerender(<FieldCellDisplay type="number" value={12345.5} />);
  expect(text()).toContain(",");
});

test('FieldCellEditor variant="cell": text is one wrapping paragraph that commits null when emptied', async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="text"
      label="Name"
      value="Acme"
      variant="cell"
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  const field = screen.getByRole("textbox", { name: "Name" });
  expect(field.element().tagName).toBe("TEXTAREA");
  await expect.element(field).toHaveFocus();
  // The caret is after the value; a typed Enter commits and moves down (never a second line).
  // Newlines (a paste) become spaces; Shift+Enter commits and moves up, never a second line.
  await field.fill("Acme and\nSons");
  expect((field.element() as HTMLTextAreaElement).value).toBe("Acme and Sons");
  await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
  expect(onCommit).toHaveBeenCalledWith("Acme and Sons", "up");

  const emptied = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="empty"
      type="text"
      label="Name"
      value="Acme"
      variant="cell"
      onCommit={emptied}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("{Backspace>4/}{Tab}");
  expect(emptied).toHaveBeenCalledWith(null, "right");

  // Type-to-edit: the key that opened the editor replaces the value.
  const seeded = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="seed"
      type="text"
      label="Name"
      value="Acme"
      seed="Z"
      variant="cell"
      onCommit={seeded}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("ed{Enter}");
  expect(seeded).toHaveBeenCalledWith("Zed", "down");
});

test('FieldCellEditor variant="cell": a number is typed as written, steps by 1, and cancels on an unreadable draft', async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="number"
      label="Qty"
      value={2026}
      variant="cell"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  const field = screen.getByRole("textbox", { name: "Qty" });
  await expect.element(field).toHaveFocus();
  // No digit grouping, no steppers.
  expect((field.element() as HTMLInputElement).value).toBe("2026");
  expect(screen.container.querySelector('[data-slot^="number-field-"]')).toBe(
    null,
  );
  await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}");
  expect((field.element() as HTMLInputElement).value).toBe("2027");
  // Letters are not typable; "1." is a step on the way to a number and commits as 1.
  await field.fill("");
  await userEvent.keyboard("x1.");
  expect((field.element() as HTMLInputElement).value).toBe("1.");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledWith(1, "down");

  // "-" never becomes a number: Enter commits nothing, leaving cancels.
  const stuck = vi.fn();
  const left = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="dash"
      type="number"
      label="Qty"
      value={null}
      seed="-"
      variant="cell"
      onCommit={stuck}
      onCancel={left}
    />,
  );
  await userEvent.keyboard("{Enter}");
  expect(stuck).not.toHaveBeenCalled();
  expect(
    screen.container
      .querySelector('[aria-label="Qty"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
  await userEvent.click(document.body);
  expect(left).toHaveBeenCalledTimes(1);
  expect(stuck).not.toHaveBeenCalled();
});
