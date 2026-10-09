import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { StatusIcon } from "./status-icon";

test("renders an accessible image with a default label from status", async () => {
  const screen = await render(<StatusIcon status="todo" />);
  const icon = screen.getByRole("img");
  await expect.element(icon).toBeInTheDocument();
  await expect.element(icon).toHaveAttribute("data-slot", "status-icon");
  await expect.element(icon).toHaveAttribute("aria-label", "Todo");
});

test("exposes the status via the data-status attribute", async () => {
  const screen = await render(<StatusIcon status="review" />);
  const icon = screen.getByRole("img");
  await expect.element(icon).toHaveAttribute("data-status", "review");
  await expect.element(icon).toHaveAttribute("aria-label", "In review");
});

test("names every Linear status and keeps the deprecated aliases", async () => {
  const cases = [
    ["backlog", "Backlog"],
    ["todo", "Todo"],
    ["progress", "In progress"],
    ["review", "In review"],
    ["done", "Done"],
    ["canceled", "Canceled"],
    ["duplicate", "Duplicate"],
    ["triage", "Triage"],
    ["blocked", "Blocked"],
    ["cancelled", "Canceled"],
  ] as const;
  const screen = await render(
    <>
      {cases.map(([status]) => (
        <StatusIcon key={status} status={status} />
      ))}
    </>,
  );
  for (const [status, name] of cases) {
    const icon = screen.container.querySelector(`[data-status="${status}"]`);
    expect(icon?.getAttribute("aria-label")).toBe(name);
    expect(icon?.getAttribute("viewBox")).toBe("0 0 16 16");
    expect(icon?.childElementCount).toBeGreaterThan(0);
  }
  // The alias draws exactly the canonical glyph.
  expect(
    screen.container.querySelector('[data-status="cancelled"]')?.innerHTML,
  ).toBe(screen.container.querySelector('[data-status="canceled"]')?.innerHTML);
});

test("applies the size data attribute", async () => {
  const screen = await render(<StatusIcon status="done" size="lg" />);
  await expect
    .element(screen.getByRole("img"))
    .toHaveAttribute("data-size", "lg");
});

test("uses a custom label as the accessible name", async () => {
  const screen = await render(
    <StatusIcon status="progress" label="Deploying" />,
  );
  await expect
    .element(screen.getByRole("img"))
    .toHaveAttribute("aria-label", "Deploying");
});

test("is decorative (aria-hidden, no img role) when label is empty", async () => {
  const screen = await render(
    <StatusIcon status="done" label="" data-testid="deco" />,
  );
  const icon = screen.getByTestId("deco");
  await expect.element(icon).toHaveAttribute("aria-hidden", "true");
  expect(icon.element().getAttribute("role")).toBeNull();
});

test("no a11y violations", async () => {
  const screen = await render(
    <StatusIcon status="progress" label="In progress" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying svg element", async () => {
  const ref = React.createRef<SVGSVGElement>();
  await render(<StatusIcon ref={ref} status="todo" />);
  expect(ref.current).toBeInstanceOf(SVGSVGElement);
  expect(ref.current?.dataset.slot).toBe("status-icon");
});
