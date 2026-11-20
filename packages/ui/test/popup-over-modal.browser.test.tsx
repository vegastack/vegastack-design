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
 * COL-3 (Regent F32, 2026-11-20): a popup opened over a modal reads as a separate, raised surface.
 * Upstream paints the dialog and the popup with the same `popover` fill, so in dark a picker inside
 * a dialog was the dialog's own colour. The fix is two halves no token value can show on its own:
 * `base.css` re-scopes `--popover` to `card` inside the modal, and the popup, portaled out to
 * `body`, keeps the raised value and its `popover-border` edge. This reads what Chromium paints.
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
        </DialogContent>
      </Dialog>
      {/* References resolved by the same theme, so the test compares meaning, not a spelling. */}
      <div data-testid="card" style={{ backgroundColor: "var(--card)" }} />
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

test("in dark, a popup over a dialog is raised above it and edged in popover-border", async () => {
  document.documentElement.classList.add("dark");
  await render(<Fixture />);
  const dialog = getComputedStyle(slot("dialog-content"));
  const popup = getComputedStyle(slot("popover-content"));
  expect(dialog.backgroundColor).toBe(
    getComputedStyle(id("card")).backgroundColor,
  );
  expect(popup.backgroundColor).not.toBe(dialog.backgroundColor);
  expect(popup.borderTopColor).toBe(
    getComputedStyle(id("edge")).borderTopColor,
  );
  expect(popup.borderTopColor).not.toBe(dialog.borderTopColor);
});

test("in light, the dialog and the popup keep one white fill", async () => {
  await render(<Fixture />);
  expect(getComputedStyle(slot("popover-content")).backgroundColor).toBe(
    getComputedStyle(slot("dialog-content")).backgroundColor,
  );
});
