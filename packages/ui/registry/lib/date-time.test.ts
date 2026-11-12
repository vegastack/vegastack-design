import { describe, expect, test } from "vitest";
import {
  DEFAULT_DATE_FORMAT,
  dateFormatDefaults,
  formatCalendarDate,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatDueLabel,
  formatLongDate,
  formatTimeOfDay,
  formatTooltip,
  type DateFormat,
  parseCalendarDay,
  toCalendarDay,
  formatTimeValue,
  parseTimeOfDay,
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
    "0000-01-01",
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

describe("parseTimeOfDay reads back what formatTimeValue writes", () => {
  const LOCALES = [
    "en-US",
    "de",
    "ko",
    "zh-TW",
    "zh-CN",
    "ja",
    "ar-EG",
    "ar",
    "bn",
    "mr",
    "fa",
    "tr",
    "hu",
    "bg",
  ];
  const TIMES = ["00:05", "09:30", "12:00", "12:45", "13:15", "23:59"];
  for (const locale of LOCALES)
    for (const cycle of ["h12", "h23"] as const)
      test(`${locale} ${cycle}`, () => {
        for (const time of TIMES)
          expect(
            parseTimeOfDay(formatTimeValue(time, locale, cycle), locale),
          ).toBe(time);
      });

  test("the day word may lead and the digits may be the locale's", () => {
    expect(parseTimeOfDay("오전 9:30", "ko")).toBe("09:30");
    expect(parseTimeOfDay("٩:٣٠ م", "ar-EG")).toBe("21:30");
  });
});

describe("dateFormat", () => {
  const now = Date.parse("2026-11-12T10:10:00Z"); // Thu 12 Nov 2026, 15:40 in Kolkata
  const timeZone = "Asia/Kolkata";
  const at = (iso: string) => Date.parse(iso);
  const samples = [
    "2026-11-12T10:10:00Z",
    "2026-11-11T03:34:00Z",
    "2026-11-09T18:00:00Z",
    "2026-09-25T09:00:00Z",
    "2025-12-20T04:05:00Z",
    "2027-01-04T22:30:00Z",
  ];

  test("DEFAULT_DATE_FORMAT writes byte for byte what the en-US default writes", () => {
    const base = { now, timeZone };
    const styled = { ...base, dateFormat: DEFAULT_DATE_FORMAT };
    for (const iso of samples) {
      for (const absolute of [false, true])
        expect(formatDate(iso, { ...styled, absolute })).toBe(
          formatDate(iso, { ...base, absolute }),
        );
      expect(formatDateTime(iso, styled)).toBe(formatDateTime(iso, base));
      expect(formatTooltip(iso, styled)).toBe(formatTooltip(iso, base));
      expect(formatTimeOfDay(iso, styled)).toBe(formatTimeOfDay(iso, base));
      expect(formatLongDate(iso, styled)).toBe(formatLongDate(iso, base));
      expect(formatDueLabel(iso, styled)).toEqual(formatDueLabel(iso, base));
      for (const end of samples)
        for (const withTime of [undefined, false, true])
          expect(formatDateRange(iso, end, { ...styled, withTime })).toBe(
            formatDateRange(iso, end, { ...base, withTime }),
          );
    }
    for (const format of ["short", "long", "numeric"] as const)
      expect(
        formatCalendarDate("2026-10-08", {
          format,
          dateFormat: DEFAULT_DATE_FORMAT,
        }),
      ).toBe(formatCalendarDate("2026-10-08", { format }));
  });

  test.each<[DateFormat, string[]]>([
    [
      { dateStyle: "dmy", hourCycle: "h23" },
      [
        "25 Sep",
        "20 Dec 2025",
        "25 Sep · 14:30",
        "Thursday, 12 November",
        "8 Oct 2026",
        "8/10/2026",
        "25–28 Sep",
        "25 Sep – 3 Oct 2026",
        "Today · 09:05–15:40",
      ],
    ],
    [
      { dateStyle: "mdy", hourCycle: "h12" },
      [
        "Sep 25",
        "Dec 20, 2025",
        "Sep 25 · 2:30 PM",
        "Thursday, November 12",
        "Oct 8, 2026",
        "10/8/2026",
        "Sep 25–28",
        "Sep 25 – Oct 3, 2026",
        "Today · 9:05 AM – 3:40 PM",
      ],
    ],
    [
      { dateStyle: "ymd", hourCycle: "h23" },
      [
        "2026-09-25",
        "2025-12-20",
        "2026-09-25 · 14:30",
        "Thursday, 2026-11-12",
        "2026-10-08",
        "2026-10-08",
        "2026-09-25 – 2026-09-28",
        "2026-09-25 – 2026-10-03",
        "Today · 09:05–15:40",
      ],
    ],
  ])("%o writes every helper in its order and clock", (dateFormat, want) => {
    const o = { now, timeZone, dateFormat };
    const got = [
      formatDate(at("2026-09-25T09:00:00Z"), o),
      formatDate(at("2025-12-20T04:05:00Z"), o),
      formatDateTime(at("2026-09-25T09:00:00Z"), o),
      formatLongDate(now, o),
      formatCalendarDate("2026-10-08", { dateFormat }),
      formatCalendarDate("2026-10-08", { dateFormat, format: "numeric" }),
      formatDateRange("2026-09-25T09:00:00Z", "2026-09-28T09:00:00Z", o),
      formatDateRange("2026-09-25T09:00:00Z", "2026-10-03T09:00:00Z", {
        ...o,
        now: at("2025-06-01T00:00:00Z"),
      }),
      `Today · ${formatDateRange("2026-11-12T03:35:00Z", "2026-11-12T10:10:00Z", o).split(" · ")[1]}`,
    ];
    expect(got).toEqual(want);
  });

  test("dateFormatDefaults follows the zone's region", () => {
    expect(dateFormatDefaults("America/New_York")).toEqual({
      dateStyle: "mdy",
      hourCycle: "h12",
    });
    expect(dateFormatDefaults("America/Toronto")).toEqual({
      dateStyle: "mdy",
      hourCycle: "h12",
    });
    expect(dateFormatDefaults("America/Indiana/Indianapolis")).toEqual({
      dateStyle: "mdy",
      hourCycle: "h12",
    });
    expect(dateFormatDefaults("Asia/Kolkata")).toEqual({
      dateStyle: "dmy",
      hourCycle: "h12",
    });
    expect(dateFormatDefaults("Asia/Calcutta")).toEqual({
      dateStyle: "dmy",
      hourCycle: "h12",
    });
    expect(dateFormatDefaults("Australia/Sydney")).toEqual({
      dateStyle: "dmy",
      hourCycle: "h12",
    });
    expect(dateFormatDefaults("Asia/Tokyo")).toEqual({
      dateStyle: "ymd",
      hourCycle: "h23",
    });
    expect(dateFormatDefaults("Europe/Stockholm")).toEqual({
      dateStyle: "ymd",
      hourCycle: "h23",
    });
    expect(dateFormatDefaults("Europe/Berlin")).toEqual({
      dateStyle: "dmy",
      hourCycle: "h23",
    });
    expect(dateFormatDefaults("America/Mexico_City")).toEqual({
      dateStyle: "dmy",
      hourCycle: "h23",
    });
    expect(dateFormatDefaults("UTC")).toEqual({
      dateStyle: "dmy",
      hourCycle: "h23",
    });
  });
});
