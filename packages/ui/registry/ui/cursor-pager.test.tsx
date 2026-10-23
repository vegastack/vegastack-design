import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { CursorPager } from "./cursor-pager";

test("renders a named nav with Previous, Next and the range label", async () => {
  const screen = await render(
    <CursorPager
      label="Rows 101–200"
      hasPrevious
      hasNext
      onPrevious={() => {}}
      onNext={() => {}}
    />,
  );
  const nav = screen.getByRole("navigation", { name: "Pagination" });
  await expect.element(nav).toBeInTheDocument();
  expect(nav.element().getAttribute("data-slot")).toBe("cursor-pager");
  await expect
    .element(screen.getByRole("button", { name: "Previous" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Next" }))
    .toBeInTheDocument();
  expect(nav.element().textContent).toContain("Rows 101–200");
  await expectNoA11yViolations(screen.container);
});

test("Next and Previous report the request from the keyboard; there are no page numbers", async () => {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  const screen = await render(
    <CursorPager hasPrevious hasNext onPrevious={onPrevious} onNext={onNext} />,
  );
  (
    screen.getByRole("button", { name: "Next" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  expect(onNext).toHaveBeenCalledTimes(1);
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}{Enter}");
  expect(onPrevious).toHaveBeenCalledTimes(1);
  expect(screen.container.querySelectorAll("button")).toHaveLength(2);
});

test("an edge disables its button, and loading holds both still", async () => {
  const onPrevious = vi.fn();
  const screen = await render(
    <CursorPager
      hasPrevious={false}
      hasNext
      onPrevious={onPrevious}
      onNext={() => {}}
    />,
  );
  const previous = screen.getByRole("button", { name: "Previous" });
  await previous.click({ force: true });
  expect(onPrevious).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <CursorPager
      hasPrevious
      hasNext
      loading
      onPrevious={onPrevious}
      onNext={() => {}}
    />,
  );
  const next = screen.getByRole("button", { name: "Next" }).element();
  expect(
    next.hasAttribute("disabled") ||
      next.getAttribute("aria-disabled") === "true",
  ).toBe(true);
  expect(
    screen.getByRole("navigation").element().getAttribute("aria-busy"),
  ).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("a new range label is announced", async () => {
  const props = {
    hasPrevious: true,
    hasNext: true,
    onPrevious: () => {},
    onNext: () => {},
  };
  const screen = await render(<CursorPager {...props} label="Rows 1–100" />);
  await screen.rerender(<CursorPager {...props} label="Rows 101–200" />);
  await expect
    .poll(() => screen.container.querySelector('[role="status"]')?.textContent)
    .toBe("Rows 101–200");
});
