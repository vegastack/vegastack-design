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

test("composed as a control, label and meta stay separate phrases (issue 103)", async () => {
  const screen = await render(
    <ToolCallChip
      render={<button type="button" />}
      label="Search files"
      meta="1.2s"
    />,
  );
  // `render={<button/>}` is a documented composition (the component styles `:is(button)`),
  // and it is the case where the chip gets an accessible name from its contents. The label
  // and meta are `gap`-spaced siblings, so this read "Search files1.2s" before issue 103.
  await expect
    .element(screen.getByRole("button", { name: "Search files, 1.2s" }))
    .toBeInTheDocument();
});
