import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
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
  expect(onCommit).toHaveBeenCalledWith("Acme Ltd");
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
  await screen.getByRole("combobox", { name: "Status" }).click();
  await screen.getByRole("option", { name: "Sent" }).click();
  expect(choose).toHaveBeenCalledWith("sent");
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
