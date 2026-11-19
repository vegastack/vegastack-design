import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { RoutineRow, type RoutineRowProps } from "./routine-row";

const base: RoutineRowProps = {
  name: "Monday supplier check",
  href: "/routines/r1",
  schedule: "Mondays at 9:00",
  nextRuns: ["Mon 24 Nov", "Mon 1 Dec", "Mon 8 Dec", "Mon 15 Dec"],
  owner: "Anu",
  destination: "#ops",
  lastRun: { status: "done", cost: "₹1.20", at: "Mon 17 Nov" },
  state: "active",
};

test("an active routine: the name is the link, three next runs, owner, destination, last run, Run now and a ⋯", async () => {
  const onRunNow = vi.fn();
  const onSkipNext = vi.fn();
  const onPause = vi.fn();
  const screen = await render(
    <RoutineRow
      {...base}
      onRunNow={onRunNow}
      onSkipNext={onSkipNext}
      onPause={onPause}
    />,
  );
  await expect
    .element(page.getByRole("link", { name: "Monday supplier check" }))
    .toHaveAttribute("href", "/routines/r1");
  expect(
    screen.container.querySelector('[data-slot="routine-row-meta"]')!
      .textContent,
  ).toBe("Next Mon 24 Nov, Mon 1 Dec, Mon 8 Dec · Anu · to #ops");
  expect(
    screen.container.querySelector('[data-slot="routine-row-last"]')!
      .textContent,
  ).toBe("Ran Mon 17 Nov · ₹1.20");
  await page.getByRole("button", { name: "Run now" }).click();
  expect(onRunNow).toHaveBeenCalled();
  await page
    .getByRole("button", { name: "More for Monday supplier check" })
    .click();
  await page.getByRole("menuitem", { name: "Pause" }).click();
  expect(onPause).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("a paused routine says so, drops Run now and the next runs, and offers Resume alone", async () => {
  const onResume = vi.fn();
  const screen = await render(
    <RoutineRow
      {...base}
      state="paused"
      lastRun={{ status: "failed", at: "Mon 17 Nov" }}
      onRunNow={vi.fn()}
      onResume={onResume}
    />,
  );
  const row = screen.container.querySelector('[data-slot="routine-row"]')!;
  expect(row.textContent).toContain("Paused");
  expect(row.textContent).not.toContain("Next");
  expect(row.textContent).toContain("Failed Mon 17 Nov");
  expect(page.getByRole("button", { name: "Run now" }).elements()).toHaveLength(
    0,
  );
  await page
    .getByRole("button", { name: "Resume: Monday supplier check" })
    .click();
  expect(onResume).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});
