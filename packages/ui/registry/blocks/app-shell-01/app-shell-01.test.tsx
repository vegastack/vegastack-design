/**
 * `app-shell-01.test.tsx` — the block's browser contract: the landmark trio, a skip link and one
 * `h1`; the current page marked `aria-current="page"`; the Inbox count inside its row's name; the
 * Search row named "Search" with its shortcut on `aria-keyshortcuts`; the count tiles as links;
 * the workspace switcher a real menu trigger; no `href="#"`; and axe-clean. Compiled contrast is
 * proven in `test/contrast.browser.test.tsx` (D6).
 */

import { render } from "vitest-browser-react";
import { beforeEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import AppShell01Page from "./page";

/**
 * This suite's real Playwright viewport is mobile-sized (no explicit `browser.viewport`), and
 * upstream's `SidebarProvider` reads one fixed 768px breakpoint through `useIsMobile`: below it the
 * rail mounts as a CLOSED `Sheet`, so none of the block's navigation is in the DOM at all. Report
 * "desktop" so the composition under test is the one the block is FOR; the mobile branch is the
 * sidebar component's own contract, and its own suite exercises it directly.
 */
beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

test("app-shell-01 has landmarks, a skip link and one h1", async () => {
  const screen = await render(<AppShell01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Overview" }))
    .toBeInTheDocument();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  expect(document.querySelector("nav")).not.toBeNull();
  expect(document.querySelector("main")).not.toBeNull();
  expect(
    document.querySelector(
      'a[href="#main"], a[data-slot="app-shell-skip-link"]',
    ),
  ).not.toBeNull();
  const current = [...document.querySelectorAll('a[aria-current="page"]')];
  expect(current.map((a) => a.textContent?.trim())).toEqual(["Overview"]);
  expect(document.querySelector('a[href="#"]')).toBeNull();
});

test("app-shell-01 rows carry their count and shortcut in the right place", async () => {
  const screen = await render(<AppShell01Page />);
  await expect
    .element(screen.getByRole("link", { name: "Inbox 3 unread" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Search", exact: true }))
    .toHaveAttribute("aria-keyshortcuts", "Meta+K Control+K");
  await expect
    .element(screen.getByRole("link", { name: "Overdue tasks 3" }))
    .toHaveAttribute("href", "/tasks?due=overdue");
  await expect
    .element(screen.getByRole("button", { name: "Workspace: Acme" }))
    .toHaveAttribute("aria-haspopup", "menu");
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("app-shell-01 opens the Search palette", async () => {
  const screen = await render(<AppShell01Page />);
  await screen.getByRole("button", { name: "Search", exact: true }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "Search" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
