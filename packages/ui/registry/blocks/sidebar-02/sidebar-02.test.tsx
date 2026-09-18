/**
 * `sidebar-02.test.tsx` — the block's browser contract: it renders, it shows its own content,
 * and the whole composed page is axe-clean. A block is a copy-once composition, so what is worth
 * pinning is that the composition still mounts and still passes the accessibility floor — the
 * behaviour of each part it composes is owned by that part's own suite.
 */

import { render } from "vitest-browser-react";
import { beforeEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import Sidebar02Page from "./page";

/**
 * This suite's real Playwright viewport is mobile-sized (no explicit `browser.viewport`), and
 * upstream's `SidebarProvider` reads one fixed 768px breakpoint through `useIsMobile`: below it the
 * rail mounts as a CLOSED `Sheet`, so none of the block's navigation is in the DOM at all. Report
 * "desktop" so the composition under test is the one the block is FOR; the mobile branch is the
 * sidebar component's own contract, and `dashboard-01.test.tsx` exercises it directly.
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

test("sidebar-02 renders its composition", async () => {
  const screen = await render(<Sidebar02Page />);
  await expect
    .element(screen.getByText("Documentation").first())
    .toBeInTheDocument();
});

test("sidebar-02 is axe-clean", async () => {
  const screen = await render(<Sidebar02Page />);
  await expect
    .element(screen.getByText("Documentation").first())
    .toBeInTheDocument();
  // Unstyled: the fast browser suite mounts without the compiled token theme, so axe's contrast
  // maths would read unresolved custom properties (see test/a11y.ts).
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
