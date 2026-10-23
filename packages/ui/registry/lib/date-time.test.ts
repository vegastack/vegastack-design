import { expect, test } from "vitest";
import {
  formatCalendarDate,
  parseCalendarDay,
  toCalendarDay,
} from "./date-time";

test("a calendar day formats as the day it names, never shifted by a zone", () => {
  expect(formatCalendarDate("2026-10-08")).toBe("Oct 8, 2026");
  expect(formatCalendarDate("2026-10-08", { format: "long" })).toBe(
    "October 8, 2026",
  );
  expect(formatCalendarDate("2026-10-08", { format: "numeric" })).toBe(
    "10/8/2026",
  );
  expect(
    formatCalendarDate("2026-10-08", { locale: "en-GB", format: "long" }),
  ).toBe("8 October 2026");
  // The first and last instants of that day in UTC−8 and UTC+13 are still that day.
  for (const timeZone of ["Etc/GMT+8", "Etc/GMT-13"])
    for (const local of ["00:00", "23:59"]) {
      const offset = timeZone === "Etc/GMT+8" ? "-08:00" : "+13:00";
      const instant = new Date(`2026-10-08T${local}:00${offset}`);
      expect(toCalendarDay(instant, { timeZone })).toBe("2026-10-08");
      expect(formatCalendarDate(toCalendarDay(instant, { timeZone }))).toBe(
        "Oct 8, 2026",
      );
    }
  // One instant is a different day in each zone; a stored day is not an instant.
  const instant = new Date("2026-10-08T12:00:00Z");
  expect(toCalendarDay(instant, { timeZone: "Etc/GMT+8" })).toBe("2026-10-08");
  expect(toCalendarDay(instant, { timeZone: "Etc/GMT-13" })).toBe("2026-10-09");
});

test("parseCalendarDay and toCalendarDay round-trip the local day; invalid days are empty", () => {
  const date = parseCalendarDay("2026-10-08")!;
  expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
    2026, 9, 8,
  ]);
  expect(date.getHours()).toBe(0);
  expect(toCalendarDay(date)).toBe("2026-10-08");
  expect(toCalendarDay("2026-10-08")).toBe("2026-10-08");
  for (const bad of [
    "",
    "2026-02-30",
    "2026-13-01",
    "10/08/2026",
    "2026-1-8",
  ]) {
    expect(parseCalendarDay(bad)).toBeUndefined();
    expect(formatCalendarDate(bad)).toBe("");
  }
  expect(toCalendarDay("2026-02-30")).toBe("");
  // Years 0–99 are themselves, not 1900–1999.
  expect(toCalendarDay(parseCalendarDay("0099-01-01")!)).toBe("0099-01-01");
  expect(formatCalendarDate("0099-01-01")).toMatch(/^Jan 1, 0*99$/);
  expect(toCalendarDay(new Date(Number.NaN))).toBe("");
});
