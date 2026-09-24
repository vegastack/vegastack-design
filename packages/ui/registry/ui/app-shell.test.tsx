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
          <p className="p-4 text-sm text-muted-foreground">Content</p>
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
  expect(skipLink.getAttribute("href")).toBe(
    `#${screen.container.querySelector("main")!.id}`,
  );
  expect((skipLink as HTMLElement).tabIndex).toBe(0);
  expect(sequentialFocusCandidates[0]).toBe(skipLink);

  (skipLink as HTMLElement).focus();
  expect(document.activeElement).toBe(skipLink);
});

test("activating the skip link moves focus to this shell's own content region", async () => {
  const screen = await render(<Demo />);
  const main = screen.container.querySelector("main")!;
  await screen.getByText("Skip to content").click();
  expect(document.activeElement).toBe(main);
});

test("two shells on one page each skip to their OWN content region", async () => {
  // The id used to be the literal "main-content" on every AppShellContent and the literal
  // "#main-content" on every skip link, so a page with two shells published the id twice and
  // EVERY skip link resolved to the first one — measured on the docs app-shell page, which
  // renders four `landmark="region"` shells. Nothing caught it: axe dropped the non-ARIA
  // `duplicate-id` rule, and the geometry lane mounts one fixture at a time.
  const screen = await render(
    <>
      <AppShell>
        <AppShellContent landmark="region" aria-label="First">
          First
        </AppShellContent>
      </AppShell>
      <AppShell>
        <AppShellContent landmark="region" aria-label="Second">
          Second
        </AppShellContent>
      </AppShell>
    </>,
  );
  const [firstShell, secondShell] = Array.from(
    screen.container.querySelectorAll('[data-slot="app-shell"]'),
  );
  const regions = Array.from(
    screen.container.querySelectorAll('[data-slot="app-shell-content"]'),
  );
  const ids = regions.map((region) => region.id);
  expect(new Set(ids).size).toBe(2);
  expect(ids.every(Boolean)).toBe(true);

  for (const [index, shell] of [firstShell, secondShell].entries()) {
    const link = shell!.querySelector<HTMLAnchorElement>(
      '[data-slot="app-shell-skip-link"]',
    )!;
    expect(link.getAttribute("href")).toBe(`#${ids[index]}`);
    // Use a trusted browser interaction. Firefox does not move fragment focus for the raw
    // `HTMLElement.click()` shortcut, even though activating the same anchor as a user does.
    await userEvent.click(link);
    expect(document.activeElement).toBe(regions[index]);
  }
});

test("an explicit contentId wins over the generated one, on both halves", async () => {
  const screen = await render(
    <AppShell contentId="workspace-main">
      <AppShellContent>Content</AppShellContent>
    </AppShell>,
  );
  const link = screen.container.querySelector(
    '[data-slot="app-shell-skip-link"]',
  )!;
  expect(link.getAttribute("href")).toBe("#workspace-main");
  expect(screen.container.querySelector("main")!.id).toBe("workspace-main");
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

test("AppShellContent is the shell's skip-link landmark and carries the named container-query class", async () => {
  const screen = await render(<Demo />);
  const main = screen.getByRole("main").element();
  // The id is generated per shell, so it is asserted by its RELATIONSHIP to the skip link
  // rather than by a literal — a literal is exactly what made every shell publish the same one.
  const link = screen.container.querySelector(
    '[data-slot="app-shell-skip-link"]',
  )!;
  expect(main.id).toBeTruthy();
  expect(link.getAttribute("href")).toBe(`#${main.id}`);
  expect(main.getAttribute("tabindex")).toBe("-1");
  expect(main.className).toContain("@container/app-shell-content");
});

test('AppShellContent variant="inset" paints what upstream\'s SidebarInset paints', async () => {
  const screen = await render(<Demo contentVariant="inset" />);
  const main = screen.getByRole("main").element();
  expect(main.getAttribute("data-variant")).toBe("inset");
  // Read off `sidebar.tsx`'s own `peer-data-[variant=inset]` set, minus the sibling-only
  // collapsed nudge: m-2, ms-0, rounded-xl, shadow-sm — and NO border. Before Batch 7c this
  // painted `rounded-lg` + `border` + `shadow-lg`, the radius cap and the elevation doctrine
  // Batch 1 deleted, so an inset shell and an inset sidebar disagreed on their own corner.
  for (const cls of ["md:m-2", "md:ms-0", "md:rounded-xl", "md:shadow-sm"]) {
    expect(main.className).toContain(cls);
  }
  expect(main.className).not.toContain("md:border");
  expect(main.className).not.toContain("md:shadow-lg");
});

test('AppShellContent defaults to variant="sidebar" (no inset panel classes)', async () => {
  const screen = await render(<Demo />);
  const main = screen.getByRole("main").element();
  expect(main.getAttribute("data-variant")).toBe("sidebar");
  expect(main.className).not.toContain("md:rounded-xl");
  expect(main.className).not.toContain("md:shadow-sm");
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
  // The `<nav>` landmark is `AppShellSidebar`'s own (LAY-12); upstream's Sidebar keeps its state
  // on the `[data-slot="sidebar"]` element inside it.
  const rail = screen.container.querySelector(
    '[data-slot="sidebar"]',
  ) as HTMLElement;
  await expect.element(rail).toHaveAttribute("data-state", "collapsed");
});

test("the Cmd/Ctrl+B shortcut toggles the sidebar through AppShell", async () => {
  const screen = await render(<Demo />);
  const rail = screen.container.querySelector(
    '[data-slot="sidebar"]',
  ) as HTMLElement;
  await expect.element(rail).toHaveAttribute("data-state", "expanded");
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
  );
  await expect.element(rail).toHaveAttribute("data-state", "collapsed");
});

test("AppShell has no shortcut override: upstream's Cmd/Ctrl+B is the only one", async () => {
  // Was "AppShell forwards keyboardShortcut={false} to disable the shortcut". Batch 5 of the
  // shadcn reset put Sidebar back on upstream's file, whose `SidebarProvider` hard-codes the
  // shortcut and offers no prop to retune or disable it, so `AppShell` no longer takes one.
  // What is pinned here is the replacement contract: the ONLY chord that toggles the rail is
  // upstream's, and a different chord does nothing.
  const screen = await render(
    <AppShell>
      <AppShellSidebar />
    </AppShell>,
  );
  const rail = screen.container.querySelector(
    '[data-slot="sidebar"]',
  ) as HTMLElement;
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
  );
  await expect.element(rail).toHaveAttribute("data-state", "expanded");
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
  );
  await expect.element(rail).toHaveAttribute("data-state", "collapsed");
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
    root.querySelectorAll('[data-slot="app-shell-skeleton-nav-row"]').length,
  ).toBe(3);
  // Two stat-card placeholders, told apart from the sidebar rows by their container.
  expect(
    root.querySelectorAll(
      '[data-slot="app-shell-skeleton-stats"] [data-slot="skeleton"]',
    ).length,
  ).toBe(2);
});

test("AppShellSkeleton is deterministic: two server renders emit identical markup", async () => {
  // Upstream's SidebarMenuSkeleton picked a random width in useState, so the server HTML and the
  // client's hydration disagreed. Identical server output across renders is the hydration contract.
  const { renderToString } = await import("react-dom/server");
  const html = () => renderToString(<AppShellSkeleton navItemCount={6} />);
  const first = html();
  expect(html()).toBe(first);
  expect(first).not.toContain("--skeleton-width");
  const widths = [
    ...first.matchAll(
      /data-slot="app-shell-skeleton-nav-row"[^>]*><div[^>]*class="[^"]*\b(w-\d\/\d)\b/g,
    ),
  ].map((m) => m[1]);
  expect(widths).toEqual([
    "w-3/4",
    "w-1/2",
    "w-5/6",
    "w-2/3",
    "w-3/5",
    "w-3/4",
  ]);
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

test("AppShellSkeleton's rail is exactly the width the loaded rail will be", async () => {
  // Regression, found rebuilding this file in Batch 7c: the column was `w-60` (15rem) while
  // `sidebar.tsx`'s `SIDEBAR_WIDTH` is `16rem`, a literal left behind when Batch 1 deleted the
  // `--sidebar-width` token. The placeholder therefore jumped a whole rem sideways the instant
  // the real shell replaced it — the layout shift a skeleton exists to prevent.
  const screen = await render(<AppShellSkeleton />);
  const sidebarColumn = screen.container.querySelector(
    '[data-slot="app-shell-skeleton"] > div',
  ) as HTMLElement;
  // `w-64` is `--spacing(64)` = 16rem, which is `sidebar.tsx`'s `SIDEBAR_WIDTH` exactly.
  expect(sidebarColumn.classList.contains("w-64")).toBe(true);
  expect(sidebarColumn.classList.contains("w-60")).toBe(false);
});
