import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import * as React from "react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Calendar,
  DatePicker,
  DateRangePicker,
  type DateRange,
} from "./date-picker";

// A fixed month so the grid is deterministic regardless of the run date. `DatePicker` derives the
// visible month from `value`, so seeding `value` to a June 2026 date pins the calendar on June 2026.
const JUNE_ANCHOR = new Date(2026, 5, 1);

/** Find a portaled day button by the day-of-month number in its text content. */
function dayButton(day: number): HTMLElement {
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="calendar-day"]'),
  ).filter((b) => b.getAttribute("aria-disabled") !== "true");
  const match = buttons.find((b) => b.textContent?.trim() === String(day));
  expect(match, `expected a calendar day button for "${day}"`).toBeTruthy();
  return match!;
}

/** Poll until the popover content (single or range) has left the DOM (after the exit transition). */
async function waitForClosed() {
  await expect
    .poll(
      () =>
        document.querySelector(
          '[data-slot="date-picker-content"], [data-slot="date-range-picker-content"]',
        ),
      { timeout: 2000 },
    )
    .toBeNull();
}

/** Controlled single-date picker seeded onto June 2026 for deterministic grid assertions. */
function ControlledPicker({
  onPick,
}: {
  onPick: (d: Date | undefined) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(JUNE_ANCHOR);
  return (
    <DatePicker
      value={date}
      onValueChange={(d) => {
        onPick(d);
        setDate(d);
      }}
    />
  );
}

test("Calendar renders the given month inline", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JUNE_ANCHOR} />,
  );
  await expect.element(screen.getByText("June 2026")).toBeInTheDocument();
});

test("trigger shows the placeholder when no date is selected", async () => {
  const screen = await render(<DatePicker placeholder="Pick a date" />);
  await expect
    .element(screen.getByRole("button", { name: "Pick a date" }))
    .toBeInTheDocument();
  // The calendar is not mounted until the popover opens.
  expect(document.querySelector('[data-slot="calendar"]')).toBeNull();
});

test("opens the calendar on trigger click", async () => {
  const screen = await render(<DatePicker value={JUNE_ANCHOR} />);
  await screen.getByRole("button", { name: /Jun 1, 2026/ }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
});

test("opening a below-the-fold picker does not scroll the page (autoFocus preventScroll)", async () => {
  // Regression: rdp's autoFocus day-focus fires while the portaled popup is still unpositioned
  // at the document top — a plain .focus() scrolled the page to the top on every open. Render
  // the trigger below a tall spacer, scroll to it, open, and assert the viewport stayed put
  // while keyboard focus still landed on the focused day.
  const screen = await render(
    <div>
      <div style={{ height: "2000px" }} />
      <DatePicker value={JUNE_ANCHOR} />
    </div>,
  );
  const trigger = screen.getByRole("button", { name: /Jun 1, 2026/ });
  (await trigger.element()).scrollIntoView({ block: "center" });
  const before = window.scrollY;
  expect(before).toBeGreaterThan(0);
  await trigger.click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
  // The day focus effect runs post-paint; poll until focus settles on a day, then check scroll.
  await expect
    .poll(() => document.activeElement?.getAttribute("data-slot"))
    .toBe("calendar-day");
  expect(Math.abs(window.scrollY - before)).toBeLessThan(2);
});

test("selecting a day fires onValueChange, closes, and shows the formatted date", async () => {
  const onPick = vi.fn();
  const screen = await render(<ControlledPicker onPick={onPick} />);

  // Open (the trigger initially shows the seeded June 1 date).
  await screen.getByRole("button", { name: /Jun 1, 2026/ }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  // Select June 21, 2026.
  dayButton(21).click();

  await waitForClosed();
  expect(onPick).toHaveBeenCalledTimes(1);
  const selected = onPick.mock.calls[0]![0] as Date;
  expect(selected.getFullYear()).toBe(2026);
  expect(selected.getMonth()).toBe(5);
  expect(selected.getDate()).toBe(21);

  // Trigger now reflects the new selection via Intl short format.
  await expect.element(screen.getByText("Jun 21, 2026")).toBeInTheDocument();
});

test("uses Intl.DateTimeFormat for the trigger label", async () => {
  const screen = await render(
    <DatePicker value={new Date(2026, 5, 21)} locale="en-US" />,
  );
  await expect.element(screen.getByText("Jun 21, 2026")).toBeInTheDocument();
});

test("presets select a date and close the popover", async () => {
  const onPick = vi.fn();
  const pinned = new Date(2026, 5, 15);
  const screen = await render(
    <DatePicker
      onValueChange={onPick}
      presets={[{ label: "Pinned", date: pinned }]}
    />,
  );
  await screen.getByRole("button", { name: "Pick a date" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  await screen.getByRole("button", { name: "Pinned" }).click();
  await waitForClosed();
  expect(onPick).toHaveBeenCalledWith(pinned);
});

test("DatePicker forwards calendarProps to the inner Calendar", async () => {
  const screen = await render(
    <DatePicker
      value={JUNE_ANCHOR}
      calendarProps={{
        footer: "Calendar footer",
        timeZone: "UTC",
        captionLayout: "dropdown",
        startMonth: new Date(2020, 0, 1),
        endMonth: new Date(2030, 11, 1),
      }}
    />,
  );
  await screen.getByRole("button", { name: /Jun 1, 2026/ }).click();
  await expect.element(screen.getByText("Calendar footer")).toBeInTheDocument();
});

test("a single-date preset whose date is disabled cannot emit a value", async () => {
  const onPick = vi.fn();
  const blocked = new Date(2026, 5, 15);
  const screen = await render(
    <DatePicker
      onValueChange={onPick}
      presets={[{ label: "Blocked", date: blocked }]}
      disabledDates={blocked}
    />,
  );
  await screen.getByRole("button", { name: "Pick a date" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  // The preset button is rendered disabled (native `disabled` + `aria-disabled`).
  const preset = screen.getByRole("button", { name: "Blocked" });
  await expect.element(preset).toBeDisabled();
  const presetEl = document.querySelector<HTMLButtonElement>(
    '[data-slot="date-picker-presets"] button',
  )!;
  expect(presetEl.disabled).toBe(true);
  expect(presetEl.getAttribute("aria-disabled")).toBe("true");

  // Force the click past the disabled UI: the handler guard must still refuse to emit.
  presetEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onPick).not.toHaveBeenCalled();
});

test("a range preset that intersects disabled dates cannot emit a value", async () => {
  const onPick = vi.fn();
  // Preset spans Jun 10–20; a single day inside it (Jun 15) is disabled → whole preset is blocked.
  const presetRange: DateRange = {
    from: new Date(2026, 5, 10),
    to: new Date(2026, 5, 20),
  };
  const screen = await render(
    <DateRangePicker
      onValueChange={onPick}
      presets={[{ label: "Spans blocked day", range: presetRange }]}
      disabledDates={new Date(2026, 5, 15)}
    />,
  );
  await screen.getByRole("button", { name: "Pick a date range" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  const preset = screen.getByRole("button", { name: "Spans blocked day" });
  await expect.element(preset).toBeDisabled();
  const presetEl = document.querySelector<HTMLButtonElement>(
    '[data-slot="date-picker-presets"] button',
  )!;
  expect(presetEl.disabled).toBe(true);
  expect(presetEl.getAttribute("aria-disabled")).toBe("true");

  // Force the click: the range guard must still refuse to emit a range crossing a blocked day.
  presetEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onPick).not.toHaveBeenCalled();
});

test("an enabled preset still emits even when disabledDates is set (regression)", async () => {
  const onPick = vi.fn();
  const allowed = new Date(2026, 5, 12);
  const screen = await render(
    <DatePicker
      onValueChange={onPick}
      presets={[{ label: "Allowed", date: allowed }]}
      // Disable a different day — the allowed preset must remain fully functional.
      disabledDates={new Date(2026, 5, 15)}
    />,
  );
  await screen.getByRole("button", { name: "Pick a date" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  const preset = screen.getByRole("button", { name: "Allowed" });
  await expect.element(preset).not.toBeDisabled();

  await preset.click();
  await waitForClosed();
  expect(onPick).toHaveBeenCalledWith(allowed);
});

test("an enabled range preset still emits when disabledDates is set (regression)", async () => {
  const onPick = vi.fn();
  // Preset spans Jun 1–5; the disabled day (Jun 15) is outside it → preset stays enabled.
  const presetRange: DateRange = {
    from: new Date(2026, 5, 1),
    to: new Date(2026, 5, 5),
  };
  const screen = await render(
    <DateRangePicker
      onValueChange={onPick}
      presets={[{ label: "Clear range", range: presetRange }]}
      disabledDates={new Date(2026, 5, 15)}
    />,
  );
  await screen.getByRole("button", { name: "Pick a date range" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  const preset = screen.getByRole("button", { name: "Clear range" });
  await expect.element(preset).not.toBeDisabled();

  await preset.click();
  await waitForClosed();
  expect(onPick).toHaveBeenCalledWith(presetRange);
});

test("closes on Escape without selecting", async () => {
  const screen = await render(<DatePicker value={JUNE_ANCHOR} />);
  await screen.getByRole("button", { name: /Jun 1, 2026/ }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  await userEvent.keyboard("{Escape}");
  await waitForClosed();
});

test("DateRangePicker formats a complete range", async () => {
  const range: DateRange = {
    from: new Date(2026, 5, 10),
    to: new Date(2026, 5, 20),
  };
  const screen = await render(<DateRangePicker value={range} locale="en-US" />);
  await expect
    .element(screen.getByRole("button", { name: /Jun 10, 2026.*Jun 20, 2026/ }))
    .toBeInTheDocument();
});

test("DateRangePicker forwards calendarProps and lets top-level numberOfMonths win", async () => {
  const range: DateRange = {
    from: new Date(2026, 5, 10),
    to: new Date(2026, 5, 20),
  };
  const screen = await render(
    <DateRangePicker
      value={range}
      numberOfMonths={1}
      calendarProps={{
        footer: "Range footer",
        numberOfMonths: 2,
        timeZone: "UTC",
      }}
    />,
  );
  await screen
    .getByRole("button", { name: /Jun 10, 2026.*Jun 20, 2026/ })
    .click();
  await expect.element(screen.getByText("Range footer")).toBeInTheDocument();
  expect(
    document.querySelectorAll('[data-slot="calendar"] [role="grid"]'),
  ).toHaveLength(1);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <DatePicker aria-label="Event date" disabled />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations when the calendar is open", async () => {
  const screen = await render(<DatePicker aria-label="Event date" />);
  await screen.getByRole("button", { name: "Event date" }).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
  // The popover portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("Calendar forwards ref to its host root element", async () => {
  // `{...props}` (and the ref) flows onto DayPicker, whose Root renders the
  // `data-slot="calendar"` <div>.
  const ref = React.createRef<HTMLDivElement>();
  await render(<Calendar mode="single" defaultMonth={JUNE_ANCHOR} ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("calendar");
});

test("dropdown caption keeps the label and chevron on one line (inline-flex on root AND the label span)", async () => {
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JUNE_ANCHOR}
      captionLayout="dropdown"
      startMonth={new Date(2020, 0, 1)}
      endMonth={new Date(2030, 11, 1)}
    />,
  );
  const roots = screen.container.querySelectorAll<HTMLElement>(
    ".rdp-dropdown_root",
  );
  // Month + year dropdowns.
  expect(roots.length).toBe(2);
  for (const root of Array.from(roots)) {
    // Preflight makes the ChevronDown svg display:block; without inline-flex on the
    // caption-label <span> (the chevron's actual parent) the chevron wraps UNDER the label.
    expect(root.className).toContain("inline-flex");
    expect(root.className).toContain("[&>span]:inline-flex");
    expect(root.className).toContain("[&>span]:items-center");
    // The chevron must be inside the label span for the child-selector fix to reach it.
    const labelSpan = root.querySelector("span:not([class*='rdp-dropdown '])");
    expect(root.querySelector("span svg")).not.toBeNull();
    expect(labelSpan).not.toBeNull();
  }
});
