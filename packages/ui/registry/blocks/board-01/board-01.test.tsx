/**
 * `board-01.test.tsx` — the block's browser contract: one `h1` from the PageHeader, lanes named with
 * their count, cards that are real links (no `href="#"`), a "No matches" state when the filters
 * match nothing, and axe-clean at rest and in "No matches". Compiled contrast is proven in
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
    .element(screen.getByRole("region", { name: "Backlog, 3 tasks" }))
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

test("board-01 shows No matches and clears its filters", async () => {
  const screen = await render(<Board01Page />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search tasks" }),
    "zebra",
  );
  await expect
    .element(screen.getByRole("heading", { name: "No matches" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await screen.getByRole("button", { name: "Clear filters" }).first().click();
  await expect
    .element(screen.getByRole("region", { name: "Backlog, 3 tasks" }))
    .toBeInTheDocument();
});
