import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ComparisonGroup,
  ComparisonMatrix,
  ComparisonRow,
} from "./comparison-matrix";

function Example() {
  return (
    <ComparisonMatrix plans={["Free", "Pro"]} highlightedIndex={1}>
      <ComparisonGroup>Enrichment</ComparisonGroup>
      <ComparisonRow feature="Company data" availability={[true, true]} />
      <ComparisonRow feature="Call intelligence" availability={[false, true]} />
      <ComparisonRow feature="Seats" availability={["3", "Unlimited"]} />
    </ComparisonMatrix>
  );
}

test("renders plans as column headers and features as row headers", async () => {
  const screen = await render(<Example />);
  await expect
    .element(screen.getByRole("columnheader", { name: "Pro" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("rowheader", { name: "Call intelligence" }))
    .toBeInTheDocument();
});

test("boolean availability renders sr-labelled glyphs, values render literally", async () => {
  const screen = await render(<Example />);
  const included = document.querySelectorAll(
    '[data-slot="comparison-row"] .sr-only',
  );
  expect([...included].map((n) => n.textContent)).toContain("Included");
  expect([...included].map((n) => n.textContent)).toContain("Not included");
  await expect.element(screen.getByText("Unlimited")).toBeInTheDocument();
});

test("highlighted column cells carry the info tint", async () => {
  await render(<Example />);
  const tinted = document.querySelectorAll('td[class*="bg-info"]');
  expect(tinted.length).toBeGreaterThan(0);
});

test("has no accessibility violations", async () => {
  const screen = await render(<Example />);
  await expectNoA11yViolations(screen.container);
});

test("keeps columns aligned when availability is shorter or longer than plans", async () => {
  const screen = await render(
    <ComparisonMatrix plans={["Free", "Plus", "Pro"]}>
      <ComparisonGroup>Limits</ComparisonGroup>
      {/* short: two entries for three plans — the third must hold its column open */}
      <ComparisonRow feature="Seats" availability={["3", "10"]} />
      {/* long: four entries for three plans — the extra must not add a phantom column */}
      <ComparisonRow
        feature="Regions"
        availability={[true, true, false, true]}
      />
    </ComparisonMatrix>,
  );
  const rows = document.querySelectorAll('tr[data-slot="comparison-row"]');
  for (const row of rows) {
    // one <th> feature header + exactly one <td> per plan, whatever the author supplied
    expect(row.querySelectorAll("td").length).toBe(3);
  }
  // the unsupplied cell says so rather than claiming "Not included"
  await expect.element(screen.getByText("Not specified")).toBeInTheDocument();
  // a group heading spans the real column count (features + 3 plans), never a fixed 99
  const group = document.querySelector(
    'tr[data-slot="comparison-group"] th',
  ) as HTMLTableCellElement | null;
  expect(group?.colSpan).toBe(4);
});
