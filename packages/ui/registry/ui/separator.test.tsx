import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Separator } from "./separator";

test("renders a decorative, horizontal divider by default", async () => {
  const screen = await render(<Separator data-testid="sep" />);
  const sep = screen.getByTestId("sep");
  await expect.element(sep).toBeInTheDocument();
  await expect.element(sep).toHaveAttribute("data-slot", "separator");
  await expect.element(sep).toHaveAttribute("data-orientation", "horizontal");
  // Decorative separators are hidden from assistive tech.
  await expect.element(sep).toHaveAttribute("role", "presentation");
  await expect.element(sep).toHaveAttribute("aria-hidden", "true");
});

test("exposes the separator role when not decorative", async () => {
  const screen = await render(<Separator decorative={false} />);
  const sep = screen.getByRole("separator");
  await expect.element(sep).toBeInTheDocument();
  await expect.element(sep).toHaveAttribute("aria-orientation", "horizontal");
});

test("reflects vertical orientation", async () => {
  const screen = await render(
    <Separator decorative={false} orientation="vertical" />,
  );
  const sep = screen.getByRole("separator");
  await expect.element(sep).toHaveAttribute("data-orientation", "vertical");
  await expect.element(sep).toHaveAttribute("aria-orientation", "vertical");
});

test("merges a custom className", async () => {
  const screen = await render(<Separator data-testid="sep" className="my-4" />);
  await expect.element(screen.getByTestId("sep")).toHaveClass("my-4");
});

test("no a11y violations (decorative)", async () => {
  const screen = await render(<Separator />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (semantic separator)", async () => {
  const screen = await render(<Separator decorative={false} />);
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to its host element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Separator ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("separator");
});
