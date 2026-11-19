import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { DelegateRow, type DelegateRowProps } from "./delegate-row";

const base: DelegateRowProps = {
  area: "Approvals · Expenses, Travel",
  person: { name: "Rohan Mehta", avatar: <span aria-hidden>R</span> },
  from: "2 Dec",
  until: "30 Dec",
  state: "active",
};

test("a delegate reads as a member row: name over what and when, the state, and Edit · End in the ⋯", async () => {
  const onEdit = vi.fn();
  const onEnd = vi.fn();
  const screen = await render(
    <DelegateRow
      {...base}
      note="I'm on leave; Rohan approves anything under ₹50,000."
      onEdit={onEdit}
      onEnd={onEnd}
    />,
  );
  const row = screen.container.querySelector('[data-slot="delegate-row"]')!;
  expect(
    row.querySelector('[data-slot="delegate-row-area"]')!.textContent,
  ).toBe("Approvals · Expenses, Travel · 2 Dec – 30 Dec");
  expect(
    row.querySelector('[data-slot="delegate-row-state"]')!.textContent,
  ).toBe("Active");
  expect(row.querySelector('[data-slot="delegate-row-note"]')).not.toBeNull();
  await page
    .getByRole("button", { name: "More for Rohan Mehta's delegation" })
    .click();
  await page.getByRole("menuitem", { name: "End now" }).click();
  expect(onEnd).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("upcoming offers Cancel; ended and read-only rows have no actions", async () => {
  const screen = await render(
    <>
      <DelegateRow {...base} state="upcoming" onEnd={vi.fn()} />
      <DelegateRow {...base} state="ended" onEdit={vi.fn()} onEnd={vi.fn()} />
      <DelegateRow {...base} />
    </>,
  );
  const rows = screen.container.querySelectorAll('[data-slot="delegate-row"]');
  expect(rows[1]!.querySelector("button")).toBeNull();
  expect(rows[2]!.querySelector("button")).toBeNull();
  await page
    .getByRole("button", { name: "More for Rohan Mehta's delegation" })
    .click();
  await expect
    .element(page.getByRole("menuitem", { name: "Cancel" }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});
