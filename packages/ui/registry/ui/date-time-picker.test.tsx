import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { zonedParts } from "../lib/date-time";
import { DateTimePicker, type DateTimePickerProps } from "./date-time-picker";

/** A DateTimePicker that holds its own value, reporting each change. */
function Held({
  initial,
  onValueChange,
  ...props
}: Omit<DateTimePickerProps, "value"> & { initial?: Date }) {
  const [value, setValue] = React.useState<Date | undefined>(initial);
  return (
    <DateTimePicker
      aria-label="Due"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

/** A portaled day button by its day-of-month number (upstream's `CalendarDayButton`). */
function dayButton(day: number): HTMLElement {
  const match = Array.from(
    document.querySelectorAll<HTMLElement>("button[data-day]"),
  ).find(
    (b) =>
      b.textContent?.trim() === String(day) &&
      !b.hasAttribute("data-disabled") &&
      !b.closest("[data-outside]"),
  );
  if (!match) throw new Error(`no day ${day}`);
  return match;
}

const timeInput = (screen: { container: HTMLElement }) =>
  screen.container.querySelector<HTMLInputElement>(
    "[data-slot=time-picker] input",
  )!;

const KOLKATA = "Asia/Kolkata";

test("one named group: the date trigger, then the time field, both named", async () => {
  const screen = await render(
    <DateTimePicker
      aria-label="Due"
      timeZone={KOLKATA}
      value={new Date("2026-11-03T03:30:00Z")}
    />,
  );
  const group = screen.getByRole("group", { name: "Due" });
  await expect.element(group).toBeInTheDocument();
  const root = group.element() as HTMLElement;
  expect(root.dataset.slot).toBe("date-time-picker");
  expect(root.dataset.size).toBe("default");
  expect(root.dataset.variant).toBe("outline");
  // 03:30 UTC is 09:00 in Kolkata, on the 3rd.
  await expect
    .element(screen.getByRole("button", { name: "Date" }))
    .toHaveTextContent("Nov 3, 2026");
  await expect
    .element(screen.getByRole("combobox", { name: "Time" }))
    .toHaveValue("9:00 AM");
  const parts = Array.from(root.children).map(
    (el) => (el as HTMLElement).dataset.slot,
  );
  expect(parts).toEqual(["date-picker-trigger", "time-picker"]);
  await expectNoA11yViolations(screen.container);
});

test("empty: the time waits for a day; a day picked alone takes defaultTime in the zone", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Held timeZone={KOLKATA} onValueChange={onValueChange} />,
  );
  expect(timeInput(screen).disabled).toBe(true);
  expect(
    screen.container
      .querySelector("[data-slot=date-time-picker]")!
      .hasAttribute("data-empty"),
  ).toBe(true);
  await expectNoA11yViolations(screen.container);

  await screen.getByRole("button", { name: "Date" }).click();
  await expect
    .poll(() => document.querySelector("button[data-day]"))
    .not.toBeNull();
  await userEvent.click(dayButton(15));
  const picked = onValueChange.mock.calls.at(-1)?.[0] as Date;
  expect(zonedParts(picked.toISOString(), KOLKATA).time).toBe("09:00");
  expect(zonedParts(picked.toISOString(), KOLKATA).day.endsWith("-15")).toBe(
    true,
  );
  await expect
    .element(screen.getByRole("combobox", { name: "Time" }))
    .toHaveValue("9:00 AM");
  expect(timeInput(screen).disabled).toBe(false);
});

test("a new time keeps the day; a new day keeps the time", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Held
      timeZone={KOLKATA}
      initial={new Date("2026-11-03T03:30:00Z")}
      onValueChange={onValueChange}
    />,
  );
  await userEvent.click(timeInput(screen));
  await userEvent.fill(timeInput(screen), "2:15 pm");
  await userEvent.keyboard("{Enter}");
  expect((onValueChange.mock.calls.at(-1)?.[0] as Date).toISOString()).toBe(
    "2026-11-03T08:45:00.000Z",
  );

  await screen.getByRole("button", { name: "Date" }).click();
  await expect
    .poll(() => document.querySelector("button[data-day]"))
    .not.toBeNull();
  await userEvent.click(dayButton(20));
  expect((onValueChange.mock.calls.at(-1)?.[0] as Date).toISOString()).toBe(
    "2026-11-20T08:45:00.000Z",
  );
});

test("a wall time the zone skips moves forward past the gap", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Held
      timeZone="America/New_York"
      initial={new Date("2026-03-08T06:00:00Z")}
      onValueChange={onValueChange}
    />,
  );
  // 01:00 EST on the spring-forward day; 02:30 does not exist there.
  await expect
    .element(screen.getByRole("combobox", { name: "Time" }))
    .toHaveValue("1:00 AM");
  await userEvent.click(timeInput(screen));
  await userEvent.fill(timeInput(screen), "2:30");
  await userEvent.keyboard("{Enter}");
  const moved = onValueChange.mock.calls.at(-1)?.[0] as Date;
  expect(zonedParts(moved.toISOString(), "America/New_York").time).toBe(
    "03:30",
  );
});

test("clearable: the date's clear control reports undefined and the time waits again", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Held
      clearable
      timeZone={KOLKATA}
      initial={new Date("2026-11-03T03:30:00Z")}
      onValueChange={onValueChange}
    />,
  );
  await screen.getByRole("button", { name: "Clear date and time" }).click();
  expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  expect(timeInput(screen).disabled).toBe(true);
});

test("sm and ghost reach both halves; disabled holds both", async () => {
  const screen = await render(
    <DateTimePicker
      aria-label="Due"
      size="sm"
      variant="ghost"
      disabled
      timeZone={KOLKATA}
      value={new Date("2026-11-03T03:30:00Z")}
    />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=date-time-picker]",
  )!;
  expect(root.dataset.size).toBe("sm");
  expect(root.dataset.variant).toBe("ghost");
  const trigger = root.querySelector<HTMLElement>(
    "[data-slot=date-picker-trigger]",
  )!;
  expect(trigger.dataset.size).toBe("sm");
  expect(trigger.dataset.variant).toBe("ghost");
  const time = root.querySelector<HTMLElement>("[data-slot=time-picker]")!;
  expect(time.dataset.size).toBe("sm");
  expect(time.dataset.variant).toBe("ghost");
  expect(trigger.hasAttribute("data-disabled")).toBe(true);
  expect(timeInput(screen).disabled).toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("invalid and described-by reach both halves", async () => {
  const screen = await render(
    <>
      <DateTimePicker
        aria-label="Due"
        aria-invalid
        aria-describedby="due-error"
        timeZone={KOLKATA}
        value={new Date("2026-11-03T03:30:00Z")}
      />
      <p id="due-error">Pick a time in the future.</p>
    </>,
  );
  for (const control of [
    screen.getByRole("button", { name: "Date" }),
    screen.getByRole("combobox", { name: "Time" }),
  ]) {
    await expect.element(control).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(control)
      .toHaveAttribute(
        "aria-describedby",
        expect.stringContaining("due-error"),
      );
  }
  await expectNoA11yViolations(screen.container);
});

test("labels replace the parts' names; other attributes and the ref reach the group", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <DateTimePicker
      ref={ref}
      aria-label="Fällig"
      data-slot="field-datetime-editor"
      labels={{ date: "Datum", time: "Uhrzeit" }}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Datum" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("combobox", { name: "Uhrzeit" }))
    .toBeInTheDocument();
  expect(ref.current?.dataset.slot).toBe("field-datetime-editor");
});
