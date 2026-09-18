import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import type { DateRange } from "react-day-picker";
import { expectNoA11yViolations } from "../../test/a11y";
import { Calendar, CalendarDayButton } from "./calendar";

/**
 * Every fixture pins its month. A calendar that starts on "today" is a different DOM every day,
 * which is a test that fails on the first of a month rather than on a defect.
 */
const YEAR = 2026;
const JANUARY = new Date(YEAR, 0, 1);
const TWELFTH = new Date(YEAR, 0, 12);

const root = (screen: { container: HTMLElement }) =>
  screen.container.querySelector('[data-slot="calendar"]') as HTMLElement;

const dayButtons = (screen: { container: HTMLElement }) =>
  screen.container.querySelectorAll<HTMLButtonElement>("button[data-day]");

test("renders a month grid carrying data-slot (Usage, Basic)", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} selected={TWELFTH} />,
  );
  expect(root(screen)).not.toBeNull();
  expect(screen.container.querySelector("table")).not.toBeNull();
  expect(dayButtons(screen).length).toBeGreaterThan(27);
});

test("the selected day is marked (Usage)", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} selected={TWELFTH} />,
  );
  const selected = screen.container.querySelector(
    'button[data-selected-single="true"]',
  );
  expect(selected).not.toBeNull();
});

test("clicking a day reports it (Usage, Date Picker)", async () => {
  let picked: Date | undefined;
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JANUARY}
      onSelect={(date) => (picked = date as Date | undefined)}
    />,
  );
  await userEvent.click(dayButtons(screen)[10]!);
  expect(picked).toBeInstanceOf(Date);
});

test("navigation buttons move the month (About, Presets)", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} />,
  );
  const before =
    screen.container.querySelector(".rdp-month_caption")?.textContent;
  const next = screen.container.querySelector(
    "button.rdp-button_next",
  ) as HTMLButtonElement;
  await userEvent.click(next);
  const after =
    screen.container.querySelector(".rdp-month_caption")?.textContent;
  expect(after).not.toBe(before);
});

test("mode=range marks the start, middle and end of a span (Range Calendar)", async () => {
  const range: DateRange = {
    from: new Date(YEAR, 0, 12),
    to: new Date(YEAR, 0, 16),
  };
  const screen = await render(
    <Calendar
      mode="range"
      defaultMonth={JANUARY}
      selected={range}
      numberOfMonths={2}
    />,
  );
  expect(
    screen.container.querySelector('button[data-range-start="true"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('button[data-range-middle="true"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('button[data-range-end="true"]'),
  ).not.toBeNull();
});

test("numberOfMonths renders that many grids (Range Calendar)", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} numberOfMonths={2} />,
  );
  expect(screen.container.querySelectorAll("table").length).toBe(2);
});

test("captionLayout=dropdown renders month and year selects (Month and Year Selector)", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} captionLayout="dropdown" />,
  );
  expect(screen.container.querySelectorAll("select").length).toBeGreaterThan(0);
});

test("timeZone is accepted and the grid still renders (Selected Date (With TimeZone))", async () => {
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JANUARY}
      selected={TWELFTH}
      timeZone="UTC"
    />,
  );
  expect(dayButtons(screen).length).toBeGreaterThan(27);
});

test("disabled days are blocked and marked (Booked dates)", async () => {
  const booked = [new Date(YEAR, 0, 5), new Date(YEAR, 0, 6)];
  let picked: Date | undefined;
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JANUARY}
      disabled={booked}
      modifiers={{ booked }}
      modifiersClassNames={{ booked: "[&>button]:line-through" }}
      onSelect={(date) => (picked = date as Date | undefined)}
    />,
  );
  // Our Button renders `aria-disabled` + `data-disabled` rather than the native attribute
  // (FRM-4), and react-day-picker marks the CELL `data-disabled="true"`.
  const disabled = [...dayButtons(screen)].find((button) =>
    button.hasAttribute("data-disabled"),
  );
  expect(disabled).toBeDefined();
  disabled!.click();
  expect(picked).toBeUndefined();
  // The dim is paired with a non-colour marker, so unavailability is never colour alone (A11Y-8).
  expect(disabled!.parentElement?.className).toContain("line-through");
});

test("--cell-size is a CSS variable the caller can retune (Custom Cell Size)", async () => {
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JANUARY}
      className="[--cell-size:--spacing(10)]"
    />,
  );
  expect(root(screen).className).toContain("[--cell-size:--spacing(10)]");
});

test("a custom DayButton renders extra content per day (Custom Cell Size)", async () => {
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JANUARY}
      components={{
        DayButton: ({ children, modifiers, day, ...props }) => (
          <CalendarDayButton day={day} modifiers={modifiers} {...props}>
            {children}
            {!modifiers.outside && <span>$100</span>}
          </CalendarDayButton>
        ),
      }}
    />,
  );
  expect(screen.container.textContent).toContain("$100");
});

test("showWeekNumber adds the week column (Week Numbers)", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} showWeekNumber />,
  );
  expect(screen.container.querySelector(".rdp-week_number")).not.toBeNull();
});

test("RTL: the grid inherits direction from its container (RTL, Persian / Hijri / Jalali Calendar)", async () => {
  const screen = await render(
    <div dir="rtl">
      <Calendar mode="single" defaultMonth={JANUARY} selected={TWELFTH} />
    </div>,
  );
  expect(getComputedStyle(root(screen)).direction).toBe("rtl");
  expect(root(screen).className).toContain("rtl:**:[.rdp-button");
});

test("A11Y-2: a day button fills the cell, and the cell is 28px", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} />,
  );
  // This lane compiles no CSS, so the RENDERED box belongs to
  // `test/geometry.browser.test.tsx`. What is asserted here is the contract that makes it 28px:
  // the root sets `--cell-size` and the day button fills its cell.
  expect(root(screen).className).toContain("[--cell-size:--spacing(7)]");
  expect(dayButtons(screen)[10]!.className).toContain("w-full");
  expect(dayButtons(screen)[10]!.className).toContain("min-w-(--cell-size)");
});

test("FOC-1/FOC-6: the focused day carries no ring glow", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} />,
  );
  const button = dayButtons(screen)[10]!;
  expect(button.className).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(button.className).not.toContain("group-data-[focused=true]/day:ring");
  expect(button.className).not.toContain(
    "group-data-[focused=true]/day:border-ring",
  );
  // The lift that kept the focused cell above its neighbours stays.
  expect(button.className).toContain("group-data-[focused=true]/day:z-10");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} selected={TWELFTH} />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — range", async () => {
  const screen = await render(
    <Calendar
      mode="range"
      defaultMonth={JANUARY}
      selected={{ from: new Date(YEAR, 0, 12), to: new Date(YEAR, 0, 16) }}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — dropdown caption", async () => {
  const screen = await render(
    <Calendar mode="single" defaultMonth={JANUARY} captionLayout="dropdown" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled days", async () => {
  const screen = await render(
    <Calendar
      mode="single"
      defaultMonth={JANUARY}
      disabled={[new Date(YEAR, 0, 5)]}
    />,
  );
  await expectNoA11yViolations(screen.container);
});
