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
