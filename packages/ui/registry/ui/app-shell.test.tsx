import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { Home, Inbox } from "lucide-react";
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  AppShellSkeleton,
} from "./app-shell";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar";
import { Button } from "./button";

/* ---------------------------------------------------------------------------------------------
 * Same mobile-viewport harness as sidebar.test.tsx (Phase S): this suite's real Playwright
 * viewport is MOBILE-sized (414×896) with no explicit desktop default, so `useIsMobile`'s 768px
 * breakpoint would otherwise mount every `Sidebar` inside `AppShellSidebar` in mobile-Sheet mode
 * (closed by default) for every test here. `beforeEach` mocks `window.matchMedia` to report
 * "desktop" by default; `withMobileViewport` flips a single shared override for the tests that
 * specifically exercise mobile mode. Scoped to this file only.
 * ------------------------------------------------------------------------------------------- */
let mobileMediaQueryOverride: string | null = null;

beforeEach(() => {
  mobileMediaQueryOverride = null;
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches:
      mobileMediaQueryOverride !== null && query === mobileMediaQueryOverride,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function withMobileViewport(run: () => Promise<void>) {
  mobileMediaQueryOverride = "(max-width: 767px)";
  try {
    await run();
  } finally {
    mobileMediaQueryOverride = null;
  }
}

/**
 * The composed mini-shell used across most tests: `AppShellSidebar` + a consumer-owned
 * `flex h-svh flex-col` column wrapping `AppShellHeader` (with an `actions` button) and
 * `AppShellContent` — the same composition pattern documented on `AppShell` and shown in the mdx.
 */
function Demo({
  contentVariant,
}: { contentVariant?: "sidebar" | "floating" | "inset" } = {}) {
  return (
    <AppShell>
      <AppShellSidebar
        variant={contentVariant === "inset" ? "inset" : undefined}
      >
        <SidebarHeader>
          <span>VegaStack</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Inbox />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </AppShellSidebar>
      <div className="flex h-svh min-w-0 flex-1 flex-col">
        <AppShellHeader actions={<Button size="sm">New agent</Button>}>
          <span className="truncate">Dashboard</span>
        </AppShellHeader>
        <AppShellContent variant={contentVariant}>
          <p className="p-4 text-base text-muted-foreground">Content</p>
        </AppShellContent>
      </div>
    </AppShell>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Landmark trio + exactly one main.
 * ------------------------------------------------------------------------------------------- */

test("renders the landmark trio (banner, navigation, main) with exactly one main", async () => {
  const screen = await render(<Demo />);
  await expect.element(screen.getByRole("banner")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("navigation", { name: "Main navigation" }))
    .toBeInTheDocument();
  await expect.element(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.container.querySelectorAll("main").length).toBe(1);
});

/* ---------------------------------------------------------------------------------------------
 * Skip link.
 * ------------------------------------------------------------------------------------------- */

test("the skip link is the first focusable element in the shell", async () => {
  const screen = await render(<Demo />);
  const skipLink = screen.getByText("Skip to content").element();
  const sequentialFocusCandidates = screen.container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  // WebKit follows the host platform's Full Keyboard Access preference when synthesizing Tab,
  // so a Tab key is not a portable way to prove DOM sequential-focus order. The platform-neutral
  // contract is that this native link is tabbable and precedes every other focus candidate.
  expect(skipLink).toHaveAttribute("href", "#main-content");
  expect((skipLink as HTMLElement).tabIndex).toBe(0);
  expect(sequentialFocusCandidates[0]).toBe(skipLink);

  (skipLink as HTMLElement).focus();
  expect(document.activeElement).toBe(skipLink);
});

test("activating the skip link moves focus to #main-content", async () => {
  const screen = await render(<Demo />);
  await screen.getByText("Skip to content").click();
  expect(document.activeElement?.id).toBe("main-content");
});

/* ---------------------------------------------------------------------------------------------
 * Header slots.
 * ------------------------------------------------------------------------------------------- */

test("header renders the trigger, the actions slot, and a min-w-0 middle slot", async () => {
  const screen = await render(<Demo />);
  await expect
    .element(screen.getByRole("button", { name: "Toggle sidebar" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "New agent" }))
    .toBeInTheDocument();

  const header = screen.container.querySelector(
    '[data-slot="app-shell-header"]',
  )!;
  const middle = header.querySelector('[data-slot="app-shell-header-middle"]');
  expect(middle).not.toBeNull();
  expect(middle!.className).toContain("min-w-0");
  expect(middle).toHaveTextContent("Dashboard");

  const actionsSlot = header.querySelector(
    '[data-slot="app-shell-header-actions"]',
  );
  expect(actionsSlot).not.toBeNull();
  expect(actionsSlot).toHaveTextContent("New agent");
});

test("header omits the actions slot entirely when no actions are passed", async () => {
  const screen = await render(
    <AppShell>
      <AppShellSidebar />
      <div className="flex h-svh min-w-0 flex-1 flex-col">
        <AppShellHeader>
          <span>Title</span>
        </AppShellHeader>
        <AppShellContent>content</AppShellContent>
      </div>
    </AppShell>,
  );
  const header = screen.container.querySelector(
    '[data-slot="app-shell-header"]',
  )!;
  expect(
    header.querySelector('[data-slot="app-shell-header-actions"]'),
  ).toBeNull();
});

/* ---------------------------------------------------------------------------------------------
 * Content region.
 * ------------------------------------------------------------------------------------------- */

test("AppShellContent is the #main-content landmark and carries the named container-query class", async () => {
  const screen = await render(<Demo />);
  const main = screen.getByRole("main").element();
  expect(main.id).toBe("main-content");
  expect(main.getAttribute("tabindex")).toBe("-1");
  expect(main.className).toContain("@container/app-shell-content");
});

test('AppShellContent variant="inset" applies the panel-treatment classes', async () => {
  const screen = await render(<Demo contentVariant="inset" />);
  const main = screen.getByRole("main").element();
  expect(main.getAttribute("data-variant")).toBe("inset");
  expect(main.className).toContain("md:rounded-lg");
  expect(main.className).toContain("md:border");
});

test('AppShellContent defaults to variant="sidebar" (no inset panel classes)', async () => {
  const screen = await render(<Demo />);
  const main = screen.getByRole("main").element();
  expect(main.getAttribute("data-variant")).toBe("sidebar");
  expect(main.className).not.toContain("md:rounded-lg");
});

/* ---------------------------------------------------------------------------------------------
 * data-slot overrides (AppShell / AppShellSidebar reuse the underlying primitive's element but
 * re-stamp its data-slot for shell-level targeting).
 * ------------------------------------------------------------------------------------------- */

test('AppShell renders its row with data-slot="app-shell" (no extra wrapper div)', async () => {
  const screen = await render(<Demo />);
  expect(
    screen.container.querySelector('[data-slot="app-shell"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="sidebar-wrapper"]'),
  ).toBeNull();
});

test('AppShellSidebar stamps data-slot="app-shell-sidebar" and defaults aria-label', async () => {
  const screen = await render(<Demo />);
  const nav = screen
    .getByRole("navigation", { name: "Main navigation" })
    .element();
  expect(nav.dataset.slot).toBe("app-shell-sidebar");
});

test("AppShellSidebar aria-label can be overridden", async () => {
  const screen = await render(
    <AppShell>
      <AppShellSidebar aria-label="Custom nav" />
    </AppShell>,
  );
  await expect
    .element(screen.getByRole("navigation", { name: "Custom nav" }))
    .toBeInTheDocument();
});

/* ---------------------------------------------------------------------------------------------
 * AppShell forwards SidebarProvider props.
 * ------------------------------------------------------------------------------------------- */

test("AppShell forwards defaultOpen to SidebarProvider", async () => {
  const screen = await render(
    <AppShell defaultOpen={false}>
      <AppShellSidebar />
    </AppShell>,
  );
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  await expect.element(nav).toHaveAttribute("data-state", "collapsed");
});

test("the Cmd/Ctrl+B shortcut toggles the sidebar through AppShell", async () => {
  const screen = await render(<Demo />);
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  await expect.element(nav).toHaveAttribute("data-state", "expanded");
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
  );
  await expect.element(nav).toHaveAttribute("data-state", "collapsed");
});

test("AppShell forwards keyboardShortcut={false} to disable the shortcut", async () => {
  const screen = await render(
    <AppShell keyboardShortcut={false}>
      <AppShellSidebar />
    </AppShell>,
  );
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
  );
  await expect.element(nav).toHaveAttribute("data-state", "expanded");
});

/* ---------------------------------------------------------------------------------------------
 * AppShellSkeleton.
 * ------------------------------------------------------------------------------------------- */

test("AppShellSkeleton is decorative and renders navItemCount / statCardCount placeholders", async () => {
  const screen = await render(
    <AppShellSkeleton navItemCount={3} statCardCount={2} />,
  );
  const root = screen.container.querySelector(
    '[data-slot="app-shell-skeleton"]',
  )!;
  expect(root.getAttribute("aria-hidden")).toBe("true");
  expect(root.getAttribute("aria-busy")).toBe("true");
  expect(
    root.querySelectorAll('[data-slot="sidebar-menu-skeleton"]').length,
  ).toBe(3);
  expect(root.querySelectorAll('[data-shape="card"]').length).toBe(2);
});

test("AppShellSkeleton is deterministic across renders (same index -> same width class)", async () => {
  const a = await render(<AppShellSkeleton navItemCount={2} />);
  const b = await render(<AppShellSkeleton navItemCount={2} />);
  const lineA = a.container.querySelector(
    '[data-slot="sidebar-menu-skeleton"] [data-shape="line"]',
  );
  const lineB = b.container.querySelector(
    '[data-slot="sidebar-menu-skeleton"] [data-shape="line"]',
  );
  expect(lineA?.className).toBe(lineB?.className);
});

/* ---------------------------------------------------------------------------------------------
 * Axe — desktop and mobile-mocked.
 * ------------------------------------------------------------------------------------------- */

test("no a11y violations — desktop", async () => {
  const screen = await render(<Demo />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — mobile-mocked, sheet closed", async () => {
  await withMobileViewport(async () => {
    const screen = await render(<Demo />);
    await expectNoA11yViolations(screen.container);
  });
});

test("no a11y violations — mobile-mocked, sheet open", async () => {
  await withMobileViewport(async () => {
    const screen = await render(<Demo />);
    await screen.getByRole("button", { name: "Toggle sidebar" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    // The sheet portals to <body>, so audit the whole document (same pattern as sidebar.test.tsx).
    await expectNoA11yViolations(document.body);
  });
});

test("AppShellSkeleton hides its sidebar column below md, matching the real shell collapse", async () => {
  // Regression: the loaded shell collapses the rail into an off-screen Sheet below the mobile
  // breakpoint (SidebarProvider default 768px = Tailwind `md`), so the skeleton must not paint
  // a sidebar column the content it stands in for won't have.
  const screen = await render(<AppShellSkeleton />);
  const sidebarColumn = screen.container.querySelector(
    '[data-slot="app-shell-skeleton"] > div',
  ) as HTMLElement;
  expect(sidebarColumn).not.toBeNull();
  expect(sidebarColumn.classList.contains("hidden")).toBe(true);
  expect(sidebarColumn.classList.contains("md:flex")).toBe(true);
});
