import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataListSkeleton } from "./data-list-skeleton";

test("list view: hidden, a header and one row per `rows`, selection column and toolbar when asked", async () => {
  const screen = await render(
    <DataListSkeleton columns={3} rows={4} selectable toolbar={{ tools: 2 }} />,
  );
  const root = screen.container.querySelector(
    '[data-slot="data-list-skeleton"]',
  )!;
  expect(root.getAttribute("aria-hidden")).toBe("true");
  const rows = root.querySelectorAll('[data-slot="data-list-skeleton-row"]');
  expect(rows).toHaveLength(4);
  expect(rows[0]!.querySelectorAll("td")).toHaveLength(4);
  const toolbar = root.querySelector(
    '[data-slot="data-list-skeleton-toolbar"]',
  )!;
  // The search and the two tools.
  expect(toolbar.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  await expectNoA11yViolations(screen.container);
});

test("grid view: one card per `rows`, no table", async () => {
  const screen = await render(<DataListSkeleton view="grid" rows={3} />);
  expect(
    screen.container.querySelectorAll('[data-slot="data-list-skeleton-card"]'),
  ).toHaveLength(3);
  expect(screen.container.querySelector("table")).toBeNull();
  await expectNoA11yViolations(screen.container);
});
