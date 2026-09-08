import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Globe, Users } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { EmptyValue } from "./empty";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "./property-list";

function Example() {
  return (
    <PropertyList aria-label="Record details">
      <PropertyRow>
        <PropertyLabel icon={<Globe />}>Domains</PropertyLabel>
        <PropertyValue>
          <a className="text-info-text" href="https://attio.com">
            attio.com
          </a>
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel icon={<Users />}>Team</PropertyLabel>
        <PropertyValue>
          <EmptyValue>Set a value…</EmptyValue>
        </PropertyValue>
      </PropertyRow>
    </PropertyList>
  );
}

test("renders a definition list with dt/dd pairs", async () => {
  const screen = await render(<Example />);
  const dl = document.querySelector('dl[data-slot="property-list"]');
  expect(dl).not.toBeNull();
  expect(dl!.querySelectorAll('dt[data-slot="property-label"]').length).toBe(2);
  expect(dl!.querySelectorAll('dd[data-slot="property-value"]').length).toBe(2);
  await expect.element(screen.getByText("Domains")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("link", { name: "attio.com" }))
    .toBeInTheDocument();
});

test("empty values render in the contrast-safe muted register", async () => {
  const screen = await render(<Example />);
  const empty = screen.getByText("Set a value…");
  expect((empty.element() as HTMLElement).className).toContain(
    "text-muted-foreground",
  );
});

test("label icons are decorative (aria-hidden wrapper)", async () => {
  await render(<Example />);
  const label = document.querySelector('dt[data-slot="property-label"]')!;
  const iconWrap = label.querySelector("span[aria-hidden]");
  expect(iconWrap).not.toBeNull();
});

test("has no accessibility violations", async () => {
  const screen = await render(<Example />);
  await expectNoA11yViolations(screen.container);
});

test("a value truncates inside its own column instead of widening the list", async () => {
  const screen = await render(
    <PropertyList aria-label="Record details">
      <PropertyRow>
        <PropertyLabel icon={<Globe />}>Domains</PropertyLabel>
        <PropertyValue>
          marketing.internal.example-corporation.com
        </PropertyValue>
      </PropertyRow>
    </PropertyList>,
  );
  const value = screen
    .getByText("marketing.internal.example-corporation.com")
    .element() as HTMLElement;
  // `truncate` alone is not enough: without `min-w-0` the grid track is forced to the
  // value's content width and the whole list widens instead of the value ellipsising.
  expect(value.className).toContain("truncate");
  expect(value.className).toContain("min-w-0");
});

test("a single value can opt into wrapping without the list opting in", async () => {
  const screen = await render(
    <PropertyList aria-label="Record details">
      <PropertyRow>
        <PropertyLabel icon={<Globe />}>Domains</PropertyLabel>
        <PropertyValue className="overflow-visible whitespace-normal">
          a very long value that is allowed to wrap over several lines
        </PropertyValue>
      </PropertyRow>
    </PropertyList>,
  );
  const value = screen
    .getByText("a very long value that is allowed to wrap over several lines")
    .element() as HTMLElement;
  expect(value.className).toContain("whitespace-normal");
  expect(value.className).toContain("overflow-visible");
});

test("each property is one grid row of exactly one dt and one dd", async () => {
  await render(<Example />);
  const rows = document.querySelectorAll('[data-slot="property-row"]');
  expect(rows.length).toBe(2);
  for (const row of rows) {
    expect(row.querySelectorAll('dt[data-slot="property-label"]').length).toBe(
      1,
    );
    expect(row.querySelectorAll('dd[data-slot="property-value"]').length).toBe(
      1,
    );
  }
});
