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

test("the chip IS a Badge, in its outline variant", async () => {
  // Batch 7c of the shadcn reset stopped re-deriving the chip box. `Badge` owns the height, the
  // radius, the border, the ground and the icon rule, so a tool call and any other chip in the
  // same transcript are one object; the assertions below are on `badge.tsx`'s own contract
  // rather than on a copy of its values.
  const screen = await render(
    <ToolCallChip label="SQL query executed" data-testid="chip" />,
  );
  const chip = screen.getByTestId("chip").element() as HTMLElement;
  expect(chip.dataset.variant).toBe("outline");
  expect(chip.className).toContain("rounded-4xl");
  expect(chip.className).toContain("border-border");
  // …and the two things Badge does not know about a tool label.
  expect(chip.className).toContain("min-w-0");
  expect((chip.querySelector("span.truncate") as HTMLElement).textContent).toBe(
    "SQL query executed",
  );
});

test("the accessible name separates label and meta without a hidden comma", async () => {
  // `design.md`'s A11Y-5 roster names this chip, and it is wrong to: both parts are children of
  // a flex container, so CSS blockifies them and accname wraps each contribution in spaces. The
  // CSS-aware proof lives in `test/accessible-name.browser.test.tsx` (this lane loads no
  // stylesheet, so it would measure the unstyled concatenation instead); what belongs here is
  // that the component adds no separator of its own for that lane to fight with.
  const screen = await render(
    <ToolCallChip
      label="SQL query executed"
      meta="3 rows in 495ms"
      render={<button type="button" />}
      data-testid="chip"
    />,
  );
  const chip = screen.getByTestId("chip").element() as HTMLElement;
  expect(chip.querySelector("span.sr-only")).toBeNull();
  expect(chip).not.toHaveAttribute("aria-label");
});

test("the interactive form carries both hover and pressed steps", async () => {
  // Upstream's outline badge paints a hover for anchors only (`[a]:hover:bg-muted`), so the
  // button form has to say it — and it says the pressed step in the same breath.
  const screen = await render(
    <ToolCallChip
      label="Attributes searched"
      render={<button type="button" />}
      data-testid="chip"
    />,
  );
  const chip = screen.getByTestId("chip").element() as HTMLElement;
  expect(chip.className).toContain("[&:is(button)]:hover:bg-muted");
  expect(chip.className).toContain("[&:is(button)]:active:bg-muted");
});
