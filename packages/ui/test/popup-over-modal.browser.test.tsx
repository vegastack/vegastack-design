import "./contrast.css"; // compiled Tailwind + the real @vegastack token theme and base layer
import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, expect, test } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "../registry/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../registry/ui/popover";

/**
 * BRD-1 (amended for Regent F32, 2026-11-20): a popup opened over a modal reads as a separate,
 * raised surface. Upstream paints the dialog and the popup with the same `popover` fill, so in dark a
 * picker inside a dialog was the dialog's own colour. The popup wears `surface-popup`, which sets
 * `--popover` to `popover-raised` on the popup itself, so it holds portaled to `body` and drawn
 * inline inside the dialog alike; its edge is `popover-border`, the `border` hairline (22-11-2026).
 */

function Fixture() {
  return (
    <>
      <Dialog open>
        <DialogContent>
          <DialogTitle>Add person</DialogTitle>
          <Popover open>
            <PopoverTrigger>Choose a person</PopoverTrigger>
            <PopoverContent>Ananya Rao</PopoverContent>
          </Popover>
          {/* A floating bar drawn inline inside the dialog (an editor's find bar). */}
          <div
            data-testid="inline-bar"
            className="border border-popover-border bg-popover surface-popup"
          />
        </DialogContent>
      </Dialog>
      {/* References resolved by the same theme, so the test compares meaning, not a spelling. */}
      <div data-testid="modal" style={{ backgroundColor: "var(--popover)" }} />
      <div
        data-testid="raised"
        style={{ backgroundColor: "var(--popover-raised)" }}
      />
      <div
        data-testid="edge"
        style={{ borderTop: "1px solid var(--popover-border)" }}
      />
    </>
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
const id = (name: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${name}"]`)!;

afterEach(() => document.documentElement.classList.remove("dark"));

test("in dark, a popup over a dialog, portaled or inline, is raised above it and edged in the hairline", async () => {
  document.documentElement.classList.add("dark");
  await render(<Fixture />);
  const dialog = getComputedStyle(slot("dialog-content"));
  const popup = getComputedStyle(slot("popover-content"));
  const raised = getComputedStyle(id("raised")).backgroundColor;
  expect(dialog.backgroundColor).toBe(
    getComputedStyle(id("modal")).backgroundColor,
  );
  expect(popup.backgroundColor).toBe(raised);
  expect(popup.backgroundColor).not.toBe(dialog.backgroundColor);
  expect(getComputedStyle(id("inline-bar")).backgroundColor).toBe(raised);
  expect(popup.borderTopColor).toBe(
    getComputedStyle(id("edge")).borderTopColor,
  );
  // Its edge is the same hairline as the dialog's (operator 22-11-2026): the lift is the boundary.
  expect(popup.borderTopColor).toBe(dialog.borderTopColor);
});

test("in light, the dialog and the popup keep one white fill", async () => {
  await render(<Fixture />);
  expect(getComputedStyle(slot("popover-content")).backgroundColor).toBe(
    getComputedStyle(slot("dialog-content")).backgroundColor,
  );
});
