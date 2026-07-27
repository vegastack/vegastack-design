import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Timeline, TimelineItem, TimelineSeparator } from "./timeline";

test("renders an ordered list of entries", async () => {
  const screen = await render(
    <Timeline aria-label="Activity">
      <TimelineItem>First event</TimelineItem>
      <TimelineItem>Second event</TimelineItem>
    </Timeline>,
  );
  const list = screen.getByRole("list", { name: "Activity" });
  await expect.element(list).toBeInTheDocument();
  expect((list.element() as HTMLElement).tagName).toBe("OL");
  const items = document.querySelectorAll('[data-slot="timeline-item"]');
  expect(items).toHaveLength(2);
});

test("separators render through Marker's separator variant as real list items", async () => {
  const screen = await render(
    <Timeline aria-label="Activity">
      <TimelineSeparator>Today</TimelineSeparator>
      <TimelineItem>Event</TimelineItem>
    </Timeline>,
  );
  const separator = document.querySelector(
    '[data-slot="timeline-separator"]',
  ) as HTMLElement;
  // A real <li> — an <ol> may only contain list items (axe aria-required-children).
  expect(separator.tagName).toBe("LI");
  // The label renders through Marker's separator variant.
  const marker = separator.querySelector('[data-slot="marker"]');
  expect(marker?.getAttribute("data-variant")).toBe("separator");
  expect(separator.textContent).toContain("Today");
  await expectNoA11yViolations(screen.container);
});

test("the rail is aria-hidden and the connector hides on the last entry", async () => {
  await render(
    <Timeline aria-label="Activity">
      <TimelineItem>First</TimelineItem>
      <TimelineItem>Last</TimelineItem>
    </Timeline>,
  );
  const rails = document.querySelectorAll('[data-slot="timeline-rail"]');
  expect(rails).toHaveLength(2);
  for (const rail of rails)
    expect(rail.getAttribute("aria-hidden")).toBe("true");
  const connectors = document.querySelectorAll(
    '[data-slot="timeline-connector"]',
  );
  // Present on every item (CSS hides the last via group-last) — assert the
  // class contract since the harness compiles no Tailwind.
  expect(connectors).toHaveLength(2);
  expect((connectors[0] as HTMLElement).className).toContain(
    "group-last/timeline-item:hidden",
  );
});

test("a custom node replaces the default dot", async () => {
  await render(
    <Timeline aria-label="Activity">
      <TimelineItem node={<span data-testid="custom-node">★</span>}>
        Event
      </TimelineItem>
    </Timeline>,
  );
  const node = document.querySelector('[data-slot="timeline-node"]')!;
  expect(node.querySelector('[data-testid="custom-node"]')).not.toBeNull();
});

test("long-list entries carry the content-visibility render-skipping recipe", async () => {
  await render(
    <Timeline aria-label="Activity">
      <TimelineItem>Event</TimelineItem>
    </Timeline>,
  );
  const item = document.querySelector(
    '[data-slot="timeline-item"]',
  ) as HTMLElement;
  expect(item.className).toContain("[content-visibility:auto]");
  expect(item.className).toContain("[contain-intrinsic-size:auto_");
});

test("refs forward to ol / li roots", async () => {
  const listRef = React.createRef<HTMLOListElement>();
  const itemRef = React.createRef<HTMLLIElement>();
  const sepRef = React.createRef<HTMLLIElement>();
  await render(
    <Timeline ref={listRef} aria-label="Activity">
      <TimelineSeparator ref={sepRef}>Today</TimelineSeparator>
      <TimelineItem ref={itemRef}>Event</TimelineItem>
    </Timeline>,
  );
  expect(listRef.current?.dataset.slot).toBe("timeline");
  expect(itemRef.current?.dataset.slot).toBe("timeline-item");
  expect(sepRef.current?.dataset.slot).toBe("timeline-separator");
});

test("a row composed as a link keeps a focusable interactive surface", async () => {
  const screen = await render(
    <Timeline aria-label="Activity">
      <TimelineItem>
        <a href="/deals/42">Deal updated</a>
      </TimelineItem>
    </Timeline>,
  );
  const link = screen
    .getByRole("link", { name: "Deal updated" })
    .element() as HTMLElement;
  link.focus();
  expect(document.activeElement).toBe(link);
});

test("no a11y violations — entries, separators, time elements", async () => {
  const screen = await render(
    <Timeline aria-label="Delivery log">
      <TimelineSeparator>Today</TimelineSeparator>
      <TimelineItem>
        Delivered
        <time dateTime="2026-07-27T09:00:00Z">9:00</time>
      </TimelineItem>
      <TimelineItem>
        Sent
        <time dateTime="2026-07-27T08:00:00Z">8:00</time>
      </TimelineItem>
    </Timeline>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — the DOCUMENTED composition (Item rows with role=none)", async () => {
  // Item's default role="listitem" inside a <li> nests listitem-in-listitem
  // (axe aria-required-parent, critical) — the docs prescribe role="none".
  const { Item, ItemContent, ItemTitle } = await import("./item");
  const screen = await render(
    <Timeline aria-label="Activity">
      <TimelineSeparator>Today</TimelineSeparator>
      <TimelineItem>
        <Item size="sm" role="none">
          <ItemContent>
            <ItemTitle>Deal moved to Won</ItemTitle>
          </ItemContent>
        </Item>
      </TimelineItem>
      <TimelineItem>
        <Item size="sm" render={<a href="#x" />}>
          <ItemContent>
            <ItemTitle>Linked row</ItemTitle>
          </ItemContent>
        </Item>
      </TimelineItem>
    </Timeline>,
  );
  await expectNoA11yViolations(screen.container);
});

test("focus indicator: nothing in the timeline strips the outline", async () => {
  await render(
    <Timeline aria-label="Activity">
      <TimelineItem>
        <a href="#x">Row link</a>
      </TimelineItem>
    </Timeline>,
  );
  const offenders = Array.from(document.querySelectorAll("*")).filter(
    (el) =>
      (el.getAttribute("class") ?? "").includes("outline-none") &&
      !["INPUT", "TEXTAREA"].includes(el.tagName),
  );
  expect(offenders).toEqual([]);
});
