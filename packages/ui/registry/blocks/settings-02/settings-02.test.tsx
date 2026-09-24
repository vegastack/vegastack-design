/**
 * `settings-02.test.tsx` — the block's browser contract: the hub mounts with one `h1`, every tile
 * is ONE link named by its title and described by its fact (no control nested inside it), an area
 * that is not built yet is not a tab stop, and the page is axe-clean. Compiled contrast and the
 * 1-column-to-3-column grid are proven on real CSS in `test/contrast.browser.test.tsx` (D6).
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import Settings02Page from "./page";

test("settings-02 has one h1 and a heading per area", async () => {
  const screen = await render(<Settings02Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Settings" }))
    .toBeInTheDocument();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  expect(
    [...document.querySelectorAll("h2")].map((h) => h.textContent),
  ).toEqual(["Your account", "Workspace", "Product configuration"]);
});

test("each tile is one link named by its title and described by its fact", async () => {
  const screen = await render(<Settings02Page />);
  const members = screen.getByRole("link", { name: "Members", exact: true });
  await expect.element(members).toHaveAttribute("href", "/settings/members");
  await expect
    .element(members)
    .toHaveAccessibleDescription("8 active · 1 invited");
  expect(screen.container.querySelectorAll("a button, a a")).toHaveLength(0);
  expect(document.querySelector('a[href="#"]')).toBeNull();
});

test("a tile that is not built yet is not a link and not a tab stop", async () => {
  const screen = await render(<Settings02Page />);
  const tbd = screen.getByText("Integrations").element();
  const tile = tbd.closest('[data-slot="item"]') as HTMLElement;
  expect(tile.tagName).toBe("DIV");
  expect(tile.closest("a")).toBeNull();
  expect(tile.querySelector("a, button, [tabindex]")).toBeNull();
  await expect.element(screen.getByText("TBD")).toBeInTheDocument();
});

test("settings-02 is axe-clean", async () => {
  await render(<Settings02Page />);
  // Unstyled: the fast browser suite mounts without the compiled token theme (see test/a11y.ts).
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
