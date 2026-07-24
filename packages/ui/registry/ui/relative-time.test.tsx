import * as React from "react";
import { renderToString } from "react-dom/server";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TooltipProvider } from "./tooltip";
import { RelativeTime } from "./relative-time";

// A fixed reference instant so every relative string is deterministic.
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0); // 2026-01-15T12:00:00Z
const ms = (n: number) => NOW + n;

test("uses a deterministic pending value during uncontrolled server rendering", () => {
  const markup = renderToString(
    <RelativeTime date="2026-01-15T10:00:00.000Z" title={false} />,
  );
  expect(markup).toContain('aria-busy="true"');
  expect(markup).toMatch(/aria-busy="true"[^>]*><\/time>$/);
});

test('renders a past instant as "ago" copy', async () => {
  const date = new Date(ms(-2 * 3_600_000)); // 2 hours before NOW
  const screen = await render(
    <RelativeTime date={date} now={NOW} title={false} />,
  );
  await expect.element(screen.getByText("2 hours ago")).toBeInTheDocument();
});

test('unitStyle="narrow" renders the compact form ("2h ago")', async () => {
  const date = new Date(ms(-2 * 3_600_000));
  const screen = await render(
    <RelativeTime
      date={date}
      now={NOW}
      title={false}
      unitStyle="narrow"
      locale="en"
    />,
  );
  await expect.element(screen.getByText("2h ago")).toBeInTheDocument();
});

test('renders a future instant as "in …" copy', async () => {
  const date = new Date(ms(3 * 86_400_000)); // 3 days after NOW
  const screen = await render(
    <RelativeTime date={date} now={NOW} title={false} />,
  );
  await expect.element(screen.getByText("in 3 days")).toBeInTheDocument();
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
  const el = screen.getByText("1 hour ago");
  await expect.element(el).toHaveAttribute("dateTime", date.toISOString());
  await expect.element(el).toHaveAttribute("data-slot", "relative-time");
});

test("accepts an ISO string and an epoch-number date", async () => {
  const iso = await render(
    <RelativeTime date="2026-01-15T10:00:00.000Z" now={NOW} title={false} />,
  );
  await expect.element(iso.getByText("2 hours ago")).toBeInTheDocument();

  const num = await render(
    <RelativeTime date={ms(-60_000)} now={NOW} title={false} />,
  );
  await expect.element(num.getByText("1 minute ago")).toBeInTheDocument();
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
  const el = screen.getByText("2 hours ago");
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
  // Keyboard focus opens the tooltip instantly (no hover delay).
  await userEvent.tab();
  const tip = screen.getByRole("tooltip");
  await expect.element(tip).toBeInTheDocument();
  await expect.element(tip).toHaveTextContent("January 15, 2026");
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
  await userEvent.tab();
  await expect
    .element(screen.getByRole("tooltip"))
    .toHaveTextContent("Created at launch");
});

test("renders a bare <time> with no tooltip when title is false", async () => {
  const screen = await render(
    <RelativeTime date={new Date(ms(-3_600_000))} now={NOW} title={false} />,
  );
  const el = screen.getByText("1 hour ago");
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
  await userEvent.tab();
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
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
