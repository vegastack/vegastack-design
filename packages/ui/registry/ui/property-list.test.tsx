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

/* ---------------------------------------------------------------------------------------------
 * The label track negotiates instead of being fixed (B5-12), and values wrap (SP-03 / D18).
 * ------------------------------------------------------------------------------------------- */

test("the row is a named container that stacks below @xs and shares two tracks above it", async () => {
  await render(
    <PropertyList aria-label="Record details">
      <PropertyRow>
        <PropertyLabel>Domains</PropertyLabel>
        <PropertyValue>attio.com</PropertyValue>
      </PropertyRow>
    </PropertyList>,
  );
  const list = document.querySelector(
    '[data-slot="property-list"]',
  ) as HTMLElement;
  // Container query, not a viewport breakpoint: a facts pane is as often a
  // narrow sidebar on a wide screen as a wide column on a narrow one.
  expect(list.className).toContain("@container/property-list");
  const row = document.querySelector(
    '[data-slot="property-row"]',
  ) as HTMLElement;
  expect(row.className).toContain("grid-cols-1");
  expect(row.className).toContain(
    "@xs/property-list:grid-cols-[minmax(calc(var(--spacing)*20),max-content)_minmax(0,1fr)]",
  );
  // The old fixed 112px track is gone.
  expect(row.className).not.toContain("grid-cols-[calc(var(--spacing)*28)");
});

test("values wrap rather than truncate, so nothing clips a link's focus ring", async () => {
  await render(
    <PropertyList>
      <PropertyRow>
        <PropertyLabel>Link</PropertyLabel>
        <PropertyValue>
          <a href="https://example.com">example.com</a>
        </PropertyValue>
      </PropertyRow>
    </PropertyList>,
  );
  const value = document.querySelector(
    '[data-slot="property-value"]',
  ) as HTMLElement;
  // `truncate` implies `overflow: hidden`, which clipped the focus outline of any
  // focusable descendant (SP-03).
  expect(value.className).not.toMatch(/(^|\s)truncate(\s|$)/);
  expect(value.className).toContain("wrap-anywhere");
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
