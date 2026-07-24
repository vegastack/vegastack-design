import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { Database } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { ToolCallChip } from "./tool-call-chip";

test("renders label + muted meta with an icon", async () => {
  const screen = await render(
    <ToolCallChip label="SQL query executed" meta="3 rows in 495ms">
      <Database aria-hidden />
    </ToolCallChip>,
  );
  await expect
    .element(screen.getByText("SQL query executed"))
    .toBeInTheDocument();
  const meta = screen.getByText("3 rows in 495ms");
  expect((meta.element() as HTMLElement).dataset.slot).toBe(
    "tool-call-chip-meta",
  );
  expect((meta.element() as HTMLElement).className).toContain(
    "text-muted-foreground",
  );
});

test("render={<button />} makes the chip an interactive button", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <ToolCallChip
      label="Attributes searched"
      meta="2 results"
      render={<button type="button" onClick={onClick} />}
    />,
  );
  const btn = screen.getByRole("button", { name: /Attributes searched/ });
  await userEvent.click(btn);
  expect(onClick).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations", async () => {
  const screen = await render(<ToolCallChip label="Created workflow" />);
  await expectNoA11yViolations(screen.container);
});
