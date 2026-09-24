import { render } from "vitest-browser-react";
import { expect, onTestFinished, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
// The compiled lane stylesheet as a STRING, mounted only for the popup-surface tests below: every
// other test here is structural and must not see real CSS.
import geometryCss from "../../test/geometry.css?inline";
import * as React from "react";
import { expectNoA11yViolations } from "../../test/a11y";
import { DatePicker, DateRangePicker, type DateRange } from "./date-picker";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

// A fixed month so the grid is deterministic regardless of the run date. `DatePicker` derives the
// visible month from `value`, so seeding `value` to a June 2026 date pins the calendar on June 2026.
const JUNE_ANCHOR = new Date(2026, 5, 1);

/**
 * Find a portaled day button by the day-of-month number in its text content. `data-day` is the
 * hook upstream's `CalendarDayButton` writes on every cell; its `data-slot` is `button`, because
 * the day button IS upstream's `Button`.
 */
function dayButton(day: number): HTMLElement {
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>("button[data-day]"),
  ).filter(
    (b) =>
      b.getAttribute("aria-disabled") !== "true" &&
      !b.hasAttribute("data-disabled"),
  );
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

function ControlledRangePicker({
  onPick,
}: {
  onPick: (range: DateRange | undefined) => void;
}) {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(2026, 5, 10),
    to: new Date(2026, 5, 20),
  });
  return (
    <DateRangePicker
      value={range}
      numberOfMonths={1}
      onValueChange={(next) => {
        onPick(next);
        setRange(next);
      }}
    />
  );
}

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
    .poll(() => document.activeElement?.hasAttribute("data-day"))
    .toBe(true);
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
  await userEvent.click(dayButton(21));

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

test("RTL: the preset rail divides on its logical inline end, not the physical right", async () => {
  await render(
    <DatePicker presets={[{ label: "Pinned", date: new Date() }]} />,
  );
  (
    document.querySelector('[data-slot="date-picker-trigger"]') as HTMLElement
  ).click();
  await expect
    .poll(() => document.querySelector('[data-slot="date-picker-presets"]'))
    .not.toBeNull();
  const rail = document.querySelector(
    '[data-slot="date-picker-presets"]',
  ) as HTMLElement;
  const tokens = rail.className.split(/\s+/);
  expect(tokens).toContain("border-e");
  expect(tokens).toContain("max-sm:border-e-0");
  expect(rail.className).not.toMatch(/(^|\s|:)border-[rl](-0)?(\s|$)/);
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

  // The preset button is rendered disabled. Since audit D7 that is the `aria-disabled` form —
  // the control stays focusable and hoverable so a Tooltip can explain the block.
  const presetEl = document.querySelector<HTMLButtonElement>(
    '[data-slot="date-picker-presets"] button',
  )!;
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

  const presetEl = document.querySelector<HTMLButtonElement>(
    '[data-slot="date-picker-presets"] button',
  )!;
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

test("DateRangePicker keeps open for a new start and closes after the new end", async () => {
  const onPick = vi.fn();
  const screen = await render(<ControlledRangePicker onPick={onPick} />);
  await screen
    .getByRole("button", { name: /Jun 10, 2026.*Jun 20, 2026/ })
    .click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();

  await userEvent.click(dayButton(5));
  await expect.poll(() => onPick.mock.calls.length).toBe(1);
  const openRange = onPick.mock.calls[0]![0] as DateRange;
  expect(openRange.from?.getDate()).toBe(5);
  expect(openRange.to).toBeUndefined();
  expect(
    document.querySelector('[data-slot="date-range-picker-content"]'),
  ).not.toBeNull();

  await userEvent.click(dayButton(15));
  await expect.poll(() => onPick.mock.calls.length).toBe(2);
  const completedRange = onPick.mock.calls[1]![0] as DateRange;
  expect(completedRange.from?.getDate()).toBe(5);
  expect(completedRange.to?.getDate()).toBe(15);
  await waitForClosed();
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

test("inside a Field: FieldLabel htmlFor names the trigger, the description describes it, aria-invalid reaches it", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel htmlFor="due">Due date</FieldLabel>
      <DatePicker id="due" aria-describedby="due-help" aria-invalid />
      <FieldDescription id="due-help">When the task is due.</FieldDescription>
    </Field>,
  );
  const trigger = screen.getByRole("button", { name: "Due date" });
  await expect.element(trigger).toHaveAttribute("id", "due");
  await expect.element(trigger).toHaveAttribute("aria-describedby", "due-help");
  await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
  // Clicking the label activates its control, as it does for every other form control.
  await screen.getByText("Due date").click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
  await expectNoA11yViolations(document.body);
});

test("DateRangePicker binds to a FieldLabel the same way", async () => {
  const screen = await render(
    <Field>
      <FieldLabel htmlFor="window">Reporting window</FieldLabel>
      <DateRangePicker id="window" aria-describedby="window-help" />
      <FieldDescription id="window-help">Inclusive.</FieldDescription>
    </Field>,
  );
  const trigger = screen.getByRole("button", { name: "Reporting window" });
  await expect.element(trigger).toHaveAttribute("id", "window");
  await expect
    .element(trigger)
    .toHaveAttribute("aria-describedby", "window-help");
  await expect.element(trigger).not.toHaveAttribute("aria-invalid");
});

test("DS-47: inside a Field the trigger is labelled, described and invalid with no props", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Due date</FieldLabel>
      <DatePicker />
      <FieldDescription>When the task is due.</FieldDescription>
      <FieldError>Pick a date.</FieldError>
    </Field>,
  );
  const trigger = screen.getByRole("button", { name: "Due date" });
  await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(trigger)
    .toHaveAccessibleDescription(/When the task is due/);
  await expect.element(trigger).toHaveAccessibleDescription(/Pick a date/);
  // The trigger still opens the calendar.
  (trigger.element() as HTMLButtonElement).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
});

test("DS-47: DateRangePicker reads the Field the same way", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Reporting window</FieldLabel>
      <DateRangePicker />
      <FieldError>Pick a window.</FieldError>
    </Field>,
  );
  const trigger = screen.getByRole("button", { name: "Reporting window" });
  await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
  await expect.element(trigger).toHaveAccessibleDescription(/Pick a window/);
});

test("DS-47: disabled still reaches the trigger through Field.Control", async () => {
  const screen = await render(<DatePicker aria-label="Due" disabled />);
  await expect
    .element(screen.getByRole("button", { name: "Due" }))
    .toHaveAttribute("aria-disabled", "true");
});

test("no a11y violations — inside a Field, valid", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Due date</FieldLabel>
      <DatePicker />
      <FieldDescription>When the task is due.</FieldDescription>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a Field, invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Due date</FieldLabel>
      <DatePicker />
      <FieldError>Pick a date.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<DatePicker aria-label="Event date" disabled />);
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

/* ── The popup surface, measured on the compiled CSS ─────────────────────────────────────────── */

async function openWithPresets(width: number) {
  await page.viewport(width, 800);
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  await render(
    <DatePicker
      value={JUNE_ANCHOR}
      presets={[
        { label: "Today", date: JUNE_ANCHOR },
        { label: "Tomorrow", date: JUNE_ANCHOR },
      ]}
    />,
  );
  (
    document.querySelector('[data-slot="date-picker-trigger"]') as HTMLElement
  ).click();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
  const popup = document.querySelector(
    '[data-slot="date-picker-content"]',
  ) as HTMLElement;
  const rail = document.querySelector(
    '[data-slot="date-picker-presets"]',
  ) as HTMLElement;
  const calendar = document.querySelector(
    '[data-slot="calendar"]',
  ) as HTMLElement;
  return { popup, rail, calendar };
}

// Upstream's calendar goes transparent only `in-data-[slot=popover-content]`, and the pickers
// rename their popup, so the calendar used to paint `bg-background` over the popup's `bg-popover`.
test("the calendar is transparent inside the popup, so the popup reads as one surface", async () => {
  const { popup, calendar } = await openWithPresets(1024);
  expect(getComputedStyle(calendar).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(getComputedStyle(popup).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
});

// From sm up the rail sits at the inline start, beside the calendar, and its one divider faces
// the calendar. The popover's own `flex-col gap-2.5` used to win the class merge, stacking the
// rail above the calendar at every width and drawing its `border-e` along the popup's own edge.
test("from sm up the rail sits beside the calendar and divides only between them", async () => {
  const { popup, rail, calendar } = await openWithPresets(1024);
  const railBox = rail.getBoundingClientRect();
  const calendarBox = calendar.getBoundingClientRect();
  const popupBox = popup.getBoundingClientRect();
  expect(railBox.right).toBeCloseTo(calendarBox.left, 0);
  expect(railBox.top).toBeCloseTo(calendarBox.top, 0);
  // The rail's end edge is interior: the calendar, not the popup border, lies beyond it.
  expect(railBox.right).toBeLessThan(popupBox.right - 1);
  const style = getComputedStyle(rail);
  expect(style.borderRightWidth).toBe("1px");
  expect(style.borderBottomWidth).toBe("0px");
});

test("below sm the rail stacks above the calendar and divides only between them", async () => {
  const { rail, calendar } = await openWithPresets(400);
  const railBox = rail.getBoundingClientRect();
  const calendarBox = calendar.getBoundingClientRect();
  expect(railBox.bottom).toBeCloseTo(calendarBox.top, 0);
  const style = getComputedStyle(rail);
  expect(style.borderBottomWidth).toBe("1px");
  expect(style.borderRightWidth).toBe("0px");
});
