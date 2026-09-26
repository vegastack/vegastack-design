import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { Building2, CalendarDays, UserRound } from "lucide-react";
import { PriorityIcon } from "../registry/ui/priority-icon";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "../registry/ui/property-list";
import { PropertyPerson } from "../registry/ui/record-aside";
import { RecordChip } from "../registry/ui/record-chip";
import { DateTime, DueLabel } from "../registry/ui/relative-time";
import { StatusIcon } from "../registry/ui/status-icon";

/** The box a segment paints its hover background into: its padding box when clipped there. */
function paintBox(el: Element) {
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  if (s.backgroundClip !== "padding-box") return r;
  const t = parseFloat(s.borderTopWidth);
  const rr = parseFloat(s.borderRightWidth);
  const b = parseFloat(s.borderBottomWidth);
  const l = parseFloat(s.borderLeftWidth);
  return new DOMRect(r.left + l, r.top + t, r.width - l - rr, r.height - t - b);
}

/** The pill's inner edge (inside its border). */
function innerBox(el: Element) {
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  const t = parseFloat(s.borderTopWidth);
  const l = parseFloat(s.borderLeftWidth);
  return new DOMRect(
    r.left + l,
    r.top + t,
    r.width - l - parseFloat(s.borderRightWidth),
    r.height - t - parseFloat(s.borderBottomWidth),
  );
}

test("split-chip-inset: both segments' hover backgrounds sit the same distance from the border and the separator", async () => {
  const screen = await render(
    <RecordChip
      icon={<Building2 />}
      value="Acme Corp"
      href="#acme"
      linkLabel="Open Acme Corp"
    />,
  );
  const chip = screen.container.querySelector('[data-slot="record-chip"]')!;
  const main = paintBox(
    chip.querySelector('[data-slot="record-chip-trigger"]')!,
  );
  const link = paintBox(chip.querySelector("a")!);
  const sep = chip
    .querySelector('[data-slot="split-chip-separator"]')!
    .getBoundingClientRect();
  const inner = innerBox(chip);

  const insets = {
    start: main.left - inner.left,
    end: inner.right - link.right,
    mainTop: main.top - inner.top,
    mainBottom: inner.bottom - main.bottom,
    linkTop: link.top - inner.top,
    linkBottom: inner.bottom - link.bottom,
    beforeSeparator: sep.left - main.right,
    afterSeparator: link.left - sep.right,
  };
  for (const [side, value] of Object.entries(insets)) {
    expect(value, side).toBeCloseTo(insets.start, 1);
  }
  expect(insets.start).toBe(2);
});

test("ghost-chip-align: a ghost chip's text starts where plain values do, and every row is one height", async () => {
  const due = new Date(Date.now() - 4 * 86_400_000);
  const screen = await render(
    <div className="w-80">
      <PropertyList variant="inline" aria-label="Task properties">
        <PropertyRow data-testid="status">
          <PropertyLabel>Status</PropertyLabel>
          <PropertyValue>
            <RecordChip
              variant="ghost"
              icon={<StatusIcon status="progress" size="xs" label="" />}
              value="In progress"
            />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="priority">
          <PropertyLabel>Priority</PropertyLabel>
          <PropertyValue>
            <RecordChip
              variant="ghost"
              icon={<PriorityIcon priority="high" size="xs" label="" />}
              value="High"
            />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="assignee">
          <PropertyLabel>Assignee</PropertyLabel>
          <PropertyValue>
            <RecordChip
              variant="ghost"
              icon={<UserRound />}
              person={{ name: "Asha Rao" }}
              aria-label="Assignee: Asha Rao"
            />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="due">
          <PropertyLabel>Due</PropertyLabel>
          <PropertyValue>
            <RecordChip
              variant="ghost"
              icon={<CalendarDays />}
              value={<DueLabel date={due} title={false} focusable={false} />}
              aria-label="Change due date"
            />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="empty">
          <PropertyLabel>Follow-up</PropertyLabel>
          <PropertyValue>
            <RecordChip variant="ghost" placeholder="Set due date" />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="text">
          <PropertyLabel>Type</PropertyLabel>
          <PropertyValue>Client call</PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="person">
          <PropertyLabel>Created by</PropertyLabel>
          <PropertyValue>
            <PropertyPerson name="Priya Nair" badge="Inactive" />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow data-testid="date">
          <PropertyLabel>Created at</PropertyLabel>
          <PropertyValue>
            <DateTime date={due} variant="datetime" />
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
    </div>,
  );
  const row = (id: string) =>
    screen.container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const valueCell = (id: string) =>
    row(id).querySelector<HTMLElement>('[data-slot="property-value"]')!;
  const textLeft = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects()[0]!.left;
  };

  // Plain text starts at the value column's edge; each ghost chip's first glyph or icon does too.
  const column = valueCell("text").getBoundingClientRect().left;
  expect(textLeft(valueCell("text"))).toBeCloseTo(column, 0);
  for (const id of ["status", "priority", "assignee", "due", "empty"]) {
    const trigger = valueCell(id).querySelector(
      '[data-slot="record-chip-trigger"]',
    )!;
    const first = [...trigger.children].find(
      (c) => getComputedStyle(c).display !== "none",
    )!;
    expect(first.getBoundingClientRect().left, id).toBeCloseTo(column, 0);
    // No border, no fill at rest.
    const chip = valueCell(id).querySelector('[data-slot="record-chip"]')!;
    expect(getComputedStyle(chip).borderTopWidth, id).toBe("0px");
    expect(getComputedStyle(trigger).borderTopWidth, id).toBe("0px");
    expect(getComputedStyle(trigger).backgroundColor, id).toBe(
      "rgba(0, 0, 0, 0)",
    );
    // Body text: the same size and weight as the plain value.
    expect(getComputedStyle(trigger).fontSize, id).toBe(
      getComputedStyle(valueCell("text")).fontSize,
    );
    expect(getComputedStyle(trigger).fontWeight, id).toBe(
      getComputedStyle(valueCell("text")).fontWeight,
    );
  }

  // Only the semantic icons survive: status and priority keep theirs, the assignee's and the due
  // date's record-type icons are dropped, and the person shows a 20px avatar instead.
  const icon = (id: string) =>
    valueCell(id).querySelector<HTMLElement>('[data-slot="record-chip-icon"]');
  expect(getComputedStyle(icon("status")!).display).not.toBe("none");
  expect(getComputedStyle(icon("priority")!).display).not.toBe("none");
  expect(icon("assignee")).toBeNull();
  expect(getComputedStyle(icon("due")!).display).toBe("none");
  const avatar = valueCell("assignee")
    .querySelector('[data-slot="record-chip-avatar"]')!
    .getBoundingClientRect();
  expect([avatar.width, avatar.height]).toEqual([20, 20]);
  const personAvatar = valueCell("person")
    .querySelector('[data-slot="avatar"]')!
    .getBoundingClientRect();
  expect([personAvatar.width, personAvatar.height]).toEqual([20, 20]);

  // Every row is one height, whatever it holds.
  const heights = [
    "status",
    "priority",
    "assignee",
    "due",
    "empty",
    "text",
    "person",
    "date",
  ].map((id) => row(id).getBoundingClientRect().height);
  expect(new Set(heights).size, JSON.stringify(heights)).toBe(1);

  // The ▾ is hidden at rest, shown on hover, and hovering moves nothing.
  const trigger = valueCell("assignee").querySelector<HTMLElement>(
    '[data-slot="record-chip-trigger"]',
  )!;
  const chevron = trigger.querySelector('[data-slot="record-chip-chevron"]')!;
  expect(getComputedStyle(chevron).opacity).toBe("0");
  // Measured against the list, so a scroll-into-view on hover does not count as movement.
  const list = screen.container.querySelector('[data-slot="property-list"]')!;
  const offset = () => {
    const t = trigger.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    return [t.left - l.left, t.top - l.top, t.width, t.height];
  };
  const before = offset();
  const rowBefore = row("assignee").getBoundingClientRect().height;
  await userEvent.hover(trigger);
  await expect.poll(() => getComputedStyle(chevron).opacity).toBe("1");
  expect(offset()).toEqual(before);
  expect(row("assignee").getBoundingClientRect().height).toBe(rowBefore);
  expect(getComputedStyle(trigger).backgroundColor).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
});

test("ghost-chip-open: the ▾ stays visible while the menu is open", async () => {
  const screen = await render(
    <RecordChip variant="ghost" value="Asha Rao" aria-expanded="true" />,
  );
  const chevron = screen.container.querySelector(
    '[data-slot="record-chip-chevron"]',
  )!;
  await expect.poll(() => getComputedStyle(chevron).opacity).toBe("1");
});
