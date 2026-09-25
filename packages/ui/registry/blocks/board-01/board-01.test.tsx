/**
 * `board-01.test.tsx` — the block's browser contract: one `h1` from the PageHeader, lanes named with
 * their count, cards that are real links (no `href="#"`), a Backlog that pages as it scrolls, "+ Add
 * task" per lane, a "No matches" state when the filters match nothing, and axe-clean at rest and in
 * "No matches". Compiled contrast is proven in
 * `test/contrast.browser.test.tsx` (D6).
 */

import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import Board01Page from "./page";

test("board-01 has one h1 and lanes named with their count", async () => {
  const screen = await render(<Board01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Tasks" }))
    .toBeInTheDocument();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  await expect
    .element(screen.getByRole("region", { name: "Backlog, 6 tasks" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("region", { name: "In review, 1 task" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("board-01 cards are links to each task", async () => {
  const screen = await render(<Board01Page />);
  const card = screen.getByRole("link", { name: /Audit onboarding copy/ });
  await expect.element(card).toHaveAttribute("href", "/tasks/t1");
  expect(document.querySelector('a[href="#"]')).toBeNull();
});

test("board-01 pages the Backlog as it scrolls and gives each card its own menu", async () => {
  const screen = await render(<Board01Page />);
  await expect
    .element(screen.getByRole("region", { name: "Backlog, 6 tasks" }))
    .toBeInTheDocument();
  // The lane's foot is in view, so its next page loads without a press.
  await expect
    .element(screen.getByRole("link", { name: /Rotate API signing keys/ }))
    .toBeInTheDocument();
  await expect
    .element(
      screen.getByRole("button", { name: "Actions for Audit onboarding copy" }),
    )
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("board-01 adds a task to a lane", async () => {
  const screen = await render(<Board01Page />);
  await screen.getByRole("button", { name: "Add task" }).nth(1).click();
  await expect
    .element(screen.getByText("New task in In progress"))
    .toBeInTheDocument();
});

test("board-01 shows No matches and clears its filters", async () => {
  const screen = await render(<Board01Page />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search tasks" }),
    "zebra",
  );
  await expect.element(screen.getByText("No matches")).toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await screen.getByRole("button", { name: "Clear filters" }).first().click();
  await expect
    .element(screen.getByRole("region", { name: "Backlog, 6 tasks" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("searchbox", { name: "Search tasks" }))
    .toHaveFocus();
});
