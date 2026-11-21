import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
// Real layout: the container query, sticky column and scroller need the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { HealthIndicator } from "./health-indicator";
import { Timeline, type TimelineRow } from "./timeline";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

const ROWS: TimelineRow[] = [
  {
    id: "i1",
    label: "Self-serve onboarding",
    sublabel: "INI-1",
    start: "2026-10-01",
    end: "2027-01-31",
    status: "active",
    leading: <HealthIndicator health="at_risk" labelHidden />,
    leadingLabel: "At risk",
    markers: [
      { id: "m1", date: "2026-11-02", label: "Beta", state: "done" },
      { id: "m2", date: "2026-11-15", label: "Pricing", state: "late" },
    ],
  },
  {
    id: "i2",
    label: "Warehouse move",
    start: "2027-02-01",
    end: "2027-04-30",
    status: "planned",
  },
  { id: "i3", label: "Brand refresh", status: "planned" },
];

function bars() {
  return document.querySelector<HTMLElement>('[data-slot="timeline-bars"]')!;
}
function months() {
  return document.querySelector<HTMLElement>('[data-slot="timeline-months"]')!;
}

test("wide: bars, diamonds, today line, No dates last; each row names itself whole", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <div style={{ width: 960 }}>
      <Timeline rows={ROWS} today="2026-11-21" onOpen={onOpen} />
    </div>,
  );
  expect(getComputedStyle(bars()).display).not.toBe("none");
  expect(getComputedStyle(months()).display).toBe("none");
  const row = screen.getByRole("button", {
    name: "Self-serve onboarding, Oct 1, 2026 to Jan 31, 2027, Active, At risk. Milestones: Beta, Nov 2, 2026, done; Pricing, Nov 15, 2026, late",
  });
  await expect.element(row).toBeVisible();
  const scope = bars();
  expect(scope.querySelectorAll('[data-slot="timeline-bar"]')).toHaveLength(2);
  expect(
    [
      ...scope.querySelectorAll<HTMLElement>('[data-slot="timeline-marker"]'),
    ].map((m) => m.dataset.state),
  ).toEqual(["done", "late"]);
  expect(
    scope.querySelector('[data-slot="timeline-today-line"]'),
  ).not.toBeNull();
  await expect.element(screen.getByText("No dates").first()).toBeVisible();
  await expect
    .element(
      screen.getByRole("button", {
        name: "Brand refresh, no dates, Planned",
      }),
    )
    .toBeVisible();
  // The page never scrolls sideways: the scroller owns the overflow.
  const scroller = scope.querySelector<HTMLElement>(
    '[data-slot="timeline-scroller"]',
  )!;
  expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
  const root = document.querySelector<HTMLElement>('[data-slot="timeline"]')!;
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  await row.click();
  expect(onOpen).toHaveBeenCalledWith("i1");
  await expectNoA11yViolations(screen.container);
});

test("rows are one Tab stop: ↓ moves, Enter opens", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <div style={{ width: 960 }}>
      <Timeline rows={ROWS} today="2026-11-21" onOpen={onOpen} />
    </div>,
  );
  const rows = [
    ...bars().querySelectorAll<HTMLElement>('[data-slot="timeline-row"]'),
  ];
  expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  rows[0]!.focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(rows[1]);
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenCalledWith("i2");
  await userEvent.keyboard("{End}");
  expect(document.activeElement).toBe(rows[2]);
  void screen;
});

test("zoom: Month and Quarter, uncontrolled or controlled", async () => {
  function Controlled({ onZoom }: { onZoom: (z: string) => void }) {
    const [zoom, setZoom] = React.useState<"month" | "quarter">("quarter");
    return (
      <div style={{ width: 960 }}>
        <Timeline
          rows={ROWS}
          today="2026-11-21"
          zoom={zoom}
          onZoomChange={(z) => {
            onZoom(z);
            setZoom(z);
          }}
        />
      </div>
    );
  }
  const onZoom = vi.fn();
  const screen = await render(<Controlled onZoom={onZoom} />);
  const root = document.querySelector<HTMLElement>('[data-slot="timeline"]')!;
  expect(root.dataset.zoom).toBe("quarter");
  await expect.element(screen.getByText("Q1 2027")).toBeVisible();
  await screen.getByRole("button", { name: "Month" }).click();
  expect(onZoom).toHaveBeenCalledWith("month");
  expect(root.dataset.zoom).toBe("month");
  await expect.element(screen.getByText("Dec")).toBeVisible();
});

test("under 40rem it is a vertical list grouped by month, No dates last", async () => {
  const screen = await render(
    <div style={{ width: 360 }}>
      <Timeline rows={ROWS} today="2026-11-21" onOpen={() => {}} />
    </div>,
  );
  expect(getComputedStyle(bars()).display).toBe("none");
  const list = months();
  expect(getComputedStyle(list).display).not.toBe("none");
  const headings = [...list.querySelectorAll("section > p")].map(
    (p) => p.textContent,
  );
  expect(headings).toEqual(["October 2026", "February 2027", "No dates"]);
  expect(list.textContent).toContain("Pricing · Nov 15, 2026");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
  await expectNoA11yViolations(screen.container);
});

test("empty shows the consumer's node; without onOpen rows are named groups", async () => {
  const screen = await render(
    <>
      <Timeline rows={[]} empty={<p>No initiatives yet</p>} />
      <div style={{ width: 960 }}>
        <Timeline rows={ROWS.slice(1, 2)} today="2026-11-21" />
      </div>
    </>,
  );
  await expect.element(screen.getByText("No initiatives yet")).toBeVisible();
  await expect
    .element(
      screen
        .getByRole("group", {
          name: "Warehouse move, Feb 1, 2027 to Apr 30, 2027, Planned",
        })
        .first(),
    )
    .toBeInTheDocument();
  expect(
    document.querySelectorAll('[data-slot="timeline-row"][tabindex]'),
  ).toHaveLength(0);
  await expectNoA11yViolations(screen.container);
});

test("loadMore asks for the next page when the end comes into view", async () => {
  const onLoadMore = vi.fn();
  await render(
    <div style={{ width: 960 }}>
      <Timeline
        rows={ROWS}
        today="2026-11-21"
        loadMore={{ hasMore: true, onLoadMore }}
      />
    </div>,
  );
  await vi.waitFor(() => expect(onLoadMore).toHaveBeenCalled());
});
