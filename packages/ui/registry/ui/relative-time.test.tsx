import * as React from "react";
import { renderToString } from "react-dom/server";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TooltipProvider } from "./tooltip";
import { RelativeTime } from "./relative-time";

/**
 * The open tooltip popup, by slot.
 *
 * Base UI's Tooltip popup carries NO `role="tooltip"` and its trigger gets no `aria-describedby` —
 * deliberate upstream behaviour ("tooltips are visual-only"), inherited when Batch 2 of the shadcn
 * reset put Tooltip back on upstream's file. The accessible copy lives on the `<time>` itself,
 * which the tests above assert directly; the popup is located by its slot.
 */
async function openTooltip(container: Element) {
  return vi.waitUntil(() =>
    container.ownerDocument.querySelector('[data-slot="tooltip-content"]'),
  );
}

// A fixed reference instant so every relative string is deterministic.
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0); // 2026-01-15T12:00:00Z
const ms = (n: number) => NOW + n;

test("server-renders the absolute date, never an empty placeholder (B2-05)", () => {
  const markup = renderToString(
    <RelativeTime date="2026-01-15T10:00:00.000Z" title={false} />,
  );
  // The pre-hydration frame is a real, readable date — not a blank element the
  // client fills in later, and not an `aria-busy` placeholder.
  const absolute = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date("2026-01-15T10:00:00.000Z"));
  expect(markup).toContain(absolute);
  expect(markup).not.toContain("aria-busy");
  expect(markup).not.toMatch(/><\/time>/);
  // The machine-readable instant is present from the very first byte.
  expect(markup).toMatch(/datetime="2026-01-15T10:00:00\.000Z"/i);
});

test("a controlled `now` server-renders the relative label with no swap", () => {
  const markup = renderToString(
    <RelativeTime
      date={new Date(ms(-2 * 3_600_000))}
      now={NOW}
      title={false}
      locale="en"
    />,
  );
  expect(markup).toContain("2h ago");
});

test('renders a past instant as "ago" copy', async () => {
  const date = new Date(ms(-2 * 3_600_000)); // 2 hours before NOW
  const screen = await render(
    <RelativeTime date={date} now={NOW} title={false} />,
  );
  await expect.element(screen.getByText("2h ago")).toBeInTheDocument();
});

test("the default is the compact house form, with no periods", async () => {
  const cases: [number, string][] = [
    [-30_000, "now"],
    [-19 * 60_000, "19m ago"],
    [-3 * 3_600_000, "3h ago"],
    [-2 * 86_400_000, "2d ago"],
    [-3 * 7 * 86_400_000, "3w ago"],
    [-5 * 30 * 86_400_000, "5mo ago"],
    [-400 * 86_400_000, "1y ago"],
  ];
  for (const [delta, label] of cases) {
    const screen = await render(
      <RelativeTime date={new Date(ms(delta))} now={NOW} title={false} />,
    );
    await expect.element(screen.getByText(label)).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain(".");
    await screen.unmount();
  }
});

test('format="minimal" drops the suffix; format="long" spells the unit', async () => {
  const date = new Date(ms(-19 * 60_000));
  const minimal = await render(
    <RelativeTime date={date} now={NOW} title={false} format="minimal" />,
  );
  await expect.element(minimal.getByText("19m")).toBeInTheDocument();
  const long = await render(
    <RelativeTime date={date} now={NOW} title={false} format="long" />,
  );
  await expect.element(long.getByText("19 minutes ago")).toBeInTheDocument();
});

test('the deprecated unitStyle="short" no longer prints "min."', async () => {
  const screen = await render(
    <RelativeTime
      date={new Date(ms(-19 * 60_000))}
      now={NOW}
      title={false}
      unitStyle="short"
    />,
  );
  await expect.element(screen.getByText("19m ago")).toBeInTheDocument();
});

test('renders a future instant as "in …" copy', async () => {
  const date = new Date(ms(3 * 86_400_000)); // 3 days after NOW
  const screen = await render(
    <RelativeTime date={date} now={NOW} title={false} />,
  );
  await expect.element(screen.getByText("in 3d")).toBeInTheDocument();
});

test('collapses a sub-minute delta to "now"', async () => {
  const screen = await render(
    <RelativeTime date={new Date(ms(-5_000))} now={NOW} title={false} />,
  );
  await expect.element(screen.getByText("now")).toBeInTheDocument();
});

test("renders a semantic <time> with an ISO dateTime + data-slot", async () => {
  const date = new Date(ms(-3_600_000));
  const screen = await render(
    <RelativeTime date={date} now={NOW} title={false} />,
  );
  const el = screen.getByText("1h ago");
  await expect.element(el).toHaveAttribute("dateTime", date.toISOString());
  await expect.element(el).toHaveAttribute("data-slot", "relative-time");
});

test("accepts an ISO string and an epoch-number date", async () => {
  const iso = await render(
    <RelativeTime date="2026-01-15T10:00:00.000Z" now={NOW} title={false} />,
  );
  await expect.element(iso.getByText("2h ago")).toBeInTheDocument();

  const num = await render(
    <RelativeTime date={ms(-60_000)} now={NOW} title={false} />,
  );
  await expect.element(num.getByText("1m ago")).toBeInTheDocument();
});

test("day mode labels adjacent days and sets data-mode", async () => {
  const yesterday = await render(
    <RelativeTime
      date={new Date(ms(-86_400_000))}
      now={NOW}
      mode="day"
      title={false}
    />,
  );
  const el = yesterday.getByText("yesterday");
  await expect.element(el).toBeInTheDocument();
  await expect.element(el).toHaveAttribute("data-mode", "day");

  const tomorrow = await render(
    <RelativeTime
      date={new Date(ms(86_400_000))}
      now={NOW}
      mode="day"
      title={false}
    />,
  );
  await expect.element(tomorrow.getByText("tomorrow")).toBeInTheDocument();
});

test("day mode falls back to an absolute date for distant days", async () => {
  // Same calendar year → month + day, no year.
  const sameYear = await render(
    <RelativeTime
      date={new Date(Date.UTC(2026, 2, 15, 12))}
      now={NOW}
      mode="day"
      title={false}
    />,
  );
  await expect.element(sameYear.getByText("March 15")).toBeInTheDocument();

  // Different year → month, day, year.
  const otherYear = await render(
    <RelativeTime
      date={new Date(Date.UTC(2024, 2, 15, 12))}
      now={NOW}
      mode="day"
      title={false}
    />,
  );
  await expect
    .element(otherYear.getByText("March 15, 2024"))
    .toBeInTheDocument();
});

test("renders an invalid date as an empty <time> with no dateTime", async () => {
  const screen = await render(
    <RelativeTime date="not-a-date" now={NOW} title={false} data-testid="rt" />,
  );
  const el = screen.getByTestId("rt");
  await expect.element(el).toBeInTheDocument();
  await expect.element(el).not.toHaveAttribute("dateTime");
});

test("projects the <time> itself as the tooltip trigger (focusable)", async () => {
  const date = new Date(ms(-2 * 3_600_000));
  const screen = await render(
    <TooltipProvider>
      <RelativeTime date={date} now={NOW} />
    </TooltipProvider>,
  );
  // The <time> stays the rendered element (Base UI projects its trigger handlers
  // onto it) and becomes keyboard-focusable so the absolute date is reachable.
  const el = screen.getByText("2h ago");
  expect(el.element().tagName).toBe("TIME");
  await expect.element(el).toHaveAttribute("data-slot", "relative-time");
  await expect.element(el).toHaveAttribute("tabindex", "0");
});

test("reveals the absolute date-time on focus", async () => {
  const date = new Date(ms(-2 * 3_600_000)); // 2026-01-15T10:00:00Z
  const screen = await render(
    <TooltipProvider>
      <RelativeTime date={date} now={NOW} locale="en-US" />
    </TooltipProvider>,
  );
  // Focus opens the tooltip instantly (no hover delay). The preceding test separately proves the
  // projected <time> is a real tab stop; target it here so this assertion measures the focus
  // behavior rather than inheriting Firefox's document-level Tab cursor from earlier tests.
  (screen.getByText("2h ago").element() as HTMLElement).focus();
  // Base UI's Tooltip popup carries NO `role="tooltip"` and the trigger gets no
  // `aria-describedby` — deliberate upstream behaviour ("tooltips are visual-only"), inherited
  // when Batch 2 of the shadcn reset put Tooltip back on upstream's file. Locate the popup by its
  // slot; `relative-time.tsx` is what carries the accessible copy, on the <time> itself.
  const tip = await openTooltip(screen.container);
  // The tooltip also renders the time of day, which depends on the host timezone.
  expect(tip?.textContent ?? "").toContain("Jan 15, 2026");
});

test("accepts a custom tooltip label", async () => {
  const screen = await render(
    <TooltipProvider>
      <RelativeTime
        date={new Date(ms(-3_600_000))}
        now={NOW}
        title="Created at launch"
      />
    </TooltipProvider>,
  );
  (screen.getByText("1h ago").element() as HTMLElement).focus();
  expect((await openTooltip(screen.container)).textContent).toBe(
    "Created at launch",
  );
});

test("renders a bare <time> with no tooltip when title is false", async () => {
  const screen = await render(
    <RelativeTime date={new Date(ms(-3_600_000))} now={NOW} title={false} />,
  );
  const el = screen.getByText("1h ago");
  await expect.element(el).not.toHaveAttribute("data-slot", "tooltip-trigger");
  await expect.element(el).toHaveAttribute("data-slot", "relative-time");
});

test("no a11y violations", async () => {
  const screen = await render(
    <TooltipProvider>
      <RelativeTime date={new Date(ms(-90 * 60_000))} now={NOW} />
    </TooltipProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (tooltip open)", async () => {
  const screen = await render(
    <TooltipProvider>
      <RelativeTime date={new Date(ms(-90 * 60_000))} now={NOW} />
    </TooltipProvider>,
  );
  (screen.getByText("1h ago").element() as HTMLElement).focus();
  await openTooltip(screen.container);
  // axe the portaled popup, which lands outside the test container.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("forwards ref to the <time> element", async () => {
  const ref = React.createRef<HTMLTimeElement>();
  await render(
    <RelativeTime
      ref={ref}
      date={new Date(ms(-3_600_000))}
      now={NOW}
      title={false}
    />,
  );
  expect(ref.current).toBeInstanceOf(HTMLTimeElement);
  expect(ref.current?.dataset.slot).toBe("relative-time");
});

/* DS-11 — time zone, capitalize, format options, with time, and a plain label's box */

// 00:30 on 23 Sep in IST (UTC+5:30) is still 19:00 on 22 Sep in UTC.
const ZONE_NOW = Date.UTC(2026, 8, 22, 19, 0, 0);
// 22:30 on 22 Sep in IST, 17:00 on 22 Sep in UTC.
const ZONE_DATE = new Date(Date.UTC(2026, 8, 22, 17, 0, 0));

test("DS-11: timeZone decides the calendar day", async () => {
  const screen = await render(
    <>
      <RelativeTime
        mode="day"
        date={ZONE_DATE}
        now={ZONE_NOW}
        timeZone="Asia/Kolkata"
        locale="en-US"
        title={false}
        data-testid="ist"
      />
      <RelativeTime
        mode="day"
        date={ZONE_DATE}
        now={ZONE_NOW}
        timeZone="UTC"
        locale="en-US"
        title={false}
        data-testid="utc"
      />
    </>,
  );
  await expect
    .element(screen.getByTestId("ist"))
    .toHaveTextContent("yesterday");
  await expect.element(screen.getByTestId("utc")).toHaveTextContent("today");
});

test("DS-11: capitalize upper-cases a standalone label", async () => {
  const screen = await render(
    <RelativeTime
      mode="day"
      capitalize
      date={ZONE_DATE}
      now={ZONE_NOW}
      timeZone="UTC"
      locale="en-US"
      title={false}
    />,
  );
  await expect.element(screen.getByText("Today")).toBeInTheDocument();
});

test("DS-11: formatOptions shapes the absolute date, and the year appears only for another year", async () => {
  const screen = await render(
    <>
      <RelativeTime
        mode="day"
        date={new Date(Date.UTC(2026, 8, 2, 12))}
        now={ZONE_NOW}
        timeZone="UTC"
        locale="en-US"
        formatOptions={{ month: "short", day: "numeric" }}
        title={false}
        data-testid="same-year"
      />
      <RelativeTime
        mode="day"
        date={new Date(Date.UTC(2025, 8, 2, 12))}
        now={ZONE_NOW}
        timeZone="UTC"
        locale="en-US"
        formatOptions={{ month: "short", day: "numeric" }}
        title={false}
        data-testid="last-year"
      />
    </>,
  );
  await expect
    .element(screen.getByTestId("same-year"))
    .toHaveTextContent("Sep 2");
  await expect
    .element(screen.getByTestId("last-year"))
    .toHaveTextContent("Sep 2, 2025");
});

test("DS-11: withTime appends the time of day in the given zone", async () => {
  const screen = await render(
    <RelativeTime
      mode="day"
      withTime
      capitalize
      date={ZONE_DATE}
      now={ZONE_NOW}
      timeZone="UTC"
      locale="en-US"
      title={false}
    />,
  );
  await expect.element(screen.getByText("Today, 5:00 PM")).toBeInTheDocument();
});

test("DS-11: the tooltip label is formatted in the same zone", async () => {
  const screen = await render(
    <TooltipProvider>
      <RelativeTime
        mode="day"
        date={ZONE_DATE}
        now={ZONE_NOW}
        timeZone="Asia/Kolkata"
        locale="en-US"
      />
    </TooltipProvider>,
  );
  (screen.getByText("yesterday").element() as HTMLElement).focus();
  const tip = await openTooltip(screen.container);
  expect(tip?.textContent ?? "").toContain("Sep 22, 2026 · 10:30 PM");
});

test("DS-11: the server render and the client render print the same text in a zone", async () => {
  const element = (
    <RelativeTime
      mode="day"
      capitalize
      date={ZONE_DATE}
      now={ZONE_NOW}
      timeZone="Asia/Kolkata"
      locale="en-US"
      title={false}
    />
  );
  const markup = renderToString(element);
  const screen = await render(element);
  const client = screen.container.querySelector("time")!.textContent!;
  expect(client).toBe("Yesterday");
  expect(markup).toContain(`>${client}</time>`);
});

test("DS-11: an uncontrolled server render formats its absolute date in the zone", () => {
  const markup = renderToString(
    <RelativeTime date={ZONE_DATE} timeZone="Asia/Kolkata" locale="en-US" />,
  );
  // 17:00 UTC on 22 Sep is 22:30 on 22 Sep in IST, and 05:00 on 23 Sep in Auckland (NZST, UTC+12).
  expect(markup).toContain("Sep 22, 2026");
  const auckland = renderToString(
    <RelativeTime
      date={ZONE_DATE}
      timeZone="Pacific/Auckland"
      locale="en-US"
    />,
  );
  expect(auckland).toContain("Sep 23, 2026");
});

test("DS-11: a plain label is inline text; only a tooltip trigger owns the 24px box", async () => {
  const screen = await render(
    <TooltipProvider>
      <RelativeTime date={new Date(ms(-3_600_000))} now={NOW} title={false} />
      <RelativeTime date={new Date(ms(-7_200_000))} now={NOW} />
    </TooltipProvider>,
  );
  const plain = screen.getByText("1h ago").element();
  const trigger = screen.getByText("2h ago").element();
  expect(plain.className).not.toContain("min-h-6");
  expect(plain.className).not.toContain("inline-flex");
  expect(plain.className).not.toContain("tabular-nums");
  expect(trigger.className).toContain("min-h-6");
  expect(trigger.className).toContain("inline-flex");
});

test("no a11y violations — day mode with time zone, capitalized, with time", async () => {
  const screen = await render(
    <TooltipProvider>
      <RelativeTime
        mode="day"
        withTime
        capitalize
        date={ZONE_DATE}
        now={ZONE_NOW}
        timeZone="Asia/Kolkata"
        locale="en-US"
      />
    </TooltipProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

test("DS-11: a dateStyle formatOptions renders another year and withTime without throwing", async () => {
  const screen = await render(
    <RelativeTime
      mode="day"
      withTime
      date={new Date(Date.UTC(2025, 8, 2, 12))}
      now={ZONE_NOW}
      timeZone="UTC"
      locale="en-US"
      formatOptions={{ dateStyle: "medium" }}
      title={false}
      data-testid="styled"
    />,
  );
  await expect
    .element(screen.getByTestId("styled"))
    .toHaveTextContent("Sep 2, 2025, 12:00 PM");
});
