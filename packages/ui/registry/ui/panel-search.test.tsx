/**
 * `panel-search.test.tsx` — the OVL-11 row, tested once instead of twice.
 *
 * Before Batch 7c of the shadcn reset these assertions lived nowhere: `emoji-picker` and
 * `shortcut-overlay` each carried a private copy of the row, and each suite tested its own
 * popup's behaviour through it. The exception itself — a sticky header, no nested bordered box,
 * the row wearing the focus tint as a field group — is what this file pins, so the two consumers can go back to
 * testing what they actually own.
 */

import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { PanelSearch, PanelSearchField } from "./panel-search";

function Row(props: React.ComponentProps<typeof PanelSearchField>) {
  return (
    <div className="w-64 rounded-lg border border-border bg-popover">
      <PanelSearch>
        <PanelSearchField aria-label="Filter items" {...props} />
      </PanelSearch>
    </div>
  );
}

test("renders a named search field inside a sticky header row", async () => {
  const screen = await render(<Row placeholder="Filter items" />);
  const field = screen.getByRole("searchbox", { name: "Filter items" });
  await expect.element(field).toBeInTheDocument();

  const row = document.querySelector('[data-slot="panel-search"]');
  expect(row).not.toBeNull();
  expect(row!.className).toContain("sticky");
  expect(row!.className).toContain("border-b");
  // The row is what holds the field; a caller does not have to reach for the slot to style it.
  expect(row!.contains(field.element())).toBe(true);
});

test("OVL-11: the FIELD paints no box of its own — the row owns the one border", async () => {
  await render(<Row />);
  const field = page
    .getByRole("searchbox", { name: "Filter items" })
    .element() as HTMLInputElement;
  const classes = field.className;
  // A bordered input inside a bordered popup nests two borders (audit B8-04). This is the
  // whole of the exception, so it is asserted on the class contract rather than inferred.
  expect(classes).not.toMatch(/(^|\s)border(\s|-|$)/);
  expect(classes).not.toMatch(/(^|\s)rounded-/);
  expect(classes).toContain("bg-transparent");
  expect(classes).toContain("outline-none");
  // FOC-1's outline must not appear here either: focus is shown by the ROW's background tint.
  expect(classes).not.toContain("ring");
});

test("FOC-14: focus inside the row tints the row (a field group), never its hairline", async () => {
  await render(<Row />);
  const row = document.querySelector('[data-slot="panel-search"]')!;
  expect(row.hasAttribute("data-field-group")).toBe(true);
  expect(row.className).not.toMatch(/focus[\w-]*:border-/);

  const field = page.getByRole("searchbox", { name: "Filter items" });
  await userEvent.click(field);
  expect(document.activeElement).toBe(field.element());
  // Live proof the selector matches, not just that the class string is present.
  expect(row.matches(":focus-within")).toBe(true);
});

test("the leading glyph is decorative and never joins the field's name", async () => {
  await render(<Row />);
  const row = document.querySelector('[data-slot="panel-search"]')!;
  const svg = row.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg!.getAttribute("aria-hidden")).toBe("true");
  const field = page
    .getByRole("searchbox", { name: "Filter items" })
    .element() as HTMLInputElement;
  expect(field.getAttribute("aria-label")).toBe("Filter items");
});

test("the field forwards its value and disabled state", async () => {
  const seen: string[] = [];
  const screen = await render(
    <Row onChange={(event) => seen.push(event.currentTarget.value)} />,
  );
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Filter items" }),
    "ab",
  );
  expect(seen.at(-1)).toBe("ab");

  await render(<Row disabled />);
  const disabled = page
    .getByRole("searchbox", { name: "Filter items" })
    .last()
    .element() as HTMLInputElement;
  expect(disabled.disabled).toBe(true);
  expect(disabled.className).toContain("disabled:opacity-50");
});

test("no a11y violations", async () => {
  await render(<Row placeholder="Filter items" />);
  await expectNoA11yViolations(document.body);
});
