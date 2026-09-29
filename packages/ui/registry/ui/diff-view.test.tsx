import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DiffView } from "./diff-view";

test("renders removed and added words between two texts", async () => {
  const screen = await render(<DiffView before="a b c" after="a x c" />);
  await expect
    .element(screen.getByText("b"))
    .toHaveAttribute("data-diff", "removed");
  await expect
    .element(screen.getByText("x"))
    .toHaveAttribute("data-diff", "added");
  expect(screen.container.querySelector("del")?.textContent).toBe("b");
  expect(screen.container.querySelector("ins")?.textContent).toBe("x");
  await expectNoA11yViolations(screen.container);
});

test("identical texts say No changes", async () => {
  const screen = await render(
    <DiffView before={"same\ntext"} after={"same\ntext"} />,
  );
  await expect.element(screen.getByText("No changes")).toBeVisible();
});

test("above 200 KB combined only whole lines are marked, with a note", async () => {
  const filler = `${"x".repeat(99)}\n`.repeat(1100);
  const before = `${filler}alpha beta\n`;
  const after = `${filler}alpha gamma\n`;
  const screen = await render(<DiffView before={before} after={after} />);
  await expect
    .element(screen.getByText("Showing line changes for large pages"))
    .toBeVisible();
  const marks = [...screen.container.querySelectorAll("[data-diff]")];
  expect(
    marks.map((mark) => [mark.getAttribute("data-diff"), mark.textContent]),
  ).toEqual([
    ["removed", "alpha beta"],
    ["added", "alpha gamma"],
  ]);
});

test("a long unchanged run folds behind Show N unchanged lines", async () => {
  const lines = Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n");
  const screen = await render(
    <DiffView before={`${lines}\nold`} after={`${lines}\nnew`} />,
  );
  const show = screen.getByRole("button", { name: "Show 10 unchanged lines" });
  await expect.element(show).toBeVisible();
  await userEvent.click(show);
  await expect.element(screen.getByText(/line 5/)).toBeVisible();
});
