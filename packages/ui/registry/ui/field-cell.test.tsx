import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataGrid } from "./data-grid";
import { InlineChipProvider } from "./inline-chip";
import { TimeZoneProvider } from "./relative-time";
import { PropertyList } from "./property-list";
import {
  FieldCellDisplay,
  FIELD_TYPE_ICONS,
  FIELD_TYPE_LABELS,
  FieldCellEditor,
  FieldInput,
  FieldTypeIcon,
  FieldProperty,
  isValidFieldText,
  type FieldConfig,
  type FieldPerson,
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

test("variant=cell: every value lays out on the 20px line, so no type grows a fixed-height row", async () => {
  // A 24px part (a clipped name's target, a chip's, an avatar, a link) made a cell 36px, which with
  // the row's 1px rule grew a `short` row as such a column scrolled into view (zoomed in, most).
  const cases = [
    ["text", "Filled", undefined],
    ["number", 12, undefined],
    ["single_choice", "sent", { options: OPTIONS }],
    ["multi_choice", ["sent"], { options: OPTIONS }],
    ["person", { id: "u1", name: "Asha Rao" }, undefined],
    ["url", "example.com", undefined],
    ["email", "a@example.com", undefined],
  ] as const;
  await render(
    <ul>
      {cases.map(([type, value, config]) => (
        <li key={type} data-case={type}>
          <FieldCellDisplay
            variant="cell"
            type={type}
            value={value as FieldValue}
            config={config}
          />
        </li>
      ))}
      <li data-case="default">
        <FieldCellDisplay
          type="single_choice"
          value="sent"
          config={{ options: OPTIONS }}
        />
      </li>
    </ul>,
  );
  const root = (name: string) =>
    document.querySelector<HTMLElement>(
      `li[data-case="${name}"] [data-slot="field-cell-display"]`,
    )!;
  for (const [type] of cases) {
    expect(root(type).className).toContain("h-5");
    // A min-height would beat the 20px line.
    expect(root(type).className).not.toContain("min-h-6");
  }
  // Outside a cell a value keeps its own 24px box.
  expect(root("default").className).toContain("min-h-6");
  expect(root("default").className).not.toContain("h-5 ");
});

test("a choice chip keeps its hue inside a highlighted picker row (data-icon-tone)", async () => {
  await render(
    <FieldCellDisplay
      type="single_choice"
      value="sent"
      config={{ options: OPTIONS }}
    />,
  );
  // Select, Combobox and Command rows recolour their contents on highlight except under
  // `data-icon-tone`; the chip carries it so its label stays in the option's hue.
  const chip = document.querySelector<HTMLElement>("[data-hue]")!;
  expect(chip.dataset.hue).toBe("green");
  expect(chip.hasAttribute("data-icon-tone")).toBe(true);
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

  // A chosen single choice clears from its own list (the cell is the trigger, so no control).
  const clear = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="choice-clear"
      variant="cell"
      type="single_choice"
      label="Status"
      value="sent"
      config={{ options: OPTIONS }}
      onCommit={clear}
      onCancel={() => {}}
    />,
  );
  await screen.getByRole("option", { name: "Clear selection" }).click();
  expect(clear).toHaveBeenCalledWith(null, undefined);
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

/** Opens a date-time editor and returns its typed time field. */
async function openTime(field: string) {
  const trigger = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="date-time-picker-trigger"]',
    ),
  ).find((el) => el.getAttribute("aria-label") === field)!;
  if (!document.querySelector('[data-slot="date-time-picker-content"]'))
    await userEvent.click(trigger);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="date-time-picker-time"] input'),
    ).not.toBeNull(),
  );
  return document.querySelector<HTMLInputElement>(
    '[data-slot="date-time-picker-time"] input',
  )!;
}

/** Types a time into a date-time editor's popup and commits it with Enter. */
async function typeTime(field: string, text: string) {
  await userEvent.fill(await openTime(field), text);
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="date-time-picker-content"]'),
    ).toBeNull(),
  );
}

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
  // 13:30Z is 09:30 in New York (EDT).
  await expect
    .element(screen.getByRole("button", { name: "Visit" }))
    .toHaveTextContent("Oct 24, 2026, 9:30 AM");
  expect((await openTime("Visit")).value).toBe("9:30 AM");
  await typeTime("Visit", "10:00");
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
  await typeTime("A", "02:30");
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
  await typeTime("A", "01:45");
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
  await typeTime("A", "02:30");
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
  await typeTime("A", "02:45");
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

test("FieldCellEditor: a date-time opens its popup; Tab moves inside it, and a time entered with Enter commits and moves down", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  await render(
    <TimeZoneProvider timeZone="UTC">
      <FieldCellEditor
        type="datetime"
        label="Due"
        value="2026-10-24T09:30:00.000Z"
        onCommit={onCommit}
        onCancel={onCancel}
      />
    </TimeZoneProvider>,
  );
  // Open with the editor, focus on the chosen day.
  await vi.waitFor(() =>
    expect(document.activeElement?.hasAttribute("data-day")).toBe(true),
  );
  await userEvent.keyboard("{Tab}");
  expect(onCommit).not.toHaveBeenCalled();
  await vi.waitFor(() =>
    expect(
      document.activeElement?.closest('[data-slot="date-time-picker-time"]'),
    ).not.toBeNull(),
  );
  await userEvent.fill(document.activeElement as HTMLInputElement, "10:00");
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() =>
    expect(onCommit).toHaveBeenCalledWith("2026-10-24T10:00:00.000Z", "down"),
  );
  expect(onCancel).not.toHaveBeenCalled();
});

test("FieldCellEditor: a date-time's popup closed with nothing picked is a dismissal", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  await render(
    <FieldCellEditor
      type="datetime"
      label="Due"
      value="2026-10-24T09:30:00.000Z"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await vi.waitFor(() =>
    expect(document.activeElement?.hasAttribute("data-day")).toBe(true),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  expect(onCommit).not.toHaveBeenCalled();
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

test("FieldProperty: readOnlyHint opens on a double-click or Enter, never on a click", async () => {
  const onSave = vi.fn(() => Promise.resolve());
  const screen = await render(<Property onSave={onSave} readOnlyHint />);
  const field = screen.getByRole("textbox", { name: "Stage" });
  await userEvent.click(screen.getByText("Open"));
  await expect.element(field).not.toBeInTheDocument();
  await userEvent.dblClick(screen.getByText("Open"));
  await expect.element(field).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  await expect.element(field).not.toBeInTheDocument();
  screen.container
    .querySelector<HTMLElement>('[data-slot="editable-cell-display"]')!
    .focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(field).toHaveFocus();
  await expectNoA11yViolations(screen.container);
});

const MARK = { label: "Filled by Asha Rao", content: <span>A</span> };

const markNode = () =>
  document.querySelector<HTMLElement>('[data-slot="field-cell-mark"]');

const tooltipText = () =>
  document.querySelector('[data-slot="tooltip-content"]')?.textContent;

/** Whether a point `dx`,`dy` from the mark's centre lands on the mark. */
function hitsMark(dx: number, dy: number) {
  const box = markNode()!.getBoundingClientRect();
  const at = document.elementFromPoint(
    box.left + box.width / 2 + dx,
    box.top + box.height / 2 + dy,
  );
  return at === markNode();
}

test("a mark sits at either end of the value and is 12px, named on its own", async () => {
  injectCompiledCss();
  const screen = await render(
    <FieldCellDisplay type="text" value="Open" mark={MARK} />,
  );
  await expect
    .element(screen.getByRole("img", { name: "Filled by Asha Rao" }))
    .toBeInTheDocument();
  expect(markNode()!.getBoundingClientRect().width).toBe(12);
  expect(markNode()!.previousElementSibling?.textContent).toBe("Open");
  await expectNoA11yViolations(screen.container);

  await screen.rerender(
    <FieldCellDisplay
      type="text"
      value="Open"
      mark={{ ...MARK, side: "start" }}
    />,
  );
  expect(markNode()!.nextElementSibling?.textContent).toBe("Open");
});

test("a mark on an end-aligned value defaults to its start, so a partly marked column's figures line up", async () => {
  injectCompiledCss();
  const screen = await render(
    <div className="w-48">
      <FieldCellDisplay type="number" value={184} mark={MARK} />
      <FieldCellDisplay type="number" value={184} />
    </div>,
  );
  const [marked, plain] = screen.container.querySelectorAll(
    '[data-slot="truncated-text"]',
  );
  expect(markNode()!.getAttribute("data-side")).toBe("start");
  expect(marked!.getBoundingClientRect().right).toBe(
    plain!.getBoundingClientRect().right,
  );

  await screen.rerender(
    <FieldCellDisplay type="number" value={184} align="start" mark={MARK} />,
  );
  expect(markNode()!.getAttribute("data-side")).toBe("end");
  await screen.rerender(
    <FieldCellDisplay
      type="number"
      value={184}
      mark={{ ...MARK, side: "end" }}
    />,
  );
  expect(markNode()!.getAttribute("data-side")).toBe("end");
});

test("no value, no mark: empty, filling, recalculating, an empty calculated field, a checkbox never set", async () => {
  const screen = await render(
    <FieldCellDisplay type="number" value={null} mark={MARK} />,
  );
  expect(markNode()).toBeNull();
  for (const element of [
    <FieldCellDisplay type="number" value={184} mark={MARK} state="filling" />,
    <FieldCellDisplay
      type="number"
      value={184}
      mark={MARK}
      state="recalculating"
    />,
    <FieldCellDisplay type="calculated" value={null} mark={MARK} />,
    <FieldCellDisplay
      type="calculated"
      value={null}
      config={{ missingInputs: ["Qty"] }}
      mark={MARK}
    />,
    <FieldCellDisplay type="checkbox" value={null} mark={MARK} />,
  ]) {
    await screen.rerender(element);
    expect(markNode()).toBeNull();
  }
  // An unticked box is a value.
  await screen.rerender(
    <FieldCellDisplay type="checkbox" value={false} mark={MARK} />,
  );
  expect(markNode()).not.toBeNull();
});

test("a mark names itself on hover, on keyboard focus and on a tap, axe-clean while open", async () => {
  injectCompiledCss();
  const hover = await render(
    <FieldCellDisplay type="text" value="Open" mark={MARK} />,
  );
  await userEvent.hover(markNode()!);
  await expect.poll(tooltipText).toBe("Filled by Asha Rao");
  await expectNoA11yViolations(document.body);
  await userEvent.unhover(markNode()!);
  await expect.poll(tooltipText).toBeUndefined();
  await hover.unmount();

  const focus = await render(
    <FieldCellDisplay type="text" value="Open" mark={MARK} />,
  );
  await userEvent.tab();
  expect(document.activeElement).toBe(markNode());
  await expect.poll(tooltipText).toBe("Filled by Asha Rao");
  await userEvent.tab();
  await expect.poll(tooltipText).toBeUndefined();
  await focus.unmount();

  await render(<FieldCellDisplay type="text" value="Open" mark={MARK} />);
  markNode()!.dispatchEvent(
    new MouseEvent("click", { bubbles: true, detail: 1 }),
  );
  await expect.poll(tooltipText).toBe("Filled by Asha Rao");
});

test("a mark's target is 24px across, though it draws 12", async () => {
  injectCompiledCss();
  await render(
    <div className="p-4">
      <FieldCellDisplay type="text" value="Open" mark={MARK} />
    </div>,
  );
  for (const [dx, dy] of [
    [-11, -11],
    [11, -11],
    [-11, 11],
    [11, 11],
  ] as const)
    expect(hitsMark(dx, dy)).toBe(true);
  expect(hitsMark(14, 0)).toBe(false);
});

function MarkedGrid({ onOpen }: { onOpen?: () => void }) {
  const editor = {
    type: "custom" as const,
    render: () => <input aria-label="Quantity" autoFocus />,
  };
  return (
    <DataGrid
      aria-label="Lines"
      columns={[
        {
          key: "qty",
          header: "Quantity",
          minWidth: 10,
          editable: editor,
          render: (row: MarkedRow) => (
            <FieldCellDisplay type="number" value={row.qty} mark={MARK} />
          ),
        },
        {
          key: "site",
          header: "Site",
          minWidth: 10,
          render: (row: MarkedRow) => (
            <FieldCellDisplay
              type="url"
              value={row.site}
              mark={{ ...MARK, side: "start" }}
            />
          ),
        },
        { key: "unit", header: "Unit", minWidth: 10 },
      ]}
      data={[{ id: "r1", qty: 184, site: "https://example.com", unit: "m" }]}
      getRowId={(row) => row.id}
      onCellCommit={onOpen}
    />
  );
}

interface MarkedRow {
  id: string;
  qty: number;
  site: string;
  unit: string;
}

const gridCell = (key: string) =>
  document.querySelector<HTMLElement>(
    `[data-slot="data-grid-cell"][data-grid-key="${key}"]`,
  )!;

test("a mark in a grid is no tab stop: on an editable cell Alt+Enter reaches it, and Escape and the arrows carry on", async () => {
  await render(<MarkedGrid />);
  const cell = gridCell("qty");
  const mark = cell.querySelector<HTMLElement>(
    '[data-slot="field-cell-mark"]',
  )!;
  expect(mark.tabIndex).toBe(-1);
  cell.focus();
  await userEvent.keyboard("{Alt>}{Enter}{/Alt}");
  await expect.poll(() => document.activeElement).toBe(mark);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(cell);
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => document.activeElement).toBe(gridCell("site"));
});

test("a press on a mark in an editable cell shows its name and never opens the editor", async () => {
  await render(<MarkedGrid />);
  const mark = gridCell("qty").querySelector<HTMLElement>(
    '[data-slot="field-cell-mark"]',
  )!;
  await userEvent.click(mark);
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(document.querySelector('input[aria-label="Quantity"]')).toBeNull();
  mark.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
  );
  mark.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(document.querySelector('input[aria-label="Quantity"]')).toBeNull();
});

test("a cell's real control comes before its mark, wherever the mark sits", async () => {
  await render(<MarkedGrid />);
  const cell = gridCell("site");
  cell.focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .poll(() => (document.activeElement as HTMLElement).tagName)
    .toBe("A");
});

test("FieldProperty: a mark on an editable value sits beside the edit button: a tab stop, its whole target, its own press", async () => {
  injectCompiledCss();
  const onSave = vi.fn();
  const screen = await render(<Property mark={MARK} onSave={onSave} />);
  const display = screen.container.querySelector<HTMLElement>(
    '[data-slot="editable-cell-display"]',
  )!;
  expect(display.contains(markNode())).toBe(false);
  expect(display.nextElementSibling).toBe(markNode());
  // Before the tooltip opens over it. The value's clipped line no longer cuts the target.
  for (const [dx, dy] of [
    [-11, -11],
    [11, -11],
    [-11, 11],
    [11, 11],
  ] as const)
    expect(hitsMark(dx, dy)).toBe(true);
  display.focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(markNode());
  await expect.poll(tooltipText).toBe("Filled by Asha Rao");
  await userEvent.click(markNode()!);
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(document.querySelector("input")).toBeNull();
  await expectNoA11yViolations(screen.container);

  // Gone while the value edits; none on an empty value.
  await userEvent.click(screen.getByText("Open"));
  await expect.poll(markNode).toBeNull();
  await userEvent.keyboard("{Escape}");
  await screen.rerender(<Property mark={MARK} onSave={onSave} value={null} />);
  await expect.poll(() => document.querySelector("input")).toBeNull();
  expect(markNode()).toBeNull();
});

test("FieldProperty: a mark shows on a read-only row, and a checkbox never set carries none", async () => {
  const screen = await render(<Property mark={MARK} />);
  await expect
    .element(screen.getByRole("img", { name: "Filled by Asha Rao" }))
    .toBeInTheDocument();
  await screen.rerender(
    <Property mark={MARK} type="checkbox" value={null} onSave={() => {}} />,
  );
  expect(markNode()).toBeNull();
  await screen.rerender(
    <Property mark={MARK} type="checkbox" value={false} onSave={() => {}} />,
  );
  expect(markNode()).not.toBeNull();
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

test("a currency with its own grouping keeps it: rupees group in lakhs, others in the reader's locale", async () => {
  const screen = await render(
    <FieldCellDisplay
      type="currency"
      value={588000}
      config={{ currency: "INR" }}
    />,
  );
  const text = () => screen.container.textContent ?? "";
  expect(text()).toBe("₹5,88,000.00");
  await screen.rerender(
    <FieldCellDisplay
      type="currency"
      value={12345678}
      config={{ currency: "INR", decimals: 0 }}
      variant="cell"
    />,
  );
  expect(text()).toBe("₹1,23,45,678");
  await screen.rerender(
    <FieldCellDisplay
      type="currency"
      value={588000}
      config={{ currency: "EUR" }}
    />,
  );
  expect(text()).toBe(
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
    }).format(588000),
  );
  // The editor groups the same way the display does.
  await screen.rerender(
    <FieldInput
      type="currency"
      aria-label="Budget"
      value={588000}
      config={{ currency: "INR" }}
      onChange={() => {}}
    />,
  );
  expect(
    (screen.container.querySelector("input") as HTMLInputElement).value,
  ).toBe("₹5,88,000.00");
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

test('FieldCellEditor variant="cell": currency and percent are Number\'s plain editor — no border, steppers or symbol; a percent is typed as points', async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="currency"
      label="Price"
      value={1250.5}
      config={{ currency: "EUR" }}
      variant="cell"
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  const field = screen.getByRole("textbox", { name: "Price" });
  await expect.element(field).toHaveFocus();
  // The value as it is (not "€1,250.50"), with no group box and no steppers around it.
  expect((field.element() as HTMLInputElement).value).toBe("1250.5");
  expect(
    screen.container.querySelector(
      '[data-slot="number-field"], [data-slot="input-group"], [data-slot^="number-field-"]',
    ),
  ).toBeNull();
  await field.fill("99.5");
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenCalledWith(99.5, "down");

  // A percent is stored as a fraction and typed as the points the cell shows.
  const committed = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="percent"
      type="percent"
      label="Progress"
      value={0.42}
      variant="cell"
      onCommit={committed}
      onCancel={() => {}}
    />,
  );
  const points = screen.getByRole("textbox", { name: "Progress" });
  await expect.element(points).toHaveFocus();
  expect((points.element() as HTMLInputElement).value).toBe("42");
  await userEvent.keyboard("{ArrowUp}{Enter}");
  expect(committed).toHaveBeenCalledWith(0.43, "down");

  // An emptied one commits null; "-" is an unreadable draft: invalid, never committed.
  const emptied = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="empty"
      type="percent"
      label="Progress"
      value={0.5}
      variant="cell"
      onCommit={emptied}
      onCancel={() => {}}
    />,
  );
  await screen.getByRole("textbox", { name: "Progress" }).fill("");
  await userEvent.keyboard("{Enter}");
  expect(emptied).toHaveBeenCalledWith(null, "down");
  const stuck = vi.fn();
  await screen.rerender(
    <FieldCellEditor
      key="dash"
      type="currency"
      label="Price"
      value={null}
      seed="-"
      variant="cell"
      onCommit={stuck}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("{Enter}");
  expect(stuck).not.toHaveBeenCalled();
  expect(
    screen.container
      .querySelector('[aria-label="Price"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
});

test("FieldCellEditor: a date's calendar is open at once; closing it without a day cancels the edit, a day commits, the × clears", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const editor = (key: string) => (
    <div>
      <FieldCellEditor
        key={key}
        variant="cell"
        type="date"
        label="Due"
        value="2026-10-24"
        onCommit={onCommit}
        onCancel={onCancel}
      />
    </div>
  );
  const calendarOpen = () => document.querySelector("[data-day]") !== null;
  const screen = await render(editor("outside"));
  await expect.poll(calendarOpen).toBe(true);
  // A press outside the calendar, with no day chosen: the edit is cancelled (the host's floating
  // editor and the page lock behind it go with it), and nothing is committed.
  const pressOutside = () => {
    for (const type of ["pointerdown", "mousedown", "mouseup", "click"])
      document.body.dispatchEvent(
        new (type.startsWith("pointer") ? PointerEvent : MouseEvent)(type, {
          bubbles: true,
        }),
      );
  };
  pressOutside();
  await expect.poll(() => onCancel.mock.calls.length).toBe(1);
  expect(onCommit).not.toHaveBeenCalled();

  // Escape in the open calendar cancels too.
  await screen.rerender(editor("escape"));
  await expect.poll(calendarOpen).toBe(true);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => onCancel.mock.calls.length).toBe(2);
  expect(onCommit).not.toHaveBeenCalled();

  // A day is the commit; the calendar closing after it is not a second, cancelling event.
  await screen.rerender(editor("pick"));
  await expect.poll(calendarOpen).toBe(true);
  await screen.getByRole("button", { name: /October 25th, 2026/ }).click();
  await expect.poll(() => onCommit.mock.calls.length).toBe(1);
  expect(onCommit.mock.calls[0]![0]).toBe("2026-10-25");
  expect(onCancel).toHaveBeenCalledTimes(2);

  // The same day pressed again keeps it (Enter on the chosen day must not clear the cell).
  await screen.rerender(editor("again"));
  await expect.poll(calendarOpen).toBe(true);
  await screen.getByRole("button", { name: /October 24th, 2026/ }).click();
  await expect.poll(() => onCommit.mock.calls.length).toBe(2);
  expect(onCommit.mock.calls[1]![0]).toBe("2026-10-24");

  // The × beside the day clears: it is not a press outside.
  await screen.rerender(editor("clear"));
  await expect.poll(calendarOpen).toBe(true);
  await screen.getByRole("button", { name: "Clear date" }).click();
  await expect.poll(() => onCommit.mock.calls.length).toBe(3);
  expect(onCommit.mock.calls[2]![0]).toBeNull();
  expect(onCancel).toHaveBeenCalledTimes(2);
});

test("every field type has a label and an icon, and FieldTypeIcon draws it decoratively", async () => {
  const types = Object.keys(FIELD_TYPE_LABELS) as FieldType[];
  expect(types.length).toBe(22);
  for (const type of types) {
    expect(FIELD_TYPE_LABELS[type]).not.toBe("");
    expect(FIELD_TYPE_ICONS[type]).toBeTruthy();
  }
  expect(FIELD_TYPE_LABELS.datetime).toBe("Date and time");
  const screen = await render(
    <FieldTypeIcon type="currency" className="size-4" />,
  );
  const icon = screen.container.querySelector('[data-slot="field-type-icon"]')!;
  expect(icon.getAttribute("data-type")).toBe("currency");
  expect(icon.getAttribute("aria-hidden")).toBe("true");
});

test("FieldCellEditor variant=cell: long text edits in place — no popover — and Escape cancels", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <FieldCellEditor
      variant="cell"
      type="long_text"
      label="Notes"
      value="First line"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  await expect
    .element(screen.getByRole("textbox", { name: "Notes" }))
    .toBeInTheDocument();
  expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  await userEvent.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onCommit).not.toHaveBeenCalled();
});

const PEOPLE: FieldPerson[] = [
  { id: "p1", name: "Mav Sales" },
  { id: "p2", name: "Ananya Rao" },
  { id: "p3", name: "Farhan Qureshi" },
];

test("FieldCellEditor variant=cell: people are chips over a list that leaves them out; leaving the editor commits", async () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const screen = await render(
    <div>
      <FieldCellEditor
        variant="cell"
        type="person"
        label="Owners"
        value={[PEOPLE[0]!]}
        config={{ multiple: true, people: PEOPLE }}
        onCommit={onCommit}
        onCancel={onCancel}
      />
      <button type="button">Elsewhere</button>
    </div>,
  );
  const chosen = screen.getByRole("list", { name: "Owners, chosen" });
  await expect.element(chosen).toBeInTheDocument();
  // The chosen person is a chip, not a row of the list.
  await expect
    .element(screen.getByRole("option", { name: /Mav Sales/ }))
    .not.toBeInTheDocument();
  await screen.getByRole("option", { name: /Ananya Rao/ }).click();
  await expect
    .element(screen.getByRole("button", { name: "Remove Ananya Rao" }))
    .toBeInTheDocument();
  // The pick did not end the edit; leaving does, with both people.
  expect(onCommit).not.toHaveBeenCalled();
  await screen.getByRole("button", { name: "Elsewhere" }).click();
  await expect.poll(() => onCommit.mock.calls.length).toBe(1);
  expect(
    (onCommit.mock.calls[0]![0] as FieldPerson[]).map((person) => person.id),
  ).toEqual(["p1", "p2"]);
  expect(onCancel).not.toHaveBeenCalled();
});

test("FieldCellEditor variant=cell: a single person's pick commits at once; a date takes the inline picker", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      variant="cell"
      type="person"
      label="Owner"
      value={null}
      config={{ people: PEOPLE }}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await screen.getByRole("option", { name: /Farhan Qureshi/ }).click();
  expect(onCommit).toHaveBeenCalledTimes(1);
  expect((onCommit.mock.calls[0]![0] as FieldPerson).id).toBe("p3");
  await screen.rerender(
    <FieldCellEditor
      key="datetime"
      variant="cell"
      type="datetime"
      label="Due"
      value="2026-10-30T09:00:00.000Z"
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );
  expect(
    screen.container.querySelector(
      '[data-slot="date-time-picker-trigger"][data-variant="ghost"]',
    ),
  ).not.toBeNull();
});

test("long text maxLength: a form input past it shows the host's message and turns invalid; under it, a count", async () => {
  const screen = await render(
    <FieldInput
      type="long_text"
      aria-label="Notes"
      value="abcdefghijkl"
      config={{
        maxLength: 10,
        maxLengthMessage: (n) =>
          `Notes can be up to 10 characters. Remove ${n} to save.`,
      }}
      onChange={() => {}}
    />,
  );
  await expect
    .element(
      screen.getByText("Notes can be up to 10 characters. Remove 2 to save."),
    )
    .toBeVisible();
  expect(
    screen.container.querySelector('[data-slot="field-counter"]')?.textContent,
  ).toContain("12/10");
  await expect
    .element(screen.getByRole("textbox", { name: "Notes" }))
    .toHaveAttribute("aria-invalid", "true");
  await expectNoA11yViolations(screen.container);
});

test("long text maxLength: a cell's editor over the limit does not commit; it stays open with the message", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      type="long_text"
      label="Notes"
      value="abcdefghijkl"
      config={{ maxLength: 10, maxLengthMessage: () => "Too long." }}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="popover-content"]'))
    .not.toBeNull();
  await expect.element(screen.getByText("Too long.")).toBeVisible();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await userEvent.keyboard("{Meta>}{Enter}{/Meta}");
  expect(onCommit).not.toHaveBeenCalled();
  expect(
    document.querySelector('[data-slot="popover-content"]'),
  ).not.toBeNull();
});

test("percent and currency cell editors keep every significant digit: an untouched edit writes the value back exactly", async () => {
  const onCommit = vi.fn();
  const screen = await render(
    <FieldCellEditor
      key="percent"
      type="percent"
      variant="cell"
      label="Share"
      value={1234567.890123}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  const field = screen.getByRole("textbox", { name: "Share" });
  // ×100 on the digits: 1234567.890123 is 123456789.0123 points, not 123456789.012.
  await expect
    .element(field)
    .toHaveValue(`123456789${(1.5).toLocaleString().charAt(1)}0123`);
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenLastCalledWith(1234567.890123, "down");

  await screen.rerender(
    <FieldCellEditor
      key="percent-edit"
      type="percent"
      variant="cell"
      label="Share"
      value={0.07}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("{End}5{Enter}");
  // 75 points is 0.75 exactly (no 0.7500000000000001).
  expect(onCommit).toHaveBeenLastCalledWith(0.75, "down");

  await screen.rerender(
    <FieldCellEditor
      key="currency"
      type="currency"
      variant="cell"
      label="Budget"
      value={123456789.012345}
      onCommit={onCommit}
      onCancel={() => {}}
    />,
  );
  await userEvent.keyboard("{Enter}");
  expect(onCommit).toHaveBeenLastCalledWith(123456789.012345, "down");
});

test('FieldCellDisplay variant="cell": every file as its chip, an image as its thumbnail, clipped with no "+N"', async () => {
  const files = [
    { id: "f1", name: "spec.pdf", contentType: "application/pdf" },
    {
      id: "f2",
      name: "pole.jpg",
      contentType: "image/jpeg",
      thumbnailUrl:
        "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
    },
    { id: "f3", name: "notes.md", contentType: "text/markdown" },
    { id: "f4", name: "drawing.dwg" },
  ];
  injectCompiledCss();
  const screen = await render(
    <div style={{ width: 160 }}>
      <FieldCellDisplay type="file" value={files} variant="cell" />
    </div>,
  );
  const chips = screen.container.querySelectorAll(
    '[data-slot="field-cell-file-chip"] [data-slot="inline-chip"]',
  );
  expect([...chips].map((chip) => chip.textContent)).toEqual([
    "spec.pdf",
    "notes.md",
    "drawing.dwg",
  ]);
  const thumbnail = screen.container.querySelector(
    '[data-slot="field-cell-file-thumbnail"] [data-slot="thumbnail"]',
  ) as HTMLElement;
  expect(thumbnail.parentElement!.getAttribute("title")).toBe("pole.jpg");
  expect(thumbnail.querySelector("img")?.getAttribute("alt")).toBe("pole.jpg");
  // The thumbnail sits at the chip's height, not a list row's 32px.
  expect(thumbnail.getBoundingClientRect().height).toBe(20);
  expect(screen.container.textContent).not.toMatch(/\+\d/);
  // One line that clips at the cell's edge, with no scroll bar.
  const line = screen.container.querySelector(
    '[data-slot="field-cell-display"] > span',
  ) as HTMLElement;
  // Clipped, so it has no scroll position for a focused chip to move.
  expect(getComputedStyle(line).overflow).toBe("clip");
  expect(line.scrollWidth).toBeGreaterThan(line.clientWidth);
  expect(line.getBoundingClientRect().height).toBeLessThanOrEqual(24);
  await expectNoA11yViolations(screen.container);

  // The default variant is untouched: kind tiles and "+N" past three.
  await screen.rerender(<FieldCellDisplay type="file" value={files} />);
  expect(
    screen.container.querySelector('[data-slot="field-cell-file-chip"]'),
  ).toBeNull();
  expect(screen.container.textContent).toContain("+1");
});

test('FieldCellDisplay variant="cell": a file chip and an image thumbnail open the file through the provider, never the record link', async () => {
  const onOpen = vi.fn(() => undefined);
  const files = [
    {
      id: "f1",
      name: "spec.pdf",
      contentType: "application/pdf",
      href: "/api/files/a1",
    },
    {
      id: "f2",
      name: "pole.jpg",
      contentType: "image/jpeg",
      href: "/api/files/a2",
      thumbnailUrl:
        "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
    },
  ];
  const screen = await render(
    <InlineChipProvider
      value={{ href: (kind, id) => `/${kind}s/${id}`, onOpen }}
    >
      <FieldCellDisplay type="file" value={files} variant="cell" />
    </InlineChipProvider>,
  );
  const chip = screen.container.querySelector<HTMLAnchorElement>(
    '[data-slot="field-cell-file-chip"] a',
  )!;
  // The file's own link, not the provider's record link (`/files/f1`).
  expect(chip.getAttribute("href")).toBe("/api/files/a1");
  chip.click();
  expect(onOpen).toHaveBeenLastCalledWith(
    expect.objectContaining({
      kind: "file",
      href: "/api/files/a1",
      label: "spec.pdf",
    }),
    expect.anything(),
  );
  const thumbnail = screen.container.querySelector<HTMLButtonElement>(
    '[data-slot="field-cell-file-thumbnail"]',
  )!;
  expect(thumbnail.tagName).toBe("BUTTON");
  thumbnail.click();
  expect(onOpen).toHaveBeenLastCalledWith(
    expect.objectContaining({
      kind: "file",
      href: "/api/files/a2",
      label: "pole.jpg",
      contentType: "image/jpeg",
    }),
    expect.anything(),
  );
  await expectNoA11yViolations(screen.container);
});

test('FieldCellDisplay variant="cell": a thumbnail with no link, or an unsafe one, is a picture, not a button', async () => {
  const image =
    "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
  const screen = await render(
    <InlineChipProvider value={{ onOpen: () => undefined }}>
      <FieldCellDisplay
        type="file"
        value={[
          {
            id: "f1",
            name: "a.jpg",
            contentType: "image/jpeg",
            thumbnailUrl: image,
          },
          {
            id: "f2",
            name: "b.jpg",
            contentType: "image/jpeg",
            thumbnailUrl: image,
            href: "javascript:alert(1)",
          },
        ]}
        variant="cell"
      />
    </InlineChipProvider>,
  );
  const thumbnails = screen.container.querySelectorAll(
    '[data-slot="field-cell-file-thumbnail"]',
  );
  expect([...thumbnails].map((el) => el.tagName)).toEqual(["SPAN", "SPAN"]);
});

test('FieldCellEditor variant="cell": the date, date-time and link triggers sit flat, with no open tint; FieldInput keeps its chrome', async () => {
  injectCompiledCss();
  const trigger = (slot: string) =>
    document.querySelector(`[data-slot="${slot}"]`) as HTMLElement | null;
  const cases: [FieldType, FieldValue, string][] = [
    ["date", "2026-11-13", "date-picker-trigger"],
    ["datetime", "2026-11-13T09:00:00.000Z", "date-time-picker-trigger"],
    ["link", [], "searchable-select-trigger"],
  ];
  const config: FieldConfig = {
    searchRecords: () => Promise.resolve({ items: [] }),
  };
  for (const [type, value, slot] of cases) {
    const screen = await render(
      <FieldCellEditor
        variant="cell"
        type={type}
        label="Field"
        value={value}
        config={config}
        onCommit={() => {}}
        onCancel={() => {}}
      />,
    );
    await expect.poll(() => trigger(slot)).not.toBeNull();
    const node = trigger(slot)!;
    if (node.getAttribute("aria-expanded") !== "true") node.click();
    await expect.poll(() => node.getAttribute("aria-expanded")).toBe("true");
    expect(node.hasAttribute("data-flat")).toBe(true);
    const style = getComputedStyle(node);
    expect(style.backgroundImage).toBe("none");
    expect(style.borderTopColor).toBe("rgba(0, 0, 0, 0)");
    await screen.unmount();

    // A form control is unchanged: not flat.
    const form = await render(
      <FieldInput
        type={type}
        aria-label="Field"
        value={value}
        config={config}
        onChange={() => {}}
      />,
    );
    await expect.poll(() => trigger(slot)).not.toBeNull();
    expect(trigger(slot)!.hasAttribute("data-flat")).toBe(false);
    await form.unmount();
  }
});

/** The compiled token theme and utilities, so a test can read real computed styles. */
function injectCompiledCss() {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}
